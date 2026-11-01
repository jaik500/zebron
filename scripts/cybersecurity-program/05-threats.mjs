import { check, mc, ms, num, ord, st, text, tf, tip } from "./helpers.mjs";

export default {
  order: 5,
  id: "cybersecurity-threats",
  title: "Threats, Attacks and Vulnerability Management",
  summary: "Course 5 of 8 in the Zebron Cybersecurity Program. Who attacks, how they do it, and how defenders find and fix weaknesses before they are used.",
  description: `
Know your enemy. This course covers threat actors and their motives, social engineering, the attack techniques you will see again and again, frameworks that describe attacks (the Cyber Kill Chain and MITRE ATT&CK), and the vulnerability management cycle with CVE and CVSS.

Each lesson ends with a quick check. The final exam is drawn from the **Threats, Attacks and Vulnerability Management** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "sunrise",
  outcomes: [
    "Describe threat actors by motive and capability",
    "Recognise phishing and other social engineering tactics",
    "Explain common network, application and malware-based attacks",
    "Map an attack to the Cyber Kill Chain and MITRE ATT&CK",
    "Run a vulnerability management cycle using CVE, CVSS and patch priorities",
  ],
  skills: ["Threat analysis", "Social engineering awareness", "MITRE ATT&CK", "Vulnerability scanning", "CVSS"],
  quiz: {
    name: "Threats, Attacks and Vulnerability Management",
    slug: "cybersecurity-threats",
    description: "Practice questions for Course 5 of the Cybersecurity Program: threat actors, social engineering, attack techniques, ATT&CK and vulnerability management.",
    tags: ["cybersecurity", "threats", "vulnerabilities"],
  },
  topics: [
    { key: "actors", name: "Threat actors and intelligence", description: "Who attacks, why, and how threat intelligence helps." },
    { key: "social-engineering", name: "Social engineering", description: "Phishing, pretexting, BEC and physical tricks." },
    { key: "attacks", name: "Common attack techniques", description: "Network, password, web and supply chain attacks." },
    { key: "frameworks", name: "Kill Chain and MITRE ATT&CK", description: "Describing attacks in stages, tactics and techniques." },
    { key: "vuln-management", name: "Vulnerability management", description: "Scanning, CVE, CVSS, KEV, prioritisation and patching." },
  ],
  modules: [
    {
      id: "attackers",
      title: "Attackers and their methods",
      lessons: [
        {
          id: "actors",
          title: "Threat actors and threat intelligence",
          minutes: 11,
          blocks: [
            text(`
## Who attacks

| Actor | Main motive | Typical capability |
| --- | --- | --- |
| **Cybercriminals** (including ransomware groups) | Money | Medium to high, often organised as a business |
| **Nation-state / APT groups** | Espionage, disruption, strategic advantage | Very high, patient, well funded |
| **Hacktivists** | Ideology, publicity | Low to medium: defacements, DDoS, leaks |
| **Insiders** | Revenge, money, or simple mistakes | Already have access |
| **Script kiddies** | Curiosity, bragging rights | Low, using ready-made tools |

**APT** means advanced persistent threat: attackers who get in quietly and stay for months. **Ransomware-as-a-service** lets affiliates rent ransomware and split the profits with its developers.

Do not forget **unintentional insiders**: an employee who emails the wrong spreadsheet or misconfigures a cloud bucket causes many real incidents.
`),
            text(`
## Threat intelligence

**Threat intelligence** is information about attackers that helps you make decisions.

- **Strategic**: trends for leadership ("ransomware groups are targeting our sector").
- **Operational**: details about specific campaigns and how they work.
- **Tactical**: **TTPs** (tactics, techniques and procedures).
- **Technical**: **indicators of compromise (IOCs)** such as malicious IP addresses, domains and file hashes.

IOCs change fast; an attacker can switch IP address in minutes. TTPs change slowly, so detections built on behaviour last longer. This idea is called the **Pyramid of Pain**: the higher up you detect (TTPs), the more painful it is for attackers to change.

Sources include government agencies (such as CISA), industry sharing groups (**ISACs**), vendor reports and open-source feeds (**OSINT**).
`),
            tip("When you read a threat report, look for the TTPs and ask: would we detect that? That turns reading into a detection backlog."),
            check(
              "A group that steals data quietly from a government network for two years is best described as…",
              ["A script kiddie", "An advanced persistent threat", "A hacktivist"],
              1,
              "Long, stealthy, well-resourced intrusions are the hallmark of APT groups.",
            ),
          ],
        },
        {
          id: "social-engineering",
          title: "Social engineering",
          minutes: 11,
          blocks: [
            text(`
## Hacking people

Social engineering manipulates people into giving access or information. It exploits **urgency**, **authority**, **fear**, **curiosity**, **helpfulness** and **familiarity**.

| Technique | What it looks like |
| --- | --- |
| **Phishing** | Mass emails with malicious links or attachments |
| **Spear phishing** | Targeted at one person or team, using real details |
| **Whaling** | Spear phishing aimed at executives |
| **Smishing / vishing** | Phishing by text message / by phone |
| **Business email compromise (BEC)** | Impersonating a CEO or supplier to redirect payments |
| **Pretexting** | A made-up scenario: "I'm from IT, I need your code to fix your account" |
| **Quishing** | Phishing with QR codes that lead to fake sites |
| **Watering hole** | Infecting a website the targets often visit |
| **Typosquatting** | Look-alike domains such as \`rnicrosoft.com\` |
`),
            text(`
## Physical tricks

- **Tailgating / piggybacking**: following someone through a secure door.
- **Shoulder surfing**: watching someone type a password or PIN.
- **Dumpster diving**: searching rubbish for documents and old hardware.
- **USB drop**: leaving infected USB sticks in a car park for curious people to plug in.

## What actually helps

- Short, frequent training with realistic phishing simulations, and praise for reporting.
- A one-click **report phishing** button and a fast response to reports.
- **Verification by a second channel** for payment changes: call the supplier on a number you already have, never the one in the email.
- Technical controls: email filtering, SPF/DKIM/DMARC, link rewriting, phishing-resistant MFA.
`),
            tip("A request that is urgent, secret and involves money or credentials is almost always a scam. Slow down and verify."),
            check(
              "A caller claims to be from the help desk and asks for your MFA code to fix your account. What is this?",
              ["Vishing with pretexting", "Tailgating", "Typosquatting"],
              0,
              "A phone call (vishing) with a made-up story (pretext). The real help desk never asks for your MFA code.",
            ),
          ],
        },
        {
          id: "attacks",
          title: "Common attack techniques",
          minutes: 13,
          blocks: [
            text(`
## Network attacks

- **DoS / DDoS**: overwhelm a service so real users cannot reach it. DDoS uses many machines, often a **botnet**.
- **On-path (man-in-the-middle)**: the attacker sits between two parties to read or change traffic, for example through ARP spoofing or a rogue Wi-Fi access point.
- **DNS poisoning**: fake DNS answers send victims to the attacker's site.
- **Replay**: capturing a valid message (such as an authentication exchange) and sending it again.

## Password attacks

Brute force, dictionary, password spraying, credential stuffing, and **pass-the-hash** (using a stolen password hash directly to authenticate, without cracking it).
`),
            text(`
## Application attacks

| Attack | What happens | Main defense |
| --- | --- | --- |
| **SQL injection** | User input changes a database query | Parameterised queries |
| **Cross-site scripting (XSS)** | Attacker's script runs in other users' browsers | Output encoding, Content Security Policy |
| **Cross-site request forgery (CSRF)** | A site tricks your browser into making a request you did not intend | Anti-CSRF tokens, SameSite cookies |
| **Buffer overflow** | Too much data overwrites memory and can run attacker code | Memory-safe languages, bounds checks, DEP/ASLR |
| **Directory traversal** | \`../../\` in a path reads files outside the web folder | Validate and normalise paths |
| **Privilege escalation** | Getting higher rights than granted | Patching, least privilege |

## Supply chain attacks

Attackers compromise a trusted supplier, software update or open-source package to reach many victims at once. Examples include tampered software updates and malicious packages with names close to popular ones. Defenses: vet suppliers, keep a **software bill of materials (SBOM)**, pin and verify dependencies, and limit what third-party tools can access.

A **zero-day** is a flaw the vendor does not yet know about or has not yet fixed, so no patch exists.
`),
            tip("For every attack in this lesson, ask which part of the CIA triad it targets. It helps you remember both the attack and its defenses."),
            check(
              "Which defense best prevents SQL injection?",
              ["Longer passwords", "Parameterised queries", "A bigger database server"],
              1,
              "Parameterised queries keep user input as data, so it cannot change the query.",
            ),
          ],
        },
      ],
    },
    {
      id: "finding-weaknesses",
      title: "Describing attacks and fixing weaknesses",
      lessons: [
        {
          id: "frameworks",
          title: "The Cyber Kill Chain and MITRE ATT&CK",
          minutes: 12,
          blocks: [
            text(`
## The Cyber Kill Chain

Lockheed Martin's Cyber Kill Chain describes an intrusion in seven stages:

1. **Reconnaissance**: research the target.
2. **Weaponisation**: build the payload (for example a malicious document).
3. **Delivery**: send it (email, web, USB).
4. **Exploitation**: the code runs by abusing a flaw or a user action.
5. **Installation**: malware installs for persistence.
6. **Command and control (C2)**: the malware calls home for instructions.
7. **Actions on objectives**: steal data, encrypt files, move further.

Breaking the chain at any stage stops the attack. The earlier, the cheaper.
`),
            text(`
## MITRE ATT&CK

**MITRE ATT&CK** is a free knowledge base of real attacker behaviour. It is organised as:

- **Tactics**: the attacker's goal at each step (the *why*), such as Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, Command and Control, Exfiltration and Impact.
- **Techniques and sub-techniques**: *how* they achieve it, each with an ID, for example **T1566 Phishing** or **T1059 Command and Scripting Interpreter**.

Teams use ATT&CK to describe incidents in a shared language, to check which techniques they can detect (coverage mapping), and to plan red and purple team exercises.

The **Diamond Model** is another view: every intrusion event links an **adversary**, their **capability**, the **infrastructure** they use and the **victim**.
`),
            tip("Pick one ATT&CK technique a week, read how it works, and check whether your logs would show it."),
            check(
              "In MITRE ATT&CK, \"Lateral Movement\" is a…",
              ["Tactic", "Technique ID", "Indicator of compromise"],
              0,
              "Tactics are the attacker's goals. Techniques are the ways to achieve them.",
            ),
          ],
        },
        {
          id: "vuln-management",
          title: "Vulnerability management",
          minutes: 13,
          blocks: [
            text(`
## The cycle

1. **Discover** assets: you cannot protect what you do not know you have.
2. **Scan** for vulnerabilities with tools such as Nessus, Qualys, OpenVAS or cloud-native scanners.
3. **Prioritise** what to fix first.
4. **Remediate**: patch, change the configuration, or apply a compensating control.
5. **Verify** with a rescan.
6. **Report** and repeat.

**Credentialed** scans sign in to systems and find far more than **uncredentialed** scans, which only see what is exposed. A **penetration test** goes further: a human tries to actually exploit weaknesses, within an agreed scope and rules of engagement.
`),
            text(`
## CVE, CVSS and what to fix first

- A **CVE** ID (such as CVE-2021-44228, "Log4Shell") is a unique name for a publicly known vulnerability.
- **CVSS** scores severity from **0.0 to 10.0**: Low (0.1–3.9), Medium (4.0–6.9), High (7.0–8.9), Critical (9.0–10.0).
- **EPSS** estimates the probability a vulnerability will be exploited soon.
- CISA's **Known Exploited Vulnerabilities (KEV)** catalogue lists flaws attackers are using right now.

Good prioritisation combines all of this with **context**: is the system internet-facing? Does it hold sensitive data? Is there a working exploit? A CVSS 7.5 on the internet-facing VPN that appears in KEV beats a CVSS 9.8 on an isolated test box.

**False positives** happen: a scanner may flag a version number even though a backported fix is installed. Verify before escalating.
`),
            tip("Agree remediation deadlines by severity in advance (for example, 7 days for critical internet-facing flaws). Then nobody argues during an emergency."),
            check(
              "A vulnerability has a CVSS score of 9.8. Which rating is that?",
              ["High", "Critical", "Medium"],
              1,
              "Scores of 9.0 to 10.0 are Critical.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Actors ----------------
    mc("actors", "easy", "What mainly motivates ransomware groups?", ["Ideology", "Money", "Curiosity", "Military advantage"], 1, "Ransomware is a criminal business model built on extortion payments."),
    mc("actors", "medium", "Which are the hardest indicators for attackers to change, according to the Pyramid of Pain?", ["File hashes", "IP addresses", "Domain names", "Tactics, techniques and procedures"], 3, "Attackers can change hashes, IPs and domains quickly. Changing how they operate (TTPs) is costly."),
    tf("actors", "easy", "An employee who accidentally emails customer data to the wrong person is an insider threat.", true, "Insider threats include unintentional mistakes, not just malicious insiders."),
    mc("actors", "medium", "A list of malicious IP addresses and file hashes is which kind of threat intelligence?", ["Strategic", "Technical (IOCs)", "Legal", "Financial"], 1, "Specific observables like IPs, domains and hashes are technical indicators of compromise."),
    mc("actors", "easy", "Which actor typically uses defacements and DDoS to promote a cause?", ["Hacktivist", "APT", "Insider", "Penetration tester"], 0, "Hacktivists attack to make a political or social point."),

    // ---------------- Social engineering ----------------
    mc("social-engineering", "easy", "A phishing email aimed specifically at a company's CEO is called…", ["Smishing", "Whaling", "Vishing", "Pharming"], 1, "Whaling targets senior executives."),
    mc("social-engineering", "medium", "The finance team gets an email from a known supplier saying their bank details have changed. What should they do?", ["Update the details right away", "Reply to the email to confirm", "Call the supplier on a number already on file", "Forward it to all staff"], 2, "Verify through a separate, trusted channel. Replying goes to the attacker if the mailbox is compromised or spoofed."),
    ms("social-engineering", "medium", "Which of these are social engineering techniques? Select all that apply.", ["Tailgating", "Pretexting", "Smishing", "Patching"], [0, 1, 2], "Tailgating, pretexting and smishing all manipulate people. Patching is a defensive activity."),
    tf("social-engineering", "easy", "A QR code on a parking meter can be used for phishing.", true, "Quishing uses QR codes that lead to fake payment or login pages."),
    mc("social-engineering", "medium", "Attackers infect a trade association website that their targets visit often. What is this?", ["Watering hole attack", "Typosquatting", "Dumpster diving", "Vishing"], 0, "A watering hole attack compromises a site the targets already trust and visit."),

    // ---------------- Attacks ----------------
    mc("attacks", "easy", "Thousands of compromised devices flood a website with traffic. What is this?", ["SQL injection", "DDoS", "Phishing", "Privilege escalation"], 1, "A distributed denial-of-service attack uses many machines, often a botnet."),
    mc("attacks", "medium", "A comment box on a forum stores a script that runs in every visitor's browser. Which attack is this?", ["CSRF", "Stored cross-site scripting", "Directory traversal", "Replay"], 1, "Stored XSS saves the attacker's script on the site so it runs for every viewer."),
    mc("attacks", "medium", "A URL like /download?file=../../etc/passwd is an attempt at…", ["Directory traversal", "Buffer overflow", "DNS poisoning", "Clickjacking"], 0, "../ sequences try to escape the web folder and read other files."),
    mc("attacks", "hard", "An attacker uses a stolen NTLM hash to authenticate without cracking it. What is this?", ["Pass-the-hash", "Rainbow table attack", "Brute force", "Credential stuffing"], 0, "Pass-the-hash reuses the hash itself as the credential."),
    tf("attacks", "medium", "A zero-day vulnerability is one that the vendor has not yet fixed, so no patch is available.", true, "Zero-days are exploited before a fix exists, which is why behaviour-based detection and defense in depth matter."),

    // ---------------- Frameworks ----------------
    ord("frameworks", "medium", "Put these Cyber Kill Chain stages in order.", ["Reconnaissance", "Weaponisation", "Delivery", "Exploitation", "Installation", "Command and control", "Actions on objectives"], "Recon, weaponise, deliver, exploit, install, C2, then act on objectives."),
    mc("frameworks", "easy", "What does MITRE ATT&CK describe?", ["Firewall vendors", "Real-world attacker tactics and techniques", "Password rules", "Cloud pricing"], 1, "ATT&CK is a knowledge base of adversary behaviour based on real observations."),
    mc("frameworks", "medium", "In ATT&CK, \"Phishing\" (T1566) belongs to which tactic?", ["Impact", "Initial Access", "Exfiltration", "Discovery"], 1, "Phishing is a way to get the first foothold: Initial Access."),
    mc("frameworks", "hard", "Which model links adversary, capability, infrastructure and victim for each intrusion event?", ["Diamond Model", "Pyramid of Pain", "STRIDE", "OSI model"], 0, "The Diamond Model of Intrusion Analysis connects those four features."),
    st("frameworks", "medium", "Malware calling back to an attacker's server for instructions is called command and ______. (one word)", ["control"], "Command and control (C2) is how attackers direct compromised machines."),

    // ---------------- Vulnerability management ----------------
    num("vuln-management", "easy", "What is the highest possible CVSS score?", 10, 0, "CVSS scores range from 0.0 to 10.0."),
    mc("vuln-management", "medium", "Which scan usually finds the most vulnerabilities on a server?", ["Uncredentialed scan from the internet", "Credentialed scan", "A ping sweep", "A port scan only"], 1, "A credentialed scan signs in and can check installed software and settings directly."),
    mc("vuln-management", "medium", "Which list tells you vulnerabilities that attackers are actively exploiting?", ["CISA Known Exploited Vulnerabilities (KEV)", "OWASP Top 10", "CIS Benchmarks", "ISO 27001 Annex A"], 0, "The KEV catalogue lists CVEs with evidence of active exploitation."),
    ms("vuln-management", "hard", "Which factors should raise a vulnerability's priority? Select all that apply.", ["The system is internet-facing", "A working exploit is public", "It is listed in KEV", "The system was decommissioned last year"], [0, 1, 2], "Exposure, available exploits and active exploitation all raise urgency. A decommissioned system should simply be removed from the inventory."),
    tf("vuln-management", "medium", "A penetration test should always start without any written scope so the testers behave like real attackers.", false, "Pen tests need a written scope and rules of engagement. Without authorisation, testing is illegal."),
  ],
};
