/**
 * APIs, JSON & Backend Integration
 * Program: Enterprise AI & Solutions Architecture, step 4
 *
 * Dry run (checks the content, writes nothing):
 *   node scripts/apis-backend/seed-apis-backend-integration.mjs
 * Create the course:
 *   node scripts/apis-backend/seed-apis-backend-integration.mjs --apply
 * Update an existing course (keeps its status, publish date and final exam):
 *   node scripts/apis-backend/seed-apis-backend-integration.mjs --apply --overwrite
 *
 * Lesson text uses the light Markdown lessons support: # / ## / ### headings,
 * - and 1. lists, **bold**, *italic*, `code`, ``` code blocks, > quotes and
 * | tables |. Each text block is one section in the lesson player; its first
 * heading is the section title.
 */

import { runCourseSeed } from '../lib/write-zebron-course.mjs';

const COURSE = {
  id: "apis-json-backend-integration",
  title: "APIs, JSON & Backend Integration",
  summary: "Building Secure APIs and Connecting Enterprise Systems",
  description: "Learn how modern applications communicate through APIs, exchange structured data, and integrate backend services.\n\nThis course covers HTTP, REST APIs, JSON, Python API development, external integrations, authentication, authorization, database operations, API security, webhooks, event-driven architecture, and asynchronous processing.\n\nThrough practical examples involving Python, Angular, Firebase, and enterprise applications, learners will develop the foundational skills required to design and implement secure application integrations.\n\nThe final project introduces enterprise integration architecture and prepares learners for advanced AI engineering and enterprise architecture studies.",
  topic: "APIs and Backend Engineering",
  program: "Enterprise AI & Solutions Architecture",
  programOrder: 4,
  level: "beginner",
  cover: "teal",
  outcomes: [
    "Explain backend architecture and how clients talk to APIs",
    "Use HTTP methods, status codes, and JSON correctly",
    "Build and call REST APIs with Python",
    "Apply authentication, authorization, and API security practices",
    "Integrate systems with databases, webhooks, and asynchronous events",
  ],
  skills: [
    "REST APIs",
    "HTTP",
    "JSON",
    "Python backend development",
    "Authentication and authorization",
    "API security",
    "Webhooks and events",
    "Enterprise integration",
  ],
};

const MODULES = [
  {
    id: "introduction-to-apis",
    title: "Introduction to APIs and Backend Architecture",
    lessons: [
      {
        id: "understanding-apis",
        title: "Understanding Application Programming Interfaces",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Application Programming Interfaces

An **API** (application programming interface) is a defined way for one piece of software to use another's data or features. It is a contract: if you send a request in the agreed format, you get a response in an agreed format.

## An everyday analogy

A restaurant menu is an API. You don't walk into the kitchen; you choose from the menu (the available operations), place an order in the expected way (the request), and receive a dish (the response). The kitchen can change how it cooks without affecting you, as long as the menu stays the same.

## Why APIs matter

- **Integration:** systems from different teams and vendors work together.
- **Reuse:** one payment, email, or AI service can be used by many applications.
- **Separation:** a web app, a mobile app, and partner systems can all use the same backend.
- **Change without breakage:** internal code can change while the API contract stays stable.

## Kinds of APIs

| Kind | Example |
| --- | --- |
| **Web APIs** | A REST API that returns course data as JSON over HTTPS |
| **Library APIs** | Functions a Python package exposes, such as \`json.loads()\` |
| **Operating system APIs** | File and network functions a program calls |
| **Third-party service APIs** | Payment, maps, messaging, and AI model APIs |

This course focuses on **web APIs**, which are how most enterprise systems and AI services communicate.

## What an API defines

- **Endpoints:** addresses for each resource or action, such as \`/api/v1/courses\`.
- **Operations:** what you can do (read, create, update, delete).
- **Formats:** how requests and responses are structured, usually JSON.
- **Authentication:** how callers prove who they are.
- **Errors:** how failures are reported.
- **Limits:** how many requests are allowed.

Good APIs document all of this, often with an **OpenAPI** specification that tools can read to generate documentation and client code.

## Key points

- An API is a contract for how software components communicate.
- APIs enable integration, reuse, and independent change.
- Web APIs define endpoints, operations, formats, authentication, errors, and limits.`,
          },
          {
            type: 'check',
            question: "Why can a team change how a service works internally without breaking the applications that use its API?",
            options: [
              "Because APIs copy the service's code into each application",
              "Because applications must be rebuilt every time the service changes",
              "Because callers depend only on the API contract, which stays the same",
              "Because APIs only work when both sides use the same programming language",
            ],
            answer: 2,
            explanation: "An API hides internal details behind a stable contract, so internals can change as long as requests and responses keep their agreed format.",
          },
        ],
      },
      {
        id: "frontend-backend-architecture",
        title: "Understanding Frontend and Backend Architecture",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Frontend and Backend Architecture

Modern applications separate the part users interact with (the **frontend**) from the part that stores data and enforces rules (the **backend**). They communicate through APIs.

## Frontend

Runs on the user's device: a browser app built with a framework such as Angular or React, or a mobile app.

- Displays information and collects input.
- Provides a responsive user experience.
- Calls backend APIs to read and change data.

Anything in the frontend can be inspected or altered by the user, so it must never hold secrets or be the only place rules are enforced.

## Backend

Runs on servers you control.

- Authenticates users and checks permissions.
- Applies business rules and validation.
- Reads and writes the database.
- Integrates with other systems, such as payment providers or AI models.
- Keeps API keys and credentials secret.

## How they communicate

\`\`\`text
Browser (Angular app)
    │  HTTPS request: GET /api/v1/courses   (with the user's token)
    ▼
Backend API (Python)
    │  checks token and permissions
    │  queries the database
    ▼
Database
    │
    ▲  results
Backend API  →  JSON response  →  Browser renders the list
\`\`\`

## Why separate them

| Benefit | Explanation |
| --- | --- |
| Security | Credentials and rules stay on the server |
| Multiple clients | Web, mobile, and partners share one backend |
| Independent development | Frontend and backend teams work in parallel |
| Scalability | Each part can scale separately |

## Validate on both sides

Frontend validation gives users fast feedback ("email is required"). **Backend validation is mandatory**, because requests can be sent directly to the API without using your frontend at all.

## Key points

- The frontend presents the interface; the backend owns data, rules, and secrets.
- They communicate through APIs, usually JSON over HTTPS.
- Never trust the frontend alone: validate and authorize on the backend.`,
          },
          {
            type: 'check',
            question: "Why must the backend validate input even if the frontend already validates it?",
            options: [
              "Frontend validation slows the application down",
              "Backend validation is only needed for mobile apps",
              "Browsers remove validation rules before sending requests",
              "Requests can be sent directly to the API, bypassing the frontend entirely",
            ],
            answer: 3,
            explanation: "Anyone can call an API directly with any data, so the backend must enforce validation and permissions itself.",
          },
        ],
      },
      {
        id: "api-architecture-patterns",
        title: "Common API Architecture Patterns",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Common API Architecture Patterns

Different communication styles suit different needs. You'll meet several in enterprise systems.

## REST

Resources are identified by URLs and manipulated with HTTP methods.

\`\`\`text
GET    /courses          list courses
GET    /courses/42       one course
POST   /courses          create a course
PATCH  /courses/42       update part of a course
DELETE /courses/42       delete a course
\`\`\`

Simple, widely understood, and cache-friendly. The most common style for public and enterprise APIs.

## GraphQL

Clients send a query describing exactly the fields they need, usually to one endpoint:

\`\`\`text
query {
  course(id: 42) {
    title
    modules { title }
  }
}
\`\`\`

Avoids fetching too much or too little data and suits complex frontends. Requires care with caching, query complexity limits, and authorization on every field.

## gRPC

Uses compact binary messages defined in Protocol Buffers over HTTP/2. Very fast and strongly typed; popular for communication **between internal services**. Less convenient directly from browsers.

## SOAP

An older XML-based protocol with formal contracts (WSDL). Still found in banking, government, and legacy enterprise systems.

## Event-driven and webhooks

Instead of a client asking, a system **notifies** others when something happens: a webhook calls your URL when a payment succeeds, or a message broker distributes events to subscribers. Covered later in this course.

## Comparison

| Style | Best for | Data format |
| --- | --- | --- |
| REST | General-purpose web APIs | JSON |
| GraphQL | Flexible data needs of complex clients | JSON |
| gRPC | Fast internal service-to-service calls | Protocol Buffers (binary) |
| SOAP | Legacy enterprise integration | XML |
| Webhooks / events | Reacting to changes as they happen | JSON messages |

Many systems combine styles: a REST API for clients, gRPC between services, and events for notifications.

## Key points

- REST uses URLs and HTTP methods and is the most common style.
- GraphQL lets clients request exactly the fields they need.
- gRPC suits fast internal calls; SOAP persists in legacy systems; events notify about changes.`,
          },
          {
            type: 'check',
            question: "Which API style lets a client request exactly the fields it needs in a single query?",
            options: [
              "gRPC",
              "REST",
              "GraphQL",
              "SOAP",
            ],
            answer: 2,
            explanation: "GraphQL clients describe the exact shape of data they want, avoiding over-fetching and under-fetching.",
          },
        ],
      },
    ],
  },
  {
    id: "http-rest-fundamentals",
    title: "HTTP Fundamentals and REST APIs",
    lessons: [
      {
        id: "understanding-http",
        title: "Understanding HTTP and HTTPS",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Understanding HTTP and HTTPS

**HTTP** (Hypertext Transfer Protocol) is the protocol browsers, apps, and APIs use to exchange requests and responses. **HTTPS** is HTTP encrypted with **TLS**.

## A request

\`\`\`text
POST /api/v1/enrollments HTTP/1.1
Host: api.zebron.example
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json
Accept: application/json

{"courseId": "python-for-ai", "learnerId": "u-123"}
\`\`\`

| Part | Purpose |
| --- | --- |
| Method | What to do (\`POST\`) |
| Path | Which resource (\`/api/v1/enrollments\`) |
| Headers | Metadata: host, authentication, content type |
| Body | Data being sent (optional) |

## A response

\`\`\`text
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/v1/enrollments/e-789

{"id": "e-789", "status": "active"}
\`\`\`

The status code (\`201\`), headers, and body tell the client what happened.

## HTTP is stateless

Each request stands alone; the server doesn't remember earlier requests by default. That's why requests carry a token or cookie to identify the user every time.

## Why HTTPS is required

TLS provides:

- **Confidentiality:** others on the network can't read the data.
- **Integrity:** data can't be altered in transit without detection.
- **Authentication:** the server proves its identity with a certificate, so clients know they're talking to the real service.

Always use HTTPS for APIs, especially when sending passwords, tokens, or personal data. Modern browsers and many API clients refuse insecure connections.

## URLs

\`\`\`text
https://api.zebron.example:443/api/v1/courses?level=beginner&page=2
scheme   host               port path           query string
\`\`\`

## Key points

- HTTP requests carry a method, path, headers, and optional body; responses carry a status, headers, and body.
- HTTP is stateless, so each request must identify the caller.
- Use HTTPS (TLS) for confidentiality, integrity, and server authentication.`,
          },
          {
            type: 'check',
            question: "What does HTTPS add to HTTP?",
            options: [
              "TLS encryption and server authentication for data in transit",
              "Automatic validation of JSON request bodies",
              "Faster responses by compressing every request",
              "A memory of earlier requests from the same user",
            ],
            answer: 0,
            explanation: "HTTPS wraps HTTP in TLS, protecting data from eavesdropping and tampering and proving the server's identity.",
          },
        ],
      },
      {
        id: "http-methods",
        title: "Understanding HTTP Methods",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding HTTP Methods

HTTP methods tell the server what action a request intends.

## The main methods

| Method | Purpose | Example | Has a body? |
| --- | --- | --- | --- |
| **GET** | Read a resource or list | \`GET /courses/42\` | No |
| **POST** | Create a resource or run an action | \`POST /courses\` | Yes |
| **PUT** | Replace a resource entirely | \`PUT /courses/42\` | Yes |
| **PATCH** | Change part of a resource | \`PATCH /courses/42\` with \`{"title": "New title"}\` | Yes |
| **DELETE** | Remove a resource | \`DELETE /courses/42\` | Usually no |

## Safe and idempotent methods

- **Safe:** doesn't change data. \`GET\` (and \`HEAD\`, \`OPTIONS\`) should never modify anything.
- **Idempotent:** repeating the same request has the same effect as sending it once.

| Method | Safe | Idempotent |
| --- | --- | --- |
| GET | Yes | Yes |
| PUT | No | Yes |
| DELETE | No | Yes |
| PATCH | No | Not necessarily |
| POST | No | No |

Idempotency matters for **retries**. If a network error hides whether a \`PUT\` succeeded, it's safe to send it again. Sending a \`POST /payments\` twice could charge a customer twice, which is why payment APIs accept an **idempotency key** so the server can recognize and ignore duplicates.

## Choosing methods for an API

\`\`\`text
GET    /learners/u-123/enrollments      list a learner's enrollments
POST   /learners/u-123/enrollments      enroll in a course
DELETE /learners/u-123/enrollments/e-9  withdraw
\`\`\`

Use nouns for resources and let the method express the action. Avoid URLs like \`/getCourses\` or \`/deleteCourse?id=42\`.

## Never change data with GET

Browsers, crawlers, and caches may repeat or prefetch \`GET\` requests. A \`GET /courses/42/delete\` link could delete data unexpectedly.

## Key points

- GET reads, POST creates, PUT replaces, PATCH updates partly, DELETE removes.
- GET is safe; GET, PUT, and DELETE are idempotent; POST is not.
- Use idempotency keys when repeating a POST could cause harm.`,
          },
          {
            type: 'check',
            question: "Why do payment APIs often accept an idempotency key with POST requests?",
            options: [
              "So a retried request isn't processed twice, which could charge the customer twice",
              "So the request can be cached by the browser",
              "So the payment is encrypted with a different key",
              "Because POST requests cannot contain a body without one",
            ],
            answer: 0,
            explanation: "POST isn't idempotent. An idempotency key lets the server recognize a repeated request and return the original result instead of charging again.",
          },
        ],
      },
      {
        id: "http-status-codes",
        title: "HTTP Status Codes and API Responses",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# HTTP Status Codes and API Responses

Every HTTP response includes a three-digit **status code** that summarizes the result.

## Categories

| Range | Meaning |
| --- | --- |
| **1xx** | Informational |
| **2xx** | Success |
| **3xx** | Redirection |
| **4xx** | Client error: the request needs to change |
| **5xx** | Server error: something failed on the server |

## Codes you'll use most

| Code | Name | Use it when |
| --- | --- | --- |
| 200 | OK | A successful read or update with a body |
| 201 | Created | A resource was created; include its location |
| 204 | No Content | Success with nothing to return, such as a delete |
| 400 | Bad Request | The request is malformed |
| 401 | Unauthorized | Authentication is missing or invalid |
| 403 | Forbidden | Authenticated, but not allowed |
| 404 | Not Found | The resource doesn't exist (or the caller mustn't know it does) |
| 409 | Conflict | The request conflicts with current state, such as a duplicate email |
| 422 | Unprocessable Content | Well-formed but fails validation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | An unexpected server failure |
| 502 / 503 / 504 | Bad Gateway / Unavailable / Timeout | Upstream or temporary problems |

## Consistent error bodies

Status codes alone aren't enough; clients need details. Return a consistent JSON structure, for example following the **Problem Details** standard (RFC 9457):

\`\`\`json
{
  "type": "https://api.zebron.example/errors/validation",
  "title": "Invalid request",
  "status": 422,
  "detail": "email must be a valid email address",
  "instance": "/api/v1/learners"
}
\`\`\`

## Good practice

- Use the most specific accurate code; don't return \`200\` with an error message inside.
- Don't leak internal details such as stack traces or SQL in error messages.
- Include a request or correlation ID so support can trace problems.
- Clients should decide whether to retry based on the code: retry 429 and 503, not 400 or 403.

## Key points

- 2xx success, 4xx the client must change something, 5xx server failure.
- 401 means not authenticated; 403 means authenticated but not allowed.
- Return consistent, safe error bodies with enough detail to act on.`,
          },
          {
            type: 'check',
            question: "A signed-in user tries to view another organization's private report. Which status code fits best?",
            options: [
              "500 Internal Server Error",
              "401 Unauthorized",
              "201 Created",
              "403 Forbidden",
            ],
            answer: 3,
            explanation: "The user is authenticated but not permitted, which is 403. 401 is for missing or invalid authentication.",
          },
        ],
      },
    ],
  },
  {
    id: "json-data-serialization",
    title: "JSON and Data Serialization",
    lessons: [
      {
        id: "understanding-json",
        title: "Understanding JSON",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Understanding JSON

**JSON** (JavaScript Object Notation) is the standard data format for web APIs. It is text-based, readable by people, and supported by every major programming language.

## Example

\`\`\`json
{
  "id": "c-42",
  "title": "Python for AI Engineering",
  "published": true,
  "lessonCount": 32,
  "rating": 4.7,
  "tags": ["python", "ai"],
  "author": {"name": "Zebron", "verified": true},
  "archivedAt": null
}
\`\`\`

## Data types

| Type | Example |
| --- | --- |
| String | \`"Python for AI"\` |
| Number | \`32\`, \`4.7\` |
| Boolean | \`true\`, \`false\` |
| Null | \`null\` |
| Object | \`{"name": "Zebron"}\` |
| Array | \`["python", "ai"]\` |

There is no date type: send dates as **ISO 8601 strings**, such as \`"2027-03-01T14:30:00Z"\`.

## Syntax rules

- Keys and strings use double quotes.
- No trailing commas.
- No comments.
- \`true\`, \`false\`, \`null\` are lowercase.

## API design conventions

- Pick one naming style for keys and use it everywhere, commonly \`camelCase\` or \`snake_case\`.
- Use consistent types: an ID should always be a string, not sometimes a number.
- Represent "no value" consistently, either \`null\` or omitting the field, and document which.
- Wrap lists in an object so you can add paging information later:

\`\`\`json
{
  "items": [{"id": "c-1"}, {"id": "c-2"}],
  "nextPageToken": "abc123"
}
\`\`\`

- Send money as integers in the smallest unit (cents) or as strings, not floating-point numbers, to avoid rounding errors.

## Content type

APIs label JSON with the header \`Content-Type: application/json\`.

## Key points

- JSON supports strings, numbers, booleans, null, objects, and arrays.
- Follow strict syntax: double quotes, no trailing commas, no comments.
- Use consistent naming and types, ISO 8601 dates, and wrapped lists in API design.`,
          },
          {
            type: 'check',
            question: "How should an API represent a date and time in JSON?",
            options: [
              "As a JavaScript Date object",
              "As an ISO 8601 string such as \"2027-03-01T14:30:00Z\"",
              "As a number of days since the API was created",
              "As a JSON date type",
            ],
            answer: 1,
            explanation: "JSON has no date type, so dates are sent as strings, and ISO 8601 is the standard, unambiguous format.",
          },
        ],
      },
      {
        id: "json-objects-arrays",
        title: "Working with JSON Objects and Arrays",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Working with JSON Objects and Arrays

Real API payloads combine objects and arrays into nested structures. Designing and reading them well is a core backend skill.

## Objects

An object is a set of key-value pairs, used for a single entity:

\`\`\`json
{"id": "u-7", "name": "Alex", "role": "Administrator"}
\`\`\`

## Arrays

An array is an ordered list, used for collections:

\`\`\`json
["Hardware", "Software", "Network"]
\`\`\`

## Nesting

\`\`\`json
{
  "organization": {
    "id": "org-1",
    "name": "Zebron Enterprise",
    "departments": [
      {
        "name": "Engineering",
        "employees": [
          {"id": "u-1", "name": "Alex"},
          {"id": "u-2", "name": "Jordan"}
        ]
      }
    ]
  }
}
\`\`\`

In Python, after parsing, the second employee's name is:

\`\`\`python
data["organization"]["departments"][0]["employees"][1]["name"]   # "Jordan"
\`\`\`

## Design guidance

| Do | Avoid |
| --- | --- |
| Keep nesting shallow (2–3 levels) | Deep trees that are hard to read and change |
| Use arrays of objects for records | Parallel arrays (\`names[]\`, \`ids[]\`) that must stay aligned |
| Return IDs for related large resources | Embedding huge related objects in every response |
| Keep the same shape for every item | Items with different fields depending on the case |

## Large collections

Returning thousands of records at once is slow. Use **pagination**:

\`\`\`text
GET /api/v1/learners?pageSize=50&pageToken=abc123
\`\`\`

The response includes the items and a token or link for the next page.

## Partial responses

Some APIs let clients choose fields, such as \`?fields=id,name\`, to reduce payload size.

## Key points

- Objects describe single entities; arrays hold ordered collections.
- Keep structures shallow and consistent, using arrays of objects for records.
- Paginate large collections.`,
          },
          {
            type: 'check',
            question: "Which JSON structure should represent a list of employee records?",
            options: [
              "Separate parallel arrays for names, IDs, and roles",
              "A single string containing all employee names",
              "One object with a numbered key for each employee field",
              "An array of objects, one object per employee",
            ],
            answer: 3,
            explanation: "An array of objects keeps each record's fields together and gives every item the same shape.",
          },
        ],
      },
      {
        id: "serialization-deserialization",
        title: "Serialization and Deserialization",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Serialization and Deserialization

**Serialization** converts in-memory data, such as Python objects, into a format that can be stored or sent, like JSON text. **Deserialization** converts it back.

\`\`\`text
Python dict  ──serialize──▶  JSON text  ──send over HTTP──▶  JSON text  ──deserialize──▶  Python dict
\`\`\`

## In Python

\`\`\`python
import json
from datetime import datetime, timezone

enrollment = {
    "learnerId": "u-123",
    "courseId": "python-for-ai",
    "enrolledAt": datetime.now(timezone.utc).isoformat(),
}

text = json.dumps(enrollment)          # serialize
restored = json.loads(text)            # deserialize
\`\`\`

\`json.dumps\` can't handle every type. Convert dates to ISO strings, \`Decimal\` values to strings or integers, and custom objects to dictionaries first.

## With data models

Frameworks such as **Pydantic** (used by FastAPI) define the expected shape and handle conversion and validation together:

\`\`\`python
from datetime import datetime
from pydantic import BaseModel

class Enrollment(BaseModel):
    learner_id: str
    course_id: str
    enrolled_at: datetime

item = Enrollment.model_validate_json(
    '{"learner_id": "u-123", "course_id": "python-for-ai", "enrolled_at": "2027-03-01T14:30:00Z"}'
)
print(item.enrolled_at.year)          # 2027, a real datetime
print(item.model_dump_json())         # back to JSON
\`\`\`

Invalid input raises a validation error instead of producing a half-correct object.

## Other formats

| Format | Typical use |
| --- | --- |
| JSON | Web APIs, configuration |
| XML | Legacy and SOAP systems, some standards |
| CSV | Spreadsheets and bulk data exchange |
| YAML | Human-edited configuration |
| Protocol Buffers | Compact binary messages for gRPC |

## Security

- Never deserialize untrusted data with formats that can execute code, such as Python's \`pickle\`.
- Validate deserialized data before using it.
- Limit request sizes so huge payloads can't exhaust memory.

## Key points

- Serialization turns objects into storable or sendable text or bytes; deserialization reverses it.
- Convert dates and special types explicitly; data models such as Pydantic validate as they convert.
- Never unpickle untrusted data, and validate everything you deserialize.`,
          },
          {
            type: 'check',
            question: "Why should an API never use Python's pickle to deserialize data from clients?",
            options: [
              "Pickle only works with XML data",
              "Unpickling untrusted data can execute arbitrary code",
              "Pickle cannot store dictionaries",
              "Pickle files are always larger than JSON",
            ],
            answer: 1,
            explanation: "pickle can reconstruct objects in ways that run code, so loading attacker-controlled data can compromise the server.",
          },
        ],
      },
    ],
  },
  {
    id: "building-apis-python",
    title: "Building APIs with Python",
    lessons: [
      {
        id: "python-backend-frameworks",
        title: "Introduction to Python Backend Frameworks",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Introduction to Python Backend Frameworks

A **web framework** handles the repetitive parts of building an API (routing URLs to functions, parsing requests, returning responses) so you can focus on business logic.

## Popular Python frameworks

| Framework | Strengths | Typical use |
| --- | --- | --- |
| **FastAPI** | Type hints drive validation and automatic OpenAPI docs; async support; fast | Modern APIs, AI services |
| **Flask** | Minimal and flexible; huge ecosystem of extensions | Small to medium APIs, prototypes |
| **Django** (+ Django REST Framework) | Batteries included: ORM, admin site, authentication | Large applications with databases and admin needs |

This course uses **FastAPI** because it suits API-first and AI backends well.

## What a framework provides

- **Routing:** \`GET /courses/{id}\` calls \`get_course(id)\`.
- **Request parsing:** path and query parameters, headers, JSON bodies.
- **Validation:** rejecting malformed input with clear errors.
- **Responses:** serializing data and setting status codes.
- **Middleware:** shared behavior such as logging, CORS, and authentication.
- **Dependency injection:** reusable pieces such as database sessions and the current user.

## The ASGI server

FastAPI applications run on an ASGI server such as **Uvicorn**:

\`\`\`bash
pip install fastapi uvicorn
uvicorn main:app --reload
\`\`\`

\`--reload\` restarts on code changes during development; don't use it in production.

## Project structure

\`\`\`text
api/
  main.py            app creation and routers
  routers/
    courses.py       course endpoints
    learners.py
  models.py          request and response schemas
  services/          business logic
  db.py              database connection
  tests/
\`\`\`

Keep business logic in services, not in route functions, so it can be tested and reused.

## Choosing a framework

- Need automatic validation, docs, and async I/O for API-first services? **FastAPI.**
- Need a small, flexible service with minimal structure? **Flask.**
- Need a full application with admin pages and an ORM out of the box? **Django.**

## Key points

- Frameworks handle routing, parsing, validation, and responses.
- FastAPI uses type hints for validation and generates OpenAPI documentation.
- Keep business logic in separate modules from route handlers.`,
          },
          {
            type: 'check',
            question: "Which feature makes FastAPI well suited to API-first services?",
            options: [
              "It includes a built-in admin site for editing database records",
              "It requires no server to run",
              "It only supports synchronous code",
              "Type hints drive request validation and automatic OpenAPI documentation",
            ],
            answer: 3,
            explanation: "FastAPI uses Python type hints and Pydantic to validate requests and generate interactive API documentation automatically.",
          },
        ],
      },
      {
        id: "creating-first-python-api",
        title: "Creating Your First Python API",
        minutes: 9,
        blocks: [
          {
            type: 'text',
            text: `# Creating Your First Python API

Let's build a small course catalog API with FastAPI.

## Setup

\`\`\`bash
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn
\`\`\`

## The code

\`\`\`python
# main.py
from fastapi import FastAPI, HTTPException

app = FastAPI(title="Course Catalog API", version="1.0.0")

COURSES = {
    "python-for-ai": {"id": "python-for-ai", "title": "Python for AI Engineering", "level": "beginner"},
    "grc": {"id": "grc", "title": "GRC Fundamentals", "level": "beginner"},
}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/v1/courses")
def list_courses(level: str | None = None):
    items = list(COURSES.values())
    if level:
        items = [course for course in items if course["level"] == level]
    return {"items": items}

@app.get("/api/v1/courses/{course_id}")
def get_course(course_id: str):
    course = COURSES.get(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course
\`\`\`

## Run it

\`\`\`bash
uvicorn main:app --reload
\`\`\`

Try these:

- \`http://127.0.0.1:8000/api/v1/courses\`
- \`http://127.0.0.1:8000/api/v1/courses?level=beginner\`
- \`http://127.0.0.1:8000/api/v1/courses/grc\`
- \`http://127.0.0.1:8000/api/v1/courses/unknown\` returns 404

## Automatic documentation

Open \`http://127.0.0.1:8000/docs\` for interactive documentation generated from your code (OpenAPI). You can send test requests from the page.

## What's happening

- \`@app.get(...)\` maps a path and method to a function.
- \`{course_id}\` in the path becomes a function argument.
- \`level: str | None = None\` becomes an optional query parameter.
- Returning a dict sends JSON with status 200.
- \`HTTPException\` returns an error status with a JSON message.

## Testing

\`\`\`python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_unknown_course_returns_404():
    assert client.get("/api/v1/courses/unknown").status_code == 404
\`\`\`

## Key points

- Decorators map HTTP methods and paths to Python functions.
- Path and query parameters become function arguments.
- FastAPI generates interactive docs at \`/docs\`; test with \`TestClient\`.`,
          },
          {
            type: 'check',
            question: "In the example, what does a request to /api/v1/courses/unknown return?",
            options: [
              "The full list of courses",
              "A 404 response with the detail \"Course not found\"",
              "A 200 response with an empty object",
              "A 500 error because the key is missing",
            ],
            answer: 1,
            explanation: "get_course raises HTTPException with status 404 when the ID isn't in COURSES.",
          },
        ],
      },
      {
        id: "api-request-validation",
        title: "API Request Validation and Data Models",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# API Request Validation and Data Models

APIs must reject invalid input before it reaches business logic or the database. In FastAPI, **Pydantic models** declare the expected shape and rules.

## Defining a request model

\`\`\`python
from pydantic import BaseModel, EmailStr, Field

class LearnerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    age: int | None = Field(default=None, ge=13, le=120)
    interests: list[str] = Field(default_factory=list, max_length=10)
\`\`\`

(\`EmailStr\` needs \`pip install "pydantic[email]"\`.)

## Using it in an endpoint

\`\`\`python
from fastapi import FastAPI, status

app = FastAPI()

class LearnerOut(BaseModel):
    id: str
    name: str
    email: EmailStr

@app.post("/api/v1/learners", response_model=LearnerOut, status_code=status.HTTP_201_CREATED)
def create_learner(payload: LearnerCreate):
    learner = save_learner(payload)          # your service function
    return learner
\`\`\`

If the body is invalid, FastAPI returns **422** with details of every problem, and your function never runs:

\`\`\`json
{
  "detail": [
    {"loc": ["body", "email"], "msg": "value is not a valid email address", "type": "value_error"}
  ]
}
\`\`\`

## Separate input and output models

- **Input models** contain only fields clients may set.
- **Output models** (\`response_model\`) control exactly what is returned, so internal fields such as password hashes or admin flags are never leaked.

This also prevents **mass assignment**: a client can't set \`is_admin: true\` if the input model doesn't include it.

## Validation beyond the shape

Some rules need data or business context:

- Is this email already registered? → **409 Conflict**.
- Does the course exist? → **404** or **422**.
- Is the user allowed to enroll others? → **403**.

Put these checks in the service layer.

## Key points

- Pydantic models declare types, required fields, and limits; FastAPI rejects invalid bodies with 422.
- Use separate input and output models to prevent mass assignment and data leaks.
- Check business rules, such as duplicates and permissions, in the service layer.`,
          },
          {
            type: 'check',
            question: "How does a separate input model help prevent mass assignment?",
            options: [
              "It makes the response smaller",
              "It allows the client to choose which database table to update",
              "Clients can only set fields the input model includes, such as excluding is_admin",
              "It encrypts every field the client sends",
            ],
            answer: 2,
            explanation: "If the input model doesn't include sensitive fields, values a client sends for them are rejected or ignored.",
          },
        ],
      },
    ],
  },
  {
    id: "api-requests-external-integrations",
    title: "API Requests and External Integrations",
    lessons: [
      {
        id: "making-api-requests-python",
        title: "Making API Requests with Python",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Making API Requests with Python

Backends frequently call other APIs. Python's **requests** library handles synchronous calls; **httpx** adds async support, which suits FastAPI.

## A GET with requests

\`\`\`python
import requests

response = requests.get(
    "https://api.example.com/v1/jobs",
    params={"keyword": "data analyst", "page": 1},
    headers={"Accept": "application/json"},
    timeout=10,
)
response.raise_for_status()
jobs = response.json()["items"]
\`\`\`

## A POST with JSON

\`\`\`python
response = requests.post(
    "https://api.example.com/v1/tickets",
    json={"title": "VPN not connecting", "priority": 2},
    headers={"Authorization": f"Bearer {token}"},
    timeout=10,
)
\`\`\`

## Async with httpx

\`\`\`python
import httpx

async def fetch_jobs(keyword: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get("https://api.example.com/v1/jobs", params={"keyword": keyword})
        response.raise_for_status()
        return response.json()["items"]
\`\`\`

In async frameworks, use an async client so waiting on the network doesn't block other requests.

## Reuse connections

Create one \`requests.Session()\` or \`httpx.Client()\` and reuse it, rather than opening a new connection for every call. It's faster and lets you set shared headers once.

## Handling failures

\`\`\`python
try:
    response = session.get(url, timeout=10)
    response.raise_for_status()
except requests.exceptions.Timeout:
    ...  # retry later or return a clear error
except requests.exceptions.HTTPError as error:
    if error.response.status_code == 404:
        ...  # treat as "not found"
    else:
        raise
\`\`\`

## Checklist

- Always set a **timeout**.
- Check status codes; don't assume success.
- Retry only temporary failures (timeouts, 429, 5xx), with backoff and a limit.
- Validate the response body before using it.
- Keep credentials in environment variables or a secret manager.
- Log the external call's duration and outcome.

## Key points

- Use \`requests\` for synchronous calls and \`httpx\` for async code.
- Reuse sessions or clients for efficiency.
- Set timeouts, check status codes, retry carefully, and validate responses.`,
          },
          {
            type: 'check',
            question: "Why should a FastAPI endpoint use an async HTTP client such as httpx.AsyncClient for external calls?",
            options: [
              "Because async clients never need timeouts",
              "Because the requests library cannot send JSON",
              "So waiting on the network doesn't block the server from handling other requests",
              "So responses are automatically cached forever",
            ],
            answer: 2,
            explanation: "Async I/O lets the server handle other requests while it waits for the external API to respond.",
          },
        ],
      },
      {
        id: "api-headers-query-parameters",
        title: "API Headers, Query Parameters, and Request Bodies",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# API Headers, Query Parameters, and Request Bodies

A request carries information in several places. Putting each piece in the right place makes APIs predictable and secure.

## Path parameters

Identify a specific resource:

\`\`\`text
GET /api/v1/courses/python-for-ai/lessons/variables
\`\`\`

## Query parameters

Filter, sort, search, or paginate a collection:

\`\`\`text
GET /api/v1/jobs?keyword=analyst&location=remote&sort=-postedAt&pageSize=20
\`\`\`

Don't put secrets or personal data in query strings: URLs are stored in server logs, browser history, and proxies.

## Headers

Metadata about the request:

| Header | Purpose |
| --- | --- |
| \`Authorization\` | Credentials, such as \`Bearer <token>\` |
| \`Content-Type\` | Format of the body, such as \`application/json\` |
| \`Accept\` | Format the client wants back |
| \`Accept-Language\` | Preferred language |
| \`Idempotency-Key\` | Lets the server detect repeated POSTs |
| \`X-Request-ID\` | Correlation ID for tracing across services |
| \`If-None-Match\` | Conditional requests for caching |

## Request body

Data being created or changed, usually JSON, sent with POST, PUT, and PATCH:

\`\`\`json
{"title": "Data Analyst", "location": "Remote", "salaryMin": 65000}
\`\`\`

## Choosing the right place

| Information | Where |
| --- | --- |
| Which resource | Path |
| Filters, sorting, paging | Query |
| Credentials and metadata | Headers |
| Data to create or update | Body |

## In FastAPI

\`\`\`python
from fastapi import FastAPI, Header, Query

app = FastAPI()

@app.get("/api/v1/jobs/{job_id}")
def get_job(
    job_id: str,                                              # path
    include: str | None = Query(default=None),                # query
    accept_language: str | None = Header(default=None),       # header
):
    ...
\`\`\`

## Key points

- Path identifies the resource; query filters and paginates; headers carry metadata and credentials; the body carries data.
- Keep secrets and personal data out of URLs.
- Use standard headers for authentication, content type, idempotency, and tracing.`,
          },
          {
            type: 'check',
            question: "Where should an access token be sent in an API request?",
            options: [
              "In the query string of the URL",
              "In the Authorization header",
              "In the response body",
              "In the URL path",
            ],
            answer: 1,
            explanation: "Tokens belong in the Authorization header. URLs are logged and cached, which could expose the token.",
          },
        ],
      },
      {
        id: "integrating-external-services",
        title: "Integrating External Services",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Integrating External Services

Enterprise applications depend on services run by others: payment processors, email and SMS providers, identity providers, job boards, CRMs, and AI models. Integrations must stay reliable when those services misbehave.

## Design an integration layer

Wrap each external service in its own module (an **adapter** or **client**) with functions in your application's terms:

\`\`\`python
class JobBoardClient:
    def __init__(self, base_url: str, api_key: str, session):
        self.base_url = base_url
        self.api_key = api_key
        self.session = session

    def search_jobs(self, keyword: str, page: int = 1) -> list[Job]:
        response = self.session.get(
            f"{self.base_url}/jobs",
            params={"q": keyword, "page": page},
            headers={"Authorization": f"Bearer {self.api_key}"},
            timeout=10,
        )
        response.raise_for_status()
        return [to_job(item) for item in response.json()["results"]]
\`\`\`

The rest of the application uses \`search_jobs()\` and never sees the provider's field names, so switching providers changes only this module.

## Handle the provider's realities

| Reality | Approach |
| --- | --- |
| Slow or unavailable | Timeouts, retries with backoff, circuit breaker |
| Rate limits | Respect \`429\` and \`Retry-After\`; queue background work |
| Changing responses | Validate and map fields; fail clearly on unexpected data |
| Version upgrades | Pin the API version; track the provider's deprecation notices |
| Partial failures | Record what succeeded; make operations idempotent so they can be retried |

A **circuit breaker** stops calling a failing service for a short period after repeated errors, giving it time to recover and keeping your own service responsive.

## Security

- Store credentials in a secret manager, rotate them, and use the least privilege the provider allows.
- Verify signatures on incoming webhooks.
- Send only the data the provider needs.
- Review the provider's security and data handling (third-party risk).

## Testing

- Unit-test your mapping code with recorded sample responses.
- Use the provider's sandbox for integration tests.
- Monitor production calls: latency, error rate, and volume.

## Key points

- Wrap each external service in an adapter that speaks your application's language.
- Plan for slowness, rate limits, changes, and partial failures.
- Protect credentials, minimize shared data, and monitor integrations.`,
          },
          {
            type: 'check',
            question: "What is the main benefit of wrapping an external service in its own adapter class?",
            options: [
              "Provider-specific details stay in one place, so changes or a new provider affect only that module",
              "It removes the need to handle errors from the provider",
              "The external service runs faster when called through a class",
              "It allows the provider to access your database directly",
            ],
            answer: 0,
            explanation: "An adapter isolates the provider's URLs, fields, and quirks so the rest of the application doesn't depend on them.",
          },
        ],
      },
    ],
  },
  {
    id: "authentication-authorization",
    title: "Authentication and Authorization",
    lessons: [
      {
        id: "authentication-fundamentals",
        title: "Understanding Authentication",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Authentication

**Authentication** verifies identity: it answers *who are you?* APIs must authenticate users, applications, and services before trusting their requests.

## Authentication factors

| Factor | Examples |
| --- | --- |
| Something you **know** | Password, PIN |
| Something you **have** | Authenticator app, security key, phone |
| Something you **are** | Fingerprint, face recognition |

**Multi-factor authentication (MFA)** combines factors and blocks most account-takeover attacks that rely on stolen passwords.

## Common methods for APIs

| Method | Typical use | Notes |
| --- | --- | --- |
| **Session cookies** | Traditional web apps | Server stores the session; protect cookies with \`HttpOnly\`, \`Secure\`, \`SameSite\` |
| **Bearer tokens (often JWTs)** | Single-page apps and mobile apps calling APIs | Sent in the \`Authorization\` header |
| **API keys** | Server-to-server access, developer access to public APIs | Identify an application, not a person; keep secret and rotate |
| **OAuth 2.0 / OpenID Connect** | Sign-in with an identity provider, delegated access | Standard flows for users and applications |
| **Mutual TLS** | High-security service-to-service traffic | Both sides present certificates |

## Use an identity provider

Rather than building login yourself, many organizations use an identity provider, such as Microsoft Entra ID, Okta, Auth0, or Firebase Authentication. It handles password storage, MFA, account recovery, and single sign-on, and issues tokens your API verifies.

## If you store passwords

- Never store them in plain text or with fast hashes such as MD5 or SHA-256 alone.
- Use a slow, salted password hashing algorithm such as **Argon2id**, **bcrypt**, or **scrypt**.
- Rate-limit login attempts and lock out or slow down repeated failures.
- Give identical error messages for "unknown user" and "wrong password" so attackers can't discover accounts.

## Service identities

Backends calling other services need identities too: service accounts, workload identities in the cloud, or client-credentials tokens. Give each service its own identity with only the permissions it needs.

## Key points

- Authentication proves identity; MFA greatly strengthens it.
- APIs commonly use bearer tokens, API keys, and OAuth 2.0 / OpenID Connect.
- Prefer an identity provider; if you store passwords, use Argon2id, bcrypt, or scrypt.`,
          },
          {
            type: 'check',
            question: "Which approach is appropriate for storing user passwords?",
            options: [
              "Hashing with a slow, salted algorithm such as Argon2id or bcrypt",
              "Storing them in plain text in a restricted table",
              "Storing them encrypted with a key kept in the same database",
              "Hashing them once with MD5 for speed",
            ],
            answer: 0,
            explanation: "Slow, salted hashing algorithms make stolen password databases far harder to crack. Fast hashes and reversible storage don't.",
          },
        ],
      },
      {
        id: "authorization-access-control",
        title: "Understanding Authorization and Access Control",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Authorization and Access Control

**Authorization** decides what an authenticated identity is allowed to do: *what may you access?* Many serious API breaches come from authorization mistakes, not broken logins.

## Access control models

| Model | How it decides | Example |
| --- | --- | --- |
| **Role-based (RBAC)** | Permissions attached to roles | Admins can delete courses; learners can't |
| **Attribute-based (ABAC)** | Rules on attributes of the user, resource, and context | Managers can view reports for *their own* department during business hours |
| **Relationship-based (ReBAC)** | Relationships between users and resources | You can edit a document you own or that was shared with you |
| **Access control lists (ACLs)** | Per-resource lists of who can do what | Shared folders |

Real systems often combine models: roles for broad permissions, ownership or organization checks for individual records.

## Check every request on the server

\`\`\`python
@app.get("/api/v1/organizations/{org_id}/reports/{report_id}")
def get_report(org_id: str, report_id: str, user = Depends(current_user)):
    report = reports.get(report_id)
    if report is None or report.org_id != org_id:
        raise HTTPException(404, "Report not found")
    if not user.is_member_of(org_id, minimum_role="manager"):
        raise HTTPException(403, "Not allowed")
    return report
\`\`\`

## Broken object level authorization

The most common API vulnerability (OWASP API Security Top 10, API1): the API checks that the user is signed in, but not that **this** record belongs to them. An attacker changes \`/invoices/1001\` to \`/invoices/1002\` and sees someone else's invoice.

Defend by checking ownership or membership for **every object** on every request, and by using unguessable IDs as an extra layer (not a substitute).

## Principles

- **Least privilege:** grant only what is needed.
- **Deny by default:** if no rule allows it, refuse.
- **Centralize** authorization logic so it isn't forgotten in some endpoints.
- **Log** denied access for monitoring.
- **Test** that users can't reach other users' or organizations' data.

## Key points

- Authorization decides what an authenticated identity may do.
- Check permissions and object ownership on the server for every request.
- Apply least privilege and deny by default; test for cross-user access.`,
          },
          {
            type: 'check',
            question: "What is the purpose of authorization in an API?",
            options: [
              "To encrypt data sent between client and server",
              "To decide what an authenticated identity is allowed to access or do",
              "To verify that users are who they claim to be",
              "To limit how many requests a client can make per minute",
            ],
            answer: 1,
            explanation: "Authentication establishes identity; authorization decides what that identity may access.",
          },
        ],
      },
      {
        id: "tokens-oauth-jwt",
        title: "API Tokens, OAuth 2.0, and JWT",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# API Tokens, OAuth 2.0, and JWT

Tokens let a client prove, on every stateless HTTP request, who it is and what it's allowed to do.

## Bearer tokens

\`\`\`text
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
\`\`\`

Whoever holds ("bears") the token can use it, so tokens must be sent only over HTTPS, kept out of URLs and logs, and given short lifetimes.

## JSON Web Tokens (JWT)

A JWT has three Base64URL-encoded parts separated by dots: **header**, **payload** (claims), and **signature**.

\`\`\`json
{
  "iss": "https://auth.zebron.example",
  "sub": "u-123",
  "aud": "zebron-api",
  "exp": 1798761600,
  "scope": "courses:read enrollments:write"
}
\`\`\`

The signature proves the token was issued by the trusted authority and hasn't been altered. The payload is **encoded, not encrypted**: anyone can read it, so never put secrets in it.

When your API receives a JWT it must verify:

- The signature, using the issuer's public key, and an expected algorithm (reject \`none\`).
- \`exp\`: the token hasn't expired.
- \`iss\` and \`aud\`: it was issued by your identity provider for your API.
- Required scopes or roles.

Use a well-maintained library rather than writing this yourself.

## OAuth 2.0

A framework for granting **delegated access** without sharing passwords. Common flows:

| Flow | Used when |
| --- | --- |
| **Authorization code with PKCE** | A user signs in through a web or mobile app |
| **Client credentials** | A backend service calls another API as itself |
| **Refresh token** | Getting a new short-lived access token without signing in again |

**OpenID Connect** builds on OAuth 2.0 to add standardized sign-in and an **ID token** describing the user.

## Token lifetimes

- **Access tokens:** short-lived, such as 5–60 minutes.
- **Refresh tokens:** longer-lived, stored securely, and revocable.

## Key points

- Bearer tokens grant access to whoever holds them; protect and limit them.
- Verify JWT signatures, expiry, issuer, audience, and scopes; JWT payloads are readable, not secret.
- Use OAuth 2.0 authorization code with PKCE for users and client credentials for services.`,
          },
          {
            type: 'check',
            question: "Why must you never put a password or secret in a JWT payload?",
            options: [
              "The payload is only encoded, so anyone holding the token can read it",
              "Secrets make the signature invalid",
              "JWT payloads can only contain numbers",
              "The payload is deleted when the token expires",
            ],
            answer: 0,
            explanation: "JWT payloads are Base64URL-encoded, not encrypted. The signature prevents tampering but doesn't hide the contents.",
          },
        ],
      },
    ],
  },
  {
    id: "databases-backend-data-management",
    title: "Databases and Backend Data Management",
    lessons: [
      {
        id: "database-fundamentals",
        title: "Understanding Databases and Data Storage",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Databases and Data Storage

Backends need a reliable place to store data. A **database** organizes data so it can be stored, queried, and updated safely by many users at once.

## Relational databases

Data lives in **tables** with rows and columns, linked by keys. Queried with **SQL**. Examples: PostgreSQL, MySQL, SQL Server, Oracle.

| learners | | |
| --- | --- | --- |
| **id** | **name** | **email** |
| u-1 | Alex | alex@example.com |

| enrollments | | |
| --- | --- | --- |
| **learner_id** | **course_id** | **status** |
| u-1 | python-for-ai | active |

- **Primary key:** uniquely identifies a row (\`id\`).
- **Foreign key:** references another table (\`learner_id\` → \`learners.id\`).
- Strong consistency, transactions, and powerful joins.

## NoSQL databases

| Type | Examples | Good for |
| --- | --- | --- |
| **Document** | MongoDB, Firestore | Flexible JSON-like records, app data |
| **Key-value** | Redis, DynamoDB | Caching, sessions, simple lookups at scale |
| **Wide-column** | Cassandra, Bigtable | Huge write volumes, time series |
| **Graph** | Neo4j | Relationships such as social or permission networks |

## Other storage

- **Object storage** (Amazon S3, Google Cloud Storage, Azure Blob) for files, images, and backups.
- **Search engines** (Elasticsearch, OpenSearch) for full-text search.
- **Vector databases** for semantic search in AI applications (covered in a later course).
- **Data warehouses** (BigQuery, Snowflake, Redshift) for analytics.

## Choosing

- Structured data with relationships and transactions: **relational**.
- Flexible documents and real-time app data: **document**.
- Very fast lookups and caching: **key-value**.
- Many systems use several stores, each for what it does best.

## Data modelling basics

- Give every record a stable unique ID.
- Store each fact once where possible (normalization), or duplicate deliberately for read speed and keep copies in sync.
- Index fields you filter and sort by.
- Plan retention and deletion for personal data.

## Key points

- Relational databases use tables, keys, SQL, and transactions.
- NoSQL types (document, key-value, wide-column, graph) suit different access patterns.
- Choose stores by data shape and access needs; index what you query.`,
          },
          {
            type: 'check',
            question: "In a relational database, what does a foreign key do?",
            options: [
              "It references the primary key of a row in another table",
              "It stores the table's data in another country",
              "It encrypts the row so only foreign users can read it",
              "It uniquely identifies each row in its own table",
            ],
            answer: 0,
            explanation: "A foreign key links a row to a related row elsewhere, such as an enrollment to its learner.",
          },
        ],
      },
      {
        id: "backend-database-operations",
        title: "Backend Database Operations and CRUD",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Backend Database Operations and CRUD

Most API endpoints perform one of four basic data operations, known as **CRUD**.

| Operation | HTTP method | SQL |
| --- | --- | --- |
| **Create** | POST | \`INSERT\` |
| **Read** | GET | \`SELECT\` |
| **Update** | PUT / PATCH | \`UPDATE\` |
| **Delete** | DELETE | \`DELETE\` |

## Parameterized queries

Never build SQL by joining strings with user input. That allows **SQL injection**:

\`\`\`python
# DANGEROUS: never do this
cursor.execute(f"SELECT * FROM learners WHERE email = '{email}'")
\`\`\`

An input such as \`' OR '1'='1\` changes the query's meaning. Use parameters instead, so the database treats input strictly as data:

\`\`\`python
cursor.execute("SELECT id, name, email FROM learners WHERE email = %s", (email,))
\`\`\`

## Using an ORM

An **ORM** (object-relational mapper) such as SQLAlchemy maps tables to Python classes and builds safe queries:

\`\`\`python
from sqlalchemy import select

def get_learner(session, learner_id: str):
    return session.execute(
        select(Learner).where(Learner.id == learner_id)
    ).scalar_one_or_none()

def create_learner(session, name: str, email: str):
    learner = Learner(name=name, email=email)
    session.add(learner)
    session.commit()
    return learner
\`\`\`

## Good practices

- Select only the columns you need.
- **Paginate** list queries; never return an entire table.
- Add **indexes** on columns used in filters, joins, and sorting.
- Use **soft deletes** (a \`deleted_at\` column) when records must be recoverable or audited, and hard-delete when data protection rules require it.
- Record \`created_at\` and \`updated_at\` timestamps.
- Use **database migrations** (for example Alembic) to change schemas in a controlled, versioned way.
- Give the application a database user with only the permissions it needs.

## Key points

- CRUD maps to POST, GET, PUT/PATCH, and DELETE.
- Always use parameterized queries or an ORM to prevent SQL injection.
- Paginate, index, track timestamps, and manage schema changes with migrations.`,
          },
          {
            type: 'check',
            question: "How do parameterized queries prevent SQL injection?",
            options: [
              "They remove all special characters from every input",
              "The database treats user input strictly as data, never as part of the SQL command",
              "They encrypt the database so attackers can't read it",
              "They run the query twice and compare the results",
            ],
            answer: 1,
            explanation: "With parameters, the query structure is fixed and input values can't change its meaning.",
          },
        ],
      },
      {
        id: "database-integrations-transactions",
        title: "Database Integration, Transactions, and Data Integrity",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Database Integration, Transactions, and Data Integrity

**Data integrity** means data stays accurate and consistent, even when many requests run at once or something fails halfway.

## Transactions

A **transaction** groups operations so they all succeed or all fail. Transferring course credits between two accounts must debit one and credit the other, never just one.

\`\`\`python
with session.begin():                     # commits on success, rolls back on error
    sender.credits -= 5
    receiver.credits += 5
    session.add(Transfer(sender_id=sender.id, receiver_id=receiver.id, amount=5))
\`\`\`

Transactions provide the **ACID** properties:

| Property | Meaning |
| --- | --- |
| **Atomicity** | All operations happen, or none do |
| **Consistency** | Rules and constraints hold before and after |
| **Isolation** | Concurrent transactions don't see each other's partial work |
| **Durability** | Once committed, changes survive crashes |

## Constraints

Let the database enforce rules too:

- \`NOT NULL\` for required fields.
- \`UNIQUE\` for values such as email addresses.
- \`FOREIGN KEY\` to prevent orphaned records.
- \`CHECK\` for ranges, such as \`credits >= 0\`.

Constraints catch bugs that slip past application validation.

## Concurrency

Two requests can update the same record at once:

- **Optimistic concurrency:** store a version number; an update succeeds only if the version hasn't changed since it was read. Otherwise return **409 Conflict** and let the client retry.
- **Pessimistic locking:** lock the row while updating; simpler but can reduce throughput.

## Across services

When an operation spans your database **and** an external service, such as charging a card and recording the order, one database transaction can't cover both. Patterns include:

- **Idempotent operations** so retries are safe.
- The **outbox pattern:** write the change and an "event to send" in the same transaction; a separate process sends events reliably.
- **Compensating actions:** if a later step fails, undo earlier steps, such as refunding.

## Key points

- Transactions make groups of changes all-or-nothing (ACID).
- Database constraints enforce integrity alongside application validation.
- Handle concurrent updates and cross-service operations with versioning, idempotency, and the outbox pattern.`,
          },
          {
            type: 'check',
            question: "What does atomicity guarantee in a database transaction?",
            options: [
              "Every transaction runs faster than the last one",
              "Transactions can never conflict with each other",
              "Data is automatically encrypted at rest",
              "All operations in the transaction succeed, or none of them do",
            ],
            answer: 3,
            explanation: "Atomicity makes a transaction all-or-nothing, so a failure halfway leaves no partial changes.",
          },
        ],
      },
    ],
  },
  {
    id: "api-security-error-handling",
    title: "API Security and Error Handling",
    lessons: [
      {
        id: "api-security-fundamentals",
        title: "API Security Fundamentals",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# API Security Fundamentals

APIs expose business data and functions directly, which makes them attractive targets. The **OWASP API Security Top 10** lists the most common risks.

## Major risks (OWASP API Security Top 10, 2023)

| Risk | Example |
| --- | --- |
| **Broken object level authorization** | Changing an ID in the URL reveals another customer's record |
| **Broken authentication** | Weak tokens, no rate limiting on login |
| **Broken object property level authorization** | Returning hidden fields, or letting clients set fields like \`role\` |
| **Unrestricted resource consumption** | No limits on request size, page size, or frequency |
| **Broken function level authorization** | Regular users can call admin endpoints |
| **Unrestricted access to sensitive business flows** | Bots buying all stock or creating mass accounts |
| **Server-side request forgery (SSRF)** | The API fetches a URL supplied by an attacker, reaching internal systems |
| **Security misconfiguration** | Verbose errors, open CORS, default credentials |
| **Improper inventory management** | Old, forgotten API versions left running |
| **Unsafe consumption of APIs** | Trusting third-party API responses without validation |

## Essential defenses

- **HTTPS everywhere.**
- **Strong authentication** and short-lived tokens.
- **Authorization on every object and function**, server-side.
- **Input validation** with schemas; reject unexpected fields.
- **Output filtering:** return only the fields the caller may see.
- **Rate limits** and request size limits.
- **Safe error messages:** no stack traces, SQL, or internal hostnames.
- **Secrets management:** no credentials in code or repositories.
- **Security headers and CORS** configured to allow only trusted origins.
- **Dependency updates** and vulnerability scanning.
- **Logging and monitoring** of authentication failures and unusual patterns.
- **An API inventory**, retiring old versions.

## Test security

- Automated tests that try to access other users' data.
- Security scanning in the CI pipeline.
- Periodic penetration tests for important APIs.

## Key points

- Authorization flaws are the most common API vulnerabilities.
- Validate input, filter output, limit resources, and protect secrets.
- Keep an inventory, monitor activity, and test security regularly.`,
          },
          {
            type: 'check',
            question: "An attacker changes /api/invoices/1001 to /api/invoices/1002 and sees another customer's invoice. Which risk is this?",
            options: [
              "Server-side request forgery",
              "Unrestricted resource consumption",
              "Broken object level authorization",
              "Improper inventory management",
            ],
            answer: 2,
            explanation: "The API authenticated the user but didn't check that the requested object belonged to them.",
          },
        ],
      },
      {
        id: "api-error-handling",
        title: "API Error Handling and Resilience",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# API Error Handling and Resilience

Failures are normal: invalid input, expired tokens, database timeouts, and unavailable dependencies. A resilient API handles them predictably and recovers gracefully.

## Return clear, safe errors

- Use the correct status code (400, 401, 403, 404, 409, 422, 429, 5xx).
- Return a consistent JSON error body.
- Explain what the client can do; hide internal details.

\`\`\`python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def unexpected_error(request: Request, error: Exception):
    request_id = request.headers.get("X-Request-ID", "unknown")
    logger.exception("Unhandled error", extra={"request_id": request_id})
    return JSONResponse(
        status_code=500,
        content={"title": "Something went wrong", "status": 500, "requestId": request_id},
    )
\`\`\`

The full error goes to your logs; the client gets a safe message and a request ID for support.

## Resilience patterns

| Pattern | Purpose |
| --- | --- |
| **Timeouts** | Don't wait forever on databases or external APIs |
| **Retries with exponential backoff and jitter** | Recover from temporary failures without overwhelming the dependency |
| **Circuit breaker** | Stop calling a failing dependency for a while |
| **Fallbacks** | Serve cached data or a reduced feature when a dependency is down |
| **Bulkheads** | Limit resources per dependency so one slow service doesn't exhaust everything |
| **Idempotency** | Make retries safe |
| **Graceful degradation** | Keep core features working when optional ones fail |

## What to retry

- Retry: timeouts, connection errors, \`429\`, \`502\`, \`503\`, \`504\`.
- Don't retry: \`400\`, \`401\`, \`403\`, \`404\`, \`422\`; they'll fail again unchanged.
- Respect \`Retry-After\` headers.
- Cap attempts, such as 3, and add random jitter so many clients don't retry in sync.

## Health checks

Expose endpoints such as \`/health\` (the service is running) and \`/ready\` (dependencies are reachable) for load balancers and monitoring.

## Key points

- Return correct status codes and consistent, safe error bodies with request IDs.
- Use timeouts, careful retries, circuit breakers, and fallbacks.
- Retry only temporary failures, with backoff, jitter, and limits.`,
          },
          {
            type: 'check',
            question: "Which response should a client retry automatically after a delay?",
            options: [
              "403 Forbidden",
              "422 Unprocessable Content",
              "503 Service Unavailable",
              "404 Not Found",
            ],
            answer: 2,
            explanation: "503 indicates a temporary server condition. The other codes will fail again until the request itself changes.",
          },
        ],
      },
      {
        id: "api-rate-limiting-monitoring",
        title: "Rate Limiting, Logging, and API Monitoring",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Rate Limiting, Logging, and API Monitoring

Running an API in production requires protecting its capacity and seeing what is happening.

## Rate limiting

Rate limits control how many requests a client may send in a time window. They:

- Protect availability against abuse and runaway clients.
- Slow brute-force attacks on login and password reset.
- Keep costs predictable, especially for expensive operations such as AI calls.
- Enforce fair use and pricing tiers.

Limits can apply per user, per API key, per IP address, or per organization, and can differ by endpoint: stricter for login, looser for reading public data.

When a limit is hit, return **429 Too Many Requests**, ideally with a \`Retry-After\` header. Common algorithms include **token bucket** (allows short bursts) and **sliding window**.

Implement limits at an **API gateway** or with a shared store such as Redis, so all server instances share the same counts.

## Logging

Use **structured logs** (JSON) so they can be searched and aggregated:

\`\`\`json
{"timestamp": "2027-03-01T14:30:00Z", "level": "info", "requestId": "r-81f2",
 "method": "POST", "path": "/api/v1/enrollments", "status": 201,
 "durationMs": 84, "userId": "u-123"}
\`\`\`

- Include a **request ID** and pass it to downstream services for tracing.
- **Never log** passwords, tokens, full card numbers, or unnecessary personal data.
- Log security events: failed logins, permission denials, rate-limit hits.

## Monitoring

Track the "golden signals":

| Signal | Example metric |
| --- | --- |
| **Latency** | 95th percentile response time per endpoint |
| **Traffic** | Requests per second |
| **Errors** | Share of 5xx responses |
| **Saturation** | CPU, memory, database connections |

Set **alerts** on symptoms users notice (rising errors, slow responses), and use dashboards and **distributed tracing** (for example OpenTelemetry) to find causes.

## Key points

- Rate limits protect availability, slow attacks, and control cost; return 429 when exceeded.
- Write structured logs with request IDs and without secrets.
- Monitor latency, traffic, errors, and saturation, and alert on user-visible symptoms.`,
          },
          {
            type: 'check',
            question: "Which header helps a client know when to retry after receiving 429 Too Many Requests?",
            options: [
              "Accept-Language",
              "Authorization",
              "Content-Type",
              "Retry-After",
            ],
            answer: 3,
            explanation: "Retry-After tells the client how long to wait before sending another request.",
          },
        ],
      },
    ],
  },
  {
    id: "webhooks-events-async-processing",
    title: "Webhooks, Events, and Asynchronous Processing",
    lessons: [
      {
        id: "understanding-webhooks",
        title: "Understanding Webhooks",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Webhooks

A **webhook** is an HTTP request one system sends to another when an event happens. Instead of repeatedly asking "has anything changed?" (polling), you're told when it does.

## Polling versus webhooks

| Polling | Webhooks |
| --- | --- |
| Your app asks every few minutes | The provider calls your URL immediately |
| Wasted requests when nothing changed | Requests only when there's news |
| Delays up to the polling interval | Near real time |

## Example

A payment provider sends this to your endpoint when a payment succeeds:

\`\`\`text
POST https://api.zebron.example/webhooks/payments
Content-Type: application/json
Payment-Signature: t=1798761600,v1=5257a869e7ec...

{"id": "evt_3001", "type": "payment.succeeded", "data": {"orderId": "o-77", "amount": 4900}}
\`\`\`

## Receiving webhooks safely

1. **Verify the signature.** Compute an HMAC of the raw body with the shared secret and compare it, in constant time, with the header. Reject anything that doesn't match. Anyone can send a request to your URL.
2. **Check the timestamp** to reject old, replayed messages.
3. **Respond quickly** (2xx within a few seconds) and do heavy work in a background job.
4. **Handle duplicates.** Providers retry on failure, so the same event may arrive more than once. Store processed event IDs and skip repeats (idempotency).
5. **Don't assume order.** Events can arrive out of sequence; check current state when it matters.
6. **Use HTTPS** and keep the secret in a secret manager.

\`\`\`python
import hmac, hashlib

def is_valid(raw_body: bytes, signature: str, secret: bytes) -> bool:
    expected = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
\`\`\`

## Sending webhooks

If your platform sends webhooks to customers: sign every message, retry with backoff, let customers see delivery history, and allow them to rotate secrets.

## Key points

- Webhooks push event notifications instead of making clients poll.
- Verify signatures, check timestamps, respond fast, and process in the background.
- Expect retries and duplicates: make processing idempotent.`,
          },
          {
            type: 'check',
            question: "Why must a webhook receiver verify the request's signature?",
            options: [
              "Anyone can send a request to the URL, so the signature proves it came from the real provider",
              "Providers stop sending webhooks if signatures aren't checked",
              "The signature contains the event data in encrypted form",
              "Signatures make the webhook arrive faster",
            ],
            answer: 0,
            explanation: "Without verification, an attacker could post fake events, such as a false payment confirmation.",
          },
        ],
      },
      {
        id: "event-driven-architecture",
        title: "Introduction to Event-Driven Architecture",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Introduction to Event-Driven Architecture

In an **event-driven architecture**, services communicate by publishing and reacting to **events**: records that something happened, such as \`LearnerEnrolled\` or \`PaymentSucceeded\`.

## How it works

\`\`\`text
Enrollment service ──publishes──▶ "LearnerEnrolled" ──▶ Message broker
                                                          ├──▶ Email service: send welcome email
                                                          ├──▶ Analytics: update dashboards
                                                          └──▶ Billing: start subscription
\`\`\`

The publisher doesn't know or wait for the consumers. New consumers can be added without changing the publisher.

## Key components

| Component | Role | Examples |
| --- | --- | --- |
| **Producer** | Publishes events | Enrollment service |
| **Broker** | Stores and delivers events | Apache Kafka, RabbitMQ, Google Pub/Sub, AWS SNS/SQS, Azure Service Bus |
| **Consumer** | Reacts to events | Email, analytics, billing services |
| **Topic / queue** | Named channel for events | \`enrollments\` |

## Event design

\`\`\`json
{
  "eventId": "e-9f2c",
  "type": "LearnerEnrolled",
  "occurredAt": "2027-03-01T14:30:00Z",
  "version": 1,
  "data": {"learnerId": "u-123", "courseId": "python-for-ai"}
}
\`\`\`

- Name events in the past tense: they describe facts.
- Include a unique ID, timestamp, and schema version.
- Keep payloads small; consumers can fetch details if needed.

## Benefits

- **Loose coupling:** services evolve independently.
- **Scalability:** consumers process at their own pace; queues absorb spikes.
- **Resilience:** if the email service is down, events wait in the queue.
- **Extensibility:** add new reactions without touching existing code.

## Challenges

- **Eventual consistency:** other services update a little later, not instantly.
- **Duplicates and ordering:** most brokers deliver *at least once*; consumers must be idempotent.
- **Debugging:** following a process across services needs tracing and correlation IDs.
- **Failed messages:** use dead-letter queues and alerts.

## Key points

- Services publish events about what happened; others react independently through a broker.
- Event-driven designs are loosely coupled, scalable, and extensible.
- Plan for eventual consistency, duplicates, ordering, and failed messages.`,
          },
          {
            type: 'check',
            question: "Why must event consumers usually be idempotent?",
            options: [
              "Producers wait for every consumer to finish",
              "Idempotent consumers process events faster",
              "Most brokers deliver at least once, so the same event can arrive more than once",
              "Events are deleted before consumers can read them",
            ],
            answer: 2,
            explanation: "At-least-once delivery means duplicates are possible, so processing the same event twice must not cause double effects.",
          },
        ],
      },
      {
        id: "asynchronous-processing",
        title: "Asynchronous Processing and Background Jobs",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Asynchronous Processing and Background Jobs

In **synchronous** processing, the client waits until the work finishes. That's fine for quick operations, but slow tasks (generating reports, processing videos, sending thousands of emails, long AI jobs) should run **asynchronously** in the background.

## The pattern

\`\`\`text
1. Client: POST /api/v1/reports           → API creates a job, returns 202 Accepted
2. API puts the job on a queue
3. Worker picks up the job and does the work
4. Client: GET /api/v1/jobs/j-55          → {"status": "running", "progress": 60}
5. Worker finishes                         → job status "completed", result URL stored
6. Client fetches the result, or receives a webhook or notification
\`\`\`

Response to step 1:

\`\`\`json
{"jobId": "j-55", "status": "queued", "statusUrl": "/api/v1/jobs/j-55"}
\`\`\`

**202 Accepted** means the request was accepted for processing but isn't complete.

## Tools

- **Task queues:** Celery, RQ, or Dramatiq with Redis or RabbitMQ.
- **Cloud services:** Cloud Tasks, Pub/Sub, AWS SQS with Lambda, Azure Queue Storage with Functions.
- **Scheduled jobs** for recurring work, such as nightly reports.

## Designing reliable jobs

| Concern | Approach |
| --- | --- |
| Retries | Retry temporary failures with backoff; cap attempts |
| Duplicates | Make jobs idempotent |
| Failures | Record errors; send repeatedly failing jobs to a dead-letter queue |
| Long tasks | Report progress; split large work into smaller jobs |
| Timeouts | Set a maximum runtime per job |
| Visibility | Track queue length, job duration, and failure rate |

## When to use asynchronous processing

- Work that takes more than a few seconds.
- Work that can fail and should be retried without the user waiting.
- High-volume work that should be smoothed out over time.
- Calls to slow external services, including batch AI processing.

## Key points

- Run slow or unreliable work in background jobs, not in the request.
- Return 202 Accepted with a job ID, then report status by polling, webhook, or notification.
- Build jobs with retries, idempotency, timeouts, dead-letter queues, and monitoring.`,
          },
          {
            type: 'check',
            question: "What status code fits an API that accepts a report request and processes it later in the background?",
            options: [
              "202 Accepted",
              "301 Moved Permanently",
              "200 OK",
              "204 No Content",
            ],
            answer: 0,
            explanation: "202 tells the client the request was accepted but processing isn't complete yet.",
          },
        ],
      },
    ],
  },
  {
    id: "enterprise-integration-project",
    title: "Enterprise Integration Project",
    lessons: [
      {
        id: "designing-enterprise-api",
        title: "Project: Designing an Enterprise API",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Project: Designing an Enterprise API

In this project you design the API for **Zebron Enterprise Jobs**, a multi-organization job board where companies post jobs and candidates apply.

## Requirements

- Organizations post, edit, and close jobs.
- Candidates search jobs and apply with a résumé.
- Organization recruiters review applications for **their own** jobs only.
- Partners receive notifications when applications arrive.
- All access is authenticated; public job search is read-only.

## Resources and endpoints

| Method | Endpoint | Who |
| --- | --- | --- |
| GET | \`/api/v1/jobs?keyword=&location=&pageToken=\` | Anyone |
| GET | \`/api/v1/jobs/{jobId}\` | Anyone (open jobs) |
| POST | \`/api/v1/organizations/{orgId}/jobs\` | Recruiters of that organization |
| PATCH | \`/api/v1/organizations/{orgId}/jobs/{jobId}\` | Recruiters of that organization |
| POST | \`/api/v1/jobs/{jobId}/applications\` | Signed-in candidates |
| GET | \`/api/v1/organizations/{orgId}/jobs/{jobId}/applications\` | Recruiters of that organization |
| POST | \`/api/v1/organizations/{orgId}/webhooks\` | Organization admins |

## Data model sketch

\`\`\`json
{
  "id": "job-981",
  "organizationId": "org-12",
  "title": "Data Analyst",
  "location": "Remote",
  "status": "open",
  "createdAt": "2027-03-01T14:30:00Z"
}
\`\`\`

## Design decisions

- **Tenant isolation:** every recruiter endpoint checks that the caller belongs to \`orgId\` *and* that the job belongs to \`orgId\`. This prevents organizations reading or changing each other's data.
- **Authentication:** OpenID Connect sign-in; short-lived access tokens.
- **Validation:** Pydantic models; reject unknown fields.
- **Pagination** on searches and application lists.
- **Rate limits:** stricter on applications to prevent spam.
- **Résumés:** uploaded to object storage via short-lived signed URLs; scanned for malware.
- **Webhooks:** \`application.created\` events, signed, retried, idempotent.
- **Versioning:** \`/api/v1\`; breaking changes go to \`/api/v2\`.
- **Documentation:** OpenAPI specification published for partners.

## Your task

1. Write the request and response JSON for creating a job and submitting an application.
2. List the authorization check for each endpoint.
3. Define error responses for duplicate applications (409) and closed jobs.

## Key points

- Model resources and endpoints around the business entities.
- Enforce tenant isolation on every organization-scoped request.
- Plan validation, pagination, rate limits, file handling, webhooks, and versioning up front.`,
          },
          {
            type: 'check',
            question: "Why does every recruiter endpoint check that the caller and the job both belong to the orgId in the URL?",
            options: [
              "To let users sign in once and use every organization's jobs",
              "To stop one organization reading or changing another organization's data",
              "To make responses faster by caching each organization's results",
              "To keep job listings visible to search engines",
            ],
            answer: 1,
            explanation: "Tenant isolation prevents cross-organization access. Checking both the caller's membership and the job's owner closes the gap.",
          },
        ],
      },
      {
        id: "implementing-integration-workflow",
        title: "Project: Implementing an Integration Workflow",
        minutes: 9,
        blocks: [
          {
            type: 'text',
            text: `# Project: Implementing an Integration Workflow

Zebron will import job postings from an external job provider every hour and notify organizations about new matches.

## Workflow

\`\`\`text
Scheduler (hourly)
   ↓
Import job: call the provider API page by page
   ↓
Validate and map each posting to Zebron's job model
   ↓
Upsert into the database (insert new, update changed, keyed by provider ID)
   ↓
Publish "JobImported" events for new postings
   ↓
Notification consumer: match saved searches and send alerts
\`\`\`

## The import job

\`\`\`python
def import_jobs(client: JobProviderClient, repo: JobRepository, publisher: EventPublisher):
    page_token = None
    imported = updated = skipped = 0

    while True:
        page = client.list_jobs(page_token=page_token, updated_since=repo.last_import_time())
        for raw in page.items:
            try:
                job = map_provider_job(raw)            # validate and convert fields
            except ValueError as error:
                log.warning("Skipping invalid job", extra={"providerId": raw.get("id"), "error": str(error)})
                skipped += 1
                continue
            created = repo.upsert(job, key=("provider", job.provider_id))
            if created:
                publisher.publish("JobImported", {"jobId": job.id})
                imported += 1
            else:
                updated += 1
        page_token = page.next_token
        if not page_token:
            break

    repo.record_import_time()
    log.info("Import finished", extra={"imported": imported, "updated": updated, "skipped": skipped})
\`\`\`

## Reliability features

| Concern | Implementation |
| --- | --- |
| Duplicates | Upsert keyed by the provider's job ID |
| Incremental sync | Only request jobs updated since the last successful import |
| Bad records | Skip and log them without stopping the whole import |
| Provider outages | Timeouts and retries in the client; the next hourly run catches up |
| Rate limits | Respect \`429\` and \`Retry-After\`; pace page requests |
| Partial runs | Record the import time only after success |
| Observability | Log counts and duration; alert if imports fail twice in a row |

## Testing

- Unit-test \`map_provider_job\` with valid, incomplete, and malformed samples.
- Use a fake client to test paging and error handling.
- Run against the provider's sandbox before production.

## Key points

- Break integrations into fetch, validate and map, upsert, and publish steps.
- Use upserts and incremental sync to avoid duplicates and wasted work.
- Skip bad records, handle provider limits, and record progress only after success.`,
          },
          {
            type: 'check',
            question: "Why does the import job upsert using the provider's job ID?",
            options: [
              "To make each import run download every job again",
              "So the provider can edit Zebron's database directly",
              "Because the provider requires its IDs to be deleted after import",
              "So re-importing the same posting updates it instead of creating a duplicate",
            ],
            answer: 3,
            explanation: "Keying on the provider's ID makes the import idempotent: existing postings are updated, new ones inserted.",
          },
        ],
      },
      {
        id: "enterprise-integration-capstone",
        title: "Final Project: Enterprise Integration Architecture",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Final Project: Enterprise Integration Architecture

Your final project is to design and document an integration architecture for Zebron's learning and jobs platform.

## Scenario

Zebron provides learning, certification, and job services to many organizations. It must:

- Sync employees from organizations' HR systems.
- Accept single sign-on from organizations' identity providers.
- Charge for subscriptions through a payment provider.
- Import external job postings.
- Send email and SMS notifications.
- Use an AI model provider for a learning assistant.
- Feed analytics into a data warehouse.

## What to deliver

1. **Context diagram:** Zebron, its users, and every external system, with the direction of data flow.
2. **Integration inventory:**

| Integration | Pattern | Direction | Data | Authentication | Frequency |
| --- | --- | --- | --- | --- | --- |
| HR system | Scheduled API sync + webhooks | Inbound | Employees | OAuth client credentials | Hourly + events |
| Identity providers | OpenID Connect | Inbound | Sign-in identity | Federation | Per sign-in |
| Payment provider | REST + webhooks | Both | Subscriptions, payments | API key + signed webhooks | Real time |
| AI model provider | REST via backend service | Outbound | Prompts, answers | API key in secret manager | Per request |

3. **Security design:** tenant isolation, secrets management, least-privilege service identities, webhook verification, and data minimization.
4. **Reliability design:** timeouts, retries, idempotency, queues, dead-letter handling, and fallbacks for each integration.
5. **Data design:** which system is the source of truth for each entity.
6. **Operations:** logging, tracing, dashboards, alerts, and runbooks.
7. **Decisions and rationale:** for each major choice, the alternatives considered and why you chose this one.

## Assessment criteria

- Components and data flows are complete and clear.
- Each pattern fits its integration's needs.
- Security and tenant isolation are addressed end to end.
- Failure scenarios have planned responses.
- Decisions are justified against requirements.

## Course review

You have covered APIs, HTTP, JSON, Python APIs with FastAPI, external integrations, authentication and authorization, databases and transactions, security, error handling, monitoring, webhooks, events, and background processing.

## Key points

- Document systems, data flows, patterns, security, reliability, and operations.
- Justify each decision against the requirements.`,
          },
          {
            type: 'check',
            question: "What should the architecture document explain for each major design decision?",
            options: [
              "The pricing and licence terms of every service used",
              "The alternatives considered and why the chosen option meets the requirements",
              "Each team's sprint plan and delivery dates",
              "The full source code of every integration and its unit tests",
            ],
            answer: 1,
            explanation: "Recording alternatives and rationale shows the design is deliberate and helps others review and maintain it.",
          },
        ],
      },
    ],
  },
];

runCourseSeed({ course: COURSE, modules: MODULES, script: 'scripts/apis-backend/seed-apis-backend-integration.mjs' }).catch((error) => {
  console.error('\nSEED FAILED:', error);
  process.exit(1);
});
