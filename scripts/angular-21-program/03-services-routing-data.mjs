import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 3,
  id: "angular21-services-routing-data",
  title: "Services, Routing and Data in Angular 21",
  summary: "Course 3 of 6 in the Zebron Angular 21 Developer Program. Share logic with services and dependency injection, build multi-page apps with the router, protect pages with guards and load data over HTTP.",
  description: "Real applications have many pages, shared logic and data from a server. This course covers dependency injection with `inject()`, the router (lazy pages, parameters, child routes), functional guards and resolvers, `HttpClient` and interceptors, and the experimental `httpResource` for loading data as signals.\n\nExamples come from how Zebron is built: services in `core/services`, lazy pages in `app.routes.ts`, and guards such as `authGuard` and `featureGuard`.\n\nEach lesson ends with a quick check. The final exam is drawn from the **Services, Routing and Data in Angular 21** quiz in the Test Center.",
  level: "intermediate",
  cover: "sky",
  outcomes: ["Create services, inject them with inject() and choose where they are provided", "Define routes, lazy-load pages and read route parameters as inputs", "Protect routes with functional guards and preload data with resolvers", "Call APIs with HttpClient, add interceptors, and load data with httpResource"],
  skills: ["Dependency injection", "Angular Router", "Route guards", "HttpClient", "Interceptors", "httpResource"],
  quiz: {"name": "Services, Routing and Data in Angular 21", "slug": "angular21-services-routing-data", "description": "Practice questions for Course 3 of the Angular 21 Developer Program: dependency injection, routing, guards and HTTP.", "tags": ["angular", "angular-21", "routing", "http"]},
  topics: [{"key": "di", "name": "Services and dependency injection", "description": "@Injectable, inject(), providedIn, injection tokens and provider scope."}, {"key": "routing", "name": "Routing", "description": "Routes, lazy loading, links, parameters as inputs, child routes and redirects."}, {"key": "guards", "name": "Guards and resolvers", "description": "CanActivateFn, UrlTree redirects, canMatch and ResolveFn."}, {"key": "http", "name": "HTTP and httpResource", "description": "HttpClient, interceptors, withFetch and httpResource."}],
  modules: [
    {
      id: "services",
      title: "Services and injection",
      lessons: [
        {
          id: "services-and-di",
          title: "Services and dependency injection",
          minutes: 25,
          blocks: [
            text("## A service\n\nA service holds logic or state that several components share: data access, sign-in state, settings.\n\n```ts\nimport { Injectable, signal } from '@angular/core';\n\n@Injectable({ providedIn: 'root' })        // one instance for the whole app\nexport class SavedJobs {\n  private readonly ids = signal<string[]>([]);\n  readonly count = computed(() => this.ids().length);\n\n  toggle(id: string): void {\n    this.ids.update((list) => list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);\n  }\n}\n```\n\n## Getting it with inject()\n\n```ts\nimport { Component, inject } from '@angular/core';\n\n@Component({ selector: 'app-header', template: `Saved: {{ saved.count() }}` })\nexport class Header {\n  protected readonly saved = inject(SavedJobs);\n}\n```\n\n`inject()` works in field initializers and constructors (an **injection context**). It replaced constructor parameters as the recommended style; migrate with `ng generate @angular/core:inject`."),
            text("## Where a service lives\n\n| Provided in | Instances |\n| --- | --- |\n| `@Injectable({ providedIn: 'root' })` | One for the app, created when first used (tree-shakable). |\n| `providers: [X]` in a **route** | One for that route and its children. |\n| `providers: [X]` in a **component** | One per component instance; destroyed with it. |\n\n## Injection tokens for values\n\n```ts\nexport const API_URL = new InjectionToken<string>('API_URL');\n\n// app.config.ts\nproviders: [{ provide: API_URL, useValue: 'https://api.example.org' }]\n\n// anywhere\nprivate readonly apiUrl = inject(API_URL);\n```\n\nZebron uses tokens such as `ORGANIZATION_REPOSITORY` so pages depend on an interface and the Firestore implementation is chosen in `app.config.ts`."),
            check("Where can you call inject()?", ["Anywhere, including inside a setTimeout callback", "In a field initializer or constructor (an injection context)", "Only in ngOnInit", "Only in app.config.ts"], 1, "inject() needs an injection context such as construction time."),
          ],
        },
      ],
    },
    {
      id: "routing",
      title: "Routing",
      lessons: [
        {
          id: "routes-and-lazy-pages",
          title: "Routes, lazy pages and parameters",
          minutes: 25,
          blocks: [
            text("## Routes\n\n```ts\n// app.routes.ts\nimport { Routes } from '@angular/router';\n\nexport const routes: Routes = [\n  { path: '', loadComponent: () => import('./features/home/home').then((m) => m.Home) },\n  { path: 'jobs', loadComponent: () => import('./features/jobs/job-list').then((m) => m.JobList) },\n  { path: 'jobs/:id', loadComponent: () => import('./features/jobs/job-detail').then((m) => m.JobDetail) },\n  { path: 'learning', redirectTo: '/courses', pathMatch: 'full' },\n  { path: '**', loadComponent: () => import('./shared/not-found').then((m) => m.NotFound) },\n];\n```\n\n```ts\n// app.config.ts\nprovideRouter(routes, withComponentInputBinding())\n```\n\n`loadComponent` downloads a page only when someone visits it (**lazy loading**), so the first page loads fast. Order matters: the first matching route wins, and `**` must be last."),
            text("## Links and parameters\n\n```html\n<nav>\n  <a routerLink=\"/jobs\" routerLinkActive=\"active\">Jobs</a>\n  <a [routerLink]=\"['/jobs', job.id]\">{{ job.title }}</a>\n</nav>\n<router-outlet />\n```\n\nWith `withComponentInputBinding()`, `:id` arrives as an input:\n\n```ts\nexport class JobDetail {\n  readonly id = input.required<string>();       // from /jobs/:id\n  readonly job = computed(() => this.jobs.byId(this.id()));\n}\n```\n\nQuery parameters (`?q=nurse`) and route `data` arrive the same way. In code, navigate with `inject(Router).navigate(['/jobs', id])`.\n\n## Child routes\n\n```ts\n{ path: 'blog', children: [\n  { path: '', loadComponent: … },          // /blog\n  { path: 'manage', loadComponent: … },    // /blog/manage\n  { path: ':postId', loadComponent: … },   // /blog/some-post\n] }\n```"),
            check("Why put the '**' route last?", ["It is required by TypeScript", "The first matching route wins, and ** matches everything", "It loads faster last", "Angular sorts routes alphabetically"], 1, "Routes are matched in order; a wildcard placed early would catch every URL."),
          ],
        },
        {
          id: "guards-and-resolvers",
          title: "Guards and resolvers",
          minutes: 20,
          blocks: [
            text("## A functional guard\n\n```ts\nimport { CanActivateFn, Router } from '@angular/router';\nimport { inject } from '@angular/core';\n\nexport const authGuard: CanActivateFn = () => {\n  const auth = inject(AuthService);\n  return auth.user() ? true : inject(Router).createUrlTree(['/login']);\n};\n```\n\n```ts\n{ path: 'profile', canActivate: [authGuard], loadComponent: … }\n```\n\n- Return `true` to allow, or a **UrlTree** to redirect. Guards can be `async`.\n- `canMatch` decides whether a route is even considered (useful for showing different pages to different users at the same path).\n- Zebron's `featureGuard` reads `data: { featureKey }` and sends visitors to `/feature-unavailable` when the kill switch has an application turned off.\n\n**Guards protect the experience, not the data.** A determined user can call the database directly, so the real protection is in the security rules and server functions."),
            text("## Resolvers\n\nA resolver loads data before the page opens:\n\n```ts\nexport const jobResolver: ResolveFn<Job | null> = (route) =>\n  inject(JobService).get(route.paramMap.get('id')!);\n\n{ path: 'jobs/:id', resolve: { job: jobResolver }, loadComponent: … }\n```\n\nWith input binding the page receives `job` as an input. Resolvers delay navigation until data arrives; for slow data, loading inside the page with a placeholder often feels faster."),
            check("What should a guard return to send the user to /login?", ["false", "A UrlTree such as router.createUrlTree(['/login'])", "The string '/login'", "Nothing"], 1, "Returning a UrlTree cancels the navigation and redirects."),
          ],
        },
      ],
    },
    {
      id: "data",
      title: "Data",
      lessons: [
        {
          id: "http-and-resources",
          title: "HttpClient, interceptors and httpResource",
          minutes: 25,
          blocks: [
            text("## HttpClient\n\nIn Angular 21, `HttpClient` is available without any setup:\n\n```ts\n@Injectable({ providedIn: 'root' })\nexport class JobApi {\n  private readonly http = inject(HttpClient);\n\n  list(): Observable<Job[]> {\n    return this.http.get<Job[]>('/api/jobs');\n  }\n  create(job: NewJob): Observable<Job> {\n    return this.http.post<Job>('/api/jobs', job);\n  }\n}\n```\n\nCall `provideHttpClient(...)` only to customise it, for example to use the Fetch API (needed for SSR streaming, as Zebron does) or to add interceptors:\n\n```ts\nprovideHttpClient(withFetch(), withInterceptors([authInterceptor]))\n```\n\n```ts\nexport const authInterceptor: HttpInterceptorFn = (request, next) => {\n  const token = inject(AuthService).token();\n  return next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request);\n};\n```"),
            text("## httpResource: data as signals (experimental in 21)\n\n```ts\nimport { httpResource } from '@angular/common/http';\n\nexport class JobDetail {\n  readonly id = input.required<string>();\n  readonly job = httpResource<Job>(() => `/api/jobs/${this.id()}`);\n}\n```\n\n```html\n@if (job.isLoading()) { <p>Loading…</p> }\n@else if (job.error()) { <p>Could not load the job.</p> }\n@else if (job.hasValue()) { <h1>{{ job.value().title }}</h1> }\n```\n\nWhen `id()` changes, the request runs again and the old one is cancelled. `reload()` fetches again. Use resources for **reading**; send changes (POST, PUT, DELETE) with `HttpClient`.\n\n`resource()` does the same for any async function (for example a Firestore read). Both are **experimental in Angular 21**, so their API may change; Angular 22 made the resource APIs stable. Zebron calls Firebase directly instead of HTTP for most data (Course 6)."),
            check("Which is the right tool to send a new job to the server with POST?", ["httpResource", "HttpClient.post", "resource with a GET", "toSignal"], 1, "Resources are for reading; use HttpClient for mutations."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("di", "easy", "What does @Injectable({ providedIn: 'root' }) give you?", ["A new instance in every component", "One shared instance for the whole app", "A route-only instance", "Nothing until you add it to providers"], 1, "providedIn: 'root' registers a single, tree-shakable app-wide instance."),
    mc("di", "medium", "Which is the recommended way to get a service in Angular 21?", ["new JobService()", "inject(JobService)", "window.jobService", "@Inject() on a method"], 1, "inject() in a field or constructor is the recommended style."),
    tf("di", "medium", "A service listed in a component's providers array gets a new instance for each instance of that component.", true, "Component-level providers are scoped to the component instance."),
    mc("di", "medium", "How do you provide a plain value such as an API URL for injection?", ["An InjectionToken with useValue", "A global variable", "An @Input", "A pipe"], 0, "new InjectionToken plus { provide, useValue } makes a value injectable."),
    mc("routing", "easy", "Which route property lazy-loads a standalone page?", ["component", "loadComponent", "lazy", "import"], 1, "loadComponent: () => import(...) downloads the page when visited."),
    mc("routing", "medium", "What does withComponentInputBinding() do?", ["Binds forms to routes", "Passes route parameters, query parameters and data to component inputs", "Enables lazy loading", "Adds guards"], 1, "It maps router state onto matching component inputs."),
    mc("routing", "medium", "Which directive adds a CSS class when a link's route is active?", ["routerLink", "routerLinkActive", "routerOutlet", "activeClass"], 1, "routerLinkActive=\"active\" toggles the class."),
    ord("routing", "medium", "Put these routes in a working order.", ["{ path: '', … } (home)", "{ path: 'jobs/:id', … }", "{ path: '**', … } (not found)"], "Specific routes first; the wildcard ** must be last because the first match wins."),
    mc("guards", "medium", "What type is a modern functional guard for canActivate?", ["CanActivateFn", "CanActivate class", "RouteGuard", "GuardFn"], 0, "Functional guards are typed CanActivateFn and can use inject()."),
    tf("guards", "medium", "Route guards are enough to keep data private.", false, "Guards only protect navigation; data must be protected by security rules or the server."),
    mc("guards", "medium", "Which runs before a route is even considered, so another route with the same path can match instead?", ["canActivate", "canMatch", "resolve", "canDeactivate"], 1, "canMatch decides whether the route participates in matching."),
    mc("http", "easy", "In Angular 21, what must you add to use HttpClient with default settings?", ["provideHttpClient() in app.config.ts", "HttpClientModule in imports", "Nothing; it is provided by default", "A proxy file"], 2, "HttpClient is provided in the root injector by default since Angular 21."),
    mc("http", "medium", "Which signal on an httpResource tells you a request is in progress?", ["value()", "isLoading()", "pending()", "busy()"], 1, "httpResource exposes isLoading(), error(), hasValue() and value()."),
    tf("http", "medium", "httpResource is meant for reading data; mutations should use HttpClient.", true, "Resources model reads; send changes with HttpClient methods."),
    mc("http", "hard", "How do you add an Authorization header to every request?", ["Edit each service", "A functional HttpInterceptorFn registered with withInterceptors", "A route guard", "A pipe"], 1, "Interceptors clone and modify each outgoing request."),
    mc("di", "medium", "Which command converts constructor injection to inject()?", ["ng generate @angular/core:inject", "ng update di", "ng add inject", "ng generate service"], 0, "The core package provides an inject migration."),
    mc("routing", "medium", "How do you navigate to /jobs/42 from TypeScript?", ["window.location = '/jobs/42'", "inject(Router).navigate(['/jobs', 42])", "routerLink('/jobs/42')", "history.push('/jobs/42')"], 1, "Router.navigate keeps navigation inside the app."),
    tf("routing", "medium", "Child routes let /blog, /blog/manage and /blog/:postId share a parent route.", true, "children: [...] nests routes under a parent path."),
    mc("guards", "medium", "Zebron's featureGuard reads which route data to decide if a page is available?", ["title", "featureKey", "applicationId", "role"], 1, "data: { featureKey } names the kill switch to check."),
    mc("guards", "medium", "What is a downside of a resolver for slow data?", ["It cannot use inject()", "Navigation waits until the data arrives", "It runs on every keystroke", "It disables lazy loading"], 1, "The page does not open until resolution finishes."),
    mc("http", "medium", "Why does Zebron call provideHttpClient(withFetch())?", ["To use the Fetch API, which works better with server-side rendering", "Because HttpClient is otherwise unavailable", "To add authentication", "To enable caching"], 0, "withFetch switches HttpClient to fetch, recommended with SSR."),
  ],
};
