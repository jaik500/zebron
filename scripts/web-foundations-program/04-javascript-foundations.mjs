import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 4,
  id: "web-javascript-foundations",
  title: "JavaScript Foundations: Values, Logic, Functions and Data",
  summary: "Course 4 of 7 in the Zebron Web Foundations Program. Learn the JavaScript language: values and variables, operators and decisions, loops, functions, scope and closures, arrays and objects.",
  description: "JavaScript makes pages interactive and also runs servers (Node.js) and Zebron's Cloud Functions. This course teaches the language itself, before the browser: values and types, `let` and `const`, decisions and loops, functions and arrow functions, scope and closures, and working with arrays and objects using modern methods.\n\nRun the examples in the browser console (F12 → Console) or in a file with `node file.js`.\n\nEach lesson ends with a quick check. The final exam is drawn from the **JavaScript Foundations** quiz in the Test Center.",
  level: "beginner",
  cover: "teal",
  outcomes: ["Use values, types, let and const correctly", "Write decisions and loops, including strict equality and nullish values", "Write functions, arrow functions and closures", "Transform arrays and objects with map, filter, reduce, spread and destructuring"],
  skills: ["JavaScript", "ES2023+", "Functions", "Arrays", "Objects"],
  quiz: {"name": "JavaScript Foundations", "slug": "web-javascript-foundations", "description": "Practice questions for Course 4 of the Web Foundations Program: values, logic, functions, arrays and objects.", "tags": ["javascript", "web-foundations"]},
  topics: [{"key": "values", "name": "Values, types and variables", "description": "Primitive types, objects, let, const, template literals and type conversion."}, {"key": "logic", "name": "Operators, decisions and loops", "description": "=== vs ==, truthy and falsy, ??, ?., if, switch, for...of."}, {"key": "functions", "name": "Functions, scope and closures", "description": "Declarations, arrow functions, defaults, rest, scope and closures."}, {"key": "data", "name": "Arrays and objects", "description": "map, filter, find, reduce, sort, spread, destructuring and JSON."}],
  modules: [
    {
      id: "basics",
      title: "Language basics",
      lessons: [
        {
          id: "values-variables",
          title: "Values, types and variables",
          minutes: 20,
          blocks: [
            text("## Variables\n\n```js\nconst site = 'Zebron';      // cannot be reassigned\nlet jobs = 12;              // can change\njobs = jobs + 1;\n// var is the old way: avoid it (function scope, surprising behaviour)\n```\n\nUse `const` by default and `let` when the value must change. `const` stops reassignment, not changes inside an object: `const user = {}; user.name = 'Ana';` is allowed.\n\n## Types\n\n| Type | Examples |\n| --- | --- |\n| string | `'hello'`, `\"hi\"`, and template literals in backticks with `${name}` inside |\n| number | `42`, `3.14`, `NaN`, `Infinity` |\n| boolean | `true`, `false` |\n| null / undefined | \"no value on purpose\" / \"not set\" |\n| bigint, symbol | rare |\n| object | `{ name: 'Ana' }`, arrays, functions, dates |\n\n`typeof 42` is `'number'`; `Array.isArray(x)` tests for arrays."),
            text("## Conversion pitfalls\n\n```js\n'5' + 1        // '51'  (+ with a string joins text)\n'5' - 1        // 4     (- converts to numbers)\nNumber('42')   // 42\nNumber('abc')  // NaN\n0.1 + 0.2      // 0.30000000000000004  (use whole cents for money)\n```\n\nConvert on purpose with `Number()`, `String()` and `Boolean()` rather than relying on automatic conversion."),
            check("What is '5' + 1 in JavaScript?", ["6", "'51'", "NaN", "an error"], 1, "With a string, + concatenates."),
          ],
        },
        {
          id: "logic-loops",
          title: "Operators, decisions and loops",
          minutes: 25,
          blocks: [
            text("## Comparisons and truthiness\n\n```js\n0 == ''        // true  (loose: converts types)\n0 === ''       // false (strict: no conversion)  → always use === and !==\n```\n\n**Falsy** values: `false`, `0`, `''`, `null`, `undefined`, `NaN`. Everything else is truthy, including `'0'` and `[]`.\n\n```js\nconst name = input || 'Guest';     // falls back on any falsy value (also '' and 0)\nconst count = saved ?? 0;          // falls back only on null or undefined\nconst city = user?.address?.city;  // undefined instead of an error if something is missing\n```\n\n## Decisions\n\n```js\nif (age >= 18) { … } else if (age >= 16) { … } else { … }\nconst label = isOpen ? 'Open' : 'Closed';\nswitch (type) { case 'full': … break; default: … }\n```"),
            text("## Loops\n\n```js\nfor (const job of jobs) { console.log(job.title); }          // values of an array\nfor (const [key, value] of Object.entries(counts)) { … }     // object entries\nfor (let i = 0; i < 3; i++) { … }                            // counting\nwhile (queue.length > 0) { handle(queue.shift()); }\n```\n\nUse `break` to stop a loop and `continue` to skip to the next item. For transforming arrays, the methods in lesson 4 (`map`, `filter`) are usually clearer than loops."),
            check("Which expression keeps a saved value of 0 instead of replacing it?", ["saved || 10", "saved ?? 10", "saved && 10", "!saved"], 1, "?? only replaces null and undefined."),
          ],
        },
      ],
    },
    {
      id: "functions-and-data",
      title: "Functions and data",
      lessons: [
        {
          id: "functions-closures",
          title: "Functions, scope and closures",
          minutes: 25,
          blocks: [
            text("## Three ways to write a function\n\n```js\nfunction total(price, quantity = 1) {          // declaration, default parameter\n  return price * quantity;\n}\nconst tax = function (amount) { return amount * 0.06; };   // expression\nconst double = (n) => n * 2;                    // arrow function, implicit return\nconst sum = (...numbers) => numbers.reduce((a, b) => a + b, 0);   // rest parameter\n```\n\nFunctions are values: you can store them, pass them to other functions (**callbacks**) and return them.\n\n## Scope\n\n`let` and `const` are **block-scoped**: they exist only inside the `{ }` where they are declared. Inner code can read outer variables, not the other way round."),
            text("## Closures\n\nA function remembers the variables around it when it was created:\n\n```js\nfunction counter() {\n  let count = 0;\n  return () => ++count;\n}\nconst next = counter();\nnext(); // 1\nnext(); // 2  (count lives on inside the closure)\n```\n\nClosures power private state, event handlers and many library patterns. Angular's signals and React's hooks rely on the same idea.\n\n**Arrow functions and this:** arrow functions do not have their own `this`; they use the surrounding one. That makes them good for callbacks inside classes and poor as object methods that need `this`."),
            check("After const next = counter(); next(); next(); what does the third next() return?", ["1", "2", "3", "undefined"], 2, "The closure keeps count between calls."),
          ],
        },
        {
          id: "arrays-objects",
          title: "Arrays and objects",
          minutes: 25,
          blocks: [
            text("## Array methods\n\n```js\nconst jobs = [\n  { title: 'Nurse', pay: 72000, remote: false },\n  { title: 'Developer', pay: 95000, remote: true },\n  { title: 'Electrician', pay: 64000, remote: false },\n];\n\njobs.map((j) => j.title);                  // ['Nurse', 'Developer', 'Electrician']\njobs.filter((j) => j.remote);              // only remote jobs\njobs.find((j) => j.pay > 90000);           // first match or undefined\njobs.some((j) => j.remote);                // true\njobs.reduce((sum, j) => sum + j.pay, 0);   // 231000\njobs.toSorted((a, b) => b.pay - a.pay);    // new sorted array (sort() changes the original)\nObject.groupBy(jobs, (j) => (j.remote ? 'remote' : 'onsite'));\n```\n\n`map`, `filter` and `toSorted` return **new** arrays and leave the original alone, which matters with signals and frameworks."),
            text("## Objects, spread and destructuring\n\n```js\nconst job = { title: 'Nurse', pay: 72000, location: { city: 'Laurel' } };\n\nconst { title, pay } = job;                      // destructuring\nconst { location: { city } } = job;\nconst raised = { ...job, pay: 75000 };           // copy with a change\nconst all = [...jobsA, ...jobsB];                // join arrays\nconst keys = Object.keys(job);                   // ['title', 'pay', 'location']\n\nconst text = JSON.stringify(job);                // to send or store\nconst back = JSON.parse(text);\nconst deep = structuredClone(job);               // full deep copy\n```\n\nSpread copies only one level deep; nested objects are shared. Use `structuredClone` for a deep copy."),
            check("Which method returns a new array containing only the items that pass a test?", ["map", "filter", "find", "reduce"], 1, "filter keeps matching items."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("values", "easy", "Which keyword should you use by default for variables?", ["var", "let", "const", "def"], 2, "const unless the value must be reassigned."),
    tf("values", "medium", "const prevents changing properties inside an object.", false, "const prevents reassignment of the variable, not mutation of the object."),
    mc("values", "medium", "What is typeof null?", ["'null'", "'object'", "'undefined'", "'none'"], 1, "A long-standing JavaScript quirk."),
    mc("values", "medium", "Which creates a string with an embedded value?", ["'Hi ${name}'", "`Hi ${name}`", "\"Hi {name}\"", "'Hi' + {name}"], 1, "Template literals use backticks."),
    mc("values", "medium", "What is Number('abc')?", ["0", "NaN", "undefined", "an error"], 1, "Text that is not a number converts to NaN."),
    mc("logic", "easy", "Which operator compares without type conversion?", ["==", "===", "=", "!="], 1, "Strict equality."),
    ms("logic", "medium", "Which values are falsy?", ["0", "''", "'0'", "null"], [0, 1, 3], "'0' is a non-empty string, so it is truthy."),
    mc("logic", "medium", "What does user?.address?.city return if address is missing?", ["An error", "undefined", "null", "''"], 1, "Optional chaining stops at a missing value."),
    mc("logic", "medium", "Which loop goes through the values of an array?", ["for...in", "for...of", "while...of", "foreach"], 1, "for...of iterates values; for...in iterates keys."),
    tf("logic", "medium", "value ?? 'default' replaces only null and undefined.", true, "Unlike ||, it keeps 0 and ''."),
    mc("functions", "easy", "Which is an arrow function?", ["function f() {}", "const f = () => {}", "def f():", "f => function"], 1, "Arrow syntax."),
    mc("functions", "medium", "What is a closure?", ["A function that remembers the variables of where it was created", "A closed bracket", "A finished loop", "A private class"], 0, "Closures keep access to their surrounding scope."),
    mc("functions", "medium", "What does (...numbers) in a parameter list do?", ["Spreads an array", "Collects all remaining arguments into an array", "Makes the parameter optional", "Nothing"], 1, "Rest parameters gather arguments."),
    tf("functions", "medium", "let and const variables are block-scoped.", true, "They exist only inside their { } block."),
    mc("functions", "hard", "Why are arrow functions a poor choice for object methods that use this?", ["They are slower", "They do not have their own this", "They cannot return values", "They are not allowed in objects"], 1, "Arrow functions use the surrounding this."),
    mc("data", "easy", "Which method creates a new array by transforming each item?", ["filter", "map", "find", "forEach"], 1, "map returns transformed items."),
    mc("data", "medium", "What does jobs.reduce((s, j) => s + j.pay, 0) return?", ["An array", "The total of all pay values", "The first job", "The number of jobs"], 1, "reduce combines items into one value."),
    mc("data", "medium", "Which sorts without changing the original array?", ["sort()", "toSorted()", "order()", "reverse()"], 1, "toSorted returns a new array."),
    mc("data", "medium", "How do you copy an object and change one property?", ["Object.copy(job, {pay})", "{ ...job, pay: 75000 }", "job.pay = 75000", "clone(job)"], 1, "Spread then override."),
    mc("data", "medium", "Which makes a full deep copy of a plain object?", ["{ ...obj }", "structuredClone(obj)", "Object.assign({}, obj)", "obj.slice()"], 1, "Spread and assign copy only one level."),
  ],
};
