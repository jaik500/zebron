import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 5,
  id: "angular21-ui-performance-ssr",
  title: "UI, Performance and Server Rendering in Angular 21",
  summary: "Course 5 of 6 in the Zebron Angular 21 Developer Program. Style apps with Angular Material and Tailwind, make them fast with @defer and optimized images, render on the server with hydration, and build accessible interfaces.",
  description: "A good application looks consistent, loads fast, appears in search results and works for everyone. This course covers Angular Material and Tailwind CSS (Zebron uses both), Angular Aria, deferrable views (`@defer`), `NgOptimizedImage`, server-side rendering with hydration and incremental hydration, and an accessibility checklist.\n\nEach lesson ends with a quick check. The final exam is drawn from the **UI, Performance and Server Rendering in Angular 21** quiz in the Test Center.",
  level: "advanced",
  cover: "violet",
  outcomes: ["Add Angular Material and Tailwind CSS 4 and use them together", "Defer heavy parts of a page with @defer triggers and placeholders", "Serve images efficiently with NgOptimizedImage", "Set up SSR with render modes, hydration and event replay, and keep browser-only code safe", "Check a page against an accessibility checklist"],
  skills: ["Angular Material", "Tailwind CSS", "@defer", "NgOptimizedImage", "SSR and hydration", "Accessibility"],
  quiz: {"name": "UI, Performance and Server Rendering in Angular 21", "slug": "angular21-ui-performance-ssr", "description": "Practice questions for Course 5 of the Angular 21 Developer Program: Material, Tailwind, @defer, images, SSR and accessibility.", "tags": ["angular", "angular-21", "ssr", "performance"]},
  topics: [{"key": "ui", "name": "Material, Tailwind and Angular Aria", "description": "Component libraries, utility CSS and headless accessible directives."}, {"key": "performance", "name": "Performance", "description": "@defer, NgOptimizedImage, lazy routes and budgets."}, {"key": "ssr", "name": "Server-side rendering and hydration", "description": "Render modes, hydration, event replay, incremental hydration and browser-only code."}, {"key": "a11y", "name": "Accessibility", "description": "Semantic HTML, labels, focus, announcements and contrast."}],
  modules: [
    {
      id: "look-and-speed",
      title: "Look and speed",
      lessons: [
        {
          id: "material-tailwind-aria",
          title: "Angular Material, Tailwind CSS and Angular Aria",
          minutes: 25,
          blocks: [
            text("## Angular Material\n\n```bash\nng add @angular/material\n```\n\nThe schematic adds the package, a theme and fonts. Import only the components you use:\n\n```ts\nimports: [MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],\n```\n\n```html\n<button mat-flat-button>Save</button>\n<mat-form-field appearance=\"outline\">\n  <mat-label>Email</mat-label>\n  <input matInput type=\"email\" />\n</mat-form-field>\n```\n\nSet app-wide defaults once. Zebron does this in `app.config.ts`:\n\n```ts\n{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline', subscriptSizing: 'dynamic' } }\n```"),
            text("## Tailwind CSS 4\n\n```bash\nnpm install tailwindcss @tailwindcss/postcss postcss\n```\n\n`.postcssrc.json`:\n\n```json\n{ \"plugins\": { \"@tailwindcss/postcss\": {} } }\n```\n\n`styles.scss` (or `styles.css`):\n\n```scss\n@use \"tailwindcss\";\n```\n\nThen use utility classes in templates: `class=\"flex items-center gap-3 rounded-xl p-4\"`. Angular 21's `ng new` can set Tailwind up for you. Zebron uses Material for interactive controls and Tailwind for layout and spacing; to override Material styles from Tailwind, use the `!` prefix (`!rounded-xl`).\n\n## Angular Aria (developer preview)\n\n`@angular/aria` provides **headless** directives (behaviour and accessibility without styles) for patterns such as tabs, menus, listboxes and accordions. Use it when you need your own look with correct keyboard support and ARIA attributes. It is in developer preview in Angular 21."),
            check("What does 'headless' mean for Angular Aria's directives?", ["They only run on the server", "They provide behaviour and accessibility without any styles", "They have no TypeScript API", "They are for command-line tools"], 1, "Headless components give interaction and ARIA; you supply the look."),
          ],
        },
        {
          id: "performance",
          title: "Performance: @defer, images and budgets",
          minutes: 25,
          blocks: [
            text("## @defer\n\n```html\n@defer (on viewport) {\n  <app-comments [postId]=\"post().id\" />\n} @placeholder (minimum 300ms) {\n  <p>Comments</p>\n} @loading (after 100ms; minimum 500ms) {\n  <app-spinner />\n} @error {\n  <p>Comments could not load.</p>\n}\n```\n\nThe code for everything inside `@defer` goes into a separate file and downloads only when the trigger fires:\n\n| Trigger | Loads when… |\n| --- | --- |\n| `on idle` (default) | the browser is idle |\n| `on viewport` | the placeholder scrolls into view |\n| `on interaction` | the user clicks or types in the placeholder |\n| `on hover` | the pointer is over the placeholder |\n| `on timer(2s)` | after a delay |\n| `on immediate` | right after the page renders |\n| `when condition()` | a condition becomes true |\n\n`prefetch on idle` downloads early but renders later. Angular 21 also lets `on viewport` take options such as `rootMargin`."),
            text("## Images\n\n```ts\nimports: [NgOptimizedImage]\n```\n\n```html\n<img ngSrc=\"/images/blog/food.svg\" width=\"1200\" height=\"630\" alt=\"…\" priority />\n```\n\n`NgOptimizedImage` requires width and height (no layout jumps), lazy-loads by default, and warns about common mistakes. Mark the main image at the top of the page `priority`.\n\n## Other wins\n\n- Lazy routes (`loadComponent`) for every page.\n- `OnPush` and signals so only changed components re-render.\n- `track` in every `@for`.\n- **Budgets** in `angular.json` fail the build when bundles grow too large.\n- Measure with Lighthouse and Chrome's Performance panel before and after a change."),
            check("Which @defer trigger loads content when its placeholder scrolls into view?", ["on idle", "on viewport", "on hover", "on immediate"], 1, "on viewport uses an IntersectionObserver on the placeholder."),
          ],
        },
      ],
    },
    {
      id: "server-and-access",
      title: "Server rendering and accessibility",
      lessons: [
        {
          id: "ssr-hydration",
          title: "Server-side rendering and hydration",
          minutes: 25,
          blocks: [
            text("## Why render on the server\n\nWith SSR the server sends finished HTML, so the first view appears quickly and search engines can read the page. The browser then **hydrates**: Angular attaches to the existing HTML instead of rebuilding it.\n\n```bash\nng new my-app --ssr          # new app\nng add @angular/ssr          # existing app\n```\n\nThis adds `server.ts` (an Express server), `main.server.ts`, `app.config.server.ts` and `app.routes.server.ts`.\n\n## Render modes per route\n\n```ts\n// app.routes.server.ts\nimport { RenderMode, ServerRoute } from '@angular/ssr';\n\nexport const serverRoutes: ServerRoute[] = [\n  { path: '', renderMode: RenderMode.Prerender },        // built once at build time\n  { path: 'admin/**', renderMode: RenderMode.Client },   // browser only\n  { path: '**', renderMode: RenderMode.Server },          // rendered per request\n];\n```"),
            text("## Hydration and event replay\n\n```ts\n// app.config.ts\nprovideClientHydration(withEventReplay())\n```\n\n**Event replay** records clicks that happen before hydration finishes and replays them after, so early clicks are not lost. Zebron uses both.\n\n**Incremental hydration** goes further: add `withIncrementalHydration()` and parts of the page stay as plain HTML until a trigger fires:\n\n```html\n@defer (hydrate on viewport) {\n  <app-comments />\n}\n```\n\n## Browser-only code\n\nThe server has no `window`, `document` or `localStorage`. Run browser-only code after rendering, or guard it:\n\n```ts\nafterNextRender(() => {\n  this.chart = new Chart(this.canvas().nativeElement, …);\n});\n\nif (isPlatformBrowser(inject(PLATFORM_ID))) { … }\n```\n\nWrap storage access in try/catch, as Zebron's links and audit components do."),
            check("What does withEventReplay() do?", ["Records clicks made before hydration finishes and replays them afterwards", "Replays HTTP requests on the server", "Undoes user actions", "Records a video of the session"], 0, "Event replay keeps early interactions from being lost."),
          ],
        },
        {
          id: "accessibility",
          title: "Accessibility checklist",
          minutes: 20,
          blocks: [
            text("## Build it in, check it every time\n\n1. **Use the right element:** `<button>` for actions, `<a>` for navigation, headings in order (`h1`, `h2`, …), lists for lists.\n2. **Label everything:** each input has a `<label>`; icon-only buttons get `aria-label`.\n3. **Keyboard:** every action works with Tab, Enter, Space and Escape; focus is visible (`:focus-visible`).\n4. **Focus management:** when a dialog opens, move focus into it and back when it closes (Material dialogs and the CDK `FocusTrap` do this).\n5. **Announce changes:** use `LiveAnnouncer` from `@angular/cdk/a11y`, or `role=\"status\"` / `role=\"alert\"` for messages.\n6. **Contrast:** text at least 4.5:1 against its background; never colour alone.\n7. **Motion:** respect `prefers-reduced-motion`.\n8. **Images:** meaningful `alt`; empty `alt=\"\"` for decoration.\n9. **Page titles:** each route sets a clear title (Zebron's `PageTitleService`, or `title` in the route)."),
            text("## Test it\n\n- Navigate the page with only the keyboard.\n- Run Lighthouse's accessibility audit and Chrome's Accessibility panel.\n- Try a screen reader (NVDA on Windows, VoiceOver on Mac).\n- Zoom to 200% and check nothing overlaps.\n\nZebron publishes an Accessibility page (`/accessibility`) that describes what it supports and how to report a problem."),
            check("An icon-only button shows a trash can. What does it need for screen-reader users?", ["A title on the page", "An aria-label such as 'Delete'", "A red colour", "Nothing"], 1, "Icon-only controls need an accessible name."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("ui", "easy", "Which command adds Angular Material to a project?", ["npm install material", "ng add @angular/material", "ng generate material", "ng update material"], 1, "ng add installs the package and runs its setup schematic."),
    mc("ui", "medium", "With Tailwind CSS 4 in an Angular project, which line in the global stylesheet switches Tailwind on?", ["@tailwind base;", "@use \"tailwindcss\";", "@import tailwind.config.js;", "@apply tailwind;"], 1, "Tailwind 4 is imported as a stylesheet; Zebron uses @use \"tailwindcss\" in styles.scss."),
    tf("ui", "medium", "Angular Aria is in developer preview in Angular 21.", true, "@angular/aria shipped as a developer preview in v21."),
    mc("ui", "medium", "Where should app-wide Material defaults, such as outline form fields, be set?", ["In every component", "In app.config.ts providers", "In index.html", "In angular.json"], 1, "Provide MAT_FORM_FIELD_DEFAULT_OPTIONS once in app.config.ts."),
    mc("performance", "medium", "What is the default @defer trigger?", ["on viewport", "on idle", "on immediate", "on hover"], 1, "Without a trigger, @defer loads on idle."),
    ms("performance", "medium", "Which blocks can follow @defer?", ["@placeholder", "@loading", "@error", "@empty"], [0, 1, 2], "@empty belongs to @for."),
    mc("performance", "medium", "What does NgOptimizedImage require on each image?", ["A CDN", "width and height (or fill)", "A priority attribute", "A WebP file"], 1, "Dimensions prevent layout shifts."),
    tf("performance", "medium", "Budgets in angular.json can fail the build when a bundle grows too large.", true, "Budgets are size limits checked during ng build."),
    mc("ssr", "medium", "Which render mode builds a page once at build time?", ["RenderMode.Server", "RenderMode.Client", "RenderMode.Prerender", "RenderMode.Static"], 2, "Prerender produces static HTML at build time."),
    mc("ssr", "medium", "Which provider turns on hydration with event replay?", ["provideRouter()", "provideClientHydration(withEventReplay())", "provideHttpClient()", "provideServerRendering()"], 1, "Event replay is an option of client hydration."),
    mc("ssr", "hard", "Where should code that uses window or localStorage run in an SSR app?", ["In a field initializer", "Inside afterNextRender or behind isPlatformBrowser", "In app.routes.server.ts", "In main.server.ts"], 1, "The server has no window; run browser-only code after render or in the browser only."),
    tf("ssr", "medium", "Incremental hydration lets parts of a page stay unhydrated until a trigger such as viewport.", true, "@defer (hydrate on …) with withIncrementalHydration()."),
    mc("a11y", "easy", "Which element should perform an action such as Save?", ["<div (click)>", "<button>", "<span>", "<a> without href"], 1, "Buttons are focusable and work with Enter and Space."),
    ms("a11y", "medium", "Which are good accessibility practices?", ["A label for every input", "Visible focus styles", "Using colour alone to show errors", "Announcing status messages with role=status"], [0, 1, 3], "Never rely on colour alone."),
    mc("a11y", "medium", "Which Angular CDK service announces messages to screen readers?", ["FocusTrap", "LiveAnnouncer", "Overlay", "BreakpointObserver"], 1, "LiveAnnouncer from @angular/cdk/a11y."),
    mc("ui", "medium", "How do you override a Material style with a Tailwind class in Zebron?", ["Use the ! prefix, such as !rounded-xl", "Edit node_modules", "Use inline style only", "It cannot be done"], 0, "The important modifier wins over Material's styles."),
    mc("performance", "medium", "What does 'prefetch on idle' do in a @defer block?", ["Renders immediately", "Downloads the code early but renders on the main trigger", "Skips the placeholder", "Disables deferral"], 1, "Prefetching separates download from rendering."),
    mc("performance", "medium", "Which attribute marks the most important image at the top of the page for NgOptimizedImage?", ["lazy", "priority", "eager", "main"], 1, "priority loads it early."),
    mc("ssr", "medium", "Which command adds SSR to an existing Angular app?", ["ng add @angular/ssr", "ng generate ssr", "npm install express", "ng update ssr"], 0, "ng add @angular/ssr adds the server files."),
    mc("a11y", "medium", "What should an icon-only Delete button have?", ["A tooltip only", "An accessible name such as aria-label=\"Delete\"", "A larger icon", "A red background"], 1, "Screen readers need a name."),
    mc("a11y", "medium", "What minimum contrast ratio should normal text have against its background?", ["2:1", "3:1", "4.5:1", "10:1"], 2, "WCAG AA asks for 4.5:1 for normal text."),
  ],
};
