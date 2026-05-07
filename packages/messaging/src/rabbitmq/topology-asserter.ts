import { Topology } from '@app/contracts';
import type { ConfirmChannel } from 'amqplib';

import type { RabbitMQConnection } from './rabbitmq-connection.js';

export interface BindingSpec {
  exchange: string;
  queue: string;
  routingKey: string;
}

export interface TopologySpec {
  exchanges: readonly { name: string; type: 'topic' | 'fanout' | 'direct'; durable: boolean }[];
  queues: readonly { name: string; durable: boolean; arguments?: Record<string, unknown> }[];
  bindings: readonly BindingSpec[];
}

export const buildBaseTopology = (
  additionalBindings: readonly BindingSpec[] = [],
): TopologySpec => ({
  exchanges: [
    { name: Topology.exchanges.events.name, type: 'topic', durable: true },
    { name: Topology.exchanges.dlx.name, type: 'fanout', durable: true },
  ],
  queues: [{ name: Topology.queues.dlq.name, durable: true }],
  bindings: [
    { exchange: Topology.exchanges.dlx.name, queue: Topology.queues.dlq.name, routingKey: '#' },
    ...additionalBindings,
  ],
});

export class TopologyAsserter {
  private readonly connection: RabbitMQConnection;

  constructor(connection: RabbitMQConnection) {
    this.connection = connection;
  }

  async assert(spec: TopologySpec): Promise<void> {
    const wrapper = this.connection.createConsumerChannel(async (ch: ConfirmChannel) => {
      for (const ex of spec.exchanges) {
        await ch.assertExchange(ex.name, ex.type, { durable: ex.durable });
      }
      for (const q of spec.queues) {
        await ch.assertQueue(q.name, {
          durable: q.durable,
          ...(q.arguments !== undefined ? { arguments: q.arguments } : {}),
        });
      }
      for (const b of spec.bindings) {
        await ch.bindQueue(b.queue, b.exchange, b.routingKey);
      }
    });
    await wrapper.waitForConnect();
    await wrapper.close();
  }
}
