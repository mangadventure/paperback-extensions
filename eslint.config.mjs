import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import moduleBindingsNewline from 'eslint-plugin-module-bindings-newline';

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.stylistic,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            '@module-bindings-newline': moduleBindingsNewline,
        },
        rules: {
            '@module-bindings-newline/export': 'warn',
            '@module-bindings-newline/import': 'warn',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'indent': ['error', 4, {'SwitchCase': 1}],
            'linebreak-style': ['error', 'unix'],
            'prefer-arrow-callback': 'error',
            'quotes': ['error', 'single'],
            'semi': ['error', 'never'],
            'sort-imports': 'warn',
        },
    },
];
