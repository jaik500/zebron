/**
 * CompTIA Security+ exam preparation track: the official exam domains,
 * the objective map, and the courses in order.
 *
 * Objective map: each objective lists the lessons that teach it as
 * { course, topic } (topic = the lesson id = the quiz topic key). The
 * practice exam draws questions per domain from these topics, weighted
 * like the real exam, and the track page shows the coverage.
 *
 * Version: SY0-801 (launch on or around November 17, 2026). Domain names
 * and weights are SY0-801's as published by CompTIA; objectives follow the
 * published Security+ objective structure plus SY0-801's new AI objective.
 * When the official SY0-801 objectives PDF is available, check every line
 * of OBJECTIVES against it and adjust codes, wording and mappings here.
 */

const FOUNDATIONS = "cybersecurity-foundations";
const NETWORKING = "cybersecurity-networking";
const SYSTEMS = "cybersecurity-systems";
const IDENTITY = "cybersecurity-identity-crypto";
const THREATS = "cybersecurity-threats";
const SECOPS = "cybersecurity-security-operations";
const IR = "cybersecurity-incident-response";
const CLOUD = "cybersecurity-cloud-appsec-grc";
const READINESS = "securityplus-readiness";

const ref = (course, topic) => ({ course, topic });

export const COURSES = [
  { courseId: FOUNDATIONS, title: "Cybersecurity Foundations" },
  { courseId: NETWORKING, title: "Networking for Security" },
  { courseId: SYSTEMS, title: "Linux and Windows Security" },
  { courseId: IDENTITY, title: "Identity, Access and Cryptography" },
  { courseId: THREATS, title: "Threats, Attacks and Vulnerability Management" },
  { courseId: SECOPS, title: "Security Operations and Monitoring" },
  { courseId: IR, title: "Incident Response and Digital Forensics" },
  { courseId: CLOUD, title: "Cloud, Application Security and GRC" },
  { courseId: READINESS, title: "Security+ Readiness: Remaining Exam Objectives" },
];

export const DOMAINS = [
  { code: "1", name: "General Security Concepts", weight: 16 },
  { code: "2", name: "Threats, Vulnerabilities, and Attacks", weight: 24 },
  { code: "3", name: "Security Architecture", weight: 19 },
  { code: "4", name: "Security Operations", weight: 27 },
  { code: "5", name: "Security Program Management and Oversight", weight: 14 },
];

export const OBJECTIVES = [
  // 1. General Security Concepts
  { code: "1.1", domain: "1", text: "Compare and contrast various types of security controls", refs: [ref(FOUNDATIONS, "controls")] },
  { code: "1.2", domain: "1", text: "Summarize fundamental security concepts", refs: [ref(FOUNDATIONS, "cia-triad"), ref(NETWORKING, "design"), ref(READINESS, "physical-deception")] },
  { code: "1.3", domain: "1", text: "Explain the importance of change management processes and the impact to security", refs: [ref(READINESS, "change-management")] },
  { code: "1.4", domain: "1", text: "Explain the importance of using appropriate cryptographic solutions", refs: [ref(IDENTITY, "crypto"), ref(IDENTITY, "pki")] },

  // 2. Threats, Vulnerabilities, and Attacks
  { code: "2.1", domain: "2", text: "Compare and contrast common threat actors and motivations", refs: [ref(THREATS, "actors")] },
  { code: "2.2", domain: "2", text: "Explain common threat vectors and attack surfaces", refs: [ref(THREATS, "social-engineering"), ref(NETWORKING, "protocols")] },
  { code: "2.3", domain: "2", text: "Explain various types of vulnerabilities", refs: [ref(THREATS, "attacks"), ref(CLOUD, "appsec"), ref(READINESS, "architectures")] },
  { code: "2.4", domain: "2", text: "Given a scenario, analyze indicators of malicious activity", refs: [ref(SYSTEMS, "endpoint"), ref(SECOPS, "triage")] },
  { code: "2.5", domain: "2", text: "Explain the purpose of mitigation techniques used to secure the enterprise", refs: [ref(SYSTEMS, "hardening"), ref(IDENTITY, "access-control")] },
  { code: "2.AI", domain: "2", text: "Explain the security risks associated with artificial intelligence (AI) (new in SY0-801)", refs: [ref(READINESS, "ai-risks")] },

  // 3. Security Architecture
  { code: "3.1", domain: "3", text: "Compare and contrast security implications of different architecture models", refs: [ref(CLOUD, "cloud-model"), ref(READINESS, "architectures")] },
  { code: "3.2", domain: "3", text: "Given a scenario, apply security principles to secure enterprise infrastructure", refs: [ref(NETWORKING, "defenses"), ref(NETWORKING, "addressing"), ref(CLOUD, "cloud-security")] },
  { code: "3.3", domain: "3", text: "Compare and contrast concepts and strategies to protect data", refs: [ref(CLOUD, "data-privacy")] },
  { code: "3.4", domain: "3", text: "Explain the importance of resilience and recovery in security architecture", refs: [ref(READINESS, "resilience"), ref(IR, "post-incident")] },

  // 4. Security Operations
  { code: "4.1", domain: "4", text: "Given a scenario, apply common security techniques to computing resources", refs: [ref(SYSTEMS, "hardening")] },
  { code: "4.2", domain: "4", text: "Explain the security implications of proper hardware, software, and data asset management", refs: [ref(READINESS, "assets")] },
  { code: "4.3", domain: "4", text: "Explain various activities associated with vulnerability management", refs: [ref(THREATS, "vuln-management")] },
  { code: "4.4", domain: "4", text: "Explain security alerting and monitoring concepts and tools", refs: [ref(SECOPS, "soc"), ref(SECOPS, "logging"), ref(SECOPS, "siem")] },
  { code: "4.5", domain: "4", text: "Given a scenario, modify enterprise capabilities to enhance security", refs: [ref(NETWORKING, "defenses"), ref(SYSTEMS, "endpoint")] },
  { code: "4.6", domain: "4", text: "Given a scenario, implement and maintain identity and access management", refs: [ref(IDENTITY, "authentication"), ref(IDENTITY, "federation"), ref(SYSTEMS, "linux-permissions"), ref(SYSTEMS, "windows")] },
  { code: "4.7", domain: "4", text: "Explain the importance of automation and orchestration related to secure operations", refs: [ref(READINESS, "automation")] },
  { code: "4.8", domain: "4", text: "Explain appropriate incident response activities", refs: [ref(IR, "lifecycle"), ref(IR, "preparation"), ref(IR, "containment"), ref(SECOPS, "hunting")] },
  { code: "4.9", domain: "4", text: "Given a scenario, use data sources to support an investigation", refs: [ref(IR, "forensics"), ref(SYSTEMS, "linux-basics")] },

  // 5. Security Program Management and Oversight
  { code: "5.1", domain: "5", text: "Summarize elements of effective security governance", refs: [ref(FOUNDATIONS, "frameworks"), ref(CLOUD, "governance")] },
  { code: "5.2", domain: "5", text: "Explain elements of the risk management process", refs: [ref(FOUNDATIONS, "risk")] },
  { code: "5.3", domain: "5", text: "Explain the processes associated with third-party risk assessment and management", refs: [ref(CLOUD, "data-privacy")] },
  { code: "5.4", domain: "5", text: "Summarize elements of effective security compliance", refs: [ref(FOUNDATIONS, "frameworks"), ref(CLOUD, "data-privacy")] },
  { code: "5.5", domain: "5", text: "Explain types and processes associated with audits and assessments", refs: [ref(CLOUD, "governance"), ref(THREATS, "vuln-management")] },
  { code: "5.6", domain: "5", text: "Given a scenario, implement security awareness practices", refs: [ref(THREATS, "social-engineering")] },
];

export const CERTIFICATION = {
  id: "comptia-security-plus",
  kind: "exam-prep",
  title: "CompTIA Security+ Exam Preparation",
  credentialName: "CompTIA Security+ (SY0-801) Exam Preparation",
  summary: "Nine courses in order, mapped to every Security+ exam objective, then a full-length practice exam in the real format.",
  description:
    "Prepares you for the CompTIA Security+ exam (SY0-801). Work through the eight Cybersecurity Program courses and the Security+ Readiness course in order: each course's final exam must be passed before the next opens. Every exam objective is mapped to the lessons that teach it.\n\nThen take the practice exam: up to 90 questions in 90 minutes, weighted by the official domains, with an estimated score on the 100–900 scale (750 to pass). When you pass it, you are marked Exam ready and can book the real exam with CompTIA.\n\nZebron is not affiliated with or endorsed by CompTIA. CompTIA and Security+ are trademarks of CompTIA, Inc. The exam is taken through CompTIA, not on Zebron.",
  preparesFor: ["CompTIA Security+ (SY0-801)"],
  level: "intermediate",
  cover: "sky",
  courses: COURSES,
  vendor: {
    name: "CompTIA",
    exam: "Security+",
    code: "SY0-801",
    format: "Up to 90 questions (multiple choice and performance-based), 90 minutes, passing score 750 on a 100–900 scale.",
    bookingUrl: "https://home.pearsonvue.com/comptia",
    objectivesNote:
      "Domain names and weights are CompTIA's for SY0-801. Objectives follow the published Security+ structure plus the new AI objective; they will be checked against CompTIA's official SY0-801 objectives document.",
    disclaimer: "Zebron is not affiliated with or endorsed by CompTIA. CompTIA and Security+ are trademarks of CompTIA, Inc.",
  },
  domains: DOMAINS,
  objectives: OBJECTIVES,
  exam: {
    questionCount: 90,
    timeLimitMinutes: 90,
    // About 750 on CompTIA's 100–900 scale (100 + 800 × 0.83 ≈ 764). CompTIA's real scaling is not published.
    passMark: 83,
    maxAttempts: 0,
    cooldownDays: 0,
    scale: { min: 100, max: 900, pass: 750 },
  },
  validityYears: 0,
};
