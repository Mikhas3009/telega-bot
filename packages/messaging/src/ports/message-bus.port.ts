export interface PublishOptions {
  exchange: string;
  routingKey: string;
  headers?: Record<string, string>;
  messageId?: string;
  correlationId?: string;
  timestamp?: number;
}

export interface MessageBus {
  publish(options: PublishOptions, body: Buffer): Promise<void>;
}

export const MESSAGE_BUS = Symbol('MessageBus');
