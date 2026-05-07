import { describe, expect, it } from 'vitest';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { EventRegistry } from './registry.js';

describe('Event schema snapshots', () => {
  for (const def of EventRegistry.all()) {
    it(`schema for ${def.name} matches snapshot`, () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- ZodTypeAny vs ZodType variance; safe at runtime
      const json = zodToJsonSchema(def.schema, { name: def.name });
      expect(json).toMatchSnapshot();
    });
  }
});
