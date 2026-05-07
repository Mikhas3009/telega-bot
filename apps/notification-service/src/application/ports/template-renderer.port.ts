export interface TemplateRenderer {
  render(template: string, variables: Record<string, string>): string;
}

export const TEMPLATE_RENDERER = Symbol('TEMPLATE_RENDERER');
