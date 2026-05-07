import { loadConfig } from '@app/config';
import { Module, type DynamicModule } from '@nestjs/common';

import { CONSUMER_CONFIG, ConsumerConfigSchema, type ConsumerConfig } from './config.schema.js';

export interface ConfigModuleOptions {
  source?: NodeJS.ProcessEnv | Record<string, string | undefined>;
}

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({})
export class ConfigModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: CONSUMER_CONFIG,
          useFactory: (): ConsumerConfig =>
            loadConfig(ConsumerConfigSchema, options.source ?? process.env),
        },
      ],
      exports: [CONSUMER_CONFIG],
      global: true,
    };
  }
}
