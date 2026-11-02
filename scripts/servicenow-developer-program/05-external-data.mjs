import { check, mc, ms, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 5,
  id: "servicenow-dev-external-data",
  title: "Working with External Data",
  summary: "Course 5 of 6 in the Zebron ServiceNow Application Developer Program. Import CSV and Excel data, and integrate with external systems over REST: outbound calls, inbound and scripted REST APIs, testing and debugging.",
  description: `
Applications rarely live alone. This course covers bringing data in from CSV and Excel files with import sets and transform maps, calling external REST services, exposing your own REST endpoints, and testing and debugging integrations.

Each lesson ends with a quick check. The final exam is drawn from the **Working with External Data** quiz in the Test Center.
`.trim(),
  level: "intermediate",
  cover: "violet",
  outcomes: [
    "Import CSV and Excel data with data sources, import sets and transform maps",
    "Use coalesce and transform scripts to load data correctly",
    "Call external REST services with REST messages and RESTMessageV2",
    "Expose data with the Table API and scripted REST APIs",
    "Test and debug integrations with REST API Explorer and logs",
  ],
  skills: ["Import sets", "Transform maps", "REST messages", "Scripted REST APIs", "Integration debugging"],
  quiz: {
    name: "Working with External Data",
    slug: "servicenow-dev-external-data",
    description: "Practice questions for Course 5 of the ServiceNow Application Developer Program: imports, transform maps and REST integrations.",
    tags: ["servicenow", "cad", "integration", "rest"],
  },
  topics: [
    { key: "imports", name: "Importing CSV and Excel data", description: "Data sources, import set tables and loading data." },
    { key: "transforms", name: "Transform maps and coalesce", description: "Field maps, coalesce, transform scripts and import results." },
    { key: "rest-outbound", name: "Calling external REST services", description: "REST messages, HTTP methods, authentication and RESTMessageV2." },
    { key: "rest-inbound", name: "Inbound and scripted REST APIs", description: "Table API, scripted REST APIs, versions and REST_Endpoint ACLs." },
    { key: "integration-debugging", name: "Testing and debugging integrations", description: "REST API Explorer, outbound HTTP logs and status codes." },
  ],
  modules: [
    {
      id: "imports",
      title: "Importing data",
      lessons: [
        {
          id: "imports",
          title: "Importing CSV and Excel data",
          minutes: 11,
          blocks: [
            text(`
## The import path

\`\`\`
File (CSV / Excel) → Data source → Import set table (staging) → Transform map → Target table
\`\`\`

1. **Data source**: describes where the data comes from (File, JDBC, LDAP, REST…). For files, attach a **CSV** or **Excel (.xlsx)** file and set the header row and sheet.
2. **Load data**: rows are copied into an **import set table** (\`u_...\` or \`x_..._import\`), a staging table that mirrors the file's columns. Nothing has touched your real data yet.
3. **Transform**: a **transform map** copies staged rows into the **target table**.

## Quick ways

- **System Import Sets → Load Data** creates the data source and import set table in one step.
- **Import Set Row** records show each staged row and its result (inserted, updated, ignored, error).
- Scheduled **data imports** repeat a load on a schedule.

## Good practice

- Clean the file first: one header row, consistent date formats, no merged cells.
- Load into a **sub-production** instance first and check the results.
- Keep the import set table: it is useful for audits and re-runs (old rows are cleaned up automatically by the import set cleaner).
`),
            check(
              "Where do imported rows land first?",
              ["The target table", "The import set table", "The system log"],
              1,
              "Rows are staged in the import set table before transformation.",
            ),
          ],
        },
        {
          id: "transforms",
          title: "Transform maps and coalesce",
          minutes: 12,
          blocks: [
            text(`
## Field maps

A **transform map** links an import set table to a target table. Each **field map** copies a source column to a target field. **Auto Map Matching Fields** maps columns with the same names; **Mapping Assist** lets you drag the rest.

## Coalesce

**Coalesce** decides whether a row **updates** an existing record or **inserts** a new one.

| Coalesce | Result |
| --- | --- |
| No field coalesces | Every row is **inserted** (duplicates possible) |
| A field coalesces (for example Email or Employee number) | A matching record is **updated**; otherwise a new one is inserted |
| Several fields coalesce | All must match for an update |

Choose a field that is unique and stable.

## Reference fields and choices

- A reference target (for example Manager) is matched by **display value** by default; set **Referenced value field name** to match by another field (such as email).
- **Choice action** decides what happens with an unknown choice value: create it, ignore it, or reject the row.

## Transform scripts

| Script | Runs |
| --- | --- |
| **onStart / onComplete** | Once, before or after the transform |
| **onBefore** | Before each row is written (\`source\`, \`target\`, set \`ignore = true\` to skip a row) |
| **onAfter** | After each row is written |
| **Field map script** | To calculate one target value (\`answer = ...\`) |
`),
            tip("If an import keeps creating duplicates, check coalesce first."),
            check(
              "Rows should update existing users when the email matches. What do you set?",
              ["Coalesce on the email field map", "A view", "A module"],
              0,
              "Coalesce on email updates matching records instead of inserting new ones.",
            ),
          ],
        },
      ],
    },
    {
      id: "rest",
      title: "REST integrations",
      lessons: [
        {
          id: "rest-outbound",
          title: "Calling external REST services",
          minutes: 12,
          blocks: [
            text(`
## REST basics

| Method | Purpose |
| --- | --- |
| **GET** | Read |
| **POST** | Create |
| **PUT / PATCH** | Replace / update |
| **DELETE** | Delete |

Responses carry a **status code** (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error) and usually a **JSON** body.

## REST messages

**System Web Services → Outbound → REST Message** stores the endpoint, **authentication** (basic auth profile, OAuth 2.0 profile, API key in a header) and one or more **HTTP methods** with variables such as \`\${id}\`. Use **Test** on an HTTP method to try the call.

## Calling from a script

\`\`\`javascript
var request = new sn_ws.RESTMessageV2('x_acme_loans.Inventory', 'get item');
request.setStringParameterNoEscape('id', current.getValue('asset_tag'));
var response = request.execute();
if (response.getStatusCode() == 200) {
  var body = JSON.parse(response.getBody());
  current.setValue('stock', body.stock);
}
\`\`\`

- Use \`executeAsync()\` or run calls from flows or async business rules so users do not wait.
- In Flow Designer, the **REST step** in a custom action (or an IntegrationHub spoke) calls REST without code.
- Reach systems inside a private network through a **MID Server**.
`),
            check(
              "Which status code means the request was not authenticated?",
              ["200", "401", "201"],
              1,
              "401 Unauthorized means authentication is missing or failed.",
            ),
          ],
        },
        {
          id: "rest-inbound",
          title: "Inbound REST: Table API and scripted REST APIs",
          minutes: 13,
          blocks: [
            text(`
## Table API

The **Table API** (\`/api/now/table/{table}\`) lets authorised callers read and write any table they have access to, subject to **ACLs** and the table's **web services** setting. It is quick, but exposes the table's structure.

## Scripted REST APIs

A **scripted REST API** is a purpose-built endpoint for your application:

- An **API** with a base path such as \`/api/x_acme_loans/loans\`.
- **Resources**, each with an **HTTP method**, a **relative path** (for example \`/{id}/status\`) and a **script** that reads \`request\` (path parameters, query parameters, body) and writes \`response\` (status, body).
- **Versions** in the URI (\`/v1\`, \`/v2\`) let you change the API without breaking existing callers.

\`\`\`javascript
(function process(request, response) {
  var gr = new GlideRecord('x_acme_loans_request');
  if (!gr.get('number', request.pathParams.id)) {
    response.setStatus(404);
    return;
  }
  return { number: gr.getValue('number'), state: gr.getDisplayValue('state') };
})(request, response);
\`\`\`

## Securing inbound REST

- Callers authenticate (basic auth for an integration user, or **OAuth**).
- Resources can **require authentication** and **ACL authorization**: the caller must pass at least one ACL of type **REST_Endpoint** on the resource.
- Give integration users only the roles they need, and expose a narrow, versioned resource rather than broad table access.
`),
            tip("For a partner who needs one piece of information, a scripted REST resource is safer than opening the Table API."),
            check(
              "Why put a version such as v1 in a scripted REST API's URI?",
              ["To change the API later without breaking existing callers", "To make it faster", "To skip authentication"],
              0,
              "Versioning lets old and new callers coexist.",
            ),
          ],
        },
        {
          id: "integration-debugging",
          title: "Testing and debugging integrations",
          minutes: 10,
          blocks: [
            text(`
## Testing tools

| Tool | Use |
| --- | --- |
| **REST API Explorer** | Build and send requests to the instance's own APIs (Table API, scripted REST APIs), see the response and copy code samples |
| **Test** on a REST message HTTP method | Send an outbound call and see the request, response and status |
| **Postman or curl** | Test inbound endpoints as an external caller would |

## Logs

- **System Logs → Outbound HTTP Requests**: each outbound call with URL, status and timing. Increase the **log level** on the REST message to record bodies while testing.
- **System Logs → REST/Transaction logs** and **System Logs → All** for inbound calls and script errors (\`gs.error()\` in your resource scripts).
- **ECC Queue** for calls made through a MID Server.

## Common problems

| Symptom | Check |
| --- | --- |
| 401 / 403 | Credentials, integration user roles, REST_Endpoint and table ACLs, web services access |
| 404 | Endpoint path, API version, resource relative path |
| 400 | Request body format, Content-Type header |
| Timeouts | Network route, MID Server, use asynchronous calls |
`),
            check(
              "Which tool builds and sends test requests to the instance's own REST APIs?",
              ["REST API Explorer", "Form Builder", "Transform map"],
              0,
              "REST API Explorer tests the instance's APIs and shows the responses.",
            ),
          ],
        },
      ],
    },
  ],
  questions: [
    // ---------------- Imports ----------------
    mc("imports", "easy", "Which record describes where imported data comes from, such as an attached Excel file?", ["Data source", "Transform map", "Application menu", "Script action"], 0, "Data sources define the source of the data."),
    mc("imports", "medium", "What is the import set table?", ["A staging table holding the loaded rows before transformation", "The final target table", "A log of emails", "A type of ACL"], 0, "Import set tables stage the data."),
    ms("imports", "medium", "Which file formats can a file data source load? Select all that apply.", ["CSV", "Excel (.xlsx)", "XML", "MP4 video"], [0, 1, 2], "Video is not an import format."),
    tf("imports", "easy", "Loading data into the import set table changes the target table immediately.", false, "The target changes only when the transform runs."),
    mc("imports", "medium", "Where can you see whether each staged row was inserted, updated, ignored or rejected?", ["Import set rows", "The schema map", "Form Layout", "The event registry"], 0, "Import set rows record each row's result."),

    // ---------------- Transforms ----------------
    mc("transforms", "easy", "What does coalesce decide during a transform?", ["Whether a row updates an existing record or inserts a new one", "The colour of the form", "Who receives email", "The scope name"], 0, "Coalesce matches existing records."),
    mc("transforms", "medium", "An import creates duplicate users each time it runs. What is the most likely cause?", ["No field is set to coalesce", "The form view is wrong", "The module is hidden", "Email is disabled"], 0, "Without coalesce every row inserts."),
    mc("transforms", "medium", "Which transform script can skip a single row by setting ignore = true?", ["onBefore", "onComplete", "onStart", "A client script"], 0, "onBefore runs before each row and can ignore it."),
    ms("transforms", "medium", "Which statements about multiple coalesce fields are true? Select all that apply.", ["All coalesce fields must match to update", "If none match, a new record is inserted", "They should be stable, unique values", "Any one matching field is enough"], [0, 1, 2], "All coalesce fields must match together."),
    mc("transforms", "medium", "Which button maps import columns to target fields with the same names?", ["Auto Map Matching Fields", "Execute Now", "Preview Notification", "Elevate role"], 0, "Auto Map Matching Fields creates field maps automatically."),

    // ---------------- REST outbound ----------------
    mc("rest-outbound", "easy", "Which HTTP method usually reads data?", ["GET", "POST", "DELETE", "PATCH"], 0, "GET reads resources."),
    mc("rest-outbound", "medium", "Which server-side API sends a REST message from a script?", ["sn_ws.RESTMessageV2", "g_form", "GlideAjax", "GlideAggregate"], 0, "RESTMessageV2 executes outbound REST calls."),
    ms("rest-outbound", "medium", "Which can a REST message store? Select all that apply.", ["The endpoint", "Authentication settings", "HTTP methods with variables", "Form sections"], [0, 1, 2], "Form sections belong to forms."),
    mc("rest-outbound", "medium", "How should an instance call a service inside a private network?", ["Through a MID Server", "Through a client script", "Through a module", "It cannot"], 0, "MID Servers reach systems on private networks."),
    tf("rest-outbound", "medium", "Running slow outbound calls asynchronously keeps users from waiting on the form.", true, "Use async calls, flows or async business rules."),

    // ---------------- REST inbound ----------------
    mc("rest-inbound", "easy", "Which API reads and writes any table a caller has access to?", ["Table API", "Event API", "Workflow API", "Email API"], 0, "The Table API exposes tables at /api/now/table."),
    mc("rest-inbound", "medium", "Which ACL type must a caller pass for a scripted REST resource that requires ACL authorization?", ["REST_Endpoint", "client_callable_script_include", "ui_page", "processor"], 0, "REST_Endpoint ACLs authorize scripted REST resources."),
    mc("rest-inbound", "medium", "In a scripted REST resource script, how do you read the {id} path parameter?", ["request.pathParams.id", "response.id", "g_form.getValue('id')", "current.id"], 0, "Path parameters are in request.pathParams."),
    ms("rest-inbound", "medium", "Which make a scripted REST API safer than opening the Table API to a partner? Select all that apply.", ["It exposes only the data and actions you choose", "Versions let it change safely", "REST_Endpoint ACLs control callers", "It needs no authentication"], [0, 1, 2], "Scripted REST APIs still require authentication."),
    mc("rest-inbound", "medium", "A resource cannot find the requested record. Which status should it return?", ["404", "200", "201", "302"], 0, "404 Not Found tells the caller the record does not exist."),

    // ---------------- Debugging ----------------
    mc("integration-debugging", "easy", "Where are outbound REST calls logged with URL, status and timing?", ["Outbound HTTP Requests log", "Email log", "Event registry", "Schema map"], 0, "Outbound HTTP logs record each call."),
    mc("integration-debugging", "medium", "An external caller gets 403 Forbidden. What should you check first?", ["The integration user's roles and the relevant ACLs", "The form view", "The module order", "The email template"], 0, "403 means authenticated but not allowed."),
    mc("integration-debugging", "medium", "Which tool shows code samples for calling the instance's APIs?", ["REST API Explorer", "Field Watcher", "Form Builder", "Workflow editor"], 0, "REST API Explorer generates request samples."),
    tf("integration-debugging", "medium", "A 400 Bad Request often means the request body or Content-Type is wrong.", true, "400 indicates a malformed request."),
    mc("integration-debugging", "medium", "Where do you look for calls sent through a MID Server?", ["The ECC Queue", "Form Layout", "System Properties", "Application menu"], 0, "MID Server traffic goes through the ECC Queue."),
  ],
};
