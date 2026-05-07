import { RabbitMQConnection } from '@app/messaging';
import { Inject, Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class RabbitMQHealthIndicator extends HealthIndicator {
  private readonly connection: RabbitMQConnection;

  constructor(@Inject(RabbitMQConnection) connection: RabbitMQConnection) {
    super();
    this.connection = connection;
  }

  isHealthy(key: string): HealthIndicatorResult {
    try {
      this.connection.getConfirmChannel();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'RabbitMQ not connected',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}
