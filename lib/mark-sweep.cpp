namespace gc {
  static std::unordered_set<Object *> marked;
  static Object *latest;

  struct GC {
    static UntypedRoot *start() {
      static UntypedRoot start;
      return &start;
    }

    static void mark() {
      for (auto first = start(), root = first->_next; root != first; root = root->_next) {
        mark(root->_object);
      }
    }

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

    static void mark(Object *object) {
      if (object && !marked.count(object)) {
        marked.insert(object);
        object->__gc_mark();
      }
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
    GC::mark(object);
  }
}
