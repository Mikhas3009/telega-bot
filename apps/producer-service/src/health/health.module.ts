import { Controller, Get, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TerminusModule } from '@nestjs/terminus';

import { RabbitMQHealthIndicator } from './rabbitmq.health-indicator.js';

@ApiTags('health')
@Controller('health')
class HealthController {
  private readonly health: HealthCheckService;
  private readonly rabbit: RabbitMQHealthIndicator;

  constructor(health: HealthCheckService, rabbit: RabbitMQHealthIndicator) {
    this.health = health;
    this.rabbit = rabbit;
  }

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => this.rabbit.isHealthy('rabbitmq')]);
  }
}

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RabbitMQHealthIndicator],
})
export class HealthModule {}
/* eslint-enable @typescript-eslint/no-extraneous-class */
