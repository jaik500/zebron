import { check, mc, ms, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 2,
  id: "servicenow-dev-ui",
  title: "Application User Interface",
  summary: "Course 2 of 6 in the Zebron ServiceNow Application Developer Program. Design forms and fields, write and debug client and server scripts, and use a record producer as an application's interface.",
  description: `
Users meet an application through its forms, lists and portal pages. This course covers designing forms and fields, the client-side and server-side scripts that make them behave, how to test and debug both, and record producers as a simple front door.

Each lesson ends with a quick check. The final exam is drawn from the **Application User Interface** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "violet",
  outcomes: [
    "Create, design and customise forms with sections and views",
    "Add and remove fields on forms and tables safely",
    "Write, test and debug client scripts with the g_form API",
    "Write, test and debug business rules and script includes",
    "Use a record producer as an application's user interface",
  ],
  skills: ["Form design", "Client scripts", "Business rules", "Script includes", "Record producers"],
  quiz: {
    name: "Application User Interface",
    slug: "servicenow-dev-ui",
    description: "Practice questions for Course 2 of the ServiceNow Application Developer Program: forms, fields, client and server scripts, record producers.",
    tags: ["servicenow", "cad", "ui", "scripting"],
  },
  topics: [
    { key: "forms", name: "Forms and views", description: "Form Builder, Form Layout, sections, views and related lists." },
    { key: "fields", name: "Adding and removing fields", description: "Form fields versus table fields, dictionary and safe removal." },
    { key: "record-producers", name: "Record producers", description: "A catalog front door that creates records in your table." },
    { key: "client-scripts", name: "Client-side scripts", description: "Client script types, g_form, g_user, testing and debugging." },
    { key: "server-scripts", name: "Server-side scripts", description: "Business rules, script includes, GlideRecord and debugging." },
  ],
  modules: [
    {
      id: "forms-and-fields",
      title: "Forms and fields",
      lessons: [
        {
          id: "forms",
          title: "Creating and designing forms",
          minutes: 11,
          blocks: [
            text(`
## Tools

- **Form Builder** (in ServiceNow Studio or from the form context menu → Configure → Form Builder): drag-and-drop fields, sections and formatters, and create new fields in place.
- **Form Layout** (Configure → Form Layout): a slush bucket list to choose and order fields and sections.

## Building blocks

| Element | Purpose |
| --- | --- |
| **Sections** | Group fields under headings; shown as tabs or stacked, per user preference |
| **Formatters** | Non-field elements such as the activity stream, process flow, or a parent breadcrumb |
| **Related lists** | Records that reference this one (for example tasks of a request) |
| **Annotations** | Helpful text on the form |
| **UI actions** | Buttons and links (Submit, Approve…) |

## Views

A **view** is a named layout of a form or list (Default, Self Service, Mobile…). Different users or modules can open different views of the same table. Changes in Form Layout apply to the **view you are editing**.

## Personalise versus configure

Users can **personalise** (hide fields in their own list columns, choose tabbed forms). Developers **configure** the form for everyone; configuration changes are application files.
`),
            check(
              "What is a view?",
              ["A named layout of a form or list", "A database index", "A type of business rule"],
              0,
              "Views let the same table be shown with different layouts.",
            ),
          ],
        },
        {
          id: "fields",
          title: "Adding and removing fields",
          minutes: 10,
          blocks: [
            text(`
## Form versus table

- **Removing a field from a form** only hides it from that view. The column and its data stay in the table.
- **Deleting a field from the table** (the dictionary entry) removes the column **and all its data**. It cannot be undone.

## Adding fields

1. From Form Builder or Form Layout, create a field: label, type, and column name.
2. In a scoped application, the column name gets the scope prefix where needed (for example \`x_acme_loans_\`); in global, custom columns start with \`u_\`.
3. Set dictionary options: mandatory, default value, read-only, max length, reference qualifiers.

## Dictionary overrides

On an **extended table**, a **dictionary override** changes a parent field's behaviour for that child only (different default, mandatory, or reference qualifier) without changing the parent.

## Good practice

- Reuse existing fields before adding new ones.
- Avoid deleting fields that hold data; mark them inactive or remove them from forms first.
- Check that scripts, reports and integrations do not use a field before deleting it.
`),
            tip("Removing a field from a form is safe and reversible. Deleting it from the table destroys data."),
            check(
              "What happens to the data when you remove a field from a form layout?",
              ["It is deleted", "It stays in the table", "It moves to another table"],
              1,
              "Removing a field from a form only hides it; the column and data remain.",
            ),
          ],
        },
        {
          id: "record-producers",
          title: "Record producers as an application's interface",
          minutes: 9,
          blocks: [
            text(`
## What a record producer is

A **record producer** is a Service Catalog item that **creates a record in any table** (not a request). Users fill in a friendly form in the Service Portal or catalog, and a record is created in your application's table.

## Building one

1. Create it from the table (Studio, or the table record's **Add to Service Catalog** link) or in **Service Catalog → Record Producers**.
2. Choose the **table** it creates records in.
3. Add **variables** (the questions). Variables with the same name as a table field are mapped automatically, or map them with "Map to field".
4. Optional **script**: runs on the server when the record is created. Use \`producer.variable_name\` to read answers and \`current\` to set fields on the new record.
5. Set where it appears (catalogs and categories) and who can see it (user criteria).

## Why use one

- A simple, guided form for people who should not see the full back-office form.
- Works in the Service Portal and Employee Center.
- No custom portal page needed.
`),
            check(
              "Which object reads a variable's answer in a record producer script?",
              ["producer", "g_form", "previous"],
              0,
              "producer.variable_name returns the submitted answer.",
            ),
          ],
        },
      ],
    },
    {
      id: "scripts",
      title: "Client and server scripts",
      lessons: [
        {
          id: "client-scripts",
          title: "Client-side scripts: write, test and debug",
          minutes: 13,
          blocks: [
            text(`
## Client script types

| Type | Runs when | Typical use |
| --- | --- | --- |
| **onLoad** | The form opens | Set defaults, hide fields, show messages |
| **onChange** | A chosen field changes (and on load, check \`isLoading\`) | React to a value: fill related fields, validate |
| **onSubmit** | The form is submitted | Final validation; \`return false\` cancels the submit |
| **onCellEdit** | A cell is edited in a list | Validate list edits |

## The main client APIs

- **g_form**: \`getValue\`, \`setValue\`, \`setMandatory\`, \`setDisplay\`, \`setReadOnly\`, \`addInfoMessage\`, \`showFieldMsg\`, \`clearValue\`.
- **g_user**: \`userID\`, \`hasRole()\`, \`getFullName()\`.
- **GlideAjax**: call a client-callable script include on the server without reloading the form.

\`\`\`javascript
function onChange(control, oldValue, newValue, isLoading) {
  if (isLoading || newValue === '') return;
  if (newValue === 'laptop') g_form.setMandatory('justification', true);
}
\`\`\`

## Rules of thumb

- Prefer a **UI policy** (no code) for mandatory, read-only and visible.
- Do not use GlideRecord or synchronous calls in client scripts: they slow the form. Use GlideAjax (asynchronous) or g_scratchpad from a display business rule.
- Client-side checks improve the experience but **do not protect data**: validate on the server too.

## Testing and debugging

- Browser developer tools: console and breakpoints (scripts are visible in the browser).
- \`console.log()\` or \`jslog()\` for messages; the **JavaScript Log and Field Watcher** (Settings → Developer) shows client logs and every change to a watched field.
- Test as other users with **impersonation**.
`),
            tip("If a field behaves strangely, use Field Watcher: it lists every client script, UI policy and ACL that touched it."),
            check(
              "How does an onSubmit client script stop the form from being saved?",
              ["return false", "g_form.clearValue()", "current.setAbortAction(true)"],
              0,
              "Returning false from onSubmit cancels the submission.",
            ),
          ],
        },
        {
          id: "server-scripts",
          title: "Server-side scripts: write, test and debug",
          minutes: 14,
          blocks: [
            text(`
## Business rules

A **business rule** runs on the server when a record is queried, inserted, updated or deleted, from **any** source: forms, lists, imports, web services.

| When | Use for |
| --- | --- |
| **before** | Change the current record before it is saved; validate and abort with \`current.setAbortAction(true)\` |
| **after** | Change other records after this one is saved |
| **async** | Slow work in the background after saving |
| **display** | Put server data in \`g_scratchpad\` for client scripts |

Objects: \`current\` (the record now), \`previous\` (before the change), \`gs\` (GlideSystem). Add a **condition** so the rule runs only when needed.

## Script includes

A **script include** holds reusable server code, loaded only when it is called.

\`\`\`javascript
var LoanUtils = Class.create();
LoanUtils.prototype = {
  initialize: function() {},
  openLoansFor: function(userId) {
    var gr = new GlideRecord('x_acme_loans_request');
    gr.addQuery('requested_for', userId);
    gr.addActiveQuery();
    gr.query();
    return gr.getRowCount();
  },
  type: 'LoanUtils'
};
\`\`\`

Tick **Client callable** (extending AbstractAjaxProcessor) to call it from client scripts with GlideAjax.

## GlideRecord basics

\`addQuery\`, \`addEncodedQuery\`, \`query\`, \`next\`, \`get\`, \`getValue\`, \`setValue\`, \`insert\`, \`update\`, \`deleteRecord\`. Prefer **GlideAggregate** for counts on large tables.

## Testing and debugging

- **Script Debugger**: set breakpoints in server scripts and step through them, inspecting variables.
- **Logs**: \`gs.info()\`, \`gs.warn()\`, \`gs.error()\` (scoped apps write with the scope's prefix) and **System Logs → All**.
- **Debug Business Rule** (session debug) shows which rules ran and in what order.
- **Scripts - Background** runs server code once (on non-production instances).
`),
            tip("Never call current.update() in a before business rule: the save is already happening, and it can loop."),
            check(
              "Which runs whether a record comes from a form, an import or a web service?",
              ["onSubmit client script", "Business rule", "UI policy"],
              1,
              "Business rules run on the server for every source; client scripts only run in the browser.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Forms ----------------
    mc("forms", "easy", "Which tool gives drag-and-drop form design and lets you create fields in place?", ["Form Builder", "Script Debugger", "Transform Map", "Field Watcher"], 0, "Form Builder is the drag-and-drop form designer."),
    mc("forms", "medium", "Which form element shows records that reference the current record?", ["Related list", "Annotation", "Formatter", "Choice list"], 0, "Related lists show referencing records."),
    tf("forms", "medium", "Changes made in Form Layout apply only to the view being edited.", true, "Each view has its own layout."),
    ms("forms", "medium", "Which are form building blocks? Select all that apply.", ["Sections", "Formatters", "Related lists", "Transform scripts"], [0, 1, 2], "Transform scripts belong to imports, not forms."),
    mc("forms", "medium", "Service desk agents and self-service users need different layouts of the same table. What should you use?", ["Different views", "Two tables", "A business rule", "An update set"], 0, "Views show the same table with different layouts."),

    // ---------------- Fields ----------------
    mc("fields", "easy", "Deleting a field's dictionary entry from a table does what to its data?", ["Deletes it permanently", "Keeps it hidden", "Archives it", "Moves it to the parent table"], 0, "Deleting the column removes its data and cannot be undone."),
    mc("fields", "medium", "A child table needs a parent field to be mandatory only on the child. What do you create?", ["A dictionary override", "A new parent field", "A client script on the parent", "A view"], 0, "Dictionary overrides change parent fields for one child table."),
    tf("fields", "easy", "Removing a field from a form leaves the column and its data in the table.", true, "Form layout only controls what is displayed."),
    ms("fields", "medium", "Before deleting a table field, what should you check? Select all that apply.", ["Scripts that use it", "Reports that use it", "Integrations that send or read it", "The colour of the form header"], [0, 1, 2], "Find dependencies before removing data."),
    mc("fields", "medium", "In the global scope, custom column names usually start with…", ["u_", "x_", "sys_", "cmdb_"], 0, "Global custom fields are prefixed u_; scoped ones use the scope prefix."),

    // ---------------- Client scripts ----------------
    mc("client-scripts", "easy", "Which client script type runs when a list cell is edited?", ["onCellEdit", "onLoad", "onChange", "onSubmit"], 0, "onCellEdit runs on list edits."),
    mc("client-scripts", "medium", "Which call makes the justification field mandatory on the form?", ["g_form.setMandatory('justification', true)", "current.setMandatory('justification')", "gs.setMandatory('justification')", "g_user.setMandatory('justification')"], 0, "g_form controls fields on the client form."),
    mc("client-scripts", "medium", "Why check isLoading in an onChange client script?", ["onChange also runs when the form loads", "It speeds up the database", "It is required for GlideRecord", "It disables UI policies"], 0, "onChange fires on load too; isLoading lets you skip that run."),
    ms("client-scripts", "medium", "Which help debug client-side behaviour? Select all that apply.", ["Browser developer tools", "JavaScript Log and Field Watcher", "Impersonating another user", "Scripts - Background"], [0, 1, 2], "Scripts - Background runs server code, not client code."),
    tf("client-scripts", "medium", "Client-side validation alone is enough to protect data that also arrives through web services.", false, "Only server-side logic applies to every source."),

    // ---------------- Server scripts ----------------
    mc("server-scripts", "easy", "Which business rule timing changes the current record before it is saved?", ["before", "after", "async", "display"], 0, "Before rules change current before the database write."),
    mc("server-scripts", "medium", "How does a before business rule stop a record from being saved?", ["current.setAbortAction(true)", "return false", "g_form.clearValue()", "gs.abort()"], 0, "setAbortAction(true) cancels the database operation."),
    mc("server-scripts", "medium", "Which display business rule object passes data to client scripts?", ["g_scratchpad", "g_form", "producer", "previous"], 0, "Display rules fill g_scratchpad for client scripts."),
    ms("server-scripts", "medium", "Which tools help debug server-side scripts? Select all that apply.", ["Script Debugger", "gs.info() and System Logs", "Debug Business Rule", "Field Watcher only"], [0, 1, 2], "Field Watcher focuses on client-side field changes."),
    mc("server-scripts", "medium", "What must a script include be to be called from a client script with GlideAjax?", ["Client callable", "Global only", "A business rule", "Inactive"], 0, "Client-callable script includes extend AbstractAjaxProcessor."),

    // ---------------- Record producers ----------------
    mc("record-producers", "easy", "What does a record producer create?", ["A record in a chosen table", "Only a requested item", "A new table", "An update set"], 0, "Record producers create records in any table."),
    mc("record-producers", "medium", "A variable has the same name as a field on the target table. What happens?", ["Its answer is mapped to that field automatically", "The record producer fails", "The field is deleted", "Nothing is saved"], 0, "Matching names map automatically."),
    mc("record-producers", "medium", "In a record producer script, which object sets fields on the new record?", ["current", "producer", "g_form", "previous"], 0, "current is the record being created; producer holds the answers."),
    tf("record-producers", "easy", "Record producers can be offered in the Service Portal.", true, "They appear in catalogs, the Service Portal and Employee Center."),
    mc("record-producers", "medium", "Why use a record producer as an application's front door?", ["It gives users a simple guided form without the back-office form", "It removes the need for ACLs", "It replaces the table", "It deletes old records"], 0, "Record producers offer a simple, friendly form."),
  ],
};
