import type { ConsumerMiddleware, MessageContext } from './middleware.types.js';

export type Handler = (ctx: MessageContext) => Promise<void>;

export const runPipeline = async (
  middlewares: readonly ConsumerMiddleware[],
  handler: Handler,
  ctx: MessageContext,
): Promise<void> => {
  const dispatch = async (i: number): Promise<void> => {
    if (i === middlewares.length) {
      await handler(ctx);
      return;
    }
    await middlewares[i].handle(ctx, () => dispatch(i + 1));
  };
  await dispatch(0);
};
