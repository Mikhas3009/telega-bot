import { DomainError, PermanentError, TransientError } from '@app/errors';

/** 4xx from Telegram (blocked user, bad chatId, deactivated). Never retried. */
export class NonRetryableNotificationError extends PermanentError {}

/** 5xx / network blip from Telegram. Eligible for retry. */
export class TelegramTransientError extends TransientError {}

/** Template lookup failure or missing variable — domain rule violation. */
export class TemplateError extends DomainError {}

/** Recipient resolution failed (no chatId in payload and no default configured). */
export class RecipientResolutionError extends DomainError {}
