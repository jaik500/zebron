/**
 * ZEBRON COURSE SEED
 * Course: GRC Fundamentals
 * Full title: Governance, Risk, and Compliance Fundamentals
 * Language: English
 * Audience: Cybersecurity, IT Audit, Risk and Compliance learners
 *
 * Dry run:
 * node scripts/grc/seed-grc-fundamentals.mjs
 *
 * Apply:
 * node scripts/grc/seed-grc-fundamentals.mjs --apply
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";

import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";

const COURSE_ID = "grc-fundamentals";

const APPLY = process.argv.includes("--apply");
const OVERWRITE = process.argv.includes("--overwrite");

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

// ================================================
// LESSON HELPERS
// ================================================

const text = (value) => ({
  type: "text",
  text: value.trim(),
});

const check = (question, options, answer, explanation) => ({
  type: "check",
  question,
  options,
  answer,
  explanation,
});

const lesson = (
  id,
  title,
  minutes,
  content,
  question,
  options,
  answer,
  explanation
) => ({
  id,
  title,
  minutes,
  blocks: [
    text(content),
    check(question, options, answer, explanation),
  ],
});

const moduleData = (id, title, lessons) => ({
  id,
  title,
  lessons,
});

// ================================================
// COURSE MODULES
// ================================================

const MODULES = [];

// ================================================
// MODULE 1 — INTRODUCTION TO GRC
// ================================================

MODULES.push(
  moduleData(
    "introduction-to-grc",
    "Introduction to GRC",
    [
      lesson(
        "understanding-grc",
        "Understanding Governance, Risk, and Compliance",
        12,
        `
GRC stands for Governance, Risk, and Compliance.

It is an integrated approach organizations use to manage
their operations, uncertainty, and regulatory obligations.

The three components are:

Governance:
The structures, policies, responsibilities, and processes
used to direct and control an organization.

Risk Management:
The process of identifying, evaluating, treating,
and monitoring risks that could affect objectives.

Compliance:
The process of meeting applicable laws, regulations,
contractual obligations, and internal requirements.

Example:

A financial institution must protect customer information.

Governance establishes who is responsible for security.

Risk management identifies threats such as unauthorized access.

Compliance ensures that applicable regulatory requirements
and contractual obligations are addressed.

GRC helps organizations make informed decisions
and maintain accountability.
        `,
        "What does GRC stand for?",
        [
          "Governance, Risk, and Compliance",
          "General Risk and Cybersecurity",
          "Governance, Recovery, and Controls",
          "Global Regulations and Certification"
        ],
        0,
        "GRC stands for Governance, Risk, and Compliance."
      ),

      lesson(
        "importance-of-grc",
        "Why GRC Matters to Organizations",
        12,
        `
Organizations operate in environments where they face
operational, financial, technological, legal, and security risks.

GRC helps organizations:

- Establish accountability.
- Protect information and business assets.
- Identify and manage risks.
- Meet regulatory obligations.
- Improve decision-making.
- Demonstrate responsible business practices.

Consider a healthcare organization.

It stores sensitive patient information and depends
on technology to deliver services.

Without appropriate governance and controls,
the organization could experience data breaches,
service interruptions, regulatory penalties,
and reputational damage.

GRC connects business objectives with risk management
and compliance activities.

It is not only an IT responsibility.
It involves leadership, legal teams, finance,
operations, security, and other business functions.
        `,
        "Which statement best describes the purpose of GRC?",
        [
          "To eliminate every business risk",
          "To integrate governance, risk management, and compliance",
          "To replace all cybersecurity technologies",
          "To focus only on regulatory audits"
        ],
        1,
        "GRC integrates governance, risk management, and compliance across an organization."
      ),

      lesson(
        "grc-roles-responsibilities",
        "GRC Roles and Responsibilities",
        12,
        `
GRC requires participation from different organizational roles.

Board of Directors:
Provides oversight and evaluates significant organizational risks.

Executive Leadership:
Establishes strategic direction and supports accountability.

Chief Information Security Officer (CISO):
Oversees information security strategy and security risk.

GRC Analyst:
Supports risk assessments, control documentation,
compliance monitoring, and reporting.

Internal Auditor:
Independently evaluates governance, risk management,
and internal controls.

System Owner:
Is responsible for a particular system and its operational
and security requirements.

Control Owner:
Is responsible for implementing and maintaining
a specific control.

These responsibilities should be clearly documented.

An effective GRC program defines who makes decisions,
who performs activities, and who verifies results.
        `,
        "Who typically performs independent evaluations of internal controls?",
        [
          "System administrator",
          "Internal auditor",
          "End user",
          "Software developer"
        ],
        1,
        "Internal auditors independently evaluate controls and organizational processes."
      ),
    ]
  )
);

// ================================================
// MODULE 2 — GOVERNANCE FUNDAMENTALS
// ================================================

MODULES.push(
  moduleData(
    "governance-fundamentals",
    "Governance Fundamentals",
    [
      lesson(
        "principles-of-governance",
        "Principles of Organizational Governance",
        12,
        `
Governance establishes how an organization is directed,
managed, and held accountable.

Important governance principles include:

Accountability:
People and teams are responsible for their decisions
and assigned activities.

Transparency:
Relevant information is communicated clearly
to appropriate stakeholders.

Responsibility:
Individuals understand their duties and obligations.

Fairness:
Decisions and processes should be applied consistently.

Oversight:
Leadership monitors organizational performance
and significant risks.

Example:

An organization creates an information security committee.

The committee reviews security risks, approves strategic
priorities, and monitors the organization's security posture.

This creates a formal governance structure
for security decisions.
        `,
        "Which governance principle ensures that individuals are responsible for their decisions?",
        [
          "Accountability",
          "Encryption",
          "Availability",
          "Authentication"
        ],
        0,
        "Accountability means individuals and teams are responsible for their decisions and actions."
      ),

      lesson(
        "grc-committees",
        "GRC Committees and Organizational Oversight",
        12,
        `
Organizations often establish committees to coordinate
governance, risk, and compliance activities.

Examples include:

Risk Management Committee:
Reviews significant organizational risks and treatment plans.

Information Security Steering Committee:
Oversees information security strategy and priorities.

Audit Committee:
Provides oversight of financial reporting,
internal controls, and audit activities.

Compliance Committee:
Monitors regulatory obligations and compliance programs.

A committee typically has:

- A defined purpose.
- Assigned members.
- Decision-making responsibilities.
- Meeting schedules.
- Documented decisions.
- Action items and owners.

Example:

An Information Security Steering Committee meets monthly
to review security incidents, open risks, audit findings,
and major technology initiatives.
        `,
        "What is a primary purpose of an Information Security Steering Committee?",
        [
          "To write application code",
          "To oversee information security strategy and priorities",
          "To replace the organization's auditors",
          "To approve employee vacation requests"
        ],
        1,
        "The committee provides oversight and direction for information security activities."
      ),

      lesson(
        "governance-policies",
        "Governance Policies and Accountability",
        12,
        `
Governance policies establish high-level expectations
for how an organization operates.

Examples include:

- Information Security Policy.
- Acceptable Use Policy.
- Data Protection Policy.
- Access Control Policy.
- Risk Management Policy.
- Vendor Management Policy.

Policies should identify:

- Purpose and scope.
- Roles and responsibilities.
- Management expectations.
- Approval authority.
- Review frequency.
- Exceptions and enforcement.

Example:

An Access Control Policy may require employees
to receive only the permissions necessary
to perform their job responsibilities.

This supports the principle of least privilege.

Policies provide direction, while standards,
procedures, and technical controls explain
how requirements are implemented.
        `,
        "Which document normally establishes high-level organizational security expectations?",
        [
          "Security policy",
          "Incident ticket",
          "Daily activity log",
          "Software installation guide"
        ],
        0,
        "A security policy establishes management expectations and organizational requirements."
      ),
    ]
  )
);

// ================================================
// MODULE 3 — RISK MANAGEMENT FUNDAMENTALS
// ================================================

MODULES.push(
  moduleData(
    "risk-management",
    "Risk Management Fundamentals",
    [
      lesson(
        "understanding-risk",
        "Understanding Risk, Threats, and Vulnerabilities",
        14,
        `
Risk is the possibility that an event will negatively
or positively affect an organization's objectives.

A threat is a potential cause of harm.

Examples:

- Cybercriminals.
- Malware.
- Insider threats.
- Natural disasters.
- Human error.

A vulnerability is a weakness that could be exploited.

Examples:

- Unpatched software.
- Weak passwords.
- Excessive user permissions.
- Misconfigured cloud storage.

An asset is something valuable to an organization.

Examples:

- Customer information.
- Applications.
- Servers.
- Financial records.
- Intellectual property.

Example:

A company operates an internet-facing application.

Threat:
An attacker attempts to exploit the application.

Vulnerability:
The application contains an unpatched software weakness.

Asset:
The application stores customer information.

Risk:
The weakness could be exploited, resulting in unauthorized
access to customer information.

Understanding these terms is essential for performing
a meaningful risk assessment.
        `,
        "What is a vulnerability?",
        [
          "A valuable organizational asset",
          "A weakness that could be exploited",
          "A completed security audit",
          "A regulatory requirement"
        ],
        1,
        "A vulnerability is a weakness that a threat could exploit."
      ),

      lesson(
        "risk-assessment",
        "Risk Identification and Assessment",
        15,
        `
A risk assessment helps an organization understand
the risks that could affect its objectives.

A typical assessment includes:

1. Identify assets and business processes.
2. Identify relevant threats.
3. Identify vulnerabilities.
4. Evaluate existing controls.
5. Estimate likelihood.
6. Estimate impact.
7. Determine the risk level.
8. Document the results.

Likelihood describes how probable an event is.

Impact describes the potential consequences.

A simple qualitative risk matrix may use:

Likelihood:
Low, Medium, High.

Impact:
Low, Medium, High.

Example:

An unpatched public-facing server may have:

Likelihood: High
Impact: High

This could result in a high risk rating.

Organizations should define their own assessment
criteria and risk rating methodology.

A risk assessment is not a guarantee that incidents
will not occur. It supports informed decisions.
        `,
        "What does impact measure during a risk assessment?",
        [
          "How frequently an employee logs in",
          "The potential consequences of a risk event",
          "The number of policies in an organization",
          "The age of a computer"
        ],
        1,
        "Impact measures the potential consequences if a risk event occurs."
      ),

      lesson(
        "risk-treatment",
        "Risk Treatment and Risk Response",
        14,
        `
After assessing a risk, an organization decides
how it will respond.

Common risk treatment options include:

Mitigate:
Implement controls to reduce likelihood or impact.

Avoid:
Stop the activity that creates the risk.

Transfer:
Shift some financial or contractual consequences
to another party, such as through insurance.

Accept:
Formally acknowledge the risk and retain it
within approved risk tolerance.

Example:

An organization discovers that an application
uses outdated software.

Mitigation:
Apply security patches and strengthen monitoring.

Avoidance:
Retire the application.

Transfer:
Use contractual arrangements or insurance
to address certain financial consequences.

Acceptance:
Document the risk and obtain approval
from the authorized risk owner.

Risk acceptance should be documented and reviewed.
        `,
        "Which risk treatment option involves formally retaining a risk?",
        [
          "Avoid",
          "Mitigate",
          "Accept",
          "Transfer"
        ],
        2,
        "Risk acceptance means the organization knowingly retains the risk through an authorized decision."
      ),
    ]
  )
);

// ================================================
// MODULE 4 — COMPLIANCE AND REGULATORY FRAMEWORKS
// ================================================

MODULES.push(
  moduleData(
    "compliance-frameworks",
    "Compliance and Regulatory Frameworks",
    [
      lesson(
        "understanding-compliance",
        "Understanding Regulatory Compliance",
        12,
        `
Compliance means meeting applicable requirements.

These requirements may come from:

Laws:
Legal obligations established by governments.

Regulations:
Requirements issued by regulatory authorities.

Contracts:
Obligations agreed to between organizations.

Industry Standards:
Published requirements or practices used
within a particular industry.

Internal Policies:
Rules established by the organization itself.

Examples:

A healthcare organization may need to address HIPAA
requirements.

An organization processing payment card information
may need to address PCI DSS.

An organization handling personal data of individuals
in the European Union may have GDPR obligations.

Compliance obligations depend on the organization's
activities, location, data, contracts, and applicable laws.

A GRC professional must identify which requirements
actually apply to the organization.
        `,
        "Which framework is specifically associated with protecting health information in the United States?",
        [
          "HIPAA",
          "PCI DSS",
          "COBIT",
          "ISO 31000"
        ],
        0,
        "HIPAA establishes requirements concerning protected health information in the United States."
      ),

      lesson(
        "nist-iso-frameworks",
        "Introduction to NIST and ISO Frameworks",
        15,
        `
Organizations use established frameworks to structure
their security and risk management programs.

NIST Cybersecurity Framework (CSF):

Provides an outcome-oriented structure for managing
cybersecurity risk.

Its six functions in CSF 2.0 are:

- Govern.
- Identify.
- Protect.
- Detect.
- Respond.
- Recover.

NIST Risk Management Framework (RMF):

Provides a structured approach to managing security
and privacy risk for information systems.

ISO/IEC 27001:

Specifies requirements for establishing, implementing,
maintaining, and continually improving an Information
Security Management System (ISMS).

ISO 31000:

Provides principles and guidelines for risk management.

These frameworks serve different purposes.

Organizations should select and adapt frameworks
based on their objectives, obligations, and operating context.
        `,
        "Which NIST CSF 2.0 function focuses on establishing cybersecurity risk strategy and oversight?",
        [
          "Protect",
          "Govern",
          "Detect",
          "Recover"
        ],
        1,
        "Govern establishes and monitors the organization's cybersecurity risk management strategy and expectations."
      ),

      lesson(
        "soc2-fisma-gdpr",
        "Introduction to SOC 2, FISMA, and GDPR",
        15,
        `
Organizations may need to address several compliance
and assurance requirements.

SOC 2:

An examination and reporting framework developed by
the AICPA for evaluating controls relevant to the
Trust Services Criteria.

These criteria include:

- Security.
- Availability.
- Processing Integrity.
- Confidentiality.
- Privacy.

FISMA:

The Federal Information Security Modernization Act
establishes information security requirements
for federal agencies and related systems.

GDPR:

The General Data Protection Regulation establishes
data protection and privacy obligations concerning
personal data within its scope.

Important distinction:

SOC 2 is an attestation reporting framework.

FISMA is United States federal legislation.

GDPR is a European Union regulation.

They are not interchangeable.

Organizations must determine which obligations
apply to their specific operations.
        `,
        "Which of the following is a European Union data protection regulation?",
        [
          "SOC 2",
          "COBIT",
          "GDPR",
          "NIST CSF"
        ],
        2,
        "GDPR is the European Union's General Data Protection Regulation."
      ),
    ]
  )
);

// END OF SECTION 1
// ================================================
// MODULE 5 — SECURITY CONTROLS AND FRAMEWORKS
// ================================================

MODULES.push(
  moduleData(
    "security-controls",
    "Security Controls and Control Frameworks",
    [
      lesson(
        "understanding-security-controls",
        "Understanding Security Controls",
        12,
        `
Security controls are safeguards used to protect
organizational assets, systems, and information.

They help reduce the likelihood or impact of security
incidents and other unwanted events.

Three common control categories are:

Preventive Controls:
Designed to stop unwanted events before they occur.

Examples:
- Multi-factor authentication.
- Access restrictions.
- Security awareness training.

Detective Controls:
Designed to identify unwanted events.

Examples:
- Security monitoring.
- Intrusion detection systems.
- Audit log reviews.

Corrective Controls:
Designed to restore operations or address problems
after an event occurs.

Examples:
- Restoring backups.
- Applying security patches.
- Correcting configuration weaknesses.

A single security process may contain multiple
types of controls.
        `,
        "Which type of control is primarily designed to identify suspicious activity?",
        [
          "Preventive",
          "Detective",
          "Corrective",
          "Administrative approval"
        ],
        1,
        "Detective controls identify suspicious activity or security events."
      ),

      lesson(
        "administrative-technical-physical-controls",
        "Administrative, Technical, and Physical Controls",
        12,
        `
Security controls can also be classified according
to how they are implemented.

Administrative Controls:

Policies, procedures, training, and management processes.

Examples:
- Employee security awareness training.
- Risk management policies.
- Background screening procedures.

Technical Controls:

Technology-based safeguards that protect systems
and information.

Examples:
- Firewalls.
- Encryption.
- Multi-factor authentication.
- Endpoint protection.

Physical Controls:

Safeguards that protect physical facilities and equipment.

Examples:
- Security guards.
- Door access cards.
- Surveillance cameras.
- Locked server rooms.

Example:

A data center may use:

Administrative:
A policy requiring restricted server room access.

Technical:
A system that records access attempts.

Physical:
A locked door requiring an authorized access card.

These controls work together to protect the environment.
        `,
        "Which of the following is a physical security control?",
        [
          "Data encryption",
          "Security awareness training",
          "A locked server room",
          "A password policy"
        ],
        2,
        "A locked server room physically restricts access to equipment."
      ),

      lesson(
        "nist-cis-cobit-controls",
        "NIST, CIS Controls, and COBIT",
        15,
        `
Organizations use control frameworks to organize
and improve their security and governance activities.

NIST:

Provides cybersecurity and risk management guidance.

The NIST Cybersecurity Framework helps organizations
understand and manage cybersecurity risk.

CIS Critical Security Controls:

Provides prioritized safeguards that organizations
can implement to improve cybersecurity.

Examples include:
- Inventory and control of enterprise assets.
- Secure configuration.
- Account management.
- Vulnerability management.
- Audit log management.

COBIT:

Provides a framework for the governance and management
of enterprise information and technology.

It helps organizations align IT activities
with business objectives.

Important distinction:

A framework provides structure and guidance.
An individual security control is a specific safeguard
implemented by an organization.

Organizations should select controls based on
their risks, requirements, and operating environment.
        `,
        "Which framework focuses on governance and management of enterprise information and technology?",
        [
          "COBIT",
          "GDPR",
          "HIPAA",
          "PCI DSS"
        ],
        0,
        "COBIT provides a framework for enterprise governance and management of information and technology."
      ),
    ]
  )
);

// ================================================
// MODULE 6 — POLICIES, STANDARDS, AND PROCEDURES
// ================================================

MODULES.push(
  moduleData(
    "policies-standards-procedures",
    "Policies, Standards, and Procedures",
    [
      lesson(
        "policy-standard-procedure",
        "Understanding Policies, Standards, and Procedures",
        14,
        `
Organizations use documented requirements to establish
consistent expectations and working practices.

Policy:

A high-level statement of management expectations.

Example:

Employees must protect organizational information.

Standard:

A mandatory requirement that explains how a policy
must be implemented.

Example:

Passwords must meet defined complexity and length
requirements where password authentication is used.

Procedure:

Step-by-step instructions explaining how to perform
a specific activity.

Example:

Instructions for creating, approving, modifying,
and disabling user accounts.

Guideline:

A recommended practice that provides direction
but may not be mandatory.

Example:

Recommendations for selecting secure collaboration tools.

The relationship can be understood as:

Policy = What must be achieved.

Standard = Mandatory requirements.

Procedure = How to perform the activity.

Guideline = Recommended approach.
        `,
        "Which document normally provides step-by-step instructions for completing an activity?",
        [
          "Policy",
          "Procedure",
          "Regulation",
          "Risk register"
        ],
        1,
        "A procedure provides the detailed steps required to perform an activity."
      ),

      lesson(
        "policy-lifecycle",
        "The Policy Lifecycle",
        12,
        `
Policies must be created, approved, communicated,
maintained, and periodically reviewed.

A typical policy lifecycle includes:

1. Identify the business requirement.
2. Draft the policy.
3. Review it with relevant stakeholders.
4. Obtain management approval.
5. Publish and communicate the policy.
6. Train affected employees.
7. Monitor compliance.
8. Review and update the policy.

Example:

An organization introduces a new remote work policy.

The policy team drafts requirements.

Legal, Human Resources, and Information Security
review the document.

Management approves it.

Employees receive the policy and acknowledge
their responsibilities.

The organization periodically reviews the policy
to ensure it remains relevant.

Policies should have an assigned owner,
approval authority, version, and review date.
        `,
        "What should normally happen before a policy is officially published?",
        [
          "It should be reviewed and approved by authorized stakeholders",
          "It should be deleted",
          "It should automatically become a law",
          "It should be hidden from employees"
        ],
        0,
        "Policies should undergo appropriate review and approval before publication."
      ),

      lesson(
        "policy-exceptions",
        "Policy Exceptions and Document Management",
        12,
        `
Sometimes an organization cannot meet a policy requirement
because of a legitimate business or technical constraint.

A policy exception is a formally approved deviation
from an established requirement.

Example:

A legacy application cannot support the organization's
standard multi-factor authentication solution.

The application owner requests an exception.

The request should document:

- The requirement that cannot be met.
- The business justification.
- The associated risk.
- Compensating controls.
- The responsible risk owner.
- The approval decision.
- The expiration or review date.

An exception should not automatically become permanent.

Document management is also important.

Organizations should maintain:
- Document owners.
- Version numbers.
- Approval records.
- Effective dates.
- Review schedules.
- Archived versions.

This helps demonstrate accountability
and maintain reliable documentation.
        `,
        "What is the purpose of a policy exception?",
        [
          "To permanently eliminate all security requirements",
          "To formally approve a documented deviation from a requirement",
          "To replace the organization's risk register",
          "To avoid management oversight"
        ],
        1,
        "A policy exception documents and authorizes a justified deviation from an established requirement."
      ),
    ]
  )
);

// ================================================
// MODULE 7 — IT AUDIT AND ASSESSMENT
// ================================================

MODULES.push(
  moduleData(
    "it-audit-assessment",
    "IT Audit and Assessment",
    [
      lesson(
        "introduction-it-audit",
        "Introduction to IT Auditing",
        14,
        `
An IT audit evaluates technology systems, processes,
security controls, and related organizational practices.

The objective is to determine whether activities
are operating as intended and whether applicable
requirements are being addressed.

IT audits may evaluate:

- Access management.
- Change management.
- System configurations.
- Backup and recovery.
- Security monitoring.
- Data protection.
- Vendor management.
- Incident response.

Types of audits include:

Internal Audit:
Performed by an organization's internal audit function.

External Audit:
Performed by an independent external organization.

Compliance Audit:
Evaluates whether relevant requirements are being met.

An audit should have a defined scope, objectives,
criteria, and documented evidence.

Auditors should maintain objectivity and independence
appropriate to their responsibilities.
        `,
        "What is a primary objective of an IT audit?",
        [
          "To develop new application features",
          "To evaluate systems, processes, and controls",
          "To replace all IT administrators",
          "To guarantee that incidents will never occur"
        ],
        1,
        "An IT audit evaluates whether technology processes and controls are appropriately designed and operating."
      ),

      lesson(
        "audit-evidence-testing",
        "Audit Evidence and Control Testing",
        15,
        `
Auditors collect evidence to support their conclusions.

Examples of audit evidence include:

- Access control reports.
- System configuration records.
- Security policies.
- Change management tickets.
- Backup logs.
- Approval records.
- Interview notes.
- System-generated reports.

Common audit testing methods include:

Inspection:
Examining documents, records, and configurations.

Observation:
Watching a process being performed.

Inquiry:
Asking employees and process owners questions.

Reperformance:
Independently performing a procedure to verify results.

Sampling:
Testing a selected portion of a larger population.

Example:

An auditor wants to verify that terminated employees
lose system access.

The auditor obtains a list of terminated employees,
selects a sample, and checks account deactivation dates.

The evidence helps determine whether the control
operated as expected.

Evidence should be relevant, reliable, and sufficient
to support the audit conclusion.
        `,
        "Which audit method involves independently repeating a process to verify its results?",
        [
          "Inquiry",
          "Observation",
          "Reperformance",
          "Policy approval"
        ],
        2,
        "Reperformance involves independently executing a procedure to verify its results."
      ),

      lesson(
        "audit-findings-remediation",
        "Audit Findings and Remediation",
        14,
        `
An audit finding identifies a weakness, deficiency,
or condition that requires attention.

A well-documented finding may contain:

Condition:
What the auditor observed.

Criteria:
The requirement or expected condition.

Cause:
Why the issue occurred.

Effect:
The actual or potential consequence.

Recommendation:
What should be done to address the issue.

Management Response:
How the responsible team intends to address it.

Example:

Condition:
Five former employees still have active accounts.

Criteria:
The access management policy requires accounts
to be disabled after termination.

Cause:
The offboarding process does not consistently notify IT.

Effect:
Former employees may retain unauthorized access.

Recommendation:
Integrate Human Resources termination notifications
with the account deactivation process.

Remediation activities should have assigned owners,
target dates, and supporting evidence.

A finding should not be considered resolved simply
because someone says it has been fixed.

The organization should verify that the corrective
action was implemented and is operating effectively.
        `,
        "What does the cause section of an audit finding explain?",
        [
          "Why the issue occurred",
          "Who approved the annual budget",
          "The organization's mission statement",
          "The number of servers in the data center"
        ],
        0,
        "The cause identifies the underlying reason the observed issue occurred."
      ),
    ]
  )
);

// ================================================
// MODULE 8 — THIRD-PARTY AND VENDOR RISK
// ================================================

MODULES.push(
  moduleData(
    "third-party-risk",
    "Third-Party and Vendor Risk Management",
    [
      lesson(
        "understanding-vendor-risk",
        "Understanding Third-Party Risk",
        14,
        `
Organizations frequently depend on external providers
for technology, services, infrastructure, and operations.

These providers introduce third-party risks.

Examples include:

Cybersecurity Risk:
A vendor experiences a data breach.

Privacy Risk:
A service provider mishandles personal information.

Operational Risk:
A critical provider experiences a service outage.

Financial Risk:
A provider becomes financially unstable.

Compliance Risk:
A provider fails to meet contractual or regulatory
requirements.

Supply Chain Risk:
A software supplier introduces vulnerable components.

Example:

A company uses a cloud provider to store customer records.

The company must understand how the provider protects data,
manages access, handles incidents, and supports recovery.

Using a vendor does not automatically eliminate
the organization's responsibility for managing risk.

Third-party risk management helps organizations
understand and monitor these dependencies.
        `,
        "What is third-party risk?",
        [
          "Risk introduced by external providers and business partners",
          "Risk created only by internal employees",
          "Risk that exists only in financial statements",
          "Risk associated exclusively with office equipment"
        ],
        0,
        "Third-party risk comes from external organizations and their services, products, or relationships."
      ),

      lesson(
        "vendor-due-diligence",
        "Vendor Due Diligence and Security Assessments",
        15,
        `
Vendor due diligence is the process of evaluating
a provider before establishing or continuing
a business relationship.

The assessment should consider the importance
of the service and the sensitivity of the information
the vendor will access.

Common assessment activities include:

- Reviewing security questionnaires.
- Evaluating SOC 2 reports where relevant.
- Reviewing ISO/IEC 27001 certifications.
- Assessing data protection practices.
- Reviewing business continuity capabilities.
- Evaluating incident response procedures.
- Reviewing subcontractor arrangements.
- Examining financial and operational stability.

Example:

A vendor will process confidential customer information.

The organization should evaluate:

How is the information protected?

Who can access it?

Where is it stored?

How are security incidents reported?

How is information returned or destroyed
when the contract ends?

The assessment should be proportionate to the vendor's
risk and business criticality.
        `,
        "What is the primary purpose of vendor due diligence?",
        [
          "To evaluate a provider before or during a business relationship",
          "To eliminate the need for contracts",
          "To transfer every organizational risk to the vendor",
          "To avoid reviewing vendor security practices"
        ],
        0,
        "Due diligence evaluates the provider's security, operational, financial, and compliance risks."
      ),

      lesson(
        "vendor-contract-monitoring",
        "Vendor Contracts and Ongoing Monitoring",
        14,
        `
Vendor risk management continues after a contract
has been signed.

Contracts should clearly define relevant security
and operational responsibilities.

Important contractual provisions may include:

- Data protection requirements.
- Confidentiality obligations.
- Security control requirements.
- Incident notification timelines.
- Audit and assessment rights.
- Service level agreements.
- Business continuity requirements.
- Data return and destruction.
- Subcontractor requirements.
- Termination provisions.

Ongoing monitoring may include:

- Periodic vendor reassessments.
- Review of security reports.
- Monitoring service availability.
- Tracking incidents.
- Reviewing changes in vendor services.
- Monitoring remediation activities.

Example:

A cloud provider is considered business-critical.

The organization reviews the provider's assurance reports,
monitors service availability, and tracks security issues.

Vendor risk should be reviewed throughout
the relationship, not only during onboarding.
        `,
        "Why should organizations periodically reassess important vendors?",
        [
          "Vendor risk can change over time",
          "Contracts never change",
          "All vendors have identical security controls",
          "Initial due diligence guarantees permanent security"
        ],
        0,
        "Vendor services, threats, controls, and business conditions can change over time."
      ),
    ]
  )
);

// END OF SECTION 2
// ================================================
// MODULE 9 — BUSINESS CONTINUITY AND DISASTER RECOVERY
// ================================================

MODULES.push(
  moduleData(
    "business-continuity-disaster-recovery",
    "Business Continuity and Disaster Recovery",
    [
      lesson(
        "business-continuity-fundamentals",
        "Understanding Business Continuity",
        14,
        `
Business Continuity Management (BCM) helps an organization
continue delivering critical products and services
during and after disruptive events.

Disruptions may include:

- Cyberattacks.
- Natural disasters.
- Power outages.
- Equipment failures.
- Supply chain interruptions.
- Pandemics.
- Major technology failures.

A Business Continuity Plan (BCP) documents how an
organization will maintain or restore essential operations.

Important components include:

- Critical business processes.
- Assigned responsibilities.
- Communication procedures.
- Alternative operating arrangements.
- Recovery strategies.
- Testing and maintenance.

Example:

A financial institution experiences a major data center outage.

Its business continuity plan identifies alternative
locations, communication responsibilities, and procedures
for maintaining critical customer services.

Business continuity focuses on the organization's ability
to continue operating during disruption.
        `,
        "What is the primary objective of business continuity management?",
        [
          "To eliminate all business risks",
          "To maintain critical operations during disruptions",
          "To replace cybersecurity policies",
          "To prevent employees from working remotely"
        ],
        1,
        "Business continuity helps organizations maintain essential operations during disruptive events."
      ),

      lesson(
        "business-impact-analysis",
        "Business Impact Analysis and Recovery Objectives",
        15,
        `
A Business Impact Analysis (BIA) identifies critical
business processes and evaluates the consequences
of disruption.

The BIA helps organizations determine recovery priorities.

Two important recovery concepts are:

Recovery Time Objective (RTO):

The target maximum time within which a business process
or system should be restored after disruption.

Recovery Point Objective (RPO):

The maximum acceptable amount of data loss measured
in time.

Example:

A payment processing system has:

RTO: 4 hours
RPO: 30 minutes

This means the organization targets restoring the system
within four hours.

It also targets limiting data loss to no more than
30 minutes of transactions.

A BIA considers:

- Financial impact.
- Operational impact.
- Legal and regulatory impact.
- Customer impact.
- Reputational impact.

Recovery objectives should be established based
on business requirements and approved by appropriate owners.
        `,
        "What does RPO measure?",
        [
          "The maximum acceptable amount of data loss measured in time",
          "The number of employees in an organization",
          "The cost of purchasing backup equipment",
          "The number of security policies"
        ],
        0,
        "RPO defines the maximum acceptable data loss measured in time."
      ),

      lesson(
        "disaster-recovery-testing",
        "Disaster Recovery Planning and Testing",
        15,
        `
Disaster Recovery (DR) focuses on restoring technology
systems, infrastructure, and data after a disruptive event.

A Disaster Recovery Plan may include:

- System recovery priorities.
- Backup locations.
- Data restoration procedures.
- Infrastructure dependencies.
- Recovery responsibilities.
- Communication contacts.
- Technical recovery instructions.

Common backup strategies include:

Full Backup:
Copies all selected data.

Incremental Backup:
Copies data changed since the previous backup.

Differential Backup:
Copies data changed since the last full backup.

Recovery plans must be tested.

Common testing approaches include:

Tabletop Exercise:
Participants discuss how they would respond to a scenario.

Walkthrough:
Teams review recovery procedures step by step.

Simulation:
A scenario is simulated to evaluate response capabilities.

Full Recovery Test:
Systems or services are actually recovered
in a controlled environment.

Testing helps identify gaps before a real disaster occurs.
        `,
        "Which exercise involves discussing a disaster scenario without necessarily performing a technical recovery?",
        [
          "Full recovery test",
          "Tabletop exercise",
          "Production deployment",
          "Penetration test"
        ],
        1,
        "A tabletop exercise uses discussion and scenario-based questions to evaluate preparedness."
      ),
    ]
  )
);

// ================================================
// MODULE 10 — GRC TECHNOLOGY AND AUTOMATION
// ================================================

MODULES.push(
  moduleData(
    "grc-technology-automation",
    "GRC Technology and Automation",
    [
      lesson(
        "grc-platforms",
        "Introduction to GRC Platforms",
        14,
        `
GRC platforms help organizations manage governance,
risk, compliance, policies, controls, audits,
and third-party relationships.

Common capabilities include:

Risk Management:
Create risk records, assess risks, assign owners,
and track treatment plans.

Compliance Management:
Map requirements to controls and monitor compliance.

Policy Management:
Create, review, approve, and publish policies.

Audit Management:
Plan assessments, document evidence,
and track findings.

Third-Party Risk Management:
Assess vendors and monitor their risk.

Reporting:
Generate dashboards and reports for management.

GRC platforms help centralize information and improve
visibility across the organization.

Examples of GRC and integrated risk management solutions
include ServiceNow IRM, Archer, and other enterprise platforms.

A platform supports GRC processes, but it does not replace
organizational accountability or sound risk decisions.
        `,
        "What is a primary purpose of a GRC platform?",
        [
          "To centralize and manage governance, risk, and compliance activities",
          "To eliminate the need for business owners",
          "To replace every enterprise application",
          "To guarantee that an organization has no risks"
        ],
        0,
        "GRC platforms centralize and support governance, risk, compliance, and audit activities."
      ),

      lesson(
        "grc-workflows-automation",
        "GRC Workflows and Automation",
        14,
        `
Workflow automation helps organizations standardize
and coordinate GRC processes.

Examples include:

Risk Assessment Workflow:

1. Create a risk assessment.
2. Assign a risk owner.
3. Collect assessment information.
4. Calculate or determine the risk rating.
5. Obtain approval.
6. Track the treatment plan.

Policy Approval Workflow:

1. Draft a policy.
2. Submit it for review.
3. Collect stakeholder feedback.
4. Obtain approval.
5. Publish the approved version.
6. Schedule the next review.

Audit Finding Workflow:

1. Record an audit finding.
2. Assign an owner.
3. Create remediation tasks.
4. Track due dates.
5. Collect implementation evidence.
6. Validate remediation.
7. Close the finding.

Automation can improve consistency, accountability,
and reporting.

However, workflows should include appropriate approvals,
access restrictions, and audit trails.
        `,
        "What is an important benefit of GRC workflow automation?",
        [
          "It removes all management responsibilities",
          "It improves consistency and accountability",
          "It guarantees regulatory compliance",
          "It eliminates the need for evidence"
        ],
        1,
        "Workflow automation helps standardize processes and makes responsibilities and progress easier to track."
      ),

      lesson(
        "grc-metrics-reporting",
        "GRC Metrics, Dashboards, and Reporting",
        14,
        `
GRC reporting helps management understand the organization's
risk exposure, control performance, and compliance status.

Common GRC metrics include:

Number of Open Risks:
Tracks identified risks that have not been closed.

High-Risk Findings:
Tracks significant audit or assessment findings.

Overdue Remediation Tasks:
Measures corrective actions that have passed
their target completion dates.

Control Effectiveness:
Evaluates whether controls are appropriately designed
and operating as intended.

Policy Review Status:
Tracks policies requiring review or approval.

Vendor Assessment Status:
Shows which important vendors have completed
their required assessments.

Key Risk Indicators (KRIs):

Metrics used to monitor changes in risk exposure.

Key Performance Indicators (KPIs):

Metrics used to evaluate performance against objectives.

Example:

A dashboard shows that 12 high-risk audit findings
remain open, with 5 overdue remediation actions.

Management can use this information to prioritize
resources and request corrective action.

Metrics should be meaningful, accurate, and connected
to business objectives.
        `,
        "What is a Key Risk Indicator (KRI) primarily used for?",
        [
          "Monitoring changes in risk exposure",
          "Measuring employee vacation days",
          "Recording software version numbers",
          "Replacing organizational policies"
        ],
        0,
        "KRIs help organizations monitor changes in risk exposure and identify potential problems."
      ),
    ]
  )
);

// ================================================
// MODULE 11 — PRACTICAL GRC PROJECT AND ASSESSMENT
// ================================================

MODULES.push(
  moduleData(
    "practical-grc-project",
    "Practical GRC Project and Final Assessment",
    [
      lesson(
        "building-a-risk-register",
        "Practical Project: Building a Risk Register",
        18,
        `
A risk register is a document or system used to record
and monitor identified organizational risks.

For this project, consider a fictional company:

Company:
Zebron Financial Services.

Business Activity:
Providing digital financial services to customers.

The organization operates a customer-facing application.

Identified Risk:

Risk ID: RISK-001

Risk Title:
Unauthorized access to customer information.

Asset:
Customer information database.

Threat:
External attacker.

Vulnerability:
Weak access controls and insufficient monitoring.

Potential Impact:
Exposure of confidential customer information,
financial losses, regulatory consequences,
and reputational damage.

Likelihood:
High.

Impact:
High.

Initial Risk Rating:
High.

Proposed Treatment:
Mitigate.

Recommended Controls:

- Enforce multi-factor authentication.
- Apply least-privilege access.
- Review privileged accounts.
- Monitor database access.
- Perform regular access reviews.
- Maintain incident response procedures.

Risk Owner:
Information Security Manager.

Treatment Due Date:
A defined date approved by management.

Your task is to document the risk, assign ownership,
identify existing controls, and recommend additional
risk treatments.

A good risk register should be reviewed regularly
and updated when conditions change.
        `,
        "What is the purpose of assigning a risk owner?",
        [
          "To establish accountability for managing the risk",
          "To eliminate the risk automatically",
          "To replace the risk assessment",
          "To transfer every responsibility to the auditor"
        ],
        0,
        "A risk owner is accountable for coordinating and managing the assigned risk."
      ),

      lesson(
        "building-a-control-matrix",
        "Practical Project: Building a Risk and Control Matrix",
        18,
        `
A Risk and Control Matrix (RCM) connects identified risks
with the controls designed to address them.

Consider this example:

Risk:
Unauthorized access to customer information.

Control Objective:
Ensure only authorized users can access sensitive data.

Control:
Multi-factor authentication is required for privileged
accounts.

Control Owner:
Identity and Access Management Manager.

Control Frequency:
Continuous enforcement.

Control Type:
Preventive.

Evidence:
Authentication configuration reports and access logs.

Testing Procedure:
Select a sample of privileged accounts and verify
that multi-factor authentication is enforced.

Expected Result:
All selected privileged accounts require
multi-factor authentication.

Possible Finding:
Two privileged accounts do not enforce MFA.

Remediation:
Configure MFA for the affected accounts
and validate implementation.

An RCM helps auditors and GRC professionals understand
how risks are addressed by specific controls.

A control should be clearly documented,
assigned to an owner, and supported by evidence.
        `,
        "What does a Risk and Control Matrix connect?",
        [
          "Risks and the controls designed to address them",
          "Employees and their salaries",
          "Software licenses and purchase orders",
          "Business meetings and calendars"
        ],
        0,
        "An RCM connects identified risks to the controls that address them."
      ),

      lesson(
        "final-grc-assessment",
        "Final Assessment: GRC Fundamentals",
        20,
        `
Congratulations on completing the GRC Fundamentals course.

Before completing the course, review the major concepts.

Governance:

Understand accountability, oversight, committees,
policies, and organizational responsibilities.

Risk Management:

Understand assets, threats, vulnerabilities,
risk assessments, risk ratings, and risk treatment.

Compliance:

Understand laws, regulations, contracts,
standards, and frameworks.

Security Controls:

Understand preventive, detective, and corrective controls.

Policies and Procedures:

Understand the differences between policies,
standards, procedures, and guidelines.

IT Audit:

Understand audit scope, evidence, control testing,
findings, and remediation.

Third-Party Risk:

Understand vendor due diligence, contracts,
and ongoing monitoring.

Business Continuity:

Understand business impact analysis, RTO, RPO,
and disaster recovery testing.

GRC Technology:

Understand GRC platforms, workflow automation,
metrics, and reporting.

Practical Application:

Be able to document a risk, identify relevant controls,
assign owners, and track remediation.

These foundations provide a starting point for further
learning in cybersecurity governance, IT audit,
enterprise risk management, and compliance.
        `,
        "Which statement best describes the relationship between risk management and compliance?",
        [
          "They are identical processes",
          "Risk management addresses uncertainty, while compliance addresses applicable requirements",
          "Compliance eliminates the need for risk management",
          "Risk management applies only to financial departments"
        ],
        1,
        "Risk management addresses uncertainty affecting objectives, while compliance focuses on meeting applicable requirements."
      ),
    ]
  )
);

// ================================================
// COURSE METADATA
// ================================================

const COURSE = {
  id: COURSE_ID,

  title: "GRC Fundamentals",

  subtitle:
    "Governance, Risk, and Compliance Fundamentals",

  description: `
Learn the foundations of Governance, Risk, and Compliance (GRC).

This course introduces organizational governance,
enterprise risk management, regulatory compliance,
security controls, IT auditing, third-party risk,
business continuity, and GRC technology.

Explore important frameworks and standards including
NIST, ISO/IEC 27001, ISO 31000, SOC 2, COBIT,
CIS Controls, FISMA, HIPAA, GDPR, and PCI DSS.

Through practical examples and exercises, learners
will develop foundational skills in risk identification,
risk assessment, control documentation, audit evidence,
and remediation tracking.

This course is designed for aspiring GRC analysts,
cybersecurity professionals, IT auditors, risk managers,
and IT professionals.
  `.trim(),

  level: "beginner",
  status: "draft",
  language: "en",

  topic: "Governance, Risk, and Compliance",
  cover: "teal",

  program: "Enterprise AI & Solutions Architecture",
  programOrder: 3,

  estimatedMinutes: MODULES.reduce(
    (total, currentModule) =>
      total +
      currentModule.lessons.reduce(
        (moduleTotal, currentLesson) =>
          moduleTotal + currentLesson.minutes,
        0
      ),
    0
  ),

  modules: MODULES.map((currentModule, moduleIndex) => ({
    id: currentModule.id,
    title: currentModule.title,
    order: moduleIndex + 1,

    lessons: currentModule.lessons.map(
      (currentLesson, lessonIndex) => ({
        id: currentLesson.id,
        title: currentLesson.title,
        order: lessonIndex + 1,
        duration: currentLesson.minutes,
      })
    ),
  })),

  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
};

// ================================================
// VALIDATION
// ================================================

const allLessons = MODULES.flatMap(
  (currentModule) => currentModule.lessons
);

const totalLessons = allLessons.length;

const totalQuickChecks = allLessons.reduce(
  (total, currentLesson) =>
    total +
    currentLesson.blocks.filter(
      (block) => block.type === "check"
    ).length,
  0
);

if (MODULES.length !== 11) {
  throw new Error(
    `Expected 11 modules, found ${MODULES.length}.`
  );
}

if (totalLessons !== 33) {
  throw new Error(
    `Expected 33 lessons, found ${totalLessons}.`
  );
}

if (totalQuickChecks !== 33) {
  throw new Error(
    `Expected 33 Quick Checks, found ${totalQuickChecks}.`
  );
}

if (
  allLessons.some(
    (currentLesson) =>
      !currentLesson.id ||
      !currentLesson.title ||
      !Array.isArray(currentLesson.blocks)
  )
) {
  throw new Error("One or more lessons have invalid data.");
}

console.log("\nCourse validation successful.");
console.log(`Modules: ${MODULES.length}`);
console.log(`Lessons: ${totalLessons}`);
console.log(`Quick Checks: ${totalQuickChecks}`);
console.log(`Estimated minutes: ${COURSE.estimatedMinutes}`);

// ================================================
// FIRESTORE SEEDING
// ================================================

async function seedCourse() {
  const courseRef = db
    .collection("courses")
    .doc(COURSE_ID);

  const existingCourse = await courseRef.get();

  if (existingCourse.exists && !OVERWRITE) {
    console.log(`\nCourse "${COURSE_ID}" already exists.`);

    console.log(
      "No changes were made. Use --overwrite to replace the seeded course."
    );

    return;
  }

  if (!APPLY) {
    console.log("\nDRY RUN — no Firestore writes performed.");

    console.log("\nCourse details:");

    console.log(
      JSON.stringify(
        {
          id: COURSE.id,
          title: COURSE.title,
          status: COURSE.status,
          language: COURSE.language,
          modules: MODULES.length,
          lessons: totalLessons,
          quickChecks: totalQuickChecks,
          estimatedMinutes: COURSE.estimatedMinutes,
        },
        null,
        2
      )
    );

    console.log("\nTo write this course to Firebase, run:");

    console.log(
      "node scripts/grc/seed-grc-fundamentals.mjs --apply"
    );

    return;
  }

  const batch = db.batch();

  // Save the course document.
  batch.set(courseRef, COURSE);

  // Save each lesson in its own Firestore document.
  for (const currentModule of MODULES) {
    for (const [lessonIndex, currentLesson] of
      currentModule.lessons.entries()) {
      const lessonRef = courseRef
        .collection("lessons")
        .doc(currentLesson.id);

      batch.set(lessonRef, {
        id: currentLesson.id,
        courseId: COURSE_ID,
        moduleId: currentModule.id,
        moduleTitle: currentModule.title,
        title: currentLesson.title,
        order: lessonIndex + 1,
        duration: currentLesson.minutes,
        blocks: currentLesson.blocks,
        status: "draft",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();

  console.log("\nCourse successfully saved to Firestore.");
  console.log(`Course ID: ${COURSE_ID}`);
  console.log(`Modules: ${MODULES.length}`);
  console.log(`Lessons: ${totalLessons}`);
  console.log(`Quick Checks: ${totalQuickChecks}`);
  console.log(`Estimated minutes: ${COURSE.estimatedMinutes}`);
}

// ================================================
// EXECUTE
// ================================================

seedCourse()
  .then(() => {
    console.log("\nSeeding process completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  });

// END OF SECTION 3