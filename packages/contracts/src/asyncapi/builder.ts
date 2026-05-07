import { zodToJsonSchema } from 'zod-to-json-schema';

import { EventRegistry } from '../registry.js';

export interface AsyncApiInput {
  title: string;
  version: string;
  description?: string;
}

export interface AsyncApiDocument {
  asyncapi: '3.0.0';
  info: { title: string; version: string; description?: string };
  channels: Record<string, { address: string; messages: Record<string, { $ref: string }> }>;
  operations: Record<string, { action: 'send' | 'receive'; channel: { $ref: string } }>;
  components: {
    schemas: Record<string, unknown>;
    messages: Record<string, { name: string; payload: { $ref: string } }>;
  };
}

export const buildAsyncApiDocument = (input: AsyncApiInput): AsyncApiDocument => {
  const channels: AsyncApiDocument['channels'] = {};
  const operations: AsyncApiDocument['operations'] = {};
  const schemas: Record<string, unknown> = {};
  const messages: AsyncApiDocument['components']['messages'] = {};

  for (const def of EventRegistry.all()) {
    const schemaName = def.name;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- ZodTypeAny vs ZodType variance; safe at runtime
    schemas[schemaName] = zodToJsonSchema(def.schema, { name: schemaName });
    messages[schemaName] = {
      name: schemaName,
      payload: { $ref: `#/components/schemas/${schemaName}` },
    };
    channels[def.name] = {
      address: def.routingKey,
      messages: { [schemaName]: { $ref: `#/components/messages/${schemaName}` } },
    };
    operations[`publish_${schemaName}`] = {
      action: 'send',
      channel: { $ref: `#/channels/${def.name}` },
    };
  }

  return {
    asyncapi: '3.0.0',
    info:
      input.description !== undefined
        ? { title: input.title, version: input.version, description: input.description }
        : { title: input.title, version: input.version },
    channels,
    operations,
    components: { schemas, messages },
  };
};
