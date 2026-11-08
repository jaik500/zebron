import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 4,
  id: "angular21-forms",
  title: "Forms in Angular 21: Template-driven, Reactive and Signal Forms",
  summary: "Course 4 of 6 in the Zebron Angular 21 Developer Program. Choose the right forms approach, build typed reactive forms, try the new Signal Forms and handle validation, submission and accessible errors.",
  description: "Almost every application collects input: sign-up, search, job applications, settings. Angular 21 offers three ways to build forms. **Template-driven** forms are simplest, **reactive** forms are the established choice for complex forms, and **Signal Forms** are the new, signal-based API (experimental in Angular 21).\n\nThis course builds the same sign-up form in each style, then covers validation messages, submitting to a server, showing server errors and making errors accessible.\n\nEach lesson ends with a quick check. The final exam is drawn from the **Forms in Angular 21** quiz in the Test Center.",
  level: "intermediate",
  cover: "sunrise",
  outcomes: ["Choose between template-driven, reactive and Signal Forms for a task", "Build template-driven forms with ngModel and built-in validation", "Build typed reactive forms with FormGroup, FormControl and Validators", "Build a Signal Form with form(), validators and the [formField] directive", "Submit forms safely and show validation and server errors accessibly"],
  skills: ["Template-driven forms", "Reactive forms", "Signal Forms", "Validation", "Accessible forms"],
  quiz: {"name": "Forms in Angular 21", "slug": "angular21-forms", "description": "Practice questions for Course 4 of the Angular 21 Developer Program: template-driven, reactive and Signal Forms, validation and submission.", "tags": ["angular", "angular-21", "forms"]},
  topics: [{"key": "template-forms", "name": "Choosing an approach and template-driven forms", "description": "When to use which approach; ngModel and validation attributes."}, {"key": "reactive-forms", "name": "Reactive forms", "description": "Typed FormGroup and FormControl, Validators, FormBuilder and valueChanges."}, {"key": "signal-forms", "name": "Signal Forms", "description": "form(), schema validators, [formField] and field state signals."}, {"key": "submission", "name": "Submitting and errors", "description": "submit(), disabling, server errors and accessible error messages."}],
  modules: [
    {
      id: "classic-forms",
      title: "Template-driven and reactive forms",
      lessons: [
        {
          id: "choosing-and-template-forms",
          title: "Choosing an approach; template-driven forms",
          minutes: 20,
          blocks: [
            text("## Three approaches\n\n| Approach | Package | Good for | Status in Angular 21 |\n| --- | --- | --- | --- |\n| Template-driven | `FormsModule` | Small forms, quick settings, a search box | Stable |\n| Reactive | `ReactiveFormsModule` | Large or dynamic forms, complex validation, testing in code | Stable |\n| Signal Forms | `@angular/forms/signals` | New code that already uses signals | **Experimental** (stable in Angular 22) |\n\nZebron uses template-driven forms with signals for most of its admin forms (for example the help assistant settings and the link form on the Maintenance tab).\n\n## Template-driven\n\n```ts\n@Component({\n  selector: 'app-newsletter',\n  imports: [FormsModule],\n  template: `\n    <form #f=\"ngForm\" (ngSubmit)=\"save()\">\n      <label for=\"email\">Email</label>\n      <input id=\"email\" name=\"email\" type=\"email\" required email\n             [(ngModel)]=\"email\" #emailField=\"ngModel\" />\n      @if (emailField.invalid && emailField.touched) {\n        <p class=\"error\">Enter a valid email address.</p>\n      }\n      <button [disabled]=\"f.invalid\">Subscribe</button>\n    </form>\n  `,\n})\nexport class Newsletter { email = ''; save() { … } }\n```\n\nEvery input with `ngModel` needs a `name`. Validation attributes (`required`, `email`, `minlength`) become validators."),
            tip("With signals you can bind `[ngModel]=\"email()\"` and `(ngModelChange)=\"email.set($event)\"`. Zebron does this so a form's draft can be cleared by setting the signal."),
            check("Which attribute must every ngModel input inside a <form> have?", ["id", "name", "value", "formControlName"], 1, "ngForm registers controls by their name."),
          ],
        },
        {
          id: "reactive-forms",
          title: "Typed reactive forms",
          minutes: 25,
          blocks: [
            text("## The form lives in TypeScript\n\n```ts\nimport { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';\n\n@Component({\n  selector: 'app-signup',\n  imports: [ReactiveFormsModule],\n  templateUrl: './signup.html',\n})\nexport class Signup {\n  private readonly fb = inject(FormBuilder).nonNullable;\n\n  readonly form = this.fb.group({\n    name: ['', Validators.required],\n    email: ['', [Validators.required, Validators.email]],\n    password: ['', [Validators.required, Validators.minLength(8)]],\n  });\n\n  save(): void {\n    if (this.form.invalid) { this.form.markAllAsTouched(); return; }\n    const value = this.form.getRawValue();   // { name: string; email: string; password: string }\n  }\n}\n```\n\n```html\n<form [formGroup]=\"form\" (ngSubmit)=\"save()\">\n  <input formControlName=\"name\" />\n  <input formControlName=\"email\" type=\"email\" />\n  <input formControlName=\"password\" type=\"password\" />\n  @if (form.controls.password.hasError('minlength')) { <p>At least 8 characters.</p> }\n  <button>Create account</button>\n</form>\n```\n\nReactive forms are **typed**: `form.controls.email.value` is a `string`. `nonNullable` means reset returns to the initial value instead of `null`."),
            text("## Reacting to changes and dynamic fields\n\n```ts\nreadonly email = toSignal(this.form.controls.email.valueChanges, { initialValue: '' });\n```\n\n- `valueChanges` and `statusChanges` are Observables; `toSignal` turns them into signals.\n- `FormArray` holds a variable number of controls (for example several phone numbers).\n- A **custom validator** is a function `(control) => errors | null`; a cross-field validator goes on the group."),
            check("What does the nonNullable FormBuilder change?", ["Fields can never be empty strings", "reset() returns controls to their initial values instead of null, and types are not nullable", "Validators are skipped", "The form becomes read-only"], 1, "Non-nullable controls keep their initial value on reset and have non-null types."),
          ],
        },
      ],
    },
    {
      id: "signal-forms",
      title: "Signal Forms and submission",
      lessons: [
        {
          id: "signal-forms-basics",
          title: "Signal Forms (experimental in 21)",
          minutes: 25,
          blocks: [
            text("## The model is a signal\n\n```ts\nimport { Component, signal } from '@angular/core';\nimport { email, form, FormField, minLength, required } from '@angular/forms/signals';\n\ninterface SignupModel { name: string; email: string; password: string; }\n\n@Component({\n  selector: 'app-signup',\n  imports: [FormField],\n  templateUrl: './signup.html',\n})\nexport class Signup {\n  readonly model = signal<SignupModel>({ name: '', email: '', password: '' });\n\n  readonly signupForm = form(this.model, (path) => {\n    required(path.name, { message: 'Enter your name.' });\n    required(path.email, { message: 'Enter your email.' });\n    email(path.email, { message: 'Enter a valid email address.' });\n    minLength(path.password, 8, { message: 'Use at least 8 characters.' });\n  });\n}\n```\n\n`form()` builds a tree of fields shaped like the model. Typing in an input updates `model()` directly; there is no separate form value to copy back."),
            text("## Binding and field state\n\n```html\n<label for=\"email\">Email</label>\n<input id=\"email\" type=\"email\" [formField]=\"signupForm.email\" />\n@if (signupForm.email().touched() && signupForm.email().invalid()) {\n  @for (error of signupForm.email().errors(); track error.kind) {\n    <p class=\"error\">{{ error.message }}</p>\n  }\n}\n```\n\nEach field is called to get its **state**, and every part of the state is a signal: `value()`, `valid()`, `invalid()`, `errors()`, `touched()`, `dirty()`, `pending()`. The whole form works the same way: `signupForm().valid()`.\n\nOther rules in the schema: `disabled`, `readonly` and `hidden` (with a condition), `pattern`, `min`, `max`, and `validate` for your own check.\n\n**Version note:** in Angular 21.0 the directive was `Field` with `[field]`; later 21.x releases and the current documentation use `FormField` with `[formField]`. Signal Forms are experimental in 21, so check angular.dev for the version you use."),
            check("Where does the value typed into a Signal Form input end up?", ["In a separate FormGroup value you copy back", "Directly in the model signal passed to form()", "In localStorage", "Nowhere until submit"], 1, "Signal Forms write straight into the model signal."),
          ],
        },
        {
          id: "submitting-and-errors",
          title: "Submitting, server errors and accessibility",
          minutes: 20,
          blocks: [
            text("## submit()\n\n```ts\nimport { submit } from '@angular/forms/signals';\n\nasync onSubmit(event: Event): Promise<void> {\n  event.preventDefault();\n  await submit(this.signupForm, async (form) => {\n    const result = await this.api.signUp(form().value());\n    if (result.emailTaken) {\n      return [{ kind: 'server', field: form.email, message: 'That email is already registered.' }];\n    }\n    return undefined;   // success\n  });\n}\n```\n\n`submit()` marks every field as touched, runs only when the form is valid, and shows the errors you return next to the right field. Keep a `saving` signal, set it around the call, and disable the button with `[disabled]=\"saving()\"` so people cannot submit twice.\n\nFor reactive and template-driven forms the same ideas apply: `markAllAsTouched()`, check `invalid`, disable while saving, and set errors from the server with `control.setErrors({ server: message })`."),
            text("## Accessible errors\n\n- Every input has a visible `<label for>`.\n- Link the message to the input: `[attr.aria-describedby]=\"'email-error'\"` and `<p id=\"email-error\">`.\n- Mark invalid inputs: `[attr.aria-invalid]=\"field().invalid()\"`.\n- Show a summary at the top with `role=\"alert\"` after a failed submit, and move focus to the first invalid field.\n- Never rely on colour alone: include text."),
            check("What does submit() from @angular/forms/signals do before calling your action?", ["Clears the form", "Marks all fields as touched and checks the form is valid", "Sends an HTTP request itself", "Reloads the page"], 1, "submit() touches every field and only runs the action when the form is valid."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("template-forms", "easy", "Which module do template-driven forms need?", ["ReactiveFormsModule", "FormsModule", "HttpClientModule", "RouterModule"], 1, "FormsModule provides ngModel and ngForm."),
    mc("template-forms", "medium", "Which approach is experimental in Angular 21?", ["Template-driven forms", "Reactive forms", "Signal Forms", "None"], 2, "Signal Forms are experimental in v21."),
    tf("template-forms", "medium", "In a template-driven form, the required attribute on an input adds a required validator.", true, "Validation attributes are turned into validators."),
    mc("reactive-forms", "easy", "Which directive connects an input to a control inside [formGroup]?", ["ngModel", "formControlName", "formField", "name"], 1, "formControlName binds an input to a named control in the group."),
    mc("reactive-forms", "medium", "How do you show every validation message before saving an invalid reactive form?", ["form.reset()", "form.markAllAsTouched()", "form.disable()", "form.updateValueAndValidity(false)"], 1, "Touched controls show their errors."),
    mc("reactive-forms", "medium", "Which Observable emits each time a control's value changes?", ["statusChanges", "valueChanges", "events$", "changes"], 1, "valueChanges emits the new value."),
    tf("reactive-forms", "medium", "Reactive forms in Angular are typed, so form.controls.email.value has a known type.", true, "Typed forms have been standard since Angular 14."),
    mc("signal-forms", "medium", "Which package do Signal Forms come from?", ["@angular/forms", "@angular/forms/signals", "@angular/core/forms", "@angular/signals"], 1, "Signal Forms live in @angular/forms/signals."),
    mc("signal-forms", "medium", "In current Angular 21 releases, which directive binds an input to a Signal Form field?", ["[formControl]", "[ngModel]", "[formField]", "[signal]"], 2, "FormField with [formField] (21.0 used [field])."),
    ms("signal-forms", "medium", "Which validation rules can be used in a Signal Form schema?", ["required", "email", "minLength", "formControlName"], [0, 1, 2], "formControlName is a reactive forms directive, not a rule."),
    mc("signal-forms", "hard", "How do you read whether the email field is invalid?", ["signupForm.email.invalid", "signupForm.email().invalid()", "signupForm.invalid('email')", "model().email.invalid"], 1, "Call the field to get its state; each state property is a signal."),
    mc("submission", "medium", "What should a form do while a save is in progress?", ["Allow more clicks", "Disable the submit button", "Clear the fields", "Reload the page"], 1, "Disabling prevents double submissions."),
    ms("submission", "medium", "Which help make form errors accessible?", ["A visible label for each input", "aria-describedby linking the error text", "Red borders only", "A role=alert summary after a failed submit"], [0, 1, 3], "Colour alone is not enough."),
    tf("submission", "medium", "Errors returned from the submit() action can be shown next to the field they belong to.", true, "Return errors with the field they apply to."),
    mc("template-forms", "medium", "Which approach suits a large, dynamic form whose validation is tested in code, using only stable APIs?", ["Template-driven", "Reactive", "Signal Forms", "Plain HTML"], 1, "Reactive forms are stable and built for complex cases."),
    mc("template-forms", "medium", "With signals, how does Zebron bind an input so the draft can be cleared by setting a signal?", ["[(ngModel)]=\"draft\"", "[ngModel]=\"draft()\" (ngModelChange)=\"draft.set($event)\"", "[formField]=\"draft\"", "value=\"{{ draft }}\""], 1, "Split binding reads and writes the signal."),
    mc("reactive-forms", "medium", "Which holds a variable number of controls, such as several phone numbers?", ["FormGroup", "FormArray", "FormRecord only", "FormControl"], 1, "FormArray holds a list of controls."),
    mc("signal-forms", "medium", "Which rule makes a Signal Form field read-only?", ["disabled", "readonly", "hidden", "required"], 1, "readonly(path.field) makes it read-only."),
    tf("signal-forms", "medium", "Signal Forms became stable in Angular 22.", true, "They were experimental in 21 and stable in 22."),
    mc("submission", "medium", "In reactive forms, how do you show an error the server returned for the email field?", ["form.reset()", "form.controls.email.setErrors({ server: message })", "Validators.server", "Disable the field"], 1, "setErrors attaches an error to a control."),
  ],
};
