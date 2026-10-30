import { Pipe, PipeTransform, inject } from '@angular/core';

import { I18nService, type TranslationParams } from './i18n.service';

/**
 * {{ 'Save' | t }}  ·  {{ 'Hello {name}' | t: { name: user.name } }}
 *
 * Impure so the text updates the moment the language changes; the work
 * per call is a single dictionary lookup.
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  /**
   * Accepts any value so templates can pass labels that are typed as
   * numbers, unions or optional values. Only text is translated; other
   * values are shown as they would be without the pipe.
   */
  transform(text: unknown, params?: TranslationParams): string {
    if (text === null || text === undefined || text === '') return '';
    if (typeof text !== 'string') return String(text);
    return this.i18n.t(text, params);
  }
}
