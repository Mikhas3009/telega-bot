import { CorrelationContext } from '@app/logger';
import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';

const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const raw = req.headers[CORRELATION_ID_HEADER];
    const incoming = typeof raw === 'string' ? raw.trim() : undefined;
    const correlationId = incoming !== undefined && incoming.length > 0 ? incoming : uuid();

    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    return CorrelationContext.run({ correlationId }, () => next.handle()) as Observable<unknown>;
  }
}
