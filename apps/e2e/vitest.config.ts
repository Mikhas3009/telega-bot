import { resolve } from 'node:path';

import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const root = resolve(__dirname, '../..');

export default defineConfig({
  resolve: {
    alias: {
      'producer-service': resolve(root, 'apps/producer-service/src'),
      'consumer-service': resolve(root, 'apps/consumer-service/src'),
      'notification-service': resolve(root, 'apps/notification-service/src'),
      '@app/errors': resolve(root, 'packages/errors/src'),
      '@app/config': resolve(root, 'packages/config/src'),
      '@app/logger': resolve(root, 'packages/logger/src'),
      '@app/contracts': resolve(root, 'packages/contracts/src'),
      '@app/messaging': resolve(root, 'packages/messaging/src'),
      '@app/testing': resolve(root, 'packages/testing/src'),
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: { transform: { decoratorMetadata: true, legacyDecorator: true } },
    }),
  ],
  test: {
    include: ['test/**/*.e2e.spec.ts'],
    testTimeout: 180_000,
    hookTimeout: 180_000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
