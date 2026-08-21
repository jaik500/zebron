import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Public resource list.
  {
    path: 'resources',
    loadComponent: () =>
      import(
        './features/resources/pages/resource-list/resource-list.component'
      ).then((m) => m.ResourceListComponent),
  },

  // Public resource detail page.
  {
    path: 'resources/:slug',
    loadComponent: () =>
      import(
        './features/resources/pages/resource-detail/resource-detail.component'
      ).then((m) => m.ResourceDetailComponent),
  },

  // Admin login.
  {
    path: 'login',
    loadComponent: () =>
      import(
        './features/auth/pages/login/login.component'
      ).then((m) => m.LoginComponent),
  },

  // Public user registration. 
  { path: 'register', 
    loadComponent: () => import( 
      './features/auth/pages/register/register.component' 
    ).then((m) => m.RegisterComponent), 
  },

   
  // Resource administration.
  {
    path: 'admin/resources',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/resources/resource-admin.component'
      ).then((m) => m.ResourceAdminComponent),
  },

    // Organization administration.
  {
    path: 'admin/organizations',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/organizations/organization-admin.component'
      ).then((m) => m.OrganizationAdminComponent),
  },

  // Protected administration area.
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/admin-dashboard/admin-dashboard.component'
      ).then((m) => m.AdminDashboardComponent),
  },

  // Protected category management.
  {
    path: 'admin/categories',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/categories/category-admin.component'
      ).then((m) => m.CategoryAdminComponent),
  },

  // Default route.
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/resources',
  },
];
