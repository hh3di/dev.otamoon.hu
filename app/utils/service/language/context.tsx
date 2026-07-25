import { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react';

import type { Language, Messages } from './types';

import { createTranslator } from './translator';

import { loadMessages } from './loader';

type LanguageContextType = {
  language: Language;
  messages: Messages;

  t: (key: string, params?: Record<string, string | number>) => string;

  changeLanguage: (lang: Language) => Promise<void>;

  isChanging: boolean;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
  language: initialLanguage,
  messages: initialMessages,
}: {
  children: React.ReactNode;
  language: Language;
  messages: Messages;
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [messages, setMessages] = useState<Messages>(initialMessages);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useMemo(() => createTranslator(messages), [messages]);
  const requestIdRef = useRef(0);

  async function changeLanguage(lang: Language) {
    if (lang === language) return;

    const requestId = ++requestIdRef.current;
    setIsChanging(true);

    try {
      const newMessages = await loadMessages(lang);
      if (requestId === requestIdRef.current) {
        setLanguage(lang);
        setMessages(newMessages);
        document.cookie = `lang=${lang};path=/;max-age=31536000;SameSite=Lax`;
      }
    } catch (err) {
      console.error(`Nem sikerült betölteni a(z) "${lang}" nyelvet:`, err);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsChanging(false);
      }
    }
  }

  const value = useMemo<LanguageContextType>(() => ({ language, messages, t, changeLanguage, isChanging }), [language, messages, t, isChanging]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}
