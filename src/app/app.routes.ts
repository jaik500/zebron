import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { featureGuard } from './core/guards/feature.guard';

import { resourceResolver } from './features/resources/resolvers/resource.resolver';
import { AboutComponent } from './features/about/pages/about/about.component';

export const routes: Routes = [

  // =====================================================
  // PUBLIC RESOURCE LIST
  // =====================================================
  {
    path: 'resources',
    canActivate: [
      featureGuard,
    ],
    data: {
      featureKey: 'resources',
    },
    loadComponent: () =>
      import(
        './features/resources/pages/resource-list/resource-list.component'
      ).then(
        (m) => m.ResourceListComponent,
      ),
  },


  // =====================================================
  // PUBLIC CONTACT FORM
  // =====================================================
  {
    path: 'contact',
    loadComponent: () =>
      import(
        './features/contact/pages/contact/contact'
      ).then(
        (m) => m.ContactComponent,
      ),
  },


  // =====================================================
  // PUBLIC RESOURCE DETAIL
  // =====================================================
  {
    path: 'resources/:slug',
    canActivate: [
      featureGuard,
    ],
    data: {
      featureKey: 'resources',
    },
    resolve: {
      resource: resourceResolver,
    },
    loadComponent: () =>
      import(
        './features/resources/pages/resource-detail/resource-detail.component'
      ).then(
        (m) => m.ResourceDetailComponent,
      ),
  },


  // =====================================================
  // LOGIN
  // =====================================================
  {
    path: 'login',
    loadComponent: () =>
      import(
        './features/auth/pages/login/login.component'
      ).then(
        (m) => m.LoginComponent,
      ),
  },


  // =====================================================
  // PUBLIC REGISTRATION
  // =====================================================
  {
    path: 'register',
    loadComponent: () =>
      import(
        './features/auth/pages/register/register.component'
      ).then(
        (m) => m.RegisterComponent,
      ),
  },


  // =====================================================
  // PUBLIC DONATION
  // =====================================================
  {
    path: 'donate',
    loadComponent: () =>
      import(
        './features/donate/pages/donate/donate.component'
      ).then(
        (m) => m.DonateComponent,
      ),
  },


  // =========================================================
  // RESOURCE FINDER
  // =========================================================
  {
    path: 'find',
    loadComponent: () =>
      import(
        './features/resource-finder/pages/find/find.component'
      ).then(
        (m) => m.FindComponent,
      ),
  },


  // =========================================================
  // JOB FINDER
  // =========================================================
  {
    path: 'find/job',
    loadComponent: () =>
      import(
        './features/resource-finder/pages/job/job-finder.component'
      ).then(
        (m) => m.JobFinderComponent,
      ),
  },


  // =====================================================
  // PUBLIC JOB DETAIL
  // =====================================================
  {
    path: 'jobs/:id',
    loadComponent: () =>
      import(
        './features/jobs/pages/job-detail/job-detail.component'
      ).then(
        (m) => m.JobDetailComponent,
      ),
  },


  // =========================================================
  // JOB FINDER RESULTS
  // =========================================================
  {
    path: 'find/job/results',
    loadComponent: () =>
      import(
        './features/resource-finder/pages/job-results/job-results.component'
      ).then(
        (m) => m.JobResultsComponent,
      ),
  },


  // =========================================================
  // TRAINING FINDER
  // =========================================================
  {
    path: 'find/training',
    loadComponent: () =>
      import(
        './features/resource-finder/pages/training/training-finder.component'
      ).then(
        (m) => m.TrainingFinderComponent,
      ),
  },


  // =========================================================
  // TRAINING FINDER RESULTS
  // =========================================================
  {
    path: 'find/training/results',
    loadComponent: () =>
      import(
        './features/resource-finder/pages/training-results/training-results.component'
      ).then(
        (m) => m.TrainingResultsComponent,
      ),
  },


  // =====================================================
  // ABOUT
  // =====================================================
  {
    path: 'about',
    component: AboutComponent,
  },


  // =====================================================
  // TEST CENTER
  // =====================================================
  {
    path: 'test-center',
    canActivate: [
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/test-center-home/test-center-home.component'
      ).then(
        (m) => m.TestCenterHomeComponent,
      ),
  },


  // =====================================================
  // TEST CENTER COURSE
  // =====================================================
  {
    path: 'test-center/courses/:slug',
    canActivate: [
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/course-detail/course-detail.component'
      ).then(
        (m) => m.TestCourseDetailComponent,
      ),
  },


  // =====================================================
  // TEST CENTER SETUP
  // =====================================================
  {
    path: 'test-center/setup',
    canActivate: [
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/test-setup/test-setup.component'
      ).then(
        (m) => m.TestSetupComponent,
      ),
  },


  // =====================================================
  // TEST CENTER PRACTICE
  // =====================================================
  {
    path: 'test-center/practice',
    canActivate: [
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/test-practice/test-practice.component'
      ).then(
        (m) => m.TestPracticeComponent,
      ),
  },


  // =====================================================
  // TEST CENTER COURSES
  // =====================================================
  {
    path: 'test-center/courses',
    canActivate: [
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/course-list/course-list.component'
      ).then(
        (m) => m.CourseListComponent,
      ),
  },


  // =====================================================
  // PROTECTED COMMUNITY
  // =====================================================
  {
    path: 'community',
    canActivate: [
      authGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'community',
    },
    loadComponent: () =>
      import(
        './features/community/pages/community-home/community-home.component'
      ).then(
        (m) => m.CommunityHomeComponent,
      ),
  },


  // =====================================================
  // COMMUNITY POST DETAIL
  // =====================================================
  {
    path: 'community/post/:postId',
    canActivate: [
      authGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'community',
    },
    loadComponent: () =>
      import(
        './features/community/pages/community-post-detail/community-post-detail.component'
      ).then(
        (m) => m.CommunityPostDetailComponent,
      ),
  },

  // =====================================================
  // LEARNING LABS
  // =====================================================
  {
    path: 'learning',
    canActivate: [
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/learning-lab/pages/learning-lab.component'
      ).then(
        (m) => m.LearningLabComponent,
      ),
  },


  // =====================================================
  // ADMIN TEST CENTER TOPICS
  // =====================================================
  {
    path: 'admin/test-center/topics',
    canActivate: [
      adminGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/test-topics/test-topic-admin.component'
      ).then(
        (m) => m.TestTopicAdminComponent,
      ),
  },


  // =====================================================
  // ADMIN TEST CENTER
  // =====================================================
  {
    path: 'admin/test-center',
    canActivate: [
      adminGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/test-center/test-center-admin-component'
      ).then(
        (m) => m.TestCenterAdminComponent,
      ),
  },


  // =====================================================
  // ADMIN TEST CENTER QUESTIONS
  // =====================================================
  {
    path: 'admin/test-center/questions',
    canActivate: [
      adminGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/test-questions/test-question-admin.component'
      ).then(
        (m) => m.TestQuestionAdminComponent,
      ),
  },


  // =====================================================
  // TEST CENTER RESULTS
  // =====================================================
  {
    path: 'test-center/results',
    canActivate: [
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/test-results/test-results.component'
      ).then(
        (m) => m.TestResultsComponent,
      ),
  },


  // =====================================================
  // PROTECTED USER PROFILE
  // =====================================================
  {
    path: 'profile',
    canActivate: [
      authGuard,
    ],
    loadComponent: () =>
      import(
        './features/profile/pages/user-profile/user-profile'
      ).then(
        (m) => m.UserProfileComponent,
      ),
  },


  // =====================================================
  // PROTECTED RESOURCE SUBMISSION
  // =====================================================
  {
    path: 'submit',
    canActivate: [
      authGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'resources',
    },
    loadComponent: () =>
      import(
        './features/submissions/pages/submit-resource/submit-resource.component'
      ).then(
        (m) => m.SubmitResourceComponent,
      ),
  },


  // =====================================================
  // ADMIN RESOURCE MANAGEMENT
  // =====================================================
  {
    path: 'admin/resources',
    canActivate: [
      adminGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'resources',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/resources/resource-admin.component'
      ).then(
        (m) => m.ResourceAdminComponent,
      ),
  },


  // =====================================================
  // ADMIN ORGANIZATION MANAGEMENT
  // =====================================================
  {
    path: 'admin/organizations',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/organizations/organization-admin.component'
      ).then(
        (m) => m.OrganizationAdminComponent,
      ),
  },


  // =====================================================
  // ADMIN ADD JOB
  // =====================================================
  {
    path: 'admin/jobs/new',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/jobs/job-form/job-form.component'
      ).then(
        (m) => m.JobFormComponent,
      ),
  },


  // =====================================================
  // ADMIN JOB MANAGEMENT
  // =====================================================
  {
    path: 'admin/jobs',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/jobs/job-admin.component'
      ).then(
        (m) => m.JobAdminComponent,
      ),
  },


  // =====================================================
  // ADMIN EDIT JOB
  // =====================================================
  {
    path: 'admin/jobs/:id/edit',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/jobs/job-form/job-form.component'
      ).then(
        (m) => m.JobFormComponent,
      ),
  },


  // =====================================================
  // ADMIN TEST CENTER COURSES
  // =====================================================
  {
    path: 'admin/test-center/courses',
    canActivate: [
      adminGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/test-courses/test-course-admin.component'
      ).then(
        (m) => m.TestCourseAdminComponent,
      ),
  },


  // =====================================================
  // ADMIN USER MANAGEMENT
  // =====================================================
  {
    path: 'admin/users',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/users/user-admin.component'
      ).then(
        (m) => m.UserAdminComponent,
      ),
  },


  // =====================================================
  // ADMIN SUBMISSION MANAGEMENT
  // =====================================================
  {
    path: 'admin/submissions',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/submissions/submission-admin.component'
      ).then(
        (m) => m.SubmissionAdminComponent,
      ),
  },


  // =====================================================
  // ADMIN RESOURCE TYPE MANAGEMENT
  // =====================================================
  {
    path: 'admin/resource-types',
    canActivate: [
      adminGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'resources',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/resource-types/resource-type-admin.component'
      ).then(
        (m) => m.ResourceTypeAdminComponent,
      ),
  },


  // =====================================================
  // ADMIN SENT EMAILS
  // =====================================================
  {
    path: 'admin/contact/sent',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/contact/sent/sent-email.component'
      ).then(
        (m) => m.SentEmailComponent,
      ),
  },


  // =====================================================
  // ADMIN CONTACT MAILBOX
  // =====================================================
  {
    path: 'admin/contact',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/contact/contact-mailbox.component'
      ).then(
        (m) => m.ContactMailboxComponent,
      ),
  },


  // =====================================================
  // ADMIN LOCATION MANAGEMENT
  // =====================================================
  {
    path: 'admin/locations',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/locations/location-admin.component'
      ).then(
        (m) => m.LocationAdminComponent,
      ),
  },


  // =====================================================
  // ADMIN CONFIGURATION / CONTROL CENTER
  // =====================================================
  {
    path: 'admin/configuration',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/configuration/configuration.component'
      ).then(
        (m) => m.ConfigurationComponent,
      ),
  },


  // =====================================================
  // ADMIN DASHBOARD
  // =====================================================
  {
    path: 'admin',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/admin-dashboard/admin-dashboard.component'
      ).then(
        (m) => m.AdminDashboardComponent,
      ),
  },


  // =====================================================
  // ADMIN CATEGORY MANAGEMENT
  // =====================================================
  {
    path: 'admin/categories',
    canActivate: [
      adminGuard,
    ],
    loadComponent: () =>
      import(
        './features/admin/pages/categories/category-admin.component'
      ).then(
        (m) => m.CategoryAdminComponent,
      ),
  },


  // =====================================================
  // BUSINESS OPERATIONS
  // =====================================================
  {
    path: 'admin/business',
    canActivate: [
      adminGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'business-operations',
    },
    loadComponent: () =>
      import(
        './features/business/pages/business-dashboard/business-dashboard.component'
      ).then(
        (m) => m.BusinessDashboardComponent,
      ),
  },


  // =====================================================
  // BUSINESS PROFILE
  // =====================================================
  {
    path: 'admin/business/profile',
    canActivate: [
      adminGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'business-operations',
    },
    loadComponent: () =>
      import(
        './features/business/pages/business-profile/business-profile.component'
      ).then(
        (m) => m.BusinessProfileComponent,
      ),
  },


  // =====================================================
  // FEATURE UNAVAILABLE
  // =====================================================
  //
  // IMPORTANT:
  // This route must NOT use featureGuard.
  // Otherwise disabled applications would create
  // a redirect loop.
  //
  {
    path: 'feature-unavailable',
    loadComponent: () =>
      import(
        './shared/pages/feature-unavailable/feature-unavailable.component'
      ).then(
        (m) => m.FeatureUnavailableComponent,
      ),
  },


  // =====================================================
  // DEFAULT ROUTE
  // =====================================================
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import(
        './features/home/pages/home/home.component'
      ).then(
        (m) => m.HomeComponent,
      ),
  },


  // =====================================================
  // PUBLIC PRIVACY
  // =====================================================
  {
    path: 'privacy',
    loadComponent: () =>
      import(
        './features/privacy/pages/privacy/privacy.component'
      ).then(
        (m) => m.PrivacyComponent,
      ),
  },


  // =====================================================
  // PUBLIC TERMS
  // =====================================================
  {
    path: 'terms',
    loadComponent: () =>
      import(
        './features/terms/pages/terms/terms.component'
      ).then(
        (m) => m.TermsComponent,
      ),
  },


  // =====================================================
  // PUBLIC FAQ
  // =====================================================
  {
    path: 'faq',
    loadComponent: () =>
      import(
        './features/faq/pages/faq/faq.component'
      ).then(
        (m) => m.FaqComponent,
      ),
  },


  // =====================================================
  // PUBLIC ACCESSIBILITY
  // =====================================================
  {
    path: 'accessibility',
    loadComponent: () =>
      import(
        './features/accessibility/pages/accessibility/accessibility.component'
      ).then(
        (m) => m.AccessibilityComponent,
      ),
  },


  // =====================================================
  // FALLBACK / NOT FOUND
  // =====================================================
  {
    path: '**',
    loadComponent: () =>
      import(
        './features/errors/pages/not-found/not-found.component'
      ).then(
        (m) => m.NotFoundComponent,
      ),
  },

];