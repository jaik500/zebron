// ================================================
// APIs, JSON & BACKEND INTEGRATION
// SECTION 1 OF 3
// ================================================

import {
  applicationDefault,
  initializeApp,
} from "firebase-admin/app";

import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

const PROJECT_ID =
  process.env.GCLOUD_PROJECT || "zebron-2b49f";

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

const COURSE_ID = "apis-json-backend-integration";

const args = process.argv.slice(2);

const APPLY = args.includes("--apply");
const OVERWRITE = args.includes("--overwrite");

// ================================================
// CONTENT HELPERS
// ================================================

const text = (value) => ({
  type: "text",
  text: value.trim(),
});

const check = (
  question,
  options,
  answer,
  explanation
) => ({
  type: "check",
  question,
  options,
  answer,
  explanation,
});

const lesson = (
  id,
  title,
  minutes,
  content,
  question,
  options,
  answer,
  explanation
) => ({
  id,
  title,
  minutes,
  blocks: [
    text(content),
    check(question, options, answer, explanation),
  ],
});

const moduleData = (id, title, lessons) => ({
  id,
  title,
  lessons,
});

// ================================================
// COURSE MODULES
// ================================================

const MODULES = [];

// ================================================
// MODULE 1 — INTRODUCTION TO APIs
// ================================================

MODULES.push(
  moduleData(
    "introduction-to-apis",
    "Introduction to APIs and Backend Architecture",
    [
      lesson(
        "understanding-apis",
        "Understanding Application Programming Interfaces",
        14,
        `
An Application Programming Interface (API) allows
different software applications to communicate.

An API defines how one system can request information
or functionality from another system.

Consider an application that displays weather information.

The application does not need to maintain its own
weather database.

Instead, it can communicate with a weather provider
through an API.

The application sends a request.

The API receives the request, processes it,
and returns a response.

Common API use cases include:

- Retrieving customer information.
- Processing payments.
- Authenticating users.
- Accessing artificial intelligence models.
- Retrieving job listings.
- Connecting enterprise applications.

For example, Zebron can use an API to retrieve
external job listings and store them in Firebase.

APIs are fundamental to modern application development
and enterprise integration.
        `,
        "What is the primary purpose of an API?",
        [
          "To allow software applications to communicate",
          "To replace every database",
          "To create computer hardware",
          "To prevent applications from sharing information"
        ],
        0,
        "APIs define how applications communicate and exchange information or functionality."
      ),

      lesson(
        "frontend-backend-architecture",
        "Understanding Frontend and Backend Architecture",
        15,
        `
Most modern applications separate their frontend
and backend responsibilities.

Frontend:

The frontend is the part of an application
that users interact with.

Examples include:

- Buttons.
- Forms.
- Navigation.
- Dashboards.
- Tables.
- Search interfaces.

Angular is an example of a frontend framework.

Backend:

The backend handles application logic,
data processing, authentication, and communication
with databases and external services.

Examples include:

- Python applications.
- Node.js services.
- Java applications.
- Firebase Cloud Functions.

Database:

The database stores and retrieves application data.

Examples include:

- Firebase Firestore.
- PostgreSQL.
- MySQL.
- MongoDB.

Example architecture:

Angular frontend
        |
        v
Backend API
        |
        v
Business Logic
        |
        v
Database

A frontend should not be trusted to enforce
all security decisions.

Important operations should be validated
and authorized by trusted backend services.
        `,
        "Which component is primarily responsible for executing server-side business logic?",
        [
          "Frontend",
          "Backend",
          "Browser address bar",
          "CSS stylesheet"
        ],
        1,
        "The backend executes server-side business logic and coordinates data operations."
      ),

      lesson(
        "api-architecture-patterns",
        "Common API Architecture Patterns",
        15,
        `
Applications use different architectural patterns
to communicate.

Client-Server Architecture:

A client requests services from a server.

The client may be a browser, mobile application,
or another backend system.

REST:

Representational State Transfer is an architectural
style commonly used to build web APIs.

REST APIs commonly use HTTP methods such as:

GET
POST
PUT
PATCH
DELETE

GraphQL:

GraphQL allows clients to request specific data
through a defined query language.

SOAP:

Simple Object Access Protocol is a protocol used
for structured message exchange, often in enterprise
and legacy integrations.

RPC:

Remote Procedure Call allows one system to invoke
a procedure or operation exposed by another system.

The appropriate architecture depends on requirements
such as performance, interoperability, complexity,
security, and existing enterprise systems.
        `,
        "Which API approach allows clients to request specific fields of data using a query language?",
        [
          "SOAP",
          "GraphQL",
          "CSS",
          "FTP"
        ],
        1,
        "GraphQL allows clients to request specific data fields through queries."
      ),
    ]
  )
);

// ================================================
// MODULE 2 — HTTP FUNDAMENTALS AND REST APIs
// ================================================

MODULES.push(
  moduleData(
    "http-rest-fundamentals",
    "HTTP Fundamentals and REST APIs",
    [
      lesson(
        "understanding-http",
        "Understanding HTTP and HTTPS",
        14,
        `
HTTP stands for Hypertext Transfer Protocol.

It is a communication protocol used by web clients
and servers.

When a browser accesses a website or an application
calls an API, HTTP is commonly used to exchange messages.

An HTTP request contains information such as:

- HTTP method.
- URL.
- Headers.
- Optional request body.

An HTTP response contains:

- Status code.
- Response headers.
- Optional response body.

HTTPS is HTTP protected by TLS encryption.

HTTPS helps protect information exchanged
between clients and servers.

It is particularly important when transmitting:

- Authentication credentials.
- Customer information.
- Payment information.
- API tokens.
- Confidential business data.

Example:

GET https://api.example.com/customers

This represents an HTTP GET request to retrieve
customer information.

In enterprise environments, APIs should use HTTPS
rather than transmitting sensitive information
through unencrypted HTTP connections.
        `,
        "What additional protection does HTTPS provide over HTTP?",
        [
          "TLS encryption",
          "Automatic database backups",
          "Unlimited API requests",
          "Automatic user registration"
        ],
        0,
        "HTTPS uses TLS to protect communications between clients and servers."
      ),

      lesson(
        "http-methods",
        "Understanding HTTP Methods",
        15,
        `
HTTP methods communicate the intended action
for an API request.

GET:

Retrieves information.

Example:
GET /customers

POST:

Creates a resource or submits information
for processing.

Example:
POST /customers

PUT:

Replaces a resource or its representation.

Example:
PUT /customers/123

PATCH:

Updates part of an existing resource.

Example:
PATCH /customers/123

DELETE:

Requests removal of a resource.

Example:
DELETE /customers/123

These methods help establish consistent API behavior.

An API should document which methods are supported
and what each operation does.

Important concepts:

GET should not be used to perform destructive changes.

PUT is generally intended to replace a resource.

PATCH is generally intended for partial updates.

POST is commonly used for resource creation
and other operations that are not simple retrieval.
        `,
        "Which HTTP method is commonly used to retrieve a resource?",
        [
          "POST",
          "DELETE",
          "GET",
          "PATCH"
        ],
        2,
        "GET is used to retrieve information from a server."
      ),

      lesson(
        "http-status-codes",
        "HTTP Status Codes and API Responses",
        15,
        `
HTTP status codes communicate the result
of an API request.

They are organized into categories.

2xx — Success:

200 OK:
The request succeeded.

201 Created:
A resource was successfully created.

204 No Content:
The request succeeded without returning response content.

4xx — Client Errors:

400 Bad Request:
The request contains invalid information.

401 Unauthorized:
Authentication is missing or invalid.

403 Forbidden:
The caller is authenticated but does not have permission.

404 Not Found:
The requested resource does not exist.

429 Too Many Requests:
The client exceeded a request limit.

5xx — Server Errors:

500 Internal Server Error:
An unexpected server error occurred.

502 Bad Gateway:
A gateway received an invalid response from another server.

503 Service Unavailable:
The service is temporarily unavailable.

Understanding status codes makes API troubleshooting
much easier.

For example, a 401 error may indicate an expired token,
while a 403 error may indicate insufficient permissions.
        `,
        "Which HTTP status code indicates that a resource was successfully created?",
        [
          "200",
          "201",
          "401",
          "500"
        ],
        1,
        "HTTP 201 Created indicates that a resource was successfully created."
      ),
    ]
  )
);

// ================================================
// MODULE 3 — JSON AND DATA SERIALIZATION
// ================================================

MODULES.push(
  moduleData(
    "json-data-serialization",
    "JSON and Data Serialization",
    [
      lesson(
        "understanding-json",
        "Understanding JSON",
        14,
        `
JSON stands for JavaScript Object Notation.

It is a lightweight data format commonly used
to exchange information between applications.

JSON is language-independent and is supported
by Python, JavaScript, Java, C#, and many other languages.

Example JSON:

{
  "id": "customer-001",
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "active": true,
  "accountBalance": 250.75
}

JSON supports these data types:

String:
"Alex Morgan"

Number:
250.75

Boolean:
true or false

Null:
null

Object:
A collection of key-value pairs.

Array:
An ordered collection of values.

JSON is widely used in REST APIs because it is readable,
compact, and easy for applications to process.
        `,
        "Which of the following is a valid JSON boolean value?",
        [
          "yes",
          "True",
          "true",
          "enabled"
        ],
        2,
        "JSON uses lowercase true and false for boolean values."
      ),

      lesson(
        "json-objects-arrays",
        "Working with JSON Objects and Arrays",
        15,
        `
JSON objects contain key-value pairs.

Example:

{
  "name": "Alex",
  "role": "Administrator"
}

Each key is a string, and its value can be
a string, number, boolean, null, object, or array.

JSON arrays contain ordered collections of values.

Example:

{
  "employees": [
    {
      "id": 1,
      "name": "Alex"
    },
    {
      "id": 2,
      "name": "Jordan"
    }
  ]
}

Applications commonly use arrays to represent
collections of records.

Nested JSON structures allow applications
to represent more complex information.

For example, an enterprise API might return
an organization, its departments, and its employees
in one structured response.

When designing APIs, use consistent field names,
clear data types, and predictable structures.
        `,
        "Which JSON structure is used to represent an ordered collection of values?",
        [
          "Object",
          "Array",
          "Boolean",
          "Null"
        ],
        1,
        "A JSON array represents an ordered collection of values."
      ),

      lesson(
        "serialization-deserialization",
        "Serialization and Deserialization",
        15,
        `
Serialization converts application data into
a format suitable for storage or transmission.

Deserialization converts serialized information
back into application data.

For example, a Python application may contain
a dictionary:

customer = {
    "name": "Alex",
    "active": True
}

Python can serialize this dictionary into JSON.

Example:

import json

json_data = json.dumps(customer)

The resulting JSON string can be transmitted
to another application.

Deserialization can convert JSON back into
a Python dictionary.

Example:

customer_data = json.loads(json_data)

The distinction is important:

json.dumps():
Python object to JSON string.

json.loads():
JSON string to Python object.

In real applications, data should be validated
before it is trusted or processed.
        `,
        "Which Python function converts a Python object into a JSON string?",
        [
          "json.loads()",
          "json.dumps()",
          "json.open()",
          "json.read()"
        ],
        1,
        "json.dumps() serializes a Python object into a JSON-formatted string."
      ),
    ]
  )
);

// ================================================
// MODULE 4 — BUILDING APIs WITH PYTHON
// ================================================

MODULES.push(
  moduleData(
    "building-apis-python",
    "Building APIs with Python",
    [
      lesson(
        "python-backend-frameworks",
        "Introduction to Python Backend Frameworks",
        15,
        `
Python can be used to build backend applications
and web APIs.

Several popular frameworks support API development.

Flask:

A lightweight framework that provides flexibility
for building web applications and APIs.

FastAPI:

A modern Python framework designed for building APIs.

It supports type hints, request validation,
and automatic API documentation.

Django:

A comprehensive web framework that includes
features for authentication, database access,
administration, and application development.

Choosing a framework depends on project requirements.

For learning API development, FastAPI is particularly
useful because it provides automatic interactive
API documentation and strong request validation.

A Python backend can communicate with:

- Angular applications.
- Mobile applications.
- Firebase.
- Relational databases.
- AI model providers.
- Other enterprise services.
        `,
        "Which Python framework is specifically designed for modern API development and automatic API documentation?",
        [
          "FastAPI",
          "NumPy",
          "Pandas",
          "Matplotlib"
        ],
        0,
        "FastAPI supports modern API development and generates interactive API documentation."
      ),

      lesson(
        "creating-first-python-api",
        "Creating Your First Python API",
        18,
        `
FastAPI makes it possible to create a small API
with only a few lines of Python.

First, install the dependencies:

pip install fastapi uvicorn

Create a file named main.py.

Example:

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {
        "message": "Welcome to my API"
    }

@app.get("/customers")
def get_customers():
    return {
        "customers": [
            {
                "id": 1,
                "name": "Alex"
            },
            {
                "id": 2,
                "name": "Jordan"
            }
        ]
    }

Start the application:

uvicorn main:app --reload

The API will be available locally.

The root endpoint returns a welcome message.

The /customers endpoint returns customer information.

FastAPI also provides interactive documentation
through its /docs endpoint.

This is a simple introduction to creating
a backend service.
        `,
        "Which command starts the example FastAPI application?",
        [
          "python main.py --api",
          "uvicorn main:app --reload",
          "npm start",
          "firebase deploy"
        ],
        1,
        "Uvicorn runs the FastAPI application using the main module and app object."
      ),

      lesson(
        "api-request-validation",
        "API Request Validation and Data Models",
        18,
        `
APIs must validate incoming information before
processing requests.

For example, a customer registration API may require:

- Customer name.
- Email address.
- Account type.

A request with missing or invalid information
should be rejected.

FastAPI uses Pydantic models for request validation.

Example:

from fastapi import FastAPI
from pydantic import BaseModel, EmailStr

app = FastAPI()

class Customer(BaseModel):
    name: str
    email: EmailStr
    active: bool = True

@app.post("/customers")
def create_customer(customer: Customer):
    return {
        "message": "Customer received",
        "customer": customer
    }

The Customer model defines the expected structure.

FastAPI validates incoming request data
against that model.

Validation helps prevent malformed data
from entering application workflows.

However, validation is not the same as authorization.

An API must also verify that the caller
is permitted to perform the requested operation.
        `,
        "What is the purpose of a Pydantic model in FastAPI?",
        [
          "To validate and define the structure of application data",
          "To replace the HTTP protocol",
          "To automatically create a production database",
          "To encrypt every network connection"
        ],
        0,
        "Pydantic models define expected data structures and validate incoming information."
      ),
    ]
  )
);

// END OF SECTION 1
// ================================================
// MODULE 5 — API REQUESTS AND EXTERNAL INTEGRATIONS
// ================================================

MODULES.push(
  moduleData(
    "api-requests-external-integrations",
    "API Requests and External Integrations",
    [
      lesson(
        "making-api-requests-python",
        "Making API Requests with Python",
        16,
        `
Python applications can communicate with external APIs
using HTTP client libraries.

One commonly used library is Requests.

Install it:

pip install requests

Example:

import requests

response = requests.get(
    "https://jsonplaceholder.typicode.com/users"
)

print(response.status_code)
print(response.json())

The requests.get() function sends an HTTP GET request.

The response object provides access to:

- status_code
- headers
- text
- json()

For POST requests:

response = requests.post(
    "https://api.example.com/customers",
    json={
        "name": "Alex Morgan",
        "email": "alex@example.com"
    }
)

The json parameter automatically serializes
the supplied Python data into JSON.

Production applications should also implement
timeouts, error handling, and appropriate authentication.

Never assume an external API request will always succeed.
        `,
        "Which Python library is commonly used to make HTTP requests?",
        [
          "Requests",
          "Matplotlib",
          "Seaborn",
          "Pillow"
        ],
        0,
        "The Requests library provides convenient methods for sending HTTP requests from Python."
      ),

      lesson(
        "api-headers-query-parameters",
        "API Headers, Query Parameters, and Request Bodies",
        16,
        `
API requests can contain additional information
that controls how a request is processed.

Headers:

Headers provide metadata about an HTTP request.

Examples:

Content-Type: application/json

Accept: application/json

Authorization: Bearer YOUR_TOKEN

Query Parameters:

Query parameters provide additional values
through the URL.

Example:

GET /customers?status=active&limit=10

Here:

status=active filters the results.

limit=10 requests a maximum of ten records.

Request Body:

A request body contains information sent
to the API.

Example JSON body:

{
  "name": "Alex Morgan",
  "email": "alex@example.com"
}

Python example:

import requests

response = requests.get(
    "https://api.example.com/customers",
    params={
        "status": "active",
        "limit": 10
    },
    headers={
        "Accept": "application/json"
    },
    timeout=15
)

Understanding headers, parameters, and request bodies
is essential when integrating enterprise applications.
        `,
        "Which part of an API request commonly contains filtering values such as status=active?",
        [
          "Query parameters",
          "HTTP status code",
          "Response body only",
          "Database index"
        ],
        0,
        "Query parameters pass additional values through the URL, commonly for filtering and pagination."
      ),

      lesson(
        "integrating-external-services",
        "Integrating External Services",
        18,
        `
Enterprise applications frequently communicate
with services operated by other organizations.

Examples include:

- Payment providers.
- Email services.
- Government job databases.
- Identity providers.
- AI model providers.
- Customer relationship management systems.

Consider a job aggregation application.

The application retrieves job listings from an
external government API.

A typical integration workflow is:

1. Authenticate with the external service.
2. Send an API request.
3. Receive the response.
4. Validate the response.
5. Transform the data into the application's model.
6. Store the data in the database.
7. Record integration results.

For example, Zebron can retrieve job listings
from USAJOBS and store normalized job records
in Firebase.

Important integration considerations include:

- API documentation.
- Authentication requirements.
- Rate limits.
- Data formats.
- Pagination.
- Error handling.
- Availability.
- Data freshness.

External integrations should be designed to handle
temporary service interruptions and unexpected responses.
        `,
        "What should an integration generally do after receiving external API data?",
        [
          "Trust and store everything without validation",
          "Validate and transform the response before processing it",
          "Disable authentication",
          "Ignore the API response status"
        ],
        1,
        "External responses should be validated and transformed before they are stored or used."
      ),
    ]
  )
);

// ================================================
// MODULE 6 — AUTHENTICATION AND AUTHORIZATION
// ================================================

MODULES.push(
  moduleData(
    "authentication-authorization",
    "Authentication and Authorization",
    [
      lesson(
        "authentication-fundamentals",
        "Understanding Authentication",
        15,
        `
Authentication verifies the identity of a user,
application, or service.

It answers the question:

Who are you?

Common authentication approaches include:

Username and Password:
A user provides credentials to establish identity.

API Keys:
An application provides a key issued by an API provider.

Bearer Tokens:
A client presents a token when accessing an API.

OAuth 2.0:
An authorization framework commonly used
to grant applications access to resources.

OpenID Connect:
An identity layer built on top of OAuth 2.0.

Multi-Factor Authentication:

Requires more than one authentication factor.

For example:

- Something you know: password.
- Something you have: security key.
- Something you are: biometric characteristic.

Enterprise applications should use appropriate
authentication methods based on their security requirements.

Credentials and tokens must be protected.
They should not be exposed in source code,
browser logs, or public repositories.
        `,
        "What question does authentication answer?",
        [
          "What data should be deleted?",
          "Who are you?",
          "How much storage is available?",
          "Which database is fastest?"
        ],
        1,
        "Authentication verifies the identity of a user, application, or service."
      ),

      lesson(
        "authorization-access-control",
        "Understanding Authorization and Access Control",
        15,
        `
Authorization determines what an authenticated
identity is permitted to do.

It answers the question:

What are you allowed to access?

Examples:

A customer may view their own account.

A support agent may view customer records
but cannot approve financial transactions.

A system administrator may manage users
and application configurations.

Common access control models include:

Role-Based Access Control (RBAC):

Permissions are assigned to roles.

Users receive permissions through their assigned roles.

Attribute-Based Access Control (ABAC):

Access decisions are based on attributes
such as user department, resource classification,
location, or other contextual information.

Least Privilege:

Users and services should receive only
the permissions necessary to perform their responsibilities.

Authentication and authorization are different.

A successful login does not automatically mean
the user can access every resource.
        `,
        "What is the primary purpose of authorization?",
        [
          "To verify a user's identity",
          "To determine what an authenticated identity can access",
          "To encrypt a database backup",
          "To create an API endpoint"
        ],
        1,
        "Authorization determines which operations and resources an authenticated identity may access."
      ),

      lesson(
        "tokens-oauth-jwt",
        "API Tokens, OAuth 2.0, and JWT",
        18,
        `
APIs commonly use tokens to establish and communicate
the authorization context of a request.

Bearer Tokens:

A client sends a token in the Authorization header.

Example:

Authorization: Bearer ACCESS_TOKEN

JSON Web Token (JWT):

A compact token format used to represent claims
between systems.

A JWT commonly contains:

Header:
Describes token metadata and signing algorithm.

Payload:
Contains claims such as subject, issuer,
expiration, and other information.

Signature:
Allows the receiving system to verify
that the token has not been modified.

OAuth 2.0:

An authorization framework that enables applications
to obtain limited access to protected resources.

For example, an application may obtain an access token
to call another service on behalf of a user.

Important security practices:

- Validate token signatures.
- Validate issuer and audience where applicable.
- Check token expiration.
- Use secure transport.
- Protect client credentials.
- Avoid placing sensitive information in JWT payloads.

JWT payloads are encoded, not inherently encrypted.
Do not treat their contents as secret.
        `,
        "Which statement about a typical signed JWT is correct?",
        [
          "Its payload is automatically encrypted",
          "Its signature helps detect unauthorized modification",
          "It never expires",
          "It eliminates the need for authorization checks"
        ],
        1,
        "A JWT signature helps the receiving system verify token integrity and authenticity. It does not automatically encrypt the payload."
      ),
    ]
  )
);

// ================================================
// MODULE 7 — DATABASES AND BACKEND DATA MANAGEMENT
// ================================================

MODULES.push(
  moduleData(
    "databases-backend-data-management",
    "Databases and Backend Data Management",
    [
      lesson(
        "database-fundamentals",
        "Understanding Databases and Data Storage",
        15,
        `
Backend applications need a reliable way to store
and retrieve information.

A database organizes and manages application data.

Relational Databases:

Relational databases organize information
into tables containing rows and columns.

Examples:

- PostgreSQL.
- MySQL.
- Microsoft SQL Server.

NoSQL Databases:

NoSQL databases support different data models,
including documents, key-value pairs, and graphs.

Examples:

- Firebase Firestore.
- MongoDB.
- Redis.

Choosing a database depends on:

- Data structure.
- Query requirements.
- Transaction requirements.
- Scalability.
- Consistency.
- Availability.
- Security.
- Operational complexity.

For example, an application may use PostgreSQL
for structured financial transactions and Firestore
for flexible application data.

Database selection should be driven by architecture
and business requirements rather than popularity alone.
        `,
        "Which database is an example of a relational database?",
        [
          "Firebase Firestore",
          "PostgreSQL",
          "Redis",
          "MongoDB"
        ],
        1,
        "PostgreSQL is a relational database that organizes data using tables and relationships."
      ),

      lesson(
        "backend-database-operations",
        "Backend Database Operations and CRUD",
        16,
        `
Backend applications commonly perform four
fundamental data operations known as CRUD.

Create:

Insert a new record.

Read:

Retrieve existing information.

Update:

Modify an existing record.

Delete:

Remove a record.

Example customer API:

POST /customers

Creates a customer.

GET /customers

Retrieves customers.

GET /customers/123

Retrieves a specific customer.

PATCH /customers/123

Updates part of a customer record.

DELETE /customers/123

Deletes a customer.

The backend should enforce authorization
before performing sensitive database operations.

For example, a customer should not be allowed
to modify another customer's account.

Database operations should also handle errors,
validate input, and maintain data integrity.
        `,
        "What does CRUD stand for?",
        [
          "Create, Read, Update, Delete",
          "Connect, Retrieve, Upload, Deploy",
          "Create, Run, Use, Develop",
          "Configure, Read, Upload, Download"
        ],
        0,
        "CRUD represents Create, Read, Update, and Delete."
      ),

      lesson(
        "database-integrations-transactions",
        "Database Integration, Transactions, and Data Integrity",
        18,
        `
A backend service often coordinates operations
across application logic and a database.

Data integrity means maintaining accurate,
consistent, and reliable information.

Relational databases support transactions
that group multiple operations into a logical unit.

ACID describes four important transaction properties.

Atomicity:
All operations succeed or the transaction is rolled back.

Consistency:
Transactions preserve defined data rules.

Isolation:
Concurrent transactions are managed
to avoid inappropriate interference.

Durability:
Committed changes persist.

For example, a financial transfer may require:

1. Deduct money from one account.
2. Add money to another account.
3. Record the transaction.

If the operation fails halfway through,
the system must avoid leaving inconsistent balances.

Not every database provides identical transaction
capabilities or guarantees.

When designing enterprise systems, understand
the consistency and transaction model of the database
being used.

Also consider idempotency.

An idempotent operation can be repeated
without causing unintended additional effects.

This is particularly important when APIs
are retried after network failures.
        `,
        "Which ACID property ensures that a committed transaction remains persisted?",
        [
          "Atomicity",
          "Consistency",
          "Isolation",
          "Durability"
        ],
        3,
        "Durability ensures that committed transaction changes persist."
      ),
    ]
  )
);

// END OF SECTION 2
// ================================================
// MODULE 8 — API SECURITY AND ERROR HANDLING
// ================================================

MODULES.push(
  moduleData(
    "api-security-error-handling",
    "API Security and Error Handling",
    [
      lesson(
        "api-security-fundamentals",
        "API Security Fundamentals",
        16,
        `
APIs frequently expose business data and application
functionality. They must be protected against
unauthorized access and abuse.

Important API security practices include:

1. Authentication:
Verify the identity of users and services.

2. Authorization:
Ensure callers can access only permitted resources.

3. Input Validation:
Validate incoming data before processing it.

4. Encryption:
Use HTTPS to protect information in transit.

5. Rate Limiting:
Restrict excessive requests from clients.

6. Logging and Monitoring:
Record relevant activity and identify suspicious behavior.

7. Secrets Management:
Store API keys and credentials securely.

Common API security risks include:

- Broken authentication.
- Broken object-level authorization.
- Excessive data exposure.
- Injection attacks.
- Unrestricted resource consumption.
- Security misconfiguration.

Example:

A customer requests:

GET /customers/123

The backend must verify that the authenticated
customer is authorized to access customer 123.

Simply checking that the caller is logged in
is not sufficient.

API security must be considered throughout
the application lifecycle.
        `,
        "Which security practice ensures that users can access only permitted resources?",
        [
          "Authorization",
          "Serialization",
          "Caching",
          "Pagination"
        ],
        0,
        "Authorization determines which resources and operations an authenticated identity can access."
      ),

      lesson(
        "api-error-handling",
        "API Error Handling and Resilience",
        16,
        `
APIs must handle failures predictably.

Failures may occur because of:

- Invalid input.
- Authentication problems.
- Missing resources.
- Database outages.
- Network interruptions.
- External service failures.
- Unexpected application errors.

A well-designed API returns meaningful HTTP status codes
and structured error responses.

Example:

{
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "The requested customer does not exist."
  }
}

Applications should avoid exposing sensitive
technical details in error responses.

For example, do not return database passwords,
internal stack traces, or secret configuration values.

Resilience techniques include:

Timeouts:
Prevent requests from waiting indefinitely.

Retries:
Repeat operations when appropriate.

Exponential Backoff:
Increase the waiting period between retry attempts.

Circuit Breakers:
Temporarily stop calls to an unhealthy service.

Idempotency:
Prevent repeated requests from creating unintended
duplicate operations.

Retries must be designed carefully.

For example, retrying a payment operation without
an idempotency strategy could result in duplicate charges.
        `,
        "What is the purpose of an API timeout?",
        [
          "To prevent requests from waiting indefinitely",
          "To permanently disable an API",
          "To automatically approve transactions",
          "To remove authentication"
        ],
        0,
        "Timeouts limit how long a client waits for a response from a service."
      ),

      lesson(
        "api-rate-limiting-monitoring",
        "Rate Limiting, Logging, and API Monitoring",
        16,
        `
API services need visibility into their performance,
availability, and security.

Rate Limiting:

Controls how many requests a client can make
within a defined period.

Example:

A client may be limited to 100 requests per minute.

Rate limiting helps protect services from excessive
traffic and resource consumption.

Logging:

Records relevant application events.

Examples:

- Request timestamps.
- Endpoint names.
- Response status codes.
- Correlation identifiers.
- Authentication failures.

Sensitive information such as passwords,
access tokens, and payment details should not
be written to logs.

Monitoring:

Tracks service health and performance.

Useful metrics include:

- Request volume.
- Error rate.
- Response time.
- Service availability.
- Database latency.

Distributed tracing helps follow requests
across multiple services.

A correlation ID can help connect related log entries
from different components of an enterprise system.

Monitoring supports troubleshooting, operational
visibility, and incident response.
        `,
        "Which practice helps limit excessive API requests from a client?",
        [
          "Rate limiting",
          "Serialization",
          "Database normalization",
          "Data compression"
        ],
        0,
        "Rate limiting restricts the number of requests a client can make during a defined period."
      ),
    ]
  )
);

// ================================================
// MODULE 9 — WEBHOOKS, EVENTS, AND ASYNCHRONOUS PROCESSING
// ================================================

MODULES.push(
  moduleData(
    "webhooks-events-async-processing",
    "Webhooks, Events, and Asynchronous Processing",
    [
      lesson(
        "understanding-webhooks",
        "Understanding Webhooks",
        15,
        `
A webhook allows one application to notify another
application when a specific event occurs.

Traditional API polling:

Application A repeatedly asks Application B
whether something has changed.

Webhook approach:

Application B sends a notification to Application A
when the event occurs.

Example:

A payment provider processes a transaction.

It sends a webhook to the merchant application
to report that the payment succeeded.

A webhook typically contains:

- Event type.
- Event identifier.
- Event timestamp.
- Relevant event data.

Example payload:

{
  "event": "payment.completed",
  "eventId": "evt-1001",
  "paymentId": "pay-2001",
  "status": "completed"
}

Webhook endpoints must be protected.

Important security practices include:

- Verify webhook signatures.
- Use HTTPS.
- Validate incoming payloads.
- Prevent duplicate processing.
- Record event identifiers.
- Monitor failed deliveries.

A webhook should never be trusted simply
because it reached your endpoint.
        `,
        "What is the primary purpose of a webhook?",
        [
          "To notify another application when an event occurs",
          "To replace every database",
          "To create a user interface",
          "To eliminate authentication"
        ],
        0,
        "Webhooks deliver event notifications from one application to another."
      ),

      lesson(
        "event-driven-architecture",
        "Introduction to Event-Driven Architecture",
        16,
        `
Event-driven architecture organizes application
communication around events.

An event represents something that has happened.

Examples:

- CustomerRegistered.
- PaymentCompleted.
- JobPosted.
- CoursePublished.
- UserAccountSuspended.

Common components include:

Event Producer:
The application that creates an event.

Event Broker:
The system that transports events.

Event Consumer:
The application that receives and processes events.

Example:

An e-commerce application publishes
an OrderCreated event.

Several consumers may respond:

- Inventory service reserves stock.
- Payment service processes payment.
- Notification service sends an email.
- Analytics service records the order.

This architecture helps reduce direct dependencies
between services.

Common messaging technologies include:

- Google Cloud Pub/Sub.
- Apache Kafka.
- RabbitMQ.
- Amazon SQS.

Event-driven systems require careful handling
of duplicate messages, ordering, retries,
and failed processing.
        `,
        "What is the role of an event producer?",
        [
          "To create and publish events",
          "To approve every database transaction",
          "To display the frontend",
          "To replace the event broker"
        ],
        0,
        "An event producer creates and publishes events that other systems can consume."
      ),

      lesson(
        "asynchronous-processing",
        "Asynchronous Processing and Background Jobs",
        16,
        `
Synchronous processing means a client waits
for an operation to complete before receiving
the final response.

Asynchronous processing allows work to continue
independently of the original request.

Consider an application that processes
a large document using an AI model.

Instead of making the user wait for the entire
operation, the backend can:

1. Accept the request.
2. Create a background job.
3. Return a job identifier.
4. Process the document asynchronously.
5. Store the result.
6. Notify the user when processing finishes.

Background processing is useful for:

- AI inference.
- Large file processing.
- Report generation.
- Email delivery.
- Data synchronization.
- Scheduled integrations.

Common technologies include:

- Cloud Functions.
- Cloud Run jobs.
- Task queues.
- Message brokers.
- Background workers.

Asynchronous systems need monitoring,
retry policies, failure handling,
and job status tracking.

The API should provide a way for clients
to retrieve the processing result when needed.
        `,
        "Which situation is especially suitable for asynchronous processing?",
        [
          "A long-running AI document analysis job",
          "Displaying a static navigation menu",
          "Changing a button color",
          "Loading a small local icon"
        ],
        0,
        "Long-running tasks are good candidates for background processing because clients do not need to wait for completion."
      ),
    ]
  )
);

// ================================================
// MODULE 10 — ENTERPRISE INTEGRATION PROJECT
// ================================================

MODULES.push(
  moduleData(
    "enterprise-integration-project",
    "Enterprise Integration Project",
    [
      lesson(
        "designing-enterprise-api",
        "Project: Designing an Enterprise API",
        18,
        `
In this project, you will design an API
for a fictional enterprise application.

Organization:

Zebron Enterprise Solutions.

Business Requirement:

The organization needs an API that allows
authorized applications to retrieve job listings.

The API should support:

GET /api/v1/jobs

Retrieve job listings.

GET /api/v1/jobs/{jobId}

Retrieve a specific job.

POST /api/v1/jobs

Create a job listing for an authorized organization.

PATCH /api/v1/jobs/{jobId}

Update an existing job listing.

DELETE /api/v1/jobs/{jobId}

Remove a job listing when permitted.

Architecture:

Client Application
        |
        v
API Gateway or Backend API
        |
        v
Authentication
        |
        v
Authorization
        |
        v
Business Logic
        |
        v
Database

Design considerations:

- Use versioned API endpoints.
- Validate all incoming data.
- Authenticate API consumers.
- Enforce organization-level access.
- Return consistent response formats.
- Log important operations.
- Protect sensitive information.

The API should enforce tenant boundaries.

An organization should not be able to modify
another organization's job listings.

Document the API operations and their permissions
before implementing them.
        `,
        "Why should the enterprise job API enforce organization-level authorization?",
        [
          "To prevent organizations from accessing or modifying another organization's data",
          "To make every job publicly editable",
          "To eliminate the need for authentication",
          "To avoid creating database records"
        ],
        0,
        "Organization-level authorization protects tenant boundaries and prevents unauthorized cross-organization access."
      ),

      lesson(
        "implementing-integration-workflow",
        "Project: Implementing an Integration Workflow",
        18,
        `
The next project step is to implement an integration
between an external job provider and Zebron.

Integration workflow:

1. Retrieve external job listings.
2. Authenticate with the provider.
3. Validate the API response.
4. Normalize the returned data.
5. Identify duplicate records.
6. Store valid records in Firebase.
7. Record synchronization results.

Example normalized job:

{
  "externalId": "USAJOBS-1001",
  "source": "USAJOBS",
  "title": "Cloud Solutions Architect",
  "organization": "Example Agency",
  "location": "Washington, DC",
  "status": "open"
}

Data normalization ensures that records
from different providers can be represented
consistently.

A synchronization process should also track:

- Last successful synchronization.
- Number of records retrieved.
- Number of records created.
- Number of records updated.
- Number of records skipped.
- Errors encountered.

Use secure backend services to access external APIs.

Do not expose privileged provider credentials
inside Angular browser code.
        `,
        "Where should privileged external API credentials be stored?",
        [
          "Inside a public Angular component",
          "In secure backend configuration or a secrets manager",
          "In a public GitHub repository",
          "Inside an HTML comment"
        ],
        1,
        "Privileged credentials belong in secure backend configuration or a secrets manager, not in public frontend code."
      ),

      lesson(
        "enterprise-integration-capstone",
        "Final Project: Enterprise Integration Architecture",
        20,
        `
Your final project is to design an enterprise
integration architecture.

Scenario:

Zebron provides learning, employment,
and organizational management capabilities.

The platform needs to communicate with:

- External job providers.
- Identity services.
- AI model providers.
- Payment services.
- Notification systems.
- Internal Firebase services.

Your architecture should identify:

1. Frontend Applications:
Angular web applications and user interfaces.

2. API Layer:
REST APIs and integration endpoints.

3. Identity and Security:
Authentication, authorization, and tenant isolation.

4. Business Logic:
Backend services and Cloud Functions.

5. Data Layer:
Firestore and other required data stores.

6. External Integrations:
Third-party APIs and service providers.

7. Event Processing:
Webhooks, queues, and asynchronous workflows.

8. Monitoring:
Logging, metrics, tracing, and alerting.

Your architecture deliverables should include:

- A system context diagram.
- An API inventory.
- An integration flow diagram.
- Authentication and authorization decisions.
- Data ownership definitions.
- Error-handling strategy.
- Security controls.
- Operational monitoring plan.

Explain why you selected each architectural component.

A strong enterprise architect must communicate
not only how a system works, but why the architecture
satisfies business, security, operational,
and scalability requirements.
        `,
        "What should an enterprise integration architecture document explain?",
        [
          "Only the frontend appearance",
          "How components interact and why architectural decisions satisfy requirements",
          "Only the database table names",
          "Only the programming language"
        ],
        1,
        "An architecture document explains component interactions, design decisions, and how the solution meets business and technical requirements."
      ),
    ]
  )
);

// ================================================
// COURSE METADATA
// ================================================

const COURSE = {
  id: COURSE_ID,

  title: "APIs, JSON & Backend Integration",

  subtitle:
    "Building Secure APIs and Connecting Enterprise Systems",

  description: `
Learn how modern applications communicate through APIs,
exchange structured data, and integrate backend services.

This course covers HTTP, REST APIs, JSON, Python API development,
external integrations, authentication, authorization,
database operations, API security, webhooks,
event-driven architecture, and asynchronous processing.

Through practical examples involving Python, Angular,
Firebase, and enterprise applications, learners will
develop the foundational skills required to design
and implement secure application integrations.

The final project introduces enterprise integration
architecture and prepares learners for advanced AI
engineering and enterprise architecture studies.
  `.trim(),

  level: "beginner",
  status: "draft",
  language: "en",

  topic: "APIs and Backend Engineering",
  cover: "teal",

  program: "Enterprise AI & Solutions Architecture",
  programOrder: 4,

  estimatedMinutes: MODULES.reduce(
    (total, currentModule) =>
      total +
      currentModule.lessons.reduce(
        (moduleTotal, currentLesson) =>
          moduleTotal + currentLesson.minutes,
        0
      ),
    0
  ),

  modules: MODULES.map((currentModule, moduleIndex) => ({
    id: currentModule.id,
    title: currentModule.title,
    order: moduleIndex + 1,

    lessons: currentModule.lessons.map(
      (currentLesson, lessonIndex) => ({
        id: currentLesson.id,
        title: currentLesson.title,
        order: lessonIndex + 1,
        duration: currentLesson.minutes,
      })
    ),
  })),

  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
};

// ================================================
// VALIDATION
// ================================================

const allLessons = MODULES.flatMap(
  (currentModule) => currentModule.lessons
);

const totalLessons = allLessons.length;

const totalQuickChecks = allLessons.reduce(
  (total, currentLesson) =>
    total +
    currentLesson.blocks.filter(
      (block) => block.type === "check"
    ).length,
  0
);

const moduleIds = MODULES.map(
  (currentModule) => currentModule.id
);

const lessonIds = allLessons.map(
  (currentLesson) => currentLesson.id
);

if (MODULES.length !== 10) {
  throw new Error(
    `Expected 10 modules, found ${MODULES.length}.`
  );
}

if (totalLessons !== 30) {
  throw new Error(
    `Expected 30 lessons, found ${totalLessons}.`
  );
}

if (totalQuickChecks !== 30) {
  throw new Error(
    `Expected 30 Quick Checks, found ${totalQuickChecks}.`
  );
}

if (new Set(moduleIds).size !== moduleIds.length) {
  throw new Error("Duplicate module IDs detected.");
}

if (new Set(lessonIds).size !== lessonIds.length) {
  throw new Error("Duplicate lesson IDs detected.");
}

for (const currentLesson of allLessons) {
  const quickChecks = currentLesson.blocks.filter(
    (block) => block.type === "check"
  );

  if (quickChecks.length !== 1) {
    throw new Error(
      `Lesson ${currentLesson.id} must contain exactly one Quick Check.`
    );
  }

  for (const currentCheck of quickChecks) {
    if (
      !Array.isArray(currentCheck.options) ||
      currentCheck.answer < 0 ||
      currentCheck.answer >= currentCheck.options.length
    ) {
      throw new Error(
        `Invalid Quick Check in lesson ${currentLesson.id}.`
      );
    }
  }
}

console.log("\nCourse validation successful.");
console.log(`Modules: ${MODULES.length}`);
console.log(`Lessons: ${totalLessons}`);
console.log(`Quick Checks: ${totalQuickChecks}`);
console.log(`Estimated minutes: ${COURSE.estimatedMinutes}`);

// ================================================
// FIRESTORE SEEDING
// ================================================

async function seedCourse() {
  const courseRef = db
    .collection("courses")
    .doc(COURSE_ID);

  const existingCourse = await courseRef.get();

  if (existingCourse.exists && !OVERWRITE) {
    console.log(`\nCourse "${COURSE_ID}" already exists.`);

    console.log(
      "No changes were made. Use --overwrite to replace the seeded course."
    );

    return;
  }

  if (!APPLY) {
    console.log("\nDRY RUN — no Firestore writes performed.");

    console.log("\nCourse details:");

    console.log(
      JSON.stringify(
        {
          id: COURSE.id,
          title: COURSE.title,
          status: COURSE.status,
          language: COURSE.language,
          modules: MODULES.length,
          lessons: totalLessons,
          quickChecks: totalQuickChecks,
          estimatedMinutes: COURSE.estimatedMinutes,
        },
        null,
        2
      )
    );

    console.log("\nTo write this course to Firebase, run:");

    console.log(
      "node scripts/apis-backend/seed-apis-backend-integration.mjs --apply"
    );

    return;
  }

  const batch = db.batch();

  batch.set(courseRef, COURSE);

  for (const currentModule of MODULES) {
    for (const [lessonIndex, currentLesson] of
      currentModule.lessons.entries()) {
      const lessonRef = courseRef
        .collection("lessons")
        .doc(currentLesson.id);

      batch.set(lessonRef, {
        id: currentLesson.id,
        courseId: COURSE_ID,
        moduleId: currentModule.id,
        moduleTitle: currentModule.title,
        title: currentLesson.title,
        order: lessonIndex + 1,
        duration: currentLesson.minutes,
        blocks: currentLesson.blocks,
        status: "draft",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();

  console.log("\nCourse successfully saved to Firestore.");
  console.log(`Course ID: ${COURSE_ID}`);
  console.log(`Modules: ${MODULES.length}`);
  console.log(`Lessons: ${totalLessons}`);
  console.log(`Quick Checks: ${totalQuickChecks}`);
  console.log(`Estimated minutes: ${COURSE.estimatedMinutes}`);
}

// ================================================
// EXECUTE
// ================================================

seedCourse()
  .then(() => {
    console.log("\nSeeding process completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  });

// END OF SECTION 3