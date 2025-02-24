import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/

export default defineConfig(({ command }) => {
  return {
    plugins: [vue()],
    define: {
      'process.env': process.env, // optional, for compatibility with some libraries
    },
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
