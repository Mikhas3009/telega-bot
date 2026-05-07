export const Topology = {
  exchanges: {
    events: { name: 'events.topic', type: 'topic' as const, durable: true },
    dlx: { name: 'events.dlx', type: 'fanout' as const, durable: true },
  },
  queues: {
    consumerUserRegistered: {
      name: 'consumer.user-registered.q',
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'events.dlx',
        'x-message-ttl': 30_000,
        'x-max-length': 100_000,
      },
    },
    notificationSend: {
      name: 'notification.send.q',
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'events.dlx',
        'x-message-ttl': 30_000,
      },
    },
    dlq: { name: 'events.dlq', durable: true },
  },
} as const;
