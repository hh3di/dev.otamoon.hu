import type { Messages } from './types';

function resolveMessage(messages: Messages, key: string): string | undefined {
  // A kulcs pontok mentén darabolva navigál végig a beágyazott objektumon,
  // pl. "error.notfound.title" -> messages.error.notfound.title
  const parts = key.split('.');

  let current: string | Messages | undefined = messages;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === 'string' ? current : undefined;
}

export function createTranslator(messages: Messages) {
  return (key: string, params?: Record<string, string | number>) => {
    const resolved = resolveMessage(messages, key);

    if (resolved === undefined) {
      if (import.meta.env?.DEV) {
        console.warn(`[MoonLocale] Missing translation key: "${key}"`);
      }
    }

    let text = resolved ?? key;

    if (params) {
      for (const [paramKey, value] of Object.entries(params)) {
        text = text.replaceAll(`{${paramKey}}`, String(value));
      }
    }

    return text;
  };
}
