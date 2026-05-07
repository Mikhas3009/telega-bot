import { TransientError } from '@app/errors';
import { connect, type AmqpConnectionManager, type ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';

export interface RabbitMQConnectionOptions {
  url: string;
  heartbeatIntervalSeconds?: number;
  reconnectTimeInSeconds?: number;
}

export class RabbitMQConnectionError extends TransientError {}

export class RabbitMQConnection {
  private connection: AmqpConnectionManager | undefined;
  private confirmChannel: ChannelWrapper | undefined;

  async connect(options: RabbitMQConnectionOptions): Promise<void> {
    this.connection = connect([options.url], {
      heartbeatIntervalInSeconds: options.heartbeatIntervalSeconds ?? 10,
      reconnectTimeInSeconds: options.reconnectTimeInSeconds ?? 2,
    });

    this.confirmChannel = this.connection.createChannel({ json: false, confirm: true });
    await this.confirmChannel.waitForConnect();
  }

  getConfirmChannel(): ChannelWrapper {
    if (!this.confirmChannel) throw new RabbitMQConnectionError('confirm channel not initialized');
    return this.confirmChannel;
  }

  createConsumerChannel(setup: (ch: ConfirmChannel) => Promise<void>): ChannelWrapper {
    if (!this.connection) throw new RabbitMQConnectionError('connection not initialized');
    return this.connection.createChannel({
      json: false,
      confirm: true,
      setup: async (ch: ConfirmChannel) => setup(ch),
    });
  }

  async close(): Promise<void> {
    await this.confirmChannel?.close();
    await this.connection?.close();
    this.confirmChannel = undefined;
    this.connection = undefined;
  }
}
