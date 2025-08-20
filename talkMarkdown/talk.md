---
marp: true
theme: rose-pine
# theme: rose-pine-dawn
# theme: rose-pine-moon
---
<style>
    section, section p, p {
        font-size: 18px
    }
    h1 {
        font-size: 80px
    }
    h2 {
        font-size: 28px
    }
    h3 {
        font-size: 24px
    }
    blockquote p {
        font-size: 20px
    }
</style>

# WASM
## Real world evidence for portability and maintenance.

---
## About Me
* Paul Searcy
* Software Engineer at ICC (International Code Council) 
    - Lead on AI Nav and CH projects
* Main Language: JS
    - Rusty: C# 
    - Dabble: Python
* Been in the field since 2015 ( 10 years)
* Recently moved to Coucil Bluffs from Des Moines
* Second talk ever, last talk was about 8 years ago, so fingers crossed.

---

## What is WASM? 
* Straight from <a href="https://webassembly.org" target="_blank">webassembly.org</a>
    > WebAssembly (abbreviated Wasm) is a binary instruction format for a stack-based virtual machine. Wasm is designed as a portable compilation target for programming languages, enabling deployment on the web for client and server applications.
* What does that mean?
    * It means any language that implements the WASM spec in a runtime can run a `.wasm` in that language
    * Here is an example of running C in python taken from https://dev.to/ajeetraina/using-webassembly-with-python-o61
        ```py
            # main.py

            import wasmtime

            # Load the Wasm module
            wasm_module = wasmtime.Module.from_file("square.wasm")

            # Create an instance of the module
            instance = wasmtime.Instance(wasm_module)

            # Get a reference to the exported function
            square_func = instance.exports.square

            # Call the function and print the result
            result = square_func(5)
            print("Square of 5:", result)
        ```

---

## Brief History of WASM
* <a href="https://en.wikipedia.org/wiki/WebAssembly" target="_blank">Obligatory Wiki link</a>
* Precursor to WASM was asm.js.
* <a href="https://www.w3.org/TR/2018/WD-wasm-core-1-20180215/" target="_blank">WASM 1.0 specification - 15 February 2018</a>
* <a href="https://webassembly.org/news/2025-03-20-wasm-2.0/" target="_blank">WASM 2.0 specification - 24 December 2024</a>
* <a href="https://brendaneich.com/2015/06/from-asm-js-to-webassembly/" target="_blank">Blog from Brendan Eich (creator of JS) from 2015 discussing asm and the future with WASM</a>
* Blazing through this as this could be a talk of it's own

---

## Real world use cases
* Generating a Bargraph with Python in Node
* Validating XML in Browser and Node using libxml2 (C library)
* Throwing SQLite into the browser

---

<style scoped>
    h2 {
        text-align: center;
        font-size: 60px
    }
</style>

## Intermission Questions

---

## Generating a Bargraph with Python in Node
* AI Nav is a straightforward RAG application created in 2023
* We utilize a tracing library/framework called langsmith to debug the LLM calls and to run our 'eval' tests
    * Eval tests aka Evaluations are just questions with a known good answer. Where the LLM under test is asked to answer each question and the answer generated is scored by another LLM against the 'good answer'
* Langsmith's UI for eval tests does display bargraphs but only for one score parameter at a time.
* We wanted to combine the score parameters into colored bars next to each ohter. 

<!--    
- In JS there isn't a good way to draw graphs unless you know D3.js or something similiar well. But in Python it is trivial to do so with 
a large part of it's community revolving around data science. 
-->

* I have a coworker named Ritul who is proficient with python and has created graphics from stats many times before.
* Issue is that we didn't want to spawn a process in Node to run the python script. 
* This would involve base64 encoding the graph, flushing to the console (along with can only use one print statement in the entire script), and then reading this back in as string in Node. 🤮 💀

---

## Enter Pyodide
* <a href="https://pyodide.org/en/stable/index.html" target="_blank">Pyodide</a> allows you to dynamically create WASM and interface with it in JS all while never leaving your code. 
* It's plug and play sort of setup, you might forget that it uses WASM behind the scenes.
* Switch to AI Nav codebase

---

## Validating XML everywhere
* CH is another project I'm on that requires parsing, validating, and converting to HTML then PDF. 
* First off who likes XML? 
    * I will say querying XML (XPath) may be easier than traversing through a deeply nested JSON object, just way less performant
* The best library for XML parsing and validation is utilizing a popupar C library called `libxml2` through a wrapper
* Except these 'wrapper' libraries, that were created back when Node used things like node-gyp for binding to c/c++ libraries, are unmaintained and as such don't have the latest upstream version of libxml2. 
    * <a href="https://www.npmjs.com/package/libxmljs" target="_blank">libxmljs</a> - 2 years old
    * Fork from libxmljs <a href="https://www.npmjs.com/package/libxmljs2" target="_blank">libxmljs2</a> - 2 months old and explicit `NO LONGER MAINTAINED` header
* This means bug fixes and feature additions will be a future issue and searching for a replacement landed me∂∂ on <a href="https://github.com/jameslan/libxml2-wasm" target="_blank">libxml-wasm</a>
* While this is still a wrapper, I had to compile it myself to get a feature the maintainer had recently at the time made a commit to main branch but not published to npm. 
    * From this I was able to see how the burden of maintanability was actually _feasible_ if the maintainer leaves. As the the toolchain used here `emscripten` converts the C to JS. 
    * This means I don't have to write c/c++ to maintain.(bang my head against a wall truly learning c/c++ and all the pitfals) 
    I can just re-compile the latest libxml2 using emscripten and invoke the functions needed. 
    * Maintainer adds a-lot of ergonomics in his library so while I can do this, it is not worth it unless he decides to stop maintaining.
* Lets dig into how to compile this library to WASM as a more in-depth guide as to what is going on in WASM

---

## Installing Emscripten

### Pre-req

Python 3
Linux OS, Mac OS, or WSL 1/2 on Windows. 

### Cloning this repo

Since this submodules libxml2-wasm and libxml2-wasm itself submodules libxml2.

The `git` command to clone this without issue is:

`git clone --recursive https://github.com/PaulSearcy/libxml2-browser`

###  emscripten

```sh
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
git pull
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Linux/Mac startup script (Assumes Bash)
echo 'source "$HOME/emsdk/emsdk_env.sh"' >> $HOME/.bash_profile
```

---
## Building libxml2-wasm

### Pre-req
```sh
npm i 
npm i typescript
```

### Commands unfurled from package.json
```sh
cd libxml2-wasm

rm -rf lib out
mkdir -p out && mkdir -p lib
cd out

emconfigure ../libxml2/autogen.sh --without-python --without-http --without-sax1 --without-modules --without-html --without-threads --without-zlib --without-lzma --disable-shared --enable-static
emmake make
emcc -L.libs -lxml2 -o libxml2raw.mjs --no-entry -s EXPORT_ES6 -s ALLOW_MEMORY_GROWTH -s ALLOW_TABLE_GROWTH -s EXPORTED_RUNTIME_METHODS=@../binding/exported-runtime-functions.txt -s EXPORTED_FUNCTIONS=@../binding/exported-functions.txt -s SINGLE_FILE
// You can also add -g4 for source maps too 

/**
 *  From here on out is the maintainers wrapper to create a user friendly interface. 
 *  You could just load 
 */
cp libxml2raw.* ../src/libxml2raw.* ../lib
cd ..
./node_modules/.bin/tsc -p tsconfig.prod.json --declaration"
```

---
## Building libxml2-wasm - Continued

### Seeing the internal C functions in JS
```js
import moduleLoader from './out/libxml2raw.mjs';

const main = async () => {
    const libxml2 = await moduleLoader();
    console.log('libxml2', libxml2);
    console.log('pointer', libxml2._xmlXPathCtxtCompile);
};
main();
```

---

## Sqlite in the browser (POC/Experimentation)
* Business wanted to utilize parts of AI Nav to find similiar sections in codebooks. 
    * 2096 questions
    * 15 best matches from a vector db across 10 codebooks
    * Resulting in 31440 matches with content ranging from a few words to thousands
* What do you do? 
    * Embed in a single HTML file embedding the data as markup
    * Embed in a single HTML file embedding the data as JSON
    * Embed in multiple HTML files linking together by href
* Or do you create a DB in sqlite using Node and dump it into a sqllite file. Then load said file in the browser?

---

## Sqlite Cont
* If you said sqlite you would be wrong! 😉
* Went with embedding the data as markup with href split across multiple html files with an index in each of them pointing to each other. This was a one off thing and not a full fledged application idea.
* The discovery process though raised the potential for using sqlite in a way to just hand some a .db file and have them drop into an internal application.
* <a href="https://sqlite.org/wasm/doc/trunk/demo-123.md" target="_blank">sqlite in browser</a>
* <a href="https://github.com/sql-js/sql.js" target="_blank">Sqlite JS</a> A pre-compiled JS package for sqlite to avoid some quirks of loading a db properly. 
* Also did you know Node has Sqlite built in as is.
* <a href="https://beta.sqliteviewer.app/" target="_blank">Sqlite on the web.</a>

---

## Conclusion (Tradeoffs and arguments) - Pros

### Pros

* Computationally expensive operations that are slow in JS can be offloaded to WASM to improve performance.
    * Think <a href="https://www.figma.com/blog/webassembly-cut-figmas-load-time-by-3x/" target="_blank">figma</a> and rendering larges number of objects on a canvas
* WASM is great is your a developer in a smaller business with many requirements. As you can utilize packages from other languages you might not 
be as familiar with by converting to WASM and invoking from your language of choice.
    * Greater potential for forking/maintaining an abandoned wrapper for an upstream library. I can write the wrapper code in the language I'm familiar with and not have to learn another language for one dependency. 
* No need anymore for cross-compilation targets for various languages, just compile to WASM.
* No need to worry about x86 vs arm (RISC vs CISC) like you do when compiling binaries. It truly is a portable binary format.
    * This was an annoying issue when using wrapper libaries compiled with node-gyp for arm then mounted to a dev container running x86. 

---

## Conclusion (Tradeoffs and arguments) - Cons

### Cons

* <a href="https://jameslan.github.io/libxml2-wasm/v0.6/documents/Memory_Management.html" target="_blank">Memory Management</a> 
* Pointers! Depending on the language and toolchain that binds to JS
    * For emscripten with C++ it can automatically bind to `std::string`
    * While in C there is no such thing as a string, it is a pointer to bytes in memory. `char *`
        ```js
            // Since libxml2 is all C to actually call the functions exposed from it we have to 
            // allocate memory, populate the memory, then pass the pointer to the memory to the function
            const str = "hello world";
            const len = libxml2.lengthBytesUTF8(str) + 1;   // +1 for null terminator, \0 is the delimiter for 'strings' in C
            const ptr = libxml2._malloc(len); // YEP, memory management. 
            libxml2.stringToUTF8(str, ptr, len);
            libxml2._xmlParseDoc(ptr);

            libxml2._free(ptr);
        ```
---

<style scoped>
    h2 {
        text-align: center;
        font-size: 60px
    }
    * {
        text-align: center;
    }
</style>

## Questions

![](talkQR.png)