import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // =====================================================
  // PUBLIC RESOURCE LIST
  // =====================================================
  {
    path: 'resources',
    loadComponent: () =>
      import(
        './features/resources/pages/resource-list/resource-list.component'
      ).then((m) => m.ResourceListComponent),
  },

  // =====================================================
  // PUBLIC CONTACT FORM
  // =====================================================
  {
    path: 'contact',
    loadComponent: () =>
      import(
        './features/contact/pages/contact/contact'
      ).then((m) => m.ContactComponent),
  },

  // =====================================================
  // PUBLIC RESOURCE DETAIL
  // =====================================================
  {
    path: 'resources/:slug',
    loadComponent: () =>
      import(
        './features/resources/pages/resource-detail/resource-detail.component'
      ).then((m) => m.ResourceDetailComponent),
  },

  // =====================================================
  // LOGIN
  // =====================================================
  {
    path: 'login',
    loadComponent: () =>
      import(
        './features/auth/pages/login/login.component'
      ).then((m) => m.LoginComponent),
  },

  // =====================================================
  // PUBLIC REGISTRATION
  // =====================================================
  {
    path: 'register',
    loadComponent: () =>
      import(
        './features/auth/pages/register/register.component'
      ).then((m) => m.RegisterComponent),
  },

  // =====================================================
  // PROTECTED USER PROFILE
  // =====================================================
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './features/profile/pages/user-profile/user-profile'
      ).then((m) => m.UserProfileComponent),
  },

  // =====================================================
  // PROTECTED RESOURCE SUBMISSION
  // =====================================================
  {
    path: 'submit',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './features/submissions/pages/submit-resource/submit-resource.component'
      ).then((m) => m.SubmitResourceComponent),
  },

  // =====================================================
  // ADMIN RESOURCE MANAGEMENT
  // =====================================================
  {
    path: 'admin/resources',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/resources/resource-admin.component'
      ).then((m) => m.ResourceAdminComponent),
  },

  // =====================================================
  // ADMIN ORGANIZATION MANAGEMENT
  // =====================================================
  {
    path: 'admin/organizations',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/organizations/organization-admin.component'
      ).then((m) => m.OrganizationAdminComponent),
  },

  // =====================================================
  // ADMIN USER MANAGEMENT
  // =====================================================
  {
    path: 'admin/users',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/users/user-admin.component'
      ).then((m) => m.UserAdminComponent),
  },

  // =====================================================
  // ADMIN SUBMISSION MANAGEMENT
  // =====================================================
  {
    path: 'admin/submissions',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/submissions/submission-admin.component'
      ).then((m) => m.SubmissionAdminComponent),
  },

    // =====================================================
  // ADMIN RESOURCE TYPE MANAGEMENT
  // =====================================================
  {
    path: 'admin/resource-types',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/resource-types/resource-type-admin.component'
      ).then(
        (m) => m.ResourceTypeAdminComponent,
      ),
  },

    // =====================================================
  // ADMIN CONTACT MAILBOX
  // =====================================================

  // =====================================================
  // ADMIN SENT EMAILS
  // =====================================================
  {
    path: 'admin/contact/sent',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/contact/sent/sent-email.component'
      ).then(
        (m) => m.SentEmailComponent,
      ),
  },


  {
    path: 'admin/contact',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/contact/contact-mailbox.component'
      ).then(
        (m) => m.ContactMailboxComponent,
      ),
  },

  // =====================================================
  // ADMIN DASHBOARD
  // =====================================================
  // ADMIN LOCATION MANAGEMENT
  // =====================================================
  {
    path: 'admin/locations',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/locations/location-admin.component'
      ).then(
        (m) => m.LocationAdminComponent,
      ),
  },

  // =====================================================
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/admin-dashboard/admin-dashboard.component'
      ).then((m) => m.AdminDashboardComponent),
  },

  // =====================================================
  // ADMIN CATEGORY MANAGEMENT
  // =====================================================
  {
    path: 'admin/categories',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/categories/category-admin.component'
      ).then((m) => m.CategoryAdminComponent),
  },

  // =====================================================
  // DEFAULT ROUTE
  // =====================================================
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/resources',
  },
];
