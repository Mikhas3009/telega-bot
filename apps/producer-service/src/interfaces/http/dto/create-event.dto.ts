import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsUUID } from 'class-validator';

import { EventTypes, type EventType } from '../../../domain/events/event-type.js';

export class CreateEventDto {
  @ApiProperty({
    enum: EventTypes,
    description: 'Domain event type',
    example: 'USER_REGISTERED',
  })
  @IsIn(EventTypes)
  type!: EventType;

  @ApiProperty({
    description: 'Event payload (shape depends on `type`)',
    example: {
      userId: '00000000-0000-4000-8000-000000000000',
      email: 'user@example.com',
      registeredAt: '2026-05-04T12:00:00.000Z',
    },
  })
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiProperty({
    required: false,
    description: 'Optional caller-provided correlation id (UUID v4)',
  })
  @IsOptional()
  @IsUUID('4')
  correlationId?: string;
}
