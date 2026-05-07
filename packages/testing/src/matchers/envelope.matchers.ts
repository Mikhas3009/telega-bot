import type { RecordedMessage } from '../fakes/in-memory-message-bus.js';

export const findPublishedByEventName = (
  messages: readonly RecordedMessage[],
  eventName: string,
): RecordedMessage | undefined =>
  messages.find((m) => (m.envelope.eventName as string | undefined) === eventName);

export const expectPublishedOnce = (
  messages: readonly RecordedMessage[],
  eventName: string,
): RecordedMessage => {
  const matches = messages.filter((m) => m.envelope.eventName === eventName);
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly 1 published message for ${eventName}, got ${String(matches.length)}`,
    );
  }
  return matches[0];
};
