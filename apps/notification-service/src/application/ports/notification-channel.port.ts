import type { NotificationMessage } from '../domain/notification-message.js';

export interface NotificationChannel {
  /** Implementations identify themselves so the strategy selector can route. */
  readonly kind: string;
  send(message: NotificationMessage): Promise<void>;
}

export const NOTIFICATION_CHANNEL_REGISTRY = Symbol('NOTIFICATION_CHANNEL_REGISTRY');

export interface NotificationChannelRegistry {
  resolve(kind: string): NotificationChannel | undefined;
}
