#include <assert.h>
#include <fstream>
#include <functional>
#include <initializer_list>
#include <iostream>
#include <sstream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

template <typename T>
struct List;

struct string {
  string();
  string(const char *x);
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
  List<int> *codePoints() const;
  List<int> *codeUnits() const;

  List<string> *split(const string &x) const;
  string join(const List<string> *x) const;
  string repeat(int x) const;
  string replaceAll(const string &before, const string &after) const;

  string toLowerCase() const;
  string toUpperCase() const;

  static string fromCodeUnit(int x);
  static string fromCodeUnits(const List<int> *x);
  static string fromCodePoint(int x);
  static string fromCodePoint(const List<int> *x);

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
  void resize(int count, const T &defaultValue);

  void append(const T &x);
  void append(const List<T> *x);
  void appendOne(const T &x);

  void prepend(const T &x);
  void prepend(const List<T> *x);

  void insert(int x, const T &value);
  void insert(int x, const List<T> *values);

  void removeAll(const T &x);
  void removeAt(int x);
  void removeDuplicates();
  void removeFirst();
  void removeIf(const std::function<bool (T)> &x);
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

  bool all(const std::function<bool (T)> &x) const;
  bool any(const std::function<bool (T)> &x) const;
  List<T> *clone() const;
  void each(const std::function<void (T)> &x) const;
  bool equals(const List<T> *x) const;
  List<T> *filter(const std::function<bool (T)> &x) const;
  template <typename R>
  List<R> *map(const std::function<R (T)> &x) const;
  void reverse();
  void shuffle();
  List<T> *slice(int start) const;
  List<T> *slice(int start, int end) const;
  void sort(const std::function<int (T, T)> &x);
  void swap(int x, int y);

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
  void each(const std::function<void (int, T)> &x) const;
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
  void each(const std::function<void (int, T)> &x) const;
  T get(int key, const T &defaultValue) const;
  bool contains(int key) const;
  void remove(int key);

private:
  std::unordered_map<int, T> _data;
};

namespace Math {
  double pow(double x, double y);
  double round(double x);
  int min(int x, int y);
  int max(int x, int y);
}

namespace IO {
  string readFile(const string &path);
  bool writeFile(const string &path, const string &contents);
}

namespace Terminal {
  enum struct Color;

  void setColor(Color color);
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
