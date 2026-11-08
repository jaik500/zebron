import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 3,
  id: "web-modern-css",
  title: "Modern CSS: Grid, Responsive Design and Motion",
  summary: "Course 3 of 7 in the Zebron Web Foundations Program. Build two-dimensional layouts with Grid, make pages responsive with media and container queries, organise styles with custom properties and nesting, and add accessible motion.",
  description: "Modern CSS can do what once needed frameworks or JavaScript. This course covers CSS Grid, mobile-first responsive design with media queries and container queries, custom properties (CSS variables) for themes, native nesting and `:has()`, transitions and animations that respect people who prefer less motion, and how utility frameworks such as Tailwind fit in.\n\nEach lesson ends with a quick check. The final exam is drawn from the **Modern CSS** quiz in the Test Center.",
  level: "intermediate",
  cover: "violet",
  outcomes: ["Lay out pages with CSS Grid and named areas", "Design mobile-first with media queries and container queries", "Theme with custom properties and write nested CSS", "Add transitions and animations that respect reduced-motion settings"],
  skills: ["CSS Grid", "Responsive design", "Container queries", "Custom properties", "CSS animations", "Tailwind CSS"],
  quiz: {"name": "Modern CSS: Grid, Responsive Design and Motion", "slug": "web-modern-css", "description": "Practice questions for Course 3 of the Web Foundations Program: Grid, responsive design, custom properties and motion.", "tags": ["css", "web-foundations", "responsive"]},
  topics: [{"key": "grid", "name": "CSS Grid", "description": "Tracks, fr, repeat, minmax, auto-fit and template areas."}, {"key": "responsive", "name": "Responsive design", "description": "Mobile-first, media queries, container queries and responsive images."}, {"key": "modern", "name": "Custom properties, nesting and :has()", "description": "Variables, themes, dark mode, nesting and the :has() selector."}, {"key": "motion", "name": "Transitions, animations and utility CSS", "description": "transition, @keyframes, prefers-reduced-motion and Tailwind."}],
  modules: [
    {
      id: "layout",
      title: "Layout",
      lessons: [
        {
          id: "css-grid",
          title: "CSS Grid",
          minutes: 25,
          blocks: [
            text("## Rows and columns together\n\n```css\n.page {\n  display: grid;\n  grid-template-columns: 240px 1fr;       /* sidebar and the rest */\n  grid-template-rows: auto 1fr auto;\n  grid-template-areas:\n    \"header header\"\n    \"nav    main\"\n    \"footer footer\";\n  gap: 16px;\n  min-height: 100dvh;\n}\nheader { grid-area: header; }\nnav    { grid-area: nav; }\nmain   { grid-area: main; }\nfooter { grid-area: footer; }\n```\n\n`fr` is a fraction of the free space. Named areas make the layout readable at a glance."),
            text("## Responsive card grids without media queries\n\n```css\n.cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\n  gap: 16px;\n}\n```\n\nThe browser fits as many columns of at least 260px as there is room for, and stretches them to fill the row. Zebron's resource and job cards use this kind of layout.\n\nPlace one item precisely with `grid-column: 1 / -1` (span every column) or `grid-column: span 2`. Use Grid for two-dimensional layout and Flexbox for one row or column; they combine well."),
            check("What does repeat(auto-fit, minmax(260px, 1fr)) do?", ["Always makes 260 columns", "Fits as many columns of at least 260px as possible and stretches them", "Makes one column", "Hides overflowing cards"], 1, "auto-fit with minmax creates a fluid number of columns."),
          ],
        },
        {
          id: "responsive",
          title: "Responsive design: media and container queries",
          minutes: 25,
          blocks: [
            text("## Mobile first\n\nWrite the phone layout first, then add rules for wider screens:\n\n```css\n.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }\n\n@media (min-width: 640px) {\n  .actions { display: flex; flex-wrap: wrap; }\n}\n@media (prefers-color-scheme: dark) { … }\n@media (hover: none) { /* touch screens: show controls that appear on hover elsewhere */ }\n```\n\nSmall screens get simple, fast CSS; larger screens add to it. Zebron's home page buttons use exactly this pattern (two per row on phones)."),
            text("## Container queries\n\nMedia queries look at the window. **Container queries** look at the space a component actually has, so the same card works in a narrow sidebar and a wide main column:\n\n```css\n.card-list { container-type: inline-size; }\n\n@container (min-width: 500px) {\n  .card { display: grid; grid-template-columns: 120px 1fr; }\n}\n```\n\n## Responsive images\n\n```html\n<img src=\"team-800.jpg\"\n     srcset=\"team-400.jpg 400w, team-800.jpg 800w, team-1600.jpg 1600w\"\n     sizes=\"(min-width: 1024px) 50vw, 100vw\"\n     alt=\"Volunteers at the food bank\" width=\"800\" height=\"533\" loading=\"lazy\" />\n```\n\nThe browser downloads the smallest file that looks sharp. `loading=\"lazy\"` waits until the image is near the screen."),
            check("What does a container query respond to?", ["The window width", "The size of the element's container", "The user's device type", "The page's scroll position"], 1, "Container queries use the container's size, so components adapt wherever they are placed."),
          ],
        },
      ],
    },
    {
      id: "maintainable",
      title: "Maintainable and lively CSS",
      lessons: [
        {
          id: "variables-nesting-has",
          title: "Custom properties, nesting and :has()",
          minutes: 20,
          blocks: [
            text("## Custom properties (CSS variables)\n\n```css\n:root {\n  --brand: #007979;\n  --navy: #032d42;\n  --radius: 12px;\n  --space: 1rem;\n}\n.button { background: var(--brand); border-radius: var(--radius); padding: var(--space); }\n\n@media (prefers-color-scheme: dark) {\n  :root { --navy: #e5f4f4; }\n}\n[data-theme=\"dark\"] { --navy: #e5f4f4; }\n```\n\nVariables cascade and can change at run time (JavaScript can set them), which makes themes and dark mode simple."),
            text("## Native nesting\n\nSupported in all current browsers:\n\n```css\n.card {\n  padding: 1rem;\n  & h2 { margin-top: 0; }\n  &:hover { border-color: var(--brand); }\n  @media (min-width: 640px) { padding: 1.5rem; }\n}\n```\n\n## :has(), the parent selector\n\n```css\n.field:has(input:invalid) label { color: #b91c1c; }   /* style the label of an invalid field */\n.card:has(img) { padding-top: 0; }                  /* cards with an image */\n```\n\nUse these with care: keep selectors short so specificity stays low."),
            check("Where do you usually define site-wide custom properties?", ["On body only", "On :root", "In JavaScript", "In each component"], 1, ":root makes them available everywhere."),
          ],
        },
        {
          id: "motion-and-utilities",
          title: "Transitions, animations and utility CSS",
          minutes: 20,
          blocks: [
            text("## Transitions and animations\n\n```css\n.button { transition: background-color 150ms ease, transform 150ms ease; }\n.button:hover { transform: translateY(-1px); }\n\n@keyframes rise-in {\n  from { opacity: 0; transform: translateY(16px); }\n  to   { opacity: 1; transform: none; }\n}\n.reveal { animation: rise-in 400ms ease-out both; }\n\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after { animation: none !important; transition: none !important; }\n}\n```\n\nAnimate `transform` and `opacity`; they are cheap for the browser. Always honour **prefers-reduced-motion**: some people get dizzy or sick from movement. Zebron's home page reveal animations do this."),
            text("## Utility-first CSS (Tailwind)\n\nInstead of naming every style, utility frameworks give small classes you combine in HTML:\n\n```html\n<div class=\"flex items-center gap-3 rounded-xl border p-4 hover:bg-gray-50 md:p-6\">…</div>\n```\n\n- Pros: fast to build, consistent spacing and colours, unused classes are removed from the final CSS.\n- Cons: long class lists; you still need to understand CSS to use it well.\n\nZebron uses **Tailwind CSS 4** for layout and spacing alongside its own CSS for components. Everything in this course is what Tailwind generates underneath."),
            check("Which properties are cheapest to animate?", ["width and height", "transform and opacity", "margin and padding", "top and left"], 1, "transform and opacity avoid layout and paint work."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("grid", "easy", "Which declaration creates a grid container?", ["display: grid", "grid: on", "layout: grid", "display: table"], 0, "display: grid."),
    mc("grid", "medium", "What does 1fr mean?", ["One pixel", "One fraction of the free space", "One frame", "One font size"], 1, "fr divides the remaining space."),
    mc("grid", "medium", "How do you make an item span every column?", ["grid-column: 1 / -1", "grid-column: all", "width: 100%", "span: full"], 0, "-1 is the last line."),
    tf("grid", "medium", "Grid is for two-dimensional layouts; Flexbox is best for a single row or column.", true, "They complement each other."),
    mc("grid", "medium", "What is grid-template-areas used for?", ["Naming regions of the layout and placing items by name", "Setting colours", "Animating the grid", "Adding borders"], 0, "Named areas make layouts readable."),
    mc("responsive", "easy", "What does mobile-first mean?", ["Only supporting phones", "Writing the small-screen CSS first and adding rules for larger screens", "Using a separate mobile site", "Hiding content on phones"], 1, "Start simple, then enhance."),
    mc("responsive", "medium", "Which media query targets touch screens without hover?", ["@media (hover: none)", "@media (touch)", "@media screen and (mobile)", "@media (pointer: mouse)"], 0, "hover: none matches devices that cannot hover."),
    mc("responsive", "medium", "Which property makes an element a size container for container queries?", ["container-type: inline-size", "display: container", "position: container", "contain: all"], 0, "container-type enables @container queries."),
    mc("responsive", "medium", "What do srcset and sizes on an image achieve?", ["Animation", "The browser picks the smallest file that looks sharp", "Cropping", "Lazy loading"], 1, "They describe available widths and the display size."),
    tf("responsive", "easy", "loading=\"lazy\" delays loading an image until it is near the screen.", true, "Native lazy loading."),
    mc("modern", "easy", "How do you use a custom property named --brand?", ["$brand", "var(--brand)", "@brand", "brand()"], 1, "var() reads custom properties."),
    mc("modern", "medium", "Why are custom properties good for dark mode?", ["They are faster", "Changing a few variables restyles everything that uses them", "They disable images", "They are required"], 1, "Themes swap variable values."),
    mc("modern", "medium", "What does .field:has(input:invalid) select?", ["Invalid inputs", "Fields that contain an invalid input", "All fields", "Inputs without a field"], 1, ":has selects an element by what it contains."),
    tf("modern", "medium", "Native CSS nesting with & works in current browsers without a preprocessor.", true, "Nesting is supported in all current major browsers."),
    mc("modern", "medium", "Where should custom properties for the whole site be declared?", [":root", "body only", "each element", ".css-vars"], 0, ":root is the document's root element."),
    mc("motion", "medium", "Which media query lets you turn off animations for people who ask for less motion?", ["prefers-color-scheme", "prefers-reduced-motion: reduce", "reduced: true", "motion: none"], 1, "Respect the user's operating-system setting."),
    mc("motion", "medium", "What defines the steps of a CSS animation?", ["@media", "@keyframes", "@supports", "@layer"], 1, "@keyframes defines the animation."),
    ms("motion", "medium", "Which are true about utility-first CSS such as Tailwind?", ["Classes are combined in the HTML", "Unused classes are removed from the build", "You no longer need to know CSS", "It keeps spacing and colours consistent"], [0, 1, 3], "Knowing CSS is still essential."),
    mc("motion", "medium", "What does transition: background-color 150ms ease do?", ["Animates background colour changes over 150ms", "Changes the colour every 150ms", "Delays the page by 150ms", "Nothing"], 0, "Transitions smooth changes between states."),
    mc("motion", "easy", "Which pair of properties should you prefer to animate for smooth performance?", ["transform and opacity", "width and margin", "top and left", "font-size and line-height"], 0, "They avoid layout recalculation."),
  ],
};
