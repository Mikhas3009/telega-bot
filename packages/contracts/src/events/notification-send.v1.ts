import { z } from 'zod';

export const NOTIFICATION_SEND_V1_NAME = 'notification.send.v1' as const;
export const NOTIFICATION_SEND_V1_ROUTING_KEY = 'notification.send.v1' as const;

export const NotificationChannel = z.enum(['telegram']);

export const NotificationSendV1Payload = z.object({
  channel: NotificationChannel,
  recipient: z.object({
    chatId: z.string().min(1).optional(),
  }),
  template: z.string().min(1),
  variables: z.record(z.string(), z.string()).default({}),
});

export type NotificationSendV1Payload = z.infer<typeof NotificationSendV1Payload>;

export const NotificationSendV1 = {
  name: NOTIFICATION_SEND_V1_NAME,
  routingKey: NOTIFICATION_SEND_V1_ROUTING_KEY,
  schemaVersion: 1,
  schema: NotificationSendV1Payload,
} as const;
