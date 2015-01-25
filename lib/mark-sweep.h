namespace gc {
  struct GC;

  struct Object {
    Object();
    virtual ~Object() {}

  private:
    friend GC;
    Object *__gc_next = nullptr; // GC space overhead is one pointer per object
    virtual void __gc_mark() = 0; // Recursively marks all child objects
    Object(const Object &); // Prevent copying
    Object &operator = (const Object &); // Prevent copying
  };

  struct UntypedRoot {
    ~UntypedRoot();

  protected:
    friend GC;
    UntypedRoot &operator = (const UntypedRoot &root) { _object = root._object; return *this; }
    UntypedRoot(const UntypedRoot &root) : UntypedRoot(root._object) {}
    UntypedRoot() : _previous(this), _next(this), _object() {}
    UntypedRoot(Object *object);
    UntypedRoot *_previous;
    UntypedRoot *_next;
    Object *_object;
  };

  template <typename T>
  struct Root : UntypedRoot {
    Root(T *object = nullptr) : UntypedRoot(object) {}
    operator T * () const { return dynamic_cast<T *>(_object); }
    T *operator -> () const { return dynamic_cast<T *>(_object); }
    Root<T> &operator = (T *value) { _object = value; return *this; }
  };

  void collect();
  void mark(Object *object);

  template <typename T>
  using VoidIfNotObject = typename std::enable_if<!std::is_base_of<Object, typename std::remove_pointer<T>::type>::value, void>::type;

  template <typename T>
  inline VoidIfNotObject<T> mark(const T &value) {}

  template <typename T>
  inline void mark(const std::vector<T> &values) {
    for (const auto &value : values) {
      gc::mark(value);
    }
  }

  template <typename K, typename V>
  inline void mark(const std::unordered_map<K, V> &values) {
    for (const auto &value : values) {
      gc::mark(value.second);
    }
  }
}
