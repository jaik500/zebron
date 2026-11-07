import { Timestamp } from 'firebase/firestore';
import { ActivatedRoute } from '@angular/router';

/**
 * Courses: structured lessons with quick checks, progress and certificates.
 *
 *   courses/{courseId}                               Zebron courses
 *   courses/{courseId}/lessons/{lessonId}
 *   organizations/{orgId}/courses/{courseId}          an organization's own courses
 *   organizations/{orgId}/courses/{courseId}/lessons/{lessonId}
 *   users/{uid}/courseProgress/{progressId}           one learner's progress in one course
 *
 * The course document carries the outline (modules and lesson titles) so
 * the course page needs one read; lesson bodies are read one at a time.
 */

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';
export type CourseStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type CourseCover = 'teal' | 'navy' | 'sunrise' | 'violet' | 'sky' | 'slate';

export const COURSE_COVERS: Record<CourseCover, string> = {
  teal: 'linear-gradient(135deg, #007979, #2a835f)',
  navy: 'linear-gradient(135deg, #032d42, #007979)',
  sunrise: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  violet: 'linear-gradient(135deg, #5b3fb3, #007979)',
  sky: 'linear-gradient(135deg, #0ea5e9, #2a835f)',
  slate: 'linear-gradient(135deg, #334155, #0f766e)',
};

export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  all: 'All levels',
};

export interface CourseOutlineLesson {
  id: string;
  title: string;
  minutes: number;
  /** The lesson ends with a quick check. */
  hasCheck: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseOutlineLesson[];
}

/** A Test Center quiz used as the course's final exam (graded on the server). */
export interface CourseFinalExam {
  quizId: string;
  /** Shown to learners and authors; copied from the quiz when chosen. */
  quizName: string;
  questionCount: number;
  /** Percentage needed to pass (1-100). */
  passMark: number;
  /** null: no time limit. */
  timeLimitMinutes: number | null;
  /** null: unlimited attempts. */
  maxAttempts: number | null;
}

/** The learner's final exam record (users/{uid}/courseExams/{progressId}), written by Cloud Functions. */
export interface CourseExamRecord {
  id: string;
  attempts: number;
  bestScore: number | null;
  lastScore: number | null;
  passed: boolean;
  passScore: number | null;
  passedAt: Timestamp | null;
  certificateCode: string | null;
  openAttemptId: string | null;
}

export interface Course {
  id: string;
  /** null for Zebron courses. */
  organizationId: string | null;
  title: string;
  summary: string;
  description: string;
  topic: string;
  /** Optional learning path this course belongs to, such as "Cybersecurity Program". */
  program: string;
  /** Position in the program (1, 2, 3…); null when not in a program. */
  programOrder: number | null;
  level: CourseLevel;
  cover: CourseCover;
  outcomes: string[];
  skills: string[];
  modules: CourseModule[];
  lessonCount: number;
  estimatedMinutes: number;
  finalExam: CourseFinalExam | null;
  status: CourseStatus;
  authorName: string;
  /** Shown on the card: "Zebron" or the organization's name. */
  providerName: string;
  publishedAt: Timestamp | null;
  updatedAt: Timestamp | null;
  /** Organization courses written by staff go through a manager's review. */
  review: CourseReview | null;
}

/**
 * Review of an organization course: staff submit it (status in_review),
 * a manager publishes it or sends it back to draft with a note.
 */
export interface CourseReview {
  submittedBy: string | null;
  submittedByName: string | null;
  submittedAt: Timestamp | null;
  /** The manager's note when a course was sent back. */
  note: string | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: Timestamp | null;
}

export type LessonBlock =
  | { type: 'text'; text: string }
  | { type: 'video'; url: string; caption?: string; /** Seconds. */ start?: number }
  | { type: 'audio'; url: string; caption?: string }
  | { type: 'document'; url: string; title?: string; caption?: string }
  | { type: 'image'; url: string; alt: string; caption?: string }
  | { type: 'tip'; text: string }
  | {
      type: 'check';
      /** New format: several questions in one Quick Check block. */
      questions: LessonCheckQuestion[];
      question?: never;
      options?: never;
      answer?: never;
      explanation?: never;
    }
  | {
      type: 'check';
      /** Legacy single-question format remains supported for existing lessons. */
      question: string;
      options: string[];
      answer: number;
      explanation?: string;
      questions?: never;
    };

export interface LessonCheckQuestion {
  question: string;
  options: string[];
  /** Zero-based index of the correct option. */
  answer: number;
  explanation?: string;
}

export type LessonBlockType = LessonBlock['type'];

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  minutes: number;
  blocks: LessonBlock[];
}

export interface CourseProgress {
  /** Document id: see progressId(). */
  id: string;
  userId: string;
  courseId: string;
  organizationId: string | null;
  courseTitle: string;
  cover: CourseCover;
  lessonCount: number;
  /** The course has a final exam: lessons alone do not complete it. */
  finalExam: boolean;
  completedLessonIds: string[];
  lastLessonId: string | null;
  percent: number;
  /** 'completed' means every lesson is done (see isCourseComplete for exams). */
  status: 'in_progress' | 'completed';
  /** Per lesson: score of the first try at its quick checks (0–100). */
  checkScores: Record<string, number>;
  /** Minutes learned per day, 'YYYY-MM-DD' keys, last 60 days. */
  activity: Record<string, number>;
  learnerName: string;
  skills: string[];
  startedAt: Timestamp | null;
  updatedAt: Timestamp | null;
  completedAt: Timestamp | null;
}

/** Where the course pages are served. */
export interface CourseContext {
  organizationId: string | null;
  /** '/courses' or '/partner/org/<id>/courses'. */
  basePath: string;
}

export function courseContextFromRoute(route: ActivatedRoute): CourseContext {
  let organizationId: string | null = null;

  for (const snapshot of route.snapshot.pathFromRoot) {
    organizationId = snapshot.paramMap.get('organizationId') ?? organizationId;
  }

  return organizationId
    ? { organizationId, basePath: `/partner/org/${encodeURIComponent(organizationId)}/courses` }
    : { organizationId: null, basePath: '/courses' };
}

/** Progress for a Zebron course is shared wherever it is taken. */
export function progressId(course: Pick<Course, 'id' | 'organizationId'>): string {
  return course.organizationId ? `${course.organizationId}__${course.id}` : course.id;
}

/** Link to a course from a progress record, kept in the right organization. */
export function courseLink(progress: Pick<CourseProgress, 'courseId' | 'organizationId'>, context: CourseContext): string {
  return progress.organizationId
    ? `/partner/org/${encodeURIComponent(progress.organizationId)}/courses/${encodeURIComponent(progress.courseId)}`
    : `${context.basePath}/${encodeURIComponent(progress.courseId)}`;
}

export function allLessons(course: Pick<Course, 'modules'> | null): CourseOutlineLesson[] {
  return course?.modules.flatMap((module) => module.lessons) ?? [];
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.max(1, Math.round(minutes))} min`;
  }

  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

export function dayKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Monday of the week containing the date, as a day key. */
function weekKey(date: Date): string {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return dayKey(monday);
}

function parseDay(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

/** Every progress record's activity added together. */
export function mergeActivity(records: Pick<CourseProgress, 'activity'>[]): Record<string, number> {
  const merged: Record<string, number> = {};

  for (const record of records) {
    for (const [key, minutes] of Object.entries(record.activity ?? {})) {
      merged[key] = (merged[key] ?? 0) + (Number(minutes) || 0);
    }
  }

  return merged;
}

/** Weeks in a row with some learning, counting this week or last week as the latest. */
export function weekStreak(activity: Record<string, number>): number {
  const weeks = new Set(
    Object.entries(activity)
      .filter(([, minutes]) => minutes > 0)
      .map(([key]) => weekKey(parseDay(key))),
  );

  const cursor = new Date();
  if (!weeks.has(weekKey(cursor))) {
    cursor.setDate(cursor.getDate() - 7);
  }

  let streak = 0;
  while (weeks.has(weekKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}

export function minutesThisWeek(activity: Record<string, number>): number {
  const thisWeek = weekKey(new Date());
  return Object.entries(activity)
    .filter(([key]) => weekKey(parseDay(key)) === thisWeek)
    .reduce((total, [, minutes]) => total + (Number(minutes) || 0), 0);
}

/** Learning days of the current week, Monday first. */
export function daysThisWeek(activity: Record<string, number>): boolean[] {
  const monday = parseDay(weekKey(new Date()));

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return (activity[dayKey(day)] ?? 0) > 0;
  });
}

/** Keep the most recent days only, so the record stays small. */
export function trimActivity(activity: Record<string, number>, keep = 60): Record<string, number> {
  return Object.fromEntries(
    Object.entries(activity)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, keep),
  );
}

export function averageScore(scores: Record<string, number>): number | null {
  const values = Object.values(scores ?? {});
  return values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : null;
}

/** A readable certificate code, e.g. ZB-7Q4K-M2XP. */
export function certificateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = crypto.getRandomValues(new Uint32Array(8));
  const characters = Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
  return `ZB-${characters.slice(0, 4)}-${characters.slice(4)}`;
}

export function courseDate(value: { toDate(): Date } | null | undefined, locale = 'en-US'): string {
  const date = value?.toDate?.();
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })
    : '';
}

/** How a media link is shown in a lesson. */
export interface ResolvedMedia {
  /** Display name: "YouTube", "Loom", or the site's host for other links. */
  provider: string;
  /**
   * iframe: the site's own player inside the lesson;
   * video / audio: the browser's player for a direct file link;
   * link: a button that opens the page in a new tab.
   */
  mode: 'iframe' | 'video' | 'audio' | 'link';
  /** The player or file address; for links, the original address. */
  src: string;
  /** Player shape: 16:9 video, a short audio bar, or a tall document. */
  frame: 'video' | 'audio' | 'document';
}

/** Sites whose players are shown inside lessons (for the builder's hint). */
export const MEDIA_PROVIDERS = {
  video: ['YouTube', 'Vimeo', 'Loom', 'Google Drive', 'Microsoft Stream', 'MP4 or WebM link'],
  audio: ['SoundCloud', 'Spotify', 'MP3 or M4A link'],
  document: ['Google Slides', 'Google Docs', 'Google Sheets', 'Google Drive (PDF)'],
} as const;

const ID = /^[A-Za-z0-9_-]{6,80}$/;
const VIDEO_FILE = /\.(mp4|webm|m4v|mov)$/i;
const AUDIO_FILE = /\.(mp3|m4a|aac|ogg|oga|wav)$/i;

/** "1:30", "90" or "1:02:03" as seconds; 0 when empty or not a time. */
export function parseStartTime(value: string): number {
  const parts = value.trim().split(':').map((part) => Number(part));
  if (!value.trim() || parts.some((part) => !Number.isInteger(part) || part < 0) || parts.length > 3) {
    return 0;
  }
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function formatStartTime(seconds: number | undefined): string {
  if (!seconds) {
    return '';
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Turn a link pasted by a course author into something a lesson can show.
 * Only players this function builds itself are embedded: each address is
 * rebuilt from the ID it reads, never passed through, except Microsoft
 * Stream embed links on sharepoint.com. Anything else becomes a link.
 * Returns null when the text is not an https link.
 */
export function resolveMedia(raw: string, kind: 'video' | 'audio' | 'document', start = 0): ResolvedMedia | null {
  let url: URL;

  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  const segments = url.pathname.split('/').filter(Boolean);
  const seconds = Math.max(0, Math.floor(start));
  const frame: ResolvedMedia['frame'] = kind;
  const embed = (provider: string, src: string, shape = frame): ResolvedMedia => ({ provider, mode: 'iframe', src, frame: shape });
  const link = (provider: string): ResolvedMedia => ({ provider, mode: 'link', src: url.href, frame });

  // YouTube
  if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'youtu.be') {
    const id =
      host === 'youtu.be'
        ? segments[0]
        : ['embed', 'shorts', 'live'].includes(segments[0] ?? '')
          ? segments[1]
          : url.searchParams.get('v');
    const from = seconds || parseStartTime((url.searchParams.get('t') ?? '').replace(/s$/, ''));
    return id && ID.test(id)
      ? embed('YouTube', `https://www.youtube-nocookie.com/embed/${id}?rel=0${from ? `&start=${from}` : ''}`, 'video')
      : link('YouTube');
  }

  // Vimeo
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = [...segments].reverse().find((segment) => /^\d{5,12}$/.test(segment));
    return id ? embed('Vimeo', `https://player.vimeo.com/video/${id}${seconds ? `#t=${seconds}s` : ''}`, 'video') : link('Vimeo');
  }

  // Loom
  if (host === 'loom.com') {
    const id = ['share', 'embed'].includes(segments[0] ?? '') ? segments[1] : null;
    return id && /^[a-f0-9]{16,64}$/i.test(id)
      ? embed('Loom', `https://www.loom.com/embed/${id}${seconds ? `?t=${seconds}` : ''}`, 'video')
      : link('Loom');
  }

  // Google Drive files (videos and PDFs)
  if (host === 'drive.google.com') {
    const id = segments[0] === 'file' && segments[1] === 'd' ? segments[2] : url.searchParams.get('id');
    return id && ID.test(id)
      ? embed('Google Drive', `https://drive.google.com/file/d/${id}/preview`)
      : link('Google Drive');
  }

  // Google Slides, Docs and Sheets
  if (host === 'docs.google.com') {
    const type = segments[0];
    const id = segments[1] === 'd' ? segments[2] : null;
    if (id && ID.test(id)) {
      if (type === 'presentation') {
        return embed('Google Slides', `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false`, 'document');
      }
      if (type === 'document') {
        return embed('Google Docs', `https://docs.google.com/document/d/${id}/preview`, 'document');
      }
      if (type === 'spreadsheets') {
        return embed('Google Sheets', `https://docs.google.com/spreadsheets/d/${id}/preview`, 'document');
      }
    }
    return link('Google Docs');
  }

  // Microsoft Stream (on SharePoint): only its "Embed" links play inside the lesson.
  if (host.endsWith('.sharepoint.com')) {
    return url.pathname.toLowerCase().includes('/_layouts/15/embed.aspx')
      ? embed('Microsoft Stream', url.href, 'video')
      : link('Microsoft Stream');
  }

  // SoundCloud
  if (host === 'soundcloud.com' && segments.length >= 2) {
    const track = `https://soundcloud.com/${segments.map(encodeURIComponent).join('/')}`;
    return embed('SoundCloud', `https://w.soundcloud.com/player/?url=${encodeURIComponent(track)}&visual=false&show_comments=false`, 'audio');
  }

  // Spotify episodes, shows and tracks
  if (host === 'open.spotify.com') {
    const index = segments.findIndex((segment) => ['episode', 'show', 'track', 'playlist'].includes(segment));
    const type = index >= 0 ? segments[index] : null;
    const id = index >= 0 ? segments[index + 1] : null;
    return type && id && /^[A-Za-z0-9]{10,40}$/.test(id)
      ? embed('Spotify', `https://open.spotify.com/embed/${type}/${id}`, 'audio')
      : link('Spotify');
  }

  // Direct file links
  if (VIDEO_FILE.test(url.pathname)) {
    return { provider: 'Video file', mode: 'video', src: url.href, frame: 'video' };
  }
  if (AUDIO_FILE.test(url.pathname)) {
    return { provider: 'Audio file', mode: 'audio', src: url.href, frame: 'audio' };
  }
  if (/\.pdf$/i.test(url.pathname)) {
    return link('PDF');
  }

  return link(host);
}

/** Every lesson done, and the final exam passed when the course has one. */
export function isCourseComplete(
  progress: Pick<CourseProgress, 'status' | 'finalExam'> | null | undefined,
  exam: Pick<CourseExamRecord, 'passed'> | null | undefined,
): boolean {
  return !!progress && progress.status === 'completed' && (!progress.finalExam || exam?.passed === true);
}

/** A certificate needs a passed final exam. */
export function hasCertificate(
  progress: Pick<CourseProgress, 'finalExam'> | null | undefined,
  exam: Pick<CourseExamRecord, 'passed' | 'certificateCode'> | null | undefined,
): boolean {
  return !!progress?.finalExam && exam?.passed === true && !!exam.certificateCode;
}

/** Choices in the builder; 0 means no limit (stored as null). */
export const EXAM_TIME_LIMITS = [0, 15, 30, 45, 60, 90, 120] as const;
export const EXAM_ATTEMPTS = [0, 1, 2, 3, 5] as const;
