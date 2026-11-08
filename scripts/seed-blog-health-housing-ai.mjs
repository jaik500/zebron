/**
 * Publish three Zebron Blog posts (public section):
 *
 *   Health coverage in 2027        what changed and how to stay covered in the DMV
 *   Renting in the DMV             when rent outruns paychecks, and what helps
 *   AI in health and housing       how to stay in charge of decisions about you
 *
 * Writes blogPosts/{postId}. Facts checked in November 2026; sources are
 * listed at the end of each post.
 *
 * Usage (from the project root, same credentials as the other seed scripts):
 *   node scripts/seed-blog-health-housing-ai.mjs              # dry run: lists what would be written
 *   node scripts/seed-blog-health-housing-ai.mjs --apply      # publish posts that do not exist yet
 *   node scripts/seed-blog-health-housing-ai.mjs --apply --draft
 *        # save them as drafts instead, to review in Blog → Manage first
 *   node scripts/seed-blog-health-housing-ai.mjs --apply --overwrite
 *        # replace posts this script created before (comments and reactions are kept)
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const DRAFT = args.has("--draft");
const OVERWRITE = args.has("--overwrite");

const AUTHOR_ID = "zebron-editorial";
const AUTHOR_NAME = "Zebron Editorial Team";

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

const readingMinutes = (text) => Math.max(1, Math.round(text.trim().split(/\s+/).length / 220));

const POSTS = [
  // ------------------------------------------------------------------
  // HEALTH
  // ------------------------------------------------------------------
  {
    id: "health-coverage-2027-what-changed-dmv",
    title: "Health coverage in 2027: what changed, and how to keep yours",
    topic: "Health",
    cover: "sky",
    excerpt:
      "Marketplace premiums are up again, the extra federal help ended, and Medicaid adds work rules on January 1. Here is what it means for you in DC, Maryland and Virginia, plus a checklist to stay covered.",
    content: `
If your health insurance letter looked different this fall, you are not imagining it. Two big changes are landing at the same time: the extra federal help that kept Marketplace plans cheap is gone, and many adults on Medicaid will have new rules to follow starting **January 1, 2027**.

Neither change has to cost you your coverage. Many people who lose insurance in a year like this lose it over paperwork, such as a missed letter or a missed deadline, not because they stopped qualifying. This guide walks through what changed and what to do this month.

# What changed for Marketplace plans

The larger, pandemic-era premium tax credits ended at the end of 2025. Congress did not extend them, so in 2026 many people paid more each month and some dropped their plans. For 2027, insurers raised prices again: KFF reports that benchmark silver premiums are up about 13% on average nationwide.

Two things matter most for your budget:

- **Most people still get a subsidy.** If your household income is between 100% and 400% of the federal poverty level, you can still get help paying your premium. Many people who qualify never check.
- **There is a cliff again.** Above 400% of the poverty level, the subsidy stops completely, so you pay the full price. Older adults with middle incomes are hit hardest, because premiums rise with age.

# Deadlines in the DMV

Open enrollment for 2027 coverage started on **November 1, 2026**. Our area runs its own marketplaces, and the closing dates are not the same:

| Where you live | Marketplace | Open enrollment ends |
| --- | --- | --- |
| Washington, DC | DC Health Link | January 31, 2027 |
| Virginia | Virginia's Insurance Marketplace | January 29, 2027 |
| Maryland | Maryland Health Connection | Check the site for the final date |

Do not wait for the last day. If you want your plan to start on January 1, you usually need to choose it in December. And if you have a big life change later in the year, such as losing a job, moving or having a baby, you can often enroll then through a Special Enrollment Period.

# What changes for Medicaid on January 1, 2027

A federal law passed in July 2025 (often called H.R. 1) adds a new rule for many adults aged 19 to 64 who get Medicaid through the expansion. To keep coverage, they will need to show **80 hours a month** of work, school or job training, community service, or a mix of these. These adults will also renew their coverage **every six months** instead of once a year.

Not everyone has to meet the rule. Exemptions include people who are pregnant, parents and caregivers of young children, and people managing serious health conditions or disabilities, among others. Your state decides how you prove an exemption, so read every letter carefully.

In Maryland, the state says up to **320,000** Medicaid members may be affected, and it began sending letters in September 2026 to people who will need to meet the rule at their 2027 renewal. Virginia mailed its notices in September too.

# Your stay-covered checklist

1. **Update your contact details today.** Log in to DC Health Link, Maryland Health Connection or Cover Virginia and check your address, phone and email. A letter you never receive is the most common way people lose coverage.
2. **Open every letter from your Medicaid office or marketplace.** Put the due date in your phone the day it arrives.
3. **Shop, do not just auto-renew.** Your 2027 plan may cost more, drop your doctor or change its drug list even if the name is the same. Compare at least two plans.
4. **Keep simple records.** If the work rule applies to you, save pay stubs, school schedules or a log of volunteer hours every month.
5. **Ask for an exemption if you think you qualify.** Caring for a child, a health condition or a disability can count. Ask what proof they accept.
6. **Get free help.** Certified navigators and assisters help you compare plans and fill in forms at no cost. They are not salespeople.

# Where Zebron can help

Zebron's directory lists clinics, sliding-scale and free health centers, enrollment help and other services across DC, Maryland and Virginia. Start with [Health Care resources on Zebron](https://zebron.org/resources?topic=health), or search for "enrollment help" in your county.

If you need help meeting the 80-hour rule, the same places that help with jobs can help here. Browse [job openings](https://zebron.org/jobs) and [training programs](https://zebron.org/find/training) near you.

*This article explains general rules and is not legal or insurance advice. Rules and dates can change, so confirm details with your marketplace or Medicaid office.*

# Sources

- [KFF: 9 Things to Watch for the 2027 ACA Open Enrollment Period](https://kff.org/affordable-care-act/9-things-to-watch-for-the-2027-aca-open-enrollment-period/)
- [Maryland Department of Health: New Requirements for Medicaid](https://health.maryland.gov/mmcp/Pages/workrequirements.aspx)
- [Maryland Health Connection: Medicaid Check-In 2027](https://www.marylandhealthconnection.gov/CheckIn)
- [Virginia Medicaid (DMAS): New Federal Requirements](https://www.dmas.virginia.gov/news-updates/new-federal-requirements/)
- [CMS: Medicaid community engagement interim final rule (June 2026)](https://cms.gov/newsroom/fact-sheets/medicaid-community-engagement-requirement-certain-individuals-interim-final-rule-comment-period-cms)
- [Healthcare Insider: Marketplace deadlines for 2027 coverage](https://healthcareinsider.com/faq-health-insurance-marketplace-deadlines-for-2027-coverage)
`,
  },

  // ------------------------------------------------------------------
  // HOUSING
  // ------------------------------------------------------------------
  {
    id: "renting-in-the-dmv-when-rent-outruns-paychecks",
    title: "Renting in the DMV: when rent outruns your paycheck",
    topic: "Housing",
    cover: "sunrise",
    excerpt:
      "Rents have stopped racing ahead, but paychecks never caught up. Nearly half of renters now spend too much on housing. Here is how to apply smarter, protect yourself and find help before a bill becomes a crisis.",
    content: `
If rent takes a bigger bite out of your paycheck than it used to, the numbers back you up. Rent growth has slowed down across the country, but for most renters that is cold comfort: years of fast increases already happened, and wages never caught up.

# The numbers behind the feeling

Harvard's Joint Center for Housing Studies published its **America's Rental Housing 2026** report in March. A few findings stand out:

- **22.7 million renter households** in the U.S. were cost-burdened in 2024. That means they spent more than 30% of their income on rent and utilities, a record.
- It is no longer just a low-income problem. **Nearly half** of households earning between $45,000 and $74,999 are now cost-burdened.
- In **Maryland**, renters spent about a quarter of their income on housing in 2001. Today it is more than 31%, while real renter incomes grew by only about 4% over the same period.

Virginia looks similar: about **49% of renter households** there were cost-burdened in 2024. In other words, if you feel squeezed, you are in the majority, not the exception.

# Before you sign: apply smarter

Applications cost money and time, so make each one count.

- **Ask for the screening criteria in writing** before you pay a fee. What credit score, income ratio and rental history do they require? If you clearly do not meet them, keep your money.
- **Check your own reports first.** Get your free credit reports and look for errors, old debts or an eviction filing that was dismissed but still shows. Disputing a mistake before you apply is far easier than after.
- **Bring proof that tells your story.** A letter from a past landlord, 12 months of on-time rent receipts, or your housing voucher paperwork can outweigh a thin credit file.
- **If you are denied, ask why.** When a landlord turns you down because of a screening report, federal law says they must tell you which company provided it. You can then get a free copy and dispute anything wrong.

# If you are falling behind

The worst move is silence. Most help programs can do much more before an eviction case is filed than after.

1. **Talk to your landlord early.** A short payment plan in writing is often cheaper for both of you than court.
2. **Apply for emergency rental help.** Counties and cities across DC, Maryland and Virginia run rent and utility assistance. Funding opens and closes, so apply as soon as you know you will be short.
3. **Get free legal advice if you receive court papers.** Do not ignore a court date. Showing up, ideally with help from legal aid, gives you the best chance to keep your home or get more time.
4. **Cut the other bills first.** Utility companies and many lenders offer hardship plans. Freeing up $100 a month elsewhere can protect your rent.
5. **Talk to a housing counselor.** HUD-approved housing counselors give free advice on renting, budgeting, avoiding eviction and buying a first home.

# Thinking longer term

Housing costs are the biggest lever in most budgets. If you are planning a move, compare total cost, not just rent: a cheaper apartment with a long, expensive commute may not save anything. And if you are ready to raise your income, short training programs and bootcamps can lead to better-paying jobs in a few months.

# Where Zebron can help

Zebron's directory gathers housing help across the DMV: rent and utility assistance, shelters, housing counseling and tenant legal aid. Start with [Housing resources on Zebron](https://zebron.org/resources?topic=housing), and see [Legal help](https://zebron.org/resources?topic=legal) if you have received court papers.

Working on your income too? Browse [open jobs](https://zebron.org/jobs) and [tech bootcamps](https://zebron.org/bootcamps).

*This article is general information, not legal advice. Tenant rights differ by state and county, so check with legal aid or a housing counselor about your situation.*

# Sources

- [Citybiz: Harvard JCHS America's Rental Housing 2026, Maryland findings](https://www.citybiz.co/?p=833133)
- [USAFacts: How many households in Virginia spend too much on housing?](https://usafacts.org/answers/how-many-households-in-the-united-states-spend-too-much-on-housing/state/virginia)
- [Consumer Financial Protection Bureau: Tenant screening reports](https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/)
- [HUD: Find a housing counselor](https://www.hud.gov/findacounselor)
`,
  },

  // ------------------------------------------------------------------
  // AI
  // ------------------------------------------------------------------
  {
    id: "ai-health-housing-stay-in-charge",
    title: "AI now helps decide your apartment and your care. Here is how to stay in charge",
    topic: "AI",
    cover: "violet",
    excerpt:
      "Algorithms already score rental applications and help process insurance claims. AI chatbots can also work for you. A practical guide to your rights, smart ways to use AI, and what never to paste into a chatbot.",
    content: `
Artificial intelligence is no longer something that happens in a lab. It is quietly part of two of the biggest decisions in your life: where you live and how you get care. Landlords use automated scores to screen applicants. Insurers and health systems use software to sort claims and paperwork. At the same time, free AI assistants can help you read a confusing letter in seconds.

The goal is not to fear AI or to trust it blindly. It is to know when it is being used **on** you, and how to use it **for** you.

# When AI is used on you: renting

Many landlords now buy a tenant screening report that ends in a single score or a simple "accept" or "decline". The landlord may never look past it.

That is what happened to Mary Louis, a security guard in Massachusetts. She had 16 years of good rental history and a housing voucher to help pay the rent, yet a screening score turned her down. The property company told her it did not accept appeals. She and another renter sued, arguing the score unfairly hurt Black and Hispanic applicants who use vouchers. In November 2024 a federal judge approved a settlement of about **$2.3 million**, and the company agreed to stop showing scores for voucher holders for five years.

The lesson for you: **a score is not the final word**, and you have rights.

- If you are denied because of a screening report, the landlord must tell you which company made it.
- You can get a **free copy** of that report and **dispute** anything that is wrong.
- Ask the landlord to look at the full picture: rent receipts, a reference, your voucher. Put the request in writing.

# When AI is used on you: health care

Insurers and providers increasingly use software to check claims, request records and flag treatments that need approval. Used well, that can speed things up. Used badly, it can mean a fast "no".

Your protections still apply, whoever (or whatever) made the first decision:

- **Ask for the denial in writing**, with the reason and the rule they used.
- **Appeal.** Most plans must offer an internal appeal, and if that fails, many people can ask for an independent external review.
- **Ask your doctor's office for help.** A short letter explaining why you need the treatment is often what turns a denial around.

# When AI works for you

AI chat assistants are good at turning dense language into plain words. Some ways to put them to work:

- **Decode a letter.** Paste the text of a Medicaid or insurance notice (with your personal numbers removed) and ask what it is asking you to do and by when.
- **Prepare for an appointment.** Describe your symptoms and ask for a list of questions to bring to your doctor.
- **Compare two plans.** Paste the premium, deductible and out-of-pocket maximum for each and ask which costs less if you see a doctor six times a year.
- **Draft a letter.** Ask for a polite, firm draft disputing an error on a screening report, or appealing a denial. Then edit it in your own words.
- **Make a budget.** List your income and bills and ask where you could free up money for rent.

Example prompts you can copy:

\`\`\`
Explain this letter in plain English. What do I need to do, and by what date?
Then list anything I should double-check with the office.

I was denied an apartment after a tenant screening report.
Write a short, polite letter asking the screening company for a free copy
of my report and explaining that I want to dispute an error.
\`\`\`

# The ground rules

AI can be wrong, and it can sound very sure while being wrong. Keep these rules:

1. **Never paste private numbers.** Remove your Social Security number, Medicaid or member ID, account numbers and date of birth before you share anything.
2. **Check deadlines and rules at the source.** Use the AI to understand a letter, then confirm the date with the agency, your plan or the official website.
3. **Ask it to show its work.** Ask where a rule comes from, and be suspicious of answers with no source.
4. **Do not let it decide for you.** Use it to prepare, then make the call yourself, or with a doctor, counselor or lawyer.

# Where Zebron can help

When you are ready to act, Zebron connects you with real people and services across DC, Maryland and Virginia: [Health Care](https://zebron.org/resources?topic=health), [Housing](https://zebron.org/resources?topic=housing) and [Legal help](https://zebron.org/resources?topic=legal). And if you want to build a career in AI or tech yourself, explore [tech bootcamps](https://zebron.org/bootcamps) near you.

*This article is general information, not legal or medical advice.*

# Sources

- [Fortune: Judge approves SafeRent settlement over renter scoring](https://fortune.com/2024/11/21/renter-scoring-saferent-million-settle-case-algorithm-discriminating-race-income)
- [Cohen Milstein: SafeRent final approval order (November 20, 2024)](https://cohenmilstein.com/wp-content/uploads/2022/05/SafeRent-Final-Approval-Order-11-20-2024.pdf)
- [Consumer Financial Protection Bureau: Credit reports and scores](https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/)
- [HealthCare.gov: Appealing a health plan decision](https://www.healthcare.gov/appeal-insurance-company-decision/)
`,
  },
];

async function main() {
  console.log(`${APPLY ? "Writing" : "Dry run:"} ${POSTS.length} posts to ${PROJECT_ID} as ${DRAFT ? "drafts" : "published"}\n`);

  const now = Date.now();

  for (const [index, post] of POSTS.entries()) {
    const content = post.content.trim();
    const ref = db.collection("blogPosts").doc(post.id);
    const existing = await ref.get();

    if (existing.exists && !OVERWRITE) {
      console.log(`  skip    ${post.id} (already exists; use --overwrite to replace)`);
      continue;
    }

    // A minute apart, so the feed shows them in the order listed (last one newest).
    const publishedAt = DRAFT ? null : Timestamp.fromMillis(now - (POSTS.length - 1 - index) * 60_000);

    const data = {
      section: "public",
      organizationId: null,
      title: post.title,
      excerpt: post.excerpt,
      content,
      topic: post.topic,
      cover: post.cover,
      pinned: false,
      readingMinutes: readingMinutes(content),
      status: DRAFT ? "draft" : "published",
      reviewNote: null,
      authorId: AUTHOR_ID,
      authorName: AUTHOR_NAME,
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt,
      publishAt: null,
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };

    if (data.excerpt.length > 300) {
      throw new Error(`Excerpt too long for ${post.id}: ${data.excerpt.length} characters (max 300)`);
    }

    console.log(`  ${existing.exists ? "replace" : "create "} ${post.id}  [${post.topic}, ${data.readingMinutes} min read]`);

    if (APPLY) {
      await ref.set(data, { merge: true });
    }
  }

  console.log(APPLY ? "\nDone. Open /blog to see them." : "\nNothing written. Add --apply to publish.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
