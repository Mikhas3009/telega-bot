import { Inject, Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';

import { HTTP_CLIENT, type HttpClient } from '../application/ports/http-client.port.js';
import { NOTIFICATION_CONFIG, type NotificationConfig } from '../config/config.schema.js';

const CACHE_TTL_MS = 30_000;

@Injectable()
export class TelegramHealthIndicator extends HealthIndicator {
  private readonly http: HttpClient;
  private readonly cfg: NotificationConfig;
  private cachedAt = 0;
  private cachedOk = false;

  constructor(
    @Inject(HTTP_CLIENT) http: HttpClient,
    @Inject(NOTIFICATION_CONFIG) cfg: NotificationConfig,
  ) {
    super();
    this.http = http;
    this.cfg = cfg;
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const now = Date.now();
    if (now - this.cachedAt < CACHE_TTL_MS) {
      if (!this.cachedOk) {
        throw new HealthCheckError(
          'Telegram API not reachable (cached)',
          this.getStatus(key, false),
        );
      }
      return this.getStatus(key, true);
    }
    try {
      const res = await this.http.request({
        method: 'GET',
        url: `${this.cfg.TELEGRAM_BASE_URL}/bot${this.cfg.TELEGRAM_BOT_TOKEN}/getMe`,
        timeoutMs: 3_000,
      });
      const ok = res.status >= 200 && res.status < 500;
      this.cachedAt = now;
      this.cachedOk = ok;
      if (!ok) {
        throw new HealthCheckError(
          `Telegram getMe returned ${String(res.status)}`,
          this.getStatus(key, false, { status: res.status }),
        );
      }
      return this.getStatus(key, true);
    } catch (error) {
      this.cachedAt = now;
      this.cachedOk = false;
      if (error instanceof HealthCheckError) throw error;
      throw new HealthCheckError(
        'Telegram API not reachable',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}
