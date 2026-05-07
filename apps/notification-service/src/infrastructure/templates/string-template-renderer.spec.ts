import { describe, expect, it } from 'vitest';

import { TemplateError } from '../../application/domain/notification.errors.js';

import { StringTemplateRenderer } from './string-template-renderer.js';

describe('StringTemplateRenderer', () => {
  it('renders a known template with variables', () => {
    const renderer = new StringTemplateRenderer({
      'user-welcome': 'Welcome {{email}}!',
    });

    expect(renderer.render('user-welcome', { email: 'a@b.co' })).toBe('Welcome a@b.co!');
  });

  it('throws TemplateError for unknown template', () => {
    const renderer = new StringTemplateRenderer({ 'user-welcome': 'hi' });
    expect(() => renderer.render('missing', {})).toThrow(TemplateError);
  });

  it('throws TemplateError when a variable is missing', () => {
    const renderer = new StringTemplateRenderer({
      'user-welcome': 'Hello {{name}}',
    });
    expect(() => renderer.render('user-welcome', {})).toThrow(TemplateError);
  });

  it('leaves unrelated braces alone', () => {
    const renderer = new StringTemplateRenderer({ x: '{ literal }' });
    expect(renderer.render('x', {})).toBe('{ literal }');
  });
});
