// src/lib/i18n/index.ts
import en from './en.json';
import fr from './fr.json';

type Language = 'en' | 'fr';
type Translations = typeof en;

const translations: Record<Language, Translations> = {
  en,
  fr,
};

export function getTranslation(lang: Language): Translations {
  return translations[lang] || en; // Default to English
}

// Helper to get nested translation strings with optional replacements
export function t(lang: Language, key: string, replacements?: Record<string, string | number>): string {
  const currentTranslations = getTranslation(lang);
  const keys = key.split('.');
  let result: any = currentTranslations;
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key; // Return key if not found
    }
  }
  let translatedString = typeof result === 'string' ? result : key;

  if (replacements) {
    for (const placeholder in replacements) {
      translatedString = translatedString.replace(`{${placeholder}}`, String(replacements[placeholder]));
    }
  }

  return translatedString;
}