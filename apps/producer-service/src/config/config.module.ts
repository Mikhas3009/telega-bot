import { loadConfig } from '@app/config';
import { Module, type DynamicModule } from '@nestjs/common';

import { PRODUCER_CONFIG, ProducerConfigSchema, type ProducerConfig } from './config.schema.js';

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
          provide: PRODUCER_CONFIG,
          useFactory: (): ProducerConfig =>
            loadConfig(ProducerConfigSchema, options.source ?? process.env),
        },
      ],
      exports: [PRODUCER_CONFIG],
      global: true,
    };
  }
}
