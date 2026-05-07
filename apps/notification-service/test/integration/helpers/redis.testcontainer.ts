import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';

export interface StartedRedis {
  container: StartedRedisContainer;
  url: string;
  stop(): Promise<unknown>;
}

export const startRedis = async (): Promise<StartedRedis> => {
  const container = await new RedisContainer('redis:7.4-alpine').start();
  return {
    container,
    url: container.getConnectionUrl(),
    stop: () => container.stop(),
  };
};
