int main(int argc, char *argv[]) {
  auto args = new List<string>;
  for (int i = 1; argv[i]; i++) {
    args->append(argv[i]);
  }
  Skew::main(args);
  return 0;
}
