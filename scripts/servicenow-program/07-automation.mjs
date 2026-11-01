import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 7,
  id: "servicenow-admin-automation",
  title: "Automation: Flow Designer, Notifications and Business Rules",
  summary: "Course 7 of 8 in the Zebron ServiceNow Administrator Program. Automate work without code in Flow Designer, keep people informed with notifications, and know when scripts such as business rules come in.",
  description: `
Automation is where ServiceNow saves the most time. This course covers Flow Designer (triggers, actions, flow logic, subflows and approvals), email notifications and events, and the scripted building blocks administrators meet: business rules, client scripts and scheduled jobs.

Each lesson ends with a quick check. The final exam is drawn from the **Automation** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "teal",
  outcomes: [
    "Build flows with triggers, actions and flow logic",
    "Reuse logic with subflows and custom actions, and add approvals",
    "Configure email notifications: when, who and what",
    "Explain events and inbound email actions",
    "Choose between flows, business rules, client scripts and scheduled jobs",
  ],
  skills: ["Flow Designer", "Subflows", "Notifications", "Business rules", "Client scripts"],
  quiz: {
    name: "Automation: Flow Designer, Notifications and Business Rules",
    slug: "servicenow-admin-automation",
    description: "Practice questions for Course 7 of the ServiceNow Administrator Program: Flow Designer, approvals, notifications, events and scripts.",
    tags: ["servicenow", "csa", "automation", "flow-designer"],
  },
  topics: [
    { key: "flows", name: "Flow Designer basics", description: "Triggers, actions, data pills and flow logic." },
    { key: "subflows", name: "Subflows, actions and approvals", description: "Reusable logic, custom actions, spokes and approvals." },
    { key: "notifications", name: "Email notifications", description: "When to send, who will receive, what it will contain." },
    { key: "events", name: "Events and inbound email", description: "The event queue, event registry and inbound email actions." },
    { key: "scripts", name: "Business rules and client scripts", description: "When each type runs, and when to use scripts at all." },
  ],
  modules: [
    {
      id: "flow-designer",
      title: "Flow Designer",
      lessons: [
        {
          id: "flows",
          title: "Flow Designer basics",
          minutes: 13,
          blocks: [
            text(`
## What Flow Designer is

**Flow Designer** lets you automate processes with little or no code, using plain-language steps. In recent releases it sits inside **Workflow Studio** alongside related tools. It replaces most uses of the older graphical **Workflow Editor**.

A **flow** has:

1. A **trigger**: what starts it.
2. **Actions**: the steps it performs.
3. **Flow logic**: decisions and loops.

## Triggers

| Trigger type | Example |
| --- | --- |
| **Record**: created, updated, or created or updated | When an incident is created with Priority 1 |
| **Scheduled**: daily, weekly, monthly, repeat | Every Monday at 07:00 |
| **Application**: Service Catalog, inbound email, SLA task, and others | When a catalog item is requested |

## Actions

Built-in **core actions** include Create Record, Update Record, Look Up Record(s), Delete Record, Send Email, Send Notification, Create Task, Ask for Approval, Log, and Wait for Condition.

Each action's outputs appear as **data pills** in the **data panel**. Drag a pill (such as *Trigger → Incident Record → Caller → Email*) into a later step instead of typing values.
`),
            text(`
## Flow logic

- **If / Else If / Else**: branch on conditions.
- **For Each**: repeat steps for each record in a list (for example every open task of an incident).
- **Do the following in parallel**: run branches at the same time.
- **Wait for a duration** or **Wait for condition**.
- **Go back to**, **End flow**, **Try / Catch** for error handling, and **Set flow variables**.

## Building and testing

1. Create the flow, set the trigger and add steps.
2. **Save**, then **Test** with a real record: the **execution details** show each step's inputs, outputs and timing.
3. **Activate** the flow. Inactive flows do not run.

Flows run as the **System user** by default (they can be set to run as the user who triggered them), so they can do things the user cannot. Design them carefully.
`),
            tip("Before automating, write the steps as a numbered list in plain words. If you cannot explain it simply, the flow will be hard to maintain."),
            check(
              "What starts a flow?",
              ["A trigger", "A data pill", "An ACL"],
              0,
              "Every flow begins with a trigger: record, scheduled or application.",
            ),
          ],
        },
        {
          id: "subflows",
          title: "Subflows, actions and approvals",
          minutes: 12,
          blocks: [
            text(`
## Subflows

A **subflow** is a reusable sequence of steps with **inputs** and **outputs**, but **no trigger**. Flows (and other subflows, scripts or Virtual Agent) **call** it. Example: a "Provision new user" subflow used by both the new hire order guide and an HR onboarding flow.

## Custom actions and spokes

- **Action Designer** builds custom **actions** with inputs, steps (script, REST, lookup and more) and outputs, so non-developers can drag them into flows.
- **IntegrationHub spokes** are packaged sets of actions for other systems, such as Microsoft Teams, Slack, Jira, Active Directory or AWS. Some spokes need an IntegrationHub subscription.

## Approvals in flows

The **Ask for Approval** action requests approval and waits:

- Choose approvers: users, groups, the manager of a user, or values from data pills.
- Rules: **Anyone approves**, **All approve**, a **percentage**, or a **count**, plus rules for rejections.
- Optional **due date** with an action when it expires.

The flow continues with the approval result (approved, rejected, cancelled), which you test with an If step.
`),
            text(`
## Flow or subflow?

| Use a… | When |
| --- | --- |
| **Flow** | Something should happen automatically in response to a trigger |
| **Subflow** | The same steps are needed in several flows, or must be callable from elsewhere |
| **Action** | A single reusable operation, often an integration call |

## Operating flows

- **Flow executions** (Process Automation → Flow Administration) show every run and its status; failed runs show which step failed and why.
- Keep flows small and focused; split big ones into subflows.
- Document each flow's purpose and owner in its description.
`),
            tip("When a flow fails, open the execution details first. The failed step, its inputs and the error message usually tell you exactly what went wrong."),
            check(
              "Which has inputs and outputs but no trigger, and is called from other flows?",
              ["A subflow", "A notification", "A view"],
              0,
              "Subflows are reusable and are called rather than triggered.",
            ),
          ],
        },
      ],
    },
    {
      id: "notifications-and-scripts",
      title: "Notifications and scripts",
      lessons: [
        {
          id: "notifications",
          title: "Email notifications",
          minutes: 12,
          blocks: [
            text(`
## Three questions

Every notification (**System Notification → Email → Notifications**) answers:

1. **When to send**: when a record is **inserted** or **updated** (with conditions, such as *State changes to Resolved*), or when an **event** is fired.
2. **Who will receive**: specific **users** or **groups**, **users/groups in fields** (such as *Caller* or *Assigned to*), and for events, **parm1/parm2** recipients. Options include sending to the person who triggered it or not.
3. **What it will contain**: subject and message, often using an **email template**, **variables** such as \`\${number}\` and \`\${short_description}\`, and **mail scripts** for complex content.

**Weight** decides which notification wins when several would send to the same person for the same record: the highest weight is sent (weight 0 means always send).

## Testing

- **Preview Notification** shows the result for a chosen record.
- The **Email log** (System Logs → Emails, \`sys_email\`) shows what was sent, to whom, and why something was skipped.
- Outbound email must be enabled in the email properties; sub-production instances often redirect or disable email.
`),
            text(`
## Letting users choose

Users manage **notification preferences** (in Preferences or the portal): turn optional notifications off, add channels such as mobile push or Teams, and set devices. Mark critical notifications as **mandatory** so they cannot be turned off.

## Good notification habits

- Fewer, clearer messages: people ignore systems that email them about everything.
- Put the action in the subject: "Approval needed: REQ0010023 – Laptop for Ana".
- Include a link back to the record.
- Consider **digests** for high-volume updates.
`),
            tip("If a user says they never got an email, check the Email log before anything else. It shows whether the email was created, sent, skipped or sent to someone else."),
            check(
              "Several notifications would send to the same user for the same update. Which is sent?",
              ["The newest one", "The one with the highest weight", "All of them, always"],
              1,
              "Only the notification with the highest weight is sent (weight 0 notifications always send).",
            ),
          ],
        },
        {
          id: "events",
          title: "Events and inbound email",
          minutes: 10,
          blocks: [
            text(`
## Events

An **event** is a message that something significant happened, such as *incident.assigned* or *approval.inserted*. Events are:

1. **Registered** in the **Event Registry** (\`sysevent_register\`) with a name and the table they belong to.
2. **Fired** by a business rule, script or flow, for example with \`gs.eventQueue('incident.assigned', current, parm1, parm2)\`.
3. **Queued** in the **event log** (\`sysevent\`) and processed shortly after.
4. **Handled** by notifications, **script actions** or flows listening for that event.

Events decouple "something happened" from "what we do about it", and let notifications send to recipients passed in **parm1** and **parm2**.

## Inbound email

**Inbound email actions** process emails sent to the instance:

- **New**: an email with no matching record creates one (for example a new incident).
- **Reply**: an email with a record's **watermark** (a reference like Ref:MSG…) or number in the subject updates that record, for example adding the text as a comment.
- **Forward**: forwarded emails can be handled differently.

Conditions and order decide which action handles each email.
`),
            text(`
## Watermarks

Outbound notifications include a **watermark** that identifies the record. When the user replies, the watermark lets the instance match the reply to the right record, even if they change the subject.

## Troubleshooting

- **Event log**: was the event fired, with which parameters, and was it processed?
- **Email log**: was the email received or sent, and which inbound action processed it?
- **Email accounts**: is the instance's mailbox connected (POP3/IMAP/OAuth) for inbound mail?
`),
            tip("Register custom events with a clear name and description (company.task.overdue). Six months later, someone will need to know what fires it."),
            check(
              "Where are custom events registered?",
              ["The Event Registry", "The Service Portal", "The schema map"],
              0,
              "Events are registered in sysevent_register.",
            ),
          ],
        },
        {
          id: "scripts",
          title: "Business rules, client scripts and scheduled jobs",
          minutes: 13,
          blocks: [
            text(`
## Business rules (server side)

A **business rule** runs on the server when a record is displayed, inserted, updated, deleted or queried. **When** it runs matters:

| When | Runs | Typical use |
| --- | --- | --- |
| **before** | Before the record is saved | Change or validate the record itself (it will be saved anyway) |
| **after** | After the save | Update other records |
| **async** | After the save, in the background | Slow work such as integrations, without making the user wait |
| **display** | When a form loads | Pass server data to client scripts (g_scratchpad) |

Business rules also have **conditions**, **order**, and simple **actions** (set field values, add messages, abort) that need no script.

## Client scripts (browser side)

A **client script** runs in the user's browser on forms:

- **onLoad**: when the form opens.
- **onChange**: when a field value changes.
- **onSubmit**: when the form is saved (can stop the save).
- **onCellEdit**: when a cell is edited in a list.
`),
            text(`
## Scheduled jobs and script includes

- **Scheduled jobs** (scheduled script executions) run scripts on a schedule, such as nightly clean-ups. Many can now be **scheduled flows** instead.
- **Script includes** hold reusable server-side code that other scripts call.
- **UI actions** add buttons, links and context menu items to forms and lists.

## When to script at all

Prefer, in this order:

1. **Configuration** (dictionary, UI policies, data policies, assignment rules).
2. **Flow Designer** for process automation.
3. **Scripts** only when the first two cannot do it.

Scripts are powerful but must be tested, reviewed and maintained through upgrades. Never test new scripts directly in production.
`),
            tip("A good admin question before any script: \"Can a UI policy, a data policy or a flow do this?\" The answer is yes more often than you think."),
            check(
              "Which business rule type runs in the background after a save so the user does not wait?",
              ["before", "async", "display"],
              1,
              "Async business rules run after the save as a background job.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Flows ----------------
    mc("flows", "easy", "Which is a Flow Designer trigger type?", ["Record created", "Data pill", "View rule", "Reference qualifier"], 0, "Record, scheduled and application triggers start flows."),
    mc("flows", "medium", "What are data pills?", ["Outputs of triggers and actions that you drag into later steps", "Error messages", "Licence keys", "User roles"], 0, "Data pills carry values between steps in the data panel."),
    mc("flows", "medium", "Which flow logic repeats steps for every record in a list?", ["For Each", "If", "Wait for condition", "End flow"], 0, "For Each loops over a list of records."),
    ord("flows", "medium", "Put these steps for releasing a new flow in order.", ["Define the trigger", "Add actions and logic", "Save", "Test with a real record", "Activate"], "Build it, save it, test it, then activate it."),
    tf("flows", "medium", "By default, flows run as the System user, which may have more access than the user who triggered them.", true, "Flows can be set to run as the triggering user when needed."),

    // ---------------- Subflows ----------------
    mc("subflows", "easy", "What does a subflow NOT have?", ["Inputs", "Outputs", "A trigger", "Actions"], 2, "Subflows are called by other flows; they have no trigger of their own."),
    mc("subflows", "medium", "Which approval rule requires every listed approver to approve?", ["All approve", "Anyone approves", "First response", "Percentage of 10%"], 0, "All approve waits for every approver."),
    mc("subflows", "medium", "Packaged Flow Designer actions for systems such as Slack, Jira or Microsoft Teams are called…", ["Spokes", "Widgets", "Breakdowns", "Formatters"], 0, "IntegrationHub spokes provide ready-made integration actions."),
    mc("subflows", "medium", "Where do you see each run of a flow and which step failed?", ["Flow executions (execution details)", "The schema map", "Knowledge feedback", "Theme Builder"], 0, "Execution details show every step's inputs, outputs and errors."),
    ms("subflows", "medium", "Who can be approvers in an Ask for Approval action? Select all that apply.", ["A specific user", "A group", "The manager of a user from a data pill", "A database table"], [0, 1, 2], "Approvers can be users, groups or people derived from record data."),

    // ---------------- Notifications ----------------
    ms("notifications", "easy", "Which sections define a notification? Select all that apply.", ["When to send", "Who will receive", "What it will contain", "Which ACL to delete"], [0, 1, 2], "Every notification defines when, who and what."),
    mc("notifications", "medium", "Which log shows whether an email was sent, skipped or received?", ["Email log (sys_email)", "Audit log", "Import log", "Transaction log only"], 0, "The email log records outbound and inbound email."),
    mc("notifications", "medium", "Which variable syntax inserts a record's number into a notification?", ["${number}", "{{number}}", "%number%", "$number$"], 0, "Notification messages use ${field_name} variables."),
    tf("notifications", "medium", "Users can turn off notifications marked as mandatory.", false, "Mandatory notifications cannot be unsubscribed."),
    mc("notifications", "hard", "A notification has weight 0. What happens when other notifications also match for the same recipient and record?", ["It is never sent", "It is always sent", "Only it is sent", "It is sent tomorrow"], 1, "Weight 0 notifications are always sent; among others, the highest weight wins."),

    // ---------------- Events ----------------
    st("events", "hard", "Which server-side method is used to fire an event, such as gs.______('incident.assigned', current)? Give the method name.", ["eventQueue", "gs.eventQueue"], "gs.eventQueue() queues an event for processing."),
    mc("events", "medium", "What lets a reply email update the right record even if the user changed the subject?", ["The watermark", "The theme", "The view", "A reference qualifier"], 0, "Watermarks identify the record a reply belongs to."),
    mc("events", "medium", "What processes emails sent to the instance and creates or updates records?", ["Inbound email actions", "Client scripts", "Dashboards", "Update sets"], 0, "Inbound email actions handle new, reply and forward emails."),
    tf("events", "medium", "Events let notifications send to recipients passed in parm1 or parm2.", true, "Event parameters can carry recipients for event-based notifications."),
    mc("events", "medium", "Which table shows fired events and whether they were processed?", ["sysevent (event log)", "sys_user", "sc_task", "sys_choice"], 0, "The event log is sysevent."),

    // ---------------- Scripts ----------------
    mc("scripts", "easy", "Where do client scripts run?", ["In the user's browser", "On the database server only", "In email", "In the MID Server"], 0, "Client scripts run on the client (browser)."),
    mc("scripts", "medium", "Which business rule type should set a field on the same record being saved?", ["before", "after", "async", "display"], 0, "Before rules change the record before it is written, with no extra update."),
    mc("scripts", "medium", "Which client script type can stop a form from being saved?", ["onSubmit", "onLoad", "onChange", "onCellEdit"], 0, "onSubmit can return false to cancel the save."),
    mc("scripts", "medium", "Which business rule type passes server data to client scripts through g_scratchpad?", ["display", "before", "after", "async"], 0, "Display business rules run when the form loads and can fill g_scratchpad."),
    tf("scripts", "easy", "Administrators should prefer configuration and flows over scripting when they can do the job.", true, "Configuration is easier to maintain and upgrade than custom code."),
  ],
};
