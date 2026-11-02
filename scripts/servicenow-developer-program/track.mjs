/**
 * ServiceNow Certified Application Developer (CAD) exam preparation track:
 * the exam blueprint domains, the objective map, and the courses in order.
 *
 * Source: ServiceNow's official CAD exam blueprint ("Exam Scope", KB0011498):
 * six domains, their weights and the objectives under each, quoted here.
 * ServiceNow notes the sub-skills are not an all-inclusive list.
 * Codes (1.1, 1.2, ...) are Zebron's numbering. The blueprint is on Now
 * Learning / ServiceNow University: when it changes, update DOMAINS and
 * OBJECTIVES here and re-run the seed with --overwrite.
 */

const DESIGN = "servicenow-dev-design";
const UI = "servicenow-dev-ui";
const SECURITY = "servicenow-dev-security";
const AUTOMATION = "servicenow-dev-automation";
const DATA = "servicenow-dev-external-data";
const MANAGING = "servicenow-dev-managing";

const ref = (course, topic) => ({ course, topic });

export const COURSES = [
  { courseId: DESIGN, title: "Designing and Creating an Application" },
  { courseId: UI, title: "Application User Interface" },
  { courseId: SECURITY, title: "Security and Restricting Access" },
  { courseId: AUTOMATION, title: "Application Automation" },
  { courseId: DATA, title: "Working with External Data" },
  { courseId: MANAGING, title: "Managing Applications" },
];

export const DOMAINS = [
  { code: "1", name: "Designing and Creating an Application", weight: 20 },
  { code: "2", name: "Application User Interface", weight: 20 },
  { code: "3", name: "Security and Restricting Access", weight: 20 },
  { code: "4", name: "Application Automation", weight: 20 },
  { code: "5", name: "Working with External Data", weight: 10 },
  { code: "6", name: "Managing Applications", weight: 10 },
];

export const OBJECTIVES = [
  { code: "1.1", domain: "1", text: "Determine if an application is a good fit with ServiceNow", refs: [ref(DESIGN, "fit")] },
  { code: "1.2", domain: "1", text: "Design and implement a data model", refs: [ref(DESIGN, "data-model")] },
  { code: "1.3", domain: "1", text: "Create modules", refs: [ref(DESIGN, "modules")] },
  { code: "1.4", domain: "1", text: "Use Application scope", refs: [ref(DESIGN, "scope"), ref(DESIGN, "create-app")] },

  { code: "2.1", domain: "2", text: "Create, design, and customize forms", refs: [ref(UI, "forms")] },
  { code: "2.2", domain: "2", text: "Add/Remove fields from forms and tables", refs: [ref(UI, "fields")] },
  { code: "2.3", domain: "2", text: "Write, test, and debug client-side scripts for desktop", refs: [ref(UI, "client-scripts")] },
  { code: "2.4", domain: "2", text: "Write, test, and debug server-side scripts", refs: [ref(UI, "server-scripts")] },
  { code: "2.5", domain: "2", text: "Use a Record Producer as an application's UI", refs: [ref(UI, "record-producers")] },

  { code: "3.1", domain: "3", text: "Restrict access to applications and application modules", refs: [ref(SECURITY, "app-access")] },
  { code: "3.2", domain: "3", text: "Manually and automatically create, test, and debug Access Controls", refs: [ref(SECURITY, "acls"), ref(SECURITY, "acl-testing")] },
  { code: "3.3", domain: "3", text: "Use GlideSystem methods to script security", refs: [ref(SECURITY, "gs-security")] },
  { code: "3.4", domain: "3", text: "Use Application Scope to protect application artifacts", refs: [ref(SECURITY, "scope-protection")] },

  { code: "4.1", domain: "4", text: "Write, test, and debug Workflow and Flow Designer", refs: [ref(AUTOMATION, "flows"), ref(AUTOMATION, "workflows")] },
  { code: "4.2", domain: "4", text: "Create and use Application Properties", refs: [ref(AUTOMATION, "properties")] },
  { code: "4.3", domain: "4", text: "Create Events, Scheduled Script Executions (Scheduled Jobs), and Utils (application) Script Includes", refs: [ref(AUTOMATION, "events-jobs")] },
  { code: "4.4", domain: "4", text: "Send and receive email", refs: [ref(AUTOMATION, "email")] },
  { code: "4.5", domain: "4", text: "Design and create homepages and reports", refs: [ref(AUTOMATION, "reports")] },

  { code: "5.1", domain: "5", text: "Import data in CSV or Excel format", refs: [ref(DATA, "imports"), ref(DATA, "transforms")] },
  { code: "5.2", domain: "5", text: "Integrate to, including testing and debugging, an external data source using REST", refs: [ref(DATA, "rest-outbound"), ref(DATA, "rest-inbound"), ref(DATA, "integration-debugging")] },

  { code: "6.1", domain: "6", text: "Download and install applications", refs: [ref(MANAGING, "install"), ref(MANAGING, "deployment")] },
  { code: "6.2", domain: "6", text: "Use Delegated Development to manage source code and code review", refs: [ref(MANAGING, "delegated-dev")] },
  { code: "6.3", domain: "6", text: "Use the ServiceNow Git integration to manage source code", refs: [ref(MANAGING, "git")] },
];

/** The real exam has multiple choice and multiple select questions only. */
export const QUESTION_TYPES = ["multiple-choice", "multiple-select", "true-false"];

export const CERTIFICATION = {
  id: "servicenow-cad",
  kind: "exam-prep",
  title: "ServiceNow CAD Exam Preparation",
  credentialName: "ServiceNow Certified Application Developer (CAD) Exam Preparation",
  summary: "Six courses in order, one per CAD blueprint domain and mapped to every objective, then a full-length practice exam in the real format.",
  description:
    "Prepares you for the ServiceNow Certified Application Developer (CAD) exam. Work through the six ServiceNow Application Developer Program courses in order: each course's final exam must be passed before the next opens. Every blueprint objective is mapped to the lessons that teach it. The CAD exam assumes administrator knowledge: the ServiceNow Administrator Program is a good start if you are new to the platform.\n\nThen take the practice exam: 60 multiple choice and multiple select questions in 90 minutes, weighted by the blueprint domains. Aim for 75% or more in every domain: ServiceNow does not publish its cut score. When you pass, you are marked ready and can register for the real exam from your ServiceNow University account.\n\nServiceNow recommends about six months of hands-on application development: build every lesson on a free Personal Developer Instance (developer.servicenow.com).\n\nZebron is not affiliated with or endorsed by ServiceNow. ServiceNow and Certified Application Developer are trademarks of ServiceNow, Inc. The exam is taken through ServiceNow, not on Zebron.",
  preparesFor: ["ServiceNow Certified Application Developer (CAD)"],
  level: "intermediate",
  cover: "violet",
  courses: COURSES,
  vendor: {
    name: "ServiceNow",
    exam: "Certified Application Developer",
    code: "CAD",
    format:
      "Proctored exam: 60 questions (multiple choice or multiple select), 90 minutes, US$300 (retake US$150). No prerequisites; about six months of hands-on development recommended. Start registration from your ServiceNow University account, which links to the current exam delivery provider; take it at a test centre or online with a remote proctor. Accommodations are available for candidates with a disability or English as a second language. The cut score is not published. Kept current with maintenance (delta) exams and a maintenance fee.",
    bookingUrl: "https://learning.servicenow.com",
    objectivesNote:
      "Domains, weights and objectives are from ServiceNow's official CAD exam blueprint (Exam Scope). ServiceNow notes that the sub-skills are not an all-inclusive list. Check the blueprint on ServiceNow University before you book: it can change.",
    disclaimer:
      "Zebron is not affiliated with or endorsed by ServiceNow. ServiceNow and Certified Application Developer are trademarks of ServiceNow, Inc. The practice exam is original Zebron content, not real exam questions.",
  },
  domains: DOMAINS,
  objectives: OBJECTIVES,
  exam: {
    questionCount: 60,
    timeLimitMinutes: 90,
    passMark: 75,
    maxAttempts: 0,
    cooldownDays: 0,
    questionTypes: QUESTION_TYPES,
  },
  validityYears: 0,
};
