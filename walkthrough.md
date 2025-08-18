
## Pre-req
Python 

## Installing emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
git pull
./emsdk install latest
./emsdk activate latest
source ./emdsdk_env.sh

### Linux startup script
echo 'echo 'source "<YourFolder>/emsdk/emsdk_env.sh"' >> $HOME/.bash_profile'

## Building libxml2-wasm

### Pre-req
```sh
npm i 
npm i typescript
```

### Commands unfurled from package.json
```sh
rm -rf lib out
mkdir -p out && mkdir -p lib
cd out
 emconfigure ../libxml2/autogen.sh --without-python --without-http --without-sax1 --without-modules --without-html --without-threads --without-zlib --without-lzma --disable-shared --enable-static
emmake make
emcc -L.libs -lxml2 -o libxml2raw.mjs --no-entry -s EXPORT_ES6 -s ALLOW_MEMORY_GROWTH -s ALLOW_TABLE_GROWTH -s EXPORTED_RUNTIME_METHODS=@../binding/exported-runtime-functions.txt -s EXPORTED_FUNCTIONS=@../binding/exported-functions.txt -s SINGLE_FILE
cp out/libxml2raw.* ../src/libxml2raw.* lib
```