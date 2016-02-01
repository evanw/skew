#include <algorithm>
#include <assert.h>
#include <fstream>
#include <initializer_list>
#include <iostream>
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

string operator "" _s (const char *data, unsigned long count);

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
  double abs(double x);
  int abs(int x);

  double acos(double x);
  double asin(double x);
  double atan(double x);
  double atan2(double x, double y);

  double sin(double x);
  double cos(double x);
  double tan(double x);

  double floor(double x);
  double ceil(double x);
  double round(double x);

  double exp(double x);
  double log(double x);
  double pow(double x, double y);
  double random();
  double sqrt(double x);

  double max(double x, double y);
  int max(int x, int y);

  double min(double x, double y);
  int min(int x, int y);
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
bool doubleIsNaN(double x);
bool doubleIsFinite(double x);
string intToString(int x);

////////////////////////////////////////////////////////////////////////////////

template <typename T>
List<T>::List() {
}

template <typename T>
List<T>::List(const std::initializer_list<T> &x) : _data{x} {
}

template <typename T>
const T *List<T>::begin() const {
  return _data.data();
}

template <typename T>
const T *List<T>::end() const {
  return _data.data() + _data.size();
}

template <typename T>
T *List<T>::begin() {
  return _data.data();
}

template <typename T>
T *List<T>::end() {
  return _data.data() + _data.size();
}

template <typename T>
const T &List<T>::operator [] (int x) const {
  assert(0 <= x && x < count());
  return CharInsteadOfBool<T>::cast(_data[x]);
}

template <typename T>
T &List<T>::operator [] (int x) {
  assert(0 <= x && x < count());
  return CharInsteadOfBool<T>::cast(_data[x]);
}

template <typename T>
int List<T>::count() const {
  return (int)_data.size();
}

template <typename T>
bool List<T>::isEmpty() const {
  return _data.empty();
}

template <typename T>
void List<T>::append(const T &x) {
  _data.push_back(x);
}

template <typename T>
void List<T>::append(const List<T> *x) {
  assert(x != this);
  _data.insert(_data.end(), x->_data.begin(), x->_data.end());
}

template <typename T>
void List<T>::appendOne(const T &x) {
  auto it = std::find(_data.begin(), _data.end(), x);
  if (it == _data.end()) {
    _data.push_back(x);
  }
}

template <typename T>
void List<T>::prepend(const T &x) {
  _data.insert(_data.begin(), x);
}

template <typename T>
void List<T>::prepend(const List<T> *x) {
  assert(x != this);
  _data.insert(_data.begin(), x->_data.begin(), x->_data.end());
}

template <typename T>
void List<T>::insert(int x, const T &value) {
  assert(x >= 0 && x <= count());
  _data.insert(_data.begin() + x, value);
}

template <typename T>
void List<T>::insert(int x, const List<T> *values) {
  assert(x >= 0 && x <= count());
  assert(values != this);
  _data.insert(_data.begin() + x, values->_data.begin(), values->_data.end());
}

template <typename T>
void List<T>::removeAt(int x) {
  assert(x >= 0 && x < count());
  _data.erase(_data.begin() + x);
}

template <typename T>
void List<T>::removeFirst() {
  assert(!isEmpty());
  _data.erase(_data.begin());
}

template <typename T>
void List<T>::removeIf(Fn1<bool, T> *x) {
  _data.erase(std::remove_if(_data.begin(), _data.end(), [&](const T &y) {
    return x->run(y);
  }), _data.end());
}

template <typename T>
void List<T>::removeLast() {
  assert(!isEmpty());
  _data.pop_back();
}

template <typename T>
void List<T>::removeOne(const T &x) {
  auto it = std::find(_data.begin(), _data.end(), x);
  if (it != _data.end()) {
    _data.erase(it);
  }
}

template <typename T>
void List<T>::removeRange(int start, int end) {
  assert(0 <= start && start <= end && end <= count());
  _data.erase(_data.begin() + start, _data.begin() + end);
}

template <typename T>
T List<T>::takeFirst() {
  assert(!isEmpty());
  T result = std::move(_data.front());
  _data.erase(_data.begin());
  return result;
}

template <typename T>
T List<T>::takeLast() {
  assert(!isEmpty());
  T result = std::move(_data.back());
  _data.pop_back();
  return result;
}

template <typename T>
T List<T>::takeAt(int x) {
  assert(0 <= x && x < count());
  T result = std::move(_data[x]);
  _data.erase(_data.begin() + x);
  return result;
}

template <typename T>
List<T> *List<T>::takeRange(int start, int end) {
  assert(0 <= start && start <= end && end <= count());
  auto result = new List<T>;
  result->_data.reserve(end - start);
  for (int i = start; i < end; i++) {
    result->_data.emplace_back(std::move(_data[i]));
  }
  _data.erase(_data.begin() + start, _data.begin() + end);
  return result;
}

template <typename T>
const T &List<T>::first() const {
  assert(!isEmpty());
  return CharInsteadOfBool<T>::cast(_data.front());
}

template <typename T>
const T &List<T>::last() const {
  assert(!isEmpty());
  return CharInsteadOfBool<T>::cast(_data.back());
}

template <typename T>
T &List<T>::setFirst(const T &x) {
  assert(!isEmpty());
  return CharInsteadOfBool<T>::cast(_data.front()) = x;
}

template <typename T>
T &List<T>::setLast(const T &x) {
  assert(!isEmpty());
  return CharInsteadOfBool<T>::cast(_data.back()) = x;
}

template <typename T>
bool List<T>::contains(const T &x) const {
  return std::find(begin(), end(), x) != end();
}

template <typename T>
int List<T>::indexOf(const T &x) const {
  auto it = std::find(begin(), end(), x);
  return it == end() ? -1 : (int)(it - begin());
}

template <typename T>
int List<T>::lastIndexOf(const T &x) const {
  auto it = std::find(_data.rbegin(), _data.rend(), x);
  return it == _data.rend() ? -1 : count() - 1 - (int)(it - _data.rbegin());
}

template <typename T>
bool List<T>::all(Fn1<bool, T> *x) const {
  for (const auto &it : _data) {
    if (!x->run(it)) {
      return false;
    }
  }
  return true;
}

template <typename T>
bool List<T>::any(Fn1<bool, T> *x) const {
  for (const auto &it : _data) {
    if (x->run(it)) {
      return true;
    }
  }
  return false;
}

template <typename T>
List<T> *List<T>::clone() const {
  auto result = new List<T>;
  result->_data = _data;
  return result;
}

template <typename T>
void List<T>::each(FnVoid1<T> *x) const {
  for (const auto &it : _data) {
    x->run(it);
  }
}

template <typename T>
bool List<T>::equals(const List<T> *x) const {
  if (count() != x->count()) {
    return false;
  }
  for (int i = count() - 1; i >= 0; i--) {
    if ((*this)[i] != (*x)[i]) {
      return false;
    }
  }
  return true;
}

template <typename T>
List<T> *List<T>::filter(Fn1<bool, T> *x) const {
  auto result = new List<T>;
  for (const auto &it : _data) {
    if (x->run(it)) {
      result->append(it);
    }
  }
  return result;
}

template <typename T>
template <typename R>
List<R> *List<T>::map(Fn1<R, T> *x) const {
  auto result = new List<R>;
  for (const auto &it : _data) {
    result->append(x->run(it));
  }
  return result;
}

template <typename T>
void List<T>::reverse() {
  std::reverse(begin(), end());
}

template <typename T>
List<T> *List<T>::slice(int start) const {
  assert(0 <= start && start <= count());
  auto result = new List<T>;
  result->_data.insert(result->_data.begin(), _data.begin() + start, _data.end());
  return result;
}

template <typename T>
List<T> *List<T>::slice(int start, int end) const {
  assert(0 <= start && start <= end && end <= count());
  auto result = new List<T>;
  result->_data.insert(result->_data.begin(), _data.begin() + start, _data.begin() + end);
  return result;
}

template <typename T>
void List<T>::sort(Fn2<int, T, T> *x) {
  std::sort(_data.begin(), _data.end(), [&x](const T &a, const T &b) {
    return x->run(a, b) < 0;
  });
}

////////////////////////////////////////////////////////////////////////////////

template <typename T>
StringMap<T>::StringMap() {
}

template <typename T>
StringMap<T>::StringMap(const std::initializer_list<std::pair<string, T>> &x) {
  _data.reserve(x.size());
  for (const auto &it : x) {
    _data.insert(it);
  }
}

template <typename T>
const T &StringMap<T>::operator [] (const string &x) const {
  assert(contains(x));
  return _data[x];
}

template <typename T>
T &StringMap<T>::operator [] (const string &x) {
  return _data[x];
}

template <typename T>
int StringMap<T>::count() const {
  return (int)_data.size();
}

template <typename T>
bool StringMap<T>::isEmpty() const {
  return _data.empty();
}

template <typename T>
List<string> *StringMap<T>::keys() const {
  auto result = new List<string>;
  for (const auto &it : _data) {
    result->append(it.first);
  }
  return result;
}

template <typename T>
List<T> *StringMap<T>::values() const {
  auto result = new List<T>;
  for (const auto &it : _data) {
    result->append(it.second);
  }
  return result;
}

template <typename T>
StringMap<T> *StringMap<T>::clone() const {
  auto result = new StringMap<T>;
  result->_data = _data;
  return result;
}

template <typename T>
void StringMap<T>::each(FnVoid2<string, T> *x) const {
  for (const auto &it : _data) {
    x->run(it.first, it.second);
  }
}

template <typename T>
T StringMap<T>::get(const string &key, const T &defaultValue) const {
  auto it = _data.find(key);
  return it != _data.end() ? it->second : defaultValue;
}

template <typename T>
bool StringMap<T>::contains(const string &key) const {
  return _data.count(key);
}

template <typename T>
void StringMap<T>::remove(const string &key) {
  _data.erase(key);
}

////////////////////////////////////////////////////////////////////////////////

template <typename T>
IntMap<T>::IntMap() {
}

template <typename T>
IntMap<T>::IntMap(const std::initializer_list<std::pair<int, T>> &x) {
  _data.reserve(x.size());
  for (const auto &it : x) {
    _data.insert(it);
  }
}

template <typename T>
const T &IntMap<T>::operator [] (int x) const {
  assert(contains(x));
  return _data[x];
}

template <typename T>
T &IntMap<T>::operator [] (int x) {
  return _data[x];
}

template <typename T>
int IntMap<T>::count() const {
  return (int)_data.size();
}

template <typename T>
bool IntMap<T>::isEmpty() const {
  return _data.empty();
}

template <typename T>
List<int> *IntMap<T>::keys() const {
  auto result = new List<int>;
  for (const auto &it : _data) {
    result->append(it.first);
  }
  return result;
}

template <typename T>
List<T> *IntMap<T>::values() const {
  auto result = new List<T>;
  for (const auto &it : _data) {
    result->append(it.second);
  }
  return result;
}

template <typename T>
IntMap<T> *IntMap<T>::clone() const {
  auto result = new IntMap<T>;
  result->_data = _data;
  return result;
}

template <typename T>
void IntMap<T>::each(FnVoid2<int, T> *x) const {
  for (const auto &it : _data) {
    x->run(it.first, it.second);
  }
}

template <typename T>
T IntMap<T>::get(int key, const T &defaultValue) const {
  auto it = _data.find(key);
  return it != _data.end() ? it->second : defaultValue;
}

template <typename T>
bool IntMap<T>::contains(int key) const {
  return _data.count(key);
}

template <typename T>
void IntMap<T>::remove(int key) {
  _data.erase(key);
}
