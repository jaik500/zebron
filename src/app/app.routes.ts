import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { featureGuard } from './core/guards/feature.guard';
import { partnerAdminGuard } from './core/guards/partner-admin.guard';
import { partnerOrganizationGuard } from './core/guards/partner-organization.guard';

import { resourceResolver } from './features/resources/resolvers/resource.resolver';

import { AboutComponent } from './features/about/pages/about/about.component';

export const routes: Routes = [

  // =====================================================
  // PUBLIC
  // =====================================================

  // -----------------------------------------------------
  // HOME
  // -----------------------------------------------------
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

  // -----------------------------------------------------
  // LOGIN
  // -----------------------------------------------------
  {
    path: 'login',
    data: {
      title: 'Zebron | Login',
    },
    loadComponent: () =>
      import(
        './features/auth/pages/login/login.component'
      ).then(
        (m) => m.LoginComponent,
      ),
  },

  // -----------------------------------------------------
  // REGISTRATION
  // -----------------------------------------------------
  {
    path: 'register',
    data: {
      title: 'Zebron | Register',
    },
    loadComponent: () =>
      import(
        './features/auth/pages/register/register.component'
      ).then(
        (m) => m.RegisterComponent,
      ),
  },

  // -----------------------------------------------------
  // RESOURCES
  // -----------------------------------------------------
  {
    path: 'resources',
    canActivate: [featureGuard],
    data: {
      featureKey: 'resources',
      title: 'Find the help you need',
    },
    loadComponent: () =>
      import(
        './features/resources/pages/resource-list/resource-list.component'
      ).then(
        (m) => m.ResourceListComponent,
      ),
  },

  {
    path: 'resources/:slug',
    canActivate: [featureGuard],
    data: {
      featureKey: 'resources',
      title: 'Zebron | Resources',
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

  // -----------------------------------------------------
  // RESOURCE FINDER
  // -----------------------------------------------------
  {
    path: 'find',
    data: {
      title: 'Find your next opportunity',
    },
    loadComponent: () =>
      import(
        './features/resource-finder/pages/find/find.component'
      ).then(
        (m) => m.FindComponent,
      ),
  },

  // -----------------------------------------------------
  // JOB FINDER
  // -----------------------------------------------------
  {
    path: 'find/job',
    data: {
      title: 'Find a job',
    },
    loadComponent: () =>
      import(
        './features/resource-finder/pages/job/job-finder.component'
      ).then(
        (m) => m.JobFinderComponent,
      ),
  },

  {
    path: 'find/job/results',
    data: {
      title: 'Zebron | Jobs',
    },
    loadComponent: () =>
      import(
        './features/resource-finder/pages/job-results/job-results.component'
      ).then(
        (m) => m.JobResultsComponent,
      ),
  },

  // -----------------------------------------------------
  // TRAINING FINDER
  // -----------------------------------------------------
  {
    path: 'find/training',
    data: {
      title: 'Find a training',
    },
    loadComponent: () =>
      import(
        './features/resource-finder/pages/training/training-finder.component'
      ).then(
        (m) => m.TrainingFinderComponent,
      ),
  },

  {
    path: 'find/training/results',
    data: {
      title: 'Zebron | Trainings',
    },
    loadComponent: () =>
      import(
        './features/resource-finder/pages/training-results/training-results.component'
      ).then(
        (m) => m.TrainingResultsComponent,
      ),
  },

  // -----------------------------------------------------
  // JOB DETAILS
  // -----------------------------------------------------
  {
    path: 'jobs/:id',
    data: {
      title: 'Zebron | Job detail',
    },
    loadComponent: () =>
      import(
        './features/jobs/pages/job-detail/job-detail.component'
      ).then(
        (m) => m.JobDetailComponent,
      ),
  },

  // -----------------------------------------------------
  // CONTACT
  // -----------------------------------------------------
  {
    path: 'contact',
    data: {
      title: 'Contact Us',
    },
    loadComponent: () =>
      import(
        './features/contact/pages/contact/contact'
      ).then(
        (m) => m.ContactComponent,
      ),
  },

  // -----------------------------------------------------
  // DONATIONS
  // -----------------------------------------------------
  {
    path: 'donate',
    data: {
      title: 'Help us make resources easier to find',
    },
    loadComponent: () =>
      import(
        './features/donate/pages/donate/donate.component'
      ).then(
        (m) => m.DonateComponent,
      ),
  },

  // -----------------------------------------------------
  // ABOUT
  // -----------------------------------------------------
  {
    path: 'about',
    data: {
      title: 'About Zebron',
    },
    component: AboutComponent,
  },

  // -----------------------------------------------------
  // TAX & PAY CALCULATOR
  // -----------------------------------------------------
  {
    path: 'tax-calculator',
    data: {
      title: 'Zebron | Tax & Pay Calculator',
    },
    loadComponent: () =>
      import(
        './features/tax-pay-calculator/pages/tax-pay-calculator/tax-pay-calculator.component'
      ).then(
        (m) => m.TaxPayCalculatorComponent,
      ),
  },

  // =====================================================
  // AUTHENTICATED USER
  // =====================================================

  // -----------------------------------------------------
  // USER PROFILE
  // -----------------------------------------------------
  {
    path: 'profile',
    canActivate: [authGuard],
    data: {
      title: 'Zebron | Profile',
    },
    loadComponent: () =>
      import(
        './features/profile/pages/user-profile/user-profile'
      ).then(
        (m) => m.UserProfileComponent,
      ),
  },

  // -----------------------------------------------------
  // RESOURCE SUBMISSION
  // -----------------------------------------------------
  {
    path: 'submit',
    canActivate: [authGuard, featureGuard],
    data: {
      featureKey: 'resources',
      title: 'Submit a resource',
    },
    loadComponent: () =>
      import(
        './features/submissions/pages/submit-resource/submit-resource.component'
      ).then(
        (m) => m.SubmitResourceComponent,
      ),
  },

 // ============================================================
// ORGANIZATION APPLICATION
// ============================================================

{
  path: 'organizations/apply',
  canActivate: [authGuard],
  data: {
    title: 'Organization Application',
  },
  loadComponent: () =>
    import(
      './features/organizations/application/organization-application-form.component'
    ).then(
      (m) => m.OrganizationApplicationFormComponent,
    ),
},

{
  path: 'organizations/apply/:id',
  canActivate: [authGuard],
  data: {
    title: 'Edit Organization Application',
  },
  loadComponent: () =>
    import(
      './features/organizations/application/organization-application-form.component'
    ).then(
      (m) => m.OrganizationApplicationFormComponent,
    ),
},

{
  path: 'organizations/application/:id',
  canActivate: [authGuard],
  data: {
    title: 'Organization Application Status',
  },
  loadComponent: () =>
    import(
      './features/organizations/application/organization-application-status.component'
    ).then(
      (m) => m.OrganizationApplicationStatusComponent,
    ),
},

// ============================================================
// ADMIN — ORGANIZATION APPLICATIONS
// ============================================================

{
  path: 'admin/organizations/applications',
  canActivate: [adminGuard],
  data: {
    title: 'Organization Applications',
  },
  loadComponent: () =>
    import(
      './features/admin/pages/organizations/organization-application-admin.component'
    ).then(
      (m) => m.OrganizationApplicationAdminComponent,
    ),
},

{
  path: 'partner/org/:organizationId/onboarding',
  canActivate: [
    authGuard,
    partnerOrganizationGuard,
  ],
  data: {
    title: 'Partner | Organization Onboarding',
  },
  loadComponent: () =>
    import(
      './features/partner/pages/partner-onboarding/partner-onboarding.component'
    ).then(
      (m) => m.PartnerOnboardingComponent,
    ),
},


  // =====================================================
  // COMMUNITY
  // =====================================================

  // -----------------------------------------------------
  // COMMUNITY HOME
  // -----------------------------------------------------
  {
    path: 'community',
    canActivate: [authGuard, featureGuard],
    data: {
      featureKey: 'community',
      title: 'Zebron | Community',
    },
    loadComponent: () =>
      import(
        './features/community/pages/community-home/community-home.component'
      ).then(
        (m) => m.CommunityHomeComponent,
      ),
  },

  // -----------------------------------------------------
  // COMMUNITY USER PROFILE
  // -----------------------------------------------------
  {
    path: 'community/users/:userId',
    canActivate: [authGuard, featureGuard],
    data: {
      featureKey: 'community',
      title: 'Zebron | Community user',
    },
    loadComponent: () =>
      import(
        './features/community/pages/community-user-profile/community-user-profile.component'
      ).then(
        (m) => m.CommunityUserProfileComponent,
      ),
  },

  // -----------------------------------------------------
  // COMMUNITY POST
  // -----------------------------------------------------
  {
    path: 'community/post/:postId',
    canActivate: [authGuard, featureGuard],
    data: {
      featureKey: 'community',
      title: 'Zebron | Community post detail',
    },
    loadComponent: () =>
      import(
        './features/community/pages/community-post-detail/community-post-detail.component'
      ).then(
        (m) => m.CommunityPostDetailComponent,
      ),
  },

  // -----------------------------------------------------
  // COMMUNITY MEMBERS
  // -----------------------------------------------------
  {
    path: 'community/members',
    canActivate: [authGuard, featureGuard],
    data: {
      featureKey: 'community',
      title: 'Zebron | Community members',
    },
    loadComponent: () =>
      import(
        './features/community/pages/community-members/community-members.component'
      ).then(
        (m) => m.CommunityMembersComponent,
      ),
  },

  // -----------------------------------------------------
  // COMMUNITY NOTIFICATIONS
  // -----------------------------------------------------
  {
    path: 'community/notifications',
    canActivate: [authGuard, featureGuard],
    data: {
      featureKey: 'community',
      title: 'Zebron | Community notifications',
    },
    loadComponent: () =>
      import(
        './features/community/pages/community-notifications/community-notifications.component'
      ).then(
        (m) => m.CommunityNotificationsComponent,
      ),
  },

  // -----------------------------------------------------
  // COMMUNITY CHAT
  // -----------------------------------------------------
  {
    path: 'community/chat',
    canActivate: [authGuard, featureGuard],
    data: {
      featureKey: 'community',
      title: 'Zebron | Community chat',
    },
    loadComponent: () =>
      import(
        './features/community/chat/pages/community-chat/community-chat.component'
      ).then(
        (m) => m.CommunityChatComponent,
      ),
  },

  // =====================================================
  // TEST CENTER
  // =====================================================

  // -----------------------------------------------------
  // TEST CENTER HOME
  // -----------------------------------------------------
  {
    path: 'test-center',
    canActivate: [featureGuard],
    data: {
      featureKey: 'test-center',
      title: 'Test Center',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/test-center-home/test-center-home.component'
      ).then(
        (m) => m.TestCenterHomeComponent,
      ),
  },

  // -----------------------------------------------------
  // TEST CENTER COURSES
  // -----------------------------------------------------
  {
    path: 'test-center/courses',
    canActivate: [featureGuard],
    data: {
      featureKey: 'test-center',
      title: 'Test Center | Courses',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/course-list/course-list.component'
      ).then(
        (m) => m.CourseListComponent,
      ),
  },

  // -----------------------------------------------------
  // TEST CENTER COURSE DETAIL
  // -----------------------------------------------------
  {
    path: 'test-center/courses/:slug',
    canActivate: [featureGuard],
    data: {
      featureKey: 'test-center',
      title: 'Test Center | Course detail',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/course-detail/course-detail.component'
      ).then(
        (m) => m.TestCourseDetailComponent,
      ),
  },

  // -----------------------------------------------------
  // TEST CENTER SETUP
  // -----------------------------------------------------
  {
    path: 'test-center/setup',
    canActivate: [featureGuard],
    data: {
      featureKey: 'test-center',
      title: 'Test Center | Setup',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/test-setup/test-setup.component'
      ).then(
        (m) => m.TestSetupComponent,
      ),
  },

  // -----------------------------------------------------
  // TEST CENTER PRACTICE
  // -----------------------------------------------------
  {
    path: 'test-center/practice',
    canActivate: [featureGuard],
    data: {
      featureKey: 'test-center',
      title: 'Test Center | Practice',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/test-practice/test-practice.component'
      ).then(
        (m) => m.TestPracticeComponent,
      ),
  },

  // -----------------------------------------------------
  // TEST CENTER RESULTS
  // -----------------------------------------------------
  {
    path: 'test-center/results',
    canActivate: [featureGuard],
    data: {
      featureKey: 'test-center',
      title: 'Test Center | Results',
    },
    loadComponent: () =>
      import(
        './features/test-center/pages/test-results/test-results.component'
      ).then(
        (m) => m.TestResultsComponent,
      ),
  },

  // =====================================================
  // LEARNING
  // =====================================================

  {
    path: 'learning',
    canActivate: [featureGuard],
    data: {
      featureKey: 'test-center',
      title: 'Zebron | Learning Lab',
    },
    loadComponent: () =>
      import(
        './features/learning-lab/pages/learning-lab.component'
      ).then(
        (m) => m.LearningLabComponent,
      ),
  },

  // =====================================================
  // PARTNER PORTAL
  // =====================================================

  // -----------------------------------------------------
  // ORGANIZATION SELECTOR
  // -----------------------------------------------------
  {
    path: 'partner',
    canActivate: [authGuard],
    data: {
      title: 'Partner | Organization Selection',
    },
    loadComponent: () =>
      import(
        './features/partner/pages/partner-portal/partner-portal.component'
      ).then(
        (m) => m.PartnerPortalComponent,
      ),
  },

  // -----------------------------------------------------
  // ORGANIZATION DASHBOARD
  // -----------------------------------------------------
  {
    path: 'partner/org/:organizationId/dashboard',
    canActivate: [
      authGuard,
      partnerOrganizationGuard,
      partnerAdminGuard,
    ],
    data: {
      title: 'Partner | Organization Dashboard',
    },
    loadComponent: () =>
      import(
        './features/partner/pages/partner-admin/partner-admin.component'
      ).then(
        (m) => m.PartnerAdminComponent,
      ),
  },

  // -----------------------------------------------------
  // ORGANIZATION TEST CENTER
  // -----------------------------------------------------
  {
    path: 'partner/org/:organizationId/test-center',
    canActivate: [
      authGuard,
      partnerOrganizationGuard,
      featureGuard,
    ],
    data: {
      featureKey: 'test-center',
      title: 'Partner | Test Center',
    },
    loadComponent: () =>
      import(
        './features/partner/test-center/partner-test-center.component'
      ).then(
        (m) => m.PartnerTestCenterComponent,
      ),
  },

  // -----------------------------------------------------
  // PARTNER ADMINISTRATION
  // -----------------------------------------------------
  {
    path: 'partner/dashboard',
    canActivate: [
      authGuard,
      partnerAdminGuard,
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import(
            './features/partner/pages/partner-admin/partner-admin.component'
          ).then(
            (m) => m.PartnerAdminComponent,
          ),
      },

      {
        path: 'settings',
        loadComponent: () =>
          import(
            './features/partner/pages/partner-settings/partner-settings.component'
          ).then(
            (m) => m.PartnerSettingsComponent,
          ),
      },
    ],
  },

  // -----------------------------------------------------
  // PARTNER PROGRAMS
  // -----------------------------------------------------
  {
    path: 'partner/dashboard/programs',
    canActivate: [authGuard],
    data: {
      title: 'Partner | Programs',
    },
    loadComponent: () =>
      import(
        './features/partner/pages/partner-programs/partner-programs.component'
      ).then(
        (m) => m.PartnerProgramsComponent,
      ),
  },

  // -----------------------------------------------------
  // PARTNER TEST CENTER QUESTIONS
  // -----------------------------------------------------
  {
    path: 'partner/test-center/questions',
    canActivate: [
      authGuard,
      featureGuard,
    ],
    data: {
      title: 'Partner | Test Center Questions',
      featureKey: 'test-center',
    },
    loadComponent: () =>
      import(
        './features/partner/pages/partner-test-questions/partner-test-questions.component'
      ).then(
        (m) => m.PartnerTestQuestionsComponent,
      ),
  },

  // =====================================================
  // ADMINISTRATION
  // =====================================================

  // -----------------------------------------------------
  // ADMIN DASHBOARD
  // -----------------------------------------------------
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/admin-dashboard/admin-dashboard.component'
      ).then(
        (m) => m.AdminDashboardComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN ORGANIZATIONS
  // -----------------------------------------------------
  {
    path: 'admin/organizations',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Organizations',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/organizations/organization-admin.component'
      ).then(
        (m) => m.OrganizationAdminComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN USERS
  // -----------------------------------------------------
  {
    path: 'admin/users',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/users/user-admin.component'
      ).then(
        (m) => m.UserAdminComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN RESOURCES
  // -----------------------------------------------------
  {
    path: 'admin/resources',
    canActivate: [adminGuard, featureGuard],
    data: {
      featureKey: 'resources',
      title: 'Admin | Resources',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/resources/resource-admin.component'
      ).then(
        (m) => m.ResourceAdminComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN RESOURCE TYPES
  // -----------------------------------------------------
  {
    path: 'admin/resource-types',
    canActivate: [adminGuard, featureGuard],
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

  // -----------------------------------------------------
  // ADMIN CATEGORIES
  // -----------------------------------------------------
  {
    path: 'admin/categories',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/categories/category-admin.component'
      ).then(
        (m) => m.CategoryAdminComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN LOCATIONS
  // -----------------------------------------------------
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

  // -----------------------------------------------------
  // ADMIN SUBMISSIONS
  // -----------------------------------------------------
  {
    path: 'admin/submissions',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/submissions/submission-admin.component'
      ).then(
        (m) => m.SubmissionAdminComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN JOBS
  // -----------------------------------------------------
  {
    path: 'admin/jobs',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Jobs',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/jobs/job-admin.component'
      ).then(
        (m) => m.JobAdminComponent,
      ),
  },

  {
    path: 'admin/jobs/new',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Add a job',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/jobs/job-form/job-form.component'
      ).then(
        (m) => m.JobFormComponent,
      ),
  },

  {
    path: 'admin/jobs/:id/edit',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Edit a job',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/jobs/job-form/job-form.component'
      ).then(
        (m) => m.JobFormComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN TAX & PAY
  // -----------------------------------------------------
  {
    path: 'admin/tax-pay',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Tax & Pay',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/tax-pay/tax-pay-admin.component'
      ).then(
        (m) => m.TaxPayAdminComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN TEST CENTER
  // -----------------------------------------------------
  {
    path: 'admin/test-center',
    canActivate: [adminGuard, featureGuard],
    data: {
      featureKey: 'test-center',
      title: 'Admin | Test Center',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/test-center/test-center-admin-component'
      ).then(
        (m) => m.TestCenterAdminComponent,
      ),
  },

  {
    path: 'admin/test-center/courses',
    canActivate: [adminGuard, featureGuard],
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

  {
    path: 'admin/test-center/questions',
    canActivate: [adminGuard, featureGuard],
    data: {
      featureKey: 'test-center',
      title: 'Zebron | Test Center questions',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/test-questions/test-question-admin.component'
      ).then(
        (m) => m.TestQuestionAdminComponent,
      ),
  },

  {
    path: 'admin/test-center/topics',
    canActivate: [adminGuard, featureGuard],
    data: {
      featureKey: 'test-center',
      title: 'Zebron | Test Center topics',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/test-topics/test-topic-admin.component'
      ).then(
        (m) => m.TestTopicAdminComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN COMMUNITY
  // -----------------------------------------------------
  {
    path: 'admin/community/topics',
    canActivate: [adminGuard, featureGuard],
    data: {
      featureKey: 'community',
      title: 'Admin | Community | Topics',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/community/topics/community-topics-admin'
      ).then(
        (m) => m.CommunityTopicsAdminComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN KNOWLEDGE CENTER
  // -----------------------------------------------------
  {
    path: 'admin/configuration/knowledge',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Knowledge Center',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/knowledge/knowledge-center.component'
      ).then(
        (m) => m.KnowledgeCenterComponent,
      ),
  },

  {
    path: 'admin/configuration/knowledge/new',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | New Knowledge Article',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/knowledge/components/knowledge-article-editor/knowledge-article-editor.component'
      ).then(
        (m) => m.KnowledgeArticleEditorComponent,
      ),
  },

  {
    path: 'admin/configuration/knowledge/:id/edit',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Edit Knowledge Article',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/knowledge/components/knowledge-article-editor/knowledge-article-editor.component'
      ).then(
        (m) => m.KnowledgeArticleEditorComponent,
      ),
  },

  {
    path: 'admin/configuration/knowledge/:id',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Knowledge Article',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/knowledge/components/knowledge-article-detail/knowledge-article-detail.component'
      ).then(
        (m) => m.KnowledgeArticleDetailComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN CONFIGURATION / CONTROL CENTER
  // -----------------------------------------------------
  {
    path: 'admin/configuration',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Configuration',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/configuration/configuration.component'
      ).then(
        (m) => m.ConfigurationComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN CONTENT & OPERATIONS
  // -----------------------------------------------------
  {
    path: 'admin/content-operations',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Content & Operations',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/content-operations/pages/content-operations.component'
      ).then(
        (m) => m.ContentOperationsComponent,
      ),
  },

  {
    path: 'admin/content-operations/milestones',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Content & Operations | Milestones',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/content-operations/pages/milestones/content-milestones.component'
      ).then(
        (m) => m.ContentMilestonesComponent,
      ),
  },

  {
    path: 'admin/content-operations/captures',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Content & Operations | Capture Moments',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/content-operations/pages/captures/content-captures.component'
      ).then(
        (m) => m.ContentCapturesComponent,
      ),
  },

  {
    path: 'admin/content-operations/tools',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Content & Operations | Tools',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/content-operations/pages/tools/content-tools.component'
      ).then(
        (m) => m.ContentToolsComponent,
      ),
  },

  {
    path: 'admin/content-operations/content',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Content & Operations | Content',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/content-operations/pages/content/content-page.component'
      ).then(
        (m) => m.ContentPageComponent,
      ),
  },

  {
    path: 'admin/content-operations/content/create',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Content & Operations | Create Content',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/content-operations/pages/content/create-content.component'
      ).then(
        (m) => m.CreateContentComponent,
      ),
  },

  {
    path: 'admin/content-operations/content/:id/edit',
    canActivate: [adminGuard],
    data: {
      title: 'Admin | Content & Operations | Edit Content',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/content-operations/pages/content/edit-content.component'
      ).then(
        (m) => m.EditContentComponent,
      ),
  },

  {
    path: 'admin/content-operations/ideas',
    canActivate: [adminGuard],
    data: {
      title: 'Content Ideas',
    },
    loadComponent: () =>
      import(
        './features/admin/pages/content-operations/pages/ideas/content-ideas.component'
      ).then(
        (m) => m.ContentIdeasComponent,
      ),
  },

  // -----------------------------------------------------
  // ADMIN BUSINESS OPERATIONS
  // -----------------------------------------------------
  {
    path: 'admin/business',
    canActivate: [adminGuard, featureGuard],
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

  {
    path: 'admin/business/profile',
    canActivate: [adminGuard, featureGuard],
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

  // -----------------------------------------------------
  // ADMIN CONTACT
  // -----------------------------------------------------
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

  // =====================================================
  // SYSTEM
  // =====================================================

  // -----------------------------------------------------
  // FEATURE UNAVAILABLE
  // -----------------------------------------------------
  //
  // IMPORTANT:
  // This route must NOT use featureGuard.
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

  // -----------------------------------------------------
  // NOT FOUND
  // -----------------------------------------------------
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