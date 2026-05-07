import { TransientError } from '@app/errors';
import { Injectable } from '@nestjs/common';
import { request, type Dispatcher } from 'undici';

import type {
  HttpClient,
  HttpRequest,
  HttpResponse,
} from '../../application/ports/http-client.port.js';

export class HttpTransportError extends TransientError {}

@Injectable()
export class UndiciHttpClient implements HttpClient {
  async request(req: HttpRequest): Promise<HttpResponse> {
    let res: Dispatcher.ResponseData;
    try {
      res = await request(req.url, {
        method: req.method,
        headers: { 'content-type': 'application/json', ...(req.headers ?? {}) },
        ...(req.body !== undefined ? { body: JSON.stringify(req.body) } : {}),
        ...(req.timeoutMs !== undefined
          ? { bodyTimeout: req.timeoutMs, headersTimeout: req.timeoutMs }
          : {}),
      });
    } catch (error) {
      throw new HttpTransportError(
        `HTTP transport failure for ${req.method} ${req.url}`,
        error instanceof Error ? { cause: error.message } : { details: { error: String(error) } },
      );
    }

    const text = await res.body.text();
    let body: unknown = text;
    if (text.length > 0) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = text;
      }
    }

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(res.headers)) {
      if (typeof value === 'string') headers[key] = value;
      else if (Array.isArray(value)) headers[key] = value.join(', ');
    }

    return { status: res.statusCode, body, headers };
  }
}
