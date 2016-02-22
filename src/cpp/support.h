namespace Skew {
  struct string;

  template <typename T>
  struct List;
}

namespace IO {
  Skew::string readFile(const Skew::string &path);
  bool writeFile(const Skew::string &path, const Skew::string &contents);
  bool isDirectory(const Skew::string &path);
  Skew::List<Skew::string> *readDirectory(const Skew::string &path);
}

namespace Terminal {
  void _setColor(int escapeCode);
  int width();
  int height();
  void print(const Skew::string &text);
  void flush();
  void write(const Skew::string &text);
}

namespace Timestamp {
  double seconds();
}

double parseDoubleLiteral(const Skew::string &x);
Skew::string doubleToString(double x);
bool doubleIsNaN(double x);
bool doubleIsFinite(double x);
Skew::string intToString(int x);
