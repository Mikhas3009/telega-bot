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

import { CONSUMER_CONFIG, type ConsumerConfig } from '../../config/config.schema.js';

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({})
export class PublisherModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
  static forRoot(): DynamicModule {
    return {
      module: PublisherModule,
      imports: [
        RabbitMQModule.forRootAsync({
          inject: [CONSUMER_CONFIG],
          useFactory: (cfg: ConsumerConfig) => ({ url: cfg.RABBITMQ_URL }),
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
          inject: [MESSAGE_BUS, CONSUMER_CONFIG, PinoLogger],
          useFactory: (
            bus: MessageBus,
            cfg: ConsumerConfig,
            pinoLogger: PinoLogger,
          ): EventPublisher => {
            const domain = new DomainEventPublisher(bus, {
              exchange: cfg.EVENTS_EXCHANGE,
              producerName: cfg.CONSUMER_NAME,
            });
            const retry = new RetryablePublisher(domain, defaultRetryPolicy);
            const log = new LoggingPublisher(retry, pinoLogger.logger);
            return new ValidatingPublisher(log);
          },
        },
      ],
      exports: [EVENT_PUBLISHER, RabbitMQModule],
      global: true,
    };
  }
}
