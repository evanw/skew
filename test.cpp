/*

class A {
  class B : C.D {}
}

class C {
  class D : A {}
}

*/

struct A {
  struct B;
};

struct C {
  struct D;
};

struct C::D : A {
};

struct A::B : C::D {
};
