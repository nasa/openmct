const LEGACY_FILES = ['example/**'];
/** @type {import('eslint').Linter.Config} */
const config = {
  env: {
    browser: true,
    es2024: true,
    jasmine: true,
    amd: true,
    node: true
  },
  globals: {
    _: 'readonly',
    __webpack_public_path__: 'writeable',
    __OPENMCT_VERSION__: 'readonly',
    __OPENMCT_BUILD_DATE__: 'readonly',
    __OPENMCT_REVISION__: 'readonly',
    __OPENMCT_BUILD_BRANCH__: 'readonly'
  },
  plugins: ['prettier', 'unicorn', 'simple-import-sort', 'vuejs-accessibility'],
  extends: [
    'eslint:recommended',
    'plugin:compat/recommended',
    'plugin:vue/vue3-recommended',
    'plugin:you-dont-need-lodash-underscore/compatible',
    'plugin:prettier/recommended',
    'plugin:no-unsanitized/DOM',
    'plugin:vuejs-accessibility/recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    allowImportExportEverywhere: true,
    ecmaVersion: 'latest',
    ecmaFeatures: {
      impliedStrict: true
    },
    sourceType: 'module'
  },
  rules: {
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'vue/no-deprecated-dollar-listeners-api': 'warn',
    'vue/no-deprecated-events-api': 'warn',
    'vue/no-v-for-template-key': 'off',
    'vue/no-v-for-template-key-on-child': 'error',
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'prettier/prettier': 'error',
    'you-dont-need-lodash-underscore/omit': 'off',
    'you-dont-need-lodash-underscore/throttle': 'off',
    'you-dont-need-lodash-underscore/flatten': 'off',
    'you-dont-need-lodash-underscore/get': 'off',
    'no-bitwise': 'error',
    curly: 'error',
    eqeqeq: 'error',
    'guard-for-in': 'error',
    'no-extend-native': 'error',
    'no-inner-declarations': 'off',
    'no-use-before-define': ['error', 'nofunc'],
    'no-caller': 'error',
    'no-irregular-whitespace': 'error',
    'no-new': 'error',
    'no-shadow': 'error',
    'no-undef': 'error',
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'none'
      }
    ],
    'no-console': 'off',
    'new-cap': [
      'error',
      {
        capIsNew: false,
        properties: false
      }
    ],
    'dot-notation': 'error',

    // https://eslint.org/docs/rules/no-case-declarations
    'no-case-declarations': 'error',
    // https://eslint.org/docs/rules/max-classes-per-file
    'max-classes-per-file': ['error', 1],
    // https://eslint.org/docs/rules/no-eq-null
    'no-eq-null': 'error',
    // https://eslint.org/docs/rules/no-eval
    'no-eval': 'error',
    // https://eslint.org/docs/rules/no-implicit-globals
    'no-implicit-globals': 'error',
    // https://eslint.org/docs/rules/no-implied-eval
    'no-implied-eval': 'error',
    // https://eslint.org/docs/rules/no-lone-blocks
    'no-lone-blocks': 'error',
    // https://eslint.org/docs/rules/no-loop-func
    'no-loop-func': 'error',
    // https://eslint.org/docs/rules/no-new-func
    'no-new-func': 'error',
    // https://eslint.org/docs/rules/no-new-wrappers
    'no-new-wrappers': 'error',
    // https://eslint.org/docs/rules/no-octal-escape
    'no-octal-escape': 'error',
    // https://eslint.org/docs/rules/no-proto
    'no-proto': 'error',
    // https://eslint.org/docs/rules/no-return-await
    'no-return-await': 'error',
    // https://eslint.org/docs/rules/no-script-url
    'no-script-url': 'error',
    // https://eslint.org/docs/rules/no-self-compare
    'no-self-compare': 'error',
    // https://eslint.org/docs/rules/no-sequences
    'no-sequences': 'error',
    // https://eslint.org/docs/rules/no-unmodified-loop-condition
    'no-unmodified-loop-condition': 'error',
    // https://eslint.org/docs/rules/no-useless-call
    'no-useless-call': 'error',
    // https://eslint.org/docs/rules/no-nested-ternary
    'no-nested-ternary': 'error',
    // https://eslint.org/docs/rules/no-useless-computed-key
    'no-useless-computed-key': 'error',
    // https://eslint.org/docs/rules/no-var
    'no-var': 'error',
    // https://eslint.org/docs/rules/one-var
    'one-var': ['error', 'never'],
    // https://eslint.org/docs/rules/default-case-last
    'default-case-last': 'error',
    // https://eslint.org/docs/rules/default-param-last
    'default-param-last': 'error',
    // https://eslint.org/docs/rules/grouped-accessor-pairs
    'grouped-accessor-pairs': 'error',
    // https://eslint.org/docs/rules/no-constructor-return
    'no-constructor-return': 'error',
    // https://eslint.org/docs/rules/array-callback-return
    'array-callback-return': 'error',
    // https://eslint.org/docs/rules/no-invalid-this
    'no-invalid-this': 'error', // Believe this one actually surfaces some bugs
    // https://eslint.org/docs/rules/func-style
    'func-style': ['error', 'declaration'],
    // https://eslint.org/docs/rules/no-unused-expressions
    'no-unused-expressions': 'error',
    // https://eslint.org/docs/rules/no-useless-concat
    'no-useless-concat': 'error',
    // https://eslint.org/docs/rules/radix
    radix: 'error',
    // https://eslint.org/docs/rules/require-await
    'require-await': 'error',
    // https://eslint.org/docs/rules/no-alert
    'no-alert': 'error',
    // https://eslint.org/docs/rules/no-useless-constructor
    'no-useless-constructor': 'error',
    // https://eslint.org/docs/rules/no-duplicate-imports
    'no-duplicate-imports': 'error',

    // https://eslint.org/docs/rules/no-implicit-coercion
    'no-implicit-coercion': 'error',
    //https://eslint.org/docs/rules/no-unneeded-ternary
    'no-unneeded-ternary': 'error',
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          pascalCase: true
        },
        ignore: ['^.*\\.(js|cjs|mjs)$']
      }
    ],
    'vue/first-attribute-linebreak': 'error',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/no-mutating-props': 'off', // TODO: Remove this rule and fix resulting errors
    // TODO: A11y rules -> fix step by step
    'vuejs-accessibility/no-static-element-interactions': 'warn',
    'vuejs-accessibility/click-events-have-key-events': 'off',
    'vuejs-accessibility/interactive-supports-focus': 'off',
    // Bug in the eslint rule when using :for and :id instead of static classes
    'vuejs-accessibility/label-has-for': 'off',
    'vuejs-accessibility/mouse-events-have-key-events': 'off',
    'vuejs-accessibility/role-has-required-aria-props': 'off',
    'vuejs-accessibility/anchor-has-content': 'off',
    'vuejs-accessibility/iframe-has-title': 'off',
    'vuejs-accessibility/form-control-has-label': 'off',
    'vuejs-accessibility/alt-text': 'off',
    'vuejs-accessibility/aria-props': 'off'
  },
  overrides: [
    {
      files: LEGACY_FILES,
      rules: {
        'no-unused-vars': [
          'error',
          {
            vars: 'all',
            args: 'none',
            varsIgnorePattern: 'controller'
          }
        ],
        'no-nested-ternary': 'off',
        'no-var': 'off',
        'one-var': 'off'
      }
    }
  ]
};

module.exports = config;
