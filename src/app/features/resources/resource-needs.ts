import { TOPIC_DRAFTS } from './resource-topic-drafts';

/**
 * The built-in "Search by Category" topics on /resources, in the spirit of
 * 211. Admins manage the live list in Admin → Topics (resourceTopics);
 * these are used until topics are saved there, and to seed them.
 *
 * A category belongs to the first topic whose keywords appear in its slug
 * or name, unless a topic lists its categories explicitly.
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

/**
 * The topic a category belongs to: a topic that lists it, else the first
 * topic (without its own category list) whose keywords match its name.
 */
export function needOf<T extends { keywords: string[]; categoryIds?: string[] }>(
  category: { id?: string; slug?: string; name?: string },
  topics: T[] = RESOURCE_NEEDS as unknown as T[],
): T | undefined {
  const listed = topics.find((topic) => !!category.id && topic.categoryIds?.includes(category.id));
  if (listed) {
    return listed;
  }
  const text = `${category.slug ?? ''} ${category.name ?? ''}`.toLowerCase();
  return topics.find((topic) => !topic.categoryIds?.length && topic.keywords.some((word) => text.includes(word)));
}

// ============================================================
// Topics managed in Admin → Topics
// ============================================================

/** A helpful link on a topic page ("Apply for SNAP", "Call 988"). */
export interface ResourceTopicLink {
  label: string;
  /** https://… or tel:… */
  url: string;
}

/**
 * resourceTopics/{key}: a "Search by Category" topic and the content shown
 * at the top of its page. Public read; platform admins write.
 */
export interface ResourceTopic {
  /** Also the document id and the ?topic= value, e.g. "food". */
  key: string;
  title: string;
  /** One line under the title in the list. */
  text: string;
  /** A short introduction at the top of the topic page. */
  intro: string;
  /** Categories in this topic. Empty: matched by keywords instead. */
  categoryIds: string[];
  /** Words that place categories and resources in this topic. */
  keywords: string[];
  /** A page of its own instead of results, e.g. "/bootcamps". */
  route: string;
  /** "Before you reach out" tips. */
  tips: string[];
  links: ResourceTopicLink[];
  order: number;
  active: boolean;
}

/** The built-in topics as ResourceTopic records (fallback and seed), with drafted content. */
export function defaultTopics(): ResourceTopic[] {
  return RESOURCE_NEEDS.map((need, index) => {
    const draft = TOPIC_DRAFTS[need.key];
    return {
      key: need.key,
      title: need.title,
      text: need.text,
      intro: draft?.intro ?? '',
      categoryIds: [],
      keywords: need.keywords,
      route: need.route ?? '',
      tips: [...(draft?.tips ?? [])],
      links: (draft?.links ?? []).map((link) => ({ ...link })),
      order: index,
      active: true,
    };
  });
}
