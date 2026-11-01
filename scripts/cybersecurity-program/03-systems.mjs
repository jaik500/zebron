import { check, mc, ms, ord, st, text, tf, tip } from "./helpers.mjs";

export default {
  order: 3,
  id: "cybersecurity-systems",
  title: "Linux and Windows Security",
  summary: "Course 3 of 8 in the Zebron Cybersecurity Program. Command-line basics, permissions, logs and hardening on the two operating systems you will defend every day.",
  description: `
Most attacks end up on an endpoint or a server. This course gives you enough Linux and Windows to investigate and harden them: navigating the command line, users and permissions, where the logs are, and the hardening steps that stop the most common attacks.

Each lesson ends with a quick check. The final exam is drawn from the **Linux and Windows Security** quiz in the Test Center.
`.trim(),
  level: "beginner",
  cover: "slate",
  outcomes: [
    "Use core Linux commands to inspect files, processes and network connections",
    "Read and set Linux file permissions, and explain sudo and setuid",
    "Find important Windows logs and recognise key event IDs",
    "Explain Windows accounts, UAC and Active Directory basics",
    "Apply a hardening baseline to a server or workstation",
  ],
  skills: ["Linux command line", "File permissions", "Windows Event Logs", "Active Directory basics", "System hardening"],
  quiz: {
    name: "Linux and Windows Security",
    slug: "cybersecurity-systems",
    description: "Practice questions for Course 3 of the Cybersecurity Program: Linux commands and permissions, Windows logs and accounts, and hardening.",
    tags: ["cybersecurity", "linux", "windows"],
  },
  topics: [
    { key: "linux-basics", name: "Linux command line", description: "Files, processes, network connections and logs on Linux." },
    { key: "linux-permissions", name: "Linux users and permissions", description: "rwx permissions, chmod, ownership, sudo and setuid." },
    { key: "windows", name: "Windows security essentials", description: "Accounts, UAC, Event Viewer, PowerShell and Active Directory." },
    { key: "hardening", name: "System hardening", description: "Baselines, patching, services, endpoint protection and backups." },
    { key: "endpoint", name: "Endpoint protection and malware basics", description: "Antivirus, EDR, application allow-listing and persistence." },
  ],
  modules: [
    {
      id: "linux",
      title: "Linux",
      lessons: [
        {
          id: "linux-basics",
          title: "Linux command line for defenders",
          minutes: 13,
          blocks: [
            text(`
## Getting around

| Command | What it does |
| --- | --- |
| \`pwd\`, \`ls -la\`, \`cd\` | Where am I, list files (including hidden ones), move |
| \`cat\`, \`less\`, \`head\`, \`tail -f\` | Read files; \`tail -f\` follows a log as it grows |
| \`grep "failed" auth.log\` | Find lines that match a pattern |
| \`find / -name "*.sh" -mtime -1\` | Find files changed in the last day |
| \`ps aux\`, \`top\` | Running processes |
| \`ss -tulpn\` (or \`netstat\`) | Listening ports and the programs behind them |
| \`whoami\`, \`id\`, \`last\` | Current user, groups, recent logins |
| \`sha256sum file\` | Hash a file to check integrity |

## Where the logs are

Most logs live in \`/var/log\`. On Debian and Ubuntu, sign-ins and sudo use go to \`/var/log/auth.log\`; on Red Hat-based systems the equivalent is \`/var/log/secure\`. Systems using systemd also keep a journal, read with \`journalctl\`.
`),
            text(`
## A first look at a suspicious server

1. \`last\` and \`grep "Failed password" /var/log/auth.log\`: who signed in, and who tried?
2. \`ss -tulpn\`: is anything listening that should not be?
3. \`ps aux --sort=-%cpu | head\`: is something using all the CPU (a crypto miner, perhaps)?
4. \`crontab -l\` and \`ls /etc/cron.*\`: has someone added a scheduled task for persistence?
5. \`find / -mtime -2 -type f 2>/dev/null\`: which files changed recently?

Write down every command you run and what you found. If this becomes an incident, your notes are evidence.
`),
            tip("Practise in a free virtual machine or a browser-based lab before you need these commands for real."),
            check(
              "Which command shows listening ports and the processes that own them?",
              ["ss -tulpn", "chmod 755", "whoami"],
              0,
              "ss -tulpn lists TCP and UDP listening sockets with process names.",
            ),
          ],
        },
        {
          id: "linux-permissions",
          title: "Linux users and permissions",
          minutes: 12,
          blocks: [
            text(`
## Reading permissions

\`ls -l\` shows something like:

\`-rwxr-x--- 1 alice devs 2048 report.sh\`

The ten characters are: the file type (\`-\` file, \`d\` directory), then three sets of **r**ead, **w**rite and e**x**ecute for the **owner** (alice), the **group** (devs) and **others** (everyone else).

In numbers, r = 4, w = 2, x = 1, added per set:

| Number | Meaning |
| --- | --- |
| 7 | rwx |
| 6 | rw- |
| 5 | r-x |
| 4 | r-- |
| 0 | --- |

So \`chmod 750 report.sh\` gives the owner everything, the group read and execute, and others nothing. Change ownership with \`chown alice:devs report.sh\`.
`),
            text(`
## Privilege on Linux

- **root** (user ID 0) can do anything. Do not sign in as root for daily work.
- **sudo** lets permitted users run single commands as root, and logs each use. Who may use it is set in \`/etc/sudoers\` (edit with \`visudo\`).
- Passwords are stored as hashes in \`/etc/shadow\`, readable only by root. \`/etc/passwd\` lists accounts and is readable by all.
- A **setuid** program runs with its owner's rights. A setuid program owned by root with a bug can give an attacker root, so audit them: \`find / -perm -4000 2>/dev/null\`.
- **World-writable** files (\`chmod 777\`) let anyone change them: a classic misconfiguration.
`),
            tip("If you see chmod 777 in a script or a how-to, treat it as a red flag. There is almost always a narrower permission that works."),
            check(
              "What does chmod 640 give the group?",
              ["Read and write", "Read only", "No access"],
              1,
              "640 is owner rw- (6), group r-- (4), others --- (0).",
            ),
          ],
        },
      ],
    },
    {
      id: "windows-and-hardening",
      title: "Windows and hardening",
      lessons: [
        {
          id: "windows",
          title: "Windows security essentials",
          minutes: 13,
          blocks: [
            text(`
## Accounts and privilege

- **Local accounts** exist on one computer; **domain accounts** are managed centrally in **Active Directory (AD)**.
- **Administrators** can change anything. Everyday work should use a standard account.
- **User Account Control (UAC)** asks for confirmation (or admin credentials) before a program gets admin rights.
- In AD, **domain controllers** authenticate users (with **Kerberos**, or the older **NTLM**) and hold **Group Policy**, which pushes security settings to every machine.
- **Domain Admins** is the most powerful group. Members should use separate admin accounts only on secure admin workstations.

## Event Viewer: the Security log

| Event ID | Meaning |
| --- | --- |
| 4624 | Successful logon |
| 4625 | Failed logon |
| 4672 | Special privileges assigned to a new logon (an admin logon) |
| 4720 | User account created |
| 4728 / 4732 | Member added to a security group |
| 1102 | The audit log was cleared |

Many 4625 events against one account suggest password guessing; 4625 events across many accounts from one source suggest password spraying. Event 1102 is a strong sign someone is covering tracks.
`),
            text(`
## PowerShell and Sysinternals

PowerShell is powerful for admins and attackers alike. Turn on **script block logging** and **module logging** so you can see what was run, and keep PowerShell up to date.

Useful commands: \`Get-LocalUser\`, \`Get-Process\`, \`Get-NetTCPConnection\`, \`Get-WinEvent -LogName Security -MaxEvents 50\`.

The free **Sysinternals** tools from Microsoft help investigations: **Process Explorer** (processes), **Autoruns** (everything that starts automatically) and **Sysmon** (detailed logging of process creation, network connections and more).
`),
            tip("Attackers often clear logs at the end of an attack. Forward Windows logs to a central SIEM so a cleared local log does not erase the evidence."),
            check(
              "Which Windows event ID records a failed logon?",
              ["4624", "4625", "4720"],
              1,
              "4625 is a failed logon; 4624 is a successful one.",
            ),
          ],
        },
        {
          id: "hardening",
          title: "Hardening servers and workstations",
          minutes: 12,
          blocks: [
            text(`
## What hardening means

Hardening reduces the **attack surface**: fewer ways in, and less damage if someone gets in. Start from a recognised **baseline** such as the **CIS Benchmarks** or Microsoft security baselines, then document any exceptions.

A practical checklist:

1. **Patch** the operating system and applications on a schedule, and urgently for actively exploited flaws.
2. **Remove** software, services and features you do not use (FTP, Telnet, SMBv1, sample web pages).
3. **Close** unused ports with a host firewall.
4. **Change** default passwords and disable or rename default accounts.
5. **Enforce** least privilege: no daily use of admin accounts; unique local admin passwords (for example with Microsoft LAPS).
6. **Turn on** logging and send it to a central place.
7. **Encrypt** disks (BitLocker on Windows, LUKS on Linux) so a stolen laptop does not mean stolen data.
8. **Configure** secure remote access: SSH keys instead of passwords, no direct root login over SSH, RDP only through a VPN or gateway.
`),
            text(`
## Configuration drift and backups

Systems drift from their baseline over time as people make changes. Configuration management tools (Group Policy, Ansible, Intune) re-apply the baseline and report differences.

**Backups** are your last line of defense against ransomware. Follow the **3-2-1 rule**: at least **3** copies of data, on **2** different types of media, with **1** copy offsite. Keep at least one copy **offline or immutable** so ransomware cannot encrypt it, and **test restores** regularly.
`),
            tip("A backup you have never restored is a hope, not a backup. Schedule a restore test every quarter."),
            check(
              "In the 3-2-1 backup rule, what does the 1 stand for?",
              ["One backup per year", "One copy offsite", "One administrator"],
              1,
              "Three copies, on two types of media, with one copy offsite.",
            ),
          ],
        },
        {
          id: "endpoint",
          title: "Endpoint protection and malware basics",
          minutes: 11,
          blocks: [
            text(`
## From antivirus to EDR

- **Antivirus** matches files against known malware signatures and some behaviour rules.
- **EDR** (endpoint detection and response) records what happens on each device (processes, files, network, registry), detects suspicious behaviour and lets responders isolate a machine remotely.
- **XDR** extends this by correlating endpoint data with email, identity, network and cloud signals.
- **Application allow-listing** (such as Windows App Control or AppLocker) only lets approved programs run: very strong, but needs care to manage.

## How malware stays: persistence

Attackers want to survive a reboot. Common persistence places:

- Windows: Run keys in the registry, scheduled tasks, new services, startup folders, WMI subscriptions.
- Linux: cron jobs, systemd services, modified shell profiles such as \`~/.bashrc\`, added SSH keys in \`authorized_keys\`.

Tools like Autoruns (Windows) and checking cron and systemd units (Linux) help find them.
`),
            text(`
## Common malware families

| Type | What it does |
| --- | --- |
| Ransomware | Encrypts data and demands payment; often steals data first |
| Trojan | Pretends to be useful software |
| Worm | Spreads by itself across networks |
| Rootkit | Hides itself and other malware deep in the system |
| Keylogger / infostealer | Captures keystrokes, passwords and browser cookies |
| RAT | Remote access trojan: gives an attacker remote control |
| Fileless malware | Runs in memory using built-in tools such as PowerShell |

**Living off the land** means attackers use tools already on the system (PowerShell, WMI, certutil) so nothing new looks suspicious. Behaviour-based detection catches this better than signatures.
`),
            tip("If EDR shows Microsoft Word starting PowerShell, investigate. Office documents rarely have a good reason to launch a shell."),
            check(
              "Which tool can isolate a compromised laptop from the network remotely and record its process history?",
              ["EDR", "A label printer", "DHCP"],
              0,
              "EDR records endpoint activity and supports response actions such as isolation.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Linux basics ----------------
    mc("linux-basics", "easy", "On Ubuntu, which file records SSH logins and sudo use?", ["/var/log/auth.log", "/etc/passwd", "/var/www/html", "/tmp/log"], 0, "On Debian and Ubuntu, authentication events go to /var/log/auth.log (on Red Hat-based systems, /var/log/secure)."),
    mc("linux-basics", "easy", "Which command follows a log file as new lines are written?", ["head", "tail -f", "chmod", "cd"], 1, "tail -f keeps printing new lines as they are added."),
    mc("linux-basics", "medium", "Which command would help find a cron job an attacker added for persistence?", ["crontab -l", "pwd", "sha256sum", "uname"], 0, "crontab -l lists the current user's scheduled jobs; also check /etc/cron.* and /etc/crontab."),
    st("linux-basics", "medium", "Which command searches a file for lines matching a pattern, such as \"Failed password\"? Give the command name only.", ["grep"], "grep prints lines that match a pattern, for example grep \"Failed password\" /var/log/auth.log."),
    tf("linux-basics", "easy", "Hashing a file with sha256sum lets you check later whether the file was changed.", true, "Any change to the file produces a completely different SHA-256 hash."),

    // ---------------- Linux permissions ----------------
    mc("linux-permissions", "easy", "What do the permissions -rwxr-xr-- mean for others?", ["Read, write and execute", "Read and execute", "Read only", "No access"], 2, "The last three characters (r--) are for others: read only."),
    mc("linux-permissions", "medium", "Which command gives the owner read and write, the group read, and others nothing?", ["chmod 777 file", "chmod 640 file", "chmod 755 file", "chmod 400 file"], 1, "6 = rw- for the owner, 4 = r-- for the group, 0 = --- for others."),
    mc("linux-permissions", "medium", "Where are Linux password hashes stored?", ["/etc/passwd", "/etc/shadow", "/var/log/auth.log", "/home/root"], 1, "Hashes are in /etc/shadow, readable only by root. /etc/passwd lists accounts but no longer holds hashes."),
    tf("linux-permissions", "medium", "A buggy setuid program owned by root can let an attacker gain root privileges.", true, "Setuid programs run with the owner's rights. If root owns one and it has a flaw, an attacker can escalate to root."),
    mc("linux-permissions", "hard", "Why is sudo preferred over sharing the root password?", ["sudo is faster", "Each command is tied to a named user and logged, and access can be limited per command", "sudo disables passwords", "sudo encrypts the disk"], 1, "sudo gives accountability (who did what) and fine-grained control over which commands each user may run."),

    // ---------------- Windows ----------------
    mc("windows", "easy", "Which Windows event ID records a successful logon?", ["4624", "4625", "1102", "4720"], 0, "4624 is a successful logon. 4625 is a failed one."),
    mc("windows", "medium", "Event ID 1102 appears on a server just after suspicious activity. What does it indicate?", ["A new user was created", "The audit log was cleared", "The system rebooted", "A patch was installed"], 1, "1102 means the Security log was cleared, often an attacker hiding their tracks."),
    mc("windows", "medium", "Which protocol does Active Directory use by default to authenticate domain users?", ["RADIUS", "Kerberos", "SNMP", "FTP"], 1, "AD uses Kerberos by default, falling back to the older NTLM in some cases."),
    ms("windows", "medium", "Which of these help you see what PowerShell commands were run? Select all that apply.", ["Script block logging", "Module logging", "Turning off Event Viewer", "Sysmon process creation events"], [0, 1, 3], "Script block and module logging record PowerShell activity, and Sysmon logs process creation with command lines."),
    tf("windows", "easy", "Administrators should use their admin account for daily email and web browsing.", false, "Daily work should use a standard account. Admin accounts should be used only when needed, ideally from a dedicated admin workstation."),

    // ---------------- Hardening ----------------
    ord("linux-permissions", "medium", "Put these Linux permission settings in order from most access to least access.", ["777", "755", "750", "700"], "777 lets everyone do everything; 755 removes write for group and others; 750 also removes all access for others; 700 leaves only the owner."),
    mc("hardening", "easy", "Which of these reduces a server's attack surface?", ["Installing extra tools just in case", "Removing services that are not used", "Opening all firewall ports", "Sharing one admin password"], 1, "Every unused service is another way in. Removing them shrinks the attack surface."),
    mc("hardening", "medium", "Which published guides give detailed hardening settings for many operating systems and applications?", ["OWASP Top 10", "CIS Benchmarks", "MITRE ATT&CK", "CVSS"], 1, "CIS Benchmarks provide configuration baselines for operating systems, cloud services and applications."),
    mc("hardening", "medium", "Which backup practice best protects against ransomware encrypting the backups too?", ["Keeping backups on the same file server", "An offline or immutable backup copy", "Backing up once a year", "Mapping the backup drive on every PC"], 1, "An offline or immutable copy cannot be reached or changed by ransomware running on the network."),
    mc("hardening", "medium", "Which setting makes SSH on a Linux server safer?", ["Allow root to log in with a password", "Use key-based authentication and disable direct root login", "Move SSH to port 23", "Turn off the host firewall"], 1, "SSH keys resist password guessing, and disabling root login forces admins to sign in as themselves and use sudo."),
    tf("hardening", "medium", "Full-disk encryption protects data on a stolen laptop that is powered off.", true, "Without the key, the disk contents are unreadable. It does not protect a laptop that is unlocked and running."),

    // ---------------- Endpoint ----------------
    mc("endpoint", "easy", "Which malware spreads across a network by itself without user action?", ["Trojan", "Worm", "Keylogger", "Adware"], 1, "Worms self-replicate across networks. A trojan needs the user to run it."),
    mc("endpoint", "medium", "Attackers use PowerShell and other built-in tools so nothing new is installed. What is this called?", ["Living off the land", "Watering hole", "Typosquatting", "Sandboxing"], 0, "Living off the land uses tools already on the system, which makes signature-based detection less effective."),
    ms("endpoint", "medium", "Which are common persistence locations on Windows? Select all that apply.", ["Registry Run keys", "Scheduled tasks", "New services", "The recycle bin"], [0, 1, 2], "Run keys, scheduled tasks and services all start code automatically. The recycle bin does not."),
    mc("endpoint", "hard", "EDR shows WINWORD.EXE starting powershell.exe with an encoded command. What is the best first assessment?", ["Normal behaviour for Word", "Likely a malicious document; investigate and consider isolating the host", "A printer driver update", "A false positive that can always be ignored"], 1, "Office starting an encoded PowerShell command is a classic malicious macro pattern."),
    tf("endpoint", "medium", "Application allow-listing only lets approved programs run, which can stop unknown malware.", true, "Allow-listing blocks anything not explicitly approved, including malware nobody has written signatures for yet."),
  ],
};
