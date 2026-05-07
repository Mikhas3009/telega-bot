import { describe, expect, it } from 'vitest';

import { CorrelationContext } from './correlation.context.js';

describe('CorrelationContext', () => {
  it('returns undefined when no context is active', () => {
    expect(CorrelationContext.current()).toBeUndefined();
  });

  it('exposes the active correlationId inside run()', async () => {
    await CorrelationContext.run({ correlationId: 'cid-1' }, () => {
      expect(CorrelationContext.current()).toEqual({ correlationId: 'cid-1' });
    });
  });

  it('isolates contexts across concurrent run() calls', async () => {
    const seen: string[] = [];
    await Promise.all([
      CorrelationContext.run({ correlationId: 'a' }, async () => {
        await new Promise((r) => setTimeout(r, 10));
        seen.push(CorrelationContext.current()!.correlationId);
      }),
      CorrelationContext.run({ correlationId: 'b' }, () => {
        seen.push(CorrelationContext.current()!.correlationId);
      }),
    ]);
    expect(seen.sort()).toEqual(['a', 'b']);
  });
});
