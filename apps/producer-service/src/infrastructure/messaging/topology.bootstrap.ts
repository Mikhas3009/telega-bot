import { Topology } from '@app/contracts';
import { RabbitMQConnection, TopologyAsserter, type TopologySpec } from '@app/messaging';
import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';

const PRODUCER_TOPOLOGY: TopologySpec = {
  exchanges: [
    { name: Topology.exchanges.events.name, type: 'topic', durable: true },
    { name: Topology.exchanges.dlx.name, type: 'fanout', durable: true },
  ],
  queues: [{ name: Topology.queues.dlq.name, durable: true }],
  bindings: [
    { exchange: Topology.exchanges.dlx.name, queue: Topology.queues.dlq.name, routingKey: '#' },
  ],
};

@Injectable()
export class TopologyBootstrap implements OnApplicationBootstrap {
  private readonly connection: RabbitMQConnection;

  constructor(@Inject(RabbitMQConnection) connection: RabbitMQConnection) {
    this.connection = connection;
  }

  async onApplicationBootstrap(): Promise<void> {
    const asserter = new TopologyAsserter(this.connection);
    await asserter.assert(PRODUCER_TOPOLOGY);
  }
}
