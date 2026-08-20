import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'resources',
    loadComponent: () =>
      import(
        './features/resources/pages/resource-list/resource-list.component'
      ).then((m) => m.ResourceListComponent),
  },

  {
    path: 'resources/:slug',
    loadComponent: () =>
      import(
        './features/resources/pages/resource-detail/resource-detail.component'
      ).then((m) => m.ResourceDetailComponent),
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/resources',
  },
];