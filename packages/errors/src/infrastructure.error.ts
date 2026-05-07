export interface InfrastructureErrorOptions {
  cause?: unknown;
  details?: Record<string, unknown>;
}

export abstract class InfrastructureError extends Error {
  public readonly details: Readonly<Record<string, unknown>>;

  constructor(message: string, options: InfrastructureErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = new.target.name;
    this.details = Object.freeze({ ...(options.details ?? {}) });
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, new.target);
    }
  }
}

export abstract class TransientError extends InfrastructureError {}
export abstract class PermanentError extends InfrastructureError {}
