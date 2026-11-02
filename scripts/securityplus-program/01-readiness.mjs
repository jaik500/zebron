import { check, mc, ms, num, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

/**
 * Security+ readiness: the exam objectives the eight Cybersecurity Program
 * courses only touch on. Step 9 of the Security+ exam preparation track.
 */
export default {
  order: 9,
  id: "securityplus-readiness",
  title: "Security+ Readiness: Remaining Exam Objectives",
  summary: "Step 9 of the Security+ exam preparation track. Change management, physical security and deception, specialised architectures, resilience, asset management, automation and AI security risks.",
  description: `
The eight Cybersecurity Program courses cover most of the Security+ objectives. This course fills in the rest, so every objective on the exam map is taught and tested before you take the practice exam.

Each lesson is mapped to the objectives it covers. The final exam is drawn from the **Security+ Readiness** quiz in the Test Center.

*Zebron is not affiliated with or endorsed by CompTIA. CompTIA and Security+ are trademarks of CompTIA, Inc.*
`.trim(),
  level: "intermediate",
  cover: "violet",
  outcomes: [
    "Explain how change management protects security",
    "Describe physical controls and deception technologies",
    "Compare the security implications of cloud, virtual, IoT, ICS and embedded architectures",
    "Plan for resilience with high availability, recovery sites, backups and testing",
    "Manage assets from procurement to disposal, and use automation safely",
    "Explain the security risks of artificial intelligence and how to reduce them",
  ],
  skills: ["Change management", "Resilience and recovery", "Asset management", "Security automation", "AI security"],
  quiz: {
    name: "Security+ Readiness: Remaining Exam Objectives",
    slug: "securityplus-readiness",
    description: "Practice questions for step 9 of the Security+ exam preparation track.",
    tags: ["security+", "exam-prep"],
  },
  topics: [
    { key: "change-management", name: "Change management", description: "Approvals, impact analysis, backout plans and technical implications." },
    { key: "physical-deception", name: "Physical security and deception", description: "Physical controls, sensors, honeypots and Zero Trust planes." },
    { key: "architectures", name: "Architecture models", description: "Cloud, IaC, serverless, virtualization, containers, IoT, ICS/SCADA, embedded." },
    { key: "resilience", name: "Resilience and recovery", description: "High availability, recovery sites, backups, power and testing." },
    { key: "assets", name: "Asset management", description: "Procurement, ownership, inventory, sanitisation and disposal." },
    { key: "automation", name: "Automation and orchestration", description: "Use cases, benefits and risks of security automation." },
    { key: "ai-risks", name: "AI security risks", description: "Prompt injection, data poisoning, data exposure and controls for AI." },
  ],
  modules: [
    {
      id: "concepts-and-architecture",
      title: "Concepts and architecture",
      lessons: [
        {
          id: "change-management",
          title: "Change management and security",
          minutes: 11,
          blocks: [
            text(`
## Why change management is a security control

Unplanned changes break things and open holes. A good change process makes every change visible, reviewed and reversible.

## Business processes

- **Approval process** and a **change advisory board** for significant changes.
- **Ownership**: a named person accountable for the change.
- **Stakeholders**: everyone affected is consulted and informed.
- **Impact analysis**: what could go wrong, who is affected, what the security impact is.
- **Test results** from a non-production environment.
- **Backout plan**: how to undo the change if it fails.
- **Maintenance window**: an agreed time with the least business impact.
- **Standard operating procedures (SOPs)** for routine changes.
`),
            text(`
## Technical implications

- **Allow lists and deny lists** may need updating (a new application, a new port).
- **Restricted activities**: what may and may not be done during the change.
- **Downtime**, **service restarts** and **application restarts** must be planned and communicated.
- **Legacy applications** may break or be impossible to patch.
- **Dependencies**: a change to one system can affect others that rely on it.

## Documentation and version control

Update **diagrams**, **policies and procedures** after the change, and keep configurations and scripts in **version control** so you know exactly what changed, when and by whom, and can roll back.
`),
            tip("If a change has no backout plan, it is not ready. Ask \"how do we undo this?\" before \"when do we do this?\"."),
            check(
              "Which part of a change request describes how to undo the change if it fails?",
              ["Impact analysis", "Backout plan", "Maintenance window"],
              1,
              "The backout plan restores the previous state if the change goes wrong.",
            ),
          ],
        },
        {
          id: "physical-deception",
          title: "Physical security, deception and Zero Trust",
          minutes: 12,
          blocks: [
            text(`
## Physical security

| Control | Purpose |
| --- | --- |
| **Bollards** | Stop vehicles reaching buildings or entrances |
| **Access control vestibule** (mantrap) | Two doors; only one opens at a time, stopping tailgating |
| **Fencing**, **lighting** | Deter and delay intruders, improve visibility |
| **Video surveillance** | Detect and record |
| **Security guards** | Respond, verify identity, judgement |
| **Access badges** | Identify and authorise people at doors |

**Sensors** detect intrusions: **infrared** (heat and motion), **pressure** (weight on a floor or mat), **microwave** and **ultrasonic** (movement through reflected signals).

## Deception and disruption

Deception technology lures attackers into revealing themselves:

- **Honeypot**: a decoy system that looks valuable.
- **Honeynet**: a network of decoys.
- **Honeyfile**: a decoy file (for example "passwords.xlsx") that alerts when opened.
- **Honeytoken**: fake data or credentials that alert when used.

Legitimate users never touch them, so any interaction is suspicious.
`),
            text(`
## Gap analysis

A **gap analysis** compares the current state of security with a target, such as a framework or standard, and lists what is missing. It is the starting point for a security roadmap.

## Zero Trust in more detail

Zero Trust separates decision-making from enforcement:

- **Control plane**: decides access. It uses **adaptive identity** (context such as location and device), **threat scope reduction**, and **policy-driven access control**. The **policy engine** makes the decision and the **policy administrator** carries it out by setting up or closing the connection.
- **Data plane**: where traffic flows. The **policy enforcement point** allows or blocks the session between the **subject/system** and the resource. **Implicit trust zones** are minimised.
`),
            tip("A honeytoken in your password vault, such as a fake admin account nobody uses, is a cheap, very reliable alarm."),
            check(
              "A fake \"salaries.xlsx\" on a file share alerts the SOC when anyone opens it. What is it?",
              ["A honeyfile", "A bollard", "A policy engine"],
              0,
              "A honeyfile is a decoy file whose access signals malicious activity.",
            ),
          ],
        },
        {
          id: "architectures",
          title: "Architecture models and their security",
          minutes: 13,
          blocks: [
            text(`
## Models

| Model | Security points |
| --- | --- |
| **On-premises** | Full control and full responsibility |
| **Cloud** (public, private, hybrid) | Shared responsibility matrix; third-party risk |
| **Infrastructure as code (IaC)** | Repeatable, reviewable configuration; scan templates for mistakes |
| **Serverless** | No servers to patch; focus on function permissions and code |
| **Microservices** | Many small services and APIs to secure |
| **Virtualization** | Hypervisor must be patched; **VM escape** lets an attacker break out to the host |
| **Containers** | Shared kernel; scan images, avoid running as root |
| **Centralized vs decentralized** | Single point of control (and failure) vs spread-out control |
| **Software-defined networking (SDN)** | Central control plane programs the network |
| **Physical isolation / air gap** | No network path; data moves by controlled media |
| **Logical segmentation** | VLANs, subnets, security groups |

**Resource reuse** in shared environments can leak data if memory or storage is not cleared between tenants.
`),
            text(`
## Specialised systems

- **IoT** devices: often weak default credentials, rare updates, long lifetimes. Segment them.
- **ICS/SCADA** (industrial control systems): control physical processes such as power and water. Availability and safety come first; patching is slow, so isolation and monitoring matter.
- **Embedded systems** and **RTOS** (real-time operating systems): fixed-purpose and hard to update.

## Considerations when choosing

Availability, resilience, cost, responsiveness, scalability, ease of deployment, **risk transference**, ease of recovery, **patch availability** and **inability to patch**, power and compute limits.
`),
            tip("For any device you cannot patch, write down its compensating controls: segmentation, monitoring and restricted access."),
            check(
              "An attacker on a virtual machine breaks out and gains control of the host. What is this called?",
              ["VM escape", "Resource reuse", "Air gap"],
              0,
              "VM escape breaks the isolation between guests and the hypervisor or host.",
            ),
          ],
        },
        {
          id: "resilience",
          title: "Resilience and recovery",
          minutes: 13,
          blocks: [
            text(`
## High availability

- **Load balancing** spreads traffic across active servers.
- **Clustering** groups servers so another takes over if one fails.
- **Platform diversity** and **multi-cloud** avoid a single vendor or technology failing everything.

## Recovery sites

| Site | Ready to run | Cost |
| --- | --- | --- |
| **Hot site** | Fully equipped, data current, switch over in minutes to hours | Highest |
| **Warm site** | Hardware ready, data needs restoring | Medium |
| **Cold site** | Space and power only | Lowest |

**Geographic dispersion** keeps a regional disaster from hitting every site.

## Key measures

- **RTO** (recovery time objective): how long the service may be down.
- **RPO** (recovery point objective): how much data, in time, you can afford to lose.
- **MTTR** (mean time to repair) and **MTBF** (mean time between failures).
`),
            text(`
## Backups

Decide **onsite vs offsite**, **frequency** (driven by the RPO), **encryption**, **snapshots**, **replication** and **journaling**, and above all test **recovery**.

## Power

**UPS** (uninterruptible power supply) bridges short outages and gives time for a clean shutdown or generator start. **Generators** run for longer outages.

## Testing

| Test | What happens |
| --- | --- |
| **Tabletop exercise** | Discuss a scenario; no systems touched |
| **Simulation** | Act out a realistic event |
| **Failover test** | Actually switch to the backup systems |
| **Parallel processing** | Run the recovery systems alongside production and compare |

**Capacity planning** covers people, technology and infrastructure, so you can operate at the level needed during a crisis.
`),
            tip("If your RPO is one hour, daily backups cannot meet it. Match backup frequency to the RPO."),
            check(
              "Which recovery site has hardware ready but needs data restored before use?",
              ["Hot site", "Warm site", "Cold site"],
              1,
              "A warm site sits between hot (ready now) and cold (space and power only).",
            ),
          ],
        },
      ],
    },
    {
      id: "operations-and-new-risks",
      title: "Operations and new risks",
      lessons: [
        {
          id: "assets",
          title: "Hardware, software and data asset management",
          minutes: 10,
          blocks: [
            text(`
## The asset lifecycle

1. **Acquisition and procurement**: buy from trusted suppliers, with security requirements in the contract.
2. **Assignment and accounting**: give every asset an **owner** and a **classification**.
3. **Monitoring and asset tracking**: keep an **inventory**, and use **enumeration** (discovery scans) to find what is really on the network.
4. **Disposal and decommissioning**: remove data and access before the asset leaves.

You cannot protect, patch or monitor what you do not know you have, so asset management underpins almost every other control.
`),
            text(`
## Disposal done right

- **Sanitisation**: overwrite or cryptographically erase data so it cannot be recovered.
- **Destruction**: shredding, pulverising or degaussing magnetic media when sanitisation is not enough.
- **Certification**: a certificate of destruction from the vendor proves it was done.
- **Data retention**: keep data only as long as policy and law require, then dispose of it.

Shadow IT (devices and services bought outside IT) is an asset management failure: those assets miss patching, monitoring and backups.
`),
            tip("Reconcile your inventory with network discovery each month. Every device that appears in one list and not the other is a finding."),
            check(
              "A vendor shreds old drives and provides a document proving it. What is this document?",
              ["A certificate of destruction", "A backout plan", "A honeytoken"],
              0,
              "Certification proves sanitisation or destruction was completed.",
            ),
          ],
        },
        {
          id: "automation",
          title: "Automation and orchestration",
          minutes: 10,
          blocks: [
            text(`
## Use cases

- **User and resource provisioning** (and deprovisioning).
- **Guard rails**: automatic checks that block insecure configurations.
- **Security groups** and access changes applied consistently.
- **Ticket creation** and **escalation** from alerts.
- **Enabling and disabling services and access** in response to events.
- **Continuous integration and testing** of code and configurations.
- **Integrations and APIs** connecting security tools (SOAR).

## Benefits

Efficiency and time saving, **enforcing baselines**, **standard infrastructure configurations**, scaling securely, faster **reaction time**, a **workforce multiplier**, and better **employee retention** (fewer boring, repetitive tasks).
`),
            text(`
## Other considerations

- **Complexity**: more moving parts to understand and debug.
- **Cost** of tools and the time to build them.
- **Single point of failure**: if the automation platform breaks, many processes stop.
- **Technical debt**: quick scripts that nobody maintains.
- **Ongoing supportability**: someone must own and update the automation.

Start with high-volume, low-risk tasks (enrichment, ticketing). Keep a human approval step for disruptive actions until the automation has proven itself.
`),
            tip("Every automation needs an owner, documentation and a way to switch it off quickly."),
            check(
              "Which is a risk of security automation rather than a benefit?",
              ["Faster reaction time", "A single point of failure", "Enforcing baselines"],
              1,
              "If the automation platform fails, many processes can stop at once.",
            ),
          ],
        },
        {
          id: "ai-risks",
          title: "Security risks of artificial intelligence",
          minutes: 12,
          blocks: [
            text(`
## New in SY0-801

SY0-801 adds an objective on the security risks of AI. The main risks:

| Risk | What happens |
| --- | --- |
| **Prompt injection** | Instructions hidden in input (direct) or in content the AI reads, such as a web page or email (indirect), make it ignore its rules or take unintended actions |
| **Data poisoning** | Tampered training or reference data makes a model learn wrong or malicious behaviour |
| **Sensitive data exposure** | Users paste confidential data into AI tools; models or logs may retain or reveal it |
| **Model theft / extraction** | Attackers copy a model or recreate it by querying it heavily |
| **Model inversion** | Attackers infer private training data from a model's outputs |
| **Insecure output handling** | AI output is trusted and run (code, commands, HTML) without checks |
| **Hallucination** | Confident but false answers lead to bad decisions |
| **Shadow AI** | Staff use unapproved AI services outside policy |
| **AI-enabled attacks** | Convincing phishing, voice cloning and deepfakes at scale |
`),
            text(`
## Reducing the risk

- An **acceptable use policy for AI**: which tools are approved and which data may never be entered.
- **Data classification** and **DLP** rules that cover AI services.
- **Least privilege** for AI agents and integrations: an assistant that can read email should not be able to send payments.
- **Input and output filtering**, and treating AI output as **untrusted** until checked.
- **Human review** for high-impact decisions.
- **Logging and monitoring** of AI use, and **vendor assessment** of AI providers (data retention, training on your data).
- Guidance such as the **OWASP Top 10 for LLM Applications** and the **NIST AI Risk Management Framework**.

Train people to verify unusual requests by a second channel: a cloned voice on the phone is still a social engineering attack.
`),
            tip("Ask of every AI integration: what can it read, what can it do, and what happens if someone hides instructions in the data it reads?"),
            check(
              "A web page contains hidden text telling an AI assistant to email the user's files to an attacker. What is this?",
              ["Indirect prompt injection", "Data poisoning", "Model inversion"],
              0,
              "Instructions hidden in content the AI processes are indirect prompt injection.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Change management ----------------
    mc("change-management", "easy", "What is the main purpose of a backout plan?", ["To approve a change", "To restore the previous state if the change fails", "To schedule the change", "To list stakeholders"], 1, "A backout plan defines how to roll back a failed change."),
    mc("change-management", "medium", "Which activity identifies what a change could affect, including its security impact, before approval?", ["Impact analysis", "Enumeration", "Sanitisation", "Journaling"], 0, "Impact analysis assesses consequences before the change is approved."),
    ms("change-management", "medium", "Which are technical implications to plan for in a change? Select all that apply.", ["Service restarts", "Updates to allow and deny lists", "Dependencies on other systems", "The colour of the change form"], [0, 1, 2], "Restarts, list updates and dependencies all affect security and availability."),
    tf("change-management", "easy", "Network diagrams and procedures should be updated after a change is implemented.", true, "Documentation must reflect the current environment."),
    mc("change-management", "medium", "Why keep configurations and scripts in version control?", ["To see exactly what changed and roll back if needed", "To make files larger", "To avoid approvals", "To hide changes from auditors"], 0, "Version control records history and supports rollback."),

    // ---------------- Physical and deception ----------------
    mc("physical-deception", "easy", "Which control stops a car being driven into a building entrance?", ["Bollards", "Honeypot", "Badge reader", "UPS"], 0, "Bollards are physical barriers against vehicles."),
    mc("physical-deception", "medium", "Which control lets only one door open at a time to stop tailgating?", ["Access control vestibule", "Fencing", "Lighting", "Honeynet"], 0, "An access control vestibule (mantrap) controls entry one person at a time."),
    mc("physical-deception", "medium", "Fake credentials planted in a database that trigger an alert when used are…", ["Honeytokens", "Bollards", "Snapshots", "Guard rails"], 0, "Honeytokens are decoy data whose use reveals an attacker."),
    mc("physical-deception", "hard", "In Zero Trust, which component decides whether a subject may access a resource?", ["Policy engine", "Policy enforcement point", "Implicit trust zone", "Data plane"], 0, "The policy engine makes the decision; the policy administrator acts on it and the enforcement point applies it."),
    mc("physical-deception", "medium", "Comparing your current controls against a framework to find what is missing is a…", ["Gap analysis", "Tabletop exercise", "Parallel test", "Honeypot"], 0, "Gap analysis compares current and target states."),

    // ---------------- Architectures ----------------
    mc("architectures", "medium", "Which architecture removes server patching from the customer but still requires securing function permissions and code?", ["Serverless", "On-premises", "Air-gapped", "Mainframe"], 0, "With serverless, the provider runs the servers; the customer secures code and permissions."),
    mc("architectures", "medium", "Industrial control systems usually put which priority first?", ["Availability and safety", "Lowest cost", "Fastest patching", "Public access"], 0, "ICS/SCADA control physical processes, so availability and safety come first."),
    tf("architectures", "medium", "Defining infrastructure as code lets teams review and scan configuration before it is deployed.", true, "IaC templates can be reviewed, versioned and scanned."),
    ms("architectures", "medium", "Which are common security problems with IoT devices? Select all that apply.", ["Default credentials", "Infrequent updates", "Long device lifetimes", "Mandatory full-disk encryption"], [0, 1, 2], "IoT devices often ship with weak defaults and receive few updates over long lives."),
    mc("architectures", "hard", "Data left in memory or storage from one tenant is exposed to the next tenant. What is this risk?", ["Resource reuse", "VM escape", "Risk transference", "Journaling"], 0, "Resources must be cleared before reuse in shared environments."),

    // ---------------- Resilience ----------------
    mc("resilience", "easy", "Which recovery site is the most expensive and fastest to switch to?", ["Hot site", "Warm site", "Cold site", "Branch office"], 0, "Hot sites are fully equipped with current data."),
    mc("resilience", "medium", "What does the recovery point objective (RPO) measure?", ["Maximum acceptable data loss, measured in time", "Maximum downtime", "Average time between failures", "Cost of the backup"], 0, "RPO is how much data you can afford to lose; RTO is how long you can be down."),
    ord("resilience", "medium", "Put these recovery tests from least to most disruptive.", ["Tabletop exercise", "Simulation", "Parallel processing", "Failover test"], "Tabletops are discussion only; failover actually switches production to recovery systems."),
    mc("resilience", "medium", "What gives servers time to shut down cleanly or for a generator to start during a power cut?", ["UPS", "Load balancer", "Honeypot", "SDN controller"], 0, "An uninterruptible power supply bridges short outages."),
    num("resilience", "hard", "A system fails on average every 2,000 hours and takes 4 hours to repair. What is its MTBF in hours?", 2000, 0, "MTBF is the average time between failures: 2,000 hours. MTTR is the 4-hour repair time."),

    // ---------------- Assets ----------------
    ord("assets", "easy", "Put the asset lifecycle stages in order.", ["Acquisition and procurement", "Assignment and accounting", "Monitoring and tracking", "Disposal and decommissioning"], "Assets are bought, assigned an owner, tracked, then disposed of securely."),
    mc("assets", "medium", "Scanning the network to discover every connected device is called…", ["Enumeration", "Sanitisation", "Journaling", "Replication"], 0, "Enumeration finds assets that may be missing from the inventory."),
    mc("assets", "medium", "Which method makes data on magnetic media unrecoverable by destroying its magnetic field?", ["Degaussing", "Snapshot", "Tokenisation", "Load balancing"], 0, "Degaussing erases magnetic media."),
    tf("assets", "easy", "Every asset should have a named owner.", true, "Ownership makes someone accountable for the asset's protection."),
    mc("assets", "medium", "Why is shadow IT an asset management problem?", ["Unknown assets miss patching, monitoring and backups", "It is always cheaper", "It improves inventory accuracy", "It is required by law"], 0, "Assets IT does not know about are not protected."),

    // ---------------- Automation ----------------
    ms("automation", "medium", "Which are benefits of security automation? Select all that apply.", ["Faster reaction time", "Enforcing baselines", "Workforce multiplier", "More technical debt"], [0, 1, 2], "Technical debt is a risk of automation, not a benefit."),
    mc("automation", "medium", "Automatic checks that stop someone deploying an insecure configuration are called…", ["Guard rails", "Honeytokens", "Bollards", "Snapshots"], 0, "Guard rails enforce secure configurations automatically."),
    tf("automation", "medium", "A human approval step is sensible for disruptive automated actions until the automation is proven.", true, "Keep people in the loop for high-impact actions."),
    mc("automation", "medium", "Which automation use case removes a leaver's access across systems quickly?", ["User deprovisioning", "Ticket escalation only", "Load balancing", "Journaling"], 0, "Automated deprovisioning closes access consistently and fast."),
    mc("automation", "hard", "A team relies on dozens of undocumented scripts written by someone who has left. Which concern is this?", ["Technical debt and ongoing supportability", "Risk transference", "Platform diversity", "Geographic dispersion"], 0, "Unmaintained automation creates technical debt and support problems."),

    // ---------------- AI risks ----------------
    mc("ai-risks", "easy", "Instructions typed directly into a chatbot to make it ignore its rules are…", ["Direct prompt injection", "Data poisoning", "Model theft", "Degaussing"], 0, "Direct prompt injection comes straight from the user's input."),
    mc("ai-risks", "medium", "Tampering with the data a model learns from so it behaves maliciously is…", ["Data poisoning", "Model inversion", "Hallucination", "Shadow AI"], 0, "Data poisoning corrupts training or reference data."),
    ms("ai-risks", "medium", "Which reduce the risk of sensitive data leaking through AI tools? Select all that apply.", ["An AI acceptable use policy", "DLP rules covering AI services", "Approved, assessed AI vendors", "Letting staff paste any data into any AI site"], [0, 1, 2], "Policy, DLP and vendor assessment all reduce data exposure."),
    tf("ai-risks", "medium", "AI-generated output, such as code or commands, should be treated as untrusted until it is checked.", true, "Insecure output handling is a recognised AI risk."),
    st("ai-risks", "hard", "Staff using unapproved AI services outside company policy is called ______ AI. (one word)", ["shadow"], "Shadow AI, like shadow IT, bypasses security review."),
  ],
};
