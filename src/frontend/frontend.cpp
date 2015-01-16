#include <string>

struct Source;

namespace io {
  bool writeFile(std::string path, std::string contents);
  Source *readFile(std::string path);
}

#include "skewc.cpp"

int main(int argc, char *argv[]) {
  auto args = new List<std::string> {};
  for (auto i = 1; i < argc; i++) {
    args->push(argv[i]);
  }
  return frontend::main(args);
}

#include <fstream>

bool io::writeFile(std::string path, std::string contents) {
  std::ofstream file(path.c_str());
  if (!file) return false;
  file << contents;
  return true;
}

Source *io::readFile(std::string path) {
  std::ifstream file(path.c_str());
  if (!file) return nullptr;
  return new Source(path, std::string((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>()));
}

#ifdef _WIN32
  #include <windows.h>
#else
  #include <sys/mman.h>
#endif

// Replace the standard malloc() implementation with a bump allocator for
// speed. Never freeing anything is totally fine for a short-lived process.
// This gives a significant speedup.
void *allocate(size_t size) {
  enum { CHUNK_SIZE = 1 << 20, ALIGN = 8 };

  static void *next;
  static size_t available;

  size = (size + ALIGN - 1) & ~(ALIGN - 1);
  if (available < size) {
    auto chunk = (size + CHUNK_SIZE - 1) & ~(CHUNK_SIZE - 1);
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

  auto data = next;
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
