/**
 * Python for AI Engineering
 * Program: Enterprise AI & Solutions Architecture, step 1
 *
 * Dry run (checks the content, writes nothing):
 *   node scripts/Python-ai-course/seed-python-ai-course.mjs
 * Create the course:
 *   node scripts/Python-ai-course/seed-python-ai-course.mjs --apply
 * Update an existing course (keeps its status, publish date and final exam):
 *   node scripts/Python-ai-course/seed-python-ai-course.mjs --apply --overwrite
 *
 * Lesson text uses the light Markdown lessons support: # / ## / ### headings,
 * - and 1. lists, **bold**, *italic*, `code`, ``` code blocks, > quotes and
 * | tables |. Each text block is one section in the lesson player; its first
 * heading is the section title.
 */

import { runCourseSeed } from '../lib/write-zebron-course.mjs';

const COURSE = {
  id: "python-for-ai-engineering",
  title: "Python for AI Engineering",
  summary: "Learn practical Python foundations for building, integrating, and testing AI-enabled applications.",
  description: "A practical beginner course covering Python fundamentals, structured data, files, APIs, object-oriented programming, testing, and a hands-on student progress analyzer project.\n\nThe course prepares learners to move into advanced AI engineering.",
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

const MODULES = [
  {
    id: "python-foundations",
    title: "Python Foundations",
    lessons: [
      {
        id: "python-and-ai",
        title: "Why Python Is Useful in AI Engineering",
        minutes: 6,
        blocks: [
          {
            type: 'video',
            url: "https://firebasestorage.googleapis.com/v0/b/zebron-2b49f.firebasestorage.app/o/course-videos%2Fpython-for-ai-engineering-overview.mp4?alt=media&token=575df200-a14f-4869-8776-cf9acf1c4962",
            caption: "Course overview: what you will learn, the modules and the skills you will build (about 50 seconds, no sound).",
          },
          {
            type: 'text',
            text: `# Why Python Is Useful in AI Engineering

Python is the most widely used language for building AI applications. It is not the fastest language, but it is easy to read, quick to write, and has the largest collection of libraries for data, machine learning, and calling AI services.

## Where Python shows up in AI work

- **Data preparation:** loading, cleaning, and reshaping data before it is used by a model.
- **Model development:** libraries such as scikit-learn, PyTorch, and TensorFlow are written for Python.
- **Calling AI services:** the official SDKs for most model providers are available in Python.
- **Backend services:** web frameworks such as FastAPI and Flask expose AI features through APIs.
- **Automation and testing:** scripts that run evaluations, process files, or check results.

## Why it works well for beginners

Python code reads close to plain English:

\`\`\`python
completed_lessons = 7
total_lessons = 10

if completed_lessons == total_lessons:
    print("Course complete")
else:
    print(f"{total_lessons - completed_lessons} lessons left")
\`\`\`

Indentation (the spaces at the start of a line) shows which lines belong together, so there are no curly braces to keep track of.

## What you will build in this course

You will learn the Python you need before working with AI services: variables and data types, lists and dictionaries, conditions and loops, functions, files, JSON, REST APIs, classes, and tests. The course ends with a small project, a student progress analyzer, that brings these pieces together.

## Key points

- Python is the standard language for data and AI work.
- Its readable syntax lets you focus on the problem rather than the language.
- Most AI tools you will use later expect you to be comfortable with Python.`,
          },
          {
            type: 'check',
            question: "Why is Python so widely used in AI engineering?",
            options: [
              "It has readable syntax and the largest ecosystem of data and AI libraries",
              "It is the only language that model providers offer SDKs for",
              "It is the fastest programming language for every kind of workload",
              "It compiles directly to GPU instructions without other tools",
            ],
            answer: 0,
            explanation: "Python's readability and its libraries for data, machine learning, and AI services make it the default choice, even though other languages can be faster.",
          },
        ],
      },
      {
        id: "run-python",
        title: "Running Python Programs",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Running Python Programs

Before you can write Python, you need a way to run it. There are three common ways, and you will use all of them.

## 1. A script file

Most programs live in files that end in \`.py\`. Create a file called \`hello.py\`:

\`\`\`python
name = "Jordan"
print(f"Hello, {name}! Welcome to Python.")
\`\`\`

Run it from a terminal in the same folder:

\`\`\`bash
python hello.py
\`\`\`

On some systems the command is \`python3\` instead of \`python\`. Check which version you have with \`python --version\`; this course uses Python 3.10 or later.

## 2. The interactive shell

Typing \`python\` on its own opens the interactive shell, shown by the \`>>>\` prompt. Each line runs as soon as you press Enter, which is useful for trying small ideas:

\`\`\`text
>>> 2 + 3
5
>>> "ai".upper()
'AI'
\`\`\`

Type \`exit()\` to leave.

## 3. Notebooks

Jupyter notebooks mix code, results, and notes in one document. They are popular for data exploration and experiments, but production code usually moves into \`.py\` files.

## Virtual environments

Each project should have its own virtual environment so that the packages it installs don't conflict with other projects:

\`\`\`bash
python -m venv .venv
source .venv/bin/activate      # macOS and Linux
.venv\\Scripts\\activate         # Windows
pip install requests
\`\`\`

## Key points

- Save programs in \`.py\` files and run them with \`python file.py\`.
- Use the interactive shell to experiment.
- Create a virtual environment for each project before installing packages.`,
          },
          {
            type: 'check',
            question: "What is the main reason to create a virtual environment for each project?",
            options: [
              "To convert Python scripts into notebooks automatically",
              "To keep each project's installed packages separate from other projects",
              "To allow Python files to run without a terminal",
              "To make Python programs run faster on the same computer",
            ],
            answer: 1,
            explanation: "A virtual environment isolates a project's packages, so different projects can use different versions without conflicts.",
          },
        ],
      },
      {
        id: "read-python-code",
        title: "Reading Python Syntax and Errors",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Reading Python Syntax and Errors

Reading code and error messages is as important as writing code. Python's rules are few, but they are strict.

## Indentation matters

Python uses indentation to group lines into blocks. Every line in a block must be indented by the same amount, usually four spaces:

\`\`\`python
score = 82

if score >= 70:
    print("Passed")
    print("Certificate issued")
print("Done")
\`\`\`

The two indented lines run only when the condition is true. \`print("Done")\` always runs.

## Comments

A \`#\` starts a comment. Python ignores it, but people reading your code don't:

\`\`\`python
# Convert the score to a percentage
percentage = score / 100 * 100
\`\`\`

## Reading an error message

When something goes wrong, Python prints a **traceback**. Read it from the bottom up:

\`\`\`text
Traceback (most recent call last):
  File "report.py", line 4, in <module>
    print(total / count)
ZeroDivisionError: division by zero
\`\`\`

- The **last line** names the error type and gives a short description.
- The lines above show **where** it happened: the file and line number.

## Common errors

| Error | Usual cause |
| --- | --- |
| \`SyntaxError\` | Missing colon, bracket, or quote |
| \`IndentationError\` | Lines in a block are not lined up |
| \`NameError\` | A variable is used before it is defined, or misspelled |
| \`TypeError\` | An operation uses the wrong type, such as adding text to a number |
| \`KeyError\` | A dictionary key does not exist |

## Key points

- Indentation defines which lines belong to a block.
- Read tracebacks from the bottom: error type first, then the line that caused it.
- Most beginner errors are typos, missing colons, or misaligned indentation.`,
          },
          {
            type: 'check',
            question: "When reading a Python traceback, where do you find the type of error?",
            options: [
              "In the name of the file that failed",
              "On the first line of the traceback",
              "On the last line of the traceback",
              "In the comment above the failing line",
            ],
            answer: 2,
            explanation: "The final line names the error type, such as ZeroDivisionError, and describes it; the lines above show where it happened.",
          },
        ],
      },
    ],
  },
  {
    id: "variables-and-types",
    title: "Variables and Data Types",
    lessons: [
      {
        id: "variables",
        title: "Variables and Naming",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Variables and Naming

A variable is a name that refers to a value. You create one by assigning a value with \`=\`:

\`\`\`python
learner_name = "Jordan"
completed_lessons = 3
study_hours = 1.5
is_enrolled = True
\`\`\`

Python works out the type from the value, so you don't declare types in advance. You can also reassign a variable later:

\`\`\`python
completed_lessons = completed_lessons + 1   # now 4
\`\`\`

## Naming rules

- Names can contain letters, digits, and underscores, but cannot start with a digit.
- Names are case-sensitive: \`score\` and \`Score\` are different variables.
- You cannot use Python keywords such as \`if\`, \`for\`, or \`class\` as names.

## Naming conventions

Python code uses **snake_case** for variables and functions: lowercase words joined by underscores. Good names describe what the value means:

| Unclear | Clear |
| --- | --- |
| \`x\` | \`completed_lessons\` |
| \`d\` | \`due_date\` |
| \`tmp2\` | \`average_score\` |

Constants, values that should not change, are written in capitals by convention:

\`\`\`python
PASSING_SCORE = 70
\`\`\`

## Several values at once

\`\`\`python
first_name, last_name = "Jordan", "Lee"
\`\`\`

## Key points

- \`=\` assigns a value to a name; Python infers the type.
- Use descriptive snake_case names.
- Write constants in UPPER_CASE so readers know not to change them.`,
          },
          {
            type: 'check',
            question: "Which name follows Python's naming conventions for a variable?",
            options: [
              "LearnerScore",
              "learnerScore",
              "LEARNER-SCORE",
              "learner_score",
            ],
            answer: 3,
            explanation: "Python variables use snake_case. CamelCase is used for class names, and hyphens are not allowed in names.",
          },
        ],
      },
      {
        id: "basic-types",
        title: "Numbers, Strings, and Booleans",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Numbers, Strings, and Booleans

Every value in Python has a type. The four basic types you will use constantly are integers, floats, strings, and booleans.

## Numbers

\`\`\`python
lessons = 12          # int: whole number
hours = 2.5           # float: number with a decimal point
print(type(lessons))  # <class 'int'>
\`\`\`

Dividing two integers with \`/\` always gives a float: \`10 / 4\` is \`2.5\`.

## Strings

Strings hold text and can use single or double quotes:

\`\`\`python
course = "Python for AI"
print(len(course))          # 13 characters
print(course.upper())       # PYTHON FOR AI
print(course.lower())       # python for ai
print("  hello  ".strip())  # removes spaces at both ends
\`\`\`

**f-strings** put values inside text. Put an \`f\` before the quotes and the value in braces:

\`\`\`python
name = "Jordan"
score = 91.456
print(f"{name} scored {score:.1f}%")   # Jordan scored 91.5%
\`\`\`

## Booleans

A boolean is either \`True\` or \`False\`. Comparisons produce booleans:

\`\`\`python
passed = score >= 70      # True
print(passed and name == "Jordan")
\`\`\`

## None

\`None\` means "no value". It is often used when something is missing or not yet set:

\`\`\`python
due_date = None
\`\`\`

## Checking a type

\`\`\`python
type(3.0)        # <class 'float'>
isinstance("a", str)   # True
\`\`\`

## Key points

- \`int\` and \`float\` hold numbers; \`/\` always returns a float.
- Strings have useful methods such as \`upper()\`, \`lower()\`, and \`strip()\`.
- f-strings are the clearest way to build text from values.
- \`None\` represents a missing value.`,
          },
          {
            type: 'check',
            question: "What does print(f\"{score:.1f}\") display when score is 91.456?",
            options: [
              "91",
              "91.456",
              "91.5",
              "91.4",
            ],
            answer: 2,
            explanation: "The format :.1f rounds the number to one decimal place, giving 91.5.",
          },
        ],
      },
      {
        id: "operators-and-conversion",
        title: "Operators and Type Conversion",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Operators and Type Conversion

Operators combine values. Type conversion changes a value from one type to another, which you will need whenever data arrives as text.

## Arithmetic operators

| Operator | Meaning | Example | Result |
| --- | --- | --- | --- |
| \`+\` | Addition | \`7 + 3\` | \`10\` |
| \`-\` | Subtraction | \`7 - 3\` | \`4\` |
| \`*\` | Multiplication | \`7 * 3\` | \`21\` |
| \`/\` | Division | \`7 / 2\` | \`3.5\` |
| \`//\` | Floor division | \`7 // 2\` | \`3\` |
| \`%\` | Remainder | \`7 % 2\` | \`1\` |
| \`**\` | Exponent | \`2 ** 3\` | \`8\` |

## Comparison operators

\`==\` (equal), \`!=\` (not equal), \`<\`, \`>\`, \`<=\`, and \`>=\` all return \`True\` or \`False\`.

Be careful: \`=\` assigns a value, while \`==\` compares two values.

## Logical operators

\`and\`, \`or\`, and \`not\` combine conditions:

\`\`\`python
score = 82
attempts = 2
eligible = score >= 70 and attempts <= 3   # True
\`\`\`

## Converting between types

Input from users, files, and APIs often arrives as text. Convert it before doing arithmetic:

\`\`\`python
completed = int("7")      # 7
total = float("10")       # 10.0
label = str(42)           # "42"

percentage = completed / total * 100
print(f"{percentage:.0f}% complete")   # 70% complete
\`\`\`

Conversion fails when the text is not a valid number:

\`\`\`python
int("seven")   # ValueError: invalid literal for int()
\`\`\`

You will learn how to handle that error safely in the lesson on exceptions.

## Key points

- \`/\` gives a float; \`//\` gives the whole-number part; \`%\` gives the remainder.
- Use \`==\` to compare and \`=\` to assign.
- Convert text with \`int()\`, \`float()\`, and \`str()\` before calculating.`,
          },
          {
            type: 'check',
            question: "What is the result of 7 // 2 in Python?",
            options: [
              "3",
              "4",
              "1",
              "3.5",
            ],
            answer: 0,
            explanation: "// is floor division: it returns the whole-number part of the division, so 7 // 2 is 3.",
          },
        ],
      },
    ],
  },
  {
    id: "collections",
    title: "Lists and Dictionaries",
    lessons: [
      {
        id: "lists",
        title: "Working with Lists",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Working with Lists

A list stores an ordered collection of values in square brackets:

\`\`\`python
scores = [82, 91, 67, 75]
names = ["Ari", "Mina", "Noah"]
\`\`\`

## Accessing items

Positions start at 0. Negative positions count from the end:

\`\`\`python
scores[0]     # 82, the first item
scores[-1]    # 75, the last item
scores[1:3]   # [91, 67], a slice from position 1 up to (not including) 3
\`\`\`

Asking for a position that doesn't exist raises an \`IndexError\`.

## Changing a list

\`\`\`python
scores.append(88)        # add to the end
scores.insert(0, 70)     # add at a position
scores.remove(67)        # remove the first matching value
last = scores.pop()      # remove and return the last item
scores[0] = 72           # replace an item
\`\`\`

## Useful functions

\`\`\`python
len(scores)       # number of items
sum(scores)       # total of the numbers
max(scores)       # highest value
min(scores)       # lowest value
sorted(scores)    # a new, sorted list
82 in scores      # True if the value is in the list
\`\`\`

Average score:

\`\`\`python
average = sum(scores) / len(scores)
\`\`\`

## List comprehensions

A list comprehension builds a new list from an existing one in one line:

\`\`\`python
passed = [score for score in scores if score >= 70]
percentages = [score / 100 for score in scores]
\`\`\`

## Key points

- Lists are ordered and positions start at 0.
- \`append\`, \`insert\`, \`remove\`, and \`pop\` change a list in place.
- \`len\`, \`sum\`, \`max\`, \`min\`, and \`sorted\` answer common questions about a list.
- Comprehensions filter or transform a list concisely.`,
          },
          {
            type: 'check',
            question: "Given scores = [82, 91, 67, 75], what is scores[-1]?",
            options: [
              "67",
              "82",
              "An IndexError",
              "75",
            ],
            answer: 3,
            explanation: "Negative positions count from the end of the list, so -1 is the last item, 75.",
          },
        ],
      },
      {
        id: "dictionaries",
        title: "Working with Dictionaries",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Working with Dictionaries

A dictionary stores **key-value pairs**. Instead of a position, you look up a value by its key:

\`\`\`python
learner = {
    "name": "Jordan",
    "email": "jordan@example.com",
    "completed": 7,
    "total": 10,
}

print(learner["name"])   # Jordan
\`\`\`

Keys are usually strings and must be unique. Values can be any type.

## Adding, changing, and removing

\`\`\`python
learner["level"] = "beginner"     # add a new key
learner["completed"] = 8          # change a value
del learner["email"]              # remove a key
\`\`\`

## Missing keys

Reading a key that doesn't exist raises a \`KeyError\`. Use \`get()\` to supply a default instead:

\`\`\`python
learner.get("phone")              # None
learner.get("phone", "unknown")   # "unknown"
"phone" in learner                # False
\`\`\`

## Looping through a dictionary

\`\`\`python
for key, value in learner.items():
    print(f"{key}: {value}")
\`\`\`

\`keys()\` gives the keys and \`values()\` gives the values.

## Why dictionaries matter for AI work

Most data you exchange with APIs and AI services arrives as JSON, and JSON objects become Python dictionaries. A model response, for example, might look like this once parsed:

\`\`\`python
response = {
    "model": "example-model",
    "output": "The course has 11 modules.",
    "usage": {"input_tokens": 120, "output_tokens": 18},
}

print(response["usage"]["output_tokens"])   # 18
\`\`\`

## Key points

- Dictionaries map unique keys to values.
- Use \`get()\` when a key might be missing.
- \`items()\` lets you loop over keys and values together.
- JSON objects from APIs become dictionaries in Python.`,
          },
          {
            type: 'check',
            question: "What does learner.get(\"phone\", \"unknown\") return when the key is missing?",
            options: [
              "An empty string",
              "None",
              "A KeyError",
              "\"unknown\"",
            ],
            answer: 3,
            explanation: "get() returns the default you supply, here \"unknown\", when the key does not exist, instead of raising a KeyError.",
          },
        ],
      },
      {
        id: "nested-data",
        title: "Nested Data Structures",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Nested Data Structures

Real data is rarely flat. Lists can contain dictionaries, dictionaries can contain lists, and both can be nested several levels deep. This is exactly the shape of most API and AI responses.

## A list of dictionaries

\`\`\`python
learners = [
    {"name": "Ari", "completed": 4, "total": 5},
    {"name": "Mina", "completed": 8, "total": 8},
    {"name": "Noah", "completed": 1, "total": 4},
]

for learner in learners:
    percent = learner["completed"] / learner["total"] * 100
    print(f"{learner['name']}: {percent:.0f}%")
\`\`\`

## A dictionary containing lists

\`\`\`python
course = {
    "title": "Python for AI Engineering",
    "modules": [
        {"title": "Python Foundations", "lessons": 3},
        {"title": "Variables and Data Types", "lessons": 3},
    ],
}

print(course["modules"][1]["title"])   # Variables and Data Types
total_lessons = sum(module["lessons"] for module in course["modules"])
\`\`\`

Read the access path left to right: the \`modules\` key, then the item at position 1, then its \`title\` key.

## Navigating safely

Deeply nested data may be missing a level. Chain \`get()\` calls with sensible defaults:

\`\`\`python
usage = response.get("usage", {})
tokens = usage.get("output_tokens", 0)
\`\`\`

## Finding items

\`\`\`python
complete = [l["name"] for l in learners if l["completed"] == l["total"]]
print(complete)   # ['Mina']
\`\`\`

## Tips

- Print the structure, or part of it, when you're unsure of its shape.
- Keep the same shape for every item in a list so code can treat them alike.
- Avoid nesting more than a few levels in your own data; deep nesting is hard to read.

## Key points

- Lists of dictionaries are the most common shape for records.
- Access nested values one level at a time: \`data["key"][index]["key"]\`.
- Use \`get()\` with defaults when a level might be missing.`,
          },
          {
            type: 'check',
            question: "Given the course dictionary in this lesson, what does course[\"modules\"][1][\"title\"] return?",
            options: [
              "\"Python Foundations\"",
              "\"Variables and Data Types\"",
              "A KeyError",
              "3",
            ],
            answer: 1,
            explanation: "It takes the modules list, then the item at position 1 (the second module), then that module's title.",
          },
        ],
      },
    ],
  },
  {
    id: "control-flow",
    title: "Conditions and Loops",
    lessons: [
      {
        id: "if-statements",
        title: "Conditional Statements",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Conditional Statements

Conditional statements let a program choose what to do based on data.

## if, elif, and else

\`\`\`python
score = 78

if score >= 90:
    grade = "Excellent"
elif score >= 70:
    grade = "Passed"
else:
    grade = "Needs review"

print(grade)   # Passed
\`\`\`

Python checks each condition from the top and runs the **first** block whose condition is true. \`else\` runs when none of them are.

## Combining conditions

\`\`\`python
completed = 9
total = 10
attempts = 2

if completed == total and attempts <= 3:
    print("Certificate issued")
elif completed == total:
    print("Completed, but too many attempts")
\`\`\`

Use \`or\` when either condition is enough, and \`not\` to reverse a condition.

## Truthy and falsy values

Empty values count as false in a condition: \`0\`, \`""\`, \`[]\`, \`{}\`, and \`None\`. Everything else counts as true:

\`\`\`python
comments = []
if not comments:
    print("No comments yet")
\`\`\`

## Checking for None

Use \`is\` to compare with \`None\`:

\`\`\`python
if due_date is None:
    print("No due date set")
\`\`\`

## A one-line choice

\`\`\`python
status = "complete" if completed == total else "in progress"
\`\`\`

Keep conditions readable. When a condition gets long, give it a name:

\`\`\`python
can_take_exam = completed == total and attempts < 3
if can_take_exam:
    ...
\`\`\`

## Key points

- \`if\`/\`elif\`/\`else\` run the first block whose condition is true.
- Combine conditions with \`and\`, \`or\`, and \`not\`.
- Empty values and \`None\` are falsy; compare with \`None\` using \`is\`.`,
          },
          {
            type: 'check',
            question: "With score = 78, which grade does the example program assign?",
            options: [
              "\"Excellent\"",
              "\"Passed\"",
              "Both \"Passed\" and \"Needs review\"",
              "\"Needs review\"",
            ],
            answer: 1,
            explanation: "78 fails the first condition (>= 90) but passes the second (>= 70), so the elif block runs and the rest are skipped.",
          },
        ],
      },
      {
        id: "for-loops",
        title: "For Loops",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# For Loops

A \`for\` loop runs a block of code once for each item in a collection.

\`\`\`python
learners = ["Alex", "Jordan", "Sam"]

for learner in learners:
    print(f"Welcome, {learner}!")
\`\`\`

The loop variable (\`learner\`) takes each value in turn.

## Looping a number of times

\`range()\` produces a sequence of numbers:

\`\`\`python
for number in range(5):        # 0, 1, 2, 3, 4
    print(number)

for lesson in range(1, 4):     # 1, 2, 3
    print(f"Lesson {lesson}")
\`\`\`

## Position and value together

\`enumerate()\` gives both the position and the item:

\`\`\`python
for position, name in enumerate(learners, start=1):
    print(f"{position}. {name}")
\`\`\`

## Building a result

A common pattern is to start with an empty value and update it in the loop:

\`\`\`python
scores = [82, 91, 67, 75]
total = 0
passed = []

for score in scores:
    total += score
    if score >= 70:
        passed.append(score)

print(total / len(scores))   # 78.75
print(passed)                # [82, 91, 75]
\`\`\`

## Looping through dictionaries

\`\`\`python
learner = {"name": "Jordan", "completed": 7}
for key, value in learner.items():
    print(key, value)
\`\`\`

## Two lists side by side

\`zip()\` pairs items from two lists:

\`\`\`python
names = ["Ari", "Mina"]
grades = [88, 95]
for name, grade in zip(names, grades):
    print(f"{name}: {grade}")
\`\`\`

## Key points

- \`for item in collection:\` runs once per item.
- \`range()\` repeats a fixed number of times; \`enumerate()\` adds positions; \`zip()\` pairs lists.
- Accumulate results in variables created before the loop.`,
          },
          {
            type: 'check',
            question: "Which numbers does range(1, 4) produce?",
            options: [
              "4, 3, 2, 1",
              "1, 2, 3, 4",
              "1, 2, 3",
              "0, 1, 2, 3",
            ],
            answer: 2,
            explanation: "range(start, stop) starts at start and stops before stop, so range(1, 4) gives 1, 2 and 3.",
          },
        ],
      },
      {
        id: "while-loops",
        title: "While Loops and Loop Control",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# While Loops and Loop Control

A \`while\` loop repeats as long as a condition is true. Use it when you don't know in advance how many times the loop must run.

\`\`\`python
attempts = 0

while attempts < 3:
    print(f"Attempt {attempts + 1}")
    attempts += 1
\`\`\`

The condition is checked before every pass. Something inside the loop must eventually make it false, or the loop never ends.

## Infinite loops

\`\`\`python
count = 0
while count < 3:
    print(count)
    # count is never increased, so this runs forever
\`\`\`

If a program hangs, press **Ctrl+C** in the terminal to stop it.

## break: leave the loop early

\`\`\`python
scores = [55, 62, 91, 48]

for score in scores:
    if score >= 90:
        print(f"Found a top score: {score}")
        break
\`\`\`

## continue: skip to the next pass

\`\`\`python
for score in scores:
    if score < 60:
        continue          # skip low scores
    print(score)
\`\`\`

## A retry loop

\`while\` loops are common when retrying something that might fail, such as a network call. Always set a limit:

\`\`\`python
MAX_ATTEMPTS = 3
attempt = 0
success = False

while attempt < MAX_ATTEMPTS and not success:
    attempt += 1
    success = try_to_connect()     # returns True or False
    if not success:
        print(f"Attempt {attempt} failed")

if not success:
    print("Giving up after 3 attempts")
\`\`\`

## for or while?

- Use \`for\` to process every item in a collection or repeat a known number of times.
- Use \`while\` when the loop depends on a condition that changes, such as retries or waiting for input.

## Key points

- \`while\` repeats while its condition is true; make sure the condition can become false.
- \`break\` exits the loop; \`continue\` skips to the next pass.
- Put a limit on retry loops.`,
          },
          {
            type: 'check',
            question: "What does continue do inside a loop?",
            options: [
              "Restarts the loop from the first item",
              "Pauses the loop until the user presses Enter",
              "Exits the loop completely",
              "Skips the rest of the current pass and moves to the next one",
            ],
            answer: 3,
            explanation: "continue skips the remaining lines for the current item and moves on to the next pass; break is the one that exits the loop.",
          },
        ],
      },
    ],
  },
  {
    id: "functions",
    title: "Python Functions",
    lessons: [
      {
        id: "defining-functions",
        title: "Defining and Calling Functions",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Defining and Calling Functions

A function is a named, reusable block of code. Functions make programs shorter, easier to test, and easier to read.

## Defining a function

\`\`\`python
def greet(name):
    print(f"Hello, {name}!")
\`\`\`

- \`def\` starts the definition.
- \`greet\` is the function name (snake_case, like variables).
- \`name\` is a **parameter**: a placeholder for a value the caller provides.
- The indented lines are the function body.

## Calling a function

Defining a function doesn't run it. You run it by calling it with an **argument**:

\`\`\`python
greet("Jordan")    # Hello, Jordan!
greet("Ari")       # Hello, Ari!
\`\`\`

## Returning a value

Most useful functions calculate something and \`return\` it to the caller:

\`\`\`python
def completion_percentage(completed, total):
    return completed / total * 100

percent = completion_percentage(7, 10)
print(f"{percent:.0f}%")   # 70%
\`\`\`

A function without a \`return\` statement returns \`None\`.

## Documenting a function

A docstring, the string on the first line of the body, explains what the function does:

\`\`\`python
def completion_percentage(completed, total):
    """Return the share of lessons completed, from 0 to 100."""
    return completed / total * 100
\`\`\`

## Why use functions

- **Reuse:** write the logic once and call it many times.
- **Naming:** a good name explains intent, such as \`is_eligible_for_certificate()\`.
- **Testing:** a function with clear inputs and outputs is easy to test.
- **Change:** fix a bug in one place instead of many.

A good function does one job. If you find yourself writing "and" when describing it, consider splitting it.

## Key points

- \`def name(parameters):\` defines a function; calling \`name(arguments)\` runs it.
- \`return\` sends a value back; without it the function returns \`None\`.
- Keep functions small, focused, and well named.`,
          },
          {
            type: 'check',
            question: "In def greet(name):, what is name?",
            options: [
              "A return value",
              "A parameter",
              "An argument",
              "A docstring",
            ],
            answer: 1,
            explanation: "name is a parameter: a placeholder in the definition. The value passed when calling the function, such as \"Jordan\", is the argument.",
          },
        ],
      },
      {
        id: "function-parameters",
        title: "Parameters and Arguments",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Parameters and Arguments

Functions become flexible when they accept input. Python gives you several ways to pass it.

## Positional arguments

Values are matched to parameters by position:

\`\`\`python
def describe(name, completed, total):
    return f"{name}: {completed}/{total} lessons"

describe("Ari", 4, 5)
\`\`\`

## Keyword arguments

Name the parameter when calling to make the call clearer and order-independent:

\`\`\`python
describe(name="Ari", total=5, completed=4)
\`\`\`

## Default values

A parameter with a default can be left out:

\`\`\`python
def format_score(score, decimals=1):
    return f"{score:.{decimals}f}%"

format_score(91.456)        # 91.5%
format_score(91.456, 0)     # 91%
\`\`\`

Parameters with defaults must come after those without.

Avoid using a mutable value such as a list as a default; use \`None\` instead:

\`\`\`python
def add_tag(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags
\`\`\`

## A variable number of arguments

\`*args\` collects extra positional arguments into a tuple, and \`**kwargs\` collects extra keyword arguments into a dictionary:

\`\`\`python
def average(*scores):
    return sum(scores) / len(scores)

average(80, 90, 70)   # 80.0

def build_request(url, **options):
    print(url, options)

build_request("https://api.example.com", timeout=10, retries=2)
\`\`\`

You will see \`**kwargs\` often in AI SDKs, where many settings are optional.

## Type hints

Type hints document what a function expects and returns. Python doesn't enforce them, but editors and tools use them to catch mistakes:

\`\`\`python
def completion_percentage(completed: int, total: int) -> float:
    return completed / total * 100
\`\`\`

## Key points

- Arguments can be passed by position or by name.
- Defaults make parameters optional; use \`None\` rather than a list as a default.
- \`*args\` and \`**kwargs\` accept any number of extra arguments.
- Type hints make functions easier to understand and check.`,
          },
          {
            type: 'check',
            question: "What does format_score(91.456, 0) return?",
            options: [
              "\"91.456%\"",
              "An error, because decimals has a default",
              "\"91%\"",
              "\"91.5%\"",
            ],
            answer: 2,
            explanation: "Passing 0 replaces the default of 1 decimal place, so the score is formatted with no decimals: 91%.",
          },
        ],
      },
      {
        id: "return-and-scope",
        title: "Return Values and Scope",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Return Values and Scope

## Returning values

\`return\` ends the function and sends a value back:

\`\`\`python
def grade(score):
    if score >= 90:
        return "Excellent"
    if score >= 70:
        return "Passed"
    return "Needs review"
\`\`\`

As soon as a \`return\` runs, the function stops, so the later lines are skipped.

A function can return several values as a tuple:

\`\`\`python
def score_summary(scores):
    return min(scores), max(scores), sum(scores) / len(scores)

lowest, highest, average = score_summary([82, 91, 67])
\`\`\`

## print versus return

\`print()\` shows a value on the screen; \`return\` hands it to the caller. A function that only prints can't be used in a calculation:

\`\`\`python
def bad_total(a, b):
    print(a + b)

result = bad_total(2, 3)   # prints 5, but result is None
\`\`\`

Prefer returning values and printing them where they are used.

## Scope

Variables created inside a function are **local**: they exist only while the function runs.

\`\`\`python
def calculate():
    total = 42
    return total

calculate()
print(total)   # NameError: name 'total' is not defined
\`\`\`

Variables created outside any function are **global** and can be read inside functions. Changing them from inside a function is possible but makes code hard to follow and test. Pass values in as arguments and return results instead:

\`\`\`python
completed = 0

def record_lesson(completed):
    return completed + 1

completed = record_lesson(completed)
\`\`\`

## Pure functions

A pure function depends only on its arguments and changes nothing outside itself. Given the same input it always returns the same output, which makes it easy to test. Aim for pure functions for calculations, and keep input and output (files, printing, APIs) at the edges of your program.

## Key points

- \`return\` stops the function and sends back a value; several values come back as a tuple.
- Return values rather than printing them inside functions.
- Variables inside a function are local; avoid changing globals.`,
          },
          {
            type: 'check',
            question: "What does result contain after result = bad_total(2, 3), when bad_total only prints a + b?",
            options: [
              "None",
              "The function itself",
              "\"5\"",
              "5",
            ],
            answer: 0,
            explanation: "bad_total prints 5 but has no return statement, so it returns None and that is what result holds.",
          },
        ],
      },
    ],
  },
  {
    id: "files-and-errors",
    title: "Files and Error Handling",
    lessons: [
      {
        id: "file-handling",
        title: "Reading and Writing Files",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Reading and Writing Files

Programs often need to read data from files and save results. Python's built-in \`open()\` handles text files.

## Reading a file

\`\`\`python
with open("learners.txt", encoding="utf-8") as file:
    content = file.read()

print(content)
\`\`\`

The \`with\` statement closes the file automatically when the block ends, even if an error happens. Always use it.

Read line by line to handle large files without loading everything at once:

\`\`\`python
with open("learners.txt", encoding="utf-8") as file:
    for line in file:
        print(line.strip())    # strip() removes the newline at the end
\`\`\`

## Writing a file

The second argument is the **mode**:

| Mode | Meaning |
| --- | --- |
| \`"r"\` | Read (the default) |
| \`"w"\` | Write: creates the file, or **replaces** its contents |
| \`"a"\` | Append: adds to the end of the file |

\`\`\`python
results = ["Ari: 80%", "Mina: 100%"]

with open("report.txt", "w", encoding="utf-8") as file:
    for line in results:
        file.write(line + "\\n")
\`\`\`

Be careful with \`"w"\`: it erases the existing contents without asking.

## Paths

\`pathlib\` builds file paths that work on every operating system:

\`\`\`python
from pathlib import Path

data_dir = Path("data")
report = data_dir / "report.txt"

if report.exists():
    text = report.read_text(encoding="utf-8")
\`\`\`

## CSV files

Spreadsheet-style data is often saved as CSV. The \`csv\` module reads each row into a dictionary:

\`\`\`python
import csv

with open("scores.csv", encoding="utf-8", newline="") as file:
    for row in csv.DictReader(file):
        print(row["name"], row["score"])
\`\`\`

Values read from CSV are strings, so convert numbers with \`int()\` or \`float()\`.

## Key points

- Open files with \`with open(...)\` so they are always closed.
- \`"w"\` replaces a file; \`"a"\` adds to it.
- Specify \`encoding="utf-8"\` to avoid problems with accented characters.
- Use \`pathlib\` for paths and \`csv\` for spreadsheet data.`,
          },
          {
            type: 'check',
            question: "What happens when you open an existing file with mode \"w\"?",
            options: [
              "Its existing contents are replaced",
              "The file opens read-only",
              "New text is added to the end of the file",
              "Python asks before changing the file",
            ],
            answer: 0,
            explanation: "Mode \"w\" truncates the file, so everything already in it is lost. Use \"a\" to add to the end instead.",
          },
        ],
      },
      {
        id: "exceptions",
        title: "Understanding Exceptions",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Understanding Exceptions

An **exception** is an error that happens while a program runs: a missing file, text that isn't a number, a network failure. Without handling, the program stops with a traceback.

## try and except

\`\`\`python
user_input = "seven"

try:
    lessons = int(user_input)
except ValueError:
    print("Please enter a whole number.")
    lessons = 0
\`\`\`

Python runs the \`try\` block. If a \`ValueError\` happens, it runs the matching \`except\` block instead of crashing.

## Catch specific exceptions

Name the exceptions you expect:

\`\`\`python
try:
    with open("learners.json", encoding="utf-8") as file:
        data = file.read()
except FileNotFoundError:
    print("learners.json was not found.")
except PermissionError:
    print("You don't have permission to read learners.json.")
\`\`\`

Avoid a bare \`except:\` or \`except Exception:\` that catches everything. It hides real bugs, such as a typo in a variable name, and makes problems hard to find.

## else and finally

\`\`\`python
try:
    percent = completed / total * 100
except ZeroDivisionError:
    print("This learner has no lessons yet.")
else:
    print(f"{percent:.0f}%")        # runs only if there was no error
finally:
    print("Calculation finished")   # always runs
\`\`\`

## Using the error details

\`\`\`python
try:
    value = int("abc")
except ValueError as error:
    print(f"Could not convert: {error}")
\`\`\`

## Raising your own exceptions

Raise an exception when your function receives something it can't work with:

\`\`\`python
def completion_percentage(completed, total):
    if total <= 0:
        raise ValueError("total must be greater than zero")
    return completed / total * 100
\`\`\`

The caller then decides how to handle it. This is better than silently returning a wrong answer.

## Key points

- Wrap code that can fail in \`try\` and handle expected errors in \`except\`.
- Catch specific exception types, not everything.
- \`else\` runs when nothing failed; \`finally\` always runs.
- \`raise\` signals invalid input clearly.`,
          },
          {
            type: 'check',
            question: "Why should you avoid a bare except: that catches every exception?",
            options: [
              "It makes the program run noticeably slower",
              "It prevents the finally block from running",
              "It hides unexpected bugs and makes problems hard to find",
              "It is a syntax error in current versions of Python",
            ],
            answer: 2,
            explanation: "Catching everything also swallows mistakes you didn't expect, such as typos, so the program continues with hidden errors.",
          },
        ],
      },
      {
        id: "validation",
        title: "Input Validation and Reliable Programs",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Input Validation and Reliable Programs

Data from users, files, and APIs can be missing, malformed, or simply wrong. Validation checks data **before** you use it, so errors are caught early and explained clearly.

## What to check

- **Presence:** required fields exist and are not empty.
- **Type:** values have the expected type, such as a number rather than text.
- **Range:** numbers fall within sensible limits.
- **Format:** text follows the expected pattern, such as an email address.
- **Consistency:** related values agree, such as completed lessons not exceeding the total.

## A validation function

\`\`\`python
def validate_learner(record):
    """Return a list of problems; an empty list means the record is valid."""
    errors = []

    if not record.get("name", "").strip():
        errors.append("name is required")

    completed = record.get("completed")
    total = record.get("total")

    if not isinstance(completed, int) or completed < 0:
        errors.append("completed must be a whole number of 0 or more")
    if not isinstance(total, int) or total <= 0:
        errors.append("total must be a whole number greater than 0")
    if not errors and completed > total:
        errors.append("completed cannot be greater than total")

    return errors
\`\`\`

Returning a list of all problems is friendlier than stopping at the first one.

## Using it

\`\`\`python
records = [
    {"name": "Ari", "completed": 4, "total": 5},
    {"name": "", "completed": 2, "total": 0},
]

for record in records:
    problems = validate_learner(record)
    if problems:
        print(f"Skipping record: {', '.join(problems)}")
        continue
    print(f"{record['name']} is valid")
\`\`\`

## Fail early and clearly

- Validate at the boundary: where data enters your program.
- Give messages that say what is wrong and what is expected.
- Never "fix" bad data silently, for example by treating a missing total as 1. A wrong result that looks right is worse than an error.

## Why this matters for AI applications

AI models can return text that doesn't match the format you asked for. Validating model output with the same approach, checking presence, type, range, and format, prevents bad data from reaching your users or database.

## Key points

- Check presence, type, range, format, and consistency.
- Collect all problems and report them clearly.
- Validate input and model output before using them.`,
          },
          {
            type: 'check',
            question: "A record has completed = 6 and total = 5. What should a validation function do?",
            options: [
              "Set completed to 5 so the record can be used",
              "Accept it, because both values are whole numbers",
              "Report that completed cannot be greater than total",
              "Treat the learner as having completed 100%",
            ],
            answer: 2,
            explanation: "The values are individually valid but inconsistent. Report the problem rather than changing the data silently.",
          },
        ],
      },
    ],
  },
  {
    id: "json-data",
    title: "Working with JSON",
    lessons: [
      {
        id: "json-introduction",
        title: "Understanding JSON",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Understanding JSON

JSON (JavaScript Object Notation) is a text format for structured data. It is the standard format for web APIs, configuration files, and AI model inputs and outputs.

## What JSON looks like

\`\`\`json
{
  "name": "Jordan",
  "completed": 7,
  "total": 10,
  "active": true,
  "mentor": null,
  "courses": ["Python for AI", "Prompt Engineering"],
  "progress": {"module": 3, "lesson": 2}
}
\`\`\`

## JSON types

| JSON | Python |
| --- | --- |
| object \`{ }\` | \`dict\` |
| array \`[ ]\` | \`list\` |
| string \`"text"\` | \`str\` |
| number \`7\`, \`2.5\` | \`int\`, \`float\` |
| \`true\` / \`false\` | \`True\` / \`False\` |
| \`null\` | \`None\` |

## The rules are strict

- Keys and strings must use **double quotes**.
- No trailing comma after the last item.
- No comments.
- \`true\`, \`false\`, and \`null\` are lowercase.

This is **not** valid JSON, even though it looks close:

\`\`\`text
{'name': 'Jordan', 'active': True,}
\`\`\`

It uses single quotes, Python's \`True\`, and a trailing comma.

## Why JSON matters for AI work

- Model APIs receive requests and send responses as JSON.
- You will often ask a model to reply in JSON so your program can read the answer reliably.
- Configuration for tools and agents is commonly stored in JSON.

Because a model can produce JSON that is slightly wrong, programs must parse it carefully and handle errors. You will do that in the next lessons.

## Key points

- JSON represents objects, arrays, strings, numbers, booleans, and null.
- JSON objects map to Python dictionaries and arrays to lists.
- Use double quotes, no trailing commas, and no comments.`,
          },
          {
            type: 'check',
            question: "Which of these is valid JSON?",
            options: [
              "{'active': true}",
              "{\"active\": true,}",
              "{\"active\": True}",
              "{\"active\": true}",
            ],
            answer: 3,
            explanation: "JSON needs double quotes, lowercase true, and no trailing comma, so only {\"active\": true} is valid.",
          },
        ],
      },
      {
        id: "json-python",
        title: "Converting JSON and Python Data",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Converting JSON and Python Data

Python's built-in \`json\` module converts between JSON text and Python objects.

## From JSON text to Python: json.loads()

\`\`\`python
import json

text = '{"name": "Jordan", "completed": 7, "total": 10}'
learner = json.loads(text)

print(type(learner))          # <class 'dict'>
print(learner["completed"])   # 7
\`\`\`

The \`s\` in \`loads\` stands for "string".

## From Python to JSON text: json.dumps()

\`\`\`python
summary = {"name": "Jordan", "percent": 70.0, "passed": True}
text = json.dumps(summary)
print(text)   # {"name": "Jordan", "percent": 70.0, "passed": true}
\`\`\`

Notice that Python's \`True\` became JSON's \`true\`.

Make the output readable with \`indent\`, and keep accented characters with \`ensure_ascii=False\`:

\`\`\`python
print(json.dumps(summary, indent=2, ensure_ascii=False))
\`\`\`

## Handling invalid JSON

\`json.loads()\` raises \`json.JSONDecodeError\` when the text isn't valid JSON. This happens often with model output, so always handle it:

\`\`\`python
model_output = '{"category": "Hardware", "priority": "high",}'   # trailing comma

try:
    result = json.loads(model_output)
except json.JSONDecodeError as error:
    print(f"The model did not return valid JSON: {error}")
    result = None
\`\`\`

## Parse, then validate

Valid JSON can still contain the wrong data. After parsing, check the fields you need:

\`\`\`python
if result is not None:
    category = result.get("category")
    if category not in {"Hardware", "Software", "Network"}:
        print(f"Unexpected category: {category}")
\`\`\`

## Types that JSON can't hold

\`json.dumps()\` can't convert every Python object, such as dates. Convert them to strings first:

\`\`\`python
from datetime import date
record = {"due": date(2027, 1, 15).isoformat()}   # "2027-01-15"
\`\`\`

## Key points

- \`json.loads()\` turns JSON text into Python objects; \`json.dumps()\` does the reverse.
- Handle \`json.JSONDecodeError\` whenever you parse text you didn't create.
- After parsing, validate the fields and values you rely on.`,
          },
          {
            type: 'check',
            question: "Which function turns a JSON string into a Python dictionary?",
            options: [
              "json.loads()",
              "json.dump()",
              "json.dumps()",
              "json.parse()",
            ],
            answer: 0,
            explanation: "json.loads() parses JSON text into Python objects. json.dumps() goes the other way, and json.parse() does not exist in Python.",
          },
        ],
      },
      {
        id: "json-files",
        title: "Reading and Writing JSON Files",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Reading and Writing JSON Files

Saving data as JSON files lets programs keep information between runs and share it with other tools.

## Writing a JSON file: json.dump()

\`json.dump()\` (without the \`s\`) writes directly to a file:

\`\`\`python
import json

learners = [
    {"name": "Ari", "completed": 4, "total": 5},
    {"name": "Mina", "completed": 8, "total": 8},
]

with open("learners.json", "w", encoding="utf-8") as file:
    json.dump(learners, file, indent=2, ensure_ascii=False)
\`\`\`

## Reading a JSON file: json.load()

\`\`\`python
with open("learners.json", encoding="utf-8") as file:
    learners = json.load(file)

print(len(learners))   # 2
\`\`\`

| Function | Works with |
| --- | --- |
| \`json.loads()\` / \`json.dumps()\` | Strings |
| \`json.load()\` / \`json.dump()\` | Files |

## Handling problems

Two things commonly go wrong: the file is missing, or it contains invalid JSON.

\`\`\`python
from pathlib import Path

def load_learners(path):
    file_path = Path(path)
    if not file_path.exists():
        return []
    try:
        with file_path.open(encoding="utf-8") as file:
            data = json.load(file)
    except json.JSONDecodeError as error:
        raise ValueError(f"{path} is not valid JSON: {error}") from error
    if not isinstance(data, list):
        raise ValueError(f"{path} should contain a list of learners")
    return data
\`\`\`

This function treats a missing file as "no data yet", but reports corrupt or wrongly shaped data instead of guessing.

## Saving safely

Writing directly over an important file risks leaving it half-written if the program stops midway. A safer pattern writes to a temporary file and then replaces the original:

\`\`\`python
def save_learners(path, learners):
    temp = Path(path).with_suffix(".tmp")
    with temp.open("w", encoding="utf-8") as file:
        json.dump(learners, file, indent=2)
    temp.replace(path)
\`\`\`

## Key points

- \`json.dump()\` writes to a file; \`json.load()\` reads from one.
- Handle a missing file and invalid JSON separately.
- Check that loaded data has the shape you expect.`,
          },
          {
            type: 'check',
            question: "What is the difference between json.load() and json.loads()?",
            options: [
              "json.loads() reads several files at once",
              "json.load() reads from a string; json.loads() reads from a file",
              "json.load() validates the data; json.loads() does not",
              "json.load() reads from a file; json.loads() reads from a string",
            ],
            answer: 3,
            explanation: "The s stands for string: loads() parses a string, while load() reads JSON from an open file.",
          },
        ],
      },
    ],
  },
  {
    id: "rest-apis",
    title: "REST APIs and Python",
    lessons: [
      {
        id: "api-concepts",
        title: "Understanding REST APIs",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Understanding REST APIs

An **API** (Application Programming Interface) lets one program use another program's features or data. A **REST API** does this over HTTP, the same protocol your browser uses. Every AI model provider exposes its models through an API.

## Requests and responses

A client sends a **request**; the server sends back a **response**.

A request has:

- **A URL (endpoint):** where to send it, such as \`https://api.example.com/v1/courses\`.
- **A method:** what you want to do.
- **Headers:** extra information, such as authentication and content type.
- **A body (optional):** data you send, usually JSON.

## HTTP methods

| Method | Purpose | Example |
| --- | --- | --- |
| \`GET\` | Read data | Get a list of courses |
| \`POST\` | Create something or run an action | Send a prompt to a model |
| \`PUT\` / \`PATCH\` | Replace or update data | Change a course title |
| \`DELETE\` | Remove data | Delete a draft |

## Status codes

The response includes a status code that says how the request went:

| Code | Meaning |
| --- | --- |
| \`200\` | OK |
| \`201\` | Created |
| \`400\` | Bad request: something is wrong with what you sent |
| \`401\` | Unauthorized: missing or invalid credentials |
| \`403\` | Forbidden: you are not allowed to do this |
| \`404\` | Not found |
| \`429\` | Too many requests: you hit a rate limit |
| \`500\`–\`503\` | Server error: a problem on the provider's side |

Codes starting with 4 mean the client should change something; codes starting with 5 mean the server had a problem, and retrying later may help.

## A typical AI API call

\`\`\`text
POST https://api.example.com/v1/generate
Authorization: Bearer <your API key>
Content-Type: application/json

{"model": "example-model", "input": "Summarize this lesson in one sentence."}
\`\`\`

The response body is JSON containing the generated text and usage details.

## Key points

- REST APIs exchange requests and responses over HTTP, usually with JSON.
- The method says what to do; the status code says how it went.
- 4xx means fix the request; 5xx means a server problem.`,
          },
          {
            type: 'check',
            question: "An API call returns status 429. What does it mean?",
            options: [
              "The resource you asked for was not found",
              "The server had an internal error",
              "Too many requests: you have hit a rate limit",
              "Your credentials are missing or invalid",
            ],
            answer: 2,
            explanation: "429 means the client sent too many requests in a given time. Wait and retry later, ideally with increasing delays.",
          },
        ],
      },
      {
        id: "python-requests",
        title: "Calling APIs with Python",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Calling APIs with Python

The \`requests\` package is the most common way to call HTTP APIs from Python. Install it in your virtual environment:

\`\`\`bash
pip install requests
\`\`\`

## A GET request

\`\`\`python
import requests

response = requests.get("https://api.github.com", timeout=10)

print(response.status_code)          # 200
print(response.headers["Content-Type"])
data = response.json()                # parse the JSON body into a dict
\`\`\`

## Query parameters

Pass parameters as a dictionary instead of building the URL by hand:

\`\`\`python
response = requests.get(
    "https://api.github.com/search/repositories",
    params={"q": "language:python", "per_page": 5},
    timeout=10,
)
\`\`\`

## A POST request with JSON

\`\`\`python
payload = {"title": "Python for AI", "level": "beginner"}

response = requests.post(
    "https://api.example.com/v1/courses",
    json=payload,                     # sends JSON and sets the content type
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=30,
)
\`\`\`

## Checking the result

\`raise_for_status()\` raises an exception for 4xx and 5xx responses:

\`\`\`python
try:
    response.raise_for_status()
    result = response.json()
except requests.exceptions.Timeout:
    print("The request took too long.")
except requests.exceptions.HTTPError as error:
    print(f"The API returned an error: {error}")
except requests.exceptions.RequestException as error:
    print(f"The request failed: {error}")
\`\`\`

\`RequestException\` is the parent of all \`requests\` errors, so it catches connection problems too.

## Always set a timeout

Without \`timeout\`, a request can wait forever if the server doesn't answer, freezing your program. Choose a value that suits the API: a few seconds for simple lookups, longer for model calls that generate text.

## Key points

- \`requests.get()\` and \`requests.post()\` send HTTP requests.
- Use \`params=\` for query strings and \`json=\` for JSON bodies.
- Call \`raise_for_status()\` and handle \`requests\` exceptions.
- Always set a timeout.`,
          },
          {
            type: 'check',
            question: "Why should every requests call include a timeout?",
            options: [
              "The timeout sets how long the response is cached",
              "Without one, the program can wait forever for a server that doesn't respond",
              "It is required for the response to be parsed as JSON",
              "Requests without a timeout are rejected by most APIs",
            ],
            answer: 1,
            explanation: "requests has no default timeout, so a server that never answers would freeze the program. A timeout turns that into an error you can handle.",
          },
        ],
      },
      {
        id: "api-security",
        title: "API Reliability and Security",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# API Reliability and Security

Calling an API in a tutorial is easy. Calling it safely and reliably in a real application takes a few more habits.

## Protect credentials

API keys are like passwords: anyone who has yours can use your account and your budget.

- Never write keys directly in code or commit them to Git.
- Read them from environment variables or a secret manager.
- Never send a privileged key to a browser or mobile app; call the API from your backend instead.

\`\`\`python
import os

api_key = os.environ.get("MODEL_API_KEY")
if not api_key:
    raise RuntimeError("Set the MODEL_API_KEY environment variable")
\`\`\`

Add files that hold secrets, such as \`.env\`, to \`.gitignore\`.

## Authentication and authorization

- **Authentication** proves who is calling, for example with an API key or token.
- **Authorization** decides what that caller is allowed to do.

Your own APIs need both: knowing who a user is doesn't mean they may see every record.

## Handle failures

Networks fail and services have outages. Plan for it:

- Set timeouts on every call.
- Check status codes and handle errors.
- Retry only errors that may succeed later, such as timeouts, \`429\`, and \`5xx\`, and never retry \`400\` or \`401\` unchanged.
- Wait longer between each retry (exponential backoff) and stop after a few attempts.

\`\`\`python
import time
import requests

def get_with_retry(url, attempts=3):
    for attempt in range(1, attempts + 1):
        try:
            response = requests.get(url, timeout=10)
            if response.status_code in (429, 500, 502, 503) and attempt < attempts:
                time.sleep(2 ** attempt)      # 2, 4, 8 seconds
                continue
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            if attempt == attempts:
                raise
            time.sleep(2 ** attempt)
\`\`\`

## Validate what comes back

Treat API and model responses as untrusted input: check that the fields you need exist and have sensible values before using them.

## Key points

- Keep keys out of code and out of browsers; use environment variables or a secret manager.
- Authentication proves identity; authorization limits access.
- Retry only temporary failures, with backoff and a limit.
- Validate responses before using them.`,
          },
          {
            type: 'check',
            question: "Which error is worth retrying automatically after a short wait?",
            options: [
              "400 Bad Request",
              "503 Service Unavailable",
              "404 Not Found",
              "401 Unauthorized",
            ],
            answer: 1,
            explanation: "A 503 means the service is temporarily unavailable, so a later retry may succeed. 400, 401 and 404 will fail again until the request itself changes.",
          },
        ],
      },
    ],
  },
  {
    id: "oop-and-testing",
    title: "Object-Oriented Programming and Testing",
    lessons: [
      {
        id: "classes-objects",
        title: "Classes and Objects",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Classes and Objects

A **class** is a blueprint that groups data and the functions that work with it. An **object** is one instance created from that blueprint.

## Defining a class

\`\`\`python
class Learner:
    def __init__(self, name, email):
        self.name = name
        self.email = email
        self.completed = 0

    def complete_lesson(self):
        self.completed += 1

    def introduce(self):
        return f"{self.name} has completed {self.completed} lessons"
\`\`\`

- \`class Learner:\` defines the class. Class names use **CamelCase**.
- \`__init__\` runs when a new object is created and sets up its data.
- \`self\` refers to the object itself; methods use it to read and change that object's data.
- Variables stored on \`self\`, such as \`self.name\`, are called **attributes**.
- Functions defined in a class are called **methods**.

## Creating and using objects

\`\`\`python
jordan = Learner("Jordan", "jordan@example.com")
ari = Learner("Ari", "ari@example.com")

jordan.complete_lesson()
jordan.complete_lesson()

print(jordan.introduce())   # Jordan has completed 2 lessons
print(ari.completed)        # 0
\`\`\`

Each object keeps its own data: changing \`jordan\` doesn't change \`ari\`.

## Readable printing

Define \`__repr__\` so objects print usefully while debugging:

\`\`\`python
    def __repr__(self):
        return f"Learner(name={self.name!r}, completed={self.completed})"
\`\`\`

## Data classes

For classes that mainly hold data, \`dataclasses\` writes \`__init__\` and \`__repr__\` for you:

\`\`\`python
from dataclasses import dataclass

@dataclass
class CourseResult:
    name: str
    score: float
    passed: bool = False
\`\`\`

You will see classes everywhere in AI libraries: a client object for a model provider, a response object, a document object in a RAG pipeline.

## Key points

- A class bundles data (attributes) and behavior (methods).
- \`__init__\` sets up a new object; \`self\` is the object itself.
- Each object has its own copy of its attributes.
- Use \`@dataclass\` for simple data-holding classes.`,
          },
          {
            type: 'check',
            question: "What does __init__ do in a Python class?",
            options: [
              "It sets up a new object's data when the object is created",
              "It runs once when the class is defined, before any objects exist",
              "It prints the object in a readable format",
              "It deletes an object when it is no longer used",
            ],
            answer: 0,
            explanation: "__init__ runs each time an object is created and stores its starting attributes on self. __repr__ controls how it prints.",
          },
        ],
      },
      {
        id: "inheritance-encapsulation",
        title: "Inheritance and Encapsulation",
        minutes: 9,
        blocks: [
          {
            type: 'text',
            text: `# Inheritance and Encapsulation

Two ideas help classes stay organized as programs grow: inheritance lets one class build on another, and encapsulation keeps an object's internal details under its own control.

## Inheritance

A **child class** inherits the attributes and methods of a **parent class** and can add or change behavior:

\`\`\`python
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email

    def describe(self):
        return f"{self.name} <{self.email}>"


class Instructor(User):
    def __init__(self, name, email, courses):
        super().__init__(name, email)   # run the parent's setup
        self.courses = courses

    def describe(self):                 # override the parent's method
        return f"{super().describe()} teaches {len(self.courses)} course(s)"


teacher = Instructor("Sam", "sam@example.com", ["Python for AI"])
print(teacher.describe())   # Sam <sam@example.com> teaches 1 course(s)
\`\`\`

\`super()\` calls the parent's version of a method. \`isinstance(teacher, User)\` is \`True\`, because an instructor is a kind of user.

Use inheritance for genuine "is a" relationships. When one object simply *uses* another, store it as an attribute instead (composition).

## Encapsulation

Encapsulation means an object manages its own data and other code changes it through methods, so the rules are enforced in one place:

\`\`\`python
class CourseProgress:
    def __init__(self, total):
        self.total = total
        self._completed = 0          # leading underscore: internal

    def complete_lesson(self):
        if self._completed < self.total:
            self._completed += 1

    @property
    def percent(self):
        return self._completed / self.total * 100
\`\`\`

- A leading underscore (\`_completed\`) tells other programmers "don't change this directly". Python doesn't prevent it, but the convention is respected.
- \`@property\` lets callers read \`progress.percent\` like an attribute while it is calculated by a method.

\`\`\`python
progress = CourseProgress(total=4)
progress.complete_lesson()
print(progress.percent)   # 25.0
\`\`\`

Because lessons can only be added through \`complete_lesson()\`, \`_completed\` can never exceed \`total\`.

## Key points

- A child class inherits from a parent; \`super()\` calls the parent's methods.
- Use inheritance for "is a" relationships and composition otherwise.
- Keep internal data behind methods and properties so rules are enforced in one place.`,
          },
          {
            type: 'check',
            question: "In the Instructor example, what does super().__init__(name, email) do?",
            options: [
              "Prevents Instructor from overriding User's methods",
              "Copies the instructor's courses into the User class",
              "Creates a second, separate User object",
              "Runs the parent User class's setup for name and email",
            ],
            answer: 3,
            explanation: "super() refers to the parent class, so this line runs User's __init__ to set name and email on the instructor object.",
          },
        ],
      },
      {
        id: "modules-testing",
        title: "Modules and Unit Testing",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Modules and Unit Testing

As programs grow, you split them into modules and check them with automated tests.

## Modules

Any \`.py\` file is a module. Put related functions in one file and import them elsewhere:

\`\`\`python
# progress.py
def completion_percentage(completed, total):
    if total <= 0:
        raise ValueError("total must be greater than zero")
    return completed / total * 100
\`\`\`

\`\`\`python
# main.py
from progress import completion_percentage

print(completion_percentage(7, 10))
\`\`\`

Code that should run only when a file is executed directly, not when it is imported, goes under this check:

\`\`\`python
if __name__ == "__main__":
    main()
\`\`\`

## Packages

\`pip install\` adds third-party modules, such as \`requests\`. Record your project's packages in \`requirements.txt\` so others can install the same ones:

\`\`\`text
requests==2.32.3
pytest==8.3.2
\`\`\`

## Unit tests with pytest

A unit test calls a small piece of code and checks the result. With pytest, a test is a function whose name starts with \`test_\`, in a file whose name starts with \`test_\`:

\`\`\`python
# test_progress.py
import pytest
from progress import completion_percentage

def test_partial_progress():
    assert completion_percentage(7, 10) == 70

def test_complete():
    assert completion_percentage(5, 5) == 100

def test_zero_total_is_rejected():
    with pytest.raises(ValueError):
        completion_percentage(1, 0)
\`\`\`

Run every test in the folder:

\`\`\`bash
pip install pytest
pytest
\`\`\`

## What to test

- **Normal cases:** typical inputs.
- **Boundaries:** zero, empty lists, the highest allowed value.
- **Invalid input:** the function should raise or reject it.

## Why tests matter

Tests catch mistakes when you change code later, and they document how functions are supposed to behave. In AI applications, the same habit extends to evaluations that check model output.

## Key points

- Split code into modules and import what you need.
- Guard script-only code with \`if __name__ == "__main__":\`.
- Write pytest tests for normal, boundary, and invalid cases, and run them with \`pytest\`.`,
          },
          {
            type: 'check',
            question: "How does pytest find test functions?",
            options: [
              "By every function in a file called tests.py",
              "By functions marked with a @test decorator in any file",
              "By functions named test_... in files named test_...",
              "By functions listed in requirements.txt",
            ],
            answer: 2,
            explanation: "pytest collects files whose names start with test_ and runs the functions inside whose names start with test_.",
          },
        ],
      },
    ],
  },
  {
    id: "ai-engineering-project",
    title: "Practical AI Engineering Project",
    lessons: [
      {
        id: "student-progress-analyzer",
        title: "Build a Student Progress Analyzer",
        minutes: 10,
        blocks: [
          {
            type: 'text',
            text: `# Build a Student Progress Analyzer

Time to combine what you've learned. You will build a small program that reports learner progress: who has finished, who is behind, and the class average.

## Step 1: the data

Start with a list of dictionaries:

\`\`\`python
learners = [
    {"name": "Ari", "completed": 4, "total": 5},
    {"name": "Mina", "completed": 8, "total": 8},
    {"name": "Noah", "completed": 1, "total": 4},
    {"name": "Lee", "completed": 2, "total": 0},
]
\`\`\`

The last record is invalid: a course can't have zero lessons.

## Step 2: functions for each job

\`\`\`python
def completion_percentage(completed, total):
    if total <= 0:
        raise ValueError("total must be greater than zero")
    return completed / total * 100


def status(percent):
    if percent == 100:
        return "complete"
    if percent >= 50:
        return "on track"
    return "behind"
\`\`\`

## Step 3: analyze every learner

\`\`\`python
def analyze(learners):
    results = []
    skipped = []

    for learner in learners:
        try:
            percent = completion_percentage(learner["completed"], learner["total"])
        except (KeyError, ValueError) as error:
            skipped.append(f"{learner.get('name', '?')}: {error}")
            continue
        results.append({"name": learner["name"], "percent": percent, "status": status(percent)})

    return results, skipped
\`\`\`

Invalid records are reported, not silently turned into wrong numbers.

## Step 4: report

\`\`\`python
results, skipped = analyze(learners)

for row in results:
    print(f"{row['name']:<6} {row['percent']:5.1f}%  {row['status']}")

if results:
    average = sum(row["percent"] for row in results) / len(results)
    print(f"Average: {average:.1f}%")

for problem in skipped:
    print(f"Skipped {problem}")
\`\`\`

Output:

\`\`\`text
Ari     80.0%  on track
Mina   100.0%  complete
Noah    25.0%  behind
Average: 68.3%
Skipped Lee: total must be greater than zero
\`\`\`

## Try it yourself

- Add a \`"behind"\` list that names learners below 50%.
- Sort the report from highest to lowest progress with \`sorted(results, key=lambda row: row["percent"], reverse=True)\`.

## Key points

- Give each job its own function: calculating, classifying, analyzing, reporting.
- Handle invalid records explicitly and report them.`,
          },
          {
            type: 'check',
            question: "Why does analyze() put Lee's record in skipped instead of the results?",
            options: [
              "Lee's total is 0, so completion_percentage raises a ValueError",
              "Lee has completed fewer than half of the lessons",
              "Lee's name is missing from the record",
              "Lee's completed value is greater than the total",
            ],
            answer: 0,
            explanation: "A total of 0 makes completion_percentage raise ValueError, which analyze() catches and records instead of producing a wrong percentage.",
          },
        ],
      },
      {
        id: "make-project-reliable",
        title: "Improve the Analyzer with JSON and Tests",
        minutes: 10,
        blocks: [
          {
            type: 'text',
            text: `# Improve the Analyzer with JSON and Tests

A program that only works on data typed into the code isn't very useful. In this lesson you load the learners from a JSON file, split the code into modules, and add tests.

## Project structure

\`\`\`text
progress_analyzer/
    learners.json
    progress.py        # calculations: no files, no printing
    storage.py         # loading and saving JSON
    main.py            # puts it together and prints the report
    test_progress.py   # tests for progress.py
\`\`\`

Keeping calculations separate from files and printing makes them easy to test.

## Loading the data

\`\`\`python
# storage.py
import json
from pathlib import Path

def load_learners(path):
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"{path} was not found")
    with file_path.open(encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise ValueError("learners.json must contain a list")
    return data
\`\`\`

## The main program

\`\`\`python
# main.py
import json
from storage import load_learners
from progress import analyze

def main():
    try:
        learners = load_learners("learners.json")
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as error:
        print(f"Could not load learners: {error}")
        return
    results, skipped = analyze(learners)
    for row in results:
        print(f"{row['name']}: {row['percent']:.1f}% ({row['status']})")
    for problem in skipped:
        print(f"Skipped {problem}")

if __name__ == "__main__":
    main()
\`\`\`

## Tests

\`\`\`python
# test_progress.py
from progress import analyze, completion_percentage, status

def test_percentage():
    assert completion_percentage(4, 5) == 80

def test_status_boundaries():
    assert status(100) == "complete"
    assert status(50) == "on track"
    assert status(49.9) == "behind"

def test_invalid_record_is_skipped():
    results, skipped = analyze([{"name": "Lee", "completed": 2, "total": 0}])
    assert results == []
    assert len(skipped) == 1
\`\`\`

Run them with \`pytest\`. Each time you change \`progress.py\`, run the tests again.

## Practice data

Use invented names and emails in practice projects. Real learner data is personal information and needs the same care in a test file as in production.

## Key points

- Separate loading, calculating, and reporting into modules.
- Handle missing files, invalid JSON, and wrongly shaped data.
- Test calculations, boundaries, and invalid records.`,
          },
          {
            type: 'check',
            question: "Why does the project keep calculations in progress.py, separate from files and printing?",
            options: [
              "So the program no longer needs to validate its input",
              "Because Python cannot read files and calculate in the same module",
              "Because JSON files must be loaded by a module named storage.py",
              "So the calculations can be tested without files or console output",
            ],
            answer: 3,
            explanation: "Pure calculation functions can be tested by calling them directly, without creating files or capturing printed output.",
          },
        ],
      },
      {
        id: "ai-engineering-next-steps",
        title: "Where Python Fits in an AI Application",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Where Python Fits in an AI Application

You now have the core Python skills. This lesson shows how they map onto a typical AI application.

## A typical AI request, step by step

An assistant that answers questions about course policies might work like this:

1. **Receive the request:** a web API built with a framework such as FastAPI receives the user's question as JSON.
2. **Validate input:** check the question isn't empty or too long, and that the user is signed in.
3. **Find context:** search course documents for passages related to the question.
4. **Build the prompt:** combine instructions, the passages, and the question into a request for the model.
5. **Call the model:** send the request to a model provider's API with a timeout and error handling.
6. **Validate the output:** parse the response, check its format, and handle failures.
7. **Respond and log:** return the answer as JSON and record what happened for monitoring.

Every step uses something from this course:

| Step | Skills |
| --- | --- |
| Receive and respond | Functions, dictionaries, JSON |
| Validate | Conditions, validation functions, exceptions |
| Find context | Lists, loops, files |
| Call the model | \`requests\` or a provider SDK, timeouts, retries |
| Validate output | \`json.loads()\`, checks, error handling |
| Maintain | Modules, classes, tests |

## A sketch in Python

\`\`\`python
def answer_question(question, user):
    if not user.is_authenticated:
        raise PermissionError("Sign in first")
    question = question.strip()
    if not question or len(question) > 2000:
        raise ValueError("Ask a question of up to 2,000 characters")

    passages = search_documents(question, limit=3)
    prompt = build_prompt(question, passages)
    reply = call_model(prompt, timeout=30)
    return parse_and_validate(reply)
\`\`\`

The AI part is one function call. Most of the code is ordinary, careful Python.

## Key points

- An AI feature is mostly regular software: validation, data handling, APIs, and tests.
- The model call is one step in a larger, well-structured program.`,
          },
          {
            type: 'check',
            question: "In the example AI request, which step should happen before the prompt is built?",
            options: [
              "Validating the user and the question",
              "Returning the answer as JSON",
              "Validating the model's output",
              "Logging the model's response",
            ],
            answer: 0,
            explanation: "Input is validated first, so invalid or unauthorized requests never reach the model. Output validation and logging come after the model call.",
          },
        ],
      },
    ],
  },
  {
    id: "review-and-next-steps",
    title: "Review and Next Steps",
    lessons: [
      {
        id: "python-foundations-review",
        title: "Python Foundations Review",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Python Foundations Review

Use this lesson to check your understanding before moving on. For each area, make sure you can explain the idea and write a short example without looking.

## Core language

- **Variables and types:** \`int\`, \`float\`, \`str\`, \`bool\`, \`None\`; converting with \`int()\`, \`float()\`, \`str()\`.
- **Collections:** lists for ordered items, dictionaries for key-value data, and nested combinations of both.
- **Control flow:** \`if\`/\`elif\`/\`else\`, \`for\` loops with \`range()\` and \`enumerate()\`, \`while\` loops with \`break\` and \`continue\`.
- **Functions:** parameters, defaults, keyword arguments, return values, and local scope.

## Working with data

- **Files:** \`with open(...)\`, modes \`"r"\`, \`"w"\`, and \`"a"\`, and \`pathlib\`.
- **JSON:** \`json.loads()\`/\`json.dumps()\` for strings and \`json.load()\`/\`json.dump()\` for files.
- **Validation:** check presence, type, range, format, and consistency; report problems clearly.
- **Errors:** \`try\`/\`except\` for specific exceptions, \`raise\` for invalid input.

## Integration and structure

- **APIs:** HTTP methods, status codes, \`requests\` with timeouts, and protecting API keys.
- **Classes:** attributes, methods, \`__init__\`, inheritance, and properties.
- **Modules and tests:** imports, \`if __name__ == "__main__":\`, and pytest.

## A self-check exercise

Without looking back, write a function that:

1. Takes a list of dictionaries with \`name\` and \`score\`.
2. Skips records where \`score\` is missing or not a number, and lists them.
3. Returns the average of the valid scores and the names of anyone below 70.

Then write two pytest tests for it: one normal case and one with an invalid record.

If any part feels uncertain, revisit that lesson before continuing. The next courses assume these basics.

## Key points

- You should be able to read and write each of these patterns without notes.
- Practice by writing small programs and tests, not only by reading.`,
          },
          {
            type: 'check',
            question: "Which pair of functions reads and writes JSON files (rather than strings)?",
            options: [
              "read() and write()",
              "json.load() and json.dump()",
              "json.loads() and json.dumps()",
              "open() and close()",
            ],
            answer: 1,
            explanation: "load() and dump() work with file objects; loads() and dumps() work with strings.",
          },
        ],
      },
      {
        id: "prepare-for-next-course",
        title: "Preparing for Advanced AI Engineering",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Preparing for Advanced AI Engineering

This course gave you the Python foundation. The rest of the Enterprise AI & Solutions Architecture program builds on it step by step.

## What comes next

| Course | How Python helps |
| --- | --- |
| Mathematics foundations | Express formulas and statistics in code |
| GRC fundamentals | Understand the rules your AI systems must follow |
| APIs, JSON & backend integration | Build and call the services AI features run behind |
| AI engineering fundamentals & LLMs | Call models and understand how they work |
| Prompt engineering & structured outputs | Request and validate JSON from models |
| Embeddings, vector databases & RAG | Process documents and search them by meaning |
| AI agents & workflow automation | Let models use tools safely |

## Habits to keep

- **Use a virtual environment** for every project.
- **Keep secrets out of code**; load them from the environment.
- **Validate input and output**, especially anything that comes from a model.
- **Write small functions and test them.**
- **Read error messages** from the bottom up before searching for answers.

## Keep practicing

- Extend the progress analyzer: read a CSV file, export a JSON report, or add a command-line option.
- Call a free public API with \`requests\` and summarize its JSON response.
- Read other people's Python code, such as the examples in a library's documentation.

## Key points

- The coming courses use every topic from this one.
- Good habits now (environments, secrets, validation, tests) carry straight into production AI work.`,
          },
          {
            type: 'check',
            question: "Which habit matters most when your program uses output from an AI model?",
            options: [
              "Saving the output in a global variable",
              "Validating the output before using it",
              "Printing the output to the console",
              "Converting the output to uppercase",
            ],
            answer: 1,
            explanation: "Model output can be incomplete or in the wrong format, so it must be parsed and validated before your program relies on it.",
          },
        ],
      },
    ],
  },
];

runCourseSeed({ course: COURSE, modules: MODULES, script: 'scripts/Python-ai-course/seed-python-ai-course.mjs' }).catch((error) => {
  console.error('\nSEED FAILED:', error);
  process.exit(1);
});
