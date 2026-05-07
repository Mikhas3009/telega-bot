import { Controller, Get, Module } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TerminusModule } from '@nestjs/terminus';

import { RabbitMQHealthIndicator } from './rabbitmq.health-indicator.js';
import { RedisHealthIndicator } from './redis.health-indicator.js';

@Controller('health')
class HealthController {
  private readonly health: HealthCheckService;
  private readonly rabbit: RabbitMQHealthIndicator;
  private readonly redis: RedisHealthIndicator;

  constructor(
    health: HealthCheckService,
    rabbit: RabbitMQHealthIndicator,
    redis: RedisHealthIndicator,
  ) {
    this.health = health;
    this.rabbit = rabbit;
    this.redis = redis;
  }

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.rabbit.isHealthy('rabbitmq'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RabbitMQHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
/* eslint-enable @typescript-eslint/no-extraneous-class */
