  /**
 * Zebron Cybersecurity Question Bank
 *
 * 200 original multiple-choice questions for Test Center.
 * Designed for use with TestQuestionImportService.
 */

import { TestQuestionImportRecord, TestQuestionImportTopic } from '../models/test-question-import.model';

export const CYBERSECURITY_QUESTION_BANK_TOPICS: readonly TestQuestionImportTopic[] = [
  {
    "key": "fundamentals",
    "name": "Cybersecurity Fundamentals",
    "slug": "fundamentals",
    "description": "Foundational cybersecurity concepts, principles, controls, and security architecture."
  },
  {
    "key": "threats-risk",
    "name": "Threats, Vulnerabilities & Risk",
    "slug": "threats-risk",
    "description": "Threat actors, vulnerabilities, risk assessment, attack concepts, and risk treatment."
  },
  {
    "key": "malware",
    "name": "Malware",
    "slug": "malware",
    "description": "Common malware types, behaviors, persistence, and endpoint defenses."
  },
  {
    "key": "social",
    "name": "Social Engineering & Phishing",
    "slug": "social",
    "description": "Phishing, impersonation, social engineering techniques, and user defenses."
  },
  {
    "key": "iam",
    "name": "Identity & Access Management",
    "slug": "iam",
    "description": "Authentication, authorization, MFA, privileged access, and account security."
  },
  {
    "key": "network",
    "name": "Network Security",
    "slug": "network",
    "description": "Firewalls, segmentation, secure protocols, network monitoring, and zero trust."
  },
  {
    "key": "crypto",
    "name": "Cryptography",
    "slug": "crypto",
    "description": "Encryption, hashing, keys, certificates, digital signatures, and cryptographic practices."
  },
  {
    "key": "endpoint",
    "name": "Endpoint & System Security",
    "slug": "endpoint",
    "description": "Patching, secure configuration, endpoint controls, vulnerability scanning, and forensics."
  },
  {
    "key": "cloud-app",
    "name": "Cloud & Application Security",
    "slug": "cloud-app",
    "description": "Cloud security, secure development, application vulnerabilities, secrets, and dependencies."
  },
  {
    "key": "ops-ir",
    "name": "Security Operations & Incident Response",
    "slug": "ops-ir",
    "description": "Monitoring, SIEM, incident response, containment, investigation, and threat hunting."
  },
  {
    "key": "governance",
    "name": "Governance, Policies & Security Awareness",
    "slug": "governance",
    "description": "Governance, data protection, resilience, policies, compliance, and awareness."
  }
];

export const CYBERSECURITY_QUESTION_BANK: readonly TestQuestionImportRecord[] = [
  {
    "seedId": "cyber-001",
    "topicKey": "fundamentals",
    "question": "What does the CIA triad stand for in cybersecurity?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Confidentiality, integrity, and availability"
      },
      {
        "id": "b",
        "text": "Control, inspection, and authorization"
      },
      {
        "id": "c",
        "text": "Compliance, identity, and auditing"
      },
      {
        "id": "d",
        "text": "Continuity, isolation, and authentication"
      }
    ],
    "correctAnswer": "a",
    "explanation": "The CIA triad is the foundational model for protecting information confidentiality, integrity, and availability.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-002",
    "topicKey": "fundamentals",
    "question": "What is a cybersecurity asset?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Only a physical computer"
      },
      {
        "id": "b",
        "text": "Only a user account"
      },
      {
        "id": "c",
        "text": "A type of malware"
      },
      {
        "id": "d",
        "text": "A resource that has value and needs protection"
      }
    ],
    "correctAnswer": "d",
    "explanation": "An asset can be data, systems, applications, services, devices, or other resources that have value to an organization.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-003",
    "topicKey": "fundamentals",
    "question": "What is a vulnerability?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A backup copy of data"
      },
      {
        "id": "b",
        "text": "A security policy"
      },
      {
        "id": "c",
        "text": "A weakness that could be exploited"
      },
      {
        "id": "d",
        "text": "A confirmed security incident"
      }
    ],
    "correctAnswer": "c",
    "explanation": "A vulnerability is a weakness in technology, configuration, process, or people that may be exploited.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-004",
    "topicKey": "fundamentals",
    "question": "What is a threat?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A data classification label"
      },
      {
        "id": "b",
        "text": "A potential cause of harm to an asset"
      },
      {
        "id": "c",
        "text": "A software patch"
      },
      {
        "id": "d",
        "text": "A firewall rule"
      }
    ],
    "correctAnswer": "b",
    "explanation": "A threat is a potential actor, event, or circumstance capable of causing harm.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-005",
    "topicKey": "fundamentals",
    "question": "What is risk generally a combination of?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Likelihood and impact"
      },
      {
        "id": "b",
        "text": "Password length and username"
      },
      {
        "id": "c",
        "text": "Encryption and compression"
      },
      {
        "id": "d",
        "text": "Availability and storage size"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Risk is commonly assessed using the likelihood of an adverse event and its potential impact.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-006",
    "topicKey": "fundamentals",
    "question": "Which principle limits a user to only the access needed for assigned duties?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Open access"
      },
      {
        "id": "b",
        "text": "Default allow"
      },
      {
        "id": "c",
        "text": "Shared administration"
      },
      {
        "id": "d",
        "text": "Least privilege"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Least privilege reduces exposure by limiting permissions to what is necessary.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-007",
    "topicKey": "fundamentals",
    "question": "What is defense in depth?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Removing all security controls"
      },
      {
        "id": "b",
        "text": "Encrypting only backups"
      },
      {
        "id": "c",
        "text": "Using multiple complementary security controls"
      },
      {
        "id": "d",
        "text": "Using one very strong password"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Defense in depth layers preventive, detective, and corrective controls so one failure does not expose everything.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-008",
    "topicKey": "fundamentals",
    "question": "What is security by design?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Using the same credentials everywhere"
      },
      {
        "id": "b",
        "text": "Considering security requirements throughout system design and development"
      },
      {
        "id": "c",
        "text": "Adding security only after deployment"
      },
      {
        "id": "d",
        "text": "Avoiding security testing"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Security by design integrates security considerations into architecture, development, testing, and operations.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-009",
    "topicKey": "fundamentals",
    "question": "What is an attack surface?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "The collection of points where an attacker could attempt to gain access"
      },
      {
        "id": "b",
        "text": "The number of security employees"
      },
      {
        "id": "c",
        "text": "The physical area of a data center"
      },
      {
        "id": "d",
        "text": "The size of a backup file"
      }
    ],
    "correctAnswer": "a",
    "explanation": "The attack surface includes exposed interfaces, services, applications, accounts, and other reachable entry points.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-010",
    "topicKey": "fundamentals",
    "question": "What is a security control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A vulnerability report only"
      },
      {
        "id": "b",
        "text": "A type of network cable"
      },
      {
        "id": "c",
        "text": "A user profile"
      },
      {
        "id": "d",
        "text": "A safeguard used to reduce security risk"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Security controls are safeguards such as policies, technical mechanisms, and procedures that reduce risk.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-011",
    "topicKey": "fundamentals",
    "question": "Which is an example of a preventive control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A forensic image"
      },
      {
        "id": "b",
        "text": "A lessons-learned meeting"
      },
      {
        "id": "c",
        "text": "A firewall blocking unauthorized traffic"
      },
      {
        "id": "d",
        "text": "A post-incident report"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Preventive controls are intended to stop unwanted events before they occur.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-012",
    "topicKey": "fundamentals",
    "question": "Which is an example of a detective control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A backup restoration procedure"
      },
      {
        "id": "b",
        "text": "An intrusion detection system generating an alert"
      },
      {
        "id": "c",
        "text": "A password policy"
      },
      {
        "id": "d",
        "text": "A firewall rule blocking traffic"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Detective controls identify or alert on events that may indicate a security problem.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-013",
    "topicKey": "fundamentals",
    "question": "Which is an example of a corrective control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Restoring a compromised system from a known-good backup"
      },
      {
        "id": "b",
        "text": "A login banner"
      },
      {
        "id": "c",
        "text": "A firewall rule"
      },
      {
        "id": "d",
        "text": "A security awareness poster"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Corrective controls help restore normal operations or reduce the effects of an incident.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-014",
    "topicKey": "fundamentals",
    "question": "What does nonrepudiation help provide?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Guaranteed system availability"
      },
      {
        "id": "b",
        "text": "Faster network throughput"
      },
      {
        "id": "c",
        "text": "Automatic malware removal"
      },
      {
        "id": "d",
        "text": "Evidence that supports the origin or action of a transaction"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Nonrepudiation uses mechanisms such as digital signatures and audit records to support accountability for actions.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-015",
    "topicKey": "fundamentals",
    "question": "What is information security primarily concerned with?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Reducing file sizes"
      },
      {
        "id": "b",
        "text": "Designing user interfaces"
      },
      {
        "id": "c",
        "text": "Protecting information and systems from unauthorized access, use, disclosure, disruption, modification, or destruction"
      },
      {
        "id": "d",
        "text": "Increasing processor speed"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Information security protects information and related systems against a broad range of threats and unauthorized actions.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-016",
    "topicKey": "fundamentals",
    "question": "What is a security baseline?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A network cable standard"
      },
      {
        "id": "b",
        "text": "A defined minimum set of security requirements or configurations"
      },
      {
        "id": "c",
        "text": "A list of all employees"
      },
      {
        "id": "d",
        "text": "A malware sample"
      }
    ],
    "correctAnswer": "b",
    "explanation": "A baseline establishes an approved minimum security posture for systems or environments.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-017",
    "topicKey": "fundamentals",
    "question": "Why is asset inventory important?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "You cannot effectively protect assets you do not know exist"
      },
      {
        "id": "b",
        "text": "It eliminates the need for patching"
      },
      {
        "id": "c",
        "text": "It guarantees no breaches occur"
      },
      {
        "id": "d",
        "text": "It replaces incident response"
      }
    ],
    "correctAnswer": "a",
    "explanation": "An accurate inventory helps organizations identify what must be protected, monitored, patched, and recovered.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-018",
    "topicKey": "fundamentals",
    "question": "What is a security policy?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A firewall appliance"
      },
      {
        "id": "b",
        "text": "A malware scanner"
      },
      {
        "id": "c",
        "text": "A database index"
      },
      {
        "id": "d",
        "text": "A documented statement of security expectations and requirements"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Policies establish organizational expectations, responsibilities, and rules for security.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-019",
    "topicKey": "fundamentals",
    "question": "What is a security standard?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A backup device"
      },
      {
        "id": "b",
        "text": "A phishing email"
      },
      {
        "id": "c",
        "text": "A specific set of mandatory or expected requirements supporting a policy"
      },
      {
        "id": "d",
        "text": "An informal suggestion only"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Standards translate policy into more specific, measurable requirements.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-020",
    "topicKey": "fundamentals",
    "question": "Why should security controls be reviewed periodically?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Reviews are only needed after a breach"
      },
      {
        "id": "b",
        "text": "Threats, technology, business requirements, and risk can change"
      },
      {
        "id": "c",
        "text": "Controls never change after deployment"
      },
      {
        "id": "d",
        "text": "Reviews automatically patch software"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Periodic review confirms that controls remain appropriate and effective as conditions change.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "fundamentals",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-021",
    "topicKey": "threats-risk",
    "question": "What is threat modeling used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Identifying likely threats, attack paths, and mitigations during system design"
      },
      {
        "id": "b",
        "text": "Creating employee schedules"
      },
      {
        "id": "c",
        "text": "Compressing databases"
      },
      {
        "id": "d",
        "text": "Replacing backups"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Threat modeling helps teams reason about how systems could be attacked and how risk can be reduced.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-022",
    "topicKey": "threats-risk",
    "question": "What is an exploit?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A security policy"
      },
      {
        "id": "b",
        "text": "A backup schedule"
      },
      {
        "id": "c",
        "text": "A user role"
      },
      {
        "id": "d",
        "text": "A method or code that takes advantage of a vulnerability"
      }
    ],
    "correctAnswer": "d",
    "explanation": "An exploit is a technique or code used to take advantage of a weakness.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-023",
    "topicKey": "threats-risk",
    "question": "What is a zero-day vulnerability?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A vulnerability found only in backups"
      },
      {
        "id": "b",
        "text": "A vulnerability that cannot be exploited"
      },
      {
        "id": "c",
        "text": "A vulnerability for which defenders have little or no advance remediation time"
      },
      {
        "id": "d",
        "text": "A vulnerability that has existed for exactly zero days"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Zero-day commonly refers to a newly disclosed or unknown vulnerability for which a patch or mitigation may not yet be available.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-024",
    "topicKey": "threats-risk",
    "question": "What is attack likelihood?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "The length of a password"
      },
      {
        "id": "b",
        "text": "An estimate of how probable a threat event is"
      },
      {
        "id": "c",
        "text": "The cost of a laptop"
      },
      {
        "id": "d",
        "text": "The number of backups"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Likelihood estimates how probable a threat event or successful attack may be.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-025",
    "topicKey": "threats-risk",
    "question": "What is impact in risk analysis?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "The potential consequence if a risk event occurs"
      },
      {
        "id": "b",
        "text": "The number of users online"
      },
      {
        "id": "c",
        "text": "The age of a server"
      },
      {
        "id": "d",
        "text": "The number of firewall rules"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Impact describes the potential harm to operations, finances, people, compliance, or reputation.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-026",
    "topicKey": "threats-risk",
    "question": "Which approach transfers some risk to another party?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Risk acceptance"
      },
      {
        "id": "b",
        "text": "Risk avoidance"
      },
      {
        "id": "c",
        "text": "Risk elimination"
      },
      {
        "id": "d",
        "text": "Risk transfer"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Risk transfer shifts some financial or operational consequences to another party, often through contracts or insurance.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-027",
    "topicKey": "threats-risk",
    "question": "What does risk acceptance mean?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Buying insurance for every risk"
      },
      {
        "id": "b",
        "text": "Blocking all network traffic"
      },
      {
        "id": "c",
        "text": "Choosing to tolerate a known risk within defined limits"
      },
      {
        "id": "d",
        "text": "Removing the vulnerable system immediately"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Risk acceptance is a deliberate decision to tolerate a risk based on its level and organizational criteria.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-028",
    "topicKey": "threats-risk",
    "question": "What is risk avoidance?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Increasing the risk intentionally"
      },
      {
        "id": "b",
        "text": "Changing an activity so the associated risk is no longer taken"
      },
      {
        "id": "c",
        "text": "Monitoring the risk without action"
      },
      {
        "id": "d",
        "text": "Sharing the risk with a vendor"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Risk avoidance changes or stops an activity so the associated risk is eliminated or no longer pursued.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-029",
    "topicKey": "threats-risk",
    "question": "What is residual risk?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Risk remaining after controls are applied"
      },
      {
        "id": "b",
        "text": "Risk before any controls exist"
      },
      {
        "id": "c",
        "text": "Only financial risk"
      },
      {
        "id": "d",
        "text": "A deleted risk record"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Residual risk is the remaining exposure after safeguards and mitigations are considered.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-030",
    "topicKey": "threats-risk",
    "question": "What is a threat actor?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A firewall configuration"
      },
      {
        "id": "b",
        "text": "A backup operator only"
      },
      {
        "id": "c",
        "text": "A vulnerability scanner"
      },
      {
        "id": "d",
        "text": "A person, group, or entity capable of carrying out a malicious action"
      }
    ],
    "correctAnswer": "d",
    "explanation": "A threat actor is an entity that may intentionally or unintentionally cause harm.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-031",
    "topicKey": "threats-risk",
    "question": "Which threat actor is typically motivated by financial gain?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Help-desk technician"
      },
      {
        "id": "b",
        "text": "System administrator"
      },
      {
        "id": "c",
        "text": "Cybercriminal"
      },
      {
        "id": "d",
        "text": "Security auditor"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Cybercriminal groups commonly pursue financial gain through fraud, extortion, theft, or other criminal activity.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-032",
    "topicKey": "threats-risk",
    "question": "What is insider risk?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Risk from weather only"
      },
      {
        "id": "b",
        "text": "Risk arising from people with authorized access misusing or mishandling that access"
      },
      {
        "id": "c",
        "text": "Risk from an unknown internet user only"
      },
      {
        "id": "d",
        "text": "Risk from hardware failure only"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Insiders may intentionally or accidentally misuse legitimate access.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-033",
    "topicKey": "threats-risk",
    "question": "What is a supply-chain attack?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "An attack that compromises a supplier, dependency, or service to reach a target"
      },
      {
        "id": "b",
        "text": "An attack against only shipping companies"
      },
      {
        "id": "c",
        "text": "A backup failure"
      },
      {
        "id": "d",
        "text": "A physical theft of office supplies"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Supply-chain attacks exploit trust relationships with vendors, software dependencies, services, or suppliers.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-034",
    "topicKey": "threats-risk",
    "question": "What is a watering-hole attack?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Sending a phishing email to every employee"
      },
      {
        "id": "b",
        "text": "Stealing a laptop from a parking lot"
      },
      {
        "id": "c",
        "text": "Guessing a password offline"
      },
      {
        "id": "d",
        "text": "Compromising a website likely to be visited by intended targets"
      }
    ],
    "correctAnswer": "d",
    "explanation": "A watering-hole attack compromises a site frequented by a target group and waits for victims to visit.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-035",
    "topicKey": "threats-risk",
    "question": "What is a denial-of-service attack intended to affect?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Data classification"
      },
      {
        "id": "b",
        "text": "Physical security only"
      },
      {
        "id": "c",
        "text": "Availability"
      },
      {
        "id": "d",
        "text": "Confidentiality only"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Denial-of-service attacks attempt to make a service or resource unavailable to intended users.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-036",
    "topicKey": "threats-risk",
    "question": "What is data exfiltration?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Backing up data internally"
      },
      {
        "id": "b",
        "text": "Unauthorized transfer of data out of an environment"
      },
      {
        "id": "c",
        "text": "Deleting temporary files"
      },
      {
        "id": "d",
        "text": "Encrypting a disk for protection"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Exfiltration is the unauthorized removal or transfer of information from an environment.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-037",
    "topicKey": "threats-risk",
    "question": "What is lateral movement?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Moving from one compromised system or account to additional systems or resources"
      },
      {
        "id": "b",
        "text": "Moving a server to a new rack"
      },
      {
        "id": "c",
        "text": "Changing a password"
      },
      {
        "id": "d",
        "text": "Updating antivirus software"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Attackers use lateral movement to expand access after gaining an initial foothold.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-038",
    "topicKey": "threats-risk",
    "question": "What is privilege escalation?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Reducing account privileges"
      },
      {
        "id": "b",
        "text": "Creating a backup"
      },
      {
        "id": "c",
        "text": "Encrypting a file"
      },
      {
        "id": "d",
        "text": "Gaining higher permissions than originally authorized"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Privilege escalation occurs when an attacker or process obtains greater privileges than intended.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-039",
    "topicKey": "threats-risk",
    "question": "Why prioritize vulnerabilities using risk rather than severity alone?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Severity is unrelated to vulnerabilities"
      },
      {
        "id": "b",
        "text": "Risk prioritization removes the need for patches"
      },
      {
        "id": "c",
        "text": "Risk also considers exposure, likelihood, asset value, and potential impact"
      },
      {
        "id": "d",
        "text": "Severity always includes business context"
      }
    ],
    "correctAnswer": "c",
    "explanation": "A severe vulnerability on an isolated low-value system may require different treatment than a moderate issue on a critical exposed system.",
    "difficulty": "hard",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "hard"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-040",
    "topicKey": "threats-risk",
    "question": "What is a compensating control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A type of malware"
      },
      {
        "id": "b",
        "text": "An alternative safeguard used when a preferred control cannot be implemented fully"
      },
      {
        "id": "c",
        "text": "A duplicate vulnerability"
      },
      {
        "id": "d",
        "text": "A backup of a policy"
      }
    ],
    "correctAnswer": "b",
    "explanation": "A compensating control provides an alternative way to reduce risk when the primary control is impractical or unavailable.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "threats-risk",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-041",
    "topicKey": "malware",
    "question": "What is malware?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Software designed to perform malicious or unauthorized actions"
      },
      {
        "id": "b",
        "text": "A normal operating-system update"
      },
      {
        "id": "c",
        "text": "A backup utility"
      },
      {
        "id": "d",
        "text": "A security policy"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Malware is software intentionally designed to disrupt, damage, spy on, steal, or otherwise abuse systems or data.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "malware",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-042",
    "topicKey": "malware",
    "question": "What is a virus?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A network firewall"
      },
      {
        "id": "b",
        "text": "A password manager"
      },
      {
        "id": "c",
        "text": "A hardware failure"
      },
      {
        "id": "d",
        "text": "Malicious code that typically attaches to another file or program and replicates when executed"
      }
    ],
    "correctAnswer": "d",
    "explanation": "A virus commonly relies on a host file or program and can replicate when the infected host is executed.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "malware",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-043",
    "topicKey": "malware",
    "question": "What is a worm?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A firewall rule"
      },
      {
        "id": "b",
        "text": "A backup image"
      },
      {
        "id": "c",
        "text": "Malware that can self-propagate across systems or networks"
      },
      {
        "id": "d",
        "text": "Malware that only affects one document"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Worms can spread automatically without requiring a user to manually copy an infected file.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "malware",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-044",
    "topicKey": "malware",
    "question": "What is a Trojan?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A backup strategy"
      },
      {
        "id": "b",
        "text": "Malware disguised as legitimate software or content"
      },
      {
        "id": "c",
        "text": "A network encryption protocol"
      },
      {
        "id": "d",
        "text": "A hardware token"
      }
    ],
    "correctAnswer": "b",
    "explanation": "A Trojan relies on deception to appear legitimate and persuade a user or process to execute it.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "malware",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-045",
    "topicKey": "malware",
    "question": "What is ransomware?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Malware that commonly encrypts or otherwise blocks access to data and demands payment"
      },
      {
        "id": "b",
        "text": "A vulnerability scanner"
      },
      {
        "id": "c",
        "text": "A password policy"
      },
      {
        "id": "d",
        "text": "A network monitoring tool"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Ransomware commonly denies access to data or systems and demands payment, though exact behavior varies.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "malware",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-046",
    "topicKey": "malware",
    "question": "What is spyware?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A backup server"
      },
      {
        "id": "b",
        "text": "A firewall"
      },
      {
        "id": "c",
        "text": "A software license"
      },
      {
        "id": "d",
        "text": "Malware intended to monitor or collect information without proper authorization"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Spyware is designed to observe activity or collect information without appropriate authorization.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "malware",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-047",
    "topicKey": "malware",
    "question": "What is a keylogger?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A password policy"
      },
      {
        "id": "b",
        "text": "A network switch"
      },
      {
        "id": "c",
        "text": "Software or hardware that records keystrokes"
      },
      {
        "id": "d",
        "text": "A key-management server"
      }
    ],
    "correctAnswer": "c",
    "explanation": "A keylogger captures keyboard input and can expose credentials or other sensitive information.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "malware",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-048",
    "topicKey": "malware",
    "question": "What is a rootkit?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A certificate authority"
      },
      {
        "id": "b",
        "text": "Malicious software designed to maintain privileged access and conceal its presence"
      },
      {
        "id": "c",
        "text": "A disk backup"
      },
      {
        "id": "d",
        "text": "A phishing filter"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Rootkits are associated with stealth and persistence, often at a highly privileged level.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "malware",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-049",
    "topicKey": "malware",
    "question": "What is a botnet?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A collection of compromised devices controlled as a group"
      },
      {
        "id": "b",
        "text": "A group of security analysts"
      },
      {
        "id": "c",
        "text": "A firewall cluster"
      },
      {
        "id": "d",
        "text": "A backup repository"
      }
    ],
    "correctAnswer": "a",
    "explanation": "A botnet consists of compromised devices that can be remotely coordinated by an operator.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "malware",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-050",
    "topicKey": "malware",
    "question": "What is command-and-control traffic?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Normal DNS configuration only"
      },
      {
        "id": "b",
        "text": "A backup synchronization job"
      },
      {
        "id": "c",
        "text": "A software update notification"
      },
      {
        "id": "d",
        "text": "Communication between compromised systems and an attacker-controlled infrastructure"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Command-and-control communication can allow malware to receive instructions or send information to an operator.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "malware",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-051",
    "topicKey": "malware",
    "question": "Why is application allowlisting useful against malware?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "It removes the need for patching"
      },
      {
        "id": "b",
        "text": "It encrypts all network traffic"
      },
      {
        "id": "c",
        "text": "It can restrict execution to approved software"
      },
      {
        "id": "d",
        "text": "It guarantees every file is safe"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Allowlisting can prevent unapproved executables from running, reducing some malware execution paths.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "malware",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-052",
    "topicKey": "malware",
    "question": "What is fileless malware commonly associated with?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Changing monitor brightness"
      },
      {
        "id": "b",
        "text": "Using legitimate system tools or memory rather than relying primarily on traditional files"
      },
      {
        "id": "c",
        "text": "Only infecting printers"
      },
      {
        "id": "d",
        "text": "Only encrypting backups"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Fileless techniques may abuse legitimate tools and memory-resident execution to reduce reliance on traditional malicious files.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "malware",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-053",
    "topicKey": "malware",
    "question": "Why are endpoint detection tools useful?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "They can identify suspicious activity on endpoints and support investigation"
      },
      {
        "id": "b",
        "text": "They prevent every attack automatically"
      },
      {
        "id": "c",
        "text": "They replace identity management"
      },
      {
        "id": "d",
        "text": "They eliminate the need for backups"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Endpoint detection can provide telemetry, detection, investigation, and response capabilities.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "malware",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-054",
    "topicKey": "malware",
    "question": "What is malware persistence?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Deleting malware immediately"
      },
      {
        "id": "b",
        "text": "Compressing a log file"
      },
      {
        "id": "c",
        "text": "Backing up a server"
      },
      {
        "id": "d",
        "text": "A technique that helps malicious code remain active or regain execution after reboot or interruption"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Persistence mechanisms allow malware to survive restarts or maintain access over time.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "malware",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-055",
    "topicKey": "malware",
    "question": "Why should suspicious attachments be handled cautiously?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Attachments cannot contain executable content"
      },
      {
        "id": "b",
        "text": "Opening attachments automatically patches systems"
      },
      {
        "id": "c",
        "text": "They can contain malicious content or exploit vulnerabilities"
      },
      {
        "id": "d",
        "text": "Attachments are always encrypted"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Malicious attachments can deliver malware or exploit vulnerable applications when opened or processed.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "malware",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-056",
    "topicKey": "social",
    "question": "What is phishing?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A backup process"
      },
      {
        "id": "b",
        "text": "A fraudulent attempt to obtain information or cause an unsafe action by impersonating a trusted source"
      },
      {
        "id": "c",
        "text": "A firewall configuration"
      },
      {
        "id": "d",
        "text": "A software patch"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Phishing uses deception, often through email or messages, to trick people into revealing information or taking unsafe actions.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "social",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-057",
    "topicKey": "social",
    "question": "What is spear phishing?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A targeted phishing attempt tailored to a specific person or organization"
      },
      {
        "id": "b",
        "text": "A phishing message sent randomly to everyone"
      },
      {
        "id": "c",
        "text": "A network scan"
      },
      {
        "id": "d",
        "text": "A physical security test"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Spear phishing is targeted and personalized rather than broadly distributed.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "social",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-058",
    "topicKey": "social",
    "question": "What is whaling?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Phishing against wireless networks"
      },
      {
        "id": "b",
        "text": "A malware cleanup technique"
      },
      {
        "id": "c",
        "text": "A backup method"
      },
      {
        "id": "d",
        "text": "Phishing that targets senior executives or other high-value individuals"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Whaling targets high-value individuals, often executives or decision-makers.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "social",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-059",
    "topicKey": "social",
    "question": "What is smishing?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Phishing through physical mail only"
      },
      {
        "id": "b",
        "text": "Phishing through a firewall"
      },
      {
        "id": "c",
        "text": "Phishing delivered through SMS or text messaging"
      },
      {
        "id": "d",
        "text": "Phishing through DNS only"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Smishing is a term for phishing delivered through text messages or SMS-like channels.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "social",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-060",
    "topicKey": "social",
    "question": "What is vishing?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A file-encryption method"
      },
      {
        "id": "b",
        "text": "Social engineering conducted through voice calls or voice messages"
      },
      {
        "id": "c",
        "text": "Phishing through video games"
      },
      {
        "id": "d",
        "text": "A vulnerability scan"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Vishing uses voice communication to impersonate trusted parties and manipulate victims.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "social",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-061",
    "topicKey": "social",
    "question": "What is pretexting?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Creating a fabricated scenario to persuade someone to disclose information or perform an action"
      },
      {
        "id": "b",
        "text": "Encrypting an email"
      },
      {
        "id": "c",
        "text": "Scanning a port"
      },
      {
        "id": "d",
        "text": "Backing up a database"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Pretexting creates a believable story or role to make a social-engineering request seem legitimate.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "social",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-062",
    "topicKey": "social",
    "question": "What is baiting?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Blocking suspicious links"
      },
      {
        "id": "b",
        "text": "Rotating passwords"
      },
      {
        "id": "c",
        "text": "Applying a security patch"
      },
      {
        "id": "d",
        "text": "Offering something enticing to persuade a target to take an unsafe action"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Baiting uses an appealing lure, such as a tempting file or physical media, to manipulate a target.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "social",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-063",
    "topicKey": "social",
    "question": "What is tailgating in physical security?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Monitoring a log file"
      },
      {
        "id": "b",
        "text": "Copying a backup"
      },
      {
        "id": "c",
        "text": "Following an authorized person into a restricted area without proper authorization"
      },
      {
        "id": "d",
        "text": "Following a network route"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Tailgating exploits physical access controls by following someone who has legitimate access.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "social",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-064",
    "topicKey": "social",
    "question": "Which is a strong warning sign in an unexpected email?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A message sent during business hours"
      },
      {
        "id": "b",
        "text": "Urgent pressure to click a link, open an attachment, or provide credentials"
      },
      {
        "id": "c",
        "text": "A familiar company logo alone"
      },
      {
        "id": "d",
        "text": "A normal business signature"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Urgency combined with requests for sensitive information or risky actions is a common phishing indicator.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "social",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-065",
    "topicKey": "social",
    "question": "What should a user do with a suspicious credential request?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Verify the request through a trusted channel before responding"
      },
      {
        "id": "b",
        "text": "Reply immediately with the password"
      },
      {
        "id": "c",
        "text": "Forward the password to a coworker"
      },
      {
        "id": "d",
        "text": "Disable antivirus software"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Independent verification helps prevent social-engineering attacks that impersonate trusted people or organizations.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "social",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-066",
    "topicKey": "social",
    "question": "Why is caller ID not sufficient proof of identity?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Caller ID is cryptographically guaranteed"
      },
      {
        "id": "b",
        "text": "Phone numbers cannot be manipulated"
      },
      {
        "id": "c",
        "text": "Caller ID verifies passwords"
      },
      {
        "id": "d",
        "text": "Caller ID can be spoofed"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Caller ID information can be manipulated, so sensitive requests should be independently verified.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "social",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-067",
    "topicKey": "social",
    "question": "What is business email compromise?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A firewall failure"
      },
      {
        "id": "b",
        "text": "A backup procedure"
      },
      {
        "id": "c",
        "text": "Fraud that abuses compromised or impersonated business email accounts to influence transactions or actions"
      },
      {
        "id": "d",
        "text": "A normal email outage"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Business email compromise commonly uses account compromise or impersonation to induce payments, disclosure, or other actions.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "social",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-068",
    "topicKey": "social",
    "question": "What is credential phishing designed to steal?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Only software licenses"
      },
      {
        "id": "b",
        "text": "Authentication information such as usernames, passwords, or session details"
      },
      {
        "id": "c",
        "text": "Only hardware"
      },
      {
        "id": "d",
        "text": "Only backups"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Credential phishing targets information that can be used to authenticate as the victim.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "social",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-069",
    "topicKey": "social",
    "question": "Why can oversharing on social media increase security risk?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Attackers may use public information to build convincing social-engineering pretexts"
      },
      {
        "id": "b",
        "text": "Social media automatically disables MFA"
      },
      {
        "id": "c",
        "text": "Public information is always encrypted"
      },
      {
        "id": "d",
        "text": "Social media prevents phishing"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Public personal and organizational information can help attackers craft believable targeted attacks.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "social",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-070",
    "topicKey": "social",
    "question": "What is an effective defense against social engineering?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Trusting urgent requests"
      },
      {
        "id": "b",
        "text": "Sharing passwords with managers"
      },
      {
        "id": "c",
        "text": "Disabling MFA"
      },
      {
        "id": "d",
        "text": "Security awareness combined with verification procedures and strong technical controls"
      }
    ],
    "correctAnswer": "d",
    "explanation": "People, process, and technical controls together reduce the chance that deception succeeds.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "social",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-071",
    "topicKey": "iam",
    "question": "What is authentication?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Encrypting a database"
      },
      {
        "id": "b",
        "text": "Logging out a user"
      },
      {
        "id": "c",
        "text": "Verifying the identity of a user or system"
      },
      {
        "id": "d",
        "text": "Determining what an authenticated user may do"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Authentication answers who or what an entity is.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "iam",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-072",
    "topicKey": "iam",
    "question": "What is authorization?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Encrypting network traffic"
      },
      {
        "id": "b",
        "text": "Determining what an authenticated identity is allowed to access or do"
      },
      {
        "id": "c",
        "text": "Verifying identity"
      },
      {
        "id": "d",
        "text": "Creating a password"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Authorization determines permissions after identity has been established.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "iam",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-073",
    "topicKey": "iam",
    "question": "What is accounting or auditing in AAA?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Recording and reviewing actions and resource usage"
      },
      {
        "id": "b",
        "text": "Changing passwords"
      },
      {
        "id": "c",
        "text": "Issuing certificates"
      },
      {
        "id": "d",
        "text": "Blocking malware"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Accounting and auditing provide records of activity for monitoring, investigation, and accountability.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "iam",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-074",
    "topicKey": "iam",
    "question": "Which is an example of something you know for authentication?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A security token"
      },
      {
        "id": "b",
        "text": "A fingerprint"
      },
      {
        "id": "c",
        "text": "A smart card"
      },
      {
        "id": "d",
        "text": "A password"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Passwords and PINs are knowledge factors.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "iam",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-075",
    "topicKey": "iam",
    "question": "Which is an example of something you have?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A fingerprint"
      },
      {
        "id": "b",
        "text": "A security question"
      },
      {
        "id": "c",
        "text": "A hardware security token"
      },
      {
        "id": "d",
        "text": "A password"
      }
    ],
    "correctAnswer": "c",
    "explanation": "A hardware token is a possession factor.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "iam",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-076",
    "topicKey": "iam",
    "question": "Which is an example of something you are?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A recovery code"
      },
      {
        "id": "b",
        "text": "A fingerprint"
      },
      {
        "id": "c",
        "text": "A password"
      },
      {
        "id": "d",
        "text": "A token"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Biometric characteristics such as fingerprints are inherence factors.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "iam",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-077",
    "topicKey": "iam",
    "question": "What is multifactor authentication?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Using two or more different authentication factor types"
      },
      {
        "id": "b",
        "text": "Using two passwords from the same system"
      },
      {
        "id": "c",
        "text": "Logging in twice"
      },
      {
        "id": "d",
        "text": "Using a longer username"
      }
    ],
    "correctAnswer": "a",
    "explanation": "MFA combines different factor categories, such as knowledge plus possession or inherence.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "iam",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-078",
    "topicKey": "iam",
    "question": "Why is MFA generally stronger than a password alone?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "MFA makes passwords unnecessary in every system"
      },
      {
        "id": "b",
        "text": "MFA encrypts all files"
      },
      {
        "id": "c",
        "text": "MFA guarantees zero breaches"
      },
      {
        "id": "d",
        "text": "An attacker must overcome more than one independent factor"
      }
    ],
    "correctAnswer": "d",
    "explanation": "MFA adds another barrier so possession or biometric compromise may be required in addition to password compromise.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "iam",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-079",
    "topicKey": "iam",
    "question": "What is single sign-on?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Sharing one account"
      },
      {
        "id": "b",
        "text": "Logging in only once per year"
      },
      {
        "id": "c",
        "text": "Using one authentication session to access multiple trusted applications"
      },
      {
        "id": "d",
        "text": "Using one password for everyone"
      }
    ],
    "correctAnswer": "c",
    "explanation": "SSO allows an authenticated identity to access multiple integrated services without separately authenticating to each one.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "iam",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-080",
    "topicKey": "iam",
    "question": "What is role-based access control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Using passwords as roles"
      },
      {
        "id": "b",
        "text": "Assigning permissions based on defined roles"
      },
      {
        "id": "c",
        "text": "Giving everyone administrator access"
      },
      {
        "id": "d",
        "text": "Assigning permissions only by device color"
      }
    ],
    "correctAnswer": "b",
    "explanation": "RBAC maps permissions to roles and assigns users to appropriate roles.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "iam",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-081",
    "topicKey": "iam",
    "question": "What is privileged access management intended to protect?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Accounts and sessions with elevated or administrative privileges"
      },
      {
        "id": "b",
        "text": "Public web pages only"
      },
      {
        "id": "c",
        "text": "Guest Wi-Fi passwords only"
      },
      {
        "id": "d",
        "text": "Printer toner"
      }
    ],
    "correctAnswer": "a",
    "explanation": "PAM controls and monitors high-impact privileged accounts and access.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "iam",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-082",
    "topicKey": "iam",
    "question": "What is account lockout intended to reduce?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Data corruption"
      },
      {
        "id": "b",
        "text": "Network latency"
      },
      {
        "id": "c",
        "text": "Backup failures"
      },
      {
        "id": "d",
        "text": "Repeated automated password-guessing attempts"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Lockout or throttling can limit repeated authentication attempts, though it should be designed to avoid denial-of-service abuse.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "iam",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-083",
    "topicKey": "iam",
    "question": "Why should dormant accounts be disabled?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "They encrypt passwords automatically"
      },
      {
        "id": "b",
        "text": "They increase storage capacity"
      },
      {
        "id": "c",
        "text": "They provide unnecessary access that can be abused"
      },
      {
        "id": "d",
        "text": "They improve monitor brightness"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Unused accounts expand the attack surface and can be exploited if credentials remain valid.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "iam",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-084",
    "topicKey": "iam",
    "question": "What is password spraying?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Changing passwords after login"
      },
      {
        "id": "b",
        "text": "Trying a small number of common passwords against many accounts"
      },
      {
        "id": "c",
        "text": "Trying every password against one account"
      },
      {
        "id": "d",
        "text": "Encrypting passwords"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Password spraying avoids rapid lockout on a single account by trying common passwords across many accounts.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "iam",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-085",
    "topicKey": "iam",
    "question": "What is credential stuffing?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Using previously stolen username-password pairs against other services"
      },
      {
        "id": "b",
        "text": "Generating random passwords"
      },
      {
        "id": "c",
        "text": "Encrypting a password database"
      },
      {
        "id": "d",
        "text": "Creating new user accounts"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Credential stuffing exploits password reuse across services using previously compromised credentials.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "iam",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-086",
    "topicKey": "iam",
    "question": "Why are unique passwords important?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Unique passwords make MFA unnecessary"
      },
      {
        "id": "b",
        "text": "They prevent every phishing attack"
      },
      {
        "id": "c",
        "text": "They eliminate account compromise"
      },
      {
        "id": "d",
        "text": "A breach of one service should not expose access to other services"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Unique passwords limit the impact of credential reuse when another service is compromised.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "iam",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-087",
    "topicKey": "iam",
    "question": "What is just-in-time privileged access?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Disabling audit logs"
      },
      {
        "id": "b",
        "text": "Using shared passwords"
      },
      {
        "id": "c",
        "text": "Granting elevated access only when needed and for a limited period"
      },
      {
        "id": "d",
        "text": "Giving permanent administrator access"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Just-in-time access reduces the duration and exposure of privileged permissions.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "iam",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-088",
    "topicKey": "iam",
    "question": "What is identity proofing?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Installing antivirus"
      },
      {
        "id": "b",
        "text": "Establishing confidence that an identity belongs to the claimed person"
      },
      {
        "id": "c",
        "text": "Assigning firewall rules"
      },
      {
        "id": "d",
        "text": "Encrypting a disk"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Identity proofing establishes confidence in a person's claimed identity before or during account issuance.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "iam",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-089",
    "topicKey": "iam",
    "question": "Why should service accounts be tightly controlled?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "They may have persistent non-human access and can be highly privileged"
      },
      {
        "id": "b",
        "text": "They are always temporary"
      },
      {
        "id": "c",
        "text": "They cannot authenticate"
      },
      {
        "id": "d",
        "text": "They are only used for backups"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Service accounts can provide persistent access and may have powerful permissions, making governance important.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "iam",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-090",
    "topicKey": "iam",
    "question": "What is access recertification?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Resetting passwords every hour"
      },
      {
        "id": "b",
        "text": "Scanning for malware"
      },
      {
        "id": "c",
        "text": "Creating a new firewall"
      },
      {
        "id": "d",
        "text": "Periodic review confirming that users still need assigned access"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Access recertification verifies that permissions remain appropriate for current duties.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "iam",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-091",
    "topicKey": "network",
    "question": "What is a firewall primarily used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Managing employee payroll"
      },
      {
        "id": "b",
        "text": "Creating user passwords"
      },
      {
        "id": "c",
        "text": "Controlling network traffic according to security rules"
      },
      {
        "id": "d",
        "text": "Encrypting every file"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Firewalls enforce traffic-control rules between network zones or interfaces.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-092",
    "topicKey": "network",
    "question": "What does an intrusion detection system do?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Backs up databases"
      },
      {
        "id": "b",
        "text": "Monitors activity and alerts on suspected malicious or policy-violating behavior"
      },
      {
        "id": "c",
        "text": "Automatically repairs every vulnerability"
      },
      {
        "id": "d",
        "text": "Creates user accounts"
      }
    ],
    "correctAnswer": "b",
    "explanation": "IDS technology focuses on detecting and alerting on suspicious activity.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-093",
    "topicKey": "network",
    "question": "What does an intrusion prevention system add?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "It can actively block or prevent detected malicious traffic"
      },
      {
        "id": "b",
        "text": "It only records usernames"
      },
      {
        "id": "c",
        "text": "It replaces encryption"
      },
      {
        "id": "d",
        "text": "It only manages backups"
      }
    ],
    "correctAnswer": "a",
    "explanation": "IPS technology can take preventive action on detected malicious traffic.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-094",
    "topicKey": "network",
    "question": "What is network segmentation?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Increasing cable length"
      },
      {
        "id": "b",
        "text": "Combining all networks into one"
      },
      {
        "id": "c",
        "text": "Disabling routing"
      },
      {
        "id": "d",
        "text": "Dividing a network into controlled zones to limit access and movement"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Segmentation reduces unnecessary connectivity and can limit lateral movement.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-095",
    "topicKey": "network",
    "question": "What is a DMZ in network security?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "An encrypted backup"
      },
      {
        "id": "b",
        "text": "A wireless authentication method"
      },
      {
        "id": "c",
        "text": "A controlled network zone for services that need exposure while being separated from internal networks"
      },
      {
        "id": "d",
        "text": "A password database"
      }
    ],
    "correctAnswer": "c",
    "explanation": "A DMZ can host public-facing services while providing a boundary between those services and internal systems.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-096",
    "topicKey": "network",
    "question": "Why is DNS security important?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "DNS prevents every phishing attack"
      },
      {
        "id": "b",
        "text": "DNS influences how systems locate network services and can be abused for redirection or tunneling"
      },
      {
        "id": "c",
        "text": "DNS only controls screen resolution"
      },
      {
        "id": "d",
        "text": "DNS encrypts all files"
      }
    ],
    "correctAnswer": "b",
    "explanation": "DNS manipulation can redirect users or support command-and-control and data-exfiltration techniques.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-097",
    "topicKey": "network",
    "question": "What is a VPN primarily designed to provide?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "An encrypted or authenticated tunnel over an untrusted network"
      },
      {
        "id": "b",
        "text": "A replacement for endpoint security"
      },
      {
        "id": "c",
        "text": "A physical firewall"
      },
      {
        "id": "d",
        "text": "A malware scanner"
      }
    ],
    "correctAnswer": "a",
    "explanation": "VPNs can protect traffic across untrusted networks by establishing an authenticated and encrypted tunnel.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-098",
    "topicKey": "network",
    "question": "What is TLS commonly used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Storing passwords in plain text"
      },
      {
        "id": "b",
        "text": "Scanning disks for malware"
      },
      {
        "id": "c",
        "text": "Managing backups"
      },
      {
        "id": "d",
        "text": "Protecting data in transit between applications or services"
      }
    ],
    "correctAnswer": "d",
    "explanation": "TLS provides encryption and authentication for network communications such as HTTPS.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-099",
    "topicKey": "network",
    "question": "What is HTTPS?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A firewall protocol"
      },
      {
        "id": "b",
        "text": "A backup format"
      },
      {
        "id": "c",
        "text": "HTTP carried over a secure TLS connection"
      },
      {
        "id": "d",
        "text": "A password hashing algorithm"
      }
    ],
    "correctAnswer": "c",
    "explanation": "HTTPS uses HTTP over TLS to protect web communications in transit.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-100",
    "topicKey": "network",
    "question": "What is a man-in-the-middle attack?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A password rotation process"
      },
      {
        "id": "b",
        "text": "An attacker intercepts or manipulates communication between parties"
      },
      {
        "id": "c",
        "text": "An attack that only deletes backups"
      },
      {
        "id": "d",
        "text": "A physical lock bypass"
      }
    ],
    "correctAnswer": "b",
    "explanation": "A MITM attack places the attacker between communicating parties to observe or alter traffic.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-101",
    "topicKey": "network",
    "question": "Why are certificate validation checks important in TLS?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "They help establish that the server is the intended trusted endpoint"
      },
      {
        "id": "b",
        "text": "They compress web pages"
      },
      {
        "id": "c",
        "text": "They replace passwords"
      },
      {
        "id": "d",
        "text": "They disable encryption"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Certificate validation helps prevent attackers from impersonating trusted endpoints.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-102",
    "topicKey": "network",
    "question": "What is a port scan?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A disk encryption method"
      },
      {
        "id": "b",
        "text": "A password reset"
      },
      {
        "id": "c",
        "text": "A backup verification"
      },
      {
        "id": "d",
        "text": "A technique for identifying reachable network ports and services"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Port scanning can reveal which network services may be reachable and exposed.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-103",
    "topicKey": "network",
    "question": "What is zero trust networking based on?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Disabling identity controls"
      },
      {
        "id": "b",
        "text": "Allowing permanent administrator access"
      },
      {
        "id": "c",
        "text": "Continuously verifying access rather than automatically trusting network location"
      },
      {
        "id": "d",
        "text": "Trusting all internal traffic"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Zero trust assumes no implicit trust and evaluates identity, device, context, and policy before access.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-104",
    "topicKey": "network",
    "question": "Why should unnecessary network services be disabled?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "They guarantee availability"
      },
      {
        "id": "b",
        "text": "They create additional attack surface"
      },
      {
        "id": "c",
        "text": "They increase encryption strength"
      },
      {
        "id": "d",
        "text": "They improve password complexity"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Unused services can expose additional vulnerabilities and entry points.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-105",
    "topicKey": "network",
    "question": "What is an egress filter?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A control that restricts outbound network traffic"
      },
      {
        "id": "b",
        "text": "A control that only blocks inbound traffic"
      },
      {
        "id": "c",
        "text": "A password policy"
      },
      {
        "id": "d",
        "text": "A disk scanner"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Egress filtering can limit unauthorized outbound connections and reduce exfiltration or command-and-control paths.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-106",
    "topicKey": "network",
    "question": "What is NAC commonly used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Encrypting backups"
      },
      {
        "id": "b",
        "text": "Managing passwords"
      },
      {
        "id": "c",
        "text": "Scanning source code"
      },
      {
        "id": "d",
        "text": "Controlling network access based on device or user security conditions"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Network Access Control can enforce admission policies based on identity, device posture, or other conditions.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-107",
    "topicKey": "network",
    "question": "Why use secure management protocols such as SSH instead of Telnet?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "SSH requires no authentication"
      },
      {
        "id": "b",
        "text": "Telnet is newer than SSH"
      },
      {
        "id": "c",
        "text": "SSH provides encrypted and authenticated remote administration"
      },
      {
        "id": "d",
        "text": "Telnet encrypts more strongly"
      }
    ],
    "correctAnswer": "c",
    "explanation": "SSH protects remote administration traffic; Telnet sends communications without comparable built-in protection.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-108",
    "topicKey": "network",
    "question": "What is a wireless evil twin?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A secure certificate"
      },
      {
        "id": "b",
        "text": "A rogue access point that impersonates a legitimate wireless network"
      },
      {
        "id": "c",
        "text": "A duplicate firewall rule"
      },
      {
        "id": "d",
        "text": "A backup server"
      }
    ],
    "correctAnswer": "b",
    "explanation": "An evil twin attempts to trick users into connecting to an attacker-controlled wireless network.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-109",
    "topicKey": "network",
    "question": "What is network traffic analysis useful for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Identifying unusual communication patterns and potential security events"
      },
      {
        "id": "b",
        "text": "Replacing all endpoint controls"
      },
      {
        "id": "c",
        "text": "Creating user passwords"
      },
      {
        "id": "d",
        "text": "Deleting logs"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Traffic analysis can reveal anomalies, suspicious connections, and possible command-and-control or exfiltration activity.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-110",
    "topicKey": "network",
    "question": "Why is internal network traffic not automatically trusted in zero trust?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Internal networks cannot carry data"
      },
      {
        "id": "b",
        "text": "Zero trust disables networking"
      },
      {
        "id": "c",
        "text": "Internal traffic is always encrypted"
      },
      {
        "id": "d",
        "text": "A compromised internal device or account may still be malicious"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Zero trust treats network location as insufficient proof of trust because internal systems and identities can be compromised.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-111",
    "topicKey": "network",
    "question": "What is network segmentation especially useful for during a compromise?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Removing authentication between zones"
      },
      {
        "id": "b",
        "text": "Making every host directly reachable"
      },
      {
        "id": "c",
        "text": "Limiting which systems an attacker can reach"
      },
      {
        "id": "d",
        "text": "Increasing the number of public services"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Segmentation can constrain an attacker's reachable paths and reduce lateral movement.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-112",
    "topicKey": "network",
    "question": "What is a proxy server in a security context?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A biometric sensor"
      },
      {
        "id": "b",
        "text": "An intermediary that handles requests between clients and destination services"
      },
      {
        "id": "c",
        "text": "A password hashing function"
      },
      {
        "id": "d",
        "text": "A backup tape"
      }
    ],
    "correctAnswer": "b",
    "explanation": "A proxy can mediate, inspect, filter, or log traffic between clients and external services.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-113",
    "topicKey": "network",
    "question": "What is a network access control list commonly used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Allowing or denying traffic based on defined network attributes"
      },
      {
        "id": "b",
        "text": "Managing employee benefits"
      },
      {
        "id": "c",
        "text": "Encrypting files"
      },
      {
        "id": "d",
        "text": "Creating certificates"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Network ACLs can enforce traffic rules using attributes such as addresses, ports, and protocols.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "network",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-114",
    "topicKey": "network",
    "question": "Why should network devices have management interfaces protected?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Management interfaces cannot be attacked"
      },
      {
        "id": "b",
        "text": "Protection slows attacks automatically"
      },
      {
        "id": "c",
        "text": "They only affect printing"
      },
      {
        "id": "d",
        "text": "Compromise of a network device can provide broad control over communications"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Network-device compromise can enable interception, disruption, rerouting, or further access.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "network",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-115",
    "topicKey": "network",
    "question": "What is microsegmentation?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Removing authentication"
      },
      {
        "id": "b",
        "text": "Replacing endpoint protection"
      },
      {
        "id": "c",
        "text": "Applying fine-grained security boundaries between workloads or resources"
      },
      {
        "id": "d",
        "text": "Combining every system into one network"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Microsegmentation creates granular boundaries to restrict unnecessary communication between workloads.",
    "difficulty": "hard",
    "tags": [
      "cybersecurity",
      "network",
      "hard"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-116",
    "topicKey": "crypto",
    "question": "What is encryption?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Creating a user account"
      },
      {
        "id": "b",
        "text": "Transforming data so unauthorized parties cannot readily read it"
      },
      {
        "id": "c",
        "text": "Deleting data permanently"
      },
      {
        "id": "d",
        "text": "Compressing data without changing its meaning"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Encryption uses cryptographic techniques to protect confidentiality of data.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "crypto",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-117",
    "topicKey": "crypto",
    "question": "What is decryption?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Transforming encrypted data back into usable plaintext with the appropriate key"
      },
      {
        "id": "b",
        "text": "Deleting a ciphertext"
      },
      {
        "id": "c",
        "text": "Hashing a password"
      },
      {
        "id": "d",
        "text": "Creating a digital signature"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Decryption reverses encryption when the required key and algorithm conditions are satisfied.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "crypto",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-118",
    "topicKey": "crypto",
    "question": "What is hashing?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Two-way encryption with a public key"
      },
      {
        "id": "b",
        "text": "A network routing method"
      },
      {
        "id": "c",
        "text": "A backup process"
      },
      {
        "id": "d",
        "text": "A one-way transformation that produces a fixed-length digest"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Cryptographic hashes produce digests designed for integrity checks and other security uses.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "crypto",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-119",
    "topicKey": "crypto",
    "question": "Why are passwords commonly stored as salted hashes rather than plaintext?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Plaintext is more secure"
      },
      {
        "id": "b",
        "text": "Hashing makes passwords unnecessary"
      },
      {
        "id": "c",
        "text": "A compromise of the password database does not directly reveal the original passwords"
      },
      {
        "id": "d",
        "text": "Salted hashes allow passwords to be decrypted"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Salted password hashing makes offline cracking harder and prevents direct disclosure of stored plaintext passwords.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "crypto",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-120",
    "topicKey": "crypto",
    "question": "What is a salt in password hashing?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A network address"
      },
      {
        "id": "b",
        "text": "A unique random value combined with a password before hashing"
      },
      {
        "id": "c",
        "text": "A secret encryption key shared by everyone"
      },
      {
        "id": "d",
        "text": "A backup password"
      }
    ],
    "correctAnswer": "b",
    "explanation": "A unique salt prevents identical passwords from producing identical stored hashes and reduces the value of precomputed tables.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "crypto",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-121",
    "topicKey": "crypto",
    "question": "What is symmetric encryption?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Using the same secret key for encryption and decryption"
      },
      {
        "id": "b",
        "text": "Using only a public key"
      },
      {
        "id": "c",
        "text": "Using no key"
      },
      {
        "id": "d",
        "text": "Using a password and fingerprint as keys"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Symmetric cryptography uses a shared secret key for both encryption and decryption.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "crypto",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-122",
    "topicKey": "crypto",
    "question": "What is asymmetric cryptography?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Using one shared password only"
      },
      {
        "id": "b",
        "text": "Using no keys"
      },
      {
        "id": "c",
        "text": "Using two unrelated passwords"
      },
      {
        "id": "d",
        "text": "Using a mathematically related public and private key pair"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Asymmetric cryptography uses public/private key pairs for functions such as encryption, signatures, and key exchange.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "crypto",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-123",
    "topicKey": "crypto",
    "question": "Which key is normally kept secret in public-key cryptography?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "The certificate serial number"
      },
      {
        "id": "b",
        "text": "The algorithm name"
      },
      {
        "id": "c",
        "text": "The private key"
      },
      {
        "id": "d",
        "text": "The public key"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Private keys must be protected because possession can enable signing or decryption operations.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "crypto",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-124",
    "topicKey": "crypto",
    "question": "What is a digital signature primarily used to provide?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Anonymity"
      },
      {
        "id": "b",
        "text": "Integrity, authenticity, and support for nonrepudiation"
      },
      {
        "id": "c",
        "text": "Compression"
      },
      {
        "id": "d",
        "text": "Availability"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Digital signatures use private keys to support authenticity and integrity verification and can contribute to nonrepudiation.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "crypto",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-125",
    "topicKey": "crypto",
    "question": "What is a digital certificate used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Binding an identity to a public key through a trusted certificate authority"
      },
      {
        "id": "b",
        "text": "Storing a user's password"
      },
      {
        "id": "c",
        "text": "Encrypting every file on a disk"
      },
      {
        "id": "d",
        "text": "Replacing MFA"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Certificates help establish trust in public keys by associating them with identities and being signed by a trusted authority.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "crypto",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-126",
    "topicKey": "crypto",
    "question": "What does PKI stand for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Private Key Internet"
      },
      {
        "id": "b",
        "text": "Password Key Integration"
      },
      {
        "id": "c",
        "text": "Protected Kernel Interface"
      },
      {
        "id": "d",
        "text": "Public Key Infrastructure"
      }
    ],
    "correctAnswer": "d",
    "explanation": "PKI is the framework of technologies, policies, and processes used to manage public-key certificates and trust.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "crypto",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-127",
    "topicKey": "crypto",
    "question": "What is certificate revocation used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Creating passwords"
      },
      {
        "id": "b",
        "text": "Encrypting backups"
      },
      {
        "id": "c",
        "text": "Indicating that a certificate should no longer be trusted before its normal expiration"
      },
      {
        "id": "d",
        "text": "Extending certificate validity"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Revocation allows a certificate authority or relying party to treat a certificate as no longer trustworthy.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "crypto",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-128",
    "topicKey": "crypto",
    "question": "What is a cryptographic key?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A user role"
      },
      {
        "id": "b",
        "text": "A value used by a cryptographic algorithm to perform an operation"
      },
      {
        "id": "c",
        "text": "A password policy"
      },
      {
        "id": "d",
        "text": "A network port"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Keys control cryptographic operations such as encryption, decryption, signing, and verification.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "crypto",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-129",
    "topicKey": "crypto",
    "question": "Why is key management important?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Weak storage, distribution, rotation, or destruction of keys can undermine strong cryptography"
      },
      {
        "id": "b",
        "text": "Keys never expire"
      },
      {
        "id": "c",
        "text": "Key management only affects performance"
      },
      {
        "id": "d",
        "text": "Keys do not need protection"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Strong algorithms cannot compensate for poorly protected or improperly managed keys.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "crypto",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-130",
    "topicKey": "crypto",
    "question": "What is authenticated encryption designed to provide?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Compression only"
      },
      {
        "id": "b",
        "text": "Password recovery"
      },
      {
        "id": "c",
        "text": "Anonymity only"
      },
      {
        "id": "d",
        "text": "Confidentiality and integrity/authenticity for protected data"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Authenticated encryption protects plaintext confidentiality while also detecting unauthorized modification.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "crypto",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-131",
    "topicKey": "crypto",
    "question": "What is a nonce?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A certificate authority"
      },
      {
        "id": "b",
        "text": "A firewall rule"
      },
      {
        "id": "c",
        "text": "A value intended to be used once in a cryptographic operation or protocol context"
      },
      {
        "id": "d",
        "text": "A password hash"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Nonces help prevent certain replay or reuse problems when used correctly by a cryptographic protocol.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "crypto",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-132",
    "topicKey": "crypto",
    "question": "What is a replay attack?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Deleting a session"
      },
      {
        "id": "b",
        "text": "Reusing a captured valid message or authentication exchange to perform an unauthorized action"
      },
      {
        "id": "c",
        "text": "Cracking a hash with a GPU"
      },
      {
        "id": "d",
        "text": "Encrypting a database"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Replay attacks reuse previously valid communications unless protocols include protections such as nonces, timestamps, or sequence numbers.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "crypto",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-133",
    "topicKey": "crypto",
    "question": "Why should cryptographic algorithms be selected from well-established standards?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "They have received broader public analysis and review"
      },
      {
        "id": "b",
        "text": "Proprietary algorithms are always stronger"
      },
      {
        "id": "c",
        "text": "Standards eliminate key management"
      },
      {
        "id": "d",
        "text": "Standards guarantee perfect security"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Well-established cryptographic standards benefit from extensive analysis and interoperability.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "crypto",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-134",
    "topicKey": "crypto",
    "question": "What is key rotation?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Changing a password only after a breach"
      },
      {
        "id": "b",
        "text": "Deleting all encryption"
      },
      {
        "id": "c",
        "text": "Creating a new certificate every minute"
      },
      {
        "id": "d",
        "text": "Replacing cryptographic keys according to defined security and lifecycle requirements"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Key rotation limits exposure and supports cryptographic lifecycle management.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "crypto",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-135",
    "topicKey": "crypto",
    "question": "What is forward secrecy intended to protect?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Backups from deletion"
      },
      {
        "id": "b",
        "text": "Physical offices from theft"
      },
      {
        "id": "c",
        "text": "Past session data if a long-term private key is later compromised"
      },
      {
        "id": "d",
        "text": "Future passwords from phishing"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Forward secrecy helps prevent later compromise of a long-term key from exposing previously established session keys.",
    "difficulty": "hard",
    "tags": [
      "cybersecurity",
      "crypto",
      "hard"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-136",
    "topicKey": "endpoint",
    "question": "Why is patch management important?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "It guarantees no phishing"
      },
      {
        "id": "b",
        "text": "It reduces exposure to known vulnerabilities"
      },
      {
        "id": "c",
        "text": "It prevents all zero-days"
      },
      {
        "id": "d",
        "text": "It replaces backups"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Timely patching reduces exposure to vulnerabilities for which fixes are available.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "endpoint",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-137",
    "topicKey": "endpoint",
    "question": "What is endpoint security?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Protecting user devices and systems such as laptops, desktops, and servers"
      },
      {
        "id": "b",
        "text": "Only protecting routers"
      },
      {
        "id": "c",
        "text": "Only encrypting email"
      },
      {
        "id": "d",
        "text": "Only managing cloud billing"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Endpoint security addresses threats and controls on devices that run applications and process data.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "endpoint",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-138",
    "topicKey": "endpoint",
    "question": "What is secure configuration?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Leaving default passwords unchanged"
      },
      {
        "id": "b",
        "text": "Enabling every service"
      },
      {
        "id": "c",
        "text": "Disabling logging"
      },
      {
        "id": "d",
        "text": "Applying approved security settings that reduce unnecessary exposure"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Secure configuration reduces attack surface and enforces organizational security requirements.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "endpoint",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-139",
    "topicKey": "endpoint",
    "question": "Why change default credentials on devices?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "It increases CPU speed"
      },
      {
        "id": "b",
        "text": "It encrypts all network traffic"
      },
      {
        "id": "c",
        "text": "Attackers may know vendor-default credentials"
      },
      {
        "id": "d",
        "text": "Default credentials are always unique"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Known default credentials are a common and avoidable entry point.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "endpoint",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-140",
    "topicKey": "endpoint",
    "question": "What is disk encryption intended to protect?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Network routing"
      },
      {
        "id": "b",
        "text": "Data stored on a device from unauthorized access if the storage is obtained"
      },
      {
        "id": "c",
        "text": "Data while traveling over a network"
      },
      {
        "id": "d",
        "text": "Users from phishing"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Disk encryption protects data at rest, particularly if a device or storage medium is lost or stolen.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "endpoint",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-141",
    "topicKey": "endpoint",
    "question": "What is application sandboxing?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Running code in a restricted environment to limit its access"
      },
      {
        "id": "b",
        "text": "Giving applications administrator rights"
      },
      {
        "id": "c",
        "text": "Disabling application updates"
      },
      {
        "id": "d",
        "text": "Sharing application credentials"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Sandboxing limits what potentially untrusted code can access or modify.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "endpoint",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-142",
    "topicKey": "endpoint",
    "question": "Why use application allowlisting?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To allow every downloaded program"
      },
      {
        "id": "b",
        "text": "To disable endpoint logging"
      },
      {
        "id": "c",
        "text": "To bypass authentication"
      },
      {
        "id": "d",
        "text": "To restrict execution to approved software or code"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Allowlisting can reduce the ability of unauthorized software to execute.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "endpoint",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-143",
    "topicKey": "endpoint",
    "question": "What is a secure boot process intended to help verify?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "That passwords are unique"
      },
      {
        "id": "b",
        "text": "That backups are current"
      },
      {
        "id": "c",
        "text": "That trusted boot components are used before the operating system starts"
      },
      {
        "id": "d",
        "text": "That every website is safe"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Secure boot can establish a chain of trust for boot components.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "endpoint",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-144",
    "topicKey": "endpoint",
    "question": "Why should endpoint logs be collected centrally?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "It disables endpoint monitoring"
      },
      {
        "id": "b",
        "text": "Central collection improves visibility and can preserve evidence if the endpoint is compromised"
      },
      {
        "id": "c",
        "text": "It makes malware impossible"
      },
      {
        "id": "d",
        "text": "It eliminates authentication"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Centralized logging can improve correlation, retention, and investigation resilience.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "endpoint",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-145",
    "topicKey": "endpoint",
    "question": "What is a host-based firewall?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A firewall running on an individual endpoint"
      },
      {
        "id": "b",
        "text": "A firewall only in a data center"
      },
      {
        "id": "c",
        "text": "A password manager"
      },
      {
        "id": "d",
        "text": "A certificate server"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Host firewalls enforce traffic rules at the endpoint itself.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "endpoint",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-146",
    "topicKey": "endpoint",
    "question": "What is vulnerability scanning?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A guarantee that no vulnerability exists"
      },
      {
        "id": "b",
        "text": "A phishing simulation only"
      },
      {
        "id": "c",
        "text": "A backup process"
      },
      {
        "id": "d",
        "text": "Automated checking for known weaknesses or misconfigurations"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Vulnerability scanners identify potential known weaknesses, though findings require validation and prioritization.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "endpoint",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-147",
    "topicKey": "endpoint",
    "question": "Why should vulnerability scans be authenticated when appropriate?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Authenticated scans cannot find vulnerabilities"
      },
      {
        "id": "b",
        "text": "Authentication disables patching"
      },
      {
        "id": "c",
        "text": "Authenticated scans can inspect deeper configuration and software details"
      },
      {
        "id": "d",
        "text": "Authentication makes scans anonymous"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Authenticated scanning can provide more complete visibility into configuration and installed software.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "endpoint",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-148",
    "topicKey": "endpoint",
    "question": "What is configuration drift?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A malware signature"
      },
      {
        "id": "b",
        "text": "A system gradually deviating from its approved configuration baseline"
      },
      {
        "id": "c",
        "text": "A network outage"
      },
      {
        "id": "d",
        "text": "A password reset"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Configuration drift can introduce unexpected security weaknesses and inconsistency over time.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "endpoint",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-149",
    "topicKey": "endpoint",
    "question": "What is endpoint isolation used for during an incident?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Restricting a suspected device's network connectivity to contain activity"
      },
      {
        "id": "b",
        "text": "Deleting the device immediately"
      },
      {
        "id": "c",
        "text": "Changing every password automatically"
      },
      {
        "id": "d",
        "text": "Publishing the incident publicly"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Isolation can contain a compromised endpoint while preserving it for investigation.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "endpoint",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-150",
    "topicKey": "endpoint",
    "question": "Why preserve forensic evidence before changing a compromised endpoint?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Evidence is never useful"
      },
      {
        "id": "b",
        "text": "Preservation automatically removes malware"
      },
      {
        "id": "c",
        "text": "Forensics replaces incident response"
      },
      {
        "id": "d",
        "text": "Changes can overwrite information needed to understand what happened"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Investigators may need volatile and persistent evidence to reconstruct events and determine scope.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "endpoint",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-151",
    "topicKey": "cloud-app",
    "question": "What is the shared responsibility model in cloud security?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "The customer is responsible for the physical data center"
      },
      {
        "id": "b",
        "text": "No one has security responsibility"
      },
      {
        "id": "c",
        "text": "The provider and customer each have defined security responsibilities"
      },
      {
        "id": "d",
        "text": "The provider is responsible for everything"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Cloud security responsibilities are divided between provider and customer according to the service model and provider terms.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-152",
    "topicKey": "cloud-app",
    "question": "Why should cloud storage permissions be reviewed?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Cloud providers cannot enforce permissions"
      },
      {
        "id": "b",
        "text": "Misconfigured permissions can expose sensitive data"
      },
      {
        "id": "c",
        "text": "Cloud storage is always private"
      },
      {
        "id": "d",
        "text": "Permissions cannot be changed"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Reviewing permissions reduces unnecessary exposure and public or cross-account access.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-153",
    "topicKey": "cloud-app",
    "question": "What is an infrastructure-as-code security benefit?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Security configuration can be defined, reviewed, and consistently deployed as code"
      },
      {
        "id": "b",
        "text": "It eliminates the need for testing"
      },
      {
        "id": "c",
        "text": "It prevents all cloud breaches"
      },
      {
        "id": "d",
        "text": "It removes access controls"
      }
    ],
    "correctAnswer": "a",
    "explanation": "IaC can make infrastructure changes repeatable, reviewable, and subject to automated security checks.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-154",
    "topicKey": "cloud-app",
    "question": "What is a cloud security group commonly used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Managing employee payroll"
      },
      {
        "id": "b",
        "text": "Hashing passwords"
      },
      {
        "id": "c",
        "text": "Creating backups only"
      },
      {
        "id": "d",
        "text": "Controlling network access to cloud resources"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Security groups commonly define inbound and outbound traffic rules for cloud resources.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-155",
    "topicKey": "cloud-app",
    "question": "Why should cloud API credentials be protected?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Cloud credentials are not sensitive"
      },
      {
        "id": "b",
        "text": "API keys are only documentation"
      },
      {
        "id": "c",
        "text": "Compromised credentials can allow unauthorized programmatic actions"
      },
      {
        "id": "d",
        "text": "APIs cannot modify cloud resources"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Cloud credentials can provide powerful automated access and therefore require strong protection and lifecycle management.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-156",
    "topicKey": "cloud-app",
    "question": "What is secrets management?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Creating public usernames"
      },
      {
        "id": "b",
        "text": "Securely storing, accessing, rotating, and auditing sensitive credentials or keys"
      },
      {
        "id": "c",
        "text": "Publishing passwords in source code"
      },
      {
        "id": "d",
        "text": "Deleting all certificates"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Secrets management reduces exposure of passwords, API keys, tokens, and other sensitive values.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-157",
    "topicKey": "cloud-app",
    "question": "Why should secrets not be committed to source control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Repository exposure can disclose credentials and make them difficult to contain"
      },
      {
        "id": "b",
        "text": "Source control encrypts every secret automatically"
      },
      {
        "id": "c",
        "text": "Secrets cannot be copied from repositories"
      },
      {
        "id": "d",
        "text": "It improves application performance"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Secrets in source control can be copied, cached, forked, or retained in history even after removal.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-158",
    "topicKey": "cloud-app",
    "question": "What is secure software development?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Testing only after a breach"
      },
      {
        "id": "b",
        "text": "Avoiding code review"
      },
      {
        "id": "c",
        "text": "Disabling dependency updates"
      },
      {
        "id": "d",
        "text": "Integrating security requirements, testing, and risk management throughout the development lifecycle"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Secure development addresses security throughout planning, coding, testing, deployment, and maintenance.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-159",
    "topicKey": "cloud-app",
    "question": "What is input validation?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Creating user roles"
      },
      {
        "id": "b",
        "text": "Disabling logging"
      },
      {
        "id": "c",
        "text": "Checking input against expected rules before processing it"
      },
      {
        "id": "d",
        "text": "Encrypting a database backup"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Input validation helps prevent malformed or unexpected data from reaching unsafe application logic.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-160",
    "topicKey": "cloud-app",
    "question": "What is SQL injection?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A backup failure"
      },
      {
        "id": "b",
        "text": "Manipulating application input to alter a database query"
      },
      {
        "id": "c",
        "text": "Encrypting SQL traffic"
      },
      {
        "id": "d",
        "text": "A password spraying technique"
      }
    ],
    "correctAnswer": "b",
    "explanation": "SQL injection occurs when untrusted input is incorporated into database queries in an unsafe way.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-161",
    "topicKey": "cloud-app",
    "question": "What is cross-site scripting?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Injecting malicious script content into web pages viewed by users"
      },
      {
        "id": "b",
        "text": "Encrypting a web page"
      },
      {
        "id": "c",
        "text": "A network firewall attack"
      },
      {
        "id": "d",
        "text": "A backup technique"
      }
    ],
    "correctAnswer": "a",
    "explanation": "XSS can cause a victim's browser to execute attacker-controlled script in the context of a trusted site.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-162",
    "topicKey": "cloud-app",
    "question": "What is parameterized querying used to reduce?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Disk failure"
      },
      {
        "id": "b",
        "text": "Phishing emails"
      },
      {
        "id": "c",
        "text": "Password reuse"
      },
      {
        "id": "d",
        "text": "SQL injection risk"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Parameterized queries separate data from SQL instructions, reducing injection risk.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-163",
    "topicKey": "cloud-app",
    "question": "What is a secure session management practice?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Never expire sessions"
      },
      {
        "id": "b",
        "text": "Place session tokens in public URLs"
      },
      {
        "id": "c",
        "text": "Use strong session identifiers, expiration, and appropriate invalidation"
      },
      {
        "id": "d",
        "text": "Use the username as the session ID"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Secure session management reduces session theft and misuse.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-164",
    "topicKey": "cloud-app",
    "question": "Why should dependencies be monitored for vulnerabilities?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Monitoring dependencies slows all development"
      },
      {
        "id": "b",
        "text": "Applications inherit risk from third-party libraries and components"
      },
      {
        "id": "c",
        "text": "Dependencies are always secure"
      },
      {
        "id": "d",
        "text": "Dependencies cannot contain vulnerabilities"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Third-party components can introduce vulnerabilities and require inventory, assessment, and timely updates.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-165",
    "topicKey": "cloud-app",
    "question": "What is software composition analysis used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Identifying third-party and open-source components and associated risks"
      },
      {
        "id": "b",
        "text": "Encrypting source code"
      },
      {
        "id": "c",
        "text": "Creating user passwords"
      },
      {
        "id": "d",
        "text": "Monitoring physical doors"
      }
    ],
    "correctAnswer": "a",
    "explanation": "SCA helps identify software components, versions, licenses, and known vulnerabilities.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "cloud-app",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-166",
    "topicKey": "ops-ir",
    "question": "What is security monitoring?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Deleting logs"
      },
      {
        "id": "b",
        "text": "Changing passwords every minute"
      },
      {
        "id": "c",
        "text": "Backing up only photos"
      },
      {
        "id": "d",
        "text": "Collecting and analyzing security-relevant events to identify suspicious activity"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Security monitoring provides visibility into events that may indicate threats or policy violations.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-167",
    "topicKey": "ops-ir",
    "question": "What is a SIEM commonly used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Replacing firewalls"
      },
      {
        "id": "b",
        "text": "Creating source code"
      },
      {
        "id": "c",
        "text": "Centralizing and correlating security logs and events"
      },
      {
        "id": "d",
        "text": "Encrypting every endpoint"
      }
    ],
    "correctAnswer": "c",
    "explanation": "SIEM platforms aggregate and correlate security telemetry to support detection and investigation.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-168",
    "topicKey": "ops-ir",
    "question": "What is an incident?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A scheduled backup"
      },
      {
        "id": "b",
        "text": "A security-related event or set of events that requires investigation or response"
      },
      {
        "id": "c",
        "text": "Any routine login"
      },
      {
        "id": "d",
        "text": "A normal software update"
      }
    ],
    "correctAnswer": "b",
    "explanation": "An incident is an event or situation that meets an organization's criteria for security response.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-169",
    "topicKey": "ops-ir",
    "question": "What is incident response?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A structured process for preparing for, detecting, containing, eradicating, and recovering from incidents"
      },
      {
        "id": "b",
        "text": "A method for writing software"
      },
      {
        "id": "c",
        "text": "A password policy"
      },
      {
        "id": "d",
        "text": "A network cable standard"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Incident response provides an organized approach to handling security incidents and restoring operations.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-170",
    "topicKey": "ops-ir",
    "question": "What is containment?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Deleting all evidence"
      },
      {
        "id": "b",
        "text": "Publishing credentials"
      },
      {
        "id": "c",
        "text": "Ignoring the incident"
      },
      {
        "id": "d",
        "text": "Limiting the spread or impact of an incident"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Containment reduces ongoing harm while allowing investigation and remediation to proceed.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-171",
    "topicKey": "ops-ir",
    "question": "What is eradication?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Collecting employee surveys"
      },
      {
        "id": "b",
        "text": "Disabling all backups"
      },
      {
        "id": "c",
        "text": "Removing the cause or malicious presence of an incident"
      },
      {
        "id": "d",
        "text": "Creating a new vulnerability"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Eradication removes malware, compromised accounts, persistence mechanisms, or other causes of the incident.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-172",
    "topicKey": "ops-ir",
    "question": "What is recovery?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Deleting all logs"
      },
      {
        "id": "b",
        "text": "Restoring systems and operations to a trusted state"
      },
      {
        "id": "c",
        "text": "Collecting only phishing emails"
      },
      {
        "id": "d",
        "text": "Changing the incident title"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Recovery returns affected services to operation while ensuring they are sufficiently trusted and monitored.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-173",
    "topicKey": "ops-ir",
    "question": "Why is an incident response plan important?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "It defines roles, procedures, communications, and decision points before an incident occurs"
      },
      {
        "id": "b",
        "text": "It guarantees no incident will happen"
      },
      {
        "id": "c",
        "text": "It replaces technical controls"
      },
      {
        "id": "d",
        "text": "It eliminates the need for backups"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Preparation reduces confusion and speeds coordinated response during stressful events.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-174",
    "topicKey": "ops-ir",
    "question": "What is a playbook?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A list of employee birthdays"
      },
      {
        "id": "b",
        "text": "A firewall appliance"
      },
      {
        "id": "c",
        "text": "A password database"
      },
      {
        "id": "d",
        "text": "A documented set of actions for handling a specific type of security event"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Playbooks provide repeatable response steps for common scenarios.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-175",
    "topicKey": "ops-ir",
    "question": "Why preserve logs during an incident?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Logs automatically stop attacks"
      },
      {
        "id": "b",
        "text": "Logs replace backups"
      },
      {
        "id": "c",
        "text": "They may provide evidence about activity, timing, scope, and affected systems"
      },
      {
        "id": "d",
        "text": "Logs are never useful"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Logs can help reconstruct events, determine scope, and support detection and investigation.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-176",
    "topicKey": "ops-ir",
    "question": "What is a false positive?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A successful backup"
      },
      {
        "id": "b",
        "text": "An alert that appears suspicious but is determined not to represent the targeted malicious condition"
      },
      {
        "id": "c",
        "text": "A missed attack"
      },
      {
        "id": "d",
        "text": "A confirmed breach"
      }
    ],
    "correctAnswer": "b",
    "explanation": "False positives consume analyst time but are not confirmed instances of the detected condition.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-177",
    "topicKey": "ops-ir",
    "question": "What is a false negative?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A malicious or relevant event that a detection system fails to identify"
      },
      {
        "id": "b",
        "text": "A normal event incorrectly alerted"
      },
      {
        "id": "c",
        "text": "A successful patch"
      },
      {
        "id": "d",
        "text": "A backup verification"
      }
    ],
    "correctAnswer": "a",
    "explanation": "False negatives are dangerous because malicious activity can proceed without detection.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-178",
    "topicKey": "ops-ir",
    "question": "What is mean time to detect used to measure?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "How long a password is"
      },
      {
        "id": "b",
        "text": "How long a backup takes to restore"
      },
      {
        "id": "c",
        "text": "How many users are online"
      },
      {
        "id": "d",
        "text": "How long it takes to identify an incident or event after it begins"
      }
    ],
    "correctAnswer": "d",
    "explanation": "MTTD measures detection speed and can help evaluate monitoring effectiveness.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-179",
    "topicKey": "ops-ir",
    "question": "What is mean time to respond used to measure?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Patch release frequency"
      },
      {
        "id": "b",
        "text": "Certificate validity"
      },
      {
        "id": "c",
        "text": "How long it takes to begin or complete an appropriate response after detection"
      },
      {
        "id": "d",
        "text": "Password expiration time"
      }
    ],
    "correctAnswer": "c",
    "explanation": "MTTR-related measures help organizations evaluate and improve response speed.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-180",
    "topicKey": "ops-ir",
    "question": "What is threat hunting?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Creating user accounts"
      },
      {
        "id": "b",
        "text": "Proactively searching for signs of malicious activity that automated detection may have missed"
      },
      {
        "id": "c",
        "text": "Waiting for alerts only"
      },
      {
        "id": "d",
        "text": "Deleting old logs"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Threat hunting uses hypotheses and telemetry to proactively search for adversary activity.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "ops-ir",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-181",
    "topicKey": "governance",
    "question": "What is security governance?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "The structures, responsibilities, policies, and oversight used to direct security"
      },
      {
        "id": "b",
        "text": "A malware scanner"
      },
      {
        "id": "c",
        "text": "A firewall rule"
      },
      {
        "id": "d",
        "text": "A password generator"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Security governance establishes direction, accountability, decision-making, and oversight.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-182",
    "topicKey": "governance",
    "question": "Why classify data?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To make files larger"
      },
      {
        "id": "b",
        "text": "To eliminate backups"
      },
      {
        "id": "c",
        "text": "To avoid access controls"
      },
      {
        "id": "d",
        "text": "To apply appropriate protection based on sensitivity and business requirements"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Data classification supports consistent handling and protection decisions based on sensitivity.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-183",
    "topicKey": "governance",
    "question": "What is data minimization?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Keeping data forever"
      },
      {
        "id": "b",
        "text": "Publishing data publicly"
      },
      {
        "id": "c",
        "text": "Collecting and retaining only the data needed for legitimate purposes"
      },
      {
        "id": "d",
        "text": "Collecting every possible data field"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Minimization reduces unnecessary exposure by limiting collection and retention.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-184",
    "topicKey": "governance",
    "question": "What is data retention?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A password policy"
      },
      {
        "id": "b",
        "text": "Rules defining how long information should be kept and when it should be disposed of"
      },
      {
        "id": "c",
        "text": "A method for encrypting data"
      },
      {
        "id": "d",
        "text": "A firewall rule"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Retention policies balance business, legal, regulatory, and security needs for keeping information.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-185",
    "topicKey": "governance",
    "question": "What is security awareness training intended to improve?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Users' ability to recognize and respond appropriately to security risks"
      },
      {
        "id": "b",
        "text": "CPU performance"
      },
      {
        "id": "c",
        "text": "Network bandwidth"
      },
      {
        "id": "d",
        "text": "Database indexing"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Awareness training helps people identify threats and follow security procedures.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-186",
    "topicKey": "governance",
    "question": "Why should security policies be reviewed?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Policies never need updates"
      },
      {
        "id": "b",
        "text": "Reviews eliminate all threats"
      },
      {
        "id": "c",
        "text": "Reviews replace technical controls"
      },
      {
        "id": "d",
        "text": "Business operations, technology, threats, and requirements change"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Periodic review keeps policies aligned with current risks and organizational requirements.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-187",
    "topicKey": "governance",
    "question": "What is an acceptable use policy?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A backup image"
      },
      {
        "id": "b",
        "text": "A firewall appliance"
      },
      {
        "id": "c",
        "text": "Rules describing appropriate use of organizational systems and resources"
      },
      {
        "id": "d",
        "text": "A malware signature"
      }
    ],
    "correctAnswer": "c",
    "explanation": "An acceptable use policy defines permitted and prohibited use of organizational technology.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-188",
    "topicKey": "governance",
    "question": "What is separation of duties?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Removing audit logs"
      },
      {
        "id": "b",
        "text": "Dividing critical responsibilities so one person does not control an entire sensitive process"
      },
      {
        "id": "c",
        "text": "Giving one person every privilege"
      },
      {
        "id": "d",
        "text": "Using one password everywhere"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Separation of duties reduces opportunities for fraud, abuse, and undetected errors.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "governance",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-189",
    "topicKey": "governance",
    "question": "What is an audit trail?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A record of actions and events that supports accountability and investigation"
      },
      {
        "id": "b",
        "text": "A network cable"
      },
      {
        "id": "c",
        "text": "A password reset"
      },
      {
        "id": "d",
        "text": "A backup tape"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Audit trails provide evidence of who or what performed actions and when.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-190",
    "topicKey": "governance",
    "question": "What is compliance?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Guaranteeing perfect security"
      },
      {
        "id": "b",
        "text": "Avoiding all audits"
      },
      {
        "id": "c",
        "text": "Using only open-source software"
      },
      {
        "id": "d",
        "text": "Meeting applicable laws, regulations, contractual requirements, or standards"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Compliance is adherence to applicable external or internal requirements; compliance alone does not guarantee security.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-191",
    "topicKey": "governance",
    "question": "Why conduct third-party security assessments?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Assessments replace contracts"
      },
      {
        "id": "b",
        "text": "Third parties cannot access data"
      },
      {
        "id": "c",
        "text": "A supplier can introduce risk to systems, data, or services"
      },
      {
        "id": "d",
        "text": "Vendors never affect security"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Third-party assessments help evaluate risks introduced through suppliers, partners, and service providers.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "governance",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-192",
    "topicKey": "governance",
    "question": "What is a business impact analysis?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A firewall test"
      },
      {
        "id": "b",
        "text": "An analysis of how disruptions affect critical business functions and priorities"
      },
      {
        "id": "c",
        "text": "A malware scan"
      },
      {
        "id": "d",
        "text": "A password audit"
      }
    ],
    "correctAnswer": "b",
    "explanation": "BIA identifies critical functions, impacts, dependencies, and recovery priorities.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "governance",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-193",
    "topicKey": "governance",
    "question": "What is a disaster recovery plan?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A plan for restoring technology and services after a disruptive event"
      },
      {
        "id": "b",
        "text": "A phishing email template"
      },
      {
        "id": "c",
        "text": "A password list"
      },
      {
        "id": "d",
        "text": "A vulnerability scan"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Disaster recovery focuses on restoring systems and services after major disruption.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-194",
    "topicKey": "governance",
    "question": "What is a backup strategy intended to support?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Prevention of every phishing attack"
      },
      {
        "id": "b",
        "text": "Identity proofing"
      },
      {
        "id": "c",
        "text": "Network segmentation"
      },
      {
        "id": "d",
        "text": "Recovery of data or systems after loss, corruption, or disruption"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Backups support resilience and recovery from data loss, ransomware, accidental deletion, and other disruptions.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-195",
    "topicKey": "governance",
    "question": "Why should backups be tested?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Backups are always valid"
      },
      {
        "id": "b",
        "text": "Testing is only for compliance"
      },
      {
        "id": "c",
        "text": "A backup that cannot be restored does not provide dependable recovery"
      },
      {
        "id": "d",
        "text": "Testing deletes all backups"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Restore testing verifies that backups are usable and recovery procedures work as expected.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "governance",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-196",
    "topicKey": "governance",
    "question": "What is an immutable backup?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A backup without encryption"
      },
      {
        "id": "b",
        "text": "A backup designed to resist alteration or deletion during its protected retention period"
      },
      {
        "id": "c",
        "text": "A backup that changes every minute"
      },
      {
        "id": "d",
        "text": "A backup stored only in RAM"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Immutability can help protect recovery copies from ransomware or unauthorized modification.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "governance",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-197",
    "topicKey": "governance",
    "question": "What is tabletop exercise?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A discussion-based exercise that walks participants through a simulated incident or disruption"
      },
      {
        "id": "b",
        "text": "A malware infection"
      },
      {
        "id": "c",
        "text": "A firewall scan"
      },
      {
        "id": "d",
        "text": "A production deployment"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Tabletop exercises test plans, roles, decisions, and communications without requiring a live incident.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-198",
    "topicKey": "governance",
    "question": "Why should security metrics be tied to business outcomes?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Metrics should only count passwords"
      },
      {
        "id": "b",
        "text": "Business context is irrelevant"
      },
      {
        "id": "c",
        "text": "Metrics automatically reduce vulnerabilities"
      },
      {
        "id": "d",
        "text": "Metrics are more useful when they help explain risk, performance, and decision impact"
      }
    ],
    "correctAnswer": "d",
    "explanation": "Useful metrics connect security activity to risk reduction, resilience, compliance, and operational outcomes.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "governance",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-199",
    "topicKey": "governance",
    "question": "What is risk appetite?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A password complexity rule"
      },
      {
        "id": "b",
        "text": "A backup format"
      },
      {
        "id": "c",
        "text": "The amount and type of risk an organization is willing to pursue or tolerate"
      },
      {
        "id": "d",
        "text": "A list of vulnerabilities"
      }
    ],
    "correctAnswer": "c",
    "explanation": "Risk appetite expresses the organization's overall willingness to accept exposure in pursuit of objectives.",
    "difficulty": "medium",
    "tags": [
      "cybersecurity",
      "governance",
      "medium"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "cyber-200",
    "topicKey": "governance",
    "question": "What is continuous improvement in security?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Only responding after a breach"
      },
      {
        "id": "b",
        "text": "Regularly using lessons, measurements, incidents, and changing threats to improve controls and processes"
      },
      {
        "id": "c",
        "text": "Never changing security controls"
      },
      {
        "id": "d",
        "text": "Disabling monitoring after deployment"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Security programs should evolve based on evidence, changing threats, technology, and business needs.",
    "difficulty": "easy",
    "tags": [
      "cybersecurity",
      "governance",
      "easy"
    ],
    "sourceType": "original",
    "status": "published"
  }
];
