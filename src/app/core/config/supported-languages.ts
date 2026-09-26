import { SupportedLanguage } from '../models/supported-language.model';

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    enabled: true,
  },
   {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    enabled: false,
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    enabled: false,
  },


];