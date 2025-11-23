import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-fetch-backend';
import i18n from './i18n';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const createI18nInstance = async (lng: string) => {
  const instance = createInstance();

  // Load translations manually
  const translationPath = join(process.cwd(), 'public', 'locales', `${lng}.json`);
  let translations = {};
  try {
    const translationContent = readFileSync(translationPath, 'utf8');
    translations = JSON.parse(translationContent);
  } catch (error) {
    console.warn(`Could not load translations for ${lng}:`, error);
  }

  await instance
    .use(initReactI18next)
    .use(Backend)
    .init({
      ...i18n,
      lng,
      resources: {
        [lng]: {
          translation: translations,
        },
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return instance;
};

export default createI18nInstance;
