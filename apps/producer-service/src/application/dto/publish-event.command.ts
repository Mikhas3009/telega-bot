export interface PublishEventCommand {
  type: string;
  payload: Record<string, unknown>;
  correlationId?: string;
}
