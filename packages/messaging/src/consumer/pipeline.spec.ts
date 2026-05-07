import { describe, expect, it, vi } from 'vitest';

import type { ConsumerMiddleware, MessageContext } from './middleware.types.js';
import { runPipeline } from './pipeline.js';

const ctx = (): MessageContext => ({
  message: {
    raw: Buffer.from('{}'),
    routingKey: 'k',
    headers: {},
    redelivered: false,
  },
  attempt: 1,
  startedAt: Date.now(),
});

describe('runPipeline', () => {
  it('invokes middlewares in order and reaches the handler', async () => {
    const seen: string[] = [];
    const m = (name: string): ConsumerMiddleware => ({
      name,
      handle: async (_c, next) => {
        seen.push(`${name}:start`);
        await next();
        seen.push(`${name}:end`);
      },
    });

    const handler = vi.fn(() => {
      seen.push('handler');
      return Promise.resolve();
    });

    await runPipeline([m('a'), m('b')], handler, ctx());

    expect(seen).toEqual(['a:start', 'b:start', 'handler', 'b:end', 'a:end']);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('short-circuits when a middleware does not call next', async () => {
    const handler = vi.fn();
    const blocker: ConsumerMiddleware = {
      name: 'blocker',
      handle: () => Promise.resolve(),
    };
    await runPipeline([blocker], handler, ctx());
    expect(handler).not.toHaveBeenCalled();
  });
});
