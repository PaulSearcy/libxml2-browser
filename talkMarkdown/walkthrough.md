# Building libxml2-wasm from this repo

## Pre-req
Python 3
Linux OS, Mac OS, or WSL 1/2 on Windows. 

## Cloning this repo
Since this submodules libxml2-wasm and libxml2-wasm itself submodules libxml2.

The `git` command to clone this without issue is:

`git clone --recursive https://github.com/PaulSearcy/libxml2-browser`

## Installing emscripten
```sh
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
git pull
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Linux/Mac startup script
echo 'echo 'source "~/emsdk/emsdk_env.sh"' >> $HOME/.bash_profile'
```
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

/**
 *  From here on out is the maintainers wrapper to create a user friendly interface. 
 *  You could just load 
 */
cp libxml2raw.* ../src/libxml2raw.* ../lib
cd ..
./node_modules/.bin/tsc -p tsconfig.prod.json --declaration"
```

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


Alright, so the compiled code from tsc will be in lib with `index.mjs` being the starting point.