import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 8,
  id: "servicenow-admin-instance",
  title: "Data Migration, Integrations and Instance Management",
  summary: "Course 8 of 8 in the Zebron ServiceNow Administrator Program. Import data safely, connect other systems, move changes between instances, and keep the instance healthy through clones and upgrades.",
  description: `
The final course covers the work that keeps an instance running for years: importing data with import sets and transform maps, integrating other systems, promoting configuration with update sets, cloning, upgrades, scoped applications and the ServiceNow Store.

Each lesson ends with a quick check. The final exam is drawn from the **Data Migration, Integrations and Instance Management** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "navy",
  outcomes: [
    "Import data with data sources, import sets and transform maps",
    "Use coalesce to update records instead of duplicating them",
    "Describe REST APIs, IntegrationHub and the MID Server",
    "Move configuration between instances with update sets",
    "Plan clones and upgrades, and explain scoped applications",
  ],
  skills: ["Import sets", "Transform maps", "Integrations", "Update sets", "Cloning and upgrades"],
  quiz: {
    name: "Data Migration, Integrations and Instance Management",
    slug: "servicenow-admin-instance",
    description: "Practice questions for Course 8 of the ServiceNow Administrator Program: import sets, transform maps, integrations, update sets, clones and upgrades.",
    tags: ["servicenow", "csa", "import-sets", "update-sets"],
  },
  topics: [
    { key: "imports", name: "Import sets", description: "Data sources, staging tables and the import process." },
    { key: "transforms", name: "Transform maps and coalesce", description: "Field maps, coalesce, transform scripts and results." },
    { key: "integrations", name: "Integrations", description: "REST APIs, IntegrationHub, MID Server and authentication." },
    { key: "update-sets", name: "Update sets", description: "Capturing, moving, previewing and committing configuration." },
    { key: "instance", name: "Clones, upgrades and applications", description: "Cloning, upgrades, skipped records, scoped apps and the Store." },
  ],
  modules: [
    {
      id: "data-and-integrations",
      title: "Data and integrations",
      lessons: [
        {
          id: "imports",
          title: "Import sets",
          minutes: 12,
          blocks: [
            text(`
## The import process

Bringing data into ServiceNow (users, CIs, locations, assets) usually follows this path:

1. **Data source**: where the data comes from: a file (Excel, CSV, XML, JSON), a JDBC database, LDAP, or a REST/custom source.
2. **Load data** into an **import set table** (a staging table, such as \`u_imp_locations\`). Each row is an **import set row**.
3. **Transform** the staging rows into the **target table** with a **transform map**.
4. **Review** the results.

The staging step means messy source data never touches real tables until it has been mapped and checked.

## Doing it

- **System Import Sets → Load Data** walks you through uploading a file and creating the import set table.
- **Scheduled data imports** repeat an import automatically, such as a nightly feed from the HR system.
- The **Import Set** record shows how many rows were inserted, updated, ignored, skipped or in error.
`),
            text(`
## Good habits

- Import into a **sub-production** instance first and check the results.
- Clean the source: consistent spellings, no merged cells, one header row.
- Import **reference data first** (locations, departments, companies), then the records that refer to them (users, CIs).
- Remember that **data policies** apply to imports and may reject rows with missing mandatory fields.
- Old import set rows are cleaned up automatically by a scheduled job after a retention period.

Excel imports read the **first worksheet** by default unless you choose another.
`),
            tip("Do a small test import of ten rows first. Fixing a mapping on ten records is easy; fixing it on ten thousand is not."),
            check(
              "Where does imported data land before it is transformed?",
              ["Directly in the target table", "An import set (staging) table", "A dashboard"],
              1,
              "Data is loaded into an import set table, then transformed into the target.",
            ),
          ],
        },
        {
          id: "transforms",
          title: "Transform maps and coalesce",
          minutes: 13,
          blocks: [
            text(`
## Transform maps

A **transform map** connects an import set table to a target table:

- **Field maps** link each source column to a target field. **Auto Map Matching Fields** maps columns with matching names; **Mapping Assist** lets you drag and drop the rest.
- **Choice action** decides what happens when a value does not exist in a choice list: create it, ignore it or reject the row.
- **Reference** fields can be matched by a field other than display value (for example match a manager by email).

## Coalesce

**Coalesce** tells the transform how to recognise an existing record. Mark one or more field maps as **coalesce** (for example *Employee number* or *Email*):

- If a target record **matches** the coalesce field(s), it is **updated**.
- If **no** record matches, a **new** record is **inserted**.
- With **no coalesce** at all, every row is **inserted**, which creates duplicates on re-import.

When several fields coalesce, all of them must match.
`),
            text(`
## Transform scripts

For logic the field maps cannot express, transform scripts run at set moments:

| Script | Runs |
| --- | --- |
| **onStart** | Once, before any rows |
| **onBefore** | Before each row is transformed (can **ignore** a row) |
| **onAfter** | After each row is transformed |
| **onComplete** | Once, after all rows |

Field maps can also use a **source script** to calculate a value.

**Run business rules** (on the transform map) controls whether business rules and workflows fire for each inserted or updated record. Turn it off for large migrations when you do not want notifications or flows to fire.
`),
            tip("Always ask \"how will we find the existing record?\" before your first import. That is your coalesce field."),
            check(
              "A transform map has no coalesce field and the same file is imported twice. What happens?",
              ["Records are updated", "Duplicate records are created", "Nothing is imported"],
              1,
              "Without coalesce every row is inserted, so the second import duplicates the first.",
            ),
          ],
        },
        {
          id: "integrations",
          title: "Integrations",
          minutes: 12,
          blocks: [
            text(`
## Ways systems connect

- **REST APIs**: the most common. The **Table API** reads and writes any table at \`/api/now/table/{tableName}\`, subject to the integration user's roles and ACLs. **Scripted REST APIs** expose custom endpoints.
- **REST API Explorer**: try API calls in the instance and generate sample code.
- **Outbound REST messages**: ServiceNow calls other systems' APIs.
- **SOAP** web services: older, still found in legacy integrations.
- **IntegrationHub**: Flow Designer **spokes** with ready-made actions for common systems.
- **Import sets** with JDBC, LDAP or REST data sources for bulk data.
- **Email**: inbound email actions and outbound notifications.

## The MID Server

The **Management, Instrumentation and Discovery (MID) Server** is a small Java application installed inside your network. It talks **outbound** to the instance and lets ServiceNow reach systems that are not on the internet: Discovery, on-premises integrations, JDBC imports, LDAP, orchestration.
`),
            text(`
## Securing integrations

- Create a dedicated **integration user** with only the roles it needs; mark it as a **web service access only** user so it cannot sign in to the interface.
- Prefer **OAuth 2.0** tokens over basic authentication where possible, and store credentials in **credential records**, not in scripts.
- Limit which IP addresses may call the instance if possible (IP address access control).
- Log and monitor integration errors; a silent failing integration causes data drift.

## Choosing an approach

| Need | Use |
| --- | --- |
| Another system creates incidents in ServiceNow | Table API or a Scripted REST API |
| A flow must post a message to Teams | IntegrationHub spoke |
| Nightly user feed from HR | Scheduled import (or a Service Graph connector) |
| Discover servers in the data centre | Discovery through a MID Server |
`),
            tip("Give every integration its own user. When something goes wrong, the audit trail tells you exactly which integration made the change."),
            check(
              "Which component lets the instance reach systems inside a private network?",
              ["MID Server", "Service Portal", "Theme Builder"],
              0,
              "The MID Server runs inside the network and connects outbound to the instance.",
            ),
          ],
        },
      ],
    },
    {
      id: "instance-management",
      title: "Instance management",
      lessons: [
        {
          id: "update-sets",
          title: "Update sets",
          minutes: 13,
          blocks: [
            text(`
## What update sets capture

An **update set** records **configuration changes** (customer updates) made on an instance so they can be moved to another instance. Captured: forms, lists, fields, business rules, UI policies, flows, notifications, catalog items, system properties and similar.

**Not** captured by default: **data**, such as users, groups, incidents and most record content. Move data with import sets or other methods. (A few things, such as homepages and some schedules, need special handling.)

## Working with update sets

1. Create an update set in **development** with a clear name ("CHG0040123 – Laptop catalog item").
2. Select it as your **current update set** (in the update set picker) **before** making changes.
3. Make and test the changes; they are recorded as **customer updates** in the update set.
4. Mark it **Complete**.
5. In the target instance, **retrieve** it (from the source instance, or by importing the exported XML).
6. **Preview** it: the preview finds problems such as missing dependencies or newer versions in the target.
7. Resolve every preview problem, then **Commit**.
`),
            text(`
## Rules that save pain

- Never make configuration changes in the **Default** update set unless you mean to; changes there are easy to lose track of.
- One update set per story or change; **batch** related update sets with a parent when they must move together.
- Commit update sets **in the order they were completed** in the source.
- Changes in a **scoped application** go to an update set for that scope; check the **application scope** picker too.
- Back out an update set only as a last resort; it can cause problems if later changes depend on it.

**Update Set Previewer** problems look like: "Could not find a record in a table referenced by this update". Fix them by moving the missing dependency first or skipping updates you do not want.
`),
            tip("Before you start any configuration, glance at the update set picker. Most update set mistakes happen in the first minute of work."),
            check(
              "Which of these is NOT captured in an update set by default?",
              ["A new business rule", "A new user record", "A form layout change"],
              1,
              "Update sets capture configuration, not data such as user records.",
            ),
          ],
        },
        {
          id: "instance",
          title: "Clones, upgrades and applications",
          minutes: 12,
          blocks: [
            text(`
## Cloning

A **clone** copies one instance (usually **production**) over another (development or test), so sub-production has realistic data and configuration.

- **Exclude** tables you do not want copied (for example large audit or log tables) and **preserve** data on the target that should survive (for example its own integration credentials, email settings, or in-progress update sets).
- **Data preservers** and **exclusion lists** are set up before requesting the clone.
- **Clean-up scripts** run after the clone (for example disabling outbound email, so test notifications do not reach real users).
- Export any in-progress update sets from the target first; the clone overwrites them.

## Upgrades

ServiceNow upgrades each instance to new releases (customers schedule them within the support window). After an upgrade:

- Review **skipped records**: files you customised that the upgrade did not overwrite. Decide for each whether to keep your version, take the new base version or merge.
- **Test** key processes in a sub-production instance first, using the **Automated Test Framework (ATF)** where possible.
- The fewer changes to out-of-box files, the easier upgrades are.
`),
            text(`
## Scoped applications and the Store

- **Scoped applications** keep a custom app's tables, scripts and configuration inside a **namespace** (\`x_vendor_app_\`), with controls on what other scopes can access. Global changes affect the whole platform.
- **App Engine Studio** and **ServiceNow Studio** help build scoped apps; **source control** integration connects apps to Git.
- The **ServiceNow Store** offers certified apps and integrations from ServiceNow and partners; installed apps update through the **Application Manager**.
- The **application repository** lets you publish your own scoped app from development and install it on other instances, as an alternative to update sets.

## Instance health

**HealthScan** and **instance scan** checks find performance, security and upgradability issues. Watch slow transactions, large tables and scheduled job failures, and keep system logs tidy.
`),
            tip("After every upgrade, open the skipped records list and work through it. Ignored skipped records turn into strange bugs months later."),
            check(
              "After an upgrade, which list shows customised files the upgrade did not overwrite?",
              ["Skipped records", "Import set rows", "Deleted records"],
              0,
              "Skipped records need review after each upgrade.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Imports ----------------
    ord("imports", "easy", "Put the steps of an import in order.", ["Create or choose a data source", "Load data into the import set table", "Run the transform map", "Review the import results"], "Source → staging → transform → review."),
    mc("imports", "medium", "Which of these can be an import data source?", ["An Excel or CSV file", "A UI policy", "A dashboard", "A theme"], 0, "Files, JDBC, LDAP and REST sources can feed import sets."),
    mc("imports", "medium", "Why do imports use a staging table?", ["To check and map data before it reaches real tables", "To make imports slower", "Because target tables cannot be written", "To store reports"], 0, "Staging keeps raw data separate until it has been transformed."),
    tf("imports", "medium", "Data policies can reject imported rows that are missing mandatory fields.", true, "Data policies run on the server and apply to imports."),
    mc("imports", "medium", "You need to import users and their locations. What should you import first?", ["Locations", "Users", "Both at exactly the same time", "Neither"], 0, "Import referenced data (locations) before the records that reference it (users)."),

    // ---------------- Transforms ----------------
    mc("transforms", "easy", "What does coalesce do in a transform map?", ["Identifies existing records so they are updated instead of duplicated", "Deletes old rows", "Encrypts data", "Sends emails"], 0, "Coalesce fields are used to match existing records."),
    mc("transforms", "medium", "A row's coalesce value matches no existing record. What happens?", ["The row is ignored", "A new record is inserted", "The import stops", "The target table is cleared"], 1, "No match means insert."),
    mc("transforms", "medium", "Which transform script runs once before any rows are processed?", ["onStart", "onBefore", "onAfter", "onComplete"], 0, "onStart runs once at the beginning; onBefore runs for each row."),
    tf("transforms", "medium", "When several field maps are marked as coalesce, all of them must match to update an existing record.", true, "Multiple coalesce fields work together."),
    mc("transforms", "hard", "You are migrating 50,000 historical incidents and do not want notifications or flows to fire. What should you change?", ["Turn off \"Run business rules\" on the transform map", "Delete all notifications", "Turn off the instance", "Use a UI policy"], 0, "Disabling Run business rules prevents business rules and related automation from firing during the transform."),

    // ---------------- Integrations ----------------
    st("integrations", "medium", "Complete the Table API path: /api/now/____/incident (one word).", ["table"], "The Table API path is /api/now/table/{tableName}."),
    mc("integrations", "easy", "Which tool lets you try ServiceNow API calls inside the instance and generate sample code?", ["REST API Explorer", "Form Builder", "Schema map", "CAB Workbench"], 0, "REST API Explorer builds and tests REST requests."),
    mc("integrations", "medium", "What is the best way to set up an account for a system that calls ServiceNow's API?", ["Use an admin's personal account", "Create a dedicated integration user with only the roles it needs, set to web service access only", "Share the admin password", "Allow anonymous access"], 1, "Dedicated, least-privilege integration users are safer and easier to audit."),
    tf("integrations", "medium", "The MID Server connects outbound to the instance, so no inbound firewall opening to the network is needed for it.", true, "The MID Server initiates communication with the instance."),
    ms("integrations", "medium", "Which are ways to integrate other systems with ServiceNow? Select all that apply.", ["Table API", "IntegrationHub spokes", "Import sets with a JDBC data source", "Theme Builder"], [0, 1, 2], "APIs, spokes and import sets are integration methods; Theme Builder is for branding."),

    // ---------------- Update sets ----------------
    mc("update-sets", "easy", "What does an update set capture?", ["Configuration changes", "All incidents", "User passwords", "Email attachments"], 0, "Update sets capture configuration (customer updates), not data."),
    ord("update-sets", "medium", "Put these update set steps in order.", ["Select the update set as current", "Make and test the changes", "Mark it Complete", "Retrieve it on the target instance", "Preview and resolve problems", "Commit"], "Select, change, complete, retrieve, preview, then commit."),
    tf("update-sets", "medium", "New user records are captured in update sets by default.", false, "User records are data and are not captured by default."),
    mc("update-sets", "medium", "What must you do before committing a retrieved update set?", ["Preview it and resolve every problem", "Clone production", "Delete the Default update set", "Restart the instance"], 0, "The preview finds conflicts and missing dependencies that must be resolved."),
    mc("update-sets", "medium", "Several update sets must always move together. What helps?", ["Batching them under a parent update set", "Putting everything in Default", "Exporting to PDF", "Using a dashboard"], 0, "Update set batching groups related update sets."),

    // ---------------- Instance ----------------
    mc("instance", "easy", "What does a clone usually do?", ["Copies production over a sub-production instance", "Creates a new user", "Upgrades the instance", "Deletes all data"], 0, "Clones refresh development or test from production."),
    mc("instance", "medium", "Which settings keep certain target-instance data during a clone?", ["Data preservers", "Coalesce fields", "View rules", "Report sources"], 0, "Data preservers keep chosen records on the target instance."),
    mc("instance", "medium", "After an upgrade, what must admins review for customised files?", ["Skipped records", "Import set rows", "Knowledge feedback", "Email log"], 0, "Skipped records show customisations the upgrade did not overwrite."),
    mc("instance", "medium", "Which namespace prefix do scoped application tables use?", ["x_", "u_", "sys_", "cmdb_"], 0, "Scoped apps use x_<vendor>_<app>_."),
    mc("instance", "hard", "Which framework automates regression tests, for example before and after an upgrade?", ["Automated Test Framework (ATF)", "Performance Analytics", "Service Graph", "CSDM"], 0, "ATF runs automated tests of forms, flows and catalog items."),
  ],
};
