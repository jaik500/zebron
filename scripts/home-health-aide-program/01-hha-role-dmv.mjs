import { check, mc, ms, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 1,
  id: "hha-role-and-dmv-paths",
  title: "The Home Health Aide Role and DMV Requirements",
  summary: "Course 1 of 6 in the Zebron Home Health Aide Program. What home health aides do, how the care team works, the limits of the role, and how to qualify in DC, Maryland and Virginia.",
  description:
    "Home health aides help people stay safe and independent at home. This course explains the role, the plan of care and the care team, the legal and ethical limits of the job, and the different paths to qualify in the District of Columbia, Maryland and Virginia.\n\n**This program is a study aid.** It does not replace a state-approved training program, the required supervised clinical hours, or a state exam, and finishing it does not certify or license you. Requirements change: always confirm them with the DC Board of Nursing, the Maryland Board of Nursing or the Virginia Department of Health before you enrol or apply.\n\nEach lesson ends with a quick check. The final exam is drawn from this course's practice questions in the Test Center.",
  level: "beginner",
  cover: "teal",
  outcomes: [
    "Describe what home health aides do and who they work with",
    "Follow a plan of care and stay within the limits of the role",
    "Explain the federal training and competency rules for home health aides",
    "Compare how to qualify in DC, Maryland and Virginia",
  ],
  skills: ["Home health aide role", "Plan of care", "Professional boundaries", "DMV certification paths"],
  quiz: {
    name: "HHA: Role and DMV Requirements",
    slug: "hha-role-and-dmv-paths",
    description: "The home health aide role, the plan of care, professional boundaries and the DC, Maryland and Virginia paths.",
    tags: ["home health aide", "healthcare", "DMV"],
  },
  topics: [
    { key: "role", name: "The home health aide role", description: "Duties, the care team and the plan of care." },
    { key: "ethics", name: "Legal and ethical practice", description: "Scope, boundaries, rights and reporting." },
    { key: "dmv", name: "Qualifying in the DMV", description: "Federal rules and the DC, Maryland and Virginia paths." },
  ],
  modules: [
    {
      id: "the-role",
      title: "What Home Health Aides Do",
      lessons: [
        {
          id: "why-home-care",
          title: "Care at Home",
          minutes: 6,
          blocks: [
            text(`
              ## Why home care matters

              Many people recovering from illness or surgery, living with a disability or growing older want to stay in their own homes. **Home health aides (HHAs)** make that possible by helping with daily care, watching for changes in health and keeping the home safe.

              Clients include older adults, people coming home from the hospital, adults and children with disabilities, people with long-term conditions such as heart failure or diabetes, and people at the end of life.
            `),
            text(`
              ## A typical day

              An aide may help a client bathe and dress, prepare a meal, take a walk safely, check temperature and pulse if the care plan says so, tidy the client's space and write down what happened during the visit. Every visit is different because every home and every person is different.
            `),
            tip("Home care is personal: you are a guest in the client's home. Respect their routines, belongings and choices."),
            check("Which is a main purpose of home health aide care?", ["Diagnosing illnesses", "Helping clients stay safe and independent at home", "Prescribing medication", "Replacing the nurse"], 1, "Aides support daily living, safety and independence at home; diagnosing and prescribing belong to licensed professionals."),
          ],
        },
        {
          id: "care-team",
          title: "The Care Team",
          minutes: 6,
          blocks: [
            text(`
              ## Who you work with

              You are part of a team led by licensed professionals:

              - **Registered nurse (RN)**: assesses the client, writes and updates the plan of care, assigns your tasks and supervises you.
              - **Doctor, nurse practitioner or physician assistant**: orders treatments and medications.
              - **Therapists** (physical, occupational, speech): help clients regain function and may give you exercises to support.
              - **Social worker**: helps with resources, benefits and family issues.
              - **The client and family**: the most important members of the team.
            `),
            text(`
              ## Supervision

              In a Medicare-certified home health agency, an RN or another skilled professional regularly checks on the care you give. For example, for clients receiving skilled services the agency must complete a supervisory assessment at least every 14 days. Supervision is there to support you and keep clients safe.
            `),
            tip("Your supervisor is your first call when something is outside your training, the plan of care looks wrong, or the client's condition changes."),
            check("Who writes and updates the client's plan of care?", ["The home health aide", "The client's neighbour", "The registered nurse or other skilled professional", "The aide's coworkers"], 2, "The RN (or another skilled professional) assesses the client and writes the plan of care; the aide follows it."),
          ],
        },
        {
          id: "plan-of-care",
          title: "Following the Plan of Care",
          minutes: 6,
          blocks: [
            text(`
              ## Your instructions

              The **plan of care** (or care plan) lists what the client needs and what you are assigned to do: for example, help with a shower three times a week, walk with a walker twice a day, check blood pressure, prepare a low-salt lunch.

              Follow it exactly. Do not add, skip or change tasks on your own, even if the client or family asks.
            `),
            text(`
              ## When something doesn't fit

              If a client refuses a task, asks for something that isn't on the plan, or seems to need more help than the plan allows, **don't decide alone**. Explain kindly that you need to check, then call your supervisor and document what happened.
            `),
            tip("\"I want to help. Let me check with my nurse so we do this safely\" is a respectful way to handle requests outside the plan."),
            check("A client asks you to change the dressing on a wound, which is not on the plan of care. What should you do?", ["Do it carefully", "Ask a family member to do it", "Explain you need to check and contact your supervisor", "Ignore the request"], 2, "Tasks outside the plan of care need your supervisor's direction."),
          ],
        },
      ],
    },
    {
      id: "legal-and-ethical",
      title: "Legal and Ethical Practice",
      lessons: [
        {
          id: "scope",
          title: "Scope of Practice",
          minutes: 6,
          blocks: [
            text(`
              ## What aides do and don't do

              Aides provide **personal care and support**. What you may do depends on federal rules, your state, your agency's policies, your training and the plan of care.

              Aides generally **do not**: diagnose, give medical advice, decide on treatments, give injections, or change medication doses. Some tasks, such as reminding clients to take their own medication, may be allowed only in some states and settings and only when trained and assigned.
            `),
            text(`
              ## If you're not trained, don't do it

              Never perform a task you have not been trained and assigned to do, even if you have seen it done. Tell your supervisor you need training first.
            `),
            tip("The rules on medication help, oxygen, enemas and ostomy care differ across DC, Maryland and Virginia, and between agencies. Learn your agency's list."),
            check("Which task is outside a home health aide's role?", ["Helping a client bathe", "Deciding to double a client's medication dose", "Reporting a change in skin colour", "Assisting with a walk"], 1, "Changing doses is a medical decision for licensed prescribers."),
          ],
        },
        {
          id: "rights-and-boundaries",
          title: "Client Rights and Boundaries",
          minutes: 6,
          blocks: [
            text(`
              ## Client rights

              Clients have the right to dignity, privacy, respect for their property, to make their own choices (including refusing care), to know about their care, and to complain without fear.
            `),
            text(`
              ## Professional boundaries

              You become close to clients, but the relationship stays professional:

              - Don't accept money, gifts or loans, or sign documents for clients.
              - Don't share your personal problems or ask clients for favours.
              - Don't use the client's phone, car, food or belongings for yourself.
              - Keep what you learn private (confidentiality).
            `),
            tip("If a client insists on a gift, thank them warmly and tell your supervisor; agencies have clear gift policies."),
            check("A grateful client offers you $50. What is the professional response?", ["Accept it quietly", "Thank them, decline and tell your supervisor", "Ask for more", "Accept it but don't tell anyone"], 1, "Accepting money crosses professional boundaries; report the offer."),
          ],
        },
        {
          id: "abuse-and-reporting",
          title: "Abuse, Neglect and Reporting",
          minutes: 7,
          blocks: [
            text(`
              ## Recognise the signs

              Abuse can be physical, emotional, sexual or financial; neglect is failing to meet a person's needs (including self-neglect). Warning signs include unexplained bruises, fear of a particular person, missing money or belongings, poor hygiene, dehydration, or untreated pressure sores.
            `),
            text(`
              ## Report it

              Aides are expected to report suspected abuse or neglect. Tell your supervisor right away and follow your agency's policy; you may also need to report to Adult Protective Services (or Child Protective Services for minors). In an emergency, call 911.

              Document facts you saw and heard, not opinions: "Bruise about 2 inches on left forearm; client said 'I don't want to talk about it'."
            `),
            tip("You do not need proof to report a concern. Reporting protects the client; investigators decide what happened."),
            check("You notice your client's savings book is missing and a relative now pays all bills without explaining. What should you do?", ["Confront the relative", "Ignore it, it's family business", "Report your concern to your supervisor and follow agency policy", "Post about it on social media"], 2, "Possible financial exploitation must be reported through the proper channels."),
          ],
        },
      ],
    },
    {
      id: "dmv-paths",
      title: "Qualifying in DC, Maryland and Virginia",
      lessons: [
        {
          id: "federal-rules",
          title: "The Federal Baseline",
          minutes: 6,
          blocks: [
            text(`
              ## Medicare-certified agencies

              Home health agencies that bill Medicare must use aides who meet federal rules (42 CFR 484.80):

              - **Training of at least 75 hours**, including at least **16 hours of supervised practical training**, with at least 16 hours of classroom training before the practical training starts.
              - A **competency evaluation** by a registered nurse. Some skills (communication; temperature, pulse and respiration; personal hygiene and grooming; safe transfers and walking; range of motion and positioning) must be observed with a real or simulated patient.
              - At least **12 hours of in-service training** every 12 months.
              - If an aide goes **24 consecutive months** without paid aide work, they must complete a qualifying program again.
            `),
            text(`
              ## States can require more

              The federal rules are a minimum. DC and Maryland require more, and Virginia sets its own rules for home care organisations. That's why your path depends on where you will work.
            `),
            tip("Keep copies of every training certificate and in-service record; you will need them for jobs and renewals."),
            check("What is the federal minimum training for home health aides in Medicare-certified agencies?", ["40 hours", "75 hours including 16 hours of supervised practical training", "120 hours of classroom only", "No training"], 1, "Federal rules require at least 75 hours, including at least 16 hours of supervised practical training."),
          ],
        },
        {
          id: "dc-and-maryland",
          title: "District of Columbia and Maryland",
          minutes: 7,
          blocks: [
            text(`
              ## District of Columbia

              Home health aides in DC are licensed by the **DC Board of Nursing**. The Board's home health aide curriculum is **125 hours**: 65 hours of classroom, 20 hours of lab and 40 hours of clinical practice. After a Board-approved program (or a bridge program for nurse aides), candidates take the home health aide exam through **Credentia**.

              To renew, DC aides complete **24 hours of in-service training or continuing education** every two years (including required topics such as LGBTQ cultural competency) and must have recent paid work as an aide.
            `),
            text(`
              ## Maryland

              Maryland changed its rules on **April 1, 2026**. The separate home health aide designation ended, and nursing assistants are now certified as **CNA-I** (any setting) or **CNA-II** (people who were already CNAs before that date). New applicants apply for **CNA-I**: a Board-approved nursing assistant training program plus the competency exam (the NNAAP exam through Credentia; Headmaster is also approved). People who held the home health designation became CNA-II and can keep working in home health.

              Agencies that bill Medicare must still make sure their aides meet the federal home health aide rules.
            `),
            tip("Maryland's changes are recent. Check the Maryland Board of Nursing's CNA pages before choosing a program."),
            check("Since April 1, 2026, what certification do new Maryland applicants apply for?", ["GNA", "Home Health Aide designation", "CNA-I", "No certification needed"], 2, "New applicants apply for CNA-I; the GNA and home health designations ended."),
          ],
        },
        {
          id: "virginia-and-next-steps",
          title: "Virginia and Your Next Steps",
          minutes: 7,
          blocks: [
            text(`
              ## Virginia

              Virginia licenses **home care organisations** (12VAC5-381), which call aides **home attendants**. Home attendants must speak, read and write English and meet one of the listed qualifications, for example: completing a nurse aide education program approved by the Virginia Board of Nursing, holding Virginia **CNA** certification, or being a nursing student with qualifying clinical coursework. Aides giving **personal care only** may instead complete the Department of Medical Assistance Services' **40-hour personal care aide** curriculum.

              Personal care attendants receive at least **12 hours of in-service training** each year.
            `),
            text(`
              ## Choosing a program

              1. Decide where you want to work (DC, Maryland or Virginia; agency, hospice or private duty).
              2. Choose a program **approved by that state's board** and ask about clinical placements, schedule, cost and exam pass rates.
              3. Ask about financial help: workforce programs such as DC's Department of Employment Services, American Job Centers in Maryland and Virginia Career Works can sometimes pay for training.
              4. Use this Zebron program to study alongside your approved training and to prepare for the exam.
            `),
            tip("Many DMV aides become CNAs and later LPNs. The CNA and LPN programs on Zebron build on this one."),
            check("In Virginia, what are home care aides called in the home care organisation regulations?", ["Home attendants", "Medication technicians", "Patient sitters", "Health coaches"], 0, "12VAC5-381 uses the term home attendants (also known as CNAs, home health aides or personal care aides)."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("role", "easy", "Who is the most important member of the home care team?", ["The agency owner", "The client and family", "The aide", "The insurance company"], 1, "Care is centred on the client and their family."),
    mc("role", "easy", "What document tells the aide which tasks to do for a client?", ["The plan of care", "The client's diary", "A coworker's notes", "The phone book"], 0, "The plan of care lists the client's needs and the aide's assigned tasks."),
    tf("role", "easy", "A home health aide may change a client's plan of care if the family agrees.", false, "Only the RN or other skilled professional changes the plan of care."),
    ms("role", "medium", "Which professionals may be part of the home care team? Select all that apply.", ["Registered nurse", "Physical therapist", "Social worker", "The client's landlord"], [0, 1, 2], "Nurses, therapists and social workers work with the aide; landlords are not part of the care team."),
    mc("role", "medium", "For a Medicare client receiving skilled services, how often must a supervisory assessment of aide care be completed?", ["Every 14 days", "Every 6 months", "Once a year", "Only when the family complains"], 0, "Federal rules require a supervisory assessment at least every 14 days for clients receiving skilled services."),
    mc("role", "medium", "A client asks you to help with a task that is not on the plan of care. What is the best first step?", ["Do it quickly", "Refuse and leave", "Explain you need to check, then contact your supervisor", "Ask another aide to do it"], 2, "Tasks outside the plan need the supervisor's direction."),
    mc("ethics", "easy", "Which is a professional boundary for aides?", ["Borrowing the client's car", "Declining gifts and money from clients", "Sharing your money problems with clients", "Using the client's phone for personal calls"], 1, "Aides decline gifts and money and keep the relationship professional."),
    ms("ethics", "medium", "Which are possible signs of abuse or neglect? Select all that apply.", ["Unexplained bruises", "Fear of a particular person", "Missing money or belongings", "A tidy, well-stocked kitchen"], [0, 1, 2], "Unexplained injuries, fear and missing money can signal abuse or exploitation."),
    tf("ethics", "medium", "An aide needs proof before reporting suspected abuse.", false, "Report concerns; investigators determine what happened."),
    mc("ethics", "medium", "Which note is written correctly?", ["\"Client was being difficult again.\"", "\"Bruise about 2 inches on left forearm; client said 'I fell'.\"", "\"Family seems shady.\"", "\"Everything fine as usual.\""], 1, "Notes record facts seen and heard, not opinions."),
    mc("ethics", "easy", "A client refuses a bath. What should the aide do?", ["Force the bath", "Respect the refusal, offer later, and report it to the supervisor", "Tell the client they have no choice", "Skip the visit"], 1, "Clients may refuse care; respect it, try again later and report."),
    mc("ethics", "hard", "Which task is outside the aide's role in every DMV state?", ["Helping with dressing", "Deciding to change a medication dose", "Assisting with a walk", "Measuring temperature when assigned"], 1, "Changing doses is a prescriber's decision."),
    mc("dmv", "medium", "Under federal rules, how many hours of in-service training must a home health aide complete every 12 months?", ["4", "12", "24", "40"], 1, "At least 12 hours of in-service training per 12 months."),
    mc("dmv", "medium", "How many hours is the DC Board of Nursing's home health aide curriculum?", ["40", "75", "125", "200"], 2, "65 classroom + 20 lab + 40 clinical = 125 hours."),
    mc("dmv", "hard", "What happens if an aide goes 24 consecutive months without paid aide work (federal rule)?", ["Nothing", "They must complete a qualifying program again", "They get a bonus", "They become an LPN"], 1, "After a 24-month lapse the aide must complete another qualifying program."),
    tf("dmv", "medium", "In Maryland, new nursing assistant applicants after April 1, 2026 apply for CNA-I.", true, "The CNA bill created CNA-I and CNA-II; new applicants apply for CNA-I."),
    mc("dmv", "medium", "Which Virginia program lets aides who give personal care only qualify?", ["The 40-hour personal care aide curriculum from DMAS", "A 2-hour online video", "A driver's licence", "No training is needed"], 0, "The Department of Medical Assistance Services' 40-hour personal care aide curriculum qualifies home attendants for personal care services."),
    tf("role", "medium", "In a Medicare-certified agency, the aide must be present for every RN supervisory visit.", false, "Federal rules say the aide need not be present for the regular supervisory assessment, though each aide is observed on site at set intervals."),
    ms("ethics", "medium", "Which are client rights? Select all that apply.", ["Privacy and dignity", "Refusing care", "Complaining without fear", "Choosing the aide's pay"], [0, 1, 2], "Clients have rights to privacy, choice and to complain; pay is set by the agency."),
    mc("dmv", "easy", "Which body licenses home health aides in the District of Columbia?", ["The DC Board of Nursing", "The DC Department of Motor Vehicles", "The Virginia Board of Nursing", "Medicare"], 0, "DC home health aides are licensed by the DC Board of Nursing."),
    tf("dmv", "easy", "Finishing the Zebron Home Health Aide Program licenses or certifies you to work as an aide.", false, "This program is a study aid. You still need state-approved training, supervised clinical hours and the required exam or evaluation."),
    ord("dmv", "medium", "Put the steps to becoming a home health aide in order.", ["Decide where you will work", "Complete a state-approved training program", "Pass the competency evaluation or exam", "Apply to the state board and keep up in-service training"], "Choose your state, train in an approved program, pass the evaluation, then apply and keep up training."),
  ],
};
