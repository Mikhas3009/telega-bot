import { describe, expect, it } from 'vitest';

import { buildAsyncApiDocument } from './builder.js';

describe('buildAsyncApiDocument', () => {
  it('returns a 3.0 document', () => {
    const doc = buildAsyncApiDocument({ title: 'Test', version: '0.0.1' });
    expect(doc.asyncapi).toBe('3.0.0');
    expect(doc.info.title).toBe('Test');
  });

  it('includes a channel for every registered event', () => {
    const doc = buildAsyncApiDocument({ title: 'Test', version: '0.0.1' });
    expect(Object.keys(doc.channels)).toEqual(
      expect.arrayContaining(['user.registered.v1', 'notification.send.v1']),
    );
  });

  it('includes JSON-Schema payloads under components.schemas', () => {
    const doc = buildAsyncApiDocument({ title: 'Test', version: '0.0.1' });
    expect(doc.components.schemas['user.registered.v1']).toBeDefined();
  });
});
