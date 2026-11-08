import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 6,
  id: "web-typescript",
  title: "TypeScript: Types for Safer JavaScript",
  summary: "Course 6 of 7 in the Zebron Web Foundations Program. Add types to JavaScript: basic and object types, unions and narrowing, functions and generics, utility types, and the compiler settings used in real projects.",
  description: "TypeScript is JavaScript with types. The compiler checks your code before it runs, catching typos, missing properties and wrong arguments, and editors use the types for autocomplete. Angular, Zebron and most large JavaScript projects are written in TypeScript.\n\nThis course covers types and interfaces, unions and narrowing, typing functions, generics, utility and literal types, `satisfies`, and `tsconfig.json` with strict mode. Install it with `npm install -D typescript` and compile with `npx tsc`, or let your framework's build do it.\n\nEach lesson ends with a quick check. The final exam is drawn from the **TypeScript** quiz in the Test Center.",
  level: "intermediate",
  cover: "slate",
  outcomes: ["Type variables, objects and arrays with interfaces and type aliases", "Model choices with union and literal types and narrow them safely", "Type functions and write generic functions and types", "Use utility types, satisfies and strict compiler settings"],
  skills: ["TypeScript", "Interfaces", "Union types", "Generics", "Utility types", "tsconfig"],
  quiz: {"name": "TypeScript: Types for Safer JavaScript", "slug": "web-typescript", "description": "Practice questions for Course 6 of the Web Foundations Program: types, unions, generics, utility types and strict mode.", "tags": ["typescript", "web-foundations"]},
  topics: [{"key": "basics", "name": "Types and interfaces", "description": "Annotations, inference, object types, interfaces, optional and readonly properties."}, {"key": "unions", "name": "Unions, literals and narrowing", "description": "Union and literal types, typeof/in/instanceof narrowing, discriminated unions, unknown vs any."}, {"key": "generics", "name": "Functions and generics", "description": "Function types, overload-free design, generic functions and constraints."}, {"key": "advanced", "name": "Utility types and configuration", "description": "Partial, Pick, Omit, Record, keyof, as const, satisfies and tsconfig strict."}],
  modules: [
    {
      id: "typing-data",
      title: "Typing data",
      lessons: [
        {
          id: "types-interfaces",
          title: "Types and interfaces",
          minutes: 25,
          blocks: [
            text("## Annotations and inference\n\n```ts\nlet title: string = 'Nurse';\nlet pay = 72000;              // inferred: number\nconst tags: string[] = ['health', 'full-time'];\npay = 'high';                 // ✗ error: string is not assignable to number\n```\n\nLet TypeScript **infer** obvious types; annotate function parameters, public APIs and empty values.\n\n## Object types\n\n```ts\ninterface Job {\n  readonly id: string;\n  title: string;\n  pay: number;\n  remote?: boolean;           // optional\n  location: { city: string; state: string };\n}\n\ntype JobId = string;          // a type alias\nconst job: Job = { id: 'j1', title: 'Nurse', pay: 72000, location: { city: 'Laurel', state: 'MD' } };\njob.id = 'j2';                // ✗ readonly\n```\n\n`interface` and `type` are mostly interchangeable for objects. Interfaces can be extended (`interface Remote extends Job`) and merged; `type` can also name unions and other types."),
            text("## Types disappear at run time\n\nTypeScript compiles to plain JavaScript and removes the types. Data from a server, a form or localStorage is **not** checked at run time just because you wrote `as Job`. Validate untrusted data (by hand or with a schema library) before trusting its type.\n\n```ts\nconst job = JSON.parse(text) as Job;   // a promise to the compiler, not a check\n```"),
            check("What does writing `as Job` on parsed JSON guarantee at run time?", ["That the data matches Job", "Nothing: types are removed when compiled", "That missing fields are filled", "That the data is encrypted"], 1, "Type assertions only affect the compiler."),
          ],
        },
        {
          id: "unions-narrowing",
          title: "Unions, literal types and narrowing",
          minutes: 25,
          blocks: [
            text("## Unions and literals\n\n```ts\ntype Status = 'draft' | 'published' | 'archived';   // literal union\nlet status: Status = 'draft';\nstatus = 'deleted';     // ✗ not one of the allowed values\n\nfunction format(value: string | number): string {\n  if (typeof value === 'number') return value.toFixed(2);   // narrowed to number\n  return value.trim();                                      // narrowed to string\n}\n```\n\nTypeScript **narrows** types inside checks: `typeof`, `instanceof`, `'key' in obj`, equality, and truthiness checks for `null`/`undefined`."),
            text("## Discriminated unions\n\n```ts\ntype Result =\n  | { status: 'loading' }\n  | { status: 'ok'; jobs: Job[] }\n  | { status: 'error'; message: string };\n\nfunction render(result: Result): string {\n  switch (result.status) {\n    case 'loading': return 'Loading…';\n    case 'ok': return `${result.jobs.length} jobs`;      // jobs exists here\n    case 'error': return result.message;\n    default: { const never: never = result; return never; }   // compile error if a case is missing\n  }\n}\n```\n\n## unknown, not any\n\n`any` switches checking off. `unknown` accepts anything but forces you to narrow before use, which makes it the safe type for data you have not checked yet."),
            check("Which type should you use for a value you have not checked yet, such as a parsed API response?", ["any", "unknown", "never", "object"], 1, "unknown forces narrowing before use."),
          ],
        },
      ],
    },
    {
      id: "reusable-types",
      title: "Reusable types",
      lessons: [
        {
          id: "functions-generics",
          title: "Functions and generics",
          minutes: 25,
          blocks: [
            text("## Typing functions\n\n```ts\nfunction total(price: number, quantity = 1): number {\n  return price * quantity;\n}\nconst isRemote = (job: Job): boolean => job.remote === true;\ntype Filter = (job: Job) => boolean;\nasync function loadJobs(): Promise<Job[]> { … }\n```\n\nReturn types are usually inferred; write them on exported functions so mistakes are caught where they happen.\n\n## Generics: types as parameters\n\n```ts\nfunction first<T>(items: T[]): T | undefined {\n  return items[0];\n}\nconst job = first(jobs);        // Job | undefined\nconst n = first([1, 2, 3]);     // number | undefined\n```"),
            text("## Constraints and generic types\n\n```ts\nfunction byId<T extends { id: string }>(items: T[], id: string): T | undefined {\n  return items.find((item) => item.id === id);\n}\n\ninterface Page<T> { items: T[]; next: string | null; }\nconst page: Page<Job> = { items: [], next: null };\n```\n\n`extends` limits what `T` can be, so the function can safely use `item.id`. You already use generics every day: `Array<Job>`, `Promise<Job[]>`, Angular's `signal<Job[]>([])` and `input.required<string>()`."),
            check("In function byId<T extends { id: string }>, what does extends do?", ["Inherits a class", "Requires T to have an id string property", "Makes T optional", "Copies T"], 1, "It constrains the type parameter."),
          ],
        },
        {
          id: "utility-config",
          title: "Utility types, satisfies and strict mode",
          minutes: 25,
          blocks: [
            text("## Utility and derived types\n\n```ts\ntype JobDraft = Partial<Job>;                 // every property optional\ntype JobCard = Pick<Job, 'id' | 'title'>;     // only some properties\ntype NewJob = Omit<Job, 'id'>;                // all but some\ntype PayByCity = Record<string, number>;      // object with string keys\ntype JobKey = keyof Job;                      // 'id' | 'title' | 'pay' | …\ntype Saved = Readonly<Job>;\n\nconst COVERS = ['teal', 'navy', 'violet'] as const;\ntype Cover = (typeof COVERS)[number];         // 'teal' | 'navy' | 'violet'\n```\n\nDeriving types from one source (like `Cover` from `COVERS`) keeps lists and types in step, the same idea as Zebron's single application registry."),
            text("## satisfies\n\n```ts\nconst LABELS = {\n  draft: 'Draft',\n  published: 'Published',\n} satisfies Record<Status, string>;   // ✗ error: 'archived' is missing\n```\n\n`satisfies` checks a value against a type without widening it, so you keep exact keys and still get errors for missing or wrong entries.\n\n## tsconfig.json\n\n```json\n{\n  \"compilerOptions\": {\n    \"strict\": true,\n    \"noUncheckedIndexedAccess\": true,\n    \"noImplicitReturns\": true,\n    \"target\": \"ES2022\",\n    \"module\": \"ESNext\"\n  }\n}\n```\n\n**strict** turns on null checks and other safety checks; every new project should use it (Angular projects do). `noUncheckedIndexedAccess` makes `array[i]` possibly `undefined`, which matches reality."),
            check("Which utility type makes every property optional?", ["Pick", "Partial", "Required", "Omit"], 1, "Partial<T> makes all properties optional."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("basics", "easy", "What does TypeScript add to JavaScript?", ["A new runtime", "Static types checked before the code runs", "Faster execution", "A CSS preprocessor"], 1, "TypeScript is typed JavaScript checked at compile time."),
    mc("basics", "easy", "How do you mark a property optional in an interface?", ["title!: string", "title?: string", "optional title: string", "title: string | optional"], 1, "? makes it optional."),
    tf("basics", "medium", "TypeScript types are checked at run time in the browser.", false, "Types are removed when compiled."),
    mc("basics", "medium", "Which keyword stops a property from being reassigned after creation?", ["const", "readonly", "final", "static"], 1, "readonly properties cannot be reassigned."),
    mc("basics", "medium", "What type does TypeScript infer for let pay = 72000?", ["any", "number", "72000", "unknown"], 1, "let infers the widened type number."),
    mc("unions", "easy", "Which declares a type that is only 'draft' or 'published'?", ["type S = string", "type S = 'draft' | 'published'", "enum S", "type S = ['draft','published']"], 1, "A union of string literals."),
    mc("unions", "medium", "Inside if (typeof value === 'number'), what is value's type?", ["string | number", "number", "unknown", "any"], 1, "TypeScript narrows within the check."),
    mc("unions", "medium", "What makes a union 'discriminated'?", ["It uses classes", "Each member has a common literal property, such as status", "It has two members", "It is exported"], 1, "The shared literal property lets TypeScript narrow."),
    mc("unions", "medium", "Why prefer unknown over any?", ["unknown is faster", "unknown forces you to check the value before using it", "any is deprecated", "unknown allows everything without checks"], 1, "any disables checking."),
    tf("unions", "hard", "Assigning a value to a variable of type never in a switch's default case makes the compiler report missing cases.", true, "Exhaustiveness checking with never."),
    mc("generics", "easy", "What is a generic?", ["A type parameter that lets one function or type work with many types", "A default value", "A class", "An any type"], 0, "Generics are type parameters."),
    mc("generics", "medium", "What does first<T>(items: T[]): T | undefined return for first(jobs) where jobs is Job[]?", ["any", "Job | undefined", "Job[]", "unknown"], 1, "T is inferred as Job."),
    mc("generics", "medium", "Which is a generic type you already use in Angular?", ["signal<Job[]>([])", "@Component", "ngOnInit", "routerLink"], 0, "signal<T> is generic."),
    mc("generics", "medium", "How do you write the type of an async function's result?", ["Async<Job[]>", "Promise<Job[]>", "Future<Job[]>", "Job[] async"], 1, "Async functions return promises."),
    tf("generics", "medium", "A constraint such as <T extends { id: string }> lets the function safely read item.id.", true, "The constraint guarantees the property exists."),
    mc("advanced", "medium", "Which utility type keeps only the listed properties?", ["Omit", "Pick", "Partial", "Record"], 1, "Pick<T, K>."),
    mc("advanced", "medium", "What does keyof Job produce?", ["The values of Job", "A union of Job's property names", "The number of keys", "An array"], 1, "keyof gives the property-name union."),
    mc("advanced", "medium", "What does satisfies do?", ["Converts a value", "Checks a value against a type while keeping its exact inferred type", "Disables checking", "Makes a value readonly at run time"], 1, "It validates without widening."),
    mc("advanced", "medium", "Which tsconfig option turns on null checks and other safety checks together?", ["safe", "strict", "checkAll", "noAny"], 1, "strict enables the strict family."),
    mc("advanced", "hard", "Given const COVERS = ['teal','navy'] as const, what is (typeof COVERS)[number]?", ["string", "'teal' | 'navy'", "number", "string[]"], 1, "as const keeps literal types; indexing by number gives their union."),
  ],
};
