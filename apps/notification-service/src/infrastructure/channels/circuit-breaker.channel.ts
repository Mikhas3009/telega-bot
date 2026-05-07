import { isRetryable } from '@app/errors';
import CircuitBreaker from 'opossum';

import { CircuitOpenError } from '../../application/domain/circuit-open.error.js';
import type { NotificationMessage } from '../../application/domain/notification-message.js';
import type { NotificationChannel } from '../../application/ports/notification-channel.port.js';

export interface CircuitBreakerOptions {
  errorThresholdPercentage: number;
  rollingCountTimeout: number;
  resetTimeout: number;
  /** opossum needs an upper bound on the operation; default = no per-op timeout. */
  timeoutMs?: number;
}

export class CircuitBreakerChannel implements NotificationChannel {
  readonly kind: string;
  private readonly inner: NotificationChannel;
  private readonly breaker: CircuitBreaker<[NotificationMessage], void>;

  constructor(inner: NotificationChannel, options: CircuitBreakerOptions) {
    this.inner = inner;
    this.kind = inner.kind;
    this.breaker = new CircuitBreaker<[NotificationMessage], void>((msg) => this.inner.send(msg), {
      errorThresholdPercentage: options.errorThresholdPercentage,
      rollingCountTimeout: options.rollingCountTimeout,
      resetTimeout: options.resetTimeout,
      timeout: options.timeoutMs ?? false,
      // Tell opossum to count permanent errors as successes for breaker accounting:
      // 4xx (NonRetryableNotificationError) is a client problem, not a Telegram outage.
      errorFilter: (err: unknown) => !isRetryable(err),
    });
  }

  async send(message: NotificationMessage): Promise<void> {
    try {
      await this.breaker.fire(message);
    } catch (error) {
      if (this.isOpenError(error)) {
        throw new CircuitOpenError(`Circuit breaker open for ${this.kind} channel`, {
          details: { channel: this.kind },
        });
      }
      throw error;
    }
  }

  private isOpenError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return error.message === 'Breaker is open' || error.name === 'OpenCircuitError';
  }

  /** Exposed for healthchecks / metrics. */
  get state(): 'open' | 'half-open' | 'closed' {
    if (this.breaker.opened) return 'open';
    if (this.breaker.halfOpen) return 'half-open';
    return 'closed';
  }
}
