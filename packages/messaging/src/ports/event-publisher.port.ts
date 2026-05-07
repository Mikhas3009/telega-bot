import type { EventDefinition } from '@app/contracts';
import type { z } from 'zod';

export interface PublishMetaOverrides {
  eventId?: string;
  correlationId?: string;
  causationId?: string;
}

export interface PublishResult {
  eventId: string;
  publishedAt: string;
}

export interface EventPublisher {
  publish<TDef extends EventDefinition>(
    definition: TDef,
    payload: z.infer<TDef['schema']>,
    options?: PublishMetaOverrides,
  ): Promise<PublishResult>;
}

export const EVENT_PUBLISHER = Symbol('EventPublisher');
