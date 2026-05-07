import { TransientError } from '@app/errors';

/** opossum opened the breaker — caller should retry later. */
export class CircuitOpenError extends TransientError {}
