import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 1,
  id: "servicenow-admin-platform",
  title: "ServiceNow Platform Overview and Navigation",
  summary: "Course 1 of 8 in the Zebron ServiceNow Administrator Program. What the Now Platform is, how instances work, and how to move around lists and forms like an administrator.",
  description: `
Start here. You will learn what ServiceNow is used for, how instances and releases work, how to find anything with the Next Experience navigation, and how to work quickly with lists, filters and forms.

The program follows the areas of the ServiceNow Certified System Administrator (CSA) exam. A free Personal Developer Instance (PDI) from developer.servicenow.com is the best place to practise every lesson.

Each lesson ends with a quick check. The final exam is drawn from the **ServiceNow Platform Overview and Navigation** quiz in the Test Center.
`.trim(),
  level: "beginner",
  cover: "teal",
  outcomes: [
    "Describe the Now Platform, instances and the release cycle",
    "Navigate with the All menu, Favorites, History and Workspaces",
    "Filter, sort, group and personalise lists",
    "Work with forms, related lists, reference fields and the form context menu",
    "Use navigator shortcuts such as incident.list and incident.do",
  ],
  skills: ["Now Platform", "Next Experience UI", "Lists and filters", "Forms", "Navigation"],
  quiz: {
    name: "ServiceNow Platform Overview and Navigation",
    slug: "servicenow-admin-platform",
    description: "Practice questions for Course 1 of the ServiceNow Administrator Program: the platform, instances, navigation, lists and forms.",
    tags: ["servicenow", "csa", "navigation"],
  },
  topics: [
    { key: "platform", name: "The Now Platform and instances", description: "What ServiceNow does, instances, releases and the PDI." },
    { key: "navigation", name: "Next Experience navigation", description: "All menu, Favorites, History, Workspaces and shortcuts." },
    { key: "lists", name: "Lists and filters", description: "Condition builder, breadcrumbs, sorting, grouping and list personalisation." },
    { key: "forms", name: "Forms", description: "Fields, sections, related lists, reference fields and form actions." },
    { key: "personalization", name: "Personalisation and preferences", description: "User preferences, tags, list personalisation and accessibility." },
  ],
  modules: [
    {
      id: "the-platform",
      title: "The platform",
      lessons: [
        {
          id: "platform",
          title: "The Now Platform and instances",
          minutes: 11,
          blocks: [
            text(`
## What ServiceNow is

ServiceNow is a cloud platform for digital workflows. Organisations use it to run IT service management (ITSM), HR service delivery, customer service, security operations, IT operations, asset management and their own custom applications, all on one data model: the **Now Platform**.

Everything is stored in **tables** in a single database, and every application (Incident, Change, HR Case) is a set of tables, forms, rules and flows on top of it. That is why an administrator's skills transfer across products.

## Instances

Each customer gets one or more **instances**, each with its own URL, such as \`https://yourcompany.service-now.com\`. A typical set:

| Instance | Purpose |
| --- | --- |
| **Development** | Build and configure |
| **Test** (or QA/UAT) | Test changes with real users |
| **Production** | The live system everyone uses |

Changes move from development to test to production (you will learn how with update sets in Course 8). Production is **cloned** down to the others from time to time so they stay realistic.
`),
            text(`
## Releases

ServiceNow ships two major releases a year, named after cities in alphabetical order (for example Washington DC, Xanadu, Yokohama). Customers upgrade their instances to stay on supported releases; each release adds features and sometimes changes the interface.

## Your practice instance

Anyone can get a free **Personal Developer Instance (PDI)** from the ServiceNow Developer Program (developer.servicenow.com). It comes with demo data and admin rights. It goes to sleep when unused and is reclaimed after a period of inactivity, so do not keep anything important only there.

## Who does what

- **End users** (requesters) raise requests and incidents, usually through a portal.
- **Fulfillers** (agents, often with the \`itil\` role) work those records.
- **Administrators** (the \`admin\` role) configure the platform: forms, lists, users, rules, flows.
- **Developers** build custom applications and scripts.
`),
            tip("Get a PDI today and keep it next to you during the program. Every lesson is easier when you click along."),
            check(
              "Where should configuration changes normally be made first?",
              ["Production", "A development instance", "The ServiceNow Store"],
              1,
              "Changes are built in development, tested, then promoted to production.",
            ),
          ],
        },
        {
          id: "navigation",
          title: "Next Experience navigation",
          minutes: 12,
          blocks: [
            text(`
## The unified navigation bar

The **Next Experience** interface has one navigation bar across the top:

- **All**: the application navigator. Type in its filter to find modules, such as "Incident" or "System Properties".
- **Favorites**: modules and records you starred for quick access.
- **History**: lists and records you opened recently.
- **Workspaces**: modern agent interfaces such as Service Operations Workspace.
- **Admin**: shortcuts for administrators.
- On the right: **global search**, the **scope and update set picker** (for admins and developers), **notifications** and your **user menu** (profile, preferences, impersonate user, log out).

Applications in the All menu contain **modules**: links to lists, forms, reports or pages. "Incident → Open" is the Open module of the Incident application.
`),
            text(`
## Shortcuts every admin uses

Type these into the All menu filter and press Enter:

| You type | Opens |
| --- | --- |
| \`incident.list\` | The Incident table as a list |
| \`incident.LIST\` | The same list in a new browser tab |
| \`incident.do\` | A new, empty Incident form |
| \`incident.FORM\` | A new Incident form in a new tab |
| \`sys_properties.list\` | The System Properties table |

The part before the dot is the **table name** (not the label): \`incident\`, \`change_request\`, \`sys_user\`, \`cmdb_ci_server\`.

Use **global search** to find records across tables by number or text, for example an incident number or a user's name.
`),
            tip("Star the modules you use every day (users, groups, system properties, update sets). The Favorites menu becomes your personal admin console."),
            check(
              "What does typing sys_user.list in the All menu filter do?",
              ["Opens the Users table as a list", "Creates a new user", "Deletes all users"],
              0,
              "table_name.list opens that table's list view.",
            ),
          ],
        },
      ],
    },
    {
      id: "lists-and-forms",
      title: "Lists and forms",
      lessons: [
        {
          id: "lists",
          title: "Lists and filters",
          minutes: 13,
          blocks: [
            text(`
## Reading a list

A **list** shows records from one table as rows, with fields as columns. From a list you can:

- **Sort** by clicking a column heading.
- **Search** a column with the search row (magnifying glass).
- **Group by** a field (for example State) from the column menu.
- **Edit in place** by double-clicking a cell, if you have write access.
- Act on several records with the **checkboxes** and the actions menu.

## The condition builder

The **filter** icon opens the **condition builder**:

- Add conditions with **AND** (all must be true) and **OR** (either can be true).
- Choose operators such as *is*, *is not*, *contains*, *starts with*, *is empty*, *is (dynamic)* (for example "Assigned to is (dynamic) Me").
- **Run** applies the filter; **Save** stores it as a saved filter you can reuse.

The **breadcrumbs** above the list show the active conditions. Click a breadcrumb to remove everything after it.
`),
            text(`
## Quick filters from the data

Right-click a value in a list cell:

- **Show Matching** keeps only records with that value.
- **Filter Out** removes records with that value.

Right-click a column heading to **copy the query**: you get an **encoded query** such as \`active=true^priority=1\`, where \`^\` means AND and \`^OR\` means OR. Encoded queries are used in URLs, reports, modules and scripts.

## Personalise or configure?

- **Personalise list** (the gear icon on the list) changes the columns **for you only**.
- **Configure → List Layout** (admin) changes the default columns **for everyone** in that view.
`),
            tip("Before you change a list layout for everyone, personalise it for yourself first and use it for a day. Then you know the new layout really helps."),
            check(
              "In an encoded query, what does the ^ symbol mean?",
              ["OR", "AND", "NOT"],
              1,
              "^ separates conditions joined by AND; ^OR joins conditions with OR.",
            ),
          ],
        },
        {
          id: "forms",
          title: "Forms",
          minutes: 12,
          blocks: [
            text(`
## Anatomy of a form

A **form** shows one record. It contains:

- **Fields**, arranged in **sections** (tabs or stacked areas).
- **Field status indicators**: mandatory fields are marked (and must be filled before saving), read-only fields are greyed out.
- **Reference fields** that point to a record in another table, such as *Caller* (a user) or *Configuration item*. The **reference icon** (i) next to the field previews that record.
- **Related lists** at the bottom: records in other tables linked to this one, such as an incident's child incidents or a user's group memberships.
- The **activity stream** showing journal entries (comments and work notes) and field changes.

## Saving

- **Save** keeps you on the form; **Update** saves and returns to the list.
- **Submit** creates a new record.
- **Insert** (from the form context menu) creates a **new record** from the current field values instead of changing the original; **Insert and Stay** does the same and keeps you on the new record.
`),
            text(`
## The form context menu

The menu in the form header (the "hamburger" or ⋯ menu) holds actions such as:

- **Configure → Form Layout / Form Builder**: change which fields appear and where (admin).
- **Configure → Dictionary**, **Business Rules**, **UI Policies**, **Client Scripts** for this table (admin).
- **View**: switch between **form views** (different layouts of the same table for different audiences).
- **Copy URL**, **Copy sys_id**: useful when you need to point someone to a record.
- **History**: see how the record changed over time.

Every record has a unique 32-character **sys_id**. Numbers such as INC0010001 are for people; the sys_id is what the system uses internally.

## Dot-walking

**Dot-walking** follows reference fields to reach fields on related records, for example \`caller_id.department\` or \`assigned_to.manager.email\`. You can add dot-walked fields to lists, forms, filters and reports.
`),
            tip("Use Insert carefully: it is a quick way to copy a record, but users who click it by mistake create duplicates. Some admins hide it for non-admin roles."),
            check(
              "What does the Insert action on a form do?",
              ["Saves changes to the current record", "Creates a new record from the current values", "Deletes the record"],
              1,
              "Insert writes a new record using the current field values; the original is not changed.",
            ),
          ],
        },
        {
          id: "personalization",
          title: "Personalisation and preferences",
          minutes: 10,
          blocks: [
            text(`
## What users can change for themselves

Users can tailor the interface without affecting anyone else:

- **Preferences** (user menu → Preferences): theme, display density, language, time zone, date format, accessibility options, notification preferences.
- **Personalise list** columns.
- **Favorites** in the navigation bar.
- **Tags** on records, to group and find them later (personal or shared).
- **Templates** that pre-fill forms they fill often.

Personal choices are stored as **user preferences** (\`sys_user_preference\`). An administrator can also set system-wide defaults.

## Global changes are for admins

Changing **list layouts**, **form layouts**, **views** or **system properties** affects everyone and should go through your change process: build it in development, capture it in an update set, test, then promote.
`),
            text(`
## Impersonation (preview)

Administrators can **impersonate** a user (user menu → Impersonate user) to see exactly what that person sees and can do. It is the best way to test roles, ACLs and portals. Actions taken while impersonating are recorded as that user, so test in a sub-production instance where possible and always end the impersonation when done.

You will use impersonation a lot in Course 4 (security) and Course 6 (service catalog).
`),
            tip("When a user reports that they cannot see something, impersonate them first. It turns guessing into seeing."),
            check(
              "A user removes two columns from their incident list with the gear icon. Who else sees the change?",
              ["Everyone", "Only that user", "Only admins"],
              1,
              "Personalise list changes apply only to the user who made them.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Platform ----------------
    mc("platform", "easy", "What is a ServiceNow instance?", ["A single incident record", "A customer's own copy of the platform with its own URL and database", "A mobile app", "A type of report"], 1, "Each instance is a separate environment, such as development, test or production."),
    tf("platform", "easy", "All ServiceNow applications store their data in tables on the same platform.", true, "Applications are built from tables, forms and rules on the shared Now Platform data model."),
    ord("platform", "easy", "Put these instances in the usual order changes travel through them.", ["Development", "Test", "Production"], "Build in development, test in test (QA/UAT), then promote to production."),
    mc("platform", "medium", "How often does ServiceNow publish major platform releases?", ["Every month", "Twice a year", "Every three years", "Only on request"], 1, "There are two major releases a year, named alphabetically after cities."),
    mc("platform", "easy", "Which role do fulfillers such as service desk agents typically have for ITSM work?", ["itil", "admin", "security_admin", "maint"], 0, "The itil role gives fulfiller access to Incident, Problem and Change."),

    // ---------------- Navigation ----------------
    mc("navigation", "easy", "Where do you find applications and their modules in the Next Experience interface?", ["The All menu", "The activity stream", "The condition builder", "Related lists"], 0, "The All menu is the application navigator, with a filter to find modules."),
    mc("navigation", "medium", "What does typing incident.do in the navigator filter open?", ["The incident list", "A new, empty incident form", "The incident table definition", "An incident report"], 1, "table.do opens a new record form; table.list opens the list."),
    mc("navigation", "medium", "Which shortcut opens the Incident list in a new browser tab?", ["incident.list", "incident.LIST", "incident.do", "incident.new"], 1, "Upper-case LIST (and FORM) open in a new tab."),
    st("navigation", "medium", "Type the table name used to open the System Properties list with .list (for example: xxx.list). Give the table name only.", ["sys_properties"], "sys_properties.list opens the System Properties table."),
    tf("navigation", "easy", "History in the navigation bar shows lists and records you opened recently.", true, "History is a quick way back to recent work."),

    // ---------------- Lists ----------------
    mc("lists", "easy", "You right-click Priority 1 in a list and choose an option that keeps only Priority 1 records. Which option?", ["Filter Out", "Show Matching", "Group By", "Export"], 1, "Show Matching filters to records with that value; Filter Out removes them."),
    mc("lists", "medium", "What is the encoded query for \"active is true AND priority is 1\"?", ["active=true^priority=1", "active=true|priority=1", "active=true&&priority=1", "active=true,priority=1"], 0, "Encoded queries join AND conditions with ^."),
    mc("lists", "medium", "An admin wants to change the default columns of the incident list for everyone. What should they use?", ["Personalise list (gear icon)", "Configure → List Layout", "User preferences", "A tag"], 1, "List Layout changes the default for all users of that view. Personalise list affects only you."),
    tf("lists", "easy", "Clicking a breadcrumb in a filtered list removes the conditions after it.", true, "Breadcrumbs let you step back through the filter."),
    mc("lists", "medium", "Which filter condition shows incidents assigned to whoever is viewing the list?", ["Assigned to is (dynamic) Me", "Assigned to is empty", "Caller is Me", "Assigned to contains admin"], 0, "Dynamic filters such as \"Me\" change with the user viewing the list."),

    // ---------------- Forms ----------------
    mc("forms", "easy", "What are related lists on a form?", ["Lists of records in other tables linked to the current record", "A list of favourite modules", "Saved filters", "Email templates"], 0, "Related lists show linked records, such as child incidents or group members."),
    mc("forms", "medium", "How long is a sys_id?", ["10 characters", "16 characters", "32 characters", "64 characters"], 2, "A sys_id is a 32-character unique identifier (GUID)."),
    mc("forms", "medium", "Which field on an incident is a reference field?", ["Short description", "Caller", "Description", "Work notes"], 1, "Caller references a record in the User [sys_user] table."),
    mc("forms", "hard", "What is dot-walking?", ["Moving between instances", "Following reference fields to reach fields on related records", "Cloning a form", "Scrolling the activity stream"], 1, "For example caller_id.department reaches the caller's department."),
    ms("forms", "medium", "Which of these can you open from the form context menu as an admin? Select all that apply.", ["Configure → Form Layout", "Configure → Business Rules", "View (switch form view)", "Clone the whole instance"], [0, 1, 2], "The form context menu gives access to configuration for that table and to views. Cloning is done from the instance clone application."),

    // ---------------- Personalisation ----------------
    tf("personalization", "easy", "Changing your own list columns with the gear icon changes them for every user.", false, "Personalise list affects only you."),
    mc("personalization", "medium", "Where are a user's personal settings, such as list column choices, stored?", ["System properties", "User preferences", "Update sets", "The CMDB"], 1, "Personal choices are stored as user preference records."),
    mc("personalization", "medium", "What is the best way for an admin to see exactly what a specific user can see?", ["Ask for their password", "Impersonate the user", "Read the system log", "Clone the instance"], 1, "Impersonation shows the platform as that user, without needing their credentials."),
    mc("personalization", "easy", "What do tags let users do?", ["Group and find records later", "Change table structure", "Approve changes", "Write business rules"], 0, "Tags label records so users can find them again."),
    ms("personalization", "medium", "Which settings can users usually change for themselves in Preferences? Select all that apply.", ["Theme", "Time zone", "Language", "Another user's roles"], [0, 1, 2], "Preferences cover a user's own display and regional settings. Roles are managed by admins."),
  ],
};
