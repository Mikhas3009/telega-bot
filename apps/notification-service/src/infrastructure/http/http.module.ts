import { Module, type DynamicModule } from '@nestjs/common';

import { HTTP_CLIENT, type HttpClient } from '../../application/ports/http-client.port.js';

import { UndiciHttpClient } from './undici-http-client.js';

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({})
export class HttpModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
  static forRoot(): DynamicModule {
    return {
      module: HttpModule,
      providers: [
        {
          provide: HTTP_CLIENT,
          useFactory: (): HttpClient => new UndiciHttpClient(),
        },
      ],
      exports: [HTTP_CLIENT],
      global: true,
    };
  }
}
