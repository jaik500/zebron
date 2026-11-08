import { check, mc, ms, ord, st, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 2,
  id: "web-css-foundations",
  title: "CSS Foundations: Selectors, the Box Model and Flexbox",
  summary: "Course 2 of 7 in the Zebron Web Foundations Program. Style pages with CSS: selectors, the cascade and specificity, the box model, colour, typography and units, and Flexbox.",
  description: "CSS controls how HTML looks: colours, fonts, spacing and layout. This course covers how the browser decides which rule wins (the cascade and specificity), how every element is a box, how to choose colours, fonts and units, and how to line things up with Flexbox.\n\nEach lesson ends with a quick check. The final exam is drawn from the **CSS Foundations** quiz in the Test Center.",
  level: "beginner",
  cover: "sky",
  outcomes: ["Write selectors and predict which rule wins", "Control size and spacing with the box model", "Choose colours, fonts and units that scale", "Lay out rows and columns with Flexbox"],
  skills: ["CSS selectors", "Specificity", "Box model", "Typography", "Flexbox"],
  quiz: {"name": "CSS Foundations", "slug": "web-css-foundations", "description": "Practice questions for Course 2 of the Web Foundations Program: selectors, cascade, box model, units and Flexbox.", "tags": ["css", "web-foundations"]},
  topics: [{"key": "selectors", "name": "Selectors, cascade and specificity", "description": "Type, class, id, attribute and pseudo-class selectors; which rule wins."}, {"key": "box", "name": "The box model", "description": "Content, padding, border, margin and box-sizing."}, {"key": "type", "name": "Colour, typography and units", "description": "Colour formats, contrast, font stacks, rem, em, %, vw."}, {"key": "flex", "name": "Flexbox", "description": "Flex containers, direction, justify, align, gap and wrapping."}],
  modules: [
    {
      id: "rules",
      title: "Rules and boxes",
      lessons: [
        {
          id: "selectors-cascade",
          title: "Selectors, the cascade and specificity",
          minutes: 25,
          blocks: [
            text("## Adding CSS\n\n```html\n<link rel=\"stylesheet\" href=\"styles.css\" />\n```\n\n```css\n/* selector { property: value; } */\nh1 { color: #032d42; }\n.card { padding: 16px; }          /* class: reusable */\n#site-header { height: 64px; }     /* id: one element; avoid for styling */\na:hover { text-decoration: underline; }   /* pseudo-class: a state */\ninput[type=\"email\"] { width: 100%; }      /* attribute */\n.card > h2 { margin-top: 0; }             /* direct child */\n.card p { line-height: 1.6; }             /* any descendant */\n```\n\nUseful pseudo-classes: `:hover`, `:focus-visible`, `:disabled`, `:first-child`, `:nth-child(2n)`, `:not(.done)`. Pseudo-elements add generated parts: `::before`, `::after`, `::placeholder`."),
            text("## Which rule wins\n\nWhen two rules set the same property on the same element, the browser decides in this order:\n\n1. **Importance:** `!important` beats normal rules (use it rarely).\n2. **Specificity:** id (1,0,0) > class, attribute, pseudo-class (0,1,0) > element (0,0,1).\n3. **Order:** if specificity is equal, the later rule wins.\n\n```css\np { color: gray; }            /* 0,0,1 */\n.note { color: teal; }        /* 0,1,0  → wins over p */\n.card .note { color: navy; }  /* 0,2,0  → wins over .note */\n```\n\nSome properties **inherit** from the parent (colour, font), others do not (margin, border). Keep specificity low and flat (mostly single classes) so styles are easy to override."),
            check("Which selector has the highest specificity?", ["p", ".note", "#intro", "div p"], 2, "An id selector outranks classes and elements."),
          ],
        },
        {
          id: "box-model",
          title: "The box model",
          minutes: 20,
          blocks: [
            text("## Every element is a box\n\nFrom the inside out: **content → padding → border → margin**.\n\n```css\n.card {\n  width: 320px;\n  padding: 16px;              /* space inside the border */\n  border: 1px solid #d1d5db;\n  margin: 0 auto 24px;        /* top, left/right (auto centres), bottom */\n  border-radius: 12px;\n}\n```\n\nBy default `width` sets only the content, so padding and border make the box wider. Most projects switch every element to the easier model:\n\n```css\n*, *::before, *::after { box-sizing: border-box; }\n```\n\nNow `width: 320px` includes padding and border."),
            text("## Display and overflow\n\n- `display: block` takes the full width and starts on a new line (`div`, `p`, `h1`).\n- `display: inline` flows in text and ignores width and height (`a`, `span`, `strong`).\n- `display: inline-block` flows in text but accepts width and height.\n- `display: none` removes it (and hides it from screen readers).\n- **Margin collapsing:** the vertical margins of two blocks touching each other merge into the larger one.\n- `overflow: auto` adds scrollbars when content is larger than the box.\n\nUse DevTools (right-click → Inspect) to see each box's sizes in the **Computed** panel."),
            check("With box-sizing: border-box, what does width: 300px include?", ["Content only", "Content, padding and border", "Content, padding, border and margin", "Margin only"], 1, "border-box includes padding and border, not margin."),
          ],
        },
      ],
    },
    {
      id: "look-and-layout",
      title: "Look and layout",
      lessons: [
        {
          id: "colour-type-units",
          title: "Colour, typography and units",
          minutes: 20,
          blocks: [
            text("## Colour\n\n```css\ncolor: #032d42;                 /* hex */\ncolor: rgb(3 45 66);            /* rgb */\nbackground: rgb(0 121 121 / 0.1);   /* with transparency */\ncolor: hsl(180 100% 24%);       /* hue, saturation, lightness */\n```\n\nText needs a contrast ratio of at least **4.5:1** with its background (3:1 for large text). Check it in DevTools' colour picker.\n\n## Typography\n\n```css\nbody {\n  font-family: Roboto, system-ui, sans-serif;   /* a stack with fallbacks */\n  font-size: 1rem;           /* usually 16px */\n  line-height: 1.5;\n}\nh1 { font-size: clamp(1.75rem, 4vw, 3rem); font-weight: 800; }\n```"),
            text("## Units\n\n| Unit | Relative to | Use for |\n| --- | --- | --- |\n| `px` | fixed | borders, small details |\n| `rem` | the root font size | font sizes, spacing (respects the user's setting) |\n| `em` | the element's font size | padding that should grow with its text |\n| `%` | the parent | widths |\n| `vw`, `vh`, `dvh` | the viewport | full-screen sections (`dvh` handles mobile browser bars) |\n| `ch` | width of \"0\" | readable line length: `max-width: 65ch` |\n\nPrefer `rem` for text so people who enlarge their browser's font get larger text."),
            check("Which unit respects the font size the user chose in their browser settings?", ["px", "rem", "vw", "cm"], 1, "rem is relative to the root font size."),
          ],
        },
        {
          id: "flexbox",
          title: "Flexbox",
          minutes: 25,
          blocks: [
            text("## One direction at a time\n\n```css\n.toolbar {\n  display: flex;\n  align-items: center;          /* cross axis: vertical here */\n  justify-content: space-between; /* main axis: horizontal here */\n  gap: 12px;\n}\n.toolbar .search { flex: 1; }   /* take the remaining space */\n```\n\n- `flex-direction: row` (default) or `column` sets the **main axis**.\n- `justify-content` places items along the main axis: `flex-start`, `center`, `space-between`, `space-around`.\n- `align-items` places them across: `stretch` (default), `center`, `flex-start`, `baseline`.\n- `gap` spaces items without margins.\n- `flex-wrap: wrap` lets items move to a new line."),
            text("## Growing and shrinking\n\n`flex: 1` is short for `flex-grow: 1; flex-shrink: 1; flex-basis: 0`. Items with `flex: 1` share free space equally; `flex: 2` takes twice as much. `flex: none` keeps an item at its natural size.\n\n```css\n/* A card row that wraps on small screens */\n.cards { display: flex; flex-wrap: wrap; gap: 16px; }\n.cards > .card { flex: 1 1 260px; }   /* at least about 260px, then grow */\n```\n\nCentring anything:\n\n```css\n.center { display: flex; align-items: center; justify-content: center; }\n```\n\nFlexbox is for one row or one column. For two-dimensional layouts (rows **and** columns), use Grid (next course)."),
            check("In a flex row, which property centres items vertically?", ["justify-content: center", "align-items: center", "text-align: center", "vertical-align: middle"], 1, "align-items works on the cross axis, which is vertical in a row."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("selectors", "easy", "Which selector targets every element with class=\"card\"?", ["#card", "card", ".card", "*card"], 2, "A dot selects by class."),
    mc("selectors", "medium", "Two rules with equal specificity set the same property. Which wins?", ["The first", "The later one", "Neither", "The shorter one"], 1, "With equal specificity, source order decides."),
    mc("selectors", "medium", "Which pseudo-class styles keyboard focus without showing a ring on mouse clicks?", [":focus", ":focus-visible", ":active", ":hover"], 1, ":focus-visible follows the browser's heuristics."),
    tf("selectors", "medium", "color is inherited by child elements, but margin is not.", true, "Text properties inherit; box properties do not."),
    mc("selectors", "medium", "What does .card > h2 select?", ["Any h2 inside .card", "h2 elements that are direct children of .card", "The first h2 after .card", "h2 with class card"], 1, "> is the child combinator."),
    mc("box", "easy", "Which is the order of the box model from inside to outside?", ["margin, border, padding, content", "content, padding, border, margin", "content, margin, padding, border", "padding, content, border, margin"], 1, "Content, padding, border, margin."),
    mc("box", "medium", "Which value of margin centres a block with a set width horizontally?", ["margin: center", "margin: 0 auto", "margin: auto 0", "align: center"], 1, "Auto left and right margins split the free space."),
    mc("box", "medium", "Which display value ignores width and height?", ["block", "inline", "inline-block", "flex"], 1, "Inline elements size to their content."),
    tf("box", "medium", "Vertical margins of two adjacent blocks can collapse into one.", true, "Margin collapsing keeps the larger margin."),
    mc("box", "medium", "Where in DevTools do you see an element's final sizes?", ["Console", "Computed panel", "Network", "Sources"], 1, "The Computed panel shows the box model."),
    mc("type", "easy", "What contrast ratio should normal body text have at least?", ["2:1", "3:1", "4.5:1", "7:1 only"], 2, "WCAG AA asks for 4.5:1."),
    mc("type", "medium", "Why list several fonts in font-family?", ["To load all of them", "Fallbacks if earlier fonts are unavailable", "To mix them", "It is required"], 1, "The browser uses the first available font."),
    mc("type", "medium", "Which value keeps paragraphs to a readable line length?", ["max-width: 100vw", "max-width: 65ch", "width: 2000px", "font-size: 65px"], 1, "About 60 to 75 characters is comfortable."),
    mc("type", "medium", "Which unit is relative to the element's own font size?", ["rem", "em", "px", "vh"], 1, "em uses the element's font size."),
    tf("type", "medium", "clamp(1.75rem, 4vw, 3rem) lets a heading grow with the screen between a minimum and a maximum.", true, "clamp(min, preferred, max)."),
    mc("flex", "easy", "Which declaration turns an element into a flex container?", ["position: flex", "display: flex", "flex: 1", "layout: flex"], 1, "display: flex."),
    mc("flex", "medium", "Which property places items along the main axis?", ["align-items", "justify-content", "align-content", "place-self"], 1, "justify-content works on the main axis."),
    mc("flex", "medium", "What does flex: 1 on an item do?", ["Fixes its width to 1px", "Lets it grow to share the free space", "Hides it", "Puts it first"], 1, "flex-grow: 1 shares free space."),
    mc("flex", "medium", "Which property lets flex items move onto a new line?", ["flex-direction", "flex-wrap: wrap", "overflow: wrap", "white-space: wrap"], 1, "flex-wrap: wrap."),
    ms("flex", "medium", "Which are true about gap in Flexbox?", ["It adds space between items", "It replaces many margin tricks", "It adds space outside the container", "It works with flex-wrap"], [0, 1, 3], "gap only adds space between items."),
  ],
};
