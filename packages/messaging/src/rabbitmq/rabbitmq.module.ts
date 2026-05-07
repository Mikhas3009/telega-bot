import { Module, type DynamicModule, type FactoryProvider } from '@nestjs/common';

import { RabbitMQConnection } from './rabbitmq-connection.js';

export interface RabbitMQModuleRootOptions {
  url: string;
  heartbeatIntervalSeconds?: number;
}

export interface RabbitMQModuleAsyncOptions {
  inject?: FactoryProvider['inject'];
  useFactory: (...args: never[]) => RabbitMQModuleRootOptions | Promise<RabbitMQModuleRootOptions>;
}

const buildConnectionProvider = (
  factory: (...args: never[]) => RabbitMQModuleRootOptions | Promise<RabbitMQModuleRootOptions>,
  inject: FactoryProvider['inject'] = [],
): FactoryProvider => ({
  provide: RabbitMQConnection,
  inject,
  useFactory: async (...args: never[]) => {
    const opts = await Promise.resolve(factory(...args));
    const conn = new RabbitMQConnection();
    await conn.connect(opts);
    return conn;
  },
});

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({})
export class RabbitMQModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
  static forRoot(options: RabbitMQModuleRootOptions): DynamicModule {
    return {
      module: RabbitMQModule,
      providers: [buildConnectionProvider(() => options)],
      exports: [RabbitMQConnection],
      global: true,
    };
  }

  static forRootAsync(options: RabbitMQModuleAsyncOptions): DynamicModule {
    return {
      module: RabbitMQModule,
      providers: [buildConnectionProvider(options.useFactory, options.inject ?? [])],
      exports: [RabbitMQConnection],
      global: true,
    };
  }
}
