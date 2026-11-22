import { check, mc, ms, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 2,
  id: "hha-communication-and-documentation",
  title: "Communication, Culture and Documentation",
  summary: "Course 2 of 6 in the Zebron Home Health Aide Program. Talk with clients and families, give culturally respectful care, protect privacy, and observe, report and document accurately.",
  description:
    "Good care depends on good communication. This course covers talking with clients (including those with hearing, vision or speech difficulties), working with families, giving care that respects culture, religion, gender identity and sexual orientation, keeping health information private, and observing, reporting and documenting what you see.\n\n**This program is a study aid.** It does not replace state-approved training, supervised clinical hours or a state exam, and it does not certify or license you.",
  level: "beginner",
  cover: "sky",
  outcomes: [
    "Communicate clearly and respectfully with clients and families",
    "Adapt communication for hearing, vision, speech and memory problems",
    "Give care that respects culture, religion and identity",
    "Observe, report and document facts accurately and privately",
  ],
  skills: ["Client communication", "Cultural respect", "Confidentiality", "Observation and reporting", "Documentation"],
  quiz: {
    name: "HHA: Communication and Documentation",
    slug: "hha-communication-and-documentation",
    description: "Communication, culturally respectful care, privacy, and observing, reporting and documenting.",
    tags: ["home health aide", "healthcare", "communication"],
  },
  topics: [
    { key: "communication", name: "Communicating with clients and families", description: "Listening, adapting and working with families." },
    { key: "culture-privacy", name: "Respect and privacy", description: "Culture, identity and confidentiality." },
    { key: "documentation", name: "Observing, reporting and documenting", description: "Objective notes, what to report and when." },
  ],
  modules: [
    {
      id: "communicating",
      title: "Communicating Well",
      lessons: [
        {
          id: "basics",
          title: "Communication Basics",
          minutes: 6,
          blocks: [
            text(`
              ## Verbal and non-verbal

              Communication is what you say **and** how you say it: tone, facial expression, posture, eye contact and touch. Clients often notice your body language before your words.

              - Introduce yourself and say why you're there, every visit.
              - Call clients by the name they prefer (often "Mr." or "Mrs." until invited otherwise).
              - Speak clearly, face the person and give one instruction at a time.
              - **Listen actively**: let them finish, nod, repeat back what you heard.
            `),
            text(`
              ## Open and closed questions

              Closed questions get yes or no ("Are you in pain?"). Open questions invite more ("How did you sleep last night?"). Use both: open questions help you notice changes; closed questions confirm details.
            `),
            tip("Avoid slang, medical jargon and \"elderspeak\" (calling adults \"sweetie\" or speaking to them like children)."),
            check("Which is an open question?", ["Are you cold?", "Did you eat?", "How are you feeling this morning?", "Is that your son?"], 2, "Open questions can't be answered with yes or no and invite the client to share more."),
          ],
        },
        {
          id: "special-needs",
          title: "Adapting for Hearing, Vision and Speech",
          minutes: 7,
          blocks: [
            text(`
              ## Hearing loss

              Face the client, reduce background noise, speak a little slower and lower (don't shout), and check that hearing aids are in, clean and switched on. Write things down if needed.

              ## Vision loss

              Say who you are when you enter, tell the client what you're about to do, keep furniture and belongings in the same place, and describe where things are using a clock face ("your cup is at 3 o'clock").
            `),
            text(`
              ## Speech and memory problems

              After a stroke (aphasia), allow time, use yes/no questions, picture boards or gestures, and don't finish their sentences unless they want you to. With memory loss, use short simple sentences, gentle reminders and a calm tone; don't argue.
            `),
            tip("Never pretend to understand. Say \"I want to get this right. Can you show me?\""),
            check("Your client is hard of hearing. What helps most?", ["Shouting", "Facing them and speaking clearly in a lower tone", "Talking from another room", "Covering your mouth"], 1, "Facing the client and speaking clearly and lower in pitch helps them hear and lip-read."),
          ],
        },
        {
          id: "families",
          title: "Working with Families",
          minutes: 6,
          blocks: [
            text(`
              ## Family dynamics

              Families can be a great support, and they may also be tired, worried, or disagree about care. Be polite and patient, stay neutral in family disagreements, and keep the client at the centre.

              Share health information only with people the client (or the agency's records) allows. If a family member asks for information you're not sure you can share, refer them to your supervisor.
            `),
            text(`
              ## When a family member is upset

              Stay calm, listen without arguing, acknowledge feelings ("I can see you're worried"), and tell your supervisor. If you feel unsafe, leave and call your agency (or 911 in an emergency).
            `),
            tip("Families often notice changes first. Listen to them and report what they tell you."),
            check("Two adult children argue about their mother's care in front of you. What should you do?", ["Take the side of the one who is right", "Stay neutral, focus on the client and tell your supervisor", "Leave without a word", "Join the argument"], 1, "Aides stay neutral and report family conflict to the supervisor."),
          ],
        },
      ],
    },
    {
      id: "respect-and-privacy",
      title: "Respect and Privacy",
      lessons: [
        {
          id: "culture",
          title: "Culturally Respectful Care",
          minutes: 7,
          blocks: [
            text(`
              ## Every client is different

              Culture, religion, national origin, gender identity and sexual orientation can shape how people feel about food, modesty, touch, illness, family roles, prayer and death. The DMV is one of the most diverse regions in the country, so you'll care for people from many backgrounds.

              - Ask, don't assume: "Is there anything about your care that's important to you or your faith?"
              - Respect dietary rules (for example halal, kosher, vegetarian, fasting periods).
              - Respect modesty: some clients prefer an aide of the same gender; tell your supervisor.
              - Use the client's chosen name and pronouns.
            `),
            text(`
              ## Language

              If a client speaks limited English, agencies provide interpreters or language lines. Avoid relying on children to interpret health information.
            `),
            tip("DC requires continuing education on LGBTQ cultural competency for home health aides; it reflects the expectation of respectful care for every client."),
            check("A client fasts during daylight hours for religious reasons. What should you do?", ["Insist they eat lunch", "Respect it, and tell your supervisor so the plan of care can account for it", "Hide food in their room", "Ignore it"], 1, "Respect religious practices and let the nurse adjust the plan, especially for medications or diabetes."),
          ],
        },
        {
          id: "confidentiality",
          title: "Confidentiality and HIPAA",
          minutes: 6,
          blocks: [
            text(`
              ## Keep health information private

              The federal **HIPAA** law protects clients' health information. Share it only with the care team members who need it for the client's care.

              - Don't discuss clients with friends, family or other clients.
              - Don't post about clients, their homes or photos on social media, even without names.
              - Keep paperwork and devices secure; log out of apps.
              - Have phone calls about clients in private.
            `),
            tip("If a neighbour asks how the client is doing, say \"I'm not able to share that, but thank you for asking.\""),
            check("Which is a breach of confidentiality?", ["Reporting a change to your supervisor", "Posting a photo of the client's living room online", "Documenting a visit in the agency app", "Answering the nurse's questions"], 1, "Social media posts about clients or their homes break confidentiality, even without names."),
          ],
        },
      ],
    },
    {
      id: "observe-report-document",
      title: "Observing, Reporting and Documenting",
      lessons: [
        {
          id: "observing",
          title: "Using Your Senses",
          minutes: 6,
          blocks: [
            text(`
              ## Observations

              You see the client more often than anyone else on the team, so your observations matter.

              - **Objective** observations are facts you can see, hear, smell, feel or measure: "Ankles swollen; skin warm and red on left heel; temperature 100.8°F."
              - **Subjective** information is what the client tells you: "Client states, 'My chest feels tight.'" Write it in their words.
            `),
            text(`
              ## Report right away

              Call your supervisor immediately (or 911 for an emergency) for: chest pain, trouble breathing, a fall, sudden confusion, new weakness or slurred speech, bleeding that won't stop, a big change in vital signs, signs of infection, or suspected abuse.
            `),
            tip("If you're unsure whether something is important, report it. It's better to report something small than to miss something serious."),
            check("Which observation is objective?", ["Client seems sad", "Client says she feels dizzy", "Left ankle is swollen and red", "Client is lazy"], 2, "Objective observations can be seen or measured."),
          ],
        },
        {
          id: "documentation",
          title: "Documentation Rules",
          minutes: 7,
          blocks: [
            text(`
              ## Write it as you go

              Documentation is a legal record. Agencies use paper notes or apps with electronic visit verification (EVV) that record when and where you worked.

              - Record only care you gave, as soon as you can after giving it.
              - Be factual, brief and specific; use approved abbreviations only.
              - Never document care before you give it, or for someone else.
              - On paper, use ink; to correct an error, draw one line through it, write "error", your initials and the date. Never use correction fluid.
              - Many agencies use 24-hour time (for example 14:30 for 2:30 p.m.).
            `),
            text(`
              ## Incidents

              If something unusual happens (a fall, an injury, a medication error you notice, broken equipment), tell your supervisor and complete an **incident report** as your agency requires. Describe what happened, not who is to blame.
            `),
            tip("\"If it wasn't documented, it wasn't done.\" Accurate notes protect the client, you and the agency."),
            check("How should you correct an error on a paper note?", ["Use correction fluid", "Scribble it out", "Draw one line through it, write error, initial and date", "Tear out the page"], 2, "A single line keeps the original readable, which legal records require."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("communication", "easy", "What should you do at the start of every visit?", ["Start working right away", "Introduce yourself and explain why you're there", "Ask for a tip", "Turn on the TV"], 1, "Introducing yourself builds trust and is respectful."),
    mc("communication", "medium", "Which is an example of active listening?", ["Interrupting to save time", "Repeating back what the client said", "Looking at your phone", "Changing the subject"], 1, "Repeating back shows you heard and checks understanding."),
    tf("communication", "easy", "Speaking to an older adult as if they were a child (elderspeak) is respectful.", false, "Elderspeak is disrespectful; speak to clients as adults."),
    mc("communication", "medium", "A client who is blind wants to find her cup. What is the most helpful?", ["Point at it", "Say \"It's over there\"", "Say \"Your cup is at 3 o'clock, near your right hand\"", "Move it often"], 2, "Clock-face directions help clients with vision loss."),
    ms("communication", "medium", "Which help a client with aphasia after a stroke? Select all that apply.", ["Allowing extra time to respond", "Yes/no questions", "Picture boards or gestures", "Speaking quickly"], [0, 1, 2], "Patience, simple questions and visual aids help people with aphasia."),
    mc("communication", "medium", "A client with dementia insists it's 1975. What should you do?", ["Argue until they agree", "Respond calmly and gently redirect", "Laugh", "Ignore them"], 1, "Arguing increases distress; calm redirection helps."),
    mc("communication", "hard", "A family member asks for the client's diagnosis, but you don't know if the client allows it. What do you do?", ["Tell them everything", "Refer them to your supervisor", "Make something up", "Show them the chart"], 1, "Only share health information with people the client allows; your supervisor can check."),
    mc("culture-privacy", "easy", "What does HIPAA protect?", ["The aide's pay", "Clients' health information", "The agency's car", "Medicare prices"], 1, "HIPAA protects the privacy of health information."),
    tf("culture-privacy", "medium", "Posting a photo of a client's home without their name is fine under confidentiality rules.", false, "Photos of clients or their homes break confidentiality even without names."),
    mc("culture-privacy", "medium", "The best way to learn a client's cultural or religious preferences is to…", ["Assume based on their appearance", "Ask them respectfully", "Ask the neighbours", "Search online"], 1, "Ask, don't assume."),
    mc("culture-privacy", "medium", "A client asks for an aide of the same gender for bathing. What should you do?", ["Refuse", "Tell your supervisor so the agency can try to arrange it", "Ignore the request", "Bathe them anyway"], 1, "Respect modesty preferences and involve the supervisor."),
    ms("culture-privacy", "medium", "Which protect client confidentiality? Select all that apply.", ["Logging out of the care app", "Having calls about clients in private", "Talking about clients with friends", "Keeping paperwork secure"], [0, 1, 3], "Secure devices, private calls and secure papers protect privacy."),
    mc("culture-privacy", "hard", "Why should you avoid using a client's young child as an interpreter?", ["Children talk too slowly", "Health information may be misunderstood and it's unfair to the child", "Children can't speak", "It's faster to guess"], 1, "Agencies should use trained interpreters or language lines."),
    mc("documentation", "easy", "Which is a subjective observation?", ["Temperature 99.1°F", "Client states, \"My back hurts\"", "Bruise on right arm", "Pulse 88"], 1, "Subjective information is what the client reports."),
    ms("documentation", "medium", "Which should be reported to your supervisor right away? Select all that apply.", ["Chest pain", "A fall", "Sudden confusion", "The client enjoyed lunch"], [0, 1, 2], "Chest pain, falls and sudden confusion need immediate reporting."),
    tf("documentation", "easy", "It's acceptable to document care before you give it to save time.", false, "Document only after giving care."),
    mc("documentation", "medium", "What is 2:30 p.m. in 24-hour time?", ["02:30", "12:30", "14:30", "16:30"], 2, "Add 12 to afternoon hours: 2 + 12 = 14."),
    mc("documentation", "medium", "What does EVV record?", ["The client's diagnosis", "When and where the aide's visit happened", "The aide's grades", "The family's opinions"], 1, "Electronic visit verification records visit times and location."),
    mc("documentation", "medium", "Which note is best?", ["\"Client was difficult.\"", "\"Client refused shower at 10:15; stated 'I'm too tired'. Supervisor notified 10:25.\"", "\"Bad day.\"", "\"Same as usual.\""], 1, "Specific, factual, timed notes are best."),
    ord("documentation", "medium", "Put the steps for handling a client fall in order.", ["Make sure the client is safe and don't move them if hurt", "Call for help (911 if needed) and your supervisor", "Stay with the client and follow instructions", "Complete the incident report"], "Safety first, get help, stay with the client, then document."),
    mc("documentation", "hard", "What should an incident report focus on?", ["Who is to blame", "What happened, factually", "Your opinion of the family", "Nothing; skip it if no one was hurt"], 1, "Incident reports describe the facts, not blame."),
    tf("documentation", "medium", "If you're unsure whether a change matters, it's better to report it.", true, "Report when in doubt; the nurse decides what it means."),
  ],
};
