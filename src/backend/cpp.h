#include <initializer_list>
#include <utility>
#include <assert.h>

template <typename T>
struct List;

struct string {
  string();

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
  string join(List<string> *x) const;
  string repeat(int x) const;
  string replaceAll(const string &before, const string &after) const;

  string toLowerCase() const;
  string toUpperCase() const;
};

struct StringBuilder {
  StringBuilder();
  void append(const string &x);
  string toString() const;
};

string operator ""_s (const char *data, unsigned long count);

template <typename T>
struct List {
  List();
  List(const std::initializer_list<T> &x);

  const T *begin() const;
  const T *end() const;

  T *begin();
  T *end();

  T operator [] (int x) const;
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
};

template <typename T>
struct StringMap {
  StringMap();
  StringMap(const std::initializer_list<std::pair<string, T>> &x);

  T operator [] (const string &x) const;
  T &operator [] (const string &x);

  int count() const;
  bool isEmpty() const;
  List<string> *keys() const;
  List<T> *values() const;

  StringMap<T> *clone() const;
  // def each(x fn(int, T))
  T get(const string &key, const T &defaultValue);
  bool contains(const string &key);
  void remove(const string &key);
};

template <typename T>
struct IntMap {
  IntMap();
  IntMap(const std::initializer_list<std::pair<int, T>> &x);

  T operator [] (int x) const;
  T &operator [] (int x);

  int count() const;
  bool isEmpty() const;
  List<int> *keys() const;
  List<T> *values() const;

  IntMap<T> *clone() const;
  // def each(x fn(int, T))
  T get(int key, const T &defaultValue);
  bool contains(int key);
  void remove(int key);
};
