import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

// https://vitejs.dev/config/

export default defineConfig(({ command }) => {
  return {
    plugins: [vue({ template: { transformAssetUrls } }), quasar({})],
    server: {
      port: 4000,
    },
    resolve: {
      alias: [
        { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
        // vuedraggable declares a UMD bundle as its ESM entry, so its
        // require('vue') drags in the full build and its template compiler.
        { find: /^vue$/, replacement: 'vue/dist/vue.runtime.esm-bundler.js' },
      ],
    },
    base: command === 'serve' ? '/' : '/dashboard/', // Set the base URL
  }
})
