#include <math.h>
#include <string.h>
#include <sys/time.h>

////////////////////////////////////////////////////////////////////////////////

string::string() : _isNull(true) {
}

string::string(const char *x) : _data(x ? x : ""), _isNull(!x) {
}

string::string(const char *x, int count) : _data(x, x + count), _isNull(false) {
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
  assert(!_isNull);
  assert(!x._isNull);
  return _data + x._data;
}

string &string::operator += (const string &x) {
  assert(!_isNull);
  assert(!x._isNull);
  _data += x._data;
  return *this;
}

int string::compare(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  return (_data > x._data) - (_data < x._data);
}

int string::count() const {
  return (int)_data.size();
}

bool string::contains(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  return _data.find(x._data) != std::string::npos;
}

int string::indexOf(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  auto it = _data.find(x._data);
  return it != std::string::npos ? (int)it : -1;
}

int string::lastIndexOf(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  auto it = _data.rfind(x._data);
  return it != std::string::npos ? (int)it : -1;
}

bool string::startsWith(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  return _data.size() >= x._data.size() && !memcmp(_data.data(), x._data.data(), x._data.size());
}

bool string::endsWith(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  return _data.size() >= x._data.size() && !memcmp(_data.data() + _data.size() - x._data.size(), x._data.data(), x._data.size());
}

int string::operator [] (int x) const {
  assert(0 <= x && x < count());
  return (int)(unsigned char)_data[x]; // Code units should not be negative
}

string string::get(int x) const {
  assert(0 <= x && x < count());
  return std::string(1, _data[x]);
}

string string::slice(int start) const {
  assert(0 <= start && start <= count());
  return _data.substr(start);
}

string string::slice(int start, int end) const {
  assert(0 <= start && start <= end && end <= count());
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
  assert(!_isNull);
  assert(!x._isNull);
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
  assert(!_isNull);
  std::string result("");
  for (auto b = x->begin(), e = x->end(), it = b; it != e; it++) {
    if (it != b) {
      result += _data;
    }
    assert(!it->_isNull);
    result += it->_data;
  }
  return result;
}

string string::repeat(int x) const {
  assert(x >= 0);
  std::string result("");
  result.reserve(_data.size() * x);
  while (x-- > 0) {
    result += _data;
  }
  return result;
}

string string::replaceAll(const string &before, const string &after) const {
  assert(!_isNull);
  assert(!before._isNull);
  assert(!after._isNull);
  string result("");
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
  std::string result("");
  result.reserve(x->count());
  for (char y : *x) {
    result += y;
  }
  return result;
}

string operator "" _s (const char *data, unsigned long count) {
  return string(data, count);
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

double Math::abs(double x) {
  return ::fabs(x);
}

int Math::abs(int x) {
  return ::abs(x);
}

double Math::acos(double x) {
  return ::acos(x);
}

double Math::asin(double x) {
  return ::asin(x);
}

double Math::atan(double x) {
  return ::atan(x);
}

double Math::atan2(double x, double y) {
  return ::atan2(x, y);
}

double Math::sin(double x) {
  return ::sin(x);
}

double Math::cos(double x) {
  return ::cos(x);
}

double Math::tan(double x) {
  return ::tan(x);
}

double Math::floor(double x) {
  return ::floor(x);
}

double Math::ceil(double x) {
  return ::ceil(x);
}

double Math::round(double x) {
  return ::round(x);
}

double Math::exp(double x) {
  return ::exp(x);
}

double Math::log(double x) {
  return ::log(x);
}

double Math::pow(double x, double y) {
  return ::pow(x, y);
}

static uint64_t __MurmurHash3(uint64_t h) {
  h ^= h >> 33;
  h *= 0xFF51AFD7ED558CCDull;
  h ^= h >> 33;
  h *= 0xC4CEB9FE1A85EC53ull;
  h ^= h >> 33;
  return h;
}

// This implementation is from V8: http://v8project.blogspot.com/2015/12/theres-mathrandom-and-then-theres.html
double Math::random() {
  static uint64_t state0;
  static uint64_t state1;
  static bool setup;

  if (!setup) {
    timeval data;
    gettimeofday(&data, nullptr);
    state0 = __MurmurHash3(((uint64_t)data.tv_sec << 32) | (uint64_t)data.tv_usec);
    state1 = __MurmurHash3(state0);
    setup = true;
  }

  uint64_t s1 = state0;
  uint64_t s0 = state1;
  state0 = s0;
  s1 ^= s1 << 23;
  s1 ^= s1 >> 17;
  s1 ^= s0;
  s1 ^= s0 >> 26;
  state1 = s1;

  // Exponent for double values for [1.0 .. 2.0)
  static const uint64_t kExponentBits = 0x3FF0000000000000ull;
  static const uint64_t kMantissaMask = 0x000FFFFFFFFFFFFFull;
  uint64_t random = ((state0 + state1) & kMantissaMask) | kExponentBits;
  double result = 0;
  static_assert(sizeof(result) == sizeof(random), "");
  memcpy(&result, &random, sizeof(result)); // Use this instead of reinterpret_cast to avoid type-punning
  return result - 1;
}

double Math::sqrt(double x) {
  return ::sqrt(x);
}

double Math::max(double x, double y) {
  return x > y ? x : y;
}

int Math::max(int x, int y) {
  return x > y ? x : y;
}

double Math::min(double x, double y) {
  return x < y ? x : y;
}

int Math::min(int x, int y) {
  return x < y ? x : y;
}
