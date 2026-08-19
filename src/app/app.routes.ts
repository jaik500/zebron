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
    path: '',
    redirectTo: 'resources',
    pathMatch: 'full',
  },
];