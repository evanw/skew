SOURCES += src/backend
SOURCES += src/core
SOURCES += src/frontend
SOURCES += src/lib/timestamp.sk
SOURCES += src/middle

SOURCES_SKEWC += $(SOURCES)
SOURCES_SKEWC += src/driver/nodejs.sk
SOURCES_SKEWC += src/driver/options.sk
SOURCES_SKEWC += src/lib/io.sk
SOURCES_SKEWC += src/lib/terminal.sk

SOURCES_API += $(SOURCES)
SOURCES_API += src/driver/jsapi.sk

SOURCES_TEST += $(SOURCES)
SOURCES_TEST += src/driver/tests.sk
SOURCES_TEST += src/lib/terminal.sk
SOURCES_TEST += src/lib/unit.sk
SOURCES_TEST += tests

FLAGS += --inline-functions
FLAGS += --verbose
FLAGS += --message-limit=0

JS_FLAGS += $(FLAGS)
JS_FLAGS += --target=js

CS_FLAGS += $(FLAGS)
CS_FLAGS += --target=cs

CPP_FLAGS += $(FLAGS)
CPP_FLAGS += --target=cpp

CLANG_FLAGS += -std=c++11
CLANG_FLAGS += -ferror-limit=0
CLANG_FLAGS += -Wall
CLANG_FLAGS += -Wextra
CLANG_FLAGS += -Wno-switch
CLANG_FLAGS += -Wno-unused-parameter
CLANG_FLAGS += -include src/backend/library.h
CLANG_FLAGS += -include src/backend/library.cpp

default: compile-skewc compile-api

compile-skewc: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.js

compile-api: | build
	node skewc.js $(SOURCES_API) $(JS_FLAGS) --output-file=build/skew-api.js

replace: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.js
	node build/skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc2.js
	node build/skewc2.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc3.js
	diff build/skewc2.js build/skewc3.js
	mv build/skewc3.js skewc.js
	rm build/skewc2.js

check: check-js check-cs check-determinism

check-js: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.min.js --release
	node build/skewc.min.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc2.min.js --release
	node build/skewc2.min.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc3.min.js --release
	diff build/skewc2.min.js build/skewc3.min.js

check-cs: | build
	node skewc.js $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc.cs
	mcs -debug build/skewc.cs
	mono --debug build/skewc.exe $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc2.cs
	mcs -debug build/skewc2.cs
	mono --debug build/skewc2.exe $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc3.cs
	diff build/skewc2.cs build/skewc3.cs

check-cpp: | build
	node skewc.js $(SOURCES_SKEWC) $(CPP_FLAGS) --output-file=build/skewc.cpp
	clang++ -o build/skewc build/skewc.cpp $(CLANG_FLAGS)
	build/skewc $(SOURCES_SKEWC) $(CPP_FLAGS) --output-file=build/skewc2.cpp
	clang++ -o build/skewc2 build/skewc2.cpp $(CLANG_FLAGS)
	build/skewc2 $(SOURCES_SKEWC) $(CPP_FLAGS) --output-file=build/skewc3.cpp
	diff build/skewc2.cpp build/skewc3.cpp

check-determinism: | build
	# Generate JavaScript debug and release builds
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.js.js
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --release --output-file=build/skewc.js.min.js

	# Check C#
	node skewc.js $(SOURCES_SKEWC) $(CS_FLAGS) --output-file=build/skewc.cs
	mcs -debug build/skewc.cs
	mono --debug build/skewc.exe $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.cs.js
	diff build/skewc.js.js build/skewc.cs.js
	mono --debug build/skewc.exe $(SOURCES_SKEWC) $(JS_FLAGS) --release --output-file=build/skewc.cs.min.js
	diff build/skewc.js.min.js build/skewc.cs.min.js

	# Check C++
	node skewc.js $(SOURCES_SKEWC) $(CPP_FLAGS) --output-file=build/skewc.cpp
	clang++ -o build/skewc build/skewc.cpp $(CLANG_FLAGS)
	build/skewc $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.cpp.js
	diff build/skewc.js.js build/skewc.cpp.js
	build/skewc $(SOURCES_SKEWC) $(JS_FLAGS) --release --output-file=build/skewc.cpp.min.js
	diff build/skewc.js.min.js build/skewc.cpp.min.js

release: compile-api | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --release --output-file=build/skewc.min.js
	node skewc.js $(SOURCES_API) $(JS_FLAGS) --release --output-file=build/skew-api.min.js
	type zopfli > /dev/null 2>&1 && (zopfli -c build/skew-api.min.js > build/skew-api.min.js.gz) || (gzip -c build/skew-api.min.js > build/skew-api.min.js.gz)
	ls -l build/skew-api.js build/skew-api.min.js build/skew-api.min.js.gz

watch:
	node_modules/.bin/watch src 'clear && make compile-api'

build:
	mkdir -p build

flex:
	sh -c 'cd src/frontend && python build.py'

test: test-js test-cs

test-js: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.js
	node build/skewc.js $(SOURCES_TEST) $(JS_FLAGS) --output-file=build/test.js
	node build/test.js
	node build/skewc.js $(SOURCES_TEST) $(JS_FLAGS) --output-file=build/test.min.js --release
	node build/test.min.js

test-cs: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.js
	node build/skewc.js $(SOURCES_TEST) $(CS_FLAGS) --output-file=build/test.cs
	mcs -debug build/test.cs
	mono --debug build/test.exe
	rm -fr build/cs
	mkdir -p build/cs
	node build/skewc.js $(SOURCES_TEST) $(CS_FLAGS) --output-dir=build/cs
	mcs -debug build/cs/*.cs -out:build/test.exe
	mono --debug build/test.exe

test-cpp: | build
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.js
	node build/skewc.js $(SOURCES_TEST) $(CPP_FLAGS) --output-file=build/test.cpp
	clang++ -o build/test build/test.cpp $(CLANG_FLAGS)
	build/test

clean:
	rm -fr build

publish: test check
	node skewc.js $(SOURCES_SKEWC) $(JS_FLAGS) --output-file=build/skewc.min.js --release
	node skewc.js $(SOURCES_API) $(JS_FLAGS) --output-file=build/skew-api.min.js --release
	cp build/skew-api.min.js npm/skew.js
	echo '#!/usr/bin/env node' > npm/skewc
	cat build/skewc.min.js >> npm/skewc
	chmod +x npm/skewc
	sh -c 'cd npm && npm version patch && npm publish'

benchmark: | build
	cat $(SOURCES_API) > build/benchmark.sk
	node skewc.js build/benchmark.sk $(JS_FLAGS) --output-file=build/benchmark.js --release --js-mangle=false
