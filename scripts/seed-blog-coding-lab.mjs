/**
 * Publish the Zebron Blog post "How to use the Zebron Coding Lab".
 *
 *   cover   public/images/blog/coding-lab-how-to.jpg
 *   image   public/images/blog/coding-lab-layout.jpg   (the Coding Lab page)
 *
 * Both pictures ship with the site, so the post shows them once the site is deployed.
 *
 * Usage (from the project root, same credentials as the other seed scripts):
 *   node scripts/seed-blog-coding-lab.mjs                     # dry run
 *   node scripts/seed-blog-coding-lab.mjs --apply             # publish
 *   node scripts/seed-blog-coding-lab.mjs --apply --pin       # publish and pin it to the top of the blog
 *   node scripts/seed-blog-coding-lab.mjs --apply --draft     # save as a draft to review first
 *   node scripts/seed-blog-coding-lab.mjs --apply --overwrite # replace it (comments, reactions and date are kept)
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const DRAFT = args.has("--draft");
const OVERWRITE = args.has("--overwrite");
const PIN = args.has("--pin");

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

const readingMinutes = (text) => Math.max(1, Math.round(text.trim().split(/\s+/).length / 220));

const POST = {
  id: "how-to-use-the-zebron-coding-lab",
  title: "How to use the Zebron Coding Lab: write and run code without installing anything",
  topic: "Tech skills",
  cover: "navy",
  coverImage: "/images/blog/coding-lab-how-to.jpg",
  coverImageAlt: "Zebron Coding Lab: write it, run it, learn it. A Python editor showing a passed exercise.",
  excerpt:
    "Practice JavaScript and Python right inside Zebron: run lesson examples, solve exercises that check your code, and keep your own projects. Free, private, and nothing to install.",
  content: `
Reading about code only gets you so far. You learn it by **typing it, running it, breaking it and fixing it**. That usually means installing tools first, which is where many beginners get stuck. The **Zebron Coding Lab** removes that step: you write and run **JavaScript** and **Python** right inside Zebron, in your browser.

It's free, there's nothing to install, and it works on a laptop, a library computer or a tablet.

![The Coding Lab: your projects and exercises on the left, the editor and output on the right](/images/blog/coding-lab-layout.jpg)

# Where to find it

1. Sign in and open **Courses**.
2. Click the **Coding Lab** tab. On a phone, it's under **More**.

You'll see **My projects** and **Exercises** on the left, and the editor on the right. You'll also meet the Coding Lab inside lessons: more on that below.

# Run your first program

1. Click **New** and choose **JavaScript → Blank** or **Python → Blank**.
2. Press **Run** (or **Ctrl+Enter**, **Cmd+Enter** on a Mac).
3. You'll see \`Hello, Zebron!\` under **Output**.

Now change the text and run it again. That's the whole loop: **change, run, look**.

> **Python** starts the first time you run it, which takes a few seconds. After that, runs are quick, because your browser keeps it.

## The editor helps you as you type

- Code is **coloured**, so keywords, text and numbers stand out.
- Brackets and quotes **close themselves**.
- **Tab** indents and **Shift+Tab** removes indentation. Python cares about indentation, so this matters.
- **Ctrl+F** searches your code.
- To leave the editor with the keyboard, press **Esc**, then **Tab**.

## Programs that ask questions

If your code asks for input (\`input()\` in Python, \`prompt()\` in JavaScript), open **Program input** under the editor and type the answers, one line for each question. Then press **Run**.

## When something goes wrong

Errors appear in **red**, with the line number. Read the last line first: it says what went wrong, such as a misspelled name or a missing bracket.

- **A loop that never ends?** The lab stops your code automatically after a few seconds, so the page never freezes.
- **\`document\` or \`window\` is not defined?** The lab runs plain JavaScript, not a web page.
- **A Python package is missing?** The standard library is there, and packages such as **numpy** and **pandas** load when you import them, but not every package is available.

# Practice with exercises

Exercises give you a small task and **check your code for you**.

1. Under **Exercises**, choose **JavaScript** or **Python**, then pick an exercise. They go from **Starter** to **Challenge**.
2. Read the instructions and change the starting code.
3. Click **Check my code**. Each check shows whether it passed and, if not, why.
4. Stuck? **Hint** shows one hint at a time. After your first try, you can **Show a solution** and compare it with yours.

When every check passes, the exercise gets a **green tick** that stays, and your code is saved as you type.

| Python exercises | JavaScript exercises |
| --- | --- |
| Say hello | Say hello |
| Add up a list | Add up a list |
| Letter grade | Format a name |
| Who passed? | Who passed? |
| Count the words | Average score |
| Average score | Group by status |
| Read an API response | Read an API response |
| A Learner class | Wait for two requests |

# Keep your own projects

Projects are your scratchpad for anything: a calculator, a practice problem from class, an idea you want to try.

- Click **New** and pick a template, such as **Lists and loops**, **Dictionaries and JSON**, **Functions** or **Classes** for Python, or **Arrays**, **Objects and JSON** or **Async and await** for JavaScript.
- Rename a project by clicking its name.
- Projects **save automatically** a few seconds after you stop typing. A small dot next to a project means it has changes that aren't saved yet.
- The **JS** and **PY** labels show each project's language.

# The Coding Lab inside your lessons

You don't have to leave a course to practice:

- **Code examples have a Run button.** In lessons, JavaScript and Python examples show **Run** in the corner. Click it to open the example in an editor, then change it and run it again. It's the fastest way to understand an example: change one thing and see what happens.
- **Coding exercises** appear in some lessons, with the same **Check my code**, hints and solution. They're there to help you practise, so they never stop you from finishing a lesson.
- **Open in the Coding Lab** (the arrow icon) copies the code into a new project, so you can keep working on it later.

The **Python for AI Engineering** course is a great place to start: almost every lesson has examples you can run.

# Is my code private?

Yes. Your projects and exercise work are saved to **your account only**. Your teachers and other learners can't see them.

Your code also runs **in your own browser**, separately from Zebron. It can't reach your account or other websites. That's what makes it safe to experiment.

# Tips for learning faster

1. **Type the examples instead of copying them.** Your fingers learn the patterns.
2. **Change one thing at a time**, then run. If it breaks, you know exactly what did it.
3. **Read error messages out loud.** They're usually telling you exactly what's wrong.
4. **Try the exercise before the hint**, and the hint before the solution.
5. **Come back tomorrow.** Fifteen minutes a day beats three hours once a week.

# For course authors

Teachers and course authors can add a **Coding exercise** block to any lesson in the course builder. Choose JavaScript or Python, then write the instructions, starting code, checks, hints and an optional solution. **Run the checks on the solution** makes sure the checks work before learners see them. The Knowledge Center article *Zebron Coding Lab: write and run code* has the details.

# Try it now

Open **Courses → Coding Lab**, pick **Python → Say hello**, and press **Run**. You'll have written your first program in under a minute.
`,
};

async function main() {
  const content = POST.content.trim();
  const ref = db.collection("blogPosts").doc(POST.id);
  const existing = await ref.get();

  console.log(`${APPLY ? "Writing" : "Dry run:"} 1 post to ${PROJECT_ID} as ${DRAFT ? "a draft" : "published"}${PIN ? ", pinned" : ""}\n`);

  if (existing.exists && !OVERWRITE) {
    console.log(`  skip    ${POST.id} (already exists; use --overwrite to replace)`);
    return;
  }

  const keptDate = existing.exists ? existing.get("publishedAt") : null;
  const data = {
    section: "public",
    organizationId: null,
    title: POST.title,
    excerpt: POST.excerpt,
    content,
    topic: POST.topic,
    cover: POST.cover,
    coverImage: POST.coverImage,
    coverImageAlt: POST.coverImageAlt,
    pinned: PIN,
    readingMinutes: readingMinutes(content),
    status: DRAFT ? "draft" : "published",
    reviewNote: null,
    authorId: "zebron-editorial",
    authorName: "Zebron Editorial Team",
    updatedAt: FieldValue.serverTimestamp(),
    publishedAt: DRAFT ? null : keptDate ?? Timestamp.now(),
    publishAt: null,
    ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  };

  console.log(`  ${existing.exists ? "replace" : "create "} ${POST.id}  [${POST.topic}, ${data.readingMinutes} min read]`);

  if (APPLY) {
    await ref.set(data, { merge: true });
  }

  console.log(APPLY ? "\nDone. Open /blog to see it." : "\nNothing written. Add --apply to publish.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
