import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

import express from 'express';

import { join } from 'node:path';

import { getApps, initializeApp } from 'firebase-admin/app';

import { getFirestore } from 'firebase-admin/firestore';

/**
 * Initialize Firebase Admin for server-side operations.
 *
 * Local development can explicitly opt into the Firestore Emulator by setting:
 *   ZEBRON_USE_FIRESTORE_EMULATOR=true
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
 *
 * The emulator is never selected implicitly. Without the explicit flag, the
 * Admin SDK uses Application Default Credentials locally or the runtime
 * service account in Google Cloud.
 */
const projectId =
  process.env['GOOGLE_CLOUD_PROJECT'] ?? process.env['GCLOUD_PROJECT'] ?? 'zebron-2b49f';

const useFirestoreEmulator = process.env['ZEBRON_USE_FIRESTORE_EMULATOR'] === 'true';

if (useFirestoreEmulator) {
  const emulatorHost = process.env['FIRESTORE_EMULATOR_HOST'];

  if (!emulatorHost) {
    throw new Error(
      'ZEBRON_USE_FIRESTORE_EMULATOR=true requires FIRESTORE_EMULATOR_HOST, ' +
        'for example 127.0.0.1:8080.',
    );
  }

  // Firebase Admin reads FIRESTORE_EMULATOR_HOST when its Firestore client is
  // initialized. Set/check it before calling getFirestore below.
  process.env['FIRESTORE_EMULATOR_HOST'] = emulatorHost;

  console.info(`[Firestore] Using emulator at ${emulatorHost} (project ${projectId}).`);
} else {
  console.info(`[Firestore] Using Google Cloud credentials (project ${projectId}).`);
}

const adminApp = getApps()[0] ?? initializeApp({ projectId });

/**
 * Server-side Firestore instance.
 *
 * Keep this server entry point independent of the browser Firebase
 * initialization module. The explicit emulator switch above avoids requiring
 * Google Cloud ADC for local sitemap testing.
 */
const adminFirestore = getFirestore(adminApp);

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

/**
 * Security headers on every response.
 *
 * - HSTS: browsers only use HTTPS for zebron.org for a year.
 * - nosniff / frame / referrer: standard hardening.
 * - Permissions-Policy: camera and microphone only for this site
 *   (Community calls); location, USB and similar are off.
 * - COOP allows sign-in popups (Google sign-in).
 * - Content-Security-Policy is report-only for now: violations show in
 *   the browser console without blocking anything. Once the console is
 *   clean on every page, rename the header to Content-Security-Policy.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://apis.google.com https://js.stripe.com https://www.googletagmanager.com",
  // fonts.gstatic.com: the service worker keeps the fonts for offline use (fonts.googleapis.com is covered by *.googleapis.com).
  "connect-src 'self' https://fonts.gstatic.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.cloudfunctions.net https://*.run.app https://firebasestorage.googleapis.com https://www.google-analytics.com https://*.google-analytics.com https://www.google.com https://api.stripe.com",
  // Course lessons embed these players (features/courses/course.model.ts resolveMedia).
  "frame-src 'self' https://*.firebaseapp.com https://www.google.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.loom.com https://drive.google.com https://docs.google.com https://*.sharepoint.com https://w.soundcloud.com https://open.spotify.com https://js.stripe.com https://checkout.stripe.com",
  "worker-src 'self' blob:",
].join('; ');

/**
 * Coding Lab workers (public/coding-lab/*.js) run learners' code. They may
 * evaluate code but reach no network (the Python worker only jsDelivr, where
 * Python and its packages come from).
 */
const CODING_LAB_WORKER_POLICY = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-eval'",
  "connect-src 'none'",
].join('; ');

/**
 * The Coding Lab sandbox page (public/coding-lab/sandbox.html), loaded in an
 * opaque-origin iframe. Learners' code runs in workers it starts, which
 * inherit this policy. The page also sets the same policy itself, which
 * is enforced; this header matches it so no false reports appear.
 */
const CODING_LAB_SANDBOX_POLICY = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: data: https://cdn.jsdelivr.net",
  "worker-src blob: data:",
  "connect-src https://cdn.jsdelivr.net",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

/**
 * The Coding Lab web page preview (public/coding-lab/preview.html), loaded
 * in an opaque-origin iframe. It writes the learner's page into itself, which
 * keeps the page's own (enforced) policy; this header matches it.
 */
const CODING_LAB_PREVIEW_POLICY = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval'",
  "style-src 'unsafe-inline' https:",
  "img-src data: blob: https:",
  "font-src data: https:",
  "media-src data: blob: https:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "worker-src 'none'",
].join('; ');

/** The Python worker also loads Pyodide (WebAssembly) and packages from jsDelivr. */
const CODING_LAB_PYTHON_POLICY = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
  "connect-src https://cdn.jsdelivr.net",
].join('; ');

app.use((_req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), usb=(), magnetometer=(), gyroscope=(), payment=(self)');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader(
    'Content-Security-Policy-Report-Only',
    _req.path === '/coding-lab/sandbox.html'
      ? CODING_LAB_SANDBOX_POLICY
      : _req.path === '/coding-lab/preview.html'
      ? CODING_LAB_PREVIEW_POLICY
      : _req.path === '/coding-lab/python-worker.js'
      ? CODING_LAB_PYTHON_POLICY
      : _req.path.startsWith('/coding-lab/')
        ? CODING_LAB_WORKER_POLICY
        : CONTENT_SECURITY_POLICY,
  );
  res.removeHeader('X-Powered-By');
  next();
});

/**
 * Convert a Firestore Timestamp or Date into an ISO timestamp.
 * Return undefined for missing, invalid, or unsupported values.
 */
function toIsoString(value: unknown): string | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const timestamp = value as {
    toDate?: () => Date;
  };

  if (typeof timestamp.toDate !== 'function') {
    return undefined;
  }

  try {
    const date = timestamp.toDate();

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return undefined;
    }

    return date.toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Dynamic XML sitemap.
 *
 * Only published resources are included. This endpoint runs on the trusted
 * Node.js server and uses the Firebase Admin SDK for its Firestore query.
 */
/**
 * Open job board listings (jobs/{id}) for the sitemap, so Google finds new
 * jobs quickly. Listings past their expiry are left out (the same rule as
 * jobExpiresAtMillis in src/app/core/models/job.model.ts and
 * functions/src/job-board.ts): 5 days after the application deadline, or
 * 60 days after they were posted.
 */
async function jobSitemapUrls(): Promise<string> {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const millis = (value: unknown): number | null => {
    const iso = toIsoString(value);
    return iso ? Date.parse(iso) : null;
  };

  try {
    const snapshot = await adminFirestore.collection('jobs').where('status', '==', 'active').get();
    const now = Date.now();

    return snapshot.docs
      .map((document) => {
        const data = document.data();
        const deadline = millis(data['applicationDeadline']);
        const posted = millis(data['postedAt']) ?? millis(data['createdAt']);
        const expires =
          millis(data['expiresAt']) ??
          (deadline !== null ? deadline + 5 * DAY_MS : posted !== null ? posted + 60 * DAY_MS : null);

        if (expires !== null && now >= expires) {
          return '';
        }

        const lastModified = toIsoString(data['updatedAt']) ?? toIsoString(data['createdAt']);
        return `
  <url>
    <loc>https://zebron.org/jobs/${encodeURIComponent(document.id)}</loc>${
      lastModified
        ? `
    <lastmod>${lastModified}</lastmod>`
        : ''
    }
  </url>`;
      })
      .join('');
  } catch (error: unknown) {
    // The sitemap still works without jobs.
    console.error('Failed to list jobs for the sitemap:', error instanceof Error ? error.message : String(error));
    return '';
  }
}

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const snapshot = await adminFirestore
      .collection('resources')
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .get();

    const resourceUrls = snapshot.docs
      .map((document) => {
        const data = document.data();
        const slug = data['slug'];

        if (typeof slug !== 'string' || !slug.trim()) {
          return '';
        }

        const lastModified = toIsoString(data['updatedAt']) ?? toIsoString(data['createdAt']);

        const encodedSlug = encodeURIComponent(slug);

        return `
  <url>
    <loc>https://zebron.org/resources/${encodedSlug}</loc>${
      lastModified
        ? `
    <lastmod>${lastModified}</lastmod>`
        : ''
    }
  </url>`;
      })
      .filter(Boolean)
      .join('');

    const jobUrls = await jobSitemapUrls();

    const staticUrls = `
  <url>
    <loc>https://zebron.org/</loc>
  </url>
  <url>
    <loc>https://zebron.org/resources</loc>
  </url>
  <url>
    <loc>https://zebron.org/bootcamps</loc>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>https://zebron.org/contact</loc>
  </url>
  <url>
    <loc>https://zebron.org/find</loc>
  </url>
  <url>
    <loc>https://zebron.org/find/job</loc>
  </url>
  <url>
    <loc>https://zebron.org/jobs</loc>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://zebron.org/find/training</loc>
  </url>
  <url>
    <loc>https://zebron.org/privacy</loc>
  </url>
  <url>
    <loc>https://zebron.org/terms</loc>
  </url>
  <url>
    <loc>https://zebron.org/faq</loc>
  </url>
  <url>
    <loc>https://zebron.org/accessibility</loc>
  </url>`;

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${resourceUrls}${jobUrls}
</urlset>`;

    res.type('application/xml').send(sitemap);
  } catch (error: unknown) {
    console.error('Failed to generate sitemap:', {
      projectId,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode:
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).type('text/plain').send('Unable to generate sitemap.');
  }
});

/**
 * Angular SSR application engine.
 */
const angularApp = new AngularNodeAppEngine({
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    'zebron.org',
    '*.zebron.org',
    'zebron-web-427124681171.us-east4.run.app',
  ],
  trustProxyHeaders: true,
});

/**
 * Serve static files from the browser build.
 */
/**
 * Files of the installable app that must never be cached by the browser or
 * the CDN, so a new deployment is found at once: the service worker, its
 * manifest of files (ngsw.json), the app manifest and the page shell.
 * Everything else has a content hash in its name (or rarely changes) and
 * keeps the one-year cache.
 */
const NO_CACHE_FILES = new Set([
  '/ngsw-worker.js',
  '/ngsw.json',
  '/safety-worker.js',
  '/worker-basic.min.js',
  '/manifest.webmanifest',
  '/index.csr.html',
]);

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
    setHeaders: (res, filePath) => {
      const name = '/' + filePath.slice(browserDistFolder.length + 1).replace(/\\/g, '/');
      if (NO_CACHE_FILES.has(name)) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server when this module is the main entry point,
 * or when it is run through PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;

  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI and supported server
 * deployment environments.
 */
export const reqHandler = createNodeRequestHandler(app);
