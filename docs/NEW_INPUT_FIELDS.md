# New Input Fields — Zebron form standard

Every form field in Zebron uses this pattern, based on the Tax & Pay
Calculator form. Fields stay put on mobile instead of zooming or
stretching when tapped.

**Stack:** Angular Material for the control, Tailwind for layout.
Use something else only when Material has no component for the job.

## Why it works on mobile

| Rule | Why |
|---|---|
| `mat-form-field appearance="outline"` | Material inputs render at 16px, so iOS Safari does not zoom on focus. |
| `class="zb-field"` | Full width, can shrink inside grids/flex rows, 16px spacing below. |
| Tailwind grids: `grid gap-4 sm:grid-cols-2` | One column on phones, two from `sm` up. No fixed widths on fields. |
| Global 16px rule (`src/styles/_new-input-fields.scss`) | Safety net for controls not migrated yet. |
| Viewport stays zoomable | Never use `maximum-scale=1` / `user-scalable=no`. |

## Setup (done)

- `src/styles/_new-input-fields.scss` defines `.zb-field`, `.zb-field--grow`, `.zb-field--flush`,
  `.zb-field--dense`, `.zb-field--on-dark` and `.zb-checkbox--on-dark`.
- `src/styles.scss` imports it after Angular Material.
- Components import: `FormsModule`, `MatFormFieldModule`, `MatInputModule`,
  `MatSelectModule`, `MatCheckboxModule` (as needed).

## Patterns

### Text
```html
<mat-form-field appearance="outline" class="zb-field">
  <mat-label>Organization name</mat-label>
  <input matInput [(ngModel)]="name" name="name" required />
  <mat-hint>Shown to your members</mat-hint>
</mat-form-field>
```

### Number / currency
```html
<mat-form-field appearance="outline" class="zb-field">
  <mat-label>Annual salary</mat-label>
  <input matInput type="number" min="0" inputmode="decimal" [(ngModel)]="salary" name="salary" />
  <span matTextPrefix>$&nbsp;</span>
</mat-form-field>
```

### Email
```html
<mat-form-field appearance="outline" class="zb-field">
  <mat-label>Email address</mat-label>
  <input matInput type="email" inputmode="email" autocomplete="email" [(ngModel)]="email" name="email" />
</mat-form-field>
```

### Textarea
```html
<mat-form-field appearance="outline" class="zb-field">
  <mat-label>Message</mat-label>
  <textarea matInput rows="4" [(ngModel)]="message" name="message"></textarea>
</mat-form-field>
```

### Select (use mat-select, not a native select)
```html
<mat-form-field appearance="outline" class="zb-field">
  <mat-label>Course</mat-label>
  <mat-select [ngModel]="courseId()" (ngModelChange)="onCourseChange($event)" name="course">
    <mat-option value="">Select a course</mat-option>
    @for (course of courses(); track course.id) {
      <mat-option [value]="course.id">{{ course.name }}</mat-option>
    }
  </mat-select>
</mat-form-field>
```

### Checkbox (use mat-checkbox, not a native checkbox)
```html
<mat-checkbox [(ngModel)]="age65OrOlder" name="age65">Age 65 or older</mat-checkbox>
```

### Signals (OnPush components)
```html
<input matInput [ngModel]="subject()" (ngModelChange)="subject.set($event)" name="subject" />
```

### Two columns on larger screens
```html
<div class="grid gap-4 sm:grid-cols-2">
  <mat-form-field appearance="outline" class="zb-field">…</mat-form-field>
  <mat-form-field appearance="outline" class="zb-field">…</mat-form-field>
</div>
```

### Field + icon button in one row
```html
<div class="flex items-center gap-2">
  <mat-form-field appearance="outline" class="zb-field zb-field--grow">…</mat-form-field>
  <button mat-icon-button type="button" aria-label="Remove"><mat-icon>delete</mat-icon></button>
</div>
```

### Compact field on a dark filter bar
```html
<mat-form-field appearance="outline" subscriptSizing="dynamic"
  class="zb-field zb-field--flush zb-field--dense zb-field--on-dark">
  <mat-label>Category</mat-label>
  <mat-select [value]="selected()" (selectionChange)="onCategoryChange($event.value)">…</mat-select>
</mat-form-field>

<mat-checkbox class="zb-checkbox--on-dark" [checked]="onlineOnly()" (change)="onOnlineChange($event.checked)">
  Online
</mat-checkbox>
```

### Event handlers
- `mat-select` → `(selectionChange)="handler($event.value)"`, handler takes the value (not `Event`).
- `mat-checkbox` → `(change)="handler($event.checked)"`.
- `matInput` keeps native events: `(input)` / `(ngModelChange)` work unchanged.

## Don't''s

- No raw `<input>`, `<select>`, `<textarea>` styled with Tailwind (`rounded-xl border px-4 py-3 text-sm`).
  `text-sm` (14px) triggers the iOS zoom.
- No fixed widths (`w-60`, `width: 300px`) on fields.
- No `appearance="fill"`; always `outline`.
- No per-component field CSS (`.tax-field` etc.); use `.zb-field`.

## Migration checklist (per component)

1. Replace raw controls with the matching pattern.
2. Add the Material modules to the component's `imports`.
3. Replace custom field classes with `zb-field`.
4. Test at 375px width and on a real phone: tap every field; no zoom, no sideways scroll.
