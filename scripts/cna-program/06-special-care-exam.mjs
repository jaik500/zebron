import { check, mc, ms, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 6,
  id: "cna-special-care-and-exam-prep",
  title: "Dementia, Common Conditions, End-of-Life Care and NNAAP Prep",
  summary: "Course 6 of 6 in the Zebron CNA Program. Care for residents with dementia and common chronic conditions, admission, transfer and discharge, pressure injuries, end-of-life and postmortem care, and how to prepare for the NNAAP written and skills exams.",
  description:
    "The final course covers the residents and situations CNAs meet most in long-term care: dementia and behaviour, depression, stroke, diabetes, heart failure, COPD, arthritis and Parkinson's disease; preventing pressure injuries; admission, transfer and discharge; end-of-life care and postmortem care; and a structured plan for the NNAAP written (or oral) exam and the skills evaluation.\n\n**This program is a study aid.** It does not replace a state-approved nurse aide training program or the NNAAP exam, and it does not certify you.",
  level: "beginner",
  cover: "slate",
  outcomes: [
    "Care for residents with dementia and respond to behaviours calmly",
    "Recognise what to watch for with common chronic conditions",
    "Help with admission, transfer and discharge, and prevent pressure injuries",
    "Give comfort care at the end of life and respectful postmortem care",
    "Prepare a plan for the NNAAP written and skills exams",
  ],
  skills: ["Dementia care", "Chronic conditions", "Pressure injury prevention", "Admission and discharge", "End-of-life care", "NNAAP preparation"],
  quiz: {
    name: "CNA: Special Care and NNAAP Prep",
    slug: "cna-special-care-and-exam-prep",
    description: "Dementia, chronic conditions, pressure injuries, admission and discharge, end-of-life care and exam preparation.",
    tags: ["cna", "nursing assistant", "healthcare", "dementia", "nnaap"],
  },
  topics: [
    { key: "conditions", name: "Dementia and common conditions", description: "Dementia, behaviours, depression and chronic diseases." },
    { key: "care-transitions", name: "Skin, admissions and end of life", description: "Pressure injuries, admission and discharge, dying and postmortem care." },
    { key: "exam", name: "NNAAP exam preparation", description: "The written exam, the skills evaluation and test-day tips." },
  ],
  modules: [
    {
      id: "conditions",
      title: "Dementia and Common Conditions",
      lessons: [
        {
          id: "dementia-behaviours",
          title: "Dementia and Behaviours",
          minutes: 8,
          blocks: [
            text(`
              ## Dementia

              Dementia is a progressive loss of memory, thinking and function. **Alzheimer's disease** is the most common type; others include vascular, Lewy body and frontotemporal dementia. **Delirium** is different: a **sudden** change in attention and awareness, often from infection, dehydration or medication, and it is a medical emergency to report.

              ## Approaches that help

              Keep a consistent routine and caregiver when possible; approach from the front; use simple one-step directions; offer two choices; **validate feelings and redirect** rather than argue; use reminiscence and familiar activities; reduce noise and clutter.
            `),
            text(`
              ## Behaviours are communication

              Agitation, wandering, repetitive questions, resisting care and **sundowning** (worse confusion in the late afternoon and evening) often have a cause: pain, hunger, thirst, a full bladder, boredom, fear, noise or being rushed. Look for the need. If a resident resists care, stop, keep them safe, and try again later or with another approach. Report new or worsening behaviours, and never use restraints, threats or force.
            `),
            tip("If a resident with dementia accuses you of stealing, stay calm, don't argue, help them look, and report it to the nurse."),
            check("What is the main difference between dementia and delirium?", ["There is none", "Delirium comes on suddenly and needs urgent reporting", "Dementia is temporary", "Delirium only affects children"], 1, "Delirium is sudden and often has a treatable cause."),
          ],
        },
        {
          id: "chronic-conditions",
          title: "Common Chronic Conditions",
          minutes: 8,
          blocks: [
            text(`
              ## What to watch for and report

              - **Stroke**: weakness on one side, aphasia, swallowing problems. Approach and place items on the unaffected side if the resident neglects one side; dress the weak side first.
              - **Diabetes**: follow the meal plan and report signs of **low blood sugar** (shaky, sweaty, confused, pale) or **high blood sugar** (thirst, frequent urination, drowsiness). Inspect feet daily; don't cut toenails.
              - **Heart failure**: swelling of ankles, weight gain, shortness of breath; follow fluid and salt limits; keep the head of the bed raised if ordered.
              - **COPD**: shortness of breath; pursed-lip breathing; upright positions; oxygen safety; rest periods.
              - **Arthritis**: pain and stiffness; warm baths and gentle ROM as ordered; let the resident move at their own pace.
              - **Parkinson's disease**: tremors, shuffling gait, rigidity, swallowing problems; high fall risk.
              - **Depression**: withdrawal, poor appetite, sleep changes, hopelessness. Report any talk of self-harm **immediately**.
            `),
            tip("You don't diagnose. Your job is to notice changes from the resident's normal and report them promptly."),
            check("A resident with diabetes becomes sweaty, shaky and confused before lunch. What might this be?", ["High blood sugar", "Low blood sugar", "A cold", "Normal ageing"], 1, "These are classic signs of low blood sugar; report it immediately."),
          ],
        },
      ],
    },
    {
      id: "skin-transitions-eol",
      title: "Skin, Admissions and End of Life",
      lessons: [
        {
          id: "pressure-injuries",
          title: "Preventing Pressure Injuries",
          minutes: 7,
          blocks: [
            text(`
              ## Where and why

              Pressure injuries form over bony areas: sacrum and coccyx, heels, hips, elbows, shoulder blades, ears and the back of the head. Risk rises with immobility, incontinence, poor nutrition and fluids, and friction and shear (sliding in bed).

              ## Prevention

              Reposition at least every 2 hours in bed (more often in a chair); keep skin clean and dry; use lift sheets so you lift rather than drag; keep linens wrinkle-free; float heels off the bed with pillows; encourage food and fluids; use pressure-relieving devices as ordered. Don't massage reddened bony areas.

              ## Report

              Redness or discolouration that doesn't go away (on darker skin, look for purple, bluish or darker areas, warmth or firmness), blisters, open areas or drainage.
            `),
            tip("Check the skin at every position change, bath and incontinence care, and report early."),
            check("Which helps prevent shearing?", ["Dragging the resident up in bed", "Using a lift sheet with a coworker", "Raising the head of the bed as high as possible all day", "Wrinkled sheets"], 1, "Lifting with a sheet avoids friction and shear."),
          ],
        },
        {
          id: "admission-discharge",
          title: "Admission, Transfer and Discharge",
          minutes: 6,
          blocks: [
            text(`
              ## Admission

              Moving into a facility is a big loss and change. Greet the new resident and family warmly, introduce yourself and the roommate, show them the room, call light, bathroom and schedule. You may measure **baseline** vital signs, height and weight, and help make an **inventory of belongings**. Label personal items.

              ## Transfer and discharge

              Explain what's happening, gather and check belongings against the inventory, help the resident dress and transport them safely. Report any concerns the resident or family raise.
            `),
            tip("A friendly first day makes a lasting difference. Learn the new resident's preferred name and routines."),
            check("Why are vital signs, height and weight measured at admission?", ["To fill time", "To provide a baseline for comparing later changes", "To decide the room", "For billing only"], 1, "Baseline measurements make later changes easy to spot."),
          ],
        },
        {
          id: "end-of-life",
          title: "End-of-Life and Postmortem Care",
          minutes: 8,
          blocks: [
            text(`
              ## Comfort care

              Hospice and palliative care focus on comfort. Give frequent mouth care and lip moisture; keep the skin clean and dry; reposition gently; report pain right away; keep the room calm; let family stay and take part. **Hearing may be one of the last senses to remain**, so keep talking to the resident. Respect advance directives (such as a DNR order or Maryland's MOLST form) and religious and cultural practices.

              ## Signs that death is near

              Decreased intake, more sleep, cool and mottled skin, changes in breathing (pauses, noisy breathing), and lower blood pressure. Report changes to the nurse.
            `),
            text(`
              ## Postmortem care

              After the nurse confirms the death, follow facility policy and any religious or cultural wishes. Wear gloves; place the body supine with a pillow under the head; close the eyes gently; replace dentures if policy says so; wash soiled areas; remove tubes only if the nurse instructs; put on a clean gown; and give the family privacy and time. Treat the body with dignity, and inventory and label belongings.
            `),
            tip("It's normal to grieve for residents you've cared for. Talk to your team and use support resources."),
            check("Which is true of dying residents?", ["They can't hear anything", "Hearing may remain until the end, so keep talking gently", "Mouth care should stop", "Pain should not be reported"], 1, "Speak gently; hearing may continue."),
          ],
        },
      ],
    },
    {
      id: "exam-prep",
      title: "NNAAP Exam Preparation",
      lessons: [
        {
          id: "written-exam",
          title: "The Written (or Oral) Exam",
          minutes: 6,
          blocks: [
            text(`
              ## Format

              The NNAAP written exam has **70 multiple-choice questions** in English. An **oral** version (available in English and, in many states, Spanish) is offered for candidates who have difficulty reading English, and you usually must request it when you apply. You can take the written part at a test site or, in some states including DC and Virginia, online with a live proctor. Check your Credentia handbook for the time limit and rules.

              ## Content

              The content outline covers physical care skills (activities of daily living, basic nursing skills, restorative skills), psychosocial care (emotional and mental health needs, spiritual and cultural needs), and the role of the nurse aide (communication, client rights, legal and ethical behaviour, being a member of the health care team).
            `),
            text(`
              ## Strategies

              Read the whole question and every option. Look for words like **first**, **best**, **most important**. Choose the answer that is **safest** and protects the resident's **rights and dignity**; the CNA **reports** rather than diagnoses or treats. Eliminate clearly wrong options. Use every Zebron practice quiz and the program exam to find weak areas.
            `),
            tip("When two answers both seem right, ask which one keeps the resident safest right now."),
            check("On the NNAAP written exam, which answer is usually best?", ["The fastest one", "The one that keeps the resident safest and respects their rights", "The one that diagnoses the problem", "The most expensive option"], 1, "Safety and residents' rights come first; CNAs report changes."),
          ],
        },
        {
          id: "skills-evaluation",
          title: "The Skills Evaluation",
          minutes: 8,
          blocks: [
            text(`
              ## Format

              You perform **five skills** for a Nurse Aide Evaluator, with a time limit for all five (about 30 minutes in many states; check your handbook). **Hand hygiene** is always one of them, and one is always a **measurement skill** (for example blood pressure, radial pulse, respirations, urine output or weight), which you record on a form or tablet. You must perform every **critical element step** correctly, and enough steps overall, to pass each skill.

              ## Practice plan

              1. Download your state's candidate handbook and print the skills listing.
              2. Practise every skill until you can do the steps in order without looking.
              3. Practise measurement skills until your counts and readings are consistently accurate.
              4. Have a classmate or instructor check you using the handbook steps.
              5. Practise under time pressure.
            `),
            text(`
              ## On the day

              Bring the required ID and documents, arrive early, and wear the clothing and closed-toe shoes the handbook asks for. Talk to the "resident" as you would in a real nursing home. If you realise you've made a mistake, tell the evaluator and correct it; you can usually fix a step while the skill is still in progress.
            `),
            tip("Say what you're doing as you do it: \"I'm locking the bed brakes now.\" It helps the evaluator see each step."),
            check("Which is always included in the NNAAP skills evaluation?", ["Postmortem care", "Hand hygiene and one measurement skill", "Bed making only", "Feeding only"], 1, "Every skills test includes hand hygiene and one measurement skill."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("conditions", "easy", "What is the most common type of dementia?", ["Vascular", "Alzheimer's disease", "Lewy body", "Frontotemporal"], 1, "Alzheimer's disease is the most common."),
    mc("conditions", "medium", "A resident with dementia insists she must go home to feed her children, who are now adults. What do you do?", ["Tell her firmly that her children are grown", "Validate her feelings and gently redirect", "Ignore her", "Lock her door"], 1, "Validation and redirection reduce distress."),
    mc("conditions", "medium", "Sundowning is…", ["A skin condition", "Increased confusion in the late afternoon or evening", "A type of diet", "Sleeping late"], 1, "Behaviours often worsen later in the day."),
    ms("conditions", "medium", "Which can cause behaviours in residents with dementia? Select all that apply.", ["Pain", "A full bladder", "Too much noise", "Being well rested and comfortable"], [0, 1, 2], "Unmet needs and overstimulation often trigger behaviours."),
    mc("conditions", "medium", "Which sign should you report for a resident with heart failure?", ["Steady weight", "Swollen ankles and shortness of breath", "Good appetite", "Normal pulse"], 1, "Swelling and shortness of breath suggest fluid build-up."),
    mc("conditions", "medium", "A resident with Parkinson's disease is at high risk for…", ["Falls", "Sunburn", "Hearing loss", "Hair loss"], 0, "Shuffling gait and rigidity raise fall risk."),
    tf("conditions", "medium", "Sudden new confusion in an older resident should be reported promptly.", true, "Sudden confusion can be delirium from infection or other causes."),
    mc("conditions", "hard", "A resident says she wishes she could go to sleep and not wake up. What do you do?", ["Change the subject", "Report it to the nurse immediately", "Tell her to cheer up", "Wait to see if she says it again"], 1, "Any hint of self-harm is reported at once."),
    mc("care-transitions", "easy", "Which area is at high risk for pressure injuries?", ["The sacrum (tailbone)", "The palm", "The forehead", "The abdomen"], 0, "Bony areas like the sacrum and heels are high risk."),
    tf("care-transitions", "medium", "Massaging a red area over a bone helps prevent pressure injuries.", false, "Massage can damage tissue further."),
    mc("care-transitions", "medium", "How can you protect a bed-bound resident's heels?", ["Keep them flat on the mattress", "Float them off the bed with a pillow under the calves", "Tuck sheets tightly over them", "Apply heat"], 1, "Floating heels removes pressure."),
    mc("care-transitions", "medium", "On admission, what may a CNA help with?", ["Writing orders", "Baseline vitals, height, weight and an inventory of belongings", "Prescribing medications", "Choosing the diagnosis"], 1, "CNAs help with baseline measurements and inventories."),
    ms("care-transitions", "medium", "Which are signs that death may be near? Select all that apply.", ["Cool, mottled skin", "Changes in breathing", "Decreased intake", "A sudden rise in energy that lasts for weeks"], [0, 1, 2], "Mottling, breathing changes and reduced intake are common."),
    mc("care-transitions", "medium", "In postmortem care, how is the body positioned?", ["Prone", "Supine with a pillow under the head", "On the left side", "Sitting up"], 1, "Supine with the head on a pillow prevents discolouration of the face."),
    mc("care-transitions", "hard", "During postmortem care, who decides whether tubes are removed?", ["The CNA", "The family", "Follow the nurse's instructions and facility policy", "No one"], 2, "Some deaths require tubes to stay in place."),
    mc("exam", "easy", "How many multiple-choice questions are on the NNAAP written exam?", ["30", "50", "70", "100"], 2, "70 multiple-choice questions."),
    mc("exam", "medium", "What must you do to pass a skill on the NNAAP skills evaluation?", ["Finish it quickly", "Perform every critical element step correctly, plus enough steps overall", "Skip hand hygiene", "Ask the evaluator for help"], 1, "Missing a critical step fails the skill."),
    tf("exam", "medium", "Candidates who have difficulty reading English may request an oral version of the NNAAP knowledge exam.", true, "An oral exam is offered; request it when you apply."),
    mc("exam", "medium", "Where do you find your state's official list of NNAAP skills and steps?", ["Social media", "The state's Credentia candidate handbook", "A friend's notes", "The TV"], 1, "The candidate handbook lists every skill and its steps."),
    mc("exam", "medium", "You realise during a skill that you forgot to lock the bed brakes. What should you do?", ["Keep going and hope", "Tell the evaluator and correct it", "Start crying", "Leave the room"], 1, "You can usually correct a step while the skill is in progress."),
    ord("exam", "medium", "Put a skills practice plan in order.", ["Download the candidate handbook", "Practise each skill step by step", "Have someone check you against the handbook", "Practise under time pressure"], "Get the official steps, practise, get checked, then practise timed."),
  ],
};
