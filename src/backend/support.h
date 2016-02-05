struct string;

template <typename T>
struct List;

namespace IO {
  string readFile(const string &path);
  bool writeFile(const string &path, const string &contents);
  bool isDirectory(const string &path);
  List<string> *readDirectory(const string &path);
}

namespace Terminal {
  void _setColor(int escapeCode);
  int width();
  int height();
  void print(const string &text);
  void flush();
  void write(const string &text);
}

namespace Timestamp {
  double seconds();
}

double parseDoubleLiteral(const string &x);
string doubleToString(double x);
bool doubleIsNaN(double x);
bool doubleIsFinite(double x);
string intToString(int x);
