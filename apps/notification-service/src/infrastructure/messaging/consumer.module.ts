import { Topology } from '@app/contracts';
import {
  CorrelationIdMiddleware,
  IdempotencyMiddleware,
  IDEMPOTENCY_STORE,
  LoggingMiddleware,
  ParseEnvelopeMiddleware,
  RabbitMQConnection,
  RabbitMQConsumer,
  RabbitMQModule,
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

import {
  NOTIFICATION_CHANNEL_REGISTRY,
  type NotificationChannelRegistry,
} from '../../application/ports/notification-channel.port.js';
import {
  TEMPLATE_RENDERER,
  type TemplateRenderer,
} from '../../application/ports/template-renderer.port.js';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case.js';
import { NOTIFICATION_CONFIG, type NotificationConfig } from '../../config/config.schema.js';
import { NotificationSendHandler } from '../../interfaces/messaging/notification-send.handler.js';

@Injectable()
export class ConsumerLifecycle implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly connection: RabbitMQConnection;
  private readonly cfg: NotificationConfig;
  private readonly idempotencyStore: IdempotencyStore;
  private readonly handler: NotificationSendHandler;
  private readonly pinoLogger: PinoLogger;
  private consumer: RabbitMQConsumer | undefined;

  constructor(
    @Inject(RabbitMQConnection) connection: RabbitMQConnection,
    @Inject(NOTIFICATION_CONFIG) cfg: NotificationConfig,
    @Inject(IDEMPOTENCY_STORE) idempotencyStore: IdempotencyStore,
    handler: NotificationSendHandler,
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
        queue: this.cfg.NOTIFICATION_QUEUE,
        routingKey: 'notification.send.v1',
      },
    ]);
    const topology = {
      ...baseTopology,
      queues: [
        ...baseTopology.queues,
        {
          name: this.cfg.NOTIFICATION_QUEUE,
          durable: true,
          arguments: { ...Topology.queues.notificationSend.arguments },
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
        this.cfg.SERVICE_NAME,
        this.cfg.IDEMPOTENCY_TTL_SECONDS,
      ),
      new RetryMiddleware(defaultRetryPolicy),
    ];

    this.consumer = new RabbitMQConsumer(this.connection, {
      queue: this.cfg.NOTIFICATION_QUEUE,
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
      imports: [
        RabbitMQModule.forRootAsync({
          inject: [NOTIFICATION_CONFIG],
          useFactory: (cfg: NotificationConfig) => ({ url: cfg.RABBITMQ_URL }),
        }),
      ],
      providers: [
        {
          provide: SendNotificationUseCase,
          inject: [NOTIFICATION_CHANNEL_REGISTRY, TEMPLATE_RENDERER, NOTIFICATION_CONFIG],
          useFactory: (
            registry: NotificationChannelRegistry,
            renderer: TemplateRenderer,
            cfg: NotificationConfig,
          ): SendNotificationUseCase =>
            new SendNotificationUseCase(registry, renderer, {
              defaultChatId: cfg.TELEGRAM_DEFAULT_CHAT_ID,
            }),
        },
        NotificationSendHandler,
        ConsumerLifecycle,
      ],
      exports: [RabbitMQModule],
    };
  }
}
