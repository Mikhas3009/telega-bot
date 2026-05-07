import { UserRegisteredV1, type UserRegisteredV1Payload } from '@app/contracts';
import type { EventDefinition } from '@app/contracts';
import { DomainError } from '@app/errors';

export const EventTypes = ['USER_REGISTERED'] as const;
export type EventType = (typeof EventTypes)[number];

export class UnknownEventTypeError extends DomainError {
  constructor(type: string) {
    super(`Unknown event type: ${type}`, { type });
  }
}

export interface EventTypeMapping {
  definition: EventDefinition;
}

const mapping: Record<EventType, EventTypeMapping> = {
  USER_REGISTERED: { definition: UserRegisteredV1 },
};

export const resolveEventType = (type: string): EventTypeMapping => {
  if (!(EventTypes as readonly string[]).includes(type)) {
    throw new UnknownEventTypeError(type);
  }
  return mapping[type as EventType];
};

export type { UserRegisteredV1Payload };
