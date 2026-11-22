import { check, mc, ms, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 3,
  id: "cna-infection-control-and-safety",
  title: "Infection Control, Safety and Emergencies",
  summary: "Course 3 of 6 in the Zebron CNA Program. Standard and transmission-based precautions, hand hygiene and PPE (both NNAAP skills), bloodborne pathogens, fall prevention, the call light, fire safety and emergencies.",
  description:
    "Facilities care for many vulnerable people under one roof, so infection control and safety are central to the CNA role. This course covers the chain of infection, hand hygiene and putting on and removing PPE, standard and transmission-based (contact, droplet and airborne) precautions, multidrug-resistant organisms, bloodborne pathogens and sharps, preventing falls, using the call light, fire safety, and responding to emergencies.\n\n**This program is a study aid.** It does not replace a state-approved nurse aide training program, CPR certification or the NNAAP exam, and it does not certify you.",
  level: "beginner",
  cover: "teal",
  outcomes: [
    "Perform hand hygiene and use PPE in the correct order",
    "Apply standard and transmission-based precautions",
    "Prevent falls and keep the resident's environment safe",
    "Respond to fire and medical emergencies",
  ],
  skills: ["Hand hygiene", "PPE", "Isolation precautions", "Bloodborne pathogens", "Fall prevention", "Emergency response"],
  quiz: {
    name: "CNA: Infection Control and Safety",
    slug: "cna-infection-control-and-safety",
    description: "Hand hygiene, PPE, isolation precautions, bloodborne pathogens, falls, fire and emergencies.",
    tags: ["cna", "nursing assistant", "healthcare", "infection control", "safety"],
  },
  topics: [
    { key: "infection", name: "Infection prevention", description: "Chain of infection, hand hygiene, PPE and standard precautions." },
    { key: "precautions", name: "Isolation and bloodborne pathogens", description: "Contact, droplet and airborne precautions; MDROs; sharps and exposures." },
    { key: "safety", name: "Safety and emergencies", description: "Falls, call lights, fire, choking and other emergencies." },
  ],
  modules: [
    {
      id: "infection-prevention",
      title: "Preventing Infection",
      lessons: [
        {
          id: "chain-and-hand-hygiene",
          title: "The Chain of Infection and Hand Hygiene",
          minutes: 7,
          blocks: [
            text(`
              ## Break the chain

              Infection needs six links: **agent → reservoir → portal of exit → mode of transmission → portal of entry → susceptible host**. Nursing home residents are often susceptible hosts because of age, chronic illness, wounds, catheters and shared living spaces.

              ## Hand hygiene (an NNAAP skill)

              1. Turn on warm water, wet hands and wrists, keep hands **lower than elbows**.
              2. Apply soap and lather all surfaces, between fingers and under nails, for **at least 20 seconds**.
              3. Rinse from wrists to fingertips, fingers pointing down.
              4. Dry with a clean paper towel and use a **clean, dry paper towel to turn off the faucet**.
              5. Don't touch the sink with your hands or clothes; if you do, start again.

              Alcohol-based hand rub works for most moments when hands aren't visibly soiled. Use soap and water when hands are visibly dirty and for residents with *C. difficile*.
            `),
            tip("On the skills test, the evaluator watches for critical steps such as lathering for at least 20 seconds and not touching the sink."),
            check("During handwashing, which way should water run?", ["From fingertips to elbows", "From wrists to fingertips, fingers pointing down", "Any direction", "Up the arms"], 1, "Fingers down lets dirty water run off the hands, not back up the arms."),
          ],
        },
        {
          id: "ppe-standard-precautions",
          title: "Standard Precautions and PPE",
          minutes: 7,
          blocks: [
            text(`
              ## Standard precautions

              Used for **every resident**: assume all blood, body fluids, secretions, excretions (except sweat), broken skin and mucous membranes may be infectious. Hand hygiene; gloves, gowns, masks and eye protection when contact or splashes are possible; respiratory hygiene; safe handling of linen and sharps; and cleaning shared equipment between residents.

              ## Putting on PPE

              Gown (tie at neck and waist, covering from neck to knees) → mask or respirator → goggles or face shield → gloves (pulled over the gown cuffs).

              ## Removing PPE

              Gloves (glove-to-glove, then skin-to-skin, without touching the outside with bare hands) → goggles or face shield → gown (untie, pull away from neck and shoulders, turn inside out, roll) → mask, then **hand hygiene**. Remove PPE before leaving the room (respirators after leaving and closing the door).
            `),
            tip("If your hands become contaminated while removing PPE, clean them right away, then continue."),
            check("When are gloves pulled over the gown cuffs?", ["Never", "When putting on PPE, as the last item", "Before the gown", "After leaving the room"], 1, "Gloves go on last and cover the gown cuffs."),
          ],
        },
      ],
    },
    {
      id: "isolation",
      title: "Isolation and Bloodborne Pathogens",
      lessons: [
        {
          id: "transmission-based",
          title: "Transmission-Based Precautions",
          minutes: 8,
          blocks: [
            text(`
              ## Three types (added to standard precautions)

              | Type | Spread by | Examples | PPE and room |
              |---|---|---|---|
              | **Contact** | touch, surfaces | MRSA, VRE, *C. diff*, scabies | gown and gloves; dedicated equipment |
              | **Droplet** | large droplets within about 6 feet | influenza, pertussis | surgical mask; private room or spacing |
              | **Airborne** | tiny particles that stay in the air | tuberculosis, measles, chickenpox | fit-tested N95 respirator; airborne infection isolation room with the door closed |

              Read the sign on the door before entering, and ask the nurse if you're unsure.
            `),
            text(`
              ## Nursing homes and MDROs

              Multidrug-resistant organisms (MDROs) such as MRSA, VRE and CRE are common in long-term care. Some facilities use **enhanced barrier precautions**: gown and gloves during high-contact care (bathing, dressing, transfers, toileting, wound or device care) for residents with MDROs, wounds or indwelling devices, while the resident can still join activities.
            `),
            tip("Isolation can be lonely. Explain why it's needed, visit often, and keep the call light within reach."),
            check("Which precautions require a fit-tested N95 respirator?", ["Contact", "Droplet", "Airborne", "Standard"], 2, "Airborne precautions (such as for TB) need an N95 and a special room."),
          ],
        },
        {
          id: "bloodborne-sharps",
          title: "Bloodborne Pathogens and Exposures",
          minutes: 6,
          blocks: [
            text(`
              ## Bloodborne pathogens

              **Hepatitis B, hepatitis C and HIV** spread through blood and some body fluids. The OSHA Bloodborne Pathogens Standard requires employers to provide training, PPE, sharps containers and the **hepatitis B vaccine** free of charge to workers at risk.

              ## Sharps and spills

              Never recap, bend or break needles; drop used sharps into a puncture-resistant sharps container and don't overfill it. Clean blood spills with gloves and the facility's approved disinfectant.

              ## If you're exposed

              Wash a needlestick or cut with soap and water, flush splashes to the eyes, nose or mouth with water, **report immediately** to your supervisor and follow the facility's exposure plan. Prompt medical evaluation matters.
            `),
            tip("Wear gloves when you might touch blood, body fluids, mucous membranes or broken skin, and when cleaning contaminated items."),
            check("You get a needlestick from a used needle left in a bed. What should you do first?", ["Finish your shift, then report", "Wash the area with soap and water and report it immediately", "Ignore it if it doesn't bleed", "Recap the needle"], 1, "Wash and report right away so you can be evaluated promptly."),
          ],
        },
      ],
    },
    {
      id: "safety",
      title: "Safety and Emergencies",
      lessons: [
        {
          id: "falls-call-light",
          title: "Falls and the Call Light",
          minutes: 7,
          blocks: [
            text(`
              ## Falls

              Falls are one of the most serious risks in nursing homes. Common causes: weakness, dizziness on standing, medications, confusion, urgency to use the toilet, poor footwear, clutter, wet floors and poor lighting.

              - Answer call lights promptly and **toilet residents on a schedule**.
              - Keep the **bed in the lowest position** with brakes locked; floor mats if ordered.
              - Non-skid footwear, glasses on, walker or cane in reach.
              - Keep paths clear and lights on at night.
              - Follow the fall-risk plan (alarms, frequent checks).
            `),
            text(`
              ## The call light

              Before you leave any resident, place the **call light within easy reach** and make sure they can use it. Answer every call light promptly, even if it's not your resident, and if you can't help, find someone who can.
            `),
            tip("On the NNAAP skills test, \"call light within reach\" and \"bed in lowest position\" are steps you should finish every resident skill with."),
            check("What must you do before leaving a resident's room?", ["Turn off the lights", "Place the call light within reach", "Raise the bed to the highest position", "Close the curtain all the way"], 1, "The call light is the resident's way to get help."),
          ],
        },
        {
          id: "fire-emergencies",
          title: "Fire and Medical Emergencies",
          minutes: 7,
          blocks: [
            text(`
              ## Fire

              **RACE**: **R**escue residents in immediate danger · **A**ctivate the alarm · **C**onfine the fire (close doors and windows) · **E**xtinguish if small and safe, or **E**vacuate. Extinguisher: **PASS** (Pull, Aim at the base, Squeeze, Sweep). Know your unit's exits, alarm pulls and evacuation routes; don't use elevators.

              Oxygen supports burning: no smoking or open flames near oxygen, and keep cylinders secured upright.
            `),
            text(`
              ## Medical emergencies

              Call for help (use the emergency call system), stay with the resident and follow the nurse's directions. Know each resident's **code status** (full code or DNR). Most employers require **CPR** certification.

              - **Choking**: if the person can't speak, cough or breathe, call for help and give abdominal thrusts if trained.
              - **Seizure**: protect the head, move objects away, don't restrain or put anything in the mouth, time it, turn on the side afterwards.
              - **Fainting**: lower the person to the floor or a chair, check breathing, call the nurse.
              - **Stroke (BE FAST)**: Balance, Eyes, Face, Arms, Speech, Time to call for help.
            `),
            tip("The universal sign of choking is hands clutched at the throat."),
            check("In RACE, what does C stand for?", ["Call", "Confine the fire", "Carry", "Check"], 1, "Close doors and windows to confine the fire."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("infection", "easy", "What is the most important way to prevent infections?", ["Wearing a uniform", "Hand hygiene", "Antibiotics", "Air fresheners"], 1, "Hand hygiene breaks the most common route of transmission."),
    mc("infection", "medium", "How should you turn off the faucet after handwashing?", ["With your clean hand", "With your elbow on the sink", "With a clean, dry paper towel", "Leave it running"], 2, "A clean paper towel keeps clean hands from recontamination."),
    tf("infection", "medium", "During handwashing, hands should be held higher than the elbows.", false, "Keep hands lower than elbows so water runs off the fingertips."),
    ord("infection", "medium", "Put the PPE removal steps in order.", ["Gloves", "Goggles or face shield", "Gown", "Mask", "Hand hygiene"], "Gloves first (most contaminated), then eye protection, gown, mask, and clean hands."),
    ms("infection", "medium", "Which are part of standard precautions? Select all that apply.", ["Hand hygiene", "Gloves when touching body fluids", "Cleaning shared equipment between residents", "Using PPE only for residents with known infections"], [0, 1, 2], "Standard precautions apply to all residents."),
    mc("infection", "hard", "Why are nursing home residents often susceptible hosts?", ["They're young", "Age, chronic illness, wounds and devices weaken defences", "They never leave", "They eat too much"], 1, "Age and health conditions increase risk."),
    mc("infection", "medium", "Which gown technique is correct when removing it?", ["Pull it over your head", "Untie, pull away from the neck and shoulders, turn inside out and roll", "Shake it out", "Leave it on to the next room"], 1, "Turning it inside out keeps the contaminated side in."),
    mc("precautions", "easy", "Which precautions are used for MRSA in a wound?", ["Airborne", "Contact", "Droplet", "None"], 1, "MRSA spreads by touch: contact precautions."),
    mc("precautions", "medium", "A resident has influenza. Which precautions apply?", ["Contact only", "Droplet", "Airborne", "None"], 1, "Influenza spreads by droplets."),
    mc("precautions", "medium", "Which PPE is used for droplet precautions?", ["N95 respirator only", "A surgical mask", "Gloves only", "No PPE"], 1, "A surgical mask protects against large droplets."),
    ms("precautions", "medium", "Which spread through blood? Select all that apply.", ["Hepatitis B", "Hepatitis C", "HIV", "The common cold"], [0, 1, 2], "Hepatitis B, hepatitis C and HIV are bloodborne pathogens."),
    tf("precautions", "easy", "Used needles should be recapped before being thrown away.", false, "Never recap; drop them straight into a sharps container."),
    mc("precautions", "medium", "Who pays for the hepatitis B vaccine for at-risk workers under OSHA rules?", ["The worker", "The employer, at no cost to the worker", "The resident", "Medicare"], 1, "Employers must offer it free of charge."),
    mc("precautions", "hard", "Enhanced barrier precautions in nursing homes mean…", ["Keeping residents in their rooms at all times", "Gown and gloves during high-contact care for residents with MDROs, wounds or devices", "No PPE", "N95s for everyone"], 1, "EBP targets high-contact care while allowing residents to join activities."),
    mc("safety", "easy", "Where should the bed be when you leave a resident?", ["Highest position", "Lowest position with brakes locked", "Tilted", "Unlocked"], 1, "Lowest position reduces injury from falls."),
    ms("safety", "medium", "Which reduce falls? Select all that apply.", ["Scheduled toileting", "Non-skid footwear", "Answering call lights promptly", "Leaving the walker across the room"], [0, 1, 2], "Meeting needs and safe equipment prevent falls."),
    mc("safety", "medium", "What does the first A in RACE stand for?", ["Aim", "Activate the alarm", "Assist", "Assess"], 1, "Rescue, Activate the alarm, Confine, Extinguish or evacuate."),
    tf("safety", "easy", "Elevators should be used to evacuate residents during a fire.", false, "Don't use elevators during a fire."),
    mc("safety", "medium", "A resident clutches her throat and can't speak or cough. What is happening?", ["A seizure", "Severe choking", "A stroke", "Fainting"], 1, "That is the universal sign of choking; call for help and act if trained."),
    mc("safety", "medium", "During a seizure, which is correct?", ["Hold the resident down", "Put a spoon in the mouth", "Protect the head and time the seizure", "Give water"], 2, "Protect from injury, don't restrain, and time it."),
    mc("safety", "hard", "Another CNA's resident's call light is on and she's on break. What do you do?", ["Ignore it", "Answer it and help or find someone who can", "Turn it off", "Wait until she's back"], 1, "Every call light is everyone's responsibility."),
  ],
};
