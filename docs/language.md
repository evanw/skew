# Language Features

This gives a brief overview of each language feature.

## Primitives

Skew has a few primitive types: `bool`, `int`, `double`, and `string`. Integers are signed 32-bit values and strings are immutable and nullable. There is no unsigned integer type since it leads to performance penalties for JavaScript. Skew also has list and map literals that use the built-in List, IntMap, and StringMap types.

    false            # bool
    0                # int
    0.0              # double
    ""               # string
    [1, 2, 3]        # List<int>
    {1: 2, 3: 4}     # IntMap<int>
    {"a": 1, "b": 2} # StringMap<int>

## Variables

Variables are declared with the `var` keyword. If the type is omitted, the type is inferred from the assigned value. Read-only variables are declared with the `const` keyword.

    var x int = 0 # Explicitly typed
    var y = 0     # Implicitly typed
    const z = 0   # Read-only

Constant values can be overridden at compile time using `--define:z=1`.

## Functions

Functions are declared with the `def` keyword. Parentheses are not used for functions that don't take any arguments, both when declaring the function and when calling it. Absence of a return type is indicated by just not specifying a return type instead of requiring a special `void` type. Use the `@entry` annotation to mark the entry point.

    @entry
    def main int {
      test
      return 0
    }

    def test {
      test(5)
    }

    def test(count int) {
      for i in 0..count {
        print("testing")
      }
    }

    @import
    def print(text string)

## Objects

Skew's object model is similar to Java. A class can inherit from at most one base class and can implement any number of interfaces. The symbols `:` and `::` are used instead of the `extends` and `implements` keywords. Names that start with `_` have protected access (only available to that class and its derived classes).

Unlike Java, all type declarations are "open" so members from duplicate type declarations for the same type are all merged together at compile time. This allows for large type declarations to be better organized and also allows for safe compile-time monkey patching. In the example below, the `ChunkedBuffer` type can be made to implement the `Encoder` interface using a separate declaration.

    class Buffer {
      var _data = ""
      def _append(data string) { _data += data }
    }

    class ChunkedBuffer : Buffer {
      over _append(data string) { _data += "[" + data + "]" }
    }

    interface Encoder {
      def encodeInt(value int)
      def encodeString(value string)
    }

    class ChunkedBuffer :: Encoder {
      def encodeInt(value int) { _append(value.toString) }
      def encodeString(value string) { _append(value) }
    }

    class User {
      var id int
      var name string

      def encode(encoder Encoder) {
        encoder.encodeInt(id)
        encoder.encodeString(name)
      }
    }

## Constructors

A constructor is a function called `new` with no return type. Constant variables can only be assigned to in a constructor.

    class Node {
      var weight int
      var children List<Node>

      def new(children List<Node>) {
        weight = 0
        self.children = children
      }
    }

    class NamedNode : Node {
      const name string

      def new(children List<Node>, name string) {
        super(children)
        self.name = name
      }
    }

When not explicitly declared, constructors are automatically generated with one argument for each member variable without a default value in declaration order. This greatly simplifies defining objects in many situations. For example, the above code can be simplified to this since both constructors can be generated automatically:

    class Node {
      var weight = 0
      var children List<Node>
    }

    class NamedNode : Node {
      const name string
    }

Unlike Java, constructors are just members of the type they construct and don't require a special operator to invoke:

    def createTree Node {
      return Node.new([
        NamedNode.new([], "X"),
        NamedNode.new([], "Y"),
      ])
    }
