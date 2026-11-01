import { check, mc, ms, num, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 5,
  id: "servicenow-admin-itsm",
  title: "IT Service Management: Incident, Problem, Change and Knowledge",
  summary: "Course 5 of 8 in the Zebron ServiceNow Administrator Program. The core ITSM processes an administrator configures and supports, with SLAs and assignment.",
  description: `
Most ServiceNow customers start with IT Service Management. This course explains how Incident, Problem, Change and Knowledge work in ServiceNow, how priority is calculated, how work is assigned automatically, and how SLAs measure it.

Each lesson ends with a quick check. The final exam is drawn from the **IT Service Management** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "navy",
  outcomes: [
    "Explain the incident lifecycle and how priority is calculated",
    "Distinguish problems, known errors and workarounds",
    "Choose between standard, normal and emergency changes",
    "Manage knowledge bases and the article lifecycle",
    "Configure assignment rules and SLA definitions",
  ],
  skills: ["Incident Management", "Problem Management", "Change Management", "Knowledge Management", "SLAs"],
  quiz: {
    name: "IT Service Management: Incident, Problem, Change and Knowledge",
    slug: "servicenow-admin-itsm",
    description: "Practice questions for Course 5 of the ServiceNow Administrator Program: incident, problem, change, knowledge, assignment and SLAs.",
    tags: ["servicenow", "csa", "itsm"],
  },
  topics: [
    { key: "incident", name: "Incident Management", description: "Lifecycle, states, priority, major incidents." },
    { key: "problem", name: "Problem Management", description: "Root cause, known errors and workarounds." },
    { key: "change", name: "Change Management", description: "Change types, CAB, risk and conflicts." },
    { key: "knowledge", name: "Knowledge Management", description: "Knowledge bases, article lifecycle and feedback." },
    { key: "sla", name: "Assignment and SLAs", description: "Assignment rules, SLA definitions, OLAs and underpinning contracts." },
  ],
  modules: [
    {
      id: "incident-problem",
      title: "Incidents and problems",
      lessons: [
        {
          id: "incident",
          title: "Incident Management",
          minutes: 12,
          blocks: [
            text(`
## What an incident is

An **incident** is an unplanned interruption or reduction in quality of a service, such as "email is down" or "my laptop won't start". The goal of Incident Management is to **restore service as quickly as possible**, not necessarily to find the root cause.

Incidents arrive by phone, email (inbound email actions), the portal, chat, Virtual Agent or monitoring tools (Event Management).

## States

A typical lifecycle: **New → In Progress → On Hold → Resolved → Closed** (or **Canceled**).

- **On Hold** has a reason, such as *Awaiting caller* or *Awaiting vendor*.
- **Resolved** requires a resolution code and notes; the caller can reopen it.
- Resolved incidents **close automatically** after a set number of days (a system property controls how many).

## Priority

**Priority** is calculated from **Impact** (how many people or how critical) and **Urgency** (how fast it must be fixed), using the **priority lookup** (data lookup) rules. High impact plus high urgency gives **Priority 1 – Critical**. Agents set impact and urgency; they do not usually type the priority directly.
`),
            text(`
## Working an incident

1. Log it with the caller, category, configuration item and a clear short description.
2. Check for **known errors** and **knowledge articles** that offer a fix.
3. **Assign** it to the right group (often automatically).
4. Communicate: **Additional comments** are visible to the caller; **Work notes** are internal.
5. Resolve with a resolution code and notes; link related records (problem, change, child incidents).

## Major incidents

A **major incident** is a high-impact incident that needs a coordinated response: a major incident manager, a communication plan and frequent updates. Related incidents from many users can be linked as **child incidents** of one **parent**, so resolving the parent updates them all.
`),
            tip("Write work notes for the next person, not for yourself. \"Restarted service X on server Y at 10:15, issue resolved\" saves someone an hour later."),
            check(
              "What two fields normally determine an incident's priority?",
              ["Impact and urgency", "Category and subcategory", "Caller and location"],
              0,
              "Priority is looked up from impact and urgency.",
            ),
          ],
        },
        {
          id: "problem",
          title: "Problem Management",
          minutes: 11,
          blocks: [
            text(`
## Problems versus incidents

A **problem** is the **underlying cause** of one or more incidents. Incident Management restores service; Problem Management finds and removes the cause so the incidents stop happening.

Example: twenty incidents say "VPN disconnects every hour". One problem record investigates why; the cause turns out to be a timeout setting on the VPN gateway.

## Key ideas

- **Root cause analysis (RCA)**: techniques such as the **5 Whys**, Ishikawa (fishbone) diagrams or timeline analysis.
- **Workaround**: a way to reduce or remove the impact while the cause is being fixed, such as "reconnect using the backup gateway".
- **Known error**: a problem with a documented root cause and/or workaround. In ServiceNow, a problem can be marked as a known error and its workaround shared through a **known error article** in the knowledge base.
- **Fix**: often delivered through a **change request**.
`),
            text(`
## Proactive and reactive

- **Reactive** problem management starts from incidents that already happened (often repeated or major incidents).
- **Proactive** problem management looks for trends and risks before users notice, for example a disk that keeps filling up.

## In ServiceNow

From an incident, use **Create Problem** (or link an existing one). The problem form tracks the problem statement, the CI, the root cause, the workaround and the fix. Related lists show the incidents and changes linked to it. When the fix is in place, the related incidents can be resolved together.
`),
            tip("Ask \"why?\" five times before you accept a root cause. The first answer is usually a symptom."),
            check(
              "A problem with a documented root cause or workaround is called…",
              ["A major incident", "A known error", "A standard change"],
              1,
              "Known errors have a documented cause and/or workaround.",
            ),
          ],
        },
      ],
    },
    {
      id: "change-knowledge-sla",
      title: "Change, knowledge and SLAs",
      lessons: [
        {
          id: "change",
          title: "Change Management",
          minutes: 13,
          blocks: [
            text(`
## Why change management

Most outages are caused by changes. **Change Management** makes sure changes to services and infrastructure are assessed, approved, scheduled and reviewed, so they succeed without surprises.

## Change types

| Type | When | Approval |
| --- | --- | --- |
| **Standard** | Low-risk, repeatable, documented (for example adding a user to a distribution list) | **Pre-approved** through a standard change template |
| **Normal** | Everything else that is planned | Assessed and approved, often by the **Change Advisory Board (CAB)** |
| **Emergency** | Must happen urgently to restore or protect service | Fast-tracked approval, often by an emergency CAB |

The **Standard Change Catalog** lets users request standard changes from approved templates.
`),
            text(`
## A normal change in ServiceNow

States typically run: **New → Assess → Authorize → Scheduled → Implement → Review → Closed**.

Along the way:

- **Risk assessment** questions (and risk conditions) calculate the change's **risk**.
- **Conflict detection** checks the CI against other changes, **maintenance windows** and **blackout windows** at the same time.
- The **change schedule** (calendar) shows planned changes.
- **Implementation**, **backout** and **test plans** are filled in before approval.
- After implementation, the **post-implementation review** records whether it succeeded.

**CAB Workbench** helps change managers run CAB meetings with an agenda of changes to review.
`),
            tip("A good change request answers: what, why, when, who, the risk, how we test it, and how we roll it back if it fails."),
            check(
              "Which change type is pre-approved because it is low-risk and repeatable?",
              ["Standard", "Normal", "Emergency"],
              0,
              "Standard changes use pre-approved templates.",
            ),
          ],
        },
        {
          id: "knowledge",
          title: "Knowledge Management",
          minutes: 10,
          blocks: [
            text(`
## Knowledge bases and articles

**Knowledge Management** captures answers so people can solve problems themselves or faster. Articles live in **knowledge bases**, such as "IT", "HR" or "Customer". Each knowledge base has:

- **Owners and managers** who run it.
- **Can read** and **can contribute** user criteria that control who sees and writes articles.
- A **workflow** for publishing and retiring articles.

Articles can be **HTML** or **wiki** format, organised by **categories**, and can have attachments and images.

## The article lifecycle

**Draft → Review → Published → Retired**

- Authors write drafts; reviewers or knowledge managers approve them for publishing.
- Articles have a **valid to** date; expired articles are flagged for review.
- **Retired** articles are no longer shown to readers but are kept for history.
`),
            text(`
## Keeping knowledge useful

- Readers rate articles and leave **feedback**; **flagged** articles go to the owners as feedback tasks.
- Agents can create an article from a resolved incident (**Create Knowledge** on the form), so fixes become reusable.
- **Known error articles** come from problem records.
- Reports on **views**, **ratings** and **use in incident resolution** show which articles help and which need work.

Knowledge appears in the Service Portal and Employee Center, in agent workspaces as suggestions, and in Virtual Agent conversations.
`),
            tip("Short, task-focused articles with a clear title (\"Reset your VPN password\") get used. Long manuals do not."),
            check(
              "What happens to a retired article?",
              ["It is deleted", "It is hidden from readers but kept", "It is published again"],
              1,
              "Retired articles are no longer shown but remain for history.",
            ),
          ],
        },
        {
          id: "sla",
          title: "Assignment rules and SLAs",
          minutes: 12,
          blocks: [
            text(`
## Automatic assignment

Several ways to route work automatically:

- **Assignment rules** (System Policy → Rules → Assignment): when conditions match (for example *Category is Network*), set the assignment group or user.
- **Assignment data lookups** (Data Lookup Rules): a matrix that maps values such as category and location to a group.
- **Flows** and **business rules** for more complex logic.
- **Predictive Intelligence** (machine learning) can suggest or set the group based on past records.
- The **assignment group of the CI** (support group) is another common source.

Order matters: if several rules match, the rule with the lowest **order** number runs first. Keep rules few and documented.

## Service level agreements

An **SLA definition** measures how long something takes against a target, for example "Priority 1 incidents resolved within 4 hours". It has:

- **Start condition**: when the clock starts (for example *Priority is 1*).
- **Pause condition**: when the clock stops temporarily (for example *State is On Hold – Awaiting caller*).
- **Stop condition**: when the target is met (for example *State is Resolved*).
- **Duration** and a **schedule** (24×7 or business hours).
`),
            text(`
## Task SLAs

When an SLA definition applies to a record, the platform attaches a **Task SLA** record that tracks elapsed time, percentage, and whether it is **In progress**, **Paused**, **Achieved** or **Breached**. Notifications and flows can warn people at, for example, 50% and 75%.

## SLA, OLA, UC

- **SLA** (service level agreement): with the customer.
- **OLA** (operational level agreement): between internal teams.
- **UC** (underpinning contract): with an outside supplier.

All three use the same SLA engine in ServiceNow, with a different **type** on the definition.
`),
            tip("Agree pause conditions carefully. If \"On Hold\" always pauses the SLA, some teams will use it to hide breaches."),
            check(
              "Which SLA condition stops the clock temporarily?",
              ["Start", "Pause", "Stop"],
              1,
              "The pause condition suspends timing until it is no longer true.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Incident ----------------
    mc("incident", "easy", "What is the main goal of Incident Management?", ["Find the root cause", "Restore normal service as quickly as possible", "Approve changes", "Write knowledge articles"], 1, "Incident Management restores service; Problem Management finds causes."),
    mc("incident", "easy", "Which field on an incident is visible to the caller?", ["Work notes", "Additional comments", "Internal notes", "Assignment rules"], 1, "Additional comments are customer-visible; work notes are internal."),
    mc("incident", "medium", "An incident has high impact and high urgency. What priority does it usually get?", ["1 – Critical", "3 – Moderate", "4 – Low", "5 – Planning"], 0, "High impact and high urgency produce Priority 1 in the default priority lookup."),
    tf("incident", "medium", "Resolved incidents can close automatically after a configured number of days.", true, "A system property sets the auto-close period."),
    mc("incident", "medium", "Fifty users report the same outage. What is the best way to manage their incidents?", ["Close them all as duplicates", "Link them as child incidents of one parent incident", "Create fifty problems", "Ignore them until the outage ends"], 1, "Parent-child incidents let you update and resolve them together."),

    // ---------------- Problem ----------------
    mc("problem", "easy", "What is a problem in ITSM?", ["Any user request", "The underlying cause of one or more incidents", "A planned change", "A knowledge article"], 1, "Problems are causes; incidents are the symptoms users report."),
    mc("problem", "medium", "Users can reconnect through a backup gateway while the VPN fault is investigated. This is a…", ["Workaround", "Standard change", "SLA", "Root cause"], 0, "A workaround reduces impact until the cause is fixed."),
    tf("problem", "medium", "Proactive problem management looks for trends and risks before users report incidents.", true, "Reactive starts from incidents; proactive looks ahead."),
    mc("problem", "medium", "Which technique asks \"why?\" repeatedly to reach the root cause?", ["5 Whys", "CAB review", "Impersonation", "Dot-walking"], 0, "The 5 Whys is a simple root cause analysis technique."),
    mc("problem", "medium", "How is the permanent fix for a problem usually delivered?", ["A change request", "A new incident", "A report", "A user preference"], 0, "Fixes are implemented through change management."),

    // ---------------- Change ----------------
    ms("change", "easy", "Which are change types in ServiceNow? Select all that apply.", ["Standard", "Normal", "Emergency", "Optional"], [0, 1, 2], "The three change types are Standard, Normal and Emergency."),
    mc("change", "medium", "What does CAB stand for?", ["Change Advisory Board", "Central Approval Bot", "Configuration Audit Baseline", "Customer Assignment Bureau"], 0, "The Change Advisory Board reviews and advises on changes."),
    mc("change", "medium", "Which feature warns that a change overlaps a blackout window or another change on the same CI?", ["Conflict detection", "Knowledge feedback", "Report source", "View rule"], 0, "Conflict detection checks schedules, maintenance and blackout windows."),
    ord("change", "hard", "Put these normal change states in order.", ["New", "Assess", "Authorize", "Scheduled", "Implement", "Review", "Closed"], "A normal change moves from New through assessment and authorisation to scheduling, implementation, review and closure."),
    tf("change", "medium", "Standard changes go to the CAB for approval every time.", false, "Standard changes are pre-approved through their template."),

    // ---------------- Knowledge ----------------
    ord("knowledge", "easy", "Put the knowledge article lifecycle in order.", ["Draft", "Review", "Published", "Retired"], "Articles are drafted, reviewed, published and eventually retired."),
    mc("knowledge", "medium", "What controls who can read articles in a knowledge base?", ["User criteria (Can read)", "System properties", "SLA definitions", "Assignment rules"], 0, "Knowledge bases use user criteria for Can read and Can contribute."),
    mc("knowledge", "medium", "How can an agent turn a fix into reusable knowledge from an incident?", ["Create Knowledge from the incident", "Clone the instance", "Write a business rule", "Export to Excel"], 0, "Create Knowledge starts an article from the incident's details."),
    tf("knowledge", "easy", "Readers can rate and flag knowledge articles.", true, "Ratings and flags create feedback for article owners."),
    mc("knowledge", "medium", "Where does a known error article usually come from?", ["A problem record", "A change calendar", "A user preference", "An import set"], 0, "Known error articles document problem workarounds."),

    // ---------------- SLA ----------------
    mc("sla", "easy", "What does an SLA definition's start condition decide?", ["When the SLA clock starts", "Who approves a change", "Which view to show", "When to clone the instance"], 0, "The start condition attaches the SLA and starts timing."),
    mc("sla", "medium", "An agreement between two internal support teams is called…", ["SLA", "OLA", "UC", "CAB"], 1, "Operational level agreements are internal."),
    mc("sla", "medium", "Which record tracks one SLA on one specific incident?", ["Task SLA", "SLA definition", "Schedule", "Data lookup"], 0, "A Task SLA is created for each record an SLA definition applies to."),
    num("sla", "medium", "A P1 SLA target is 4 hours on a 24×7 schedule. The incident was paused for 1 hour and resolved 4.5 hours after it started. How many hours of SLA time elapsed?", 3.5, 0, "Elapsed time excludes the pause: 4.5 − 1 = 3.5 hours, so the SLA was achieved."),
    st("sla", "medium", "What is the agreement with an outside supplier called? Give the two-letter abbreviation.", ["UC"], "An underpinning contract (UC) is with an external supplier."),
  ],
};
