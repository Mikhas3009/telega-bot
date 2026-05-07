import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: { transform: { decoratorMetadata: true, legacyDecorator: true } },
    }),
  ],
  test: {
    include: ['src/**/*.integration.spec.ts', 'test/integration/**/*.spec.ts'],
    testTimeout: 90_000,
    hookTimeout: 90_000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
