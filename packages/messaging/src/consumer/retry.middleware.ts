import { computeBackoffMs, sleep, type RetryPolicy } from '../publisher/retry-policy.js';

import type { ConsumerMiddleware, MessageContext, Next } from './middleware.types.js';

export class RetryMiddleware implements ConsumerMiddleware {
  readonly name = 'Retry';

  private readonly policy: RetryPolicy;

  constructor(policy: RetryPolicy) {
    this.policy = policy;
  }

  async handle(ctx: MessageContext, next: Next): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.policy.maxAttempts; attempt += 1) {
      ctx.attempt = attempt;
      try {
        await next();
        return;
      } catch (error) {
        lastError = error;
        if (!this.policy.isRetryable(error) || attempt === this.policy.maxAttempts) throw error;
        await sleep(computeBackoffMs(attempt, this.policy));
      }
    }
    throw lastError;
  }
}
