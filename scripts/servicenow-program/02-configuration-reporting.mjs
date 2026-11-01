import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 2,
  id: "servicenow-admin-configuration",
  title: "Instance Configuration, Forms and Reporting",
  summary: "Course 2 of 8 in the Zebron ServiceNow Administrator Program. Branding, system properties, form design, UI and data policies, reports and dashboards.",
  description: `
Now that you can find your way around, learn to shape the instance: brand it, change system behaviour with properties, design forms and views, control fields with UI policies and data policies, and turn data into reports and dashboards.

Each lesson ends with a quick check. The final exam is drawn from the **Instance Configuration, Forms and Reporting** quiz in the Test Center.
`.trim(),
  level: "beginner",
  cover: "sky",
  outcomes: [
    "Brand an instance and change system properties safely",
    "Design forms with Form Builder, sections and views",
    "Choose between a UI policy and a data policy",
    "Build and share reports of different types",
    "Create dashboards and understand Performance Analytics basics",
  ],
  skills: ["Instance branding", "System properties", "Form design", "UI policies", "Reporting and dashboards"],
  quiz: {
    name: "Instance Configuration, Forms and Reporting",
    slug: "servicenow-admin-configuration",
    description: "Practice questions for Course 2 of the ServiceNow Administrator Program: branding, properties, forms, policies, reports and dashboards.",
    tags: ["servicenow", "csa", "configuration", "reporting"],
  },
  topics: [
    { key: "branding", name: "Branding and system properties", description: "Themes, logos, system properties and plugins." },
    { key: "form-design", name: "Form design and views", description: "Form Builder, form layout, sections and views." },
    { key: "policies", name: "UI policies and data policies", description: "Making fields mandatory, read-only or hidden, on the client and the server." },
    { key: "reports", name: "Reports", description: "Report types, sources, sharing and scheduling." },
    { key: "dashboards", name: "Dashboards and analytics", description: "Dashboards, Performance Analytics, indicators and breakdowns." },
  ],
  modules: [
    {
      id: "configure",
      title: "Configuring the instance",
      lessons: [
        {
          id: "branding",
          title: "Branding and system properties",
          minutes: 10,
          blocks: [
            text(`
## Branding

Branding makes the instance feel like your organisation's tool:

- In **Next Experience**, themes (colours, logo) are created with **Theme Builder** and applied to users or the whole instance.
- The older UI16 interface uses **System Properties → Basic Configuration UI16** for the banner image, colours and page title.
- Portals (Service Portal, Employee Center) have their own branding settings.

## System properties

**System properties** (\`sys_properties\`) are named settings that change platform behaviour, such as the instance's time zone default, password rules, email settings or list limits. Open them with **System Properties** modules or \`sys_properties.list\`.

Rules of thumb:

- Read the description before changing a property, and record the old value.
- Change properties in development first; they can be captured in update sets.
- Some properties only take effect after a cache flush or for new sessions.
`),
            text(`
## Plugins

Many features are delivered as **plugins** that an admin activates (**System Definition → Plugins** or the **Application Manager**). Some are free; others need a licence. Activating a plugin adds tables, roles and modules, and usually cannot be undone, so activate them in a sub-production instance first and check the documentation.

## System settings for users

**System Settings** (the gear in the user menu in older UIs, **Preferences** in Next Experience) are per-user. **System properties** are instance-wide. Do not confuse the two.
`),
            tip("Keep a simple change log of every system property you change: name, old value, new value, date and reason. Upgrades and audits will thank you."),
            check(
              "Where are instance-wide settings such as email and password rules usually stored?",
              ["User preferences", "System properties", "Tags"],
              1,
              "System properties hold instance-wide configuration values.",
            ),
          ],
        },
        {
          id: "form-design",
          title: "Form design and views",
          minutes: 12,
          blocks: [
            text(`
## Two tools for forms

- **Form Builder** (Configure → Form Builder): a drag-and-drop designer. Add, remove and arrange fields, create **sections**, and even create new fields.
- **Form Layout** (Configure → Form Layout): a simpler slush-bucket screen. Move fields between *Available* and *Selected*, add sections, and dot-walk to add fields from related tables.

Changes to the default form apply to everyone using that **view**.

## Views

A **view** is a named layout of a form or list. The same Incident table can have a **Default view** for agents, a **Self Service** view for end users and a **Mobile** view. Switch views from the form context menu → View. **View rules** can choose a view automatically based on conditions (for example by device or role).

## Good form design

- Put the fields people use most at the top.
- Use sections to group related fields.
- Hide fields nobody uses rather than adding more.
- Test with the role that uses the form, not as admin.
`),
            text(`
## Related lists and formatters

Add **related lists** (Configure → Related Lists) to show linked records at the bottom of the form. **Formatters** add special elements such as the **activity stream**, the **process flow** bar showing the record's state, or the **parent breadcrumb**.

Field labels, help text, choice lists and default values are set on the field's **dictionary entry** (Configure → Dictionary, covered in Course 3).
`),
            tip("Before editing a form, check which view you are in. Editing the wrong view is one of the most common admin surprises."),
            check(
              "Which tool lets you drag and drop fields and create new fields directly on the form?",
              ["Form Builder", "Theme Builder", "Import sets"],
              0,
              "Form Builder is the drag-and-drop form designer.",
            ),
          ],
        },
        {
          id: "policies",
          title: "UI policies and data policies",
          minutes: 13,
          blocks: [
            text(`
## UI policies

A **UI policy** changes how fields behave on a form **in the browser**, based on conditions, without code:

- Make a field **mandatory**.
- Make a field **read-only**.
- Make a field **visible** or hidden.

Example: when *State* is **Resolved**, make *Resolution code* and *Resolution notes* mandatory.

Useful options:

- **On load**: apply when the form opens, not only when a field changes.
- **Reverse if false**: undo the actions when the condition stops being true.
- **Order**: when several policies affect the same field, the one with the **higher order number is applied last** (and so wins).
- **Run scripts**: add client-side script for more complex logic.

UI policies are often preferred over **client scripts** for simple show/hide/mandatory logic because they need no code.
`),
            text(`
## Data policies

A **data policy** enforces **mandatory** and **read-only** rules **on the server**, so they apply to every way data arrives: forms, **import sets**, web services and scripts.

| | UI policy | Data policy |
| --- | --- | --- |
| Runs | In the browser (client) | On the server |
| Applies to imports and web services | No | Yes |
| Can hide fields | Yes | No |
| Can make fields mandatory / read-only | Yes | Yes |

A data policy can also be applied as a UI policy on forms (the **Use as UI Policy on client** option), and an existing UI policy can be converted into a data policy.

## Other ways to control fields

- **Dictionary** settings (mandatory, read-only) apply everywhere, always.
- **ACLs** (Course 4) decide who can read or write a field at all.
- **Client scripts** handle logic that UI policies cannot.
`),
            tip("If data must be valid no matter how it arrives, use a data policy. If it is only about guiding people on a form, a UI policy is enough."),
            check(
              "Which enforces a mandatory field even for records created by an import set?",
              ["UI policy", "Data policy", "View rule"],
              1,
              "Data policies run on the server, so they apply to imports and web services too.",
            ),
          ],
        },
      ],
    },
    {
      id: "reporting",
      title: "Reporting",
      lessons: [
        {
          id: "reports",
          title: "Reports",
          minutes: 12,
          blocks: [
            text(`
## Building a report

Open **Reports → Create New** (or the report designer from a list's column menu). A report needs:

1. **Data**: a table (or a saved **report source**, a reusable filtered data set).
2. **Type**: how to show it.
3. **Configure**: grouping, aggregation (count, sum, average), filters.
4. **Style**: colours, labels, legends.

Common types:

| Type | Good for |
| --- | --- |
| **List** | Detailed records |
| **Bar / horizontal bar** | Comparing groups (incidents by assignment group) |
| **Pie / donut** | Share of a whole (by priority) |
| **Line / trend / time series** | Change over time |
| **Single score** | One number (open P1 incidents) |
| **Pivot table** | Two groupings at once |
| **Heatmap** | Two groupings with colour intensity |
| **Gauge / speedometer** | A value against a target |

Click a bar or slice to **drill down** to the matching records.
`),
            text(`
## Sharing and scheduling

- **Sharing**: keep a report private, share it with users, groups or roles, or with everyone.
- **Scheduled reports** email a report (or a PDF/Excel export) on a schedule, such as every Monday at 8 a.m.
- **Export** a report or list to PDF, Excel or CSV.
- Users only see records their **ACLs** allow, so the same report can show different numbers to different people.

Reports read live data, so heavy reports over huge tables can be slow. Filter them, and prefer a **report source** that many reports can reuse.
`),
            tip("Name reports so others can find them: \"ITSM – Open P1 incidents by group\" beats \"My report 3\"."),
            check(
              "Which report type best shows a single number such as \"open P1 incidents\"?",
              ["Pie", "Single score", "Pivot table"],
              1,
              "A single score report displays one aggregated value.",
            ),
          ],
        },
        {
          id: "dashboards",
          title: "Dashboards and Performance Analytics",
          minutes: 11,
          blocks: [
            text(`
## Dashboards

A **dashboard** arranges several reports and widgets on one page, for example an ITSM manager's view with open incidents by priority, SLA breaches and change success rate. In Next Experience, dashboards are built in **Platform Analytics**; older instances use **homepages** and responsive dashboards.

Dashboards can have **interactive filters** (one filter changes every widget), tabs, and sharing settings like reports. Owners decide who can view or edit.

## Reports versus Performance Analytics

- **Reports** show the data **as it is now**.
- **Performance Analytics (PA)** collects **scores over time** with scheduled **data collection jobs**, so you can see trends and compare against **targets** and **thresholds**.

PA building blocks:

- **Indicator**: what you measure, such as "Number of open incidents" or "Average resolution time".
- **Indicator source**: the table and conditions behind it.
- **Breakdown**: how to slice it, such as by assignment group or priority.
- **Data collection job**: runs on a schedule (usually daily) to record scores.
`),
            text(`
## Designing a useful dashboard

1. Start with the **decision** the viewer needs to make.
2. Show a few key numbers at the top (single scores).
3. Add trends below to show direction.
4. Add breakdowns to find where the problem is.
5. Link to the underlying lists so people can act.

Avoid putting twenty widgets on one page. If nobody looks at a widget, remove it.
`),
            tip("A good test for any widget: what would someone do differently if this number went up? If nobody knows, cut it."),
            check(
              "What does Performance Analytics add compared to standard reports?",
              ["Scores collected over time for trends and targets", "Email templates", "User impersonation"],
              0,
              "PA stores scores on a schedule so you can track trends, targets and thresholds.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Branding ----------------
    mc("branding", "easy", "Which table stores system properties?", ["sys_user", "sys_properties", "sys_dictionary", "incident"], 1, "System properties live in sys_properties."),
    mc("branding", "medium", "In Next Experience, which tool creates themes with your colours and logo?", ["Theme Builder", "Form Builder", "Flow Designer", "Import Set"], 0, "Theme Builder creates themes for the Next Experience interface."),
    tf("branding", "medium", "Activating a plugin can usually be undone with a single click.", false, "Most plugins cannot be deactivated cleanly, so activate them in sub-production first."),
    mc("branding", "medium", "What is the difference between a system property and a user preference?", ["There is none", "System properties apply to the whole instance; preferences apply to one user", "Preferences apply to the whole instance", "Properties are only for reports"], 1, "Properties are instance-wide; preferences are per user."),
    ms("branding", "medium", "What should you do before changing a system property? Select all that apply.", ["Read its description", "Record the old value", "Try it in a sub-production instance", "Change it directly in production without notes"], [0, 1, 2], "Understand it, record it and test it first."),

    // ---------------- Form design ----------------
    mc("form-design", "easy", "What is a view in ServiceNow?", ["A named layout of a form or list", "A type of report", "A security rule", "A user role"], 0, "Views let the same table have different layouts for different audiences."),
    mc("form-design", "medium", "Which screen uses a slush bucket to choose and order form fields, including dot-walked fields?", ["Form Layout", "Theme Builder", "Report designer", "Update set preview"], 0, "Form Layout uses Available and Selected lists."),
    mc("form-design", "medium", "What can automatically choose which view a user sees?", ["A view rule", "A tag", "A data source", "A transform map"], 0, "View rules pick a view based on conditions such as device type or role."),
    tf("form-design", "easy", "Changes to the default form view apply to everyone using that view.", true, "Form layout changes are global for the view, unlike personal list settings."),
    mc("form-design", "medium", "Which formatter shows a record's progress through its states as a bar on the form?", ["Process flow", "Activity stream", "Reference icon", "Breadcrumbs"], 0, "The process flow formatter shows the stages of a record, such as New → In Progress → Resolved."),

    // ---------------- Policies ----------------
    mc("policies", "easy", "Which can hide a field on a form without code?", ["UI policy", "Data policy", "Import set", "Scheduled job"], 0, "UI policies can make fields visible or hidden; data policies cannot hide fields."),
    mc("policies", "medium", "A field must be mandatory for records created through the REST API as well as forms. What should you use?", ["UI policy", "Data policy", "Client script", "View rule"], 1, "Data policies run on the server and apply to web services and imports."),
    mc("policies", "medium", "What does the \"Reverse if false\" option on a UI policy do?", ["Deletes the policy", "Undoes the policy actions when the condition is no longer true", "Runs the policy only on the server", "Reverses list sorting"], 1, "Without it, a field made mandatory would stay mandatory after the condition changes."),
    tf("policies", "hard", "When two UI policies set the same field, the policy with the higher order number is applied last.", true, "UI policies run in order, so the higher order value is processed later and takes effect."),
    ms("policies", "medium", "Which actions can a UI policy apply to a field? Select all that apply.", ["Mandatory", "Read-only", "Visible", "Delete the table"], [0, 1, 2], "UI policy actions set mandatory, read-only and visible."),

    // ---------------- Reports ----------------
    mc("reports", "easy", "Which report type is best for comparing the number of incidents per assignment group?", ["Bar chart", "Single score", "Gauge", "List"], 0, "Bar charts compare values across groups."),
    mc("reports", "medium", "What is a report source?", ["A reusable, saved data set (table plus conditions) for reports", "A user who creates reports", "A PDF export", "A dashboard tab"], 0, "Report sources let many reports share the same filtered data."),
    tf("reports", "medium", "Two users can see different numbers in the same report because of their access rights.", true, "Reports respect ACLs, so users only see the records they are allowed to read."),
    mc("reports", "medium", "How can a manager get a report by email every Monday?", ["Scheduled report", "UI policy", "Business rule", "Tag"], 0, "Scheduled reports email reports on a schedule."),
    mc("reports", "medium", "Which report type shows two groupings at once, such as priority by assignment group, as a table?", ["Pivot table", "Pie chart", "Single score", "Speedometer"], 0, "A pivot table cross-tabulates two groupings."),

    // ---------------- Dashboards ----------------
    mc("dashboards", "easy", "What is a dashboard?", ["A page combining several reports and widgets", "A user role", "A database table", "An email template"], 0, "Dashboards bring several visualisations together on one page."),
    mc("dashboards", "medium", "In Performance Analytics, what slices an indicator, for example by assignment group?", ["Breakdown", "Report source", "View", "Tag"], 0, "Breakdowns divide indicator scores by a dimension."),
    mc("dashboards", "medium", "How does Performance Analytics gather its scores?", ["Scheduled data collection jobs", "Users type them in", "Import sets only", "Email replies"], 0, "Data collection jobs run on a schedule and store scores over time."),
    ord("dashboards", "medium", "Put these steps for designing a useful dashboard in order.", ["Identify the decision the viewer needs to make", "Show key numbers at the top", "Add trends to show direction", "Add breakdowns to find the cause", "Link to lists so people can act"], "Start from the decision, then headline numbers, trends, breakdowns and action."),
    st("dashboards", "hard", "In Performance Analytics, what is the name for the thing you measure, such as \"Number of open incidents\"? (one word)", ["indicator"], "An indicator is the metric that Performance Analytics collects scores for."),
  ],
};
