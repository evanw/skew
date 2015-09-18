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

## Lambdas

Lambdas, or anonymous function objects, are declared using the `=>` syntax. Type information can be inferred from context if present or specified explicitly with the `fn()` syntax.

    var nop = => {}
    var add = (a int, b int) => a + b
    var sub fn(int, int) int = (a, b) => a - b

    var handleClick = (event Event) bool => {
      points.append(event.asMouseEvent.locationInWindow)
      event.accept()
      return true
    }

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

## Enums

An enum is a compile-time integer constant. Enums automatically convert to ints but ints don't automatically convert to enums. Each enum type automatically generates a `toString` method if one is missing. Methods added to enums are automatically rewritten as global functions during compilation. The leading type name can be omitted when the type can be inferred from context, which leaves just a leading `.` character.

    class Entry {
      enum Type {
        FILE
        DIRECTORY
      }

      const type Type
      const children List<Entry>
    }

    def traverseFiles(entry Entry, visitFile fn(Entry)) {
      switch entry.type {
        case .FILE {
          visitFile(entry)
        }

        case .DIRECTORY {
          for child in entry.children {
            traverseFiles(child)
          }
        }
      }
    }

## Operator Overloading

Method resolution for overloadable operators is done by looking at methods available on the first operand (except for the `in` operator, which uses the second operand). Operator overloading can make code more readable in many cases, but can also dramatically reduce readability when used incorrectly. Use with good judgement.

    enum Axis {
      X
      Y
    }

    class Vector {
      var x double
      var y double

      def -(p Vector) Vector {
        return Vector.new(x - p.x, y - p.y)
      }

      def [](a Axis) double {
        return a == .X ? x : y
      }

      def []=(a Axis, v double) {
        if a == .X { x = v }
        else { y = v }
      }
    }

    class Player {
      var position Vector

      def deltaTo(other Player) Vector {
        return other.position - position
      }

      def moveAlongAxis(axis Axis, delta double) {
        position[axis] = position[axis] + delta
      }
    }

## Type Aliases and Wrapped Types

Type aliases are defined using the `type` keyword. They must be explicitly casted, which can be used to improve type safety.

    type CSV = string

    def escapeForCSV(text string) CSV {
      if "\"" in text || "," in text || "\n" in text {
        return ("\"" + text.replaceAll("\"", "\"\"") + "\"") as CSV
      }
      return text as CSV
    }

Type aliases can also be used to wrap types without the overhead of additional allocation. Methods added to type aliases are automatically rewritten as global functions during compilation.

    type Color : int {
      def r int { return (self as int) & 255 }
      def g int { return ((self as int) >> 8) & 255 }
      def b int { return ((self as int) >> 16) & 255 }
      def a int { return ((self as int) >> 24) & 255 }
    }

    namespace Color {
      def new(r int, g int, b int, a int) Color {
        return (r | g << 8 | b << 16 | a << 24) as Color
      }
    }

## Preprocessor

Top-level if statements allow for conditional code compilation. Like all declarations, top-level if statements are also order-independent and are evaluated from the outside in. Conditions must be compile-time constants but are fully type-checked, unlike the C preprocessor. Including preprocessing as part of the syntax tree ensures that there aren't syntax errors hiding in unused code branches. Constant variable values can be overridden at compile time using `--define:TRACE=true`.

    if TRACE {
      def traceEnter(label string) {
        Log.info("[enter] " + label)
        Log.indent++
      }

      def traceLeave(label string) {
        Log.indent--
        Log.info("[leave] " + label)
      }
    }

    else {
      @skip {
        def traceEnter(label string) {}
        def traceLeave(label string) {}
      }
    }

    const TRACE = false

The compiler includes some predefined variables that are automatically set based on the compilation settings.

    if TARGET == .CSHARP {
      class ParseError : System.Exception {}
    } else {
      class ParseError {}
    }
