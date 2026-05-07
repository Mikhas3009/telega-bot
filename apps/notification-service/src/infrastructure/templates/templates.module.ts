import { Module, type DynamicModule } from '@nestjs/common';

import {
  TEMPLATE_RENDERER,
  type TemplateRenderer,
} from '../../application/ports/template-renderer.port.js';

import { StringTemplateRenderer } from './string-template-renderer.js';

const TEMPLATES: Readonly<Record<string, string>> = {
  'user-welcome': 'Welcome {{email}}! Thanks for registering.',
};

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({})
export class TemplatesModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
  static forRoot(): DynamicModule {
    return {
      module: TemplatesModule,
      providers: [
        {
          provide: TEMPLATE_RENDERER,
          useFactory: (): TemplateRenderer => new StringTemplateRenderer({ ...TEMPLATES }),
        },
      ],
      exports: [TEMPLATE_RENDERER],
      global: true,
    };
  }
}
