import type { MessageBus, PublishOptions } from '@app/messaging';

export interface RecordedMessage {
  options: PublishOptions;
  body: Buffer;
  envelope: Record<string, unknown>;
}

export class InMemoryMessageBus implements MessageBus {
  public readonly published: RecordedMessage[] = [];

  publish(options: PublishOptions, body: Buffer): Promise<void> {
    const envelope = JSON.parse(body.toString('utf8')) as Record<string, unknown>;
    this.published.push({ options, body, envelope });
    return Promise.resolve();
  }

  reset(): void {
    this.published.length = 0;
  }
}
