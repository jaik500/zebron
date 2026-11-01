import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 4,
  id: "servicenow-admin-security",
  title: "Users, Groups, Roles and Access Control",
  summary: "Course 4 of 8 in the Zebron ServiceNow Administrator Program. Managing who can sign in and what they can do: users, groups, roles, ACLs, impersonation and auditing.",
  description: `
Access is the heart of administration. This course covers user and group records, how roles grant capabilities, how Access Control Lists (ACLs) protect every table and field, elevated roles, impersonation for testing, and how auditing records who changed what.

Each lesson ends with a quick check. The final exam is drawn from the **Users, Groups, Roles and Access Control** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "violet",
  outcomes: [
    "Create and manage users and groups, and know the tables behind them",
    "Grant roles through groups and explain role inheritance",
    "Explain how ACLs are evaluated for tables and fields",
    "Use elevated roles and impersonation safely",
    "Find who changed a record with history and auditing",
  ],
  skills: ["User administration", "Groups and roles", "Access Control Lists", "Impersonation", "Auditing"],
  quiz: {
    name: "Users, Groups, Roles and Access Control",
    slug: "servicenow-admin-security",
    description: "Practice questions for Course 4 of the ServiceNow Administrator Program: users, groups, roles, ACLs, impersonation and auditing.",
    tags: ["servicenow", "csa", "security", "acl"],
  },
  topics: [
    { key: "users-groups", name: "Users and groups", description: "User records, groups, membership and the tables behind them." },
    { key: "roles", name: "Roles", description: "Granting roles, contains roles, common roles and elevated roles." },
    { key: "acls", name: "Access Control Lists", description: "ACL types, operations and evaluation order." },
    { key: "impersonation", name: "Impersonation and testing access", description: "Impersonating users and troubleshooting access." },
    { key: "auditing", name: "Auditing and history", description: "Audit, history, activity stream and security logs." },
  ],
  modules: [
    {
      id: "identity",
      title: "Users, groups and roles",
      lessons: [
        {
          id: "users-groups",
          title: "Users and groups",
          minutes: 11,
          blocks: [
            text(`
## Users

Every person who signs in has a **User** record (\`sys_user\`): user ID, name, email, department, location, manager, time zone and an **Active** flag. Users can sign in with a local password or, much more commonly, through **single sign-on** (SAML or OpenID Connect) with your identity provider. Many organisations also sync users automatically from **LDAP** or their identity provider, so admins rarely create them by hand.

Deactivate leavers (Active = false, or lock the account) instead of deleting them, so their history stays intact.

## Groups

A **group** (\`sys_user_group\`) is a set of users, usually a team such as "Service Desk" or "Network". Groups are used to:

- **Assign work**: tasks have an *Assignment group* and an *Assigned to* user from that group.
- **Grant roles**: every member gets the group's roles.
- **Route approvals and notifications**.

Group membership is stored in \`sys_user_grmember\`. A group can have a **manager** and a **parent** group.
`),
            text(`
## Tables to know

| Table | Holds |
| --- | --- |
| \`sys_user\` | Users |
| \`sys_user_group\` | Groups |
| \`sys_user_grmember\` | Which users are in which groups |
| \`sys_user_role\` | Roles |
| \`sys_user_has_role\` | Which users have which roles (including inherited ones) |
| \`sys_group_has_role\` | Which groups have which roles |

Use these list names with \`.list\` in the navigator when you need to check or report on access.
`),
            tip("A group with no manager and no description becomes a mystery in a year. Fill both in when you create it."),
            check(
              "Which table stores the link between users and the groups they belong to?",
              ["sys_user_grmember", "sys_properties", "task"],
              0,
              "sys_user_grmember holds group memberships.",
            ),
          ],
        },
        {
          id: "roles",
          title: "Roles and elevated roles",
          minutes: 12,
          blocks: [
            text(`
## What roles do

A **role** grants access to applications, modules and data. ACLs, modules and features check for roles. Common roles:

| Role | Gives |
| --- | --- |
| \`admin\` | Almost everything |
| \`itil\` | Fulfiller access to Incident, Problem and Change |
| \`itil_admin\` | Extra ITSM administration |
| \`catalog_admin\` | Manage the service catalog |
| \`knowledge_admin\` | Manage knowledge bases |
| \`report_admin\` | Manage reports |
| \`approver_user\` | Approve requests without fulfiller rights |
| \`snc_internal\` | Basic internal user (employees) |

## Best practice: roles through groups

Give roles to **groups**, then add users to groups. When someone changes team, moving them between groups updates their access in one step, and you can see why each user has each role.

Roles can **contain** other roles: granting \`itil_admin\` also grants \`itil\`. The user's role list shows inherited roles too.
`),
            text(`
## Elevated roles

Some powerful roles are **elevated privilege** roles. Having them is not enough: the user must deliberately **elevate** for the session (user menu → **Elevate role**). The main one is **\`security_admin\`**, needed to create or change **ACLs** and certain security settings.

This protects against accidental changes and limits how long powerful rights are active.

## Least privilege

- Only a few people need \`admin\` in production.
- Use specific roles (\`catalog_admin\`, \`knowledge_admin\`) instead of \`admin\` when possible.
- Review role assignments regularly, especially for \`admin\` and \`security_admin\`.
`),
            tip("If someone asks for admin \"just to fix one thing\", find the specific role that covers it. It is almost always there."),
            check(
              "Which role must be elevated to change ACLs?",
              ["itil", "security_admin", "approver_user"],
              1,
              "security_admin is an elevated privilege role required for ACL changes.",
            ),
          ],
        },
      ],
    },
    {
      id: "access-control",
      title: "Access control and auditing",
      lessons: [
        {
          id: "acls",
          title: "Access Control Lists",
          minutes: 14,
          blocks: [
            text(`
## What an ACL is

An **Access Control List (ACL)** rule decides whether a user can perform an **operation** on a **table** or **field**. Operations include **read**, **write**, **create** and **delete** (and others such as execute for scripts and report_view).

An ACL can check three things, and **all that are set must pass**:

1. **Roles**: the user has at least one of the listed roles.
2. **Condition**: the record matches a condition (for example *Active is true*).
3. **Script**: a script returns true (for example "the user is the caller").

## Naming

| ACL name | Protects |
| --- | --- |
| \`incident\` | Incident records (table level, often written \`incident.None\`) |
| \`incident.*\` | Every field on Incident (field level, wildcard) |
| \`incident.short_description\` | One field |
`),
            text(`
## How evaluation works

For a user to read a field on a record, they must pass **both**:

1. A **table-level** ACL for the operation (\`incident\`), and
2. A **field-level** ACL (\`incident.short_description\` or \`incident.*\`).

The platform looks for the **most specific** match first, then moves to more general ones: the exact table and field, then the parent table's field (\`task.short_description\`), then wildcards (\`incident.*\`, \`task.*\`, \`*.*\`). If several ACLs match at the most specific level, passing **any one** of them is enough.

If no ACL matches at all, the result depends on the instance's default security mode; with the recommended **high-security** settings, access is **denied by default**.

## Debugging

Use **Session debug → Debug Security Rules** (or the Access Analyzer in newer releases) to see which ACLs were evaluated and why access was granted or denied. Combine it with impersonation.
`),
            tip("Write ACLs that are as broad as possible but as narrow as necessary. Dozens of overlapping field ACLs are hard to understand and slow to evaluate."),
            check(
              "A user passes the field ACL for incident.short_description but fails the table ACL for incident. Can they read the field?",
              ["Yes", "No", "Only on weekends"],
              1,
              "They must pass both the table-level and the field-level ACL.",
            ),
          ],
        },
        {
          id: "impersonation",
          title: "Impersonation and troubleshooting access",
          minutes: 10,
          blocks: [
            text(`
## Impersonating a user

Admins (and users with the \`impersonator\` role) can **impersonate** another user from the user menu. The interface then behaves exactly as it would for that person: menus, lists, forms, portals and ACLs.

Use it to:

- Test a new role, group or ACL before telling users it works.
- Reproduce a user's "I can't see it" problem.
- Check a portal or catalog item as an end user.

Cautions:

- Actions taken while impersonating are recorded as that user (the system log notes the impersonation). Prefer sub-production for testing changes.
- You cannot impersonate to gain more rights than an admin already has, and impersonating admins is restricted in some configurations.
- End impersonation when finished.
`),
            text(`
## A troubleshooting routine

When a user cannot see or edit something:

1. **Impersonate** the user and reproduce the problem.
2. Check their **roles** (including inherited ones) and **groups**.
3. Turn on **Debug Security Rules** and repeat the action to see which ACL denies it.
4. Check **UI policies** and **data policies** if a field is read-only or hidden rather than missing.
5. Check **before query business rules** or **query filters** that might hide records.
6. Fix the cause (usually a group membership or role), then test again as the user.
`),
            tip("Note the user's time zone and language when impersonating. Dates and labels may look different from your own view, which matters when they report a problem."),
            check(
              "What is the first step when a user says they cannot see a record?",
              ["Give them admin", "Impersonate them and reproduce the problem", "Delete the record"],
              1,
              "Seeing the problem as the user is the fastest way to find the cause.",
            ),
          ],
        },
        {
          id: "auditing",
          title: "Auditing and history",
          minutes: 10,
          blocks: [
            text(`
## Who changed what

ServiceNow keeps several records of activity:

- **Audit** (\`sys_audit\`): every change to audited tables, field by field, with old value, new value, user and time. Many core tables are audited by default; auditing is controlled on the table's dictionary entry (and fields can be excluded).
- **History** (from the form context menu → History → List or Calendar): a readable view of a record's changes built from the audit data.
- **Activity stream**: the journal (comments, work notes) and selected field changes, shown on the form.
- **Deleted records**: the **Deleted Records** module (\`sys_audit_delete\`) can often restore deleted records from audited tables.
`),
            text(`
## Security logs

- **Transaction logs** record requests to the instance.
- **System log** (System Logs → All) records errors, warnings and script messages.
- **Login history** and the **Authentication** logs show sign-ins and failures.
- **Event log** (\`sysevent\`) shows events fired by the platform (used by notifications in Course 7).

Auditing high-volume tables (such as logs) can harm performance, so audit what matters for accountability: users, roles, groups, ACLs, properties and business records.

Combine audit data with reports to answer questions such as "Who added the admin role to this user, and when?".
`),
            tip("Practise restoring a deleted record in your PDI. Knowing it is possible, and how, calms a lot of panicked phone calls."),
            check(
              "Which table records field-by-field changes on audited tables?",
              ["sys_audit", "sys_properties", "sys_choice"],
              0,
              "sys_audit stores the audit trail.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Users and groups ----------------
    mc("users-groups", "easy", "Which table stores groups?", ["sys_user_group", "sys_user", "sys_group_has_role", "task"], 0, "Groups are stored in sys_user_group."),
    mc("users-groups", "easy", "An employee leaves the company. What should usually happen to their user record?", ["Delete it", "Deactivate it (Active = false)", "Rename it", "Give it admin"], 1, "Deactivating preserves history and references."),
    mc("users-groups", "medium", "Which two fields on a task route work to a team and a person?", ["Assignment group and Assigned to", "Caller and Opened by", "Category and Subcategory", "Impact and Urgency"], 0, "Assignment group selects the team; Assigned to selects a member of it."),
    tf("users-groups", "medium", "Users are often created and updated automatically from LDAP or an identity provider rather than by hand.", true, "Integrations keep users in sync with the company directory."),
    st("users-groups", "medium", "What is the table name that stores which roles each user has?", ["sys_user_has_role"], "sys_user_has_role lists each user's roles, including inherited ones."),

    // ---------------- Roles ----------------
    mc("roles", "easy", "What is the recommended way to grant roles?", ["Directly to each user", "To groups, then add users to the groups", "Through system properties", "Through email"], 1, "Group-based roles are easier to manage and audit."),
    mc("roles", "medium", "A user has the itil_admin role. What else do they effectively have?", ["Nothing else", "The itil role, because itil_admin contains it", "security_admin", "Every role in the instance"], 1, "Roles can contain other roles, which are inherited."),
    mc("roles", "medium", "What must a user with the security_admin role do before editing ACLs?", ["Log out and back in", "Elevate the role for the session", "Ask ServiceNow support", "Clone the instance"], 1, "security_admin is an elevated privilege role that must be activated for the session."),
    mc("roles", "medium", "Which role lets someone approve requests without giving them fulfiller rights?", ["approver_user", "itil", "admin", "catalog_admin"], 0, "approver_user allows approvals without full ITIL fulfiller access."),
    ms("roles", "medium", "Which follow least privilege? Select all that apply.", ["Granting catalog_admin instead of admin to a catalog manager", "Reviewing who has admin every quarter", "Giving admin to all service desk agents", "Using group-based roles"], [0, 1, 3], "Specific roles, regular reviews and group-based assignment support least privilege."),

    // ---------------- ACLs ----------------
    mc("acls", "easy", "Which operations can ACLs control? Choose the best answer.", ["Read, write, create and delete", "Only read", "Only delete", "Only reports"], 0, "ACLs control read, write, create and delete (and some other operations)."),
    mc("acls", "medium", "An ACL has a role, a condition and a script. When does it grant access?", ["When any one passes", "When all of them pass", "Only when the script passes", "Never"], 1, "Every part that is set must pass."),
    mc("acls", "medium", "What does an ACL named incident.* protect?", ["The Incident table record level only", "Every field on the Incident table", "All tables", "Only the number field"], 1, "The wildcard field ACL applies to all fields without a more specific ACL."),
    ord("acls", "hard", "Put these ACLs in the order the platform checks them for the short_description field on Incident, most specific first.", ["incident.short_description", "task.short_description", "incident.*", "task.*", "*.*"], "The platform matches the specific table and field, then the parent table's field, then table wildcards, then the global wildcard."),
    tf("acls", "medium", "To read a field, a user must pass both a table-level ACL and a field-level ACL.", true, "Table and field ACLs are both evaluated."),

    // ---------------- Impersonation ----------------
    mc("impersonation", "easy", "Why do admins impersonate users?", ["To see the platform exactly as that user does", "To reset passwords", "To delete accounts", "To speed up the instance"], 0, "Impersonation is the main way to test access and reproduce problems."),
    tf("impersonation", "medium", "Actions taken while impersonating are recorded as the impersonated user.", true, "That is why changes during impersonation should be careful, ideally in sub-production."),
    mc("impersonation", "medium", "Which tool shows which ACLs allowed or denied an action?", ["Debug Security Rules", "Theme Builder", "Form Builder", "Import log"], 0, "Session debug for security rules shows each ACL evaluation."),
    mc("impersonation", "medium", "A user can see an incident but a field is greyed out. Besides ACLs, what might cause it?", ["A UI policy or data policy making it read-only", "The instance is offline", "The user's time zone", "The report is scheduled"], 0, "UI and data policies can make fields read-only."),
    mc("impersonation", "medium", "Which role lets a non-admin impersonate users?", ["impersonator", "itil", "approver_user", "snc_external"], 0, "The impersonator role grants the ability to impersonate."),

    // ---------------- Auditing ----------------
    mc("auditing", "easy", "Where can you see a readable list of changes to a single record?", ["Form context menu → History", "Theme Builder", "Plugins", "Update sets"], 0, "History shows a record's changes over time."),
    mc("auditing", "medium", "Which module can often restore a record deleted from an audited table?", ["Deleted Records", "Import Sets", "Service Catalog", "Flow Designer"], 0, "Deleted Records (sys_audit_delete) lets admins restore audited deletions."),
    ms("auditing", "medium", "Which are good candidates for auditing? Select all that apply.", ["User role assignments", "ACL changes", "System property changes", "Every line of a high-volume log table"], [0, 1, 2], "Audit what matters for accountability; auditing high-volume logs hurts performance."),
    tf("auditing", "easy", "The activity stream on a form shows comments and work notes.", true, "Journal entries and selected field changes appear in the activity stream."),
    mc("auditing", "medium", "Where do you look for script errors and warnings on the instance?", ["System Logs → All (system log)", "Knowledge base", "Service Portal", "User preferences"], 0, "The system log records errors, warnings and script messages."),
  ],
};
