import { Injectable } from '@nestjs/common';

import type { NotificationMessage } from '../../../application/domain/notification-message.js';
import {
  NonRetryableNotificationError,
  TelegramTransientError,
} from '../../../application/domain/notification.errors.js';
import type { HttpClient, HttpResponse } from '../../../application/ports/http-client.port.js';
import type { NotificationChannel } from '../../../application/ports/notification-channel.port.js';

export interface TelegramChannelOptions {
  baseUrl: string;
  botToken: string;
  timeoutMs: number;
}

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
}

@Injectable()
export class TelegramChannel implements NotificationChannel {
  readonly kind = 'telegram';
  private readonly http: HttpClient;
  private readonly options: TelegramChannelOptions;

  constructor(http: HttpClient, options: TelegramChannelOptions) {
    this.http = http;
    this.options = options;
  }

  async send(message: NotificationMessage): Promise<void> {
    const url = `${this.options.baseUrl}/bot${this.options.botToken}/sendMessage`;
    const res = await this.http.request({
      method: 'POST',
      url,
      body: { chat_id: message.recipient.chatId, text: message.body },
      timeoutMs: this.options.timeoutMs,
    });

    this.assertSuccess(res);
  }

  private assertSuccess(res: HttpResponse): void {
    if (res.status >= 500) {
      throw new TelegramTransientError(`Telegram returned ${String(res.status)}`, {
        details: { status: res.status, body: this.describe(res.body) },
      });
    }
    if (res.status >= 400) {
      throw new NonRetryableNotificationError(
        `Telegram rejected request with ${String(res.status)}: ${this.describe(res.body)}`,
        { details: { status: res.status, body: this.describe(res.body) } },
      );
    }
    if (typeof res.body === 'object' && res.body !== null && 'ok' in res.body) {
      const apiBody = res.body as TelegramApiResponse;
      if (!apiBody.ok) {
        throw new TelegramTransientError(
          `Telegram returned ok=false: ${apiBody.description ?? 'no description'}`,
          { details: { description: apiBody.description, error_code: apiBody.error_code } },
        );
      }
    }
  }

  private describe(body: unknown): string {
    if (typeof body === 'string') return body;
    try {
      return JSON.stringify(body);
    } catch {
      return '[unserializable]';
    }
  }
}
