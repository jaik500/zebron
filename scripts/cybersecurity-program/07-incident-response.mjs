import { check, mc, ms, ord, st, text, tf, tip } from "./helpers.mjs";

export default {
  order: 7,
  id: "cybersecurity-incident-response",
  title: "Incident Response and Digital Forensics",
  summary: "Course 7 of 8 in the Zebron Cybersecurity Program. What to do when an attack is real: the response lifecycle, ransomware, evidence handling and lessons learned.",
  description: `
Every organisation will face an incident. This course walks through the incident response lifecycle, preparing the team and the plan, containing and eradicating an attack, collecting evidence that will stand up later, handling ransomware, and turning each incident into improvements.

Each lesson ends with a quick check. The final exam is drawn from the **Incident Response and Digital Forensics** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "sunrise",
  outcomes: [
    "Explain the NIST incident response lifecycle",
    "Prepare an incident response plan, team and communication tree",
    "Choose containment and eradication actions for common incidents",
    "Collect evidence in order of volatility with a chain of custody",
    "Run a blameless lessons-learned review",
  ],
  skills: ["Incident response", "Containment", "Digital forensics", "Chain of custody", "Ransomware response"],
  quiz: {
    name: "Incident Response and Digital Forensics",
    slug: "cybersecurity-incident-response",
    description: "Practice questions for Course 7 of the Cybersecurity Program: IR lifecycle, preparation, containment, forensics and lessons learned.",
    tags: ["cybersecurity", "incident-response", "forensics"],
  },
  topics: [
    { key: "lifecycle", name: "The incident response lifecycle", description: "Events, incidents and the phases of response." },
    { key: "preparation", name: "Preparation and communication", description: "Plans, teams, tabletop exercises and notification." },
    { key: "containment", name: "Containment, eradication and recovery", description: "Stopping the spread, removing the attacker, restoring safely." },
    { key: "forensics", name: "Digital forensics", description: "Order of volatility, imaging, hashing and chain of custody." },
    { key: "post-incident", name: "Ransomware and lessons learned", description: "Ransomware decisions and post-incident review." },
  ],
  modules: [
    {
      id: "responding",
      title: "Responding to incidents",
      lessons: [
        {
          id: "lifecycle",
          title: "The incident response lifecycle",
          minutes: 11,
          blocks: [
            text(`
## Events and incidents

- An **event** is anything observable: a sign-in, a file opened, a firewall block.
- An **incident** is an event (or series of events) that harms, or threatens to harm, the confidentiality, integrity or availability of systems or data, or breaks security policy.

Most events are normal. The SOC's job is to find the few that are incidents.

## The NIST lifecycle

NIST SP 800-61 describes the classic phases:

1. **Preparation**: plans, people, tools and training before anything happens.
2. **Detection and analysis**: spot the incident, confirm it, work out scope and severity.
3. **Containment, eradication and recovery**: stop the spread, remove the attacker, restore systems.
4. **Post-incident activity**: lessons learned, improvements and reporting.

It is a **cycle**: what you learn feeds back into preparation. The 2025 revision of SP 800-61 aligns incident response with the six functions of NIST CSF 2.0, but the ideas are the same. The SANS model splits the same work into six steps: Preparation, Identification, Containment, Eradication, Recovery, Lessons learned (PICERL).
`),
            text(`
## Severity

Teams rate incidents so the right people get involved quickly, for example:

| Severity | Example |
| --- | --- |
| **Low** | One phishing email clicked, no credentials entered |
| **Medium** | One compromised mailbox, contained quickly |
| **High** | Malware on several servers, possible data access |
| **Critical** | Ransomware across the company, or confirmed theft of sensitive data |

Severity decides who is called, how fast, and whether leadership, legal and communications teams join.
`),
            tip("Start an incident log the moment you suspect an incident: time, who, what was seen, what was done. You will need it for the report and possibly for lawyers."),
            check(
              "Which NIST phase includes writing the incident response plan and training the team?",
              ["Preparation", "Recovery", "Post-incident activity"],
              0,
              "Preparation happens before an incident: plans, people, tools and training.",
            ),
          ],
        },
        {
          id: "preparation",
          title: "Preparation and communication",
          minutes: 11,
          blocks: [
            text(`
## The plan

An **incident response plan (IRP)** covers:

- Scope, definitions and severity levels.
- Roles: **incident commander** (runs the response), technical leads, scribe, communications, legal, HR, leadership.
- Contact lists, including **out-of-band** channels (if email is compromised, how do you talk?).
- Playbooks for common incidents: phishing, malware, ransomware, lost device, data leak, account takeover.
- Who may make big decisions: shutting down systems, contacting police, paying (or not paying) a ransom.
- Retainers with outside help: an incident response firm, a lawyer, your cyber insurer.

A **CSIRT** (computer security incident response team) is the group that carries out the plan.
`),
            text(`
## Practise before it is real

A **tabletop exercise** walks the team through a realistic scenario around a table: "It is Monday 7 a.m. and staff report their files end in .locked." People discover gaps safely: missing phone numbers, unclear decisions, untested backups.

## Telling the right people

Incidents often have **legal and regulatory deadlines**. For example, GDPR requires notifying the supervisory authority of a personal data breach within **72 hours** of becoming aware of it, where it is likely to put people's rights at risk. Sector rules, contracts and other laws add their own deadlines.

Coordinate external statements with legal and communications teams. Never guess in public about the cause or scope.
`),
            tip("Print the contact list. During a ransomware attack, the document that lists who to call may be encrypted too."),
            check(
              "Under GDPR, how quickly must a qualifying personal data breach be reported to the supervisory authority?",
              ["Within 24 hours", "Within 72 hours", "Within 30 days"],
              1,
              "GDPR sets 72 hours from becoming aware of the breach, where it is likely to risk people's rights and freedoms.",
            ),
          ],
        },
        {
          id: "containment",
          title: "Containment, eradication and recovery",
          minutes: 13,
          blocks: [
            text(`
## Containment: stop it spreading

**Short-term** containment buys time:

- Isolate infected hosts with EDR, or move them to a quarantine VLAN.
- Disable or reset compromised accounts and **revoke sessions and tokens**.
- Block malicious IPs, domains and hashes at the firewall, proxy, email gateway and EDR.

**Long-term** containment keeps business running while you prepare a clean fix: temporary rules, extra monitoring, rebuilt jump hosts.

Balance speed with evidence: pulling the power cord destroys memory evidence. Isolating the host on the network usually keeps both.

Sometimes teams **watch before acting** to learn the attacker's full footprint, so they can remove everything at once. That is a leadership decision with clear risk limits.
`),
            text(`
## Eradication and recovery

**Eradication** removes the attacker completely:

- Remove malware and every persistence mechanism found.
- Close the way in: patch the exploited flaw, fix the misconfiguration, enforce MFA.
- Reset all credentials the attacker could have seen, including service accounts and, in a domain compromise, the KRBTGT account (twice).

**Recovery** brings systems back safely:

- Rebuild from known-good images rather than "cleaning" badly compromised machines.
- Restore data from backups taken **before** the compromise, scanned before use.
- Bring systems back in stages, watching closely for signs the attacker is still there.
`),
            tip("Before restoring, ask: how did they get in, and is that door closed? Restoring onto the same open door means doing this again next week."),
            check(
              "Which action best contains a ransomware-infected laptop while keeping memory evidence?",
              ["Pull the power cord", "Isolate it from the network with EDR", "Reinstall Windows immediately"],
              1,
              "Network isolation stops the spread while the running system, and its memory, stay available for investigation.",
            ),
          ],
        },
      ],
    },
    {
      id: "evidence-and-learning",
      title: "Evidence and learning",
      lessons: [
        {
          id: "forensics",
          title: "Digital forensics essentials",
          minutes: 13,
          blocks: [
            text(`
## Order of volatility

Collect the most fleeting evidence first (based on RFC 3227):

1. CPU registers and cache
2. Memory (RAM): running processes, network connections, keys, injected malware
3. Network state and temporary system data (ARP cache, routing table)
4. Disk: files, logs, swap
5. Remote logs and monitoring data
6. Backups and archived media

Memory can show malware that never touched the disk, which is why you avoid shutting a machine down before capturing it when possible.

## Imaging and hashing

- Make a **forensic image**: a bit-for-bit copy of the disk, taken with a **write blocker** so the original is not changed.
- **Hash** the original and the image (SHA-256). Matching hashes prove the copy is exact.
- Analyse the **copy**, never the original.
`),
            text(`
## Chain of custody

The **chain of custody** records every person who handled the evidence: what it is, when it was collected, by whom, where it was stored, and every transfer. A gap can make evidence inadmissible in court.

## What investigators look at

- **Timelines** built from file system times, logs and EDR data.
- Windows artefacts: event logs, registry, **Prefetch** (programs that ran), browser history, the \`$MFT\` file table.
- Linux artefacts: shell history, auth logs, cron, systemd units.
- Memory analysis with tools such as **Volatility**; disk analysis with tools such as **Autopsy**.

A **legal hold** tells staff not to delete relevant data when litigation is possible, overriding normal retention rules.
`),
            tip("Write down the time on the system clock and how far it is from real time before you collect anything. It saves hours of confusion when building the timeline."),
            check(
              "Which should be collected first?",
              ["Backup tapes", "System memory (RAM)", "Archived email"],
              1,
              "RAM is lost when power goes, so it comes early in the order of volatility.",
            ),
          ],
        },
        {
          id: "post-incident",
          title: "Ransomware and lessons learned",
          minutes: 12,
          blocks: [
            text(`
## Ransomware in practice

Modern ransomware is usually **double extortion**: attackers steal data first, then encrypt systems, and threaten to publish the data if not paid. Some add DDoS or contact customers directly.

A typical path: phishing or exposed RDP/VPN → stolen credentials → privilege escalation → disabling security tools and deleting backups → mass encryption, often at night or on a weekend.

Key decisions belong to leadership with legal advice:

- Paying does not guarantee working decryption or that stolen data is deleted, and payments can be illegal if the group is sanctioned. Law enforcement and agencies such as CISA advise against paying.
- Check with your insurer and lawyers early.
- Report to law enforcement; they may have decryptors or intelligence.

The best answer is preparation: offline or immutable backups, tested restores, MFA everywhere, no internet-facing RDP, EDR on every device.
`),
            text(`
## Lessons learned

Hold a review within about two weeks of closing the incident, while memories are fresh. Keep it **blameless**: the goal is to fix systems and processes, not to punish people who report mistakes.

Questions to answer:

- What happened, and when (the timeline)?
- How was it detected, and could we have detected it earlier?
- What worked well, and what slowed us down?
- What will we change: controls, detections, playbooks, training, contacts?

Each improvement gets an **owner and a due date**. Measure metrics such as time to detect and time to contain, and compare them across incidents.
`),
            tip("If people fear blame, they hide mistakes, and you find out about incidents later. Thank people who report quickly, even when they caused the problem."),
            check(
              "What is double extortion in a ransomware attack?",
              ["Encrypting the data twice", "Stealing data and also encrypting it, threatening to leak it", "Asking two different victims for payment"],
              1,
              "Attackers both encrypt systems and threaten to publish stolen data.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Lifecycle ----------------
    ord("lifecycle", "easy", "Put the phases of the NIST incident response lifecycle in order.", ["Preparation", "Detection and analysis", "Containment, eradication and recovery", "Post-incident activity"], "Prepare, detect and analyse, contain/eradicate/recover, then learn from it."),
    mc("lifecycle", "easy", "What is the difference between an event and an incident?", ["There is no difference", "An incident is an event that harms or threatens security", "An event is always malicious", "An incident is only a hardware failure"], 1, "Events are any observable occurrence; incidents threaten confidentiality, integrity or availability or break policy."),
    st("lifecycle", "medium", "In the SANS PICERL model, what does the final L stand for? (two words)", ["Lessons learned", "lessons learnt"], "PICERL: Preparation, Identification, Containment, Eradication, Recovery, Lessons learned."),
    tf("lifecycle", "easy", "The incident response lifecycle is a cycle: lessons learned feed back into preparation.", true, "Each incident should improve plans, controls and detections."),
    mc("lifecycle", "medium", "Ransomware has encrypted most company servers. Which severity fits best?", ["Low", "Medium", "High", "Critical"], 3, "Widespread ransomware affecting core services is a critical incident."),

    // ---------------- Preparation ----------------
    mc("preparation", "easy", "Who runs the overall response during a major incident?", ["The incident commander", "Every analyst independently", "The newest team member", "The external auditor"], 0, "An incident commander coordinates people, decisions and communication."),
    mc("preparation", "medium", "What is a tabletop exercise?", ["Cleaning the SOC desks", "A discussion-based walkthrough of an incident scenario", "A live attack on production systems", "A hardware inventory"], 1, "Tabletops let the team practise decisions and find gaps without real impact."),
    mc("preparation", "medium", "Why does an IR plan need out-of-band communication channels?", ["They are cheaper", "Normal email or chat may be compromised or down", "Regulators require video calls", "To avoid using phones"], 1, "If attackers control email or Teams, they can read the response. A separate channel keeps it private."),
    ms("preparation", "medium", "Which outside parties are often contacted during a serious breach? Select all that apply.", ["Legal counsel", "Cyber insurer", "Law enforcement", "Every customer, before the facts are known"], [0, 1, 2], "Lawyers, insurers and law enforcement are common early contacts. Customer communication is coordinated once facts are confirmed."),
    tf("preparation", "medium", "GDPR requires notifying the supervisory authority of a qualifying personal data breach within 72 hours of becoming aware of it.", true, "Article 33 sets the 72-hour deadline, where the breach is likely to risk people's rights and freedoms."),

    // ---------------- Containment ----------------
    mc("containment", "easy", "A user's account is confirmed compromised. Which action is part of containment?", ["Revoke their sessions and reset the password", "Wait until next week", "Publish the incident on social media", "Delete the logs"], 0, "Ending active sessions and resetting credentials stops the attacker using the account."),
    mc("containment", "medium", "Why is rebuilding a badly compromised server from a known-good image often better than cleaning it?", ["It is always faster", "Hidden persistence may survive cleaning", "Images are free", "It deletes the logs"], 1, "Attackers hide persistence in many places. A clean rebuild removes what you did not find."),
    mc("containment", "medium", "Before restoring data from backup after ransomware, what must you confirm?", ["The backup was taken before the compromise and the way in is closed", "The backup is the newest one available", "The ransom was paid", "The servers are turned off for a month"], 0, "Restoring from a backup that contains the attacker's tools, or onto an unfixed system, invites reinfection."),
    tf("containment", "medium", "Pulling the power cord is always the best way to contain an infected machine.", false, "It destroys volatile evidence such as memory. Network isolation usually contains the threat while preserving evidence."),
    mc("containment", "hard", "After a full Active Directory compromise, which account's password should be reset twice to invalidate forged Kerberos tickets?", ["Guest", "KRBTGT", "Administrator", "DefaultAccount"], 1, "KRBTGT signs Kerberos tickets. Resetting it twice (with replication in between) invalidates golden tickets."),

    // ---------------- Forensics ----------------
    ord("forensics", "medium", "Put these in order of volatility, most volatile first.", ["CPU cache and registers", "RAM", "Disk", "Backups"], "Collect the most fleeting data first: CPU, memory, disk, then archives."),
    mc("forensics", "easy", "What does a chain of custody record?", ["Network routes", "Everyone who handled the evidence and when", "Firewall rules", "Employee salaries"], 1, "It documents collection, storage and every transfer of evidence."),
    mc("forensics", "medium", "Why do investigators hash a disk image?", ["To compress it", "To prove the copy matches the original and has not changed", "To encrypt it", "To delete malware"], 1, "Matching hashes prove integrity of the evidence."),
    mc("forensics", "medium", "Which device stops a forensic workstation from writing to the original drive?", ["Write blocker", "Load balancer", "Proxy", "Switch"], 0, "A write blocker allows read-only access to evidence media."),
    tf("forensics", "medium", "Investigators should analyse the original evidence drive directly to save time.", false, "Analysis is done on verified copies so the original stays unchanged."),

    // ---------------- Post-incident ----------------
    mc("post-incident", "easy", "What should a lessons-learned meeting focus on?", ["Finding someone to blame", "Improving systems, processes and detections", "Closing the ticket as fast as possible", "Deleting evidence"], 1, "A blameless review encourages honest reporting and leads to real improvements."),
    ms("post-incident", "medium", "Which measures most reduce ransomware impact? Select all that apply.", ["Offline or immutable backups with tested restores", "MFA on remote access", "No internet-facing RDP", "Sharing one admin password across servers"], [0, 1, 2], "Backups, MFA and closing exposed RDP are top defenses. Shared admin passwords help attackers spread."),
    tf("post-incident", "medium", "Paying a ransom guarantees that the stolen data is deleted.", false, "There is no guarantee. Criminals may keep, sell or leak the data anyway."),
    mc("post-incident", "medium", "Each improvement from a lessons-learned review should have…", ["An owner and a due date", "No follow-up", "Only a verbal agreement", "A secret budget"], 0, "Ownership and deadlines make sure improvements actually happen."),
    mc("post-incident", "hard", "Why might paying a ransom be illegal in some cases?", ["Payments are always tax-deductible", "The ransomware group may be on a sanctions list", "Cryptocurrency is banned everywhere", "Insurers forbid all payments"], 1, "Paying a sanctioned group can breach sanctions law. Legal advice is essential."),
  ],
};
