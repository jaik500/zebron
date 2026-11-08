import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 5,
  id: "web-javascript-browser-async",
  title: "JavaScript in the Browser: the DOM, Events and Async Code",
  summary: "Course 5 of 7 in the Zebron Web Foundations Program. Change pages with the DOM, respond to events, load data with fetch, promises and async/await, organise code in modules and classes, and handle errors.",
  description: "This course connects JavaScript to the page. You select and change elements, respond to clicks and form input, load data from APIs with `fetch` and `async`/`await`, store small amounts of data in the browser, organise code with modules and classes, and handle errors so a failed request never breaks the page.\n\nYou will build a small job-search page with plain JavaScript, which is also the best way to understand what frameworks such as Angular do for you.\n\nEach lesson ends with a quick check. The final exam is drawn from the **JavaScript in the Browser** quiz in the Test Center.",
  level: "intermediate",
  cover: "navy",
  outcomes: ["Select, create and change elements safely", "Handle events, including delegation and form submission", "Load data with fetch and async/await, with loading and error states", "Organise code with modules and classes and handle errors"],
  skills: ["DOM", "Events", "fetch", "Promises", "async/await", "ES modules", "Classes"],
  quiz: {"name": "JavaScript in the Browser: the DOM, Events and Async Code", "slug": "web-javascript-browser-async", "description": "Practice questions for Course 5 of the Web Foundations Program: DOM, events, fetch, async, modules and errors.", "tags": ["javascript", "web-foundations", "dom"]},
  topics: [{"key": "dom", "name": "The DOM", "description": "querySelector, creating elements, textContent vs innerHTML, classList and dataset."}, {"key": "events", "name": "Events", "description": "addEventListener, the event object, preventDefault, delegation and forms."}, {"key": "async", "name": "Async code and fetch", "description": "Promises, async/await, fetch, JSON, errors and the event loop basics."}, {"key": "modules", "name": "Modules, classes, storage and errors", "description": "import/export, classes, localStorage and try/catch."}],
  modules: [
    {
      id: "page",
      title: "The page",
      lessons: [
        {
          id: "dom",
          title: "Finding and changing elements",
          minutes: 25,
          blocks: [
            text("## Selecting\n\n```js\nconst list = document.querySelector('#job-list');          // first match or null\nconst cards = document.querySelectorAll('.job-card');       // all matches (NodeList)\nconst title = list?.querySelector('h2');\n```\n\n## Changing\n\n```js\ntitle.textContent = 'Open jobs';            // safe: text only\nlist.classList.add('loaded');               // classes\nlist.classList.toggle('compact', isSmall);\nlist.dataset.count = '12';                  // data-count=\"12\"\ntitle.setAttribute('aria-live', 'polite');\n```\n\n## Creating\n\n```js\nconst li = document.createElement('li');\nli.className = 'job-card';\nli.textContent = job.title;\nlist.append(li);\n```"),
            text("## textContent, not innerHTML, for data\n\n```js\nel.innerHTML = `<b>${job.title}</b>`;   // DANGER if title comes from users\n```\n\nIf `job.title` is `<img src=x onerror=\"stealCookies()\">`, the browser runs it. This is **cross-site scripting (XSS)**, one of the most common web vulnerabilities. Use `textContent` and `createElement` for anything that came from a user or a server. Frameworks such as Angular escape values for you, which is a big reason to use them.\n\nFor many items, build them and append once (or use a `DocumentFragment`) instead of touching the page in a loop."),
            check("Why prefer textContent over innerHTML for user-supplied text?", ["It is faster", "innerHTML can run injected HTML and scripts (XSS)", "textContent supports bold", "innerHTML is deprecated"], 1, "textContent never interprets HTML."),
          ],
        },
        {
          id: "events",
          title: "Events",
          minutes: 25,
          blocks: [
            text("## Listening\n\n```js\nconst button = document.querySelector('#save');\nbutton.addEventListener('click', (event) => {\n  console.log(event.target);       // the element clicked\n  save();\n});\n```\n\nCommon events: `click`, `input` (every keystroke), `change`, `submit`, `keydown`, `focus`, `blur`, `scroll`, `DOMContentLoaded`.\n\n## Forms\n\n```js\nform.addEventListener('submit', async (event) => {\n  event.preventDefault();                       // stop the page reload\n  const data = Object.fromEntries(new FormData(form));   // { name: '…', email: '…' }\n  await send(data);\n});\n```"),
            text("## Delegation\n\nInstead of a listener on every card, listen once on the parent:\n\n```js\nlist.addEventListener('click', (event) => {\n  const button = event.target.closest('button[data-job-id]');\n  if (!button) return;\n  saveJob(button.dataset.jobId);\n});\n```\n\nEvents **bubble** up from the clicked element through its parents, so one listener handles every current and future card. Remove listeners you no longer need with `removeEventListener` or an `AbortController` signal.\n\n**Debounce** expensive work on fast events such as `input` or `scroll`: wait until the user pauses (for example 300 ms) before searching."),
            check("What does event.preventDefault() do in a submit handler?", ["Stops other listeners", "Stops the browser's default action, the page reload", "Clears the form", "Validates the form"], 1, "It cancels the default submission so you can handle it in JavaScript."),
          ],
        },
      ],
    },
    {
      id: "data-and-structure",
      title: "Data and structure",
      lessons: [
        {
          id: "async-fetch",
          title: "Promises, async/await and fetch",
          minutes: 30,
          blocks: [
            text("## Why async\n\nJavaScript runs on one thread. Waiting for the network must not freeze the page, so slow work returns a **promise**: a value that will arrive later (or fail).\n\n```js\nasync function loadJobs() {\n  const response = await fetch('/api/jobs?remote=true');\n  if (!response.ok) throw new Error(`Request failed: ${response.status}`);\n  return response.json();                 // also a promise\n}\n```\n\n`await` pauses this function (not the page) until the promise settles. `fetch` only rejects on network failure; a 404 or 500 still resolves, so **check `response.ok`**."),
            text("## Loading and error states\n\n```js\nasync function showJobs() {\n  status.textContent = 'Loading…';\n  try {\n    const jobs = await loadJobs();\n    render(jobs);\n    status.textContent = `${jobs.length} jobs`;\n  } catch (error) {\n    status.textContent = 'Jobs could not load. Try again.';\n    console.error(error);\n  }\n}\n```\n\nRun independent requests together:\n\n```js\nconst [jobs, places] = await Promise.all([loadJobs(), loadPlaces()]);\nconst results = await Promise.allSettled([a(), b()]);   // never rejects; check each status\n```\n\n**The event loop in one sentence:** synchronous code runs first, then promise callbacks (microtasks), then timers and events (tasks). That is why `setTimeout(fn, 0)` runs after an awaited promise that is already resolved.\n\nPOST JSON with `fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })`."),
            check("fetch('/api/jobs') returns a 404 response. What happens?", ["fetch rejects and goes to catch", "The promise resolves; response.ok is false", "The page reloads", "fetch retries"], 1, "Only network failures reject; check response.ok."),
          ],
        },
        {
          id: "modules-classes-errors",
          title: "Modules, classes, storage and errors",
          minutes: 25,
          blocks: [
            text("## Modules\n\n```js\n// jobs.js\nexport async function loadJobs() { … }\nexport const PAGE_SIZE = 20;\nexport default class JobList { … }\n\n// main.js\nimport JobList, { loadJobs, PAGE_SIZE } from './jobs.js';\n```\n\n```html\n<script type=\"module\" src=\"main.js\"></script>\n```\n\nEach module has its own scope, so names do not clash. Large code can load later with `const { chart } = await import('./chart.js');`.\n\n## Classes\n\n```js\nclass SavedJobs {\n  #ids = new Set();                 // private field\n  toggle(id) { this.#ids.has(id) ? this.#ids.delete(id) : this.#ids.add(id); }\n  get count() { return this.#ids.size; }\n}\n```"),
            text("## Storage\n\n```js\ntry {\n  localStorage.setItem('theme', 'dark');\n  const theme = localStorage.getItem('theme') ?? 'light';\n} catch {\n  // private mode or blocked storage: carry on without it\n}\n```\n\n`localStorage` keeps small strings per site until cleared; `sessionStorage` until the tab closes. Store objects with `JSON.stringify`. Never store passwords or tokens you would not want a script to read.\n\n## Errors\n\n```js\nclass ValidationError extends Error {}\ntry { … } catch (error) {\n  if (error instanceof ValidationError) showMessage(error.message);\n  else throw error;          // do not hide unexpected errors\n} finally {\n  button.disabled = false;   // always runs\n}\n```\n\nShow people a helpful message, log the details for developers, and never leave the page stuck in \"Loading…\"."),
            check("What does <script type=\"module\"> enable?", ["Faster images", "import and export between files, each with its own scope", "Server-side code", "CSS modules"], 1, "Module scripts support import/export and are deferred by default."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("dom", "easy", "Which returns the first element matching a CSS selector?", ["getElementsByClassName", "querySelector", "querySelectorAll", "find"], 1, "querySelector returns the first match or null."),
    mc("dom", "medium", "Which is safe for inserting text that came from a user?", ["innerHTML", "textContent", "outerHTML", "document.write"], 1, "textContent does not interpret HTML."),
    mc("dom", "medium", "What is the name of the attack where injected HTML runs scripts in a page?", ["CSRF", "XSS", "SQL injection", "DDoS"], 1, "Cross-site scripting."),
    mc("dom", "medium", "How do you read data-job-id=\"7\" from an element?", ["el.jobId", "el.dataset.jobId", "el.data('jobId')", "el.getData('job-id')"], 1, "dataset converts data-job-id to jobId."),
    tf("dom", "medium", "classList.toggle('compact', isSmall) adds the class when isSmall is true and removes it when false.", true, "The second argument forces the state."),
    mc("events", "easy", "Which method attaches an event listener?", ["on()", "addEventListener()", "listen()", "bind()"], 1, "addEventListener(type, handler)."),
    mc("events", "medium", "What is event delegation?", ["Listening on a parent and checking event.target", "Passing events to a server", "Cancelling events", "Using inline onclick"], 0, "One listener handles many children thanks to bubbling."),
    mc("events", "medium", "Which turns form fields into a plain object?", ["form.values", "Object.fromEntries(new FormData(form))", "JSON.parse(form)", "form.toObject()"], 1, "FormData plus Object.fromEntries."),
    mc("events", "medium", "Why debounce a search on the input event?", ["To run it on every keystroke", "To wait until the user pauses, avoiding many requests", "To validate", "To block typing"], 1, "Debouncing reduces wasted work."),
    tf("events", "medium", "Events bubble from the target element up through its ancestors.", true, "That is what makes delegation work."),
    mc("async", "easy", "What does await do?", ["Blocks the whole page", "Pauses the async function until the promise settles", "Repeats a request", "Creates a thread"], 1, "Only the function waits; the page stays responsive."),
    mc("async", "medium", "Which should you check after fetch to know whether the request succeeded?", ["response.status === undefined", "response.ok", "response.done", "response.error"], 1, "ok is true for 2xx statuses."),
    mc("async", "medium", "Which runs several requests at the same time and fails if any fails?", ["Promise.all", "Promise.allSettled", "Promise.race only", "for...of with await"], 0, "Promise.all rejects on the first failure; allSettled never rejects."),
    ord("async", "hard", "Put these in the order they run: console.log('A'); setTimeout(() => console.log('C'), 0); Promise.resolve().then(() => console.log('B'));", ["A (synchronous code)", "B (promise microtask)", "C (timer task)"], "Synchronous code first, then microtasks, then tasks."),
    mc("async", "medium", "How do you send JSON in a POST with fetch?", ["fetch(url, data)", "fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })", "fetch.post(url, data)", "fetch(url + '?json=' + data)"], 1, "Set method, header and a string body."),
    mc("modules", "easy", "How do you load a JavaScript module in HTML?", ["<script module>", "<script type=\"module\" src=\"main.js\">", "<module src>", "<import>"], 1, "type=module."),
    mc("modules", "medium", "What does #ids mean in a class?", ["A comment", "A private field", "An id selector", "A static field"], 1, "# fields are private to the class."),
    mc("modules", "medium", "Why wrap localStorage in try/catch?", ["It is slow", "It can throw when storage is blocked or full", "It is asynchronous", "It is deprecated"], 1, "Private modes and quotas can throw."),
    mc("modules", "medium", "Which block always runs after try and catch?", ["else", "finally", "done", "always"], 1, "finally runs either way."),
    tf("modules", "medium", "Each ES module has its own scope, so top-level names do not leak into other files.", true, "Modules avoid global name clashes."),
  ],
};
