import { check, mc, ms, text, tf, tip } from "../lib/program-helpers.mjs";

/**
 * CSA readiness: the CSA exam blueprint areas the eight ServiceNow
 * Administrator Program courses only touch on. Step 9 of the ServiceNow
 * CSA exam preparation track. Questions are multiple choice, multiple
 * select and true/false only, like the real exam.
 */
export default {
  order: 9,
  id: "servicenow-csa-readiness",
  title: "ServiceNow CSA Readiness: Remaining Blueprint Areas",
  summary: "Step 9 of the ServiceNow CSA exam preparation track. Task management and Visual Task Boards, form templates and tags, applications and plugins, platform security and the shared responsibility model, and scripting basics.",
  description: `
The eight ServiceNow Administrator Program courses cover most of the CSA exam blueprint. This course fills in the rest, so every blueprint area is taught and tested before you take the practice exam.

Practise every lesson on a free Personal Developer Instance (developer.servicenow.com). The final exam is drawn from the **ServiceNow CSA Readiness** quiz in the Test Center.

*Zebron is not affiliated with or endorsed by ServiceNow. ServiceNow and Certified System Administrator are trademarks of ServiceNow, Inc.*
`.trim(),
  level: "intermediate",
  cover: "teal",
  outcomes: [
    "Explain the Task table and work with tasks on Visual Task Boards",
    "Use form templates, tags and the different save options",
    "Install applications and plugins and explain how they are licensed and activated",
    "Describe platform security features and who is responsible for what",
    "Choose between a UI policy, client script, business rule and script include",
  ],
  skills: ["Task management", "Visual Task Boards", "Application Manager", "Instance security", "Scripting basics"],
  quiz: {
    name: "ServiceNow CSA Readiness: Remaining Blueprint Areas",
    slug: "servicenow-csa-readiness",
    description: "Practice questions for step 9 of the ServiceNow CSA exam preparation track.",
    tags: ["servicenow", "csa", "exam-prep"],
  },
  topics: [
    { key: "task-management", name: "Task management and Visual Task Boards", description: "The Task table, assignment, activity and Visual Task Boards." },
    { key: "form-tools", name: "Form templates, tags and saving", description: "Templates, tags, Save, Update, Insert and Insert and Stay." },
    { key: "applications-plugins", name: "Applications and plugins", description: "Application Manager, plugins, the Store and activation." },
    { key: "platform-security", name: "Platform security", description: "Shared responsibility, security features, MFA, IP restrictions and hardening." },
    { key: "scripting", name: "Scripting in ServiceNow", description: "Where scripts run, when to script, and the main script types." },
  ],
  modules: [
    {
      id: "collaboration-tools",
      title: "Collaboration tools",
      lessons: [
        {
          id: "task-management",
          title: "Task management and Visual Task Boards",
          minutes: 12,
          blocks: [
            text(`
## The Task table

**Task [task]** is the parent table for work that people are assigned. Incident, Problem, Change Request, Requested Item and Catalog Task all **extend** Task, so they inherit its fields:

| Field | What it holds |
| --- | --- |
| Number | A unique, prefixed number (INC, PRB, CHG, RITM, SCTASK) |
| Assignment group / Assigned to | Who owns the work |
| State | Where the work is in its lifecycle |
| Priority | Usually calculated from **impact** and **urgency** |
| Short description / Description | What the work is |
| Work notes / Additional comments | Internal notes / comments the caller can see |

Because every task shares these fields, features such as assignment rules, SLAs, approvals, the activity stream and Visual Task Boards work the same way on every task table.

## Work notes or comments?

- **Work notes** are internal: the fulfillers see them, the caller does not.
- **Additional comments** are customer-visible and usually send the caller an email.
`),
            text(`
## Visual Task Boards (VTBs)

A **Visual Task Board** shows tasks as **cards** in **lanes**, like a kanban board. Moving a card between lanes updates the record.

| Board type | How it is built | Moving a card |
| --- | --- | --- |
| **Freeform** | Add any tasks by hand; lanes are just labels | Changes nothing on the record |
| **Guided** | Built from a list filter on a task table; lanes come from a field such as State or Assigned to | **Updates that field** on the record |
| **Flexible** | Built from a list filter; lanes are your own labels | Changes nothing on the record |

- Create one from **Visual Task Boards** in the navigator, or from a task list with **Show Visual Task Board** in the list title menu.
- Boards have **members**; members get notifications about the board and can work on it together.
- Cards show quick information, and you can add **labels**, checklists and comments.

> Guided boards are the only type where dragging a card changes a field value.
`),
            tip("To build a board from a list, filter the list first: the board shows the same records."),
            check(
              "On which type of Visual Task Board does moving a card to another lane change a field on the record?",
              ["Freeform", "Guided", "Flexible"],
              1,
              "Guided boards take their lanes from a field, so moving a card updates that field.",
            ),
          ],
        },
        {
          id: "form-tools",
          title: "Form templates, tags and saving options",
          minutes: 10,
          blocks: [
            text(`
## Saving options

| Option | What it does |
| --- | --- |
| **Submit** | Saves a new record and returns to the previous page |
| **Update** | Saves changes to an existing record and returns to the previous page |
| **Save** | Saves and stays on the form (form context menu or Ctrl+S) |
| **Insert** | Saves the form as a **new** record and leaves the original unchanged |
| **Insert and Stay** | Like Insert, but stays on the new record (handy for copying records) |

Insert and Insert and Stay are on the form context menu (the menu icon or right-click on the form header).

## Form templates

A **template** pre-fills fields on a form.

1. Create it from the form context menu → **Templates → Save as Template**, or in **System Definition → Templates**.
2. Apply it from **Templates → Apply Template** on a new form.
3. Templates can be personal, shared with groups or users, or global.

Templates save typing for common requests (for example "Password reset").

## Tags

A **tag** is a label you put on records to find them again, across tables.

- Add from the form (the tag icon) or a list.
- Tags can be **private**, shared with chosen users or groups, or **visible to everyone**.
- Open tagged records from the tag in the navigator, or filter lists by tag.

## List editing

- **Double-click** a cell to edit it in the list.
- Select rows and update a field for all of them at once.
`),
            check(
              "You want a copy of an existing incident as a new record without changing the original. Which option do you use?",
              ["Update", "Insert", "Submit"],
              1,
              "Insert saves the form as a new record and leaves the original unchanged.",
            ),
          ],
        },
        {
          id: "applications-plugins",
          title: "Applications and plugins",
          minutes: 10,
          blocks: [
            text(`
## What gets installed

- **Plugins** add features and applications from ServiceNow. Many are active by default; others are activated when needed.
- **Store applications** are certified apps from ServiceNow and partners, installed from the **ServiceNow Store**.
- **Custom applications** are built by your own developers (scoped applications).

## Application Manager

**System Applications → All Available Applications → All** (Application Manager) lists what you can install and what is installed. From there you can **install**, **update** or check the version of an application or plugin.

- Some plugins are free; others need a **subscription** or are requested through the Now Support portal.
- **Activating a plugin is usually permanent**: most cannot be deactivated, and activation may add tables, roles and demo data. Try it on a sub-production or developer instance first.
- Demo data is optional when activating; production instances usually skip it.

## Family releases

ServiceNow ships **family releases** (named alphabetically after cities) twice a year, plus patches. Upgrades are planned with the **Upgrade Center**: preview, review skipped records (customizations the upgrade did not overwrite), test, then upgrade production.
`),
            tip("Before activating a plugin in production, activate it in a sub-production instance and check which tables and roles it adds."),
            check(
              "Why should a plugin be tried on a non-production instance first?",
              ["Plugins only work in production", "Activation is usually permanent and can add tables, roles and data", "Plugins delete update sets"],
              1,
              "Most plugins cannot be deactivated, so test their effect first.",
            ),
          ],
        },
      ],
    },
    {
      id: "security-and-scripting",
      title: "Platform security and scripting",
      lessons: [
        {
          id: "platform-security",
          title: "Platform security and the shared responsibility model",
          minutes: 11,
          blocks: [
            text(`
## Shared responsibility

ServiceNow runs the cloud; **you** run your instance's configuration and data access.

| ServiceNow is responsible for | The customer is responsible for |
| --- | --- |
| Data centres, physical security and the infrastructure | Who has accounts and which **roles** they get |
| Running, patching and backing up the platform | **Access controls**, and data classification |
| Encryption in transit and platform availability | Authentication settings (SSO, **MFA**), IP restrictions |
| Releases and security patches | Instance hardening settings, reviewing customizations and scripts |

## Security features an administrator uses

- **Roles and ACLs**: grant only what each person needs (least privilege). Avoid giving \`admin\` widely.
- **Multi-factor authentication (MFA)** for local logins, or **single sign-on (SSO)** with your identity provider.
- **IP address access control**: allow or deny access from network ranges.
- **High security settings / security hardening**: properties that make the instance safer by default (for example default deny on ACLs).
- **Security Center** (where available): a dashboard that checks the instance against hardening recommendations and shows security metrics.
- **System logs and the audit history**: see who changed what and when.
- **Session timeout** and password policies for local accounts.

> The security_admin role is needed to change ACLs: an administrator must **elevate** to it for the session.
`),
            check(
              "Who is responsible for deciding which users get the admin role in an instance?",
              ["ServiceNow", "The customer", "The data centre provider"],
              1,
              "Account and role management belong to the customer in the shared responsibility model.",
            ),
          ],
        },
        {
          id: "scripting",
          title: "Scripting in ServiceNow: where code runs",
          minutes: 12,
          blocks: [
            text(`
## Try no-code first

Prefer configuration (UI policies, flows, data policies) to scripts. Scripts are harder to maintain and to upgrade. When code is needed, choose the right place:

| Script type | Runs on | Use it to |
| --- | --- | --- |
| **Client script** | Browser | React to form events (onLoad, onChange, onSubmit, onCellEdit), validate input, show messages |
| **UI policy** (with optional script) | Browser | Make fields mandatory, read-only or visible without code |
| **Business rule** | Server | Run when a record is displayed, inserted, updated, deleted or queried (before, after, async, display) |
| **Script include** | Server | Reusable server code called from other scripts (and from the client with GlideAjax) |
| **UI action** | Client, server or both | Buttons, links and context menu items on forms and lists |
| **Scheduled script execution** | Server | Code that runs on a schedule |

## Common APIs

- **g_form** (client): read and change fields on the form, for example \`g_form.setMandatory('category', true)\`.
- **g_user** (client): about the current user.
- **GlideRecord** (server): query and change records, for example \`new GlideRecord('incident')\`.
- **current** and **previous** (business rules): the record now and before the change.
- **gs** (GlideSystem, server): logs, the user, dates and messages.

## Business rule timing

| When | Use it for |
| --- | --- |
| **before** | Changing the current record before it is saved (no \`current.update()\` needed) |
| **after** | Updating other records after this one is saved |
| **async** | Slow work after saving, in the background |
| **display** | Passing server data to client scripts (g_scratchpad) |

> UI policies run after client scripts, so a UI policy wins when both set the same field property.
`),
            tip("Never call current.update() in a before business rule: the record is about to be saved anyway, and it can cause recursion."),
            check(
              "Which runs on the server when a record is saved?",
              ["Client script", "UI policy", "Business rule"],
              2,
              "Business rules run on the server when records are queried, inserted, updated or deleted.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Task management ----------------
    mc("task-management", "easy", "Incident, Problem and Change Request all extend which table?", ["Task [task]", "User [sys_user]", "Configuration Item [cmdb_ci]", "Dictionary [sys_dictionary]"], 0, "They extend Task and inherit its fields such as Assigned to, State and Priority."),
    mc("task-management", "medium", "A fulfiller wants to add a note the caller must NOT see. Which field should they use?", ["Additional comments", "Work notes", "Short description", "Description"], 1, "Work notes are internal; additional comments are customer-visible."),
    mc("task-management", "medium", "On a guided Visual Task Board with lanes from the State field, what happens when a card is dragged to another lane?", ["Nothing changes on the record", "The record's State is updated", "The record is deleted", "A new task is created"], 1, "Guided boards update the lane field on the record."),
    ms("task-management", "medium", "Which are true of freeform Visual Task Boards? Select all that apply.", ["Tasks are added to the board by hand", "Moving a card does not change the record", "Lanes always come from the State field", "Members can collaborate on the board"], [0, 1, 3], "Freeform lanes are labels only; guided boards take lanes from a field."),
    mc("task-management", "medium", "On most task tables, Priority is calculated from…", ["Impact and urgency", "Category and subcategory", "Caller and location", "State and assignment group"], 0, "Priority is usually derived from impact and urgency."),

    // ---------------- Form tools ----------------
    mc("form-tools", "easy", "Which save option creates a new record from the form and stays on the new record?", ["Update", "Insert and Stay", "Submit", "Save"], 1, "Insert and Stay saves a copy as a new record and keeps it open."),
    mc("form-tools", "medium", "A service desk agent keeps typing the same values for password reset incidents. What saves the most effort without code?", ["A form template", "A business rule", "A tag", "An update set"], 0, "Templates pre-fill fields on a form."),
    ms("form-tools", "medium", "Which are true about tags? Select all that apply.", ["A tag can be applied to records on different tables", "A tag can be private to you", "A tag can be shared with other users or groups", "Tags change who can read a record"], [0, 1, 2], "Tags label records for finding them; they do not change access."),
    tf("form-tools", "easy", "Update saves changes to an existing record and returns to the previous page.", true, "Save keeps you on the form; Update returns to the previous page."),
    mc("form-tools", "medium", "How do you change a field value directly in a list?", ["Double-click the cell", "Right-click the column header and choose Delete", "Drag the column", "Apply a tag"], 0, "List editing opens the cell for editing when you double-click it."),

    // ---------------- Applications and plugins ----------------
    mc("applications-plugins", "easy", "Where does an administrator see and install available applications and plugins?", ["Application Manager (System Applications → All Available Applications)", "System Logs", "Update Sets", "Transform Maps"], 0, "Application Manager lists installable and installed applications."),
    tf("applications-plugins", "medium", "Most plugins can be deactivated easily after they are activated.", false, "Activation is usually permanent, so test plugins on a non-production instance first."),
    ms("applications-plugins", "medium", "What can activating a plugin add to an instance? Select all that apply.", ["New tables", "New roles", "Optional demo data", "A new instance URL"], [0, 1, 2], "Plugins can add tables, roles and demo data, but not a new instance."),
    mc("applications-plugins", "medium", "Certified applications from ServiceNow and partners are installed from…", ["The ServiceNow Store", "An import set", "A Visual Task Board", "The CMDB"], 0, "Store applications are installed from the ServiceNow Store."),
    mc("applications-plugins", "hard", "During an upgrade, what are skipped records?", ["Customized files the upgrade did not overwrite, to review", "Records deleted by the upgrade", "Users who could not log in", "Plugins that failed to download"], 0, "Skipped records are customizations kept as they were; review them after upgrading."),

    // ---------------- Platform security ----------------
    mc("platform-security", "easy", "In the shared responsibility model, who manages physical security of the data centres?", ["ServiceNow", "The customer", "Each user", "The ITIL process owner"], 0, "ServiceNow runs the infrastructure; the customer runs instance configuration and access."),
    ms("platform-security", "medium", "Which are the customer's responsibility? Select all that apply.", ["Granting roles to users", "Configuring access controls", "Enabling MFA or SSO", "Patching the platform's servers"], [0, 1, 2], "Platform patching is ServiceNow's job; access and authentication settings are the customer's."),
    mc("platform-security", "medium", "Which role must an administrator elevate to before changing access controls?", ["security_admin", "itil", "catalog_admin", "knowledge_manager"], 0, "ACL changes require the elevated security_admin role."),
    mc("platform-security", "medium", "Which feature allows or denies access to the instance by network range?", ["IP address access control", "Visual Task Boards", "Form templates", "Import sets"], 0, "IP address access control restricts where users can connect from."),
    tf("platform-security", "easy", "Giving the admin role to as few people as possible follows the principle of least privilege.", true, "Least privilege grants only the access each person needs."),

    // ---------------- Scripting ----------------
    mc("scripting", "easy", "Which script type runs in the browser when a field value changes?", ["onChange client script", "Before business rule", "Script include", "Scheduled job"], 0, "Client scripts run in the browser on form events such as onChange."),
    mc("scripting", "medium", "Which business rule timing should change the current record's values before they are saved?", ["before", "after", "async", "display"], 0, "Before rules change current before the save, with no current.update() needed."),
    mc("scripting", "medium", "Reusable server-side code called from other scripts belongs in a…", ["Script include", "UI policy", "Client script", "Form template"], 0, "Script includes hold reusable server code."),
    mc("scripting", "medium", "Which object queries and updates records in server-side scripts?", ["GlideRecord", "g_form", "g_user", "g_scratchpad"], 0, "GlideRecord is the server API for database records; g_form works on the client form."),
    ms("scripting", "medium", "Which can make a field mandatory on a form? Select all that apply.", ["UI policy", "Client script", "Data policy", "Tag"], [0, 1, 2], "UI policies and client scripts work on the form; data policies enforce it on the server too. Tags do not."),
  ],
};
