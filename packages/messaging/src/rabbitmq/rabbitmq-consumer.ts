import { isRetryable } from '@app/errors';
import type { ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import type { Logger } from 'pino';

import type { ConsumerMiddleware, MessageContext } from '../consumer/middleware.types.js';
import { runPipeline, type Handler } from '../consumer/pipeline.js';

import type { RabbitMQConnection } from './rabbitmq-connection.js';

export interface RabbitMQConsumerOptions {
  queue: string;
  prefetch: number;
  middlewares: readonly ConsumerMiddleware[];
  handler: Handler;
  logger: Logger;
}

export class RabbitMQConsumer {
  private readonly connection: RabbitMQConnection;
  private readonly options: RabbitMQConsumerOptions;
  private wrapper: ChannelWrapper | undefined;
  private cancelling = false;

  constructor(connection: RabbitMQConnection, options: RabbitMQConsumerOptions) {
    this.connection = connection;
    this.options = options;
  }

  async start(): Promise<void> {
    this.wrapper = this.connection.createConsumerChannel(async (ch: ConfirmChannel) => {
      await ch.prefetch(this.options.prefetch);
      await ch.consume(
        this.options.queue,
        (message) => {
          void this.handleMessage(ch, message);
        },
        { noAck: false },
      );
    });
    await this.wrapper.waitForConnect();
  }

  async stop(): Promise<void> {
    this.cancelling = true;
    await this.wrapper?.close();
  }

  private async handleMessage(ch: ConfirmChannel, message: ConsumeMessage | null): Promise<void> {
    if (!message || this.cancelling) return;
    const rawHeaders: unknown = message.properties.headers;
    const headers: Record<string, unknown> =
      rawHeaders !== null && typeof rawHeaders === 'object'
        ? (rawHeaders as Record<string, unknown>)
        : {};
    const ctx: MessageContext = {
      message: {
        raw: message.content,
        routingKey: message.fields.routingKey,
        headers,
        redelivered: message.fields.redelivered,
      },
      attempt: 1,
      startedAt: Date.now(),
    };
    try {
      await runPipeline(this.options.middlewares, this.options.handler, ctx);
      ch.ack(message);
    } catch (error) {
      const retry = isRetryable(error);
      this.options.logger.error(
        {
          err: error instanceof Error ? { name: error.name, message: error.message } : { error },
          retry,
        },
        'message handling failed; sending to DLQ',
      );
      ch.nack(message, false, false);
    }
  }
}
