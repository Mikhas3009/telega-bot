import { TransientError } from '@app/errors';
import type { ChannelWrapper } from 'amqp-connection-manager';

import type {
  MessageBus,
  PublishOptions as PortPublishOptions,
} from '../ports/message-bus.port.js';

import type { RabbitMQConnection } from './rabbitmq-connection.js';

// amqp-connection-manager resolves amqplib without @types, so Options.Publish
// is structurally empty from our compiler's perspective. Extract the 4th parameter
// of ChannelWrapper.publish to get the correct target type.
type AmqpPublishOptions = NonNullable<Parameters<ChannelWrapper['publish']>[3]>;

export class RabbitMQPublishError extends TransientError {}

export class RabbitMQMessageBus implements MessageBus {
  private readonly connection: RabbitMQConnection;

  constructor(connection: RabbitMQConnection) {
    this.connection = connection;
  }

  async publish(options: PortPublishOptions, body: Buffer): Promise<void> {
    const channel = this.connection.getConfirmChannel();
    const amqpOpts = {
      persistent: true,
      contentType: 'application/json',
      contentEncoding: 'utf-8',
      mandatory: true,
      ...(options.messageId !== undefined ? { messageId: options.messageId } : {}),
      ...(options.correlationId !== undefined ? { correlationId: options.correlationId } : {}),
      ...(options.timestamp !== undefined ? { timestamp: options.timestamp } : {}),
      ...(options.headers !== undefined ? { headers: options.headers } : {}),
    } as unknown as AmqpPublishOptions;
    try {
      await channel.publish(options.exchange, options.routingKey, body, amqpOpts);
    } catch (error) {
      throw new RabbitMQPublishError(
        `Failed to publish to ${options.exchange}/${options.routingKey}`,
        { cause: error },
      );
    }
  }
}
