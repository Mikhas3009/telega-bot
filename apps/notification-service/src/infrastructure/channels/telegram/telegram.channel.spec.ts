import { FakeHttpClient } from '@app/testing';
import { describe, expect, it } from 'vitest';

import {
  NonRetryableNotificationError,
  TelegramTransientError,
} from '../../../application/domain/notification.errors.js';
import type { HttpClient } from '../../../application/ports/http-client.port.js';

import { TelegramChannel } from './telegram.channel.js';

const buildChannel = (httpClient: FakeHttpClient): TelegramChannel =>
  new TelegramChannel(httpClient as unknown as HttpClient, {
    baseUrl: 'https://api.telegram.org',
    botToken: 'TEST_TOKEN',
    timeoutMs: 1_000,
  });

describe('TelegramChannel', () => {
  it('POSTs to /bot<token>/sendMessage with chat_id and text', async () => {
    const http = new FakeHttpClient();
    http.enqueue({ status: 200, body: { ok: true, result: { message_id: 1 } }, headers: {} });
    const channel = buildChannel(http);

    await channel.send({
      channel: 'telegram',
      recipient: { chatId: '1234' },
      body: 'hello',
    });

    expect(http.requests).toHaveLength(1);
    const req = (http.requests as ((typeof http.requests)[number] | undefined)[])[0];
    expect(req?.method).toBe('POST');
    expect(req?.url).toBe('https://api.telegram.org/botTEST_TOKEN/sendMessage');
    expect(req?.body).toEqual({ chat_id: '1234', text: 'hello' });
  });

  it('throws TelegramTransientError on 5xx', async () => {
    const http = new FakeHttpClient();
    http.enqueue({ status: 502, body: 'bad gateway', headers: {} });
    const channel = buildChannel(http);

    await expect(
      channel.send({ channel: 'telegram', recipient: { chatId: '1' }, body: 'x' }),
    ).rejects.toBeInstanceOf(TelegramTransientError);
  });

  it('throws NonRetryableNotificationError on 4xx', async () => {
    const http = new FakeHttpClient();
    http.enqueue({
      status: 403,
      body: { ok: false, description: 'bot was blocked by the user' },
      headers: {},
    });
    const channel = buildChannel(http);

    await expect(
      channel.send({ channel: 'telegram', recipient: { chatId: '1' }, body: 'x' }),
    ).rejects.toBeInstanceOf(NonRetryableNotificationError);
  });

  it('throws TelegramTransientError on non-OK 200 (Telegram returns ok: false)', async () => {
    const http = new FakeHttpClient();
    http.enqueue({ status: 200, body: { ok: false, description: 'internal' }, headers: {} });
    const channel = buildChannel(http);

    await expect(
      channel.send({ channel: 'telegram', recipient: { chatId: '1' }, body: 'x' }),
    ).rejects.toBeInstanceOf(TelegramTransientError);
  });

  it('reports kind = "telegram"', () => {
    expect(buildChannel(new FakeHttpClient()).kind).toBe('telegram');
  });
});
