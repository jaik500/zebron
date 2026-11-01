import { check, mc, ms, ord, st, text, tf, tip } from "./helpers.mjs";

export default {
  order: 8,
  id: "cybersecurity-cloud-appsec-grc",
  title: "Cloud, Application Security and GRC",
  summary: "Course 8 of 8 in the Zebron Cybersecurity Program. Securing cloud accounts and applications, and the governance, risk and compliance work that holds the program together.",
  description: `
The final course brings it together. You will learn the shared responsibility model and the cloud mistakes behind most cloud breaches, secure development practices and the OWASP Top 10, and how governance, policies, audits and data protection turn security into a lasting program.

Each lesson ends with a quick check. The final exam is drawn from the **Cloud, Application Security and GRC** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "teal",
  outcomes: [
    "Apply the shared responsibility model to IaaS, PaaS and SaaS",
    "Find and fix common cloud misconfigurations",
    "Explain the OWASP Top 10 and secure development practices",
    "Describe policies, standards, procedures and audits",
    "Explain data classification, privacy and third-party risk",
  ],
  skills: ["Cloud security", "Shared responsibility", "OWASP Top 10", "Secure SDLC", "Governance and compliance"],
  quiz: {
    name: "Cloud, Application Security and GRC",
    slug: "cybersecurity-cloud-appsec-grc",
    description: "Practice questions for Course 8 of the Cybersecurity Program: cloud security, application security and governance, risk and compliance.",
    tags: ["cybersecurity", "cloud", "appsec", "grc"],
  },
  topics: [
    { key: "cloud-model", name: "Cloud models and shared responsibility", description: "IaaS, PaaS, SaaS and who secures what." },
    { key: "cloud-security", name: "Securing cloud accounts", description: "Identity, misconfigurations, logging and posture management." },
    { key: "appsec", name: "Application security", description: "OWASP Top 10, secure SDLC and testing." },
    { key: "governance", name: "Governance, policies and audits", description: "Policy hierarchy, audits and security awareness." },
    { key: "data-privacy", name: "Data protection and third-party risk", description: "Classification, privacy, DLP and vendor risk." },
  ],
  modules: [
    {
      id: "cloud-and-apps",
      title: "Cloud and applications",
      lessons: [
        {
          id: "cloud-model",
          title: "Cloud models and shared responsibility",
          minutes: 11,
          blocks: [
            text(`
## Service models

| Model | You get | Examples |
| --- | --- | --- |
| **IaaS** | Virtual machines, networks, storage | AWS EC2, Azure Virtual Machines, Google Compute Engine |
| **PaaS** | A platform to run your code or data | Azure App Service, Google App Engine, managed databases |
| **SaaS** | A finished application | Microsoft 365, Google Workspace, Salesforce |

Deployment models: **public** cloud, **private** cloud, **hybrid** (both, connected) and **multi-cloud** (several providers).

## Shared responsibility

The provider always secures the **physical data centres, hardware and core infrastructure** ("security **of** the cloud"). The customer is always responsible for **their data, their identities and who has access** ("security **in** the cloud"). In between, it depends on the model:

| | IaaS | PaaS | SaaS |
| --- | --- | --- | --- |
| Operating system patching | Customer | Provider | Provider |
| Application code | Customer | Customer | Provider |
| Data, identities, access | **Customer** | **Customer** | **Customer** |
`),
            text(`
## Why it matters

Most cloud breaches are not the provider being hacked. They are customers who:

- Leave storage buckets public.
- Use accounts without MFA, or long-lived access keys pasted into code.
- Give far more permissions than needed.
- Never turn on logging.

The provider gives you the tools; using them correctly is your job.
`),
            tip("For any cloud service you adopt, write down who is responsible for patching, backups, identity and logging. Gaps in that list become incidents."),
            check(
              "In SaaS, who is responsible for deciding which users can access the data?",
              ["The provider", "The customer", "Nobody"],
              1,
              "Identity and access to your data always stay with the customer, in every model.",
            ),
          ],
        },
        {
          id: "cloud-security",
          title: "Securing cloud accounts",
          minutes: 12,
          blocks: [
            text(`
## Identity is the new perimeter

- Protect the **root / global admin** accounts with phishing-resistant MFA and do not use them day to day.
- Use **roles** and short-lived credentials instead of long-lived access keys. Never commit keys to code repositories; use a **secrets manager**.
- Grant **least privilege** with specific policies, and review unused permissions.
- Separate environments (production, development) into different accounts or subscriptions.

## Common misconfigurations

- Public object storage (S3 buckets, Azure Blob containers, Google Cloud Storage buckets).
- Security groups allowing \`0.0.0.0/0\` (the whole internet) to SSH, RDP or databases.
- Disabled audit logging, or logs stored where an attacker with admin rights can delete them.
- Unencrypted storage or snapshots shared publicly.
- Workloads that can reach the **instance metadata service** and steal role credentials through a server-side request forgery (SSRF) flaw.
`),
            text(`
## Tools that help

- **CSPM** (cloud security posture management): continuously checks configurations against best practices and frameworks.
- **CWPP** (cloud workload protection): protects VMs, containers and serverless functions.
- **CNAPP**: platforms that combine posture, workload and identity checks.
- **CASB** (cloud access security broker): visibility and control over which SaaS apps staff use (including **shadow IT**).
- **Infrastructure as code** (Terraform, CloudFormation, Bicep) with automated security scanning, so mistakes are caught before deployment.

**Containers**: use small, trusted base images, scan them for vulnerabilities, do not run as root, and keep secrets out of images.
`),
            tip("Turn on the provider's built-in security hub (such as AWS Security Hub, Microsoft Defender for Cloud or Google Security Command Center) on day one. The first report will teach you a lot about your environment."),
            check(
              "A security group allows 0.0.0.0/0 to port 22. What does that mean?",
              ["Only the office can use SSH", "Anyone on the internet can try to connect to SSH", "SSH is disabled"],
              1,
              "0.0.0.0/0 means every IPv4 address. SSH should be limited to known addresses or reached through a bastion or VPN.",
            ),
          ],
        },
        {
          id: "appsec",
          title: "Application security and the OWASP Top 10",
          minutes: 13,
          blocks: [
            text(`
## The OWASP Top 10

The **OWASP Top 10** lists the most critical web application security risks. The 2021 edition:

1. **Broken access control**: users can act outside their permissions.
2. **Cryptographic failures**: sensitive data not protected properly.
3. **Injection**: including SQL injection and cross-site scripting.
4. **Insecure design**: flaws in the design itself, not just the code.
5. **Security misconfiguration**: default settings, verbose errors, open cloud storage.
6. **Vulnerable and outdated components**: old libraries with known flaws.
7. **Identification and authentication failures**: weak login and session handling.
8. **Software and data integrity failures**: untrusted updates and pipelines.
9. **Security logging and monitoring failures**: attacks nobody sees.
10. **Server-side request forgery (SSRF)**: the server is tricked into making requests for the attacker.

OWASP updates the list every few years, so check for the latest edition.
`),
            text(`
## Building security in (secure SDLC)

- **Requirements and design**: security requirements and **threat modelling** (for example with **STRIDE**: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege).
- **Code**: secure coding standards, input validation, output encoding, parameterised queries, peer review.
- **Test**:
  - **SAST** (static testing) scans source code without running it.
  - **DAST** (dynamic testing) attacks the running application from outside.
  - **SCA** (software composition analysis) finds vulnerable open-source libraries.
- **Deploy**: secrets in a vault, signed builds, least-privilege pipelines (**DevSecOps**).
- **Operate**: logging, a WAF, patching, and a way for outsiders to report bugs (a **vulnerability disclosure program** or bug bounty).

Fixing a flaw in design costs far less than fixing it after release. This is called **shifting left**.
`),
            tip("Ask developers to explain one feature's threat model to you. You will learn the app, and they will spot risks themselves."),
            check(
              "Which testing method analyses source code without running it?",
              ["DAST", "SAST", "Penetration testing"],
              1,
              "Static application security testing (SAST) examines code at rest.",
            ),
          ],
        },
      ],
    },
    {
      id: "governance",
      title: "Governance, risk and compliance",
      lessons: [
        {
          id: "governance",
          title: "Governance, policies and audits",
          minutes: 11,
          blocks: [
            text(`
## The document hierarchy

| Document | What it is | Example |
| --- | --- | --- |
| **Policy** | High-level, mandatory statement of intent approved by leadership | "All remote access must use MFA." |
| **Standard** | Specific mandatory requirements that support a policy | "MFA must use an authenticator app or security key." |
| **Procedure** | Step-by-step instructions | "How to enrol a new device for MFA." |
| **Guideline** | Recommended, not mandatory | "Tips for choosing a passphrase." |

Common policies: acceptable use, information security, access control, password/authentication, data classification, incident response, business continuity, remote work, bring your own device (BYOD).
`),
            text(`
## Governance and audits

- **Governance** sets direction and accountability: who owns which risks, how security is funded, how leadership and the board oversee it.
- **Due care** means doing what a reasonable organisation would do; **due diligence** means checking that it is actually done.
- **Audits** check controls against a standard or regulation. Internal audits find issues early; external audits give independent assurance, such as an **ISO/IEC 27001** certification audit or a **SOC 2** report (common for SaaS providers).
- An **exception** process lets the business accept a documented risk temporarily, with an owner and an expiry date.

## Security awareness

People are part of the control set. A good program includes onboarding training, short regular refreshers, phishing simulations, role-specific training (developers, finance, executives) and measurement of reporting rates, not only click rates.
`),
            tip("Policies nobody reads protect nobody. Keep them short, plain and tied to the procedures people actually use."),
            check(
              "Which document gives step-by-step instructions for a task?",
              ["Policy", "Procedure", "Guideline"],
              1,
              "Procedures describe exactly how to do something; policies say what must be achieved.",
            ),
          ],
        },
        {
          id: "data-privacy",
          title: "Data protection, privacy and third-party risk",
          minutes: 12,
          blocks: [
            text(`
## Classify, then protect

Data classification labels data by sensitivity, for example **Public**, **Internal**, **Confidential**, **Restricted**. Each level has handling rules: who can see it, whether it must be encrypted, where it may be stored, how it is destroyed.

Roles:

- **Data owner**: a business leader accountable for a data set and its classification.
- **Data custodian**: IT or security staff who implement the controls.
- **Data processor** (privacy law term): a company that processes personal data on behalf of the **controller**.

Special categories need extra care: **PII** (personally identifiable information), **PHI** (health information), payment card data.

**Data loss prevention (DLP)** tools spot and block sensitive data leaving through email, uploads or USB. Secure disposal includes cryptographic erasure, degaussing and physical destruction.
`),
            text(`
## Privacy principles

Privacy laws such as **GDPR** share common principles: a lawful basis for processing, **purpose limitation**, **data minimisation** (collect only what you need), accuracy, **storage limitation**, security, and respect for people's rights (access, correction, deletion).

**Privacy by design** builds these in from the start. A **data protection impact assessment (DPIA)** is required for high-risk processing under GDPR.

## Third-party risk

Suppliers often have access to your data or systems. Manage them through:

- **Due diligence** before signing: security questionnaires, SOC 2 or ISO 27001 reports.
- **Contracts**: security requirements, breach notification duties, right to audit, data processing agreements.
- **Ongoing monitoring** and access reviews; **offboarding** that removes access and recovers data at the end.

Your **fourth parties** (your suppliers' suppliers) matter too.
`),
            tip("Keep a list of every supplier that holds your data, what data they hold and who owns the relationship. It is the first thing you will need when a supplier has a breach."),
            check(
              "Collecting only the personal data needed for a purpose is called…",
              ["Data minimisation", "Data replication", "Data mining"],
              0,
              "Data minimisation is a core privacy principle in GDPR and many other laws.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Cloud model ----------------
    mc("cloud-model", "easy", "Microsoft 365 is an example of which cloud service model?", ["IaaS", "PaaS", "SaaS", "On-premises"], 2, "Microsoft 365 is a finished application delivered as a service: SaaS."),
    mc("cloud-model", "medium", "In IaaS, who patches the guest operating system on a virtual machine?", ["The cloud provider", "The customer", "The hardware vendor", "Nobody"], 1, "In IaaS the customer manages the operating system and everything above it."),
    tf("cloud-model", "easy", "In every cloud model, the customer remains responsible for its data and who can access it.", true, "Data, identities and access always stay with the customer."),
    mc("cloud-model", "medium", "A company uses AWS and Azure for different workloads. This is…", ["Private cloud", "Multi-cloud", "SaaS only", "Air-gapped"], 1, "Using more than one cloud provider is a multi-cloud approach."),
    mc("cloud-model", "medium", "Most cloud data breaches are caused by…", ["Providers' data centres being broken into", "Customer misconfigurations and weak identity controls", "Solar flares", "Cloud hardware wearing out"], 1, "Public storage, missing MFA, leaked keys and excessive permissions cause most cloud breaches."),

    // ---------------- Cloud security ----------------
    mc("cloud-security", "medium", "A developer commits a cloud access key to a public code repository. What is the best immediate action?", ["Delete the commit and do nothing else", "Revoke or rotate the key immediately, then review its activity", "Make the repository private and keep the key", "Email the key to the security team"], 1, "Assume the key is already stolen: revoke it, then check what it was used for. Removing the commit is not enough."),
    mc("cloud-security", "medium", "Which tool continuously checks cloud configurations against best practices?", ["CSPM", "DHCP", "FTP", "VLAN"], 0, "Cloud security posture management finds misconfigurations such as public buckets and open security groups."),
    ms("cloud-security", "medium", "Which are good practices for cloud identities? Select all that apply.", ["Phishing-resistant MFA on admin accounts", "Using the root account for daily work", "Short-lived role credentials instead of long-lived keys", "Least-privilege policies"], [0, 2, 3], "Protect and avoid the root account, prefer short-lived credentials, and grant least privilege."),
    mc("cloud-security", "hard", "An SSRF flaw lets an attacker make a cloud server request an internal address and steal its role credentials. Which service is usually targeted?", ["The instance metadata service", "The public DNS root", "The email gateway", "The CDN cache"], 0, "The metadata service can hand out temporary credentials. IMDSv2 and similar protections make SSRF theft harder."),
    tf("cloud-security", "medium", "Container images should run as root by default for best security.", false, "Containers should run as non-root users with minimal privileges."),

    // ---------------- AppSec ----------------
    mc("appsec", "easy", "Which project publishes the well-known Top 10 list of web application security risks?", ["OWASP", "NIST", "ISO", "CIS"], 0, "The Open Worldwide Application Security Project (OWASP) maintains the Top 10."),
    mc("appsec", "medium", "In the OWASP Top 10 (2021), which risk is ranked number one?", ["Injection", "Broken access control", "Cryptographic failures", "SSRF"], 1, "Broken access control moved to number one in the 2021 edition."),
    mc("appsec", "medium", "Which test finds known-vulnerable open-source libraries used by an application?", ["SCA", "DAST", "Tabletop exercise", "Red teaming"], 0, "Software composition analysis inventories dependencies and matches them to known vulnerabilities."),
    st("appsec", "hard", "In the STRIDE threat model, what does the T stand for?", ["Tampering"], "STRIDE: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege."),
    ord("appsec", "medium", "Put these secure development stages in order.", ["Define security requirements", "Threat model the design", "Write and review code", "Run SAST, DAST and SCA", "Deploy and monitor"], "Security starts with requirements and design, then code, test, deploy and monitor."),

    // ---------------- Governance ----------------
    mc("governance", "easy", "Which document is a high-level, mandatory statement approved by leadership?", ["Guideline", "Procedure", "Policy", "Checklist"], 2, "Policies state what must happen; standards and procedures support them."),
    mc("governance", "medium", "A SaaS vendor shares an independent report on its security controls with customers. Which report is common for this?", ["SOC 2", "CVE", "OWASP Top 10", "ATT&CK matrix"], 0, "SOC 2 reports from independent auditors describe a service organisation's controls."),
    tf("governance", "easy", "Guidelines are recommendations rather than mandatory requirements.", true, "Policies, standards and procedures are mandatory; guidelines advise."),
    mc("governance", "medium", "A business needs to keep an old system that breaks the patching standard for three months. What is the right process?", ["Ignore the standard", "A documented exception with an owner, compensating controls and an expiry date", "Delete the standard", "Hide the system from auditors"], 1, "Exceptions make accepted risk visible, owned and time-limited."),
    ms("governance", "medium", "Which make a security awareness program effective? Select all that apply.", ["Short, regular training", "Phishing simulations with easy reporting", "Measuring reporting rates", "Punishing everyone who clicks once"], [0, 1, 2], "Regular, practical training and encouraging reports work better than punishment."),

    // ---------------- Data and privacy ----------------
    mc("data-privacy", "easy", "Who is accountable for a data set's classification?", ["The data owner", "The help desk", "Any employee", "The cloud provider"], 0, "The data owner, usually a business leader, is accountable for classification and access decisions."),
    mc("data-privacy", "medium", "Which tool can block an email that contains many credit card numbers from leaving the company?", ["DLP", "DHCP", "NTP", "VPN"], 0, "Data loss prevention detects sensitive data patterns and can block or quarantine messages."),
    mc("data-privacy", "medium", "Under GDPR, a company that processes personal data on behalf of another company is the…", ["Controller", "Processor", "Data subject", "Supervisory authority"], 1, "The controller decides why and how data is processed; the processor acts on its behalf."),
    tf("data-privacy", "medium", "Third-party risk management ends once the contract is signed.", false, "Suppliers need ongoing monitoring, reviews and proper offboarding."),
    ms("data-privacy", "medium", "Which are GDPR privacy principles? Select all that apply.", ["Data minimisation", "Purpose limitation", "Storage limitation", "Keep all data forever just in case"], [0, 1, 2], "GDPR requires collecting only what is needed, for a stated purpose, kept no longer than necessary."),
  ],
};
