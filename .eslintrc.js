module.exports = {
    'env': {
        'browser': true,
        'commonjs': true,
        'es2021': true,
        'node': true
    },
    'extends': 'eslint:recommended',
    'parser': '@babel/eslint-parser',
    'parserOptions': {
        'ecmaVersion': 12,
        // 'ecmaFeatures': {
        //     'jsx': true
        // },
        'sourceType': 'module'
    },
    'ignorePatterns': ['dist/**', 'examples/**'],
    'plugins': [
        'brace-rules',
        // 'react'
    ],
    'rules': {
        'indent': [
            'error',
            4,
            {
                'SwitchCase': 1
            }
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ],
        'semi-spacing': [
            'warn'
        ],
        'no-undef': [
            'off'
        ],
        'no-unused-vars': [
            'warn'
        ],
        'no-else-return': [
            'error'
        ],
        'arrow-parens': [
            'error', 
            'as-needed'
        ],
        'no-cond-assign': [
            'off'
        ],
        'func-call-spacing': [
            'error',
            'never'
        ],
        'space-before-function-paren': [
            'error',
            {
                'anonymous': 'never',
                'named': 'never',
                'asyncArrow': 'always'
            }
        ],
        'keyword-spacing': [
            'error',
            {
                'after': true,
                'overrides': {
                    'catch': { 'after': false },
                    'do': { 'after': false },
                    'for': { 'after': false },
                    'function': { 'after': false },
                    'if': { 'after': false },
                    'while': { 'after': false },
                    'switch': { 'after': false }
                }
            }
        ],
        'space-before-blocks': [
            'error',
            {
                'functions': 'never',
                'keywords': 'never',
                'classes': 'always'
            }
        ],
        'no-var': [
            'error'
        ],
        'prefer-const': [
            'warn',
            {
                'destructuring': 'all'
            }
        ],
        // 'brace-style': [
        //     'error',
        //     'allman',
        //     {
        //         'allowSingleLine': true
        //     }
        // ],
        'brace-rules/brace-on-same-line': [
            'error',
            {
                'FunctionDeclaration': 'never',
                'FunctionExpression': 'ignore',
                'ArrowFunctionExpression': 'always',
                'IfStatement': 'never',
                'TryStatement': 'never',
                'DoWhileStatement': 'never',
                'WhileStatement': 'never',
                'WithStatement': 'never',
                'ForStatement': 'never',
                'ForInStatement': 'never',
                'ForOfStatement': 'never',
                'SwitchStatement': 'never'
            },
            {
                'allowSingleLine': true
            }
        ],
        'object-shorthand': [
            'error',
            'always',
            {
                'avoidQuotes': true
            }
        ],
        'no-whitespace-before-property': [
            'error'
        ],
        'no-empty': [
            'error',
            {
                'allowEmptyCatch': true
            }
        ],
        'nonblock-statement-body-position': [
            'error',
            'below'
        ],
        'no-unneeded-ternary': [
            'warn'
        ],
        'no-lonely-if': [
            'error'
        ],
        'eol-last': [
            'error',
            'always'
        ]
    }
};
