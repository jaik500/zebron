import { check, mc, ms, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 3,
  id: "hha-infection-control-and-safety",
  title: "Infection Control, Safety and Emergencies",
  summary: "Course 3 of 6 in the Zebron Home Health Aide Program. Prevent infection with hand hygiene and PPE, keep the home safe, prevent falls and fires, and respond to emergencies including seizures and power outages.",
  description:
    "Clients at home can be very vulnerable to infections and accidents. This course covers the chain of infection, hand hygiene, standard precautions and personal protective equipment, preventing falls and fires, and what to do in emergencies, including choking, seizures, severe weather and power outages.\n\n**This program is a study aid.** It does not replace state-approved training, CPR certification, supervised clinical hours or a state exam, and it does not certify or license you.",
  level: "beginner",
  cover: "navy",
  outcomes: [
    "Explain how infections spread and how to break the chain",
    "Perform hand hygiene and use PPE correctly",
    "Spot and reduce fall and fire hazards in a home",
    "Respond to common emergencies safely",
  ],
  skills: ["Hand hygiene", "Standard precautions", "PPE", "Fall prevention", "Fire safety", "Emergency response"],
  quiz: {
    name: "HHA: Infection Control and Safety",
    slug: "hha-infection-control-and-safety",
    description: "Infection prevention, PPE, home safety, falls, fire and emergencies.",
    tags: ["home health aide", "healthcare", "infection control", "safety"],
  },
  topics: [
    { key: "infection", name: "Infection prevention", description: "Chain of infection, hand hygiene, PPE and cleaning." },
    { key: "safety", name: "Home safety", description: "Falls, fire, oxygen and a safe environment." },
    { key: "emergencies", name: "Emergencies", description: "Choking, seizures, weather and power outages." },
  ],
  modules: [
    {
      id: "infection-control",
      title: "Preventing Infection",
      lessons: [
        {
          id: "chain-of-infection",
          title: "The Chain of Infection",
          minutes: 6,
          blocks: [
            text(`
              ## Six links

              Infection spreads when all six links connect: **infectious agent** (germ) → **reservoir** (where it lives) → **portal of exit** → **mode of transmission** (hands, droplets, air, objects) → **portal of entry** → **susceptible host**.

              Breaking any link stops the spread. Hand hygiene breaks the most important link: transmission by hands.
            `),
            text(`
              ## Who is at risk

              Older adults, people with diabetes, cancer treatment or wounds, and people with catheters or feeding tubes catch infections more easily. Watch for fever, chills, redness, swelling, pus, cloudy or foul-smelling urine, new cough or new confusion, and report them.
            `),
            tip("In older adults, sudden confusion can be the first sign of an infection such as a urinary tract infection."),
            check("What is the single most effective way to prevent the spread of infection?", ["Wearing perfume", "Hand hygiene", "Opening a window", "Taking vitamins"], 1, "Clean hands break the most common route of transmission."),
          ],
        },
        {
          id: "hand-hygiene",
          title: "Hand Hygiene",
          minutes: 6,
          blocks: [
            text(`
              ## When

              Clean your hands when you arrive and before you leave, before and after touching the client, before clean tasks such as food preparation, after contact with body fluids, after removing gloves, and after touching surfaces near the client.

              ## How

              - **Soap and water**: wet hands, apply soap, scrub all surfaces (backs, between fingers, under nails) for **at least 20 seconds**, rinse with fingertips down, dry with a clean towel, turn off the tap with the towel.
              - **Alcohol-based hand rub** (at least 60% alcohol): cover all surfaces and rub until dry.

              Use soap and water when hands are visibly dirty, after toileting care, and when caring for clients with diarrhoea such as *C. diff*, because alcohol rub doesn't kill its spores.
            `),
            tip("Keep nails short and natural; artificial nails and rings hold germs."),
            check("When must you use soap and water instead of hand rub?", ["Before every meal", "When hands are visibly soiled or the client has C. diff", "Never", "Only at the end of the day"], 1, "Soap and water removes visible dirt and C. diff spores that alcohol doesn't kill."),
          ],
        },
        {
          id: "standard-precautions",
          title: "Standard Precautions and PPE",
          minutes: 7,
          blocks: [
            text(`
              ## Treat all body fluids as infectious

              **Standard precautions** apply to every client: hand hygiene, PPE when you may touch blood or body fluids, safe handling of linens and sharps, and cleaning surfaces.

              ## PPE order

              - **Put on (don)**: gown → mask → goggles or face shield → gloves.
              - **Take off (doff)**: gloves → goggles/shield → gown → mask, then clean your hands. (Gloves first because they are the most contaminated.)
            `),
            text(`
              ## Gloves, linens and sharps

              Change gloves between tasks and whenever torn; never wash or reuse disposable gloves. Hold soiled linen away from your uniform and don't shake it. Aides don't recap needles; if the client uses sharps, they go into a puncture-proof container.
            `),
            tip("Gloves don't replace hand hygiene. Clean your hands before putting gloves on and after taking them off."),
            check("Which PPE item is removed first?", ["Mask", "Gown", "Gloves", "Goggles"], 2, "Gloves are the most contaminated and come off first."),
          ],
        },
      ],
    },
    {
      id: "home-safety",
      title: "A Safe Home",
      lessons: [
        {
          id: "falls",
          title: "Preventing Falls",
          minutes: 7,
          blocks: [
            text(`
              ## Falls are a leading cause of injury in older adults

              Common hazards: loose rugs, clutter, cords, poor lighting, wet floors, unsafe footwear, pets underfoot, and getting up too fast.

              - Keep paths clear and well lit, including a night light to the bathroom.
              - Use non-skid footwear and make sure walkers and canes are within reach.
              - Use grab bars, shower chairs and raised toilet seats when the plan includes them.
              - Help clients sit on the edge of the bed for a moment before standing (dizziness on standing is common).
            `),
            text(`
              ## If a client starts to fall

              Don't try to stop the fall. Keep your back straight, widen your stance, hold the client close and ease them to the floor, protecting their head. Then don't move them until you've checked for injury and called your supervisor (or 911).
            `),
            tip("Suggest removing or taping down loose rugs, but always ask the client first. It's their home."),
            check("A client begins to fall while walking with you. What should you do?", ["Catch them by the arms", "Ease them gently to the floor while protecting their head", "Let go and step back", "Pull them upright"], 1, "Guiding the client down protects both of you from injury."),
          ],
        },
        {
          id: "fire-and-oxygen",
          title: "Fire and Oxygen Safety",
          minutes: 6,
          blocks: [
            text(`
              ## Fire safety

              Check that smoke alarms work, keep space heaters away from bedding and curtains, don't overload outlets, and know two ways out of the home.

              If there's a fire, remember **RACE**: **R**escue (move the client to safety), **A**larm (call 911), **C**ontain (close doors), **E**xtinguish or evacuate. Using an extinguisher: **PASS**: **P**ull the pin, **A**im at the base, **S**queeze, **S**weep.
            `),
            text(`
              ## Oxygen

              Oxygen makes fire burn faster. No smoking, candles, open flames or gas stoves near oxygen; post "No Smoking" signs; keep tanks upright and secured, and tubing free of kinks and trip hazards. Aides do not change the oxygen flow rate.
            `),
            tip("Never use petroleum jelly on the face of a client using oxygen; use a water-based product the nurse recommends."),
            check("What does the A in RACE stand for?", ["Aim", "Alarm", "Assist", "Assess"], 1, "RACE: Rescue, Alarm, Contain, Extinguish or evacuate."),
          ],
        },
      ],
    },
    {
      id: "emergencies",
      title: "Emergencies",
      lessons: [
        {
          id: "medical-emergencies",
          title: "Medical Emergencies",
          minutes: 7,
          blocks: [
            text(`
              ## First steps

              Stay calm, make sure the scene is safe, check the client, call **911**, and follow the dispatcher's instructions. Then call your supervisor. Know the client's code status (for example a DNR order, or a MOLST, MOST or POST form) and where it is kept.

              ## Choking

              A person who can cough or speak should keep coughing. If they can't breathe, cough or speak, call 911 and give abdominal thrusts if you are trained.

              ## Stroke

              Use **BE FAST**: **B**alance, **E**yes, **F**ace drooping, **A**rm weakness, **S**peech difficulty, **T**ime to call 911.
            `),
            text(`
              ## Seizures

              Stay with the client, time the seizure, move furniture away, cushion the head, loosen tight clothing and turn them on their side when possible. **Never** put anything in their mouth or hold them down. Call 911 if it lasts more than 5 minutes, the person is injured, has trouble breathing, or it's their first seizure.
            `),
            tip("Most agencies require aides to hold current CPR certification. Take a hands-on course; online-only CPR is often not accepted."),
            check("During a seizure, what should you NOT do?", ["Time it", "Cushion the head", "Put something in the client's mouth", "Move furniture away"], 2, "Never put anything in the mouth or hold the person down."),
          ],
        },
        {
          id: "weather-and-outages",
          title: "Weather and Power Outages",
          minutes: 6,
          blocks: [
            text(`
              ## Be ready

              DMV summers bring heat waves and thunderstorms; winters bring snow and ice. Clients who use oxygen concentrators, powered beds or refrigerated medications are at special risk during **power outages**.

              - Help keep an emergency kit: water, non-perishable food, flashlights, batteries, a list of medications and contacts.
              - Know the client's backup plan for oxygen (portable tanks) and medical devices.
              - In heat, encourage fluids (unless restricted), use fans or air conditioning, and watch for confusion, dizziness or hot dry skin.
              - In cold, keep the client warm and watch for shivering or confusion. Never use a gas stove or grill for heat (carbon monoxide).
            `),
            text(`
              ## Agency emergency plans

              Home health agencies must have an emergency preparedness plan. Know how your agency contacts you, which clients are priority visits, and what to do if you can't reach a client safely.
            `),
            tip("Utilities in the region let customers who depend on medical equipment register for priority notification. Your supervisor can help the client sign up."),
            check("During a power outage, which client is at highest risk?", ["A client who reads all day", "A client who uses an oxygen concentrator", "A client with a cat", "A client who likes tea"], 1, "Oxygen concentrators need electricity, so the client needs a backup supply."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("infection", "easy", "For how long should you scrub your hands with soap?", ["5 seconds", "At least 20 seconds", "2 minutes", "It doesn't matter"], 1, "Scrub all surfaces for at least 20 seconds."),
    mc("infection", "medium", "Which is the minimum alcohol content of an effective hand rub?", ["10%", "30%", "60%", "100%"], 2, "Use a rub with at least 60% alcohol."),
    ord("infection", "medium", "Put the PPE in the order you put it on.", ["Gown", "Mask", "Goggles or face shield", "Gloves"], "Gown, mask, eye protection, then gloves."),
    tf("infection", "easy", "Wearing gloves means you don't need hand hygiene.", false, "Clean hands before and after using gloves."),
    ms("infection", "medium", "Which can be signs of infection? Select all that apply.", ["Fever", "Cloudy, foul-smelling urine", "New confusion in an older adult", "A good appetite"], [0, 1, 2], "Fever, urine changes and new confusion can all signal infection."),
    mc("infection", "medium", "How should you carry soiled linen?", ["Against your uniform", "Away from your body, without shaking it", "Shake it out first", "Over your shoulder"], 1, "Hold linen away from your body to avoid contaminating yourself."),
    mc("infection", "hard", "Why use soap and water for a client with C. diff?", ["It smells nicer", "Alcohol rub doesn't kill C. diff spores", "Soap is cheaper", "It's faster"], 1, "C. diff spores are removed by washing, not killed by alcohol."),
    mc("infection", "medium", "Standard precautions apply to…", ["Only clients with known infections", "Every client", "Only children", "Only hospital patients"], 1, "Treat all blood and body fluids as potentially infectious."),
    mc("safety", "easy", "Which is a fall hazard?", ["A clear hallway", "A loose throw rug", "A night light", "A grab bar"], 1, "Loose rugs cause trips and falls."),
    ms("safety", "medium", "Which reduce fall risk? Select all that apply.", ["Non-skid footwear", "Sitting on the bed edge before standing", "Keeping the walker within reach", "Dim lighting at night"], [0, 1, 2], "Good footwear, a slow rise and mobility aids reduce falls."),
    mc("safety", "medium", "What does the first S in PASS mean?", ["Stop", "Squeeze", "Spray", "Shout"], 1, "PASS: Pull, Aim, Squeeze, Sweep."),
    tf("safety", "medium", "It's safe to light a candle in a room where a client uses oxygen if the window is open.", false, "No open flames near oxygen; it makes fire burn faster."),
    mc("safety", "medium", "Who changes the client's oxygen flow rate?", ["The aide", "The family", "The nurse following the prescriber's order", "The client's neighbour"], 2, "Aides don't change oxygen settings."),
    mc("safety", "hard", "Which product should not be used on the face of a client on oxygen?", ["A water-based moisturiser the nurse recommends", "Petroleum jelly", "Plain water", "A clean washcloth"], 1, "Petroleum-based products are flammable around oxygen."),
    mc("emergencies", "easy", "What does BE FAST help you recognise?", ["A heart attack", "A stroke", "A seizure", "Dehydration"], 1, "BE FAST: Balance, Eyes, Face, Arm, Speech, Time."),
    mc("emergencies", "medium", "When should you call 911 for a seizure?", ["If it lasts more than 5 minutes or it's the first seizure", "Never", "Only if the family asks", "After 30 minutes"], 0, "Seizures over 5 minutes, injuries, breathing trouble or a first seizure need 911."),
    mc("emergencies", "medium", "A client is choking but coughing forcefully. What should you do?", ["Give abdominal thrusts right away", "Encourage them to keep coughing and stay with them", "Give water", "Slap their back hard"], 1, "Forceful coughing is the best way to clear the airway."),
    tf("emergencies", "easy", "You should hold a person down during a seizure to stop the movements.", false, "Never restrain someone during a seizure."),
    ms("emergencies", "medium", "Which belong in a client's emergency kit? Select all that apply.", ["Water", "Flashlight and batteries", "List of medications and contacts", "A gas grill for indoor heat"], [0, 1, 2], "Never use a grill or gas stove indoors for heat; it causes carbon monoxide poisoning."),
    mc("emergencies", "hard", "In a heat wave, which sign needs urgent attention?", ["Mild thirst", "Confusion with hot, dry skin", "Wanting a cold drink", "Asking for a fan"], 1, "Confusion with hot, dry skin can mean heat stroke, an emergency."),
    ord("emergencies", "medium", "Put the first steps in a medical emergency in order.", ["Make sure the scene is safe", "Check the client", "Call 911", "Call your supervisor"], "Safety, check, call 911, then the agency."),
  ],
};
