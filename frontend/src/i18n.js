import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import ja from './locales/ja.json';

// Determine default locale
const savedLocale = localStorage.getItem('user_locale');
// Optional: Check browser language if no preference saved
// const browserLocale = navigator.language.split('-')[0];
// const defaultLocale = savedLocale || (['en', 'ja'].includes(browserLocale) ? browserLocale : 'en');
const defaultLocale = savedLocale || 'en';

const i18n = createI18n({
    legacy: false, // Use Composition API mode
    locale: defaultLocale,
    fallbackLocale: 'en',
    globalInjection: true,
    messages: {
        en,
        ja
    }
});

export default i18n;
