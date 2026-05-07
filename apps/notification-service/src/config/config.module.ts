import { loadConfig } from '@app/config';
import { Module, type DynamicModule } from '@nestjs/common';

import {
  NOTIFICATION_CONFIG,
  NotificationConfigSchema,
  type NotificationConfig,
} from './config.schema.js';

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
          provide: NOTIFICATION_CONFIG,
          useFactory: (): NotificationConfig =>
            loadConfig(NotificationConfigSchema, options.source ?? process.env),
        },
      ],
      exports: [NOTIFICATION_CONFIG],
      global: true,
    };
  }
}
