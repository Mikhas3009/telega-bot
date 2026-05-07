import {
  DomainEventPublisher,
  EVENT_PUBLISHER,
  LoggingPublisher,
  MESSAGE_BUS,
  RabbitMQConnection,
  RabbitMQMessageBus,
  RabbitMQModule,
  RetryablePublisher,
  ValidatingPublisher,
  defaultRetryPolicy,
  type EventPublisher,
  type MessageBus,
} from '@app/messaging';
import { Module, type DynamicModule } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { PRODUCER_CONFIG, type ProducerConfig } from '../../config/config.schema.js';

import { TopologyBootstrap } from './topology.bootstrap.js';

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({})
export class MessagingModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
  static forRoot(): DynamicModule {
    return {
      module: MessagingModule,
      global: true,
      imports: [
        RabbitMQModule.forRootAsync({
          inject: [PRODUCER_CONFIG],
          useFactory: (cfg: ProducerConfig) => ({ url: cfg.RABBITMQ_URL }),
        }),
      ],
      providers: [
        {
          provide: MESSAGE_BUS,
          inject: [RabbitMQConnection],
          useFactory: (conn: RabbitMQConnection): MessageBus => new RabbitMQMessageBus(conn),
        },
        {
          provide: EVENT_PUBLISHER,
          inject: [MESSAGE_BUS, PRODUCER_CONFIG, PinoLogger],
          useFactory: (
            bus: MessageBus,
            cfg: ProducerConfig,
            pinoLogger: PinoLogger,
          ): EventPublisher => {
            const domain = new DomainEventPublisher(bus, {
              exchange: cfg.EVENTS_EXCHANGE,
              producerName: cfg.PRODUCER_NAME,
            });
            const retry = new RetryablePublisher(domain, defaultRetryPolicy);
            const log = new LoggingPublisher(retry, pinoLogger.logger);
            return new ValidatingPublisher(log);
          },
        },
        TopologyBootstrap,
      ],
      exports: [EVENT_PUBLISHER],
    };
  }
}
