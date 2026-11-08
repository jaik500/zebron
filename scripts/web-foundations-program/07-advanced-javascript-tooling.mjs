import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 7,
  id: "web-advanced-javascript-tooling",
  title: "Advanced JavaScript, Tooling, Testing and Web Security",
  summary: "Course 7 of 7 in the Zebron Web Foundations Program. Understand this, prototypes, iterators and generators; make pages fast; use npm, bundlers, linters and Git like a professional; test with Vitest; and defend against common web attacks.",
  description: "The last course takes you from writing code that works to shipping code a team can rely on. It covers how JavaScript objects really work (`this`, prototypes, iterators and generators), performance (debounce and throttle, Web Workers, layout thrashing, measuring), the professional toolchain (npm and semantic versions, bundlers, ESLint and Prettier, Git branches and pull requests), testing with Vitest, and web security basics (XSS, CSRF, CORS, Content-Security-Policy and secrets).\n\nAfter this course you are ready for a framework: the **Angular 21 Developer Program** builds directly on it.\n\nEach lesson ends with a quick check. The final exam is drawn from the **Advanced JavaScript, Tooling, Testing and Web Security** quiz in the Test Center. Passing all seven final exams unlocks the program certification exam.",
  level: "advanced",
  cover: "teal",
  outcomes: ["Explain this, prototypes, iterators and generators", "Find and fix common performance problems", "Use npm, semantic versioning, bundlers, linters and Git branches", "Write unit tests with Vitest", "Defend against XSS and CSRF and configure CORS and CSP sensibly"],
  skills: ["Prototypes", "Generators", "Web performance", "npm", "Vite/esbuild", "ESLint", "Git", "Vitest", "Web security"],
  quiz: {"name": "Advanced JavaScript, Tooling, Testing and Web Security", "slug": "web-advanced-javascript-tooling", "description": "Practice questions for Course 7 of the Web Foundations Program: language internals, performance, tooling, testing and security.", "tags": ["javascript", "web-foundations", "tooling", "security"]},
  topics: [{"key": "internals", "name": "this, prototypes, iterators and generators", "description": "How this is set, the prototype chain, iteration protocols and generators."}, {"key": "performance", "name": "Performance", "description": "Debounce, throttle, Web Workers, layout thrashing, Core Web Vitals and measuring."}, {"key": "tooling", "name": "npm, bundlers, linters and Git", "description": "package.json, semver, lock files, Vite and esbuild, ESLint, Prettier and branches."}, {"key": "testing-security", "name": "Testing and web security", "description": "Vitest, mocks, XSS, CSRF, CORS, CSP and keeping secrets out of the browser."}],
  modules: [
    {
      id: "deeper-js",
      title: "Deeper JavaScript",
      lessons: [
        {
          id: "this-prototypes-generators",
          title: "this, prototypes, iterators and generators",
          minutes: 30,
          blocks: [
            text("## How this is decided\n\n`this` depends on **how a function is called**, not where it is written:\n\n```js\nconst job = { title: 'Nurse', describe() { return this.title; } };\njob.describe();                 // 'Nurse'  (called on job)\nconst fn = job.describe;\nfn();                           // undefined in strict mode (no object)\nfn.call({ title: 'Chef' });     // 'Chef'   (call/apply set this)\nconst bound = job.describe.bind(job);   // always job\n```\n\nArrow functions have no `this` of their own; they use the surrounding one. That is why callbacks in classes are often arrows.\n\n## The prototype chain\n\nObjects inherit through prototypes. `class` is syntax over this mechanism:\n\n```js\nclass Job { constructor(title) { this.title = title; } describe() { return this.title; } }\nconst j = new Job('Nurse');\nObject.getPrototypeOf(j) === Job.prototype;   // true: describe lives on the prototype\n```\n\nLooking up `j.describe` checks `j`, then `Job.prototype`, then `Object.prototype`."),
            text("## Iterators and generators\n\nAnything with a `[Symbol.iterator]` method works with `for...of`, spread and destructuring. Generators make iterators easy:\n\n```js\nfunction* pages(total, size) {\n  for (let start = 0; start < total; start += size) {\n    yield { start, end: Math.min(start + size, total) };\n  }\n}\nfor (const page of pages(95, 20)) console.log(page);   // 5 pages, produced on demand\n\nasync function* stream(url) {            // async generator\n  let next = url;\n  while (next) {\n    const res = await fetch(next).then((r) => r.json());\n    yield* res.items;\n    next = res.next;\n  }\n}\nfor await (const item of stream('/api/jobs')) { … }\n```\n\nGenerators produce values lazily, which is ideal for paging through large data."),
            check("const fn = job.describe; fn(); Why is this undefined (in strict mode)?", ["describe was deleted", "this is set by how the function is called, and fn() has no object", "Arrow functions lose this", "job is frozen"], 1, "Calling without an object gives undefined this in strict mode."),
          ],
        },
        {
          id: "performance",
          title: "Performance",
          minutes: 25,
          blocks: [
            text("## Do less work, less often\n\n```js\nfunction debounce(fn, wait = 300) {\n  let timer;\n  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };\n}\ninput.addEventListener('input', debounce((e) => search(e.target.value)));\n\nfunction throttle(fn, wait = 100) {\n  let last = 0;\n  return (...args) => { const now = Date.now(); if (now - last >= wait) { last = now; fn(...args); } };\n}\nwindow.addEventListener('scroll', throttle(updateProgress), { passive: true });\n```\n\n**Debounce** waits until events stop (search boxes); **throttle** runs at most every N ms (scrolling).\n\n## Avoid layout thrashing\n\nReading layout (`offsetHeight`, `getBoundingClientRect`) after writing styles forces the browser to recalculate. Read everything first, then write, or use `requestAnimationFrame` for visual updates."),
            text("## Heavy work off the main thread\n\n```js\nconst worker = new Worker(new URL('./parse.js', import.meta.url), { type: 'module' });\nworker.postMessage(bigCsvText);\nworker.onmessage = (event) => render(event.data);\n```\n\nA **Web Worker** runs code on another thread, so parsing a large file does not freeze clicks and scrolling.\n\n## Measure, then fix\n\n- **Core Web Vitals:** LCP (largest content appears, aim under 2.5 s), INP (response to input, under 200 ms), CLS (layout shift, under 0.1).\n- Chrome DevTools **Performance** panel and **Lighthouse**.\n- Load less: split code, lazy-load images and routes, compress and cache."),
            check("Which technique fits a search box that should query only after the user stops typing?", ["throttle", "debounce", "a Web Worker", "requestAnimationFrame"], 1, "Debounce waits for a pause."),
          ],
        },
      ],
    },
    {
      id: "professional",
      title: "Working like a professional",
      lessons: [
        {
          id: "tooling",
          title: "npm, bundlers, linters and Git",
          minutes: 25,
          blocks: [
            text("## npm and package.json\n\n```bash\nnpm init -y\nnpm install dayjs            # dependency (ships with the app)\nnpm install -D vitest        # devDependency (only for building/testing)\nnpm run build                # runs \"scripts\": { \"build\": \"…\" }\nnpm audit                    # known vulnerabilities in dependencies\n```\n\n**Semantic versions** are `MAJOR.MINOR.PATCH`: `^21.1.0` accepts any 21.x.x at or above 21.1.0, `~5.9.2` accepts 5.9.x. The **lock file** (`package-lock.json`) records exact versions; commit it so everyone installs the same thing, and use `npm ci` in pipelines.\n\n## Bundlers\n\nBrowsers can load modules directly, but production apps are **bundled**: files combined, unused code removed (tree shaking), minified and split into chunks. **Vite** (built on esbuild and Rollup) is the common choice; Angular's builder uses esbuild and Vite underneath."),
            text("## Linting and formatting\n\n- **ESLint** finds bugs and risky patterns (`npx eslint .`).\n- **Prettier** formats code the same way for everyone.\n- Run both in your editor on save and in the pipeline.\n\n## Git workflow\n\n```bash\ngit switch -c feature/job-alerts      # a branch per change\ngit add -A && git commit -m \"Add job alert emails\"\ngit push -u origin feature/job-alerts # then open a pull request\n```\n\nA **pull request** gets a review and automatic checks (lint, tests, build) before it merges into the main branch. Small, focused pull requests are reviewed faster and break less."),
            check("Why commit package-lock.json?", ["It makes the app faster", "So everyone and the pipeline install exactly the same dependency versions", "npm requires it to run", "It stores passwords"], 1, "The lock file pins exact versions."),
          ],
        },
        {
          id: "testing-security",
          title: "Testing with Vitest and web security",
          minutes: 30,
          blocks: [
            text("## Unit tests with Vitest\n\n```js\n// price.test.js\nimport { describe, expect, it, vi } from 'vitest';\nimport { total, notify } from './price.js';\n\ndescribe('total', () => {\n  it('multiplies price and quantity', () => {\n    expect(total(10, 3)).toBe(30);\n  });\n  it('rejects negative quantities', () => {\n    expect(() => total(10, -1)).toThrow();\n  });\n});\n\nit('calls the sender once', async () => {\n  const send = vi.fn().mockResolvedValue({ ok: true });\n  await notify(send, 'Hi');\n  expect(send).toHaveBeenCalledWith('Hi');\n});\n```\n\nRun with `npx vitest` (watch) or `npx vitest run` (once, as in a pipeline). Test behaviour, not implementation details; one clear expectation per test."),
            text("## Web security essentials\n\n| Threat | What it is | Defence |\n| --- | --- | --- |\n| **XSS** | Injected script runs in your page | Never insert untrusted HTML; use textContent or a framework that escapes; a Content-Security-Policy |\n| **CSRF** | Another site makes the user's browser send a request | SameSite cookies, CSRF tokens, or token-based auth in headers |\n| **CORS errors** | The browser blocks reading another origin's response | The **server** decides with Access-Control-Allow-Origin; it is not a client setting |\n| **Leaked secrets** | API keys in front-end code | Anything in the browser is public: keep secrets on the server (Zebron uses Cloud Functions and Secret Manager) |\n| **Vulnerable packages** | Known bugs in dependencies | npm audit, Dependabot, update regularly |\n\n**Content-Security-Policy** is an HTTP header listing where scripts, styles, images and connections may come from; it stops many XSS attacks even if a bug slips through. Zebron sets one in `src/server.ts` (currently in report-only mode while its list is completed).\n\nAlways validate input **on the server**, use HTTPS everywhere, and give every account the least access it needs."),
            check("Your front-end code needs an API key that must stay secret. Where should the call that uses it run?", ["In the browser, minified", "On a server or cloud function", "In localStorage", "In a hidden input"], 1, "Everything sent to the browser can be read."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("internals", "medium", "What decides the value of this in a regular function?", ["Where the function is written", "How the function is called", "The file name", "The first argument"], 1, "Call site determines this."),
    mc("internals", "medium", "Which method creates a function with this permanently set?", ["call", "apply", "bind", "new"], 2, "bind returns a bound function."),
    mc("internals", "medium", "Where does a class method such as describe() live?", ["On each instance", "On the class's prototype", "In global scope", "In the constructor"], 1, "Methods are shared on the prototype."),
    mc("internals", "medium", "Which keyword produces values from a generator?", ["return", "yield", "emit", "next"], 1, "yield produces the next value."),
    tf("internals", "medium", "Any object with a [Symbol.iterator] method can be used with for...of.", true, "That is the iteration protocol."),
    mc("performance", "medium", "Which technique runs a scroll handler at most once every 100 ms?", ["debounce", "throttle", "memoize", "defer"], 1, "Throttle limits frequency."),
    mc("performance", "medium", "What does a Web Worker do?", ["Caches pages", "Runs code on another thread so the page stays responsive", "Speeds up CSS", "Sends emails"], 1, "Workers run off the main thread."),
    mc("performance", "medium", "What is layout thrashing?", ["Animating with transform", "Alternating style writes and layout reads, forcing repeated recalculation", "Using too many fonts", "Lazy loading images"], 1, "Batch reads, then writes."),
    mc("performance", "medium", "Which Core Web Vital measures how fast the page responds to input?", ["LCP", "CLS", "INP", "TTFB"], 2, "Interaction to Next Paint."),
    tf("performance", "medium", "Passive scroll listeners ({ passive: true }) help scrolling stay smooth.", true, "They promise not to call preventDefault."),
    mc("tooling", "easy", "Which command installs a package only needed for development?", ["npm install pkg", "npm install -D pkg", "npm global pkg", "npm run pkg"], 1, "-D saves it to devDependencies."),
    mc("tooling", "medium", "What does ^21.1.0 accept?", ["Exactly 21.1.0", "Any 21.x.x at or above 21.1.0", "Any version", "Only 21.1.x"], 1, "The caret allows minor and patch updates."),
    mc("tooling", "medium", "Which command installs exactly what the lock file says, as pipelines should?", ["npm install", "npm ci", "npm update", "npm audit"], 1, "npm ci is reproducible."),
    mc("tooling", "medium", "What does tree shaking do?", ["Sorts files", "Removes unused code from the bundle", "Formats code", "Runs tests"], 1, "Dead code elimination."),
    ms("tooling", "medium", "Which are good pull-request habits?", ["Small, focused changes", "Automatic lint, tests and build", "Merging without review to save time", "A clear description"], [0, 1, 3], "Reviews catch problems early."),
    mc("testing-security", "easy", "Which Vitest function creates a mock?", ["vi.fn()", "mock()", "jest.mock only", "spy()"], 0, "vi.fn() creates a mock function."),
    mc("testing-security", "medium", "What is the main defence against XSS?", ["Hiding the source code", "Never inserting untrusted HTML, escaping output and a Content-Security-Policy", "Using HTTPS only", "Minifying JavaScript"], 1, "Escape and restrict what can run."),
    mc("testing-security", "medium", "Who decides whether a browser may read a cross-origin response (CORS)?", ["The browser user", "The server, through Access-Control-Allow-Origin", "The front-end code", "The DNS provider"], 1, "CORS is a server response policy enforced by the browser."),
    tf("testing-security", "medium", "An API key in front-end JavaScript can be kept secret by minifying the code.", false, "Anything shipped to the browser can be read."),
    mc("testing-security", "medium", "Which cookie setting helps prevent CSRF?", ["HttpOnly", "SameSite", "Secure only", "Max-Age"], 1, "SameSite stops cookies being sent on most cross-site requests."),
  ],
};
