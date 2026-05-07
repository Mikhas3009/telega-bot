import { TemplateError } from '../../application/domain/notification.errors.js';
import type { TemplateRenderer } from '../../application/ports/template-renderer.port.js';

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export class StringTemplateRenderer implements TemplateRenderer {
  private readonly templates: Readonly<Record<string, string>>;

  constructor(templates: Record<string, string>) {
    this.templates = { ...templates };
  }

  render(template: string, variables: Record<string, string>): string {
    const source = (this.templates as Record<string, string | undefined>)[template];
    if (source === undefined) {
      throw new TemplateError(`Unknown template: ${template}`, { template });
    }
    return source.replace(PLACEHOLDER, (_match, key: string) => {
      const value = (variables as Record<string, string | undefined>)[key];
      if (value === undefined) {
        throw new TemplateError(`Missing variable ${key} for template ${template}`, {
          template,
          variable: key,
        });
      }
      return value;
    });
  }
}
