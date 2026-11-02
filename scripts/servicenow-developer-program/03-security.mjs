import { check, mc, ms, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 3,
  id: "servicenow-dev-security",
  title: "Security and Restricting Access",
  summary: "Course 3 of 6 in the Zebron ServiceNow Application Developer Program. Restrict access to applications and modules, create, test and debug access controls, script security with GlideSystem, and protect application files with scope.",
  description: `
An application is only as good as the protection around its data. This course covers roles on applications and modules, access control lists (how they are evaluated, created automatically and by hand, tested and debugged), scripting security checks with GlideSystem, and the application access settings that protect a scoped application from other scopes.

Each lesson ends with a quick check. The final exam is drawn from the **Security and Restricting Access** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "violet",
  outcomes: [
    "Restrict access to applications and modules with roles",
    "Explain how access controls are matched and evaluated",
    "Create, test and debug access controls",
    "Use GlideSystem methods in security scripts",
    "Configure application access and cross-scope privileges",
  ],
  skills: ["Roles", "Access Control Lists", "Security debugging", "GlideSystem", "Application access"],
  quiz: {
    name: "Security and Restricting Access",
    slug: "servicenow-dev-security",
    description: "Practice questions for Course 3 of the ServiceNow Application Developer Program: roles, ACLs, debugging, GlideSystem and application scope protection.",
    tags: ["servicenow", "cad", "security", "acl"],
  },
  topics: [
    { key: "app-access", name: "Restricting applications and modules", description: "Application roles, menus and modules." },
    { key: "acls", name: "Access controls", description: "Types, operations, conditions and evaluation order." },
    { key: "acl-testing", name: "Creating, testing and debugging ACLs", description: "Automatic ACLs, security_admin, impersonation and debugging tools." },
    { key: "gs-security", name: "Scripting security with GlideSystem", description: "gs.hasRole, getUserID, isLoggedIn and scripted ACL answers." },
    { key: "scope-protection", name: "Protecting application artifacts with scope", description: "Application access settings, cross-scope privileges and runtime access." },
  ],
  modules: [
    {
      id: "roles-and-acls",
      title: "Roles and access controls",
      lessons: [
        {
          id: "app-access",
          title: "Restricting access to applications and modules",
          minutes: 10,
          blocks: [
            text(`
## Application roles

Create roles for the application (for example \`x_acme_loans.user\` and \`x_acme_loans.manager\`). In a scoped application, role names start with the scope.

- Give **managers** a role that **contains** the user role, so they inherit everything users can do.
- Assign roles to **groups**, not individual users, so access follows team membership.

## Menus and modules

| Item | Roles field means |
| --- | --- |
| **Application menu** | Only users with one of these roles see the menu |
| **Module** | Only users with one of these roles see that link |

Typical design: everyone with the user role sees **Create New** and **My Requests**; only managers see **All Requests** and **Reports**.

## Not a security boundary

Menus and modules control **navigation**. A user who knows the URL can still open a list unless **ACLs** stop them. Always secure the data with ACLs, then tidy the navigation with roles on menus and modules.

> The admin role passes most checks. Test as real users, not as admin.
`),
            check(
              "A manager role should include everything the user role allows. How is this done?",
              ["The manager role contains the user role", "Copy every ACL", "Give managers admin"],
              0,
              "Contained roles are inherited by the containing role.",
            ),
          ],
        },
        {
          id: "acls",
          title: "Access controls: how they are evaluated",
          minutes: 13,
          blocks: [
            text(`
## Parts of an access control

| Part | Example |
| --- | --- |
| **Type** | record, REST_Endpoint, client_callable_script_include, ui_page… |
| **Operation** | read, write, create, delete (and others such as execute) |
| **Name** (object) | \`x_acme_loans_request\` (table) or \`x_acme_loans_request.cost\` (field) |
| **Decision type** | **Allow If** (grant when conditions pass) or **Deny Unless** (deny unless conditions pass) |
| **Conditions** | Required **roles**, a **data condition** (filter), and an optional **script** setting \`answer\` |

A user must meet **all** the conditions of an ACL (roles **and** condition **and** script) for it to pass.

## Order of evaluation for records

1. **Table** ACLs are checked first, most specific match first: \`table.None\` then the parent table, then \`*\` (wildcard).
2. Then **field** ACLs: \`table.field\`, \`parent.field\`, \`table.*\`, \`*.field\`, \`*.*\`.
3. The user needs to pass the table ACL **and** the field ACL to access a field.

If several ACLs match the same object at the same level, passing **any one** Allow If ACL is enough (unless a Deny Unless ACL fails). If no ACL grants access, access is **denied**.

## Field and row access

- A **data condition** such as "Requested for is (dynamic) Me" limits **which rows** a user can read.
- **Field ACLs** hide or lock individual fields (for example cost readable by managers only).
`),
            tip("Read the evaluation as: first find the most specific table rule, then the most specific field rule. Both must pass."),
            check(
              "An ACL lists a role, a condition and a script. What must the user meet?",
              ["Any one of them", "All of them", "Only the script"],
              1,
              "Roles, condition and script must all evaluate to true.",
            ),
          ],
        },
        {
          id: "acl-testing",
          title: "Creating, testing and debugging access controls",
          minutes: 12,
          blocks: [
            text(`
## Automatically created ACLs

When you create a table in a scoped application, the platform can **create a role and ACLs** for it automatically: read, write, create and delete for the new user role. Review and adjust them before release.

## Creating ACLs by hand

1. **Elevate** to the \`security_admin\` role (user menu → Elevate role). ACLs can only be changed with it.
2. **System Security → Access Control (ACL) → New**: choose type, operation, name, decision type, roles, condition and script.
3. Keep them simple: prefer roles and conditions to scripts.

## Testing

- **Impersonate** a user with the role (and one without) and try every operation: read the list, open a record, edit fields, create, delete.
- Remember that **admin** usually passes ACLs, so testing as admin proves nothing.

## Debugging

- **Debug Security Rules** (System Security → Debugging → Debug Security Rules, or the session debug menu) shows on screen each ACL that was checked, and whether it passed or failed, and why.
- **Access Analyzer** (where available) answers "can this user do this?" for a record or field without impersonating.
- Check the **role**, the **condition** and the **script** separately when an ACL fails.
`),
            check(
              "Which role must an administrator elevate to before creating or changing ACLs?",
              ["security_admin", "itil", "catalog_admin"],
              0,
              "ACL changes require the elevated security_admin role.",
            ),
          ],
        },
      ],
    },
    {
      id: "scripting-and-scope",
      title: "Scripted security and scope",
      lessons: [
        {
          id: "gs-security",
          title: "Using GlideSystem methods to script security",
          minutes: 11,
          blocks: [
            text(`
## Useful GlideSystem methods

| Method | Returns |
| --- | --- |
| \`gs.hasRole('x_acme_loans.manager')\` | true when the user has the role (admin passes too) |
| \`gs.getUserID()\` | The current user's sys_id |
| \`gs.getUserName()\` | The user name (user_name) |
| \`gs.getUser()\` | A user object (\`isMemberOf('Group')\`, \`hasRole()\`…) |
| \`gs.isLoggedIn()\` | true when a user is logged in |
| \`gs.isInteractive()\` | true for a session started by a person, not an integration |

On the client, the equivalents are \`g_user.hasRole()\` and \`g_user.userID\`, but client checks only change the display.

## Scripted ACLs

An ACL script sets the variable \`answer\`:

\`\`\`javascript
// Requesters may read their own requests; managers may read all
answer = gs.hasRole('x_acme_loans.manager') ||
         current.requested_for == gs.getUserID();
\`\`\`

## Other places to script security

- **Business rule conditions** and **before query business rules** (add a filter so users only get their rows; use with care, as they apply everywhere).
- **UI action conditions**: \`gs.hasRole(...)\` to show a button only to some users.
- **Script include** checks before changing data.

> Use roles and conditions when they are enough. Scripts are harder to read and slower.
`),
            check(
              "Which method returns the current user's sys_id on the server?",
              ["gs.getUserID()", "g_form.getUser()", "current.getUser()"],
              0,
              "gs.getUserID() returns the logged-in user's sys_id.",
            ),
          ],
        },
        {
          id: "scope-protection",
          title: "Using application scope to protect application artifacts",
          minutes: 12,
          blocks: [
            text(`
## Application access settings (per table)

On each table's **Application Access** tab, the owning application decides what **other scopes** may do:

| Setting | Means |
| --- | --- |
| **Accessible from** | *This application scope only* or *All application scopes* |
| **Can read / create / update / delete** | Which operations other scopes may perform |
| **Allow access to this table via web services** | Whether REST/SOAP calls can reach it |
| **Allow configuration** | Whether other scopes may add fields, business rules and so on |

## Script includes and other files

A script include's **Accessible from** setting (this scope only, or all scopes) controls whether other applications can call it. **Protection policy** (Read-only or Protected) on published applications hides or locks scripts from people who install the app.

## Cross-scope privileges

When a script in one scope uses a resource in another scope, the platform checks for a **cross-scope privilege** record. With **runtime access tracking** set to *Tracking*, the platform records the request automatically and allows it; with *Enforcing*, an administrator must allow it first.

## Who decides

The **owner of the data** grants access through its application access settings; the consuming application cannot grant itself access.
`),
            tip("Start every table as accessible from this scope only, then open exactly what another application needs."),
            check(
              "Another application's script needs to read your scoped table. Where is this allowed?",
              ["On your table's Application Access settings", "In the other application's client script", "In an update set"],
              0,
              "The owning application grants access through its table's application access settings.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- App access ----------------
    mc("app-access", "easy", "What decides who sees an application menu?", ["The roles on the menu", "The table's label", "The module's order", "The update set"], 0, "Users need one of the menu's roles."),
    tf("app-access", "medium", "Hiding a module stops a user from opening the table's list by URL.", false, "Navigation is not security; ACLs protect data."),
    mc("app-access", "medium", "What is the best way to give a team access to an application?", ["Assign the application role to the team's group", "Give each person admin", "Share a password", "Remove all ACLs"], 0, "Roles assigned to groups follow team membership."),
    mc("app-access", "medium", "In the scoped application x_acme_loans, which role name follows the convention?", ["x_acme_loans.manager", "manager", "u_manager", "sys_manager"], 0, "Scoped roles start with the scope name."),
    ms("app-access", "medium", "Which statements about testing access are true? Select all that apply.", ["Test as users with and without the role", "Admin usually passes ACLs, so admin tests prove little", "Impersonation helps test real user access", "Testing is unnecessary for modules"], [0, 1, 2], "Always test as real users."),

    // ---------------- ACLs ----------------
    mc("acls", "easy", "Which ACL name secures the cost field on x_acme_loans_request?", ["x_acme_loans_request.cost", "x_acme_loans_request.None", "*.*", "cost.x_acme_loans_request"], 0, "Field ACLs are named table.field."),
    mc("acls", "medium", "What must a user pass to read a field on a record?", ["Both the table ACL and the field ACL", "Only the field ACL", "Only the table ACL", "Neither if they have a module"], 0, "Table and field ACLs both apply."),
    mc("acls", "medium", "If no ACL grants a user access to an object, what happens?", ["Access is denied", "Access is allowed", "The user becomes admin", "The record is deleted"], 0, "Access is denied by default."),
    ms("acls", "medium", "Which can be conditions of an ACL? Select all that apply.", ["Required roles", "A data condition", "A script setting answer", "The user's screen resolution"], [0, 1, 2], "Roles, condition and script are the ACL conditions."),
    mc("acls", "hard", "Which table ACL is checked first for x_acme_loans_request?", ["x_acme_loans_request.None", "The parent table's ACL", "*", "*.*"], 0, "The most specific match, the table itself, comes first."),

    // ---------------- ACL testing ----------------
    mc("acl-testing", "easy", "Which tool shows each ACL checked on a page and whether it passed?", ["Debug Security Rules", "Field Watcher only", "Update Set preview", "Transform history"], 0, "Security rule debugging lists evaluated ACLs."),
    tf("acl-testing", "medium", "Creating a table in a scoped application can create a role and ACLs for it automatically.", true, "The platform can create default ACLs and a user role; review them."),
    mc("acl-testing", "medium", "A user cannot edit a field even though they pass the table write ACL. What should you check?", ["The field's write ACLs", "The module order", "The form view name", "The email log"], 0, "Field ACLs can block writing a specific field."),
    ms("acl-testing", "medium", "Which steps test a new ACL properly? Select all that apply.", ["Impersonate a user with the role", "Impersonate a user without the role", "Try read, write, create and delete", "Test only as admin"], [0, 1, 2], "Admin passes most ACLs, so test as real users."),
    mc("acl-testing", "medium", "What must you do before you can save an ACL?", ["Elevate to security_admin", "Clear the cache", "Publish the application", "Disable business rules"], 0, "ACL changes require the elevated role."),

    // ---------------- GlideSystem security ----------------
    mc("gs-security", "easy", "Which method checks whether the current user has a role on the server?", ["gs.hasRole()", "g_form.hasRole()", "current.hasRole()", "producer.hasRole()"], 0, "gs.hasRole() checks the user's roles server-side."),
    mc("gs-security", "medium", "In an ACL script, which variable decides the result?", ["answer", "result", "allowed", "return"], 0, "ACL scripts set answer to true or false."),
    mc("gs-security", "medium", "Which method tells whether the session was started by a person rather than an integration?", ["gs.isInteractive()", "gs.getUserName()", "gs.info()", "gs.eventQueue()"], 0, "isInteractive() is true for interactive sessions."),
    tf("gs-security", "medium", "g_user.hasRole() in a client script is enough to protect data from users without the role.", false, "Client checks change only the display; ACLs protect data."),
    mc("gs-security", "medium", "Which object checks group membership with isMemberOf()?", ["The user object from gs.getUser()", "g_form", "current", "GlideAggregate"], 0, "gs.getUser().isMemberOf('Group') checks membership."),

    // ---------------- Scope protection ----------------
    mc("scope-protection", "easy", "Where does a scoped application allow other scopes to read its table?", ["The table's Application Access settings", "A client script", "The application menu", "The form view"], 0, "Application Access controls cross-scope table operations."),
    mc("scope-protection", "medium", "Which setting stops REST and SOAP calls from reaching a table?", ["Allow access to this table via web services (cleared)", "Accessible from: All application scopes", "Can read", "Allow configuration"], 0, "Clearing web service access blocks web service calls to the table."),
    mc("scope-protection", "medium", "With runtime access tracking set to Enforcing, what happens when another scope requests a resource?", ["An administrator must allow it first", "It is always allowed", "It is logged and allowed", "The application is deleted"], 0, "Enforcing requires an approved cross-scope privilege."),
    tf("scope-protection", "medium", "A consuming application can grant itself access to another application's tables.", false, "The owner of the data grants access."),
    mc("scope-protection", "medium", "A script include should only be callable by its own application. Which setting?", ["Accessible from: This application scope only", "Client callable", "Active: false", "Protection policy: None"], 0, "Accessible from limits which scopes can call it."),
  ],
};
