import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/.turbo/**'],
  },
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '*.config.{ts,mts,cts}',
            'apps/*/vitest.config.{ts,mts,cts}',
            'apps/*/vitest.e2e.config.{ts,mts,cts}',
            'apps/*/vitest.integration.config.{ts,mts,cts}',
            'apps/*/tsup.config.{ts,mts,cts}',
            'packages/*/vitest.config.{ts,mts,cts}',
            'packages/*/tsup.config.{ts,mts,cts}',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { import: importPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-console': 'error',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    
    files: ['**/*.mjs', '**/*.js', '**/*.cjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
   
    files: [
      '*.config.{ts,mts,cts}',
      'apps/*/vitest.config.{ts,mts,cts}',
      'apps/*/vitest.e2e.config.{ts,mts,cts}',
      'apps/*/vitest.integration.config.{ts,mts,cts}',
      'apps/*/tsup.config.{ts,mts,cts}',
      'packages/*/vitest.config.{ts,mts,cts}',
      'packages/*/tsup.config.{ts,mts,cts}',
    ],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
