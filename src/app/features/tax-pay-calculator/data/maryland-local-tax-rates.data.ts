export interface MarylandLocalTaxBracket {
  upTo: number;
  rate: number;
}

export interface MarylandLocalTaxRule {
  county: string;
  brackets: MarylandLocalTaxBracket[];
}

export const MARYLAND_LOCAL_TAX_RATES_2026: Record<
  string,
  MarylandLocalTaxRule
> = {
  'md-001': {
    county: 'Allegany County',
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-003': {
    county: 'Anne Arundel County',
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-005': {
    county: 'Baltimore County',
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-009': {
    county: 'Calvert County',
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-011': {
    county: 'Caroline County',
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-013': {
    county: 'Carroll County',
    brackets: [{ upTo: Infinity, rate: 0.0303 }],
  },

  'md-015': {
    county: 'Cecil County',
    brackets: [{ upTo: Infinity, rate: 0.0274 }],
  },

  'md-017': {
    county: 'Charles County',
    brackets: [{ upTo: Infinity, rate: 0.0303 }],
  },

  'md-019': {
    county: 'Dorchester County',
    brackets: [{ upTo: Infinity, rate: 0.033 }],
  },

  'md-021': {
    county: 'Frederick County',
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-023': {
    county: 'Garrett County',
    brackets: [{ upTo: Infinity, rate: 0.0265 }],
  },

  'md-025': {
    county: 'Harford County',
    brackets: [{ upTo: Infinity, rate: 0.0306 }],
  },

  'md-027': {
    county: 'Howard County',
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-029': {
    county: 'Kent County',
    brackets: [{ upTo: Infinity, rate: 0.033 }],
  },

  'md-031': {
    county: 'Montgomery County',
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-033': {
    county: "Prince George's County",
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-035': {
    county: "Queen Anne's County",
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-037': {
    county: "St. Mary's County",
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-039': {
    county: 'Somerset County',
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-041': {
    county: 'Talbot County',
    brackets: [{ upTo: Infinity, rate: 0.024 }],
  },

  'md-043': {
    county: 'Washington County',
    brackets: [{ upTo: Infinity, rate: 0.0295 }],
  },

  'md-045': {
    county: 'Wicomico County',
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },

  'md-047': {
    county: 'Worcester County',
    brackets: [{ upTo: Infinity, rate: 0.0225 }],
  },

  'md-510': {
    county: 'Baltimore City',
    brackets: [{ upTo: Infinity, rate: 0.032 }],
  },
};