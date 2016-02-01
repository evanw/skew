NODE = $(shell if which nodejs > /dev/null; then echo nodejs; else echo node; fi)

SOURCES += src/backend/*.sk
SOURCES += src/core/*.sk
SOURCES += src/frontend/*.sk
SOURCES += src/lib/timestamp.sk
SOURCES += src/middle/*.sk

SOURCES_SKEWC += $(SOURCES)
SOURCES_SKEWC += src/driver/terminal.sk
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

JS_TARGET_FLAGS += $(FLAGS)
JS_TARGET_FLAGS += --target=js

CS_TARGET_FLAGS += $(FLAGS)
CS_TARGET_FLAGS += --target=cs

CPP_TARGET_FLAGS += $(FLAGS)
CPP_TARGET_FLAGS += --target=cpp

CPP_FLAGS += -std=c++11
CPP_FLAGS += -Wall
CPP_FLAGS += -Wextra
CPP_FLAGS += -Wno-switch
CPP_FLAGS += -Wno-unused-parameter
CPP_FLAGS += -Wno-unused-variable
CPP_FLAGS += -include src/backend/library.h
CPP_FLAGS += src/backend/library.cpp

CPP_RELEASE_FLAGS += -O3
CPP_RELEASE_FLAGS += -DNDEBUG
CPP_RELEASE_FLAGS += -fomit-frame-pointer
CPP_RELEASE_FLAGS += src/backend/fast.cpp

default: compile-skewc compile-api

compile-skewc: | build
	$(NODE) skewc.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc.js

compile-api: | build
	$(NODE) skewc.js $(SOURCES_API) $(JS_TARGET_FLAGS) --output-file=build/skew-api.js

replace: | build
	$(NODE) skewc.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc.js
	$(NODE) build/skewc.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc2.js
	$(NODE) build/skewc2.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc3.js
	diff build/skewc2.js build/skewc3.js
	mv build/skewc3.js skewc.js
	rm build/skewc2.js

check: check-js check-cs check-cpp check-determinism

check-js: | build
	$(NODE) skewc.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc.min.js --release
	$(NODE) build/skewc.min.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc2.min.js --release
	$(NODE) build/skewc2.min.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc3.min.js --release
	diff build/skewc2.min.js build/skewc3.min.js

check-cs: | build
	$(NODE) skewc.js $(SOURCES_SKEWC) $(CS_TARGET_FLAGS) --output-file=build/skewc.cs
	mcs -debug build/skewc.cs
	mono --debug build/skewc.exe $(SOURCES_SKEWC) $(CS_TARGET_FLAGS) --output-file=build/skewc2.cs
	mcs -debug build/skewc2.cs
	mono --debug build/skewc2.exe $(SOURCES_SKEWC) $(CS_TARGET_FLAGS) --output-file=build/skewc3.cs
	diff build/skewc2.cs build/skewc3.cs

check-cpp: | build
	$(NODE) skewc.js $(SOURCES_SKEWC) $(CPP_TARGET_FLAGS) --output-file=build/skewc.cpp
	c++ -o build/skewc build/skewc.cpp $(CPP_FLAGS)
	build/skewc $(SOURCES_SKEWC) $(CPP_TARGET_FLAGS) --output-file=build/skewc2.cpp
	c++ -o build/skewc2 build/skewc2.cpp $(CPP_FLAGS)
	build/skewc2 $(SOURCES_SKEWC) $(CPP_TARGET_FLAGS) --output-file=build/skewc3.cpp
	diff build/skewc2.cpp build/skewc3.cpp

check-determinism: | build
	# Generate JavaScript debug and release builds
	$(NODE) skewc.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc.js.js
	$(NODE) skewc.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --release --output-file=build/skewc.js.min.js

	# Check C#
	$(NODE) skewc.js $(SOURCES_SKEWC) $(CS_TARGET_FLAGS) --output-file=build/skewc.cs
	mcs -debug build/skewc.cs
	mono --debug build/skewc.exe $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc.cs.js
	diff build/skewc.js.js build/skewc.cs.js
	mono --debug build/skewc.exe $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --release --output-file=build/skewc.cs.min.js
	diff build/skewc.js.min.js build/skewc.cs.min.js

	# Check C++
	$(NODE) skewc.js $(SOURCES_SKEWC) $(CPP_TARGET_FLAGS) --output-file=build/skewc.cpp
	c++ -o build/skewc build/skewc.cpp $(CPP_FLAGS)
	build/skewc $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc.cpp.js
	diff build/skewc.js.js build/skewc.cpp.js
	build/skewc $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --release --output-file=build/skewc.cpp.min.js
	diff build/skewc.js.min.js build/skewc.cpp.min.js

release: compile-api | build
	$(NODE) skewc.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --release --output-file=build/skewc.min.js
	$(NODE) skewc.js $(SOURCES_API) $(JS_TARGET_FLAGS) --release --output-file=build/skew-api.min.js
	type zopfli > /dev/null 2>&1 && (zopfli -c build/skew-api.min.js > build/skew-api.min.js.gz) || (gzip -c build/skew-api.min.js > build/skew-api.min.js.gz)
	ls -l build/skew-api.js build/skew-api.min.js build/skew-api.min.js.gz

debug-cpp: | build
	$(NODE) skewc.js $(SOURCES_SKEWC) $(CPP_TARGET_FLAGS) --output-file=build/skewc.cpp
	c++ -o build/skewc-debug build/skewc.cpp $(CPP_FLAGS)

release-cpp: | build
	$(NODE) skewc.js $(SOURCES_SKEWC) $(CPP_TARGET_FLAGS) --output-file=build/skewc.cpp --release
	c++ -o build/skewc build/skewc.cpp $(CPP_FLAGS) $(CPP_RELEASE_FLAGS)

watch:
	node_modules/.bin/watch src 'clear && make compile-api'

build:
	mkdir -p build

flex:
	sh -c 'cd src/frontend && python build.py'

version:
	sh -c 'cd src/frontend && python version.py'

test: test-js test-cs test-cpp

test-js: | build
	$(NODE) skewc.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc.js
	$(NODE) build/skewc.js $(SOURCES_TEST) $(JS_TARGET_FLAGS) --output-file=build/test.js
	$(NODE) build/test.js
	$(NODE) build/skewc.js $(SOURCES_TEST) $(JS_TARGET_FLAGS) --output-file=build/test.min.js --release
	$(NODE) build/test.min.js

test-cs: | build
	$(NODE) skewc.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc.js
	$(NODE) build/skewc.js $(SOURCES_TEST) $(CS_TARGET_FLAGS) --output-file=build/test.cs
	mcs -debug build/test.cs
	mono --debug build/test.exe
	rm -fr build/cs
	mkdir -p build/cs
	$(NODE) build/skewc.js $(SOURCES_TEST) $(CS_TARGET_FLAGS) --output-dir=build/cs
	mcs -debug build/cs/*.cs -out:build/test.exe
	mono --debug build/test.exe

test-cpp: | build
	$(NODE) skewc.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc.js
	$(NODE) build/skewc.js $(SOURCES_TEST) $(CPP_TARGET_FLAGS) --output-file=build/test.cpp
	c++ -o build/test build/test.cpp $(CPP_FLAGS)
	build/test
	$(NODE) build/skewc.js $(SOURCES_TEST) $(CPP_TARGET_FLAGS) --output-file=build/test.cpp --release
	c++ -o build/test build/test.cpp $(CPP_FLAGS) $(CPP_RELEASE_FLAGS)
	build/test

clean:
	rm -fr build

publish: test check
	sh -c 'cd npm && npm version patch'
	make version
	$(NODE) skewc.js $(SOURCES_SKEWC) $(JS_TARGET_FLAGS) --output-file=build/skewc.min.js --release
	$(NODE) skewc.js $(SOURCES_API) $(JS_TARGET_FLAGS) --output-file=build/skew-api.min.js --release
	cp build/skew-api.min.js npm/skew.js
	echo '#!/usr/bin/env node' > npm/skewc
	cat build/skewc.min.js >> npm/skewc
	chmod +x npm/skewc
	sh -c 'cd npm && npm publish'

benchmark: | build
	cat $(SOURCES_API) > build/benchmark.sk
	$(NODE) skewc.js build/benchmark.sk $(JS_TARGET_FLAGS) --output-file=build/benchmark.js --release --js-mangle=false
