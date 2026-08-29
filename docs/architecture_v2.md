Zebron Architecture Documentation

Version 2.0 — Platform Foundation & Target Architecture

Updated: August 29, 2026

Purpose: establish a scalable architectural foundation for Zebron as it evolves from an MVP into a broader resource, opportunity, training, and community platform.


1. Document Control

Item

Value

Document

Zebron Architecture Documentation

Version

2.0

Status

Target-state architecture / implementation guide

Date

August 29, 2026

Primary stack

Angular 21, Firebase, Firestore, Firebase Authentication, Firebase Hosting/App Hosting

Architecture direction

Feature-oriented Angular architecture with centralized domain state where justified

State management direction

NgRx Signal Store for shared feature/application state

Version 2 change summary

Expands the architecture from an MVP-oriented structure into a platform-oriented architecture.

Defines Core, Shared, Feature, and Administrative boundaries.

Introduces a deliberate Signal Store strategy rather than component-owned application state everywhere.

Establishes domain-oriented relationships among Organizations, Jobs, Resources, Training, Categories, and Locations.

Defines reusable UI and CRUD patterns for future modules.

Adds architectural standards for Firestore data, security, indexing, validation, timestamps, and public versus administrative access.

Defines a phased migration roadmap that preserves the working application while architecture is improved incrementally.

Note: the prior architecture document could not be uniquely identified in the available document library during this update. Accordingly, Version 2 is structured as a superseding architecture document and preserves the direction already established in the Zebron project.

2. Current-State Architecture

Zebron has progressed beyond a simple resource-directory MVP. The application now contains multiple business domains and administrative workflows, including resources, organizations, categories, locations, users, submissions, contact/mailbox functions, jobs, public job discovery, and job details.

The existing application already demonstrates several sound architectural practices: Angular standalone components, lazy-loaded routes, Firebase-backed services, typed domain models, route guards, public versus administrative routes, and Firestore indexes.

Current major domains

Domain

Primary responsibility

Resources

Public resource discovery, filtering, details, administration, and submissions

Organizations

Reusable organization records referenced by jobs and resources

Jobs

Job creation, editing, publication status, public discovery, filtering, and job details

Training

Training discovery and future training-program management

Categories

Controlled classification used across content domains

Locations

Reusable location information for organizations, resources, and opportunities

Users / Profiles

Authentication, application profile, roles, and protected user functionality

Submissions

Community-submitted resources and moderation lifecycle

Contact / Mailbox

Public contact intake and administrative message management

Administration

Protected management interfaces and operational controls

Current technical characteristics

Angular standalone components are used throughout the application.

Routing uses lazy-loaded components and route guards for protected administrative areas.

Firestore services currently provide direct CRUD/query access to domain collections.

Signals and computed state are used in feature components for local UI state and filtering.

Hot Toast is used for user feedback in administrative workflows.

Angular Material is used selectively for dialogs, menus, icons, dividers, and related UI needs.

Tailwind utility classes are used extensively for responsive presentation.

Firestore composite indexes are required for several filtered and ordered queries.

3. Architecture Principles

Domain first — organize application capabilities around business domains rather than individual screens.

Single source of truth — reusable entities such as organizations, categories, and locations should be referenced rather than repeatedly recreated.

Separate concerns — UI, application state, persistence, authentication, and shared utilities should have clear boundaries.

Reuse before duplication — common UI, validation, filtering, and CRUD patterns should become reusable components/services.

Public and administrative boundaries — public users should receive only intentionally published data; administrative capabilities must remain protected.

State management by need — use Signal Store where shared or derived feature state justifies it; keep transient form state local.

Firestore-safe writes — never send undefined values to Firestore; normalize optional fields before persistence.

Observable operational feedback — loading, success, warning, error, and empty states should be standardized.

Security by design — authorization belongs in Firebase security rules and route guards should complement, not replace, backend enforcement.

Incremental modernization — architecture improvements should be introduced without destabilizing working functionality.

4. Target Angular Architecture

src/app/
├── core/
│   ├── guards/
│   ├── models/
│   ├── services/
│   ├── firebase/
│   └── utilities/
│
├── shared/
│   ├── components/
│   │   ├── search-bar/
│   │   ├── filter-bar/
│   │   ├── confirmation-dialog/
│   │   ├── empty-state/
│   │   ├── loading-state/
│   │   └── status-badge/
│   ├── directives/
│   ├── pipes/
│   └── ui/
│
├── features/
│   ├── resources/
│   ├── organizations/
│   ├── jobs/
│   ├── training/
│   ├── categories/
│   ├── locations/
│   ├── submissions/
│   ├── profile/
│   └── contact/
│
├── admin/
│   ├── pages/
│   ├── components/
│   └── ...
│
└── app.routes.ts

Boundary responsibilities

Layer

Responsibility

Should not own

Core

Cross-cutting services, domain models, authentication, guards, Firebase integration

Feature-specific UI

Shared

Reusable presentation components, pipes, directives, common UI patterns

Domain persistence

Feature

Business capability, pages, domain components, feature stores

Unrelated domains

Admin

Administrative workflows and protected management screens

Public discovery behavior

Routes

Navigation and access boundaries

Business logic

5. State Management Strategy

Version 2 introduces NgRx Signal Store as the preferred state-management mechanism for feature state that is shared, derived, filter-heavy, or coordinated across multiple components. It should not be used merely because it is available.

Recommended initial stores

Store

Initial state

Derived state / responsibilities

JobStore

jobs, loading, error, search, category, employment type, work arrangement, location

filteredJobs, featuredJobs, resultCount, active-filter state

ResourceStore

resources, pagination, filters, categories, loading/error

filtered resources, result count, selected filters, pagination state

OrganizationStore

organizations, selected organization, loading/error

lookup collections and reusable organization context

State flow

Component
   ↓
Signal Store
   ↓
Domain Service
   ↓
Firestore / Firebase
   ↓
Signal Store state
   ↓
Component view

Forms should generally remain local to the form component. A store should be introduced when form state must survive navigation, be shared by multiple components, or participate in a larger workflow.

6. Domain and Data Architecture

The central architectural goal is to make reusable entities first-class. Organizations, Categories, and Locations should function as shared reference domains that can support multiple opportunity and resource domains.

Organization
   ├── Jobs
   ├── Resources
   └── Training Programs

Category
   ├── Jobs
   ├── Resources
   └── Training Programs

Location
   ├── Organizations
   ├── Jobs
   ├── Resources
   └── Training Programs

Recommended Firestore collections

Collection

Purpose

Public visibility

organizations

Canonical organization records

Only approved/active information

jobs

Job opportunities and lifecycle

Active/published jobs

resources

Community and service resources

Published resources

training

Training programs and opportunities

Published/active programs

categories

Controlled classification

Active categories

locations

Reusable location records

Active/reference data

users

Application user profiles and roles

Protected

submissions

Community submissions and moderation history

Protected

contactMessages

Public contact submissions

Protected

outboundMessages

Administrative sent-mail history

Protected

Entity design rules

Use stable document IDs as references between entities.

Prefer organizationId, categoryId, and locationId over embedding complete organization/category/location objects in every record.

Denormalized display fields such as organizationName may be retained when they provide practical read performance or historical context, but the canonical organization remains the organizations collection.

Use createdAt and updatedAt consistently on major entities.

Use createdBy where administrative or user attribution is required.

Use explicit lifecycle/status fields instead of inferring publication from unrelated fields.

Normalize optional values before Firestore writes so undefined is never sent.

7. Public vs Administrative Architecture

PUBLIC
/find
  ├── Find a Job
  ├── Find Training
  └── Published Job Listings
        └── /jobs/:id

ADMIN
/admin
/admin/jobs
/admin/jobs/new
/admin/jobs/:id/edit
/admin/organizations
/admin/resources
/admin/categories
/admin/locations
...

The unified /find experience is now the primary public discovery entry point for jobs and training. The former standalone public job-board page is redundant and should remain removed. The /jobs/:id route is retained for individual public job details.

8. Service Layer Standards

Domain services remain the persistence boundary. Components should not call Firestore directly.

JobStore
   ↓
JobService
   ↓
Firestore

OrganizationStore
   ↓
OrganizationService
   ↓
Firestore

Services own Firestore collections and queries.

Services expose domain-oriented methods such as getJob(), getActiveJobs(), createJob(), updateJob(), and deleteJob().

Services should normalize returned documents into typed models.

Services should not contain presentation concerns such as toast messages.

Stores coordinate application state and can invoke services.

Components should not duplicate Firestore query construction.

9. Shared UI Architecture

Standardize search bars across resources, jobs, training, and future domains.

Standardize filter bars and filter-clear behavior.

Use a shared confirmation dialog for destructive operations.

Use Hot Toast for success, warning, informational, and error feedback instead of inconsistent popup mechanisms.

Use Angular Material where a true dialog/menu/overlay interaction is required.

Standardize loading, error, and empty states.

Use common status badges for draft, active, published, closed, archived, pending, approved, and rejected states as applicable.

Keep responsive Tailwind patterns consistent across public and admin screens.

10. Security and Access Architecture

Firebase Authentication establishes identity.

Firestore user profiles establish application roles and profile data.

Angular authGuard/adminGuard provide client-side navigation protection.

Firestore Security Rules remain the authoritative backend authorization boundary.

Public collections should expose only the minimum fields necessary for public discovery.

Administrative collections and moderation records should not be publicly readable.

Role checks should be centralized and consistently reused.

Destructive administrative operations should require explicit confirmation and provide visible completion feedback.

11. Firestore Query and Index Architecture

Firestore indexes are part of the application architecture rather than an after-the-fact deployment artifact.

Every new compound where/orderBy query should be evaluated for its required composite index.

Keep firestore.indexes.json under source control.

Preserve existing indexes when adding new indexes; avoid destructive synchronization prompts unless deletion is intentional.

Use consistent field casing. createdAt and CreatedAt must not be treated as interchangeable fields.

Review index growth as new filtering capabilities are added.

Domain

Example query pattern

Architectural concern

Jobs

status == active + orderBy createdAt desc

Composite index required

Resources

status == published + orderBy createdAt desc

Composite index required

Categories

active + sortOrder

Composite index required

12. Quality and Release Architecture

Run npm run build after each architectural migration.

Keep the application in a buildable state after every completed phase.

Validate public routes separately from protected administrative routes.

Test create, edit, delete, publish/status changes, and public visibility for each major domain.

Test Firestore queries against realistic indexes and data.

Verify empty, loading, error, and success states.

Validate responsive behavior for mobile, tablet, and desktop layouts.

13. Implementation Roadmap

Phase

Focus

Primary outcomes

Phase 1

Architecture baseline

Confirm current structure, document boundaries, preserve working behavior

Phase 2

Shared foundation

Create shared search/filter/loading/empty/dialog/status UI patterns

Phase 3

Signal Store

Introduce JobStore, ResourceStore, and OrganizationStore

Phase 4

Domain services

Normalize service APIs and Firestore persistence boundaries

Phase 5

Data architecture

Standardize relationships, status fields, timestamps, indexes, and rules

Phase 6

Public platform

Expand jobs/training/resources around shared domain architecture

Phase 7

Administration

Standardize CRUD, moderation, confirmation, toast, and reporting workflows

Phase 8

Governance

Establish architecture review, technical-debt tracking, and recurring health reviews

Immediate implementation sequence

Freeze the current working baseline and confirm npm run build succeeds.

Inventory src/app and identify existing Core, Shared, Feature, and Admin boundaries.

Create the shared UI primitives without changing business behavior.

Introduce JobStore first because job search/filter state is already substantial.

Migrate the public /find job experience to JobStore.

Introduce ResourceStore and migrate the resource list/search/filter experience.

Introduce OrganizationStore for reusable organization lookup and context.

Review and standardize Firestore services and models.

Review firestore.rules and firestore.indexes.json as a unified data/security package.

Continue adding new Zebron functionality on top of the standardized architecture.

14. Future Platform Capability

The target architecture is intended to support a broader array of Zebron functionality without creating a new architectural pattern for every feature.

Jobs and career opportunities

Training programs and bootcamps

Scholarships and funding opportunities

Community services

Events

Mentorship

Business and entrepreneurship resources

Immigration and settlement resources

Organization profiles

User submissions and moderation

Personalized discovery

Saved resources and opportunities

Notifications and alerts

Analytics and reporting

Future integrations and external services

15. Architecture Governance

New domains should follow the feature-oriented structure.

New persistent entities require a typed model, domain service, security-rule consideration, and index assessment.

New shared UI patterns should be evaluated for reuse before being duplicated.

New global state should require a clear justification before introducing a Signal Store.

Architecture changes should be documented when they affect domain boundaries, security, persistence, or shared state.

Technical debt should be tracked and periodically reviewed rather than allowed to accumulate silently.

16. Key Risks and Mitigations

Risk

Impact

Mitigation

Over-centralized state

Complexity and difficult debugging

Use Signal Store only for meaningful shared/derived state

Duplicated domain data

Stale or inconsistent information

Use canonical IDs and reusable reference entities

Component-heavy architecture

Large, hard-to-maintain pages

Move shared state and business coordination into stores/services

Firestore query/index growth

Deployment and performance complexity

Review queries and indexes as part of feature design

Weak backend authorization

Security exposure

Treat Firestore Security Rules as authoritative

Premature rewrite

Feature delivery disruption

Migrate incrementally and preserve working builds

UI inconsistency

Poor user experience and maintenance cost

Create shared UI primitives

17. Success Measures

New domains can be added without inventing a new application structure.

Common UI behavior is implemented once and reused.

Feature components become smaller and focused primarily on presentation and user interaction.

Shared feature state is centralized where appropriate.

Firestore data relationships are consistent and reusable.

Public and administrative access boundaries are explicit and enforceable.

New queries have corresponding index and security considerations.

The application remains buildable throughout the migration.

Future features can be added with predictable development patterns.

18. Target-State Architecture Statement

Zebron should evolve as a modular, domain-oriented platform in which reusable entities provide a common information foundation, domain services provide controlled persistence access, Signal Stores manage meaningful shared application state, and shared UI primitives provide consistent experiences across public and administrative workflows. The architecture should favor standardization and reuse while remaining lightweight enough to support rapid feature delivery.

Version 2 therefore establishes the architectural direction without requiring an immediate rewrite. The recommended approach is incremental modernization: stabilize → standardize → centralize meaningful state → strengthen data/security boundaries → expand capabilities.