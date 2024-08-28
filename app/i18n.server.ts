import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEN from '../locales/en.default.json';
import translationDE from '../locales/de.json';

const resources = {
  en: {
    translation: translationEN
  },
  de: {
    translation: translationDE
  }
}

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: "en", 
    resources,
    debug: true,
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;