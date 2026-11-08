/**
 * Resource kinds: how a resource page presents itself and which ways of
 * getting help it puts first, decided from the resource's category.
 *
 * A category matches the first kind whose keywords appear in its slug or
 * name, so new categories such as "Legal aid" or "Food pantries" pick the
 * right kind without code changes. Anything else is "general".
 */

export type ResourceKind =
  | 'bootcamp'
  | 'education'
  | 'employment'
  | 'legal'
  | 'health'
  | 'housing'
  | 'food'
  | 'business'
  | 'government'
  | 'general';

/** The ways a visitor can act on a resource (the "request types"). */
export type ResourceActionType = 'apply' | 'website' | 'call' | 'email' | 'directions' | 'appointment';

export interface ResourceKindConfig {
  kind: ResourceKind;
  /** Material icon shown in the page header. */
  icon: string;
  /** Header tint: Tailwind classes for the icon tile. */
  tint: string;
  /** Wording of the "how to get this help" card. */
  actionsTitle: string;
  /** Label of the website action when it is the main way in. */
  websiteLabel: string;
  /** Order in which the available ways to get help are offered. */
  actionOrder: ResourceActionType[];
  /** Short practical checklist shown before contacting the provider. */
  tips: string[];
  keywords: string[];
}

const KINDS: ResourceKindConfig[] = [
  {
    kind: 'bootcamp',
    icon: 'rocket_launch',
    tint: 'bg-indigo-50 text-indigo-700',
    actionsTitle: 'Apply or ask a question',
    websiteLabel: 'Visit the bootcamp',
    actionOrder: ['apply', 'website', 'email', 'call', 'directions', 'appointment'],
    tips: [
      'Ask about the total cost, payment plans and free or grant-funded seats (WIOA, employer sponsorship).',
      'Ask what share of graduates found a job in the field, and how recent that figure is.',
      'Check the schedule fits your work hours, and what equipment you need.',
      'Many programs have an entry test: our free courses and Test Center can help you prepare.',
    ],
    keywords: ['bootcamp', 'coding'],
  },
  {
    kind: 'education',
    icon: 'school',
    tint: 'bg-sky-50 text-sky-700',
    actionsTitle: 'Enroll or ask a question',
    websiteLabel: 'Visit the website',
    actionOrder: ['website', 'call', 'email', 'directions', 'appointment'],
    tips: [
      'Ask about placement tests, class times and whether classes are free.',
      'Bring an ID and, when you have them, school records or diplomas.',
    ],
    keywords: ['education', 'language', 'esl', 'english', 'training', 'school', 'literacy'],
  },
  {
    kind: 'employment',
    icon: 'work',
    tint: 'bg-emerald-50 text-emerald-700',
    actionsTitle: 'Get job help',
    websiteLabel: 'Visit the website',
    actionOrder: ['website', 'call', 'email', 'appointment', 'directions'],
    tips: [
      'Have your resume ready, even a simple one, and a list of jobs you have done.',
      'Ask whether they help with interviews, credentials from abroad and work permits.',
    ],
    keywords: ['employment', 'job', 'career', 'workforce'],
  },
  {
    kind: 'legal',
    icon: 'gavel',
    tint: 'bg-amber-50 text-amber-800',
    actionsTitle: 'Get legal help',
    websiteLabel: 'Visit the website',
    actionOrder: ['call', 'appointment', 'email', 'website', 'directions'],
    tips: [
      'Call first: many legal services need an appointment and check eligibility by phone.',
      'Keep copies of your passport, notices and any forms you received.',
      'Only use a licensed attorney or an accredited representative for immigration advice.',
    ],
    keywords: ['legal', 'immigration', 'law', 'attorney', 'asylum', 'citizenship'],
  },
  {
    kind: 'health',
    icon: 'medical_services',
    tint: 'bg-rose-50 text-rose-700',
    actionsTitle: 'Get care',
    websiteLabel: 'Visit the website',
    actionOrder: ['call', 'appointment', 'directions', 'website', 'email'],
    tips: [
      'In an emergency, call 911.',
      'Ask whether they see patients without insurance and if fees depend on income.',
      'Bring an ID and a list of the medicines you take.',
    ],
    keywords: ['health', 'medical', 'clinic', 'dental', 'mental'],
  },
  {
    kind: 'housing',
    icon: 'home',
    tint: 'bg-orange-50 text-orange-700',
    actionsTitle: 'Get housing help',
    websiteLabel: 'Visit the website',
    actionOrder: ['call', 'website', 'email', 'directions', 'appointment'],
    tips: [
      'Ask how long the wait list is and what makes you eligible.',
      'Have proof of income and ID ready; rental help often needs both.',
    ],
    keywords: ['housing', 'shelter', 'rent', 'home'],
  },
  {
    kind: 'food',
    icon: 'restaurant',
    tint: 'bg-lime-50 text-lime-800',
    actionsTitle: 'Get food help',
    websiteLabel: 'Visit the website',
    actionOrder: ['directions', 'call', 'website', 'email', 'appointment'],
    tips: ['Check the opening hours before you go.', 'Bring bags; some pantries ask for proof of address.'],
    keywords: ['food', 'pantry', 'meal', 'nutrition'],
  },
  {
    kind: 'business',
    icon: 'storefront',
    tint: 'bg-violet-50 text-violet-700',
    actionsTitle: 'Get business help',
    websiteLabel: 'Visit the website',
    actionOrder: ['website', 'appointment', 'email', 'call', 'directions'],
    tips: ['Have a short description of your business idea or company ready.', 'Ask whether advising is free and if they help with loans and licences.'],
    keywords: ['business', 'entrepreneur', 'startup', 'small business'],
  },
  {
    kind: 'government',
    icon: 'account_balance',
    tint: 'bg-slate-100 text-slate-700',
    actionsTitle: 'Contact the office',
    websiteLabel: 'Visit the official site',
    actionOrder: ['website', 'call', 'directions', 'appointment', 'email'],
    tips: ['Use the official .gov website; you never pay for government forms.', 'Many offices need an appointment: check before you go.'],
    keywords: ['government', 'public', 'benefit'],
  },
];

const GENERAL: ResourceKindConfig = {
  kind: 'general',
  icon: 'volunteer_activism',
  tint: 'bg-[#E8F4F4] text-[#007979]',
  actionsTitle: 'Get this help',
  websiteLabel: 'Visit the website',
  actionOrder: ['website', 'call', 'email', 'directions', 'appointment', 'apply'],
  tips: [],
  keywords: [],
};

/** The kind of a resource, from its category slug and name. */
export function resourceKind(category: { slug?: string; name?: string } | null | undefined): ResourceKindConfig {
  const text = `${category?.slug ?? ''} ${category?.name ?? ''}`.toLowerCase();
  if (!text.trim()) {
    return GENERAL;
  }
  return KINDS.find((kind) => kind.keywords.some((word) => text.includes(word))) ?? GENERAL;
}

/** True when the category is a bootcamp category. */
export function isBootcampCategory(category: { slug?: string; name?: string } | null | undefined): boolean {
  return resourceKind(category).kind === 'bootcamp';
}
