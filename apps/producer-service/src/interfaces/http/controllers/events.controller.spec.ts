import { describe, expect, it, vi } from 'vitest';

import type { PublishEventUseCase } from '../../../application/use-cases/publish-event.use-case.js';
import { CreateEventDto } from '../dto/create-event.dto.js';

import { EventsController } from './events.controller.js';

describe('EventsController', () => {
  it('returns the use-case result on POST /events', async () => {
    const execute = vi.fn().mockResolvedValue({ eventId: 'e-1', publishedAt: 't' });
    const controller = new EventsController({ execute } as unknown as PublishEventUseCase);
    const dto = Object.assign(new CreateEventDto(), {
      type: 'USER_REGISTERED' as const,
      payload: {
        userId: '00000000-0000-4000-8000-000000000000',
        email: 'a@b.co',
        registeredAt: '2026-05-04T12:00:00.000Z',
      },
    });

    const result = await controller.create(dto);

    expect(result).toEqual({ eventId: 'e-1', publishedAt: 't' });
    expect(execute).toHaveBeenCalledWith({
      type: 'USER_REGISTERED',
      payload: dto.payload,
    });
  });

  it('forwards correlationId override when present in DTO', async () => {
    const execute = vi.fn().mockResolvedValue({ eventId: 'e', publishedAt: 't' });
    const controller = new EventsController({ execute } as unknown as PublishEventUseCase);
    const dto = Object.assign(new CreateEventDto(), {
      type: 'USER_REGISTERED' as const,
      payload: { userId: 'x', email: 'a@b.co', registeredAt: 't' },
      correlationId: '11111111-1111-4111-8111-111111111111',
    });

    await controller.create(dto);

    expect(execute).toHaveBeenCalledWith({
      type: 'USER_REGISTERED',
      payload: dto.payload,
      correlationId: '11111111-1111-4111-8111-111111111111',
    });
  });
});
