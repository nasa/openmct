module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "jasmine": true,
        "amd": true
    },
    "globals": {
        "_": "readonly"
    },
    "extends": [
        "eslint:recommended",
        "plugin:vue/recommended"
    ],
    "parser": "vue-eslint-parser",
    "parserOptions": {
        "parser": "babel-eslint",
        "allowImportExportEverywhere": true,
        "ecmaVersion": 2015,
        "ecmaFeatures": {
            "impliedStrict": true
        }
    },
    "rules": {
        "no-bitwise": "error",
        "curly": "error",
        "eqeqeq": "error",
        "guard-for-in": "error",
        "no-extend-native": "error",
        "no-inner-declarations": "off",
        "no-use-before-define": ["error", "nofunc"],
        "no-caller": "error",
        "no-sequences": "error",
        "no-irregular-whitespace": "error",
        "no-new": "error",
        "no-shadow": "error",
        "no-undef": "error",
        "no-unused-vars": [
            "error",
            {
                "vars": "all",
                "args": "none"
            }
        ],
        "no-console": "off",
        "no-trailing-spaces": "error",
        "space-before-function-paren": [
            "error",
            {
                "anonymous": "always",
                "asyncArrow": "always",
                "named": "never",
            }
        ],
        "array-bracket-spacing": "error",
        "space-in-parens": "error",
        "space-before-blocks": "error",
        "comma-dangle": "error",
        "eol-last": "error",
        "new-cap": [
            "error",
            {
                "capIsNew": false,
                "properties": false
            }
        ],
        "dot-notation": "error",
        "indent": ["error", 4],
        "vue/html-indent": [
            "error",
            4,
            {
                "attribute": 1,
                "baseIndent": 0,
                "closeBracket": 0,
                "alignAttributesVertically": true,
                "ignores": []
            }
        ],
        "vue/html-self-closing": ["error",
            {
                "html": {
                    "void": "never",
                    "normal": "never",
                    "component": "always"
                },
                "svg": "always",
                "math": "always"
            }
        ],
        "vue/multiline-html-element-content-newline": "off",
        "vue/singleline-html-element-content-newline": "off"
    },
    "overrides": [
        {
            "files": ["*Spec.js"],
            "rules": {
                "no-unused-vars": [
                    "warn",
                    {
                        "vars": "all",
                        "args": "none",
                        "varsIgnorePattern": "controller",

                    }
                ]
            }
        }
    ]
};
