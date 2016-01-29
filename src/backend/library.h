#include <assert.h>
#include <fstream>
#include <initializer_list>
#include <iostream>
#include <math.h>
#include <sstream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

struct FnVoid0 {
  virtual void run() = 0;
};

template <typename R>
struct Fn0 {
  virtual R run() = 0;
};

template <typename A1>
struct FnVoid1 {
  virtual void run(A1 a1) = 0;
};

template <typename R, typename A1>
struct Fn1 {
  virtual R run(A1 a1) = 0;
};

template <typename A1, typename A2>
struct FnVoid2 {
  virtual void run(A1 a1, A2 a2) = 0;
};

template <typename R, typename A1, typename A2>
struct Fn2 {
  virtual R run(A1 a1, A2 a2) = 0;
};

template <typename A1, typename A2, typename A3>
struct FnVoid3 {
  virtual void run(A1 a1, A2 a2, A3 a3) = 0;
};

template <typename R, typename A1, typename A2, typename A3>
struct Fn3 {
  virtual R run(A1 a1, A2 a2, A3 a3) = 0;
};

template <typename A1, typename A2, typename A3, typename A4>
struct FnVoid4 {
  virtual void run(A1 a1, A2 a2, A3 a3, A4 a4) = 0;
};

template <typename R, typename A1, typename A2, typename A3, typename A4>
struct Fn4 {
  virtual R run(A1 a1, A2 a2, A3 a3, A4 a4) = 0;
};

template <typename A1, typename A2, typename A3, typename A4, typename A5>
struct FnVoid5 {
  virtual void run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5) = 0;
};

template <typename R, typename A1, typename A2, typename A3, typename A4, typename A5>
struct Fn5 {
  virtual R run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5) = 0;
};

template <typename A1, typename A2, typename A3, typename A4, typename A5, typename A6>
struct FnVoid6 {
  virtual void run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5, A6 a6) = 0;
};

template <typename R, typename A1, typename A2, typename A3, typename A4, typename A5, typename A6>
struct Fn6 {
  virtual R run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5, A6 a6) = 0;
};

template <typename A1, typename A2, typename A3, typename A4, typename A5, typename A6, typename A7>
struct FnVoid7 {
  virtual void run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5, A6 a6, A7 a7) = 0;
};

template <typename R, typename A1, typename A2, typename A3, typename A4, typename A5, typename A6, typename A7>
struct Fn7 {
  virtual R run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5, A6 a6, A7 a7) = 0;
};

template <typename A1, typename A2, typename A3, typename A4, typename A5, typename A6, typename A7, typename A8>
struct FnVoid8 {
  virtual void run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5, A6 a6, A7 a7, A8 a8) = 0;
};

template <typename R, typename A1, typename A2, typename A3, typename A4, typename A5, typename A6, typename A7, typename A8>
struct Fn8 {
  virtual R run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5, A6 a6, A7 a7, A8 a8) = 0;
};

template <typename A1, typename A2, typename A3, typename A4, typename A5, typename A6, typename A7, typename A8, typename A9>
struct FnVoid9 {
  virtual void run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5, A6 a6, A7 a7, A8 a8, A9 a9) = 0;
};

template <typename R, typename A1, typename A2, typename A3, typename A4, typename A5, typename A6, typename A7, typename A8, typename A9>
struct Fn9 {
  virtual R run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5, A6 a6, A7 a7, A8 a8, A9 a9) = 0;
};

template <typename A1, typename A2, typename A3, typename A4, typename A5, typename A6, typename A7, typename A8, typename A9, typename A10>
struct FnVoid10 {
  virtual void run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5, A6 a6, A7 a7, A8 a8, A9 a9, A10 a10) = 0;
};

template <typename R, typename A1, typename A2, typename A3, typename A4, typename A5, typename A6, typename A7, typename A8, typename A9, typename A10>
struct Fn10 {
  virtual R run(A1 a1, A2 a2, A3 a3, A4 a4, A5 a5, A6 a6, A7 a7, A8 a8, A9 a9, A10 a10) = 0;
};

template <typename T>
struct List;

struct string {
  string();
  string(const char *x);
  string(const char *x, int count);
  string(const std::string &x);

  bool operator == (const string &x) const;
  bool operator != (const string &x) const;
  const char *c_str() const;
  const std::string &std_str() const;

  string operator + (const string &x) const;
  string &operator += (const string &x);
  int compare(const string &x) const;

  int count() const;
  bool contains(const string &x) const;
  int indexOf(const string &x) const;
  int lastIndexOf(const string &x) const;
  bool startsWith(const string &x) const;
  bool endsWith(const string &x) const;

  int operator [] (int x) const;
  string get(int x) const;
  string slice(int start) const;
  string slice(int start, int end) const;
  List<int> *codeUnits() const;

  List<string> *split(const string &x) const;
  string join(const List<string> *x) const;
  string repeat(int x) const;
  string replaceAll(const string &before, const string &after) const;

  string toLowerCase() const;
  string toUpperCase() const;

  static string fromCodeUnit(int x);
  static string fromCodeUnits(const List<int> *x);

private:
  friend struct std::hash<string>;

  std::string _data;
  bool _isNull;
};

string operator ""_s (const char *data, unsigned long count);

namespace std {
  template <>
  struct hash<::string> {
    size_t operator () (const ::string &x) const {
      return hash<string>()(x._data);
    }
  };
}

struct StringBuilder {
  StringBuilder();
  void append(const string &x);
  string toString() const;

private:
  std::string _data;
};

template <typename T>
struct CharInsteadOfBool {
  using Type = T;
  static T &cast(T &x) { return x; }
  static const T &cast(const T &x) { return x; }
};

template <>
struct CharInsteadOfBool<bool> {
  static_assert(sizeof(bool) == sizeof(char), "");
  using Type = char;
  static bool &cast(char &x) { return reinterpret_cast<bool &>(x); }
  static const bool &cast(const char &x) { return reinterpret_cast<const bool &>(x); }
};

template <typename T>
struct List {
  List();
  List(const std::initializer_list<T> &x);

  const T *begin() const;
  const T *end() const;

  T *begin();
  T *end();

  const T &operator [] (int x) const;
  T &operator [] (int x);

  int count() const;
  bool isEmpty() const;

  void append(const T &x);
  void append(const List<T> *x);
  void appendOne(const T &x);

  void prepend(const T &x);
  void prepend(const List<T> *x);

  void insert(int x, const T &value);
  void insert(int x, const List<T> *values);

  void removeAt(int x);
  void removeFirst();
  void removeIf(Fn1<bool, T> *x);
  void removeLast();
  void removeOne(const T &x);
  void removeRange(int start, int end);

  T takeFirst();
  T takeLast();
  T takeAt(int x);
  List<T> *takeRange(int start, int end);

  const T &first() const;
  const T &last() const;
  T &setFirst(const T &x);
  T &setLast(const T &x);

  bool contains(const T &x) const;
  int indexOf(const T &x) const;
  int lastIndexOf(const T &x) const;

  bool all(Fn1<bool, T> *x) const;
  bool any(Fn1<bool, T> *x) const;
  List<T> *clone() const;
  void each(FnVoid1<T> *x) const;
  bool equals(const List<T> *x) const;
  List<T> *filter(Fn1<bool, T> *x) const;
  template <typename R>
  List<R> *map(Fn1<R, T> *x) const;
  void reverse();
  List<T> *slice(int start) const;
  List<T> *slice(int start, int end) const;
  void sort(Fn2<int, T, T> *x);

private:
  std::vector<typename CharInsteadOfBool<T>::Type> _data;
};

template <typename T>
struct StringMap {
  StringMap();
  StringMap(const std::initializer_list<std::pair<string, T>> &x);

  const T &operator [] (const string &x) const;
  T &operator [] (const string &x);

  int count() const;
  bool isEmpty() const;
  List<string> *keys() const;
  List<T> *values() const;

  StringMap<T> *clone() const;
  void each(FnVoid2<string, T> *x) const;
  T get(const string &key, const T &defaultValue) const;
  bool contains(const string &key) const;
  void remove(const string &key);

private:
  std::unordered_map<string, T> _data;
};

template <typename T>
struct IntMap {
  IntMap();
  IntMap(const std::initializer_list<std::pair<int, T>> &x);

  const T &operator [] (int x) const;
  T &operator [] (int x);

  int count() const;
  bool isEmpty() const;
  List<int> *keys() const;
  List<T> *values() const;

  IntMap<T> *clone() const;
  void each(FnVoid2<int, T> *x) const;
  T get(int key, const T &defaultValue) const;
  bool contains(int key) const;
  void remove(int key);

private:
  std::unordered_map<int, T> _data;
};

namespace Math {
  double abs(double x) { return ::fabs(x); }
  int abs(int x) { return ::abs(x); }

  double acos(double x) { return ::acos(x); }
  double asin(double x) { return ::asin(x); }
  double atan(double x) { return ::atan(x); }
  double atan2(double x, double y) { return ::atan2(x, y); }

  double sin(double x) { return ::sin(x); }
  double cos(double x) { return ::cos(x); }
  double tan(double x) { return ::tan(x); }

  double floor(double x) { return ::floor(x); }
  double ceil(double x) { return ::ceil(x); }
  double round(double x) { return ::round(x); }

  double exp(double x) { return ::exp(x); }
  double log(double x) { return ::log(x); }
  double pow(double x, double y) { return ::pow(x, y); }
  double random();
  double sqrt(double x) { return ::sqrt(x); }

  double max(double x, double y) { return x > y ? x : y; }
  int max(int x, int y) { return x > y ? x : y; }

  double min(double x, double y) { return x < y ? x : y; }
  int min(int x, int y) { return x < y ? x : y; }
}

namespace IO {
  string readFile(const string &path);
  bool writeFile(const string &path, const string &contents);
  bool isDirectory(const string &path);
  List<string> *readDirectory(const string &path);
}

namespace Terminal {
  void _setColor(int escapeCode);
  int width();
  int height();
  void print(const string &text);
  void flush();
  void write(const string &text);
}

namespace Timestamp {
  double seconds();
}

double parseDoubleLiteral(const string &x);
string doubleToString(double x);
string intToString(int x);
