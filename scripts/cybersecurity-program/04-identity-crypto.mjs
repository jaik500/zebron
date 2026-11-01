import { check, mc, ms, num, ord, st, text, tf, tip } from "./helpers.mjs";

export default {
  order: 4,
  id: "cybersecurity-identity-crypto",
  title: "Identity, Access and Cryptography",
  summary: "Course 4 of 8 in the Zebron Cybersecurity Program. How we prove who someone is, decide what they may do, and protect data with encryption, hashing and certificates.",
  description: `
Most breaches involve stolen or misused credentials. This course covers authentication and MFA, access control models, single sign-on and federation, and the cryptography that protects passwords, data and connections.

Each lesson ends with a quick check. The final exam is drawn from the **Identity, Access and Cryptography** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "violet",
  outcomes: [
    "Explain authentication factors and choose phishing-resistant MFA",
    "Compare DAC, MAC, RBAC and ABAC access control",
    "Describe SSO, SAML, OAuth 2.0 and OpenID Connect",
    "Choose between symmetric encryption, asymmetric encryption and hashing",
    "Explain how TLS and certificates protect a web connection",
  ],
  skills: ["Identity and access management", "MFA", "Single sign-on", "Encryption", "PKI and TLS"],
  quiz: {
    name: "Identity, Access and Cryptography",
    slug: "cybersecurity-identity-crypto",
    description: "Practice questions for Course 4 of the Cybersecurity Program: authentication, access control, federation, cryptography and PKI.",
    tags: ["cybersecurity", "iam", "cryptography"],
  },
  topics: [
    { key: "authentication", name: "Authentication and MFA", description: "Factors, passwords, MFA and passwordless sign-in." },
    { key: "access-control", name: "Access control models", description: "AAA, DAC, MAC, RBAC, ABAC, account lifecycle and PAM." },
    { key: "federation", name: "SSO and federation", description: "SAML, OAuth 2.0, OpenID Connect, Kerberos." },
    { key: "crypto", name: "Encryption and hashing", description: "Symmetric, asymmetric, hashing, salting and key management." },
    { key: "pki", name: "PKI, certificates and TLS", description: "Certificates, certificate authorities, digital signatures and TLS." },
  ],
  modules: [
    {
      id: "identity",
      title: "Identity and access",
      lessons: [
        {
          id: "authentication",
          title: "Authentication and MFA",
          minutes: 12,
          blocks: [
            text(`
## Identification, authentication, authorisation, accounting

- **Identification**: claiming an identity (typing a username).
- **Authentication**: proving it (password, fingerprint, security key).
- **Authorisation**: deciding what that identity may do.
- **Accounting**: recording what it did (logs).

Together these are called **AAA** (authentication, authorisation, accounting).

## Factors

| Factor | Examples |
| --- | --- |
| Something you **know** | Password, PIN |
| Something you **have** | Phone app, hardware security key, smart card |
| Something you **are** | Fingerprint, face |

**MFA** requires factors from at least two different categories. A password plus a security question is still one factor (both are things you know).
`),
            text(`
## Not all MFA is equal

From weakest to strongest:

1. **SMS codes**: can be intercepted through SIM swapping.
2. **Authenticator app codes (TOTP)** and **push notifications**: better, but users can be tricked into typing codes into fake sites, or into approving a flood of push prompts (**MFA fatigue**). Number matching helps.
3. **FIDO2 / passkeys and hardware security keys**: **phishing-resistant**, because the key checks the website's real domain before it signs anything.

## Passwords that still exist

Current guidance (NIST SP 800-63B) favours **length** over complexity rules, checking new passwords against lists of breached passwords, no forced periodic changes unless there is evidence of compromise, and allowing password managers to paste.

Common attacks: **brute force** (try every combination), **dictionary** (try common words), **password spraying** (try one common password against many accounts) and **credential stuffing** (reuse passwords leaked from another site).
`),
            tip("Turn on a passkey or security key for your own email first. Your email account can reset almost every other account you own."),
            check(
              "A password plus a fingerprint is an example of…",
              ["Single-factor authentication", "Multi-factor authentication", "Federation"],
              1,
              "Something you know plus something you are: two different factors.",
            ),
          ],
        },
        {
          id: "access-control",
          title: "Access control models and account lifecycle",
          minutes: 12,
          blocks: [
            text(`
## Access control models

| Model | Who decides | Example |
| --- | --- | --- |
| **DAC** (discretionary) | The owner of the resource | Sharing your own file with a colleague |
| **MAC** (mandatory) | The system, using labels and clearances | Military "Secret" and "Top Secret" data |
| **RBAC** (role-based) | Permissions attached to job roles | Everyone in Payroll gets the payroll app |
| **ABAC** (attribute-based) | Rules combining attributes | Managers, on a company laptop, during work hours, from Canada |

**Rule-based** access control uses fixed rules, such as a firewall rule set or "no sign-ins between midnight and 5 a.m.".
`),
            text(`
## Joiners, movers and leavers

Most access problems come from the account lifecycle:

- **Joiners**: create accounts from an approved request, with the role's standard access.
- **Movers**: when someone changes jobs, remove the old access, not just add the new. Otherwise access piles up (**privilege creep**).
- **Leavers**: disable accounts on the last day, revoke sessions and tokens, and collect devices.

Run **access reviews** (recertification) regularly, where managers confirm each person still needs their access.

## Privileged access

Admin accounts are the most valuable target. **Privileged access management (PAM)** tools store admin passwords in a vault, rotate them, grant **just-in-time** access for a limited time and record sessions.
`),
            tip("When someone leaves, check for access outside your main directory: SaaS apps, shared passwords, API keys and personal devices with company data."),
            check(
              "Which model grants access based on a person's job function?",
              ["DAC", "MAC", "RBAC"],
              2,
              "Role-based access control attaches permissions to roles such as Payroll or HR.",
            ),
          ],
        },
        {
          id: "federation",
          title: "Single sign-on and federation",
          minutes: 11,
          blocks: [
            text(`
## Single sign-on

**SSO** lets a user sign in once with an **identity provider (IdP)**, such as Microsoft Entra ID, Okta or Google, and then reach many applications (**service providers**) without signing in again. Benefits: fewer passwords, MFA in one place, and one switch to disable a leaver everywhere.

## The protocols

| Protocol | Used for | Format |
| --- | --- | --- |
| **SAML 2.0** | Enterprise web SSO | XML assertions |
| **OAuth 2.0** | **Authorisation**: letting an app access an API on your behalf | Access tokens |
| **OpenID Connect (OIDC)** | **Authentication** built on top of OAuth 2.0 | JSON Web Tokens (ID tokens) |
| **Kerberos** | Sign-in inside Windows domains | Tickets |
| **LDAP** | Querying directories such as Active Directory | Directory entries |

A common mistake: OAuth 2.0 alone is not a sign-in protocol. "Sign in with Google" uses **OpenID Connect** on top of OAuth.
`),
            text(`
## Risks to watch

- **Token theft**: stolen session cookies or tokens let attackers skip passwords and MFA entirely. Short token lifetimes, device binding and re-checking risk on sensitive actions help.
- **Consent phishing**: a malicious app asks users to grant it OAuth access to their mailbox. Restrict which apps users can approve.
- **IdP compromise**: if the identity provider falls, every connected app falls. Protect IdP admins with phishing-resistant MFA and PAM.
- **Kerberos attacks** such as Kerberoasting (cracking service account tickets offline) and golden tickets (forged tickets after the KRBTGT account is compromised).
`),
            tip("When you review an app integration, ask: which identity provider does it trust, which scopes does it request, and how long do its tokens last?"),
            check(
              "Which protocol adds authentication (an ID token) on top of OAuth 2.0?",
              ["SAML", "OpenID Connect", "LDAP"],
              1,
              "OpenID Connect is the identity layer on top of OAuth 2.0.",
            ),
          ],
        },
      ],
    },
    {
      id: "cryptography",
      title: "Cryptography",
      lessons: [
        {
          id: "crypto",
          title: "Encryption and hashing",
          minutes: 13,
          blocks: [
            text(`
## Three tools, three jobs

| Tool | Reversible? | Used for | Examples |
| --- | --- | --- | --- |
| **Symmetric encryption** | Yes, with the same key | Encrypting lots of data fast | AES-256, ChaCha20 |
| **Asymmetric encryption** | Yes, with the other key of the pair | Key exchange, digital signatures | RSA, elliptic curve (ECC) |
| **Hashing** | No (one-way) | Integrity, password storage | SHA-256, SHA-3 |

**Symmetric** encryption is fast, but both sides need the same secret key, which is hard to share safely. **Asymmetric** encryption uses a **public key** anyone can have and a **private key** only the owner keeps; it is slower, so it is mostly used to exchange a symmetric key. Real systems combine both.

**MD5** and **SHA-1** are broken for security uses (collisions can be produced). **DES** and **3DES** are retired.
`),
            text(`
## Storing passwords properly

Never store passwords encrypted (they could be decrypted) or with a plain fast hash (they can be guessed billions of times a second). Use a **slow, salted password hashing algorithm**: **Argon2**, **bcrypt**, **scrypt** or **PBKDF2**.

- A **salt** is a random value stored with each hash so identical passwords get different hashes, defeating **rainbow tables**.
- A **pepper** is a secret added to every password and kept outside the database.

## Data states and keys

- **At rest**: stored data, protected with disk, database or file encryption.
- **In transit**: moving over a network, protected with TLS, SSH or VPNs.
- **In use**: being processed in memory, protected by newer techniques such as confidential computing.

Encryption is only as good as **key management**: generate keys securely, store them in a key management service or hardware security module (HSM), rotate them, and limit who can use them.
`),
            tip("If a system can email you your old password, it is not hashing passwords properly. Report it."),
            check(
              "Which should a developer use to store user passwords?",
              ["AES encryption", "bcrypt or Argon2 with a salt", "MD5"],
              1,
              "Slow, salted password hashing algorithms such as bcrypt and Argon2 are designed for password storage.",
            ),
          ],
        },
        {
          id: "pki",
          title: "PKI, certificates and TLS",
          minutes: 12,
          blocks: [
            text(`
## Digital signatures

To **sign**, the sender hashes the message and signs that hash with their **private key**. Anyone can verify the signature with the sender's **public key**. A valid signature proves **integrity** (the message was not changed), **authenticity** (who sent it) and supports **non-repudiation**.

To send something **confidential** to Alice, encrypt it with **Alice's public key**; only her private key can decrypt it.

## Certificates and certificate authorities

A **certificate** (X.509) binds a public key to a name, such as \`www.example.com\`, and is signed by a **certificate authority (CA)** that browsers trust. The chain runs: **root CA → intermediate CA → server certificate**.

Certificates expire and can be **revoked** if a private key leaks; browsers check revocation with **CRLs** or **OCSP**.
`),
            text(`
## What TLS does for a website

When you open \`https://\`, the browser and server perform a **TLS handshake**:

1. They agree on a TLS version (use **TLS 1.2 or 1.3**; SSL and TLS 1.0/1.1 are retired) and cipher suite.
2. The server sends its certificate; the browser checks the name, the dates and the CA chain.
3. They use asymmetric key exchange (typically ephemeral Diffie-Hellman) to agree on a shared **session key**.
4. The rest of the session is encrypted with fast **symmetric** encryption.

Ephemeral key exchange gives **forward secrecy**: stealing the server's private key later does not decrypt past sessions. **HSTS** tells browsers to always use HTTPS for a site.
`),
            tip("Expired certificates cause outages. Keep an inventory of certificates and automate renewal (for example with ACME and Let's Encrypt)."),
            check(
              "To verify a digital signature from Bob, which key do you use?",
              ["Bob's private key", "Bob's public key", "Your own private key"],
              1,
              "Signatures are made with the signer's private key and verified with their public key.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Authentication ----------------
    mc("authentication", "easy", "A hardware security key is which authentication factor?", ["Something you know", "Something you have", "Something you are", "Somewhere you are"], 1, "A physical key you carry is something you have."),
    tf("authentication", "easy", "A password plus a security question counts as multi-factor authentication.", false, "Both are things you know, so it is still a single factor."),
    mc("authentication", "medium", "Which MFA method is phishing-resistant?", ["SMS codes", "Authenticator app codes", "FIDO2 security keys or passkeys", "Email codes"], 2, "FIDO2 checks the real website domain before signing, so a fake site cannot use it."),
    mc("authentication", "medium", "An attacker tries the password 'Winter2025!' against every account in a company. What is this?", ["Brute force", "Password spraying", "Rainbow table attack", "Keylogging"], 1, "Spraying tries one or a few common passwords across many accounts to avoid lockouts."),
    mc("authentication", "medium", "A user gets 30 push MFA prompts at 2 a.m. and finally approves one. What attack is this?", ["MFA fatigue (push bombing)", "SIM swapping", "Shoulder surfing", "Tailgating"], 0, "Flooding a user with prompts until they approve is MFA fatigue. Number matching and phishing-resistant MFA help."),

    // ---------------- Access control ----------------
    mc("access-control", "easy", "In which model does the owner of a file decide who can access it?", ["DAC", "MAC", "RBAC", "ABAC"], 0, "Discretionary access control leaves the decision to the owner."),
    mc("access-control", "medium", "An employee changes departments three times and keeps access from every job. What is this called?", ["Privilege creep", "Separation of duties", "Federation", "Least privilege"], 0, "Access that accumulates as people move roles is privilege creep. Access reviews and mover processes prevent it."),
    mc("access-control", "medium", "A rule allows access only to managers, on company devices, during business hours. Which model is this?", ["DAC", "RBAC", "ABAC", "MAC"], 2, "Combining several attributes (role, device, time) is attribute-based access control."),
    ms("access-control", "medium", "What should happen on an employee's last day? Select all that apply.", ["Disable their accounts", "Revoke active sessions and tokens", "Collect company devices", "Keep their account active for a year just in case"], [0, 1, 2], "Leavers' access must end promptly, including sessions, tokens and devices."),
    tf("access-control", "medium", "Just-in-time privileged access grants admin rights only for a limited time when needed.", true, "JIT access reduces standing admin privileges, a key part of privileged access management."),

    // ---------------- Federation ----------------
    mc("federation", "easy", "What is the main benefit of single sign-on for users?", ["No need for any authentication", "One sign-in to reach many applications", "Faster internet", "Free MFA hardware"], 1, "SSO lets users authenticate once at the identity provider and then use many apps."),
    mc("federation", "medium", "Which protocol is primarily for authorisation, letting an app access an API on the user's behalf?", ["OAuth 2.0", "SAML", "Kerberos", "RADIUS"], 0, "OAuth 2.0 issues access tokens for authorisation. OIDC adds authentication on top."),
    mc("federation", "medium", "Which format do SAML assertions use?", ["JSON", "XML", "CSV", "YAML"], 1, "SAML uses XML. OpenID Connect uses JSON Web Tokens."),
    tf("federation", "hard", "Stealing a valid session token can let an attacker skip both the password and MFA.", true, "The token proves authentication already happened. Token lifetimes and device binding reduce the risk."),
    mc("federation", "hard", "An attacker requests Kerberos service tickets and cracks them offline to recover service account passwords. What is this?", ["Pass-the-hash", "Kerberoasting", "Golden ticket", "Credential stuffing"], 1, "Kerberoasting targets service tickets encrypted with service account password hashes. Long, random service account passwords defeat it."),

    // ---------------- Crypto ----------------
    mc("crypto", "easy", "Which algorithm is symmetric encryption?", ["RSA", "AES", "SHA-256", "ECDSA"], 1, "AES uses the same key to encrypt and decrypt. RSA and ECDSA are asymmetric; SHA-256 is a hash."),
    tf("crypto", "easy", "A hash can be reversed with the right key to get the original data.", false, "Hashing is one-way. There is no key to reverse it."),
    mc("crypto", "medium", "What is the purpose of a salt in password hashing?", ["To make hashing faster", "To make identical passwords produce different hashes", "To encrypt the database", "To replace MFA"], 1, "A unique salt per password defeats rainbow tables and hides users who share a password."),
    ms("crypto", "medium", "Which algorithms should no longer be used for security purposes? Select all that apply.", ["MD5", "SHA-1", "DES", "AES-256"], [0, 1, 2], "MD5 and SHA-1 have practical collisions and DES has a tiny key. AES-256 is current."),
    num("crypto", "hard", "AES-256 uses a key of how many bits?", 256, 0, "The number in AES-128, AES-192 and AES-256 is the key length in bits."),

    // ---------------- PKI ----------------
    mc("pki", "medium", "You want to send Alice a file only she can read. Which key do you encrypt it with?", ["Your private key", "Your public key", "Alice's public key", "Alice's private key"], 2, "Encrypt with the recipient's public key; only her private key can decrypt."),
    mc("pki", "easy", "What does a certificate authority do?", ["Stores user passwords", "Signs certificates that bind public keys to names", "Blocks malware", "Assigns IP addresses"], 1, "A CA vouches for the link between a public key and an identity by signing the certificate."),
    ord("pki", "hard", "Put the main steps of a TLS connection in order.", ["Agree on TLS version and cipher suite", "Server sends its certificate", "Browser validates the certificate chain", "Key exchange creates a shared session key", "Data is encrypted with the symmetric session key"], "Negotiate, authenticate the server, agree a session key, then use fast symmetric encryption."),
    mc("pki", "medium", "Which TLS versions should a modern website allow?", ["SSL 3.0 and TLS 1.0", "TLS 1.0 and 1.1", "TLS 1.2 and 1.3", "Any version the browser asks for"], 2, "SSL and TLS 1.0/1.1 are deprecated. Use TLS 1.2 and 1.3."),
    st("pki", "medium", "Which web security header tells browsers to always use HTTPS for a site? Give the acronym.", ["HSTS", "Strict-Transport-Security"], "HTTP Strict Transport Security (the Strict-Transport-Security header) makes browsers refuse plain HTTP for the site."),
  ],
};
