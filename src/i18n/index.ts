import { en, type MessageKey } from './en';

export type { MessageKey };

/**
 * Look up interface text and substitute `{name}` placeholders.
 * An unknown key is returned as-is so a missing string is visible, not silent.
 */
export function t(key: string, vars: Readonly<Record<string, string | number>> = {}): string {
  const template: string = (en as Readonly<Record<string, string>>)[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
