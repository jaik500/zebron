import { SupportedLanguage } from './supported-language.model';


export interface LocalizationConfig {
  defaultLanguage: string;
  supportedLanguages: SupportedLanguage[];
  allowUserLanguageSelection: boolean;
}
