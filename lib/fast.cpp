static void *_fast_next_;
static size_t _fast_available_;

static void *_fast_allocate_(size_t size) {
  enum {
    CHUNK_SIZE = 1 << 20,
    ALIGN = 8,
  };
  size = (size + ALIGN - 1) & ~(ALIGN - 1);
  if (_fast_available_ < size) {
    size_t chunk = (size + CHUNK_SIZE - 1) & ~(CHUNK_SIZE - 1);
    assert(size <= chunk);
    #if _WIN32
      _fast_next_ = VirtualAlloc(nullptr, chunk, MEM_COMMIT, PAGE_READWRITE);
      assert(_fast_next_ != nullptr);
    #else
      _fast_next_ = mmap(nullptr, chunk, PROT_READ | PROT_WRITE, MAP_ANON | MAP_PRIVATE, -1, 0);
      assert(_fast_next_ != MAP_FAILED);
    #endif
    _fast_available_ = chunk;
  }
  void *data = _fast_next_;
  _fast_next_ = (char *)_fast_next_ + size;
  _fast_available_ -= size;
  return data;
}

void *operator new (size_t size) { return _fast_allocate_(size); }
void *operator new [] (size_t size) { return _fast_allocate_(size); }
void operator delete (void *data) noexcept {}
void operator delete [] (void *data) noexcept {}

// Overriding malloc() and free() is really hard on Windows for some reason
#if !_WIN32
  extern "C" void *malloc(size_t size) { return _fast_allocate_(size); }
  extern "C" void free(void *data) {}
#endif
