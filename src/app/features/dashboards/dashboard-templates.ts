import { DashboardTemplate } from '../../shared/dashboards/dashboard.model';

/**
 * Starter dashboards. Creating a dashboard copies a template into Firestore;
 * later changes here never overwrite an organization's own edits. Bump
 * `version` when a template changes.
 *
 * Widgets a viewer can't use (e.g. org-wide figures for members) are hidden
 * from them in view mode, so one template serves everyone.
 */
export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'organization-overview',
    version: 1,
    name: 'Organization overview',
    description: 'Your apps, what’s coming up and how learning is going.',
    appId: 'organization',
    widgets: [
      { type: 'apps', size: 'f', title: 'Your apps', config: {} },
      { type: 'note', size: 'm', title: 'Welcome', config: { text: 'Welcome! Use this space for announcements and instructions.' } },
      { type: 'list', size: 'm', title: 'Upcoming live sessions', config: { source: 'virtualClassroom.upcomingSessions', limit: 5 } },
      { type: 'kpi', size: 's', title: 'Course completion', config: { metric: 'learning.completionPercent' } },
      { type: 'kpi', size: 's', title: 'Overdue assignments', config: { metric: 'learning.overdueAssignments' } },
      { type: 'progress', size: 'm', title: 'My assignments', config: { metric: 'me.assignmentProgress' } },
      { type: 'list', size: 'm', title: 'Latest in the community', config: { source: 'community.recentPosts', limit: 5 } },
    ],
  },
  {
    id: 'learning',
    version: 2,
    name: 'Learning',
    description: 'Course progress for the team and for you, assignments and live sessions.',
    appId: 'learning',
    widgets: [
      { type: 'kpi', size: 's', title: 'Course completion', config: { metric: 'learning.completionPercent' } },
      { type: 'kpi', size: 's', title: 'Active learners', config: { metric: 'learning.activeLearners' } },
      { type: 'kpi', size: 's', title: 'Overdue assignments', config: { metric: 'learning.overdueAssignments' } },
      { type: 'kpi', size: 's', title: 'Certificates', config: { metric: 'learning.certificates' } },
      { type: 'bar-chart', size: 'm', title: 'Courses completed per week', config: { source: 'learning.completionsByWeek' } },
      { type: 'bar-chart', size: 'm', title: 'Assignments by status', config: { source: 'learning.assignmentStatus' } },
      { type: 'progress', size: 'm', title: 'My assignments', config: { metric: 'me.assignmentProgress' } },
      { type: 'list', size: 'm', title: 'My open assignments', config: { source: 'me.openAssignments', limit: 5 } },
      { type: 'list', size: 'm', title: 'Continue learning', config: { source: 'me.coursesInProgress', limit: 5 } },
      { type: 'live-polls', size: 'f', title: 'Live polls', config: {} },
    ],
  },
  {
    id: 'business',
    version: 1,
    name: 'Business overview',
    description: 'Revenue, expenses and compliance from Business Operations.',
    appId: 'business-operations',
    requiresApp: 'business-operations',
    permission: 'business.manage',
    widgets: [
      { type: 'kpi', size: 's', title: 'Revenue this month', config: { metric: 'business.revenueThisMonth' } },
      { type: 'kpi', size: 's', title: 'Expenses this month', config: { metric: 'business.expensesThisMonth' } },
      { type: 'kpi', size: 's', title: 'Net this month', config: { metric: 'business.netThisMonth' } },
      { type: 'kpi', size: 's', title: 'Compliance to act on', config: { metric: 'business.complianceAttention' } },
      { type: 'bar-chart', size: 'm', title: 'Revenue by month', config: { source: 'business.revenueByMonth' } },
      { type: 'bar-chart', size: 'm', title: 'Expenses by month', config: { source: 'business.expensesByMonth' } },
      { type: 'bar-chart', size: 'm', title: 'Compliance by status', config: { source: 'business.complianceByStatus' } },
      { type: 'note', size: 'm', title: 'Notes', config: { text: 'Figures count completed transactions only and are updated every night.' } },
    ],
  },
];
