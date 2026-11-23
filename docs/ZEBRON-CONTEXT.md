# Zebron: context for working on the platform

Give this file to an AI assistant (or a new developer) at the start of any
work on Zebron. It explains what Zebron is, how it is built, where things
live, the rules every change follows, and how we work together.

- **Last updated:** 22 November 2026 (guide edition 135)
- **Also in the Knowledge Center** as "Zebron platform overview for the team" (support and developers), and introduced on the Internal Blog in "How Zebron works: one page for the whole team" (`scripts/seed-blog-zebron-context.mjs`).
- **Keep it current:** when a change makes anything here wrong (a new
  application, folder, collection, function, rule or way of working), update
  this file and that article in the same change, as with the other
  knowledge articles.

---

## 1. What Zebron is

Zebron (https://zebron.org) is a multi-tenant platform for learning, careers
and community services. It has two sides:

- **Zebron's public platform**, run by Zebron staff ("platform
  administrators"): resources directory, job board, training search, Zebron
  courses, programs and certifications, Test Center quizzes, Coding Lab,
  career paths and skills, public Community, blog, Knowledge Center, Tax &
  Pay calculator, donations, support and the help assistant.
- **Partner organizations** (tenants): businesses, schools and bootcamps that
  apply to join, are approved and provisioned by Zebron, and then run their
  own space at `/partner/org/<organizationId>`. Each organization gets the
  applications it signs up for (see section 4) and manages its own members,
  content, training groups, mailbox, contract and audit log.

Users are people with a Zebron account. A person can belong to several
organizations, with one role in each.

## 2. Tech stack

| Part | Technology |
| --- | --- |
| Web app | Angular 21 (standalone components, signals, OnPush, native control flow), Angular Material, Tailwind CSS 4, @ngrx/signals in some stores |
| Rendering and hosting | Angular SSR (`src/server.ts`, Express 5) on **Firebase App Hosting**, backend `zebron-web` (Cloud Run, us-east4). Most routes render on the client; `resources/:slug`, `jobs/:id` and `bootcamps` render on the server for SEO. |
| Backend | **Cloud Functions v2**, Node 24, firebase-admin 14, firebase-functions 7, region us-central1, TypeScript in `functions/src`, compiled to `functions/lib` |
| Database | Cloud Firestore (default database, nam5) with `firestore.rules` and `firestore.indexes.json` |
| Files | Cloud Storage with `storage.rules` |
| Auth | Firebase Auth: email/password and Google sign-in |
| Email | Resend: outbound mail and an inbound webhook (`receiveInboundEmail`) |
| AI | Google Gemini (`GEMINI_API_KEY`): help assistant and admin AI tools |
| Payments | Stripe, donations only (no subscriptions yet) |
| Code editor | CodeMirror 6 (Coding Lab); Python via Pyodide from jsDelivr |
| Tests | Vitest; Firestore rules tests with `@firebase/rules-unit-testing` against the emulator on port 8080 |

Firebase project: **zebron-2b49f**. The local app (`ng serve`,
http://localhost:4200) talks to the **live** Firebase project: there is no
separate staging project. New rules and functions must be deployed before
they work locally.

## 3. Repository layout

Project root: `C:\Lessons\withDNS\zebron` (Windows; commands run in Git Bash,
branch `master`).

```
src/
  server.ts                 SSR server: security headers, CSP (report-only), sitemap.xml
  app/
    app.routes.ts           all routes (large, lazy-loaded)
    app.routes.server.ts    which routes render on the server
    app.config.ts           providers, dialog defaults
    core/
      services/             auth, firebase-config, settings, feature-config, maintenance,
                            system-health, audit, logger, partner-access, claims-sync, ...
      guards/               auth, admin, feature, partner-organization, partner-role,
                            partner-admin, application-access, test-center-organization
      repositories/         Firestore repositories (organizations, memberships, resources, ...)
      models/               data models
      i18n/                 I18nService, `t` pipe, French text in i18n/fr
      config/               application inventory and manifests (generated)
    features/               one folder per area: admin, partner, courses, test-center,
                            coding-lab, community, knowledge, blog, jobs, careers, live,
                            training-groups, support, dashboards, resources, home, auth, ...
    shared/                 shared components, dashboards engine, polls, directives
  styles/                   global SCSS (_zebron-material.scss, _new-input-fields.scss)
public/                     static files served as-is (coding-lab workers and sandbox, images)
functions/src/              all Cloud Functions (index.ts exports them)
tests/
  unit/                     Vitest unit tests
  integration/              function tests
  firestore/                security rules tests (need the emulator)
scripts/                    content seed scripts (programs, courses, question banks, blog)
docs/                       architecture notes, runbooks, this file
firestore.rules             Firestore security rules: edit this one (readable, with comments)
firestore.deploy.rules      generated compact copy that is deployed (npm run rules:build)
storage.rules               Storage security rules
firebase.json, .firebaserc, apphosting.yaml
CLAUDE.md                   instructions for AI assistants
.cursor/rules/              Cursor rules (coding style; knowledge articles)
```

## 4. Applications

Each organization is provisioned with applications (entitlements in
`organizations/{id}/applications/{appId}`; policies in
`functions/src/application-provisioning-policy.ts`):

`core`, `configuration`, `community`, `test-center`, `courses`,
`virtual-classroom`, `training-groups`, `blog`, `knowledge`, `mailbox`,
`business-operations`, `resources`, `jobs-training`, `tax-pay`, `content`,
`cyber-range`.

- `core` and `configuration` change only with the whole organization.
- **Learning** is the umbrella for Courses, Test Center, Virtual Classroom
  and Training Groups. Learning needs Courses, Virtual Classroom, Test Center
  and Training Groups off before it can be switched off; Test Center can't be
  suspended while Courses is active (course exams run on it).
- Platform-wide, each application can be **On**, **Maintenance** or **Off**
  (Control Center → Applications, `FeatureConfigService`, `featureGuard`).
- Organizations request application changes (Contract & Billing); platform
  admins approve them in Admin → Partner Requests.

## 5. Roles and access

**Platform roles** (on `users/{uid}`): `platformRole: "platform-admin"`
(legacy `role: "admin"` is honoured only while `platformRole` is absent).
Other platform roles in the admin UI: Operator, Support, Auditor, Standard
User. Users can never set their own role or platformRole (rules check this).

**Organization roles** (`organizationMemberships/{uid}_{orgId}`, with `role`
and `active`), each including the ones below it:

| Rank | Role | Adds |
| --- | --- | --- |
| 1 | `org_member` | Uses the organization's applications |
| 2 | `org_staff` | Writes Test Center questions and Knowledge Center articles, schedules live sessions |
| 3 | `org_manager` | Administration page: invites, roles below their own, banners, mailbox, contract, org tickets, Community moderation, training groups they lead, publishing |
| 4 | `org_admin` | Organization setup, configuration, audit log, application requests |
| 5 | `org_owner` | Approves requests, accepts the partner agreement, transfers ownership, terminates the contract |

People manage only roles strictly below their own, never themselves.

**Roles on the sign-in token (custom claims):** `zv: 1` (synced), `zpa`
(platform admin), `zorg: { orgId: role }`. Kept in sync by
`syncClaimsOnUserWrite`, `syncClaimsOnMembershipWrite` and `syncMyClaims`.
Rules check the token first and fall back to the membership document when a
role is missing from it. Reducing access revokes refresh tokens; an open
session may keep old access for up to an hour.

**Membership ID rule:** the membership document ID must equal
`userId + "_" + organizationId` (enforced on create and update for
everyone). Rules and functions look memberships up by this ID alone.

**Where access is enforced:** Firestore and Storage rules, and the callable
functions. Route guards only control navigation; never rely on them for
security.

## 6. Data model (main collections)

- `users/{uid}` (+ subcollections: notifications, preferences, courseProgress,
  courseExams, certifications, courseAnnotations, codeLabProjects, codeLabExercises,
  careerPlans, savedJobs, jobAlerts, flashcards, communityBookmarks, documents,
  documentAnnotations)
- `communityProfiles/{uid}`: public profile fields only
- `organizations/{id}` (+ applications, announcements, auditLogs,
  knowledgeArticles, inboundMessages, sentMessages, mailboxes, mailboxUsage,
  contract, stats, groups, trainingGroups)
- `organizationMemberships/{uid}_{orgId}`, `organizationInvitations`,
  `organizationApplicationRequests`, `organizationServiceRequests`,
  `contractTerms`
- Test Center: `testPrograms`, `quizzes`, `quizTopics`, `quizQuestions`,
  `quizAttempts`, `quizResults`. Zebron content has `scope: "platform"` and
  `organizationId: null`.
- Courses and certifications: courses, `certificates/{code}` (public
  verification at /verify)
- Community: `communityPosts`, `communityReports`, `communityTopics`,
  `communityConversations` (direct messages), `polls`
- Knowledge: `knowledgeArticles`, `knowledgeArticleVersions`
- Support: `supportTickets` (+ messages; functions only), `contactMessages`,
  `platformMailboxes`
- Platform: `systemSettings` (public read, platform-admin write),
  `featureConfigurations`, `siteReviews` (home page reviews), `categories`, `locations`, `resources`,
  `resourceTypes`, `jobs`, `bootcamps`, `taxPayConfigurations`,
  `userClaims/{uid}`, `aiUsage`, `aiUsageDaily`

Server-only collections (no browser access): supportTickets, counters,
organizationServiceRequests, contractTerms, organizations/{id}/contract,
assistantUsage. Read-only for browsers (functions write them): course
progress, course exams, certifications, certificates, exam records, stats.

## 7. Cloud Functions

All exported from `functions/src/index.ts`. Callables check the caller's
role on the server (`requirePlatformAdministrator` and similar helpers).

- **Users and claims:** createUser, updateUser, deleteUser, resetUserPassword
  (platform admins); syncMyClaims; syncClaimsOnUserWrite / OnMembershipWrite
- **Organizations:** provisionOrganization, suspend/reactivate/archive/
  restoreOrganization, onboarding steps, repair functions,
  setOrganizationApplicationStatus
- **Invitations:** create, resend, cancel, accept, preview, expire
- **Contract:** getOrganizationContractOverview, submit/respond/review/
  listOrganizationServiceRequests, acceptOrganizationContractTerms,
  updateContractTerms, cancelOrganizationContractTermination,
  updateOrganizationBillingContact, getOrganizationAccessStatus
- **Email:** sendOrganizationCommunication, lookupCommunicationRecipients,
  sendOrganizationMailboxEmail, sendContactReply, sendNewContactMessage,
  submitContactMessage, receiveInboundEmail (Resend webhook, signature checked)
- **Support:** createSupportTicket (guests allowed), list…SupportTickets,
  getSupportTicket, addSupportTicketMessage, updateSupportTicket,
  askSupportAssistant (Gemini)
- **Learning:** startCourseExam, submitCourseExam, completeCourseLesson,
  startQuizExam, submitQuizExam, certification enroll/start/submit,
  getTeamLearningProgress, training group functions (members, courses,
  assignments, enrollment, requests, summaries)
- **Community:** recordCommunityPostView, trending scores, castPollVote,
  backfillCommunityPostScope
- **AI tools:** aiAssist, draftTopicContent (platform admins; monthly and
  daily limits in settings)
- **Jobs:** syncUsajobsJobs, triggerUsajobsSync, verifyUsajobsCredentials. USAJOBS imports only IT, healthcare, finance/accounting and management series (one search per field, `usajobs-sectors.ts`) at entry, mid or senior level (`usajobs-levels.ts`: no executive pay plans, no GS-15-only, no director/chief titles); listings that stop qualifying are closed on the next sync
- **Audit triggers:** audit…Changes for organizations, memberships,
  invitations, applications, contracts, quizzes, emails and more
- **Scheduled:** processContractTerminations (daily 02:15 ET),
  closeResolvedSupportTickets (03:30 ET), summarizeEndedTrainingGroups,
  email outbox processing, publishScheduledBlogPosts,
  processBusinessComplianceStatuses
- **Payments:** createDonationCheckout (Stripe)

Secrets (Secret Manager, `firebase functions:secrets:set NAME`):
`RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `GEMINI_API_KEY`,
`STRIPE_SECRET_KEY`. Global cap: 10 instances per function
(`functions/src/global-options.ts`).

## 8. Key subsystems

- **Control Center** (`/admin/configuration/<tab>`): Overview, Applications
  (kill switch), Settings, Operational Monitoring (health, events, audit
  trail), Security checks, Maintenance (maintenance mode and quick links).
  The header badge is green (operational), orange (health check found a
  problem) or red (maintenance mode on). Maintenance mode is stored as the
  system settings `system.maintenance.enabled` and
  `system.maintenance.message`; it does **not yet** block visitors.
- **System settings:** `SettingsService` only saves keys listed in
  `DEFAULT_SETTINGS` (`core/services/settings.service.ts`). Add a new
  setting there first, or saving fails with "Unknown system setting".
- **My documents (reader):** signed-in people upload their own PDF, EPUB,
  Word (.docx), text and markdown files at **/courses/documents** and read
  them in the browser on any device (pdf.js, a built-in EPUB reader, mammoth
  for Word), with reading themes, text size or zoom, and the place they
  stopped remembered. Files in Storage `users/{uid}/documents/{id}/{file}`,
  details in `users/{uid}/documents/{id}`, both owner-only; 50 MB per file,
  100 files and 500 MB per person. Highlights and notes use the lesson
  toolbar and painter (`users/{uid}/documentAnnotations`, via
  `AnnotationStore`); read aloud uses the browser's voices sentence by
  sentence. **Keep on this device** stores a document and its highlights
  in Cache Storage (`OfflineDocumentsService`) for reading offline.
  **Quiz me** (reader button) sends the part being read to
  `createDocumentQuiz` (AI engine task `document-quiz`, open to learners
  with `learnerDailyLimit` / `learnerMonthlyLimit`); questions live in
  `users/{uid}/documentQuizzes` (readable only once graded, written only by
  functions) and graded ones show on My learning.
  Untrusted HTML goes through an allowlist sanitizer
  (`reader-html.ts`). Code: `features/documents`. Needs CORS on the
  Storage bucket (`storage.cors.json`).
- **Installable app (PWA):** `public/manifest.webmanifest`, `public/icons/`,
  and the Angular service worker (`ngsw-config.json`, production builds only,
  registered in app.config.ts). The app code and the client shell
  (`index.csr.html`) are stored on the device, so Zebron opens offline;
  Firestore and other APIs are not cached. `PwaService` keeps the install
  prompt (header menu "Install the Zebron app") and shows "A new version is
  ready" (`AppStatusComponent`). server.ts sends `no-cache` for the service
  worker files. To turn it off, ship Angular's safety worker; never just
  delete the service worker.
  The home page "e" can wear a seasonal decoration chosen in Admin → Home
  page look (system setting `home.brandMark`, built-in gallery in
  `core/config/brand-marks.ts`, SVGs in `public/images/brand/`); admins
  can build looks there (`homeLooks/{id}` + Storage `home-looks/`). A look
  can also colour the e (`letter`: sparkler gold, paper-cut red and gold)
  and turn the home circle into a Christmas ornament.
  The top bar has a small back arrow on every page reached from another
  page (`BackNavigationService`; pages adjust it with `useBackButton`), on
  computers (`lg` up) only. In the installed app on phones and tablets a
  navigation bar (`app-nav-bar`: Back, Forward, Home, Refresh, ⋯ language)
  slides up while scrolling and hides 5 s later, and pulling the page down
  at the top refreshes it (`app-pull-to-refresh`); and on
  phones and tablets signed-in people pick the language in the ☰ menu.
- **Coding Lab:** learner code runs in Web Workers inside a sandboxed iframe
  (`public/coding-lab/sandbox.html`, opaque origin) started by
  `CodeRunnerService`. Learner code must never run on Zebron's own origin.
  Bump `?v=` in `SANDBOX_URL` when the sandbox page changes. Web pages
  (language `web`: HTML, CSS and JavaScript tabs) show in a sandboxed
  preview iframe (`public/coding-lab/preview.html`, `PREVIEW_URL`;
  `web-code.ts` builds the page and adds endless-loop guards).
- **Highlights, notes and bookmarks in lessons:** learners highlight lesson
  text in four colours (yellow important concept, green key definition, blue
  example, pink review later), add notes, copy, bookmark lessons and see it
  all in **My notes** (per course, in the lesson) and on **My learning** (all
  courses, with links). Private, in `users/{uid}/courseAnnotations`, keyed by
  `progressId(course)`. Highlights store their words plus surrounding text,
  not positions, so they survive lesson edits. Code:
  `features/courses/annotations`; text sections opt in with
  `zbHighlightLayer`. Never in quick checks, exams or code exercises.
- **What to learn next:** when a course is finished, its summary page suggests the next course in the same program, similar courses (shared skills, topic, program, level) and, on Zebron's own pages only, matching bootcamps from the bootcamp directory. Pure logic in `features/courses/next-steps.ts` (unit tests), UI in `course-summary.component.ts`; no new data.
- **Home page reviews:** signed-in people rate Zebron (1–5 stars) and write
  one review each at the bottom of the home page; platform admins approve,
  reject (with a note) or delete them at **/admin/reviews**. Only approved
  reviews are public, shown in a carousel with the average rating. Edits go
  back for approval. Code: `features/home/reviews`,
  `features/admin/pages/reviews`; data `siteReviews/{uid}`.
- **Exams:** all graded work (course final exams, Test Center exams,
  certification exams) is marked on the server; the browser never receives
  answers during an exam. Lesson progress is written by
  `completeCourseLesson`.
- **Knowledge Center and help assistant:** platform articles come from
  `src/app/features/admin/pages/knowledge/guide-import/guide-articles.ts`
  (`GUIDE_ARTICLES`, `GUIDE_EDITION`), imported at
  `/admin/knowledge/import-guide`. Each article has an audience (`user`,
  `admin`, `support`, `developer`, `all`) that decides who can read it and
  who the assistant may answer with it. Published articles reach the
  assistant within about 5 minutes.
- **Email:** Resend. Organization mailboxes and departmental mailboxes,
  Zebron's contact mailbox, an outbox processed on a schedule, daily send
  limits.
- **French:** English text is the translation key (`{{ 'Text' | t }}`);
  French lives in `core/i18n/fr`. Missing French falls back to English.
- **Dashboards:** shared dashboard engine in `shared/dashboards`.

## 9. Conventions

- Follow `.cursor/rules/cursor.mdc`: standalone components (don't set
  `standalone: true`), signals and `computed()`, `input()`/`output()`,
  `inject()`, OnPush, native control flow, class/style bindings (no
  ngClass/ngStyle), no `@HostBinding`/`@HostListener`, AXE and WCAG AA.
- Pages sit under the fixed global header (`mt-16`). Page headers use the
  Zebron gradient `bg-gradient-to-r from-[#007979] via-[#00706f]
  to-[#2a835f]`. Brand teal: `#007979`.
- Tailwind 4 only generates classes that appear literally in source: write
  full class names, never build them from strings. Angular class bindings
  can't contain `[` or `#` (`[class.text-[#164E55]]` breaks); use
  `[style.color]` for those.
- Phones: `grid-cols-1` base, `min-w-0` on flex children, 768 px cut-off.
- Page titles via `PageTitleService` (route data `header`, or
  `setTitle()`; set data-dependent titles in an `effect()`).
- New user-facing text goes through the `t` pipe, with French added.
- Logging through `LoggerService`; audit records through `AuditService`
  (browser) or audit triggers (server).
- Writes that need trust (exams, progress, cross-organization changes,
  email) go through callable functions, not the browser.

## 10. Build, test and deploy

```
ng serve                       # local app at http://localhost:4200 (live Firebase)
ng build                       # production build (also `npm run build`)
cd functions && rm -rf lib && npm run build && cd ..
```

### Tests (Vitest)

All tests are in `tests/` (config: `vitest.config.ts`; one file at a time).

| Kind | Folder | Needs the Firestore emulator | Command |
| --- | --- | --- | --- |
| Unit | `tests/unit` | No | `npm run test:unit` |
| Integration (functions code) | `tests/integration` | Yes | `npm run test:integration` |
| Security rules | `tests/firestore` | Yes | `npm run test:firestore` |
| Everything | `tests/` | Yes | `npm test` |

- **Setup once:** Node 24, **Java JDK 21** (the emulator runs on Java),
  `npm install` in the root **and** in `functions/` (integration tests import
  `functions/src`).
- **Simplest full run:** `npx firebase emulators:exec --only firestore "npm test"`
  (starts and stops the emulator). Or keep
  `npx firebase emulators:start --only firestore` running in one terminal
  and run `npm test` in another.
- The emulator listens on **127.0.0.1:8080**. Tests never touch the live
  database: `vitest.config.ts` sets `FIRESTORE_EMULATOR_HOST` and project
  `zebron-test`; rules tests use `zebron-rules-test`.
- One file: `npx vitest run <path>`; by name: `-t "text"`; watch mode:
  `npx vitest tests/unit`.
- `ECONNREFUSED 127.0.0.1:8080` means the emulator isn't running.
- Full guide and troubleshooting: knowledge article "Running the tests
  (Vitest and the Firestore emulator)" (`dev-testing`).

| What | How it deploys |
| --- | --- |
| Website | **Automatically on every push to `master`** (App Hosting) |
| Firestore rules, indexes, Storage rules | `firebase deploy --only firestore:rules,firestore:indexes,storage` |
| Cloud Functions | `FUNCTIONS_DISCOVERY_TIMEOUT=60 firebase deploy --only functions` (build first; firebase.json has no predeploy build) |

- Run firebase commands from the project root.
- When moving a write from the browser to a function: deploy the function,
  then push the app and wait for the rollout, then deploy the rules that
  block the browser write.
- When the CLI offers to delete functions or indexes that exist only online,
  answer **No** unless you removed them on purpose.
- Roll back the website in App Hosting → Rollouts; roll back rules with
  `git checkout HEAD~1 -- firestore.rules storage.rules` and deploy.
- Firestore rules: edit `firestore.rules`, then `npm run rules:build` and commit `firestore.deploy.rules` too (the deploy rebuilds it anyway). The compact copy has a 200 KiB budget (Firestore's limit is 256 KiB of text and 250 KB compiled); keep new rules short and prefer callable functions over long field checks. See the "Firestore rules size" developer article.

More: `docs/SCALING-AND-SECURITY-RUNBOOK.md` and the "Deploying Zebron"
knowledge article.

## 11. How we work together

> **RULE: Whenever anything in the Zebron platform is created or changed, the Knowledge Center articles must be created or updated in the same piece of work.** No change is finished until its knowledge articles are.

**Every change updates the knowledge articles.** A change isn't finished
until `guide-articles.ts` describes it: update the affected articles (or add
one), choose the audience carefully, bump `GUIDE_EDITION`, then publish with
Admin → Knowledge Center → **Import guide** → **Import**. Full steps in
`CLAUDE.md`. Also update this file when the change affects it.

**Working with an AI assistant in a Claude chat:**

- Connect the project folder in the Claude desktop app (**+ → Add folder**,
  `C:\Lessons\withDNS\zebron`) so the assistant can read and write files.
- The assistant reads and edits files but usually can't run `ng build`,
  `npm test`, the Firestore emulator or deploys on your computer. You run
  them and paste the output; the assistant fixes what fails.
- Files more than 7 folders deep below the project root can't be copied
  through the bridge (for example the Control Center tab components); ask
  for another approach or connect that folder directly.
- The assistant says what it changed, what it couldn't test and what you
  need to run or deploy. Nothing is committed, pushed or deployed unless you
  ask, because pushing to `master` deploys the website.
- Changes that touch security (rules, roles, functions) come with rules
  tests when possible.

**Before asking for help, it helps to give:** the page address, what you
clicked, what you expected, and the console or terminal output (a
screenshot is fine).

## 12. Known issues and backlog

From the security and quality review of 21 November 2026. Fixed that day:
the membership ID check (cross-organization access), the Coding Lab sandbox,
maintenance settings missing from `DEFAULT_SETTINGS`, and the Control Center
status badge. Still open:

| Priority | Issue | Where |
| --- | --- | --- |
| High | Guests can make Zebron email any address (support ticket confirmation includes their text); no CAPTCHA or App Check | `createSupportTicket` in functions/src/support-tickets.ts |
| Medium | Invitation acceptance doesn't require a verified email | organization-invitation-acceptance.ts |
| Medium | Direct-message `participantInfo` (names and photos) isn't validated: people can pose as someone else | firestore.rules, communityConversations |
| Medium | Static files cached for a year, including files that keep their name | src/server.ts (`express.static` maxAge) |
| Medium | `/sitemap.xml` reads all resources and jobs on every request, no cache header | src/server.ts |
| Medium | Contact form has no rate limit or bot check | `submitContactMessage` |
| Medium | Maintenance mode doesn't block visitors yet | MaintenanceService, guards |
| Low | `xlsx@0.18.5` has known vulnerabilities; may be unused | package.json |
| Low | `auth.guard.ts` logs the user and profile to the console | core/guards/auth.guard.ts |
| Low | CSP is report-only and allows inline scripts | src/server.ts |
| Low | functions lint: TypeScript 6 with @typescript-eslint 5 and ESLint 8 | functions/package.json |
| Low | No predeploy build for functions | firebase.json |
| Low | `public/coding-lab/runner.html` is unused | public/coding-lab |
| Low | NG8102 warnings in career-path-manage.component.ts | features/careers |

Remove items from this table as they are fixed.
