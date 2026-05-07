import { UserRegisteredV1 } from '@app/contracts';
import type { EventPublisher } from '@app/messaging';
import { describe, expect, it, vi } from 'vitest';

import { UnknownEventTypeError } from '../../domain/events/event-type.js';

import { PublishEventUseCase } from './publish-event.use-case.js';

describe('PublishEventUseCase', () => {
  const validPayload = {
    userId: '00000000-0000-4000-8000-000000000000',
    email: 'a@b.co',
    registeredAt: '2026-05-04T12:00:00.000Z',
  };

  it('resolves the event definition by type and forwards payload to the publisher', async () => {
    const publishMock = vi.fn<EventPublisher['publish']>().mockResolvedValue({
      eventId: 'e-1',
      publishedAt: 't',
    });
    const publisher: EventPublisher = { publish: publishMock };
    const useCase = new PublishEventUseCase(publisher);

    const result = await useCase.execute({ type: 'USER_REGISTERED', payload: validPayload });

    expect(result).toEqual({ eventId: 'e-1', publishedAt: 't' });
    expect(publishMock).toHaveBeenCalledOnce();
    expect(publishMock).toHaveBeenCalledWith(UserRegisteredV1, validPayload, undefined);
  });

  it('passes correlationId override to the publisher when provided', async () => {
    const publishMock = vi.fn<EventPublisher['publish']>().mockResolvedValue({
      eventId: 'e-1',
      publishedAt: 't',
    });
    const useCase = new PublishEventUseCase({ publish: publishMock });

    await useCase.execute({
      type: 'USER_REGISTERED',
      payload: validPayload,
      correlationId: '11111111-1111-4111-8111-111111111111',
    });

    expect(publishMock).toHaveBeenCalledWith(UserRegisteredV1, validPayload, {
      correlationId: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('throws UnknownEventTypeError on unsupported type', async () => {
    const publishMock = vi.fn<EventPublisher['publish']>();
    const useCase = new PublishEventUseCase({ publish: publishMock });

    await expect(useCase.execute({ type: 'UNKNOWN', payload: {} })).rejects.toBeInstanceOf(
      UnknownEventTypeError,
    );
    expect(publishMock).not.toHaveBeenCalled();
  });
});
