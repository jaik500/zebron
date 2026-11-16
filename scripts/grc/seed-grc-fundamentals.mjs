/**
 * GRC Fundamentals
 * Program: Enterprise AI & Solutions Architecture, step 3
 *
 * Dry run (checks the content, writes nothing):
 *   node scripts/grc/seed-grc-fundamentals.mjs
 * Create the course:
 *   node scripts/grc/seed-grc-fundamentals.mjs --apply
 * Update an existing course (keeps its status, publish date and final exam):
 *   node scripts/grc/seed-grc-fundamentals.mjs --apply --overwrite
 *
 * Lesson text uses the light Markdown lessons support: # / ## / ### headings,
 * - and 1. lists, **bold**, *italic*, `code`, ``` code blocks, > quotes and
 * | tables |. Each text block is one section in the lesson player; its first
 * heading is the section title.
 */

import { runCourseSeed } from '../lib/write-zebron-course.mjs';

const COURSE = {
  id: "grc-fundamentals",
  title: "GRC Fundamentals",
  summary: "Governance, Risk, and Compliance Fundamentals",
  description: "Learn the foundations of Governance, Risk, and Compliance (GRC).\n\nThis course introduces organizational governance, enterprise risk management, regulatory compliance, security controls, IT auditing, third-party risk, business continuity, and GRC technology.\n\nExplore important frameworks and standards including NIST, ISO/IEC 27001, ISO 31000, SOC 2, COBIT, CIS Controls, FISMA, HIPAA, GDPR, and PCI DSS.\n\nThrough practical examples and exercises, learners will develop foundational skills in risk identification, risk assessment, control documentation, audit evidence, and remediation tracking.\n\nThis course is designed for aspiring GRC analysts, cybersecurity professionals, IT auditors, risk managers, and IT professionals.",
  topic: "Governance, Risk, and Compliance",
  program: "Enterprise AI & Solutions Architecture",
  programOrder: 3,
  level: "beginner",
  cover: "teal",
  outcomes: [
    "Explain governance, risk management, and compliance and how they connect",
    "Identify, assess, and treat organizational risks",
    "Map controls to regulatory and control frameworks",
    "Write and maintain policies, standards, and procedures",
    "Support audits, vendor risk reviews, and business continuity planning",
  ],
  skills: [
    "Governance",
    "Risk assessment",
    "Compliance frameworks",
    "Security controls",
    "Policy management",
    "IT audit",
    "Third-party risk",
    "Business continuity",
  ],
};

const MODULES = [
  {
    id: "introduction-to-grc",
    title: "Introduction to GRC",
    lessons: [
      {
        id: "understanding-grc",
        title: "Understanding Governance, Risk, and Compliance",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Governance, Risk, and Compliance

GRC stands for **Governance, Risk, and Compliance**. It is an integrated approach to directing an organization, managing uncertainty, and meeting obligations, so that it can pursue its objectives responsibly.

## The three parts

| Part | Question it answers | Examples |
| --- | --- | --- |
| **Governance** | Who decides, and how are we held accountable? | Board oversight, policies, decision rights |
| **Risk management** | What could affect our objectives, and what do we do about it? | Risk assessments, risk registers, treatment plans |
| **Compliance** | Are we meeting the rules that apply to us? | Laws, regulations, contracts, internal policies |

## Why "integrated"

When the three run separately, organizations duplicate work and miss gaps: the security team assesses a risk, legal tracks a regulation, and audit tests a control, each in its own spreadsheet. An integrated approach connects them:

\`\`\`text
Objective → Risk that threatens it → Control that reduces it
        → Policy that requires the control → Evidence that it works
\`\`\`

One control, such as multi-factor authentication, can reduce several risks and satisfy several regulations at once.

## What GRC is not

- Not just paperwork: good GRC changes how decisions are made.
- Not only security: it covers financial, operational, legal, and reputational matters too.
- Not a one-time project: risks, rules, and the business keep changing.

## GRC and AI

AI systems create new GRC questions: who approves a model for use, how bias and errors are assessed, and how data protection laws apply. The same framework (governance, risk, compliance) applies, which is why this course is part of the Enterprise AI program.

## Key points

- Governance sets direction and accountability; risk management handles uncertainty; compliance meets obligations.
- Integrating them links objectives, risks, controls, policies, and evidence.
- GRC is continuous and covers every kind of organizational risk, including AI.`,
          },
          {
            type: 'check',
            question: "What is the main benefit of managing governance, risk, and compliance together?",
            options: [
              "It lets each department keep its own separate risk spreadsheet",
              "It guarantees the organization will never face an incident",
              "Risks, controls, policies, and evidence are connected, which reduces duplicated work and gaps",
              "It removes the need for internal audits",
            ],
            answer: 2,
            explanation: "An integrated approach links each risk to its controls, policies, and evidence, so one piece of work supports several needs and gaps become visible.",
          },
        ],
      },
      {
        id: "importance-of-grc",
        title: "Why GRC Matters to Organizations",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Why GRC Matters to Organizations

Every organization faces uncertainty: cyberattacks, supplier failures, new regulations, mistakes, and market changes. GRC gives a structured way to anticipate and handle them instead of reacting after the damage is done.

## Benefits

- **Better decisions:** leaders see risks and trade-offs before committing.
- **Fewer surprises:** risks are identified and monitored early.
- **Lower cost of compliance:** controls are designed once and reused across regulations.
- **Trust:** customers, partners, and regulators gain confidence from demonstrable controls.
- **Resilience:** the organization recovers faster from disruptions.

## What happens without it

| Gap | Possible consequence |
| --- | --- |
| No clear ownership of risks | Nobody acts until a problem becomes a crisis |
| Unknown regulatory obligations | Fines, sanctions, or lost licences |
| Untested controls | Controls that exist on paper but fail in practice |
| Unmanaged vendors | A supplier's breach exposes your customer data |
| No continuity plan | Long outages after an incident |

## A short example

A healthcare clinic adopts a new online booking service. With GRC in place:

1. **Governance:** the change goes through an approval process with a named owner.
2. **Risk:** the team assesses the vendor's security and the impact of an outage.
3. **Compliance:** they confirm the vendor's handling of patient data meets health privacy law and sign the required agreement.
4. **Monitoring:** the vendor's security reports are reviewed every year.

Without GRC, the booking service might go live quickly but expose patient data or fail without a fallback.

## GRC as an enabler

Done well, GRC helps the business move faster with confidence, because the questions "is this safe?" and "is this allowed?" have clear, repeatable answers.

## Key points

- GRC helps organizations anticipate problems, make informed decisions, and earn trust.
- Gaps in ownership, controls, or vendor oversight lead to costly incidents.
- Good GRC enables change rather than blocking it.`,
          },
          {
            type: 'check',
            question: "In the clinic example, which GRC activity confirms the vendor's handling of patient data meets health privacy law?",
            options: [
              "Compliance",
              "Governance",
              "Marketing",
              "Business continuity",
            ],
            answer: 0,
            explanation: "Checking that the vendor meets legal requirements for patient data is a compliance activity.",
          },
        ],
      },
      {
        id: "grc-roles-responsibilities",
        title: "GRC Roles and Responsibilities",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# GRC Roles and Responsibilities

GRC works only when people know who is responsible for what. Responsibilities are spread across the organization, not confined to one team.

## Key roles

| Role | Responsibilities |
| --- | --- |
| **Board of directors** | Sets risk appetite, oversees strategy and major risks, holds executives accountable |
| **Executive management** | Implements strategy, owns major risks, allocates resources for controls |
| **Risk owners** | Business leaders accountable for specific risks and their treatment |
| **Control owners** | People responsible for operating specific controls, such as access reviews |
| **Risk management function** | Provides methods, tools, and oversight for identifying and assessing risks |
| **Compliance function** | Tracks obligations, advises the business, monitors adherence |
| **Information security** | Protects systems and data; operates many technical controls |
| **Legal** | Interprets laws and contracts |
| **Internal audit** | Independently tests whether governance, risk management, and controls work |
| **All employees** | Follow policies, report incidents and concerns |

## The three lines model

Many organizations organize these roles into three lines:

1. **First line: business operations.** Owns and manages risks day to day and operates controls.
2. **Second line: risk and compliance functions.** Set frameworks, advise, and monitor the first line.
3. **Third line: internal audit.** Provides independent assurance to the board.

Independence matters: the people who audit a control shouldn't be the people who run it.

## Making accountability clear

A **RACI chart** records who is **R**esponsible, **A**ccountable, **C**onsulted, and **I**nformed for each activity:

| Activity | Risk owner | Security | Compliance | Audit |
| --- | --- | --- | --- | --- |
| Assess vendor risk | A | R | C | I |
| Quarterly access review | A | R | I | I |
| Test access review control | I | C | I | R/A |

## Key points

- GRC responsibilities span the board, management, specialist functions, and every employee.
- The three lines model separates owning risk, overseeing it, and independently assuring it.
- RACI charts make accountability explicit.`,
          },
          {
            type: 'check',
            question: "In the three lines model, which line provides independent assurance to the board?",
            options: [
              "External vendors that operate controls",
              "The first line: business operations",
              "The third line: internal audit",
              "The second line: risk and compliance functions",
            ],
            answer: 2,
            explanation: "Internal audit is the third line. It is independent of the people who own and oversee risks, so its assurance is objective.",
          },
        ],
      },
    ],
  },
  {
    id: "governance-fundamentals",
    title: "Governance Fundamentals",
    lessons: [
      {
        id: "principles-of-governance",
        title: "Principles of Organizational Governance",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Principles of Organizational Governance

Governance is the system by which an organization is **directed, controlled, and held accountable**. It sets who makes which decisions, on what basis, and how results are checked.

## Core principles

| Principle | What it looks like in practice |
| --- | --- |
| **Accountability** | Named owners answer for decisions and results |
| **Transparency** | Decisions and their reasons are documented and visible to the right people |
| **Integrity** | Ethical conduct, honest reporting, conflicts of interest managed |
| **Fairness** | Stakeholders are treated consistently and equitably |
| **Responsibility** | Leaders act in the organization's long-term interest and comply with laws |
| **Oversight** | Independent bodies, such as the board, review management's actions |

## Governance structures

- **Board and committees:** set direction, approve risk appetite, oversee executives.
- **Decision rights:** who can approve spending, hire, sign contracts, or launch products, often written as a delegation of authority.
- **Policies:** high-level rules that express governance decisions.
- **Reporting:** regular information that lets leaders see performance and risk.

## Risk appetite

Governance includes deciding **how much risk the organization is willing to accept** in pursuit of its goals. A statement such as "we accept no tolerance for regulatory breaches in patient data, but moderate risk in trying new learning products" guides decisions throughout the organization.

## IT and data governance

Technology needs its own governance: who approves new systems, how data is classified and protected, and how technology investments align with business strategy. AI governance extends this to model approval, acceptable use, and oversight of automated decisions.

## Signs of weak governance

- Decisions made without clear authority.
- Policies that exist but are ignored.
- Leaders unaware of major risks until they materialize.
- No consequences when rules are broken.

## Key points

- Governance directs and controls the organization and holds people accountable.
- Accountability, transparency, integrity, and oversight are its core principles.
- Risk appetite and decision rights turn governance into everyday guidance.`,
          },
          {
            type: 'check',
            question: "What does a risk appetite statement do?",
            options: [
              "It lists every risk the organization has already experienced",
              "It states how much risk the organization is willing to accept in pursuit of its goals",
              "It assigns a dollar value to each employee's responsibilities",
              "It replaces the need for policies and controls",
            ],
            answer: 1,
            explanation: "Risk appetite expresses the level and types of risk leadership accepts, guiding decisions across the organization.",
          },
        ],
      },
      {
        id: "grc-committees",
        title: "GRC Committees and Organizational Oversight",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# GRC Committees and Organizational Oversight

Committees bring the right people together to make decisions, review risks, and oversee GRC activities that cross departmental boundaries.

## Common committees

- **Audit committee (board level):** oversees financial reporting, internal controls, and the internal and external auditors. Members are usually independent directors.
- **Risk committee:** reviews the organization's major risks, risk appetite, and the effectiveness of risk management.
- **Compliance committee:** monitors regulatory obligations, compliance issues, and remediation.
- **Information security or technology steering committee:** prioritizes security initiatives, approves policies, and reviews significant incidents.
- **Data governance council:** sets data ownership, quality, classification, and privacy practices.
- **AI governance board:** approves AI use cases, reviews model risks, and sets acceptable-use rules.

## What makes a committee effective

| Element | Example |
| --- | --- |
| **Charter** | A written purpose, authority, membership, and meeting frequency |
| **Right members** | Decision-makers plus subject-matter experts |
| **Independence** | Oversight committees include people who don't run the activities they review |
| **Clear agenda** | Focus on decisions and significant risks, not status updates |
| **Records** | Minutes capture decisions, owners, and deadlines |
| **Follow-up** | Actions are tracked until closed |

## Reporting flows

\`\`\`text
Control owners and risk owners
        ↓ reports, metrics, issues
Management committees (risk, compliance, security)
        ↓ significant risks and decisions
Board committees (audit, risk)
        ↓
Board of directors
\`\`\`

Information should be summarized as it moves up, with escalation rules for urgent issues.

## Common pitfalls

- Committees that only receive updates and never decide.
- Overlapping committees discussing the same risks.
- Decisions without owners or deadlines.

## Key points

- Committees coordinate cross-functional oversight of risk, compliance, security, data, and AI.
- Charters, independence, clear agendas, and tracked actions make them effective.
- Information flows upward in summarized form, with escalation for urgent issues.`,
          },
          {
            type: 'check',
            question: "What is the main purpose of an audit committee?",
            options: [
              "To run day-to-day IT operations and help desk",
              "To oversee financial reporting, internal controls, and the auditors",
              "To design the organization's marketing campaigns",
              "To approve every individual purchase the company makes",
            ],
            answer: 1,
            explanation: "The audit committee, usually made up of independent directors, oversees reporting, controls, and the internal and external audit functions.",
          },
        ],
      },
      {
        id: "governance-policies",
        title: "Governance Policies and Accountability",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Governance Policies and Accountability

Governance policies turn leadership decisions into written expectations that apply across the organization.

## Typical governance policies

| Policy | Purpose |
| --- | --- |
| Code of conduct | Ethical behavior and conflicts of interest |
| Information security policy | How information and systems are protected |
| Acceptable use policy | Proper use of company devices, systems, and AI tools |
| Data protection and privacy policy | Handling of personal data |
| Risk management policy | How risks are identified, assessed, and treated |
| Third-party risk policy | Requirements for selecting and monitoring vendors |
| Business continuity policy | Preparing for and recovering from disruptions |

## What a good policy contains

- **Purpose and scope:** why it exists and who and what it covers.
- **Requirements:** clear, mandatory statements ("must"), not vague aspirations.
- **Roles:** who owns, enforces, and follows it.
- **Exceptions:** how to request one and who approves it.
- **Consequences:** what happens if it is not followed.
- **Review date and owner.**

## Making accountability real

A policy matters only if people follow it and someone checks:

1. **Communicate:** publish it where people work and explain what changed.
2. **Train:** require acknowledgement and training for relevant staff.
3. **Implement:** back it with standards, procedures, and technical controls.
4. **Monitor:** measure adherence through reviews, metrics, and audits.
5. **Enforce:** apply consequences consistently.

## Example requirement

> All employees **must** complete security awareness training within 30 days of starting and annually after that. The information security team monitors completion monthly and reports overdue training to managers.

This is specific, measurable, and assigns monitoring responsibility.

## AI acceptable use

Many organizations now add rules for generative AI tools, for example forbidding confidential data in public AI services and requiring human review of AI-generated customer communications.

## Key points

- Governance policies record leadership's expectations in writing.
- Good policies are specific, assign roles, explain exceptions, and have an owner and review date.
- Communication, training, monitoring, and enforcement make policies effective.`,
          },
          {
            type: 'check',
            question: "Which statement is written the way a governance policy requirement should be?",
            options: [
              "Employees should try to think about security when convenient",
              "Security is everyone's priority and we value it highly",
              "Training may be useful for some employees at some point",
              "Employees must complete security training within 30 days of starting and every year after",
            ],
            answer: 3,
            explanation: "Requirements should be specific and mandatory, with clear timing, so compliance can be measured.",
          },
        ],
      },
    ],
  },
  {
    id: "risk-management",
    title: "Risk Management Fundamentals",
    lessons: [
      {
        id: "understanding-risk",
        title: "Understanding Risk, Threats, and Vulnerabilities",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Risk, Threats, and Vulnerabilities

**Risk** is the effect of uncertainty on objectives: the possibility that an event affects what the organization is trying to achieve. Most risk work focuses on negative effects, but risk can also include opportunities.

## Key terms

| Term | Meaning | Example |
| --- | --- | --- |
| **Asset** | Something of value | Customer database |
| **Threat** | Something that could cause harm | Ransomware attacker |
| **Vulnerability** | A weakness a threat could exploit | Unpatched server |
| **Likelihood** | How probable the event is | Likely within a year |
| **Impact** | How severe the consequences would be | Week-long outage, regulatory fine |
| **Risk** | The combination of likelihood and impact | High risk of data loss from ransomware |
| **Control** | A measure that reduces risk | Patching, backups, multi-factor authentication |

A simple way to remember the relationship:

\`\`\`text
Threat + Vulnerability + Asset → Risk (measured by likelihood × impact)
\`\`\`

## Categories of risk

- **Strategic:** wrong direction, new competitors, failed products.
- **Operational:** process failures, human error, outages.
- **Financial:** fraud, liquidity, credit losses.
- **Compliance and legal:** breaking laws, regulations, or contracts.
- **Technology and cyber:** attacks, data breaches, system failures.
- **Third-party:** failures or breaches at suppliers.
- **Reputational:** loss of trust, often a consequence of the others.

## Inherent and residual risk

- **Inherent risk:** the level of risk before controls.
- **Residual risk:** what remains after controls are applied.

Organizations compare residual risk with their risk appetite to decide whether more action is needed.

## Key points

- Risk combines the likelihood of an event with its impact on objectives.
- A threat exploits a vulnerability to harm an asset; controls reduce the risk.
- Compare residual risk with risk appetite to decide on further action.`,
          },
          {
            type: 'check',
            question: "An unpatched web server is an example of what?",
            options: [
              "A vulnerability",
              "An impact",
              "A threat",
              "A control",
            ],
            answer: 0,
            explanation: "A missing patch is a weakness that a threat, such as an attacker, could exploit. That makes it a vulnerability.",
          },
        ],
      },
      {
        id: "risk-assessment",
        title: "Risk Identification and Assessment",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Risk Identification and Assessment

A risk assessment helps an organization understand which risks matter most, so it can focus effort where it counts.

## The process

1. **Define scope and context:** which business area, system, or project, and which objectives.
2. **Identify risks:** what could go wrong (or right) and why.
3. **Analyze:** estimate likelihood and impact, considering existing controls.
4. **Evaluate:** compare results with risk appetite and prioritize.
5. **Record:** add the risks, owners, and ratings to the risk register.

## Ways to identify risks

- Workshops with people who know the process.
- Reviewing past incidents, audit findings, and near misses.
- Threat intelligence and industry reports.
- Checklists from frameworks and regulations.
- Interviews with system and process owners.

Write each risk clearly: **cause → event → consequence**.

> Because backups are not tested (cause), we may be unable to restore customer data after a ransomware attack (event), leading to a multi-day outage and regulatory penalties (consequence).

## Qualitative scoring

Most organizations use a 1–5 scale for likelihood and impact:

| | Impact 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| **Likelihood 5** | 5 | 10 | 15 | 20 | 25 |
| **4** | 4 | 8 | 12 | 16 | 20 |
| **3** | 3 | 6 | 9 | 12 | 15 |
| **2** | 2 | 4 | 6 | 8 | 10 |
| **1** | 1 | 2 | 3 | 4 | 5 |

For example: 15–25 high, 8–14 medium, 1–6 low. Define what each number means (for instance, impact 5 = over $1 million or a regulatory sanction) so different assessors score consistently.

## Quantitative analysis

Some risks can be estimated in money, for example:

\`\`\`text
Annualized loss expectancy = single loss expectancy × annual rate of occurrence
$200,000 per incident × 0.25 per year = $50,000 per year
\`\`\`

This helps compare the cost of a control with the loss it prevents.

## Key points

- Assess risks by scope, identification, analysis, evaluation, and recording.
- Describe each risk as cause, event, and consequence.
- Use defined scales for consistent scoring; quantify where data allows.`,
          },
          {
            type: 'check',
            question: "With likelihood 4 and impact 3 on a 1–5 scale, what is the risk score using likelihood × impact?",
            options: [
              "7",
              "12",
              "1",
              "43",
            ],
            answer: 1,
            explanation: "Multiplying likelihood by impact gives 4 × 3 = 12, which falls in the medium band of the example scale.",
          },
        ],
      },
      {
        id: "risk-treatment",
        title: "Risk Treatment and Risk Response",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Risk Treatment and Risk Response

After assessing a risk, the organization decides how to respond. There are four main options.

## The four treatment options

| Option | Meaning | Example |
| --- | --- | --- |
| **Mitigate (reduce)** | Add or improve controls to lower likelihood or impact | Enable multi-factor authentication to reduce account takeover |
| **Transfer (share)** | Shift some of the impact to another party | Cyber insurance; contractual liability with a vendor |
| **Avoid** | Stop the activity that creates the risk | Decide not to store card numbers at all |
| **Accept** | Consciously take the risk without further action | A low-impact risk where controls would cost more than the loss |

Transferring a risk shifts financial impact, not accountability: if a vendor leaks your customers' data, your organization still answers to customers and regulators.

## Choosing a response

Consider:

- The risk's rating compared with risk appetite.
- The cost of the control versus the expected reduction in loss.
- Legal or contractual requirements that make some controls mandatory.
- Side effects, such as controls that slow the business too much.

## Treatment plans

A treatment plan records:

- The chosen option and the specific actions.
- An owner and a due date.
- The expected residual risk after treatment.
- How progress will be tracked.

## Risk acceptance

Acceptance must be **formal and informed**: an authorized person, at the right level for the risk, signs off with a documented reason and a review date. Silent acceptance, where nobody decides, is not acceptance; it is neglect.

## Monitoring

Risks change. Review them on a schedule and when something significant happens, such as a new system, a major incident, or a new regulation.

## Key points

- Treat risks by mitigating, transferring, avoiding, or accepting them.
- Transfer shifts cost, not accountability.
- Acceptance must be formally approved at the right level and reviewed.`,
          },
          {
            type: 'check',
            question: "A company decides to stop storing payment card numbers so that card data can no longer be breached from its systems. Which treatment is this?",
            options: [
              "Accept",
              "Transfer",
              "Mitigate by adding monitoring",
              "Avoid",
            ],
            answer: 3,
            explanation: "Removing the activity that creates the risk is avoidance.",
          },
        ],
      },
    ],
  },
  {
    id: "compliance-frameworks",
    title: "Compliance and Regulatory Frameworks",
    lessons: [
      {
        id: "understanding-compliance",
        title: "Understanding Regulatory Compliance",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Regulatory Compliance

**Compliance** means meeting the requirements that apply to the organization, and being able to show that you do.

## Sources of requirements

| Source | Examples |
| --- | --- |
| **Laws** | Data protection laws, anti-bribery laws, employment law |
| **Regulations** | Financial, healthcare, and telecommunications rules |
| **Industry standards** | Payment card industry (PCI DSS) requirements |
| **Contracts** | Security clauses in customer and supplier agreements |
| **Internal policies** | The organization's own rules |

## The compliance lifecycle

1. **Identify obligations:** which laws, regulations, and contracts apply, and where the organization operates.
2. **Interpret:** translate legal language into concrete requirements, usually with legal advice.
3. **Map to controls:** decide which processes and controls meet each requirement.
4. **Implement:** put controls and procedures in place.
5. **Monitor and test:** check controls operate as intended.
6. **Report:** inform management, regulators, or customers as required.
7. **Remediate:** fix gaps and update as rules change.

## An obligations register

Organizations keep a register that links each obligation to its owner and controls:

| Obligation | Source | Owner | Controls | Evidence |
| --- | --- | --- | --- | --- |
| Report personal data breaches to the regulator within 72 hours | GDPR Article 33 | Privacy officer | Incident response procedure | Incident log, notification records |
| Restrict access to cardholder data | PCI DSS | IT security | Role-based access, quarterly reviews | Access review reports |

## Compliance versus security

Being compliant doesn't mean being secure, and being secure doesn't automatically make you compliant. Regulations set minimums; real risks may need more. Good programs build controls for actual risk and use them to satisfy compliance at the same time.

## Consequences of non-compliance

Fines, legal action, loss of licences, contract termination, and reputational damage. Individuals can also face personal liability in some regimes.

## Key points

- Compliance means meeting obligations from laws, regulations, standards, contracts, and policies, and proving it.
- An obligations register links requirements to owners, controls, and evidence.
- Compliance sets minimums; manage real risk beyond them.`,
          },
          {
            type: 'check',
            question: "Why is being compliant not the same as being secure?",
            options: [
              "Compliance only applies to financial companies",
              "Security controls are not allowed to satisfy compliance requirements",
              "Compliance requirements change daily, so they cannot be met",
              "Regulations set minimum requirements, while real risks may require stronger controls",
            ],
            answer: 3,
            explanation: "Compliance covers specific obligations. An organization can meet them and still face risks that require further controls.",
          },
        ],
      },
      {
        id: "nist-iso-frameworks",
        title: "Introduction to NIST and ISO Frameworks",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Introduction to NIST and ISO Frameworks

Frameworks give organizations a proven structure for managing security and risk, so they don't have to invent one. Several are widely used together.

## NIST Cybersecurity Framework (CSF) 2.0

Published by the US National Institute of Standards and Technology and used worldwide. Version 2.0 organizes cybersecurity outcomes into six **functions**:

| Function | Focus |
| --- | --- |
| **Govern** | Strategy, roles, policy, and oversight of cybersecurity risk |
| **Identify** | Understand assets, risks, and dependencies |
| **Protect** | Safeguards such as access control, training, and data security |
| **Detect** | Find attacks and anomalies |
| **Respond** | Act on detected incidents |
| **Recover** | Restore operations and improve |

The CSF is voluntary and outcome-based: it says *what* to achieve, and organizations choose *how*.

## NIST SP 800-53

A detailed **catalog of security and privacy controls**, required for US federal systems and widely used as a reference elsewhere.

## ISO/IEC 27001

An international standard for an **information security management system (ISMS)**: a managed, continually improving program for protecting information.

- Organizations can be **certified** by accredited auditors.
- It requires risk assessment, a statement of which controls apply, management review, and internal audits.
- **ISO/IEC 27002** gives guidance on the controls listed in 27001's Annex A.

## ISO 31000

Guidelines for **risk management** in general, not only security: principles, a framework, and a process for identifying, analyzing, evaluating, and treating risk.

## How they fit together

| Need | Framework |
| --- | --- |
| Board-level structure for cyber risk | NIST CSF |
| Detailed control catalog | NIST SP 800-53, ISO/IEC 27002 |
| Certifiable security program | ISO/IEC 27001 |
| Enterprise-wide risk method | ISO 31000 |

Organizations often map one set of controls to several frameworks to avoid duplicated work.

## Key points

- NIST CSF 2.0 has six functions: Govern, Identify, Protect, Detect, Respond, Recover.
- ISO/IEC 27001 defines a certifiable information security management system.
- ISO 31000 provides general risk management guidance.`,
          },
          {
            type: 'check',
            question: "Which function was added in NIST Cybersecurity Framework 2.0 to cover strategy, roles, and oversight?",
            options: [
              "Govern",
              "Protect",
              "Recover",
              "Detect",
            ],
            answer: 0,
            explanation: "Version 2.0 added Govern alongside Identify, Protect, Detect, Respond, and Recover.",
          },
        ],
      },
      {
        id: "soc2-fisma-gdpr",
        title: "Introduction to SOC 2, FISMA, and GDPR",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Introduction to SOC 2, FISMA, and GDPR

Different requirements apply depending on what an organization does, who its customers are, and where it operates. Three commonly encountered examples:

## SOC 2

An **attestation report** in which an independent CPA firm examines a service organization's controls against the AICPA **Trust Services Criteria**:

- Security (always included)
- Availability
- Processing integrity
- Confidentiality
- Privacy

| Report type | What it shows |
| --- | --- |
| **Type I** | Controls are suitably designed at a point in time |
| **Type II** | Controls operated effectively over a period, typically 6–12 months |

SOC 2 isn't a law. Customers ask for it, especially from SaaS and cloud providers, to gain assurance before trusting them with data.

## FISMA

The US **Federal Information Security Modernization Act** requires federal agencies, and contractors operating systems for them, to run information security programs. It relies on NIST standards: categorizing systems, selecting SP 800-53 controls, assessing them, authorizing systems to operate, and monitoring continuously. **FedRAMP** applies a similar approach to cloud services used by federal agencies.

## GDPR

The EU **General Data Protection Regulation** protects personal data of people in the EU, and applies to organizations outside the EU that offer them goods or services or monitor their behavior.

Key principles: lawfulness and transparency, purpose limitation, data minimization, accuracy, storage limitation, integrity and confidentiality, and accountability.

Key obligations include:

- A lawful basis for processing.
- Respecting rights such as access, correction, and erasure.
- Notifying the supervisory authority of personal data breaches within **72 hours** where required.
- Data protection impact assessments for high-risk processing.
- Safeguards for transfers outside the EU.

Fines can reach **€20 million or 4% of global annual turnover**, whichever is higher.

## Others you will meet

HIPAA (US health information), PCI DSS (payment cards), and sector or national laws, including new AI-specific regulation such as the EU AI Act.

## Key points

- SOC 2 is an independent report on a service provider's controls; Type II covers a period of operation.
- FISMA governs US federal information security using NIST standards.
- GDPR protects personal data of people in the EU, with strict obligations and large fines.`,
          },
          {
            type: 'check',
            question: "What does a SOC 2 Type II report demonstrate?",
            options: [
              "That the organization complies with every applicable law",
              "That controls were designed correctly on a single date only",
              "That the organization is certified under ISO/IEC 27001",
              "That controls operated effectively over a period of time",
            ],
            answer: 3,
            explanation: "Type II covers operating effectiveness over a review period; Type I only covers design at a point in time.",
          },
        ],
      },
    ],
  },
  {
    id: "security-controls",
    title: "Security Controls and Control Frameworks",
    lessons: [
      {
        id: "understanding-security-controls",
        title: "Understanding Security Controls",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Security Controls

A **security control** is a safeguard that reduces risk to assets, systems, or information. Controls are where GRC becomes concrete.

## Controls by purpose

| Type | Purpose | Examples |
| --- | --- | --- |
| **Preventive** | Stop an incident before it happens | Multi-factor authentication, firewalls, access approvals |
| **Detective** | Find an incident that is happening or has happened | Log monitoring, intrusion detection, reconciliations |
| **Corrective** | Limit damage and restore normal operation | Restoring from backup, patching after an incident |
| **Deterrent** | Discourage attempts | Warning banners, visible cameras, disciplinary policy |
| **Compensating** | Alternative control when the primary one isn't feasible | Extra monitoring for a legacy system that can't support MFA |

Strong programs combine types: preventive controls will sometimes fail, so detective and corrective controls are needed too. This layering is called **defense in depth**.

## Describing a control well

A control description should say:

- **What** is done.
- **Who** does it (the control owner).
- **When or how often.**
- **How** it is evidenced.

> The IT security manager reviews all privileged accounts quarterly, removes access that is no longer needed, and retains the signed review report.

## Design versus operating effectiveness

- **Design effectiveness:** would the control reduce the risk if it worked as described?
- **Operating effectiveness:** does it actually work consistently over time?

A beautifully designed control that people skip provides no protection.

## Manual and automated controls

Automated controls (such as a system that blocks payments above a limit without approval) run consistently and produce evidence automatically. Manual controls are flexible but prone to human error. Prefer automation where practical.

## Key points

- Controls can be preventive, detective, corrective, deterrent, or compensating.
- Layer controls so a single failure doesn't cause an incident.
- Describe controls with what, who, when, and evidence; test both design and operation.`,
          },
          {
            type: 'check',
            question: "Reviewing security logs to find suspicious activity is which type of control?",
            options: [
              "Preventive",
              "Detective",
              "Deterrent",
              "Compensating",
            ],
            answer: 1,
            explanation: "Log monitoring identifies incidents that are happening or have happened, which makes it detective.",
          },
        ],
      },
      {
        id: "administrative-technical-physical-controls",
        title: "Administrative, Technical, and Physical Controls",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Administrative, Technical, and Physical Controls

Controls can also be grouped by **how** they are implemented.

## Administrative (managerial) controls

Policies, procedures, and people-focused measures.

- Security policies and standards.
- Background checks and onboarding/offboarding procedures.
- Security awareness training.
- Separation of duties.
- Risk assessments and vendor reviews.

## Technical (logical) controls

Implemented through technology.

- Authentication and multi-factor authentication.
- Role-based access control.
- Encryption of data at rest and in transit.
- Firewalls, endpoint protection, and email filtering.
- Logging, monitoring, and alerting.
- Automated backups.

## Physical controls

Protect facilities, equipment, and people.

- Badge access and visitor logs.
- Locked server rooms and cabinets.
- CCTV and security guards.
- Fire suppression and environmental monitoring.
- Secure disposal of devices and paper records.

## Combining both views

Each control has a purpose (preventive, detective, corrective…) **and** an implementation type:

| Control | Implementation | Purpose |
| --- | --- | --- |
| Badge readers on the data center door | Physical | Preventive |
| Security awareness training | Administrative | Preventive / deterrent |
| Intrusion detection alerts | Technical | Detective |
| Quarterly access review | Administrative | Detective |
| Restoring data from backup | Technical | Corrective |
| CCTV recording | Physical | Detective / deterrent |

## Why the mix matters

A single control type is rarely enough. Encryption (technical) protects stolen laptops, but only if the policy (administrative) requires it and someone checks devices are encrypted. Badge access (physical) is weakened if staff hold doors open, which training (administrative) addresses.

## Separation of duties

An important administrative control: no single person should control every step of a sensitive process. The person who requests a payment shouldn't also approve and release it.

## Key points

- Administrative controls are policies and procedures; technical controls are implemented in systems; physical controls protect facilities.
- Every control has both an implementation type and a purpose.
- Effective protection combines all three types.`,
          },
          {
            type: 'check',
            question: "Which of these is an administrative control?",
            options: [
              "Badge readers on the server room door",
              "Encryption of data stored on laptops",
              "Separation of duties in the payment approval process",
              "A firewall rule blocking inbound traffic",
            ],
            answer: 2,
            explanation: "Separation of duties is a procedural rule about who may do what, so it is administrative. The others are technical or physical.",
          },
        ],
      },
      {
        id: "nist-cis-cobit-controls",
        title: "NIST, CIS Controls, and COBIT",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# NIST, CIS Controls, and COBIT

Control frameworks provide ready-made lists of practices, so organizations can build and assess their programs consistently.

## NIST SP 800-53

A comprehensive catalog of security and privacy controls, grouped into **families** such as Access Control (AC), Audit and Accountability (AU), Incident Response (IR), and Risk Assessment (RA). It defines baselines (low, moderate, high) depending on how sensitive a system is. Required for US federal systems and used widely as a reference.

## CIS Critical Security Controls

Published by the Center for Internet Security. Version 8 contains **18 prioritized controls** with practical safeguards, organized into three **Implementation Groups**:

| Group | Suited to |
| --- | --- |
| **IG1** | Small organizations with limited IT resources: essential "cyber hygiene" |
| **IG2** | Organizations with more complex environments and sensitive data |
| **IG3** | Mature organizations facing sophisticated attackers |

Early controls cover asset inventory, software inventory, data protection, secure configuration, and account management: basics that stop many common attacks.

## COBIT

A framework from ISACA for **governance and management of enterprise IT**. COBIT focuses less on individual technical safeguards and more on making sure IT supports business goals, with clear objectives, processes, and performance measures. It is often used by IT auditors and governance teams.

## Comparing them

| Framework | Main focus | Typical users |
| --- | --- | --- |
| NIST SP 800-53 | Detailed security and privacy controls | Government, regulated industries |
| CIS Controls | Prioritized, practical security actions | Organizations of any size starting or improving security |
| COBIT | IT governance and management | IT leadership, auditors |
| ISO/IEC 27001 | Certifiable security management system | Organizations needing certification |

## Mapping

Frameworks overlap heavily. Organizations often maintain one **control set** and map each control to the requirements it satisfies in several frameworks, so one test produces evidence for many.

## Key points

- NIST SP 800-53 is a detailed control catalog organized into families and baselines.
- CIS Controls v8 lists 18 prioritized controls with implementation groups.
- COBIT addresses governance and management of enterprise IT.
- Map one control set to several frameworks to avoid duplication.`,
          },
          {
            type: 'check',
            question: "Which framework is organized into prioritized safeguards with Implementation Groups IG1 to IG3?",
            options: [
              "ISO 31000",
              "CIS Critical Security Controls",
              "COBIT",
              "SOC 2",
            ],
            answer: 1,
            explanation: "CIS Controls v8 groups its safeguards into Implementation Groups so organizations can start with essential hygiene and progress.",
          },
        ],
      },
    ],
  },
  {
    id: "policies-standards-procedures",
    title: "Policies, Standards, and Procedures",
    lessons: [
      {
        id: "policy-standard-procedure",
        title: "Understanding Policies, Standards, and Procedures",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Policies, Standards, and Procedures

Organizations document their requirements at different levels of detail. Using the right level keeps documents clear and easy to maintain.

## The hierarchy

| Document | What it says | Example | Changes |
| --- | --- | --- | --- |
| **Policy** | *What* must be achieved and *why*; management intent | "Access to systems must be granted based on business need and reviewed regularly." | Rarely |
| **Standard** | Mandatory, specific requirements that support a policy | "Passwords must be at least 14 characters; MFA is required for remote access." | Occasionally |
| **Procedure** | Step-by-step instructions for *how* to do it | "How to request access in the IT portal, approve it, and record it." | Often |
| **Guideline** | Recommended, non-mandatory advice | "Consider using a password manager." | As needed |

\`\`\`text
Policy (why / what)
  └─ Standards (specific mandatory rules)
       └─ Procedures (how, step by step)
            └─ Guidelines (helpful advice)
\`\`\`

## Why separate them

- Policies stay stable and are approved by senior leadership.
- Standards can be updated as technology changes without re-approving the policy.
- Procedures can be changed by the teams that perform them.
- Readers find the level of detail they need.

## Writing tips

- Use **"must"** for mandatory requirements and **"should"** for recommendations, and define these words.
- One requirement per sentence makes compliance testable.
- Avoid putting product names in policies; put them in standards or procedures.
- Link each document to the ones above and below it.

## Example chain

- **Policy:** Sensitive data must be protected in transit and at rest.
- **Standard:** Use TLS 1.2 or higher for data in transit; encrypt databases containing sensitive data with AES-256.
- **Procedure:** Steps to enable database encryption in the company's cloud platform and confirm it in the configuration report.

## Key points

- Policies state intent, standards set specific mandatory rules, procedures give steps, guidelines advise.
- Separating them keeps documents stable, specific, and easy to update.
- Use clear, testable language with "must" for requirements.`,
          },
          {
            type: 'check',
            question: "\"Passwords must be at least 14 characters long\" belongs in which type of document?",
            options: [
              "A business impact analysis",
              "A guideline",
              "A standard",
              "A policy",
            ],
            answer: 2,
            explanation: "It is a specific, mandatory technical requirement supporting a policy, which is the role of a standard.",
          },
        ],
      },
      {
        id: "policy-lifecycle",
        title: "The Policy Lifecycle",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# The Policy Lifecycle

Policies need to be managed throughout their life, or they become outdated and ignored.

## Stages

1. **Identify the need:** a new regulation, a risk, an audit finding, or a new technology such as generative AI.
2. **Draft:** the policy owner writes it with input from experts.
3. **Review:** legal, compliance, security, HR, and affected business areas comment.
4. **Approve:** the authorized level of management signs off, according to the governance structure.
5. **Publish and communicate:** make it easy to find, announce it, and explain what changes.
6. **Train and acknowledge:** affected staff learn the requirements and confirm they've read them.
7. **Implement and monitor:** supporting standards and procedures are in place; adherence is measured.
8. **Review and update:** at least annually, and whenever something significant changes.
9. **Retire:** withdraw policies that are no longer needed, and archive previous versions.

## Version control

Keep a record for each policy:

| Field | Example |
| --- | --- |
| Policy ID | POL-SEC-004 |
| Title | Access Control Policy |
| Owner | Chief Information Security Officer |
| Approver | Executive Risk Committee |
| Version | 3.1 |
| Effective date | 1 March 2027 |
| Next review | 1 March 2028 |
| Change summary | Added requirements for AI service accounts |

Archived versions show what rules applied at any point in time, which matters for audits and investigations.

## Signs a policy needs attention

- It references systems or roles that no longer exist.
- Exceptions are requested constantly.
- Audits find it isn't followed.
- Staff don't know it exists.

## Key points

- Policies move through drafting, review, approval, communication, implementation, review, and retirement.
- Approval must come from the authorized governance level.
- Track owners, versions, and review dates, and keep previous versions.`,
          },
          {
            type: 'check',
            question: "Before a new policy is published, what must happen?",
            options: [
              "It must be published first and approved after feedback",
              "It must be translated into every language used in the company",
              "It must be reviewed and approved by authorized stakeholders",
              "It must be reviewed only by the person who drafted it",
            ],
            answer: 2,
            explanation: "Approval by the right governance level gives the policy authority. Publishing an unapproved policy undermines it.",
          },
        ],
      },
      {
        id: "policy-exceptions",
        title: "Policy Exceptions and Document Management",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Policy Exceptions and Document Management

Sometimes a legitimate business or technical constraint prevents meeting a policy requirement. A controlled **exception process** handles this without abandoning the policy.

## When an exception is appropriate

- A legacy system can't support a required control, such as multi-factor authentication.
- A vendor's product doesn't meet a standard yet, but is needed for a critical project.
- A temporary situation, such as a migration, makes a requirement impractical for a short period.

Convenience alone is not a valid reason.

## What an exception request should contain

| Field | Example |
| --- | --- |
| Requirement affected | MFA required for all remote access |
| System or scope | Legacy plant control workstation |
| Business reason | The vendor software can't support MFA until the 2028 upgrade |
| Risk assessment | Medium: remote access could be misused if credentials are stolen |
| Compensating controls | Access only via the company VPN from managed devices; session recording; weekly log review |
| Duration | Until 31 March 2028 |
| Risk owner and approver | Plant operations director; CISO |

## Principles

- **Time-limited:** every exception has an expiry date.
- **Risk-assessed:** the residual risk is understood and approved at the right level.
- **Compensated:** alternative controls reduce the risk where possible.
- **Tracked:** exceptions are recorded centrally and reviewed before expiry.
- **Reported:** many exceptions against one policy suggests the policy or standard needs changing.

## Document management

Good document management keeps policies, standards, procedures, and exceptions trustworthy:

- One central, searchable repository.
- Clear ownership and approval records.
- Version history and archived copies.
- Access controls so only owners can change documents.
- Scheduled reviews with reminders.

## Key points

- Exceptions handle legitimate constraints in a controlled way; they are not a loophole.
- Each exception needs a reason, risk assessment, compensating controls, approval, and an expiry date.
- Central document management keeps policies and exceptions current and auditable.`,
          },
          {
            type: 'check',
            question: "Which element should every approved policy exception include?",
            options: [
              "An expiry date, after which it is reviewed again",
              "Approval by the person requesting the exception",
              "Removal of the related policy requirement for everyone",
              "Permanent approval so it doesn't need revisiting",
            ],
            answer: 0,
            explanation: "Exceptions must be time-limited so the risk is revisited and the exception doesn't quietly become permanent.",
          },
        ],
      },
    ],
  },
  {
    id: "it-audit-assessment",
    title: "IT Audit and Assessment",
    lessons: [
      {
        id: "introduction-it-audit",
        title: "Introduction to IT Auditing",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Introduction to IT Auditing

An **IT audit** independently evaluates whether technology systems, processes, and controls are designed and operating effectively, and whether they meet requirements.

## Types of audit

| Type | Performed by | Purpose |
| --- | --- | --- |
| **Internal audit** | The organization's own independent audit function | Assurance to management and the board |
| **External audit** | Independent firms | Financial statement audits, certifications (ISO 27001), attestations (SOC 2) |
| **Regulatory examination** | Regulators | Checking compliance with regulations |
| **Self-assessment** | Business or control owners | Preparing for audits and monitoring their own controls |

## Common audit areas

- **IT general controls (ITGCs):** access management, change management, IT operations, backups.
- Information security and cybersecurity programs.
- Application controls, such as input validation and approval workflows.
- Data privacy.
- Vendor management.
- Business continuity and disaster recovery.
- Increasingly, AI and model governance.

## The audit process

1. **Planning:** define scope, objectives, criteria, and timeline; understand the area and its risks.
2. **Fieldwork:** interview staff, review documents, observe processes, and test controls.
3. **Evaluation:** compare what was found with the criteria.
4. **Reporting:** document findings, risk ratings, and recommendations.
5. **Follow-up:** confirm that agreed actions were completed.

## Auditor independence

Auditors must be objective: they shouldn't audit work they designed or operate. Internal audit usually reports to the audit committee of the board, not to the managers it audits.

## Preparing for an audit

- Know which controls are in scope and who owns them.
- Keep evidence organized as you go, rather than gathering it at the last minute.
- Be honest about known gaps and remediation already underway.

## Key points

- IT audits provide independent assurance on technology controls and compliance.
- Audits follow planning, fieldwork, evaluation, reporting, and follow-up.
- Independence and organized evidence are essential.`,
          },
          {
            type: 'check',
            question: "Why does internal audit usually report to the board's audit committee?",
            options: [
              "To stay independent of the managers whose areas it audits",
              "Because external auditors require it to report to the IT department",
              "Because the audit committee performs the testing itself",
              "So audit findings can be hidden from management",
            ],
            answer: 0,
            explanation: "Reporting to the audit committee protects internal audit's independence and objectivity.",
          },
        ],
      },
      {
        id: "audit-evidence-testing",
        title: "Audit Evidence and Control Testing",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Audit Evidence and Control Testing

Auditors base their conclusions on **evidence**. Control testing checks whether controls are designed well and actually work.

## Types of evidence

| Type | Example | Strength |
| --- | --- | --- |
| **Inspection of documents** | Signed access review, change tickets | Good when records are complete |
| **System-generated reports** | User list exported from the identity system | Strong if the report's accuracy is verified |
| **Observation** | Watching a backup restore being performed | Shows the process at one moment |
| **Inquiry** | Interviewing the control owner | Weakest alone; must be corroborated |
| **Re-performance** | The auditor redoes the control, such as recalculating a reconciliation | Very strong |

Good evidence is **relevant, reliable, sufficient, and timely**. Evidence produced independently of the person being audited is generally more reliable.

## Testing design and operation

- **Design test (walkthrough):** follow one example end to end to confirm the control, as designed, would address the risk.
- **Operating effectiveness test:** select a **sample** across the review period and check the control worked each time.

Sample sizes depend on how often the control runs:

| Control frequency | Typical sample |
| --- | --- |
| Annual | 1 |
| Quarterly | 2 |
| Monthly | 2–5 |
| Weekly | 5–15 |
| Daily or many times a day | 20–40 |

Automated controls can often be tested once, plus checks that the system's configuration didn't change.

## Example: testing user offboarding

**Control:** accounts of departing employees are disabled within one business day.

1. Obtain the HR list of leavers for the period.
2. Select a sample of 25.
3. Compare each leaving date with the account-disabled date in the identity system.
4. Record exceptions, such as an account disabled six days late.

## Documenting work

Workpapers record what was tested, the sample, the evidence reviewed, the results, and the conclusion, so another auditor could reach the same conclusion.

## Key points

- Evidence includes documents, system reports, observation, inquiry, and re-performance.
- Test design with a walkthrough and operation with a sample across the period.
- Document testing clearly enough for others to rely on it.`,
          },
          {
            type: 'check',
            question: "Which type of audit evidence is weakest on its own?",
            options: [
              "Inspection of signed review records",
              "Inquiry, such as an interview with the control owner",
              "A system-generated report verified for accuracy",
              "Re-performance of the control by the auditor",
            ],
            answer: 1,
            explanation: "What someone says must be corroborated with documents, reports, or re-performance before it supports a conclusion.",
          },
        ],
      },
      {
        id: "audit-findings-remediation",
        title: "Audit Findings and Remediation",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Audit Findings and Remediation

An **audit finding** describes a weakness that needs attention. Clear findings lead to effective fixes.

## Elements of a well-written finding

| Element | Question | Example |
| --- | --- | --- |
| **Condition** | What did we find? | 6 of 25 sampled leavers kept active accounts for more than five days |
| **Criteria** | What should happen? | The access policy requires accounts to be disabled within one business day |
| **Cause** | Why did it happen? | HR notifications are emailed manually and sometimes missed |
| **Effect / risk** | Why does it matter? | Former employees could access confidential systems |
| **Recommendation** | What should change? | Automate account disabling from the HR system |

## Risk rating

Findings are rated, often **high, medium, or low**, based on the likelihood and impact of the underlying risk. Ratings drive priority and deadlines.

## Management response

The owner of the area responds with:

- Agreement or disagreement, with reasons.
- A **corrective action plan**: specific actions, an owner, and a target date.

Root-cause actions are better than one-off fixes. Disabling the six accounts fixes today's problem; automating the process prevents recurrence.

## Tracking and validation

1. Findings and actions are logged in an issue tracker or GRC platform.
2. Owners report progress; overdue actions are escalated.
3. When the owner says it's done, the auditor or second line **validates** with evidence before closing.

## Common pitfalls

- Vague findings ("access management needs improvement") that can't be acted on.
- Action plans without owners or dates.
- Closing findings without evidence.
- Repeating the same finding every year because the root cause was never fixed.

## Key points

- Findings state condition, criteria, cause, effect, and recommendation.
- Management agrees an action plan with an owner and date.
- Validate remediation with evidence before closing; fix root causes.`,
          },
          {
            type: 'check',
            question: "Which part of an audit finding explains why the problem occurred?",
            options: [
              "Recommendation",
              "Criteria",
              "Cause",
              "Condition",
            ],
            answer: 2,
            explanation: "The cause explains why the condition happened, which points to an action that prevents it from recurring.",
          },
        ],
      },
    ],
  },
  {
    id: "third-party-risk",
    title: "Third-Party and Vendor Risk Management",
    lessons: [
      {
        id: "understanding-vendor-risk",
        title: "Understanding Third-Party Risk",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Third-Party Risk

Organizations depend on external providers for cloud services, software, payroll, logistics, support, and more. **Third-party risk** is the risk that a provider's failure, breach, or misconduct harms your organization.

## Why it matters

- Vendors often hold or process your sensitive data.
- Outages at a key provider can stop your operations.
- Regulators and customers hold **you** accountable, even when a vendor caused the problem.
- Your vendors have vendors of their own (**fourth parties**), extending the chain.

## Types of third-party risk

| Risk | Example |
| --- | --- |
| Security | Vendor's breach exposes your customers' data |
| Operational | Payment processor outage halts sales |
| Compliance | Vendor processes personal data unlawfully |
| Financial | Key supplier goes bankrupt |
| Reputational | Vendor's unethical practices become public |
| Concentration | Many critical services rely on one cloud provider |
| Strategic | Vendor lock-in limits future choices |

## The third-party lifecycle

\`\`\`text
Plan → Due diligence → Contract → Onboard → Monitor → Offboard
\`\`\`

## Tiering vendors

Not every vendor needs the same scrutiny. Tier them by criticality and data sensitivity:

| Tier | Example | Oversight |
| --- | --- | --- |
| **Critical** | Cloud host for customer data | Full assessment, annual review, contractual audit rights |
| **High** | HR system with employee data | Detailed questionnaire and reports |
| **Moderate** | Marketing tool with limited data | Standard questionnaire |
| **Low** | Office supplies | Basic checks |

## AI vendors

AI services raise extra questions: is your data used to train models, where is it processed, how are outputs tested for errors and bias, and how quickly will the provider notify you of model changes?

## Key points

- Third-party risk is harm caused by vendors' failures, breaches, or misconduct.
- You remain accountable for outsourced activities.
- Tier vendors by criticality and data sensitivity to focus oversight.`,
          },
          {
            type: 'check',
            question: "Why do organizations tier their vendors?",
            options: [
              "To decide which vendors don't need contracts",
              "To give every vendor exactly the same assessment",
              "To transfer accountability for data breaches to vendors",
              "To apply more scrutiny to vendors that are critical or handle sensitive data",
            ],
            answer: 3,
            explanation: "Tiering focuses limited assessment effort where a vendor failure would cause the most harm.",
          },
        ],
      },
      {
        id: "vendor-due-diligence",
        title: "Vendor Due Diligence and Security Assessments",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Vendor Due Diligence and Security Assessments

**Due diligence** evaluates a provider before you sign, and again before renewing, so risks are understood while you can still negotiate or choose another vendor.

## What to assess

- **Security:** controls for access, encryption, vulnerability management, incident response.
- **Privacy:** what personal data is processed, where, for how long, and by whom.
- **Resilience:** backups, disaster recovery, uptime history.
- **Compliance:** certifications and legal obligations relevant to your sector.
- **Financial stability:** risk that the vendor fails.
- **Subcontractors:** fourth parties that will handle your data.
- **Reputation:** past breaches, litigation, or regulatory action.

## Sources of information

| Source | What it gives you |
| --- | --- |
| **Security questionnaires** | The vendor's own description of its controls (standard sets such as SIG or CAIQ save time) |
| **SOC 2 Type II report** | Independent testing of controls over a period |
| **ISO/IEC 27001 certificate** | Evidence of a certified security management system (check its scope) |
| **Penetration test summaries** | Results of independent security testing |
| **Policies and architecture documents** | How the service is actually built |
| **Public information** | Breach history, news, financial reports |

## Reviewing a SOC 2 report

- Is the **scope** the service you are buying?
- Does the period cover recent months?
- Are there **exceptions** in the test results, and how were they addressed?
- What **complementary user entity controls** must *you* perform, such as managing your own users' access?

## Outcomes

- Approve.
- Approve with conditions: contractual commitments or remediation by a date.
- Reject, or select another vendor.

Document the decision, residual risks, and who accepted them.

## Key points

- Assess security, privacy, resilience, compliance, finances, and subcontractors before contracting.
- Prefer independent evidence, such as SOC 2 Type II reports, over self-assessment alone.
- Check report scope, exceptions, and the controls you must operate yourself.`,
          },
          {
            type: 'check',
            question: "When reviewing a vendor's SOC 2 report, what should you confirm first?",
            options: [
              "That the report contains no complementary user entity controls",
              "That the report is longer than 50 pages",
              "That the vendor wrote the report itself",
              "That the report's scope covers the service you are buying",
            ],
            answer: 3,
            explanation: "A report about a different service or system doesn't give assurance about the one you depend on.",
          },
        ],
      },
      {
        id: "vendor-contract-monitoring",
        title: "Vendor Contracts and Ongoing Monitoring",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Vendor Contracts and Ongoing Monitoring

Risk management continues after signing. Contracts set enforceable expectations, and monitoring checks they are met.

## Contract provisions to include

| Provision | Purpose |
| --- | --- |
| **Security requirements** | Minimum controls the vendor must maintain |
| **Data protection terms** | Processing only on your instructions; data processing agreement where privacy law requires |
| **Breach notification** | The vendor must tell you promptly, for example within 24–72 hours |
| **Service levels (SLAs)** | Availability and response targets, with remedies if missed |
| **Right to audit / assurance** | Access to audit reports or the right to assess |
| **Subcontractor approval** | Notice or consent before new fourth parties handle your data |
| **Data location** | Where data may be stored and processed |
| **Termination and exit** | Return or deletion of data, transition support |
| **Liability and insurance** | Financial responsibility for failures |

## Ongoing monitoring

- **Periodic reassessments**, more frequent for critical vendors.
- **Performance reviews** against SLAs.
- **Updated assurance reports**, such as each year's SOC 2.
- **External signals:** breach news, financial warnings, security ratings.
- **Change notifications:** new subcontractors, locations, or major product changes.
- **Issue tracking:** remediation commitments followed up until closed.

## Offboarding

When a relationship ends:

1. Revoke the vendor's access to your systems and facilities.
2. Retrieve your data in a usable format.
3. Obtain written confirmation that remaining copies are securely deleted.
4. Update the vendor inventory and close related risks.

Poor offboarding leaves forgotten accounts and data copies that can be breached years later.

## Key points

- Contracts should cover security, data protection, notification, SLAs, audit rights, subcontractors, and exit.
- Monitor critical vendors continuously, not only at renewal.
- Offboard completely: remove access and confirm data deletion.`,
          },
          {
            type: 'check',
            question: "Which contract clause ensures you learn quickly about a security incident at the vendor?",
            options: [
              "A clause about the vendor's office locations",
              "A clause allowing price increases each year",
              "A breach notification requirement with a defined time limit",
              "A service level agreement for help-desk response",
            ],
            answer: 2,
            explanation: "A breach notification clause obliges the vendor to inform you within a set time so you can respond and meet your own obligations.",
          },
        ],
      },
    ],
  },
  {
    id: "business-continuity-disaster-recovery",
    title: "Business Continuity and Disaster Recovery",
    lessons: [
      {
        id: "business-continuity-fundamentals",
        title: "Understanding Business Continuity",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Business Continuity

**Business continuity management (BCM)** helps an organization keep delivering its most important products and services during and after a disruption.

## Disruptions to plan for

- Cyberattacks such as ransomware.
- Technology failures and cloud outages.
- Loss of a building through fire, flood, or power failure.
- Pandemics and staff shortages.
- Supplier failures.
- Natural disasters.

Plan around **impacts** (loss of systems, people, premises, suppliers) rather than every possible cause, so plans work for unexpected events too.

## BCM components

| Component | Purpose |
| --- | --- |
| **Business impact analysis (BIA)** | Identify critical processes and how quickly they must recover |
| **Risk assessment** | Understand threats to those processes |
| **Continuity strategies** | Decide how to keep going, such as alternate sites or manual workarounds |
| **Business continuity plans** | Documented steps, roles, and contacts for responding |
| **Disaster recovery plans** | Restoring IT systems and data |
| **Crisis management** | Leadership decisions and communication during a major incident |
| **Testing and exercises** | Prove plans work and train people |
| **Maintenance** | Keep plans current as the business changes |

## Business continuity versus disaster recovery

- **Business continuity** keeps the *business* operating: people, processes, premises, suppliers, communications.
- **Disaster recovery** restores *technology*: systems, infrastructure, and data.

DR is one part of BCM.

## Communication

During a crisis, people need clear, timely information. Prepare contact lists, alternative channels (if email is down), message templates, and named spokespeople for customers, staff, regulators, and media.

## Standards

ISO 22301 specifies requirements for a business continuity management system and can be certified.

## Key points

- BCM keeps critical services running during disruptions.
- Plan for impacts, not just specific causes.
- Disaster recovery restores technology and is one part of business continuity.`,
          },
          {
            type: 'check',
            question: "What is the difference between business continuity and disaster recovery?",
            options: [
              "Disaster recovery covers people and premises; business continuity covers only IT",
              "Business continuity keeps the business operating; disaster recovery restores technology and data",
              "They are the same activity with different names",
              "Business continuity applies only to natural disasters",
            ],
            answer: 1,
            explanation: "Disaster recovery focuses on IT systems and data, as one part of the broader business continuity program.",
          },
        ],
      },
      {
        id: "business-impact-analysis",
        title: "Business Impact Analysis and Recovery Objectives",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Business Impact Analysis and Recovery Objectives

A **business impact analysis (BIA)** identifies critical business processes and measures how a disruption would affect them over time. It sets recovery priorities.

## Conducting a BIA

1. List business processes and their owners.
2. For each, estimate impacts over time if it stops: after 1 hour, 1 day, 1 week.
3. Consider financial, customer, legal, regulatory, safety, and reputational impacts.
4. Identify dependencies: systems, data, people, suppliers, facilities.
5. Set recovery objectives and priorities.

## Recovery objectives

| Term | Meaning | Example |
| --- | --- | --- |
| **RTO** (recovery time objective) | Maximum acceptable time to restore the process or system | Payments must be restored within 4 hours |
| **RPO** (recovery point objective) | Maximum acceptable data loss, measured in time | No more than 15 minutes of transactions may be lost |
| **MTPD** (maximum tolerable period of disruption) | The point at which impact becomes unacceptable to the organization | After 2 days, regulatory and customer impacts are severe |

RTO must be shorter than MTPD. RPO drives backup and replication frequency: an RPO of 15 minutes can't be met with nightly backups.

## Example

| Process | Impact after 1 day | RTO | RPO | Key dependencies |
| --- | --- | --- | --- | --- |
| Online payments | Severe: lost revenue, contractual penalties | 4 hours | 15 minutes | Payment platform, database, payment provider |
| Payroll | Moderate until payday, then severe | 2 days | 24 hours | HR system, bank interface |
| Internal newsletter | Minimal | 2 weeks | 1 week | Content system |

## Using the results

- Prioritize recovery: payments before payroll before the newsletter.
- Choose technology to meet objectives: real-time replication for payments; daily backups for the newsletter.
- Find gaps: if a process needs a 4-hour RTO but its system takes 2 days to rebuild, invest or change the objective.

## Key points

- A BIA measures how disruption impacts each process over time and identifies dependencies.
- RTO limits downtime; RPO limits data loss; both must fit within the maximum tolerable disruption.
- BIA results set recovery priorities and technology investments.`,
          },
          {
            type: 'check',
            question: "A process can lose no more than 15 minutes of data. Which objective expresses this?",
            options: [
              "Service level agreement (SLA)",
              "Recovery time objective (RTO)",
              "Maximum tolerable period of disruption (MTPD)",
              "Recovery point objective (RPO)",
            ],
            answer: 3,
            explanation: "RPO defines the maximum acceptable data loss measured in time, which drives backup and replication frequency.",
          },
        ],
      },
      {
        id: "disaster-recovery-testing",
        title: "Disaster Recovery Planning and Testing",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Disaster Recovery Planning and Testing

**Disaster recovery (DR)** restores technology systems, infrastructure, and data after a disruption, within the RTOs and RPOs set by the business impact analysis.

## DR strategies

| Strategy | Description | Recovery speed | Cost |
| --- | --- | --- | --- |
| **Backup and restore** | Restore from backups onto new infrastructure | Hours to days | Low |
| **Pilot light** | Minimal core systems always running in a second location, scaled up when needed | Hours | Moderate |
| **Warm standby** | A scaled-down but working copy ready to take over | Minutes to hours | Higher |
| **Active-active** | Two or more locations serving traffic all the time | Near zero | Highest |

Match the strategy to each system's RTO and RPO; not everything needs active-active.

## Backups

- Follow the **3-2-1 rule**: three copies of data, on two different media, with one offsite.
- Keep at least one copy **immutable or offline**, so ransomware can't encrypt or delete it.
- Encrypt backups and protect access to them.
- Regularly test that backups can actually be restored.

## The DR plan

A usable plan includes:

- Systems in scope, with recovery order and dependencies.
- Roles, contact details, and decision authority to declare a disaster.
- Step-by-step recovery procedures.
- Where credentials and documentation are kept if normal systems are down.
- Communication steps.

## Testing

| Test type | What happens |
| --- | --- |
| **Plan review** | Owners read the plan and correct errors |
| **Tabletop exercise** | The team talks through a scenario step by step |
| **Simulation / partial test** | Restore selected systems in an isolated environment |
| **Full failover** | Switch production to the recovery environment |

After each test, record what worked, what failed, and actual recovery times, then fix the gaps.

## Key points

- Choose DR strategies that meet each system's RTO and RPO.
- Keep immutable or offline backups and test restores regularly.
- Exercise plans, from tabletops to full failovers, and act on lessons learned.`,
          },
          {
            type: 'check',
            question: "Why should at least one backup copy be immutable or offline?",
            options: [
              "So ransomware or an attacker can't encrypt or delete every copy",
              "Because online backups cannot be encrypted",
              "So restores happen faster than from other copies",
              "So backups take less storage space",
            ],
            answer: 0,
            explanation: "Attackers often target backups. An immutable or offline copy survives even if online systems and backups are compromised.",
          },
        ],
      },
    ],
  },
  {
    id: "grc-technology-automation",
    title: "GRC Technology and Automation",
    lessons: [
      {
        id: "grc-platforms",
        title: "Introduction to GRC Platforms",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Introduction to GRC Platforms

As programs grow, spreadsheets become hard to keep consistent. **GRC platforms** centralize risks, controls, policies, audits, vendors, and issues in one system.

## Typical modules

| Module | What it manages |
| --- | --- |
| Risk management | Risk register, assessments, treatment plans |
| Policy management | Policies, reviews, approvals, attestations |
| Compliance management | Obligations, framework mappings, control testing |
| Audit management | Audit plans, workpapers, findings |
| Third-party risk | Vendor inventory, questionnaires, assessments |
| Issue management | Findings and remediation actions from all sources |
| Business continuity | BIAs, plans, test results |

## Examples

ServiceNow Integrated Risk Management, Archer, MetricStream, OneTrust, AuditBoard, and Microsoft Purview Compliance Manager are among the widely used products. Choices depend on size, existing systems, and which modules matter most.

## Benefits

- **One source of truth** linking risks, controls, policies, and evidence.
- **Reuse:** test a control once and map the result to several frameworks.
- **Workflow:** reminders, approvals, and escalations happen automatically.
- **Reporting:** dashboards from live data instead of manual compilation.
- **Audit trail:** who changed what, and when.

## Implementation tips

1. Start with clear processes; a tool won't fix an undefined process.
2. Begin with one or two modules, such as risk and issues, then expand.
3. Clean and standardize data before migration.
4. Integrate with source systems (HR, identity, ticketing, asset inventory) to reduce manual entry.
5. Train users and assign data owners.

## Spreadsheets still have a place

Small organizations can run effective GRC with well-structured spreadsheets and shared documents. Move to a platform when volume, collaboration, or audit demands make spreadsheets unreliable.

## Key points

- GRC platforms centralize risks, controls, policies, audits, vendors, and issues.
- They enable reuse, automated workflow, live reporting, and audit trails.
- Define processes first and implement in phases.`,
          },
          {
            type: 'check',
            question: "What should an organization do before implementing a GRC platform?",
            options: [
              "Delete all existing risk and control records",
              "Define and standardize its GRC processes and data",
              "Buy every available module at once",
              "Stop performing risk assessments until the tool is live",
            ],
            answer: 1,
            explanation: "A platform automates processes. If they aren't defined and the data isn't clean, the tool will only automate confusion.",
          },
        ],
      },
      {
        id: "grc-workflows-automation",
        title: "GRC Workflows and Automation",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# GRC Workflows and Automation

Automation makes GRC processes consistent, faster, and easier to evidence, and frees people for judgment-based work.

## Common automated workflows

| Workflow | Automation |
| --- | --- |
| **Risk assessments** | Scheduled assessment tasks sent to risk owners; scores calculated; high risks escalated |
| **Policy reviews** | Reminders before review dates; approval routing; employee acknowledgement tracking |
| **Control testing** | Test tasks assigned by schedule; evidence requested and stored with the test |
| **Access reviews** | Managers receive their team's access lists; removals become tickets automatically |
| **Vendor assessments** | Questionnaires sent at onboarding and renewal; responses scored; follow-ups tracked |
| **Issue management** | Overdue actions escalated to managers and committees |
| **Exceptions** | Approval routing and automatic expiry reminders |

## Continuous control monitoring

Some controls can be checked automatically and continuously instead of sampled once a year:

- Is multi-factor authentication enabled for every account?
- Are all laptops encrypted and patched?
- Are any cloud storage buckets publicly accessible?
- Were any administrator accounts created without an approved ticket?

Results feed dashboards and raise issues the moment a control fails.

## Integrations

Automation depends on data from other systems: HR (joiners and leavers), identity management, configuration and asset inventories, ticketing, cloud security tools, and vulnerability scanners.

## Using AI carefully

AI can help draft policy text, map controls to frameworks, summarize vendor questionnaire answers, or suggest risk descriptions. Keep humans accountable for decisions, review AI output, and avoid sending confidential data to unapproved services.

## Designing a workflow

1. Map the current process and its pain points.
2. Define triggers, steps, approvers, and deadlines.
3. Decide what evidence is captured automatically.
4. Add escalation for overdue tasks.
5. Measure cycle times and adjust.

## Key points

- Automate routine GRC steps: scheduling, routing, reminders, escalation, and evidence capture.
- Continuous control monitoring checks controls in near real time.
- AI can assist, but people remain accountable for GRC decisions.`,
          },
          {
            type: 'check',
            question: "What is a benefit of continuous control monitoring?",
            options: [
              "Control failures are detected as they happen instead of at the next annual test",
              "It removes the need for any human judgment in GRC",
              "It replaces the need for policies",
              "It only checks controls once per year, with less effort",
            ],
            answer: 0,
            explanation: "Continuous monitoring checks controls automatically and often, so failures are found and fixed quickly.",
          },
        ],
      },
      {
        id: "grc-metrics-reporting",
        title: "GRC Metrics, Dashboards, and Reporting",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# GRC Metrics, Dashboards, and Reporting

Reporting helps leaders understand risk exposure, control performance, and compliance status, so they can make decisions.

## Useful metrics

| Area | Example metrics |
| --- | --- |
| **Risk** | Number of high risks; risks outside appetite; risks with overdue treatment plans |
| **Controls** | Percentage of controls tested; percentage operating effectively; failed control trend |
| **Issues** | Open findings by rating; overdue actions; average time to close |
| **Compliance** | Obligations with gaps; policy acknowledgement rate; training completion |
| **Third parties** | Critical vendors assessed on time; vendors with open high-risk issues |
| **Resilience** | Plans tested this year; actual versus target recovery times |

## Leading and lagging indicators

- **Lagging** indicators show what already happened: incidents, audit findings, losses.
- **Leading** indicators warn of rising risk: overdue patches, growing numbers of exceptions, falling training completion.

Good dashboards include both. **Key risk indicators (KRIs)** are leading indicators with thresholds that trigger action:

> KRI: critical vulnerabilities older than 30 days. Green: 0–5. Amber: 6–15. Red: over 15, escalate to the risk committee.

## Reporting for different audiences

| Audience | Needs |
| --- | --- |
| Board | Top risks, trends, risk appetite breaches, major incidents; one or two pages |
| Executives | Risks and issues by business area; decisions needed |
| Risk and control owners | Detailed task lists, due dates, test results |
| Regulators and customers | Specific evidence of compliance |

## Good reporting practice

- Show **trends**, not just snapshots.
- Explain *so what*: what the numbers mean and what decision is needed.
- Use consistent definitions so periods can be compared.
- Avoid "watermelon" reports: green on the outside, red inside. Report problems honestly.

## Key points

- Track risk, control, issue, compliance, vendor, and resilience metrics.
- Combine lagging indicators with leading KRIs that have thresholds.
- Tailor reports to the audience and highlight trends and decisions.`,
          },
          {
            type: 'check',
            question: "Which is an example of a leading key risk indicator?",
            options: [
              "The number of data breaches that occurred last year",
              "Total losses from fraud in the previous quarter",
              "The number of audit findings closed last year",
              "The number of critical vulnerabilities left unpatched for more than 30 days",
            ],
            answer: 3,
            explanation: "Unpatched critical vulnerabilities signal rising risk before an incident happens. The others describe what has already occurred.",
          },
        ],
      },
    ],
  },
  {
    id: "practical-grc-project",
    title: "Practical GRC Project and Final Assessment",
    lessons: [
      {
        id: "building-a-risk-register",
        title: "Practical Project: Building a Risk Register",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Practical Project: Building a Risk Register

A **risk register** records identified risks with their ratings, owners, and treatments. In this project you build one for a fictional organization.

## Scenario

**Northwind Learning** runs an online learning platform with 40,000 students. It stores names, emails, and payment references, uses a cloud provider and an external payment processor, and recently added an AI tutoring assistant.

## Register columns

| Column | Purpose |
| --- | --- |
| ID | Unique reference, such as R-001 |
| Risk description | Cause → event → consequence |
| Category | Cyber, operational, compliance, third-party… |
| Owner | Accountable person |
| Inherent likelihood and impact | Ratings before controls |
| Existing controls | What already reduces the risk |
| Residual likelihood, impact, score | Ratings after controls |
| Treatment | Mitigate, transfer, avoid, accept |
| Actions, owner, due date | Planned improvements |
| Status and review date | Tracking |

## Sample entries

| ID | Risk | Owner | Residual L × I | Score | Treatment and action |
| --- | --- | --- | --- | --- | --- |
| R-001 | Because staff reuse passwords, attackers could take over admin accounts, exposing student data and causing regulatory penalties | CTO | 3 × 5 | 15 High | Mitigate: enforce MFA for all admin accounts by 30 June |
| R-002 | Because the payment processor is a single provider, an outage would stop enrolments, losing revenue | Finance director | 2 × 4 | 8 Medium | Accept with monitoring; review alternatives at renewal |
| R-003 | Because the AI tutor may give incorrect answers, students could be misled, damaging trust | Head of learning | 3 × 3 | 9 Medium | Mitigate: ground answers in course content; add feedback button; monthly quality review |
| R-004 | Because backups aren't tested, data may not be recoverable after ransomware, causing a long outage | IT manager | 3 × 5 | 15 High | Mitigate: quarterly restore tests; immutable backup copy |

## Your task

1. Add three more risks: one compliance, one third-party, one people-related.
2. Rate each using the 1–5 scales from the risk assessment lesson.
3. Propose a treatment with an owner and date.
4. Identify which risks exceed an appetite threshold of 12 and need committee attention.

## Key points

- A risk register links each risk to ratings, owners, controls, and actions.
- Write risks as cause, event, and consequence.
- Use residual scores against the risk appetite to prioritize.`,
          },
          {
            type: 'check',
            question: "In the sample register, which risks exceed a risk appetite threshold of 12?",
            options: [
              "R-001 and R-004, each with a score of 15",
              "Only R-003",
              "All four risks",
              "R-002 and R-003",
            ],
            answer: 0,
            explanation: "R-001 and R-004 score 15; R-002 scores 8 and R-003 scores 9, which are within the threshold.",
          },
        ],
      },
      {
        id: "building-a-control-matrix",
        title: "Practical Project: Building a Risk and Control Matrix",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Practical Project: Building a Risk and Control Matrix

A **risk and control matrix (RCM)** connects each risk to the controls that address it, and records how each control is tested. Auditors and control owners rely on it.

## RCM columns

| Column | Example |
| --- | --- |
| Risk ID and description | R-001 Admin account takeover |
| Control ID | C-010 |
| Control description | MFA is enforced for all administrator accounts in the identity provider |
| Control owner | Identity and access manager |
| Type | Preventive, automated |
| Frequency | Continuous |
| Framework mapping | ISO/IEC 27001 A.8.5; NIST CSF PR.AA |
| Evidence | Identity provider policy configuration; list of admin accounts with MFA status |
| Test procedure | Inspect the policy; compare all admin accounts against MFA enrollment |
| Last test result | Effective (12 of 12 accounts) |

## Sample matrix for Northwind Learning

| Risk | Control | Type / frequency | Owner | Test |
| --- | --- | --- | --- | --- |
| R-001 Admin takeover | C-010 MFA for admins | Preventive, automated, continuous | IAM manager | Inspect config and account list |
| R-001 Admin takeover | C-011 Quarterly privileged access review | Detective, manual, quarterly | CTO | Sample 2 quarters; confirm removals done |
| R-003 AI tutor errors | C-030 Answers grounded in approved course content | Preventive, automated | Head of learning | Review configuration; sample 25 answers for sources |
| R-003 AI tutor errors | C-031 Monthly review of flagged answers | Detective, manual, monthly | Learning quality lead | Sample 3 months of review records |
| R-004 Backup failure | C-040 Quarterly restore test | Detective/corrective, manual, quarterly | IT manager | Inspect 2 restore test reports |

One risk can have several controls (defense in depth), and one control can address several risks.

## Your task

1. Add at least one control for each risk you added to your risk register.
2. Classify each control by type and frequency.
3. Write a test procedure and identify the evidence.
4. Map two controls to a framework you studied, such as the CIS Controls.

## Checking coverage

- Every high risk should have at least one preventive **and** one detective control.
- Every control should have an owner and evidence.
- Controls without a linked risk may be unnecessary.

## Key points

- An RCM links risks to controls, owners, frequencies, evidence, tests, and framework mappings.
- Combine preventive and detective controls for important risks.
- Use the matrix to check coverage and plan testing.`,
          },
          {
            type: 'check',
            question: "What does a risk and control matrix connect?",
            options: [
              "Risks with the controls that address them, plus how those controls are tested",
              "Employees with their salaries and job titles",
              "Vendors with their invoice amounts",
              "Policies with the dates they were printed",
            ],
            answer: 0,
            explanation: "The RCM maps each risk to its controls, owners, evidence, and test procedures, which supports both management and audit.",
          },
        ],
      },
      {
        id: "final-grc-assessment",
        title: "Final Assessment: GRC Fundamentals",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Final Assessment: GRC Fundamentals

Congratulations on completing GRC Fundamentals. Use this review to confirm you can explain and apply each topic.

## Concept review

| Topic | You should be able to |
| --- | --- |
| **GRC** | Explain how governance, risk, and compliance connect |
| **Governance** | Describe principles, committees, risk appetite, and the three lines model |
| **Risk** | Assess likelihood and impact; choose mitigate, transfer, avoid, or accept |
| **Compliance** | Identify obligations; map them to controls and evidence |
| **Frameworks** | Distinguish NIST CSF, SP 800-53, ISO/IEC 27001, ISO 31000, CIS Controls, COBIT, SOC 2 |
| **Controls** | Classify by purpose and implementation; test design and operation |
| **Policies** | Separate policies, standards, procedures, guidelines; manage the lifecycle and exceptions |
| **Audit** | Gather evidence, sample, and write findings with condition, criteria, cause, effect |
| **Third parties** | Tier vendors, perform due diligence, contract, monitor, offboard |
| **Continuity** | Run a BIA; set RTO and RPO; test disaster recovery |
| **Technology** | Use GRC platforms, automation, and metrics effectively |

## Distinctions that are often confused

- **Risk management** handles uncertainty; **compliance** handles required obligations. Compliant doesn't mean secure.
- **Transfer** shifts cost, not accountability.
- **RTO** limits downtime; **RPO** limits data loss.
- **Type I** SOC 2 covers design at a point in time; **Type II** covers operation over a period.
- A **policy** says what and why; a **procedure** says how.

## Scenario practice

1. A business unit wants to use a new AI writing tool with customer data. Which steps would you take? *(Vendor due diligence, data protection review, risk assessment, acceptable-use rules, approval by the right governance body.)*
2. An audit finds six leavers kept access for a week. Write the finding. *(Condition, criteria, cause, effect, recommendation.)*
3. Payments must be back within four hours with no more than 15 minutes of lost data. Which objectives are these? *(RTO 4 hours, RPO 15 minutes.)*

## Key points

- GRC connects objectives, risks, controls, policies, and evidence.
- Apply the frameworks and methods to real scenarios, not just definitions.`,
          },
          {
            type: 'check',
            question: "Which statement correctly distinguishes risk management from compliance?",
            options: [
              "Compliance handles uncertainty; risk management handles required obligations",
              "Being compliant means all of an organization's risks are managed",
              "Risk management handles uncertainty; compliance handles required obligations",
              "Risk management applies only to finance, and compliance only to IT",
            ],
            answer: 2,
            explanation: "Risk management deals with what might happen and how to respond. Compliance deals with meeting requirements that apply.",
          },
        ],
      },
    ],
  },
];

runCourseSeed({ course: COURSE, modules: MODULES, script: 'scripts/grc/seed-grc-fundamentals.mjs' }).catch((error) => {
  console.error('\nSEED FAILED:', error);
  process.exit(1);
});
