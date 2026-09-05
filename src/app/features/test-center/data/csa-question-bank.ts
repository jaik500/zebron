import {
  TestQuestionImportRecord,
} from '../models/test-question-import.model';

/**
 * ServiceNow CSA question-bank topic definitions.
 *
 * These definitions belong to the question bank rather than
 * the generic importer.
 *
 * The `key` values are referenced by questions through
 * `topicKey`.
 *
 * The importer creates these topics automatically when
 * they do not already exist for the selected course.
 */
export const CSA_QUESTION_BANK_TOPICS = [
  {
    key: 'platform',
    name: 'Platform Fundamentals',
    slug: 'platform-fundamentals',
    description:
      'Core ServiceNow platform concepts, navigation, and system records.',
  },
  {
    key: 'users',
    name: 'Users, Groups & Roles',
    slug: 'users-groups-roles',
    description:
      'Users, groups, roles, and basic access concepts.',
  },
  {
    key: 'lists',
    name: 'Lists, Forms & Filters',
    slug: 'lists-forms-filters',
    description:
      'Lists, forms, filtering, sorting, and query basics.',
  },
  {
    key: 'data',
    name: 'Tables, Fields & Data',
    slug: 'tables-fields-data',
    description:
      'Tables, fields, inheritance, dictionary metadata, and data design.',
  },
  {
    key: 'config',
    name: 'Configuration & Customization',
    slug: 'configuration-customization',
    description:
      'Platform configuration, UI policies, client scripts, and application development.',
  },
  {
    key: 'security',
    name: 'Access Control & Security',
    slug: 'access-control-security',
    description:
      'ACLs, permissions, least privilege, and security troubleshooting.',
  },
  {
    key: 'automation',
    name: 'Business Rules & Automation',
    slug: 'business-rules-automation',
    description:
      'Business Rules, Flow Designer, Script Includes, and server/client automation.',
  },
  {
    key: 'catalog',
    name: 'Service Catalog',
    slug: 'service-catalog',
    description:
      'Catalog items, record producers, variables, requests, and fulfillment.',
  },
  {
    key: 'data-mgmt',
    name: 'Import Sets & Data Management',
    slug: 'import-sets-data-management',
    description:
      'Import Sets, Transform Maps, coalesce, and data quality.',
  },
  {
    key: 'reporting',
    name: 'Reporting & Dashboards',
    slug: 'reporting-dashboards',
    description:
      'Reports, dashboards, KPIs, filters, and scheduled reporting.',
  },
] as const;

/**
 * Zebron ServiceNow CSA Practice Question Bank
 *
 * These are original practice questions intended for
 * educational use. They are NOT official ServiceNow
 * certification examination questions.
 *
 * Topic references use topic slugs rather than Firestore
 * document IDs. The importer resolves the actual topic
 * dynamically for the selected course.
 */
export const CSA_QUESTION_BANK = [
  {
    "seedId": "csa-001",
    "topicKey": "platform",
    "question": "Which component provides a centralized starting point for navigating applications and modules in ServiceNow?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Application Navigator"
      },
      {
        "id": "b",
        "text": "Update Set"
      },
      {
        "id": "c",
        "text": "Import Set"
      },
      {
        "id": "d",
        "text": "Transform Map"
      }
    ],
    "correctAnswer": "a",
    "explanation": "The Application Navigator lets users find applications and the modules they contain.",
    "difficulty": "easy",
    "tags": [
      "navigation",
      "application-navigator",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-002",
    "topicKey": "platform",
    "question": "What is the primary purpose of the ServiceNow platform?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To provide a single cloud platform for automating and managing enterprise workflows"
      },
      {
        "id": "b",
        "text": "To replace all relational databases"
      },
      {
        "id": "c",
        "text": "To provide only email services"
      },
      {
        "id": "d",
        "text": "To manage physical network cabling"
      }
    ],
    "correctAnswer": "a",
    "explanation": "ServiceNow provides a platform for building and running workflow-based applications and services.",
    "difficulty": "easy",
    "tags": [
      "platform",
      "workflow",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-003",
    "topicKey": "platform",
    "question": "What is a ServiceNow instance?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A dedicated environment containing the platform configuration and data for an organization"
      },
      {
        "id": "b",
        "text": "A single catalog item"
      },
      {
        "id": "c",
        "text": "A browser bookmark"
      },
      {
        "id": "d",
        "text": "A database field"
      }
    ],
    "correctAnswer": "a",
    "explanation": "An instance is an environment in which ServiceNow applications, configuration, and data operate.",
    "difficulty": "easy",
    "tags": [
      "instance",
      "architecture",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-004",
    "topicKey": "platform",
    "question": "Which interface element displays records as rows and fields as columns?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "List"
      },
      {
        "id": "b",
        "text": "Form"
      },
      {
        "id": "c",
        "text": "Dashboard"
      },
      {
        "id": "d",
        "text": "Workflow"
      }
    ],
    "correctAnswer": "a",
    "explanation": "A list displays multiple records in rows, while a form displays one record.",
    "difficulty": "easy",
    "tags": [
      "lists",
      "navigation",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-005",
    "topicKey": "platform",
    "question": "Which interface is primarily used to view and edit a single ServiceNow record?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Form"
      },
      {
        "id": "b",
        "text": "List"
      },
      {
        "id": "c",
        "text": "Application menu"
      },
      {
        "id": "d",
        "text": "Import Set"
      }
    ],
    "correctAnswer": "a",
    "explanation": "A form presents the fields of an individual record for viewing or editing.",
    "difficulty": "easy",
    "tags": [
      "forms",
      "records",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-006",
    "topicKey": "platform",
    "question": "What does a reference field store?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A reference to a record in another table"
      },
      {
        "id": "b",
        "text": "A PDF attachment"
      },
      {
        "id": "c",
        "text": "A JavaScript function"
      },
      {
        "id": "d",
        "text": "A report definition only"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Reference fields relate one record to another table's record, normally through its sys_id.",
    "difficulty": "easy",
    "tags": [
      "reference",
      "fields",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-007",
    "topicKey": "platform",
    "question": "What is a sys_id?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A unique 32-character identifier for a record"
      },
      {
        "id": "b",
        "text": "A user's password"
      },
      {
        "id": "c",
        "text": "A table's display label"
      },
      {
        "id": "d",
        "text": "A module's URL"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Every ServiceNow record has a unique sys_id used internally to identify it.",
    "difficulty": "easy",
    "tags": [
      "sys_id",
      "records",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-008",
    "topicKey": "platform",
    "question": "Which feature allows a user to save a frequently used filter for reuse?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Saved filter"
      },
      {
        "id": "b",
        "text": "Transform Map"
      },
      {
        "id": "c",
        "text": "Update Set"
      },
      {
        "id": "d",
        "text": "ACL"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Saved filters preserve commonly used list filter conditions for later use.",
    "difficulty": "easy",
    "tags": [
      "filters",
      "lists",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-009",
    "topicKey": "platform",
    "question": "What is a dashboard primarily used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Displaying reports and other visualizations in a shared view"
      },
      {
        "id": "b",
        "text": "Creating database tables"
      },
      {
        "id": "c",
        "text": "Changing user passwords"
      },
      {
        "id": "d",
        "text": "Importing XML files"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Dashboards organize reports and other widgets to provide visual information.",
    "difficulty": "easy",
    "tags": [
      "dashboards",
      "reporting",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-010",
    "topicKey": "platform",
    "question": "Which record-level field is commonly used to indicate when a record was last modified?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "sys_updated_on"
      },
      {
        "id": "b",
        "text": "sys_created_by"
      },
      {
        "id": "c",
        "text": "number"
      },
      {
        "id": "d",
        "text": "active"
      }
    ],
    "correctAnswer": "a",
    "explanation": "sys_updated_on stores the timestamp of the most recent update to the record.",
    "difficulty": "medium",
    "tags": [
      "system-fields",
      "audit",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-011",
    "topicKey": "users",
    "question": "Which table stores user records in ServiceNow?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "sys_user"
      },
      {
        "id": "b",
        "text": "sys_user_group"
      },
      {
        "id": "c",
        "text": "sys_role"
      },
      {
        "id": "d",
        "text": "sys_dictionary"
      }
    ],
    "correctAnswer": "a",
    "explanation": "The sys_user table stores user records.",
    "difficulty": "easy",
    "tags": [
      "users",
      "tables",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-012",
    "topicKey": "users",
    "question": "Which table stores groups?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "sys_user_group"
      },
      {
        "id": "b",
        "text": "sys_user"
      },
      {
        "id": "c",
        "text": "sys_user_has_role"
      },
      {
        "id": "d",
        "text": "sys_dictionary"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Groups are stored in sys_user_group.",
    "difficulty": "easy",
    "tags": [
      "groups",
      "users",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-013",
    "topicKey": "users",
    "question": "What is the primary purpose of a role?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To grant permissions to applications, modules, or data"
      },
      {
        "id": "b",
        "text": "To store a user's email address"
      },
      {
        "id": "c",
        "text": "To create database indexes"
      },
      {
        "id": "d",
        "text": "To schedule reports"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Roles are a core mechanism for controlling access in ServiceNow.",
    "difficulty": "easy",
    "tags": [
      "roles",
      "security",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-014",
    "topicKey": "users",
    "question": "What is the relationship between a group and its members?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A group can contain multiple users"
      },
      {
        "id": "b",
        "text": "A user can belong to only one group"
      },
      {
        "id": "c",
        "text": "Groups cannot contain users"
      },
      {
        "id": "d",
        "text": "Groups are database tables only"
      }
    ],
    "correctAnswer": "a",
    "explanation": "A user can be a member of one or more groups, and groups organize users for work and access.",
    "difficulty": "easy",
    "tags": [
      "groups",
      "users",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-015",
    "topicKey": "users",
    "question": "Which table represents the assignment of roles to users or groups?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "sys_user_has_role"
      },
      {
        "id": "b",
        "text": "sys_user"
      },
      {
        "id": "c",
        "text": "sys_role"
      },
      {
        "id": "d",
        "text": "sys_group_has_role"
      }
    ],
    "correctAnswer": "a",
    "explanation": "sys_user_has_role records role assignments associated with users and groups.",
    "difficulty": "medium",
    "tags": [
      "roles",
      "security",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-016",
    "topicKey": "users",
    "question": "If a user inherits a role through group membership, what does that mean?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "The user receives permissions associated with the role assigned to the group"
      },
      {
        "id": "b",
        "text": "The user becomes a system administrator automatically"
      },
      {
        "id": "c",
        "text": "The user can edit ACLs automatically"
      },
      {
        "id": "d",
        "text": "The role is copied into every table"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Roles can be granted through groups, allowing group members to inherit the associated permissions.",
    "difficulty": "medium",
    "tags": [
      "roles",
      "groups",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-017",
    "topicKey": "users",
    "question": "Which role is generally associated with full administrative access to a ServiceNow instance?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "admin"
      },
      {
        "id": "b",
        "text": "itil"
      },
      {
        "id": "c",
        "text": "catalog"
      },
      {
        "id": "d",
        "text": "approver_user"
      }
    ],
    "correctAnswer": "a",
    "explanation": "The admin role is the broad administrative role; actual access is still subject to platform security behavior.",
    "difficulty": "easy",
    "tags": [
      "admin",
      "roles",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-018",
    "topicKey": "users",
    "question": "What is impersonation useful for an administrator?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Testing what another user can see and do"
      },
      {
        "id": "b",
        "text": "Changing the instance URL"
      },
      {
        "id": "c",
        "text": "Deleting all ACLs"
      },
      {
        "id": "d",
        "text": "Creating a database backup"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Impersonation helps administrators troubleshoot access and user-experience issues from another user's perspective.",
    "difficulty": "easy",
    "tags": [
      "impersonation",
      "security",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-019",
    "topicKey": "users",
    "question": "Which field on a user record is commonly used to enable or disable the user account?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Active"
      },
      {
        "id": "b",
        "text": "Department"
      },
      {
        "id": "c",
        "text": "Title"
      },
      {
        "id": "d",
        "text": "Time zone"
      }
    ],
    "correctAnswer": "a",
    "explanation": "The Active field controls whether the user record is active.",
    "difficulty": "easy",
    "tags": [
      "users",
      "active",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-020",
    "topicKey": "users",
    "question": "A user can see a record but cannot edit it. Which security mechanism should be investigated first?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "ACLs and applicable roles"
      },
      {
        "id": "b",
        "text": "Update Sets"
      },
      {
        "id": "c",
        "text": "Transform Maps"
      },
      {
        "id": "d",
        "text": "Scheduled Jobs"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Access controls determine whether a user can read or write records and fields.",
    "difficulty": "medium",
    "tags": [
      "ACL",
      "security",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-021",
    "topicKey": "lists",
    "question": "Which operator can be used in a list filter to match records whose field begins with a value?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "starts with"
      },
      {
        "id": "b",
        "text": "is empty"
      },
      {
        "id": "c",
        "text": "is one of"
      },
      {
        "id": "d",
        "text": "is not"
      }
    ],
    "correctAnswer": "a",
    "explanation": "The starts with operator matches values beginning with the specified text.",
    "difficulty": "easy",
    "tags": [
      "filters",
      "lists",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-022",
    "topicKey": "lists",
    "question": "What does an encoded query represent?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A compact string representation of filter conditions"
      },
      {
        "id": "b",
        "text": "A database password"
      },
      {
        "id": "c",
        "text": "A JavaScript class"
      },
      {
        "id": "d",
        "text": "An attachment format"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Encoded queries represent ServiceNow query conditions in a compact syntax.",
    "difficulty": "medium",
    "tags": [
      "encoded-query",
      "filters",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-023",
    "topicKey": "lists",
    "question": "What happens when a user personalizes a list?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "The user can change how columns and other list settings are presented"
      },
      {
        "id": "b",
        "text": "The underlying table is deleted"
      },
      {
        "id": "c",
        "text": "All users receive the same change automatically"
      },
      {
        "id": "d",
        "text": "The table's schema is rewritten"
      }
    ],
    "correctAnswer": "a",
    "explanation": "List personalization changes the user's presentation without changing the underlying table definition.",
    "difficulty": "easy",
    "tags": [
      "lists",
      "personalization",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-024",
    "topicKey": "lists",
    "question": "Which action is commonly used to remove a filter condition from a list filter builder?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Remove the condition"
      },
      {
        "id": "b",
        "text": "Delete the table"
      },
      {
        "id": "c",
        "text": "Clear the dictionary"
      },
      {
        "id": "d",
        "text": "Deactivate the application"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Filter conditions can be added or removed using the filter builder.",
    "difficulty": "easy",
    "tags": [
      "filters",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-025",
    "topicKey": "lists",
    "question": "What is a related list?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A list of records related to the current record"
      },
      {
        "id": "b",
        "text": "A list of browser bookmarks"
      },
      {
        "id": "c",
        "text": "A list of inactive users only"
      },
      {
        "id": "d",
        "text": "A list of application menus"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Related lists expose records that have a relationship to the record currently being viewed.",
    "difficulty": "easy",
    "tags": [
      "related-lists",
      "forms",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-026",
    "topicKey": "lists",
    "question": "Which feature lets users sort a list by one or more columns?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "List sorting"
      },
      {
        "id": "b",
        "text": "ACLs"
      },
      {
        "id": "c",
        "text": "Client Scripts"
      },
      {
        "id": "d",
        "text": "Data Policies"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Lists can be sorted using their column headers and list controls.",
    "difficulty": "easy",
    "tags": [
      "lists",
      "sorting",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-027",
    "topicKey": "lists",
    "question": "Why is filtering at the database query level generally preferable to loading every record and filtering only in client-side code?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "It reduces unnecessary data retrieval and improves efficiency"
      },
      {
        "id": "b",
        "text": "It disables ACLs"
      },
      {
        "id": "c",
        "text": "It changes the table schema"
      },
      {
        "id": "d",
        "text": "It prevents indexing"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Efficient queries retrieve only needed data and reduce processing and network overhead.",
    "difficulty": "medium",
    "tags": [
      "queries",
      "performance",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-028",
    "topicKey": "lists",
    "question": "Which field is commonly used as the human-readable value for a referenced record?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Display value"
      },
      {
        "id": "b",
        "text": "sys_id only"
      },
      {
        "id": "c",
        "text": "Dictionary override"
      },
      {
        "id": "d",
        "text": "ACL name"
      }
    ],
    "correctAnswer": "a",
    "explanation": "A reference field can display a configured display value while storing the referenced record's sys_id.",
    "difficulty": "medium",
    "tags": [
      "reference",
      "display-value",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-029",
    "topicKey": "lists",
    "question": "What is a breadcrumb in a ServiceNow list?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A visual representation of the current filter conditions"
      },
      {
        "id": "b",
        "text": "A database index"
      },
      {
        "id": "c",
        "text": "A role assignment"
      },
      {
        "id": "d",
        "text": "An attachment"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Breadcrumbs summarize the filter path applied to the current list.",
    "difficulty": "easy",
    "tags": [
      "filters",
      "breadcrumbs",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-030",
    "topicKey": "lists",
    "question": "Which statement about a list filter is true?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Multiple conditions can be combined to narrow results"
      },
      {
        "id": "b",
        "text": "Only one condition is allowed"
      },
      {
        "id": "c",
        "text": "Filters permanently delete nonmatching records"
      },
      {
        "id": "d",
        "text": "Filters bypass ACLs"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Filter conditions can be combined using logical relationships to narrow the returned records.",
    "difficulty": "easy",
    "tags": [
      "filters",
      "lists",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-031",
    "topicKey": "data",
    "question": "What is a table in ServiceNow?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A collection of records with a defined set of fields"
      },
      {
        "id": "b",
        "text": "A single form section"
      },
      {
        "id": "c",
        "text": "A user role"
      },
      {
        "id": "d",
        "text": "A notification template"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Tables define the structure used to store records and fields.",
    "difficulty": "easy",
    "tags": [
      "tables",
      "data",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-032",
    "topicKey": "data",
    "question": "What is table inheritance?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A child table inherits fields and behavior from a parent table"
      },
      {
        "id": "b",
        "text": "A user inherits a password"
      },
      {
        "id": "c",
        "text": "A report inherits a dashboard"
      },
      {
        "id": "d",
        "text": "A catalog item inherits an email"
      }
    ],
    "correctAnswer": "a",
    "explanation": "ServiceNow tables can extend other tables and inherit fields and platform behavior.",
    "difficulty": "medium",
    "tags": [
      "table-inheritance",
      "data",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-033",
    "topicKey": "data",
    "question": "Which system table stores dictionary entries describing fields?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "sys_dictionary"
      },
      {
        "id": "b",
        "text": "sys_db_object"
      },
      {
        "id": "c",
        "text": "sys_user"
      },
      {
        "id": "d",
        "text": "sys_metadata"
      }
    ],
    "correctAnswer": "a",
    "explanation": "sys_dictionary contains field definitions and dictionary metadata.",
    "difficulty": "medium",
    "tags": [
      "dictionary",
      "fields",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-034",
    "topicKey": "data",
    "question": "Which table stores definitions of database tables?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "sys_db_object"
      },
      {
        "id": "b",
        "text": "sys_dictionary"
      },
      {
        "id": "c",
        "text": "sys_user"
      },
      {
        "id": "d",
        "text": "sys_properties"
      }
    ],
    "correctAnswer": "a",
    "explanation": "sys_db_object contains table definitions.",
    "difficulty": "medium",
    "tags": [
      "tables",
      "dictionary",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-035",
    "topicKey": "data",
    "question": "What is a choice field?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A field whose value is selected from a defined set of choices"
      },
      {
        "id": "b",
        "text": "A reference to any table"
      },
      {
        "id": "c",
        "text": "A file attachment field"
      },
      {
        "id": "d",
        "text": "A field containing executable code"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Choice fields restrict users to defined options such as New, In Progress, or Closed.",
    "difficulty": "easy",
    "tags": [
      "fields",
      "choices",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-036",
    "topicKey": "data",
    "question": "What does a mandatory field require?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A value before the record can be saved in the applicable context"
      },
      {
        "id": "b",
        "text": "A unique sys_id supplied by the user"
      },
      {
        "id": "c",
        "text": "An ACL named mandatory"
      },
      {
        "id": "d",
        "text": "A reference qualifier"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Mandatory fields require a value before saving when the mandatory rule applies.",
    "difficulty": "easy",
    "tags": [
      "fields",
      "mandatory",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-037",
    "topicKey": "data",
    "question": "What is a dictionary override commonly used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Changing a field's behavior for a child table"
      },
      {
        "id": "b",
        "text": "Creating a user"
      },
      {
        "id": "c",
        "text": "Sending email"
      },
      {
        "id": "d",
        "text": "Creating an update set"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Dictionary overrides let administrators change inherited field behavior for an extended table.",
    "difficulty": "medium",
    "tags": [
      "dictionary",
      "inheritance",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-038",
    "topicKey": "data",
    "question": "Which field type is designed to reference a record in another table?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Reference"
      },
      {
        "id": "b",
        "text": "HTML"
      },
      {
        "id": "c",
        "text": "Choice"
      },
      {
        "id": "d",
        "text": "Journal input"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Reference fields create relationships to records in another table.",
    "difficulty": "easy",
    "tags": [
      "reference",
      "fields",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-039",
    "topicKey": "data",
    "question": "Why should administrators avoid unnecessary custom fields and tables?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "They increase complexity, maintenance, and upgrade considerations"
      },
      {
        "id": "b",
        "text": "They always improve performance"
      },
      {
        "id": "c",
        "text": "They eliminate ACLs"
      },
      {
        "id": "d",
        "text": "They are required for every process"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Excess customization can increase technical debt and make upgrades and maintenance harder.",
    "difficulty": "medium",
    "tags": [
      "customization",
      "technical-debt",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-040",
    "topicKey": "data",
    "question": "What is a database index primarily intended to improve?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Query performance for appropriate searches"
      },
      {
        "id": "b",
        "text": "User authentication"
      },
      {
        "id": "c",
        "text": "Email formatting"
      },
      {
        "id": "d",
        "text": "Form color"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Indexes can improve retrieval performance for queries that use indexed fields appropriately.",
    "difficulty": "medium",
    "tags": [
      "indexes",
      "performance",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-041",
    "topicKey": "config",
    "question": "Which tool is commonly used to create and manage custom applications in ServiceNow?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Application Studio"
      },
      {
        "id": "b",
        "text": "Email Client"
      },
      {
        "id": "c",
        "text": "Update Monitor"
      },
      {
        "id": "d",
        "text": "Import Set Runner"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Application Studio provides tools for developing scoped applications.",
    "difficulty": "easy",
    "tags": [
      "application-development",
      "studio",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-042",
    "topicKey": "config",
    "question": "What is a scoped application?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "An application with its own application scope and controlled boundaries"
      },
      {
        "id": "b",
        "text": "A user group"
      },
      {
        "id": "c",
        "text": "A database backup"
      },
      {
        "id": "d",
        "text": "A dashboard filter"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Scoped applications isolate application artifacts and provide controlled boundaries between applications.",
    "difficulty": "medium",
    "tags": [
      "scoped-apps",
      "development",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-043",
    "topicKey": "config",
    "question": "What is an update set used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Capturing configuration changes for movement between instances"
      },
      {
        "id": "b",
        "text": "Storing incident records"
      },
      {
        "id": "c",
        "text": "Creating users"
      },
      {
        "id": "d",
        "text": "Scheduling reports only"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Update sets capture supported configuration changes so they can be transferred between instances.",
    "difficulty": "easy",
    "tags": [
      "update-sets",
      "deployment",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-044",
    "topicKey": "config",
    "question": "Which change is generally not captured as a normal update-set configuration change?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A record's runtime transactional data"
      },
      {
        "id": "b",
        "text": "A business rule definition"
      },
      {
        "id": "c",
        "text": "A client script definition"
      },
      {
        "id": "d",
        "text": "A UI policy definition"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Update sets are for configuration, not ordinary transactional data such as incidents created by users.",
    "difficulty": "medium",
    "tags": [
      "update-sets",
      "configuration",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-045",
    "topicKey": "config",
    "question": "What is the purpose of a UI Policy?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Dynamically control form field behavior such as mandatory, visible, or read-only"
      },
      {
        "id": "b",
        "text": "Run a server-side scheduled job"
      },
      {
        "id": "c",
        "text": "Import CSV data"
      },
      {
        "id": "d",
        "text": "Create a database index"
      }
    ],
    "correctAnswer": "a",
    "explanation": "UI Policies can change field behavior on forms without scripting in many cases.",
    "difficulty": "easy",
    "tags": [
      "ui-policy",
      "forms",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-046",
    "topicKey": "config",
    "question": "What is a Client Script primarily used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Running JavaScript in the user's browser in response to form events"
      },
      {
        "id": "b",
        "text": "Running a database query on a schedule"
      },
      {
        "id": "c",
        "text": "Creating a server backup"
      },
      {
        "id": "d",
        "text": "Managing update sets only"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Client Scripts execute client-side JavaScript for supported form events.",
    "difficulty": "easy",
    "tags": [
      "client-scripts",
      "javascript",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-047",
    "topicKey": "config",
    "question": "Which Client Script type runs when a form is loaded?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "onLoad"
      },
      {
        "id": "b",
        "text": "onSubmit"
      },
      {
        "id": "c",
        "text": "onChange"
      },
      {
        "id": "d",
        "text": "onCellEdit"
      }
    ],
    "correctAnswer": "a",
    "explanation": "The onLoad Client Script runs when the form loads.",
    "difficulty": "easy",
    "tags": [
      "client-scripts",
      "onload",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-048",
    "topicKey": "config",
    "question": "Which Client Script type runs when a user changes a field value?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "onChange"
      },
      {
        "id": "b",
        "text": "onLoad"
      },
      {
        "id": "c",
        "text": "onSubmit"
      },
      {
        "id": "d",
        "text": "onDisplay"
      }
    ],
    "correctAnswer": "a",
    "explanation": "The onChange type responds to changes in a specified field.",
    "difficulty": "easy",
    "tags": [
      "client-scripts",
      "onchange",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-049",
    "topicKey": "config",
    "question": "Which Client Script type can prevent a form submission?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "onSubmit"
      },
      {
        "id": "b",
        "text": "onLoad"
      },
      {
        "id": "c",
        "text": "onChange"
      },
      {
        "id": "d",
        "text": "onCellEdit"
      }
    ],
    "correctAnswer": "a",
    "explanation": "An onSubmit Client Script can return false to prevent submission when appropriate.",
    "difficulty": "medium",
    "tags": [
      "client-scripts",
      "onsubmit",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-050",
    "topicKey": "config",
    "question": "Why is configuration generally preferred over customization when it can meet the requirement?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "It typically reduces complexity and improves maintainability and upgradeability"
      },
      {
        "id": "b",
        "text": "It disables security"
      },
      {
        "id": "c",
        "text": "It prevents testing"
      },
      {
        "id": "d",
        "text": "It requires more scripting"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Using platform capabilities with minimal customization generally reduces technical debt.",
    "difficulty": "medium",
    "tags": [
      "configuration",
      "best-practice",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-051",
    "topicKey": "security",
    "question": "What is an Access Control (ACL) used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Controlling whether users can access records or fields"
      },
      {
        "id": "b",
        "text": "Scheduling reports"
      },
      {
        "id": "c",
        "text": "Creating update sets"
      },
      {
        "id": "d",
        "text": "Formatting email templates"
      }
    ],
    "correctAnswer": "a",
    "explanation": "ACLs define security rules for operations such as read, write, create, and delete.",
    "difficulty": "easy",
    "tags": [
      "acl",
      "security",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-052",
    "topicKey": "security",
    "question": "Which operation does a read ACL control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Whether a user can view data"
      },
      {
        "id": "b",
        "text": "Whether a user can create data"
      },
      {
        "id": "c",
        "text": "Whether a user can delete data"
      },
      {
        "id": "d",
        "text": "Whether a user can schedule reports"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Read ACLs control access to view data.",
    "difficulty": "easy",
    "tags": [
      "acl",
      "read",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-053",
    "topicKey": "security",
    "question": "Which operation does a write ACL control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Whether a user can modify data"
      },
      {
        "id": "b",
        "text": "Whether a user can view data"
      },
      {
        "id": "c",
        "text": "Whether a user can create a table"
      },
      {
        "id": "d",
        "text": "Whether a user can export XML"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Write ACLs control whether a user can modify an existing value.",
    "difficulty": "easy",
    "tags": [
      "acl",
      "write",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-054",
    "topicKey": "security",
    "question": "Which operation does a create ACL control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Whether a user can create a record"
      },
      {
        "id": "b",
        "text": "Whether a user can read a record"
      },
      {
        "id": "c",
        "text": "Whether a user can modify a role"
      },
      {
        "id": "d",
        "text": "Whether a user can view a dashboard"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Create ACLs control the ability to create records.",
    "difficulty": "easy",
    "tags": [
      "acl",
      "create",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-055",
    "topicKey": "security",
    "question": "Which operation does a delete ACL control?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Whether a user can delete a record"
      },
      {
        "id": "b",
        "text": "Whether a user can read a field"
      },
      {
        "id": "c",
        "text": "Whether a user can change a choice label"
      },
      {
        "id": "d",
        "text": "Whether a user can impersonate"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Delete ACLs control the ability to remove records.",
    "difficulty": "easy",
    "tags": [
      "acl",
      "delete",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-056",
    "topicKey": "security",
    "question": "What is the purpose of a field-level ACL?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To control access to a specific field"
      },
      {
        "id": "b",
        "text": "To create a table"
      },
      {
        "id": "c",
        "text": "To define a report"
      },
      {
        "id": "d",
        "text": "To assign a group"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Field-level ACLs can restrict access to individual fields beyond table-level access.",
    "difficulty": "medium",
    "tags": [
      "acl",
      "field-security",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-057",
    "topicKey": "security",
    "question": "Why should ACL conditions and scripts be kept as simple as practical?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To make security easier to understand, test, and maintain"
      },
      {
        "id": "b",
        "text": "To bypass authentication"
      },
      {
        "id": "c",
        "text": "To disable auditing"
      },
      {
        "id": "d",
        "text": "To increase customization"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Simple security logic is easier to troubleshoot and less likely to produce unintended access behavior.",
    "difficulty": "medium",
    "tags": [
      "acl",
      "best-practice",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-058",
    "topicKey": "security",
    "question": "A user has the correct role but still cannot read a record. What should be checked?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Applicable ACLs and their conditions/scripts"
      },
      {
        "id": "b",
        "text": "Only the user's browser cache"
      },
      {
        "id": "c",
        "text": "The dashboard color"
      },
      {
        "id": "d",
        "text": "The update set name"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Having a role does not automatically guarantee access if ACL conditions or scripts deny it.",
    "difficulty": "medium",
    "tags": [
      "acl",
      "troubleshooting",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-059",
    "topicKey": "security",
    "question": "What is the principle of least privilege?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Granting users only the access they need to perform their responsibilities"
      },
      {
        "id": "b",
        "text": "Giving everyone admin"
      },
      {
        "id": "c",
        "text": "Allowing every user to edit every field"
      },
      {
        "id": "d",
        "text": "Disabling all ACLs"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Least privilege reduces unnecessary access and limits security exposure.",
    "difficulty": "easy",
    "tags": [
      "security",
      "least-privilege",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-060",
    "topicKey": "security",
    "question": "True or false: ACLs are evaluated only when a user opens a form.",
    "type": "true-false",
    "options": [
      {
        "id": "a",
        "text": "True"
      },
      {
        "id": "b",
        "text": "False"
      }
    ],
    "correctAnswer": "b",
    "explanation": "ACLs can affect multiple operations and access paths, not just form opening.",
    "difficulty": "easy",
    "tags": [
      "acl",
      "security",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-061",
    "topicKey": "automation",
    "question": "What is a Business Rule primarily used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Running server-side logic when database operations occur"
      },
      {
        "id": "b",
        "text": "Changing browser colors"
      },
      {
        "id": "c",
        "text": "Creating dashboards"
      },
      {
        "id": "d",
        "text": "Selecting catalog variables"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Business Rules execute server-side logic around record operations such as insert, update, or delete.",
    "difficulty": "easy",
    "tags": [
      "business-rules",
      "server-side",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-062",
    "topicKey": "automation",
    "question": "Which Business Rule timing runs before a record is written to the database?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "before"
      },
      {
        "id": "b",
        "text": "after"
      },
      {
        "id": "c",
        "text": "async"
      },
      {
        "id": "d",
        "text": "display"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Before Business Rules run before the database operation completes and can modify the current record.",
    "difficulty": "easy",
    "tags": [
      "business-rules",
      "before",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-063",
    "topicKey": "automation",
    "question": "Which Business Rule timing runs after a database operation?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "after"
      },
      {
        "id": "b",
        "text": "before"
      },
      {
        "id": "c",
        "text": "display"
      },
      {
        "id": "d",
        "text": "onLoad"
      }
    ],
    "correctAnswer": "a",
    "explanation": "After Business Rules execute after the database operation.",
    "difficulty": "easy",
    "tags": [
      "business-rules",
      "after",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-064",
    "topicKey": "automation",
    "question": "What is an asynchronous Business Rule useful for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Performing server-side work that does not need to block the user's transaction"
      },
      {
        "id": "b",
        "text": "Changing a field before validation"
      },
      {
        "id": "c",
        "text": "Rendering a form field"
      },
      {
        "id": "d",
        "text": "Creating a browser alert"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Async processing can move noncritical work out of the user's synchronous transaction.",
    "difficulty": "medium",
    "tags": [
      "business-rules",
      "async",
      "performance",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-065",
    "topicKey": "automation",
    "question": "What is Flow Designer intended to provide?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A low-code way to automate processes and integrate actions"
      },
      {
        "id": "b",
        "text": "A replacement for the database"
      },
      {
        "id": "c",
        "text": "A browser extension"
      },
      {
        "id": "d",
        "text": "A password manager"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Flow Designer provides flow-based automation using triggers, actions, and subflows.",
    "difficulty": "easy",
    "tags": [
      "flow-designer",
      "automation",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-066",
    "topicKey": "automation",
    "question": "What starts a flow in Flow Designer?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A trigger"
      },
      {
        "id": "b",
        "text": "An ACL"
      },
      {
        "id": "c",
        "text": "A dictionary entry"
      },
      {
        "id": "d",
        "text": "A list breadcrumb"
      }
    ],
    "correctAnswer": "a",
    "explanation": "A flow begins when its configured trigger conditions are met.",
    "difficulty": "easy",
    "tags": [
      "flow-designer",
      "triggers",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-067",
    "topicKey": "automation",
    "question": "What is a subflow?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A reusable sequence of actions that can be called by flows"
      },
      {
        "id": "b",
        "text": "A child table"
      },
      {
        "id": "c",
        "text": "A type of ACL"
      },
      {
        "id": "d",
        "text": "A catalog variable"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Subflows package reusable automation logic for use by multiple flows or callers.",
    "difficulty": "medium",
    "tags": [
      "flow-designer",
      "subflows",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-068",
    "topicKey": "automation",
    "question": "What is a Script Include?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A reusable server-side JavaScript class or function"
      },
      {
        "id": "b",
        "text": "A client-side CSS file"
      },
      {
        "id": "c",
        "text": "A report widget"
      },
      {
        "id": "d",
        "text": "A database index"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Script Includes provide reusable server-side JavaScript logic.",
    "difficulty": "easy",
    "tags": [
      "script-includes",
      "javascript",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-069",
    "topicKey": "automation",
    "question": "Which API is commonly used in server-side scripts to query and manipulate records?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "GlideRecord"
      },
      {
        "id": "b",
        "text": "GlideForm"
      },
      {
        "id": "c",
        "text": "Angular"
      },
      {
        "id": "d",
        "text": "HTMLForm"
      }
    ],
    "correctAnswer": "a",
    "explanation": "GlideRecord is a server-side API for working with records.",
    "difficulty": "easy",
    "tags": [
      "gliderecord",
      "server-side",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-070",
    "topicKey": "automation",
    "question": "Which API is commonly used in client-side scripts to interact with the current form?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "GlideForm (g_form)"
      },
      {
        "id": "b",
        "text": "GlideRecord"
      },
      {
        "id": "c",
        "text": "GlideSystem"
      },
      {
        "id": "d",
        "text": "GlideAggregate"
      }
    ],
    "correctAnswer": "a",
    "explanation": "g_form provides client-side access to the current form and its fields.",
    "difficulty": "easy",
    "tags": [
      "g_form",
      "client-side",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-071",
    "topicKey": "catalog",
    "question": "What is a Service Catalog?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A user-facing store of services and requests that can be submitted"
      },
      {
        "id": "b",
        "text": "A database index manager"
      },
      {
        "id": "c",
        "text": "A role editor"
      },
      {
        "id": "d",
        "text": "A system log"
      }
    ],
    "correctAnswer": "a",
    "explanation": "The Service Catalog presents requestable services and items to users.",
    "difficulty": "easy",
    "tags": [
      "service-catalog",
      "requests",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-072",
    "topicKey": "catalog",
    "question": "What is a catalog item?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A requestable offering in the Service Catalog"
      },
      {
        "id": "b",
        "text": "A database table"
      },
      {
        "id": "c",
        "text": "An ACL"
      },
      {
        "id": "d",
        "text": "A user group"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Catalog items represent requestable products or services.",
    "difficulty": "easy",
    "tags": [
      "catalog-item",
      "service-catalog",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-073",
    "topicKey": "catalog",
    "question": "What is a record producer?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A catalog-based interface that creates a record in a target table"
      },
      {
        "id": "b",
        "text": "A report that creates charts"
      },
      {
        "id": "c",
        "text": "A database backup"
      },
      {
        "id": "d",
        "text": "A notification template"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Record Producers provide a catalog-style form that creates a record in a target table.",
    "difficulty": "easy",
    "tags": [
      "record-producer",
      "catalog",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-074",
    "topicKey": "catalog",
    "question": "What is a variable in a catalog item used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Collecting information from the requester"
      },
      {
        "id": "b",
        "text": "Defining a database index"
      },
      {
        "id": "c",
        "text": "Creating a role"
      },
      {
        "id": "d",
        "text": "Changing the instance URL"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Catalog variables collect input that can be used during request fulfillment.",
    "difficulty": "easy",
    "tags": [
      "catalog-variables",
      "catalog",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-075",
    "topicKey": "catalog",
    "question": "What is a variable set?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A reusable collection of catalog variables"
      },
      {
        "id": "b",
        "text": "A group of ACLs"
      },
      {
        "id": "c",
        "text": "A database schema"
      },
      {
        "id": "d",
        "text": "A dashboard"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Variable sets allow commonly used catalog variables to be reused across catalog items.",
    "difficulty": "medium",
    "tags": [
      "variable-sets",
      "catalog",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-076",
    "topicKey": "catalog",
    "question": "What is a catalog client script used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Client-side behavior for catalog forms and variables"
      },
      {
        "id": "b",
        "text": "Server-side database backups"
      },
      {
        "id": "c",
        "text": "Creating update sets"
      },
      {
        "id": "d",
        "text": "Managing roles"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Catalog Client Scripts control client-side behavior in catalog item forms.",
    "difficulty": "easy",
    "tags": [
      "catalog-client-script",
      "catalog",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-077",
    "topicKey": "catalog",
    "question": "What is a reference qualifier commonly used for in a catalog variable?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Restricting which reference records can be selected"
      },
      {
        "id": "b",
        "text": "Sending email"
      },
      {
        "id": "c",
        "text": "Creating an incident"
      },
      {
        "id": "d",
        "text": "Changing a user's role"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Reference qualifiers filter the records available for selection in reference fields or variables.",
    "difficulty": "medium",
    "tags": [
      "reference-qualifier",
      "catalog",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-078",
    "topicKey": "catalog",
    "question": "What is the purpose of a request item (RITM)?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "It represents an individual requested catalog item within a request"
      },
      {
        "id": "b",
        "text": "It stores a user's password"
      },
      {
        "id": "c",
        "text": "It defines a database table"
      },
      {
        "id": "d",
        "text": "It is an ACL record"
      }
    ],
    "correctAnswer": "a",
    "explanation": "A request can contain one or more requested items, commonly represented by RITM records.",
    "difficulty": "medium",
    "tags": [
      "ritm",
      "requests",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-079",
    "topicKey": "catalog",
    "question": "Which record commonly represents the overall request submitted by a user?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Request (REQ)"
      },
      {
        "id": "b",
        "text": "Requested Item (RITM)"
      },
      {
        "id": "c",
        "text": "Catalog Task (SCTASK)"
      },
      {
        "id": "d",
        "text": "Incident (INC)"
      }
    ],
    "correctAnswer": "a",
    "explanation": "The request record represents the overall request, while RITMs represent requested items within it.",
    "difficulty": "medium",
    "tags": [
      "req",
      "ritm",
      "catalog",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-080",
    "topicKey": "catalog",
    "question": "What is a catalog task commonly used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Assigning fulfillment work needed to complete a requested item"
      },
      {
        "id": "b",
        "text": "Defining an ACL"
      },
      {
        "id": "c",
        "text": "Creating a table"
      },
      {
        "id": "d",
        "text": "Storing a dashboard"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Catalog Tasks can represent individual fulfillment activities for requested items.",
    "difficulty": "easy",
    "tags": [
      "catalog-task",
      "fulfillment",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-081",
    "topicKey": "data-mgmt",
    "question": "What is an Import Set?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A staging area for imported data before it is transformed into target records"
      },
      {
        "id": "b",
        "text": "A dashboard"
      },
      {
        "id": "c",
        "text": "A user group"
      },
      {
        "id": "d",
        "text": "An ACL"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Import Sets stage incoming data for transformation and loading.",
    "difficulty": "easy",
    "tags": [
      "import-sets",
      "data-import",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-082",
    "topicKey": "data-mgmt",
    "question": "What is a Transform Map?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A definition that maps imported source fields to target fields and controls transformation"
      },
      {
        "id": "b",
        "text": "A report filter"
      },
      {
        "id": "c",
        "text": "A user role"
      },
      {
        "id": "d",
        "text": "A form layout"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Transform Maps define how imported data maps and transforms into target table records.",
    "difficulty": "easy",
    "tags": [
      "transform-map",
      "data-import",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-083",
    "topicKey": "data-mgmt",
    "question": "What is coalesce used for in a Transform Map?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To identify existing target records for update instead of creating duplicates"
      },
      {
        "id": "b",
        "text": "To encrypt fields"
      },
      {
        "id": "c",
        "text": "To send notifications"
      },
      {
        "id": "d",
        "text": "To create indexes"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Coalesce fields help determine whether an imported row should match an existing target record.",
    "difficulty": "medium",
    "tags": [
      "coalesce",
      "transform-map",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-084",
    "topicKey": "data-mgmt",
    "question": "What is a transform script used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Applying custom logic during data transformation"
      },
      {
        "id": "b",
        "text": "Changing the instance theme"
      },
      {
        "id": "c",
        "text": "Creating a user role"
      },
      {
        "id": "d",
        "text": "Building a dashboard"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Transform scripts can manipulate source or target values during an import.",
    "difficulty": "medium",
    "tags": [
      "transform-scripts",
      "data-import",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-085",
    "topicKey": "data-mgmt",
    "question": "Which format is commonly used to import tabular data into ServiceNow?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "CSV"
      },
      {
        "id": "b",
        "text": "MP3"
      },
      {
        "id": "c",
        "text": "EXE"
      },
      {
        "id": "d",
        "text": "PSD"
      }
    ],
    "correctAnswer": "a",
    "explanation": "CSV is a common tabular import format supported by ServiceNow import processes.",
    "difficulty": "easy",
    "tags": [
      "csv",
      "imports",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-086",
    "topicKey": "data-mgmt",
    "question": "Why should imported data be validated before production loading?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To prevent inaccurate, duplicate, or incomplete records"
      },
      {
        "id": "b",
        "text": "To disable ACLs"
      },
      {
        "id": "c",
        "text": "To remove all indexes"
      },
      {
        "id": "d",
        "text": "To make all users administrators"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Validation reduces the risk of corrupting production data or creating unintended records.",
    "difficulty": "easy",
    "tags": [
      "data-quality",
      "imports",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-087",
    "topicKey": "data-mgmt",
    "question": "What does coalescing help prevent?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Unintended duplicate target records"
      },
      {
        "id": "b",
        "text": "Unauthorized logins"
      },
      {
        "id": "c",
        "text": "Missing dashboards"
      },
      {
        "id": "d",
        "text": "Slow browser rendering"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Proper coalesce configuration helps match incoming data to existing records.",
    "difficulty": "medium",
    "tags": [
      "coalesce",
      "duplicates",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-088",
    "topicKey": "data-mgmt",
    "question": "What is data mapping?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Defining how source data corresponds to target fields"
      },
      {
        "id": "b",
        "text": "Defining user passwords"
      },
      {
        "id": "c",
        "text": "Creating ACL conditions"
      },
      {
        "id": "d",
        "text": "Designing a dashboard"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Mapping establishes the relationship between source fields and target fields.",
    "difficulty": "easy",
    "tags": [
      "mapping",
      "imports",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-089",
    "topicKey": "data-mgmt",
    "question": "Which approach is generally safer for a large import?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Test and validate the import in a non-production environment first"
      },
      {
        "id": "b",
        "text": "Run it directly in production without review"
      },
      {
        "id": "c",
        "text": "Disable all security"
      },
      {
        "id": "d",
        "text": "Delete existing data first"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Testing in a lower environment helps identify mapping and data-quality issues before production.",
    "difficulty": "easy",
    "tags": [
      "imports",
      "best-practice",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-090",
    "topicKey": "data-mgmt",
    "question": "True or false: An Import Set is itself the final target table where the business records are stored.",
    "type": "true-false",
    "options": [
      {
        "id": "a",
        "text": "True"
      },
      {
        "id": "b",
        "text": "False"
      }
    ],
    "correctAnswer": "b",
    "explanation": "Import Sets are staging structures; Transform Maps load data into target tables.",
    "difficulty": "easy",
    "tags": [
      "import-sets",
      "transform-map",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-091",
    "topicKey": "reporting",
    "question": "What is a ServiceNow report?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A visualization or tabular presentation of queried data"
      },
      {
        "id": "b",
        "text": "A database table"
      },
      {
        "id": "c",
        "text": "An ACL"
      },
      {
        "id": "d",
        "text": "A catalog variable"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Reports present data returned by a query in a selected visualization.",
    "difficulty": "easy",
    "tags": [
      "reporting",
      "reports",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-092",
    "topicKey": "reporting",
    "question": "Which chart type is useful for showing trends over time?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Time series"
      },
      {
        "id": "b",
        "text": "Pie chart only"
      },
      {
        "id": "c",
        "text": "Gauge only"
      },
      {
        "id": "d",
        "text": "Single-value text"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Time-based charts such as line charts are commonly used to show trends.",
    "difficulty": "easy",
    "tags": [
      "reports",
      "charts",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-093",
    "topicKey": "reporting",
    "question": "What does a report filter determine?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Which records are included in the report"
      },
      {
        "id": "b",
        "text": "Which users can log in"
      },
      {
        "id": "c",
        "text": "Which roles are created"
      },
      {
        "id": "d",
        "text": "Which tables are deleted"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Report filters define the data set included in the report.",
    "difficulty": "easy",
    "tags": [
      "reports",
      "filters",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-094",
    "topicKey": "reporting",
    "question": "What is a dashboard?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A page that can contain multiple reports and visual components"
      },
      {
        "id": "b",
        "text": "A database index"
      },
      {
        "id": "c",
        "text": "A transform map"
      },
      {
        "id": "d",
        "text": "A user record"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Dashboards combine visualizations and other widgets into a consolidated view.",
    "difficulty": "easy",
    "tags": [
      "dashboards",
      "reports",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-095",
    "topicKey": "reporting",
    "question": "Why should reports use appropriate filters?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "To return relevant data and avoid unnecessary processing"
      },
      {
        "id": "b",
        "text": "To bypass ACLs"
      },
      {
        "id": "c",
        "text": "To create roles automatically"
      },
      {
        "id": "d",
        "text": "To change table inheritance"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Focused queries improve relevance and can reduce unnecessary processing.",
    "difficulty": "medium",
    "tags": [
      "reporting",
      "performance",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-096",
    "topicKey": "reporting",
    "question": "What is a scheduled report used for?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Automatically delivering report results on a defined schedule"
      },
      {
        "id": "b",
        "text": "Creating a new table every day"
      },
      {
        "id": "c",
        "text": "Changing ACLs"
      },
      {
        "id": "d",
        "text": "Running client scripts"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Scheduled reports automate report delivery to configured recipients.",
    "difficulty": "easy",
    "tags": [
      "scheduled-reports",
      "reporting",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-097",
    "topicKey": "reporting",
    "question": "Which aggregation is commonly used to count records by category?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Count"
      },
      {
        "id": "b",
        "text": "Median only"
      },
      {
        "id": "c",
        "text": "Attachment"
      },
      {
        "id": "d",
        "text": "Reference"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Count aggregation determines how many records fall into each group.",
    "difficulty": "easy",
    "tags": [
      "aggregation",
      "reports",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-098",
    "topicKey": "reporting",
    "question": "What does grouping a report do?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "Organizes records by a selected field or dimension"
      },
      {
        "id": "b",
        "text": "Deletes duplicate records"
      },
      {
        "id": "c",
        "text": "Creates a new role"
      },
      {
        "id": "d",
        "text": "Changes the field type"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Grouping organizes report results into categories based on selected fields.",
    "difficulty": "easy",
    "tags": [
      "grouping",
      "reports",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-099",
    "topicKey": "reporting",
    "question": "What is a KPI intended to provide?",
    "type": "multiple-choice",
    "options": [
      {
        "id": "a",
        "text": "A measurable indicator of performance or progress"
      },
      {
        "id": "b",
        "text": "A database password"
      },
      {
        "id": "c",
        "text": "A catalog variable"
      },
      {
        "id": "d",
        "text": "An update set"
      }
    ],
    "correctAnswer": "a",
    "explanation": "KPIs provide measurable indicators used to monitor performance or outcomes.",
    "difficulty": "medium",
    "tags": [
      "kpi",
      "performance",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  },
  {
    "seedId": "csa-100",
    "topicKey": "reporting",
    "question": "True or false: A report can be based on a table and use filter conditions to limit its data.",
    "type": "true-false",
    "options": [
      {
        "id": "a",
        "text": "True"
      },
      {
        "id": "b",
        "text": "False"
      }
    ],
    "correctAnswer": "a",
    "explanation": "Reports commonly query a table and apply conditions to determine which records are included.",
    "difficulty": "easy",
    "tags": [
      "reports",
      "filters",
      "csa"
    ],
    "sourceType": "original",
    "status": "published"
  }
] as const;
