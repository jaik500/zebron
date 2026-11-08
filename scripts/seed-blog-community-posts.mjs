/**
 * Publish five Zebron Blog posts (public section), each with a cover picture:
 *
 *   Sports           from the new RFK stadium to your local rec center
 *   Food             keeping food on the table as SNAP rules change
 *   Education        Workforce Pell: federal grants for short training programs
 *   Jobs             the DMV job market after the federal cuts
 *   Infrastructure   the Purple Line, the RFK campus and the jobs behind them
 *
 * Writes blogPosts/{postId}. Facts checked in November 2026; sources are
 * listed at the end of each post. Cover pictures are in
 * public/images/blog/ and ship with the site.
 *
 * Usage (from the project root, same credentials as the other seed scripts):
 *   node scripts/seed-blog-community-posts.mjs              # dry run: lists what would be written
 *   node scripts/seed-blog-community-posts.mjs --apply      # publish posts that do not exist yet
 *   node scripts/seed-blog-community-posts.mjs --apply --draft
 *        # save them as drafts instead, to review in Blog → Manage first
 *   node scripts/seed-blog-community-posts.mjs --apply --overwrite
 *        # replace posts this script created before (comments, reactions and the
 *        # original publish date are kept)
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
  // SPORTS
  // ------------------------------------------------------------------
  {
    id: "sports-in-the-dmv-rfk-to-rec-center",
    title: "Get in the game: sports in the DMV, from the new RFK to your rec center",
    topic: "Sports",
    cover: "sky",
    coverImage: "/images/blog/sports-in-the-dmv.svg",
    coverImageAlt: "A running track curving past a stadium, with a soccer ball, a basketball and a whistle",
    excerpt:
      "A new stadium is rising on the RFK campus, but the best seat in DMV sports might be on your own neighborhood team. How to play for less, why it matters for your health, and the jobs sports create off the field.",
    content: `
Sports are having a big moment in our region. Work has started on a new home for the Washington Commanders on the old RFK Stadium campus in Northeast DC, the team's home for 35 seasons. But you do not need a ticket to get the most out of sports. The best seat is often on your own neighborhood court, field or pool.

# What is happening at RFK

The Commanders picked three builders for the new stadium: DC-area firms Clark Construction and Smoot Construction, with Minneapolis-based Mortenson. Here is the plan:

| Milestone | Timing |
| --- | --- |
| Site preparation begins | June 2026 |
| Stadium construction starts | Spring 2027 |
| Stadium targeted to open | 2030 |

The stadium is planned for about 65,000 seats on a 180-acre campus. When the deal was announced, the District and the team said they expected around **14,000 construction jobs** and **2,000 permanent jobs**. Those are projections, but they point to real openings in the building trades over the next few years. More on that in our infrastructure post.

# Why playing matters more than watching

Being active is one of the cheapest health boosts there is. The CDC recommends that adults get at least **150 minutes** of moderate activity a week, such as brisk walking, and that children and teens get **60 minutes** a day. A weekly pickup game, a swim or a walking club gets you most of the way there, and it is a great way to meet neighbors.

# How to play for less

Most of the region's best deals are run by your local parks and recreation department:

- **Recreation centers** offer open gym, fitness rooms, pools and classes, often for a small fee or free for residents.
- **Youth and adult leagues** cover soccer, basketball, softball, flag football, pickleball and more, and usually cost far less than private clubs.
- **Fee help is common.** Many departments offer reduced fees or scholarships for families with lower incomes. Ask before you decide a program is too expensive.
- **Schools and libraries** often lend equipment or run free after-school programs.
- **Free outdoors:** trails, tracks and courts are open to everyone. Running and walking groups meet in most neighborhoods.

Look up the parks and recreation department for your area: DC's Department of Parks and Recreation, Montgomery County Recreation, Prince George's County Parks and Recreation, or the Fairfax County Park Authority, for example.

# Careers in sports, off the field

Pro sports are a tiny slice of the jobs. Far more people work as coaches, referees, athletic trainers, physical therapy assistants, recreation leaders, event and venue staff, groundskeepers, and in marketing and ticketing. Many start with a short certificate or a part-time job at a rec center. And the new stadium means years of work for electricians, carpenters, ironworkers and other trades.

# Where Zebron can help

Find youth programs, community centers and recreation resources near you in the [Zebron directory](https://zebron.org/resources?topic=community), and see [Youth programs](https://zebron.org/resources?topic=youth) for kids and teens. Interested in working in sports or construction? Browse [open jobs](https://zebron.org/jobs) and [training programs](https://zebron.org/find/training).

# Sources

- [7News: Commanders reveal who will build their new DC stadium](https://foxbaltimore.com/sports/sports-unlimited/commanders-select-contractor-team-for-new-dc-stadium-clark-smoot-mortenson-contracting-rfk-stadium-washington)
- [The Stadium Business: Commanders agree deal for new RFK stadium](https://www.thestadiumbusiness.com/?p=84324)
- [CDC: Physical activity guidelines for adults](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html)
`,
  },

  // ------------------------------------------------------------------
  // FOOD
  // ------------------------------------------------------------------
  {
    id: "food-on-the-table-snap-changes-dmv",
    title: "Keeping food on the table as SNAP rules change",
    topic: "Food",
    cover: "sunrise",
    coverImage: "/images/blog/food-on-the-table.svg",
    coverImageAlt: "A grocery bag of fresh food beside a bowl of warm soup on a kitchen table",
    excerpt:
      "New federal SNAP rules mean tens of thousands more people in DC, Maryland and Virginia must prove work hours to keep food benefits. Who is affected, how to keep your benefits, and where to find food when money runs short.",
    content: `
SNAP, the program many people still call food stamps, helps tens of millions of Americans buy groceries. Over the past year, a federal law passed in July 2025 (H.R. 1) has changed who has to prove they are working to keep it. If you or someone you care for gets SNAP, here is what changed and how to stay on top of it.

# What changed

SNAP already had a work rule for some adults without children at home: work, train or volunteer about **80 hours a month**, or lose benefits after three months in a three-year period. The new law widened who has to meet it:

- It now applies to adults up to age **64**, not just up to 54.
- Some groups lost their automatic exemption, including **veterans**, **people experiencing homelessness** and **young adults who aged out of foster care**.

# What it means in the DMV

| Where | What officials and advocates reported |
| --- | --- |
| Maryland | About **80,000** people newly face the work rule. March 2026 was the first month people could lose benefits. |
| Washington, DC | A federal waiver ended and DC began enforcing the rule in June 2026. About **21,000** residents, roughly one in eight SNAP customers, need to start working, training or volunteering. |
| Virginia | Virginia's U.S. senators warned that at least **204,000** people could be at risk of losing some benefits. |

Food banks across the region say they expect, and are already seeing, more families at their doors.

# How to keep your benefits

1. **Read every letter from your SNAP office** and note the due date. Update your address and phone number so notices reach you.
2. **Count every hour.** Paid work, volunteering, job training and some school programs can all add up to the 80 hours. Keep pay stubs or a simple log signed by the place you volunteer.
3. **Ask about exemptions.** People who are pregnant, caring for a young child, or unable to work because of a health condition may not have to meet the rule. Ask your caseworker what counts and what proof they need.
4. **Use free training programs.** SNAP Employment and Training programs can count toward your hours and build skills at the same time. DC, for example, created a volunteer option to make the hours easier to reach.
5. **If you lose benefits, ask how to get them back.** Meeting the requirement again or showing an exemption can restore them.

# Other ways to keep food on the table

- **Food banks and pantries:** the Capital Area Food Bank, the Maryland Food Bank and Virginia's regional food banks supply hundreds of local pantries, many with evening and weekend hours.
- **WIC** helps pregnant people, new parents and children under five with healthy food. It has its own rules, separate from SNAP.
- **School meals:** many schools offer free breakfast and lunch to every student, and summer meal sites open when school is out.
- **Stretch your budget:** plan meals around what is on sale, buy store brands, cook beans, rice and frozen vegetables in bulk, and freeze leftovers.

# Where Zebron can help

Find food pantries, meal programs and benefits help near you in [Food resources on Zebron](https://zebron.org/resources?topic=food). Need hours to meet the work rule? Look at [job openings](https://zebron.org/jobs), [training programs](https://zebron.org/find/training) and [community organizations](https://zebron.org/resources?topic=community) that take volunteers.

*This article is general information. SNAP rules vary by state, so confirm details with your local SNAP office.*

# Sources

- [Maryland Matters: New work requirements could kick thousands off SNAP](https://marylandmatters.org/2026/02/09/new-work-requirements-could-kick-thousands-off-snap-starting-next-month/)
- [WTOP: Maryland, DC urge SNAP recipients to update their eligibility](https://wtop.com/local/2026/03/maryland-dc-urge-snap-recipients-to-update-their-eligibility-under-new-work-requirements)
- [WTOP: Federal rule prompts change to DC's SNAP program](https://wtop.com/dc/2026/05/federal-rule-prompts-change-to-dcs-snap-program/)
- [The Lab @ DC: Helping residents keep their food benefits](https://thelabprojects.dc.gov/food-benefits-change)
- [Patch: New work requirements for SNAP in Virginia](https://www.patch.com/virginia/across-va/new-work-requirements-snap-virginia-what-know)
`,
  },

  // ------------------------------------------------------------------
  // EDUCATION
  // ------------------------------------------------------------------
  {
    id: "workforce-pell-grants-short-training-programs",
    title: "Workforce Pell: federal grants now help pay for short training programs",
    topic: "Education",
    cover: "teal",
    coverImage: "/images/blog/education-short-programs.svg",
    coverImageAlt: "A graduation cap on a stack of books beside a laptop showing a certificate",
    excerpt:
      "Since July 2026, Pell Grants can pay for approved training programs as short as eight weeks. What qualifies, how to tell a strong program from a weak one, and how to apply.",
    content: `
For 50 years, Pell Grants, the federal money for college that you do not pay back, only covered longer programs: degrees and certificates of at least 15 weeks. That left out many of the fastest routes into a good job. As of **July 1, 2026**, that changed.

# What Workforce Pell covers

The same federal law passed in July 2025 created **Workforce Pell**. It lets eligible students use a Pell Grant for short job-training programs that:

- run between **150 and 599 clock hours**, or about **8 to 15 weeks**,
- lead to a credential employers recognize, in a field the state says is in demand,
- have been running for **at least a year**, and
- show strong results: at least 70% of students finish, and at least 70% find work.

Think of programs such as IT support, cybersecurity basics, medical assisting, phlebotomy, welding, HVAC or commercial driving. Each program must be approved by the state and by the U.S. Department of Education, so **not every short course or bootcamp qualifies**.

The maximum regular Pell Grant for the 2026–27 school year is **$7,395**. The amount you can get depends on your finances and on the length and cost of the program.

# How to apply

1. **Fill in the FAFSA** at studentaid.gov. It is free, and it is the application for Pell Grants of every kind.
2. **Ask the program directly:** "Are you approved for Workforce Pell?" Community colleges are often first in line.
3. **Look at the full cost.** Ask what the grant covers and what you would still owe for books, tools, exams or fees.

# How to pick a strong program

Even with a grant, your time is the biggest investment. Before you enroll, ask:

- **Completion:** What share of students finish?
- **Jobs:** What share are working in the field within six months, and at what pay?
- **Credential:** Will you earn an industry certification, such as CompTIA A+ or a state license?
- **Employers:** Which local employers hire graduates? Can you talk to one?
- **Support:** Is there help with job searches, child care or transport?

A program that cannot answer these questions clearly is a red flag, grant or no grant.

# Where Zebron can help

Compare [tech bootcamps](https://zebron.org/bootcamps) and other [training programs](https://zebron.org/find/training) across the DMV, and see [Education resources](https://zebron.org/resources?topic=education) for adult education, GED and English classes. Ready to work? Browse [open jobs](https://zebron.org/jobs).

# Sources

- [AIR: Workforce Pell, expanding access to short-term job training](https://air.org/resource/workforce-pell-expanding-access-short-term-job-training)
- [The College Investor: Workforce Pell final rule locks in July 2026 launch](https://thecollegeinvestor.com/80871/workforce-pell-grant-final-rule-locks-in-july-2026-launch-for-short-term-training-aid/)
- [Federal Student Aid: Fill out the FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa)
`,
  },

  // ------------------------------------------------------------------
  // JOBS
  // ------------------------------------------------------------------
  {
    id: "dmv-job-market-after-federal-cuts",
    title: "The DMV job market after the federal cuts: where to look next",
    topic: "Careers",
    cover: "navy",
    coverImage: "/images/blog/jobs-in-the-dmv.svg",
    coverImageAlt: "A city skyline at sunrise with a briefcase and an arrow climbing upward",
    excerpt:
      "The Washington region lost more jobs than any other U.S. metro last year, most of them federal. If you are one of the people looking for what comes next, here is the picture and a practical plan.",
    content: `
If you work in or around the federal government, the past two years have been hard. Our region has felt the cuts more than anywhere else in the country, and the effects reach well beyond federal offices, to contractors, restaurants and small businesses.

# The numbers

- The Washington metro area lost about **103,900 jobs** between January 2025 and January 2026, the largest drop of any U.S. metro. About **62,100** of them were federal jobs.
- The region's federal workforce fell **16.5%** in a year, to its lowest level since at least 1990.
- Regional unemployment rose from **3.8%** in December 2025 to **4.4%** in January 2026. Washington, DC had the highest unemployment rate of any state-level area in early 2026.

There are early signs of recovery. Federal data suggests the region added jobs again after March 2026, although it still has fewer jobs than at the start of 2025. Internships, an early signal of hiring, have also picked up.

# A plan for your next move

**1. Secure your income first.** If you lost a job, apply for unemployment insurance right away. Former federal employees use a special program (UCFE) run through the state where they last worked. Check your severance and retirement options before making big decisions.

**2. Translate your experience.** Federal resumes are long and full of acronyms. Private employers want one or two pages that lead with results: budgets you managed, people you led, systems you improved. Replace agency jargon with plain words.

**3. Use what makes you valuable.** A security clearance, experience with federal rules, contracting or grants, and program management skills are in demand with contractors, state and local governments, universities, nonprofits and the private sector.

**4. Look beyond your old lane.** Health care, education, the building trades and technology all hire across the region. A short training program can bridge a gap. Since July 2026, Pell Grants can help pay for some approved programs as short as eight weeks.

**5. Network on purpose.** Most jobs are filled through someone who knows someone. Tell former colleagues what you are looking for, go to industry meetups, and ask for 20-minute conversations, not jobs.

**6. Take care of yourself.** Job loss is stressful. Keep a routine, stay active, and use free counseling or support groups if you need them.

# Where Zebron can help

Browse [open jobs](https://zebron.org/jobs) across the DMV, compare [tech bootcamps](https://zebron.org/bootcamps) and [training programs](https://zebron.org/find/training), and find [Jobs and Income resources](https://zebron.org/resources?topic=jobs) such as career centers and financial help.

# Sources

- [FFXnow: D.C. region has its fewest federal workers in at least 36 years](https://www.ffxnow.com/2026/04/28/report-d-c-region-has-its-fewest-federal-workers-in-at-least-36-years/)
- [Patch: DC region lost 62K federal jobs in a year (COG report)](https://patch.com/virginia/mclean/dc-region-lost-62-100-federal-jobs-year-cog-report-finds)
- [City Cast DC: D.C. and Arlington lead the nation in job losses](https://dc.citycast.fm/business-development/dc-arlington-job-loss)
- [Washington Informer: D.C. records the nation's highest unemployment rate](https://www.washingtoninformer.com/tag/nina-mast/)
- [U.S. Department of Labor: Unemployment insurance](https://www.dol.gov/general/topic/unemployment-insurance)
`,
  },

  // ------------------------------------------------------------------
  // INFRASTRUCTURE
  // ------------------------------------------------------------------
  {
    id: "building-the-dmv-purple-line-rfk-jobs",
    title: "Building the DMV: the Purple Line, the new RFK and the jobs behind them",
    topic: "Infrastructure",
    cover: "violet",
    coverImage: "/images/blog/infrastructure-purple-line.svg",
    coverImageAlt: "A purple light rail train crossing a bridge past a construction crane",
    excerpt:
      "The Purple Line is 92% built and the RFK campus is being cleared for a new stadium. What these projects mean for your commute and your neighborhood, and how to get one of the jobs building them.",
    content: `
Two of the biggest construction projects in our region are moving at the same time: Maryland's **Purple Line** light rail and the redevelopment of the **RFK Stadium campus** in DC. Together they will change how thousands of people get around and where new homes and jobs go.

# The Purple Line: almost there

The Purple Line is a **16-mile light rail line with 21 stations**, running between Bethesda in Montgomery County and New Carrollton in Prince George's County. It will be the region's first rail line that links suburbs directly, without a trip into downtown DC. Riders will be able to connect to Metro's Red, Green and Orange lines and to MARC and Amtrak trains.

The line has been delayed many times, but in October 2026 officials said construction was **92% complete**. The official opening date in the contract is **December 30, 2027**, but officials call it "dynamic": the real date depends on safety testing, and a county council member asked whether April 2028 is more realistic.

When it opens, it should make trips such as Silver Spring to the University of Maryland, or Bethesda to New Carrollton, much faster than today's buses or driving in rush hour.

# The RFK campus: a new neighborhood

On the old RFK Stadium site along the Anacostia River, site preparation began in June 2026. Construction of a new stadium for the Washington Commanders is expected to start in spring 2027, with opening targeted for 2030. The wider 180-acre campus is planned to include more than a stadium over time, with homes, shops and open space along the river.

# What it means for you

- **Your commute:** expect construction detours near both projects for a while. In the long run, more transit choices can mean less time and money spent driving.
- **Your neighborhood:** new transit and development can raise rents nearby. If you rent close to a new station or the RFK site, learn your tenant rights now.
- **Your voice:** both projects hold public meetings. Showing up is the best way to ask about traffic, parking, safety and affordable housing.

# The jobs behind the projects

Big projects need people with skills that are hard to automate: electricians, carpenters, ironworkers, heavy equipment operators, surveyors, inspectors, project managers and transit operators. Many of these careers start with an **apprenticeship**, where you earn a paycheck while you learn, often with no college debt.

When the RFK stadium deal was announced, the District and the team projected around 14,000 construction jobs. That is years of steady work for people who start training now.

# Where Zebron can help

Find [job openings](https://zebron.org/jobs) and [training programs](https://zebron.org/find/training), including short programs that Pell Grants may now help pay for. If rising rents near new projects worry you, see [Housing](https://zebron.org/resources?topic=housing) and [Legal help](https://zebron.org/resources?topic=legal).

# Sources

- [Maryland Matters: Purple Line opening date is "dynamic," MTA official says (October 2026)](https://marylandmatters.org/2026/10/05/purple-line-opening-date-is-dynamic-mta-official-tells-montgomery-county-panel/)
- [7News: Commanders reveal who will build their new DC stadium](https://foxbaltimore.com/sports/sports-unlimited/commanders-select-contractor-team-for-new-dc-stadium-clark-smoot-mortenson-contracting-rfk-stadium-washington)
- [The Stadium Business: Commanders agree deal for new RFK stadium](https://www.thestadiumbusiness.com/?p=84324)
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

    if (post.excerpt.length > 300) {
      throw new Error(`Excerpt too long for ${post.id}: ${post.excerpt.length} characters (max 300)`);
    }

    // A minute apart, so the feed shows them in the order listed (last one newest).
    // A post that is already published keeps its original date.
    const keptDate = existing.exists ? existing.get("publishedAt") : null;
    const publishedAt = DRAFT ? null : keptDate ?? Timestamp.fromMillis(now - (POSTS.length - 1 - index) * 60_000);

    const data = {
      section: "public",
      organizationId: null,
      title: post.title,
      excerpt: post.excerpt,
      content,
      topic: post.topic,
      cover: post.cover,
      coverImage: post.coverImage,
      coverImageAlt: post.coverImageAlt,
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
