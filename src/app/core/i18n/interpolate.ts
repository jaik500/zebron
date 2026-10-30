export type TranslationParams = Record<string, unknown> | unknown[];

/** Replaces {name} / {0} placeholders. Unknown placeholders are left as is. */
export function interpolate(text: string, params: TranslationParams): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = Array.isArray(params) ? params[Number(name)] : (params as Record<string, unknown>)[name];
    return value === undefined || value === null ? match : String(value);
  });
}
