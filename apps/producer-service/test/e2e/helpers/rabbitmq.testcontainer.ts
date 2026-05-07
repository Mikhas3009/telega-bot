import { RabbitMQContainer, type StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import type { StoppedTestContainer } from 'testcontainers';

export interface StartedBroker {
  container: StartedRabbitMQContainer;
  amqpUrl: string;
  stop(): Promise<StoppedTestContainer>;
}

export const startRabbitMQ = async (): Promise<StartedBroker> => {
  const container = await new RabbitMQContainer('rabbitmq:3.13-management-alpine').start();
  return {
    container,
    amqpUrl: container.getAmqpUrl(),
    stop: () => container.stop(),
  };
};
