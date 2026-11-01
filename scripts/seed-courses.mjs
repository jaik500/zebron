/**
 * Seed two starter Zebron courses so the Courses pages have content
 * before the course builder exists:
 *
 *   intro-to-cybersecurity   8 lessons in 3 modules, with quick checks
 *   job-interview-essentials 4 lessons in 2 modules, with quick checks
 *
 * Writes courses/{courseId} (with the outline) and
 * courses/{courseId}/lessons/{lessonId} (the lesson blocks).
 *
 * Usage (from the project root, same credentials as the quiz migration):
 *   node scripts/seed-courses.mjs                  # dry run: lists what would be written
 *   node scripts/seed-courses.mjs --apply          # write courses that do not exist yet
 *   node scripts/seed-courses.mjs --apply --overwrite
 *        # also replace existing seeded courses (learners' progress is kept)
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const OVERWRITE = args.has("--overwrite");

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

const check = (question, options, answer, explanation) => ({ type: "check", question, options, answer, explanation });
const text = (value) => ({ type: "text", text: value.trim() });
const tip = (value) => ({ type: "tip", text: value.trim() });

const COURSES = [
  {
    id: "intro-to-cybersecurity",
    title: "Introduction to Cybersecurity",
    summary: "Build a foundation in security ideas, common threats and safe habits at work and at home.",
    description:
      "No technical background needed. Each lesson takes about ten minutes and ends with a quick check, so you know you have it before moving on.\n\nBy the end you will spot the attacks people fall for most and know exactly what to do when something looks wrong.",
    topic: "Cybersecurity",
    level: "beginner",
    cover: "navy",
    outcomes: [
      "Explain confidentiality, integrity and availability",
      "Spot phishing and social engineering",
      "Protect accounts with strong passwords and multi-factor sign-in",
      "Report a security incident the right way",
    ],
    skills: ["Security basics", "Phishing awareness", "Account security"],
    modules: [
      {
        id: "foundations",
        title: "Security foundations",
        lessons: [
          {
            id: "cia-triad",
            title: "The CIA triad",
            minutes: 8,
            blocks: [
              text(`
Security is about protecting three things, often called the **CIA triad**:

- **Confidentiality**: only the right people can see information.
- **Integrity**: information is accurate and has not been changed without permission.
- **Availability**: information and systems are there when people need them.

Almost every security problem harms one of these three. A leaked customer list breaks confidentiality. A changed bank account number on an invoice breaks integrity. A website knocked offline breaks availability.
`),
              tip("When you hear about a security incident, ask: which of the three was harmed? It makes the news much easier to understand."),
              check(
                "Someone secretly changes the amount on an invoice before it is paid. Which part of the triad is harmed?",
                ["Confidentiality", "Integrity", "Availability"],
                1,
                "The information was changed without permission, so its integrity is broken.",
              ),
            ],
          },
          {
            id: "assets-threats-risk",
            title: "Assets, threats and risk",
            minutes: 10,
            blocks: [
              text(`
Three words come up all the time in security:

- An **asset** is anything worth protecting: data, devices, accounts, even a company's reputation.
- A **threat** is something that could harm an asset: a thief, a phishing email, a flood.
- A **vulnerability** is a weakness a threat can use: a reused password, an unpatched laptop.

**Risk** is how likely harm is, and how bad it would be. Security work is mostly about lowering risk: fixing vulnerabilities, protecting the most valuable assets first, and having a plan for when things go wrong.
`),
              check(
                "Your laptop has not installed updates for months. What is that?",
                ["An asset", "A threat", "A vulnerability"],
                2,
                "Missing updates are a weakness that a threat could use: a vulnerability.",
              ),
            ],
          },
          {
            id: "security-mindset",
            title: "Thinking like a defender",
            minutes: 7,
            blocks: [
              text(`
Attackers look for the easiest way in, and very often that is a person, not a computer. A good security mindset is simple:

1. **Slow down** when something is urgent, unexpected or too good to be true.
2. **Verify** through a channel you already trust: call the number on the official website, not the one in the message.
3. **Speak up** early. Reporting a mistake quickly is far better than hiding it.
`),
              check(
                "A message from your 'manager' asks you to buy gift cards urgently and keep it quiet. What is the best first step?",
                ["Buy them quickly so you are not blamed", "Verify with your manager using a number or channel you already know", "Reply to the message asking if it is real"],
                1,
                "Verify through a channel you already trust. Replying to the message only reaches the attacker.",
              ),
            ],
          },
        ],
      },
      {
        id: "threats",
        title: "Common threats",
        lessons: [
          {
            id: "phishing",
            title: "Phishing and social engineering",
            minutes: 12,
            blocks: [
              text(`
**Phishing** messages pretend to come from someone you trust so that you click a link, open a file or share a code. They arrive by email, text message, social media and phone calls.

Watch for these signs:

- **Urgency or fear**: "Your account will be closed today."
- **A look-alike address**: paypa1-security.com instead of paypal.com.
- **Unexpected attachments** or requests to "confirm" your password.
- **Requests for codes**: no real company or IT team asks for your sign-in code.
`),
              tip("Hover over a link (or press and hold on a phone) to see where it really goes before you tap it."),
              check(
                "An email from 'PayPal' asks you to confirm your account at paypa1-security.com. What is the safest move?",
                ["Click the link and sign in quickly", "Go to paypal.com yourself, and report the email", "Reply and ask if it is real"],
                1,
                "The address is a look-alike. Go to the real site yourself and report the message.",
              ),
            ],
          },
          {
            id: "malware",
            title: "Malware and safe downloads",
            minutes: 11,
            blocks: [
              text(`
**Malware** is software built to cause harm: stealing passwords, locking files for ransom (**ransomware**) or spying on what you type.

It usually arrives through:

- attachments and links in phishing messages,
- "free" versions of paid software,
- fake update or virus-warning pop-ups,
- USB sticks from unknown sources.

Protect yourself by installing software only from official stores or the maker's website, keeping your system updated, and never enabling macros in documents you did not expect.
`),
              check(
                "A website pop-up says your computer is infected and asks you to download a cleaner. What should you do?",
                ["Download it, the warning looks official", "Close the page and run the security software you already have", "Call the phone number in the pop-up"],
                1,
                "Fake virus warnings are a common way to deliver malware. Close the page and use your own trusted tools.",
              ),
            ],
          },
        ],
      },
      {
        id: "protect",
        title: "Protecting yourself",
        lessons: [
          {
            id: "passwords-mfa",
            title: "Passwords and multi-factor sign-in",
            minutes: 9,
            blocks: [
              text(`
Most account break-ins use stolen or guessed passwords. Two habits stop nearly all of them:

1. **A different password for every account.** A password manager remembers them for you; you only remember one strong passphrase, like *river-lantern-cactus-91*.
2. **Multi-factor authentication (MFA).** After your password, you confirm with a code or an app on your phone. A stolen password alone is then not enough.

Turn on MFA first for your email: whoever controls your email can reset the passwords of almost everything else.
`),
              check(
                "Which account should get multi-factor sign-in first?",
                ["Your email", "A shopping site you used once", "A game account"],
                0,
                "Your email can reset other accounts' passwords, so it is the most valuable to protect.",
              ),
            ],
          },
          {
            id: "reporting",
            title: "Reporting an incident",
            minutes: 7,
            blocks: [
              text(`
Everyone makes mistakes. What matters is acting fast. If you clicked a bad link, shared a password or lost a device:

1. **Report it straight away** to your IT or security contact. Minutes matter.
2. **Change the affected password** from a device you trust, and sign out other sessions.
3. **Write down what happened**: time, message, what you clicked. It helps others respond.

At work, follow your organization's reporting process. At home, contact your bank or the service involved directly.
`),
              tip("Fast reporting is never a reason for blame. It is often what stops a small mistake from becoming a big incident."),
              check(
                "You realise you typed your work password into a fake page an hour ago. What comes first?",
                ["Wait to see if anything happens", "Report it to IT or security right away", "Delete the email so no one knows"],
                1,
                "Report it immediately so the account can be secured before it is misused.",
              ),
            ],
          },
        ],
      },
    ],
  },
  {
    id: "job-interview-essentials",
    title: "Job Interview Essentials",
    summary: "Prepare, answer with confidence and follow up so employers remember you.",
    description:
      "A short, practical course for anyone heading into interviews. Each lesson ends with a quick check.",
    topic: "Careers",
    level: "all",
    cover: "violet",
    outcomes: [
      "Research a role and employer in under an hour",
      "Answer behavioural questions with the STAR method",
      "Ask strong questions of your own",
      "Follow up in a way that keeps you top of mind",
    ],
    skills: ["Interviewing", "Communication"],
    modules: [
      {
        id: "prepare",
        title: "Before the interview",
        lessons: [
          {
            id: "research",
            title: "Research the role and employer",
            minutes: 8,
            blocks: [
              text(`
Good preparation shows. In about an hour you can:

- **Read the job posting twice** and highlight the skills it repeats. Those are what you will be asked about.
- **Visit the employer's website and recent news.** Note one thing you genuinely like about them.
- **Match your experience** to each key skill with a short example.
`),
              check(
                "Which skills should you prepare examples for first?",
                ["The ones the job posting repeats or stresses", "The ones you find most interesting", "Every skill you have ever used"],
                0,
                "Repeated skills in the posting are what the employer cares about most.",
              ),
            ],
          },
          {
            id: "star",
            title: "Answering with STAR",
            minutes: 10,
            blocks: [
              text(`
For "Tell me about a time when..." questions, use **STAR**:

- **Situation**: set the scene in one or two sentences.
- **Task**: what you needed to achieve.
- **Action**: what *you* did. This is the biggest part.
- **Result**: what happened, with a number if you can.

Prepare three or four STAR stories you can adapt to different questions.
`),
              tip("Say 'I', not 'we', when describing your actions. Interviewers want to know what you did."),
              check(
                "Which part of a STAR answer should be the longest?",
                ["Situation", "Action", "Result"],
                1,
                "The Action shows your skills, so it deserves the most time.",
              ),
            ],
          },
        ],
      },
      {
        id: "during-after",
        title: "During and after",
        lessons: [
          {
            id: "your-questions",
            title: "Asking your own questions",
            minutes: 6,
            blocks: [
              text(`
"Do you have any questions for us?" is a chance to stand out. Strong questions:

- *What would success look like in the first three months?*
- *What do people enjoy most about working here?*
- *What are the next steps in the process?*

Avoid asking only about pay and holidays in a first interview; save those for when an offer is near.
`),
              check(
                "Which question makes the strongest impression in a first interview?",
                ["How many holidays do I get?", "What would success look like in the first three months?", "No, I have no questions"],
                1,
                "It shows you are already thinking about doing the job well.",
              ),
            ],
          },
          {
            id: "follow-up",
            title: "Following up",
            minutes: 5,
            blocks: [
              text(`
Send a short thank-you message within 24 hours:

1. Thank them for their time.
2. Mention one thing from the conversation you enjoyed.
3. Restate in one sentence why you are a good fit.

If you have not heard back by the date they gave, a polite one-line check-in is fine.
`),
              check(
                "When should you send a thank-you message?",
                ["Within 24 hours", "After a week", "Only if you get the job"],
                0,
                "Within a day keeps you fresh in the interviewer's mind.",
              ),
            ],
          },
        ],
      },
    ],
  },
];

async function seedCourse(course) {
  const courseRef = db.collection("courses").doc(course.id);
  const existing = await courseRef.get();

  if (existing.exists && !OVERWRITE) {
    console.log(`skip   ${course.id} (already exists; pass --overwrite to replace)`);
    return;
  }

  let order = 0;
  const lessons = [];
  const modules = course.modules.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((lesson) => {
      order += 1;
      lessons.push({ ...lesson, moduleId: module.id, order });
      return {
        id: lesson.id,
        title: lesson.title,
        minutes: lesson.minutes,
        hasCheck: lesson.blocks.some((block) => block.type === "check"),
      };
    }),
  }));

  const estimatedMinutes = lessons.reduce((total, lesson) => total + lesson.minutes, 0);
  console.log(`${APPLY ? "write " : "would "} ${course.id}: ${modules.length} modules, ${lessons.length} lessons, ${estimatedMinutes} min`);

  if (!APPLY) {
    return;
  }

  const batch = db.batch();
  const { modules: _sourceModules, id: _id, ...fields } = course;

  batch.set(courseRef, {
    ...fields,
    modules,
    lessonCount: lessons.length,
    estimatedMinutes,
    status: "published",
    providerName: "Zebron",
    authorName: "Zebron",
    organizationId: null,
    createdAt: existing.exists ? existing.get("createdAt") ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
    publishedAt: existing.exists ? existing.get("publishedAt") ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Remove lessons that are no longer in the outline.
  const keep = new Set(lessons.map((lesson) => lesson.id));
  const current = await courseRef.collection("lessons").get();
  current.docs.filter((doc) => !keep.has(doc.id)).forEach((doc) => batch.delete(doc.ref));

  for (const lesson of lessons) {
    batch.set(courseRef.collection("lessons").doc(lesson.id), {
      title: lesson.title,
      moduleId: lesson.moduleId,
      order: lesson.order,
      minutes: lesson.minutes,
      blocks: lesson.blocks,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}

for (const course of COURSES) {
  await seedCourse(course);
}

console.log(APPLY ? "Done." : "Dry run only. Run again with --apply to write.");
