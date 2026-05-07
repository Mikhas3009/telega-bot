import { AsyncLocalStorage } from 'node:async_hooks';

export interface CorrelationStore {
  correlationId: string;
  causationId?: string;
}

const storage = new AsyncLocalStorage<CorrelationStore>();

export const CorrelationContext = {
  run<T>(store: CorrelationStore, fn: () => Promise<T> | T): Promise<T> | T {
    return storage.run(store, fn);
  },
  current(): CorrelationStore | undefined {
    return storage.getStore();
  },
} as const;
