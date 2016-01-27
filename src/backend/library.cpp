#include <codecvt>
#include <dirent.h>
#include <stdio.h>
#include <sys/ioctl.h>
#include <sys/stat.h>
#include <sys/time.h>
#include <unistd.h>

string::string() : _isNull(true) {
}

string::string(const char *x) : _data(x ? x : ""), _isNull(!x) {
}

string::string(const std::string &x) : _data(x), _isNull(false) {
}

bool string::operator == (const string &x) const {
  return _isNull == x._isNull && _data == x._data;
}

bool string::operator != (const string &x) const {
  return _isNull != x._isNull || _data != x._data;
}

const char *string::c_str() const {
  return _isNull ? nullptr : _data.c_str();
}

const std::string &string::std_str() const {
  return _data;
}

string string::operator + (const string &x) const {
  return _data + x._data;
}

string &string::operator += (const string &x) {
  _data += x._data;
  return *this;
}

int string::compare(const string &x) const {
  return (_data < x._data) - (_data > x._data);
}

int string::count() const {
  return (int)_data.size();
}

bool string::contains(const string &x) const {
  return _data.find(x._data) != std::string::npos;
}

int string::indexOf(const string &x) const {
  auto it = _data.find(x._data);
  return it != std::string::npos ? (int)it : -1;
}

int string::lastIndexOf(const string &x) const {
  auto it = _data.rfind(x._data);
  return it != std::string::npos ? (int)it : -1;
}

bool string::startsWith(const string &x) const {
  return _data.size() >= x._data.size() && !memcmp(_data.data(), x._data.data(), x._data.size());
}

bool string::endsWith(const string &x) const {
  return _data.size() >= x._data.size() && !memcmp(_data.data() + _data.size() - x._data.size(), x._data.data(), x._data.size());
}

int string::operator [] (int x) const {
  return (int)(unsigned char)_data[x]; // Code units should not be negative
}

string string::get(int x) const {
  return std::string(1, _data[x]);
}

string string::slice(int start) const {
  return _data.substr(start);
}

string string::slice(int start, int end) const {
  return _data.substr(start, end - start);
}

List<int> *string::codeUnits() const {
  auto result = new List<int>;
  for (unsigned char x : _data) {
    result->append(x);
  }
  return result;
}

List<string> *string::split(const string &x) const {
  auto result = new List<string>;
  size_t start = 0;
  while (true) {
    auto it = _data.find(x._data, start);
    if (it == std::string::npos) {
      break;
    }
    result->append(_data.substr(start, it - start));
    start = it + x._data.size();
  }
  result->append(_data.substr(start));
  return result;
}

string string::join(const List<string> *x) const {
  std::string result;
  for (auto b = x->begin(), e = x->end(), it = b; it != e; it++) {
    if (it != b) {
      result += _data;
    }
    result += it->_data;
  }
  return result;
}

string string::repeat(int x) const {
  std::string result;
  result.reserve(_data.size() * x);
  while (x-- > 0) {
    result += _data;
  }
  return result;
}

string string::replaceAll(const string &before, const string &after) const {
  string result;
  size_t start = 0;
  while (true) {
    auto it = _data.find(before._data, start);
    if (it == std::string::npos) {
      break;
    }
    result._data += _data.substr(start, it - start);
    result._data += after._data;
    start = it + before._data.size();
  }
  result._data += _data.substr(start);
  return result;
}

string string::toLowerCase() const {
  auto result = _data;
  std::transform(_data.begin(), _data.end(), result.begin(), ::tolower);
  return result;
}

string string::toUpperCase() const {
  auto result = _data;
  std::transform(_data.begin(), _data.end(), result.begin(), ::toupper);
  return result;
}

string string::fromCodeUnit(int x) {
  return std::string(1, x);
}

string string::fromCodeUnits(const List<int> *x) {
  std::string result;
  result.reserve(x->count());
  for (char y : *x) {
    result += y;
  }
  return result;
}

string operator ""_s (const char *data, unsigned long count) {
  return std::string(data, data + count);
}

////////////////////////////////////////////////////////////////////////////////

StringBuilder::StringBuilder() {
}

void StringBuilder::append(const string &x) {
  _data += x.std_str();
}

string StringBuilder::toString() const {
  return _data;
}

////////////////////////////////////////////////////////////////////////////////

template <typename T>
List<T>::List() {
}

template <typename T>
List<T>::List(const std::initializer_list<T> &x) : _data{x} {
}

template <typename T>
const T *List<T>::List<T>::begin() const {
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
  auto result = new List<T>;
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
  auto result = new List<T>;
  result->_data.insert(result->_data.begin(), _data.begin() + start, _data.end());
  return result;
}

template <typename T>
List<T> *List<T>::slice(int start, int end) const {
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
  return _data.size();
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
  return _data.size();
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

////////////////////////////////////////////////////////////////////////////////

string IO::readFile(const string &path) {
  std::ifstream file(path.c_str());
  if (!file) return string();
  std::string contents((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
  return string(contents).replaceAll("\r\n", "\n");
}

bool IO::writeFile(const string &path, const string &contents) {
  std::ofstream file(path.c_str());
  if (!file) return false;
  file << contents.c_str();
  return true;
}

bool IO::isDirectory(const string &path) {
  struct stat info;
  return stat(path.c_str(), &info) == 0 && info.st_mode & S_IFDIR;
}

List<string> *IO::readDirectory(const string &path) {
  if (auto dir = opendir(path.c_str())) {
    auto entries = new List<string>();
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

void Terminal::print(const string &text) {
  std::cout << text.c_str() << std::endl;
}

void Terminal::flush() {
  std::cout.flush();
}

void Terminal::write(const string &text) {
  std::cout << text.c_str();
}

////////////////////////////////////////////////////////////////////////////////

double Timestamp::seconds() {
  timeval data;
  gettimeofday(&data, nullptr);
  return data.tv_sec + data.tv_usec / 1.0e6;
}

////////////////////////////////////////////////////////////////////////////////

double parseDoubleLiteral(const string &x) {
  double y = NAN;
  std::stringstream(x.c_str()) >> y;
  return y;
}

// Try shorter strings first. Good test cases: 0.1, 9.8, 0.00000000001, 1.1 - 1.0
string doubleToString(double value) {
  char buffer[64];
  std::snprintf(&buffer[0], sizeof(buffer), "%.15g", value);
  if (std::stod(&buffer[0]) != value) {
    std::snprintf(&buffer[0], sizeof(buffer), "%.16g", value);
    if (std::stod(&buffer[0]) != value) {
      std::snprintf(&buffer[0], sizeof(buffer), "%.17g", value);
    }
  }
  return buffer;
}

string intToString(int x) {
  return std::to_string(x);
}
