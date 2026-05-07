import type { z } from 'zod';

export class ConfigValidationError extends Error {
  public readonly issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    const message = issues
      .map((i) => `  - ${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('\n');
    super(`Invalid configuration:\n${message}`);
    this.name = 'ConfigValidationError';
    this.issues = issues;
  }
}

export const loadConfig = <T extends z.ZodTypeAny>(
  schema: T,
  source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): z.infer<T> => {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new ConfigValidationError(result.error.issues);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result.data;
};
