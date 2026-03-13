'use client';

import { useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';

export function useTranslation() {
  const [lang, setLang] = useState<Language>('tj');

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang) setLang(savedLang);
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    window.location.reload(); // Reload to apply changes globally
  };

  const t = translations[lang];

  return { t, lang, changeLanguage };
}
