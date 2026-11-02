import { check, mc, ms, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 4,
  id: "servicenow-dev-automation",
  title: "Application Automation",
  summary: "Course 4 of 6 in the Zebron ServiceNow Application Developer Program. Build, test and debug flows (and legacy workflows), use application properties, create events, scheduled jobs and utility script includes, send and receive email, and design reports and homepages.",
  description: `
Automation turns an application from a place to store records into a process that runs itself. This course covers Flow Designer and legacy workflows, application properties that let administrators change behaviour without code, events, scheduled script executions and utility script includes, email in and out, and the reports and homepages that show an application's work.

Each lesson ends with a quick check. The final exam is drawn from the **Application Automation** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "violet",
  outcomes: [
    "Build, test and debug flows, and know when legacy workflows still appear",
    "Create and use application properties",
    "Create events, scheduled script executions and utility script includes",
    "Send email notifications and process inbound email",
    "Design and create reports and homepages (dashboards) for an application",
  ],
  skills: ["Flow Designer", "Workflows", "Application properties", "Events", "Scheduled jobs", "Email", "Reports and dashboards"],
  quiz: {
    name: "Application Automation",
    slug: "servicenow-dev-automation",
    description: "Practice questions for Course 4 of the ServiceNow Application Developer Program: flows, workflows, properties, events, scheduled jobs and email.",
    tags: ["servicenow", "cad", "automation", "flow-designer"],
  },
  topics: [
    { key: "flows", name: "Flow Designer: build, test and debug", description: "Triggers, actions, flow logic, testing and execution details." },
    { key: "workflows", name: "Legacy workflows", description: "The workflow editor, activities, and when to move to flows." },
    { key: "properties", name: "Application properties", description: "Creating properties, categories and gs.getProperty." },
    { key: "events-jobs", name: "Events, scheduled jobs and utility script includes", description: "gs.eventQueue, script actions, scheduled script executions and Utils." },
    { key: "email", name: "Sending and receiving email", description: "Notifications, templates, inbound email actions and email logs." },
    { key: "reports", name: "Homepages and reports", description: "Report types, sharing, dashboards (homepages) and adding them to the application." },
  ],
  modules: [
    {
      id: "flows-and-properties",
      title: "Flows and properties",
      lessons: [
        {
          id: "flows",
          title: "Flow Designer: write, test and debug",
          minutes: 14,
          blocks: [
            text(`
## Why Flow Designer

ServiceNow recommends **Flow Designer** (in Workflow Studio) for new process automation in almost all cases, instead of legacy workflows, and instead of business rules unless you need immediate database logic or precise ordering.

## Parts of a flow

| Part | Example |
| --- | --- |
| **Trigger** | Record created or updated, scheduled, inbound email, Service Catalog, application trigger |
| **Actions** | Create, update or look up records, ask for approval, send email, log, run a script step |
| **Flow logic** | If / Else If / Else, For Each, Do the following in parallel, Wait for a duration, Wait for condition, Call a subflow |
| **Data pills** | Values from the trigger and earlier steps, dragged into later steps |

- **Subflows** are reusable sequences with inputs and outputs, called from flows.
- **Custom actions** package steps (including script and REST steps) for reuse.
- **Spokes** (IntegrationHub) provide ready-made actions for other systems; use one spoke per integrated system.

## Testing

- **Test** (top right) runs the flow with a record you choose, without waiting for the trigger.
- A flow must be **activated** to run on its trigger.

## Debugging

- **Execution details** show every step, its inputs and outputs, timing and errors.
- **Flow executions** list (Process Automation → Flow Administration) shows every run and its state.
- Add **Log** actions to record values; check the flow's **run as** user when an action fails on access.
`),
            tip("Open the execution details of a failed run first: they show exactly which step failed and with which data."),
            check(
              "Which lets you run a flow on a chosen record without waiting for its trigger?",
              ["The Test button", "Publishing an update set", "A module"],
              0,
              "Test runs the flow immediately with test data.",
            ),
          ],
        },
        {
          id: "workflows",
          title: "Legacy workflows",
          minutes: 9,
          blocks: [
            text(`
## Where you meet them

The **Workflow Editor** was the main automation tool before Flow Designer. Many existing applications and catalog items still run workflows, so developers must be able to read, test and debug them.

## Building blocks

- A workflow runs on a **table** when its **conditions** match (for example, a record is inserted).
- **Activities** are the steps: Approval - User, Approval - Group, Run Script, Create Task, Notification, Timer, If, Wait for condition, Set Values, Branch, Join.
- **Transitions** connect activities by their result (approved, rejected, yes, no).
- A workflow must be **published** before changes take effect; edits are made on a **checked-out** copy.

## Testing and debugging

- Start a test record and open **Show Workflow** (related link) to see the running context, which activities ran and where it is waiting.
- **Workflow contexts** list each running instance with its state and history.
- Use **workflow.info()** or log activities to record values.

## Moving forward

For new work, build **flows**. Convert workflows to flows when you next make major changes to them.
`),
            check(
              "What must happen before changes to a checked-out workflow take effect?",
              ["It must be published", "It must be deleted", "Nothing: changes are live immediately"],
              0,
              "Edits to a checked-out workflow are applied when it is published.",
            ),
          ],
        },
        {
          id: "properties",
          title: "Creating and using application properties",
          minutes: 9,
          blocks: [
            text(`
## Why properties

An **application property** stores a setting that administrators can change without editing code: a threshold, an email address, a feature switch.

## Creating them

1. In ServiceNow Studio, create a **System Property** in your application (or System Properties → New).
2. Name it with the scope: \`x_acme_loans.max_loan_days\`.
3. Choose a **type** (string, integer, true|false, choice list, password2 for secrets), a description and a default value.
4. Group properties in a **property category** and add a module that opens a properties page, so administrators can change them in one place.

## Reading them

\`\`\`javascript
var maxDays = parseInt(gs.getProperty('x_acme_loans.max_loan_days', '14'), 10);
\`\`\`

The second argument is the **default** if the property does not exist. Use \`gs.setProperty()\` sparingly; properties are usually changed by administrators.

## Protecting them

Set **read roles** and **write roles** on the property, and use the password2 type for secrets so they are stored encrypted.
`),
            check(
              "Which call reads an application property on the server with a default value?",
              ["gs.getProperty('x_acme_loans.max_loan_days', '14')", "g_form.getProperty('max_loan_days')", "current.getProperty()"],
              0,
              "gs.getProperty(name, default) reads a system property.",
            ),
          ],
        },
      ],
    },
    {
      id: "events-and-email",
      title: "Events, jobs and email",
      lessons: [
        {
          id: "events-jobs",
          title: "Events, scheduled script executions and utility script includes",
          minutes: 13,
          blocks: [
            text(`
## Events

An **event** is a message that something happened. It decouples the code that notices something from the code that reacts.

1. **Register** the event in the **Event Registry** (name such as \`x_acme_loans.request.overdue\`, table, description).
2. **Fire** it from a script: \`gs.eventQueue('x_acme_loans.request.overdue', current, parm1, parm2);\`
3. **React** with an **email notification** (Send when: Event is fired) or a **Script Action**, which runs server code with \`event.parm1\` and \`event.parm2\`.

Events are processed from the **event queue**; check **System Policy → Events → Event Log** when debugging.

## Scheduled script executions (scheduled jobs)

A **scheduled script execution** runs server code on a schedule (daily, weekly, periodically, once). Example: every morning, find overdue loans and fire the overdue event for each. Use **Execute Now** to test it.

## Utility script includes

Put shared logic in a **Utils** script include (for example \`LoanUtils\`) instead of repeating it in business rules, jobs and flows. Script includes load only when called, so they are preferred to global business rules.

\`\`\`javascript
// Scheduled job: fire an event for every overdue loan
var utils = new x_acme_loans.LoanUtils();
utils.overdueLoans().forEach(function(loan) {
  gs.eventQueue('x_acme_loans.request.overdue', loan, loan.getValue('requested_for'), '');
});
\`\`\`
`),
            tip("Pattern to remember: a scheduled job finds records, fires an event, and a notification or script action reacts to it."),
            check(
              "Where must an event be defined before scripts fire it?",
              ["The Event Registry", "The Service Catalog", "The Schema map"],
              0,
              "Events are registered in the Event Registry.",
            ),
          ],
        },
        {
          id: "email",
          title: "Sending and receiving email",
          minutes: 12,
          blocks: [
            text(`
## Outbound: notifications

A **notification** answers three questions:

| Tab | Question | Options |
| --- | --- | --- |
| **When to send** | When? | Record inserted or updated (with conditions), **event is fired**, or triggered by a flow |
| **Who will receive** | To whom? | Users, groups, fields on the record (Assigned to), event parameters |
| **What it will contain** | What? | Subject and body with \`\${field}\` variables, an **email template**, mail scripts |

**Email layouts** and **templates** keep messages consistent; **mail scripts** add logic with \`template.print()\`. Flows can also send email with the **Send Email** action.

## Inbound: email actions

**Inbound email actions** process email sent to the instance:

- **Type**: New (creates a record), Reply (updates the record matched by the watermark or subject number), Forward.
- **Target table**, **conditions** and a **script** using \`email.subject\`, \`email.body_text\`, \`email.from\` and \`current\`.
- **Order** and **Stop processing** control which action handles the email.

## Debugging email

- **System Mailboxes → Outbound / Inbound** and the **Email log** show what was sent, received and ignored, and why.
- Check that email sending is enabled (Email properties) on non-production instances, or use a test address.
- **Preview Notification** shows what a message will look like for a record.
`),
            check(
              "Which inbound email action type updates the record a reply belongs to?",
              ["New", "Reply", "Forward"],
              1,
              "Reply actions update the existing record found by the watermark or number.",
            ),
          ],
        },
        {
          id: "reports",
          title: "Designing and creating homepages and reports",
          minutes: 11,
          blocks: [
            text(`
## Reports

Create reports in **Reports → Create New** (Report Designer) or from a list column's context menu (Bar chart, Pie chart).

| Report type | Best for |
| --- | --- |
| **List** | Records with chosen columns |
| **Bar / horizontal bar** | Comparing counts by a field (requests by state) |
| **Pie / donut** | Share of a whole (requests by category) |
| **Line / trend** | Change over time (requests created per week) |
| **Single score** | One number (open overdue loans) |
| **Pivot table** | Counts across two fields |
| **Calendar** | Records by date |

Each report has a **data source** (a table, optionally with a filter), the **type**, and **configure** and **style** options (group by, aggregation such as count or sum, colours).

## Sharing and scheduling

- **Share** with users, groups or roles, or keep it private. Users only see rows their **ACLs** allow.
- **Schedule** a report to be emailed regularly as a PDF or spreadsheet.
- Reports created in your application's scope can be **application files**, so they move with the application.

## Homepages and dashboards

A **homepage** (in current releases a **dashboard**) gathers reports and widgets on one page, for example a manager's view of an application: open requests, overdue loans, requests by category.

1. Create a dashboard and add **report widgets** (or Platform Analytics visualizations where licensed).
2. Arrange them and share the dashboard with the application's roles.
3. Add a **module** to the application menu that opens the dashboard, so users reach it from the navigator.

> Keep dashboards focused on one audience: managers need trends and exceptions, fulfillers need their own work.
`),
            check(
              "Which report type best shows one number, such as the count of overdue loans?",
              ["Single score", "Pivot table", "Calendar"],
              0,
              "A single score report shows one aggregated value.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Flows ----------------
    mc("flows", "easy", "Which tool does ServiceNow recommend for new process automation in almost all cases?", ["Flow Designer", "Legacy workflow editor", "Global business rules", "Scheduled imports"], 0, "Flow Designer is the recommended automation tool."),
    mc("flows", "medium", "Where do you see each step of a flow run, with its inputs, outputs and errors?", ["Execution details", "The dictionary", "The schema map", "Form Layout"], 0, "Execution details show the full run."),
    ms("flows", "medium", "Which are flow logic options? Select all that apply.", ["If / Else", "For Each", "Wait for condition", "Dictionary override"], [0, 1, 2], "Dictionary overrides belong to tables."),
    mc("flows", "medium", "What should you build for a sequence of steps several flows need, with inputs and outputs?", ["A subflow", "A module", "A view", "A choice list"], 0, "Subflows are reusable with inputs and outputs."),
    tf("flows", "easy", "A flow must be activated before it runs on its trigger.", true, "Draft flows only run through Test."),

    // ---------------- Workflows ----------------
    mc("workflows", "easy", "Which item connects workflow activities by their result?", ["Transition", "Data pill", "Module", "Variable set"], 0, "Transitions link activities by result."),
    mc("workflows", "medium", "Where can you see which activities a running workflow has completed for a record?", ["Show Workflow (the workflow context)", "System Properties", "Form Builder", "Application Access"], 0, "The workflow context shows progress."),
    tf("workflows", "medium", "Changes to a checked-out workflow are live as soon as you save each activity.", false, "They take effect when the workflow is published."),
    ms("workflows", "medium", "Which are workflow activities? Select all that apply.", ["Approval - Group", "Run Script", "Timer", "Record producer"], [0, 1, 2], "Record producers are catalog items, not workflow activities."),
    mc("workflows", "medium", "What is the recommendation for building new automation in an application today?", ["Build flows; convert workflows when they change significantly", "Always build workflows", "Use only client scripts", "Avoid automation"], 0, "Flows are preferred for new work."),

    // ---------------- Properties ----------------
    mc("properties", "easy", "Why use an application property?", ["So administrators can change a setting without editing code", "To create a table", "To hide a module", "To store attachments"], 0, "Properties make settings configurable."),
    mc("properties", "medium", "Which name follows the convention for a property in scope x_acme_loans?", ["x_acme_loans.max_loan_days", "max_loan_days", "u_max_loan_days", "sys.max_loan_days"], 0, "Scoped property names start with the scope."),
    mc("properties", "medium", "What does the second argument of gs.getProperty() provide?", ["A default value if the property does not exist", "The property's write role", "The scope name", "The category"], 0, "It is the fallback value."),
    tf("properties", "medium", "The password2 property type stores the value encrypted.", true, "Use password2 for secrets."),
    mc("properties", "medium", "How do you give administrators one page for all the application's settings?", ["Group properties in a category and add a module for it", "Create a business rule", "Create a view", "Add an ACL"], 0, "Property categories with a module make a settings page."),

    // ---------------- Events and jobs ----------------
    mc("events-jobs", "easy", "Which call fires an event from a server script?", ["gs.eventQueue()", "g_form.fireEvent()", "current.event()", "gs.getProperty()"], 0, "gs.eventQueue() adds an event to the queue."),
    mc("events-jobs", "medium", "What runs server code in response to an event?", ["A script action", "A UI policy", "A client script", "A related list"], 0, "Script actions react to events."),
    mc("events-jobs", "medium", "Which runs server code every morning at 07:00?", ["A scheduled script execution", "An onLoad client script", "A dictionary override", "A form section"], 0, "Scheduled script executions run on schedules."),
    ms("events-jobs", "medium", "Why put shared logic in a utility script include? Select all that apply.", ["Reuse from business rules, jobs and flows", "It loads only when called", "Easier maintenance in one place", "It bypasses ACLs automatically"], [0, 1, 2], "Script includes do not bypass security by themselves."),
    mc("events-jobs", "medium", "Where do you check whether an event was fired and processed?", ["The Event Log", "The schema map", "Form Layout", "The application menu"], 0, "The Event Log lists queued and processed events."),

    // ---------------- Email ----------------
    mc("email", "easy", "Which notification tab decides the recipients?", ["Who will receive", "When to send", "What it will contain", "Advanced view"], 0, "Who will receive sets recipients."),
    mc("email", "medium", "A notification should go out when the overdue event fires. Which Send when option?", ["Event is fired", "Record inserted", "Record deleted", "Never"], 0, "Event-based notifications react to events."),
    mc("email", "medium", "Which inbound email action type creates a new record?", ["New", "Reply", "Forward", "Delete"], 0, "New actions create records."),
    ms("email", "medium", "Which help debug email? Select all that apply.", ["Email log and mailboxes", "Preview Notification", "Email sending properties", "Dictionary overrides"], [0, 1, 2], "Dictionary overrides are unrelated to email."),
    mc("email", "medium", "In an inbound email action script, which object gives the email's subject?", ["email.subject", "current.subject", "g_form.subject", "producer.subject"], 0, "The email object holds the incoming message."),
    // ---------------- Reports ----------------
    mc("reports", "easy", "Which report type compares counts of requests by state?", ["Bar chart", "Single score", "Calendar", "List"], 0, "Bar charts compare counts across a grouping."),
    mc("reports", "medium", "A manager wants requests created per week over the last quarter. Which report type?", ["Line or trend", "Pie", "Single score", "List"], 0, "Line and trend reports show change over time."),
    tf("reports", "medium", "Sharing a report lets users see every row, even ones their ACLs deny.", false, "Reports still respect ACLs."),
    ms("reports", "medium", "Which help users reach an application's dashboard and reports? Select all that apply.", ["Share it with the application's roles", "Add a module that opens it", "Schedule reports by email", "Delete the table's ACLs"], [0, 1, 2], "Removing ACLs is never the answer."),
    mc("reports", "medium", "What gathers several reports on one page for an application's managers?", ["A homepage or dashboard", "A transform map", "A script include", "An update set"], 0, "Homepages and dashboards combine report widgets."),
  ],
};
