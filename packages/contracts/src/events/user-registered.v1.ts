import { z } from 'zod';

export const USER_REGISTERED_V1_NAME = 'user.registered.v1' as const;
export const USER_REGISTERED_V1_ROUTING_KEY = 'user.registered.v1' as const;

export const UserRegisteredV1Payload = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  registeredAt: z.string().datetime(),
});

export type UserRegisteredV1Payload = z.infer<typeof UserRegisteredV1Payload>;

export const UserRegisteredV1 = {
  name: USER_REGISTERED_V1_NAME,
  routingKey: USER_REGISTERED_V1_ROUTING_KEY,
  schemaVersion: 1,
  schema: UserRegisteredV1Payload,
} as const;

export type UserRegisteredV1Definition = typeof UserRegisteredV1;
