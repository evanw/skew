#include <string>

using string = std::string;

double now();
string encodeBase64(string text);
double parseDoubleLiteral(string text);
int parseIntLiteral(string text, int base);

struct Source;

namespace io {
  extern int terminalWidth;
  void setColor(int color);
  void print(string text);
  bool writeFile(string path, string contents);
  Source *readFile(string path);
}

#include "skewc.cpp"

#include <cstdint>
#include <fstream>
#include <iomanip>
#include <iostream>

#ifdef _WIN32
  #include <windows.h>
#else
  #include <sys/ioctl.h>
  #include <unistd.h>
  #include <sys/time.h>
  #include <sys/mman.h>
#endif

double now() {
  #ifdef _WIN32
    static LARGE_INTEGER frequency;
    LARGE_INTEGER counter;
    if (!frequency.QuadPart) {
      QueryPerformanceFrequency(&frequency);
    }
    QueryPerformanceCounter(&counter);
    return counter.QuadPart * 1000.0 / frequency.QuadPart;
  #else
    timeval data;
    gettimeofday(&data, NULL);
    return data.tv_sec * 1000.0 + data.tv_usec / 1000.0;
  #endif
}

string encodeBase64(string text) {
  static const char *BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  string result;
  int n = text.size();
  int i;
  for (i = 0; i + 2 < n; i = i + 3) {
    int c = text[i] << 16 | text[i + 1] << 8 | text[i + 2];
    result += BASE64[c >> 18];
    result += BASE64[c >> 12 & 0x3F];
    result += BASE64[c >> 6 & 0x3F];
    result += BASE64[c & 0x3F];
  }
  if (i < n) {
    int a = text[i];
    result += BASE64[a >> 2];
    if (i + 1 < n) {
      int b = text[i + 1];
      result += BASE64[(a << 4 & 0x30) | b >> 4];
      result += BASE64[b << 2 & 0x3C];
      result += "=";
    } else {
      result += BASE64[a << 4 & 0x30];
      result += "==";
    }
  }
  return result;
}

double parseDoubleLiteral(string text) {
  double value = 0;
  std::stringstream ss(text);
  ss >> value;
  return value;
}

int parseIntLiteral(string text, int base) {
  int value = 0;
  std::stringstream ss(base == 10 ? text : text.substr(2));
  ss >> std::setbase(base) >> value;
  return value;
}

int io::terminalWidth = 0;

#if _WIN32
  auto handle = GetStdHandle(STD_OUTPUT_HANDLE);
  CONSOLE_SCREEN_BUFFER_INFO info;
#else
  auto isTTY = false;
#endif

void io::setColor(int color) {
  #if _WIN32
    WORD value;
    switch (color) {
      default: value = info.wAttributes; break;
      case 1: value = info.wAttributes | FOREGROUND_INTENSITY; break;
      case 90: value = FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE; break;
      case 91: value = FOREGROUND_RED | FOREGROUND_INTENSITY; break;
      case 92: value = FOREGROUND_GREEN | FOREGROUND_INTENSITY; break;
      case 93: value = FOREGROUND_BLUE | FOREGROUND_INTENSITY; break;
      case 94: value = FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_INTENSITY; break;
      case 95: value = FOREGROUND_RED | FOREGROUND_BLUE | FOREGROUND_INTENSITY; break;
      case 96: value = FOREGROUND_GREEN | FOREGROUND_BLUE | FOREGROUND_INTENSITY; break;
    }
    SetConsoleTextAttribute(handle, value);
  #else
    if (isTTY) std::cout << "\e[" << (int)color << 'm';
  #endif
}

void io::print(string text) {
  #if _WIN32
    WriteConsoleA(handle, text.c_str(), text.size(), nullptr, nullptr);
  #else
    std::cout << text;
  #endif
}

bool io::writeFile(string path, string contents) {
  std::ofstream file(path.c_str());
  if (!file) return false;
  file << contents;
  return true;
}

Source *io::readFile(string path) {
  std::ifstream file(path.c_str());
  if (!file) return nullptr;
  return new Source(path, std::string((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>()));
}

int main(int argc, char *argv[]) {
  auto args = new List<string> {};
  for (auto i = 1; i < argc; i++) {
    args->push(argv[i]);
  }

  #if _WIN32
    GetConsoleScreenBufferInfo(handle, &info);
    io::terminalWidth = info.dwSize.X - 1;
  #else
    winsize size;
    if (!ioctl(2, TIOCGWINSZ, &size)) {
      io::terminalWidth = size.ws_col;
    }
    isTTY = isatty(STDOUT_FILENO);
  #endif

  return frontend::main(args);
}

// Replace the standard malloc() implementation with a bump allocator for
// speed. Never freeing anything is totally fine for a short-lived process.
// This gives a significant speedup.
void *allocate(size_t size) {
  enum { CHUNK_SIZE = 1 << 20, ALIGN = 8 };

  static void *next;
  static size_t available;

  size = (size + ALIGN - 1) & ~(ALIGN - 1);
  if (available < size) {
    auto chunk = (size + CHUNK_SIZE - 1) & ~(CHUNK_SIZE - 1);
    assert(size <= chunk);
    #if _WIN32
      next = VirtualAlloc(nullptr, chunk, MEM_COMMIT, PAGE_READWRITE);
      assert(next != nullptr);
    #else
      next = mmap(nullptr, chunk, PROT_READ | PROT_WRITE, MAP_ANON | MAP_PRIVATE, -1, 0);
      assert(next != MAP_FAILED);
    #endif
    available = chunk;
  }

  auto data = next;
  next = (uint8_t *)next + size;
  available -= size;
  return data;
}

// Overriding malloc() and free() is really hard on Windows for some reason
#if !_WIN32
  extern "C" {
    void *malloc(size_t size) { return allocate(size); }
    void free(void *data) {}
  }
#endif

void *operator new (size_t size){ return allocate(size); }
void *operator new [](size_t size) { return allocate(size); }
void operator delete (void *data) throw() {}
void operator delete [] (void *data) throw() {}
