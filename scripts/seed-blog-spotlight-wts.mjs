/**
 * Publish the Zebron Blog post "Bootcamp spotlight: Washington Tech Solutions",
 * with its 31-second video clip about the school's cybersecurity training.
 *
 *   video   public/videos/blog/washington-tech-solutions-cybersecurity.mp4   (original animation, no sound)
 *   poster  public/images/blog/washington-tech-solutions-cybersecurity.jpg   (cover picture and video preview)
 *
 * Course details come from washingtontechsolutions.com (checked November 2026).
 *
 * Both files ship with the site, so the post shows them once the site is deployed.
 *
 * Usage (from the project root, same credentials as the other seed scripts):
 *   node scripts/seed-blog-spotlight-wts.mjs                     # dry run
 *   node scripts/seed-blog-spotlight-wts.mjs --apply             # publish
 *   node scripts/seed-blog-spotlight-wts.mjs --apply --pin       # publish and pin it to the top of the blog
 *   node scripts/seed-blog-spotlight-wts.mjs --apply --draft     # save as a draft to review first
 *   node scripts/seed-blog-spotlight-wts.mjs --apply --overwrite # replace it (comments, reactions and date are kept)
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
  id: "bootcamp-spotlight-washington-tech-solutions",
  title: "Bootcamp spotlight: cybersecurity training at Washington Tech Solutions",
  topic: "Tech skills",
  cover: "navy",
  coverImage: "/images/blog/washington-tech-solutions-cybersecurity.jpg",
  coverImageAlt: "Bootcamp spotlight: Washington Tech Solutions, cybersecurity training in Greenbelt, Maryland",
  excerpt:
    "A Greenbelt, Maryland school that trains security analysts the way a real Security Operations Center works. A 30-second video tour, what you learn, and the questions to ask before you enroll.",
  content: `
Cybersecurity is one of the most common paths people explore on Zebron's [bootcamps page](https://zebron.org/bootcamps), and for good reason: every organization that keeps data needs people who can spot an attack and respond. In this spotlight we look at **Washington Tech Solutions**, a training and consulting company in Greenbelt, Maryland, through the lens of what a Zebron user would want to know.

![Bootcamp spotlight: Washington Tech Solutions in 30 seconds (no sound; everything in the video is written below)](/videos/blog/washington-tech-solutions-cybersecurity.mp4 "/images/blog/washington-tech-solutions-cybersecurity.jpg")

# The main program: Cybersecurity Analyst (SOC) Bootcamp

A Security Operations Center, or SOC, is the team that watches an organization's systems around the clock. This bootcamp teaches how that work happens day to day.

| At a glance | |
| --- | --- |
| Length | 24 weeks |
| Format | In person, Greenbelt, MD |
| Level | Beginner |
| Class size | Up to 50 students |
| Listed price | $4,000 (check the current price and financing with the school) |

**What you learn:**

- How networks, computers and users create logs, and why those logs matter
- Telling normal activity from real threats, sorting noisy alerts and escalating the right ones
- Common attacks: phishing, malware, brute-force logins and suspicious outbound traffic
- Writing clear tickets and short incident notes, a skill employers look for

**How you learn:** most of the time is hands-on, with a SIEM (Splunk or Elastic), Wireshark, Sysmon, and Windows and Linux logs. You practice a simple incident flow: **detect, analyze, contain, recover, report**. The bootcamp ends with a SOC investigation capstone that you present.

The school says the program gives strong practical context if you plan to sit the **CompTIA Security+** exam afterwards.

# Other ways in

- **Free starter courses:** Blue Team Foundations (built on the NIST and MITRE frameworks) and Offensive Security Fundamentals, an introduction to ethical hacking with a focus on safe practice.
- **Certification prep:** CompTIA Security+ and CySA+, workshops for (ISC)² CISSP and CCSP, and cloud certifications, with practice exams and live sessions.
- **Risk and compliance:** training on applying the Risk Management Framework to federal information systems, banking (PCI DSS) and FedRAMP cloud compliance, a specialty in demand around federal agencies and contractors.

# Questions to ask before you enroll

Zebron lists programs so you can compare them. Whichever school you choose, ask:

1. **What is the total cost, and what financing or payment plans are there?**
2. **When does the next class start, and what are the class days and hours?**
3. **How many graduates finish, and how many work in cybersecurity within six months?**
4. **Which certification exams does the program prepare me for, and is the exam fee included?**
5. **What career help is there:** resume reviews, mock interviews, employer introductions?

At 24 weeks, this bootcamp is longer than the 8 to 15 weeks covered by the new Workforce Pell Grants, so ask the school directly about other ways to pay.

# Find it on Zebron

Open the [bootcamps page](https://zebron.org/bootcamps), filter by **Cybersecurity**, and compare programs side by side: length, format, place and next class. When you are ready, use the buttons on each listing to visit the school's website or call.

*Program details come from the Washington Tech Solutions website in November 2026 and may change. Zebron does not run or endorse this program; contact the school to confirm details.*

# Sources

- [Washington Tech Solutions: Cybersecurity Analyst (SOC) Bootcamp](https://washingtontechsolutions.com/courses/starting-seo-as-your-home-based-business/)
- [Washington Tech Solutions: Courses](https://washingtontechsolutions.com/courses/)
- [Washington Tech Solutions: Certification paths](https://washingtontechsolutions.com/certification-paths/)
- [Washington Tech Solutions: Areas of specialty](https://www.washingtontechsolutions.com/areas-of-specialty)
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
