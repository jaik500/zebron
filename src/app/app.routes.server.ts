import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // =====================================================
  // PUBLIC RESOURCE DETAIL
  //
  // Resource detail pages can continue to use SSR.
  // =====================================================
  {
    path: 'resources/:slug',
    renderMode: RenderMode.Server,
  },

  // =====================================================
  // ALL OTHER ROUTES
  //
  // Authenticated routes such as the admin area need
  // Firebase Authentication state from the browser.
  //
  // The SSR server cannot access the browser's Firebase
  // authentication session, so these routes render
  // on the client.
  // =====================================================
  // =====================================================
  // PUBLIC JOB PAGES
  //
  // Rendered on the server so Google reads each job and its
  // JobPosting data (Google job search). The job is loaded by
  // jobResolver before rendering.
  // =====================================================
  {
    path: 'jobs/:id',
    renderMode: RenderMode.Server,
  },

  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
