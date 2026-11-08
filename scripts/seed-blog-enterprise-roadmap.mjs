/**
 * Publish the Zebron Internal Blog post "Making Zebron enterprise-ready:
 * roadmap and infrastructure transition" (Zebron staff only), with its
 * 70-second video (original animation, soft original music, captions).
 *
 *   video   public/videos/blog/zebron-enterprise-roadmap.mp4
 *   poster  public/images/blog/zebron-enterprise-roadmap.jpg
 *
 * The post is internal, but files in public/ can be opened by anyone who
 * has their address. The video contains no secrets.
 *
 * Usage (from the project root, same credentials as the other seed scripts):
 *   node scripts/seed-blog-enterprise-roadmap.mjs                     # dry run
 *   node scripts/seed-blog-enterprise-roadmap.mjs --apply             # publish
 *   node scripts/seed-blog-enterprise-roadmap.mjs --apply --pin       # publish and pin it
 *   node scripts/seed-blog-enterprise-roadmap.mjs --apply --draft     # save as a draft first
 *   node scripts/seed-blog-enterprise-roadmap.mjs --apply --overwrite # replace it (comments, reactions and date are kept)
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const DRAFT = args.has("--draft");
const OVERWRITE = args.has("--overwrite");
const PIN = args.has("--pin");

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

const readingMinutes = (text) => Math.max(1, Math.round(text.trim().split(/\s+/).length / 220));

const POST = {
  id: "making-zebron-enterprise-ready",
  title: "Making Zebron enterprise-ready: roadmap and infrastructure transition",
  topic: "Product",
  cover: "navy",
  coverImage: "/images/blog/zebron-enterprise-roadmap.jpg",
  coverImageAlt: "Zebron enterprise roadmap: four phases over twelve months",
  excerpt:
    "What enterprise standard means for Zebron, where we are, the seven gaps to close, the target infrastructure, and a four-phase plan to get there without disrupting anyone. With a 70-second video.",
  content: `
Zebron works well for the people and organizations using it today. To be chosen by large employers, state agencies, colleges and workforce boards, it also has to pass their security reviews, plug into their sign-in systems, promise uptime, recover from mistakes and prove all of this with evidence. This post sets out what "enterprise standard" means for us, where we are, what has to change, and how we will move there without disrupting anyone.

![The roadmap and infrastructure transition in 70 seconds (soft music; every line appears as a caption)](/videos/blog/zebron-enterprise-roadmap.mp4 "/images/blog/zebron-enterprise-roadmap.jpg")

# What "enterprise standard" means for Zebron

An enterprise customer will ask us to show, not just say, that Zebron is:

1. **Secure by default:** strong sign-in, least-privilege access, protection against bots and abuse.
2. **Provable:** an audit trail they can export, documented controls, and eventually an independent audit (SOC 2).
3. **Reliable:** agreed uptime targets that we measure and report.
4. **Recoverable:** backups we have actually restored, and a disaster-recovery plan with tested recovery times.
5. **Operable:** alerts that reach a person, runbooks, and an incident process.
6. **Changed safely:** every change reviewed, tested and released through the same pipeline, with a way back.
7. **Integrated:** single sign-on with their identity provider and, later, automatic user provisioning.
8. **Commercially ready:** plans, invoices, contracts and service levels.
9. **Fair and private:** accessibility (WCAG 2.2 AA) and privacy requests handled on time.

# Where we are today

| Area | Today | Enterprise target |
| --- | --- | --- |
| Environments | One Firebase project for everything | Separate development, staging and production projects |
| Releases | Push to master goes live; functions and rules deployed by hand | One pipeline: review → checks → preview → staging → approval → production |
| Credentials | Seed scripts use service-account key files on laptops | No key files; the pipeline uses Workload Identity Federation |
| Sign-in | Email and password; no MFA screen; no verify-email or reset screen | SSO (SAML/OIDC), MFA required for admins, self-service recovery |
| Bot protection | App Check prepared but not configured | App Check enforced; WAF and rate limits in front of the site |
| Monitoring | Function logs and the Control Center | Dashboards, alerts, uptime checks, error reporting, on-call |
| Recovery | Backups documented in the runbook | Point-in-time recovery plus daily backups, restore tested each quarter |
| Audit | Audit trail in Firestore, viewable in the Control Center | Exported to BigQuery, kept for the agreed period, searchable |
| Billing | Donations only; suspensions by hand | Stripe subscriptions, invoices, automatic grace period and suspension |
| Scale | Fine for hundreds of members per organization | Paged directories, a search service, sharded counters, load-tested |

**What we already have going for us:** server-side rendering, strict security rules with tests, roles on the sign-in token, an audit trail, a kill switch for every application, per-organization suspension, a live Control Center with real security checks, cost caps on instances, and a knowledge base that documents how everything works.

# Target infrastructure

\`\`\`
GitHub ──► GitHub Actions ──► (Workload Identity, no keys)
              │ lint · unit tests · rules tests · build
              ▼
   Development project ──► Staging project ──► [approval] ──► Production project
   (preview channels)       (copy of prod setup)              (real users)

Each project: App Hosting backend · Firestore (PITR + daily backups) · Storage
              Cloud Functions · Identity Platform (SSO + MFA) · App Check
              Cloud Monitoring (dashboards, alerts, uptime) · Error Reporting
              Audit log → BigQuery · Secret Manager · budget alerts

In front of production: Cloudflare DNS + WAF and rate limiting
\`\`\`

# What has to change, area by area

## 1. Identity and access

- Upgrade Firebase Authentication to **Identity Platform** to get **SAML and OIDC single sign-on** per organization and **multi-factor authentication**.
- Require MFA for every platform administrator and organization owner.
- Add **verify email** and **forgot password** to the sign-in page.
- Let administrators change platform roles from Admin → Users (today it needs a developer).
- Later: **SCIM** user provisioning for large customers (needs a small service or a partner).

## 2. Environments

- Create **zebron-dev** and **zebron-staging** projects next to production, with the same rules, indexes and functions.
- Give each its own App Hosting backend, Firebase config and secrets.
- Seed staging with realistic but **non-personal** data.

## 3. Delivery (CI/CD)

- **Branch protection** on master: a pull request, one approving review and passing checks are required.
- **GitHub Actions** on every pull request: install, lint, \`npm run test:unit\`, rules tests against the emulator, \`ng build\`, and a preview deploy.
- On merge: deploy functions, rules, indexes and the website to **staging** automatically; to **production** after a person approves.
- Authenticate the pipeline with **Workload Identity Federation**, then delete the service-account key files.
- Dependabot for dependency updates and security alerts.

## 4. Observability and operations

- Cloud Monitoring **dashboards** (requests, errors, latency, function failures, Firestore usage) and **alerts** to an on-call rota.
- **Uptime checks** on the home page, sign-in and a health endpoint.
- **Error Reporting** for the website and functions.
- Service level objectives, starting with 99.9% availability for the public site, measured monthly.
- An incident process: severity levels, a status page, and a written review after each serious incident.

## 5. Security and compliance

- Turn on and then **enforce App Check** (steps in the Scaling, cost and security runbook).
- **Enforce the Content-Security-Policy** (now report-only) and remove the old role fallback.
- Cloudflare **WAF and rate limiting** in front of production.
- Export the audit trail to **BigQuery** with a defined retention period.
- A data-retention policy, a privacy-request process (access, correction, deletion), an annual **penetration test**, and an accessibility audit with a published conformance report.
- Prepare for **SOC 2 Type II**: written policies, access reviews, change records from the pipeline and evidence collection. The audit itself needs an outside auditor and months of evidence.

## 6. Billing and contracts

- **Stripe subscriptions** per organization and per application, with invoices.
- A failed payment starts a **grace period**, then suspends the organization automatically and emails its owners; paying reactivates it. (Manual suspension already exists.)
- A billing view for owners, and SLAs attached to the paid plans.

## 7. Scale

- Page the member directory, add sharded counters for busy posts, add a search service once the data outgrows browser search, and add a TURN relay for chat calls.
- **Load-test** staging before large customers join and after big changes.

# Roadmap

**Phase 0: security quick wins (first month)**
- MFA for everyone with Firebase and Google Cloud console access
- App Check configured and monitored
- Point-in-time recovery and daily backups on; one test restore
- Budget alerts at 50%, 90% and 100%
- Branch protection on master
- Cost estimate for Phases 1–3

**Done when:** the Control Center Security tab has no "Fix now" items and a restore has been tested.

**Phase 1: environments and delivery (months 1–3)**
- Development and staging projects
- GitHub Actions pipeline with checks, previews and approvals
- Workload Identity Federation; key files deleted
- Dashboards, alerts, uptime checks, error reporting, on-call rota

**Done when:** every production change in a month went through the pipeline.

**Phase 2: enterprise features (months 3–6)**
- Identity Platform: SSO and MFA in the product
- Verify email, password reset, role management
- Stripe subscriptions with automatic grace period and suspension
- Audit export to BigQuery; retention and privacy-request process
- Accessibility audit

**Done when:** a pilot customer signs in with their own SSO and pays by invoice.

**Phase 3: scale and certification (months 6–12)**
- Paged directories, search service, sharded counters, TURN relay
- Load tests and a disaster-recovery exercise
- Penetration test and fixes
- SOC 2 Type II readiness and audit window
- Published SLAs and status page

**Done when:** we can answer an enterprise security questionnaire with evidence for every item.

# How we will make the transition

- **One change at a time, staging first.** Nothing reaches production without passing staging.
- **Always a way back.** Every release can be rolled back in App Hosting; risky features ship behind the kill switch.
- **No big bang.** Production keeps running throughout; users see better sign-in and reliability, not downtime.
- **Measure before and after.** Each phase has an exit test, and we review progress every week.
- **Write it down.** Each new process gets a Knowledge Center article and a runbook before it is "done".

# What changes for the team

- No key files on laptops: the pipeline deploys.
- Every change is a reviewed pull request.
- Test in staging before production.
- Alerts reach a person, and that person has a runbook.

# Next steps this week

1. Agree owners for each area and the weekly review slot.
2. Start Phase 0: MFA on console accounts, budget alerts, backups and branch protection.
3. Estimate costs for Identity Platform, extra projects, monitoring and the audits.

Related Knowledge Center articles: **Planned improvements**, **Scaling, cost and security runbook**, **Fixing Security tab warnings**, **Outside services Zebron depends on** and **Using the Control Center**.
`,
};

async function main() {
  const content = POST.content.trim();
  const ref = db.collection("blogPosts").doc(POST.id);
  const existing = await ref.get();

  console.log(`${APPLY ? "Writing" : "Dry run:"} 1 post to ${PROJECT_ID} as ${DRAFT ? "a draft" : "published"}${PIN ? ", pinned" : ""}\n`);

  if (existing.exists && !OVERWRITE) {
    console.log(`  skip    ${POST.id} (already exists; use --overwrite to replace)`);
    return;
  }

  const keptDate = existing.exists ? existing.get("publishedAt") : null;
  const data = {
    section: "internal",
    organizationId: null,
    title: POST.title,
    excerpt: POST.excerpt,
    content,
    topic: POST.topic,
    cover: POST.cover,
    coverImage: POST.coverImage,
    coverImageAlt: POST.coverImageAlt,
    pinned: PIN,
    readingMinutes: readingMinutes(content),
    status: DRAFT ? "draft" : "published",
    reviewNote: null,
    authorId: "zebron-platform",
    authorName: "Zebron Platform Team",
    updatedAt: FieldValue.serverTimestamp(),
    publishedAt: DRAFT ? null : keptDate ?? Timestamp.now(),
    publishAt: null,
    ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  };

  console.log(`  ${existing.exists ? "replace" : "create "} ${POST.id}  [${POST.topic}, ${data.readingMinutes} min read]`);

  if (APPLY) {
    await ref.set(data, { merge: true });
  }

  console.log(APPLY ? "\nDone. Open Admin → Internal Blog (/admin/blog) to see it." : "\nNothing written. Add --apply to publish.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
