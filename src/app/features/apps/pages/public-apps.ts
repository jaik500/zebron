/**
 * Public-facing Zebron applications shown on /apps (All apps).
 * Add an app here to list it; featureKey ties it to the on/off switch in
 * Admin → Configuration. Text is English; French is in core/i18n/fr/apps.ts.
 */

export interface PublicAppGroup {
  key: string;
  title: string;
  description: string;
  icon: string;
  /** Tailwind classes for the icon chip. */
  tone: string;
}

export interface PublicApp {
  key: string;
  group: string;
  title: string;
  description: string;
  audience: string;
  action: string;
  icon: string;
  route: string;
  /** Feature switch from Admin → Configuration; hidden when switched off. */
  featureKey?: string;
  requiresSignIn: boolean;
  /** Extra words people might search for. */
  keywords: string[];
}

export const PUBLIC_APP_GROUPS: PublicAppGroup[] = [
  { key: "find-help", title: "Find help", description: "Services and programs near you or online.", icon: "volunteer_activism", tone: "bg-teal-50 text-[#007979]" },
  { key: "work-learning", title: "Work and learning", description: "Jobs, training and exam practice.", icon: "school", tone: "bg-sky-50 text-sky-700" },
  { key: "connect", title: "Connect and get support", description: "Talk with others and reach the Zebron team.", icon: "forum", tone: "bg-violet-50 text-violet-700" },
  { key: "tools", title: "Free tools", description: "Quick calculators and helpers.", icon: "calculate", tone: "bg-amber-50 text-amber-700" },
  { key: "organizations", title: "For organizations", description: "Bring your school, nonprofit or company onto Zebron.", icon: "domain", tone: "bg-emerald-50 text-emerald-700" },
  { key: "about", title: "About Zebron", description: "Who we are and how to support the work.", icon: "info", tone: "bg-slate-100 text-slate-600" },
];

export const PUBLIC_APPS: PublicApp[] = [
  {
    key: "resources",
    group: "find-help",
    title: "Resources directory",
    description: "Search services for food, housing, health, legal help, money and more, near you or online.",
    audience: "For anyone looking for help",
    action: "Browse resources",
    icon: "library_books",
    route: "/resources",
    featureKey: "resources",
    requiresSignIn: false,
    keywords: ["services", "help", "food", "housing", "health", "legal"],
  },
  {
    key: "finder",
    group: "find-help",
    title: "Resource Finder",
    description: "Answer a few questions and get matched to resources, jobs and training that fit you.",
    audience: "For anyone not sure where to start",
    action: "Start the finder",
    icon: "travel_explore",
    route: "/find",
    requiresSignIn: false,
    keywords: ["match", "quiz", "guide"],
  },
  {
    key: "submit",
    group: "find-help",
    title: "Submit a resource",
    description: "Know a service that helps people? Suggest it and our team will review it for the directory.",
    audience: "For community members and organizations",
    action: "Suggest a resource",
    icon: "add_location_alt",
    route: "/submit",
    featureKey: "resources",
    requiresSignIn: true,
    keywords: ["suggest", "add", "share"],
  },
  {
    key: "jobs",
    group: "work-learning",
    title: "Job Finder",
    description: "Find job openings and organizations looking for people with your skills.",
    audience: "For job seekers",
    action: "Find jobs",
    icon: "work",
    route: "/find/job",
    requiresSignIn: false,
    keywords: ["employment", "career", "hiring", "work"],
  },
  {
    key: "training",
    group: "work-learning",
    title: "Training Finder",
    description: "Explore bootcamps, courses and programs to build new skills.",
    audience: "For learners and career changers",
    action: "Explore training",
    icon: "school",
    route: "/find/training",
    requiresSignIn: false,
    keywords: ["courses", "bootcamp", "education", "skills"],
  },
  {
    key: "test-center",
    group: "work-learning",
    title: "Test Center",
    description: "Practise with quizzes and practice tests, track your results and get ready for certifications.",
    audience: "For students and professionals",
    action: "Open the Test Center",
    icon: "quiz",
    route: "/test-center",
    featureKey: "test-center",
    requiresSignIn: true,
    keywords: ["exam", "quiz", "certification", "practice", "test"],
  },
  {
    key: "learning-lab",
    group: "work-learning",
    title: "Learning Lab",
    description: "Interactive lessons and learning paths that build on the Test Center.",
    audience: "For learners",
    action: "Open the Learning Lab",
    icon: "science",
    route: "/learning",
    featureKey: "test-center",
    requiresSignIn: false,
    keywords: ["lessons", "learn", "course"],
  },
  {
    key: "knowledge",
    group: "connect",
    title: "Knowledge Center",
    description: "Articles, guides and answers from Zebron on a wide range of topics. Like, share and report articles.",
    audience: "For everyone",
    action: "Read articles",
    icon: "menu_book",
    route: "/knowledge",
    requiresSignIn: false,
    keywords: ["help", "guide", "how to", "faq", "articles", "documentation", "troubleshooting"],
  },
  {
    key: "blog",
    group: "connect",
    title: "Zebron Blog",
    description: "Career advice, skills, employer insights and Zebron news. React to posts and join the conversation.",
    audience: "For everyone",
    action: "Read the blog",
    icon: "article",
    route: "/blog",
    requiresSignIn: false,
    keywords: ["news", "stories", "articles", "posts", "careers", "updates"],
  },
  {
    key: "community",
    group: "connect",
    title: "Community",
    description: "Ask questions, share updates and connect with people and organizations on Zebron.",
    audience: "For everyone on Zebron",
    action: "Join the conversation",
    icon: "groups",
    route: "/community",
    featureKey: "community",
    requiresSignIn: true,
    keywords: ["posts", "chat", "network", "discussion"],
  },
  {
    key: "support",
    group: "connect",
    title: "Help & Support",
    description: "Ask the help assistant, read help articles or open a ticket with the Zebron team.",
    audience: "For anyone who needs a hand",
    action: "Get help",
    icon: "support_agent",
    route: "/support",
    requiresSignIn: false,
    keywords: ["ticket", "assistant", "problem", "question"],
  },
  {
    key: "contact",
    group: "connect",
    title: "Contact us",
    description: "Send a message to the Zebron team about partnerships, feedback or anything else.",
    audience: "For partners, press and the public",
    action: "Send a message",
    icon: "mail",
    route: "/contact",
    requiresSignIn: false,
    keywords: ["email", "message", "partnership"],
  },
  {
    key: "tax-calculator",
    group: "tools",
    title: "Tax & Pay Calculator",
    description: "Estimate your take-home pay after federal, state and local taxes.",
    audience: "For workers and job seekers",
    action: "Calculate my pay",
    icon: "calculate",
    route: "/tax-calculator",
    requiresSignIn: false,
    keywords: ["salary", "paycheck", "income", "tax", "wage"],
  },
  {
    key: "apply",
    group: "organizations",
    title: "Apply as an organization",
    description: "Bring your organization onto Zebron to use Community, Test Center, Knowledge Center and more with your people.",
    audience: "For schools, nonprofits and companies",
    action: "Start an application",
    icon: "domain_add",
    route: "/organizations/apply",
    requiresSignIn: true,
    keywords: ["partner", "school", "nonprofit", "company", "onboarding"],
  },
  {
    key: "partner-portal",
    group: "organizations",
    title: "Partner Portal",
    description: "Members of a partner organization open their dashboard, applications and settings here.",
    audience: "For members of partner organizations",
    action: "Open the Partner Portal",
    icon: "dashboard",
    route: "/partner",
    requiresSignIn: true,
    keywords: ["organization", "dashboard", "members", "partner"],
  },
  {
    key: "about",
    group: "about",
    title: "About Zebron",
    description: "Our mission, our team and how Zebron connects people with opportunity.",
    audience: "For everyone",
    action: "Learn about us",
    icon: "info",
    route: "/about",
    requiresSignIn: false,
    keywords: ["mission", "team"],
  },
  {
    key: "donate",
    group: "about",
    title: "Donate",
    description: "Support free resources, tools and programs for people who need them.",
    audience: "For supporters",
    action: "Make a donation",
    icon: "favorite",
    route: "/donate",
    requiresSignIn: false,
    keywords: ["give", "support", "donation"],
  },
];
