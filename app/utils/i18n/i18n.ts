const i18n = {
  supportedLngs: ['en', 'hu'],
  fallbackLng: 'en',
  debug: false,
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
  react: {
    useSuspense: false,
  },
};

export const getLanguage = (request: Request) => {
  const languageHeader = request.headers.get('Accept-Language'); // e.g. "hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7"
  const cookies = request.headers.get('Cookie');

  // Check cookie first
  const cookieLocale = cookies ? cookies.split('; ').find((row) => row.startsWith('i18next=')) : null;
  const localeFromCookie = cookieLocale ? cookieLocale.split('=')[1] : null;

  let locale = i18n.fallbackLng;

  // If cookie exists and is valid, use it
  if (localeFromCookie && i18n.supportedLngs.includes(localeFromCookie)) {
    locale = localeFromCookie;
  } else {
    // No valid cookie, use browser's PRIMARY language only
    if (languageHeader) {
      const primaryLanguage = languageHeader
        .split(',')[0] // Take only the first (primary) language
        .split(';')[0] // Remove quality values (;q=0.9)
        .trim()
        .toLowerCase()
        .split('-')[0]; // Get just the language part (hu from hu-HU)
      locale = i18n.supportedLngs.includes(primaryLanguage) ? primaryLanguage : i18n.fallbackLng;
    }
  }

  let localeCookie = '';
  if (!localeFromCookie || (localeFromCookie && !i18n.supportedLngs.includes(localeFromCookie))) {
    const cookieExpiration = new Date();
    cookieExpiration.setFullYear(cookieExpiration.getFullYear() + 1);
    localeCookie = `i18next=${locale}; expires=${cookieExpiration.toUTCString()}; path=/; ${
      process.env.NODE_ENV === 'production' ? 'Secure;' : ''
    } SameSite=Lax`;
  }
  return { locale, localeCookie };
};

export default i18n;
