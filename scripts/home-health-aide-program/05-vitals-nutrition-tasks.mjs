import { check, mc, ms, num, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 5,
  id: "hha-vital-signs-nutrition-and-tasks",
  title: "Vital Signs, Nutrition and Delegated Tasks",
  summary: "Course 5 of 6 in the Zebron Home Health Aide Program. Measure and record vital signs, height and weight, support nutrition and fluids, prepare meals safely, and understand delegated tasks such as medication reminders and ostomy care.",
  description:
    "Aides often measure vital signs and watch what clients eat and drink. This course covers temperature, pulse, respirations, blood pressure, pain, height and weight; normal ranges and what to report; nutrition, special diets, fluids and safe feeding; food safety and meal preparation; and tasks that some DMV agencies assign to trained aides, such as reminders for self-administered medication, ostomy appliance care, enemas and oxygen equipment.\n\nWhich tasks you may do depends on your state, your agency and the plan of care. **This program is a study aid** and does not certify or license you.",
  level: "beginner",
  cover: "violet",
  outcomes: [
    "Measure and record temperature, pulse, respirations and blood pressure",
    "Recognise vital sign and weight changes to report",
    "Support nutrition, fluids and special diets safely",
    "Explain the limits on medication help and other delegated tasks",
  ],
  skills: ["Vital signs", "Height and weight", "Intake and output", "Special diets", "Food safety", "Medication reminders"],
  quiz: {
    name: "HHA: Vital Signs, Nutrition and Tasks",
    slug: "hha-vital-signs-nutrition-and-tasks",
    description: "Vital signs, weight, nutrition, fluids, food safety and delegated tasks.",
    tags: ["home health aide", "healthcare", "vital signs", "nutrition"],
  },
  topics: [
    { key: "vitals", name: "Vital signs and measurements", description: "Temperature, pulse, respirations, blood pressure, pain, height and weight." },
    { key: "nutrition", name: "Nutrition and fluids", description: "Diets, feeding, fluids, food safety and meals." },
    { key: "tasks", name: "Delegated tasks", description: "Medication reminders, ostomy, enemas and oxygen." },
  ],
  modules: [
    {
      id: "vital-signs",
      title: "Vital Signs",
      lessons: [
        {
          id: "temperature-pulse-respirations",
          title: "Temperature, Pulse and Respirations",
          minutes: 8,
          blocks: [
            text(`
              ## Typical adult ranges (your agency's ranges apply)

              | Measure | Typical adult range |
              |---|---|
              | Temperature (oral) | about 97.6–99.6°F |
              | Pulse | 60–100 beats per minute |
              | Respirations | 12–20 breaths per minute |

              Report readings outside the ranges in the care plan, and any sudden change from the client's usual numbers.
            `),
            text(`
              ## Taking them

              - **Temperature**: oral, tympanic (ear), temporal (forehead) or axillary (armpit, usually lower). Wait about 15 minutes after the client eats, drinks or smokes before an oral reading.
              - **Radial pulse**: two fingers (not your thumb) on the thumb side of the wrist; count for 30 seconds and multiply by 2, or a full minute if irregular. Note rhythm and strength.
              - **Respirations**: count right after the pulse while your fingers stay on the wrist, so the client doesn't change their breathing. One rise and fall = one breath.
            `),
            tip("Write down readings right away. Don't rely on memory."),
            check("Why count respirations while your fingers are still on the wrist?", ["To save batteries", "So the client doesn't change their breathing because they know you're watching", "It's more accurate for pulse", "It warms your hands"], 1, "People often change their breathing when they know it's being counted."),
          ],
        },
        {
          id: "blood-pressure-pain",
          title: "Blood Pressure, Pain, Height and Weight",
          minutes: 8,
          blocks: [
            text(`
              ## Blood pressure

              Written as **systolic/diastolic** (for example 118/76 mm Hg). For adults, under 120/80 is considered normal; the plan of care tells you which readings to report.

              - Client seated, feet flat, arm supported at heart level, resting for 5 minutes.
              - Use the right cuff size on bare skin; not on an arm with an IV, dialysis access, injury, or on the side of a mastectomy.
              - Many agencies use automatic cuffs; manual readings need training with a stethoscope.
            `),
            text(`
              ## Pain

              Pain is whatever the client says it is. Ask them to rate it from **0 to 10**, or use a faces scale. Watch for non-verbal signs (grimacing, guarding, moaning, restlessness) in clients who can't tell you.

              ## Height and weight

              Weigh at the **same time of day, on the same scale, in similar clothing**, ideally before breakfast after urinating. Report sudden gains: for clients with heart failure, a gain of 2–3 pounds in a day or about 5 pounds in a week is a common reporting rule.
            `),
            tip("A weight gain in heart failure often means fluid build-up, even before the client feels short of breath."),
            check("Which arm should NOT be used for a blood pressure reading?", ["An arm resting at heart level", "The arm on the side of a mastectomy", "The client's preferred arm", "A bare arm"], 1, "Avoid the side of a mastectomy, dialysis access, IV or injury."),
          ],
        },
      ],
    },
    {
      id: "nutrition",
      title: "Nutrition and Meals",
      lessons: [
        {
          id: "diets-and-fluids",
          title: "Special Diets and Fluids",
          minutes: 7,
          blocks: [
            text(`
              ## Common diets

              - **Low sodium (salt)**: for high blood pressure and heart failure; avoid canned soups, deli meats, chips.
              - **Diabetic / carbohydrate-controlled**: regular meal times, balanced carbohydrates; watch for low blood sugar (shaky, sweaty, confused).
              - **Mechanical soft or pureed**, and **thickened liquids**: for chewing or swallowing problems.
              - **Fluid restriction**: for some heart and kidney conditions; follow the exact amount.
            `),
            text(`
              ## Fluids and intake and output

              Older adults may not feel thirsty. Unless fluids are restricted, offer drinks often. Signs of dehydration: dark urine, dry mouth, dizziness, confusion.

              Some clients need **intake and output (I&O)** recorded in millilitres. **1 ounce = 30 mL**, so an 8-oz cup is 240 mL.
            `),
            tip("Following a special diet is part of the plan of care. Don't swap foods because the client or family asks; tell the nurse."),
            check("How many millilitres are in an 8-ounce cup?", ["80 mL", "120 mL", "240 mL", "800 mL"], 2, "1 oz = 30 mL, so 8 oz = 240 mL."),
          ],
        },
        {
          id: "feeding-food-safety",
          title: "Safe Feeding and Food Safety",
          minutes: 7,
          blocks: [
            text(`
              ## Helping a client eat

              Seat the client upright (at least 90° if possible) and keep them upright for about 30 minutes after meals. Offer small bites, let them chew and swallow, and use adaptive utensils if provided. Sit at eye level and don't rush.

              Signs of swallowing problems: coughing or choking while eating, a wet or gurgly voice, food left in the mouth. Report them right away.
            `),
            text(`
              ## Food safety and meals

              - Wash hands, surfaces and produce; keep raw meat apart from ready-to-eat foods.
              - Cook to safe temperatures (for example poultry 165°F) and refrigerate leftovers within 2 hours.
              - Keep the fridge at or below 40°F; check dates and throw out spoiled food (with the client's permission).
              - Plan meals and shopping lists with the client's diet, budget and preferences.
            `),
            tip("Ask about food allergies and cultural or religious food practices before you cook."),
            check("How long after a meal should a client with swallowing problems stay upright?", ["No time", "About 30 minutes", "5 minutes", "Until the next day"], 1, "Staying upright about 30 minutes reduces the risk of aspiration."),
          ],
        },
      ],
    },
    {
      id: "delegated-tasks",
      title: "Delegated Tasks",
      lessons: [
        {
          id: "medication-help",
          title: "Helping with Medications",
          minutes: 7,
          blocks: [
            text(`
              ## What aides may do

              In home care, aides generally may **remind** clients to take their own medications and help with self-administration as the plan allows: for example bringing the pill organiser, opening a container, or reading the label aloud. The rules differ in DC, Maryland and Virginia and by agency.

              Aides do **not**: decide doses, fill pill organisers (unless their state and agency allow it), give injections, or crush or split pills without a nurse's direction.
            `),
            text(`
              ## Watch and report

              Report missed doses, a client taking the wrong pills, side effects (dizziness, rash, nausea, falls, confusion), or medications that are running out. Never give a client medication that belongs to someone else.
            `),
            tip("Medication aides (such as DC's trained medication employees, Maryland's medication technicians or Virginia's registered medication aides) have separate training and certification. A home health aide certificate alone doesn't allow medication administration."),
            check("Which is generally within a home health aide's role?", ["Choosing the client's dose", "Reminding the client to take their own medication", "Giving an insulin injection", "Taking pills from the neighbour's bottle"], 1, "Aides may remind and assist with self-administration as the plan allows."),
          ],
        },
        {
          id: "ostomy-enema-oxygen",
          title: "Ostomy, Enemas and Oxygen Equipment",
          minutes: 7,
          blocks: [
            text(`
              ## Ostomy care

              An **ostomy** is a surgical opening (stoma) on the abdomen for stool (colostomy, ileostomy) or urine (urostomy). Where trained and assigned, aides empty and change the pouch, clean the skin around the stoma with warm water, and report a stoma that is dark, purple or black, bleeding, or skin that is red and sore. A healthy stoma is pink or red and moist.

              ## Enemas

              Some DMV curricula (for example DC's) include giving a cleansing enema when delegated. The client is usually in **Sims' position** (left side, top knee bent). Stop if the client has pain or the fluid won't flow, and report.
            `),
            text(`
              ## Oxygen equipment

              Aides may help keep the nasal cannula or mask in place, check for skin irritation behind the ears and nose, keep tubing untangled, and make sure the concentrator or tank is working, but **never change the flow rate**.
            `),
            tip("Only do these tasks after you've been trained, checked off by a nurse and assigned them in the plan of care."),
            check("What colour is a healthy stoma?", ["Black", "Pink or red and moist", "Grey and dry", "White"], 1, "A dark, purple or black stoma is an emergency to report."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("vitals", "easy", "What is a typical adult pulse range?", ["20–40", "60–100", "110–140", "150–200"], 1, "60–100 beats per minute."),
    mc("vitals", "easy", "What is a typical adult respiration rate?", ["4–8", "12–20", "30–40", "50–60"], 1, "12–20 breaths per minute."),
    num("vitals", "medium", "You count 38 pulse beats in 30 seconds. What is the pulse per minute?", 76, 0, "38 × 2 = 76 beats per minute."),
    mc("vitals", "medium", "Where is the radial pulse taken?", ["The neck", "The thumb side of the wrist", "The ankle", "The elbow"], 1, "The radial artery is on the thumb side of the wrist."),
    tf("vitals", "easy", "You should use your thumb to take a pulse.", false, "Your thumb has its own pulse; use two fingers."),
    mc("vitals", "medium", "In 130/84 mm Hg, what is 130?", ["Diastolic pressure", "Systolic pressure", "Pulse", "Temperature"], 1, "The top number is systolic."),
    mc("vitals", "medium", "How long should you wait to take an oral temperature after the client drinks something hot?", ["No wait", "About 15 minutes", "2 hours", "A day"], 1, "Wait about 15 minutes after eating, drinking or smoking."),
    mc("vitals", "hard", "A client with heart failure gained 3 pounds since yesterday. What should you do?", ["Nothing", "Report it to your supervisor", "Give extra fluids", "Weigh again next week"], 1, "Sudden weight gain can mean fluid build-up and needs reporting."),
    ms("vitals", "medium", "Which help get an accurate weight? Select all that apply.", ["Same scale", "Same time of day", "Similar clothing", "Different scales each day"], [0, 1, 2], "Consistency makes changes meaningful."),
    mc("nutrition", "easy", "Which foods are high in sodium?", ["Fresh apples", "Canned soup and deli meats", "Plain rice", "Fresh vegetables"], 1, "Processed foods like canned soups and deli meats are high in salt."),
    num("nutrition", "medium", "A client drank 6 ounces of juice. How many millilitres is that?", 180, 0, "6 × 30 mL = 180 mL."),
    ms("nutrition", "medium", "Which can be signs of dehydration? Select all that apply.", ["Dark urine", "Dry mouth", "Confusion", "Pale, plentiful urine"], [0, 1, 2], "Dark urine, dry mouth and confusion suggest dehydration."),
    mc("nutrition", "medium", "A client coughs every time they swallow water. What should you do?", ["Give water faster", "Stop and report it to the nurse", "Lay them flat", "Ignore it"], 1, "Coughing while swallowing can signal a swallowing problem and aspiration risk."),
    mc("nutrition", "medium", "At what temperature or below should a refrigerator be kept?", ["40°F", "50°F", "60°F", "70°F"], 0, "Keep the fridge at or below 40°F."),
    tf("nutrition", "medium", "If the family asks, the aide may change the client's special diet.", false, "Diet changes go through the nurse and plan of care."),
    mc("nutrition", "hard", "A client with diabetes becomes shaky, sweaty and confused before lunch. What might this be?", ["High blood pressure", "Low blood sugar", "A cold", "Normal hunger"], 1, "These are signs of low blood sugar; follow the care plan and report immediately."),
    mc("tasks", "easy", "Which medication task do home health aides generally do?", ["Prescribe", "Remind the client to take their own medication", "Give injections", "Change doses"], 1, "Reminders and help with self-administration as the plan allows."),
    tf("tasks", "medium", "An aide may crush a client's pills whenever the client finds them hard to swallow.", false, "Some pills must not be crushed; only with a nurse's direction."),
    mc("tasks", "medium", "Which stoma finding needs to be reported right away?", ["Pink and moist", "Dark purple or black", "Red and moist", "Slightly shiny"], 1, "A dark or black stoma may have lost its blood supply."),
    mc("tasks", "medium", "Which position is usually used for an enema?", ["Prone", "Fowler's", "Sims' (left side, top knee bent)", "Standing"], 2, "Sims' position follows the natural curve of the colon."),
    ms("tasks", "medium", "Which oxygen tasks may an aide do? Select all that apply.", ["Check skin behind the ears for irritation", "Keep tubing untangled", "Check that the equipment is working", "Change the flow rate"], [0, 1, 2], "Aides never change the flow rate."),
    ord("tasks", "hard", "Put these in order before an aide performs a delegated task.", ["Complete training on the task", "Be checked off by a nurse", "Have the task assigned in the plan of care", "Perform it and document"], "Train, be checked off, be assigned, then perform and document."),
  ],
};
