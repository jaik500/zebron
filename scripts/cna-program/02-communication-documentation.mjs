import { check, mc, ms, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 2,
  id: "cna-communication-and-documentation",
  title: "Communication, Observation and Documentation",
  summary: "Course 2 of 6 in the Zebron CNA Program. Communicate with residents, families and the team, give and receive shift report, use medical terms, observe with your senses, and document and report accurately.",
  description:
    "In a facility you communicate with residents, families and a large team across three shifts. This course covers therapeutic communication and barriers, communicating with residents who have sensory or language needs, culturally respectful care, shift report and care conferences, common medical terms and abbreviations, the 24-hour clock, objective and subjective observations, what to report at once, and documentation and incident reports.\n\n**This program is a study aid.** It does not replace a state-approved nurse aide training program or the NNAAP exam, and it does not certify you.",
  level: "beginner",
  cover: "sky",
  outcomes: [
    "Use communication that builds trust and avoid common barriers",
    "Give and receive a clear shift report",
    "Use common medical terms, abbreviations and the 24-hour clock",
    "Observe, report and document objectively and on time",
  ],
  skills: ["Therapeutic communication", "Shift report", "Medical terminology", "Observation", "Documentation"],
  quiz: {
    name: "CNA: Communication and Documentation",
    slug: "cna-communication-and-documentation",
    description: "Communication, shift report, medical terms, observation, reporting and documentation.",
    tags: ["cna", "nursing assistant", "healthcare", "communication"],
  },
  topics: [
    { key: "communication", name: "Communicating with residents and families", description: "Therapeutic communication, barriers, sensory needs and culture." },
    { key: "team", name: "Working with the team", description: "Shift report, care conferences, terms and abbreviations." },
    { key: "documentation", name: "Observing and documenting", description: "Objective and subjective data, urgent reports, charting and incidents." },
  ],
  modules: [
    {
      id: "communicating",
      title: "Communicating with Residents and Families",
      lessons: [
        {
          id: "therapeutic-communication",
          title: "Therapeutic Communication",
          minutes: 7,
          blocks: [
            text(`
              ## Building trust

              - Knock, introduce yourself by name and title, and call the resident by their preferred name.
              - Sit at eye level, face the person and use a calm, warm tone.
              - **Listen actively**: nod, paraphrase ("You're worried about your daughter's visit?"), allow silence.
              - Use **open questions** to learn more and **closed questions** to confirm details.
              - Watch body language, yours and theirs.
            `),
            text(`
              ## Barriers to avoid

              Giving advice or personal opinions, false reassurance ("Everything will be fine"), changing the subject, asking "why" in a way that sounds like blame, medical jargon, and talking with coworkers over a resident as if they weren't there.
            `),
            tip("Residents are adults with long lives behind them. Ask about their family, work and interests; it makes care more personal."),
            check("Which response is false reassurance?", ["\"Tell me more about what's worrying you.\"", "\"Don't worry, everything will be fine.\"", "\"I'll let the nurse know you're in pain.\"", "\"Would you like me to stay a moment?\""], 1, "Promising everything will be fine dismisses the resident's concern."),
          ],
        },
        {
          id: "sensory-language-culture",
          title: "Sensory Needs, Language and Culture",
          minutes: 7,
          blocks: [
            text(`
              ## Hearing and vision

              Check hearing aids (in, clean, battery working) and glasses (clean, worn, labelled). Face the resident, reduce noise, speak clearly and a little lower. For residents with low vision, say who you are, describe what you're doing and keep belongings where they expect them.

              ## Speech and language

              After a stroke, residents may have **aphasia**. Give time, use yes/no questions, communication boards and gestures. For residents who speak another language, use the facility's interpreter service or language line, not family or other residents, for health information.
            `),
            text(`
              ## Culture and identity

              Ask about preferences for food, modesty, prayer, touch and family involvement. Respect religious practices, dietary rules and the resident's chosen name and pronouns. Never make jokes or comments about anyone's culture, religion, gender identity or sexual orientation.
            `),
            tip("If a resident's hearing aid whistles, it may be in wrong, have earwax buildup, or the volume is too high. Report problems; don't try to repair it."),
            check("A resident who speaks only Amharic needs to tell the nurse about her pain. What's best?", ["Ask her roommate to interpret", "Use the facility's interpreter or language line", "Guess from her gestures", "Wait for her son on Sunday"], 1, "Trained interpreters give accurate, private communication."),
          ],
        },
      ],
    },
    {
      id: "team-communication",
      title: "Working with the Team",
      lessons: [
        {
          id: "shift-report",
          title: "Shift Report and Care Conferences",
          minutes: 6,
          blocks: [
            text(`
              ## Shift report

              At the start of a shift you get report about each assigned resident: changes in condition, new orders affecting care, appointments, fall risk, diet changes, and anything to watch for. At the end of your shift you report to the nurse what you did and what you saw.

              A clear report is brief and specific: "Mrs. Lee in 204 ate 25% of lunch, refused fluids after 2 p.m., urine dark yellow, said 'I feel dizzy' when standing."
            `),
            text(`
              ## Care plan and care conferences

              Each resident has a **care plan** built from nursing assessments (in nursing homes, the federal Minimum Data Set). CNAs may join **care conferences** with the resident, family and team. Your observations about appetite, sleep, mood and abilities help shape the plan.
            `),
            tip("Write short notes during your shift so your end-of-shift report is accurate. Keep them private and shred them afterwards."),
            check("Which end-of-shift report is most useful?", ["\"Room 204 was fine.\"", "\"Mrs. Lee ate 25% of lunch, refused fluids after 2 p.m., and said she felt dizzy standing.\"", "\"She was grumpy.\"", "\"Nothing new.\""], 1, "Specific, factual details help the nurse act."),
          ],
        },
        {
          id: "terms-abbreviations",
          title: "Medical Terms, Abbreviations and Time",
          minutes: 7,
          blocks: [
            text(`
              ## Word parts

              - Prefixes: **brady-** slow, **tachy-** fast, **hyper-** above, **hypo-** below, **dys-** difficult.
              - Roots: **cardi** heart, **pulmo/pneum** lung, **gastr** stomach, **nephr/ren** kidney, **derm** skin, **neur** nerve.
              - Suffixes: **-itis** inflammation, **-algia** pain, **-ectomy** removal, **-pnea** breathing.

              So **dyspnea** is difficult breathing; **bradycardia** is a slow heart rate.
            `),
            text(`
              ## Common abbreviations (follow your facility's approved list)

              **ADL** activities of daily living · **amb** ambulate · **BID** twice a day · **BP** blood pressure · **HOB** head of bed · **I&O** intake and output · **NPO** nothing by mouth · **PRN** as needed · **ROM** range of motion · **SOB** shortness of breath · **VS** vital signs · **w/c** wheelchair.

              ## 24-hour clock

              Morning hours stay the same (0900 = 9:00 a.m.); add 12 for afternoon and evening (1:00 p.m. = 1300; 11:30 p.m. = 2330). Midnight is 0000 (some facilities write 2400).
            `),
            tip("NPO means nothing by mouth, including water, ice chips and gum, unless the nurse says otherwise. Put up the facility's NPO sign if used."),
            check("What does NPO mean?", ["Nothing by mouth", "No pain observed", "Next patient order", "Nurse present only"], 0, "NPO: nothing by mouth (from the Latin nil per os)."),
          ],
        },
      ],
    },
    {
      id: "observing-documenting",
      title: "Observing, Reporting and Documenting",
      lessons: [
        {
          id: "observation",
          title: "Objective and Subjective Observations",
          minutes: 6,
          blocks: [
            text(`
              ## Use your senses

              - **Objective** (signs): what you see, hear, feel, smell or measure. "Skin on coccyx red, does not fade after 30 minutes off pressure."
              - **Subjective** (symptoms): what the resident tells you. Write it in their words: Resident states, "My stomach hurts."

              ## Report immediately

              Chest pain; trouble breathing; a fall or injury; signs of stroke (BE FAST); new confusion or drowsiness; vital signs outside the ranges you were given; bleeding; vomiting blood or coffee-ground material; black stools; no urine; sudden severe pain; choking; and any suspected abuse.
            `),
            tip("Report changes from the resident's normal. A blood pressure of 150/90 may be normal for one resident and new for another."),
            check("Which is a subjective observation?", ["Pulse 104", "Resident states, \"I feel short of breath\"", "Swelling of both ankles", "Urine is dark amber"], 1, "Subjective information is what the resident reports."),
          ],
        },
        {
          id: "documentation",
          title: "Charting and Incident Reports",
          minutes: 7,
          blocks: [
            text(`
              ## Charting rules

              The medical record is a legal document. Most facilities use electronic charting (for example a CNA kiosk or tablet) for ADLs, meals, fluids, output and vital signs.

              - Chart only care **you** gave, **after** you give it, as soon as possible.
              - Be accurate, objective and specific; use approved abbreviations.
              - Never chart for someone else or share your login.
              - On paper: black ink, sign each entry, correct an error with a single line, "error", your initials and date. No erasing or correction fluid. Don't leave blank lines.
            `),
            text(`
              ## Incident reports

              Fill out an incident (occurrence) report for any accident or unusual event involving a resident, visitor or staff: falls, skin tears, found on the floor, injuries, lost items, needle-sticks. Report what you saw and did, not blame or guesses. Incident reports help the facility prevent repeat events.
            `),
            tip("If you find a resident on the floor, write \"found on floor\". Don't write \"fell\" unless you saw it happen."),
            check("You find a resident sitting on the floor next to the bed. How should you document it?", ["\"Resident fell out of bed.\"", "\"Resident found sitting on floor next to bed at 0315; nurse notified.\"", "\"Resident was careless.\"", "Don't document it if they're not hurt"], 1, "Record only what you observed, with the time and who you told."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("communication", "easy", "What should you do before entering a resident's room?", ["Walk straight in", "Knock and wait for permission", "Call their family", "Turn off the lights"], 1, "Knocking respects privacy."),
    mc("communication", "medium", "Which is an example of active listening?", ["Planning your reply while they talk", "Paraphrasing what the resident said", "Looking at the clock", "Interrupting with advice"], 1, "Paraphrasing shows you understood."),
    ms("communication", "medium", "Which are barriers to communication? Select all that apply.", ["False reassurance", "Using medical jargon", "Talking over the resident to coworkers", "Sitting at eye level"], [0, 1, 2], "Eye level helps; the rest are barriers."),
    mc("communication", "medium", "A resident has aphasia after a stroke. Which helps?", ["Speak quickly", "Use yes/no questions and a communication board", "Finish every sentence for them", "Avoid talking to them"], 1, "Simple questions and visual aids help with aphasia."),
    tf("communication", "medium", "It's fine to ask another resident to interpret health information for a resident who speaks another language.", false, "Use trained interpreters to protect accuracy and privacy."),
    mc("communication", "hard", "A resident's hearing aid is whistling. What is the most appropriate action?", ["Turn the volume up", "Check that it's inserted correctly and report the problem", "Take it apart", "Throw it away"], 1, "Check placement and report; don't repair it yourself."),
    mc("communication", "medium", "A resident asks for a female CNA for bathing. What should you do?", ["Refuse", "Tell the nurse so the assignment can be adjusted if possible", "Ignore it", "Bathe her quickly"], 1, "Respect modesty and cultural preferences through the nurse."),
    mc("team", "easy", "What does ADL stand for?", ["Activities of daily living", "Advanced doctor's list", "Assisted diet level", "Admission discharge log"], 0, "ADLs are bathing, dressing, eating, toileting and moving."),
    mc("team", "medium", "What is 7:45 p.m. in 24-hour time?", ["0745", "1745", "1945", "2145"], 2, "7 + 12 = 19, so 1945."),
    mc("team", "medium", "Dyspnea means…", ["Slow heart rate", "Difficult breathing", "Stomach pain", "Skin inflammation"], 1, "Dys- (difficult) + -pnea (breathing)."),
    mc("team", "medium", "PRN means…", ["Twice a day", "As needed", "Before meals", "By mouth"], 1, "PRN: as needed."),
    tf("team", "medium", "CNAs' observations can help shape a resident's care plan.", true, "CNAs share what they see at care conferences and in reports."),
    mc("team", "hard", "Bradycardia means a heart rate that is…", ["Fast", "Slow", "Irregular only", "Normal"], 1, "Brady- means slow; usually under 60 beats per minute."),
    mc("documentation", "easy", "Which observation is objective?", ["Resident says he's nauseated", "Resident vomited about 100 mL of yellow fluid", "Resident feels tired", "Resident seems upset"], 1, "Measured, observed facts are objective."),
    ms("documentation", "medium", "Which must be reported to the nurse immediately? Select all that apply.", ["Chest pain", "Sudden facial drooping", "Coffee-ground vomit", "Resident ate all of breakfast"], [0, 1, 2], "Chest pain, stroke signs and possible GI bleeding are urgent."),
    tf("documentation", "easy", "You may document care before you give it if you're sure you'll do it.", false, "Chart only after giving care."),
    mc("documentation", "medium", "How do you correct an error on paper charting?", ["Erase it", "Use correction fluid", "Draw a single line through it, write error, initial and date", "Black it out completely"], 2, "A single line keeps the original readable."),
    mc("documentation", "medium", "A coworker asks you to log in and chart for her because she's busy. What do you do?", ["Do it as a favour", "Decline; you may only chart care you gave under your own login", "Share your password", "Chart and tell no one"], 1, "Charting for others or sharing logins is never allowed."),
    mc("documentation", "medium", "When should an incident report be completed?", ["Only if someone dies", "For any accident or unusual event, such as a fall or skin tear", "Never by CNAs", "Only when the family complains"], 1, "Any unusual event needs a report."),
    mc("documentation", "hard", "Why report a blood pressure of 150/90 for one resident but not another?", ["It's always normal", "Report changes from the resident's normal and the ranges you were given", "CNAs never report BP", "Only report if the resident asks"], 1, "Compare with the resident's baseline and the nurse's reporting ranges."),
    ord("team", "medium", "Put an end-of-shift report in a logical order.", ["Name and room", "Care given", "Observations and changes", "Anything still pending"], "Identify the resident, then care, observations and open items."),
  ],
};
