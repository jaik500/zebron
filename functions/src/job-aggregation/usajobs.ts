import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { requirePlatformAdministrator } from '../platform-admin-authorization';

import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { IMPORTED_SECTORS, isImportedSector, JobSector, sectorLabel, sectorsOf, seriesOf } from './usajobs-sectors';
import { classifyLevel, isExecutiveTitle, levelLabel } from './usajobs-levels';

const REGION = 'us-central1';
const TIME_ZONE = 'America/New_York';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_AFTER_DEADLINE = 2;
const DAYS_WITHOUT_DEADLINE = 60;

/**
 * USAJOBS credentials.
 *
 * These must never be exposed in Angular.
 */
const USAJOBS_API_KEY = defineSecret('USAJOBS_API_KEY');

const USAJOBS_USER_AGENT = defineSecret('USAJOBS_USER_AGENT');

interface UsaJobsLocation {
  CityName?: string;
  CountryCode?: string;
  CountrySubDivisionCode?: string;
}

interface UsaJobsRemuneration {
  MinimumRange?: string;
  MaximumRange?: string;
  RateIntervalCode?: string;
}

interface UsaJobsDescription {
  Label?: string;
  Content?: string;
}

interface UsaJobsDescriptor {
  PositionTitle?: string;
  PositionURI?: string;
  ApplyURI?: string[];

  OrganizationName?: string;
  DepartmentName?: string;

  PositionLocationDisplay?: string;
  PositionLocation?: UsaJobsLocation[];

  JobCategory?: {
    Name?: string;
    Code?: string;
  }[];

  PositionSchedule?: {
    Name?: string;
    Code?: string;
  }[];

  PositionRemuneration?: UsaJobsRemuneration[];

  /** Pay plans, for example [{ Code: "GS" }]. */
  JobGrade?: {
    Code?: string;
  }[];

  PositionStartDate?: string;
  PositionEndDate?: string;
  PublicationStartDate?: string;
  ApplicationCloseDate?: string;

  QualificationSummary?: string;

  PositionFormattedDescription?: UsaJobsDescription[];

  UserArea?: {
    Details?: {
      MajorDuties?: string;
      Education?: string;
      Requirements?: string;
      Evaluations?: string;
      HowToApply?: string;
      Benefits?: string;
      JobSummary?: string;
      RemoteIndicator?: boolean;
      LowGrade?: string;
      HighGrade?: string;
    };
  };
}

interface UsaJobsItem {
  MatchedObjectId?: string;

  MatchedObjectDescriptor?: UsaJobsDescriptor;
}

interface UsaJobsResponse {
  SearchResult?: {
    SearchResultCount?: number;

    SearchResultCountAll?: number;

    SearchResultItems?: UsaJobsItem[];
  };
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseDate(value?: string): Timestamp | null {
  if (!value) {
    return null;
  }

  const milliseconds = new Date(value).getTime();

  if (!Number.isFinite(milliseconds)) {
    return null;
  }

  return Timestamp.fromMillis(milliseconds);
}

function parseAmount(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const amount = Number(value.replace(/[^0-9.-]/g, ''));

  return Number.isFinite(amount) ? amount : undefined;
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function getEmploymentType(
  descriptor: UsaJobsDescriptor,
): 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary' {
  const schedules = descriptor.PositionSchedule ?? [];

  const codes = schedules.map((item) => item.Code);

  if (codes.includes('1')) {
    return 'full-time';
  }

  if (codes.includes('2')) {
    return 'part-time';
  }

  return 'temporary';
}

function getWorkArrangement(descriptor: UsaJobsDescriptor): 'on-site' | 'hybrid' | 'remote' {
  const remote = descriptor.UserArea?.Details?.RemoteIndicator;

  const location = clean(descriptor.PositionLocationDisplay).toLowerCase();

  if (remote === true || location.includes('remote')) {
    return 'remote';
  }

  return 'on-site';
}

function getDescription(descriptor: UsaJobsDescriptor): string {
  const sections: string[] = [];

  const formatted = descriptor.PositionFormattedDescription ?? [];

  for (const section of formatted) {
    const label = clean(section.Label);

    const content = stripHtml(clean(section.Content));

    if (content) {
      sections.push(label ? `${label}\n${content}` : content);
    }
  }

  const details = descriptor.UserArea?.Details;

  const additionalSections = [
    ['Job Summary', details?.JobSummary],
    ['Major Duties', details?.MajorDuties],
    ['Qualifications', descriptor.QualificationSummary],
    ['Education', details?.Education],
    ['Requirements', details?.Requirements],
    ['Evaluations', details?.Evaluations],
    ['How to Apply', details?.HowToApply],
    ['Benefits', details?.Benefits],
  ] as const;

  for (const [label, value] of additionalSections) {
    const content = stripHtml(clean(value));

    if (content) {
      sections.push(`${label}\n${content}`);
    }
  }

  return sections.join('\n\n').slice(0, 30000);
}

function getCompensation(descriptor: UsaJobsDescriptor) {
  const remuneration = descriptor.PositionRemuneration?.[0];

  if (!remuneration) {
    return undefined;
  }

  const min = parseAmount(remuneration.MinimumRange);

  const max = parseAmount(remuneration.MaximumRange);

  if (min === undefined && max === undefined) {
    return undefined;
  }

  const rate = clean(remuneration.RateIntervalCode).toUpperCase();

  const period = rate.includes('H') ? 'hour' : 'year';

  return {
    min,
    max,
    currency: 'USD',
    period,
  };
}

/** A listing Zebron leaves out, and why (its earlier copy, if any, is closed). */
interface RejectedListing {
  documentId: string;
  rejected: 'sector' | 'executive';
}

function isRejected(value: object): value is RejectedListing {
  return typeof (value as Partial<RejectedListing>).rejected === 'string';
}

function documentIdFor(externalJobId: string): string {
  return `external_usajobs_${externalJobId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function mapUsaJobsItem(item: UsaJobsItem) {
  const descriptor = item.MatchedObjectDescriptor;

  if (!descriptor) {
    return null;
  }

  const externalJobId = clean(item.MatchedObjectId);

  /**
   * Only IT, healthcare, banking/finance/accounting and management jobs
   * (see usajobs-sectors.ts), at entry, mid or senior level: executive and
   * very senior jobs are left out (see usajobs-levels.ts).
   */
  if (externalJobId) {
    const sectorsFound = sectorsOf(
      (descriptor.JobCategory ?? []).map((item) => clean(item.Code)).filter(Boolean),
      [clean(descriptor.DepartmentName), clean(descriptor.OrganizationName)],
    );
    if (!isImportedSector(sectorsFound)) {
      return { documentId: documentIdFor(externalJobId), rejected: 'sector' } satisfies RejectedListing;
    }
    const decision = classifyLevel({
      payPlans: (descriptor.JobGrade ?? []).map((grade) => clean(grade.Code)),
      lowGrade: descriptor.UserArea?.Details?.LowGrade,
      highGrade: descriptor.UserArea?.Details?.HighGrade,
      title: clean(descriptor.PositionTitle),
    });
    if (decision === 'executive') {
      return { documentId: documentIdFor(externalJobId), rejected: 'executive' } satisfies RejectedListing;
    }
  }

  const title = clean(descriptor.PositionTitle);

  const employer = clean(descriptor.OrganizationName);

  const sourceUrl = clean(descriptor.PositionURI);

  const applicationUrl =
    descriptor.ApplyURI?.find(
      (value) => typeof value === 'string' && value.startsWith('https://'),
    ) || sourceUrl;

  if (!externalJobId || !title || !employer || !sourceUrl || !applicationUrl) {
    return null;
  }

  const location = descriptor.PositionLocation?.[0];

  const postedAt = parseDate(descriptor.PublicationStartDate);

  const applicationDeadline = parseDate(
    descriptor.ApplicationCloseDate || descriptor.PositionEndDate,
  );

  const now = Timestamp.now();

    /**
   * Follow Zebron's standard job expiry policy:
   * - 2 days after the application deadline.
   * - 60 days after posting when no deadline exists.
   */
  const expiresAt = applicationDeadline
    ? Timestamp.fromMillis(
        applicationDeadline.toMillis() + DAYS_AFTER_DEADLINE * DAY_MS,
      )
    : Timestamp.fromMillis(
        (postedAt?.toMillis() ?? now.toMillis()) +
          DAYS_WITHOUT_DEADLINE * DAY_MS,
      );

  const category = descriptor.JobCategory?.[0];

  const sectors = sectorsOf(
    (descriptor.JobCategory ?? []).map((item) => clean(item.Code)).filter(Boolean),
    [clean(descriptor.DepartmentName), employer],
  );

  const level = classifyLevel({
    payPlans: (descriptor.JobGrade ?? []).map((grade) => clean(grade.Code)),
    lowGrade: descriptor.UserArea?.Details?.LowGrade,
    highGrade: descriptor.UserArea?.Details?.HighGrade,
    title,
  });

  if (!isImportedSector(sectors) || level === 'executive') {
    return null;
  }

  const documentId = documentIdFor(externalJobId);

  return {
    documentId,

    job: {
      title,

      organizationName: employer,

      description: getDescription(descriptor),

      employmentType: getEmploymentType(descriptor),

      workArrangement: getWorkArrangement(descriptor),

      categoryId: clean(category?.Code) || undefined,

      categoryName: clean(category?.Name) || undefined,

            location: {
        city: normalizeCity(
          clean(location?.CityName) || clean(descriptor.PositionLocationDisplay),
          location?.CountrySubDivisionCode,
        ),

        state: clean(location?.CountrySubDivisionCode),

        country: clean(location?.CountryCode),
      },

      compensation: getCompensation(descriptor),

      skills: [],

      sectors,

      /** entry, mid or senior (usajobs-levels.ts). */
      experienceLevel: level,

      tags: [...sectors.map(sectorLabel), levelLabel(level), clean(category?.Name), clean(descriptor.DepartmentName)].filter(Boolean),

      applicationUrl,

      applicationDeadline,

      sourceName: 'USAJOBS',

      source: {
        provider: 'usajobs',
        externalJobId,
        sourceUrl,
        importedAt: now,
        lastVerifiedAt: now,
        status: 'active',
      },

      jobOrigin: 'external',

      importedAt: now,

      postedAt,

      expiresAt,

      closedReason: null,

      status: 'active',

      featured: false,

      /**
       * External listings are not owned by a
       * Zebron organization.
       */
      createdBy: 'system:usajobs',

      /**
       * Keep the original posting date for sorting
       * and compatibility with existing job alerts.
       */
      createdAt: postedAt ?? now,

      updatedAt: FieldValue.serverTimestamp(),
    },
  };
}

/**
 * Synchronization result returned to authorized callers.
 */
interface UsaJobsSyncResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  returned: number;
  totalAvailable: number;
  /** Listings by sector (a listing can be in more than one). */
  bySector: Record<JobSector, number>;
  /** Earlier USAJOBS listings closed because they are outside the imported fields. */
  closedOutsideSectors: number;
  /** Listings left out this time: executive or very senior. */
  skippedExecutive: number;
  /** Listings left out this time: outside the imported fields. */
  skippedOutsideSectors: number;
  /** Earlier USAJOBS listings closed because they are executive or very senior. */
  closedExecutive: number;
  syncedAt: string;
}

/** One USAJOBS search: the newest 500 listings from the last 60 days matching the filter. */
async function searchUsajobs(
  apiKey: string,
  userAgent: string,
  filter: Record<string, string>,
): Promise<{ items: UsaJobsItem[]; totalAvailable: number }> {
  const url = new URL('https://data.usajobs.gov/api/Search');

  url.searchParams.set('DatePosted', '60');
  url.searchParams.set('ResultsPerPage', '500');
  url.searchParams.set('Page', '1');
  url.searchParams.set('SortField', 'openingdate');
  url.searchParams.set('SortDirection', 'Desc');
  url.searchParams.set('Fields', 'Full');

  for (const [name, value] of Object.entries(filter)) {
    url.searchParams.set(name, value);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'User-Agent': userAgent,
      'Authorization-Key': apiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`USAJOBS API returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as UsaJobsResponse;

  return {
    items: data.SearchResult?.SearchResultItems ?? [],
    totalAvailable: data.SearchResult?.SearchResultCountAll ?? 0,
  };
}

/**
 * Shared USAJOBS synchronization implementation.
 *
 * Used by both:
 * 1. Automatic 12-hour scheduled synchronization.
 * 2. Manually triggered administrator synchronization.
 */
async function runUsajobsSync(triggeredBy: string | null): Promise<UsaJobsSyncResult> {
  const db = getFirestore();

  const apiKey = USAJOBS_API_KEY.value();

  const userAgent = USAJOBS_USER_AGENT.value();

  if (!apiKey || !userAgent) {
    throw new Error('USAJOBS API credentials are not configured.');
  }

  /**
   * One search per imported field (IT, healthcare, finance, management), so
   * each gets its own newest 500 and the large healthcare list can't crowd
   * out the others. Listings found by more than one search are kept once.
   */
  const searches = await Promise.all(
    IMPORTED_SECTORS.map((sector) =>
      searchUsajobs(apiKey, userAgent, { JobCategoryCode: seriesOf(sector).join(';') }),
    ),
  );

  const seen = new Set<string>();
  const items: UsaJobsItem[] = [];
  for (const item of searches.flatMap((search) => search.items)) {
    const id = clean(item.MatchedObjectId);
    if (id && !seen.has(id)) {
      seen.add(id);
      items.push(item);
    }
  }

  const totalAvailable = searches.reduce((sum, search) => sum + search.totalAvailable, 0);

  const stateRef = db.collection('jobAggregationState').doc('usajobs');

  const stateSnapshot = await stateRef.get();

  const initialImport = !stateSnapshot.exists || stateSnapshot.data()?.initialized !== true;

  const now = Timestamp.now();

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  const bySector: Record<JobSector, number> = { it: 0, healthcare: 0, finance: 0, management: 0, 'armed-forces': 0 };
  const keptIds = new Set<string>();
  /** Listings USAJOBS returned that Zebron leaves out: close any earlier copy. */
  const rejected = new Map<string, RejectedListing['rejected']>();
  let skippedExecutive = 0;
  let skippedOutsideSectors = 0;

  type MappedListing = Extract<NonNullable<ReturnType<typeof mapUsaJobsItem>>, { job: unknown }>;
  const mappedItems: MappedListing[] = [];
  for (const item of items) {
    const mapped = mapUsaJobsItem(item);
    if (!mapped) {
      skipped++;
    } else if (isRejected(mapped)) {
      skipped++;
      rejected.set(mapped.documentId, mapped.rejected);
      if (mapped.rejected === 'executive') skippedExecutive++;
      else skippedOutsideSectors++;
    } else if ('job' in mapped) {
      mappedItems.push(mapped);
    }
  }

  // Firestore allows 500 writes per batch: write 400 at a time, and read
  // the existing listings for each chunk in one call.
  for (let offset = 0; offset < mappedItems.length; offset += 400) {
    const chunk = mappedItems.slice(offset, offset + 400);
    const refs = chunk.map((mapped) => db.collection('jobs').doc(mapped.documentId));
    const existingDocs = await db.getAll(...refs);
    const batch = db.batch();

    chunk.forEach((mapped, index) => {
      const existing = existingDocs[index];

      /**
       * Avoid mass job-alert emails during the initial import.
       */
      const alertEligibleAt = existing.exists
        ? (existing.data()?.alertEligibleAt ?? null)
        : initialImport
          ? null
          : now;

      batch.set(
        refs[index],
        {
          ...mapped.job,
          alertEligibleAt,
        },
        { merge: true },
      );

      keptIds.add(mapped.documentId);
      for (const sector of mapped.job.sectors) {
        bySector[sector]++;
      }

      if (existing.exists) {
        updated++;
      } else {
        imported++;
      }
    });

    await batch.commit();
  }

  /**
   * Close earlier USAJOBS listings Zebron no longer imports: outside the
   * imported fields, or executive / very senior (by this sync's decision, or by
   * title for listings imported before levels were recorded). Listings that
   * still qualify stay open until they expire as usual.
   */
  let closedOutsideSectors = 0;
  let closedExecutive = 0;
  const activeImports = await db
    .collection('jobs')
    .where('createdBy', '==', 'system:usajobs')
    .where('status', '==', 'active')
    .get();

  let closeBatch = db.batch();
  let pending = 0;

  for (const doc of activeImports.docs) {
    if (keptIds.has(doc.id)) {
      continue;
    }
    const job = doc.data();
    const stored: string[] = Array.isArray(job.sectors) ? job.sectors.map(clean) : [];
    const sectors = [...stored, ...sectorsOf([clean(job.categoryId)].filter(Boolean), [])];
    const reason =
      rejected.get(doc.id) ??
      (!isImportedSector(sectors)
        ? 'sector'
        : !job.experienceLevel && isExecutiveTitle(clean(job.title))
          ? 'executive'
          : null);
    if (!reason) {
      continue;
    }
    closeBatch.update(doc.ref, {
      status: 'closed',
      closedReason: reason === 'executive' ? 'level' : 'category',
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (reason === 'executive') closedExecutive++;
    else closedOutsideSectors++;
    if (++pending === 400) {
      await closeBatch.commit();
      closeBatch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) {
    await closeBatch.commit();
  }

  const syncedAt = now.toDate().toISOString();

  await stateRef.set(
    {
      provider: 'usajobs',
      initialized: true,

      lastSuccessfulSyncAt: FieldValue.serverTimestamp(),

      lastResultCount: items.length,
      totalAvailable,

      lastImportedCount: imported,
      lastUpdatedCount: updated,
      lastSkippedCount: skipped,

      lastSectorCounts: bySector,
      lastClosedOutsideSectors: closedOutsideSectors,
      lastSkippedExecutive: skippedExecutive,
      lastSkippedOutsideSectors: skippedOutsideSectors,
      lastClosedExecutive: closedExecutive,

      lastSyncSource: triggeredBy ? 'manual' : 'scheduled',

      lastTriggeredBy: triggeredBy,

      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  logger.info('USAJOBS synchronization completed', {
    imported,
    updated,
    skipped,
    returned: items.length,
    totalAvailable,
    bySector,
    closedOutsideSectors,
    skippedExecutive,
    skippedOutsideSectors,
    closedExecutive,
    triggeredBy,
  });

  return {
    success: true,
    imported,
    updated,
    skipped,
    returned: items.length,
    totalAvailable,
    bySector,
    closedOutsideSectors,
    skippedExecutive,
    skippedOutsideSectors,
    closedExecutive,
    syncedAt,
  };
}

function normalizeCity(cityValue: unknown, stateValue: unknown): string {
  const city = clean(cityValue);
  const state = clean(stateValue);

  if (!city || !state) return city;

  const suffix = `, ${state}`;

  return city.toLowerCase().endsWith(suffix.toLowerCase())
    ? city.slice(0, -suffix.length).trim()
    : city;
}

/**
 * Automatic USAJOBS synchronization.
 *
 * Runs every 12 hours.
 */
export const syncUsajobsJobs = onSchedule(
  {
    schedule: 'every 12 hours',
    timeZone: TIME_ZONE,
    region: REGION,
    timeoutSeconds: 540,

    secrets: [USAJOBS_API_KEY, USAJOBS_USER_AGENT],
  },

  async () => {
    await runUsajobsSync(null);
  },
);

/**
 * Manually trigger USAJOBS synchronization.
 *
 * Restricted to authenticated platform administrators.
 */
export const triggerUsajobsSync = onCall(
  {
    region: REGION,
    timeoutSeconds: 540,

    secrets: [USAJOBS_API_KEY, USAJOBS_USER_AGENT],
  },

  async (request) => {
    // Require authentication.
    await requirePlatformAdministrator(request);

    const uid = request.auth!.uid;

    try {
      logger.info('Manual USAJOBS synchronization requested', { uid });

      const result = await runUsajobsSync(uid);

      return result;
    } catch (error) {
      logger.error('Manual USAJOBS synchronization failed', {
        uid,
        error,
      });

      throw new HttpsError('internal', 'USAJOBS synchronization failed. Please try again later.');
    }
  },
);
