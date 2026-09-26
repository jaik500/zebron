export type LanguageDirection = 'ltr' | 'rtl';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  direction: LanguageDirection;
  enabled: boolean;
}