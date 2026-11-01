import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 6,
  id: "servicenow-admin-catalog",
  title: "Service Catalog and Self-Service",
  summary: "Course 6 of 8 in the Zebron ServiceNow Administrator Program. Catalogs, items, variables, record producers, order guides, fulfilment and the portals people use to ask for help.",
  description: `
Self-service is where most users meet ServiceNow. This course shows how to build the Service Catalog: catalog items and variables, record producers and order guides, how a request is fulfilled, and how users reach it all through the Service Portal, Employee Center and Virtual Agent.

Each lesson ends with a quick check. The final exam is drawn from the **Service Catalog and Self-Service** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "sunrise",
  outcomes: [
    "Organise catalogs and categories",
    "Build catalog items with variables, variable sets and catalog UI policies",
    "Choose between catalog items, record producers and order guides",
    "Explain the request, requested item and catalog task structure",
    "Describe the Service Portal, Employee Center and Virtual Agent",
  ],
  skills: ["Service Catalog", "Catalog items and variables", "Record producers", "Request fulfilment", "Service Portal"],
  quiz: {
    name: "Service Catalog and Self-Service",
    slug: "servicenow-admin-catalog",
    description: "Practice questions for Course 6 of the ServiceNow Administrator Program: catalogs, items, variables, record producers, order guides, fulfilment and portals.",
    tags: ["servicenow", "csa", "service-catalog"],
  },
  topics: [
    { key: "structure", name: "Catalogs and categories", description: "Catalogs, categories, user criteria and Catalog Builder." },
    { key: "items", name: "Catalog items and variables", description: "Items, variable types, variable sets and catalog UI policies." },
    { key: "producers", name: "Record producers and order guides", description: "Creating task records from the catalog; bundling items." },
    { key: "fulfilment", name: "Request fulfilment", description: "REQ, RITM, SCTASK, approvals and fulfilment flows." },
    { key: "portals", name: "Portals and Virtual Agent", description: "Service Portal, Employee Center and conversational self-service." },
  ],
  modules: [
    {
      id: "building-the-catalog",
      title: "Building the catalog",
      lessons: [
        {
          id: "structure",
          title: "Catalogs and categories",
          minutes: 10,
          blocks: [
            text(`
## What the Service Catalog is

The **Service Catalog** is the menu of things people can ask for: hardware, software, access, services and information. Each offering is a **catalog item** with a form, a price (optional), approvals and a fulfilment process.

## Structure

- **Catalogs**: top-level collections, such as "Service Catalog" (IT) or "HR Catalog". An instance can have several.
- **Categories**: groups within a catalog, such as Hardware, Software, Access. Categories can have subcategories.
- **Items**: the individual offerings, which can appear in more than one category and catalog.

## Who sees what

**User criteria** control availability:

- **Available for**: who can see and order an item (or a whole category or catalog).
- **Not available for**: who cannot, which overrides *Available for*.

User criteria can match users, groups, roles, departments, locations, companies or a script.
`),
            text(`
## Who builds items

- **Catalog administrators** (\`catalog_admin\`) manage catalogs, categories and items, often in the classic catalog definition screens.
- **Catalog Builder** is a guided, no-code tool for **catalog item editors** in business teams to create and update items from approved **templates**, without full admin rights.

## Good catalog design

- Write item names as the user thinks of them ("New laptop", not "HW-REQ-001").
- Keep forms short: ask only what the fulfiller needs.
- Give each item an owner who keeps it current.
- Retire items nobody orders.
`),
            tip("Look at your top 20 incidents by category: many are really requests (\"I need access to…\") that a good catalog item would handle better."),
            check(
              "Which user criteria setting wins when both match a user?",
              ["Available for", "Not available for", "Neither"],
              1,
              "Not available for overrides Available for.",
            ),
          ],
        },
        {
          id: "items",
          title: "Catalog items and variables",
          minutes: 13,
          blocks: [
            text(`
## Variables

**Variables** are the questions on a catalog item's form. Common types:

| Type | Example |
| --- | --- |
| **Single line text** | Phone number |
| **Multi line text** | Business justification |
| **Select box** | Laptop model |
| **Multiple choice** | Screen size (radio buttons) |
| **Check box** | Include docking station |
| **Reference** | Which user is it for (references \`sys_user\`) |
| **Date / Date/Time** | Needed by |
| **Yes / No** | Do you need admin rights? |
| **Attachment** | Upload a signed form |
| **Container start / end** | Layout sections |
| **Label** | Instructions text |

Each variable has a **name** (used in scripts and flows), a question (label), an order, and options such as mandatory and default value.

## Variable sets

A **variable set** is a reusable group of variables, such as "Requested for and location", shared by many items. Change it once and every item updates. **Multi-row variable sets** let users add several rows, for example several software titles in one request.
`),
            text(`
## Making forms dynamic

- **Catalog UI policies**: make variables mandatory, read-only or visible based on conditions, without code, like UI policies on forms.
- **Catalog client scripts**: onLoad, onChange and onSubmit logic when UI policies are not enough.
- **Pricing**: items can have a **price** and **recurring price**; select box choices can add to the price.

## Item settings worth knowing

- **Fulfillment**: a **flow** (in Flow Designer) or older **workflow** runs when the item is ordered.
- **Use cart layout**, **Hide quantity**, **No order now** and similar options control the ordering experience.
- **Portal settings**: icon, picture, short description shown in search.
`),
            tip("Name variables consistently (requested_for, needed_by, business_justification). Flows and reports become much easier to build."),
            check(
              "What lets you reuse the same group of variables across many catalog items?",
              ["A variable set", "A view rule", "A report source"],
              0,
              "Variable sets are shared groups of variables.",
            ),
          ],
        },
        {
          id: "producers",
          title: "Record producers and order guides",
          minutes: 11,
          blocks: [
            text(`
## Record producers

A **record producer** is a catalog item that creates a record **in another table** instead of a request. Examples:

- "Report an issue" creates an **incident**.
- "Ask an HR question" creates an **HR case**.
- "Suggest a knowledge article" creates a **knowledge feedback** task.

Variables map to fields on the target record (variable names that match field names map automatically, or use the **script** field for custom mapping). Users get a friendly form, and fulfillers get a normal incident or case.

## Order guides

An **order guide** bundles several items into one guided order. A "New hire" order guide asks a few questions (department, role, location) and then adds the right items to the cart: laptop, phone, software, access. **Rule base** conditions decide which items are included, and **cascading variables** pass answers from the guide into each item so users do not repeat themselves.
`),
            text(`
## Choosing the right tool

| Need | Use |
| --- | --- |
| Request something that must be approved and delivered | **Catalog item** |
| Create an incident, case or other task from a friendly form | **Record producer** |
| Order several related items in one go | **Order guide** |
| Share common questions across items | **Variable set** |

Content items (links to knowledge or external pages) can also appear in the catalog for information only.
`),
            tip("If users raise \"requests\" through the incident form, give them a record producer with clear questions instead. Better data, faster resolution."),
            check(
              "\"Report an outage\" on the portal creates an incident. What kind of catalog item is it?",
              ["Order guide", "Record producer", "Variable set"],
              1,
              "Record producers create records in tables such as Incident.",
            ),
          ],
        },
      ],
    },
    {
      id: "fulfilment-and-portals",
      title: "Fulfilment and portals",
      lessons: [
        {
          id: "fulfilment",
          title: "Request fulfilment",
          minutes: 12,
          blocks: [
            text(`
## The three records

When a user orders from the catalog, ServiceNow creates:

1. **Request** (\`sc_request\`, numbers like REQ0010001): the overall order, like a shopping cart checkout.
2. **Requested Item** (\`sc_req_item\`, RITM…): one per item ordered. This is where variables, approvals and the item's fulfilment flow live.
3. **Catalog Task** (\`sc_task\`, SCTASK…): the work for fulfillers, such as "Image laptop" or "Ship to user". One RITM can have several tasks.

All three extend **Task**, so they have assignment groups, states, work notes and SLAs.

## Fulfilment flows

A **fulfilment flow** (Flow Designer) attached to the item typically:

1. Asks for **approval** (for example the requester's manager, and finance above a price).
2. Creates **catalog tasks** for each team in order.
3. Waits for each task to complete.
4. Closes the RITM and notifies the requester.

The flow can also call integrations, such as creating an account in another system.
`),
            text(`
## Approvals

Approvals create **approval records** (\`sysapproval_approver\`) for each approver. Approvers can respond from email, the portal, the mobile app or the approval list. Common patterns:

- **Manager approval** of the requested-for user.
- **Group approval** (anyone or everyone in a group).
- **Conditional approval** (only above a price, or only for certain models).

## Watching it from the user's side

Users follow their requests in the portal (**My Requests**), get notifications at key steps, and can add comments that fulfillers see in the activity stream.
`),
            tip("Test every new catalog item end to end as a real requester (impersonate one) before publishing: order, approve, fulfil, close."),
            check(
              "Where are a catalog item's variables stored after ordering?",
              ["On the Request (REQ)", "On the Requested Item (RITM)", "On the user record"],
              1,
              "Variables belong to the requested item.",
            ),
          ],
        },
        {
          id: "portals",
          title: "Portals and Virtual Agent",
          minutes: 11,
          blocks: [
            text(`
## Service Portal

The **Service Portal** is a modern, mobile-friendly front end for end users, by default at \`/sp\` on the instance. It is built from **pages**, **widgets** (reusable components) and a **theme**. Users can:

- Search the catalog and knowledge in one place.
- Order items and use record producers.
- Track **My Requests** and incidents.
- Read and rate knowledge articles.
- Approve requests.

Admins manage portals in **Service Portal → Portals** and design pages with the **Page Designer**; developers build widgets in the **Widget Editor**.

## Employee Center

**Employee Center** is ServiceNow's newer, unified employee portal that brings IT, HR, facilities and other departments into one experience, with **taxonomy**-based navigation, campaigns and content. Many organisations move to it from a basic Service Portal.
`),
            text(`
## Virtual Agent

**Virtual Agent** is the conversational assistant (chat) in portals, Microsoft Teams, Slack and the mobile app. It runs **topics**: conversation flows built in **Virtual Agent Designer**, such as "Reset my password" or "Check my request status". Topics can ask questions, look up records, order catalog items, search knowledge and hand off to a **live agent**.

Newer releases add generative AI features (such as Now Assist) that can understand free text and summarise records, depending on licensing.

## Measuring self-service

Track **deflection** (issues solved without an agent), catalog orders versus incidents raised by phone, knowledge views, and portal satisfaction. The aim: the easiest way to get help is also the best way.
`),
            tip("Put the five most common requests on the portal home page. Most users never scroll or search further."),
            check(
              "What is the default URL suffix for the Service Portal?",
              ["/portal", "/sp", "/now"],
              1,
              "The default Service Portal is at /sp on the instance.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Structure ----------------
    mc("structure", "easy", "What is the top-level container of items in the Service Catalog structure?", ["Catalog", "Variable", "Task", "Widget"], 0, "Catalogs contain categories, which contain items."),
    mc("structure", "medium", "What controls who can see and order a catalog item?", ["User criteria (Available for / Not available for)", "Dictionary overrides", "Update sets", "SLA definitions"], 0, "User criteria define availability."),
    tf("structure", "medium", "A catalog item can appear in more than one category.", true, "Items can be placed in several categories and catalogs."),
    mc("structure", "medium", "Which tool lets business editors create catalog items from templates without full admin rights?", ["Catalog Builder", "Schema map", "Theme Builder", "Clone engine"], 0, "Catalog Builder is a guided, template-based tool for item editors."),
    mc("structure", "easy", "Which role manages catalogs, categories and items?", ["catalog_admin", "itil", "approver_user", "snc_external"], 0, "catalog_admin is the catalog administration role."),

    // ---------------- Items ----------------
    mc("items", "easy", "On a catalog item, what are variables?", ["The questions on the item's form", "Server settings", "SLA timers", "Report types"], 0, "Variables collect information from the requester."),
    mc("items", "medium", "Which variable type lets users pick a person from the User table?", ["Reference", "Label", "Container start", "Multi line text"], 0, "A reference variable points to a table such as sys_user."),
    mc("items", "medium", "Users need to request several software titles, each with a version, in one item. What should you use?", ["A multi-row variable set", "A single line text variable", "Five separate items", "A report"], 0, "Multi-row variable sets let users add several rows of related answers."),
    mc("items", "medium", "How do you make a variable mandatory only when another variable has a certain value, without code?", ["Catalog UI policy", "Business rule", "Data source", "Dictionary override"], 0, "Catalog UI policies set mandatory, read-only and visible conditionally."),
    ms("items", "medium", "Which are catalog variable types? Select all that apply.", ["Select box", "Check box", "Attachment", "Business rule"], [0, 1, 2], "Select box, check box and attachment are variable types; business rules are server-side logic."),

    // ---------------- Producers ----------------
    mc("producers", "easy", "What does a record producer create?", ["A record in a table such as Incident", "A new catalog", "A report", "A user role"], 0, "Record producers create task or other records from a catalog form."),
    mc("producers", "medium", "What bundles several catalog items into one guided order, such as a new hire package?", ["Order guide", "Variable set", "Record producer", "View"], 0, "Order guides bundle items using rules based on initial answers."),
    mc("producers", "medium", "In an order guide, what passes answers from the guide to the included items?", ["Cascading variables", "Reference qualifiers", "Dictionary overrides", "Tags"], 0, "Cascading variables share values with matching variables on the items."),
    tf("producers", "medium", "A record producer variable whose name matches a target field name maps to that field automatically.", true, "Matching names map automatically; a script can handle other mappings."),
    mc("producers", "medium", "Which is the best tool for an \"Ask an HR question\" form that should create an HR case?", ["Record producer", "Order guide", "Report", "Scheduled job"], 0, "A record producer creates the HR case directly."),

    // ---------------- Fulfilment ----------------
    ord("fulfilment", "medium", "Put the catalog records in order from the overall order down to the fulfiller's work.", ["Request (REQ)", "Requested Item (RITM)", "Catalog Task (SCTASK)"], "A request contains requested items, and each RITM can have catalog tasks."),
    mc("fulfilment", "medium", "Which table stores requested items?", ["sc_req_item", "sc_request", "sc_task", "sysapproval_approver"], 0, "Requested items are in sc_req_item."),
    st("fulfilment", "hard", "Which table stores approval records for approvers? Give the table name.", ["sysapproval_approver"], "Each approver gets a record in sysapproval_approver."),
    tf("fulfilment", "easy", "One requested item can have several catalog tasks.", true, "Different teams can each get a catalog task for the same item."),
    mc("fulfilment", "medium", "What usually creates catalog tasks and approvals when an item is ordered?", ["The item's fulfilment flow", "A report", "A UI policy", "The schema map"], 0, "A flow (or legacy workflow) attached to the item drives fulfilment."),

    // ---------------- Portals ----------------
    mc("portals", "easy", "What is the Service Portal?", ["A mobile-friendly self-service front end for end users", "A database table", "An admin-only console", "An email server"], 0, "The Service Portal lets users search, request and track help."),
    mc("portals", "medium", "Service Portal pages are built from reusable components called…", ["Widgets", "Variables", "Indicators", "Breakdowns"], 0, "Widgets are the building blocks of portal pages."),
    mc("portals", "medium", "Which ServiceNow experience unifies IT, HR and other departments in one employee portal?", ["Employee Center", "CAB Workbench", "Schema map", "Import set"], 0, "Employee Center is the unified employee portal."),
    mc("portals", "medium", "In Virtual Agent, conversation flows such as \"Reset my password\" are called…", ["Topics", "Views", "Variables", "Breakdowns"], 0, "Virtual Agent topics are designed in Virtual Agent Designer."),
    tf("portals", "medium", "Virtual Agent can hand a conversation over to a live agent.", true, "Live agent handoff is a standard Virtual Agent capability."),
  ],
};
