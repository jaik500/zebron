/**
 * Publish the Zebron Internal Blog post "How Zebron works: one page for the
 * whole team" (Zebron staff only). It introduces docs/ZEBRON-CONTEXT.md and
 * the knowledge article "Zebron platform overview for the team".
 *
 * Usage (from the project root, same credentials as the other seed scripts):
 *   node scripts/seed-blog-zebron-context.mjs                     # dry run
 *   node scripts/seed-blog-zebron-context.mjs --apply             # publish
 *   node scripts/seed-blog-zebron-context.mjs --apply --pin       # publish and pin it
 *   node scripts/seed-blog-zebron-context.mjs --apply --draft     # save as a draft first
 *   node scripts/seed-blog-zebron-context.mjs --apply --overwrite # replace it (comments, reactions and date are kept)
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
  id: "how-zebron-works-one-page",
  title: "How Zebron works: one page for the whole team",
  topic: "Product",
  cover: "slate",
  coverImage: null,
  coverImageAlt: "",
  excerpt:
    "Zebron has grown into sixteen applications, five organization roles and dozens of Cloud Functions. We have written it all down in one place, for new teammates, for each other and for the AI assistants we work with. Here's the tour, and three habits that keep it true.",
  content: `
Zebron has grown fast. What started as a resources directory is now a platform with Zebron's own courses, quizzes, certifications, a Coding Lab, a job board, a Community, a blog and a help assistant, plus partner organizations that each run their own space with up to sixteen applications.

That growth has a cost: knowing how it all fits together has lived in a few people's heads. Explaining Zebron again at the start of every task, whether to a new teammate or to an AI assistant, slows everyone down. So we wrote it down, once, in one place.

# Where to find it

- **In the code:** \`docs/ZEBRON-CONTEXT.md\` in the Zebron repository. Give this file to anyone (or any AI assistant) starting work on Zebron.
- **In the Knowledge Center:** the developer and support article **"Zebron platform overview for the team"** has the same content, and the help assistant can answer questions from it.

# The tour in two minutes

**Two sides, one platform.** Zebron's own public platform is run by us, the platform administrators. **Partner organizations** (businesses, schools and bootcamps) apply, are approved and provisioned, and then run their own space at /partner/org/... with the applications they signed up for: Courses, Test Center, Virtual Classroom, Training Groups, Community, Knowledge Center, Blog, Mailbox, Business Operations and more.

**Roles.** Platform administrators see everything. Inside an organization there is a five-step ladder: member, staff, manager, admin and owner. Each role includes the ones below it, and people only manage roles strictly below their own. Roles are copied onto the sign-in token so the security rules can check them quickly.

**The stack.** Angular 21 with server-side rendering on Firebase App Hosting, Cloud Firestore, Cloud Storage, Cloud Functions (Node 24), Resend for email, Gemini for the help assistant, and Vitest for tests.

**Where security lives.** In the Firestore and Storage rules and in the Cloud Functions, never in the screens. Anything that needs trust (exams, progress, cross-organization changes, email) goes through a function that checks the caller on the server. Exams are always graded on the server.

**One thing everyone should know:** the local app at localhost:4200 uses the **live** database, and **pushing to master deploys the website**. Treat both with care.

# What the document covers

1. What Zebron is and who uses it
2. The tech stack and the Firebase project
3. Where everything lives in the repository
4. The sixteen applications and how they depend on each other
5. Platform roles, organization roles and roles on the sign-in token
6. The main database collections
7. The Cloud Functions, their secrets and schedules
8. How the big pieces work: Control Center, system settings, Coding Lab sandbox, exams, Knowledge Center and the help assistant, email, French and dashboards
9. Our coding conventions, including the Tailwind and Angular pitfalls we have hit
10. Building, testing (Vitest and the Firestore emulator) and deploying
11. How we work together, including with AI assistants
12. The open issues we are working through

# Three habits that keep it true

**1. Every change updates the knowledge articles.** The help assistant answers from the Knowledge Center, and its platform articles come from one file in the code (\`guide-articles.ts\`). A change isn't finished until its article is: update what the change made wrong, add an article if nothing covers it, choose the audience carefully, and bump the guide edition. Then publish with **Admin → Knowledge Center → Import guide → Import**.

**2. Every change keeps the overview current.** If a change adds an application, a collection, a function, a rule or a new way of working, update \`docs/ZEBRON-CONTEXT.md\` in the same change.

**3. AI assistants follow the same rules.** \`CLAUDE.md\` and the Cursor rules in the repository tell assistants to read the overview first and to update the knowledge articles with every change. When you work with an assistant in a Claude chat, connect the zebron folder, give it the overview, and run the builds and tests it asks for: it can read and change files but usually can't run them on your computer.

# What changed this week

The overview was written alongside a review of the platform. Among the fixes:

- A gap in how organization memberships were checked is closed, with new rules tests.
- The Coding Lab now runs learners' code in a sealed sandbox that can't reach their account.
- Maintenance mode can be switched on again from the Control Center, and the Control Center badge now shows green, orange (a health check found a problem) or red (maintenance mode).
- New developer article: **"Running the tests (Vitest and the Firestore emulator)"**.

The remaining items are listed in the overview's open-issues section, by priority.

# Over to you

Read the overview once, keep it open while you work, and fix it when it's wrong. If something you needed wasn't there, add it: the next person will need it too.

Related Knowledge Center articles: **Zebron platform overview for the team**, **Zebron architecture overview**, **Running the tests (Vitest and the Firestore emulator)**, **Deploying Zebron** and **Using the Control Center**.
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
