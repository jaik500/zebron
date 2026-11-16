/**
 * Zebron Learning for Course Creators and Admins
 * A free Zebron course that teaches organizations every part of Zebron Learning:
 * taking courses, building them with the formatting toolbar, media, quick checks,
 * coding exercises, exams and certificates, publishing, assignments,
 * Training Groups and progress.
 *
 * Dry run (checks the content, writes nothing):
 *   node scripts/zebron-learning-guide/seed-zebron-learning-guide.mjs
 * Create the course (as a draft: publish it in Manage courses after a look):
 *   node scripts/zebron-learning-guide/seed-zebron-learning-guide.mjs --apply
 * Update an existing course (keeps its status, publish date and final exam):
 *   node scripts/zebron-learning-guide/seed-zebron-learning-guide.mjs --apply --overwrite
 *
 * After publishing, organizations offer it to their members under
 * Manage courses -> Zebron courses for your members.
 */

import { runCourseSeed } from '../lib/write-zebron-course.mjs';

const COURSE = {
  "id": "zebron-learning-for-course-creators",
  "title": "Zebron Learning for Course Creators and Admins",
  "summary": "Learn every part of Zebron Learning: take courses like a learner, build your own with the formatting toolbar, add exams and certificates, assign courses and follow progress.",
  "description": "A hands-on guide for the people who run learning in an organization: course authors, managers and admins. You'll see Zebron Learning from the learner's side, build a course step by step without needing to know any code or Markdown, add videos, quick checks and coding exercises, set up final exams and certificates, get courses to the right people with assignments and Training Groups, and follow their progress.",
  "topic": "Zebron Platform",
  "program": "",
  "programOrder": null,
  "level": "beginner",
  "cover": "teal",
  "outcomes": [
    "Find your way around Courses, the Test Center and the Coding Lab as a learner",
    "Build a course with modules, lessons and blocks, using the formatting toolbar and preview",
    "Add videos, slides, images, quick checks and coding exercises that work",
    "Set up a final exam and certificate, and take a course through review to publishing",
    "Get courses to learners with Zebron courses, assignments and Training Groups",
    "Follow progress with Team progress, group summaries and reports"
  ],
  "skills": [
    "Course design",
    "Course builder",
    "Quick checks",
    "Final exams",
    "Certificates",
    "Course assignments",
    "Training Groups",
    "Team progress",
    "Zebron Learning"
  ]
};

const MODULES = [
  {
    "id": "getting-around",
    "title": "Getting Around Zebron Learning",
    "lessons": [
      {
        "id": "what-zebron-learning-includes",
        "title": "What Zebron Learning Includes",
        "minutes": 5,
        "blocks": [
          {
            "type": "text",
            "text": "# What Zebron Learning includes\n\nZebron Learning brings together everything an organization needs to train people. Each organization switches on the parts it needs; the **Learning** card on your dashboard appears as soon as one of them is on.\n\n| Part | What it does |\n| --- | --- |\n| **Courses** | Lessons with text, video, audio, slides, quick checks and coding exercises, then a final exam and a certificate |\n| **Test Center** | Banks of practice questions (quizzes) for practice with instant feedback, and exams graded by Zebron's server |\n| **Coding Lab** | Write and run JavaScript and Python in the browser, with exercises that check the code |\n| **Virtual Classroom** | Scheduled live sessions with registration, attendance, recordings and live polls |\n| **Training Groups** | Cohorts of learners with leads, instructors, a roster and courses for the whole group |\n\nAround these sit **assignments** (courses you ask people to take, with due dates), **Team progress**, **certifications** and **dashboards**."
          },
          {
            "type": "text",
            "text": "# Who can do what\n\nWhat you can do depends on your role in the organization:\n\n| Role | In Zebron Learning |\n| --- | --- |\n| **Member** | Take courses and exams, practise in the Test Center and Coding Lab, join live sessions, see their own progress and certificates |\n| **Staff** | Also write courses and questions, and submit them for review |\n| **Manager** | Also publish courses, create quizzes, assign courses, and see Team progress and learner results |\n| **Admin / Owner** | Everything a manager can do, plus organization settings such as which Zebron courses members see |\n\n> If a button described in this course is missing for you, your role probably doesn't include it. Ask an admin in your organization."
          },
          {
            "type": "check",
            "question": "Which part of Zebron Learning holds banks of practice questions and server-graded exams?",
            "options": [
              "The Test Center",
              "Training Groups",
              "The Coding Lab",
              "Team progress"
            ],
            "answer": 0,
            "explanation": "The Test Center holds quizzes: question banks used for practice and for exams graded on Zebron's server."
          },
          {
            "type": "check",
            "question": "A staff member has written a course. What can they do with it on their own?",
            "options": [
              "Publish it straight to learners",
              "Assign it to the whole organization",
              "Change which Zebron courses members see",
              "Submit it for review"
            ],
            "answer": 3,
            "explanation": "Staff write courses and submit them for review; a manager or above publishes them."
          }
        ]
      },
      {
        "id": "taking-a-course-as-a-learner",
        "title": "Taking a Course as a Learner",
        "minutes": 6,
        "blocks": [
          {
            "type": "text",
            "text": "# See it the way learners do\n\nThe best course authors take a course first. Open **Courses** from your organization's app menu (or the **Learning** card). The tabs at the top are:\n\n| Tab | What it shows |\n| --- | --- |\n| **My learning** | A **Continue** card, your week, courses in progress, **Assigned to you** and your training groups |\n| **Catalog** | Every published course, with programs shown in step order. Filter by topic or search |\n| **Certifications** | Paths of courses that end in a certification exam |\n| **Certificates** | Courses you have completed |\n| **Test Center** and **Coding Lab** | Practice quizzes and the code editor |\n\nOn a phone, the less-used tabs move into the **More** menu."
          },
          {
            "type": "text",
            "text": "# Inside a lesson\n\n1. Open a course and press **Start course** (or **Resume**).\n2. Each lesson is split into **numbered sections**. Open one, read it, and close it: its number turns into a tick.\n3. Answer the **quick check**. A wrong answer just asks you to try again.\n4. **Complete and continue** unlocks once every quick check question is right. Progress is saved by Zebron's server, so it can't be lost or changed by accident.\n\nAt the end, the **course summary** shows what was covered. If the course has a final exam, **Take test** starts it. A passed exam gives a **certificate** with a code anyone can check at **/verify**."
          },
          {
            "type": "tip",
            "text": "The certificate shows the learner's **first-try** quick check score, so learners are encouraged to think before answering. Keep that in mind when you write questions: they should be fair on the first try."
          },
          {
            "type": "check",
            "question": "When does Complete and continue unlock in a lesson?",
            "options": [
              "As soon as the lesson opens",
              "After the learner watches every video to the end",
              "When a manager approves the lesson",
              "When every quick check question has the right answer"
            ],
            "answer": 3,
            "explanation": "A lesson completes once every quick check question in it is answered correctly."
          }
        ]
      },
      {
        "id": "test-center-and-coding-lab",
        "title": "Practice Tools: the Test Center and the Coding Lab",
        "minutes": 6,
        "blocks": [
          {
            "type": "text",
            "text": "# The Test Center\n\nThe Test Center is where learners **practise**. Its content is organised as **Program → Quiz → Topic → Question**.\n\n- Learners open the **Quiz Library**, filter by difficulty or category, and start a quiz or a single topic.\n- In **practice**, each answer shows straight away whether it was right, with an explanation.\n- In **exams**, answers are graded on Zebron's server and never sent to the browser.\n\nYou will use the Test Center again in Module 4: a course's final exam is drawn from a Test Center quiz."
          },
          {
            "type": "text",
            "text": "# The Coding Lab\n\nThe **Coding Lab** tab lets learners write and run **JavaScript** and **Python** in the browser, with nothing to install.\n\n- **Projects** are learners' own saved code.\n- **Exercises** give a task and **Check my code** tests it, with hints and a solution.\n- In lessons, Python and JavaScript **code examples get a Run button** automatically.\n\nCode runs in the learner's browser, separately from Zebron, so it can't reach anyone's account or other websites."
          },
          {
            "type": "check",
            "question": "How is a Test Center exam different from Test Center practice?",
            "options": [
              "Exams show the right answer after each question",
              "Exams can only be taken on a phone",
              "Exams are graded on Zebron's server and answers never reach the browser",
              "Exams don't count towards results"
            ],
            "answer": 2,
            "explanation": "Practice gives instant feedback; exams are graded on the server so the answers stay hidden."
          }
        ]
      }
    ]
  },
  {
    "id": "building-your-first-course",
    "title": "Building Your First Course",
    "lessons": [
      {
        "id": "create-a-course-and-its-details",
        "title": "Create a Course and Fill In Its Details",
        "minutes": 6,
        "blocks": [
          {
            "type": "text",
            "text": "# Start a new course\n\n1. Open **Courses** and choose the **Manage courses** tab. It only appears for people who can build courses (staff and above).\n2. Press **New course**. It starts with one module and one lesson, ready to fill in.\n3. Save often with **Save draft** (or **Ctrl+S**). If you try to leave with unsaved changes, Zebron asks first.\n\nA new course is a **draft**: learners can't see it until it is published."
          },
          {
            "type": "text",
            "text": "# Course details\n\nOpen **Course details** and fill in:\n\n| Field | Tips |\n| --- | --- |\n| **Title** | Short and specific: \"Customer Service Basics\", not \"Training 1\" |\n| **Summary** | One line shown on the course card. Say what learners will be able to do |\n| **About this course** | A short paragraph for the course page |\n| **Program** and **Step** | Optional: group courses into a path shown in step order |\n| **Topic** | The category learners filter by. Pick an existing topic when one fits |\n| **Level** | Beginner, intermediate, advanced or all levels |\n| **What learners will be able to do** | One outcome per line, starting with a verb: \"Handle a complaint calmly\" |\n| **Skills** | Separated by commas; they appear on the certificate |\n| **Cover** | A colour for the course card |"
          },
          {
            "type": "tip",
            "text": "Write the **outcomes** first. They tell you what each module needs to teach, and what the quick checks and the final exam should test."
          },
          {
            "type": "check",
            "question": "Who can see a course while it is still a draft?",
            "options": [
              "Every member of the organization",
              "Only people who can build courses, in Manage courses",
              "Everyone on the internet",
              "Only learners who were assigned it"
            ],
            "answer": 1,
            "explanation": "Drafts appear only in Manage courses; learners see a course once it is published."
          },
          {
            "type": "check",
            "question": "Which is the best way to write a course outcome?",
            "options": [
              "\"Customer service\"",
              "\"This course is about complaints\"",
              "\"Handle a customer complaint calmly and log it correctly\"",
              "\"Module 3\""
            ],
            "answer": 2,
            "explanation": "Outcomes start with a verb and describe what learners will be able to do."
          }
        ]
      },
      {
        "id": "modules-lessons-and-blocks",
        "title": "Modules, Lessons and Blocks",
        "minutes": 6,
        "blocks": [
          {
            "type": "text",
            "text": "# The outline\n\nThe outline on the left of the builder shows your **modules** and the **lessons** inside them.\n\n- Rename a module by typing in its title.\n- **Add lesson** and **Add module** add new ones; the arrows reorder them.\n- Select a lesson to edit it: give it a **title** and the **minutes** it takes.\n\nAim for lessons of **5 to 10 minutes**. Short lessons are easier to fit into a working day, and learners see their progress more often."
          },
          {
            "type": "text",
            "text": "# Blocks: what a lesson is made of\n\nA lesson is a list of **blocks**. Press the block type to add one, use the arrows to reorder, and the bin to delete.\n\n| Block | Use it for |\n| --- | --- |\n| **Text** | The lesson itself, formatted with the toolbar |\n| **Video**, **Audio**, **PDF or slides** | Media that plays inside the lesson |\n| **Image** | A picture, with a description for screen readers |\n| **Tip** | A highlighted key point |\n| **Quick check** | Questions learners must answer correctly to continue |\n| **Coding exercise** | A JavaScript or Python task with automatic checks |\n\nEach text block becomes one **numbered section** in the lesson, and its first heading becomes the section's title."
          },
          {
            "type": "tip",
            "text": "A good rhythm for a lesson: one or two text sections, a tip with the key point, then a quick check."
          },
          {
            "type": "check",
            "question": "What does each text block become in the lesson learners see?",
            "options": [
              "A separate lesson",
              "A numbered section, titled by its first heading",
              "A quick check",
              "A page in the Knowledge Center"
            ],
            "answer": 1,
            "explanation": "Each text block is one numbered section in the lesson player, and its first heading is the section title."
          }
        ]
      },
      {
        "id": "writing-with-the-toolbar",
        "title": "Writing Lesson Text with the Toolbar",
        "minutes": 7,
        "blocks": [
          {
            "type": "text",
            "text": "# You don't need to know any code\n\nText blocks have a **formatting toolbar**, like a word processor. Select some text, then click a button:\n\n| Button | What it does |\n| --- | --- |\n| **Heading** / **Subheading** | Turns the line into a heading. The first heading names the section |\n| **Bold** / **Italic** | Emphasis (also **Ctrl+B** and **Ctrl+I**) |\n| **Bulleted list** / **Numbered list** | Turns the selected lines into a list, numbered in order |\n| **Quote or note** | A highlighted line, good for a short note |\n| **Link** | Turns the text into a link (**Ctrl+K**); replace https:// with the address |\n| **Code** / **Code block** | Code in a sentence, or a block of code. Python and JavaScript blocks get a **Run** button for learners |\n| **Table** | Inserts a small table to fill in |\n\nClick the same button again to remove the formatting."
          },
          {
            "type": "text",
            "text": "# Check it with Preview\n\nPress **Preview** to see the text exactly as learners will see it: headings, lists, tables and code. Press **Write** to go back.\n\nBehind the scenes the toolbar adds a few symbols to your text, such as `**bold**` or `# Heading`. You'll see them while writing and can type them yourself if you prefer, but you never have to."
          },
          {
            "type": "tip",
            "text": "Write for scanning: a heading for each idea, short paragraphs, lists for steps, and **bold** for the one thing learners must not miss."
          },
          {
            "type": "check",
            "question": "You want the lines \"Greet the customer\", \"Listen\" and \"Offer a solution\" to appear as steps 1, 2 and 3. What do you do?",
            "options": [
              "Select the three lines and click Numbered list",
              "Type the numbers by hand on each line",
              "Put each line in its own lesson",
              "Use the Table button"
            ],
            "answer": 0,
            "explanation": "Select the lines and click Numbered list: the toolbar numbers them in order."
          },
          {
            "type": "check",
            "question": "How can you see a text block the way learners will see it before saving?",
            "options": [
              "Press Preview above the text",
              "Publish the course and check",
              "Ask a learner to open it",
              "Download it as a PDF"
            ],
            "answer": 0,
            "explanation": "Preview shows the formatted text exactly as learners will see it."
          }
        ]
      }
    ]
  },
  {
    "id": "media-and-practice",
    "title": "Media, Quick Checks and Coding Exercises",
    "lessons": [
      {
        "id": "video-audio-slides-and-images",
        "title": "Video, Audio, Slides and Images",
        "minutes": 6,
        "blocks": [
          {
            "type": "text",
            "text": "# Paste a link, see a preview\n\nAdd a **Video**, **Audio** or **PDF or slides** block and paste the link. The builder tells you straight away whether it will **play inside the lesson**, and shows a preview.\n\n| Block | Plays inside the lesson |\n| --- | --- |\n| **Video** | YouTube, Vimeo, Loom, Google Drive, Microsoft Stream (its Embed link), or an .mp4 / .webm file |\n| **Audio** | SoundCloud, Spotify, or an .mp3 / .m4a file |\n| **PDF or slides** | Google Slides, Docs, Sheets, or a PDF in Google Drive |\n\nAnything else becomes a button that opens the link in a new tab. Videos can also **start at** a set time, such as 1:30."
          },
          {
            "type": "text",
            "text": "# Make sure learners can open it\n\n- **Sharing settings still apply.** A Google Drive file or Slides deck must be shared so learners can see it, for example \"Anyone with the link\".\n- Links must start with **https://**.\n- **Images** need a short **description** for learners who use screen readers: say what the picture shows, not \"image\".\n- Add a **caption** when it helps: what to look for in the video, or how long it is."
          },
          {
            "type": "tip",
            "text": "Keep videos short (2 to 6 minutes) and follow each one with a quick check about it. Learners watch more closely when they know a question is coming."
          },
          {
            "type": "check",
            "question": "A Google Slides deck plays in the builder's preview, but learners can't open it. What is the most likely cause?",
            "options": [
              "The lesson is too long",
              "The deck isn't shared so learners can see it",
              "Slides only work on phones",
              "The course has no final exam"
            ],
            "answer": 1,
            "explanation": "Sharing settings still apply: the deck must be shared, for example with Anyone with the link."
          }
        ]
      },
      {
        "id": "quick-checks-that-teach",
        "title": "Quick Checks That Teach",
        "minutes": 6,
        "blocks": [
          {
            "type": "text",
            "text": "# How quick checks work\n\nA **Quick check** block holds one or more questions (up to 20), each with **2 to 6 answers**. Mark the right answer and add **why it is right**: learners see the explanation when they answer correctly.\n\nLearners can't continue until every question is right, and their **first try** counts towards the score on their certificate."
          },
          {
            "type": "text",
            "text": "# Writing good questions\n\n1. **Test the point of the lesson**, not a detail from one sentence.\n2. **Make every wrong answer believable**: a common mistake, or a half-truth. Avoid joke answers.\n3. **Keep answers a similar length.** The longest answer shouldn't always be the right one.\n4. **Mix up where the right answer is.** If it is always the first, learners notice.\n5. **Explain the answer** in one sentence, so even a lucky guess teaches something.\n6. Prefer **situations** (\"A customer says... What do you do?\") over definitions."
          },
          {
            "type": "tip",
            "text": "One or two questions after each lesson is plenty. Use the **final exam** for a full test of the course."
          },
          {
            "type": "check",
            "question": "Which practice makes quick checks fairer and more useful?",
            "options": [
              "Using believable wrong answers and explaining the right one",
              "Always putting the right answer first",
              "Making the right answer the longest one",
              "Asking about a minor detail from one sentence"
            ],
            "answer": 0,
            "explanation": "Believable wrong answers make learners think; the explanation teaches even when they guessed."
          }
        ]
      },
      {
        "id": "coding-exercises",
        "title": "Coding Exercises",
        "minutes": 7,
        "blocks": [
          {
            "type": "text",
            "text": "# Add practice that checks itself\n\nFor technical courses, a **Coding exercise** block gives learners a task they solve by writing code, right in the lesson.\n\n1. Add a **Coding exercise** block and choose **JavaScript** or **Python**.\n2. Give it a **title** and **instructions**: what to write and what it should return.\n3. Write the **starting code** learners see first, such as a function with \"your code here\".\n4. Add **checks**. Each has a description learners read (\"total([1, 2, 3]) returns 6\") and one line of code that tests it, for example in Python:\n\n```python\nassert total([1, 2, 3]) == 6\n```\n\n5. Add **hints** (one per line; learners see them one at a time) and, optionally, a **solution**."
          },
          {
            "type": "text",
            "text": "# Test your checks before learners do\n\nPress **Run the checks on the solution**. Every check should pass with your solution; a check that fails needs fixing before learners see it.\n\nCoding exercises **never block** a lesson: learners can continue without passing them, and their work is saved as they type. Passing gives the exercise a green tick."
          },
          {
            "type": "tip",
            "text": "Start every exercise with code that runs. Learners learn more by changing working code than by staring at an empty editor."
          },
          {
            "type": "check",
            "question": "How do you make sure an exercise's checks work before publishing?",
            "options": [
              "Publish the course and wait for complaints",
              "Delete the checks",
              "Write a solution and press Run the checks on the solution",
              "Ask learners to skip the exercise"
            ],
            "answer": 2,
            "explanation": "Run the checks on the solution: every check should pass with a correct answer."
          }
        ]
      }
    ]
  },
  {
    "id": "exams-and-publishing",
    "title": "Exams, Certificates and Publishing",
    "lessons": [
      {
        "id": "test-center-quizzes-for-exams",
        "title": "Preparing a Test Center Quiz for an Exam",
        "minutes": 6,
        "blocks": [
          {
            "type": "text",
            "text": "# Exams come from the Test Center\n\nA course's **final exam** draws its questions from a **Test Center quiz**. Managers build quizzes in the Test Center's **Structure** page:\n\n| Level | Example |\n| --- | --- |\n| **Program** | Customer Service Academy |\n| **Quiz** | Customer Service Basics: final exam |\n| **Topic** | Handling complaints |\n| **Question** | A single question, in one quiz and one topic |\n\nQuestions can be written one at a time or **imported** in bulk."
          },
          {
            "type": "text",
            "text": "# Mark the quiz \"Exam only\"\n\nA quiz used as a final exam must be **Exam only**. Otherwise learners could practise it in the Test Center, where answers are shown, and see the exam's answers before taking it.\n\n- Tick **Exam only** on the quiz in **Test Center → Structure**.\n- The course builder won't let you choose a quiz that isn't Exam only, and won't publish a course whose exam uses one.\n\nOrganize the quiz by **topics** that match your modules: after a failed attempt, learners see their score by topic and know what to review."
          },
          {
            "type": "tip",
            "text": "Write at least two or three times as many questions as the exam asks. Each attempt draws a random set, so learners who retake the exam see different questions."
          },
          {
            "type": "check",
            "question": "Why must a final exam's quiz be marked Exam only?",
            "options": [
              "So it loads faster",
              "So it can have more than 20 questions",
              "So it appears in the Quiz Library",
              "So learners can't practise it and see the answers before the exam"
            ],
            "answer": 3,
            "explanation": "A quiz that isn't Exam only can be practised with answers shown, which would give away the exam."
          }
        ]
      },
      {
        "id": "final-exam-and-certificate",
        "title": "Adding a Final Exam and a Certificate",
        "minutes": 5,
        "blocks": [
          {
            "type": "text",
            "text": "# Switch on the final exam\n\nIn **Course details → Final exam and certificate**:\n\n1. Switch the exam on and choose the **Test Center quiz**.\n2. Set the **number of questions**, the **pass mark**, an optional **time limit** and the number of **attempts**.\n\nQuestions are drawn at random and **graded on Zebron's server**. Learners see their score and the topics to review, never the answers."
          },
          {
            "type": "text",
            "text": "# Certificates\n\n- A course gives a **certificate only when it has a final exam** and the learner passes it.\n- The certificate shows the learner's name, the date, the skills and a **certificate code**.\n- Anyone, such as an employer, can check the code at **/verify**.\n- Learners can print it, save it as a PDF, or add it to LinkedIn.\n\n**Certifications** go one step further: an ordered path of several courses that ends in a certification exam, valid for three years."
          },
          {
            "type": "check",
            "question": "A course has no final exam. What do learners get when they finish it?",
            "options": [
              "The course is completed, but no certificate",
              "A certificate with a code",
              "Nothing: the course can't be finished",
              "A certification valid for three years"
            ],
            "answer": 0,
            "explanation": "Without a final exam a course can be completed, but it gives no certificate."
          }
        ]
      },
      {
        "id": "review-and-publishing",
        "title": "Review and Publishing",
        "minutes": 6,
        "blocks": [
          {
            "type": "text",
            "text": "# From draft to published\n\n| Status | What happens | Learners see it |\n| --- | --- | --- |\n| **Draft** | Authors write and save | No |\n| **In review** | Staff press **Submit for review**; a manager presses **Approve and publish**, or **Send back** with a note | No |\n| **Published** | The course is live | Yes |\n\nManagers see **Waiting for your review** at the top of Manage courses. A submitted course can be taken back with **Withdraw from review**."
          },
          {
            "type": "text",
            "text": "# Before you publish\n\nThe **Before you publish** list shows what is still missing: a title, at least one lesson, content in every lesson, complete quick checks and coding exercises, https links, and an Exam only quiz for the final exam.\n\n- **Preview** opens the saved course as a learner sees it. Always take it once.\n- A published course is **live**: saved changes reach learners straight away.\n- **Unpublish** moves it back to draft. Prefer it to **Delete**, which removes the course for good.\n- **Duplicate** copies a course and its lessons into a new draft: handy for a new version or a template."
          },
          {
            "type": "tip",
            "text": "Ask someone who doesn't know the subject to take the course before you publish. Every place they get stuck is a place to improve."
          },
          {
            "type": "check",
            "question": "You may need a course again later, but learners shouldn't see it now. What should you do?",
            "options": [
              "Delete the course",
              "Unpublish it",
              "Remove all its lessons",
              "Change its title"
            ],
            "answer": 1,
            "explanation": "Unpublish moves the course back to draft; Delete removes it for good."
          },
          {
            "type": "check",
            "question": "A published course has a typo. What happens when a manager fixes it and saves?",
            "options": [
              "The course goes back to review",
              "Learners lose their progress",
              "Nothing changes until the course is published again",
              "The fix reaches learners straight away"
            ],
            "answer": 3,
            "explanation": "A published course is live: saved changes reach learners immediately."
          }
        ]
      }
    ]
  },
  {
    "id": "getting-courses-to-learners",
    "title": "Getting Courses to Learners",
    "lessons": [
      {
        "id": "offering-zebron-courses",
        "title": "Offering Zebron Courses to Your Members",
        "minutes": 5,
        "blocks": [
          {
            "type": "text",
            "text": "# Your courses and Zebron's\n\nYour members see **your organization's own courses**. Zebron also publishes courses (for example the Cybersecurity, ServiceNow, Web and Enterprise AI programs, and this course).\n\nYour members only see Zebron courses that your organization chooses to offer:\n\n1. Open **Manage courses**.\n2. Under **Zebron courses for your members**, press **Choose Zebron courses** (admins and owners).\n3. Tick the courses (search, or **Select all shown**) and press **Save**.\n\nTicked courses appear in your catalog, programs and recommendations next to your own. Untick one to hide it again."
          },
          {
            "type": "tip",
            "text": "Before building a course yourself, check whether a Zebron course already covers it. Offering it takes a minute; you can then add a short course of your own about how things work in your organization."
          },
          {
            "type": "check",
            "question": "Who can choose which Zebron courses an organization's members see?",
            "options": [
              "Any member",
              "Only Zebron staff",
              "Organization admins and owners",
              "Learners, for themselves"
            ],
            "answer": 2,
            "explanation": "Admins and owners choose the Zebron courses under Zebron courses for your members."
          }
        ]
      },
      {
        "id": "assigning-courses",
        "title": "Assigning Courses",
        "minutes": 6,
        "blocks": [
          {
            "type": "text",
            "text": "# Ask people to take a course\n\nManagers, admins and owners can **assign** a published course, or one lesson of it:\n\n1. In **Manage courses**, click **Assign** next to a published course.\n2. Choose **the whole course** or **one lesson**.\n3. Optionally add a **due date** and a **note**, and tick **Required** if it is mandatory.\n4. Tick the people and press **Assign**.\n\nLearners see it at the top of **My learning** under **Assigned to you**, with the due date, and **Overdue** in red once the date has passed."
          },
          {
            "type": "text",
            "text": "# When is an assignment done?\n\n| Assigned | Done when |\n| --- | --- |\n| A whole course | Every lesson is done and, if the course has a final exam, it is passed |\n| One lesson | That lesson is done |\n\nAssigning the same course to the same person again updates the due date and note.\n\n> Assignments don't send emails: learners see them in My learning. Tell people about important assignments yourself, for example in a team meeting or message."
          },
          {
            "type": "check",
            "question": "A course with a final exam was assigned. When does the assignment count as done?",
            "options": [
              "When every lesson is done and the final exam is passed",
              "When the learner opens the course",
              "When half the lessons are done",
              "When the due date arrives"
            ],
            "answer": 0,
            "explanation": "A whole-course assignment is done when every lesson is complete and any final exam is passed."
          }
        ]
      },
      {
        "id": "training-groups-and-enrollment",
        "title": "Training Groups and Enrollment",
        "minutes": 7,
        "blocks": [
          {
            "type": "text",
            "text": "# Groups of learners\n\n**Training Groups** put learners together, for example a bootcamp **cohort** with start and end dates, **leads**, **instructors** and an optional **capacity**.\n\n- **Add members** from your organization.\n- **Assign a course** from the group's page: it goes to everyone in the group, including people who join later. Withdrawing someone removes the group's unfinished courses from them.\n- When a group ends, it **locks**, a **completion summary** is built, and it is **archived** 30 days later. **Download PDF** gives a full cohort report."
          },
          {
            "type": "text",
            "text": "# How people join a group\n\nMembership of your organization stays by invitation. Each group chooses how people join **the group**:\n\n| Mode | How it works |\n| --- | --- |\n| **Invite only** | Leads add members (the default) |\n| **Request to join** | Members ask to join; a lead approves |\n| **Application** | Anyone with a Zebron account applies through the join link; approving sends them an invitation to your organization |\n\nOptional: an **enrollment window**, a **waitlist** that moves people up automatically when a place opens, and **automatic approval** for requests."
          },
          {
            "type": "tip",
            "text": "For a public bootcamp intake, use **Application** with two or three short questions, a closing date and the waitlist. Share the **join link** from the group's page."
          },
          {
            "type": "check",
            "question": "You assign a course from a Training Group's page. Who gets it?",
            "options": [
              "Only the group's leads",
              "Everyone in the group, including people who join later",
              "Every member of the organization",
              "Only people who requested it"
            ],
            "answer": 1,
            "explanation": "Courses assigned from a group go to all its members, and to people who join it later."
          },
          {
            "type": "check",
            "question": "Which enrollment mode lets people outside your organization apply to join a cohort?",
            "options": [
              "Invite only",
              "Request to join",
              "Application",
              "None: groups are always invite only"
            ],
            "answer": 2,
            "explanation": "With Application, anyone with a Zebron account can apply; approval sends them an organization invitation."
          }
        ]
      }
    ]
  },
  {
    "id": "following-progress",
    "title": "Following Progress",
    "lessons": [
      {
        "id": "team-progress",
        "title": "Team Progress",
        "minutes": 6,
        "blocks": [
          {
            "type": "text",
            "text": "# See how everyone is doing\n\n**Learning administration → Team progress** (managers and above) has two tabs:\n\n| Tab | What it shows |\n| --- | --- |\n| **Assignments** | Every assignment and its status: Not started, In progress, Completed or Overdue. Filter by course and status, or search |\n| **People** | For each person: courses started and completed, certificates, assignments done and last activity |\n\n- With Training Groups, pick a group to see **only that cohort** on both tabs.\n- **Download CSV** saves the current tab with its filters, for a spreadsheet or a report."
          },
          {
            "type": "text",
            "text": "# Using it well\n\n- Check **Overdue** once a week and follow up personally; a friendly reminder works better than an automatic one.\n- Look for courses that many people **start but don't finish**: there may be a lesson that is too long or unclear.\n- Celebrate completions. Certificates can be shared, and learners can add them to LinkedIn.\n\n> Learner progress is private to each learner. Managers see it in Team progress only for the organization's own courses."
          },
          {
            "type": "check",
            "question": "Where would you find everyone whose assigned course is overdue?",
            "options": [
              "The Catalog tab",
              "The learner's certificate",
              "The Coding Lab",
              "Team progress, Assignments tab, filtered by Overdue"
            ],
            "answer": 3,
            "explanation": "Team progress → Assignments shows each assignment's status, and you can filter by Overdue."
          }
        ]
      },
      {
        "id": "group-summaries-and-reports",
        "title": "Group Summaries and Reports",
        "minutes": 5,
        "blocks": [
          {
            "type": "text",
            "text": "# Reports for a cohort\n\nOn a Training Group's page:\n\n- **Courses** shows each group course with how many members have finished it, and who is overdue.\n- After the group ends, the **completion summary** shows, for each course, how many finished, are in progress or haven't started, and how many members finished every course. **Rebuild** updates it.\n- **Download PDF** produces a cohort report: details, staff, members, courses, progress and the summary. **CSV** exports the roster.\n\nTest Center results can be filtered by **training group** too, under **Learner results**."
          },
          {
            "type": "tip",
            "text": "Download the PDF at the end of each cohort and keep it with your records. It's a ready-made report for sponsors, funders or your leadership."
          },
          {
            "type": "check",
            "question": "Which tool produces a single report of a cohort, with its members, courses and progress?",
            "options": [
              "The course builder's Preview",
              "The group's Download PDF",
              "The Coding Lab",
              "The Catalog search"
            ],
            "answer": 1,
            "explanation": "Download PDF on the group's page produces the cohort report."
          }
        ]
      },
      {
        "id": "your-launch-checklist",
        "title": "Your Launch Checklist",
        "minutes": 5,
        "blocks": [
          {
            "type": "text",
            "text": "# Before you launch a course\n\n1. **Outcomes** are written, each starting with a verb.\n2. Every lesson is **5 to 10 minutes**, with headings, a tip and a quick check.\n3. Videos and slides **play for a learner**, not just for you (check sharing settings).\n4. Quick checks have believable wrong answers and an **explanation**.\n5. The final exam uses an **Exam only** quiz, with more questions than the exam asks.\n6. You took the whole course in **Preview**, and someone else did too.\n7. The course is **published** (or approved by a manager)."
          },
          {
            "type": "text",
            "text": "# After you launch\n\n1. **Assign** it, or add it to a Training Group, with a realistic due date.\n2. **Tell people** it's there: assignments don't send emails.\n3. Check **Team progress** each week and follow up on anything overdue.\n4. Read the results by topic: a topic many people miss means a lesson to improve.\n5. **Improve and save**: changes to a published course reach learners straight away.\n\nYou're ready. Open **Manage courses**, press **New course**, and build your first lesson today."
          },
          {
            "type": "check",
            "question": "Your course is published and assigned. What should you do next?",
            "options": [
              "Nothing: Zebron emails everyone",
              "Delete the drafts of every other course",
              "Tell people about it and check Team progress each week",
              "Turn off the final exam"
            ],
            "answer": 2,
            "explanation": "Assignments don't send emails, so tell learners yourself and follow progress in Team progress."
          }
        ]
      }
    ]
  }
];

runCourseSeed({ course: COURSE, modules: MODULES, script: 'scripts/zebron-learning-guide/seed-zebron-learning-guide.mjs' }).catch((error) => {
  console.error('\nSEED FAILED:', error);
  process.exit(1);
});
