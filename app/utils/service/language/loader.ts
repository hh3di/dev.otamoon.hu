import type { Language, Messages } from './types';
import { fallbacklng } from './config';
const locales = import.meta.glob('../../../assets/locales/*.json', {
  import: 'default',
});

export async function loadMessages(lang: Language): Promise<Messages> {
  const path = `../../../assets/locales/${lang}.json`;
  const loader = locales[path];

  if (!loader) {
    if (lang === fallbacklng) {
      console.error(`Missing fallback locale file: ${lang}.json`);
      return {};
    }

    console.warn(`Missing locale file: ${lang}.json, falling back to "${fallbacklng}"`);
    return loadMessages(fallbacklng);
  }

  try {
    return (await loader()) as Messages;
  } catch (err) {
    console.error(`Failed to load locale "${lang}":`, err);
    if (lang === fallbacklng) return {};
    return loadMessages(fallbacklng);
  }
}
