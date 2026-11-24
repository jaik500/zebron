/**
 * Tech bootcamps for the /bootcamps page: Washington, DC area programs, each
 * listing a resource in the Tech Bootcamps category plus its programs in
 * bootcamps/{resourceId}.
 *
 *   - Washington Tech Solutions (Greenbelt, MD): the three programs whose
 *     page says in person; its other courses are named in the description
 *     (format not published, so add them in Admin → Bootcamps once confirmed)
 *   - Per Scholas National Capital Region (Silver Spring, MD): free IT Support
 *   - Year Up United, National Capital Region: tuition-free with a stipend
 *
 * Every detail was checked on 23 November 2026 on the provider's own website
 * (sourceUrl). Class days and times are not published by Washington Tech
 * Solutions; its programs are saved as part-time with a note to ask.
 *
 * Engine: scripts/lib/seed-resources.mjs (categories, types, locations,
 * duplicate guard, programs). Before adding bootcamps, check
 * docs/RESOURCES-REGISTRY.md. If a bootcamp is already listed (same name or
 * website), it is not added again, but its programs are added when it has none.
 *
 * Usage (from the project root):
 *   node scripts/seed-resources-bootcamps-dmv.mjs                      # dry run
 *   node scripts/seed-resources-bootcamps-dmv.mjs --apply --draft      # write as drafts to review first
 *   node scripts/seed-resources-bootcamps-dmv.mjs --apply              # write, published
 *   node scripts/seed-resources-bootcamps-dmv.mjs --apply --overwrite  # also replace listings and programs with the same slug
 */
import { seedResources, run, hours, NONE, APPOINTMENT, EN, EN_ES } from "./lib/seed-resources.mjs";

const WTS_COURSES = "https://washingtontechsolutions.com/courses/";

const RESOURCES = [
  {
    topic: "bootcamps", type: "place",
    name: "Washington Tech Solutions",
    slug: "washington-tech-solutions",
    description:
      "IT training and consulting company in Greenbelt, Maryland. Bootcamps include a 24-week Cybersecurity Analyst (SOC) Bootcamp and free 6-week Blue Team and Offensive Security courses, taught in person. It also lists Full-Stack (JS/Python/Java, 16 weeks), Google Cloud Foundations (8 weeks, free), Azure Administrator to Architect (12 weeks, free) and AWS Cloud Foundations to Solutions Architect (36 weeks), plus certification prep for CompTIA Security+ and CySA+, CISSP and CCSP workshops, and cloud, Kubernetes and Terraform certifications. Ask the school whether those courses are online or in person.",
    website: "https://washingtontechsolutions.com/", phone: "1-866-648-1152", email: "info@washingtontechsolutions.com",
    location: { address: "6301 Ivy Ln, Suite 105", city: "Greenbelt", county: "Prince George's County", state: "MD", zipCode: "20770" },
    serviceArea: "Washington, DC area",
    eligibility: "Beginner-level courses; no prerequisites are listed.",
    howToApply: "Use Enroll Now on each course page, or book a consultation on the Contact page. Ask about class days and times, the next start date and payment options.",
    applyUrl: "https://washingtontechsolutions.com/contact/",
    cost: { free: false, description: "Free to $4,000 depending on the course" }, languages: EN, online: false, availability: NONE,
    tags: ["bootcamp", "cybersecurity", "soc analyst", "cloud", "greenbelt"],
    sourceUrl: WTS_COURSES,
    programs: [
      {
        id: "cybersecurity-analyst-soc-bootcamp",
        title: "Cybersecurity Analyst (SOC) Bootcamp",
        field: "cybersecurity",
        summary:
          "Learn how a Security Operations Center works: reading logs, telling real threats from noise, triaging and escalating alerts, and writing incident notes. Hands-on with a SIEM (Splunk or Elastic), Wireshark, Sysmon, and Windows and Linux logs, ending with a SOC investigation capstone. Gives practical grounding if you plan to take CompTIA Security+ afterwards.",
        format: "in-person", schedule: "part-time", durationWeeks: 24, hoursPerWeek: null,
        tuition: 4000, financing: [],
        costNote: "Class days and times aren't published: ask the school, along with financing options.",
        prerequisites: "Beginner level; none listed.",
        requiresDegree: false,
        certifications: [],
        skills: ["SIEM (Splunk or Elastic)", "Wireshark", "Sysmon", "Windows and Linux logs", "Alert triage", "Incident response", "Incident reporting"],
        applyUrl: "https://washingtontechsolutions.com/courses/starting-seo-as-your-home-based-business/",
      },
      {
        id: "blue-team-foundations",
        title: "Blue Team Foundations (NIST/MITRE)",
        field: "cybersecurity",
        summary:
          "Free introduction to defending systems: NIST Cybersecurity Framework basics and control families, common threats and attack paths, hardening Windows and Linux endpoints, and mapping detections with MITRE ATT&CK.",
        format: "in-person", schedule: "part-time", durationWeeks: 6,
        tuition: 0, financing: ["free"],
        costNote: "Class days and times aren't published: ask the school.",
        prerequisites: "Beginner level; none listed.",
        skills: ["NIST CSF", "MITRE ATT&CK", "Endpoint hardening", "Threat basics"],
        applyUrl: "https://washingtontechsolutions.com/courses/blue-team-foundations-nist-mitre/",
      },
      {
        id: "offensive-security-fundamentals",
        title: "Offensive Security Fundamentals",
        field: "cybersecurity",
        summary:
          "Free introduction to ethical hacking: reconnaissance, scanning, basic exploitation, password attacks, common misconfigurations and report writing, with rules of engagement, lab safety and legal boundaries.",
        format: "in-person", schedule: "part-time", durationWeeks: 6,
        tuition: 0, financing: ["free"],
        costNote: "Class days and times aren't published: ask the school.",
        prerequisites: "Beginner level; none listed.",
        skills: ["Reconnaissance", "Scanning", "Exploitation basics", "Penetration test reporting"],
        applyUrl: "https://washingtontechsolutions.com/courses/offensive-security-fundamentals/",
      },
    ],
  },
  {
    topic: "bootcamps", type: "place",
    name: "Per Scholas National Capital Region",
    slug: "per-scholas-national-capital-region",
    description:
      "Nonprofit offering no-cost, full-time tech training in the DC region, with career coaching and job connections after graduation. Learners can apply for a 0% interest loan for personal expenses during the course.",
    website: "https://www.perscholas.org/locations/national-capital-region/", phone: "301-557-9200",
    location: { address: "1400 Spring St, Suite 501", city: "Silver Spring", county: "Montgomery County", state: "MD", zipCode: "20910" },
    serviceArea: "National Capital Region (must live within commuting distance for campus classes)",
    eligibility: "18 or older, high school diploma or equivalent, proof of valid U.S. work authorization, and able to attend full-time for the whole course.",
    howToApply: "Apply online on the course page, or contact admissions.",
    applyUrl: "https://perscholas.org/courses/it-support/it-support-national-capital-region/",
    cost: { free: true, description: "No cost to learners" }, languages: EN, online: false, availability: NONE,
    tags: ["bootcamp", "free training", "it support", "comptia a+", "silver spring"],
    sourceUrl: "https://perscholas.org/courses/it-support/it-support-national-capital-region/",
    programs: [
      {
        id: "ai-enabled-it-support",
        title: "AI-Enabled IT Support",
        field: "it-support",
        summary:
          "Full-time, no-cost IT Support training that prepares you for the CompTIA A+ certification and the Google IT Support Professional Certificate. Offered in person in Silver Spring, with a remote option.",
        format: "in-person", schedule: "full-time", durationWeeks: 15,
        tuition: 0, financing: ["free"],
        costNote: "No tuition. A 0% interest loan for personal expenses is available while you train.",
        prerequisites: "18 or older; high school diploma or equivalent; able to attend full-time.",
        workAuthorization: "Proof of valid U.S. work authorization.",
        certifications: ["CompTIA A+", "Google IT Support Professional Certificate"],
        skills: ["Hardware and operating systems", "Troubleshooting", "Networking basics", "AI tools for IT support"],
        applyUrl: "https://perscholas.org/courses/it-support/it-support-national-capital-region/",
      },
    ],
  },
  {
    topic: "bootcamps", type: "program",
    name: "Year Up United (National Capital Region)",
    slug: "year-up-united-national-capital-region",
    description:
      "Tuition-free job training for young adults in the Washington, DC area, with an educational stipend and an internship with a corporate partner. Hybrid: in person 3 to 4 days a week during training.",
    website: "https://www.yearup.org/locations/national-capital-region",
    serviceArea: "Washington, DC metro area (must live within commuting distance)",
    eligibility: "18 to 29 years old, high school diploma or GED, no bachelor's degree, low to moderate income, available Monday to Friday for the whole program, and authorized to work in the U.S. for its full length.",
    howToApply: "Choose a training path on the website and apply online. Questions about eligibility: admissions@yearupunited.org.",
    applyUrl: "https://www.yearup.org/students/how-it-works",
    cost: { free: true, description: "Tuition-free, with an educational stipend" }, languages: EN, online: false, availability: NONE,
    tags: ["bootcamp", "free training", "stipend", "internship", "young adults"],
    sourceUrl: "https://www.yearup.org/students/how-it-works",
    programs: [
      {
        id: "it-support",
        title: "IT Support",
        field: "it-support",
        summary:
          "Skills-first IT training followed by an internship, with an educational stipend paid throughout. About a year in all.",
        format: "hybrid", schedule: "full-time",
        tuition: 0, financing: ["free"],
        costNote: "Tuition-free; students earn an educational stipend, paid every two weeks, that rises during the internship.",
        prerequisites: "18 to 29; high school diploma or GED; no bachelor's degree; low to moderate income; available Monday to Friday.",
        workAuthorization: "Authorized to work in the U.S. for the full duration of the program.",
        skills: ["Computer systems", "Technical support", "Professional skills"],
        applyUrl: "https://www.yearup.org/students/how-it-works",
      },
      {
        id: "data-analytics",
        title: "Data Analytics",
        field: "data",
        summary:
          "Data analytics training (database management, AI for data analytics, computer systems fundamentals) followed by an internship, with an educational stipend. About a year in all.",
        format: "hybrid", schedule: "full-time",
        tuition: 0, financing: ["free"],
        costNote: "Tuition-free; students earn an educational stipend.",
        prerequisites: "18 to 29; high school diploma or GED; no bachelor's degree; low to moderate income; available Monday to Friday.",
        workAuthorization: "Authorized to work in the U.S. for the full duration of the program.",
        skills: ["Database management", "AI for data analytics", "Computer systems fundamentals"],
        applyUrl: "https://www.yearup.org/job-training-programs/national-capital-region/data-analytics",
      },
    ],
  },
];

run(seedResources({ resources: RESOURCES, label: "DMV bootcamps" }));
