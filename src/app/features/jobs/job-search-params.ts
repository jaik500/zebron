import { Params } from '@angular/router';

/** Category slugs used by the Job Finder questions, as job category names. */
const CATEGORY_NAMES: Record<string, string> = {
  technology: 'Technology & IT',
  healthcare: 'Healthcare',
  business: 'Business & Finance',
  'skilled-trades': 'Skilled Trades',
  administrative: 'Administrative',
  'customer-service': 'Customer Service',
};

/**
 * Job board filters (/jobs?q=&location=&category=&type=&arrangement=) from
 * the Job Finder's answers (type = category slug, location, preference).
 * Used by the Job Finder and by the redirect from the old
 * /find/job/results page, so old links keep their search.
 */
export function legacyJobSearch(params: Params): Params {
  const result: Params = {};
  const category = String(params['type'] ?? '').trim();
  const location = String(params['location'] ?? '').trim();
  const preference = String(params['preference'] ?? '').trim();

  if (category && category !== 'any') {
    result['category'] = CATEGORY_NAMES[category] ?? category;
  }
  if (location) {
    result['location'] = location;
  }
  if (preference === 'full-time' || preference === 'part-time') {
    result['type'] = preference;
  } else if (preference === 'remote') {
    result['arrangement'] = 'remote';
  }
  return result;
}
