import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 6,
  id: "angular21-testing-firebase-deploy",
  title: "Testing, Firebase and Deployment with Angular 21",
  summary: "Course 6 of 6 in the Zebron Angular 21 Developer Program. Test with Vitest, connect Angular to Firebase the way Zebron does, build and deploy to Firebase App Hosting, and keep the app current.",
  description: "The last course turns an Angular app into a running product. You write unit tests with Vitest (Angular 21's default), connect to Firebase Authentication, Firestore and Cloud Functions with signals, build for production, deploy through Firebase App Hosting, and keep up with new Angular versions using `ng update`, migrations and the Angular MCP server.\n\nEverything here mirrors how Zebron itself is built and shipped.\n\nEach lesson ends with a quick check. The final exam is drawn from the **Testing, Firebase and Deployment with Angular 21** quiz in the Test Center. Passing all six final exams unlocks the program certification exam.",
  level: "advanced",
  cover: "slate",
  outcomes: ["Write and run Vitest unit tests for components and services", "Connect Angular to Firebase Authentication, Firestore and Cloud Functions using signals", "Explain why security rules and server functions, not the browser, protect data", "Build for production and deploy with Firebase App Hosting and the Firebase CLI", "Upgrade with ng update and the built-in migrations"],
  skills: ["Vitest", "TestBed", "Firebase", "Cloud Functions", "Firebase App Hosting", "ng update"],
  quiz: {"name": "Testing, Firebase and Deployment with Angular 21", "slug": "angular21-testing-firebase-deploy", "description": "Practice questions for Course 6 of the Angular 21 Developer Program: Vitest, Firebase, building, deploying and upgrading.", "tags": ["angular", "angular-21", "firebase", "testing"]},
  topics: [{"key": "testing", "name": "Testing with Vitest", "description": "ng test, describe/it/expect, TestBed, whenStable and mocks."}, {"key": "firebase", "name": "Angular with Firebase", "description": "Modular SDK, auth state as signals, Firestore, callable functions and rules."}, {"key": "deploy", "name": "Building and deploying", "description": "ng build output, budgets, App Hosting and the Firebase CLI."}, {"key": "upgrades", "name": "Staying current", "description": "ng update, migrations, the MCP server and version support."}],
  modules: [
    {
      id: "quality-and-data",
      title: "Tests and data",
      lessons: [
        {
          id: "vitest",
          title: "Testing with Vitest",
          minutes: 25,
          blocks: [
            text("## Running tests\n\n```bash\nng test            # Angular 21 projects run Vitest through the CLI\nnpx vitest run     # Zebron runs Vitest directly: npm run test:unit\n```\n\n## A pure function or service\n\n```ts\nimport { describe, expect, it } from 'vitest';\n\ndescribe('formatMinutes', () => {\n  it('shows minutes under an hour', () => {\n    expect(formatMinutes(45)).toBe('45 min');\n  });\n  it('shows hours above an hour', () => {\n    expect(formatMinutes(90)).toBe('1.5 h');\n  });\n});\n```\n\nTest logic in plain functions where you can; they are the fastest and clearest tests. Zebron's `tests/unit` folder is mostly this kind (application lists, help-assistant settings, guide articles)."),
            text("## A component\n\n```ts\nimport { TestBed } from '@angular/core/testing';\n\ndescribe('Cart', () => {\n  it('adds an item', async () => {\n    const fixture = TestBed.createComponent(Cart);\n    await fixture.whenStable();\n\n    fixture.nativeElement.querySelector('button').click();\n    await fixture.whenStable();\n\n    expect(fixture.nativeElement.textContent).toContain('Items: 1');\n  });\n});\n```\n\nIn a zoneless app, `await fixture.whenStable()` lets Angular finish rendering. Replace dependencies with fakes:\n\n```ts\nTestBed.configureTestingModule({\n  providers: [{ provide: JobApi, useValue: { list: vi.fn(() => of([])) } }],\n});\n```\n\nExisting Jasmine tests can be converted with `ng generate refactor-jasmine-vitest`; tests using `fakeAsync` need rewriting by hand."),
            check("In a zoneless Angular 21 component test, what do you await after an interaction?", ["fixture.detectChanges() only", "fixture.whenStable()", "setTimeout", "TestBed.reset()"], 1, "whenStable waits until Angular has finished updating."),
          ],
        },
        {
          id: "angular-and-firebase",
          title: "Angular with Firebase",
          minutes: 30,
          blocks: [
            text("## Initialise once\n\n```ts\n// core/services/firebase-config.ts (as in Zebron)\nimport { initializeApp } from 'firebase/app';\nimport { getAuth } from 'firebase/auth';\nimport { getFirestore } from 'firebase/firestore';\nimport { getFunctions } from 'firebase/functions';\n\nexport const firebaseApp = initializeApp(firebaseConfig);\nexport const firebaseAuth = getAuth(firebaseApp);\nexport const firestore = getFirestore(firebaseApp);\nexport const firebaseFunctions = getFunctions(firebaseApp, 'us-central1');\n```\n\nThe web config (API key, project id) is public; it identifies the project. Security comes from Authentication, **security rules** and **App Check**, not from hiding the config.\n\n## Sign-in state as a signal\n\n```ts\n@Injectable({ providedIn: 'root' })\nexport class AuthService {\n  private readonly current = signal<User | null>(null);\n  readonly user = this.current.asReadonly();\n  readonly loading = signal(true);\n\n  constructor() {\n    onAuthStateChanged(firebaseAuth, (user) => {\n      this.current.set(user);\n      this.loading.set(false);\n    });\n  }\n}\n```"),
            text("## Firestore into signals\n\n```ts\nreadonly links = signal<Link[]>([]);\n\nconstructor() {\n  const stop = onSnapshot(collection(firestore, 'adminLinks'), (snapshot) =>\n    this.links.set(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Link, 'id'>) }))),\n  );\n  inject(DestroyRef).onDestroy(stop);       // stop listening when the component goes\n}\n```\n\n`getDoc`/`getDocs` read once; `onSnapshot` keeps the data live. `getCountFromServer` counts without downloading documents.\n\n## Trusted work in Cloud Functions\n\n```ts\nconst call = httpsCallable<{ organizationId: string }, { status: string }>(firebaseFunctions, 'getOrganizationAccessStatus');\nconst { status } = (await call({ organizationId })).data;\n```\n\nSending email, taking payments, using AI keys, grading exams and changing other people's data run in functions, which check `request.auth` themselves. **The browser is never trusted:** rules decide what each user may read and write, and functions do everything else."),
            check("Why is it acceptable for the Firebase web config, including the API key, to be in the browser code?", ["It is encrypted", "It only identifies the project; rules, authentication and App Check provide the security", "Browsers hide it", "It expires daily"], 1, "The web API key is an identifier, not a secret."),
          ],
        },
      ],
    },
    {
      id: "ship-and-maintain",
      title: "Ship and maintain",
      lessons: [
        {
          id: "build-and-deploy",
          title: "Building and deploying",
          minutes: 25,
          blocks: [
            text("## Production build\n\n```bash\nng build\n```\n\nThe output goes to `dist/<project>/`: `browser/` (files for the browser) and, with SSR, `server/` (the Node server, started with `node dist/<project>/server/server.mjs`). The build is optimised, hashed for caching and checked against **budgets**.\n\nSettings that differ by environment can be handled with `fileReplacements` in `angular.json`, or read at run time from the server.\n\n## Firebase App Hosting (Zebron's setup)\n\n1. In the Firebase console, create an App Hosting backend and connect the GitHub repository and branch (`master`).\n2. Every push builds the app on Google Cloud and releases it on Cloud Run.\n3. `apphosting.yaml` sets instances (Zebron caps at 20), memory, environment variables and secrets.\n4. Roll back in the console under App Hosting → Rollouts."),
            text("## Everything else deploys with the Firebase CLI\n\n```bash\nnpx firebase deploy --only firestore:rules\nnpx firebase deploy --only firestore:indexes\nnpx firebase deploy --only storage\nnpm --prefix functions run build\nnpx firebase deploy --only functions:getControlCenterSummary\n```\n\n**Deploy order for a change touching several parts:** functions first (new server code the app will call), then rules and indexes, then push the website.\n\n## After deploying\n\n- Open the site and the pages you changed.\n- Check Functions → Logs and the Control Center (Overview, Monitoring).\n- Keep budget alerts on so a mistake cannot become a large bill."),
            check("How does Zebron's website get deployed?", ["firebase deploy --only hosting from a laptop", "Pushing to master; Firebase App Hosting builds and releases it", "Uploading the dist folder by FTP", "ng deploy"], 1, "App Hosting builds from GitHub on every push to master."),
          ],
        },
        {
          id: "staying-current",
          title: "Upgrading and staying current",
          minutes: 20,
          blocks: [
            text("## ng update\n\n```bash\nng update                                   # what can be updated\nng update @angular/core @angular/cli        # one major version at a time\nng update @angular/material\n```\n\n`ng update` changes your code with **migrations** where APIs changed. Check the interactive guide at angular.dev/update-guide before a major upgrade, update one major version at a time, run the tests and the build after each.\n\n## Useful migrations\n\n```bash\nng generate @angular/core:control-flow           # *ngIf/*ngFor → @if/@for\nng generate @angular/core:inject                 # constructor injection → inject()\nng generate @angular/core:signal-input-migration # @Input → input()\nng generate @angular/core:output-migration       # @Output → output()\nng generate @angular/core:ngclass-to-class-migration\n```"),
            text("## Releases and support\n\nAngular ships a major version about every six months (May and November). Each major is actively supported for six months, then gets long-term support (security and critical fixes) for twelve more. Angular 22 followed 21 in 2026 and made the Resource APIs and Signal Forms stable.\n\n## AI help that knows current Angular\n\nRun the Angular CLI's **MCP server** (`npx @angular/cli mcp`, already in Zebron's `.vscode/mcp.json`) so AI assistants in your editor read the current documentation and best practices instead of guessing from older versions.\n\n## Where to keep learning\n\n- **angular.dev:** guides, tutorials and the API reference.\n- **Angular DevTools** in Chrome: inspect components and signals.\n- **This program's Knowledge Center articles:** \"Tools for building Zebron\", \"Libraries and frameworks in Zebron\" and \"Assembling an app like Zebron, step by step\"."),
            check("What is the safe way to move an app two major versions forward?", ["Edit package.json to the newest versions", "Run ng update one major version at a time, testing and building after each", "Delete node_modules and reinstall", "Only update @angular/core"], 1, "Migrations are written for one-major steps."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("testing", "easy", "Which test runner do new Angular 21 projects use by default?", ["Karma", "Jest", "Vitest", "Protractor"], 2, "Vitest is the default since Angular 21."),
    mc("testing", "medium", "In zoneless component tests, what lets Angular finish rendering before you assert?", ["await fixture.whenStable()", "tick()", "flush()", "setTimeout(0)"], 0, "whenStable resolves when pending work is done."),
    mc("testing", "medium", "How do you replace a real service with a fake in a component test?", ["Delete the service", "providers: [{ provide: RealService, useValue: fake }] in TestBed", "Edit app.config.ts", "Use a different selector"], 1, "Override the provider in the testing module."),
    tf("testing", "medium", "Tests that use fakeAsync can be converted from Jasmine to Vitest automatically without changes.", false, "fakeAsync tests must be rewritten by hand."),
    mc("firebase", "medium", "What keeps Firestore data private?", ["Hiding the web config", "Security rules (and server functions for trusted work)", "Route guards", "Minified code"], 1, "Rules are enforced by Firestore for every request."),
    mc("firebase", "medium", "Which Firestore call keeps a list updated live?", ["getDocs", "onSnapshot", "getCountFromServer", "setDoc"], 1, "onSnapshot listens for changes."),
    ms("firebase", "medium", "Which tasks belong in Cloud Functions rather than the browser?", ["Sending email with an API key", "Grading an exam", "Showing a list the user may read", "Taking a payment"], [0, 1, 3], "Reading permitted data can happen in the browser under rules."),
    mc("firebase", "hard", "How should a component stop an onSnapshot listener when it is destroyed?", ["It stops by itself", "Call the returned unsubscribe function in DestroyRef.onDestroy", "Reload the page", "Set the signal to null"], 1, "onSnapshot returns an unsubscribe function."),
    mc("deploy", "easy", "Which command makes a production build?", ["ng serve --prod", "ng build", "ng deploy", "npm run start"], 1, "ng build produces the optimised output in dist/."),
    mc("deploy", "medium", "With SSR, what does the server folder in dist contain?", ["Images only", "The Node server that renders pages", "Firestore rules", "Test reports"], 1, "dist/<project>/server holds server.mjs."),
    ord("deploy", "medium", "Put this multi-part release in a safe order.", ["Deploy the Cloud Functions the new code calls", "Deploy Firestore rules and indexes", "Push the website to master"], "Server pieces first so the new website never calls something that is not there yet."),
    tf("deploy", "medium", "apphosting.yaml can cap how many server instances App Hosting runs.", true, "maxInstances limits cost and load."),
    mc("upgrades", "medium", "How often does Angular release a new major version?", ["Every month", "About every six months", "Every two years", "Only when needed"], 1, "Majors come about every six months."),
    mc("upgrades", "medium", "Which command converts @Input() decorators to signal inputs?", ["ng generate @angular/core:signal-input-migration", "ng update inputs", "ng add signals", "npm run migrate-inputs"], 0, "The core package ships a signal input migration."),
    st("upgrades", "medium", "Which ng command upgrades Angular packages and runs their migrations? (one word after ng)", ["update", "ng update"], "ng update applies version changes and code migrations."),
    mc("testing", "medium", "Which Vitest function creates a mock function?", ["vi.fn()", "jest.fn()", "mock()", "spyOn() only"], 0, "vi.fn() creates a mock in Vitest."),
    mc("testing", "medium", "Which command converts Jasmine tests to Vitest?", ["ng generate refactor-jasmine-vitest", "ng update vitest", "npm run vitest-migrate", "ng add vitest"], 0, "The CLI provides a refactor schematic."),
    mc("firebase", "medium", "How does a component call a Cloud Function named getOrganizationAccessStatus?", ["fetch('/getOrganizationAccessStatus')", "httpsCallable(firebaseFunctions, 'getOrganizationAccessStatus')", "Firestore getDoc", "inject(HttpClient).get()"], 1, "httpsCallable wraps a callable function."),
    mc("deploy", "medium", "Where do you roll back a bad website release on App Hosting?", ["GitHub settings", "Firebase console → App Hosting → Rollouts", "angular.json", "Firestore"], 1, "Rollouts list releases you can return to."),
    mc("upgrades", "medium", "How long does each Angular major get long-term support after its six months of active support?", ["None", "Twelve months", "Five years", "One month"], 1, "Six months active plus twelve months LTS."),
    mc("upgrades", "medium", "What does the Angular CLI MCP server give AI assistants?", ["A faster build", "Access to current Angular documentation and best practices", "Database access", "Hosting"], 1, "It lets assistants follow current Angular guidance."),
  ],
};
