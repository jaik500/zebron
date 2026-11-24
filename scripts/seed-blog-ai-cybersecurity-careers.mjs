/**
 * Publish the Zebron Blog post "AI isn't taking over cybersecurity. It's
 * rewriting the job description." How AI is changing tech and security work,
 * what professionals should do to prepare, the DC-area bootcamps on Zebron,
 * and the big tech and security conferences coming up (Nov 2026 – Jun 2027).
 *
 * Facts and dates were checked on 23 November 2026 against the sources listed
 * at the end of the post. Conference dates come from the organizers' sites.
 * The conference section dates quickly: after June 2027, update or unpin it.
 *
 * Usage (from the project root, same credentials as the other seed scripts):
 *   node scripts/seed-blog-ai-cybersecurity-careers.mjs                     # dry run
 *   node scripts/seed-blog-ai-cybersecurity-careers.mjs --apply --draft     # save as a draft to review first
 *   node scripts/seed-blog-ai-cybersecurity-careers.mjs --apply             # publish
 *   node scripts/seed-blog-ai-cybersecurity-careers.mjs --apply --pin       # publish and pin it to the top of the blog
 *   node scripts/seed-blog-ai-cybersecurity-careers.mjs --apply --overwrite # replace it (comments, reactions and date are kept)
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
  id: "ai-is-rewriting-the-cybersecurity-job",
  title: "AI isn't taking over cybersecurity. It's rewriting the job description.",
  topic: "AI",
  cover: "violet",
  coverImage: null,
  coverImageAlt: "",
  excerpt:
    "AI agents now do much of the alert triage that used to fill an entry-level security analyst's day. Here's what the 2026 research says is changing in tech and cybersecurity work, eight things to do about it, where to train in the DC area, and the big conferences coming up through June 2027.",
  content: `
If you work in tech, or are trying to break in, you have probably heard some version of "AI is going to take our jobs." In cybersecurity the honest answer, based on this year's research, is more useful than a yes or no: **AI is taking over tasks, and the jobs are being rebuilt around the people who direct, check and secure that AI.** That shift is already showing up in job postings, and it changes what you should learn next.

# What is actually changing

**The first rung of the ladder is moving.** The classic entry-level security job, the tier-1 Security Operations Center (SOC) analyst, used to mean working through a queue of alerts by hand. AI agents now triage alerts, open tickets and run first-pass investigations. Gartner's 2026 report on roles in the AI-enabled SOC describes the analyst's job moving from processing alerts to owning a case from start to finish, and predicts that by 2028 security operations teams will have **50% more engineers than analysts**.

**AI skills are becoming a hiring requirement.** The AI Workforce Consortium, a group of large tech employers, found that the share of cybersecurity job postings in G7 countries asking for AI skills **doubled in a year**, from 14.2% to 28.5% between October 2025 and March 2026. An August 2026 review of more than 1,000 U.S. security operations postings by D3 Security found that about one in four required hands-on AI or automation skills, and that engineering roles outnumbered SOC analyst roles about three to one.

**But people are not being written out.** ISC2, the nonprofit association of cybersecurity professionals, surveyed 856 practitioners who use AI at work in May 2026. Its conclusion: AI is reshaping roles toward higher-value work such as asking the right questions, validating findings and making the final call, and it is **changing what the profession requires** rather than replacing it. ISC2's larger 2025 workforce study (more than 16,000 respondents) found skills gaps, not headcount, are now the main worry: 88% of respondents had experienced at least one significant security incident they linked to missing skills, and **AI was the most-needed skill** for the second year running, cited by 41%, ahead of cloud security at 36%.

**The catch for newcomers.** If AI does the beginner work, where do beginners learn? A September 2026 Swimlane survey found most security staff are more satisfied with their jobs as AI takes on routine work, but nearly half said getting into the field is harder, and about a quarter said AI had limited their chance to build skills. That is the gap this post is about.

# Eight things to do now

1. **Learn to supervise AI, not just use it.** The new entry-level skill is checking an AI agent's work: reading its reasoning, spotting a wrong conclusion, and knowing when to override it. Practice by running AI tools against problems you can also solve by hand, and compare.
2. **Keep the fundamentals sharp.** You can't validate what you don't understand. Networking, operating systems, logs and the incident response cycle (detect, analyze, contain, recover, report) are still the foundation, and they are what you use to catch an AI's mistakes.
3. **Move toward engineering.** The growth is in people who build and tune the automation: detection engineering, security automation and cloud security. Learn **Python**, get comfortable with APIs and scripting, and learn at least one cloud platform well.
4. **Learn AI security itself.** Companies are deploying AI faster than they can secure it. Learn how AI systems are attacked and protected: prompt injection, data leakage through AI tools, access control for AI agents, and how frameworks such as NIST's AI Risk Management Framework and MITRE ATLAS describe AI threats.
5. **Get the certifications employers still filter on.** CompTIA Security+ remains the common entry point, especially for federal and contractor jobs around DC, followed by CySA+, cloud certifications, and CISSP later in a career. Add AI-related credentials as they become established, but don't skip the basics for them.
6. **Show your work.** With fewer junior openings, proof matters more. Build a home lab, write short incident reports on practice investigations, publish detection rules or scripts, and keep it all in a portfolio you can share.
7. **Write and explain clearly.** As AI handles volume, people are judged on decisions and communication: explaining a risk to a manager, writing a clear ticket, and documenting why you overrode an alert. These skills don't automate well.
8. **Use structured routes in.** Bootcamps, apprenticeships and paid internships that put you in front of real tools and real employers are a faster way past the shrinking first rung than applying cold.

# Where to train in the DC area

Zebron's [bootcamps page](https://zebron.org/bootcamps) lets you filter by field and compare length, cost, format and next start. Three to look at:

- **Washington Tech Solutions (Greenbelt, MD):** an in-person, 24-week Cybersecurity Analyst (SOC) Bootcamp built around a SIEM, log analysis and a capstone investigation, plus **free** 6-week Blue Team and Offensive Security courses. Read our [spotlight on the school](https://zebron.org/blog/bootcamp-spotlight-washington-tech-solutions).
- **Per Scholas National Capital Region (Silver Spring, MD):** a **no-cost**, full-time, 15-week AI-Enabled IT Support program that prepares you for CompTIA A+ and the Google IT Support certificate.
- **Year Up United (DC area):** **tuition-free** IT Support and Data Analytics training for 18- to 29-year-olds, with a stipend and an internship with a corporate partner.

On Zebron you can also practice for Security+ and other exams in the [Test Center](https://zebron.org/test-center/quizzes), take Zebron's own [courses](https://zebron.org/courses), and search the [job board](https://zebron.org/jobs). If cost is the barrier, our [resources directory](https://zebron.org/resources) lists free job centers that can help pay for training.

# Big conferences coming up

Conferences are where new AI security tools and attacks are shown first, and where hiring managers are. You don't have to attend in person to benefit: many keynotes stream free, and talks are often posted online afterwards.

| When | Event | Where | Why it matters |
| --- | --- | --- | --- |
| Nov 30 – Dec 4, 2026 | **AWS re:Invent** | Las Vegas (keynotes streamed) | AWS's flagship cloud conference, heavy on agentic AI this year. Watch the keynotes online. |
| Dec 7 – 10, 2026 | **Black Hat Europe** | ExCeL London | Security research briefings, with "AI and autonomous threats" a main theme and an AI Security Summit on Dec 8. |
| Jan 6 – 9, 2027 | **CES** | Las Vegas | The giant annual consumer tech show. Expect AI in every kind of device, and new security questions with it. |
| Apr 5 – 8, 2027 | **RSAC Conference** | Moscone Center, San Francisco | One of the world's largest security conferences (about 43,000 attendees). Early registration discounts end Dec 18. |
| Jun 14 – 16, 2027 | **Gartner Cybersecurity & Risk Management Summit** | Gaylord National, National Harbor, MD | Right on our doorstep: where security leaders plan their AI strategies and budgets. |
| Summer 2027 (dates TBA) | **AWS Summit Washington, DC** | Walter E. Washington Convention Center | Free public-sector cloud event; the 2026 edition was June 30 – July 1. Watch for the 2027 dates. |

**Tip:** if a ticket is out of reach, follow the event's published talks, ask about student or volunteer passes, and look for free local meetups and watch parties during the big weeks.

# The bottom line

AI is not removing the need for people who protect systems; it is raising the bar for what those people do. The professionals who do well will be the ones who understand the fundamentals, can direct and check AI, and can secure AI itself. If you are starting out, the path is still open, but it runs through hands-on training and proof of skill. Start with one step this month: pick a bootcamp to compare, a certification to begin, or a conference keynote to watch.

*This post summarizes published research and organizers' announcements as of November 23, 2026. Event dates can change: confirm on each event's website before booking. Zebron lists training programs to help you compare them and does not run or endorse them.*

# Sources

- [ISC2: Rethinking AI's Impact on Cybersecurity Roles (July 2026)](https://www.isc2.org/Insights/2026/07/Rethinking-AI-Impact-on-Cybersecurity-Roles)
- [ISC2: 2025 Cybersecurity Workforce Study](https://www.isc2.org/Insights/2025/12/2025-ISC2-Cybersecurity-Workforce-Study)
- [Rapid7 on Gartner's "The Roles Required for the AI-Enabled SOC"](https://www.rapid7.com/blog/post/ai-changing-security-operations-center-roles-soc)
- [AI Workforce Consortium: AI Agents and the Impact on Cybersecurity](https://cisco.com/site/m/ai-workforce-consortium/agent-cybersecurity-impact.html)
- [D3 Security: The SOC Rebuild Index, 2026 Edition](https://d3security.com/resources/soc-rebuild-index-2026/)
- [Dark Reading: AI reshapes the SOC career ladder (Swimlane research)](https://www.darkreading.com/cybersecurity-careers/ai-reshapes-soc-career-ladder)
- [AWS re:Invent](https://aws.amazon.com/events/reinvent/) · [Black Hat Europe](https://www.blackhat.com/europe/) · [CES](https://www.ces.tech/) · [RSAC Conference](https://www.rsaconference.com/usa) · [Gartner Cybersecurity & Risk Management Summit](https://www.gartner.com/en/conferences/na/security-risk-management-us) · [AWS Summit Washington, DC](https://aws.amazon.com/events/summits/washington-dc/)
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
