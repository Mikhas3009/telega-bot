import { randomUUID } from 'node:crypto';

import type { Envelope, EventDefinition } from '@app/contracts';
import type { z } from 'zod';

let counter = 0;
const seq = (prefix: string): string => `${prefix}-${String(++counter)}`;

export class EnvelopeBuilder<TDef extends EventDefinition> {
  private envelope: Envelope<z.infer<TDef['schema']>>;

  constructor(definition: TDef, payload: z.infer<TDef['schema']>) {
    this.envelope = {
      eventId: randomUUID(),
      eventName: definition.name,
      schemaVersion: definition.schemaVersion,
      occurredAt: new Date().toISOString(),
      correlationId: randomUUID(),
      producer: seq('producer'),
      payload,
    };
  }

  withEventId(id: string): this {
    this.envelope.eventId = id;
    return this;
  }

  withCorrelationId(id: string): this {
    this.envelope.correlationId = id;
    return this;
  }

  withProducer(name: string): this {
    this.envelope.producer = name;
    return this;
  }

  build(): Envelope<z.infer<TDef['schema']>> {
    return { ...this.envelope };
  }

  buildBuffer(): Buffer {
    return Buffer.from(JSON.stringify(this.build()), 'utf8');
  }
}

export const anEnvelope = <TDef extends EventDefinition>(
  definition: TDef,
  payload: z.infer<TDef['schema']>,
): EnvelopeBuilder<TDef> => new EnvelopeBuilder(definition, payload);
