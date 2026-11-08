/**
 * Publish the Zebron Blog post "Immigration help you can trust in the DMV",
 * with its 47-second video (original animation, soft original music, on-screen
 * captions of the narration script in scripts/narration/immigration-help-dmv.txt).
 *
 *   video   public/videos/blog/immigration-help-dmv.mp4
 *   poster  public/images/blog/immigration-help-dmv.jpg
 *
 * Facts checked in November 2026; sources are listed at the end of the post.
 *
 * Both files ship with the site, so the post shows them once the site is deployed.
 *
 * Usage (from the project root, same credentials as the other seed scripts):
 *   node scripts/seed-blog-immigration.mjs                     # dry run
 *   node scripts/seed-blog-immigration.mjs --apply             # publish
 *   node scripts/seed-blog-immigration.mjs --apply --pin       # publish and pin it to the top of the blog
 *   node scripts/seed-blog-immigration.mjs --apply --draft     # save as a draft to review first
 *   node scripts/seed-blog-immigration.mjs --apply --overwrite # replace it (comments, reactions and date are kept)
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
  id: "immigration-help-you-can-trust-dmv",
  title: "Immigration help you can trust in DC, Maryland and Virginia",
  topic: "Immigration",
  cover: "teal",
  coverImage: "/images/blog/immigration-help-dmv.jpg",
  coverImageAlt: "Immigration help you can trust: a guide for DC, Maryland and Virginia",
  excerpt:
    "Fees changed again in October, and scams are on the rise. Who can legally help with your case, the warning signs of fraud, and free or low-cost legal help across the DMV, with a short video summary.",
  content: `
Immigration rules and costs have changed often over the past year, and every change brings more people looking for help, and more people trying to take advantage of them. Whether you are applying for a work permit, renewing Temporary Protected Status (TPS), preparing for citizenship or helping a family member, the most important decision is **who** you trust with your case.

![Immigration help you can trust, in under a minute (soft music; every spoken line appears as a caption)](/videos/blog/immigration-help-dmv.mp4 "/images/blog/immigration-help-dmv.jpg")

# Some federal fees went up again

The federal law passed in July 2025 (H.R. 1) created new immigration fees and requires them to rise with inflation every year. The latest increase applies to filings postmarked on or after **October 16, 2026**:

| Fee | Before Oct. 16 | From Oct. 16, 2026 |
| --- | ---: | ---: |
| First work permit (asylum applicants, parolees, TPS) | $560 | $570 |
| TPS application (Form I-821) | $510 | $520 |
| Yearly fee while an asylum case is pending | $102 | $105 |
| Immigration parole fee | $1,020 | $1,050 |

Two things to know:

- These fees are **added to** the regular USCIS filing fees, and they **cannot be waived** or reduced.
- Fees can change, and some have been challenged in court. Always check the official **USCIS fee page** for the amount on the day you file. Sending the wrong amount can get your application rejected.

# Who can give you legal advice

Only two kinds of people may give you legal advice or represent you in an immigration case:

1. **A licensed attorney.** You can check that a lawyer is in good standing with their state bar.
2. **A Justice Department accredited representative** who works for a **recognized nonprofit organization**. You can look up both the person and the organization on the Justice Department's EOIR roster.

A **notario** or **notary public** is not a lawyer in the United States, whatever the sign on the door says. They can witness signatures, but they cannot give immigration advice, choose forms for you or speak for you in court.

# Warning signs of a scam

Be careful if someone:

- asks you to pay with **gift cards, wire transfers or cash apps**,
- **promises** a green card, work permit or a win in court,
- keeps your **original documents** such as your passport,
- will not give you **copies** of everything they file in your name,
- tells you to **lie** on a form or to sign a blank one.

Remember: **USCIS forms are free** to download at uscis.gov, and USCIS will never ask you to pay with gift cards.

# Free and low-cost legal help nearby

Many nonprofits across the region help with work permits, TPS, DACA, asylum, family petitions and citizenship. Most have income limits and waiting lists, so call early. A few to start with:

- **Ayuda** helps low-income immigrants in DC, Maryland and Virginia, with free consultations for many people.
- **Just Neighbors** serves low-income immigrants, asylees and refugees in parts of DC, Maryland and Northern Virginia.
- **CARECEN** supports Latino and immigrant families in the DC area, including citizenship preparation.
- **CASA** offers legal services at several locations in Maryland.
- **Tahirih Justice Center** helps immigrant women and girls fleeing violence.
- **Amica Center for Immigrant Rights** focuses on people in immigration detention in Virginia and Maryland.

Maryland's Office of Immigrant Affairs also keeps a list of free and low-cost legal help by county.

# If you were cheated, report it

- Call the Justice Department's **Fraud and Abuse Prevention Program** at **1-877-388-3840**.
- Report immigration scams to USCIS at **uscis.gov/avoid-scams**.
- If you lost money, you can also report it to your local police and your state attorney general.

Reporting can help you, and it helps stop the same person from hurting others.

# Where Zebron can help

Find immigration legal help, English classes and other services near you in [Legal and Immigration resources on Zebron](https://zebron.org/resources?topic=legal), and see [Education](https://zebron.org/resources?topic=education) for English and citizenship classes.

*This article is general information, not legal advice. Every case is different: talk to a licensed attorney or an accredited representative about yours.*

# Sources

- [Lehigh Valley Immigration Lawyers: USCIS fee increases take effect October 16, 2026](https://www.lehighvalleyimmigrationlawyers.com/blog/uscis-fee-increase-october-16-2026-asylum-ead-tps-parole)
- [Envoy Global: H.R. 1 immigration fees (fee waivers not allowed)](https://www.envoyglobal.com/news-alert/uscis-announces-new-immigration-fees-under-h-r-1/)
- [U.S. Department of Justice (EOIR): Protect yourself from immigration fraud](https://www.justice.gov/eoir/page/file/1480746/dl)
- [U.S. Department of Justice (EOIR): Notario national notice](https://www.justice.gov/eoir/notario-national-notice)
- [Maryland Office of Immigrant Affairs: Immigration resources](https://governor.maryland.gov/immigrant-affairs/immigration-resources)
- [ImmigrationLawHelp.org: Just Neighbors](https://www.immigrationlawhelp.org/organization.615305-Just_Neighbors)
- [Ayuda: Immigration legal services](https://ayuda.com/?p=9692)
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
