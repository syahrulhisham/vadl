import { en, type MessageKey } from './en';

export type { MessageKey };

const messages: Readonly<Record<string, string>> = en;

/** True when the language file has text for this key. */
export function hasMessage(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(messages, key);
}

/**
 * Look up interface text and substitute `{name}` placeholders.
 * An unknown key is returned as-is so a missing string is visible, not silent.
 */
export function t(key: string, vars: Readonly<Record<string, string | number>> = {}): string {
  const template = hasMessage(key) ? (messages[key] as string) : key;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
