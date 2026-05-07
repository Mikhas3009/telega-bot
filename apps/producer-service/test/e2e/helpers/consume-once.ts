import amqplib, { type ConsumeMessage } from 'amqplib';

export interface CapturedMessage {
  routingKey: string;
  body: unknown;
  headers: Record<string, unknown>;
}

/**
 * Binds an exclusive/auto-delete queue, then calls `run()`, and resolves with
 * the first message that arrives on the queue.
 *
 * The consumer is fully ready (queue exists + bound) **before** `run()` is
 * called, eliminating the race between publish and subscribe.
 */
export const consumeOnce = async (
  amqpUrl: string,
  exchange: string,
  routingKeyPattern: string,
  run: () => Promise<void>,
  timeoutMs = 10_000,
): Promise<CapturedMessage> => {
  const conn = await amqplib.connect(amqpUrl);
  const ch = await conn.createChannel();
  await ch.assertExchange(exchange, 'topic', { durable: true });
  const queue = await ch.assertQueue('', { exclusive: true, autoDelete: true });
  await ch.bindQueue(queue.queue, exchange, routingKeyPattern);

  // Queue is now bound. Start listening BEFORE invoking run().
  const captured = new Promise<CapturedMessage>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('consumeOnce timeout'));
    }, timeoutMs);
    void ch.consume(
      queue.queue,
      (m: ConsumeMessage | null) => {
        if (!m) return;
        clearTimeout(timer);
        const body: unknown = JSON.parse(m.content.toString('utf8')) as unknown;
        const rawHeaders: unknown = m.properties.headers;
        const headers: Record<string, unknown> =
          rawHeaders !== null && typeof rawHeaders === 'object'
            ? (rawHeaders as Record<string, unknown>)
            : {};
        resolve({
          routingKey: m.fields.routingKey,
          body,
          headers,
        });
        ch.ack(m);
      },
      { noAck: false },
    );
  });

  // Trigger publish only after queue is bound.
  await run();

  try {
    return await captured;
  } finally {
    await ch.close();
    await conn.close();
  }
};
