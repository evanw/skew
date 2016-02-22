#include <assert.h>

#if _WIN32
  #include <windows.h>
#else
  #include <sys/mman.h>
#endif

static void *__fast_next;
static size_t __fast_available;

static void *__fast_allocate(size_t size) {
  enum {
    CHUNK_SIZE = 1 << 20,
    ALIGN = 8,
  };

  // Always allocate a multiple of the alignment size
  size = (size + ALIGN - 1) & ~(ALIGN - 1);

  // Grow if needed
  if (__fast_available < size) {
    size_t chunk = (size + CHUNK_SIZE - 1) & ~(CHUNK_SIZE - 1);
    assert(size <= chunk);

    // Ignore the remaining memory in the old chunk and grab a new chunk instead
    #if _WIN32
      __fast_next = VirtualAlloc(nullptr, chunk, MEM_COMMIT, PAGE_READWRITE);
      assert(__fast_next != nullptr);
    #else
      __fast_next = mmap(nullptr, chunk, PROT_READ | PROT_WRITE, MAP_ANON | MAP_PRIVATE, -1, 0);
      assert(__fast_next != MAP_FAILED);
    #endif

    __fast_available = chunk;
  }

  // Just use a simple bump allocator
  void *data = __fast_next;
  __fast_next = (char *)__fast_next + size;
  __fast_available -= size;
  return data;
}

void *operator new (size_t size) { return __fast_allocate(size); }
void *operator new [] (size_t size) { return __fast_allocate(size); }
void operator delete (void *data) throw() {}
void operator delete [] (void *data) throw() {}

// Overriding malloc() and free() is really hard on Windows for some reason
#if !_WIN32
  extern "C" void *malloc(size_t size) { return __fast_allocate(size); }
  extern "C" void free(void *data) {}
#endif
