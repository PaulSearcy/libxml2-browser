import { defineConfig } from 'vite';

export default defineConfig({
    assetsInclude: ['**/*.wasm'], // Ensure .wasm files are included
    build: {
        target: 'esnext',
        minify: false, // 🚫 disable code minification/obfuscation
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'libxml2-wasm': ['libxml2-wasm'] // Bundle libxml2-wasm separately
                }
            }
        }
    },
    optimizeDeps: {
        exclude: ['libxml2-wasm'] // ❗ Don't let Vite pre-bundle this
    },
});