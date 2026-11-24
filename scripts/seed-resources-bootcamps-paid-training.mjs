/**
 * "Hire-train-deploy" programs for the /bootcamps page: companies that hire
 * you, train you for free (often paid), then place you at client companies on
 * a contract, usually for one to two years and often anywhere in the U.S.
 *
 *   - Revature: paid remote training, then 1–2 year client engagements
 *   - FDM Group: FDM-funded training, then at least 2 years as an FDM consultant
 *   - Smoothstack: paid training (training wage), then 2 years of employment
 *
 * Every program says up front what you commit to: how long, whether you must
 * relocate, and to ask whether anything is owed if you leave early. Details
 * were checked on 23 November 2026 on each company's own website (sourceUrl).
 * Where a company doesn't publish something (FDM's pay during training, the
 * training format for FDM and Smoothstack), the listing says so rather than
 * guessing; format is saved as "hybrid" with a note to ask.
 *
 * Not listed (terms not published, or site unavailable): mthree, SkillStorm,
 * Genesis10 Dev10. See scripts/resources-left-out.json.
 *
 * Engine: scripts/lib/seed-resources.mjs. Check docs/RESOURCES-REGISTRY.md first.
 *
 * Usage (from the project root):
 *   node scripts/seed-resources-bootcamps-paid-training.mjs                  # dry run
 *   node scripts/seed-resources-bootcamps-paid-training.mjs --apply --draft  # write as drafts to review first
 *   node scripts/seed-resources-bootcamps-paid-training.mjs --apply          # write, published
 */
import { seedResources, run, NONE, EN } from "./lib/seed-resources.mjs";

const ASK_ABOUT_LEAVING =
  "Before you sign, ask in writing how long you must stay, whether you can be placed anywhere in the U.S., and whether you would owe anything if you leave early.";

const RESOURCES = [
  {
    topic: "bootcamps", type: "program",
    name: "Revature",
    slug: "revature",
    description:
      "Paid training, then a contract placement. Revature hires you as an employee, pays you through 1 to 12 weeks of remote training on a client's technology, then places you at a client company for a 1 to 2 year engagement, working on site anywhere in the U.S. A free, self-paced online course comes first. Tracks include Java full stack, .NET, cloud, big data, cybersecurity, Salesforce and AI. " + ASK_ABOUT_LEAVING,
    website: "https://revature.com/get-hired", email: "hello@revature.com",
    serviceArea: "Nationwide: train remotely, then work on site at client offices (relocation required)",
    eligibility: "No tech degree or experience required (military service can replace degree requirements). Must be legally authorized to work in the U.S. without current or future sponsorship, and open to relocating anywhere in the U.S.",
    howToApply: "Apply online, take the online technical assessment, then interview with a technical recruiter by phone or video.",
    applyUrl: "https://revature.com/apply",
    cost: { free: true, description: "Free training; you're paid while you train" }, languages: EN, online: true, availability: NONE,
    tags: ["paid training", "hire train deploy", "contract placement", "software", "relocation"],
    sourceUrl: "https://revature.com/get-hired",
    programs: [
      {
        id: "paid-training-client-placement",
        title: "Paid training, then client placement",
        field: "software",
        summary:
          "Hired and paid by Revature from day one of training (1 to 12 weeks, remote, on the client's technology stack), then interviewed and selected by a client for a 1 to 2 year engagement on site. Revature says it no longer uses employment contracts but asks for a professional commitment to the program.",
        format: "online", schedule: "full-time", durationWeeks: 12,
        tuition: 0, financing: ["free", "employer"],
        costNote:
          "No tuition: you're a salaried Revature employee while you train. After training: 1 to 2 year client engagements, on site, anywhere in the U.S. " + ASK_ABOUT_LEAVING,
        prerequisites: "No tech degree or experience required; online technical assessment and interview. A free self-paced pre-employment course comes first.",
        requiresDegree: false,
        workAuthorization: "Legally authorized to work in the U.S. without current or future sponsorship.",
        skills: ["Java full stack", ".NET", "Cloud administration", "Big data", "Cybersecurity", "Salesforce", "AI and machine learning"],
        applyUrl: "https://revature.com/apply",
      },
    ],
  },
  {
    topic: "bootcamps", type: "program",
    name: "FDM Group",
    slug: "fdm-group",
    description:
      "Free training, then a contract placement. FDM trains you for 6 to 12 weeks at its cost, then employs you as a consultant on client sites for at least two years. U.S. hubs listed include New York, Texas, Florida, North Carolina, Georgia, Chicago and Boston; relocation support may be available. A Veterans Career Program needs no degree. FDM doesn't publish whether training is paid. " + ASK_ABOUT_LEAVING,
    website: "https://careers.fdmgroup.com/",
    serviceArea: "Nationwide: on-site client assignments (listed hubs include New York, Texas, Florida, North Carolina, Georgia, Chicago and Boston)",
    eligibility: "Bachelor's degree (not required for the Veterans Career Program). Legally authorized to work in the U.S. without employer sponsorship. Able to commit to at least two years with FDM after training.",
    howToApply: "Apply to a practice or the Veterans Career Program on FDM's careers site.",
    applyUrl: "https://careers.fdmgroup.com/",
    cost: { free: true, description: "Free training (funded by FDM)" }, languages: EN, online: false, availability: NONE,
    tags: ["hire train deploy", "contract placement", "graduate program", "veterans", "software"],
    sourceUrl: "https://careers.fdmgroup.com/vacancies/828/software-engineering-practice.html",
    programs: [
      {
        id: "software-engineering-practice",
        title: "Software Engineering Practice",
        field: "software",
        summary:
          "6 to 12 weeks of initial upskilling, then practice-based learning and on-site client work across the application lifecycle. No tech experience needed; you need a degree and at least a two-year commitment.",
        format: "hybrid", schedule: "full-time", durationWeeks: 12,
        tuition: 0, financing: ["free", "employer"],
        costNote:
          "Training is funded by FDM; pay during training isn't published, so ask. Then at least two years as an FDM consultant, on site at client offices. Training format isn't published. " + ASK_ABOUT_LEAVING,
        prerequisites: "Bachelor's degree or higher. No tech experience required.",
        requiresDegree: true,
        workAuthorization: "Legally authorized to work in the U.S. without employer sponsorship.",
        skills: ["Software engineering", "Application lifecycle"],
        applyUrl: "https://careers.fdmgroup.com/vacancies/828/software-engineering-practice.html",
      },
      {
        id: "veterans-career-program",
        title: "Veterans Career Program",
        field: "other",
        summary:
          "For people moving from the armed forces into business and technology consulting, working on client projects in banking and finance, insurance, retail and more. No university degree required.",
        format: "hybrid", schedule: "full-time",
        tuition: 0, financing: ["free", "employer"],
        costNote:
          "Training is funded by FDM; pay during training isn't published, so ask. Then at least two years of full-time employment with FDM. " + ASK_ABOUT_LEAVING,
        prerequisites: "Military service; an interest in business and technology. No degree required.",
        requiresDegree: false,
        workAuthorization: "Legally authorized to work in the U.S. without employer sponsorship.",
        skills: ["Technology consulting", "Business analysis"],
        applyUrl: "https://careers.fdmgroup.com/vacancies/829/veterans-career-program.html",
      },
    ],
  },
  {
    topic: "bootcamps", type: "program",
    name: "Smoothstack",
    slug: "smoothstack",
    description:
      "Paid training, then a contract placement. Smoothstack hires people who already code, pays a training wage with full benefits during 8 to 14 weeks of training, then deploys you to a project with a Fortune 500 client, with two years of employment guaranteed. Client work spans data centers, financial services, insurance, healthcare, semiconductors and telecom (SAP, AWS, Salesforce, ServiceNow). The training format and location aren't published. " + ASK_ABOUT_LEAVING,
    website: "https://smoothstack.com/careers/",
    serviceArea: "Client projects with Fortune 500 companies (locations not published)",
    eligibility: "Existing coding skills and the ability to pick up new languages quickly; you'll take a coding challenge.",
    howToApply: "Apply online and complete the coding challenge.",
    applyUrl: "https://smoothstack.com/resource/apply/",
    cost: { free: true, description: "Free training; paid a training wage" }, languages: EN, online: false, availability: NONE,
    tags: ["paid training", "hire train deploy", "contract placement", "software"],
    sourceUrl: "https://smoothstack.com/careers/",
    programs: [
      {
        id: "entry-level-software-developer",
        title: "Paid training, then client placement",
        field: "software",
        summary:
          "8 to 14 weeks of intensive training with your new team, paid a training wage with full benefits, then deployment to a Fortune 500 client project with two years of employment guaranteed.",
        format: "hybrid", schedule: "full-time", durationWeeks: 14,
        tuition: 0, financing: ["free", "employer"],
        costNote:
          "No tuition: you're paid a training wage with full benefits. Then two years of employment on client projects. Training format and location aren't published, so ask. " + ASK_ABOUT_LEAVING,
        prerequisites: "Existing coding skills; coding challenge.",
        requiresDegree: false,
        skills: ["Software engineering", "SAP", "AWS", "Salesforce", "ServiceNow"],
        applyUrl: "https://smoothstack.com/resource/apply/",
      },
    ],
  },
];

run(seedResources({ resources: RESOURCES, label: "paid-training bootcamps" }));
