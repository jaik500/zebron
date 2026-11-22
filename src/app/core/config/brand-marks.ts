/**
 * The gallery of looks for the home page (Admin → Home page look): a
 * picture on the mirrored "e" in the Zebron name, and the style of the big
 * circle on the right. The chosen key is the system setting
 * `home.brandMark` (systemSettings/home.brandMark: anyone can read it,
 * platform administrators change it). It is either a built-in look below
 * or the id of a look built in the admin builder (homeLooks/{id}).
 *
 * To add a built-in look: draw it in an SVG with viewBox "82 72 176 140"
 * (the "e" fills x 95 to 205 and its top is at y 159, so a hat's brim sits
 * around y 130 to 165), save it in public/images/brand/, and add an entry.
 */
export const BRAND_MARK_SETTING = 'home.brandMark';

/** Built-in looks hidden from the admin gallery (a list of keys; Standard is never hidden). */
export const HIDDEN_LOOKS_SETTING = 'home.hiddenLooks';

/** The hidden keys from the stored value (anything else is ignored). */
export function hiddenLookKeys(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((key): key is string => typeof key === 'string' && key !== 'standard') : [];
}

/** Where the picture sits on the "e", in em (so it fits any font size). */
export interface LookPlacement {
  /** Width of the picture. */
  size: number;
  /** Centre of the picture left (−) or right (+) of the centre of the "e". */
  x: number;
  /** Top of the picture below the top of the "e"'s line box. */
  y: number;
  /** Tilt in degrees, clockwise. */
  rotate: number;
}

/** The style of the circle on the right of the home page (large screens). */
export type LookCircle = 'standard' | 'ornament';

/** How the letter itself is drawn: Zebron teal, a glowing sparkler gold, or red and gold paper-cut waves. */
export type LookLetter = 'standard' | 'sparkler' | 'paper-cut';

export interface BrandMark {
  key: string;
  label: string;
  /** When it suits, shown in the gallery. */
  occasion: string;
  description: string;
  /** The picture drawn on the "e", or null for the standard "e". */
  image: string | null;
  placement: LookPlacement;
  circle: LookCircle;
  letter: LookLetter;
  /** Built in the admin builder (homeLooks/{key}). */
  custom?: boolean;
  /** Custom looks: the picture's Storage path. */
  imagePath?: string;
}

/** The placement every built-in picture is drawn for. */
export const DEFAULT_PLACEMENT: LookPlacement = { size: 0.765, x: 0.087, y: 0.02, rotate: 0 };

/** The builder's slider ranges (firestore.rules checks the same ones). */
export const PLACEMENT_LIMITS: Record<keyof LookPlacement, { min: number; max: number; step: number }> = {
  size: { min: 0.2, max: 1.6, step: 0.005 },
  x: { min: -0.8, max: 0.8, step: 0.005 },
  y: { min: -0.6, max: 0.8, step: 0.005 },
  rotate: { min: -60, max: 60, step: 1 },
};

export const BRAND_MARKS: readonly BrandMark[] = [
  {
    key: 'standard',
    label: 'Standard',
    occasion: 'All year',
    description: 'The usual Zebron "e", with nothing added.',
    image: null,
    placement: DEFAULT_PLACEMENT,
    circle: 'standard',
    letter: 'standard',
  },
  {
    key: 'santa-hat',
    label: 'Santa hat',
    occasion: 'December holidays',
    description: 'A red Santa hat on the "e", and the circle on the right becomes a hanging Christmas ornament.',
    image: '/images/brand/e-santa-hat.svg',
    placement: DEFAULT_PLACEMENT,
    circle: 'ornament',
    letter: 'standard',
  },
  {
    key: 'santa-hat-snug',
    label: 'Santa hat, snug fit',
    occasion: 'December holidays',
    description: 'The Santa hat pulled down over the top of the "e", like a hat on a head, with the ornament circle on the right.',
    image: '/images/brand/e-santa-hat.svg',
    placement: { ...DEFAULT_PLACEMENT, y: 0.09 },
    circle: 'ornament',
    letter: 'standard',
  },
  {
    key: 'party-hat',
    label: 'Party hat',
    occasion: 'New Year and celebrations',
    description: 'A striped party hat with a gold pompom.',
    image: '/images/brand/e-party-hat.svg',
    placement: DEFAULT_PLACEMENT,
    circle: 'standard',
    letter: 'standard',
  },
  {
    key: 'fireworks',
    label: 'Fireworks',
    occasion: 'New Year, July 4th and big celebrations',
    description: 'Colourful fireworks bursting above the "e", with a gentle twinkle (still for people who prefer less motion).',
    image: '/images/brand/e-fireworks.svg',
    // Bigger than the hats, centred over the "e" and lifted above it.
    placement: { size: 1.1, x: 0.02, y: -0.3, rotate: 0 },
    circle: 'standard',
    letter: 'standard',
  },
  {
    key: 'sparkler',
    label: 'Sparkler',
    occasion: 'New Year, July 4th and big celebrations',
    description: 'The "e" glows gold, as if written with a sparkler, with fine sparks flickering around it.',
    image: '/images/brand/e-sparkler.svg',
    // The sparks ring is centred on the "e".
    placement: { size: 1, x: 0, y: 0.26, rotate: 0 },
    circle: 'standard',
    letter: 'sparkler',
  },
  {
    key: 'lunar-new-year',
    label: 'Lunar New Year',
    occasion: 'Lunar New Year',
    description: 'A red and gold paper-cut "e" with lanterns, plum blossoms and little stars around it.',
    image: '/images/brand/e-lunar-new-year.svg',
    placement: { size: 1.2, x: 0, y: 0.18, rotate: 0 },
    circle: 'standard',
    letter: 'paper-cut',
  },
  {
    key: 'graduation-cap',
    label: 'Graduation cap',
    occasion: 'Graduation season and course milestones',
    description: 'A graduation cap with a gold tassel.',
    image: '/images/brand/e-graduation-cap.svg',
    placement: DEFAULT_PLACEMENT,
    circle: 'standard',
    letter: 'standard',
  },
];

/** The look for a stored value (unknown or missing values give the standard look). */
export function brandMarkFor(value: unknown, custom: readonly BrandMark[] = []): BrandMark {
  return [...BRAND_MARKS, ...custom].find((mark) => mark.key === value) ?? BRAND_MARKS[0];
}

/** A placement inside the builder's ranges (missing or bad values use the default). */
export function clampPlacement(value: Partial<Record<keyof LookPlacement, unknown>> | null | undefined): LookPlacement {
  const result = { ...DEFAULT_PLACEMENT };
  for (const key of Object.keys(PLACEMENT_LIMITS) as (keyof LookPlacement)[]) {
    const raw = value?.[key];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    const { min, max } = PLACEMENT_LIMITS[key];
    result[key] = Math.min(max, Math.max(min, raw));
  }
  return result;
}

/**
 * CSS for the picture inside the mirrored "e" (which has transform
 * scaleX(-1)): the picture is mirrored back, so `x` and `rotate` read as
 * seen on screen.
 */
export function placementStyle(placement: LookPlacement): Record<string, string> {
  const round = (value: number) => Math.round(value * 1000) / 1000;
  return {
    width: `${round(placement.size)}em`,
    left: `calc(50% - ${round(placement.x + placement.size / 2)}em)`,
    top: `${round(placement.y)}em`,
    transform: `scaleX(-1) rotate(${round(placement.rotate)}deg)`,
  };
}

/** A look built in the admin builder, from its homeLooks/{id} document. */
export function customLook(id: string, data: Record<string, unknown>): BrandMark {
  const text = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '');
  const image = text(data['imageUrl'], 2000);
  return {
    key: id,
    label: text(data['label'], 40) || 'Custom look',
    occasion: text(data['occasion'], 60),
    description: text(data['description'], 200),
    image: image.startsWith('https://') ? image : null,
    imagePath: text(data['imagePath'], 300),
    placement: clampPlacement(data['placement'] as Partial<Record<keyof LookPlacement, unknown>>),
    circle: data['circle'] === 'ornament' ? 'ornament' : 'standard',
    letter: data['letter'] === 'sparkler' || data['letter'] === 'paper-cut' ? data['letter'] : 'standard',
    custom: true,
  };
}

/** True for the key of a built-in look. */
export function isBuiltInLook(key: unknown): boolean {
  return BRAND_MARKS.some((mark) => mark.key === key);
}

/**
 * Inline CSS for the letter style, set on the mirrored "e" itself (null for
 * the standard teal "e"). Paper-cut fills the letter with
 * public/images/brand/paper-cut-waves.svg.
 */
export function letterStyle(letter: LookLetter): Record<string, string> | null {
  switch (letter) {
    case 'sparkler':
      return {
        color: '#FFE3A0',
        filter: 'drop-shadow(0 0 0.008em #fff6d6) drop-shadow(0 0 0.02em #ffc861) drop-shadow(0 0 0.045em #ff9d2e)',
      };
    case 'paper-cut':
      return {
        color: 'transparent',
        'background-image': 'url(/images/brand/paper-cut-waves.svg)',
        'background-size': 'cover',
        'background-position': 'center',
        '-webkit-background-clip': 'text',
        'background-clip': 'text',
        filter: 'drop-shadow(0 0.015em 0 #7a1414)',
      };
    default:
      return null;
  }
}
