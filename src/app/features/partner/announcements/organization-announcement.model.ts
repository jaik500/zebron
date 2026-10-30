import { Timestamp } from 'firebase/firestore';

/**
 * Banner announcements shown at the top of an organization's dashboard.
 *
 * Stored at organizations/{organizationId}/announcements/{announcementId}.
 * Managers, admins and owners create them from the Administration page;
 * every member sees active ones and can close them for themselves.
 */

export type AnnouncementType =
  | 'event'
  | 'cohort'
  | 'graduation'
  | 'shoutout'
  | 'general';

export type AnnouncementTheme =
  | 'zebron'
  | 'sunrise'
  | 'royal'
  | 'midnight'
  | 'forest'
  | 'sky'
  | 'confetti'
  | 'gold';

export type AnnouncementFont =
  | 'default'
  | 'serif'
  | 'rounded'
  | 'display'
  | 'mono';

export type AnnouncementArtwork =
  | 'calendar'
  | 'celebration'
  | 'graduation'
  | 'trophy'
  | 'star'
  | 'groups'
  | 'rocket'
  | 'campaign'
  | 'school'
  | 'none';

export interface OrganizationAnnouncement {
  id: string;
  organizationId: string;

  type: AnnouncementType;

  title: string;
  message: string;

  /** Optional button, e.g. "Register" linking to a sign-up page. */
  ctaLabel: string | null;
  ctaUrl: string | null;

  /** Date shown on the banner (event day, cohort start, ceremony). */
  eventDate: string | null;

  /** Shout-outs: the person being celebrated. */
  honoreeName: string | null;

  theme: AnnouncementTheme;
  font: AnnouncementFont;
  artwork: AnnouncementArtwork;

  /** Optional photo (https only), e.g. the student being celebrated. */
  imageUrl: string | null;

  /** Visible window (YYYY-MM-DD). Empty means "from now" / "until removed". */
  startsOn: string | null;
  endsOn: string | null;

  active: boolean;

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type OrganizationAnnouncementInput = Omit<
  OrganizationAnnouncement,
  'id' | 'organizationId' | 'createdBy' | 'createdAt' | 'updatedAt'
>;

// ============================================================
// PREDEFINED OPTIONS
// ============================================================

export interface ThemeOption {
  key: AnnouncementTheme;
  label: string;
  /** Tailwind classes for the banner background and text. */
  container: string;
  /** Secondary text. */
  muted: string;
  /** Circle behind the artwork. */
  artwork: string;
  /** Call-to-action button. */
  button: string;
  /** Close button. */
  close: string;
  /** Decorative pattern, drawn with CSS (no image files). */
  pattern: 'none' | 'dots' | 'confetti' | 'rays';
}

export const ANNOUNCEMENT_THEMES: readonly ThemeOption[] = [
  {
    key: 'zebron',
    label: 'Zebron teal',
    container: 'bg-gradient-to-r from-[#032D42] to-[#007979] text-white',
    muted: 'text-white/80',
    artwork: 'bg-white/15 text-white ring-1 ring-white/25',
    button: 'bg-white text-[#032D42] hover:bg-teal-50',
    close: 'text-white/80 hover:bg-white/15 hover:text-white',
    pattern: 'dots',
  },
  {
    key: 'sunrise',
    label: 'Sunrise',
    container: 'bg-gradient-to-r from-orange-500 to-pink-500 text-white',
    muted: 'text-white/85',
    artwork: 'bg-white/20 text-white ring-1 ring-white/30',
    button: 'bg-white text-orange-700 hover:bg-orange-50',
    close: 'text-white/85 hover:bg-white/20 hover:text-white',
    pattern: 'rays',
  },
  {
    key: 'royal',
    label: 'Royal',
    container: 'bg-gradient-to-r from-indigo-700 to-purple-600 text-white',
    muted: 'text-white/80',
    artwork: 'bg-white/15 text-white ring-1 ring-white/25',
    button: 'bg-white text-indigo-800 hover:bg-indigo-50',
    close: 'text-white/80 hover:bg-white/15 hover:text-white',
    pattern: 'dots',
  },
  {
    key: 'midnight',
    label: 'Midnight & gold',
    container: 'bg-gradient-to-r from-slate-900 to-slate-800 text-white',
    muted: 'text-slate-300',
    artwork: 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/40',
    button: 'bg-amber-400 text-slate-900 hover:bg-amber-300',
    close: 'text-slate-300 hover:bg-white/10 hover:text-white',
    pattern: 'rays',
  },
  {
    key: 'forest',
    label: 'Forest',
    container: 'bg-gradient-to-r from-emerald-700 to-green-600 text-white',
    muted: 'text-white/80',
    artwork: 'bg-white/15 text-white ring-1 ring-white/25',
    button: 'bg-white text-emerald-800 hover:bg-emerald-50',
    close: 'text-white/80 hover:bg-white/15 hover:text-white',
    pattern: 'dots',
  },
  {
    key: 'sky',
    label: 'Sky',
    container: 'bg-sky-50 text-sky-950 ring-1 ring-sky-200',
    muted: 'text-sky-800',
    artwork: 'bg-sky-100 text-sky-700',
    button: 'bg-sky-700 text-white hover:bg-sky-800',
    close: 'text-sky-700 hover:bg-sky-100',
    pattern: 'none',
  },
  {
    key: 'confetti',
    label: 'Confetti',
    container: 'bg-white text-gray-900 ring-1 ring-gray-200',
    muted: 'text-gray-600',
    artwork: 'bg-pink-50 text-pink-600',
    button: 'bg-[#007979] text-white hover:bg-teal-700',
    close: 'text-gray-500 hover:bg-gray-100',
    pattern: 'confetti',
  },
  {
    key: 'gold',
    label: 'Graduation gold',
    container: 'bg-gradient-to-r from-amber-300 to-yellow-200 text-amber-950',
    muted: 'text-amber-900',
    artwork: 'bg-amber-950/10 text-amber-900 ring-1 ring-amber-950/15',
    button: 'bg-amber-950 text-amber-50 hover:bg-amber-900',
    close: 'text-amber-900 hover:bg-amber-950/10',
    pattern: 'confetti',
  },
];

export interface FontOption {
  key: AnnouncementFont;
  label: string;
  /** Tailwind classes for the title; system fonts only, nothing to download. */
  title: string;
}

export const ANNOUNCEMENT_FONTS: readonly FontOption[] = [
  { key: 'default', label: 'Standard', title: 'font-bold' },
  { key: 'serif', label: 'Elegant (serif)', title: 'font-serif font-semibold' },
  {
    key: 'rounded',
    label: 'Friendly (rounded)',
    title: "font-['ui-rounded','SF_Pro_Rounded','Nunito','Segoe_UI',sans-serif] font-extrabold",
  },
  { key: 'display', label: 'Bold headline', title: 'font-black uppercase tracking-wide' },
  { key: 'mono', label: 'Technical (mono)', title: 'font-mono font-bold' },
];

export interface ArtworkOption {
  key: AnnouncementArtwork;
  label: string;
  /** Material icon name. */
  icon: string;
}

export const ANNOUNCEMENT_ARTWORK: readonly ArtworkOption[] = [
  { key: 'calendar', label: 'Calendar', icon: 'event' },
  { key: 'celebration', label: 'Celebration', icon: 'celebration' },
  { key: 'graduation', label: 'Graduation cap', icon: 'school' },
  { key: 'trophy', label: 'Trophy', icon: 'emoji_events' },
  { key: 'star', label: 'Star', icon: 'star' },
  { key: 'groups', label: 'Group', icon: 'groups' },
  { key: 'rocket', label: 'Rocket', icon: 'rocket_launch' },
  { key: 'campaign', label: 'Megaphone', icon: 'campaign' },
  { key: 'school', label: 'Classroom', icon: 'local_library' },
  { key: 'none', label: 'No artwork', icon: '' },
];

export interface AnnouncementTypeOption {
  key: AnnouncementType;
  label: string;
  /** Small label shown above the title. */
  badge: string;
  /** Starting look when this type is picked. */
  defaults: {
    theme: AnnouncementTheme;
    font: AnnouncementFont;
    artwork: AnnouncementArtwork;
    title: string;
    message: string;
    ctaLabel: string;
  };
}

export const ANNOUNCEMENT_TYPES: readonly AnnouncementTypeOption[] = [
  {
    key: 'event',
    label: 'Upcoming event',
    badge: 'Upcoming event',
    defaults: {
      theme: 'zebron',
      font: 'default',
      artwork: 'calendar',
      title: 'Join us for our next event',
      message: 'Save the date and bring a friend. Details and registration below.',
      ctaLabel: 'Register',
    },
  },
  {
    key: 'cohort',
    label: 'New cohort',
    badge: 'New cohort',
    defaults: {
      theme: 'sunrise',
      font: 'rounded',
      artwork: 'rocket',
      title: 'A new cohort starts soon',
      message: 'Enrollment is open. Secure your spot before seats fill up.',
      ctaLabel: 'Enroll now',
    },
  },
  {
    key: 'graduation',
    label: 'Graduation',
    badge: 'Graduation',
    defaults: {
      theme: 'gold',
      font: 'serif',
      artwork: 'graduation',
      title: 'Congratulations, graduates!',
      message: 'Join us in celebrating everyone who completed the program.',
      ctaLabel: 'See the ceremony details',
    },
  },
  {
    key: 'shoutout',
    label: 'Best student shout-out',
    badge: 'Student spotlight',
    defaults: {
      theme: 'confetti',
      font: 'display',
      artwork: 'trophy',
      title: 'Student of the month',
      message: 'For outstanding work, dedication and helping others succeed.',
      ctaLabel: '',
    },
  },
  {
    key: 'general',
    label: 'General announcement',
    badge: 'Announcement',
    defaults: {
      theme: 'sky',
      font: 'default',
      artwork: 'campaign',
      title: 'Announcement',
      message: '',
      ctaLabel: '',
    },
  },
];

export function themeOption(key: string | null | undefined): ThemeOption {
  return ANNOUNCEMENT_THEMES.find((theme) => theme.key === key) ?? ANNOUNCEMENT_THEMES[0];
}

export function fontOption(key: string | null | undefined): FontOption {
  return ANNOUNCEMENT_FONTS.find((font) => font.key === key) ?? ANNOUNCEMENT_FONTS[0];
}

export function artworkOption(key: string | null | undefined): ArtworkOption {
  return ANNOUNCEMENT_ARTWORK.find((artwork) => artwork.key === key) ?? ANNOUNCEMENT_ARTWORK[0];
}

export function typeOption(key: string | null | undefined): AnnouncementTypeOption {
  return (
    ANNOUNCEMENT_TYPES.find((type) => type.key === key) ??
    ANNOUNCEMENT_TYPES[ANNOUNCEMENT_TYPES.length - 1]
  );
}

/** Whether an announcement should be visible today (local date). */
export function isAnnouncementLive(
  announcement: Pick<OrganizationAnnouncement, 'active' | 'startsOn' | 'endsOn'>,
  today: string = localDate(),
): boolean {
  if (!announcement.active) {
    return false;
  }

  if (announcement.startsOn && announcement.startsOn > today) {
    return false;
  }

  if (announcement.endsOn && announcement.endsOn < today) {
    return false;
  }

  return true;
}

/** Today as YYYY-MM-DD in the viewer's time zone. */
export function localDate(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

/** Only https links are allowed for buttons and photos. */
export function isSafeHttpsUrl(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}
