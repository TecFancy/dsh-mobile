// eslint.config.js — flat config for dsh-mobile.
// Modeled on the dsh-auth-gate repo's conventions, scoped to this repo's needs:
// TS sources + vitest config, browser globals for the client half, node globals
// for the host half. `lib/` is generated output and never linted by hand.
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['lib/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // The client half runs in the browser and logs lifecycle diagnostics with
      // a project prefix; console is allowed (unlike dsh-auth-gate's host code).
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['vitest.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
)
