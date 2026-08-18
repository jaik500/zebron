# Zebron Architecture Specification

## 1. Project Overview

Zebron is a web-based resource center designed to help immigrants,
newcomers, visitors, and international users—particularly people from
Africa and other developing countries—navigate life in the United States.

The platform provides curated access to useful resources including:

- Education
- Employment
- Housing
- Healthcare
- Immigration
- Legal services
- Government services
- Financial services
- Transportation
- Community organizations
- Language resources
- Technology
- Business resources

The initial release is an MVP focused on discovering, searching,
and accessing trusted resources.

The platform will later provide pathways to additional Zebron
business services and products.

---

# 2. MVP Goals

The MVP must allow visitors to:

- Browse resources
- Search resources
- Filter resources
- View resource details
- Browse by category
- Access external resource websites
- Submit a resource for consideration

Administrators must be able to:

- Create resources
- Edit resources
- Publish resources
- Unpublish resources
- Archive resources
- Verify resources
- Manage categories
- Manage organizations
- Review resource submissions

Visitors do not need an account to browse the public resource directory.

Authentication is required for administrative functionality and may
eventually be required for resource submissions.

---

# 3. Technology Stack

## Frontend

- Angular 21
- TypeScript
- Angular Router
- Angular Signals
- NgRx SignalStore where shared state is required
- Angular Material/CDK where appropriate
- SCSS
- Angular SSR

## Backend / Platform

- Firebase
- Firebase App Hosting
- Cloud Firestore
- Firebase Authentication
- Firebase Storage
- Firebase Cloud Functions

## Development

- Angular CLI
- Firebase CLI
- ESLint
- Git
- Firebase Agent Skills
- Angular MCP
- AI coding agent such as Cursor or Claude

---

# 4. Angular Architecture

Use a feature-based architecture.

The application must use standalone Angular components.

Do not introduce NgModules unless explicitly required by
a third-party dependency.

Recommended structure:

src/app/

    core/
        auth/
        guards/
        models/
        services/
        config/

    shared/
        components/
        directives/
        pipes/
        ui/

    features/
        home/
        resources/
        categories/
        organizations/
        search/
        submissions/

    auth/
        login/
        register/
        state/

    admin/
        dashboard/
        resources/
        categories/
        organizations/
        submissions/

    app.routes.ts
    app.config.ts
    app.ts

---

# 5. Core Architectural Principles

The application should follow these principles:

1. Feature-based organization
2. Separation of concerns
3. Strong TypeScript typing
4. Standalone Angular components
5. Signals for local reactive state
6. SignalStore for shared feature state
7. Lazy-loaded feature routes
8. Firebase access through services
9. Security enforced by Firebase Security Rules
10. Angular guards used for navigation and UX
11. Avoid unnecessary abstractions
12. Prefer simple solutions over premature complexity

---

# 6. Angular Coding Standards

Use modern Angular 21 APIs.

Prefer:

- inject()
- Signals
- computed()
- effect() when appropriate
- input()
- output()
- model()
- @if
- @for
- @switch
- standalone components
- lazy-loaded routes
- typed reactive forms

Avoid:

- NgModules unless required
- *ngIf
- *ngFor
- constructor-based dependency injection for new code
- unnecessary BehaviorSubject state
- unnecessary RxJS
- duplicated Firebase initialization
- business logic inside templates
- direct Firestore calls from components

Components should remain focused on presentation and user interaction.

Business logic belongs in services or stores.

---

# 7. Firebase Architecture

Firebase is the primary backend platform.

The Angular application should not contain privileged Firebase
operations.

Firebase responsibilities:

Firestore:
- Application data
- Resources
- Categories
- Organizations
- Users
- Submissions

Authentication:
- Google Sign-In
- Email/Password

Storage:
- Resource images
- Organization logos
- User-submitted files where required

Cloud Functions:
- Trusted server-side operations
- Administrative processing
- Notifications
- Scheduled jobs
- Integrations
- Operations requiring privileged access

App Hosting:
- Angular SSR application hosting

---

# 8. Firestore Collections

Initial collections:

users
categories
organizations
resources
submissions

The schema should remain intentionally simple for the MVP.

---

# 9. User Model

Collection:

users

Interface:

User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;

    role: 'user' | 'admin';

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

Future roles may include:

- user
- editor
- moderator
- admin
- superAdmin

Do not implement additional roles until they are required.

---

# 10. Category Model

Collection:

categories

Interface:

Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;

    active: boolean;
    sortOrder: number;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

Initial categories may include:

- Education
- Employment
- Housing
- Healthcare
- Immigration
- Legal
- Transportation
- Financial Services
- Government Services
- Community
- Language
- Technology
- Business
- Family

Categories must be data-driven.

Do not hard-code categories throughout the application.

---

# 11. Organization Model

Collection:

organizations

Interface:

Organization {
    id: string;

    name: string;
    slug: string;

    description?: string;

    website?: string;
    phone?: string;
    email?: string;

    logoUrl?: string;

    location?: Location;

    verified: boolean;
    active: boolean;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

Organizations are separate entities because one organization may
provide multiple resources.

---

# 12. Location Model

Location {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;

    country: string;

    latitude?: number;
    longitude?: number;
}

Do not store geographic information as a single unstructured string
when structured fields are available.

The model should support future location-based search.

---

# 13. Resource Model

Collection:

resources

The Resource entity is the core entity of Zebron.

Interface:

Resource {
    id: string;

    name: string;
    slug: string;

    description: string;

    categoryId: string;
    organizationId?: string;

    resourceType: ResourceType;

    website?: string;
    phone?: string;
    email?: string;

    location?: Location;

    online: boolean;

    cost?: CostInformation;

    tags: string[];

    status: ResourceStatus;

    verified: boolean;
    featured: boolean;

    createdBy: string;

    createdAt: Timestamp;
    updatedAt: Timestamp;

    lastVerifiedAt?: Timestamp;
}

ResourceType:

- government
- nonprofit
- education
- business
- community
- service
- tool
- other

ResourceStatus:

- draft
- pending
- published
- archived

Resources must have an explicit lifecycle.

Do not use only an "active" boolean to represent publication state.

---

# 14. Resource Submission Model

Collection:

submissions

Interface:

ResourceSubmission {
    id: string;

    submittedBy?: string;

    resourceName: string;
    description: string;

    website?: string;

    categoryId?: string;

    organizationName?: string;

    location?: Location;

    submitterEmail?: string;

    status: 'pending' | 'approved' | 'rejected';

    reviewedBy?: string;
    reviewedAt?: Timestamp;

    createdAt: Timestamp;
}

Submissions must not automatically become public resources.

The workflow is:

Visitor
    ↓
Submit Resource
    ↓
Submission
    ↓
Admin Review
    ↓
Approve / Reject
    ↓
Resource
    ↓
Publish

---

# 15. Authentication

Supported providers:

- Google Sign-In
- Email/Password

Anonymous Firebase Authentication should not be enabled
unless a future feature requires it.

Public visitors can browse resources without authenticating.

Authentication is required for protected functionality.

---

# 16. Authorization

Application roles:

user
admin

Users:

- Access public resources
- Submit resources
- Manage their own profile

Administrators:

- Manage resources
- Manage categories
- Manage organizations
- Review submissions
- Publish resources
- Verify resources
- Archive resources

Authorization must ultimately be enforced using Firebase Security Rules.

Angular route guards are not a substitute for backend security.

---

# 17. Firestore Security Strategy

Public users:

READ:
- Published resources
- Active categories
- Active organizations

WRITE:
- No direct writes to public resources

Authenticated users:

CREATE:
- Resource submissions

READ:
- Public resources
- Public categories
- Public organizations

UPDATE:
- Their own permitted user profile information

Administrators:

CREATE:
- Resources
- Categories
- Organizations

UPDATE:
- Resources
- Categories
- Organizations
- Submissions

DELETE:
- Only where explicitly permitted

PUBLISH:
- Resources

ARCHIVE:
- Resources

Security Rules must enforce authorization independently of the Angular application.

---

# 18. State Management

Use Angular Signals for local component state.

Use NgRx SignalStore for shared feature state.

Initial stores:

- AuthStore
- ResourceStore
- SearchStore

Do not create a store for every component.

ResourceStore may manage:

- Resources
- Loading state
- Error state
- Filters
- Search term
- Selected category
- Selected location
- Pagination state

---

# 19. Routing

Public routes:

/
 /resources
 /resources/:slug
 /categories
 /search
 /about
 /contact

Authentication routes:

/auth/login
/auth/register

Administrative routes:

/admin
/admin/resources
/admin/categories
/admin/organizations
/admin/submissions

Administrative routes must be protected by authentication and
authorization guards.

Routes should be lazy loaded where appropriate.

---

# 20. SEO

SEO is an important part of Zebron because the platform is a
public information/resource center.

Use Angular SSR for public content.

Resource pages should have:

- Meaningful URLs
- Dynamic page titles
- Meta descriptions
- Canonical URLs
- Open Graph metadata where appropriate
- Structured content where appropriate

Example:

/resources/coding-bootcamps-maryland

is preferred over:

/resources/12345

---

# 21. Public User Experience

The public site should prioritize:

- Simplicity
- Accessibility
- Mobile responsiveness
- Fast loading
- Searchability
- Clear navigation
- Trust
- Readability

Avoid unnecessary modals for full-page content.

Full-page content should generally use normal routes/pages.

Modals should be reserved for:

- Confirmation
- Short forms
- Quick actions
- Focused interactions

---

# 22. Resource Discovery

The primary user journey is:

Home
    ↓
Search / Category
    ↓
Resource List
    ↓
Resource Detail
    ↓
External Resource

The resource directory should support:

- Keyword search
- Category filtering
- Location filtering
- Online/offline filtering
- Resource type
- Tags
- Featured resources

---

# 23. Admin Experience

The admin interface should prioritize efficient content management.

Admin users should be able to:

- View resources
- Filter resources
- Create resources
- Edit resources
- Verify resources
- Publish resources
- Archive resources
- Review submissions

The admin interface should not unnecessarily use the public site's
navigation patterns.

---

# 24. Service Layer

Components must not directly contain Firestore access logic.

Preferred pattern:

Component
    ↓
SignalStore / Service
    ↓
Firebase SDK
    ↓
Firestore

Example:

ResourceListComponent
    ↓
ResourceStore
    ↓
ResourceService
    ↓
Firestore

---

# 25. Error Handling

The application must provide explicit handling for:

- Network failures
- Firestore permission errors
- Authentication failures
- Missing resources
- Invalid routes
- Empty search results
- Form validation errors

Do not silently swallow errors.

User-facing errors should be understandable.

Developer-facing errors should contain sufficient diagnostic information.

---

# 26. Loading and Empty States

Every asynchronous feature should account for:

Loading
Success
Empty
Error

Example:

Resource List

    Loading
       ↓
    Success → Display resources

    Loading
       ↓
    Empty → "No resources found"

    Loading
       ↓
    Error → Error message + retry

---

# 27. Accessibility

The application should follow WCAG-oriented accessibility practices.

Requirements include:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Accessible labels
- Appropriate color contrast
- Alternative text for meaningful images
- Accessible form validation
- Appropriate ARIA usage

Do not use ARIA when native semantic HTML already provides the required behavior.

---

# 28. Security Principles

Never expose:

- Private credentials
- Service account keys
- Admin SDK credentials
- API secrets
- Sensitive environment values

Firebase client configuration is not considered a secret.

Security must be implemented through:

- Firebase Authentication
- Firestore Security Rules
- Storage Security Rules
- Cloud Functions for privileged operations

---

# 29. AI Development Rules

AI coding agents must follow this architecture.

Before modifying the project:

1. Read this architecture document.
2. Read the applicable Firebase Agent Skill.
3. Follow Angular 21 best practices.
4. Inspect existing code before creating new abstractions.
5. Reuse existing services and components where appropriate.
6. Do not introduce competing architectural patterns.
7. Do not create unnecessary dependencies.
8. Do not modify security rules without explaining the security impact.
9. Do not bypass Firestore Security Rules.
10. Do not place Firebase privileged operations in client-side code.

AI-generated code must be reviewed before being committed.

---

# 30. Git Strategy

The master branch represents stable code.

Use feature branches for meaningful development:

feature/resource-directory
feature/authentication
feature/admin-resources
feature/search

Commit messages should describe the change.

Examples:

feat: add resource data model

feat: implement resource directory

fix: correct resource filtering

chore: update Firebase configuration

Security-sensitive changes should receive additional review.

---

# 31. MVP Definition of Done

The MVP is considered ready when:

- Public users can browse resources.
- Public users can search resources.
- Public users can filter resources.
- Resource detail pages work.
- Resources have categories.
- Resources can be managed by administrators.
- Administrators can publish and archive resources.
- Users can submit resources.
- Administrators can review submissions.
- Authentication works.
- Firestore Security Rules are tested.
- Storage Security Rules are tested.
- SSR works correctly.
- The site is responsive.
- Accessibility issues have been reviewed.
- Production configuration is separated from development configuration.
- Application is deployed through Firebase App Hosting.
- Custom domain is configured.
- Git repository contains the production-ready code.

---

# 32. Future Architecture

The MVP should not prematurely implement future functionality.

Potential future capabilities include:

- Personalized recommendations
- Location-aware recommendations
- Community reviews
- Resource ratings
- Notifications
- Saved resources
- User profiles
- Organization portals
- Sponsored resources
- Business directory
- Job marketplace
- Training marketplace
- Immigration assistance services
- Premium services
- Zebron business platform integration

These capabilities should be added after the core resource directory
has been validated.

---

# 33. Architectural Principle

The primary goal is to build a simple, maintainable, scalable foundation.

Do not optimize for theoretical future requirements.

Build the MVP around the core question:

"Can Zebron help a newcomer quickly find trustworthy and useful
resources in the United States?"

Every feature should support that goal.
