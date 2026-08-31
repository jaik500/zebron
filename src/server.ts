import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

import express from 'express';

import { join } from 'node:path';

import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { firestore } from './app/core/services/firebase-config';


const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
/**
 * Dynamic XML sitemap.
 *
 * Only published resources are included.
 */
app.get('/sitemap.xml', async (_req, res) => {
  try {
    const resourcesQuery = query(
      collection(firestore, 'resources'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(resourcesQuery);

    const resourceUrls = snapshot.docs
      .map((document) => {
        const data = document.data();

        if (!data['slug']) {
          return '';
        }

        const lastModified =
          data['updatedAt']?.toDate?.()?.toISOString() ??
          data['createdAt']?.toDate?.()?.toISOString();

        return `
  <url>
    <loc>https://zebron.org/resources/${encodeURIComponent(data['slug'])}</loc>${
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

const angularApp = new AngularNodeAppEngine({
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    'zebron.org',
    '*.zebron.org',
  ],
  trustProxyHeaders: true,
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
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
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
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
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
