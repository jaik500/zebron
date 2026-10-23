import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

import express from 'express';

import { join } from 'node:path';

import {
  getApps,
  initializeApp,
} from 'firebase-admin/app';

import {
  getFirestore,
} from 'firebase-admin/firestore';

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
  process.env['GOOGLE_CLOUD_PROJECT'] ??
  process.env['GCLOUD_PROJECT'] ??
  'zebron-2b49f';

const useFirestoreEmulator =
  process.env['ZEBRON_USE_FIRESTORE_EMULATOR'] === 'true';

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

  console.info(
    `[Firestore] Using emulator at ${emulatorHost} (project ${projectId}).`,
  );
} else {
  console.info(
    `[Firestore] Using Google Cloud credentials (project ${projectId}).`,
  );
}

const adminApp =
  getApps()[0] ??
  initializeApp({ projectId });

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
 * Convert a Firestore Timestamp or Date into an ISO timestamp.
 * Return undefined for missing, invalid, or unsupported values.
 */
function toIsoString(value: unknown): string | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? undefined
      : value.toISOString();
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

    if (
      !(date instanceof Date) ||
      Number.isNaN(date.getTime())
    ) {
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

        const lastModified =
          toIsoString(data['updatedAt']) ??
          toIsoString(data['createdAt']);

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

    const staticUrls = `
  <url>
    <loc>https://zebron.org/</loc>
  </url>
  <url>
    <loc>https://zebron.org/resources</loc>
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
    <loc>https://zebron.org/find/training</loc>
  </url>`;

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${resourceUrls}
</urlset>`;

    res
      .type('application/xml')
      .send(sitemap);
  } catch (error) {
    console.error('Failed to generate sitemap:', error);

    res
      .status(500)
      .type('text/plain')
      .send('Unable to generate sitemap.');
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
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response
        ? writeResponseToNodeResponse(response, res)
        : next(),
    )
    .catch(next);
});

/**
 * Start the server when this module is the main entry point,
 * or when it is run through PM2.
 */
if (
  isMainModule(import.meta.url) ||
  process.env['pm_id']
) {
  const port = process.env['PORT'] || 4000;

  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(
      `Node Express server listening on http://localhost:${port}`,
    );
  });
}

/**
 * Request handler used by the Angular CLI and supported server
 * deployment environments.
 */
export const reqHandler = createNodeRequestHandler(app);
