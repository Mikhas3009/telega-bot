import { isRetryable as defaultIsRetryable } from '@app/errors';

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  multiplier: number;
  maxDelayMs: number;
  jitter: 'full' | 'none';
  isRetryable: (error: unknown) => boolean;
}

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 200,
  multiplier: 4,
  maxDelayMs: 10_000,
  jitter: 'full',
  isRetryable: defaultIsRetryable,
};

export const computeBackoffMs = (attempt: number, policy: RetryPolicy): number => {
  const exponential = Math.min(
    policy.initialDelayMs * policy.multiplier ** (attempt - 1),
    policy.maxDelayMs,
  );
  if (policy.jitter === 'full') {
    return Math.floor(Math.random() * exponential);
  }
  return exponential;
};

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
