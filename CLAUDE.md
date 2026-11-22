# Zebron: instructions for AI assistants

> **RULE: Whenever anything in the Zebron platform is created or changed, the Knowledge Center articles must be created or updated in the same piece of work.** No change is finished until its knowledge articles are.
> This applies to every change, however small, by any person or AI assistant.
> How to do it is below.

**Firestore rules:** edit `firestore.rules` (never `firestore.deploy.rules`,
which is generated), then run `npm run rules:build` and commit both files.
Keep new rules short: the compact rules have a 200 KiB budget, checked by
`tests/unit/firestore-rules-build.test.ts`.

**Read `docs/ZEBRON-CONTEXT.md` first.** It explains what Zebron is, the
stack, repository layout, applications, roles, data model, functions,
conventions, how to build and deploy, how we work together, and the open
issues. When a change makes anything in it wrong, update it in the same
change.

## Every change updates the knowledge articles

The help assistant (Ask for help) answers from the Knowledge Center, and the
Knowledge Center's platform articles come from one file:

    src/app/features/admin/pages/knowledge/guide-import/guide-articles.ts

So **every change to the platform also updates that file, in the same piece
of work**: new features, changed behaviour, new or renamed pages, settings,
roles, rules, Cloud Functions, scripts, error messages and fixes. A change is
not finished until its article is.

### How

1. Find the articles the change affects (search the file for the feature,
   page, setting or file name). Update every one that is now wrong or
   incomplete, including FAQs and troubleshooting articles.
2. If nothing covers it, add an article. Fields:
   - `slug`: unique, kebab-case; developer articles start with `dev-`.
   - `title`, `summary` (one sentence; keep it in step with the content).
   - `applicationKey`: `platform`, `community` or `test-center`.
   - `contentType`: `guide`, `how-to`, `faq`, `reference`, `troubleshooting`,
     `documentation` or `learning`.
   - `category`: reuse an existing one (Getting Started, Courses, Test Center,
     Community, Roles & Access, Security, Support, Troubleshooting,
     Platform Administration, Developer Reference, ...).
   - `audience`: who may read it, and who the assistant may answer with it.
     `user` (members and staff), `admin` (managers and above), `support`
     (Zebron platform administrators), `developer` (people maintaining
     Zebron), `all`. Never put developer or security internals in a `user`
     or `all` article.
   - `tags`: words people will search or ask with.
   - `content`: Knowledge Center light markdown (# headings, lists, tables,
     **bold**, `code`, > notes). Write for the audience: what to click and
     what happens for users; files, collections, functions and rules for
     developers.
3. Bump `GUIDE_EDITION` by one and update the "updated" date in the comment
   at the top of the file.
4. Check the file still compiles (`ng build`, or at least no TypeScript errors).
5. In the final message, list the articles added or changed and remind the
   user to publish them: **Admin → Knowledge Center → Import guide**
   (/admin/knowledge/import-guide) → **Import**. The assistant picks up
   published articles within about 5 minutes.

### What to write

- State how things work now, not the history of the change. Add a dated note
  only when it helps (for example a fix people may still meet on old data).
- Say what a person sees and does: page names, buttons, error messages word
  for word, so the assistant can match questions to them.
- Say when something is not done yet or has a limit, so the assistant does
  not promise it.
- Keep secrets, keys and personal data out of articles.
