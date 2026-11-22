import { check, mc, ms, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 1,
  id: "cna-role-rights-and-dmv",
  title: "The CNA Role, Resident Rights and DMV Certification",
  summary: "Course 1 of 6 in the Zebron CNA Program. What certified nursing assistants do, delegation and the nursing team, residents' rights, legal and ethical practice, and how to get certified in DC, Maryland and Virginia.",
  description:
    "Certified nursing assistants (CNAs) give most of the hands-on care in nursing homes and give a large share of it in hospitals, assisted living and home care. This course explains the role and the nursing team, how delegation works, the residents' rights protected by federal law, abuse and neglect, and the certification paths in the District of Columbia, Maryland and Virginia.\n\n**This program is a study aid.** It does not replace a state-approved nurse aide training program, the supervised clinical hours or the NNAAP exam, and finishing it does not certify you. Requirements change: always confirm them with the DC Board of Nursing, the Maryland Board of Nursing or the Virginia Board of Nursing.\n\nEach lesson ends with a quick check. The final exam is drawn from this course's practice questions in the Test Center.",
  level: "beginner",
  cover: "navy",
  outcomes: [
    "Describe the CNA role, the nursing team and where CNAs work",
    "Explain delegation and the five rights of delegation",
    "Protect residents' rights, privacy and dignity",
    "Recognise and report abuse, neglect and misappropriation",
    "Compare the CNA certification paths in DC, Maryland and Virginia",
  ],
  skills: ["CNA role", "Delegation", "Residents' rights", "Abuse prevention", "DMV certification"],
  quiz: {
    name: "CNA: Role, Rights and DMV Certification",
    slug: "cna-role-rights-and-dmv",
    description: "The CNA role, delegation, residents' rights, abuse reporting and the DC, Maryland and Virginia paths.",
    tags: ["cna", "nursing assistant", "healthcare", "DMV"],
  },
  topics: [
    { key: "role", name: "The CNA role and team", description: "Settings, the nursing team, delegation and scope." },
    { key: "rights", name: "Residents' rights and ethics", description: "OBRA rights, privacy, restraints, abuse and reporting." },
    { key: "dmv", name: "Certification in the DMV", description: "Federal training rules, the NNAAP exam and DC, Maryland and Virginia." },
  ],
  modules: [
    {
      id: "role-and-team",
      title: "The CNA Role and the Nursing Team",
      lessons: [
        {
          id: "what-cnas-do",
          title: "What CNAs Do",
          minutes: 6,
          blocks: [
            text(`
              ## Where CNAs work

              CNAs work in **nursing homes (long-term care and rehabilitation)**, hospitals, assisted living, home health and hospice. In nursing homes the people you care for are usually called **residents**; in hospitals, **patients**; at home, **clients**.

              ## What CNAs do

              Help with bathing, dressing, eating, toileting and moving; measure vital signs, weight and intake and output; make beds; keep residents safe and comfortable; observe and report changes; and give emotional support. CNAs spend more time with residents than anyone else on the team, so they often notice changes first.
            `),
            tip("A good shift starts with report: find out about each resident's condition, care plan changes and anything to watch for."),
            check("Who usually spends the most time with nursing home residents?", ["The administrator", "The CNA", "The doctor", "The pharmacist"], 1, "CNAs give most of the daily hands-on care, so they notice changes first."),
          ],
        },
        {
          id: "nursing-team",
          title: "The Nursing Team and Delegation",
          minutes: 7,
          blocks: [
            text(`
              ## The nursing team

              - **Registered nurse (RN)**: assesses, plans care, supervises; often the charge nurse or director of nursing.
              - **Licensed practical nurse (LPN)**: gives medications and treatments, often supervises CNAs.
              - **CNA**: gives personal care and basic nursing tasks under the supervision of an RN or LPN.
              - **Medication aide or technician**: separately trained and certified to give some medications.

              The wider team includes doctors, nurse practitioners, therapists, dietitians, social workers, activity staff and, most importantly, the resident and family.
            `),
            text(`
              ## Delegation

              A nurse **delegates** a task to you; the nurse stays responsible for the outcome and you are responsible for doing the task correctly. The **five rights of delegation**: right **task**, right **circumstance**, right **person**, right **directions and communication**, right **supervision and evaluation**.

              You may say no, politely, to a task you haven't been trained for or that is outside your role, and explain why. Never ignore an assignment; talk to the nurse.
            `),
            tip("\"I haven't been trained to do that safely. Can you show me, or assign someone who has?\" is a professional response."),
            check("A nurse asks you to give a resident an injection. What should you do?", ["Do it carefully", "Explain it's outside your role and that you can't do it", "Ask the resident to do it", "Ignore the request"], 1, "Injections are outside the CNA's role; decline politely and explain."),
          ],
        },
        {
          id: "scope-and-professionalism",
          title: "Scope of Practice and Professionalism",
          minutes: 6,
          blocks: [
            text(`
              ## Stay within your scope

              CNAs **do not**: give medications (unless separately certified), insert or remove tubes, do sterile procedures, take verbal orders from doctors, diagnose, or tell residents or families about a diagnosis. Each state publishes its own list of CNA tasks, and your employer may limit them further.

              ## Professional behaviour

              Be on time and dependable, keep a neat appearance (short nails, hair tied back, minimal jewellery), keep personal phone use off the floor, follow the chain of command, and keep learning. Federal rules require nursing home CNAs to complete at least **12 hours of in-service training every year**.
            `),
            tip("If a doctor gives you an order, politely say you'll get the nurse. CNAs don't take medical orders."),
            check("Which task is within a CNA's usual scope?", ["Inserting a urinary catheter", "Measuring and recording intake and output", "Giving pain medication", "Taking a verbal order from a doctor"], 1, "Measuring I&O is a basic CNA task; the others belong to licensed nurses."),
          ],
        },
      ],
    },
    {
      id: "rights-and-ethics",
      title: "Residents' Rights and Ethics",
      lessons: [
        {
          id: "residents-rights",
          title: "Residents' Rights",
          minutes: 7,
          blocks: [
            text(`
              ## Federal protections

              The **Omnibus Budget Reconciliation Act of 1987 (OBRA)** set federal standards for nursing homes, including nurse aide training and testing, and a list of residents' rights. Residents have the right to:

              - Be treated with **dignity and respect**
              - **Privacy** in care, communications and visits
              - **Make choices**: when to get up, what to wear, activities, and to **refuse** care or treatment
              - Be **informed** about their care and take part in planning it
              - Manage their own money and keep and use personal belongings
              - Voice **complaints** without fear of retaliation
              - Be **free from abuse, neglect and restraints** used for discipline or convenience
            `),
            text(`
              ## In practice

              Knock and wait before entering, close the curtain and door during care, cover the resident, call them by their preferred name, offer choices, and never open their mail or go through their things without permission.
            `),
            tip("The long-term care ombudsman in each DMV jurisdiction helps residents with complaints. Residents and families can contact them at any time."),
            check("A resident wants to wear a red sweater instead of the blue one you chose. What do you do?", ["Insist on the blue one", "Help her wear the red sweater", "Tell her the red one is ugly", "Ask the family"], 1, "Residents have the right to make choices about their clothing."),
          ],
        },
        {
          id: "restraints",
          title: "Restraint-Free Care",
          minutes: 6,
          blocks: [
            text(`
              ## What counts as a restraint

              A **physical restraint** is anything that limits movement and that the resident can't easily remove: vests, belts, wrist ties, a chair tray, tucked sheets, even bed rails or placing a chair against a wall in some cases. A **chemical restraint** is a drug used for discipline or convenience rather than to treat a condition.

              Restraints can cause falls, pressure injuries, strangulation, loss of strength, incontinence and depression. Nursing homes aim for **restraint-free care**.
            `),
            text(`
              ## Alternatives and rules

              Alternatives include regular toileting, activities, low beds, floor mats, bed and chair alarms, more frequent checks and a calm environment. If a restraint is ordered by a doctor as part of the care plan, follow the facility policy exactly: check the resident often, release the restraint, reposition, toilet and offer fluids at the required intervals (commonly at least **every 2 hours**), and keep the call light in reach.
            `),
            tip("Never apply a restraint because a resident is \"difficult\" or because the unit is short-staffed."),
            check("Which is an alternative to restraints?", ["A vest restraint", "Tucking sheets tightly so the resident can't get up", "Regular toileting and a low bed with floor mats", "Locking the door"], 2, "Meeting needs and making falls safer reduces the need for restraints."),
          ],
        },
        {
          id: "abuse-neglect",
          title: "Abuse, Neglect and Misappropriation",
          minutes: 7,
          blocks: [
            text(`
              ## Types

              - **Physical**: hitting, rough handling, unnecessary restraint.
              - **Verbal and emotional**: yelling, threats, humiliation, isolation.
              - **Sexual**: any unwanted sexual contact.
              - **Neglect**: failing to give needed care, food, fluids, toileting or repositioning.
              - **Misappropriation**: taking or misusing a resident's money or property.
              - **Involuntary seclusion**: separating a resident against their will.
            `),
            text(`
              ## Reporting

              Report suspected abuse **immediately** to the nurse or administrator; federal rules require serious allegations to be reported to the state within strict time limits. You can also report directly to the state survey agency or the ombudsman. Reporting in good faith is protected.

              Nurse aides found to have abused, neglected or misappropriated property are listed on the state **nurse aide registry** and can no longer work in nursing homes.
            `),
            tip("If you see abuse happening, make sure the resident is safe first, then report right away."),
            check("You see a coworker slap a resident. What should you do first?", ["Wait until the end of the shift", "Make sure the resident is safe, then report to the nurse immediately", "Talk to the coworker privately next week", "Do nothing"], 1, "Protect the resident, then report at once."),
          ],
        },
      ],
    },
    {
      id: "dmv-certification",
      title: "Certification in DC, Maryland and Virginia",
      lessons: [
        {
          id: "federal-and-exam",
          title: "Federal Rules and the NNAAP Exam",
          minutes: 7,
          blocks: [
            text(`
              ## Federal minimum for nursing homes

              Under federal rules (42 CFR 483.152), a nurse aide training program must include at least **75 clock hours**, with at least **16 hours of supervised practical training**, and at least 16 hours of training in key areas (communication, infection control, safety and emergencies, residents' rights and independence) **before** any direct contact with residents. A nursing home can't employ someone as a nurse aide for more than **4 months** unless they've completed training and a competency evaluation. All three DMV jurisdictions require more than 75 hours.
            `),
            text(`
              ## The NNAAP exam

              DC, Maryland and Virginia use the **National Nurse Aide Assessment Program (NNAAP)** exam, given by **Credentia** (Maryland has also approved Headmaster). It has two parts, and you must pass both:

              - **Written exam**: 70 multiple-choice questions (an **oral** version is available for candidates who have difficulty reading English).
              - **Skills evaluation**: you perform **five** skills in front of an evaluator. **Hand hygiene** is always one of them, and one is always a **measurement** skill (such as blood pressure, radial pulse, respirations, urine output or weight).
            `),
            tip("Download your state's current NNAAP candidate handbook from Credentia. It lists every skill and its critical steps."),
            check("Which skill is always part of the NNAAP skills evaluation?", ["Bed making", "Hand hygiene", "Feeding", "Denture care"], 1, "Every NNAAP skills test includes hand hygiene plus one measurement skill."),
          ],
        },
        {
          id: "dc-md-va",
          title: "DC, Maryland and Virginia",
          minutes: 8,
          blocks: [
            text(`
              ## District of Columbia

              DC Board of Nursing-approved programs are at least **120 hours**: 45 classroom, 30 lab and 45 hours of nursing home clinical practicum, completed within the past 24 months. Candidates register for the NNAAP with Credentia. Renewal is every two years with **24 hours of continuing education** (including required topics such as LGBTQ cultural competency) and proof of at least **8 hours of paid CNA work** in the past 24 months.

              ## Maryland

              Since **April 1, 2026**, new applicants are certified as **CNA-I**, which allows work in any setting including long-term care; the separate GNA title ended, and people who were CNAs before that date may hold **CNA-II** (any setting except long-term care). New applicants complete a Board-approved program and pass the competency exam. To renew, CNAs need at least **16 hours of active practice** in the two years before their certificate expires.
            `),
            text(`
              ## Virginia

              Virginia Board of Nursing-approved programs are at least **120 clock hours**, completed within the past 24 months, and candidates must be at least 16 years old. Applicants test through Credentia and are placed on the **Virginia Nurse Aide Registry**. To renew, CNAs must have performed paid nursing-related work during the two years before expiration; otherwise they must retake the exam. Virginia also offers an **Advanced Certified Nurse Aide** credential with 120 more hours of advanced training.

              ## Getting started

              Choose a Board-approved program in the state where you'll work, compare schedules, costs and pass rates (boards publish them), and ask about free or paid training: many nursing homes sponsor CNA training, and workforce programs can help with costs.
            `),
            tip("A CNA certified in one DMV jurisdiction can usually apply in another by endorsement (reciprocity) if they're in good standing on their current registry."),
            check("Since April 1, 2026, which Maryland certificate lets a new CNA work in long-term care?", ["CNA-II", "CNA-I", "GNA", "HHA"], 1, "CNA-I covers every setting including long-term care; the GNA title ended."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("role", "easy", "In a nursing home, the people CNAs care for are usually called…", ["Clients", "Residents", "Customers", "Guests"], 1, "Nursing home residents live there; hospitals have patients and home care has clients."),
    mc("role", "medium", "Who supervises CNAs?", ["Other CNAs", "An RN or LPN", "The resident's family", "The dietitian"], 1, "CNAs work under the supervision of licensed nurses."),
    ms("role", "medium", "Which are among the five rights of delegation? Select all that apply.", ["Right task", "Right person", "Right supervision and evaluation", "Right price"], [0, 1, 2], "Task, circumstance, person, directions and communication, supervision and evaluation."),
    mc("role", "medium", "A doctor gives you a verbal order for a resident. What should you do?", ["Carry it out", "Politely ask the doctor to give it to the nurse", "Write it in the chart", "Ignore it"], 1, "CNAs don't take medical orders; get the nurse."),
    tf("role", "medium", "When a nurse delegates a task, the CNA becomes fully responsible and the nurse is no longer accountable.", false, "The nurse stays accountable for delegation; the CNA is responsible for doing the task correctly."),
    mc("role", "medium", "How many hours of in-service training must nursing home CNAs complete each year under federal rules?", ["4", "12", "24", "40"], 1, "At least 12 hours of in-service training per year."),
    mc("role", "hard", "You haven't been trained on a task the nurse assigns. What is the best response?", ["Do your best", "Tell the nurse you haven't been trained and ask for help or reassignment", "Ask a resident how to do it", "Skip it without telling anyone"], 1, "Speak up; never perform untrained tasks or ignore an assignment."),
    mc("rights", "easy", "Which federal law set the standards for nurse aide training and residents' rights in nursing homes?", ["HIPAA", "OBRA 1987", "ADA", "FMLA"], 1, "OBRA 1987 created nurse aide training, testing and residents' rights rules."),
    ms("rights", "medium", "Which are residents' rights? Select all that apply.", ["Refusing care", "Privacy during care", "Voicing complaints without retaliation", "Choosing which staff are fired"], [0, 1, 2], "Residents may refuse care, have privacy and complain safely."),
    mc("rights", "medium", "Which is a physical restraint?", ["A call light", "A chair tray the resident can't remove", "A walker", "A hearing aid"], 1, "Anything the resident can't easily remove that limits movement is a restraint."),
    tf("rights", "easy", "Staff may restrain a resident because the unit is short-staffed.", false, "Restraints may never be used for staff convenience."),
    mc("rights", "medium", "Taking a resident's money for yourself is called…", ["Neglect", "Misappropriation", "Seclusion", "Delegation"], 1, "Misappropriation is misusing a resident's property or money."),
    mc("rights", "medium", "Keeping a resident in their room against their will as punishment is…", ["Involuntary seclusion", "Privacy", "Restorative care", "Delegation"], 0, "Separating a resident against their will is involuntary seclusion, a form of abuse."),
    mc("rights", "hard", "What happens to a nurse aide found to have abused a resident?", ["Nothing", "A finding is placed on the nurse aide registry and they can't work in nursing homes", "They get extra training only", "They're moved to another unit"], 1, "Findings of abuse, neglect or misappropriation are listed on the registry."),
    mc("rights", "medium", "If a resident has a restraint ordered, how often is it commonly released for repositioning, toileting and fluids?", ["Once a shift", "At least every 2 hours (per facility policy)", "Every 8 hours", "Never"], 1, "Follow policy; commonly at least every 2 hours."),
    mc("dmv", "medium", "What is the federal minimum length of nurse aide training?", ["40 hours", "75 hours with at least 16 supervised practical hours", "120 hours of classroom only", "200 hours"], 1, "42 CFR 483.152 sets at least 75 hours, including 16 supervised practical hours."),
    mc("dmv", "medium", "How many multiple-choice questions are on the NNAAP written exam?", ["25", "50", "70", "150"], 2, "The written exam has 70 multiple-choice questions."),
    mc("dmv", "medium", "How many skills do you perform in the NNAAP skills evaluation?", ["2", "5", "10", "22"], 1, "Five skills, including hand hygiene and one measurement skill."),
    mc("dmv", "medium", "How are DC's 120 CNA training hours divided?", ["120 classroom", "45 classroom, 30 lab, 45 nursing home clinical", "60 online, 60 clinical", "100 lab, 20 classroom"], 1, "45 classroom, 30 lab and 45 nursing home practicum."),
    tf("dmv", "medium", "A Virginia CNA who hasn't done paid nursing-related work in the two years before expiration must retake the exam to renew.", true, "Virginia requires recent paid nursing-related work or a new exam."),
    mc("dmv", "hard", "How long can a nursing home employ an untrained nurse aide under federal rules?", ["No limit", "Up to 4 months", "1 year", "2 years"], 1, "Aides must complete training and competency evaluation within 4 months."),
    tf("dmv", "easy", "Finishing the Zebron CNA Program certifies you as a CNA.", false, "This program is a study aid; you still need a Board-approved program and the NNAAP exam."),
    ord("dmv", "medium", "Put the steps to CNA certification in order.", ["Choose a Board-approved program in your state", "Complete classroom, lab and clinical training", "Pass the written and skills exams", "Get listed on the nurse aide registry"], "Train, test, then join the registry."),
  ],
};
