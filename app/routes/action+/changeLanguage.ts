import type { ActionFunction } from 'react-router';
import { data } from 'react-router';
import i18n, { getLanguage } from '~/utils/i18n/i18n';
import createI18nInstance from '~/utils/i18n/i18next.server';
import { dataWithToast } from '~/utils/service/session.service';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const language = formData.get('language') as string;

  if (!language || !i18n.supportedLngs.includes(language)) {
    return data(null);
  }
  const { t } = await createI18nInstance(language);
  const cookieExpiration = new Date();
  cookieExpiration.setFullYear(cookieExpiration.getFullYear() + 1);

  const cookie = `i18next=${language}; expires=${cookieExpiration.toUTCString()}; path=/; ${
    process.env.NODE_ENV === 'production' ? 'Secure;' : ''
  } SameSite=Lax`;

  return dataWithToast(null, { type: 'success', message: t('languageChangedSuccessfully') }, cookie);
};
