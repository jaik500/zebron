import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 2,
  id: "angular21-signals",
  title: "Signals and Reactivity in Angular 21",
  summary: "Course 2 of 6 in the Zebron Angular 21 Developer Program. Hold state in signals, derive values with computed, run side effects safely, pass data between components and understand zoneless change detection.",
  description: "Signals are how Angular 21 knows what changed. A signal holds a value; anything that reads it (a template, a computed value, an effect) updates when it changes. Because Angular 21 apps are zoneless, signals are also what tells Angular to re-render.\n\nThis course covers `signal`, `computed`, `effect`, `linkedSignal`, signal-based inputs and outputs (`input`, `output`, `model`), signal queries, OnPush and zoneless change detection, and how signals work with RxJS.\n\nEach lesson ends with a quick check. The final exam is drawn from the **Signals and Reactivity in Angular 21** quiz in the Test Center.",
  level: "intermediate",
  cover: "teal",
  outcomes: ["Create writable signals and change them with set and update", "Derive values with computed and keep related state with linkedSignal", "Use effect only for side effects, and know when not to use it", "Pass data with input(), output() and model(), and query children with viewChild()", "Explain what triggers rendering in a zoneless app and convert between signals and observables"],
  skills: ["Signals", "computed", "effect", "linkedSignal", "Signal inputs", "Zoneless change detection"],
  quiz: {"name": "Signals and Reactivity in Angular 21", "slug": "angular21-signals", "description": "Practice questions for Course 2 of the Angular 21 Developer Program: signals, computed, effects, inputs and zoneless change detection.", "tags": ["angular", "angular-21", "signals"]},
  topics: [{"key": "signal-basics", "name": "Signals and computed", "description": "Writable signals, set, update, computed values and reading signals in templates."}, {"key": "effects", "name": "Effects and linked signals", "description": "effect, linkedSignal and untracked."}, {"key": "component-io", "name": "Component inputs, outputs and queries", "description": "input, input.required, output, model and viewChild."}, {"key": "zoneless", "name": "Zoneless change detection and RxJS", "description": "What triggers rendering, OnPush, toSignal and toObservable."}],
  modules: [
    {
      id: "state-with-signals",
      title: "State with signals",
      lessons: [
        {
          id: "signals-and-computed",
          title: "Signals and computed",
          minutes: 25,
          blocks: [
            text("## A writable signal\n\n```ts\nimport { Component, computed, signal } from '@angular/core';\n\n@Component({\n  selector: 'app-cart',\n  template: `\n    <p>Items: {{ count() }}</p>\n    <p>Total: {{ total() }}</p>\n    <button (click)=\"add()\">Add one</button>\n  `,\n})\nexport class Cart {\n  readonly count = signal(0);\n  readonly price = signal(12.5);\n  readonly total = computed(() => this.count() * this.price());\n\n  add(): void {\n    this.count.update((value) => value + 1);   // based on the old value\n  }\n  reset(): void {\n    this.count.set(0);                          // a new value\n  }\n}\n```\n\n- **Read** a signal by calling it: `count()`, in TypeScript and in templates.\n- **Write** with `set(value)` or `update(fn)`.\n- **computed** derives a read-only signal. It recalculates only when a signal it read changes, and only when someone reads it."),
            text("## Signals hold values, not mutations\n\nSignals compare values by identity. Changing an object or array **in place** does not notify anyone:\n\n```ts\nreadonly jobs = signal<Job[]>([]);\n\n// Wrong: same array, nobody is told\nthis.jobs().push(newJob);\n\n// Right: a new array\nthis.jobs.update((list) => [...list, newJob]);\n```\n\nExpose read-only versions to the rest of the app with `.asReadonly()`, and keep `set`/`update` inside the service or component that owns the state. Zebron's services follow this pattern (for example the help assistant settings and the links on the Maintenance tab)."),
            check("You call this.items().push(item) on a signal holding an array. What happens?", ["The template updates", "Nothing is notified because the array is the same object", "Angular throws an error", "The signal is reset"], 1, "Signals notify on set/update with a new value; mutating in place keeps the same reference."),
          ],
        },
        {
          id: "effects-and-linked-signals",
          title: "Effects, linkedSignal and untracked",
          minutes: 20,
          blocks: [
            text("## effect: side effects only\n\n```ts\nimport { effect, signal } from '@angular/core';\n\nexport class Settings {\n  readonly theme = signal<'light' | 'dark'>('light');\n\n  constructor() {\n    effect(() => {\n      localStorage.setItem('theme', this.theme());   // runs again when theme changes\n    });\n  }\n}\n```\n\nAn effect runs once, then again whenever a signal it read changes. Use it to talk to the **outside world**: storage, logging, a chart library, the document title. Create effects in a constructor or field initializer (an injection context).\n\n**Do not** use an effect to copy one signal into another. That is what `computed` and `linkedSignal` are for."),
            text("## linkedSignal: writable, but resets when its source changes\n\n```ts\nreadonly options = signal(['Standard', 'Express']);\nreadonly selected = linkedSignal(() => this.options()[0]);\n\n// The user can choose:\nthis.selected.set('Express');\n// If options changes, selected resets to the first option again.\n```\n\nA longer form gives you the previous value:\n\n```ts\nreadonly selected = linkedSignal({\n  source: this.options,\n  computation: (options, previous) =>\n    previous && options.includes(previous.value) ? previous.value : options[0],\n});\n```\n\n## untracked: read without depending\n\n```ts\neffect(() => {\n  const user = this.user();                 // tracked\n  untracked(() => this.logger.log(user, this.page()));  // page() not tracked\n});\n```\n\n`effect` and `linkedSignal` have been stable since Angular 20."),
            check("Which tool fits 'keep a selected item that resets when the list of options changes, but the user can still change it'?", ["computed", "effect", "linkedSignal", "untracked"], 2, "linkedSignal is writable and recomputes from its source."),
          ],
        },
      ],
    },
    {
      id: "components-and-rendering",
      title: "Components and rendering",
      lessons: [
        {
          id: "inputs-outputs-model",
          title: "input(), output(), model() and queries",
          minutes: 25,
          blocks: [
            text("## Inputs are signals\n\n```ts\nimport { Component, input, output, model, numberAttribute } from '@angular/core';\n\n@Component({\n  selector: 'app-job-card',\n  template: `\n    <h3>{{ title() }}</h3>\n    <p>{{ salary() }} a year</p>\n    <button (click)=\"apply.emit(id())\">Apply</button>\n    <button (click)=\"saved.set(!saved())\">{{ saved() ? 'Saved' : 'Save' }}</button>\n  `,\n})\nexport class JobCard {\n  readonly id = input.required<string>();\n  readonly title = input('Untitled');\n  readonly salary = input(0, { transform: numberAttribute });\n  readonly apply = output<string>();\n  readonly saved = model(false);\n}\n```\n\n```html\n<app-job-card [id]=\"job.id\" [title]=\"job.title\" salary=\"52000\"\n              (apply)=\"startApplication($event)\" [(saved)]=\"job.saved\" />\n```\n\n- `input()` / `input.required()` give a read-only signal.\n- `transform` converts what the parent passes (here a string to a number).\n- `output()` creates an event; call `.emit(value)`.\n- `model()` is a two-way signal: the child can `set` it and the parent's `[(saved)]` updates.\n\nWith `withComponentInputBinding()` in the router, route parameters arrive as inputs too (Course 3)."),
            text("## Signal queries\n\n```ts\nimport { ElementRef, viewChild } from '@angular/core';\n\nexport class SearchBox {\n  readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');\n  focus(): void { this.field().nativeElement.focus(); }\n}\n```\n\n`viewChild`, `viewChildren`, `contentChild` and `contentChildren` return signals, so they work with `computed` and `effect`. Older `@Input()`/`@Output()`/`@ViewChild()` decorators still work; migrate with `ng generate @angular/core:signal-input-migration` and `ng generate @angular/core:output-migration`."),
            check("Which declaration lets a parent use [(open)]=\"panelOpen\" on your component?", ["open = input(false)", "open = output<boolean>()", "open = model(false)", "open = signal(false)"], 2, "model() creates a two-way bindable signal."),
          ],
        },
        {
          id: "zoneless-and-rxjs",
          title: "Zoneless change detection, OnPush and RxJS",
          minutes: 20,
          blocks: [
            text("## What makes Angular 21 re-render\n\nWithout zone.js, Angular does not watch every timer and promise. It updates a component when:\n\n1. a **signal read by its template** changes;\n2. a **template event listener** runs, such as `(click)`;\n3. the **async pipe** receives a value;\n4. you call `ChangeDetectorRef.markForCheck()`, or an input is set.\n\nSo this does **not** update the screen:\n\n```ts\nmessage = 'Loading…';\nngOnInit() {\n  setTimeout(() => (this.message = 'Done'), 1000);   // plain field: nobody is told\n}\n```\n\nMake it a signal and it works:\n\n```ts\nreadonly message = signal('Loading…');\nngOnInit() {\n  setTimeout(() => this.message.set('Done'), 1000);\n}\n```\n\nAn existing app that still needs zone.js can add `provideZoneChangeDetection()` to its providers; `ng update` adds it when needed."),
            text("## OnPush\n\n`ChangeDetectionStrategy.OnPush` makes a component skip checks unless one of the triggers above applies to it. With signals it is the natural default; Zebron uses it everywhere.\n\n## Signals and RxJS together\n\n```ts\nimport { toObservable, toSignal } from '@angular/core/rxjs-interop';\n\nreadonly params = toSignal(inject(ActivatedRoute).paramMap);     // Observable → Signal\nreadonly query = signal('');\nreadonly query$ = toObservable(this.query);                       // Signal → Observable\nreadonly results = toSignal(\n  this.query$.pipe(debounceTime(300), switchMap((q) => this.api.search(q))),\n  { initialValue: [] },\n);\n```\n\nUse RxJS where time matters (debounce, cancel, retry); use signals for the state the template reads."),
            check("In a zoneless app, a plain class field changes inside setTimeout. Why might the screen not update?", ["setTimeout is blocked", "No signal, event or markForCheck told Angular to check", "OnPush disables timers", "Fields cannot be shown in templates"], 1, "Zoneless Angular renders on signals, events, the async pipe or markForCheck."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("signal-basics", "easy", "How do you read the value of a signal named count?", ["count", "count.value", "count()", "count.get()"], 2, "Signals are functions: call them to read."),
    mc("signal-basics", "easy", "Which method changes a signal based on its current value?", ["set", "update", "patch", "mutate"], 1, "update(fn) receives the current value and returns the next one."),
    tf("signal-basics", "medium", "A computed signal recalculates only when a signal it read changes, and only when it is read.", true, "computed is lazy and memoised."),
    mc("signal-basics", "medium", "What is the right way to add an item to a signal holding an array?", ["this.items().push(x)", "this.items.update(list => [...list, x])", "this.items.add(x)", "this.items = [...this.items, x]"], 1, "Give the signal a new array so it notifies readers."),
    mc("effects", "medium", "Which is a good use of effect()?", ["Computing a total from two signals", "Saving a setting to localStorage when it changes", "Copying one signal into another", "Formatting a date for the template"], 1, "Effects are for side effects outside Angular's reactive graph."),
    tf("effects", "medium", "effect() and linkedSignal() are stable APIs since Angular 20.", true, "Both were promoted to stable in Angular 20."),
    mc("effects", "hard", "Inside an effect you want to read page() without the effect re-running when page changes. What do you use?", ["computed", "untracked", "linkedSignal", "asReadonly"], 1, "untracked(() => …) reads signals without creating a dependency."),
    mc("component-io", "easy", "Which function declares an input that the parent must provide?", ["input()", "input.required()", "output()", "model.required()"], 1, "input.required makes the binding mandatory at compile time."),
    mc("component-io", "medium", "How does a component send an event to its parent with output()?", ["this.apply.set(value)", "this.apply.emit(value)", "this.apply.next(value)", "this.apply(value)"], 1, "OutputEmitterRef.emit sends the value to (apply) listeners."),
    mc("component-io", "medium", "What does the transform option on input() do?", ["Animates the value", "Converts the value the parent passes, for example a string to a number", "Makes the input required", "Turns the input into an output"], 1, "transform: numberAttribute converts \"52000\" to 52000."),
    tf("component-io", "medium", "viewChild() returns a signal.", true, "Signal queries return signals you can use in computed and effect."),
    ms("zoneless", "medium", "In a zoneless Angular 21 app, which of these trigger a component to re-render?", ["A signal read by its template changes", "A (click) handler in its template runs", "A plain field changes inside setTimeout", "The async pipe receives a value"], [0, 1, 3], "Plain field changes in timers are not seen without zone.js."),
    mc("zoneless", "medium", "An older app still relies on zone.js after upgrading to Angular 21. What keeps it working?", ["provideZoneChangeDetection() in the app providers", "Removing OnPush everywhere", "provideHttpClient()", "Nothing; zone.js was removed from Angular"], 0, "Apps that need zone.js opt back in with provideZoneChangeDetection()."),
    mc("zoneless", "medium", "Which function turns an Observable into a signal?", ["toObservable", "toSignal", "fromSignal", "signalFrom"], 1, "toSignal from @angular/core/rxjs-interop subscribes and exposes the latest value."),
    mc("signal-basics", "medium", "How do you expose a signal so other code can read it but not set it?", ["Make it private", "Return signal.asReadonly()", "Wrap it in computed only", "Freeze the object"], 1, "asReadonly() returns a read-only view of the signal."),
    tf("signal-basics", "easy", "You read a signal in a template the same way as in TypeScript: by calling it.", true, "{{ count() }} in a template."),
    mc("effects", "medium", "Where should you create an effect?", ["In a click handler", "In a constructor or field initializer (an injection context)", "Inside a pipe", "In index.html"], 1, "effect() needs an injection context, like inject()."),
    mc("component-io", "medium", "Which migration converts @Output() to output()?", ["ng generate @angular/core:output-migration", "ng update outputs", "ng add output", "There is none"], 0, "The core package ships an output migration."),
    mc("zoneless", "medium", "Which change detection strategy works best with signals?", ["Default", "OnPush", "Detached", "Always"], 1, "OnPush re-renders on signals, inputs and events."),
    mc("zoneless", "hard", "You need a debounced search that cancels old requests. Which combination fits?", ["Only computed", "toObservable, debounceTime and switchMap, then toSignal", "An effect with setTimeout and plain fields", "A pipe"], 1, "RxJS handles time and cancellation; signals hold the result."),
  ],
};
