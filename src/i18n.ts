// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            hello: "Hello",
            welcome: "Welcome",
            guess: "Guess",
            guessCounty: "Guess a county",
            seeCorrectGuesses: "See your correct guesses",
            welcomeMessage: "Welcome to County Guess, choose your language and start guessing!"
        }
    },
    ga: {
        translation: {
            hello: "Dia duit",
            welcome: "Fáilte",
            guess: "Buille faoi thuairim",
            guessCounty: "Buille faoi thuairim contae",
            seeCorrectGuesses: "Féach ar do thuairimí cearta",
            welcomeMessage: "Fáilte go Contae Buille faoi thuairim, roghnaigh do theanga agus cuir tús le buille faoi thuairim!"

        }
    }
};

i18n.use(initReactI18next).init({
    resources,
    lng: "en",  // Default language
    fallbackLng: "en",  // Fallback language if a translation is missing
    interpolation: {
        escapeValue: false, // React already escapes HTML
    },
});

export default i18n;
