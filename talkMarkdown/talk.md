---
marp: true
theme: rose-pine
# theme: rose-pine-dawn
# theme: rose-pine-moon
---
<style>
    section {
        font-size: 18px
    }
    h1 {
        font-size: 80px
    }
    h2 {
        font-size: 28px
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
* Straight from [webassembly.org](https://webassembly.org)
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
* [Obligatory Wiki link](https://en.wikipedia.org/wiki/WebAssembly)
* Precursor to WASM was asm.js.
* [WASM 1.0 specification - 15 Febuary 2018](https://www.w3.org/TR/2018/WD-wasm-core-1-20180215/)
* [WASM 2.0 specification - 24 December 2024](https://webassembly.org/news/2025-03-20-wasm-2.0/)
* [Blog from Brendan Eich (creator of JS) from 2015 discussing asm and the future with WASM](https://brendaneich.com/2015/06/from-asm-js-to-webassembly/)
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
    * Eval tests aka Evaluations are just questions with a known good answer. Where the LLM under test is asked to answer each question and the 
    answer generated is scored by another LLM against the 'good answer'
* Langsmith's UI for eval tests does display bargraphs but only for one dataset(run) at a time and separates each score parameter into it's own graph
* We wanted to combine the score parameters into colored bars next to each and compare against multiple datasets(runs). 

<!--    
- In JS there isn't a good way to draw graphs unless you know D3.js or something similiar well. But in Python it is trivial to do so with 
a large part of it's community revolving around data science. 
-->

* Coworker Ritul is proficient with python and has done this many times before but we didn't to spawn a process in Node to run the python script. As this would involve base64 encoding the graph, flushing to the console (along with can only use one print statement in the entire script), and then reading this back in as string in Node. 🤮 💀

---

## Enter Pyodide
* [Pyodide](https://pyodide.org/en/stable/index.html) allows you to dynamically create WASM and interface with it in JS all while never leaving your code. 
* Switch to AI Nav codebase

---

## Validating XML everywhere
* CH is another project I'm on that requires parsing, validating, and converting to HTML then PDF. 
* First off who likes XML? 
    * I will say querying XML (XPath) may be easier than traversing through a deeply nested JSON object, just way less performant
* The best library for XML parsing and validation is utilizing a popupar C library called `libxml2` through a wrapper
* Except these 'wrapper' libraries, that were created back when Node used things like node-gyp for binding to c/c++ libraries, are unmaintained and as such don't have the latest upstream version of libxml2. 
    * [libxmljs](https://www.npmjs.com/package/libxmljs) - 2 years old
    * Fork from libxmljs [libxmljs2](https://www.npmjs.com/package/libxmljs2) - 2 months old and explicit `NO LONGER MAINTAINED` header
* This means bug fixes and feature additions will be a future issue and searching for a replacement landed on [libxml-wasm](https://github.com/jameslan/libxml2-wasm)
* While this is still a wrapper, I had to compile it myself to get a feature the maintainer had recently at the time made a commit to main branch but now published to npm. 
    * From this I was able to see how the burden of maintanability was actually _feasible_ if the maintainer leaves. As the the toolchain used here `emscripten` converts the C to JS. 
    * This means I don't have to write c/c++ to maintain.(bang my head against a wall truly learning c/c++ and all the pitfals) 
    I can just re-compile the latest libxml2 using emscripten and invoke the functions needed. 
    * Maintainer adds a-lot of ergonomics in his library so while I can do this, it is not worth it unless he decides to stop maintaining.
* Lets dig into how to compile this library to WASM as a more in-depth guide as to what is going on in WASM

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
* If you said sqlite you would be wrong! ;)
* Went with embedding the data as markup with href split across multiple html files with an index in each of them pointing to each other. This was a one off thing and not a full fledged application idea.
* The discovery process though raised the potential for using sqlite in a way to just hand some a .db file and have them drop into an internal application.
* [sqlite in browser](https://sqlite.org/wasm/doc/trunk/demo-123.md)
* [Sqlite JS](https://github.com/sql-js/sql.js) A pre-compiled JS package for sqlite to avoid some quirks of loading a db properly. 
* Also did you know Node has Sqlite built in as 
* [Sqlite on the web.](https://beta.sqliteviewer.app/)

---

## Conclusion (Arguments for Portability and Maintenance)
* WASM is great is your a developer in a smaller business with many requirements. As you can utilize packages from other languages you might not 
be as familiar with by converting to WASM and invoking from your language of choice.
* No need anymore for cross-compilation targets for various languages, just compile to WASM.
* When utilizing `.wasm` no need to worry about x86 vs arm (RISC vs CISC) like you do when compiling binaries. It truly is a portable binary format.
    * This was an annoying issue when using wrapper libaries compiled with node-gyp for arm then mounted to a dev container running x86. 
* Greater potential for forking/maintaining an abadoned wrapper for an upstream library. I can write the wrapper code in the language I'm familiar
with and not have to learn another language for one dependency. 

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