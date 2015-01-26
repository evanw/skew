namespace gc {
  static std::unordered_set<Object *> marked;
  static std::stack<Object *> stack;
  static Object *latest;

  struct GC {
    // The first root is the start of a doubly-linked list of roots. It's returned as
    // a static local variable to avoid trouble from C++ initialization order. Roots
    // are global variables and initialization order of global variables is undefined.
    static UntypedRoot *start() {
      static UntypedRoot start;
      return &start;
    }

    // Marking must be done with an explicit stack to avoid call stack overflow
    static void mark() {
      for (auto end = start(), root = end->_next; root != end; root = root->_next) {
        gc::mark(root->_object);
      }
      while (!stack.empty()) {
        auto object = stack.top();
        stack.pop();
        object->__gc_mark();
      }
    }

    // Sweeping removes unmarked objects from the linked list and deletes them
    static void sweep() {
      for (Object *previous = nullptr, *current = latest, *next; current; current = next) {
        next = current->__gc_next;
        if (!marked.count(current)) {
          (previous ? previous->__gc_next : latest) = next;
          delete current;
        } else {
          previous = current;
        }
      }
      marked.clear();
    }
  };

  UntypedRoot::UntypedRoot(Object *object) : _previous(GC::start()), _next(_previous->_next), _object(object) {
    _previous->_next = this;
    _next->_previous = this;
  }

  UntypedRoot::~UntypedRoot() {
    _previous->_next = _next;
    _next->_previous = _previous;
  }

  Object::Object() : __gc_next(latest) {
    latest = this;
  }

  void collect() {
    GC::mark();
    GC::sweep();
  }

  void mark(Object *object) {
    if (object && !marked.count(object)) {
      marked.insert(object);
      stack.push(object);
    }
  }
}
