import { TestQuestionImportRecord, TestQuestionImportTopic } from '../models/test-question-import.model';

export const SERVICENOW_ADMIN_INTERVIEW_TOPICS: readonly TestQuestionImportTopic[] = [
  {
    "key": "interview-questions",
    "name": "Interview Questions",
    "slug": "interview-questions",
    "description": "ServiceNow Administrator interview questions covering platform administration, security, configuration, scripting, automation, data management, and troubleshooting."
  }
];

export const SERVICENOW_ADMIN_INTERVIEW_QUESTIONS: readonly TestQuestionImportRecord[] = [
  {
    "seedId": "snow-admin-interview-001",
    "topicKey": "interview-questions",
    "question": "What is the primary purpose of a ServiceNow table?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To store and organize records"
      },
      {
        "id": "b",
        "text": "To define user passwords"
      },
      {
        "id": "c",
        "text": "To host external websites"
      },
      {
        "id": "d",
        "text": "To compile client-side JavaScript"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Tables store records and define the fields available on those records.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-002",
    "topicKey": "interview-questions",
    "question": "What is the difference between a table and a record in ServiceNow?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A table is one field and a record is a list"
      },
      {
        "id": "b",
        "text": "A table defines a collection/structure of records, while a record is one row of data"
      },
      {
        "id": "c",
        "text": "A table is only used for reporting"
      },
      {
        "id": "d",
        "text": "There is no difference"
      }
    ],
    "correctAnswer": "b",
    "explanation": "A table defines the data structure; an individual record is one instance of that data.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-003",
    "topicKey": "interview-questions",
    "question": "What is a reference field used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To store a relationship to a record in another table"
      },
      {
        "id": "b",
        "text": "To encrypt a field"
      },
      {
        "id": "c",
        "text": "To create a report"
      },
      {
        "id": "d",
        "text": "To schedule a job"
      }
    ],
    "correctAnswer": "a",
    "explanation": "A reference field points to a record in another table and enables related-record selection.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-004",
    "topicKey": "interview-questions",
    "question": "What does a reference qualifier control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Which records are available for selection in a reference field"
      },
      {
        "id": "b",
        "text": "Which users can log in"
      },
      {
        "id": "c",
        "text": "Which reports run nightly"
      },
      {
        "id": "d",
        "text": "Which applications can be installed"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Reference qualifiers filter the records that can be selected in a reference field.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-005",
    "topicKey": "interview-questions",
    "question": "What is the purpose of a dictionary entry?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To define metadata and behavior for a field or table"
      },
      {
        "id": "b",
        "text": "To create a user group"
      },
      {
        "id": "c",
        "text": "To execute a scheduled script"
      },
      {
        "id": "d",
        "text": "To publish a knowledge article"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Dictionary entries store metadata about tables and fields, including attributes and definitions.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-006",
    "topicKey": "interview-questions",
    "question": "What is a Business Rule?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Server-side logic that runs when specified database operations or events occur"
      },
      {
        "id": "b",
        "text": "A client-only UI style"
      },
      {
        "id": "c",
        "text": "A type of user account"
      },
      {
        "id": "d",
        "text": "A reporting widget"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Business Rules execute server-side in response to defined record operations or conditions.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-007",
    "topicKey": "interview-questions",
    "question": "When would you use a Client Script?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To run JavaScript in the user's browser in response to form events"
      },
      {
        "id": "b",
        "text": "To perform database maintenance from a scheduled job"
      },
      {
        "id": "c",
        "text": "To configure an ACL only"
      },
      {
        "id": "d",
        "text": "To create a database index"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Client Scripts provide client-side behavior for forms, such as onLoad, onChange, and onSubmit logic.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-008",
    "topicKey": "interview-questions",
    "question": "What is a UI Policy primarily used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Dynamically controlling form field behavior such as mandatory, visible, or read-only"
      },
      {
        "id": "b",
        "text": "Creating database tables"
      },
      {
        "id": "c",
        "text": "Sending outbound REST calls"
      },
      {
        "id": "d",
        "text": "Creating users"
      }
    ],
    "correctAnswer": "a",
    "explanation": "UI Policies can change field visibility, mandatory state, and read-only state on forms.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-009",
    "topicKey": "interview-questions",
    "question": "What is the main difference between a UI Policy and a Client Script?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "UI Policies are declarative for common field behavior, while Client Scripts provide programmable client-side logic"
      },
      {
        "id": "b",
        "text": "Client Scripts only run on the server"
      },
      {
        "id": "c",
        "text": "UI Policies can never affect fields"
      },
      {
        "id": "d",
        "text": "They are identical"
      }
    ],
    "correctAnswer": "a",
    "explanation": "UI Policies handle common form behavior declaratively; Client Scripts are used when scripting logic is needed.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-010",
    "topicKey": "interview-questions",
    "question": "What is an Access Control (ACL) used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Controlling whether users can access tables, records, or fields"
      },
      {
        "id": "b",
        "text": "Changing a form color"
      },
      {
        "id": "c",
        "text": "Creating scheduled reports"
      },
      {
        "id": "d",
        "text": "Importing CSV files"
      }
    ],
    "correctAnswer": "a",
    "explanation": "ACL rules determine whether a user is allowed to perform operations on protected data.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-011",
    "topicKey": "interview-questions",
    "question": "What is the typical evaluation order for an ACL?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "The most specific applicable ACLs and required conditions/scripts must allow access"
      },
      {
        "id": "b",
        "text": "Only the table ACL matters"
      },
      {
        "id": "c",
        "text": "Only field ACLs matter"
      },
      {
        "id": "d",
        "text": "ACLs are ignored for administrators"
      }
    ],
    "correctAnswer": "a",
    "explanation": "ServiceNow evaluates applicable ACL requirements; access is granted only when the relevant authorization requirements are satisfied.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "hard",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-012",
    "topicKey": "interview-questions",
    "question": "What is a role in ServiceNow?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A named set of permissions that can be assigned to users or groups"
      },
      {
        "id": "b",
        "text": "A database record only"
      },
      {
        "id": "c",
        "text": "A report filter"
      },
      {
        "id": "d",
        "text": "A catalog variable"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Roles are used to grant permissions and capabilities.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-013",
    "topicKey": "interview-questions",
    "question": "Why are groups commonly used with roles?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Roles can be assigned to groups so members inherit the permissions"
      },
      {
        "id": "b",
        "text": "Groups automatically bypass all ACLs"
      },
      {
        "id": "c",
        "text": "Groups replace tables"
      },
      {
        "id": "d",
        "text": "Groups encrypt records"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Assigning roles to groups simplifies permission management because group members inherit those roles.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-014",
    "topicKey": "interview-questions",
    "question": "What is impersonation useful for an administrator?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Testing the experience and access of another user"
      },
      {
        "id": "b",
        "text": "Deleting all system logs"
      },
      {
        "id": "c",
        "text": "Changing the instance URL"
      },
      {
        "id": "d",
        "text": "Creating database indexes"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Impersonation helps administrators reproduce a user's access and UI experience for troubleshooting.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-015",
    "topicKey": "interview-questions",
    "question": "What is an update set?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A mechanism for capturing configuration changes so they can be moved between instances"
      },
      {
        "id": "b",
        "text": "A collection of user passwords"
      },
      {
        "id": "c",
        "text": "A report definition only"
      },
      {
        "id": "d",
        "text": "A database backup"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Update sets capture supported configuration changes for transfer between ServiceNow instances.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-016",
    "topicKey": "interview-questions",
    "question": "Which type of data should generally not be moved using an update set?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Configuration changes"
      },
      {
        "id": "b",
        "text": "Large volumes of operational/transactional data"
      },
      {
        "id": "c",
        "text": "Form layout changes"
      },
      {
        "id": "d",
        "text": "Business Rule changes"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Update sets are intended primarily for configuration, not bulk operational data migration.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-017",
    "topicKey": "interview-questions",
    "question": "What is an application scope?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A boundary that controls application resources and helps isolate development"
      },
      {
        "id": "b",
        "text": "A report condition"
      },
      {
        "id": "c",
        "text": "A user session timeout"
      },
      {
        "id": "d",
        "text": "A table index"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Application scope helps control ownership, access, and separation of application resources.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-018",
    "topicKey": "interview-questions",
    "question": "What is the purpose of an application access setting?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To define how application resources can be accessed across scopes and users"
      },
      {
        "id": "b",
        "text": "To schedule upgrades"
      },
      {
        "id": "c",
        "text": "To format dates"
      },
      {
        "id": "d",
        "text": "To create email accounts"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Application access settings help govern how resources are exposed and accessed.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "hard",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-019",
    "topicKey": "interview-questions",
    "question": "What is a data policy?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A server-side rule that can enforce data requirements across interfaces"
      },
      {
        "id": "b",
        "text": "A client-only color rule"
      },
      {
        "id": "c",
        "text": "A user role"
      },
      {
        "id": "d",
        "text": "A report visualization"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Data Policies can enforce field requirements and other data rules, including outside the standard form UI.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-020",
    "topicKey": "interview-questions",
    "question": "What is a data dictionary override commonly used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Changing field behavior for a field inherited from a parent table"
      },
      {
        "id": "b",
        "text": "Creating a new user"
      },
      {
        "id": "c",
        "text": "Running a scheduled report"
      },
      {
        "id": "d",
        "text": "Deleting a table"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Dictionary overrides allow behavior of inherited fields to be tailored for a child table.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "hard",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-021",
    "topicKey": "interview-questions",
    "question": "What is an import set?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A staging mechanism for bringing external data into ServiceNow for transformation"
      },
      {
        "id": "b",
        "text": "A backup of the instance"
      },
      {
        "id": "c",
        "text": "A collection of dashboards"
      },
      {
        "id": "d",
        "text": "A set of user roles"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Import Sets provide a staging area for imported data before it is transformed into target records.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-022",
    "topicKey": "interview-questions",
    "question": "What is a transform map?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A definition that maps import-set fields to fields in a target table"
      },
      {
        "id": "b",
        "text": "A map of user locations"
      },
      {
        "id": "c",
        "text": "A dashboard template"
      },
      {
        "id": "d",
        "text": "An ACL collection"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Transform Maps define how staged import data is transformed into target records.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-023",
    "topicKey": "interview-questions",
    "question": "What is coalescing in a transform map?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A matching strategy used to identify an existing target record"
      },
      {
        "id": "b",
        "text": "A method for encrypting import data"
      },
      {
        "id": "c",
        "text": "A way to create a new application"
      },
      {
        "id": "d",
        "text": "A reporting feature"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Coalesce fields help match incoming data to existing target records instead of creating duplicates.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-024",
    "topicKey": "interview-questions",
    "question": "When would you use a transform script?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "When custom server-side logic is needed during data transformation"
      },
      {
        "id": "b",
        "text": "When changing a form label manually"
      },
      {
        "id": "c",
        "text": "When assigning a role to a group"
      },
      {
        "id": "d",
        "text": "When creating a dashboard"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Transform scripts allow custom logic to manipulate source or target values during transformation.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-025",
    "topicKey": "interview-questions",
    "question": "What is a catalog item?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A requestable product or service offered through the Service Catalog"
      },
      {
        "id": "b",
        "text": "A database index"
      },
      {
        "id": "c",
        "text": "A system property"
      },
      {
        "id": "d",
        "text": "A user group"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Catalog items represent products or services users can request.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-026",
    "topicKey": "interview-questions",
    "question": "What is a variable in a catalog item?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "An input that collects information from the requester"
      },
      {
        "id": "b",
        "text": "A database table"
      },
      {
        "id": "c",
        "text": "A scheduled job"
      },
      {
        "id": "d",
        "text": "An ACL"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Catalog variables collect information needed to fulfill a request.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-027",
    "topicKey": "interview-questions",
    "question": "What is a record producer?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A catalog-based interface that creates a record in a target table"
      },
      {
        "id": "b",
        "text": "A report export tool"
      },
      {
        "id": "c",
        "text": "A user impersonation feature"
      },
      {
        "id": "d",
        "text": "A database index"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Record Producers provide a catalog experience for creating records in a specified table.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-028",
    "topicKey": "interview-questions",
    "question": "What is Flow Designer primarily used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Building workflow automation with triggers, actions, and flows"
      },
      {
        "id": "b",
        "text": "Editing database schemas with SQL"
      },
      {
        "id": "c",
        "text": "Creating browser extensions"
      },
      {
        "id": "d",
        "text": "Replacing all ACLs"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Flow Designer provides a low-code approach to automating processes using triggers, actions, and flows.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-029",
    "topicKey": "interview-questions",
    "question": "What is a trigger in Flow Designer?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "The event or condition that starts a flow"
      },
      {
        "id": "b",
        "text": "The final database record"
      },
      {
        "id": "c",
        "text": "A user role"
      },
      {
        "id": "d",
        "text": "A report filter"
      }
    ],
    "correctAnswer": "a",
    "explanation": "A trigger determines when a flow should begin.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-030",
    "topicKey": "interview-questions",
    "question": "What is an action in Flow Designer?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A reusable operation performed by a flow"
      },
      {
        "id": "b",
        "text": "A user login"
      },
      {
        "id": "c",
        "text": "A database table"
      },
      {
        "id": "d",
        "text": "A dashboard filter"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Actions perform work within a flow, such as updating records or calling integrations.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-031",
    "topicKey": "interview-questions",
    "question": "What is a scheduled job?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A server-side process configured to run at a specified time or interval"
      },
      {
        "id": "b",
        "text": "A catalog variable"
      },
      {
        "id": "c",
        "text": "A UI Policy"
      },
      {
        "id": "d",
        "text": "A reference field"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Scheduled jobs execute server-side logic according to a schedule.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-032",
    "topicKey": "interview-questions",
    "question": "What is GlideRecord used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Querying and manipulating ServiceNow records from server-side scripts"
      },
      {
        "id": "b",
        "text": "Styling forms with CSS"
      },
      {
        "id": "c",
        "text": "Creating user passwords"
      },
      {
        "id": "d",
        "text": "Rendering dashboards"
      }
    ],
    "correctAnswer": "a",
    "explanation": "GlideRecord is a server-side API used to query, insert, update, and delete records.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-033",
    "topicKey": "interview-questions",
    "question": "Why should an administrator avoid unnecessary GlideRecord queries inside loops?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "They can create performance problems by repeatedly querying the database"
      },
      {
        "id": "b",
        "text": "They automatically disable ACLs"
      },
      {
        "id": "c",
        "text": "They prevent all Business Rules from running"
      },
      {
        "id": "d",
        "text": "They delete indexes"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Repeated database queries can be expensive and should be minimized or optimized.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-034",
    "topicKey": "interview-questions",
    "question": "What is a system property?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A configurable key-value setting used by ServiceNow applications and features"
      },
      {
        "id": "b",
        "text": "A user record"
      },
      {
        "id": "c",
        "text": "A database table"
      },
      {
        "id": "d",
        "text": "A report chart"
      }
    ],
    "correctAnswer": "a",
    "explanation": "System properties provide configurable values that can influence platform behavior.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-035",
    "topicKey": "interview-questions",
    "question": "What is a notification in ServiceNow?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A mechanism for sending messages when specified events or conditions occur"
      },
      {
        "id": "b",
        "text": "A database index"
      },
      {
        "id": "c",
        "text": "A user role"
      },
      {
        "id": "d",
        "text": "A transform map"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Notifications can send email or other supported messages based on configured conditions and events.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-036",
    "topicKey": "interview-questions",
    "question": "What is an event in ServiceNow?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A named occurrence that can be queued and used to trigger actions such as notifications"
      },
      {
        "id": "b",
        "text": "A table column"
      },
      {
        "id": "c",
        "text": "A UI Policy"
      },
      {
        "id": "d",
        "text": "A database backup"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Events represent occurrences that can be generated and consumed by platform features such as notifications.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-037",
    "topicKey": "interview-questions",
    "question": "What is a scheduled report?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A report configured to run and deliver results on a recurring schedule"
      },
      {
        "id": "b",
        "text": "A Business Rule"
      },
      {
        "id": "c",
        "text": "A catalog item"
      },
      {
        "id": "d",
        "text": "An ACL"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Scheduled reports automatically run reports and can distribute the results.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-038",
    "topicKey": "interview-questions",
    "question": "What is the purpose of an index?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To improve query performance for frequently searched or filtered data"
      },
      {
        "id": "b",
        "text": "To control user roles"
      },
      {
        "id": "c",
        "text": "To replace ACLs"
      },
      {
        "id": "d",
        "text": "To create email templates"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Indexes can improve database query performance when designed appropriately.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-039",
    "topicKey": "interview-questions",
    "question": "What is a database view?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A logical combination of tables that can be used to report across related data"
      },
      {
        "id": "b",
        "text": "A user interface theme"
      },
      {
        "id": "c",
        "text": "A security role"
      },
      {
        "id": "d",
        "text": "A catalog variable"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Database Views can combine fields from multiple tables for reporting and querying.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "hard",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-040",
    "topicKey": "interview-questions",
    "question": "What is a list view?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A tabular interface that displays multiple records and their fields"
      },
      {
        "id": "b",
        "text": "A database backup"
      },
      {
        "id": "c",
        "text": "A scheduled job"
      },
      {
        "id": "d",
        "text": "A flow trigger"
      }
    ],
    "correctAnswer": "a",
    "explanation": "List views display records from a table in a configurable column layout.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-041",
    "topicKey": "interview-questions",
    "question": "What is a form view?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A configured presentation of fields and related information for a single record"
      },
      {
        "id": "b",
        "text": "A database index"
      },
      {
        "id": "c",
        "text": "A user role"
      },
      {
        "id": "d",
        "text": "A transform map"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Form views control how a record's fields and related information are presented.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-042",
    "topicKey": "interview-questions",
    "question": "What is a related list?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A section on a form that displays records related to the current record"
      },
      {
        "id": "b",
        "text": "A type of ACL"
      },
      {
        "id": "c",
        "text": "A scheduled script"
      },
      {
        "id": "d",
        "text": "A system property"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Related lists expose related records associated with the current record.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-043",
    "topicKey": "interview-questions",
    "question": "What is a dot-walk in ServiceNow?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Accessing fields on a referenced record through a reference field"
      },
      {
        "id": "b",
        "text": "Walking through update sets"
      },
      {
        "id": "c",
        "text": "Navigating user roles"
      },
      {
        "id": "d",
        "text": "Running a scheduled job"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Dot-walking lets scripts, filters, and other configurations access fields through reference relationships.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-044",
    "topicKey": "interview-questions",
    "question": "What is an encoded query?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A compact string representation of filter conditions used by ServiceNow"
      },
      {
        "id": "b",
        "text": "An encrypted password"
      },
      {
        "id": "c",
        "text": "A REST authentication token"
      },
      {
        "id": "d",
        "text": "A database backup"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Encoded queries represent filter criteria in a portable ServiceNow query-string format.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-045",
    "topicKey": "interview-questions",
    "question": "What is a UI Action?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A button, link, or contextual action that can execute configured logic"
      },
      {
        "id": "b",
        "text": "A database table"
      },
      {
        "id": "c",
        "text": "A role assignment"
      },
      {
        "id": "d",
        "text": "A transform map"
      }
    ],
    "correctAnswer": "a",
    "explanation": "UI Actions add interactive buttons, links, or menu actions and can execute server-side or client-side logic.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-046",
    "topicKey": "interview-questions",
    "question": "What is the purpose of the System Logs?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To help administrators diagnose errors, warnings, scripts, and system activity"
      },
      {
        "id": "b",
        "text": "To store catalog items"
      },
      {
        "id": "c",
        "text": "To define ACLs"
      },
      {
        "id": "d",
        "text": "To create roles"
      }
    ],
    "correctAnswer": "a",
    "explanation": "System logs provide diagnostic information useful for troubleshooting platform behavior.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "easy",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-047",
    "topicKey": "interview-questions",
    "question": "What is a background script commonly used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Running administrative server-side scripts for controlled troubleshooting or data operations"
      },
      {
        "id": "b",
        "text": "Changing browser CSS only"
      },
      {
        "id": "c",
        "text": "Creating catalog variables"
      },
      {
        "id": "d",
        "text": "Sending marketing emails"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Background scripts can execute server-side JavaScript for administrative tasks and troubleshooting and should be used carefully.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-048",
    "topicKey": "interview-questions",
    "question": "What is the safest general approach when troubleshooting a production issue?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Identify the scope, reproduce safely, review logs and configuration, and make the smallest controlled change"
      },
      {
        "id": "b",
        "text": "Immediately modify multiple Business Rules"
      },
      {
        "id": "c",
        "text": "Disable all ACLs"
      },
      {
        "id": "d",
        "text": "Delete and recreate the table"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Controlled troubleshooting reduces risk and makes it easier to identify the actual cause.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-049",
    "topicKey": "interview-questions",
    "question": "What is an upgrade-safe customization?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A configuration that follows supported platform patterns and minimizes changes to baseline functionality"
      },
      {
        "id": "b",
        "text": "Any modification to a ServiceNow table"
      },
      {
        "id": "c",
        "text": "A script that ignores platform APIs"
      },
      {
        "id": "d",
        "text": "A customization that disables upgrades"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Following supported extension points and minimizing unnecessary baseline changes helps preserve upgradeability.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "hard",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  },
  {
    "seedId": "snow-admin-interview-050",
    "topicKey": "interview-questions",
    "question": "Why should an administrator avoid modifying baseline objects unnecessarily?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Baseline changes can create upgrade conflicts and increase maintenance effort"
      },
      {
        "id": "b",
        "text": "Baseline objects cannot contain fields"
      },
      {
        "id": "c",
        "text": "It prevents reporting"
      },
      {
        "id": "d",
        "text": "It automatically removes roles"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Unnecessary baseline modifications can increase upgrade conflicts and technical debt.",
    "hint": "Focus on the purpose of the ServiceNow feature and where the logic executes.",
    "difficulty": "medium",
    "tags": [
      "servicenow",
      "administrator",
      "interview",
      "interview-questions"
    ],
    "sourceType": "original",
    "sourceReference": "Zebron original content",
    "status": "published"
  }
];
