import { Topology } from '@app/contracts';
import {
  CorrelationIdMiddleware,
  IdempotencyMiddleware,
  IDEMPOTENCY_STORE,
  LoggingMiddleware,
  ParseEnvelopeMiddleware,
  RabbitMQConnection,
  RabbitMQConsumer,
  RetryMiddleware,
  TopologyAsserter,
  ValidatePayloadMiddleware,
  buildBaseTopology,
  defaultRetryPolicy,
  type ConsumerMiddleware,
  type IdempotencyStore,
} from '@app/messaging';
import {
  Inject,
  Injectable,
  Module,
  type DynamicModule,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { HandleUserRegisteredUseCase } from '../../application/use-cases/handle-user-registered.use-case.js';
import { CONSUMER_CONFIG, type ConsumerConfig } from '../../config/config.schema.js';
import { UserRegisteredHandler } from '../../interfaces/messaging/user-registered.handler.js';

@Injectable()
export class ConsumerLifecycle implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly connection: RabbitMQConnection;
  private readonly cfg: ConsumerConfig;
  private readonly idempotencyStore: IdempotencyStore;
  private readonly handler: UserRegisteredHandler;
  private readonly pinoLogger: PinoLogger;
  private consumer: RabbitMQConsumer | undefined;

  constructor(
    @Inject(RabbitMQConnection) connection: RabbitMQConnection,
    @Inject(CONSUMER_CONFIG) cfg: ConsumerConfig,
    @Inject(IDEMPOTENCY_STORE) idempotencyStore: IdempotencyStore,
    handler: UserRegisteredHandler,
    pinoLogger: PinoLogger,
  ) {
    this.connection = connection;
    this.cfg = cfg;
    this.idempotencyStore = idempotencyStore;
    this.handler = handler;
    this.pinoLogger = pinoLogger;
  }

  async onApplicationBootstrap(): Promise<void> {
    const baseTopology = buildBaseTopology([
      {
        exchange: Topology.exchanges.events.name,
        queue: this.cfg.USER_REGISTERED_QUEUE,
        routingKey: 'user.registered.v1',
      },
    ]);
    const topology = {
      ...baseTopology,
      queues: [
        ...baseTopology.queues,
        {
          name: this.cfg.USER_REGISTERED_QUEUE,
          durable: true,
          arguments: { ...Topology.queues.consumerUserRegistered.arguments },
        },
      ],
    };

    await new TopologyAsserter(this.connection).assert(topology);

    const middlewares: ConsumerMiddleware[] = [
      new ParseEnvelopeMiddleware(),
      new ValidatePayloadMiddleware(),
      new CorrelationIdMiddleware(),
      new LoggingMiddleware(this.pinoLogger.logger),
      new IdempotencyMiddleware(
        this.idempotencyStore,
        this.cfg.CONSUMER_NAME,
        this.cfg.IDEMPOTENCY_TTL_SECONDS,
      ),
      new RetryMiddleware(defaultRetryPolicy),
    ];

    this.consumer = new RabbitMQConsumer(this.connection, {
      queue: this.cfg.USER_REGISTERED_QUEUE,
      prefetch: this.cfg.RABBITMQ_PREFETCH,
      middlewares,
      handler: (ctx) => this.handler.handle(ctx),
      logger: this.pinoLogger.logger,
    });

    await this.consumer.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.consumer?.stop();
  }
}

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({})
export class ConsumerModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
  static forRoot(): DynamicModule {
    return {
      module: ConsumerModule,
      providers: [HandleUserRegisteredUseCase, UserRegisteredHandler, ConsumerLifecycle],
    };
  }
}
