/**
 * Tech bootcamps batch 2 for the /bootcamps page: free or low-cost IT training
 * and tech apprenticeships in Maryland, DC and Virginia.
 *
 *   - NPower Maryland: free virtual Tech Fundamentals, Cybersecurity and Cloud
 *     Computing (the application form lists Cybersecurity and Cloud for MD/DC/VA)
 *   - Montgomery College: free online Cyber Workforce Accelerator (SOC analyst
 *     credential) for Maryland residents who already hold IT certifications
 *   - NOVA Workforce (Northern Virginia Community College): FastForward IT
 *     courses; Virginia residents pay a third of tuition, and need-based aid
 *     can cover that third
 *   - Howard Community College: Maryland's IT Registered Apprenticeship
 *     (2 to 3 years, up to 4,000 hours on the job)
 *   - CareerWise DC: paid 2 to 3 year youth apprenticeships for DC high school
 *     seniors and recent graduates, including IT pathways
 *
 * Every detail was checked on 23 November 2026 on the provider's own website
 * (sourceUrl). Where a provider doesn't publish something (NOVA's prices and
 * class format, Howard CC's apprentice pay, CareerWise DC's wages), the listing
 * says so instead of guessing. NPower's Maryland page shows two different
 * office addresses, so the listing has no street address (classes are virtual).
 *
 * Not listed: Montgomery College TechMAP (closed to applicants), Apprenticeship
 * DC (a sponsor directory, not a program), Maryland Workforce Association
 * cybersecurity apprenticeship (no application page). See
 * scripts/resources-left-out.json.
 *
 * Engine: scripts/lib/seed-resources.mjs. Check docs/RESOURCES-REGISTRY.md first.
 *
 * Usage (from the project root):
 *   node scripts/seed-resources-bootcamps-dmv-2.mjs                  # dry run
 *   node scripts/seed-resources-bootcamps-dmv-2.mjs --apply --draft  # write as drafts to review first
 *   node scripts/seed-resources-bootcamps-dmv-2.mjs --apply          # write, published
 */
import { seedResources, run, NONE, EN } from "./lib/seed-resources.mjs";

const NPOWER_FORM_NOTE = "NPower's application form lists this course for Maryland, DC and Virginia; check the eligibility tool for your area.";
const FASTFORWARD_NOTE =
  "FastForward: if you've lived in Virginia for at least a year (domicile), you pay one third of the tuition; need-based FANTIC or G3 aid can cover that third. If you don't finish, you owe another third back to the Commonwealth. Funding is limited, and the full price isn't shown on the program page, so ask NOVA Workforce.";

const RESOURCES = [
  {
    topic: "bootcamps", type: "program",
    name: "NPower Maryland",
    slug: "npower-maryland",
    description:
      "Nonprofit offering tuition-free, virtual tech training with certifications and job placement support for young adults, veterans and military spouses in Baltimore and Central Maryland. Courses include Tech Fundamentals (up to 20 weeks), Cybersecurity and Cloud Computing (for people with some tech experience). Classes run twice a year and applications are reviewed on a rolling basis.",
    website: "https://www.npower.org/locations/Maryland/", phone: "443-863-7252",
    serviceArea: "Baltimore and Central Maryland; Cybersecurity and Cloud Computing are also listed for DC and Virginia",
    eligibility: "18 or older, high school diploma or equivalent, and legally authorized to work in the U.S. (visa holders who will need sponsorship aren't eligible). Tech Fundamentals: ages 18 to 26, or veterans and military spouses over 21. Cybersecurity and Cloud Computing: 1 to 2 years of tech experience, or NPower graduates.",
    howToApply: "Complete the online pre-screening and application, then attend a virtual open house and interview.",
    applyUrl: "https://www.npower.org/apply/",
    cost: { free: true, description: "Tuition-free" }, languages: EN, online: true, availability: NONE,
    tags: ["bootcamp", "free training", "it support", "cybersecurity", "cloud", "veterans", "young adults"],
    sourceUrl: "https://www.npower.org/apply/",
    programs: [
      {
        id: "tech-fundamentals",
        title: "Tech Fundamentals",
        field: "it-support",
        summary:
          "Instructor-led virtual training in IT basics, plus self-directed coursework, with a chance at a paid internship or a project-based learning experience.",
        format: "online", schedule: "part-time", durationWeeks: 20,
        tuition: 0, financing: ["free"],
        costNote: "Free: you pay nothing to NPower. Class hours aren't published, so ask at the open house.",
        prerequisites: "Ages 18 to 26 with a high school diploma or equivalent, or a veteran or military spouse over 21. First-time NPower students.",
        requiresDegree: false,
        workAuthorization: "Legally authorized to work in the U.S.",
        certifications: ["CompTIA A+", "CompTIA Tech+", "Google IT Support Certificate", "IT Generalist Apprenticeship credential"],
        skills: ["Hardware and operating systems", "Troubleshooting", "Networking basics", "Customer support"],
        applyUrl: "https://www.npower.org/apply/tech-fundamentals/",
      },
      {
        id: "cybersecurity",
        title: "Cybersecurity",
        field: "cybersecurity",
        summary:
          "Free, part-time online course that prepares you for CompTIA Security+ and the Cybersecurity Support Technician credential; NPower says you can be job-ready within 5 months. " + NPOWER_FORM_NOTE,
        format: "online", schedule: "part-time", durationWeeks: 20,
        tuition: 0, financing: ["free"],
        costNote: "Free. For placement you must be willing to pass a background check and drug test.",
        prerequisites: "1 to 2 years of tech experience, or an NPower graduate. Preferred: Tech+, A+, Network+ or Google IT certificate, and strong networking knowledge.",
        requiresDegree: false,
        workAuthorization: "Legally authorized to work in the U.S.",
        certifications: ["CompTIA Security+", "Cybersecurity Support Technician"],
        skills: ["Security fundamentals", "Networking", "Threat detection"],
        applyUrl: "https://www.npower.org/apply/cybersecurity/",
      },
      {
        id: "cloud-computing",
        title: "Cloud Computing",
        field: "cloud",
        summary:
          "Free, part-time virtual course with three online sessions a week, preparing you for AWS Cloud Practitioner and AWS Solutions Architect (Associate). " + NPOWER_FORM_NOTE,
        format: "online", schedule: "part-time", durationWeeks: 12,
        tuition: 0, financing: ["free"],
        costNote: "Free. Session length isn't published. For placement you must be willing to pass a background check and drug test.",
        prerequisites: "1 to 2 years of professional tech experience, or an NPower graduate. Preferred: ITF+, A+, Network+ or Google IT certificate, and strong networking knowledge.",
        requiresDegree: false,
        workAuthorization: "Legally authorized to work in the U.S.",
        certifications: ["AWS Certified Cloud Practitioner", "AWS Certified Solutions Architect – Associate"],
        skills: ["AWS", "Cloud architecture", "Networking"],
        applyUrl: "https://www.npower.org/apply/cloud-computing/",
      },
    ],
  },
  {
    topic: "bootcamps", type: "place",
    name: "Montgomery College Cyber Workforce Accelerator",
    slug: "montgomery-college-cyber-workforce-accelerator",
    description:
      "Grant-funded, no-cost online program at Montgomery College that fast-tracks people with IT certifications into Security Operations Center (SOC) jobs: 40 hours of self-paced training, 8 hours on a cyber range, then the SOC Operations Analyst I (SOCOA I) exam. Rolling enrollment all year.",
    website: "https://www.montgomerycollege.edu/academics/programs/cybersecurity/cyber-workforce-accelerator.html",
    phone: "240-567-5000", email: "cybersecuritylab@montgomerycollege.edu",
    location: { address: "20200 Observation Dr", city: "Germantown", county: "Montgomery County", state: "MD", zipCode: "20876" },
    serviceArea: "Maryland residents",
    eligibility: "Maryland resident, 18 or older (or turning 18 within 6 months of the start), U.S. citizen, green card holder or valid U.S. work authorization, no criminal convictions, and seeking IT or cybersecurity work. You also need an associate degree in IT or cybersecurity (earned or in progress) or two of CompTIA A+, Network+ and Security+.",
    howToApply: "Fill in the program interest registration form, linked from the program page.",
    applyUrl: "https://survey.alchemer.com/s3/8390134/CWA-Program-Interest-Registration",
    cost: { free: true, description: "No cost (grant funded)" }, languages: EN, online: true, availability: NONE,
    tags: ["bootcamp", "free training", "cybersecurity", "soc analyst", "community college", "montgomery county"],
    sourceUrl: "https://www.montgomerycollege.edu/academics/programs/cybersecurity/cyber-workforce-accelerator.html",
    programs: [
      {
        id: "cyber-workforce-accelerator",
        title: "Cyber Workforce Accelerator (SOC analyst)",
        field: "cybersecurity",
        summary:
          "48 hours in all: Part I is 40 hours of self-paced online training (enterprise governance, networking, Linux command line, how attacks work); Part II is 8 hours of live, team-based incident response on the BCR Cyber range. Ends with a 100-question, 90-minute exam for the SOC Operations Analyst I credential, plus a digital badge and certificate.",
        format: "online", schedule: "self-paced",
        tuition: 0, financing: ["free", "grant"],
        costNote: "No cost to participants (grant funded). Rolling enrollment, year-round.",
        prerequisites: "An associate degree in IT or cybersecurity (earned or in progress), or two of CompTIA A+, Network+ and Security+.",
        requiresDegree: false,
        workAuthorization: "U.S. citizen, green card holder or valid U.S. work authorization; Maryland resident; no criminal convictions.",
        certifications: ["SOC Operations Analyst I (SOCOA I)"],
        skills: ["SOC operations", "Linux command line", "Networking", "Incident detection and response"],
        applyUrl: "https://survey.alchemer.com/s3/8390134/CWA-Program-Interest-Registration",
      },
    ],
  },
  {
    topic: "bootcamps", type: "program",
    name: "NOVA Workforce (Northern Virginia Community College)",
    slug: "nova-workforce-it",
    description:
      "Noncredit, short-term IT training at Northern Virginia Community College through FastForward, Virginia's workforce credential grant: Virginia residents pay one third of tuition, and need-based aid (FANTIC or G3) can cover that third. FastForward IT courses include CompTIA IT Fundamentals, A+, Network+, Security+, Linux+ and Data+, AWS Cloud Practitioner and Solutions Architect, Certified Ethical Hacker and IT Specialist: Python. Offices in Alexandria, Annandale, Loudoun and Woodbridge.",
    website: "https://www.nvcc.edu/workforce/", phone: "703-503-6300", email: "NOVAWorkforceAnswers@nvcc.edu",
    serviceArea: "Northern Virginia (FastForward pricing needs at least a year of Virginia domicile)",
    eligibility: "FastForward pricing: Virginia domicile for at least one year before you apply. Attend all classes and sit for the credential exam. FANTIC and G3 aid also need proof of financial need. Some courses have prerequisites.",
    howToApply: "Register for each course in NOVA Workforce's online catalog; the FastForward agreement and domicile form are part of registration. Apply for FANTIC or G3 at least two weeks before the class starts.",
    applyUrl: "https://nvcc.augusoft.net/",
    cost: { free: false, description: "FastForward: you pay one third of tuition, and aid may cover that" }, languages: EN, online: false, availability: NONE,
    tags: ["bootcamp", "community college", "fastforward", "comptia", "aws", "cybersecurity", "northern virginia"],
    sourceUrl: "https://www.nvcc.edu/workforce/assistance/",
    programs: [
      {
        id: "cloud-computing-basics",
        title: "Cloud Computing Basics (FastForward)",
        field: "cloud",
        summary:
          "Four FastForward courses taken in order: CompTIA Network+ (32 hours), CompTIA Security+ (32 hours), AWS Cloud Practitioner (24 hours) and CompTIA Linux+ (40 hours), 128 hours in all. Register for each course separately.",
        format: "hybrid", schedule: "part-time",
        tuition: null, financing: ["grant"],
        costNote: FASTFORWARD_NOTE + " Class format (online or on campus) isn't published on the program page; check each class listing.",
        prerequisites: "CompTIA A+ certification, or work experience in network support or administration.",
        requiresDegree: false,
        certifications: ["CompTIA Network+", "CompTIA Security+", "AWS Certified Cloud Practitioner", "CompTIA Linux+"],
        skills: ["Networking", "Security", "AWS", "Linux"],
        applyUrl: "https://nvcc.augusoft.net/info/certificate-information/233",
      },
      {
        id: "it-micro-pathway",
        title: "IT Micro-Pathway (CompTIA Tech+ and Network+)",
        field: "it-support",
        summary:
          "Starts with CompTIA Tech+; students who finish it are invited into the micro-pathway: CompTIA Network+ plus three self-paced online workplace skills courses (critical thinking, oral communication, creative problem solving) at no extra cost. Earns digital badges, CEUs and credit for prior learning toward a NOVA Career Studies Certificate or associate degree.",
        format: "hybrid", schedule: "part-time",
        tuition: null, financing: ["grant"],
        costNote: FASTFORWARD_NOTE + " The workplace skills courses are free once you finish Tech+.",
        prerequisites: "None listed for CompTIA Tech+.",
        requiresDegree: false,
        certifications: ["CompTIA Tech+", "CompTIA Network+"],
        skills: ["IT fundamentals", "Networking", "Workplace communication"],
        applyUrl: "https://nvcc.augusoft.net/info/certificate-information/it-micro-pathway",
      },
    ],
  },
  {
    topic: "bootcamps", type: "place",
    name: "Howard Community College IT Apprenticeship",
    slug: "howard-community-college-it-apprenticeship",
    description:
      "State-registered IT apprenticeship run by Howard Community College in Columbia, Maryland: you're hired by an employer partner into an entry-level role and train for 2 to 3 years, with up to 4,000 hours of on-the-job training. Roles: IT field support specialist, network field support specialist, information systems security engineer and Linux system administrator. Openings are limited; applications stay on file until a suitable opening comes up.",
    website: "https://howardcc.edu/programs-courses/academics/apprenticeships/it-apprenticeship/",
    phone: "443-518-1000", email: "Apprentice@HowardCC.edu",
    location: { address: "10901 Little Patuxent Pkwy", city: "Columbia", county: "Howard County", state: "MD", zipCode: "21044" },
    serviceArea: "Central Maryland (Howard County and nearby)",
    eligibility: "18 or older by the start date, U.S. citizen, high school diploma or equivalent (or a dual-enrolled high school senior), driver's license, able to get and keep a federal security clearance, able to lift 50 pounds, and at least one computer technology or STEM course or an active IT certification (CompTIA, AWS, Microsoft, Google or Cisco).",
    howToApply: "High school graduates apply for admission to HCC, then apply to the IT Apprenticeship through the Apprentiscope link on the program page and send the required documents. Current HCC students apply through Apprentiscope directly. Howard County public school students start with their school's apprenticeship coordinator.",
    applyUrl: "https://howardcc.edu/programs-courses/academics/apprenticeships/it-apprenticeship/",
    cost: { free: false, description: "Pay and tuition aren't published; ask the college" }, languages: EN, online: false, availability: NONE,
    tags: ["apprenticeship", "registered apprenticeship", "it support", "cybersecurity", "security clearance", "community college"],
    sourceUrl: "https://howardcc.edu/programs-courses/academics/apprenticeships/it-apprenticeship/",
    programs: [
      {
        id: "it-registered-apprenticeship",
        title: "IT Registered Apprenticeship",
        field: "it-support",
        summary:
          "Work for an employer partner while you learn, for 2 to 3 years and up to 4,000 hours on the job. You interview for one of four roles: IT field support specialist, network field support specialist, information systems security engineer or Linux system administrator.",
        format: "in-person", schedule: "full-time", durationWeeks: 156,
        tuition: null, financing: ["employer"],
        costNote: "Apprentices are hired into jobs, but the page doesn't publish pay or who covers course costs: ask before you accept. Length is 2 to 3 years.",
        prerequisites: "At least one computer technology or STEM course, or an active IT certification; no more than half of the program's courses completed already; screening and employer interview.",
        requiresDegree: false,
        workAuthorization: "U.S. citizen, able to get and keep a federal security clearance.",
        skills: ["IT field support", "Network testing", "Security risk mitigation", "Linux administration"],
        applyUrl: "https://howardcc.edu/programs-courses/academics/apprenticeships/it-apprenticeship/",
      },
    ],
  },
  {
    topic: "bootcamps", type: "program",
    name: "CareerWise DC",
    slug: "careerwise-dc",
    description:
      "Paid youth apprenticeships for DC high school students, run by CityWorks DC: 2 to 3 years of earn-and-learn work with a local employer, earning industry-recognized credentials. Pathways include information technology, business operations, finance and healthcare. Apprentices start as high school seniors or recent graduates; employers hire in the spring for summer or fall starts.",
    website: "https://www.careerwiseusa.org/dc/",
    serviceArea: "Washington, DC",
    eligibility: "DC high school students, starting as seniors or recent high school graduates.",
    howToApply: "Contact the prospective apprentice contact listed on the CareerWise DC page, or ask your school's career staff. Hiring companies take applications in the spring.",
    applyUrl: "https://www.careerwiseusa.org/dc/",
    cost: { free: true, description: "Free; apprentices are paid" }, languages: EN, online: false, availability: NONE,
    tags: ["apprenticeship", "youth apprenticeship", "high school", "paid", "it support", "washington dc"],
    sourceUrl: "https://www.careerwiseusa.org/dc/how-it-works/",
    programs: [
      {
        id: "it-youth-apprenticeship",
        title: "Information Technology youth apprenticeship",
        field: "it-support",
        summary:
          "A paid 2 to 3 year apprenticeship with a DC employer in roles such as IT support technician, cybersecurity support technician, data analyst, database administrator, junior coder or UX/UI designer, earning industry-recognized credentials.",
        format: "in-person", schedule: "part-time", durationWeeks: 156,
        tuition: 0, financing: ["free", "employer"],
        costNote: "Free, and apprentices are paid; wages and weekly hours aren't published, so ask. Length is 2 to 3 years.",
        prerequisites: "DC high school senior or recent high school graduate.",
        requiresDegree: false,
        skills: ["IT support", "Cybersecurity basics", "Data analysis", "Coding", "UX/UI design"],
        applyUrl: "https://www.careerwiseusa.org/dc/",
      },
    ],
  },
];

run(seedResources({ resources: RESOURCES, label: "DMV bootcamps batch 2" }));
