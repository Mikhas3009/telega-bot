import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger as NestPinoLogger } from 'nestjs-pino';

import { AppModule } from './app.module.js';
import { PRODUCER_CONFIG, type ProducerConfig } from './config/config.schema.js';
import { setupSwagger } from './docs/swagger.bootstrap.js';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(NestPinoLogger));
  app.enableShutdownHooks();
  setupSwagger(app);

  const cfg = app.get<ProducerConfig>(PRODUCER_CONFIG);
  await app.listen(cfg.PORT);

  app
    .get(NestPinoLogger)
    .log(`producer-service listening on http://0.0.0.0:${String(cfg.PORT)}`, 'Bootstrap');
};

void bootstrap();
