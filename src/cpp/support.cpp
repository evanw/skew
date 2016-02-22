#include <dirent.h>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/stat.h>
#include <sys/time.h>
#include <unistd.h>

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
  struct stat info;
  return stat(path.c_str(), &info) == 0 && info.st_mode & S_IFDIR;
}

Skew::List<Skew::string> *IO::readDirectory(const Skew::string &path) {
  if (auto dir = opendir(path.c_str())) {
    auto entries = new Skew::List<Skew::string>();
    while (auto entry = readdir(dir)) {
      entries->append(entry->d_name);
    }
    return entries;
  }
  return nullptr;
}

////////////////////////////////////////////////////////////////////////////////

struct __TerminalInfo {
  int width;
  int height;
  bool isTTY;
  bool isValid;
};

static __TerminalInfo &__getTerminalInfo() {
  static __TerminalInfo info;

  if (!info.isValid) {
    winsize size;

    if (!ioctl(2, TIOCGWINSZ, &size)) {
      info.width = size.ws_col;
      info.height = size.ws_row;
    }

    info.isTTY = isatty(STDOUT_FILENO);
    info.isValid = true;
  }

  return info;
}

void Terminal::_setColor(int escapeCode) {
  if (__getTerminalInfo().isTTY) {
    std::cout << "\x1B[0;" << escapeCode << 'm';
  }
}

int Terminal::width() {
  return __getTerminalInfo().width;
}

int Terminal::height() {
  return __getTerminalInfo().height;
}

void Terminal::print(const Skew::string &text) {
  std::cout << text.c_str() << std::endl;
}

void Terminal::flush() {
  std::cout.flush();
}

void Terminal::write(const Skew::string &text) {
  std::cout << text.c_str();
}

////////////////////////////////////////////////////////////////////////////////

double Timestamp::seconds() {
  timeval data;
  gettimeofday(&data, nullptr);
  return data.tv_sec + data.tv_usec / 1.0e6;
}

////////////////////////////////////////////////////////////////////////////////

double parseDoubleLiteral(const Skew::string &x) {
  double y = NAN;
  std::stringstream(x.c_str()) >> y;
  return y;
}

// Try shorter strings first. Good test cases: 0.1, 9.8, 0.00000000001, 1.1 - 1.0
Skew::string doubleToString(double value) {
  char buffer[64];
  std::snprintf(&buffer[0], sizeof(buffer), "%.15g", value);
  if (std::stod(&buffer[0]) != value) {
    std::snprintf(&buffer[0], sizeof(buffer), "%.16g", value);
    if (std::stod(&buffer[0]) != value) {
      std::snprintf(&buffer[0], sizeof(buffer), "%.17g", value);
    }
  }
  if (!strcmp(buffer, "-0")) {
    return "0";
  }
  return buffer;
}

bool doubleIsNaN(double x) {
  return std::isnan(x);
}

bool doubleIsFinite(double x) {
  return std::isfinite(x);
}

Skew::string intToString(int x) {
  return std::to_string(x);
}
