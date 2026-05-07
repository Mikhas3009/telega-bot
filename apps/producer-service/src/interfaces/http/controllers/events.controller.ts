import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PublishEventUseCase } from '../../../application/use-cases/publish-event.use-case.js';
import { CreateEventDto } from '../dto/create-event.dto.js';
import { CreateEventResponseDto } from '../dto/create-event.response.dto.js';

@ApiTags('events')
@Controller('events')
export class EventsController {
  private readonly useCase: PublishEventUseCase;

  constructor(useCase: PublishEventUseCase) {
    this.useCase = useCase;
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Publish a domain event to the broker' })
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: CreateEventResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid payload' })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE, description: 'Broker unavailable' })
  async create(@Body() body: CreateEventDto): Promise<CreateEventResponseDto> {
    const result = await this.useCase.execute({
      type: body.type,
      payload: body.payload,
      ...(body.correlationId !== undefined ? { correlationId: body.correlationId } : {}),
    });
    return { eventId: result.eventId, publishedAt: result.publishedAt };
  }
}
