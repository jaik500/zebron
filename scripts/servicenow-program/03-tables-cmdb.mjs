import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 3,
  id: "servicenow-admin-data",
  title: "Tables, Fields and the CMDB",
  summary: "Course 3 of 8 in the Zebron ServiceNow Administrator Program. How ServiceNow stores data: tables, extension, the dictionary, field types, relationships and the CMDB.",
  description: `
Everything in ServiceNow is data in tables. This course explains how tables are built and extended, how the dictionary defines fields, how tables relate to each other, and how the Configuration Management Database (CMDB) models your infrastructure and services.

Each lesson ends with a quick check. The final exam is drawn from the **Tables, Fields and the CMDB** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "slate",
  outcomes: [
    "Explain tables, records, fields and sys_ids",
    "Describe table extension, including the Task table",
    "Use the dictionary to understand and configure fields",
    "Read relationships with reference fields and the schema map",
    "Explain CI classes, relationships, CMDB health and CSDM",
  ],
  skills: ["Data model", "Table extension", "Dictionary", "Schema map", "CMDB"],
  quiz: {
    name: "Tables, Fields and the CMDB",
    slug: "servicenow-admin-data",
    description: "Practice questions for Course 3 of the ServiceNow Administrator Program: tables, extension, dictionary, relationships and the CMDB.",
    tags: ["servicenow", "csa", "cmdb", "data-model"],
  },
  topics: [
    { key: "tables", name: "Tables and records", description: "Tables, records, fields, sys_id and system tables." },
    { key: "extension", name: "Table extension", description: "Parent and child tables, Task and inheritance." },
    { key: "dictionary", name: "Dictionary and field types", description: "Dictionary entries, field types, choice lists and attributes." },
    { key: "relationships", name: "Relationships and the schema map", description: "Reference fields, related lists, database views and the schema map." },
    { key: "cmdb", name: "The CMDB", description: "CIs, classes, relationships, CMDB health, IRE and CSDM." },
  ],
  modules: [
    {
      id: "data-model",
      title: "The data model",
      lessons: [
        {
          id: "tables",
          title: "Tables and records",
          minutes: 11,
          blocks: [
            text(`
## The basics

- A **table** is a collection of records of one kind, such as Incident, User or Server.
- A **record** is one row, such as INC0010001.
- A **field** is one column, such as *Short description* or *Priority*.

Every table has a **label** (what people see, such as "Incident") and a **name** (what the system uses, such as \`incident\`).

## System fields

Every record has fields the platform manages:

| Field | Meaning |
| --- | --- |
| \`sys_id\` | Unique 32-character identifier |
| \`sys_created_on\` / \`sys_created_by\` | When and by whom it was created |
| \`sys_updated_on\` / \`sys_updated_by\` | Last update |
| \`sys_mod_count\` | How many times it was updated |
| \`sys_class_name\` | Which table (class) the record belongs to, on extended tables |

## Table name prefixes

- \`sys_\`: platform system tables (\`sys_user\`, \`sys_dictionary\`, \`sys_properties\`).
- \`cmdb_\`: CMDB tables (\`cmdb_ci\`, \`cmdb_ci_server\`).
- \`u_\`: custom tables and fields created in the **global** scope.
- \`x_<vendor>_<app>_\`: tables created in a **scoped application**.
`),
            text(`
## Creating a table

**System Definition → Tables → New** (or App Engine Studio for apps). Choose a label and name, decide whether to **extend** another table, and let the platform create a module and roles if needed.

Before creating a table, check whether an existing one already fits: custom tables may count against your subscription, and every new table is something to maintain. Many needs are met by extending **Task** or by adding a few fields to an existing table.
`),
            tip("Learn to read table names in URLs: /incident.do?sys_id=… tells you the table and the record at a glance."),
            check(
              "A custom table created in the global scope gets which prefix?",
              ["sys_", "u_", "cmdb_"],
              1,
              "Global custom tables and fields start with u_. Scoped apps use x_<vendor>_<app>_.",
            ),
          ],
        },
        {
          id: "extension",
          title: "Table extension and the Task table",
          minutes: 12,
          blocks: [
            text(`
## Parent and child tables

A table can **extend** another. The child **inherits** all the parent's fields and adds its own. Querying the parent returns records from all its children too.

The most important example is **Task** (\`task\`). Incident, Problem, Change Request, Requested Item, Catalog Task, HR Case and many more extend it, so they all share fields such as:

- Number, Short description, Description
- State, Priority, Assigned to, Assignment group
- Opened, Closed, Work notes, Additional comments

Because of this, features built for Task (assignment, SLAs, approvals, the activity stream) work for every task table.

## Three kinds of table

- **Base table**: has no parent but is extended by others (Task, Configuration Item \`cmdb_ci\`).
- **Core table**: delivered with the platform and not extending anything else, such as User.
- **Child (extended) table**: extends a parent, such as Incident.
`),
            text(`
## Practical consequences

- Adding a field to **Task** adds it to every task table. Add it to the specific child (such as Incident) unless every task really needs it.
- A list of the **Task** table shows incidents, problems and changes together; the **Task type** (\`sys_class_name\`) tells them apart.
- Changing a record's class (for example moving a CI to a more specific class) is possible but has consequences, so plan carefully.

The **Tables** module shows each table's parent ("Extends table") and its children.
`),
            tip("When asked to add a field \"everywhere\", ask which tables really need it. A field on Task appears on dozens of forms you may not expect."),
            check(
              "Incident, Problem and Change Request all extend which table?",
              ["sys_user", "task", "cmdb_ci"],
              1,
              "They extend Task and inherit its fields.",
            ),
          ],
        },
        {
          id: "dictionary",
          title: "The dictionary and field types",
          minutes: 12,
          blocks: [
            text(`
## The dictionary

Every field is defined by a **dictionary entry** in \`sys_dictionary\`: its table, column name, type, maximum length, default value, whether it is mandatory or read-only, and **attributes** that tune its behaviour. Open it from a form field's context menu → **Configure Dictionary**.

**Labels** (what users see, in each language) are stored separately in \`sys_documentation\`, so the same field can be translated.

## Common field types

| Type | Example |
| --- | --- |
| **String** | Short description |
| **Integer / Decimal** | Reassignment count |
| **True/False** | Active |
| **Choice** | State, Category (fixed list of values) |
| **Reference** | Caller → User table |
| **Glide Date / Date/Time** | Opened, Due date |
| **Journal** | Work notes, Additional comments (each entry is kept separately) |
| **List** | Watch list (several references) |
| **HTML** | Knowledge article text |
| **Currency / Price** | Catalog item price |
`),
            text(`
## Choice lists and dictionary overrides

**Choice** fields take their values from the **choice list** (\`sys_choice\`). Each choice has a **label** (shown) and a **value** (stored). Reports and scripts use the value, so do not change values casually once data uses them.

A **dictionary override** lets a child table change an inherited field's behaviour without changing the parent, for example a different default **State** or making a field mandatory only on Incident.

**Calculated** fields and **default values** can use scripts; keep these simple and documented.
`),
            tip("When a field behaves strangely, open its dictionary entry first: mandatory flags, defaults, attributes and overrides explain most surprises."),
            check(
              "Where would you change a field's maximum length?",
              ["Its dictionary entry", "A user preference", "A dashboard"],
              0,
              "Field definitions, including length, live in the dictionary.",
            ),
          ],
        },
      ],
    },
    {
      id: "relationships-and-cmdb",
      title: "Relationships and the CMDB",
      lessons: [
        {
          id: "relationships",
          title: "Relationships and the schema map",
          minutes: 11,
          blocks: [
            text(`
## How tables connect

- A **reference field** stores the sys_id of a record in another table, such as Incident → Caller (User). It is a **many-to-one** relationship: many incidents can have the same caller.
- The reverse view of that relationship appears as a **related list**: a user's form can list "Incidents where I am the caller".
- **Many-to-many** relationships use a separate table that holds pairs of references, such as group membership (\`sys_user_grmember\`) linking users and groups.
- **Defined relationships** (System Definition → Relationships) create related lists from custom queries when there is no direct reference.
- **Database views** join tables for reporting, such as incidents with their SLA records.

## The schema map

The **schema map** (from the Tables module, or table context menu) draws a table, its parent and children, and the tables it references and that reference it. It is the quickest way to understand an unfamiliar part of the data model.
`),
            text(`
## Reference qualifiers

A **reference qualifier** limits which records a reference field offers. Examples:

- *Assignment group* only shows active groups of type "ITIL".
- *Configuration item* only shows CIs used by the selected company.

Types: **simple** (conditions), **dynamic** (a reusable dynamic filter) and **advanced** (a script or encoded query).

## Deleting referenced records

When a referenced record is deleted, the dictionary's **cascade rule** decides what happens: clear the reference, delete the referencing records, or stop the delete. For most business data, **deactivate** records (Active = false) instead of deleting them.
`),
            tip("Make a habit of deactivating users, groups and CIs rather than deleting them. History, reports and audit trails stay intact."),
            check(
              "Group membership between users and groups is an example of which relationship?",
              ["One-to-one", "Many-to-many", "No relationship"],
              1,
              "A user can be in many groups and a group has many users, stored in sys_user_grmember.",
            ),
          ],
        },
        {
          id: "cmdb",
          title: "The Configuration Management Database",
          minutes: 13,
          blocks: [
            text(`
## CIs and classes

The **CMDB** stores **configuration items (CIs)**: anything you manage to deliver a service, such as servers, applications, databases, network devices and cloud resources. All CIs extend the base table **Configuration Item** (\`cmdb_ci\`), organised into a **class hierarchy**, for example:

\`cmdb_ci\` → \`cmdb_ci_hardware\` → \`cmdb_ci_computer\` → \`cmdb_ci_server\` → \`cmdb_ci_linux_server\`

The **CI Class Manager** shows the hierarchy and each class's attributes, identification rules and health settings.

## Relationships

CIs are linked by **relationships** (\`cmdb_rel_ci\`), such as "Web app *Runs on* Server" or "Database *Depends on* Storage". The **dependency view** (and service maps) draw these links, so you can see what an outage on one server affects.

Incidents, problems and changes reference CIs, which lets you see **impact**: which business services a failing CI supports.
`),
            text(`
## Keeping the CMDB trustworthy

- **Discovery** finds devices and software on your network using a **MID Server** inside your environment. **Service Graph Connectors** import CIs from other tools such as cloud providers and endpoint managers.
- The **Identification and Reconciliation Engine (IRE)** decides whether incoming data matches an existing CI (identification) and which source may update which attributes (reconciliation), preventing duplicates.
- **CMDB Health** dashboards score **completeness** (required fields filled), **correctness** (duplicates, orphans, stale CIs) and **compliance** (matching audits).
- The **Common Service Data Model (CSDM)** is ServiceNow's recommended way to model business and technical services, so products across the platform agree on where data belongs.

An out-of-date CMDB is worse than none: people stop trusting it. Give each CI class an owner and measure health.
`),
            tip("Start small: get your critical services and the servers and applications behind them right before trying to model everything."),
            check(
              "Which base table do all CI classes extend?",
              ["task", "cmdb_ci", "sys_user"],
              1,
              "Configuration Item (cmdb_ci) is the base CMDB table.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Tables ----------------
    mc("tables", "easy", "In ServiceNow terms, a single row in a table is a…", ["Field", "Record", "Module", "View"], 1, "A record is one row, such as one incident."),
    mc("tables", "medium", "Which prefix do tables created inside a scoped application use?", ["u_", "sys_", "x_<vendor>_<app>_", "cmdb_"], 2, "Scoped application tables use the x_ prefix with the vendor and app identifiers."),
    mc("tables", "medium", "Which system field records how many times a record has been updated?", ["sys_mod_count", "sys_id", "sys_class_name", "sys_created_by"], 0, "sys_mod_count increments on every update."),
    tf("tables", "easy", "A table's label is what users see, while its name is what the system uses.", true, "For example, label \"Incident\", name incident."),
    st("tables", "medium", "What is the table name of the User table?", ["sys_user"], "Users are stored in sys_user."),

    // ---------------- Extension ----------------
    mc("extension", "easy", "When a table extends another, what does the child table get?", ["Nothing", "All of the parent's fields", "Only the parent's name", "The parent's users"], 1, "Child tables inherit every field of the parent."),
    tf("extension", "medium", "Adding a field to the Task table adds it to Incident, Problem and Change Request.", true, "They extend Task, so they inherit the new field."),
    mc("extension", "medium", "Which field tells you which child table a Task record belongs to?", ["sys_class_name (Task type)", "sys_id", "number", "priority"], 0, "sys_class_name stores the record's class, such as incident or change_request."),
    mc("extension", "medium", "What kind of table is Task?", ["A base table extended by others", "A database view", "An import set table", "A scoped app table"], 0, "Task is a base table: it extends nothing but many tables extend it."),
    ms("extension", "medium", "Which tables extend Task? Select all that apply.", ["Incident", "Change Request", "Problem", "User"], [0, 1, 2], "Incident, Problem and Change Request extend Task. User does not."),

    // ---------------- Dictionary ----------------
    mc("dictionary", "easy", "Which table stores field definitions?", ["sys_dictionary", "sys_properties", "sys_user_role", "sys_choice"], 0, "Dictionary entries live in sys_dictionary."),
    mc("dictionary", "medium", "Work notes and Additional comments are which field type?", ["String", "Journal", "Choice", "Reference"], 1, "Journal fields keep each entry separately with its author and time."),
    mc("dictionary", "medium", "You want the State field to default differently on Incident without changing Task. What should you use?", ["A dictionary override", "A new table", "A user preference", "A tag"], 0, "Dictionary overrides change inherited field behaviour on a child table only."),
    tf("dictionary", "medium", "Reports and scripts use a choice's stored value, not its label.", true, "That is why choice values should not be changed once data uses them."),
    mc("dictionary", "medium", "Which field type would you use for a watch list of several users?", ["List", "String", "Integer", "True/False"], 0, "A List field holds several references."),

    // ---------------- Relationships ----------------
    mc("relationships", "easy", "What does a reference field store?", ["A copy of the other record", "The sys_id of a record in another table", "An image", "A report"], 1, "References store the target record's sys_id."),
    mc("relationships", "medium", "Which tool draws a table with its parents, children and referenced tables?", ["Schema map", "Theme Builder", "Flow Designer", "Update set"], 0, "The schema map visualises table relationships."),
    mc("relationships", "medium", "What limits the records a reference field offers, such as only active ITIL groups?", ["Reference qualifier", "View rule", "Data source", "Dashboard filter"], 0, "Reference qualifiers filter the choices in a reference field."),
    mc("relationships", "medium", "Which joins two or more tables for reporting?", ["Database view", "UI policy", "Client script", "Email template"], 0, "Database views combine tables so reports can use fields from both."),
    tf("relationships", "easy", "Deactivating records is usually safer than deleting them.", true, "Deactivation keeps history, references and reports intact."),

    // ---------------- CMDB ----------------
    mc("cmdb", "easy", "What does CMDB stand for?", ["Central Monitoring Data Bus", "Configuration Management Database", "Change Management Decision Board", "Cloud Managed Data Backup"], 1, "The Configuration Management Database stores configuration items and their relationships."),
    ord("cmdb", "medium", "Put these CI classes from most general to most specific.", ["Configuration Item", "Hardware", "Computer", "Server", "Linux Server"], "cmdb_ci → cmdb_ci_hardware → cmdb_ci_computer → cmdb_ci_server → cmdb_ci_linux_server."),
    mc("cmdb", "medium", "Which component prevents duplicate CIs when several sources send data?", ["Identification and Reconciliation Engine", "Theme Builder", "Service Portal", "Data policy"], 0, "The IRE identifies matching CIs and reconciles which source may update which attributes."),
    ms("cmdb", "medium", "Which dimensions does CMDB Health measure? Select all that apply.", ["Completeness", "Correctness", "Compliance", "Colour"], [0, 1, 2], "CMDB Health scores completeness, correctness and compliance."),
    mc("cmdb", "hard", "What does Discovery need to scan devices inside a company's private network?", ["A MID Server", "A Service Portal", "A database view", "An update set"], 0, "The MID Server runs inside the network and communicates with the instance."),
  ],
};
