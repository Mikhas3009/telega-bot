import { ApiProperty } from '@nestjs/swagger';

export class CreateEventResponseDto {
  @ApiProperty({ description: 'Generated event identifier (UUID v4)' })
  eventId!: string;

  @ApiProperty({ description: 'ISO-8601 timestamp when the event was published' })
  publishedAt!: string;
}
