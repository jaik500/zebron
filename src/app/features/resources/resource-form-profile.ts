import { ResourceKind, resourceKind } from './resource-kinds';

/**
 * Which fields the admin resource form shows, and how it words them, for a
 * category (its kind: bootcamp, food, health…) and a resource type
 * (Service, Program, Event, Online tool, Hotline…).
 *
 * The type is matched by words in its name or slug, so new types such as
 * "Community event" or "Website" pick the right fields.
 */
export type ResourceForm = 'place' | 'program' | 'event' | 'online' | 'hotline';

export interface ResourceFormProfile {
  /** What the form is about, e.g. "Bootcamp", "Event", "Food service". */
  label: string;
  form: ResourceForm;
  kind: ResourceKind;

  descriptionPlaceholder: string;

  showLocation: boolean;
  locationHint: string;

  /** Opening hours for each day. */
  showHours: boolean;
  showAlwaysAvailable: boolean;
  showAppointment: boolean;
  /** Start and end date and time (events). */
  showEventDates: boolean;
  /** Programs, start dates and Zebron's take (bootcamps). */
  showPrograms: boolean;

  showCost: boolean;
  costLabel: string;
  costPlaceholder: string;

  phoneLabel: string;
  tagsPlaceholder: string;
}

const KIND_LABEL: Record<ResourceKind, string> = {
  bootcamp: 'Bootcamp',
  education: 'Education',
  employment: 'Employment',
  legal: 'Legal service',
  health: 'Health service',
  housing: 'Housing service',
  food: 'Food service',
  business: 'Business service',
  government: 'Public service',
  general: 'Resource',
};

const DESCRIPTION: Record<ResourceKind, string> = {
  bootcamp: 'What the bootcamp teaches, who it is for and what graduates go on to do.',
  education: 'Classes offered, levels, who can enroll and how to sign up.',
  employment: 'Job help offered (resumes, training, placement) and who can use it.',
  legal: 'Legal help offered, who qualifies and how to get an appointment.',
  health: 'Care offered, who can be seen (insurance, uninsured) and how to get an appointment.',
  housing: 'Housing help offered, who qualifies and how to apply.',
  food: 'What is offered (groceries, meals, SNAP help), who can come and what to bring.',
  business: 'Advice, training or funding offered and who can apply.',
  government: 'Services this office provides and what to bring.',
  general: 'Describe this resource.',
};

const TAGS: Record<ResourceKind, string> = {
  bootcamp: 'coding, cybersecurity, career change',
  education: 'esl, ged, college',
  employment: 'resume, job training, interview',
  legal: 'immigration, asylum, tenant rights',
  health: 'clinic, dental, uninsured',
  housing: 'rent, shelter, eviction',
  food: 'food pantry, meals, snap',
  business: 'small business, loans, startup',
  government: 'id, benefits, dmv',
  general: 'food, assistance, community',
};

/** The form for a resource type name or slug (from Admin → Resource types). */
export function resourceFormOf(type: { name?: string; slug?: string } | null | undefined): ResourceForm {
  const text = `${type?.name ?? ''} ${type?.slug ?? ''}`.toLowerCase();
  if (/event|workshop|webinar|fair|meetup|class session/.test(text)) return 'event';
  if (/hotline|helpline|phone line|crisis line/.test(text)) return 'hotline';
  if (/online|website|web site|tool|app\b|digital|portal/.test(text)) return 'online';
  if (/program|course|training|bootcamp|class/.test(text)) return 'program';
  return 'place';
}

export function resourceFormProfile(
  category: { slug?: string; name?: string } | null | undefined,
  type: { name?: string; slug?: string } | null | undefined,
): ResourceFormProfile {
  const kind = resourceKind(category).kind;
  const form = kind === 'bootcamp' ? 'program' : resourceFormOf(type);

  const base: ResourceFormProfile = {
    label: KIND_LABEL[kind],
    form,
    kind,
    descriptionPlaceholder: DESCRIPTION[kind],
    showLocation: true,
    locationHint: 'Where people go to get this help.',
    showHours: true,
    showAlwaysAvailable: true,
    showAppointment: true,
    showEventDates: false,
    showPrograms: kind === 'bootcamp',
    showCost: true,
    costLabel: 'Cost description',
    costPlaceholder: kind === 'health' ? 'Sliding scale based on income' : 'Free for eligible residents',
    phoneLabel: 'Phone',
    tagsPlaceholder: TAGS[kind],
  };

  switch (form) {
    case 'event':
      return {
        ...base,
        label: 'Event',
        descriptionPlaceholder: 'What happens at the event, who it is for and whether to register.',
        locationHint: 'Where the event takes place (leave empty if online only).',
        showHours: false,
        showAlwaysAvailable: false,
        showAppointment: false,
        showEventDates: true,
        costLabel: 'Entry or ticket price',
        costPlaceholder: 'Free, registration required',
        tagsPlaceholder: 'workshop, community, family',
      };
    case 'online':
      return {
        ...base,
        label: kind === 'general' ? 'Online resource' : `${KIND_LABEL[kind]} (online)`,
        showLocation: false,
        showHours: false,
        showAppointment: false,
        costPlaceholder: 'Free to use',
      };
    case 'hotline':
      return {
        ...base,
        label: 'Hotline',
        descriptionPlaceholder: 'Who answers, what they help with, languages and when to call.',
        showLocation: false,
        showAppointment: false,
        phoneLabel: 'Hotline number',
        costPlaceholder: 'Free and confidential',
      };
    case 'program':
      return {
        ...base,
        label: kind === 'bootcamp' ? 'Bootcamp' : 'Program',
        locationHint: kind === 'bootcamp' ? 'The campus or main office (leave empty if fully online).' : 'Where the program meets.',
        // Bootcamp schedules live in each program; others may keep office hours.
        showHours: kind !== 'bootcamp',
        showAlwaysAvailable: false,
        costLabel: kind === 'bootcamp' ? 'Tuition range' : 'Cost description',
        costPlaceholder: kind === 'bootcamp' ? '$2,500 – $4,000, payment plans available' : 'Free for eligible residents',
      };
    default:
      return base;
  }
}
