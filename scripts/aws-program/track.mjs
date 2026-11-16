/**
 * AWS exam preparation tracks: the official exam domains, the task-statement
 * map and the course for each certification.
 *
 * Objective map: each task statement lists the course topics that teach it
 * as { course, topic } (topic = the quiz topic key). The practice exam draws
 * questions per domain from these topics, weighted like the real exam, and
 * the track page shows the coverage.
 *
 * Versions: CLF-C02 and AIF-C01, with domain names, weights and task
 * statements as published in AWS's exam guides. Check them against
 * docs.aws.amazon.com/aws-certification when AWS releases a new version.
 */

const CLF = "aws-cloud-practitioner";
const AIF = "aws-ai-practitioner";

const ref = (course, topic) => ({ course, topic });

const AWS_DISCLAIMER =
  "Zebron is not affiliated with or endorsed by Amazon Web Services. AWS and related marks are trademarks of Amazon.com, Inc. or its affiliates.";

// Practice exam: 65 questions in 90 minutes, like the real exams. AWS scores
// 100–1,000 with 700 to pass; its scaling isn't published, so the pass mark
// is set a little above the linear equivalent (100 + 900 × 0.72 ≈ 748).
const AWS_EXAM = {
  questionCount: 65,
  timeLimitMinutes: 90,
  passMark: 72,
  maxAttempts: 0,
  cooldownDays: 0,
  scale: { min: 100, max: 1000, pass: 700 },
};

// ------------------------------------------------------------------
// AWS Certified Cloud Practitioner (CLF-C02)
// ------------------------------------------------------------------

const CLF_DOMAINS = [
  { code: "1", name: "Cloud Concepts", weight: 24 },
  { code: "2", name: "Security and Compliance", weight: 30 },
  { code: "3", name: "Cloud Technology and Services", weight: 34 },
  { code: "4", name: "Billing, Pricing, and Support", weight: 12 },
];

const CLF_OBJECTIVES = [
  { code: "1.1", domain: "1", text: "Define the benefits of the AWS Cloud", refs: [ref(CLF, "benefits")] },
  { code: "1.2", domain: "1", text: "Identify design principles of the AWS Cloud", refs: [ref(CLF, "design-principles")] },
  { code: "1.3", domain: "1", text: "Understand the benefits of and strategies for migration to the AWS Cloud", refs: [ref(CLF, "migration")] },
  { code: "1.4", domain: "1", text: "Understand concepts of cloud economics", refs: [ref(CLF, "economics")] },

  { code: "2.1", domain: "2", text: "Understand the AWS shared responsibility model", refs: [ref(CLF, "shared-responsibility")] },
  { code: "2.2", domain: "2", text: "Understand AWS Cloud security, governance, and compliance concepts", refs: [ref(CLF, "governance-compliance")] },
  { code: "2.3", domain: "2", text: "Identify AWS access management capabilities", refs: [ref(CLF, "access-management")] },
  { code: "2.4", domain: "2", text: "Identify components and resources for security", refs: [ref(CLF, "security-services")] },

  { code: "3.1", domain: "3", text: "Define methods of deploying and operating in the AWS Cloud", refs: [ref(CLF, "deploy-operate")] },
  { code: "3.2", domain: "3", text: "Define the AWS global infrastructure", refs: [ref(CLF, "global-infrastructure")] },
  { code: "3.3", domain: "3", text: "Identify AWS compute services", refs: [ref(CLF, "compute")] },
  { code: "3.4", domain: "3", text: "Identify AWS database services", refs: [ref(CLF, "databases")] },
  { code: "3.5", domain: "3", text: "Identify AWS network services", refs: [ref(CLF, "networking")] },
  { code: "3.6", domain: "3", text: "Identify AWS storage services", refs: [ref(CLF, "storage")] },
  { code: "3.7", domain: "3", text: "Identify AWS artificial intelligence and machine learning (AI/ML) services and analytics services", refs: [ref(CLF, "ai-ml-analytics")] },
  { code: "3.8", domain: "3", text: "Identify services from other in-scope AWS service categories", refs: [ref(CLF, "other-services")] },

  { code: "4.1", domain: "4", text: "Compare AWS pricing models", refs: [ref(CLF, "pricing-models")] },
  { code: "4.2", domain: "4", text: "Understand resources for billing, budget, and cost management", refs: [ref(CLF, "billing-cost")] },
  { code: "4.3", domain: "4", text: "Identify AWS technical resources and AWS Support options", refs: [ref(CLF, "support-resources")] },
];

export const CLF_CERTIFICATION = {
  id: "aws-cloud-practitioner",
  kind: "exam-prep",
  title: "AWS Certified Cloud Practitioner Exam Preparation",
  credentialName: "AWS Certified Cloud Practitioner (CLF-C02) Exam Preparation",
  summary: "One course mapped to every CLF-C02 task statement, then a full-length practice exam in the real format.",
  description:
    "Prepares you for the AWS Certified Cloud Practitioner exam (CLF-C02). Complete the AWS Cloud Practitioner (CLF-C02) Exam Prep course and pass its final exam: every task statement in AWS's exam guide is mapped to the lessons that teach it.\n\nThen take the practice exam: 65 questions in 90 minutes, weighted by the official domains, with an estimated score on the 100–1,000 scale (700 to pass). When you pass it, you are marked Exam ready and can book the real exam with AWS.\n\n" +
    AWS_DISCLAIMER +
    " The exam is taken through AWS, not on Zebron.",
  preparesFor: ["AWS Certified Cloud Practitioner (CLF-C02)"],
  level: "beginner",
  cover: "sunrise",
  courses: [{ courseId: CLF, title: "AWS Cloud Practitioner (CLF-C02) Exam Prep" }],
  vendor: {
    name: "Amazon Web Services",
    exam: "AWS Certified Cloud Practitioner",
    code: "CLF-C02",
    format: "65 questions (50 scored, 15 unscored), multiple choice and multiple response, 90 minutes, passing score 700 on a 100–1,000 scale.",
    bookingUrl: "https://aws.amazon.com/certification/certified-cloud-practitioner/",
    objectivesNote: "Domain names, weights and task statements are AWS's for CLF-C02, from the official exam guide.",
    disclaimer: AWS_DISCLAIMER,
  },
  domains: CLF_DOMAINS,
  objectives: CLF_OBJECTIVES,
  exam: AWS_EXAM,
  validityYears: 0,
};

// ------------------------------------------------------------------
// AWS Certified AI Practitioner (AIF-C01)
// ------------------------------------------------------------------

const AIF_DOMAINS = [
  { code: "1", name: "Fundamentals of AI and ML", weight: 20 },
  { code: "2", name: "Fundamentals of Generative AI", weight: 24 },
  { code: "3", name: "Applications of Foundation Models", weight: 28 },
  { code: "4", name: "Guidelines for Responsible AI", weight: 14 },
  { code: "5", name: "Security, Compliance, and Governance for AI Solutions", weight: 14 },
];

const AIF_OBJECTIVES = [
  { code: "1.1", domain: "1", text: "Explain basic AI concepts and terminologies", refs: [ref(AIF, "ai-concepts")] },
  { code: "1.2", domain: "1", text: "Identify practical use cases for AI", refs: [ref(AIF, "ai-use-cases")] },
  { code: "1.3", domain: "1", text: "Describe the AI/ML development lifecycle", refs: [ref(AIF, "ml-lifecycle")] },

  { code: "2.1", domain: "2", text: "Explain the basic concepts of generative AI (GenAI)", refs: [ref(AIF, "genai-concepts")] },
  { code: "2.2", domain: "2", text: "Understand the capabilities and limitations of GenAI for solving business problems", refs: [ref(AIF, "genai-capabilities")] },
  { code: "2.3", domain: "2", text: "Describe AWS infrastructure and technologies for building GenAI applications", refs: [ref(AIF, "genai-on-aws")] },

  { code: "3.1", domain: "3", text: "Describe design considerations for applications that use foundation models (FMs)", refs: [ref(AIF, "fm-app-design")] },
  { code: "3.2", domain: "3", text: "Choose effective prompt engineering techniques", refs: [ref(AIF, "prompt-engineering")] },
  { code: "3.3", domain: "3", text: "Describe the training and fine-tuning process for FMs", refs: [ref(AIF, "fm-training")] },
  { code: "3.4", domain: "3", text: "Describe methods to evaluate FM performance", refs: [ref(AIF, "fm-evaluation")] },

  { code: "4.1", domain: "4", text: "Explain the development of AI systems that are responsible", refs: [ref(AIF, "responsible-ai")] },
  { code: "4.2", domain: "4", text: "Recognize the importance of transparent and explainable models", refs: [ref(AIF, "transparency")] },

  { code: "5.1", domain: "5", text: "Explain methods to secure AI systems", refs: [ref(AIF, "ai-security")] },
  { code: "5.2", domain: "5", text: "Recognize governance and compliance regulations for AI systems", refs: [ref(AIF, "ai-governance")] },
];

export const AIF_CERTIFICATION = {
  id: "aws-ai-practitioner",
  kind: "exam-prep",
  title: "AWS Certified AI Practitioner Exam Preparation",
  credentialName: "AWS Certified AI Practitioner (AIF-C01) Exam Preparation",
  summary: "One course mapped to every AIF-C01 task statement, then a full-length practice exam in the real format.",
  description:
    "Prepares you for the AWS Certified AI Practitioner exam (AIF-C01). Complete the AWS AI Practitioner (AIF-C01) Exam Prep course and pass its final exam: every task statement in AWS's exam guide is mapped to the lessons that teach it.\n\nThen take the practice exam: 65 questions in 90 minutes, weighted by the official domains, with an estimated score on the 100–1,000 scale (700 to pass). When you pass it, you are marked Exam ready and can book the real exam with AWS.\n\n" +
    AWS_DISCLAIMER +
    " The exam is taken through AWS, not on Zebron.",
  preparesFor: ["AWS Certified AI Practitioner (AIF-C01)"],
  level: "beginner",
  cover: "violet",
  courses: [{ courseId: AIF, title: "AWS AI Practitioner (AIF-C01) Exam Prep" }],
  vendor: {
    name: "Amazon Web Services",
    exam: "AWS Certified AI Practitioner",
    code: "AIF-C01",
    format: "65 questions (50 scored, 15 unscored): multiple choice, multiple response, ordering and matching; 90 minutes; passing score 700 on a 100–1,000 scale.",
    bookingUrl: "https://aws.amazon.com/certification/certified-ai-practitioner/",
    objectivesNote: "Domain names, weights and task statements are AWS's for AIF-C01, from the official exam guide (including its updates for Amazon Quick, Kiro, Strands Agents and Amazon Bedrock AgentCore).",
    disclaimer: AWS_DISCLAIMER,
  },
  domains: AIF_DOMAINS,
  objectives: AIF_OBJECTIVES,
  exam: AWS_EXAM,
  validityYears: 0,
};
