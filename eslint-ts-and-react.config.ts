import jseslint from '@eslint/js'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactNamingConvention from 'eslint-plugin-react-naming-convention'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsdocPlugin from 'eslint-plugin-tsdoc'
import type { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * The ESLint configurations for JavaScript files.
 */
export const eslintJsConfig: Parameters<typeof defineConfig>[number] = [
  {
    files: [`**/*.{js,mjs,cjs,jsx}`],
    // ignores: ['**/generated'],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      js: jseslint,
    },
    extends: [
      jseslint.configs.recommended,
      jsdocPlugin.configs['flat/recommended'],
    ],
    rules: {
      'jsdoc/check-alignment': 'off', // To avoid conflicts with prettier.
      'jsdoc/no-blank-blocks': 'error',
      'jsdoc/check-tag-names': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-type': 'off',
      'jsdoc/require-throws-type': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/check-param-names': 'off',
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          checkConstructors: false,
          checkGetters: false,
          require: {
            FunctionDeclaration: true,
            FunctionExpression: true,
            ArrowFunctionExpression: false,
            ClassDeclaration: true,
            ClassExpression: true,
            MethodDefinition: false,
          },
          contexts: ['VariableDeclaration', 'TSTypeAliasDeclaration'],
          enableFixer: false,
        },
      ],
    },
  },
]
/**
 * The ESLint configurations for the .ts and .tsx files.
 */
export const eslintTsConfig: Parameters<typeof defineConfig>[number] = [
  /**
   * Typescript and JavaScript configurations
   */
  {
    files: [`**/*.{ts,mts,cts,tsx}`],
    // ignores: ['**/generated'],
    ignores: [
      'dist',
      '**/generated',
      'packages/migration/**/test-source-files',
    ],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      js: jseslint,
      '@typescript-eslint': tseslint.plugin,
      tsdoc: tsdocPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    extends: [
      jseslint.configs.recommended,
      tseslint.configs.recommended,
      jsdocPlugin.configs['flat/recommended'],
    ],
    rules: {
      /**
       * This rule is turned off because this plugin is not compatible with TypeDoc.
       * So an alternate and equivalent flag 'compilerOptions.noUnusedLocals' is set in the tsconfig.json.
       * @see tsconfig.json - {@link https://www.typescriptlang.org/tsconfig/#noUnusedLocals | CompilerOptions.noUnusedLocals}
       */
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-require-imports': ['error'],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: ['variable', 'function'],
          // Specify PascalCase for React components
          format: ['PascalCase', 'camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'property',
          format: null,
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
      ],
      'tsdoc/syntax': 'warn',
      ...(() => {
        const jsConfig = eslintJsConfig[0]
        if (jsConfig && 'rules' in jsConfig) {
          return jsConfig.rules
        }
        return {}
      })(),
    },
  },
]

/**
 * The ESLint configurations for the .ts and .tsx files.
 */
export const eslintReactConfig: Parameters<typeof defineConfig>[number] = [
  /**
   * ReactJS and .tsx files.
   */
  {
    files: [`tests/e2e/web-app/web-client/**/*.{tsx,ts,jsx,js}`],

    extends: [
      reactNamingConvention.configs.recommended,
      reactRefresh.configs.recommended,
      reactHooksPlugin.configs.flat['recommended-latest'],
    ],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
        MutationCallback: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]
