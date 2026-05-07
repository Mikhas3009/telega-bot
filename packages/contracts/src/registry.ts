import type { z } from 'zod';

import { NotificationSendV1, UserRegisteredV1 } from './events/index.js';

export interface EventDefinition<TPayload extends z.ZodTypeAny = z.ZodTypeAny> {
  readonly name: string;
  readonly routingKey: string;
  readonly schemaVersion: number;
  readonly schema: TPayload;
}

const definitions: readonly EventDefinition[] = [
  UserRegisteredV1 as EventDefinition,
  NotificationSendV1 as EventDefinition,
];
const byName = new Map<string, EventDefinition>(definitions.map((d) => [d.name, d]));

export const EventRegistry = {
  resolve(name: string): EventDefinition | undefined {
    return byName.get(name);
  },
  all(): readonly EventDefinition[] {
    return definitions;
  },
} as const;
