import { Module, type DynamicModule } from '@nestjs/common';
import { LoggerModule as NestPinoLoggerModule } from 'nestjs-pino';

import { buildLoggerModuleParams, type PinoConfigInput } from './pino.config.js';

/* eslint-disable @typescript-eslint/no-extraneous-class */
@Module({})
export class LoggerModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
  static forRoot(input: PinoConfigInput): DynamicModule {
    return {
      module: LoggerModule,
      imports: [NestPinoLoggerModule.forRootAsync(buildLoggerModuleParams(input))],
      exports: [NestPinoLoggerModule],
    };
  }
}
