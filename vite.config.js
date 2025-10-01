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
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    base: command === 'serve' ? '/' : '/dashboard/', // Set the base URL
  }
})
