/**
 * Zebron Course Seed
 * Course: Python for AI Engineering
 *
 * Usage:
 *   node scripts/seed-python-ai-course.mjs
 *   node scripts/seed-python-ai-course.mjs --apply
 *   node scripts/seed-python-ai-course.mjs --apply --overwrite
 *
 * Dry run is the default.
 * Course is created as DRAFT.
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";
const args = new Set(process.argv.slice(2));

const APPLY = args.has("--apply");
const OVERWRITE = args.has("--overwrite");

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

const text = (value) => ({
  type: "text",
  text: value.trim(),
});

const tip = (value) => ({
  type: "tip",
  text: value.trim(),
});

const check = (question, options, answer, explanation) => ({
  type: "check",
  question,
  options,
  answer,
  explanation,
});

const lesson = (id, title, minutes, content, question, options, answer, explanation) => ({
  id,
  title,
  minutes,
  blocks: [
    text(content),
    check(question, options, answer, explanation),
  ],
});

const MODULES = [
  {
    id: "python-foundations",
    title: "Python Foundations",
    lessons: [
      lesson(
        "python-and-ai",
        "Why Python Is Useful in AI Engineering",
        10,
        `
Python is a general-purpose programming language used in automation,
data processing, APIs, machine learning, and artificial intelligence.

AI engineers use Python to prepare data, connect applications to AI
models, validate model responses, and build intelligent applications.

Example:

\`\`\`python
print("Hello, AI Engineering!")
print(2 + 3)
\`\`\`

Python is popular because its syntax is readable and its ecosystem
includes libraries for data science, machine learning, and AI.

An AI application usually involves more than a model. It also requires
data preparation, application logic, API integration, validation,
security, and testing.
        `,
        "What is Python commonly used for in AI engineering?",
        [
          "Only designing website colors",
          "Preparing data, calling APIs, and building AI applications",
          "Replacing every database automatically",
        ],
        1,
        "Python supports data preparation, model integration, and AI application development."
      ),

      lesson(
        "run-python",
        "Running Python Programs",
        9,
        `
Python programs are commonly saved in files ending with .py.

Example file: hello.py

\`\`\`python
name = "Alex"
print(f"Welcome, {name}!")
\`\`\`

Run the file from your terminal:

\`\`\`bash
python hello.py
\`\`\`

An editor helps you write code, while the terminal executes it.

A virtual environment isolates project dependencies so different
Python projects can use different package versions.
        `,
        "What does a virtual environment help you do?",
        [
          "Keep project dependencies isolated",
          "Guarantee that code has no errors",
          "Convert Python into JavaScript",
        ],
        0,
        "Virtual environments isolate dependencies for individual projects."
      ),

      lesson(
        "read-python-code",
        "Reading Python Syntax and Errors",
        8,
        `
Python executes statements from top to bottom.

Example:

\`\`\`python
message = "  hello  "
clean_message = message.strip()
print(clean_message.upper())
\`\`\`

The strip() method removes surrounding whitespace.
The upper() method returns an uppercase string.

A syntax error means Python cannot understand the program structure.
A runtime error happens while the program is executing.

When debugging, read the traceback and inspect the indicated line.
        `,
        "What does upper() do?",
        [
          "Deletes a string",
          "Returns an uppercase version of a string",
          "Converts a string into a number",
        ],
        1,
        "upper() returns a new string containing uppercase characters."
      ),
    ],
  },

  {
    id: "variables-and-types",
    title: "Variables and Data Types",
    lessons: [
      lesson(
        "variables",
        "Variables and Naming",
        9,
        `
A variable is a name that refers to a value.

\`\`\`python
learner_name = "Jordan"
completed_lessons = 3
study_hours = 1.5
is_enrolled = True
\`\`\`

Use descriptive variable names.

Python conventionally uses snake_case for variables and functions.
Variable names are case-sensitive.
        `,
        "Which is a conventional Python variable name?",
        ["s", "LearnerScore", "learner_score"],
        2,
        "Python commonly uses snake_case."
      ),

      lesson(
        "basic-types",
        "Numbers, Strings, and Booleans",
        10,
        `
Python includes several built-in types:

int: whole numbers
float: decimal numbers
str: text
bool: True or False

Example:

\`\`\`python
age = 25
price = 19.99
name = "Jordan"
is_active = True

print(type(age))
\`\`\`

You can convert values using int(), float(), and str().
        `,
        "What is the type of int('12')?",
        ["str", "int", "bool"],
        1,
        "int() converts the string '12' into the integer 12."
      ),

      lesson(
        "operators-and-conversion",
        "Operators and Type Conversion",
        9,
        `
Python supports arithmetic operators:

+ addition
- subtraction
* multiplication
/ division
// floor division
% remainder
** exponentiation

Comparison operators include ==, !=, <, >, <=, and >=.

Example:

\`\`\`python
completed = 7
total = 10

percentage = completed / total * 100

print(f"{percentage:.0f}% complete")
\`\`\`

Use == to compare values and = to assign values.
        `,
        "Which operator compares two values for equality?",
        ["=", "==", "%"],
        1,
        "The == operator compares values."
      ),
    ],
  },

  {
    id: "collections",
    title: "Lists and Dictionaries",
    lessons: [
      lesson(
        "lists",
        "Working with Lists",
        10,
        `
A list stores an ordered collection of values.

\`\`\`python
topics = ["Python", "JSON", "APIs"]

topics.append("AI")

print(topics[0])
print(len(topics))
\`\`\`

Python list indexes begin at zero.

Lists are mutable, meaning their contents can be changed.
        `,
        "What is the index of the first list item?",
        ["0", "1", "-1"],
        0,
        "Python uses zero-based indexing."
      ),

      lesson(
        "dictionaries",
        "Working with Dictionaries",
        11,
        `
A dictionary stores key-value pairs.

\`\`\`python
learner = {
    "name": "Jordan",
    "email": "jordan@example.com",
    "active": True
}

print(learner["name"])
\`\`\`

You can update dictionary values:

\`\`\`python
learner["active"] = False
\`\`\`

Use get() when a key might not exist:

\`\`\`python
email = learner.get("email", "not provided")
\`\`\`
        `,
        "What does get() do when a key is missing?",
        [
          "Always crashes",
          "Returns the provided default value",
          "Deletes the dictionary",
        ],
        1,
        "get() can return a fallback value when a key is absent."
      ),

      lesson(
        "nested-data",
        "Nested Data Structures",
        10,
        `
Lists and dictionaries can be combined.

\`\`\`python
course = {
    "title": "Python for AI",
    "lessons": [
        {"title": "Variables", "minutes": 9},
        {"title": "Dictionaries", "minutes": 11}
    ]
}

print(course["lessons"][0]["title"])
\`\`\`

Nested structures are common when processing API responses,
JSON documents, and application records.

Choose lists for ordered collections and dictionaries for
records containing named fields.
        `,
        "Which structure is useful for storing named fields?",
        ["Dictionary", "Boolean", "Integer"],
        0,
        "Dictionaries organize information using key-value pairs."
      ),
    ],
  },

  {
    id: "control-flow",
    title: "Conditions and Loops",
    lessons: [
      lesson(
        "if-statements",
        "Conditional Statements",
        10,
        `
Conditional statements allow programs to make decisions.

\`\`\`python
score = 85

if score >= 90:
    print("Excellent")
elif score >= 70:
    print("Good")
else:
    print("Needs improvement")
\`\`\`

Python uses indentation to define code blocks.

Conditions evaluate to True or False.
        `,
        "Which keyword handles an alternative condition?",
        ["elif", "repeat", "function"],
        0,
        "elif allows additional conditional branches."
      ),

      lesson(
        "for-loops",
        "For Loops",
        10,
        `
A for loop processes items in a collection.

\`\`\`python
learners = ["Alex", "Jordan", "Sam"]

for learner in learners:
    print(learner)
\`\`\`

The loop runs once for each item.

You can also use range():

\`\`\`python
for number in range(5):
    print(number)
\`\`\`
        `,
        "How many times does range(5) iterate?",
        ["4", "5", "6"],
        1,
        "range(5) generates five values: 0 through 4."
      ),

      lesson(
        "while-loops",
        "While Loops and Loop Control",
        9,
        `
A while loop continues while its condition is true.

\`\`\`python
count = 0

while count < 3:
    print(count)
    count += 1
\`\`\`

Use break to exit a loop.
Use continue to skip to the next iteration.

Be careful to avoid infinite loops.
        `,
        "What does break do?",
        [
          "Exits the loop",
          "Restarts the computer",
          "Creates a function",
        ],
        0,
        "break immediately exits the current loop."
      ),
    ],
  },

  {
    id: "functions",
    title: "Python Functions",
    lessons: [
      lesson(
        "defining-functions",
        "Defining and Calling Functions",
        10,
        `
Functions organize reusable code.

\`\`\`python
def greet(name):
    print(f"Hello, {name}!")

greet("Jordan")
\`\`\`

The def keyword defines a function.
The function name is greet.
The parameter is name.
The argument supplied is Jordan.
        `,
        "Which keyword defines a Python function?",
        ["class", "def", "return"],
        1,
        "The def keyword defines a function."
      ),

      lesson(
        "function-parameters",
        "Parameters and Arguments",
        11,
        `
Parameters allow functions to receive information.

\`\`\`python
def calculate_total(price, quantity):
    return price * quantity

total = calculate_total(10, 3)
print(total)
\`\`\`

Default parameters provide fallback values.

\`\`\`python
def greet(name="Guest"):
    return f"Hello, {name}"
\`\`\`

Keyword arguments make function calls easier to read.
        `,
        "What is an argument?",
        [
          "A value passed into a function",
          "The name of a Python file",
          "A database table",
        ],
        0,
        "An argument is the actual value supplied when calling a function."
      ),

      lesson(
        "return-and-scope",
        "Return Values and Scope",
        10,
        `
The return statement sends a result back to the caller.

\`\`\`python
def calculate_average(total, count):
    if count == 0:
        return 0

    return total / count

average = calculate_average(100, 4)
\`\`\`

Variables created inside functions are generally local to those
functions.

Use return when another part of the program needs the result.
Use print() when you only want to display information.
        `,
        "What does return do?",
        [
          "Sends a result back to the caller",
          "Always prints a result",
          "Deletes a variable",
        ],
        0,
        "return provides a value to the code that called the function."
      ),
    ],
  },

  {
    id: "files-and-errors",
    title: "Files and Error Handling",
    lessons: [
      lesson(
        "file-handling",
        "Reading and Writing Files",
        10,
        `
Python can read and write files.

\`\`\`python
with open("notes.txt", "w") as file:
    file.write("Learning Python")
\`\`\`

Read a file:

\`\`\`python
with open("notes.txt", "r") as file:
    content = file.read()

print(content)
\`\`\`

The with statement manages the file resource and closes it
when the block finishes.
        `,
        "Why is with open() useful?",
        [
          "It automatically manages file closing",
          "It deletes the file",
          "It converts files into databases",
        ],
        0,
        "The with statement handles resource cleanup."
      ),

      lesson(
        "exceptions",
        "Understanding Exceptions",
        10,
        `
Exceptions represent errors that occur while a program runs.

\`\`\`python
try:
    number = int("abc")
except ValueError:
    print("Please provide a valid number.")
\`\`\`

Use try and except to handle expected failures.

Avoid hiding every error with a broad except block.
Handle errors intentionally and provide useful messages.
        `,
        "Which exception can int('abc') raise?",
        ["ValueError", "IndexError", "KeyError"],
        0,
        "Invalid integer conversion raises ValueError."
      ),

      lesson(
        "validation",
        "Input Validation and Reliable Programs",
        10,
        `
Validate input before using it.

\`\`\`python
def calculate_percentage(completed, total):
    if total <= 0:
        raise ValueError("Total must be greater than zero")

    if completed < 0 or completed > total:
        raise ValueError("Invalid completion count")

    return completed / total * 100
\`\`\`

Validation protects applications from invalid or unexpected data.

Never assume that information received from users or external
systems is automatically correct.
        `,
        "Why validate input?",
        [
          "To prevent invalid data from causing incorrect behavior",
          "To make programs longer",
          "To avoid using functions",
        ],
        0,
        "Validation checks that data meets expected requirements."
      ),
    ],
  },

  {
    id: "json-data",
    title: "Working with JSON",
    lessons: [
      lesson(
        "json-introduction",
        "Understanding JSON",
        9,
        `
JSON stands for JavaScript Object Notation.

It is a common format for exchanging structured data between
applications and APIs.

Example:

\`\`\`json
{
  "name": "Jordan",
  "active": true,
  "completedLessons": 5
}
\`\`\`

JSON supports strings, numbers, Booleans, arrays, objects, and null.
        `,
        "What is JSON commonly used for?",
        [
          "Exchanging structured data",
          "Styling websites",
          "Compiling Python",
        ],
        0,
        "JSON is commonly used for exchanging data between systems."
      ),

      lesson(
        "json-python",
        "Converting JSON and Python Data",
        10,
        `
Python's json module converts between Python objects and JSON.

\`\`\`python
import json

learner = {
    "name": "Jordan",
    "active": True
}

json_text = json.dumps(learner)

print(json_text)
\`\`\`

Use json.dumps() to produce JSON text.
Use json.loads() to parse JSON text.
        `,
        "What does json.loads() do?",
        [
          "Parses JSON text into Python data",
          "Deletes JSON files",
          "Creates a Python class",
        ],
        0,
        "loads() parses JSON text into Python objects."
      ),

      lesson(
        "json-files",
        "Reading and Writing JSON Files",
        10,
        `
Use json.dump() and json.load() with files.

\`\`\`python
import json

data = {"course": "Python", "active": True}

with open("course.json", "w") as file:
    json.dump(data, file, indent=4)

with open("course.json", "r") as file:
    loaded_data = json.load(file)
\`\`\`

Validate loaded data before using it in application logic.
        `,
        "Which method reads JSON directly from a file?",
        ["json.load()", "json.dumps()", "json.loads()"],
        0,
        "json.load() reads and parses JSON from a file object."
      ),
    ],
  },

  {
    id: "rest-apis",
    title: "REST APIs and Python",
    lessons: [
      lesson(
        "api-concepts",
        "Understanding REST APIs",
        10,
        `
An API allows applications to communicate.

REST APIs commonly use HTTP methods:

GET retrieves information.
POST creates information.
PUT or PATCH updates information.
DELETE removes information.

An API endpoint is a URL that exposes a resource or operation.

HTTP responses include status codes such as 200, 201, 400, 401,
403, 404, and 500.
        `,
        "Which HTTP method commonly retrieves information?",
        ["GET", "DELETE", "PATCH"],
        0,
        "GET is commonly used to retrieve resources."
      ),

      lesson(
        "python-requests",
        "Calling APIs with Python",
        12,
        `
The requests package is commonly used for HTTP communication.

Install it:

\`\`\`bash
pip install requests
\`\`\`

Example:

\`\`\`python
import requests

response = requests.get(
    "https://api.github.com",
    timeout=10
)

print(response.status_code)
print(response.json())
\`\`\`

Always use reasonable timeouts and handle network failures.
        `,
        "What does response.json() do?",
        [
          "Parses a JSON response",
          "Deletes the API",
          "Installs Python",
        ],
        0,
        "response.json() parses a JSON response body."
      ),

      lesson(
        "api-security",
        "API Reliability and Security",
        12,
        `
Production API integrations need security and reliability.

Important practices:

- Protect API keys and secrets.
- Never commit credentials to source control.
- Use environment variables or a secret manager.
- Set request timeouts.
- Handle HTTP errors.
- Validate response data.
- Apply retry policies carefully.

Authentication proves identity.
Authorization determines what an identity is allowed to do.
        `,
        "Where should API secrets be stored?",
        [
          "In publicly committed source code",
          "In a secure secret manager",
          "In a public README file",
        ],
        1,
        "Credentials should be stored securely, not exposed in source code."
      ),
    ],
  },

  {
    id: "oop-and-testing",
    title: "Object-Oriented Programming and Testing",
    lessons: [
      lesson(
        "classes-objects",
        "Classes and Objects",
        12,
        `
A class defines a structure and behavior.
An object is an instance of a class.

\`\`\`python
class Student:
    def __init__(self, name, email):
        self.name = name
        self.email = email

    def introduce(self):
        return f"My name is {self.name}"

student = Student("Jordan", "jordan@example.com")

print(student.introduce())
\`\`\`

__init__ initializes a new object.
self refers to the current instance.
        `,
        "What is an object?",
        [
          "An instance of a class",
          "A Python keyword",
          "A database connection",
        ],
        0,
        "An object is an instance created from a class."
      ),

      lesson(
        "inheritance-encapsulation",
        "Inheritance and Encapsulation",
        12,
        `
Inheritance allows one class to reuse behavior from another class.

\`\`\`python
class User:
    def __init__(self, name):
        self.name = name

class Student(User):
    def enroll(self):
        return f"{self.name} is enrolled"

student = Student("Jordan")
print(student.enroll())
\`\`\`

Encapsulation groups data and behavior together.

A leading underscore, such as _progress, indicates that an
attribute is intended for internal use by convention.

Use methods to control changes to important values.
        `,
        "What is inheritance?",
        [
          "A way for a class to reuse another class's behavior",
          "A method for deleting objects",
          "A database query",
        ],
        0,
        "Inheritance allows child classes to reuse parent class behavior."
      ),

      lesson(
        "modules-testing",
        "Modules and Unit Testing",
        12,
        `
Modules organize Python code into reusable files.

For example:

\`\`\`text
project/
    main.py
    calculations.py
\`\`\`

You can import functions from another module.

Unit tests check whether individual pieces of code behave correctly.

Example using unittest:

\`\`\`python
import unittest

def add(a, b):
    return a + b

class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)

if __name__ == "__main__":
    unittest.main()
\`\`\`
        `,
        "What is the purpose of a unit test?",
        [
          "To verify a specific piece of code behaves correctly",
          "To deploy an application",
          "To create a database",
        ],
        0,
        "Unit tests verify individual units of application behavior."
      ),
    ],
  },

  {
    id: "ai-engineering-project",
    title: "Practical AI Engineering Project",
    lessons: [
      lesson(
        "student-progress-analyzer",
        "Build a Student Progress Analyzer",
        15,
        `
Build a small program that analyzes learner progress.

\`\`\`python
learners = [
    {"name": "Ari", "completed": 4, "total": 5},
    {"name": "Mina", "completed": 8, "total": 8},
    {"name": "Noah", "completed": 1, "total": 4}
]

for learner in learners:
    percentage = (
        learner["completed"] / learner["total"]
    ) * 100

    print(
        f"{learner['name']}: {percentage:.1f}%"
    )
\`\`\`

Extend the project by creating functions, validating records,
and calculating average learner progress.

Handle invalid records rather than silently producing incorrect
results.
        `,
        "What should happen when total lessons equals zero?",
        [
          "Divide by zero",
          "Handle the invalid record",
          "Assume 100% completion",
        ],
        1,
        "A zero denominator must be handled explicitly."
      ),

      lesson(
        "make-project-reliable",
        "Improve the Analyzer with JSON and Tests",
        15,
        `
Extend the analyzer by loading learner records from a JSON file.

Suggested structure:

\`\`\`text
progress_analyzer/
    main.py
    progress.py
    test_progress.py
    learners.json
\`\`\`

Separate data loading, validation, calculation, and output.

Write tests for normal and boundary cases.
Handle missing files and invalid JSON.

Use fictional learner information in practice projects.
        `,
        "Why separate data loading from calculation?",
        [
          "To test calculations independently",
          "To remove the need for validation",
          "To make JSON executable",
        ],
        0,
        "Separating responsibilities makes code easier to test and maintain."
      ),

      lesson(
        "ai-engineering-next-steps",
        "Where Python Fits in an AI Application",
        12,
        `
A typical AI application may follow this process:

1. Receive a user request.
2. Validate the input.
3. Check authorization.
4. Retrieve relevant data.
5. Call an AI model through an approved API.
6. Validate the model response.
7. Return the result.
8. Record appropriate operational events.

Python can support API integration, data preparation,
application workflows, and model evaluation.

AI output can be incorrect or incomplete. Validate important
results and use human approval for consequential decisions.
        `,
        "What should happen before an AI result triggers an important action?",
        [
          "Accept the output without checking",
          "Validate the output and use appropriate human oversight",
          "Delete all application logs",
        ],
        1,
        "AI-generated results should be validated, especially for consequential actions."
      ),
    ],
  },

  {
    id: "review-and-next-steps",
    title: "Review and Next Steps",
    lessons: [
      lesson(
        "python-foundations-review",
        "Python Foundations Review",
        10,
        `
Review the main Python concepts:

- Variables and data types
- Lists and dictionaries
- Conditional statements
- Loops
- Functions and return values
- Files and exceptions
- JSON
- REST APIs
- Classes and objects
- Modules and testing

Practice writing small programs without copying examples.
Make sure you understand why each statement works.
        `,
        "Which collection is useful for a record with named fields?",
        ["Dictionary", "Range", "Boolean"],
        0,
        "Dictionaries store named key-value pairs."
      ),

      lesson(
        "prepare-for-next-course",
        "Preparing for Advanced AI Engineering",
        8,
        `
Before moving forward, make sure you can:

1. Create and run Python files.
2. Work with lists and dictionaries.
3. Write conditions and loops.
4. Create reusable functions.
5. Read and write JSON.
6. Call HTTP APIs.
7. Validate input and handle errors.
8. Create classes and objects.
9. Write unit tests.

Your next learning stage can cover:

- AI model APIs
- Prompt engineering
- Embeddings
- Retrieval-Augmented Generation (RAG)
- AI evaluation
- Secure AI application design

Keep your progress analyzer as a portfolio project.
        `,
        "Which skills provide a useful foundation for AI engineering?",
        [
          "Functions, JSON, APIs, validation, and testing",
          "Only memorizing syntax",
          "Only changing editor themes",
        ],
        0,
        "These skills are commonly used when building reliable AI applications."
      ),
    ],
  },
];

const COURSE = {
  id: "python-for-ai-engineering",
  title: "Python for AI Engineering",
  summary:
    "Learn practical Python foundations for building, integrating, and testing AI-enabled applications.",
  description: `
A practical beginner course covering Python fundamentals,
structured data, files, APIs, object-oriented programming,
testing, and a hands-on student progress analyzer project.

The course prepares learners to move into advanced AI engineering.
  `.trim(),
  topic: "Artificial Intelligence",
  program: "Enterprise AI & Solutions Architecture",
  programOrder: 1,
  level: "beginner",
  cover: "teal",
  outcomes: [
    "Write and run Python programs",
    "Work with variables and data structures",
    "Use conditions, loops, and functions",
    "Read and write JSON data",
    "Handle files and exceptions",
    "Call REST APIs",
    "Understand object-oriented programming",
    "Write unit tests",
    "Build a student progress analyzer",
    "Understand Python's role in AI applications",
  ],
  skills: [
    "Python programming",
    "Data structures",
    "JSON",
    "REST APIs",
    "Input validation",
    "Error handling",
    "Object-oriented programming",
    "Unit testing",
    "AI application foundations",
  ],
};

async function seedCourse() {
  const courseRef = db.collection("courses").doc(COURSE.id);
  const existing = await courseRef.get();

  if (existing.exists && !OVERWRITE) {
    console.log(
      `SKIPPED: ${COURSE.id} already exists. Use --overwrite to replace it.`
    );
    return;
  }

  let order = 0;
  const lessonDocs = [];

  const modules = MODULES.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((item) => {
      order++;

      lessonDocs.push({
        ...item,
        moduleId: module.id,
        order,
      });

      return {
        id: item.id,
        title: item.title,
        minutes: item.minutes,
        hasCheck: item.blocks.some((block) => block.type === "check"),
      };
    }),
  }));

  const estimatedMinutes = lessonDocs.reduce(
    (total, item) => total + item.minutes,
    0
  );

  const checkCount = lessonDocs.reduce(
    (total, item) =>
      total + item.blocks.filter((block) => block.type === "check").length,
    0
  );

  console.log("------------------------------------");
  console.log("ZEBRON PYTHON AI COURSE SEED");
  console.log("------------------------------------");
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Course: ${COURSE.id}`);
  console.log(`Modules: ${modules.length}`);
  console.log(`Lessons: ${lessonDocs.length}`);
  console.log(`Quick Checks: ${checkCount}`);
  console.log(`Estimated minutes: ${estimatedMinutes}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`Overwrite: ${OVERWRITE}`);
  console.log("------------------------------------");

  if (!APPLY) {
    console.log("Dry run complete. No Firebase data was changed.");
    return;
  }

  const batch = db.batch();

  const { id: courseId, ...courseFields } = COURSE;

  batch.set(courseRef, {
    ...courseFields,
    modules,
    lessonCount: lessonDocs.length,
    estimatedMinutes,
    finalExam: null,
    status: "draft",
    providerName: "Zebron",
    authorName: "Zebron",
    organizationId: null,
    createdAt: existing.exists
      ? existing.get("createdAt") ?? FieldValue.serverTimestamp()
      : FieldValue.serverTimestamp(),
    publishedAt: null,
    updatedAt: FieldValue.serverTimestamp(),
    review: null,
  });

  const keep = new Set(lessonDocs.map((item) => item.id));

  const currentLessons = await courseRef.collection("lessons").get();

  currentLessons.docs
    .filter((document) => !keep.has(document.id))
    .forEach((document) => batch.delete(document.ref));

  for (const item of lessonDocs) {
    batch.set(
      courseRef.collection("lessons").doc(item.id),
      {
        title: item.title,
        moduleId: item.moduleId,
        order: item.order,
        minutes: item.minutes,
        blocks: item.blocks,
        updatedAt: FieldValue.serverTimestamp(),
      }
    );
  }

  await batch.commit();

  console.log("------------------------------------");
  console.log("COURSE SUCCESSFULLY SEEDED");
  console.log(`Course ID: ${COURSE.id}`);
  console.log("Status: draft");
  console.log("------------------------------------");
}

seedCourse().catch((error) => {
  console.error("Course seed failed:", error);
  process.exitCode = 1;
});