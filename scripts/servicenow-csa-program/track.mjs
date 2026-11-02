/**
 * ServiceNow Certified System Administrator (CSA) exam preparation track:
 * the exam blueprint domains, the objective map, and the courses in order.
 *
 * Objective map: each blueprint area lists the lessons that teach it as
 * { course, topic } (topic = the lesson id = the quiz topic key). The
 * practice exam draws questions per domain from these topics, weighted
 * like the real exam, and the track page shows the coverage.
 *
 * Source: ServiceNow's CSA Mainline Exam Blueprint (updated January 2026):
 * six domains and their weights. The areas under each domain follow the
 * blueprint's topic list; codes (1.1, 1.2, ...) are Zebron's numbering.
 * The blueprint is in the CSA exam item on ServiceNow University: when it
 * changes, update DOMAINS and OBJECTIVES here and re-run the seed with
 * --overwrite.
 */

const PLATFORM = "servicenow-admin-platform";
const CONFIG = "servicenow-admin-configuration";
const DATA = "servicenow-admin-data";
const SECURITY = "servicenow-admin-security";
const ITSM = "servicenow-admin-itsm";
const CATALOG = "servicenow-admin-catalog";
const AUTOMATION = "servicenow-admin-automation";
const INSTANCE = "servicenow-admin-instance";
const READINESS = "servicenow-csa-readiness";

const ref = (course, topic) => ({ course, topic });

export const COURSES = [
  { courseId: PLATFORM, title: "ServiceNow Platform Overview and Navigation" },
  { courseId: CONFIG, title: "Instance Configuration, Forms and Reporting" },
  { courseId: DATA, title: "Tables, Fields and the CMDB" },
  { courseId: SECURITY, title: "Users, Groups, Roles and Access Control" },
  { courseId: ITSM, title: "IT Service Management: Incident, Problem, Change and Knowledge" },
  { courseId: CATALOG, title: "Service Catalog and Self-Service" },
  { courseId: AUTOMATION, title: "Automation: Flow Designer, Notifications and Business Rules" },
  { courseId: INSTANCE, title: "Data Migration, Integrations and Instance Management" },
  { courseId: READINESS, title: "ServiceNow CSA Readiness: Remaining Blueprint Areas" },
];

export const DOMAINS = [
  { code: "1", name: "Platform Overview and Navigation", weight: 7 },
  { code: "2", name: "Instance Configuration", weight: 10 },
  { code: "3", name: "Configuring Applications for Collaboration", weight: 20 },
  { code: "4", name: "Self-Service and Automation", weight: 20 },
  { code: "5", name: "Database Management and Platform Security", weight: 30 },
  { code: "6", name: "Data Migration and Integration", weight: 13 },
];

export const OBJECTIVES = [
  // 1. Platform Overview and Navigation
  { code: "1.1", domain: "1", text: "ServiceNow platform overview", refs: [ref(PLATFORM, "platform")] },
  { code: "1.2", domain: "1", text: "Platform capabilities and services", refs: [ref(PLATFORM, "platform"), ref(INSTANCE, "integrations")] },
  { code: "1.3", domain: "1", text: "The ServiceNow instance", refs: [ref(PLATFORM, "platform"), ref(INSTANCE, "instance")] },
  { code: "1.4", domain: "1", text: "Next Experience unified navigation", refs: [ref(PLATFORM, "navigation"), ref(PLATFORM, "personalization")] },

  // 2. Instance Configuration
  { code: "2.1", domain: "2", text: "Installing applications and plugins", refs: [ref(READINESS, "applications-plugins"), ref(INSTANCE, "instance")] },
  { code: "2.2", domain: "2", text: "Personalizing and customizing the instance", refs: [ref(CONFIG, "branding"), ref(PLATFORM, "personalization")] },
  { code: "2.3", domain: "2", text: "Common user interfaces in the platform", refs: [ref(PLATFORM, "navigation"), ref(CATALOG, "portals")] },

  // 3. Configuring Applications for Collaboration
  { code: "3.1", domain: "3", text: "Lists, filters and tags", refs: [ref(PLATFORM, "lists"), ref(READINESS, "form-tools")] },
  { code: "3.2", domain: "3", text: "List and form anatomy", refs: [ref(PLATFORM, "lists"), ref(PLATFORM, "forms")] },
  { code: "3.3", domain: "3", text: "Form configuration", refs: [ref(CONFIG, "form-design")] },
  { code: "3.4", domain: "3", text: "Form templates and saving options", refs: [ref(READINESS, "form-tools")] },
  { code: "3.5", domain: "3", text: "Advanced form configuration", refs: [ref(CONFIG, "policies"), ref(CONFIG, "form-design")] },
  { code: "3.6", domain: "3", text: "Task management", refs: [ref(READINESS, "task-management"), ref(ITSM, "incident"), ref(ITSM, "sla")] },
  { code: "3.7", domain: "3", text: "Visual Task Boards", refs: [ref(READINESS, "task-management")] },
  { code: "3.8", domain: "3", text: "Reporting, dashboards and Platform Analytics", refs: [ref(CONFIG, "reports"), ref(CONFIG, "dashboards")] },
  { code: "3.9", domain: "3", text: "Notifications", refs: [ref(AUTOMATION, "notifications"), ref(AUTOMATION, "events")] },

  // 4. Self-Service and Automation
  { code: "4.1", domain: "4", text: "Knowledge management", refs: [ref(ITSM, "knowledge")] },
  { code: "4.2", domain: "4", text: "Service Catalog", refs: [ref(CATALOG, "structure"), ref(CATALOG, "items"), ref(CATALOG, "producers"), ref(CATALOG, "fulfilment")] },
  { code: "4.3", domain: "4", text: "Flow Designer and Workflow Studio", refs: [ref(AUTOMATION, "flows"), ref(AUTOMATION, "subflows")] },
  { code: "4.4", domain: "4", text: "Virtual Agent", refs: [ref(CATALOG, "portals")] },

  // 5. Database Management and Platform Security
  { code: "5.1", domain: "5", text: "Data schema", refs: [ref(DATA, "tables"), ref(DATA, "extension"), ref(DATA, "dictionary"), ref(DATA, "relationships")] },
  { code: "5.2", domain: "5", text: "Application and access control", refs: [ref(SECURITY, "users-groups"), ref(SECURITY, "roles"), ref(SECURITY, "acls"), ref(SECURITY, "impersonation")] },
  { code: "5.3", domain: "5", text: "Importing data", refs: [ref(INSTANCE, "imports"), ref(INSTANCE, "transforms")] },
  { code: "5.4", domain: "5", text: "Configuration Management Database (CMDB)", refs: [ref(DATA, "cmdb")] },
  { code: "5.5", domain: "5", text: "Security Center and platform security", refs: [ref(READINESS, "platform-security"), ref(SECURITY, "auditing")] },
  { code: "5.6", domain: "5", text: "Shared responsibility model", refs: [ref(READINESS, "platform-security")] },

  // 6. Data Migration and Integration
  { code: "6.1", domain: "6", text: "UI policies", refs: [ref(CONFIG, "policies")] },
  { code: "6.2", domain: "6", text: "Business rules", refs: [ref(AUTOMATION, "scripts")] },
  { code: "6.3", domain: "6", text: "System update sets", refs: [ref(INSTANCE, "update-sets")] },
  { code: "6.4", domain: "6", text: "Scripting in ServiceNow", refs: [ref(READINESS, "scripting"), ref(AUTOMATION, "scripts")] },
  { code: "6.5", domain: "6", text: "Integrations", refs: [ref(INSTANCE, "integrations")] },
];

/** The real exam has only these question types, so the practice exam uses only these. */
export const QUESTION_TYPES = ["multiple-choice", "multiple-select", "true-false"];

export const CERTIFICATION = {
  id: "servicenow-csa",
  kind: "exam-prep",
  title: "ServiceNow CSA Exam Preparation",
  credentialName: "ServiceNow Certified System Administrator (CSA) Exam Preparation",
  summary: "Nine courses in order, mapped to every area of the CSA exam blueprint, then a full-length practice exam in the real format.",
  description:
    "Prepares you for the ServiceNow Certified System Administrator (CSA) exam. Work through the eight ServiceNow Administrator Program courses and the CSA Readiness course in order: each course's final exam must be passed before the next opens. Every blueprint area is mapped to the lessons that teach it.\n\nThen take the practice exam: 60 multiple choice and multiple select questions in 90 minutes, weighted by the blueprint domains. When you pass it, you are marked ready and can register for the real exam through ServiceNow University.\n\nServiceNow recommends 3–6 months of hands-on platform practice: use a free Personal Developer Instance (developer.servicenow.com) for every lesson.\n\nZebron is not affiliated with or endorsed by ServiceNow. ServiceNow and Certified System Administrator are trademarks of ServiceNow, Inc. The exam is taken through ServiceNow, not on Zebron.",
  preparesFor: ["ServiceNow Certified System Administrator (CSA)"],
  level: "intermediate",
  cover: "teal",
  courses: COURSES,
  vendor: {
    name: "ServiceNow",
    exam: "Certified System Administrator",
    code: "CSA",
    format:
      "Proctored exam: 60 questions (multiple choice or multiple select), 90 minutes, US$300. No prerequisites; 3–6 months of platform practice recommended. Registered and scheduled through ServiceNow University. Kept current with maintenance (delta) exams and a maintenance fee.",
    bookingUrl: "https://learning.servicenow.com",
    objectivesNote:
      "Domains and weights are from ServiceNow's CSA Mainline Exam Blueprint (updated January 2026). Check the blueprint in the CSA exam item on ServiceNow University before you book: it can change with platform releases.",
    disclaimer:
      "Zebron is not affiliated with or endorsed by ServiceNow. ServiceNow and Certified System Administrator are trademarks of ServiceNow, Inc. The practice exam is original Zebron content, not real exam questions.",
  },
  domains: DOMAINS,
  objectives: OBJECTIVES,
  exam: {
    questionCount: 60,
    timeLimitMinutes: 90,
    // ServiceNow does not publish a fixed pass mark; aim well above the commonly reported ~70%.
    passMark: 75,
    maxAttempts: 0,
    cooldownDays: 0,
    questionTypes: QUESTION_TYPES,
  },
  validityYears: 0,
};
