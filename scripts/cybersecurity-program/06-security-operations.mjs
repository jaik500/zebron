import { check, mc, ms, ord, st, text, tf, tip } from "./helpers.mjs";

export default {
  order: 6,
  id: "cybersecurity-security-operations",
  title: "Security Operations and Monitoring",
  summary: "Course 6 of 8 in the Zebron Cybersecurity Program. Life in a SOC: logs, SIEM, alert triage, detection engineering and threat hunting.",
  description: `
This is the course for future SOC analysts. You will learn what a security operations centre does, which logs matter, how a SIEM turns them into alerts, how to triage an alert step by step, and how teams write detections and hunt for threats nobody has alerted on yet.

Each lesson ends with a quick check. The final exam is drawn from the **Security Operations and Monitoring** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "teal",
  outcomes: [
    "Describe SOC tiers, shifts and key metrics",
    "Name the log sources that matter most and what each shows",
    "Explain how a SIEM collects, normalises and correlates events",
    "Triage an alert and write a clear escalation note",
    "Describe detection engineering and hypothesis-driven threat hunting",
  ],
  skills: ["SOC operations", "Log analysis", "SIEM", "Alert triage", "Threat hunting"],
  quiz: {
    name: "Security Operations and Monitoring",
    slug: "cybersecurity-security-operations",
    description: "Practice questions for Course 6 of the Cybersecurity Program: SOC roles, logging, SIEM, triage, detection and hunting.",
    tags: ["cybersecurity", "soc", "siem"],
  },
  topics: [
    { key: "soc", name: "The security operations centre", description: "SOC tiers, processes and metrics." },
    { key: "logging", name: "Logs and telemetry", description: "Which logs matter, time sync and retention." },
    { key: "siem", name: "SIEM and SOAR", description: "Collection, normalisation, correlation and automation." },
    { key: "triage", name: "Alert triage", description: "Investigating alerts and writing escalations." },
    { key: "hunting", name: "Detection engineering and threat hunting", description: "Writing detections, Sigma rules and hunting." },
  ],
  modules: [
    {
      id: "soc-foundations",
      title: "The SOC and its data",
      lessons: [
        {
          id: "soc",
          title: "Inside a security operations centre",
          minutes: 11,
          blocks: [
            text(`
## What a SOC does

A **security operations centre (SOC)** monitors an organisation's systems around the clock, detects attacks and coordinates the response. It can be in-house, outsourced to a **managed security service provider (MSSP)** or delivered as **MDR** (managed detection and response).

## Tiers

| Tier | Focus |
| --- | --- |
| **Tier 1** | Monitor the alert queue, triage, close false positives, escalate real issues |
| **Tier 2** | Deeper investigation, scoping, containment with incident response |
| **Tier 3** | Threat hunting, malware analysis, detection engineering, the hardest cases |
| **SOC manager** | People, processes, metrics and reporting |

Many SOCs now organise around skills rather than strict tiers, but the escalation idea stays the same.
`),
            text(`
## Playbooks and metrics

A **playbook** (or runbook) lists the steps for a given alert type, such as "suspicious sign-in" or "malware detected", so every analyst handles it consistently.

Key metrics:

- **MTTD**: mean time to detect.
- **MTTR**: mean time to respond (or resolve).
- **False positive rate**: how many alerts were not real issues.
- **Alert volume per analyst** and **dwell time** (how long attackers were inside before detection).

Too many low-value alerts cause **alert fatigue**, and that is how real attacks get missed. Tuning noisy rules is part of the job.
`),
            tip("Write every ticket as if someone else will pick it up at 3 a.m. after your shift ends: what you saw, what you checked, what you decided and why."),
            check(
              "Which SOC tier usually triages the alert queue and escalates real incidents?",
              ["Tier 1", "Tier 3", "The CISO"],
              0,
              "Tier 1 analysts work the queue, close false positives and escalate.",
            ),
          ],
        },
        {
          id: "logging",
          title: "Logs and telemetry that matter",
          minutes: 12,
          blocks: [
            text(`
## The most useful sources

| Source | What it tells you |
| --- | --- |
| **Identity provider / Active Directory** | Sign-ins, failures, MFA, account and group changes |
| **Endpoint (EDR, Sysmon, Windows Security log)** | Processes, command lines, file and registry changes |
| **Firewall and VPN** | Allowed and blocked connections, remote access |
| **DNS** | Which domains devices look up: great for spotting C2 and phishing domains |
| **Web proxy** | Which websites users reach, downloads |
| **Email security** | Delivered and blocked phishing, attachments, links |
| **Cloud audit logs** | Changes in cloud accounts (AWS CloudTrail, Azure Activity Log, Google Cloud Audit Logs) |
| **Application logs** | Logins, errors, admin actions in your own apps |

**NetFlow** records which hosts talked to which, when and how much, without the content. **Full packet capture** keeps everything but is expensive to store.
`),
            text(`
## Getting logging right

- **Time sync**: every system must use **NTP** and the same time zone (or UTC) in logs. Without it, you cannot reconstruct a timeline.
- **Centralise**: send logs off the device (syslog, agents) so attackers cannot simply delete them.
- **Retention**: keep logs long enough to investigate. Many breaches are found months later, and some regulations set minimum periods.
- **Protect integrity**: write-once storage or hashing so logs can be trusted as evidence.
- **Know your baseline**: what normal looks like for your users and systems.

Logging everything at full detail is expensive. Start with identity, endpoint, DNS, firewall and cloud audit logs, then add more as your use cases need it.
`),
            tip("If a log source matters, alert when it goes quiet. A silent firewall may mean it is broken, or that someone turned logging off."),
            check(
              "Why must all systems use NTP?",
              ["To speed up the network", "So log timestamps line up for an accurate timeline", "To encrypt the logs"],
              1,
              "Consistent time across systems is essential to correlate events into a timeline.",
            ),
          ],
        },
        {
          id: "siem",
          title: "SIEM and SOAR",
          minutes: 12,
          blocks: [
            text(`
## What a SIEM does

A **SIEM** (security information and event management) system such as Splunk, Microsoft Sentinel, Elastic Security, IBM QRadar or Wazuh:

1. **Collects** logs from many sources.
2. **Parses and normalises** them into common fields (user, source IP, action, result), so different products can be compared.
3. **Enriches** events with context: asset owner, user department, threat intelligence, geolocation.
4. **Correlates** events with rules: "5 failed logins followed by a success for the same user within 10 minutes".
5. **Alerts**, and supports **search**, **dashboards** and **reporting** for investigations and audits.

**UEBA** (user and entity behaviour analytics) adds baselines of normal behaviour and flags unusual activity, such as a user downloading 50 times more files than usual.
`),
            text(`
## SOAR: automating the boring parts

**SOAR** (security orchestration, automation and response) runs playbooks automatically:

- Enrich an alert with IP reputation, user details and recent sign-ins.
- Pull the email out of every mailbox when one copy is confirmed as phishing.
- Disable an account or isolate a device after analyst approval.
- Open and update tickets.

Automation is excellent for repetitive enrichment; keep a human approval step for disruptive actions until you trust the playbook.

## An example search

In Splunk's search language, failed Windows logons by source address:

\`index=windows EventCode=4625 | stats count by src_ip, user | where count > 20\`
`),
            tip("Learn one SIEM query language well (SPL, KQL or Elastic's). The ideas transfer: filter, aggregate, compare with a threshold."),
            check(
              "Converting logs from different products into common fields is called…",
              ["Normalisation", "Encryption", "Segmentation"],
              0,
              "Normalisation maps different formats to the same field names so they can be searched and correlated together.",
            ),
          ],
        },
      ],
    },
    {
      id: "investigating",
      title: "Investigating and hunting",
      lessons: [
        {
          id: "triage",
          title: "Triaging an alert",
          minutes: 13,
          blocks: [
            text(`
## A repeatable method

1. **Read the alert**: which rule fired, on which host and user, at what time?
2. **Validate**: does the raw data support it? Is it a known false positive pattern?
3. **Enrich**: look up the IP, domain or hash in threat intelligence; check the user's role and the asset's importance.
4. **Scope**: did the same thing happen elsewhere? Same hash on other hosts, same IP talking to other users?
5. **Decide**: false positive, benign true positive (real but authorised, such as an admin's scheduled script), or **true positive** to escalate.
6. **Document** and escalate or close, with your reasoning.

## Severity and priority

Combine **impact** (how important is the asset or user?) with **confidence** (how sure are we it is malicious?). A medium-confidence alert on a domain controller can outrank a high-confidence alert on a lab machine.
`),
            text(`
## A worked example

**Alert**: "Impossible travel: user signed in from Toronto and from Lagos 20 minutes apart."

- Raw logs show both sign-ins succeeded; the Lagos one used a device never seen before and a legacy protocol that skipped MFA.
- Threat intel: the Lagos IP belongs to a hosting provider, not a residential ISP.
- Scope: the account created an inbox rule forwarding invoices to an external address five minutes later.
- **Decision**: true positive, likely business email compromise. Escalate to incident response: revoke sessions, reset the password, remove the inbox rule, block legacy authentication, and check what was forwarded.

A good escalation note says **what happened, the evidence, the impact so far, actions already taken and what you recommend next**.
`),
            tip("Note every timestamp with its time zone. \"10:42\" means nothing when your logs mix UTC and local time."),
            check(
              "An admin's approved weekly script triggers a \"suspicious PowerShell\" alert. This is a…",
              ["False negative", "Benign true positive", "Critical incident"],
              1,
              "The detection was correct about the behaviour, but the activity is authorised. Tune the rule or add a documented exception.",
            ),
          ],
        },
        {
          id: "hunting",
          title: "Detection engineering and threat hunting",
          minutes: 12,
          blocks: [
            text(`
## Detection engineering

Detection engineers treat detections like code:

- Start from a threat: an ATT&CK technique, a recent report, a red team finding.
- Check you have the **data** to see it.
- Write the rule, test it against real attack data (for example with Atomic Red Team) and against normal activity for false positives.
- Version it, document it, and measure how it performs.

**Sigma** is an open, vendor-neutral format for detection rules that can be converted into many SIEM languages. **YARA** rules match patterns in files and memory to identify malware. **Snort** and **Suricata** rules detect patterns in network traffic.
`),
            text(`
## Threat hunting

Hunting is proactively searching for attackers **who did not trigger an alert**. It starts from a **hypothesis**:

> "If an attacker is using scheduled tasks for persistence, we would see new tasks created by non-admin users that run from user folders."

Then:

1. Search the data for evidence.
2. Investigate anything interesting.
3. Whether or not you find an attacker, turn what you learned into a new **detection** or a logging improvement.

Sources of hypotheses: threat intelligence, ATT&CK techniques you have no detections for, unusual statistics (rare processes, rare destinations), and lessons from past incidents.
`),
            tip("Hunting for things that are rare in your environment works well: the process that ran on only one machine, the domain only one host ever contacted."),
            check(
              "What should every threat hunt start with?",
              ["A hypothesis", "A firewall reboot", "A new SIEM licence"],
              0,
              "Hunts are driven by a testable hypothesis about attacker behaviour.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- SOC ----------------
    mc("soc", "easy", "What does MTTD stand for?", ["Mean time to detect", "Maximum time to deploy", "Minimum threat to data", "Managed threat and token detection"], 0, "Mean time to detect measures how quickly threats are noticed."),
    mc("soc", "easy", "A written, step-by-step procedure for handling a specific alert type is a…", ["Playbook", "Firewall", "Baseline", "Certificate"], 0, "Playbooks (runbooks) make responses consistent and fast."),
    tf("soc", "medium", "Alert fatigue can cause analysts to miss real attacks.", true, "When analysts face huge volumes of low-value alerts, real ones get lost. Tuning reduces fatigue."),
    mc("soc", "medium", "A company pays a provider to monitor its endpoints 24/7 and respond to threats. This service is called…", ["MDR", "DLP", "PAM", "CASB"], 0, "Managed detection and response (MDR) provides outsourced monitoring and response."),
    mc("soc", "medium", "What is dwell time?", ["How long an analyst's shift lasts", "How long an attacker was inside before being detected", "How long logs are kept", "Time to patch a server"], 1, "Dwell time is the period between initial compromise and detection."),

    // ---------------- Logging ----------------
    mc("logging", "easy", "Which log source best shows which domains devices are looking up?", ["DNS logs", "Printer logs", "HR system", "Backup logs"], 0, "DNS logs show every domain lookup, useful for spotting phishing and C2 domains."),
    ms("logging", "medium", "Which are cloud audit log services? Select all that apply.", ["AWS CloudTrail", "Azure Activity Log", "Google Cloud Audit Logs", "Windows Defragmenter"], [0, 1, 2], "CloudTrail, Azure Activity Log and Google Cloud Audit Logs record actions in cloud accounts."),
    mc("logging", "medium", "Why should logs be sent to a central system rather than kept only on each device?", ["It is required for printing", "Attackers who control a device can delete its local logs", "It makes logs smaller", "Local logs are always encrypted"], 1, "Centralised logs survive even if the attacker clears logs on the compromised device."),
    tf("logging", "medium", "NetFlow records the full content of every packet.", false, "NetFlow records metadata (who talked to whom, when, how much), not the content. Full packet capture keeps content."),
    mc("logging", "hard", "Your firewall's log feed into the SIEM suddenly stops. What is the best response?", ["Ignore it: fewer logs means less work", "Treat it as an alert: investigate whether the device failed or logging was disabled", "Delete the firewall's old logs", "Turn off the SIEM"], 1, "A source going silent can be a failure or an attacker covering tracks. Alert on missing data."),

    // ---------------- SIEM ----------------
    mc("siem", "easy", "What is the main job of a SIEM?", ["Assigning IP addresses", "Collecting and correlating security events to produce alerts", "Encrypting hard drives", "Managing payroll"], 1, "A SIEM centralises logs, correlates events and supports alerting and investigation."),
    ord("siem", "medium", "Put these SIEM processing steps in order.", ["Collect logs", "Parse and normalise", "Enrich with context", "Correlate with rules", "Raise an alert"], "Data must be collected and normalised before it can be enriched, correlated and alerted on."),
    mc("siem", "medium", "What does SOAR add to a SIEM?", ["Automated playbooks and orchestration", "Faster Wi-Fi", "Physical access control", "Password storage"], 0, "SOAR automates enrichment and response steps across tools."),
    mc("siem", "medium", "A user suddenly downloads 50 times more files than their normal daily amount. Which capability is best at noticing this?", ["UEBA", "DHCP", "NAT", "VLAN tagging"], 0, "User and entity behaviour analytics learns normal behaviour and flags deviations."),
    st("siem", "hard", "In the Windows Security log, which event code would you search for to find failed logons?", ["4625"], "Event ID 4625 records a failed logon."),

    // ---------------- Triage ----------------
    ord("triage", "medium", "Put these alert triage steps in order.", ["Read the alert", "Validate it against raw data", "Enrich with context", "Scope across other hosts and users", "Decide and document"], "Understand, validate, enrich, scope, then decide and record your reasoning."),
    mc("triage", "medium", "Which alert should usually get attention first?", ["High confidence, on a lab test machine", "Medium confidence, on a domain controller", "Low confidence, on a guest Wi-Fi device", "A duplicate of a closed alert"], 1, "Priority combines impact and confidence. A domain controller is a critical asset."),
    mc("triage", "medium", "A sign-in succeeds from a new country right after an inbox rule forwarding invoices is created. What is the most likely incident?", ["Printer malfunction", "Business email compromise", "DNS outage", "Routine travel"], 1, "Unusual sign-in followed by invoice forwarding is a classic BEC pattern."),
    ms("triage", "medium", "What should a good escalation note include? Select all that apply.", ["What happened and the evidence", "Actions already taken", "Recommended next steps", "Your opinion of the user's personality"], [0, 1, 2], "Facts, evidence, actions and recommendations. Keep it professional and evidence-based."),
    tf("triage", "easy", "A false positive is an alert on activity that turns out to be harmless.", true, "False positives waste time; tuning reduces them."),

    // ---------------- Hunting ----------------
    mc("hunting", "medium", "Which format writes vendor-neutral SIEM detection rules that can be converted to many query languages?", ["Sigma", "YARA", "JSON Web Token", "SAML"], 0, "Sigma is a generic signature format for log-based detections."),
    mc("hunting", "medium", "Which rule format is mainly used to identify malware by patterns in files?", ["YARA", "Sigma", "SPF", "LDAP"], 0, "YARA rules match strings and byte patterns in files or memory."),
    tf("hunting", "medium", "A threat hunt that finds no attacker is a waste of time.", false, "Hunts that find nothing still improve visibility and usually produce new detections or logging fixes."),
    mc("hunting", "medium", "What is the difference between threat hunting and alert triage?", ["Hunting proactively looks for threats that did not trigger alerts", "Hunting only happens after a breach is announced", "Triage needs no data", "There is no difference"], 0, "Triage reacts to alerts; hunting searches for what alerts missed."),
    mc("hunting", "hard", "Which tool lets defenders safely run small tests that mimic ATT&CK techniques to validate detections?", ["Atomic Red Team", "Let's Encrypt", "Group Policy", "OpenVPN"], 0, "Atomic Red Team provides small, mapped tests for ATT&CK techniques."),
  ],
};
