import type { EventDefinition } from '@app/contracts';
import type { z } from 'zod';

import type {
  EventPublisher,
  PublishMetaOverrides,
  PublishResult,
} from '../ports/event-publisher.port.js';

import { computeBackoffMs, sleep, type RetryPolicy } from './retry-policy.js';

export class RetryablePublisher implements EventPublisher {
  private readonly inner: EventPublisher;
  private readonly policy: RetryPolicy;

  constructor(inner: EventPublisher, policy: RetryPolicy) {
    this.inner = inner;
    this.policy = policy;
  }

  async publish<TDef extends EventDefinition>(
    definition: TDef,
    payload: z.infer<TDef['schema']>,
    overrides?: PublishMetaOverrides,
  ): Promise<PublishResult> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.policy.maxAttempts; attempt += 1) {
      try {
        return await this.inner.publish(definition, payload, overrides);
      } catch (error) {
        lastError = error;
        if (!this.policy.isRetryable(error) || attempt === this.policy.maxAttempts) {
          throw error;
        }
        await sleep(computeBackoffMs(attempt, this.policy));
      }
    }
    throw lastError;
  }
}
