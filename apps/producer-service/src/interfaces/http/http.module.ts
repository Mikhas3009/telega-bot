import { Module } from '@nestjs/common';

import { PublishEventUseCase } from '../../application/use-cases/publish-event.use-case.js';

import { EventsController } from './controllers/events.controller.js';

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({
  controllers: [EventsController],
  providers: [PublishEventUseCase],
  exports: [PublishEventUseCase],
})
export class HttpModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
}
