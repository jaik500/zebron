import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 1,
  id: "web-html",
  title: "HTML: Structure, Content and Forms",
  summary: "Course 1 of 7 in the Zebron Web Foundations Program. Write well-structured, semantic and accessible HTML: documents, text, links, images, lists, tables and forms.",
  description: "HTML describes what is on a page: headings, paragraphs, links, images, lists, tables and forms. Everything else on the web (CSS for looks, JavaScript for behaviour, frameworks such as Angular) builds on it.\n\nYou need nothing but a text editor (Visual Studio Code is recommended) and a browser. Save a file as `index.html`, open it in the browser, and refresh after each change.\n\nEach lesson ends with a quick check. The final exam is drawn from the **HTML: Structure, Content and Forms** quiz in the Test Center.",
  level: "beginner",
  cover: "sunrise",
  outcomes: ["Write a valid HTML document with head and body", "Mark up text, links, images, lists and tables correctly", "Build forms with labels, input types and built-in validation", "Use semantic elements and basic accessibility practices"],
  skills: ["HTML5", "Semantic HTML", "Forms", "Accessibility basics"],
  quiz: {"name": "HTML: Structure, Content and Forms", "slug": "web-html", "description": "Practice questions for Course 1 of the Web Foundations Program: documents, content, forms and semantic HTML.", "tags": ["html", "web-foundations"]},
  topics: [{"key": "document", "name": "Document structure", "description": "Doctype, html, head, body, metadata and elements."}, {"key": "content", "name": "Text, links, images, lists and tables", "description": "Headings, paragraphs, anchors, images with alt, lists and data tables."}, {"key": "forms", "name": "Forms", "description": "form, label, input types, select, textarea, buttons and validation attributes."}, {"key": "semantics", "name": "Semantics and accessibility", "description": "Landmarks, heading order, alt text and accessible names."}],
  modules: [
    {
      id: "pages",
      title: "Pages and content",
      lessons: [
        {
          id: "document-structure",
          title: "Your first HTML document",
          minutes: 20,
          blocks: [
            text("## The skeleton\n\n```html\n<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <title>Job board</title>\n    <link rel=\"stylesheet\" href=\"styles.css\" />\n  </head>\n  <body>\n    <h1>Open jobs</h1>\n    <p>New listings every day.</p>\n    <script src=\"app.js\" defer></script>\n  </body>\n</html>\n```\n\n- `<!DOCTYPE html>` tells the browser to use modern standards mode.\n- `lang` helps screen readers and translation.\n- `<head>` holds information **about** the page: character set, the viewport for phones, the title shown in the tab, links to CSS.\n- `<body>` holds what people see.\n- `defer` loads the script without blocking the page and runs it after the HTML is parsed."),
            text("## Elements and attributes\n\n```html\n<a href=\"/jobs\" title=\"All jobs\">Jobs</a>\n```\n\nAn **element** has a start tag, content and an end tag. **Attributes** (`href`, `title`) add information. Some elements are empty and have no end tag: `<img>`, `<input>`, `<br>`, `<meta>`.\n\nElements nest like boxes; close them in reverse order. Check your HTML with the W3C validator (validator.w3.org) when something looks wrong."),
            check("What does the viewport meta tag do?", ["Sets the page title", "Makes the page size itself to the device width on phones", "Loads the CSS", "Sets the language"], 1, "Without it, phones show a zoomed-out desktop layout."),
          ],
        },
        {
          id: "text-links-media",
          title: "Text, links, images, lists and tables",
          minutes: 25,
          blocks: [
            text("## Text\n\n```html\n<h1>Housing help</h1>          <!-- one main heading -->\n<h2>Rent assistance</h2>       <!-- sections -->\n<p>Programs in <strong>Prince George's County</strong> can help with <em>back rent</em>.</p>\n```\n\nHeadings go in order (`h1` → `h2` → `h3`); do not skip levels to get a smaller font. Use `<strong>` for importance and `<em>` for emphasis, not just for bold or italic looks.\n\n## Links and images\n\n```html\n<a href=\"https://zebron.org/resources\">Find resources</a>\n<a href=\"#contact\">Jump to contact</a>\n<a href=\"mailto:contact@zebron.org\">Email us</a>\n<img src=\"/images/team.jpg\" alt=\"Five volunteers sorting food donations\" width=\"800\" height=\"533\" />\n```\n\nLink text should make sense on its own (\"Find resources\", not \"click here\"). Every image needs `alt`: describe what matters, or `alt=\"\"` for pure decoration. Width and height stop the page jumping while the image loads."),
            text("## Lists and tables\n\n```html\n<ul><li>Resume</li><li>Photo ID</li></ul>          <!-- unordered -->\n<ol><li>Register</li><li>Apply</li></ol>          <!-- ordered steps -->\n\n<table>\n  <caption>Program fees</caption>\n  <thead><tr><th scope=\"col\">Program</th><th scope=\"col\">Cost</th></tr></thead>\n  <tbody><tr><td>Cybersecurity bootcamp</td><td>Free</td></tr></tbody>\n</table>\n```\n\nUse tables for **data**, never for page layout. `<th scope>` and `<caption>` make tables understandable to screen readers."),
            check("What should the alt text of a purely decorative image be?", ["The file name", "An empty alt=\"\"", "The word 'image'", "Leave the attribute out"], 1, "Empty alt tells screen readers to skip it; a missing alt makes them read the file name."),
          ],
        },
      ],
    },
    {
      id: "forms-and-meaning",
      title: "Forms and meaning",
      lessons: [
        {
          id: "forms",
          title: "Forms that work for everyone",
          minutes: 25,
          blocks: [
            text("## A complete form\n\n```html\n<form action=\"/apply\" method=\"post\">\n  <label for=\"name\">Full name</label>\n  <input id=\"name\" name=\"name\" autocomplete=\"name\" required />\n\n  <label for=\"email\">Email</label>\n  <input id=\"email\" name=\"email\" type=\"email\" autocomplete=\"email\" required />\n\n  <label for=\"county\">County</label>\n  <select id=\"county\" name=\"county\">\n    <option value=\"pg\">Prince George's</option>\n    <option value=\"mont\">Montgomery</option>\n  </select>\n\n  <fieldset>\n    <legend>Work type</legend>\n    <label><input type=\"radio\" name=\"type\" value=\"full\" checked /> Full time</label>\n    <label><input type=\"radio\" name=\"type\" value=\"part\" /> Part time</label>\n  </fieldset>\n\n  <label for=\"note\">Anything else?</label>\n  <textarea id=\"note\" name=\"note\" rows=\"4\" maxlength=\"500\"></textarea>\n\n  <button type=\"submit\">Apply</button>\n</form>\n```"),
            text("## What each part does\n\n- **label for = input id** links the text to the field: clicking the label focuses the field, and screen readers read it.\n- **name** is the key sent to the server.\n- **type** changes the keyboard and validation: `email`, `tel`, `url`, `number`, `date`, `password`, `checkbox`, `radio`, `file`, `search`.\n- **autocomplete** lets browsers fill known details.\n- **Validation attributes:** `required`, `minlength`, `maxlength`, `min`, `max`, `pattern`. The browser checks them before submitting, but **the server must check again**; anyone can bypass the browser.\n- **fieldset + legend** group related radios or checkboxes.\n- A `<button>` inside a form submits by default; use `type=\"button\"` for buttons that should not."),
            check("Why give each input a <label for> that matches its id?", ["It is required for CSS", "Clicking the label focuses the field and screen readers announce it", "It sends the label to the server", "It validates the field"], 1, "Labels give fields an accessible name and a larger click target."),
          ],
        },
        {
          id: "semantic-accessible",
          title: "Semantic and accessible HTML",
          minutes: 20,
          blocks: [
            text("## Landmarks\n\n```html\n<body>\n  <a class=\"skip\" href=\"#main\">Skip to content</a>\n  <header> logo, site name </header>\n  <nav aria-label=\"Main\"> menu links </nav>\n  <main id=\"main\">\n    <article> a job post or blog post </article>\n    <aside> related links </aside>\n  </main>\n  <footer> contact, legal links </footer>\n</body>\n```\n\nSemantic elements say **what** something is. Screen-reader users jump between landmarks (`header`, `nav`, `main`, `footer`), search engines understand the page, and your CSS gets clearer. Use `<div>` and `<span>` only when no meaningful element fits."),
            text("## Accessibility basics in HTML\n\n1. One `h1`, headings in order.\n2. Buttons are `<button>`, links are `<a href>`. A clickable `<div>` cannot be reached with the keyboard.\n3. Every form field has a label; every image has suitable alt text.\n4. Icon-only buttons get a name: `<button aria-label=\"Close\">×</button>`.\n5. Do not use ARIA when a native element does the job (\"no ARIA is better than bad ARIA\").\n6. Test with the keyboard alone (Tab, Shift+Tab, Enter, Space) and with Lighthouse in Chrome DevTools."),
            check("Which element should wrap the main content of a page?", ["<div id=\"main\">", "<main>", "<section>", "<body>"], 1, "<main> is the main landmark; there should be one per page."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("document", "easy", "What does <!DOCTYPE html> do?", ["Loads HTML5 from a server", "Tells the browser to use standards mode", "Adds a title", "Starts the body"], 1, "It switches the browser into standards mode."),
    mc("document", "easy", "Where does the <title> element go?", ["In <body>", "In <head>", "After </html>", "In <footer>"], 1, "Metadata about the page lives in <head>."),
    mc("document", "medium", "What does the defer attribute on a script do?", ["Never runs the script", "Downloads it without blocking and runs it after the HTML is parsed", "Runs it before the page loads", "Runs it only on click"], 1, "defer keeps parsing fast and keeps execution order."),
    tf("document", "easy", "<img> is an empty element and has no end tag.", true, "img, input, br and meta have no content."),
    mc("document", "medium", "Which attribute tells screen readers and translators the page's language?", ["charset", "lang on <html>", "locale", "hreflang on <body>"], 1, "<html lang=\"en\">."),
    mc("content", "easy", "Which element creates a link?", ["<link>", "<a href>", "<href>", "<url>"], 1, "<a href> is a hyperlink; <link> connects resources like CSS."),
    mc("content", "medium", "What is the main reason to keep headings in order (h1, h2, h3)?", ["Font size", "Screen-reader users and search engines rely on the outline", "CSS needs it", "It is faster"], 1, "Headings form the page's outline."),
    ms("content", "medium", "Which are good link texts?", ["Find resources", "Click here", "Download the 2026 fee table (PDF)", "More"], [0, 2], "Link text should make sense out of context."),
    mc("content", "medium", "What should tables be used for?", ["Page layout", "Tabular data", "Spacing", "Navigation menus"], 1, "Use CSS for layout."),
    mc("content", "medium", "Which element gives a table a title that screen readers announce?", ["<title>", "<caption>", "<th>", "<legend>"], 1, "<caption> describes the table."),
    mc("forms", "easy", "Which attribute names the value sent to the server?", ["id", "name", "label", "for"], 1, "Form data is sent as name=value pairs."),
    mc("forms", "medium", "Which input type shows an email keyboard on phones and checks the format?", ["text", "email", "mail", "string"], 1, "type=email."),
    tf("forms", "medium", "Browser validation with required and pattern is enough; the server does not need to check again.", false, "Anyone can bypass the browser; always validate on the server."),
    mc("forms", "medium", "Which elements group a set of radio buttons with a caption?", ["div and span", "fieldset and legend", "section and h2", "form and label"], 1, "fieldset + legend name the group."),
    mc("forms", "medium", "A button inside a form should not submit it. What do you write?", ["<button submit=\"false\">", "<button type=\"button\">", "<a>", "<div>"], 1, "Buttons default to type=submit inside forms."),
    mc("semantics", "easy", "Which element marks the site's main navigation?", ["<menu>", "<nav>", "<links>", "<header>"], 1, "<nav> is the navigation landmark."),
    mc("semantics", "medium", "Why is a clickable <div> a problem?", ["It is slower", "It cannot be reached or activated with the keyboard without extra work", "It is invalid HTML", "It cannot be styled"], 1, "Use <button> or <a> for interactive controls."),
    mc("semantics", "medium", "How do you name an icon-only Close button?", ["title on the page", "aria-label=\"Close\"", "alt=\"Close\"", "name=\"close\""], 1, "aria-label gives it an accessible name."),
    tf("semantics", "medium", "If a native HTML element does the job, prefer it over adding ARIA roles.", true, "Native elements bring keyboard and screen-reader support for free."),
    mc("semantics", "medium", "What does a 'Skip to content' link help with?", ["SEO", "Keyboard users jump past the menu to <main>", "Faster loading", "Printing"], 1, "It saves tabbing through every menu link."),
  ],
};
