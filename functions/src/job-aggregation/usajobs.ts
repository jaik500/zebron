import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { requirePlatformAdministrator } from '../platform-admin-authorization';

import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { onSchedule } from 'firebase-functions/v2/scheduler';

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

function mapUsaJobsItem(item: UsaJobsItem) {
  const descriptor = item.MatchedObjectDescriptor;

  if (!descriptor) {
    return null;
  }

  const externalJobId = clean(item.MatchedObjectId);

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

  const documentId = `external_usajobs_${externalJobId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

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

      tags: [clean(category?.Name), clean(descriptor.DepartmentName)].filter(Boolean),

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
  syncedAt: string;
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

  const url = new URL('https://data.usajobs.gov/api/Search');

  url.searchParams.set('DatePosted', '60');
  url.searchParams.set('ResultsPerPage', '500');
  url.searchParams.set('Page', '1');
  url.searchParams.set('SortField', 'openingdate');
  url.searchParams.set('SortDirection', 'Desc');
  url.searchParams.set('Fields', 'Full');

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

  const items = data.SearchResult?.SearchResultItems ?? [];

  const totalAvailable = data.SearchResult?.SearchResultCountAll ?? 0;

  const stateRef = db.collection('jobAggregationState').doc('usajobs');

  const stateSnapshot = await stateRef.get();

  const initialImport = !stateSnapshot.exists || stateSnapshot.data()?.initialized !== true;

  const now = Timestamp.now();

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  const batch = db.batch();

  for (const item of items) {
    const mapped = mapUsaJobsItem(item);

    if (!mapped) {
      skipped++;
      continue;
    }

    const jobRef = db.collection('jobs').doc(mapped.documentId);

    const existing = await jobRef.get();

    /**
     * Avoid mass job-alert emails during the initial import.
     */
    const alertEligibleAt = existing.exists
      ? (existing.data()?.alertEligibleAt ?? null)
      : initialImport
        ? null
        : now;

    batch.set(
      jobRef,
      {
        ...mapped.job,
        alertEligibleAt,
      },
      { merge: true },
    );

    if (existing.exists) {
      updated++;
    } else {
      imported++;
    }
  }

  if (items.length > 0) {
    await batch.commit();
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
    triggeredBy,
  });

  return {
    success: true,
    imported,
    updated,
    skipped,
    returned: items.length,
    totalAvailable,
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
