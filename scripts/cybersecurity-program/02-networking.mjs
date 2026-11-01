import { check, mc, ms, num, ord, st, text, tf, tip } from "./helpers.mjs";

export default {
  order: 2,
  id: "cybersecurity-networking",
  title: "Networking for Security",
  summary: "Course 2 of 8 in the Zebron Cybersecurity Program. How networks really work, the protocols attackers abuse, and the devices and designs that defend them.",
  description: `
You cannot defend a network you do not understand. This course covers the OSI and TCP/IP models, IP addressing and subnetting, the ports and protocols you will see in every alert, and the devices and network designs used to keep attackers out.

Each lesson ends with a quick check. The final exam is drawn from the **Networking for Security** quiz in the Test Center.
`.trim(),
  level: "beginner",
  cover: "sky",
  outcomes: [
    "Map traffic and attacks to the OSI and TCP/IP layers",
    "Read IPv4 addresses and CIDR notation, and calculate usable hosts",
    "Recognise common ports and the secure version of each protocol",
    "Explain what firewalls, IDS/IPS, proxies and VPNs do",
    "Describe segmentation, DMZs and Zero Trust",
  ],
  skills: ["TCP/IP", "Subnetting", "Ports and protocols", "Firewalls", "Network segmentation"],
  quiz: {
    name: "Networking for Security",
    slug: "cybersecurity-networking",
    description: "Practice questions for Course 2 of the Cybersecurity Program: models, addressing, protocols, network defenses and secure design.",
    tags: ["cybersecurity", "networking"],
  },
  topics: [
    { key: "models", name: "OSI and TCP/IP models", description: "Layers, encapsulation and the TCP handshake." },
    { key: "addressing", name: "IP addressing and subnetting", description: "IPv4, CIDR, private ranges, NAT, IPv6, MAC addresses." },
    { key: "protocols", name: "Ports and protocols", description: "DNS, DHCP, HTTP(S), SSH, email and their secure versions." },
    { key: "defenses", name: "Network security devices", description: "Firewalls, IDS/IPS, proxies, VPNs and load balancers." },
    { key: "design", name: "Secure network design", description: "Segmentation, VLANs, DMZ, NAC, Zero Trust and wireless security." },
  ],
  modules: [
    {
      id: "how-networks-work",
      title: "How networks work",
      lessons: [
        {
          id: "models",
          title: "The OSI and TCP/IP models",
          minutes: 12,
          blocks: [
            text(`
## Seven layers, one conversation

The **OSI model** splits network communication into seven layers. Security people use it to say *where* a problem or control sits.

| # | Layer | What lives here | Example attack |
| --- | --- | --- | --- |
| 7 | Application | HTTP, DNS, SMTP | SQL injection, phishing pages |
| 6 | Presentation | Encoding, encryption formats | Malformed file formats |
| 5 | Session | Sessions between apps | Session hijacking |
| 4 | Transport | TCP, UDP, ports | SYN flood |
| 3 | Network | IP, routing, ICMP | IP spoofing |
| 2 | Data link | MAC addresses, switches, Ethernet | ARP spoofing, MAC flooding |
| 1 | Physical | Cables, radio, signals | Wiretapping, jamming |

The **TCP/IP model** used on the internet folds these into four layers: Application, Transport, Internet and Link (network access).
`),
            text(`
## TCP and UDP

**TCP** is connection-oriented and reliable. It starts with the **three-way handshake**:

1. Client sends **SYN**.
2. Server replies **SYN-ACK**.
3. Client sends **ACK**.

A **SYN flood** sends huge numbers of SYNs and never completes step 3, filling the server's table of half-open connections.

**UDP** is connectionless: no handshake, no delivery guarantee, but low overhead. DNS queries, streaming and VoIP use it. Because UDP replies can be much larger than requests and the source address is easy to fake, it is used for **amplification** attacks.

**Encapsulation**: each layer wraps the data from the layer above with its own header: data → segment (TCP) → packet (IP) → frame (Ethernet) → bits.
`),
            tip("A useful mnemonic for OSI from layer 1 up: “Please Do Not Throw Sausage Pizza Away”."),
            check(
              "ARP spoofing and MAC flooding happen at which OSI layer?",
              ["Layer 2, Data link", "Layer 3, Network", "Layer 7, Application"],
              0,
              "ARP maps IP addresses to MAC addresses on the local network, which is the data link layer.",
            ),
          ],
        },
        {
          id: "addressing",
          title: "IP addressing and subnetting",
          minutes: 14,
          blocks: [
            text(`
## IPv4 and CIDR

An IPv4 address is 32 bits, written as four numbers from 0 to 255, such as \`192.168.10.25\`. **CIDR notation** adds how many bits identify the network: \`192.168.10.0/24\` means the first 24 bits are the network and the last 8 bits are hosts.

Usable hosts in a subnet = **2^(host bits) − 2** (one address is the network address, one is the broadcast address).

| Prefix | Host bits | Usable hosts |
| --- | --- | --- |
| /24 | 8 | 254 |
| /26 | 6 | 62 |
| /28 | 4 | 14 |
| /30 | 2 | 2 |

## Private ranges and NAT

These ranges (RFC 1918) are not routed on the internet:

- \`10.0.0.0/8\`
- \`172.16.0.0/12\`
- \`192.168.0.0/16\`

**NAT** lets many private devices share one public address. \`127.0.0.1\` is the loopback address (the device itself), and \`169.254.x.x\` is an APIPA address a device gives itself when it cannot reach a DHCP server.
`),
            text(`
## IPv6 and MAC addresses

**IPv6** addresses are 128 bits, written in hexadecimal, such as \`2001:db8::1\`. There are so many addresses that NAT is not needed, which means devices can be directly reachable: firewall rules matter even more.

A **MAC address** is the 48-bit hardware address of a network interface, such as \`00:1A:2B:3C:4D:5E\`. Switches forward frames using MAC addresses; routers forward packets using IP addresses. MAC addresses are easy to change, so never treat them as proof of identity.
`),
            tip("Seeing 10.x, 172.16–31.x or 192.168.x in a log means traffic from inside a network. A public address you do not recognise talking to an internal server deserves a closer look."),
            check(
              "How many usable host addresses does a /27 subnet have?",
              ["30", "32", "62"],
              0,
              "A /27 leaves 5 host bits: 2^5 = 32 addresses, minus the network and broadcast addresses = 30.",
            ),
          ],
        },
        {
          id: "protocols",
          title: "Ports and protocols attackers love",
          minutes: 13,
          blocks: [
            text(`
## Ports to know by heart

| Port | Protocol | Notes |
| --- | --- | --- |
| 20/21 | FTP | Clear text: use SFTP or FTPS instead |
| 22 | SSH / SFTP | Encrypted remote administration |
| 23 | Telnet | Clear text: should be disabled |
| 25 | SMTP | Mail between servers |
| 53 | DNS | UDP for most queries, TCP for large ones and zone transfers |
| 67/68 | DHCP | Gives devices their IP settings |
| 80 | HTTP | Clear text web |
| 443 | HTTPS | Web over TLS |
| 445 | SMB | Windows file sharing, a frequent target |
| 3389 | RDP | Remote Desktop: never expose it directly to the internet |
| 389 / 636 | LDAP / LDAPS | Directory queries; 636 is the TLS version |
| 161/162 | SNMP | Use SNMPv3, which adds authentication and encryption |
`),
            text(`
## Protocol abuses

- **DNS** turns names into addresses. Attackers use **DNS spoofing/cache poisoning** to send victims to fake sites, and **DNS tunnelling** to sneak data out inside DNS queries. DNSSEC signs DNS records so they can be verified.
- **DHCP**: a rogue DHCP server can hand out a malicious gateway or DNS server. Switches defend with **DHCP snooping**.
- **ARP**: attackers send fake ARP replies to sit in the middle of traffic. **Dynamic ARP inspection** blocks this.
- **Email**: **SPF**, **DKIM** and **DMARC** let receivers check that mail claiming to come from a domain really did.

The rule of thumb: prefer the encrypted version (SSH over Telnet, HTTPS over HTTP, SFTP over FTP, LDAPS over LDAP, SNMPv3 over v1/v2c).
`),
            tip("If you see RDP (3389) or SMB (445) open to the internet in a scan, report it as a high-priority finding. Both are favourite ransomware entry points."),
            check(
              "Which port does HTTPS use by default?",
              ["80", "443", "8080"],
              1,
              "HTTPS uses TCP 443. Port 80 is plain HTTP.",
            ),
          ],
        },
      ],
    },
    {
      id: "defending-networks",
      title: "Defending networks",
      lessons: [
        {
          id: "defenses",
          title: "Firewalls, IDS/IPS, proxies and VPNs",
          minutes: 13,
          blocks: [
            text(`
## Firewalls

A firewall allows or blocks traffic by rules. Types you will meet:

- **Packet filtering (stateless)**: checks each packet's addresses and ports on its own.
- **Stateful**: tracks connections, so a reply is allowed only if it belongs to a connection that was started legitimately.
- **Next-generation firewall (NGFW)**: adds application awareness, user identity and built-in intrusion prevention.
- **Web application firewall (WAF)**: sits in front of web apps and blocks attacks such as SQL injection and cross-site scripting.

Rules are read top to bottom; the first match wins. A good rule set ends with **implicit deny**: anything not explicitly allowed is blocked.
`),
            text(`
## Detect or block

- An **IDS** (intrusion detection system) watches traffic and raises alerts. It is passive, often fed by a copy of traffic from a SPAN port or tap.
- An **IPS** (intrusion prevention system) sits inline and can drop malicious traffic.

Both can be **signature-based** (match known patterns, few false positives, blind to new attacks) or **anomaly-based** (learn normal behaviour and flag differences, can catch new attacks but produces more false positives).

## Other building blocks

- **Forward proxy**: users' web traffic goes through it, so it can filter and log sites.
- **Reverse proxy**: sits in front of servers, hiding them and often terminating TLS.
- **VPN**: an encrypted tunnel. **Site-to-site** VPNs (often IPsec) connect offices; **remote access** VPNs connect individual users.
- **Load balancer**: spreads traffic across servers and helps availability.
`),
            tip("A false positive is an alert on harmless activity. A false negative is a real attack that raised no alert, which is far more dangerous because nobody knows it happened."),
            check(
              "Which device sits inline and can drop malicious traffic automatically?",
              ["IDS", "IPS", "Network tap"],
              1,
              "An IPS is inline and can block traffic. An IDS only alerts.",
            ),
          ],
        },
        {
          id: "design",
          title: "Secure network design",
          minutes: 12,
          blocks: [
            text(`
## Segmentation

A **flat network**, where every device can reach every other device, lets one infected laptop reach the payroll server. **Segmentation** splits the network into zones with controlled paths between them:

- **VLANs** separate traffic on the same switches (for example staff, guests, servers, phones).
- **Screened subnet (DMZ)**: public-facing servers such as web and mail sit between the internet and the internal network, with firewalls on both sides.
- **Microsegmentation**: fine-grained rules down to individual workloads, common in data centres and the cloud.
- **Air gap**: no network connection at all, used for some industrial and highly sensitive systems.

**Network access control (NAC)** checks devices before they join, for example using **802.1X** so only authenticated, healthy devices get on the network.
`),
            text(`
## Zero Trust

Traditional networks trusted anything inside the perimeter. **Zero Trust** assumes the network is already hostile:

- Never trust, always verify: check every request, not just the first one.
- Use strong identity (MFA) and device health for every access decision.
- Grant least-privilege access to specific applications, not whole networks.
- Assume breach and log everything.

## Wireless

Use **WPA3** where possible (WPA2-AES at minimum). **WPA2/WPA3-Enterprise** gives each user their own credentials through 802.1X and RADIUS. Disable WPS, put guests on a separate network, and watch for **evil twin** access points that copy your network name.
`),
            tip("When you draw a network diagram, mark every place traffic crosses between zones. Each crossing is where a firewall rule or access check belongs."),
            check(
              "Where should a company's public web server usually be placed?",
              ["On the internal staff VLAN", "In a screened subnet (DMZ)", "On the guest Wi-Fi"],
              1,
              "Public-facing servers go in a DMZ, so a compromise does not give direct access to the internal network.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Models ----------------
    mc("models", "easy", "At which OSI layer do routers make forwarding decisions using IP addresses?", ["Layer 2", "Layer 3", "Layer 4", "Layer 7"], 1, "Routing by IP address happens at layer 3, the network layer."),
    ord("models", "easy", "Put the steps of the TCP three-way handshake in order.", ["Client sends SYN", "Server replies SYN-ACK", "Client sends ACK"], "SYN, then SYN-ACK, then ACK establishes a TCP connection."),
    mc("models", "medium", "An attacker sends thousands of SYN packets and never completes the handshake. What is this attack?", ["Smurf attack", "SYN flood", "ARP poisoning", "DNS tunnelling"], 1, "A SYN flood fills the server's half-open connection table so real users cannot connect."),
    tf("models", "easy", "UDP guarantees that every packet arrives in order.", false, "UDP is connectionless with no delivery or ordering guarantees. TCP provides reliability."),
    mc("models", "medium", "Which TCP/IP model layer corresponds to OSI layers 5, 6 and 7?", ["Transport", "Internet", "Application", "Link"], 2, "The TCP/IP Application layer covers OSI Application, Presentation and Session."),

    // ---------------- Addressing ----------------
    num("addressing", "medium", "How many usable host addresses are in a /26 subnet?", 62, 0, "A /26 leaves 6 host bits: 2^6 = 64, minus network and broadcast = 62.", "Usable hosts = 2^(32 − prefix) − 2."),
    ms("addressing", "easy", "Which of these are private (RFC 1918) IPv4 addresses? Select all that apply.", ["10.20.30.40", "172.20.1.5", "192.168.1.10", "8.8.8.8"], [0, 1, 2], "10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16 are private. 8.8.8.8 is a public address (Google DNS)."),
    mc("addressing", "easy", "A workstation shows the address 169.254.12.7. What does this most likely mean?", ["It is on the DMZ", "It could not reach a DHCP server", "It is using IPv6", "It is the default gateway"], 1, "169.254.x.x is an APIPA (link-local) address a device assigns itself when DHCP fails."),
    mc("addressing", "medium", "How long is an IPv6 address?", ["32 bits", "48 bits", "64 bits", "128 bits"], 3, "IPv6 addresses are 128 bits. IPv4 is 32 bits and MAC addresses are 48 bits."),
    tf("addressing", "medium", "A MAC address is a reliable way to prove which device is connecting, because it cannot be changed.", false, "MAC addresses are easy to spoof in software, so they should never be the only identity check."),

    // ---------------- Protocols ----------------
    mc("protocols", "easy", "Which port does Remote Desktop Protocol (RDP) use by default?", ["22", "445", "3389", "8443"], 2, "RDP listens on TCP 3389. Exposing it to the internet is a common ransomware entry point."),
    mc("protocols", "easy", "Which protocol should replace Telnet for remote administration?", ["FTP", "SSH", "SNMPv1", "HTTP"], 1, "SSH (port 22) encrypts the session. Telnet sends everything, including passwords, in clear text."),
    st("protocols", "medium", "Which port number does DNS use?", ["53"], "DNS uses port 53, over UDP for most queries and TCP for large responses and zone transfers."),
    ms("protocols", "medium", "Which records help receivers check that email really came from your domain? Select all that apply.", ["SPF", "DKIM", "DMARC", "DHCP"], [0, 1, 2], "SPF lists allowed senders, DKIM signs messages and DMARC sets the policy. DHCP hands out IP settings and has nothing to do with email."),
    mc("protocols", "hard", "Unusually long, random-looking subdomains in DNS queries to one domain may indicate…", ["DNS tunnelling for data exfiltration", "A DHCP starvation attack", "Normal CDN behaviour only", "A misconfigured printer"], 0, "Data can be encoded into DNS query names and sent to an attacker's domain. Long, high-entropy subdomains are a classic sign."),

    // ---------------- Defenses ----------------
    mc("defenses", "easy", "What does an IDS do when it detects an attack?", ["Drops the packets", "Raises an alert", "Encrypts the traffic", "Reboots the server"], 1, "An IDS is passive: it detects and alerts. An IPS can block."),
    mc("defenses", "medium", "Which firewall type tracks connections so replies are allowed only for connections that were legitimately opened?", ["Stateless packet filter", "Stateful firewall", "Proxy auto-config", "Load balancer"], 1, "A stateful firewall keeps a table of connections and checks return traffic against it."),
    mc("defenses", "medium", "Which device is designed to block SQL injection and cross-site scripting aimed at a web app?", ["Web application firewall", "Network tap", "DHCP server", "Layer 2 switch"], 0, "A WAF inspects HTTP traffic for application-layer attacks."),
    tf("defenses", "medium", "Signature-based detection is good at catching brand-new attacks that have never been seen before.", false, "Signatures match known patterns. New (zero-day) attacks need anomaly or behaviour-based detection."),
    mc("defenses", "hard", "A real attack happens on the network but the IDS raises no alert. What is this outcome called?", ["False positive", "False negative", "True positive", "True negative"], 1, "A false negative is a missed attack. It is more dangerous than a false positive because nobody responds."),

    // ---------------- Design ----------------
    mc("design", "easy", "What is the main security benefit of network segmentation?", ["Faster internet", "Limiting how far an attacker can move", "Fewer IP addresses", "No need for passwords"], 1, "Segmentation limits lateral movement, so one compromised device cannot reach everything."),
    mc("design", "medium", "Which standard provides port-based network access control, so devices must authenticate before joining the network?", ["802.11ac", "802.1X", "802.3af", "802.1Q"], 1, "802.1X authenticates devices and users (usually through RADIUS) before granting network access. 802.1Q is VLAN tagging."),
    ms("design", "medium", "Which statements describe Zero Trust? Select all that apply.", ["Never trust, always verify", "Anything inside the office network is trusted", "Grant least-privilege access per application", "Assume a breach has already happened"], [0, 2, 3], "Zero Trust removes implicit trust in the internal network and verifies every request."),
    mc("design", "medium", "Which Wi-Fi security option is the best choice for a new office network?", ["WEP", "WPA-TKIP", "WPA3", "Open network with a captive portal"], 2, "WPA3 is the current standard. WEP and WPA-TKIP are broken."),
    mc("design", "hard", "An attacker sets up an access point with the same name as the café's Wi-Fi to capture traffic. What is this called?", ["Evil twin", "Bluejacking", "War driving", "Jamming"], 0, "An evil twin imitates a legitimate network so victims connect to it."),
  ],
};
