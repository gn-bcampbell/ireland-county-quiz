// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      hello: "Hello",
      welcome: "Welcome",
      guess: "Guess",
      guessCounty: "Guess a county",
      seeCorrectGuesses: "See your correct guesses",
      welcomeMessage:
        "Welcome to County Guess, choose your language and start guessing!",
      areYouSure: "Are you sure?",
      clearList: "Clear List",
      thisWillResetYourProgress: "This will reset your progress",
    },
  },
  ga: {
    translation: {
      hello: "Dia duit",
      welcome: "Fáilte",
      guess: "Meas",
      guessCounty: "Smaoinigh ar an contae",
      seeCorrectGuesses: "Taispeáin na measa cearta",
      welcomeMessage:
        "Fáilte go Smaoinigh ar an contae, roghnaigh do theanga agus tosaigh ag meas!",
      supportForFadasIncoming:
        "*tacaíocht don síneadh fada atá ag teacht go luath",
      areYouSure: "An bhfuil tú cinnte?",
      clearList: "Tosaigh arís",
      thisWillResetYourProgress: "Athshocróidh sé seo do dhul chun cinn",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // Default language
  fallbackLng: "en", // Fallback language if a translation is missing
  interpolation: {
    escapeValue: false, // React already escapes HTML
  },
});

export default i18n;
