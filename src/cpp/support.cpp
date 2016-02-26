#include <fstream>
#include <iostream>
#include <sstream>

#ifdef _WIN32
  #include <windows.h>
#else
  #include <dirent.h>
  #include <sys/ioctl.h>
  #include <sys/stat.h>
  #include <sys/time.h>
  #include <unistd.h>
#endif

////////////////////////////////////////////////////////////////////////////////

Skew::string IO::readFile(const Skew::string &path) {
  std::ifstream file(path.c_str());
  if (!file) return Skew::string();
  std::string contents((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
  return Skew::string(contents).replaceAll("\r\n", "\n");
}

bool IO::writeFile(const Skew::string &path, const Skew::string &contents) {
  std::ofstream file(path.c_str());
  if (!file) return false;
  file << contents.c_str();
  return true;
}

bool IO::isDirectory(const Skew::string &path) {
  #ifdef _WIN32
    auto attributes = GetFileAttributesA(path.c_str());
    return attributes != INVALID_FILE_ATTRIBUTES && (attributes & FILE_ATTRIBUTE_DIRECTORY) != 0;
  #else
    struct stat info;
    return stat(path.c_str(), &info) == 0 && info.st_mode & S_IFDIR;
  #endif
}

Skew::List<Skew::string> *IO::readDirectory(const Skew::string &path) {
  #ifdef _WIN32
    WIN32_FIND_DATA data;
    auto handle = FindFirstFileA(path.c_str(), &data);
    if (handle != INVALID_HANDLE_VALUE) {
      auto entries = new Skew::List<Skew::string>();
      do {
        entries->append(data.cFileName);
      } while (FindNextFile(handle, &data));
      FindClose(handle);
      return entries;
    }
  #else
    if (auto dir = opendir(path.c_str())) {
      auto entries = new Skew::List<Skew::string>();
      while (auto entry = readdir(dir)) {
        entries->append(entry->d_name);
      }
      return entries;
    }
  #endif
  return nullptr;
}

////////////////////////////////////////////////////////////////////////////////

struct __TerminalInfo {
  int width;
  int height;
  bool isValid;

  #ifdef _WIN32
    HANDLE handle = INVALID_HANDLE_VALUE;
    CONSOLE_SCREEN_BUFFER_INFO buffer;
  #else
    bool isTTY;
  #endif
};

static __TerminalInfo &__getTerminalInfo() {
  static __TerminalInfo info;

  if (!info.isValid) {
    #ifdef _WIN32
      info.handle = GetStdHandle(STD_OUTPUT_HANDLE);
      GetConsoleScreenBufferInfo(info.handle, &info.buffer);
      info.width = info.buffer.dwSize.X;
      info.height = info.buffer.dwSize.Y;
    #else
      winsize size;
      if (!ioctl(2, TIOCGWINSZ, &size)) {
        info.width = size.ws_col;
        info.height = size.ws_row;
      }
      info.isTTY = isatty(STDOUT_FILENO);
    #endif

    info.isValid = true;
  }

  return info;
}

void Terminal::_setColor(int escapeCode) {
  #ifdef _WIN32
    auto &info = __getTerminalInfo();
    int attributes = info.buffer.wAttributes;
    switch (escapeCode) {
      case 1:  attributes |= FOREGROUND_INTENSITY; break;
      case 90: attributes = FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE; break;
      case 91: attributes = FOREGROUND_RED | FOREGROUND_INTENSITY; break;
      case 92: attributes = FOREGROUND_GREEN | FOREGROUND_INTENSITY; break;
      case 93: attributes = FOREGROUND_BLUE | FOREGROUND_INTENSITY; break;
      case 94: attributes = FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_INTENSITY; break;
      case 95: attributes = FOREGROUND_RED | FOREGROUND_BLUE | FOREGROUND_INTENSITY; break;
      case 96: attributes = FOREGROUND_GREEN | FOREGROUND_BLUE | FOREGROUND_INTENSITY; break;
    }
    SetConsoleTextAttribute(info.handle, attributes);
  #else
    if (__getTerminalInfo().isTTY) {
      std::cout << "\x1B[0;" << escapeCode << 'm';
    }
  #endif
}

int Terminal::width() {
  return __getTerminalInfo().width;
}

int Terminal::height() {
  return __getTerminalInfo().height;
}

void Terminal::print(const Skew::string &text) {
  static Skew::string newline("\n");
  write(text);
  write(newline);
}

void Terminal::flush() {
  #ifndef _WIN32
    std::cout.flush();
  #endif
}

void Terminal::write(const Skew::string &text) {
  #ifdef _WIN32
    auto converted = text.replaceAll("\n", "\r\n");

    // Use WriteConsoleA() instead of std::cout for a huge performance boost
    WriteConsoleA(__getTerminalInfo().handle, converted.c_str(), converted.count(), nullptr, nullptr);
  #else
    std::cout << text.c_str();
  #endif
}

////////////////////////////////////////////////////////////////////////////////

double Timestamp::seconds() {
  #ifdef _WIN32
    static LARGE_INTEGER frequency;
    LARGE_INTEGER counter;
    if (!frequency.QuadPart) QueryPerformanceFrequency(&frequency);
    QueryPerformanceCounter(&counter);
    return counter.QuadPart / (double)frequency.QuadPart;
  #else
    timeval data;
    gettimeofday(&data, nullptr);
    return data.tv_sec + data.tv_usec / 1.0e6;
  #endif
}

////////////////////////////////////////////////////////////////////////////////

double parseDoubleLiteral(const Skew::string &x) {
  double y = NAN;
  std::stringstream(x.c_str()) >> y;
  return y;
}
