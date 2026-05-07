import type { Envelope } from '@app/contracts';

export interface IncomingMessage {
  raw: Buffer;
  routingKey: string;
  headers: Record<string, unknown>;
  redelivered: boolean;
}

export interface MessageContext {
  message: IncomingMessage;
  envelope?: Envelope<unknown>;
  attempt: number;
  startedAt: number;
}

export type Next = () => Promise<void>;

export interface ConsumerMiddleware {
  readonly name: string;
  handle(ctx: MessageContext, next: Next): Promise<void>;
}
