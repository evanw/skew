// node skewc.js src/*/*.sk --verbose --target=cpp
// clang++ -O3 main.cpp -std=c++11 -ferror-limit=0 -DNDEBUG

#include <string>
#include <vector>
#include <unordered_map>
#include <initializer_list>

using string = std::string;

template <typename T>
struct IComparison;

template <typename T>
struct ListCompare {
  ListCompare(IComparison<T> *comparison) : comparison(comparison) {}
  bool operator () (T left, T right) const { return comparison->compare(left, right) < 0; }
  IComparison<T> *comparison;
};

template <typename T>
struct List {
  List() {}
  List(std::initializer_list<T> list) : data(std::move(list)) {}
  int size() { return data.size(); }
  void push(T value) { data.push_back(value); }
  void unshift(T value) { data.insert(data.begin(), value); }
  List<T> *slice(int start, int end) { auto value = new List<T>(); if (start < end) value->data.insert(value->data.begin(), data.begin() + start, data.begin() + end); return value; }
  int indexOf(T value) { auto it = std::find(data.begin(), data.end(), value); return it != data.end() ? it - data.begin() : -1; }
  int lastIndexOf(T value) { auto it = std::find(data.rbegin(), data.rend(), value); return data.size() - 1 - (it - data.rbegin()); }
  T shift() { T value = data.front(); data.erase(data.begin()); return value; }
  T pop() { T value = data.back(); data.pop_back(); return value; }
  void reverse() { std::reverse(data.begin(), data.end()); }
  void sort(IComparison<T> *comparison) { std::sort(data.begin(), data.end(), ListCompare<T>(comparison)); }
  List<T> *clone() { return slice(0, size()); }
  T remove(int index) { T value = data[index]; data.erase(data.begin() + index); return value; }
  void insert(int index, T value) { data.insert(data.begin() + index, value); }
  T get(int index) { return data[index]; }
  void set(int index, T value) { data[index] = value; }
  void swap(int a, int b) { std::swap(data[a], data[b]); }

private:
  std::vector<T> data;
};

template <typename T>
struct StringMap {
  StringMap() {}
  T get(string key) { return data[key]; }
  T getOrDefault(string key, T defaultValue) { auto it = data.find(key); return it != data.end() ? it->second : defaultValue; }
  void set(string key, T value) { data[key] = value; }
  bool has(string key) { return data.count(key); }
  void remove(string key) { data.erase(key); }
  List<string> *keys() { auto keys = new List<string>(); for (auto &it : data) keys->push(it.first); return keys; }
  List<T> *values() { auto values = new List<T>(); for (auto &it : data) values->push(it.second); return values; }
  StringMap<T> *clone() { auto clone = new StringMap<T>(); clone->data = data; return clone; }

private:
  std::unordered_map<string, T> data;
};

template <typename T>
struct IntMap {
  IntMap() {}
  T get(int key) { return data[key]; }
  T getOrDefault(int key, T defaultValue) { auto it = data.find(key); return it != data.end() ? it->second : defaultValue; }
  void set(int key, T value) { data[key] = value; }
  bool has(int key) { return data.count(key); }
  void remove(int key) { data.erase(key); }
  List<int> *keys() { auto keys = new List<int>(); for (auto &it : data) keys->push(it.first); return keys; }
  List<T> *values() { auto values = new List<T>(); for (auto &it : data) values->push(it.second); return values; }
  IntMap<T> *clone() { auto clone = new IntMap<T>(); clone->data = data; return clone; }

private:
  std::unordered_map<int, T> data;
};

double now();
string encodeBase64(string text);
double parseDoubleLiteral(string text);
double parseIntLiteral(string text, int base);
string cpp_toString(int value);
string cpp_toString(double value);
string cpp_fromCodeUnit(int value);
string cpp_toLowerCase(string value);
string cpp_toUpperCase(string value);

struct Source;

namespace in_io {
  enum class Color;
}

namespace io {
  extern int terminalWidth;
  void setColor(in_io::Color color);
  void print(string text);
  bool writeFile(string path, string contents);
  Source *readFile(string path);
}

#include "output.cpp"

#include <cstdint>
#include <sstream>
#include <iostream>
#include <fstream>
#include <algorithm>
#ifdef _WIN32
  #include <windows.h>
#else
  #include <sys/ioctl.h>
  #include <unistd.h>
  #include <sys/time.h>
  #include <sys/mman.h>
#endif
#include <iomanip>

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

double parseIntLiteral(string text, int base) {
  int value = 0;
  std::stringstream ss(base == 10 ? text : text.substr(2));
  ss >> std::setbase(base) >> value;
  return value;
}

string cpp_toString(int value) {
  std::stringstream ss;
  ss << value;
  return ss.str();
}

string cpp_toString(double value) {
  std::stringstream ss;
  ss << value;
  return ss.str();
}

string cpp_fromCodeUnit(int value) {
  return string(1, value);
}

string cpp_toLowerCase(string value) {
  std::transform(value.begin(), value.end(), value.begin(), tolower);
  return value;
}

string cpp_toUpperCase(string value) {
  std::transform(value.begin(), value.end(), value.begin(), toupper);
  return value;
}

int io::terminalWidth = 0;

#if _WIN32
  auto handle = GetStdHandle(STD_OUTPUT_HANDLE);
  CONSOLE_SCREEN_BUFFER_INFO info;
#else
  bool isTTY = false;
#endif

void io::setColor(in_io::Color color) {
  #if _WIN32
    WORD value;
    switch (color) {
      case in_io::Color::DEFAULT: value = info.wAttributes; break;
      case in_io::Color::BOLD: value = info.wAttributes | FOREGROUND_INTENSITY; break;
      case in_io::Color::GRAY: value = FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE; break;
      case in_io::Color::RED: value = FOREGROUND_RED | FOREGROUND_INTENSITY; break;
      case in_io::Color::GREEN: value = FOREGROUND_GREEN | FOREGROUND_INTENSITY; break;
      case in_io::Color::BLUE: value = FOREGROUND_BLUE | FOREGROUND_INTENSITY; break;
      case in_io::Color::YELLOW: value = FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_INTENSITY; break;
      case in_io::Color::MAGENTA: value = FOREGROUND_RED | FOREGROUND_BLUE | FOREGROUND_INTENSITY; break;
      case in_io::Color::CYAN: value = FOREGROUND_GREEN | FOREGROUND_BLUE | FOREGROUND_INTENSITY; break;
    }
    SetConsoleTextAttribute(handle, value);
  #else
    if (isTTY) std::cout << "\e[" << (int)color << 'm';
  #endif
}

void io::print(string text) {
  std::cout << text;
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
  auto args = new List<string>();
  for (int i = 1; i < argc; i++) {
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

  size = (size + ALIGN - 1) / ALIGN * ALIGN;
  if (available < size) {
    size_t chunk = (size + CHUNK_SIZE - 1) / CHUNK_SIZE * CHUNK_SIZE;
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

  void *data = next;
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
