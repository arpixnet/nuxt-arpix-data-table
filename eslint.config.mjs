// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Rules for formatting
    stylistic: false, // Disable stylistic rules
  },
  dirs: {
    src: [
      './playground',
      './src',
    ],
  },
})
  .append({
    // Add custom words to the spell checker
    rules: {
      // Disable spell checker
      'spellcheck/spell-checker': 'off',

      // Disable Vue template formatting rules
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      'vue/html-indent': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/no-v-html': 'off',
      'vue/attributes-order': 'off',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'off',
      'vue/require-prop-types': 'off',

      // Relax TypeScript rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/prefer-namespace-keyword': 'off',

      // Fix import order
      'import/order': 'off',
      'import/first': 'off',
      'import/no-duplicates': 'off',
      'import/no-mutable-exports': 'off',
      'import/no-unresolved': 'off',
      'import/no-absolute-path': 'off',

      // Disable other rules
      'no-console': 'off',
      'no-debugger': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'semi': 'off',
      'comma-dangle': 'off',
      'quotes': 'off',
      'space-before-function-paren': 'off',
      'space-before-blocks': 'off',
      'keyword-spacing': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'computed-property-spacing': 'off',
      'brace-style': 'off',
    },
  })
