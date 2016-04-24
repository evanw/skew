#include <math.h>
#include <string.h>

#if _WIN32
  #include <windows.h>
  #undef max
  #undef min
#else
  #include <sys/time.h>
#endif

////////////////////////////////////////////////////////////////////////////////

Skew::string::string() : _isNull(true) {
}

Skew::string::string(const char *x) : _data(x ? x : ""), _isNull(!x) {
}

Skew::string::string(const char *x, int count) : _data(x, x + count), _isNull(false) {
}

Skew::string::string(const std::string &x) : _data(x), _isNull(false) {
}

bool Skew::string::operator == (const string &x) const {
  return _isNull == x._isNull && _data == x._data;
}

bool Skew::string::operator != (const string &x) const {
  return _isNull != x._isNull || _data != x._data;
}

const char *Skew::string::c_str() const {
  return _isNull ? nullptr : _data.c_str();
}

const std::string &Skew::string::std_str() const {
  return _data;
}

Skew::string Skew::string::operator + (const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  return _data + x._data;
}

Skew::string &Skew::string::operator += (const string &x) {
  assert(!_isNull);
  assert(!x._isNull);
  _data += x._data;
  return *this;
}

int Skew::string::compare(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  return (_data > x._data) - (_data < x._data);
}

int Skew::string::count() const {
  return (int)_data.size();
}

bool Skew::string::contains(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  return _data.find(x._data) != std::string::npos;
}

int Skew::string::indexOf(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  auto it = _data.find(x._data);
  return it != std::string::npos ? (int)it : -1;
}

int Skew::string::lastIndexOf(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  auto it = _data.rfind(x._data);
  return it != std::string::npos ? (int)it : -1;
}

bool Skew::string::startsWith(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  return _data.size() >= x._data.size() && !memcmp(_data.data(), x._data.data(), x._data.size());
}

bool Skew::string::endsWith(const string &x) const {
  assert(!_isNull);
  assert(!x._isNull);
  return _data.size() >= x._data.size() && !memcmp(_data.data() + _data.size() - x._data.size(), x._data.data(), x._data.size());
}

int Skew::string::operator [] (int x) const {
  assert(0 <= x && x < count());
  return (int)(unsigned char)_data[x]; // Code units should not be negative
}

Skew::string Skew::string::get(int x) const {
  assert(0 <= x && x < count());
  return std::string(1, _data[x]);
}

Skew::string Skew::string::slice(int start) const {
  assert(0 <= start && start <= count());
  return _data.substr(start);
}

Skew::string Skew::string::slice(int start, int end) const {
  assert(0 <= start && start <= end && end <= count());
  return _data.substr(start, end - start);
}

Skew::List<int> *Skew::string::codeUnits() const {
  auto result = new List<int>;
  for (unsigned char x : _data) {
    result->append(x);
  }
  return result;
}

Skew::List<Skew::string> *Skew::string::split(const string &x) const {
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

Skew::string Skew::string::join(const List<Skew::string> *x) const {
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

Skew::string Skew::string::repeat(int x) const {
  assert(x >= 0);
  std::string result("");
  result.reserve(_data.size() * x);
  while (x-- > 0) {
    result += _data;
  }
  return result;
}

Skew::string Skew::string::replaceAll(const string &before, const string &after) const {
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

Skew::string Skew::string::toLowerCase() const {
  auto result = _data;
  std::transform(_data.begin(), _data.end(), result.begin(), ::tolower);
  return result;
}

Skew::string Skew::string::toUpperCase() const {
  auto result = _data;
  std::transform(_data.begin(), _data.end(), result.begin(), ::toupper);
  return result;
}

Skew::string Skew::string::fromCodeUnit(int x) {
  return std::string(1, x);
}

Skew::string Skew::string::fromCodeUnits(const List<int> *x) {
  std::string result("");
  result.reserve(x->count());
  for (char y : *x) {
    result += y;
  }
  return result;
}

Skew::string operator "" _s (const char *data, size_t count) {
  return Skew::string(data, (int)count);
}

////////////////////////////////////////////////////////////////////////////////

Skew::StringBuilder::StringBuilder() {
}

void Skew::StringBuilder::append(const string &x) {
  _data += x.std_str();
}

Skew::string Skew::StringBuilder::toString() const {
  return _data;
}

////////////////////////////////////////////////////////////////////////////////

double Skew::Math::abs(double x) {
  return ::fabs(x);
}

int Skew::Math::abs(int x) {
  return ::abs(x);
}

double Skew::Math::acos(double x) {
  return ::acos(x);
}

double Skew::Math::asin(double x) {
  return ::asin(x);
}

double Skew::Math::atan(double x) {
  return ::atan(x);
}

double Skew::Math::atan2(double x, double y) {
  return ::atan2(x, y);
}

double Skew::Math::sin(double x) {
  return ::sin(x);
}

double Skew::Math::cos(double x) {
  return ::cos(x);
}

double Skew::Math::tan(double x) {
  return ::tan(x);
}

double Skew::Math::floor(double x) {
  return ::floor(x);
}

double Skew::Math::ceil(double x) {
  return ::ceil(x);
}

double Skew::Math::round(double x) {
  return ::round(x);
}

double Skew::Math::exp(double x) {
  return ::exp(x);
}

double Skew::Math::log(double x) {
  return ::log(x);
}

double Skew::Math::pow(double x, double y) {
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
double Skew::Math::random() {
  static uint64_t state0;
  static uint64_t state1;
  static bool setup;

  if (!setup) {
    #ifdef _WIN32
      LARGE_INTEGER counter;
      QueryPerformanceCounter(&counter);
      state0 = __MurmurHash3(counter.QuadPart);
    #else
      timeval data;
      gettimeofday(&data, nullptr);
      state0 = __MurmurHash3(((uint64_t)data.tv_sec << 32) | (uint64_t)data.tv_usec);
    #endif
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

double Skew::Math::sqrt(double x) {
  return ::sqrt(x);
}

double Skew::Math::max(double x, double y) {
  return x > y ? x : y;
}

int Skew::Math::max(int x, int y) {
  return x > y ? x : y;
}

double Skew::Math::min(double x, double y) {
  return x < y ? x : y;
}

int Skew::Math::min(int x, int y) {
  return x < y ? x : y;
}

// Try shorter strings first. Good test cases: 0.1, 9.8, 0.00000000001, 1.1 - 1.0
Skew::string __doubleToString(double value) {
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

Skew::string __intToString(int x) {
  return std::to_string(x);
}

////////////////////////////////////////////////////////////////////////////////

#ifdef SKEW_GC_MARK_AND_SWEEP

  #include <stack>
  #include <unordered_set>

  static std::unordered_set<Skew::Object *> marked;
  static std::stack<Skew::Object *> stack;
  static Skew::Object *latest;

  enum class Delete {
    NOW,
    LATER,
  };

  // Skew::Internal is a friend of Skew::Object so it can access private variables
  namespace Skew {
    struct Internal {
      static UntypedRoot *start();
      static void mark();
      static void sweep(Delete mode);
      static Object *next(Object *object) { return object->__gc_next; }
    };
  }

  #ifdef SKEW_GC_PARALLEL
    #include <sys/fcntl.h>
    #include <sys/wait.h>
    #include <unistd.h>

    struct DeleteLater {
      Skew::Object *object;
      Skew::Object **previous;
    };

    enum { READ, WRITE };
    static int fd[2];
    static pid_t childProcess;
    static size_t liveObjectCount;
    static size_t nextCollectionThreshold;
    static std::vector<DeleteLater> deleteLater;
    static Skew::Root<Skew::Object> parallelHead;

    static void startParallelCollection() {
      if (childProcess) {
        return;
      }

      pipe(fd);
      fcntl(fd[READ], F_SETFL, fcntl(fd[READ], F_GETFL) | O_NONBLOCK);

      // Make sure the collection is always started with the latest object as
      // a known object that is guaranteed not to be collected in this
      // collection. That way the previous pointer for every collected object
      // should be valid and we don't have to worry about collecting the
      // latest object and not knowing which previous pointer to patch up.
      parallelHead = new Skew::Object();

      // Child process
      if (!(childProcess = fork())) {
        close(fd[READ]);
        Skew::Internal::mark();
        Skew::Internal::sweep(Delete::LATER);
        write(fd[WRITE], deleteLater.data(), deleteLater.size() * sizeof(DeleteLater));
        close(fd[WRITE]);
        _exit(0);
      }

      // Parent process
      close(fd[WRITE]);
    }

    enum class Check {
      DO_NOT_BLOCK,
      BLOCK_UNTIL_DONE,
    };

    static void checkParallelCollection(Check mode) {
      static uint8_t *buffer[1 << 16];
      static size_t offset;
      ssize_t count;

      if (!childProcess) {
        return;
      }

      if (mode == Check::BLOCK_UNTIL_DONE) {
        fcntl(fd[READ], F_SETFL, fcntl(fd[READ], F_GETFL) & ~O_NONBLOCK);
      }

      // Read some data
      while ((count = read(fd[READ], buffer + offset, sizeof(buffer) - offset)) > 0) {
        size_t totalSize = offset + count;
        size_t objectCount = totalSize / sizeof(DeleteLater);
        size_t usedSize = objectCount * sizeof(DeleteLater);
        DeleteLater *records = reinterpret_cast<DeleteLater *>(buffer);

        // Delete all complete records we received
        for (size_t i = 0; i < objectCount; i++) {
          const DeleteLater &record = records[i];

          // Skew objects form a singly-linked list. Deleting an object
          // involves unlinking that object from the list, which involves
          // changing the next pointer of the previous link to the next link.
          // This is easy with a doubly-linked list but with a singly-linked
          // list we don't have the address of the previous link. To get around
          // this, the collection process sends the address of the previous
          // link's next pointer. Every object being deleted is guaranteed to
          // have a previous link because of the "parallelHead" object that was
          // created right before the collection started. The "parallelHead"
          // object is guaranteed not to be collected in this collection.
          *record.previous = Skew::Internal::next(record.object);

          delete record.object;
        }

        // Preserve any remaining bytes left over
        offset = totalSize - usedSize;
        memmove(buffer, buffer + usedSize, offset);

        if (mode == Check::DO_NOT_BLOCK) {
          break;
        }
      }

      // Check for exit
      if (waitpid(childProcess, nullptr, mode == Check::BLOCK_UNTIL_DONE ? 0 : WNOHANG)) {
        close(fd[READ]);
        childProcess = 0;

        // Set a threshold for the next collection so the garbage collector
        // only kicks in when there's a decent number of objects to collect
        nextCollectionThreshold = liveObjectCount + 1024;
      }
    }

    void Skew::GC::parallelCollect() {
      if (liveObjectCount > nextCollectionThreshold) {
        startParallelCollection();
      }

      checkParallelCollection(Check::DO_NOT_BLOCK);
    }
  #endif

  void Skew::GC::blockingCollect() {
    #ifdef SKEW_GC_PARALLEL
      checkParallelCollection(Check::BLOCK_UNTIL_DONE);
    #endif

    Skew::Internal::mark();
    Skew::Internal::sweep(Delete::NOW);
    marked.clear();
  }

  void Skew::GC::mark(Object *object) {
    if (object && !marked.count(object)) {
      marked.insert(object);
      stack.push(object);
    }
  }

  Skew::UntypedRoot::UntypedRoot(Object *object) : _previous(Internal::start()), _next(_previous->_next), _object(object) {
    _previous->_next = this;
    _next->_previous = this;
  }

  Skew::UntypedRoot::~UntypedRoot() {
    _previous->_next = _next;
    _next->_previous = _previous;
  }

  Skew::Object::Object() : __gc_next(latest) {
    latest = this;

    #ifdef SKEW_GC_PARALLEL
      liveObjectCount++;
    #endif
  }

  Skew::Object::~Object() {
    #ifdef SKEW_GC_PARALLEL
      liveObjectCount--;
    #endif
  }

  // The first root is the start of a doubly-linked list of roots. It's returned as
  // a static local variable to avoid trouble from C++ initialization order. Roots
  // are global variables and initialization order of global variables is undefined.
  Skew::UntypedRoot *Skew::Internal::start() {
    static UntypedRoot start;
    return &start;
  }

  // Marking must be done with an explicit stack to avoid call stack overflow
  void Skew::Internal::mark() {
    for (auto end = start(), root = end->_next; root != end; root = root->_next) {
      GC::mark(root->_object);
    }

    while (!stack.empty()) {
      auto object = stack.top();
      stack.pop();
      object->__gc_mark();
    }
  }

  // Sweeping removes unmarked objects from the linked list and deletes them
  void Skew::Internal::sweep(Delete mode) {
    for (Object *previous = nullptr, *current = latest, *next; current; current = next) {
      next = current->__gc_next;

      if (!marked.count(current)) {
        switch (mode) {
          case Delete::NOW: {
            (previous ? previous->__gc_next : latest) = next;
            delete current;
            break;
          }

          case Delete::LATER: {
            #ifdef SKEW_GC_PARALLEL
              deleteLater.push_back({current, previous ? &previous->__gc_next : nullptr});
            #endif
            break;
          }
        }
      }

      else {
        previous = current;
      }
    }
  }

#endif
