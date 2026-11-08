/**
 * "Browse by need" topics on /resources, in the spirit of 211.
 *
 * A category belongs to the first topic whose keywords appear in its slug
 * or name, so new categories ("Food pantries", "Financial assistance")
 * join the right topic without code changes. A topic with exactly one
 * category opens it; otherwise it searches for its query.
 */
export interface ResourceNeed {
  key: string;
  title: string;
  text: string;
  keywords: string[];
  /** Search used when the topic has no single category. */
  query: string;
  /** A page of its own (job board, bootcamps). */
  route?: string;
}

/** Order matters: a category counts for the first topic it matches. */
export const RESOURCE_NEEDS: ResourceNeed[] = [
  {
    key: 'food',
    title: 'Food',
    text: 'Food banks, pantries, meals, SNAP',
    keywords: ['food', 'pantry', 'meal', 'nutrition', 'snap'],
    query: 'food',
  },
  {
    key: 'housing',
    title: 'Housing',
    text: 'Shelter, apartments, rent and mortgage help',
    keywords: ['housing', 'shelter', 'rent', 'apartment', 'homeless'],
    query: 'housing',
  },
  {
    key: 'mental-health',
    title: 'Mental Health',
    text: 'Counseling, treatment, support groups',
    keywords: ['mental', 'counsel', 'behavioral'],
    query: 'mental health',
  },
  {
    key: 'health',
    title: 'Health Care',
    text: 'Clinics, insurance, dental, prevention',
    keywords: ['health', 'medical', 'clinic', 'dental', 'insurance'],
    query: 'health',
  },
  {
    key: 'crisis',
    title: 'Crisis',
    text: 'Hotlines, emergency shelter, safety',
    keywords: ['crisis', 'emergency', 'violence', 'abuse', 'hotline'],
    query: 'crisis',
  },
  {
    key: 'substance',
    title: 'Substance Use',
    text: 'Treatment, recovery, prevention',
    keywords: ['substance', 'addiction', 'recovery', 'alcohol', 'drug'],
    query: 'substance use',
  },
  {
    key: 'jobs',
    title: 'Jobs and Income',
    text: 'Employment, job training, financial literacy',
    keywords: ['employment', 'job', 'career', 'workforce', 'income'],
    query: 'jobs',
  },
  {
    key: 'bootcamps',
    title: 'Tech Bootcamps',
    text: 'Short programs that lead to tech jobs',
    keywords: ['bootcamp', 'coding'],
    query: 'bootcamp',
    route: '/bootcamps',
  },
  {
    key: 'education',
    title: 'Education',
    text: 'Schools, colleges, English classes',
    keywords: ['education', 'school', 'college', 'universit', 'language', 'esl', 'literacy', 'training'],
    query: 'school',
  },
  {
    key: 'legal',
    title: 'Legal and Immigration',
    text: 'Legal aid, immigration, citizenship',
    keywords: ['legal', 'immigration', 'law', 'citizenship', 'asylum'],
    query: 'legal',
  },
  {
    key: 'money',
    title: 'Money Help',
    text: 'Financial assistance, benefits, scholarships',
    keywords: ['financ', 'money', 'scholarship', 'benefit', 'tax', 'cash'],
    query: 'financial',
  },
  {
    key: 'utilities',
    title: 'Utility Assistance',
    text: 'Help paying for power, heat and water',
    keywords: ['utilit', 'energy', 'heat', 'electric', 'water bill'],
    query: 'utility',
  },
  {
    key: 'basic-needs',
    title: 'Basic Needs',
    text: 'Clothing, household items, diapers',
    keywords: ['basic need', 'clothing', 'diaper', 'household', 'furniture'],
    query: 'clothing',
  },
  {
    key: 'transportation',
    title: 'Transportation',
    text: 'Rides, transit passes, car help',
    keywords: ['transport', 'transit', 'rides'],
    query: 'transportation',
  },
  {
    key: 'families',
    title: 'Children and Families',
    text: 'Child care, parenting, early learning',
    keywords: ['child', 'famil', 'parent', 'daycare'],
    query: 'child care',
  },
  {
    key: 'youth',
    title: 'Youth',
    text: 'Programs, mentoring, education and jobs',
    keywords: ['youth', 'teen', 'young'],
    query: 'youth',
  },
  {
    key: 'older-adults',
    title: 'Older Adults',
    text: 'Benefits, in-home help, senior centers',
    keywords: ['older', 'senior', 'elder'],
    query: 'senior',
  },
  {
    key: 'business',
    title: 'Business',
    text: 'Starting a business, loans, advising',
    keywords: ['business', 'entrepreneur', 'startup'],
    query: 'business',
  },
  {
    key: 'community',
    title: 'Events and Community',
    text: 'Workshops, activities, community groups',
    keywords: ['event', 'community', 'workshop', 'activit', 'recreation'],
    query: 'events',
  },
  {
    key: 'government',
    title: 'Government and Public Services',
    text: 'IDs, benefits offices, public services',
    keywords: ['government', 'public', 'id card', 'dmv'],
    query: 'government',
  },
  {
    key: 'reentry',
    title: 'Re-Entry',
    text: 'Support after incarceration',
    keywords: ['re-entry', 'reentry', 'incarcerat', 'justice'],
    query: 're-entry',
  },
];

/** Searches suggested under the search box. */
export const POPULAR_SEARCHES = ['Rent help', 'Food pantry', 'Free clinic', 'English classes', 'Immigration lawyer', 'Job training'];

/** The topic a category belongs to, if any. */
export function needOf(category: { slug?: string; name?: string }): ResourceNeed | undefined {
  const text = `${category.slug ?? ''} ${category.name ?? ''}`.toLowerCase();
  return RESOURCE_NEEDS.find((need) => need.keywords.some((word) => text.includes(word)));
}
