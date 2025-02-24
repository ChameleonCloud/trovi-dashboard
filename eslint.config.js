import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    rules: {
      // Ignore unused variables that start with an underscore
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...pluginVue.configs['flat/essential'],
]
