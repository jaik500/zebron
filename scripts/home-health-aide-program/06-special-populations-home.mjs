import { check, mc, ms, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 6,
  id: "hha-special-populations-and-home",
  title: "Dementia, End-of-Life Care, the Home and Self-Care",
  summary: "Course 6 of 6 in the Zebron Home Health Aide Program. Care for clients with dementia, mental health needs and disabilities, respond to agitation, support clients at the end of life, keep the home clean, and look after yourself.",
  description:
    "The last course covers the clients and situations that need extra skill: dementia and agitated behaviour, mental health conditions, developmental and physical disabilities, children, and end-of-life and hospice care. It also covers keeping a clean, healthy home, using medical equipment, and caring for yourself so you can avoid stress and burnout. It ends with a guide to preparing for your state's competency exam.\n\n**This program is a study aid.** It does not replace state-approved training, supervised clinical hours or a state exam, and it does not certify or license you.",
  level: "beginner",
  cover: "slate",
  outcomes: [
    "Communicate with and calm clients who have dementia or are agitated",
    "Support clients and families at the end of life",
    "Keep the client's home clean and healthy",
    "Use stress and time management to prevent burnout",
    "Prepare for a skills and written competency exam",
  ],
  skills: ["Dementia care", "De-escalation", "End-of-life care", "Housekeeping", "Self-care", "Exam preparation"],
  quiz: {
    name: "HHA: Special Populations and Home",
    slug: "hha-special-populations-and-home",
    description: "Dementia, agitation, disabilities, end-of-life care, home management and self-care.",
    tags: ["home health aide", "healthcare", "dementia", "hospice"],
  },
  topics: [
    { key: "populations", name: "Clients with special needs", description: "Dementia, agitation, mental health, disabilities and children." },
    { key: "end-of-life", name: "End-of-life care", description: "Comfort, hospice, signs of dying and grief." },
    { key: "home-self", name: "Home management and self-care", description: "Housekeeping, equipment, stress, burnout and exam preparation." },
  ],
  modules: [
    {
      id: "special-populations",
      title: "Clients with Special Needs",
      lessons: [
        {
          id: "dementia",
          title: "Dementia Care",
          minutes: 8,
          blocks: [
            text(`
              ## What dementia is

              Dementia is a loss of memory and thinking skills that affects daily life; **Alzheimer's disease** is the most common cause. People may forget recent events, get lost, repeat questions, have trouble with tasks they used to do, and change in mood or behaviour.

              ## Helping well

              - Keep a **routine** and a calm, uncluttered space.
              - Approach from the front, say your name, speak slowly, one step at a time.
              - Offer simple choices ("tea or juice?").
              - Don't argue or correct; **validate feelings and redirect**.
              - Watch for pain, hunger, toileting needs or tiredness behind behaviour changes.
            `),
            text(`
              ## Sundowning and wandering

              Confusion and restlessness often get worse in the late afternoon and evening (**sundowning**). Keep lights on, reduce noise, offer a snack or a quiet activity. For wandering, follow the safety plan (door alarms, ID bracelets) and report if the client goes missing.
            `),
            tip("Behaviour is communication. Ask yourself what the client might need."),
            check("A client with dementia keeps asking for her late husband. What's the kindest response?", ["Remind her he died", "Ignore her", "Acknowledge her feelings and gently redirect", "Tell her he's coming soon"], 2, "Validation and redirection reduce distress without arguing."),
          ],
        },
        {
          id: "agitation",
          title: "Agitated or Combative Clients",
          minutes: 7,
          blocks: [
            text(`
              ## De-escalation

              1. Stay calm; lower your voice and slow down.
              2. Give the client space; stand to the side, outside arm's reach.
              3. Listen and acknowledge: "I can see you're upset."
              4. Remove triggers (noise, crowding) and offer a choice or a break.
              5. If the client or you are in danger, leave the area and call your supervisor or 911.
            `),
            text(`
              ## Preventing abuse

              Caregiver frustration can lead to rough handling or harsh words. If you feel your patience slipping, make sure the client is safe, step away for a moment and breathe. **Never** hit, restrain, threaten, lock in or shout at a client. Report any injury from an incident.
            `),
            tip("Agitation often has a cause: pain, fear, a full bladder, being rushed or being cold during care. Fix the cause when you can."),
            check("A client becomes combative during bathing. What should you do first?", ["Hold their arms down", "Stop, stay calm, give space and try again later", "Finish the bath quickly", "Shout to get their attention"], 1, "Stopping and giving space prevents injury; try a different approach later."),
          ],
        },
        {
          id: "mental-health-disabilities",
          title: "Mental Health, Disabilities and Children",
          minutes: 7,
          blocks: [
            text(`
              ## Mental health

              Clients may live with depression, anxiety, bipolar disorder or schizophrenia. Be patient and non-judgmental, encourage routines and activity, and report signs such as withdrawal, not eating, sleeping much more or less, or hearing voices. **If a client talks about suicide or self-harm, stay with them if it's safe and call your supervisor at once; call 911 (or 988, the Suicide and Crisis Lifeline) in an emergency.**

              ## Disabilities

              Clients with intellectual, developmental or physical disabilities are the experts on their own needs. Speak to the client, not their companion, and support their goals.

              ## Children

              Some aides care for children with disabilities or long-term illness. Follow the plan closely, include parents, and use age-appropriate communication.
            `),
            tip("Depression is common in older adults and is not a normal part of ageing. Report changes in mood."),
            check("A client says they don't see the point in living anymore. What should you do?", ["Change the subject", "Take it seriously, stay with them if safe and contact your supervisor right away", "Wait until next week", "Tell them to cheer up"], 1, "Talk of suicide is always taken seriously and reported immediately."),
          ],
        },
      ],
    },
    {
      id: "end-of-life",
      title: "End-of-Life Care",
      lessons: [
        {
          id: "comfort-care",
          title: "Comfort at the End of Life",
          minutes: 8,
          blocks: [
            text(`
              ## Hospice and palliative care

              **Palliative care** relieves symptoms at any stage of a serious illness; **hospice** is comfort-focused care for people expected to live about six months or less who are no longer seeking a cure. Aides often work with hospice teams in the home.

              ## Comfort measures

              Keep the client clean, dry and positioned comfortably; offer mouth care often (moist swabs, lip balm); report pain right away; keep the room calm; and remember that hearing may remain to the end, so keep talking gently.
            `),
            text(`
              ## Signs that death is near

              Sleeping more, eating and drinking less, cool or mottled skin on hands and feet, changes in breathing (pauses, noisy breathing), and confusion. Report changes to the nurse. Follow the client's advance directives and code status (for example a DNR order, Maryland's MOLST, DC's MOST or Virginia's POST form).
            `),
            tip("Respect each family's cultural and religious rituals around dying and death. Ask what matters to them."),
            check("Which is true at the end of life?", ["Hearing may continue until the end", "Clients should be forced to eat", "Pain should not be reported", "Mouth care is unnecessary"], 0, "Hearing may remain, so keep speaking gently to the client."),
          ],
        },
        {
          id: "grief",
          title: "Grief and After Death",
          minutes: 6,
          blocks: [
            text(`
              ## When a client dies

              If the client is on hospice, call the hospice nurse as instructed (not 911, unless the plan says so). Otherwise follow your agency's policy. Treat the body with respect, and give the family time and privacy.

              ## Grief

              People grieve in different ways; feelings may include shock, anger, sadness and relief. Listen, offer simple kindness ("I'm so sorry"), and avoid clichés. Aides grieve too: talk to your supervisor and use support resources.
            `),
            tip("It's normal to feel sad when a client dies. Taking care of your feelings is part of being a professional."),
            check("A hospice client dies at home during your visit. Who do you usually call first?", ["The hospice nurse, as the plan instructs", "The police", "A neighbour", "No one"], 0, "Hospice plans usually say to call the hospice nurse first."),
          ],
        },
      ],
    },
    {
      id: "home-and-self",
      title: "The Home and Yourself",
      lessons: [
        {
          id: "housekeeping-equipment",
          title: "Housekeeping and Medical Equipment",
          minutes: 7,
          blocks: [
            text(`
              ## A clean, healthy home

              Aides help with light housekeeping related to the client's care: the client's bedroom and bathroom, the kitchen after meals, and the client's laundry. Clean from **clean to dirty and high to low**. Wash soiled laundry separately in hot water if the fabric allows. Never mix bleach and ammonia.

              ## Medical equipment

              Keep wheelchairs, walkers, commodes, hospital beds and lifts clean and in good repair. Check brakes, wheels and cords. Report broken equipment and don't use it.
            `),
            tip("Ask the client how they like things done. It's their home and their belongings."),
            check("Which cleaning products must never be mixed?", ["Soap and water", "Bleach and ammonia", "Vinegar and water", "Dish soap and warm water"], 1, "Bleach and ammonia make toxic gas."),
          ],
        },
        {
          id: "self-care",
          title: "Caring for Yourself",
          minutes: 6,
          blocks: [
            text(`
              ## Stress and burnout

              Home care is rewarding and demanding. Signs of burnout include exhaustion, irritability, dreading work, and feeling detached from clients.

              - Plan your day: visits, travel time and paperwork.
              - Eat, sleep and move regularly; protect your back.
              - Set boundaries; you can't be available 24 hours a day.
              - Talk to your supervisor, a trusted person, or your employee assistance program.
              - Stay safe travelling: share your schedule with the agency and trust your instincts.
            `),
            tip("Taking care of yourself isn't selfish; it's how you keep giving safe care."),
            check("Which is a sign of burnout?", ["Feeling rested", "Dreading work and feeling detached", "Enjoying visits", "Sleeping well"], 1, "Dread, exhaustion and detachment are burnout warning signs."),
          ],
        },
        {
          id: "exam-prep",
          title: "Preparing for Your Competency Exam",
          minutes: 7,
          blocks: [
            text(`
              ## Two parts

              DMV competency exams for aides (such as the DC home health aide exam and the NNAAP nurse aide exam used in Maryland and DC through Credentia) usually have a **written or oral knowledge test** and a **skills test** where an evaluator watches you perform care on a person or mannequin.

              ## Skills test tips

              - Start every skill the same way: knock, introduce yourself, identify the client, clean your hands, explain, provide privacy.
              - Finish every skill the same way: client comfortable and safe, call light or phone in reach, bed lowered, clean your hands, report and record.
              - Practise the **critical steps** that fail a skill if missed (for example hand hygiene, locking wheels, correct measurements).
              - Say what you're doing out loud so the evaluator sees it.
            `),
            text(`
              ## Knowledge test tips

              Read each question fully, choose the **safest** answer that keeps the client's rights and safety first, and remember that the aide reports changes rather than diagnosing. Use the Zebron practice quizzes for each course, then take the certification exam.
            `),
            tip("Check your state exam's official candidate handbook for the exact skills list; it changes from time to time."),
            check("What should you do at the end of every skills test task?", ["Leave immediately", "Make the client safe and comfortable, clean your hands and record", "Ask the evaluator for your score", "Skip hand hygiene"], 1, "Consistent closing steps keep the client safe and show the evaluator good practice."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("populations", "easy", "What is the most common cause of dementia?", ["The flu", "Alzheimer's disease", "Broken bones", "Allergies"], 1, "Alzheimer's disease is the most common cause."),
    mc("populations", "medium", "What is sundowning?", ["A sunburn", "Increased confusion in the late afternoon or evening", "Sleeping late", "A type of diet"], 1, "Confusion and agitation often rise later in the day."),
    ms("populations", "medium", "Which help clients with dementia? Select all that apply.", ["A regular routine", "Simple choices", "Arguing to correct them", "Calm, one-step instructions"], [0, 1, 3], "Routine, simple choices and calm steps help; arguing increases distress."),
    mc("populations", "medium", "Where should you stand when a client is agitated?", ["Directly in their face", "To the side, outside arm's reach", "Behind them", "Blocking the door"], 1, "Giving space protects you and calms the client."),
    tf("populations", "easy", "It's acceptable to lock a wandering client in a room to keep them safe.", false, "Locking in a client is a form of abuse; follow the agency's safety plan."),
    mc("populations", "medium", "Which number reaches the Suicide and Crisis Lifeline in the US?", ["311", "411", "988", "711"], 2, "Call or text 988."),
    mc("populations", "medium", "A client who uses a wheelchair comes with a companion. Whom should you speak to?", ["The companion only", "The client", "No one", "The agency"], 1, "Speak directly to the client."),
    tf("populations", "medium", "Depression is a normal part of ageing and doesn't need reporting.", false, "Depression is not normal ageing; report mood changes."),
    mc("end-of-life", "easy", "What is hospice care focused on?", ["Curing the illness", "Comfort and quality of life", "Surgery", "Rehabilitation"], 1, "Hospice focuses on comfort for people near the end of life."),
    ms("end-of-life", "medium", "Which can be signs that death is near? Select all that apply.", ["Cool, mottled hands and feet", "Pauses in breathing", "Eating and drinking less", "A sudden appetite for big meals"], [0, 1, 2], "Mottling, breathing changes and reduced intake are common."),
    mc("end-of-life", "medium", "Which comfort measure helps a dying client with a dry mouth?", ["Forcing large drinks", "Frequent mouth care with moist swabs and lip balm", "Nothing", "Salty snacks"], 1, "Frequent mouth care keeps the mouth moist and comfortable."),
    tf("end-of-life", "medium", "A client's hearing may continue at the end of life, so you should keep speaking gently.", true, "Hearing is thought to be one of the last senses to fade."),
    mc("end-of-life", "medium", "What is an advance directive?", ["A shopping list", "A document stating the person's wishes for medical care", "A work schedule", "A pay slip"], 1, "Advance directives record care wishes, such as a DNR."),
    mc("end-of-life", "hard", "Which is a helpful thing to say to a grieving family member?", ["\"Everything happens for a reason.\"", "\"I'm so sorry for your loss.\"", "\"At least they lived a long life.\"", "\"You'll get over it.\""], 1, "Simple sympathy is kinder than clichés."),
    mc("home-self", "easy", "Which cleaning order is best?", ["Dirty to clean, low to high", "Clean to dirty, high to low", "Any order", "Only the floor"], 1, "Clean to dirty and high to low prevents spreading dirt and germs."),
    tf("home-self", "easy", "Mixing bleach and ammonia makes a stronger, safe cleaner.", false, "It makes toxic gas."),
    mc("home-self", "medium", "You notice the wheelchair brake doesn't hold. What should you do?", ["Use it carefully", "Don't use it and report it", "Fix it yourself with tape", "Ignore it"], 1, "Don't use broken equipment; report it."),
    ms("home-self", "medium", "Which help prevent burnout? Select all that apply.", ["Regular sleep and meals", "Setting boundaries", "Talking to your supervisor", "Skipping all breaks"], [0, 1, 2], "Self-care, boundaries and support prevent burnout."),
    ord("home-self", "medium", "Put the opening steps of a skills test task in order.", ["Knock and introduce yourself", "Identify the client", "Clean your hands", "Explain the procedure and provide privacy"], "Introduce, identify, hand hygiene, then explain and provide privacy."),
    mc("home-self", "medium", "On a knowledge test, which answer is usually best?", ["The fastest option", "The safest option that protects the client's rights", "The one that diagnoses the problem", "The one the family prefers"], 1, "Choose safety and client rights; aides report rather than diagnose."),
    mc("home-self", "hard", "Which exam is used for Maryland nursing assistant certification?", ["NCLEX-RN", "NNAAP (via Credentia; Headmaster also approved)", "SAT", "No exam is required"], 1, "Maryland uses the NNAAP exam, with Headmaster approved as an additional vendor."),
  ],
};
