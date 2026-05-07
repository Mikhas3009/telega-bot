import { DomainError, SchemaValidationError, TransientError } from '@app/errors';
import { type ArgumentsHost, BadRequestException, type Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { GlobalExceptionFilter } from './global-exception.filter.js';

class TestDomainError extends DomainError {
  constructor() {
    super('not allowed', { reason: 'forbidden' });
  }
}

class TestTransient extends TransientError {}

interface CapturedResponse {
  status: number;
  payload: unknown;
}

const buildHost = (): { host: ArgumentsHost; captured: CapturedResponse } => {
  const captured: CapturedResponse = { status: 0, payload: undefined };
  const json = vi.fn((p: unknown) => {
    captured.payload = p;
  });
  const status = vi.fn((s: number) => {
    captured.status = s;
    return { json };
  });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ headers: {} }),
    }),
  } as unknown as ArgumentsHost;
  return { host, captured };
};

const fakeLogger = (): Logger =>
  ({
    error: vi.fn(),
    warn: vi.fn(),
  }) as unknown as Logger;

describe('GlobalExceptionFilter', () => {
  it('maps NestJS BadRequestException to 400 with structured body', () => {
    const probe = buildHost();
    const filter = new GlobalExceptionFilter(fakeLogger());
    filter.catch(new BadRequestException(['payload must be an object']), probe.host);
    expect(probe.captured.status).toBe(400);
    expect(probe.captured.payload).toMatchObject({ error: 'BadRequestException', statusCode: 400 });
  });

  it('maps DomainError to 400 with details', () => {
    const probe = buildHost();
    const filter = new GlobalExceptionFilter(fakeLogger());
    filter.catch(new TestDomainError(), probe.host);
    expect(probe.captured.status).toBe(400);
    expect(probe.captured.payload).toMatchObject({
      error: 'TestDomainError',
      statusCode: 400,
      details: { reason: 'forbidden' },
    });
  });

  it('maps SchemaValidationError to 400', () => {
    const probe = buildHost();
    const filter = new GlobalExceptionFilter(fakeLogger());
    filter.catch(new SchemaValidationError('bad'), probe.host);
    expect(probe.captured.status).toBe(400);
  });

  it('maps TransientError to 503', () => {
    const probe = buildHost();
    const filter = new GlobalExceptionFilter(fakeLogger());
    filter.catch(new TestTransient('broker down'), probe.host);
    expect(probe.captured.status).toBe(503);
  });

  it('maps unknown errors to 500', () => {
    const probe = buildHost();
    const filter = new GlobalExceptionFilter(fakeLogger());
    filter.catch(new Error('boom'), probe.host);
    expect(probe.captured.status).toBe(500);
  });
});
