/**
 * Publish the Zebron Blog post "How to find help on Zebron in 3 steps",
 * with its 24-second video clip.
 *
 *   video   public/videos/blog/how-to-use-zebron.mp4   (original animation, no sound)
 *   poster  public/images/blog/how-to-use-zebron.jpg   (cover picture and video preview)
 *
 * Both files ship with the site, so the post shows them once the site is deployed.
 *
 * Usage (from the project root, same credentials as the other seed scripts):
 *   node scripts/seed-blog-video-post.mjs                     # dry run
 *   node scripts/seed-blog-video-post.mjs --apply             # publish
 *   node scripts/seed-blog-video-post.mjs --apply --pin       # publish and pin it to the top of the blog
 *   node scripts/seed-blog-video-post.mjs --apply --draft     # save as a draft to review first
 *   node scripts/seed-blog-video-post.mjs --apply --overwrite # replace it (comments, reactions and date are kept)
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
  id: "how-to-find-help-on-zebron-video",
  title: "Watch: how to find help on Zebron in 3 steps",
  topic: "Zebron news",
  cover: "navy",
  coverImage: "/images/blog/how-to-use-zebron.jpg",
  coverImageAlt: "The Zebron logo with the words: Find help in 3 simple steps",
  excerpt:
    "A 24-second video shows how to search, pick the right resource and connect, whether you need rent help, food, health care, a job or training anywhere in DC, Maryland or Virginia.",
  content: `
Looking for help can feel like a full-time job: dozens of websites, phone trees and programs that turn out not to serve your area. Zebron brings trusted services across **Washington, DC, Maryland and Virginia** into one place, free to use. This short video shows how it works.

![How to find help on Zebron in 3 steps](/videos/blog/how-to-use-zebron.mp4 "/images/blog/how-to-use-zebron.jpg")

# Step 1: Search for what you need

Type what you need in your own words, such as "rent help", "food pantry" or "free clinic", or pick a topic like Food, Housing, Jobs, Health Care or Legal Help. Choose your county or city so results start close to home.

# Step 2: Pick a resource that fits

Each card shows the basics at a glance:

- **Free** when the service costs nothing
- **Open now** with today's hours
- **Online** when you can get help without going anywhere
- **Verified** when our team has recently checked the details

Use the filters on the left to narrow things down, and open a card to read eligibility, hours and what to bring.

# Step 3: Connect in one tap

Every listing has buttons to **Call**, get **Directions** or open the **Website**, so you can reach the right people right away. Not sure where to start? Tap **Ask for help** at the bottom of any page.

# Tips for a faster search

1. **Use plain words.** "Help paying rent" works as well as the program's official name.
2. **Check "Open now"** if you need help today.
3. **Look at the topic page.** Each topic, such as Housing or Food, has short tips and trusted links from our team.
4. **Know an organization we are missing?** Use **Add a Resource** on the home page and we will review it.

# What the video shows

The video has no sound. It shows the Zebron logo and the words "Find help in 3 simple steps". Step 1: someone types "rent help" in the search box and picks the Housing topic. Step 2: three resource cards appear, and the person picks one marked Free and Open now. Step 3: the resource opens with Call, Directions and Website buttons; the person taps Call and sees "You're connected". It ends with "Start now at zebron.org, free to use".

[Start exploring resources on Zebron](https://zebron.org/resources)
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
    section: "public",
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
    authorId: "zebron-editorial",
    authorName: "Zebron Editorial Team",
    updatedAt: FieldValue.serverTimestamp(),
    publishedAt: DRAFT ? null : keptDate ?? Timestamp.now(),
    publishAt: null,
    ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  };

  console.log(`  ${existing.exists ? "replace" : "create "} ${POST.id}  [${POST.topic}, ${data.readingMinutes} min read]`);

  if (APPLY) {
    await ref.set(data, { merge: true });
  }

  console.log(APPLY ? "\nDone. Open /blog to see it." : "\nNothing written. Add --apply to publish.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
