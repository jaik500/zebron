import { check, mc, ms, ord, st, text, tf, tip } from "./helpers.mjs";

export default {
  order: 1,
  id: "cybersecurity-foundations",
  title: "Cybersecurity Foundations",
  summary: "Course 1 of 8 in the Zebron Cybersecurity Program. The core ideas every security role builds on: the CIA triad, risk, controls, frameworks and the jobs in the field.",
  description: `
Start here. This course gives you the vocabulary and the way of thinking that the rest of the program builds on.

You will learn what security protects and why, how professionals weigh risk, which kinds of controls exist, how frameworks such as the NIST Cybersecurity Framework organise the work, and what the main jobs in the field actually do.

Each lesson ends with a quick check. The final exam is drawn from the **Cybersecurity Foundations** quiz in the Test Center, where you can also practise topic by topic.
`.trim(),
  level: "beginner",
  cover: "navy",
  outcomes: [
    "Explain confidentiality, integrity and availability with real examples",
    "Describe risk in terms of assets, threats, vulnerabilities and impact",
    "Classify controls as administrative, technical or physical, and as preventive, detective or corrective",
    "Outline the six functions of the NIST Cybersecurity Framework 2.0",
    "Describe the main cybersecurity career paths",
  ],
  skills: ["Security fundamentals", "Risk management", "Security controls", "NIST CSF"],
  quiz: {
    name: "Cybersecurity Foundations",
    slug: "cybersecurity-foundations",
    description: "Practice questions for Course 1 of the Cybersecurity Program: CIA triad, risk, controls, frameworks and careers.",
    tags: ["cybersecurity", "foundations"],
  },
  topics: [
    { key: "cia-triad", name: "The CIA triad and core principles", description: "Confidentiality, integrity, availability, plus authenticity, non-repudiation and least privilege." },
    { key: "risk", name: "Assets, threats, vulnerabilities and risk", description: "How risk is described, measured and treated." },
    { key: "controls", name: "Security controls", description: "Control categories and control types, and defense in depth." },
    { key: "frameworks", name: "Frameworks and standards", description: "NIST CSF 2.0, ISO/IEC 27001, CIS Controls and common regulations." },
    { key: "careers", name: "Cybersecurity careers", description: "Roles, teams and how security work is organised." },
  ],
  modules: [
    {
      id: "core-ideas",
      title: "Core ideas",
      lessons: [
        {
          id: "cia-triad",
          title: "The CIA triad and core principles",
          minutes: 12,
          blocks: [
            text(`
## What security protects

Security professionals describe their goals with the **CIA triad**:

- **Confidentiality**: information is seen only by people and systems that are allowed to see it. Encryption, access control and data classification protect it.
- **Integrity**: information is accurate and has not been changed without authorisation. Hashes, digital signatures, version control and change approval protect it.
- **Availability**: systems and data are there when needed. Backups, redundancy, capacity planning and DDoS protection protect it.

Every incident harms at least one of the three. A leaked customer database breaks confidentiality. An attacker who edits bank details on an invoice breaks integrity. Ransomware that locks every file breaks availability, and often confidentiality too when data is stolen first.
`),
            text(`
## Principles you will meet everywhere

- **Authenticity**: you can trust who or what something came from.
- **Non-repudiation**: someone cannot credibly deny an action they took, for example because it was digitally signed and logged.
- **Least privilege**: people and programs get only the access they need for their job, for only as long as they need it.
- **Separation of duties**: no single person can complete a sensitive task alone, such as creating and approving the same payment.
- **Defense in depth**: several independent layers of protection, so one failure does not lead to a breach.

The goals often pull against each other. Locking everything down helps confidentiality but can hurt availability. Good security finds the balance the business can live with.
`),
            tip("When you read about a breach in the news, ask which part of the triad was harmed first. It is a fast way to understand what really happened."),
            check(
              "An attacker changes the bank account number on an invoice before it is paid. Which goal was harmed?",
              ["Confidentiality", "Integrity", "Availability"],
              1,
              "The data was altered without authorisation, so its integrity was harmed.",
            ),
          ],
        },
        {
          id: "risk",
          title: "Assets, threats, vulnerabilities and risk",
          minutes: 12,
          blocks: [
            text(`
## The language of risk

- An **asset** is anything of value: data, systems, people, reputation.
- A **threat** is something that could cause harm: a criminal group, an insider, a flood, a software bug.
- A **vulnerability** is a weakness a threat could use: an unpatched server, a weak password, an unlocked door.
- An **exploit** is the method or code that takes advantage of a vulnerability.
- **Risk** is the chance that a threat uses a vulnerability, combined with the harm it would cause.

A simple way to remember it: **risk = likelihood × impact**. A severe flaw on a server nobody can reach may be lower risk than a medium flaw on your public website.
`),
            text(`
## Measuring and treating risk

**Qualitative** analysis rates likelihood and impact as low, medium or high and plots them on a risk matrix. **Quantitative** analysis puts money on it:

| Term | Meaning |
| --- | --- |
| SLE (single loss expectancy) | Asset value × exposure factor |
| ARO (annualised rate of occurrence) | How many times a year the event is expected |
| ALE (annualised loss expectancy) | SLE × ARO |

Once a risk is understood, the organisation chooses a **treatment**:

- **Mitigate**: add controls to reduce it.
- **Transfer**: share it, for example through cyber insurance or a contract.
- **Avoid**: stop the risky activity altogether.
- **Accept**: knowingly live with it, usually because it is small or fixing it costs more than the loss.

What is left after controls is **residual risk**. Leadership decides how much residual risk is acceptable: the **risk appetite**.
`),
            tip("A risk register lists each risk, its owner, its rating, the chosen treatment and a review date. If a risk has no owner, nobody is managing it."),
            check(
              "A laptop worth $2,000 has a 50% exposure factor and is expected to be lost twice a year. What is the ALE?",
              ["$1,000", "$2,000", "$4,000"],
              1,
              "SLE = $2,000 × 0.5 = $1,000. ALE = SLE × ARO = $1,000 × 2 = $2,000.",
            ),
          ],
        },
        {
          id: "controls",
          title: "Security controls and defense in depth",
          minutes: 11,
          blocks: [
            text(`
## Control categories: who or what does the work

- **Administrative** (or managerial): policies, procedures, training, background checks, risk assessments.
- **Technical** (or logical): firewalls, encryption, multi-factor authentication, antivirus, access control lists.
- **Physical**: locks, badges, fences, guards, cameras, server room access.

## Control types: what the control does

| Type | Purpose | Example |
| --- | --- | --- |
| Preventive | Stop an incident happening | MFA, firewall rule, door lock |
| Detective | Notice that it happened | Log monitoring, IDS, cameras |
| Corrective | Limit damage and restore | Restoring backups, patching after an incident |
| Deterrent | Discourage the attacker | Warning banners, visible cameras |
| Compensating | Stand in when the ideal control is not possible | Extra monitoring on a legacy system that cannot be patched |
`),
            text(`
## Defense in depth

No control is perfect. Layering independent controls means an attacker has to beat several of them. For one laptop, the layers might be: security awareness training, MFA on accounts, endpoint protection, full-disk encryption, a host firewall, and central logging.

A camera can be both **physical** (its category) and **detective** (its type). Keep the two ideas separate: category answers *how*, type answers *when and why*.
`),
            tip("When you propose a control, say what risk it reduces and whether it prevents, detects or corrects. It makes the business case much easier."),
            check(
              "Reviewing server logs every morning for failed sign-ins is mainly which type of control?",
              ["Preventive", "Detective", "Corrective"],
              1,
              "Log review finds events after they happen, so it is a detective control.",
            ),
          ],
        },
      ],
    },
    {
      id: "frameworks-and-careers",
      title: "Frameworks and careers",
      lessons: [
        {
          id: "frameworks",
          title: "Frameworks and standards",
          minutes: 12,
          blocks: [
            text(`
## Why frameworks

A framework gives a shared structure, so an organisation can see what it does well, find gaps and explain its security to others.

### NIST Cybersecurity Framework 2.0

Published in 2024, CSF 2.0 organises security outcomes into six **functions**:

1. **Govern**: set strategy, roles, policy and oversight of cybersecurity risk.
2. **Identify**: know your assets, risks and suppliers.
3. **Protect**: put safeguards in place (access control, training, data security).
4. **Detect**: find attacks and anomalies.
5. **Respond**: act on a detected incident.
6. **Recover**: restore services and learn.

Govern was added in 2.0 and sits at the centre of the other five.
`),
            text(`
## Other names you will hear

- **ISO/IEC 27001**: an international standard for an information security management system (ISMS). Organisations can be **certified** against it by an accredited auditor.
- **CIS Critical Security Controls**: a prioritised list of 18 practical safeguards, a good starting point for smaller teams.
- **NIST SP 800-53**: a large catalogue of security and privacy controls used by US federal systems and many others.
- **PCI DSS**: required for organisations that store, process or transmit payment card data.
- **GDPR**: the EU regulation on personal data, with fines up to 4% of global annual turnover.
- **HIPAA**: US rules protecting health information.

A **framework** is guidance you adopt; a **regulation** is law you must follow; a **standard** is a formal specification you can be audited against.
`),
            tip("You do not need to memorise every framework. Know the NIST CSF functions well: interviewers ask about them often."),
            check(
              "Which NIST CSF 2.0 function was added in version 2.0?",
              ["Identify", "Govern", "Recover"],
              1,
              "Govern was added in CSF 2.0 to cover strategy, roles, policy and oversight.",
            ),
          ],
        },
        {
          id: "careers",
          title: "Cybersecurity careers",
          minutes: 10,
          blocks: [
            text(`
## Who does what

| Role | What they do |
| --- | --- |
| SOC analyst | Watches alerts, triages them and escalates real incidents |
| Incident responder | Contains and investigates confirmed incidents |
| Security engineer | Designs and runs security tools and infrastructure |
| Penetration tester | Legally attacks systems to find weaknesses before criminals do |
| GRC analyst | Policies, risk assessments, audits and compliance |
| Cloud security engineer | Secures cloud accounts, identities and workloads |
| Security architect | Designs secure systems across the organisation |
| CISO | Leads the security program and reports risk to leadership |

## Teams by colour

- **Red team**: simulates real attackers.
- **Blue team**: defends, detects and responds.
- **Purple team**: red and blue working together so every attack teaches the defenders something.
`),
            text(`
## How people get in

Many analysts start in IT support, networking or system administration. Employers look for:

- Solid networking and operating system basics (Courses 2 and 3 of this program).
- Hands-on practice: home labs, capture-the-flag events, write-ups of what you learned.
- Entry certifications such as CompTIA Security+ or ISC2 Certified in Cybersecurity (CC).
- Clear writing: incident notes and reports are a large part of the job.
`),
            tip("Keep a learning journal or blog of each lab you complete. It becomes your portfolio when you apply for your first role."),
            check(
              "Which team legally simulates real attackers to test defenses?",
              ["Blue team", "Red team", "GRC team"],
              1,
              "The red team plays the attacker; the blue team defends.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- CIA triad ----------------
    mc("cia-triad", "easy", "Ransomware encrypts every file on a file server so staff cannot open them. Which goal is harmed first?", ["Confidentiality", "Integrity", "Availability", "Non-repudiation"], 2, "The files still exist but cannot be used, so availability is harmed. Many ransomware groups also steal data first, which harms confidentiality too."),
    mc("cia-triad", "easy", "Which control mainly protects confidentiality?", ["Encrypting a database", "Keeping daily backups", "Adding a second power supply", "Load balancing web servers"], 0, "Encryption keeps data unreadable to anyone without the key. Backups, power and load balancing protect availability."),
    tf("cia-triad", "easy", "A file hash can show that a file has been changed since the hash was taken.", true, "If even one bit changes, the hash changes. Comparing hashes is a common integrity check."),
    mc("cia-triad", "medium", "A manager digitally signs a purchase approval so she cannot later claim she never approved it. Which principle is this?", ["Availability", "Non-repudiation", "Least privilege", "Separation of duties"], 1, "A digital signature tied to her identity provides non-repudiation: proof she took the action."),
    ms("cia-triad", "medium", "Which of these apply the principle of least privilege? Select all that apply.", ["Giving a new hire only the folders their team uses", "Removing admin rights from everyday user accounts", "Letting all staff install any software", "Expiring a contractor's access when the contract ends"], [0, 1, 3], "Least privilege means only the access needed, for only as long as needed. Letting everyone install software is the opposite."),

    // ---------------- Risk ----------------
    mc("risk", "easy", "An unpatched web server is best described as a…", ["Threat", "Vulnerability", "Asset", "Exploit"], 1, "The missing patch is a weakness that a threat could use: a vulnerability."),
    mc("risk", "easy", "Which formula is the common shorthand for risk?", ["Threat + asset", "Likelihood × impact", "Vulnerability − control", "Cost ÷ benefit"], 1, "Risk combines how likely something is with how much harm it would do."),
    mc("risk", "medium", "A company buys cyber insurance to cover the cost of a breach. Which risk treatment is this?", ["Accept", "Avoid", "Transfer", "Mitigate"], 2, "Insurance shares the financial impact with another party, which is risk transfer."),
    mc("risk", "medium", "An asset is worth $50,000. A fire would destroy 40% of it, and a fire is expected once every 10 years. What is the ALE?", ["$2,000", "$5,000", "$20,000", "$200,000"], 0, "SLE = $50,000 × 0.4 = $20,000. ARO = 1/10 = 0.1. ALE = $20,000 × 0.1 = $2,000.", "ALE = SLE × ARO, and SLE = asset value × exposure factor."),
    tf("risk", "medium", "Residual risk is the risk that remains after controls have been applied.", true, "Controls rarely remove risk completely. What is left is residual risk, which leadership must accept or treat further."),

    // ---------------- Controls ----------------
    mc("controls", "easy", "A security awareness training program is which category of control?", ["Technical", "Physical", "Administrative", "Compensating"], 2, "Training is a people and process measure: an administrative (managerial) control."),
    mc("controls", "easy", "Multi-factor authentication on email accounts is mainly a…", ["Preventive control", "Detective control", "Corrective control", "Deterrent control"], 0, "MFA stops many sign-in attacks from succeeding in the first place, so it is preventive."),
    mc("controls", "medium", "A legacy system cannot be patched, so the team isolates it on its own network and monitors it closely. These extra measures are…", ["Corrective controls", "Compensating controls", "Deterrent controls", "Directive controls"], 1, "When the preferred control (patching) is not possible, alternative measures that reduce the same risk are compensating controls."),
    ms("controls", "medium", "Which of these are physical controls? Select all that apply.", ["Badge readers", "Security guards", "Firewall rules", "Locked server racks"], [0, 1, 3], "Badges, guards and locks protect physical spaces. Firewall rules are technical controls."),
    tf("controls", "hard", "Defense in depth means choosing the single strongest control and relying on it.", false, "Defense in depth layers several independent controls so that one failure does not lead to a breach."),

    // ---------------- Frameworks ----------------
    ord("frameworks", "medium", "Put the NIST CSF functions Identify, Protect, Detect, Respond and Recover in the order they are usually listed.", ["Identify", "Protect", "Detect", "Respond", "Recover"], "The classic order follows the life of an incident: know what you have, protect it, detect attacks, respond, then recover. Govern (added in 2.0) sits at the centre."),
    mc("frameworks", "easy", "Which standard can an organisation be formally certified against for its information security management system?", ["NIST CSF", "ISO/IEC 27001", "CIS Controls", "OWASP Top 10"], 1, "ISO/IEC 27001 specifies an ISMS and accredited bodies certify organisations against it. NIST CSF is voluntary guidance."),
    mc("frameworks", "medium", "A small online shop that takes card payments must follow which standard?", ["HIPAA", "PCI DSS", "FedRAMP", "SOX"], 1, "PCI DSS applies to any organisation that stores, processes or transmits payment card data."),
    st("frameworks", "medium", "How many functions does the NIST Cybersecurity Framework 2.0 have? Answer in digits.", ["6", "six"], "CSF 2.0 has six functions: Govern, Identify, Protect, Detect, Respond and Recover."),
    tf("frameworks", "medium", "GDPR fines can reach 4% of a company's global annual turnover.", true, "For the most serious breaches, GDPR allows fines up to €20 million or 4% of worldwide annual turnover, whichever is higher."),

    // ---------------- Careers ----------------
    mc("careers", "easy", "Who usually watches security alerts, triages them and escalates real incidents?", ["Penetration tester", "SOC analyst", "Security architect", "Auditor"], 1, "Security operations centre (SOC) analysts monitor and triage alerts."),
    mc("careers", "easy", "What does a purple team do?", ["Only writes policies", "Combines red and blue teams so attacks improve defenses", "Handles physical security", "Manages cyber insurance"], 1, "Purple teaming brings attackers and defenders together so each simulated attack produces better detections."),
    mc("careers", "medium", "Which role focuses on policies, risk assessments, audits and compliance?", ["GRC analyst", "Malware analyst", "Network engineer", "Red teamer"], 0, "Governance, risk and compliance (GRC) analysts own policies, risk registers and audits."),
    tf("careers", "easy", "Penetration testers must have written permission before testing systems.", true, "Testing without authorisation is illegal in most countries. Scope and permission are agreed in writing first."),
    mc("careers", "medium", "Who is usually responsible for reporting cybersecurity risk to the board?", ["The help desk", "The CISO", "Each developer", "The external auditor"], 1, "The Chief Information Security Officer leads the security program and reports risk to leadership and the board."),
  ],
};
