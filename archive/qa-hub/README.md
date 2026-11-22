# Archived: QA Hub (removed 21 November 2026)

The QA Hub (Admin → QA Hub, `/admin/qa`) let platform admins write manual
test tasks, assign them to testers and collect pass / fail / blocked results.
It was removed because it was not in use and its two halves disagreed about
who a tester is:

- the admin page offered everyone with the **Support** platform role
  (`platformRole == "platform-support"`) as a tester;
- the Firestore and Storage rules only let people with an active
  `qaTesters/{uid}` document see tasks and submit results, and nothing in
  the app ever created that document.

So assigned testers could not open their tasks. Nothing here is compiled,
tested or deployed: this folder is outside `src/` and `tests/`.

## What is here

| File | Was at |
| --- | --- |
| `qa-admin.component.ts` | `src/app/features/admin/pages/qa/qa-admin.component.ts` |
| `qa.service.ts` | `src/app/core/services/qa.service.ts` |
| `qa.model.ts` | `src/app/core/models/qa.model.ts` |
| `qa-hub.rules.test.ts` | `tests/firestore/qa-hub.rules.test.ts` |
| `firestore.qa.rules` | `firestore.rules`, the QA HUB section (helpers `isActiveQaTester`, `isAssignedQaTask`; `qaTesters`, `qaTasks`, `qaSubmissions`) |
| `storage.qa.rules` | `storage.rules`, the QA HUB DOCUMENTS block (`qaTasks/{taskId}/documents/{file}`) |
| `route.snippet.ts` | `src/app/app.routes.ts`, the `admin/qa` route |
| `admin-dashboard-card.snippet.ts` | the QA Hub card in `admin-dashboard.component.ts` |
| `control-center-entry.snippet.ts` | the `qa` entry in `configuration-feature.registry.ts` |

The git tag `archive/qa-hub` (if created before the removal) points at the
last commit that still had the feature.

## Data left in place

Existing `qaTasks`, `qaSubmissions` and `qaTesters` documents and the files
under `qaTasks/` in Storage were not deleted. Browsers can no longer read
them (no rules allow it). Delete them in the Firebase console if they are
not needed.

## Restoring

1. Copy the four `.ts` files back to the paths above.
2. Put the route, the dashboard card and the Control Center entry back.
3. Paste `firestore.qa.rules` into `firestore.rules` (before AUDIT LOGS) and
   `storage.qa.rules` into `storage.rules`; run `npm run rules:build`.
4. Fix the tester mismatch first: decide who a tester is (for example the
   Support role) and use it everywhere; until then, give testers work
   with a training group (knowledge article "QA testing and giving testers work") and use the same check in the
   page, the service and both rules files.
5. Run the tests, deploy the rules, push the app, and update the knowledge
   articles.
