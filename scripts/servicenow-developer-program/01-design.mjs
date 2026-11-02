import { check, mc, ms, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 1,
  id: "servicenow-dev-design",
  title: "Designing and Creating an Application",
  summary: "Course 1 of 6 in the Zebron ServiceNow Application Developer Program. Decide whether an application belongs on ServiceNow, create a scoped application, design its data model and give it menus and modules.",
  description: `
Every ServiceNow application starts with design decisions: should this be built on the platform at all, what data does it hold, how do people reach it, and what scope protects it. This course covers those decisions and the first build steps in ServiceNow Studio.

The program assumes you know the platform as an administrator (the ServiceNow Administrator Program covers it). Build every lesson on a free Personal Developer Instance from developer.servicenow.com.

Each lesson ends with a quick check. The final exam is drawn from the **Designing and Creating an Application** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "violet",
  outcomes: [
    "Decide whether an application is a good fit for ServiceNow",
    "Create a scoped application and explain what its scope does",
    "Design a data model with new and extended tables, fields and relationships",
    "Give an application a menu and modules",
    "Find and manage an application's files",
  ],
  skills: ["Application design", "Application scope", "Data modelling", "ServiceNow Studio", "Application menus"],
  quiz: {
    name: "Designing and Creating an Application",
    slug: "servicenow-dev-design",
    description: "Practice questions for Course 1 of the ServiceNow Application Developer Program: fit, scope, data model and modules.",
    tags: ["servicenow", "cad", "app-development"],
  },
  topics: [
    { key: "fit", name: "Is ServiceNow a good fit?", description: "Workflow, data, users and integration questions to ask first." },
    { key: "create-app", name: "Creating an application", description: "ServiceNow Studio, App Engine Studio and application files." },
    { key: "scope", name: "Application scope", description: "Namespaces, scope prefixes, the scope picker and protection." },
    { key: "data-model", name: "Designing the data model", description: "New or extended tables, fields, references and relationships." },
    { key: "modules", name: "Application menus and modules", description: "How users reach the application from the navigator." },
  ],
  modules: [
    {
      id: "decide-and-create",
      title: "Decide and create",
      lessons: [
        {
          id: "fit",
          title: "Is this application a good fit for ServiceNow?",
          minutes: 10,
          blocks: [
            text(`
## Questions to ask before building

ServiceNow is a workflow platform with a database, forms, security, automation and integrations built in. An application is a **good fit** when most of these are true:

| Question | Good fit when… |
| --- | --- |
| Is there a **process** with steps, approvals or hand-offs? | Yes: requests, cases, onboarding, inspections |
| Is the data **structured** (records with fields)? | Yes: it fits tables, not large files or media |
| Do **people** need forms, lists, notifications and reports? | Yes |
| Does it need **roles and access control**? | Yes, per user or group |
| Does it connect to **other systems** by REST, import or email? | Yes, through standard integration tools |
| Does it reuse **existing platform data** (users, groups, CMDB, locations)? | Yes: a strong reason to build on ServiceNow |

## Poor fits

- Heavy **multimedia** storage or editing, real-time games, complex graphics.
- Large-scale **analytics** over huge data sets (use a data warehouse; ServiceNow can feed it).
- Applications that need software installed on users' devices.
- A process that already lives well in another system of record with no workflow need.

## Before you start

Write down the **users and roles**, the **data** (tables and fields), the **process** (states and who acts), **notifications**, **reports** and **integrations**. Check the **ServiceNow Store** and existing applications first: do not rebuild something that already exists.
`),
            tip("A spreadsheet passed around by email, with approvals done in chat, is a classic sign of a process that fits ServiceNow well."),
            check(
              "Which application is the weakest fit for ServiceNow?",
              ["Equipment loan requests with approvals", "A video editing tool", "Facility inspection cases with assignments"],
              1,
              "ServiceNow suits structured, process-driven work; media editing is a poor fit.",
            ),
          ],
        },
        {
          id: "create-app",
          title: "Creating an application",
          minutes: 11,
          blocks: [
            text(`
## Where applications are built

- **ServiceNow Studio** (the current developer workspace; older instances use **Studio**): create applications, add and edit application files, and link to source control.
- **App Engine Studio (AES)**: a guided, low-code builder for citizen developers, with templates for data, experiences and logic.
- Classic modules (System Definition → Tables, Business Rules…) still work, but the files belong to whichever application is **currently selected** in the scope picker.

## Creating one

1. Open ServiceNow Studio and choose **Create application**.
2. Give it a **name**. The platform proposes a **scope** such as \`x_acme_loans\` (x_ + vendor prefix + short name).
3. Choose whether to **create a table**, roles and a menu now (you can add them later).
4. The application record (sys_app) is created, and your **current application** switches to it.

## Application files

Everything that makes up the application is an **application file**: tables, fields, forms, business rules, script includes, client scripts, ACLs, roles, menus, modules, flows, properties. Each records the application it belongs to. The application's files list shows them all, and they move together when the application is published or committed to source control.

> Always check the **application picker** before creating or editing anything: changes are saved in the current application.
`),
            check(
              "What decides which application a new business rule belongs to?",
              ["The table it runs on", "The application currently selected", "The user's language"],
              1,
              "Files are created in the current application shown in the application picker.",
            ),
          ],
        },
        {
          id: "scope",
          title: "Application scope",
          minutes: 11,
          blocks: [
            text(`
## What scope is

**Application scope** is the boundary around an application. It identifies the application's files and data and **restricts what other applications can do with them**.

- Every scoped application has a **namespace**, its scope name (for example \`x_acme_loans\`).
- Its tables and script includes are named with that prefix (\`x_acme_loans_request\`, \`x_acme_loans.LoanUtils\`), so two applications cannot clash.
- **Global** is the shared scope used by legacy and platform customizations.

## What scope protects

| Inside the scope | Other scopes |
| --- | --- |
| Full access to its own tables, scripts and properties | Only what the application allows through its **application access** settings and **cross-scope privileges** |

- Server-side scripts in a scoped application use **scoped APIs**; some global APIs are not available.
- Editing a scoped application's files from another scope is blocked, which protects it from accidental changes.

## Why build scoped

ServiceNow recommends a **scoped application** for new work: it is isolated, easier to move between instances, safer to upgrade, and can be published to an application repository or the Store.
`),
            tip("If you see \"This record is in a different application scope\", switch the application picker to the record's application before editing."),
            check(
              "What is the main purpose of an application's namespace (scope name)?",
              ["To set the instance's colours", "To identify the application's files and prevent naming conflicts", "To store user passwords"],
              1,
              "The namespace prefix identifies files and keeps names unique across applications.",
            ),
          ],
        },
      ],
    },
    {
      id: "data-and-navigation",
      title: "Data and navigation",
      lessons: [
        {
          id: "data-model",
          title: "Designing and implementing the data model",
          minutes: 13,
          blocks: [
            text(`
## New table or extended table?

| Choose | When |
| --- | --- |
| **Extend Task** | The records are work that people are assigned (number, state, assignment group, SLAs, approvals, activity) |
| **Extend another table** | Your record *is a kind of* an existing record (a laptop extends Hardware) |
| **New base table** | The data is new and does not behave like an existing table (reference data, settings, catalogue of products) |

Extending a table **inherits** its fields and much of its behaviour. The parent and child share the parent's fields; the child adds its own.

## Fields

- Each field has a **type** (String, Integer, Date/Time, Choice, Reference, True/False, Journal…), a **label**, a **column name** and **dictionary** settings such as mandatory, default value, max length and read-only.
- A **Reference** field points to a record in another table (many-to-one), such as Requested for → User.
- Use **Choice** fields for fixed lists of values.

## Relationships

| Relationship | Built with |
| --- | --- |
| Many records to one | A Reference field |
| One record to many | The reverse of a reference, shown as a **related list** |
| Many to many | A **many-to-many** table (m2m) between two tables |

Use the **schema map** to see how tables connect.

> Design first on paper: tables, fields, references and which table extends what. Changing a table's parent later is difficult.
`),
            tip("Extending Task gives you numbering, assignment, approvals and SLAs for free. Use it whenever records are pieces of work."),
            check(
              "Requests in your application are assigned to people and need states and SLAs. What should the table do?",
              ["Extend Task", "Be a new base table with no parent", "Extend the User table"],
              0,
              "Extending Task inherits assignment, state, approvals and SLA support.",
            ),
          ],
        },
        {
          id: "modules",
          title: "Application menus and modules",
          minutes: 9,
          blocks: [
            text(`
## How users reach an application

- An **application menu** is the heading in the navigator (All menu), such as "Equipment Loans".
- **Modules** are the links under it: "Create New", "My Requests", "All Requests", "Reports".

## Module link types

| Link type | Opens |
| --- | --- |
| **List of Records** | A list of a table, optionally with a filter (for example Active is true) |
| **New Record** | A new form for a table |
| **Single Record** | One specific record |
| **URL (from Arguments)** | Any URL, such as a portal page |
| **Separator** | A heading to group modules |
| **Homepage / Dashboard**, **Script**, **Timeline**… | Other content |

## Order and access

- The **order** field sorts menus and modules.
- **Roles** on the application menu and on each module decide who sees them. A user who has none of the roles does not see the menu.
- Hiding a module does **not** secure the data: ACLs do that (see the Security course).

## Creating them

Studio or the create-table dialog can add a menu and modules automatically; you can also create them in **System Definition → Application Menus**.
`),
            check(
              "Which module link type opens a filtered list of active requests?",
              ["New Record", "List of Records", "Separator"],
              1,
              "List of Records opens a table's list, optionally with a filter.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Fit ----------------
    mc("fit", "easy", "Which is the strongest sign that an application fits ServiceNow?", ["A process with steps, approvals and hand-offs on structured records", "A need to edit large video files", "A real-time multiplayer game", "Software that must run offline on laptops"], 0, "ServiceNow suits structured, workflow-driven processes."),
    ms("fit", "medium", "Which questions should you answer before building an application? Select all that apply.", ["Who are the users and roles?", "What data and tables are needed?", "Does the Store already have a suitable application?", "Which font will the logo use?"], [0, 1, 2], "Users, data and existing solutions shape the design; the font does not."),
    tf("fit", "easy", "Reusing platform data such as users, groups and locations is a reason to build on ServiceNow.", true, "Shared platform data is one of the platform's advantages."),
    mc("fit", "medium", "A team wants deep analytics across billions of rows of sensor data. What is the best approach?", ["Use a data warehouse or analytics platform, fed by ServiceNow where needed", "Store every row in a custom ServiceNow table", "Use a client script", "Use an update set"], 0, "Large-scale analytics fits a dedicated analytics platform."),
    mc("fit", "easy", "Where should you look before building an application that might already exist?", ["The ServiceNow Store and existing applications", "The system log", "The transform map", "The email log"], 0, "Check the Store and existing apps to avoid rebuilding."),

    // ---------------- Create app ----------------
    mc("create-app", "easy", "Which tool is a guided, low-code builder for citizen developers?", ["App Engine Studio", "Script Debugger", "Import Set Table", "Update Set Picker"], 0, "App Engine Studio guides people through data, experience and logic."),
    mc("create-app", "medium", "A developer creates a client script while the application picker shows Global. Where is the script saved?", ["In the Global scope", "In the last scoped application used", "Nowhere until published", "In every application"], 0, "Files are created in the current application."),
    ms("create-app", "medium", "Which are application files? Select all that apply.", ["Tables", "Business rules", "Modules", "End-user incident records"], [0, 1, 2], "Configuration and code are application files; ordinary data records are not."),
    tf("create-app", "easy", "An application's files move together when it is published or committed to source control.", true, "The application is the unit of delivery."),
    mc("create-app", "medium", "Which record represents a custom scoped application?", ["The application record (sys_app)", "An incident", "A user preference", "A transform map"], 0, "Each custom application has an application record in sys_app."),

    // ---------------- Scope ----------------
    mc("scope", "easy", "What does an application's namespace prevent?", ["Naming conflicts between applications", "Users logging in", "Email from being sent", "Reports from running"], 0, "The scope prefix keeps file names unique."),
    mc("scope", "medium", "Which name follows the pattern of a table in the scoped application x_acme_loans?", ["x_acme_loans_request", "u_request", "incident_request", "sys_request"], 0, "Scoped tables start with the scope name."),
    tf("scope", "medium", "Another application can always change a scoped application's records without any settings.", false, "Other scopes get only what the application's access settings and cross-scope privileges allow."),
    ms("scope", "medium", "Why does ServiceNow recommend scoped applications for new work? Select all that apply.", ["Isolation from other applications", "Easier to move between instances", "Can be published to a repository or the Store", "They need no testing"], [0, 1, 2], "Scoped apps are isolated and portable; they still need testing."),
    mc("scope", "medium", "You open a record and see that it is in a different application scope. What should you do to edit it?", ["Switch the application picker to its application", "Delete it", "Impersonate a user", "Clear the cache"], 0, "Change to the record's application before editing."),

    // ---------------- Data model ----------------
    mc("data-model", "easy", "Records in your application are assigned work items with states. Which table should you extend?", ["Task", "User", "Location", "Department"], 0, "Task provides assignment, state, approvals and SLAs."),
    mc("data-model", "medium", "Which field type creates a many-to-one link to another table?", ["Reference", "Choice", "Journal", "True/False"], 0, "A Reference field points to one record in another table."),
    mc("data-model", "medium", "How do you model a many-to-many relationship between two tables?", ["With a many-to-many (m2m) table between them", "With a Choice field", "With a client script", "With a module"], 0, "An m2m table links records of both tables."),
    tf("data-model", "medium", "A child table inherits the fields of the table it extends.", true, "Extension shares the parent's fields with the child."),
    mc("data-model", "medium", "Which tool shows how tables reference and extend each other?", ["Schema map", "Script debugger", "Update set preview", "Email log"], 0, "The schema map visualises table relationships."),

    // ---------------- Modules ----------------
    mc("modules", "easy", "What is the heading in the navigator that groups an application's links?", ["Application menu", "Related list", "Form section", "Data pill"], 0, "The application menu groups the modules."),
    mc("modules", "medium", "Which module link type opens an empty form to create a record?", ["New Record", "List of Records", "Single Record", "Separator"], 0, "New Record opens a new form."),
    tf("modules", "medium", "Hiding a module from a role is enough to stop that role reading the table's data.", false, "Modules only control navigation; ACLs secure the data."),
    mc("modules", "medium", "What decides who sees an application menu in the navigator?", ["The roles on the application menu", "The order field", "The table's label", "The scope prefix"], 0, "Users need one of the menu's roles to see it."),
    mc("modules", "easy", "Which field sorts modules under an application menu?", ["Order", "Hint", "Window name", "Filter"], 0, "Order controls the position of menus and modules."),
  ],
};
