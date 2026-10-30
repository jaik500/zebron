/**
 * French translations, keyed by the English text.
 *
 * Loaded on demand when French is selected (see I18nService).
 * One file per area keeps reviews manageable.
 */
import { FR_COMMON } from './common';
import { FR_ONBOARDING } from './onboarding';
import { FR_PARTNER } from './partner';
import { FR_TEST_CENTER } from './test-center';

export const FRENCH: Readonly<Record<string, string>> = {
  ...FR_COMMON,
  ...FR_ONBOARDING,
  ...FR_PARTNER,
  ...FR_TEST_CENTER,
};
