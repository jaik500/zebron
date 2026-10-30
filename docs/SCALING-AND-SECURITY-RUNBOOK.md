# Scaling and security runbook

Changes made on 30 October 2026 to lower running costs, prepare for growth and tighten security, plus the console steps only a project owner can do.

Project: `zebron-2b49f`. Run commands from `C:\Lessons\withDNS\zebron` (Git Bash).

---

## 1. What changed in the code

| Change | Files | Effect |
|---|---|---|
| **Roles on the sign-in token** (custom claims) | `functions/src/user-claims.ts`, `firestore.rules`, `storage.rules`, `src/app/core/services/claims-sync.service.ts`, `src/app/app.ts` | Rules check roles on the token instead of reading `users/{uid}` and the membership document on almost every request. Fewer billed reads, faster requests. |
| **App Check, ready to switch on** | `src/app/core/services/firebase-config.ts` | Off until a site key is filled in. Browser only, so server rendering is safe. |
| **Function instance caps** | `functions/src/global-options.ts`, `functions/src/index.ts` | No function can run more than 10 instances at once (about 800 simultaneous calls each). Stops runaway bills from spikes or abuse. |
| **Index exemptions** | `firestore.indexes.json` (`fieldOverrides`) | Large text and map fields (post and article bodies, email HTML and headers, audit change lists, question explanations) are no longer indexed. Less storage, cheaper and faster writes. None of these fields are searched or sorted on. |
| **Automatic deletion (TTL)** | `firestore.indexes.json`, `community-post-view.ts`, `chat-call.service.ts`, `community-notification.service.ts` | Post-view records deleted after 30 days, call signalling after 7 days, notifications after 180 days. Storage stops growing forever. |
| **Rules tests** | `tests/firestore/claims.rules.test.ts`, `tests/firestore/organization-membership-ladder.rules.test.ts` | Prove the token checks work, that missing roles fall back to documents, and the full membership role ladder (with documents and with tokens). |
| **No shared ticket counter** | `functions/src/support-tickets.ts` | New tickets are numbered like `ZB-261030-7K4QXM` (date + random code) instead of taking the next number from one shared document. Ticket creation no longer queues behind other tickets. Existing tickets keep their numbers. |
| **Security headers** | `src/server.ts` | HSTS, nosniff, frame and referrer protection, a Permissions-Policy (camera and microphone only for this site), and a **report-only** Content-Security-Policy. |
| **Website instance cap** | `apphosting.yaml` | At most 20 website server instances (about 1,600 simultaneous requests). |
| **Dependabot** | `.github/dependabot.yml` | Weekly grouped pull requests for outdated packages, for the website and the functions. |

### How roles on the token work

- Claims: `zv` = 1 (synced), `zpa` = platform admin, `zorg` = `{ organizationId: role }` for active memberships.
- `syncClaimsOnUserWrite` and `syncClaimsOnMembershipWrite` update the claims whenever a platform role, organization role or active flag changes.
- The app calls `syncMyClaims` once for accounts that have no claims yet, then refreshes the token. Every account gets claims on its next visit, with no backfill job.
- When roles change, the function writes `userClaims/{uid}`. The app listens to it and refreshes the token immediately, so new access works straight away.
- **Platform admin:** taken from the token once claims are synced. A newly promoted admin gets access after the automatic refresh.
- **Organization roles:** a role on the token is trusted. A role missing from the token (brand-new membership, or a person in very many organizations) falls back to the membership document, so nobody is wrongly locked out.
- **Removing access:** when access is reduced (demotion, deactivation, admin removed), the user's refresh tokens are revoked. An already-open session can keep the old access for **up to one hour**. This is the standard trade-off of token-based roles. If immediate removal matters, also disable the account in Firebase Authentication.

---

## 2. Deploy order

```bash
cd /c/Lessons/withDNS/zebron

# Tests (rules tests need the Firestore emulator, as before)
npm test
npm run build

# 1. Functions: claims sync, instance caps, view expiry
cd functions && rm -rf lib && npm run build && cd ..
FUNCTIONS_DISCOVERY_TIMEOUT=60 firebase deploy --only functions

# 2. Rules, indexes (exemptions + TTL) and storage rules
firebase deploy --only firestore:rules,firestore:indexes,storage

# 3. Website
git add -A && git commit -m "Roles on sign-in token, App Check ready, function caps, index exemptions, TTL" && git push
```

Functions go first so the claims exist before the website starts asking for them. The rules work either way, because they fall back to documents when a token has no claims.

If the indexes deploy asks to delete indexes that exist only in the console, answer **No**.

TTL policies can take up to 24 hours to become active. Deletion then runs in the background, usually within a day of the expiry date.

### Check it worked

1. Sign in with DevTools open (**Network** tab, filter `syncMyClaims`). On the first visit after deploying you should see one successful call; after that, none.
2. Firebase console → **Functions → Logs**: a line "Zebron claims updated." with your user ID.
3. The claims themselves are visible with the Admin SDK (`getAuth().getUser(uid)` → `customClaims`) or from the Firebase CLI's `auth:export`: `zv: 1`, `zpa`, and `zorg` with your organizations.
4. Change someone's organization role and confirm they see the change without signing out.
5. Firestore → Usage: document reads per request should drop noticeably over the following days.

---

## 3. App Check (needs you, about 10 minutes)

1. **Create the key.** Google Cloud console → **Security → reCAPTCHA** → **Create key**.
   - Platform: **Website**
   - Domains: `zebron.org`, `www.zebron.org`, your App Hosting domain (`*.hosted.app`), `localhost`
   - Uncheck "Use checkbox challenge" (invisible scoring).
2. **Register it.** Firebase console → **App Check** → **Apps** → your web app → **reCAPTCHA Enterprise** → paste the **site key** → Save.
3. **Add it to the code.** Put the site key in `APP_CHECK_SITE_KEY` in `src/app/core/services/firebase-config.ts`. The site key is public, so this is safe to commit.
4. **Local development.** Run the app on localhost and look in the browser console for "App Check debug token: …". Firebase console → App Check → **Manage debug tokens** → add it. (One per browser or machine.)
5. **Deploy the website**, then **wait about a week** and watch Firebase console → App Check → **Metrics** for each service. Most requests should be "verified".
6. **Enforce.** App Check → APIs → **Cloud Firestore → Enforce**, then **Cloud Storage → Enforce**.
7. **Callable functions.** These need `enforceAppCheck: true` added in code. Ask Claude to add it once step 6 has run cleanly for a few days.

To undo at any point, turn enforcement off in the same screen; it takes effect within minutes.

---

## 4. Budget alerts (needs you, about 5 minutes)

Google Cloud console → **Billing → Budgets & alerts → Create budget**.

- Scope: project `zebron-2b49f`, all services
- Amount: your expected monthly spend (start with something like twice the current bill)
- Alert thresholds: **50%, 90%, 100%** of actual, plus **100% of forecasted**
- Email: billing admins and users, plus your own address

Budgets only alert; they don't stop spending. The function instance caps are what limit runaway compute.

---

## 5. Backups (needs you, about 5 minutes)

Point-in-time recovery lets you read or restore data as it was at any minute in the last 7 days. Scheduled backups keep daily copies for longer.

```bash
gcloud config set project zebron-2b49f

# Point-in-time recovery (7 days)
gcloud firestore databases update --database='(default)' --enable-pitr

# Daily backups kept for 14 days
gcloud firestore backups schedules create --database='(default)' --recurrence=daily --retention=14d

# Check
gcloud firestore databases describe --database='(default)'
gcloud firestore backups schedules list --database='(default)'
```

Both cost a little extra storage; check the current Firestore pricing page.

Restoring creates a **new** database from a backup:

```bash
gcloud firestore backups list
gcloud firestore databases restore --source-backup=BACKUP_NAME --destination-database=restored-db
```

---

## 6. Content-Security-Policy (when you have time)

The site now sends `Content-Security-Policy-Report-Only`. It blocks nothing; the browser only logs what *would* be blocked.

1. Deploy, then open the main pages (home, sign-in, partner dashboard, Community with a video call, Test Center, donate) with DevTools → Console open.
2. Look for messages starting with `[Report Only] Refused to …`. Each names a domain the policy doesn't allow yet. Add it to the matching line in `CONTENT_SECURITY_POLICY` in `src/server.ts`.
3. When the console is clean everywhere, rename the header in `src/server.ts` from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`. Then malicious scripts injected into the page can't load or send data elsewhere.

---

## 7. Recommended account security (needs you)

- **Two-step verification for every Zebron admin:** both the Google accounts with access to the Firebase/Google Cloud project, and (later) Zebron platform admin sign-ins.
- **IAM review:** Google Cloud console → IAM. Remove people who no longer need access, and prefer the "Firebase Develop Admin" or "Viewer" roles over "Owner".
- **Legacy admin role:** once every admin account has `platformRole: "platform-admin"`, remove the old `role: "admin"` fallback from the rules and functions. Ask Claude to do it.

---

## 8. Rolling back

| Problem | Undo |
|---|---|
| Rules deny something they shouldn't | `git checkout HEAD~1 -- firestore.rules storage.rules` then `firebase deploy --only firestore:rules,storage` |
| Claims cause trouble | The rules still work without claims. Remove the `syncClaims*`/`syncMyClaims` exports and redeploy functions; tokens without `zv` use the document path. |
| A query fails with "requires an index" after the exemptions | Remove that field's entry from `fieldOverrides` and deploy indexes again. |
| App Check blocks real users | Turn off enforcement in Firebase console → App Check. |
| A function hits its instance cap under real load | Raise `maxInstances` in `functions/src/global-options.ts` (or on that function) and redeploy. |
| The website hits its instance cap | Raise `maxInstances` in `apphosting.yaml` and push. |
| A security header breaks something (for example an embed) | Remove or relax that header line in `src/server.ts` and push. |

---

## 9. Next steps (not done yet)

- **Page the member directory.** `getOrganizationMemberDirectory` and the Organization Management list load every member at once. Fine for hundreds; change to pages of 50 before organizations reach thousands of members.
- **Sharded counters for post engagement** (reactions, comments, views) before posts get very high traffic.
- **Enforce App Check on callable functions** once console enforcement has run cleanly (see section 3).
- **Remove the legacy `role: "admin"` fallback** (see section 7).
