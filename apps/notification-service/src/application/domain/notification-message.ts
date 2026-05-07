export type NotificationChannelKind = 'telegram';

export interface NotificationRecipient {
  /** Telegram chat id; resolved by `Notifier` from envelope payload or default. */
  chatId: string;
}

export interface NotificationMessage {
  channel: NotificationChannelKind;
  recipient: NotificationRecipient;
  body: string;
}
