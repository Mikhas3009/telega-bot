import {
  DomainError,
  InfrastructureError,
  PermanentError,
  SchemaValidationError,
  TransientError,
} from '@app/errors';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
  Optional,
} from '@nestjs/common';
import type { Response } from 'express';

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger;

  constructor(@Optional() logger?: Logger) {
    this.logger = logger ?? new Logger(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);

    if (body.statusCode >= 500) {
      this.logger.error(
        { err: this.serializeErr(exception), statusCode: body.statusCode },
        'unhandled exception',
      );
    } else {
      this.logger.warn(
        { err: this.serializeErr(exception), statusCode: body.statusCode },
        'request rejected',
      );
    }

    res.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ErrorResponseBody {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : ((response as { message?: string | string[] }).message ?? exception.message);
      return {
        statusCode: status,
        error: exception.name,
        message: Array.isArray(message) ? message.join(', ') : message,
      };
    }
    if (exception instanceof SchemaValidationError) {
      return this.fromError(exception, 400);
    }
    if (exception instanceof DomainError) {
      return this.fromError(exception, 400);
    }
    if (exception instanceof TransientError) {
      return this.fromError(exception, 503);
    }
    if (exception instanceof PermanentError || exception instanceof InfrastructureError) {
      return this.fromError(exception, 500);
    }
    if (exception instanceof Error) {
      return { statusCode: 500, error: exception.name, message: exception.message };
    }
    return { statusCode: 500, error: 'UnknownError', message: 'Unknown error' };
  }

  private fromError(err: DomainError | InfrastructureError, statusCode: number): ErrorResponseBody {
    const body: ErrorResponseBody = {
      statusCode,
      error: err.name,
      message: err.message,
    };
    if (Object.keys(err.details).length > 0) {
      body.details = { ...err.details };
    }
    return body;
  }

  private serializeErr(exception: unknown): Record<string, unknown> {
    if (exception instanceof Error) {
      return { name: exception.name, message: exception.message };
    }
    return { error: String(exception) };
  }
}
