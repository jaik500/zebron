import { check, mc, ms, num, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 5,
  id: "cna-measurements-elimination-and-mobility",
  title: "Measurements, Elimination and Restorative Care",
  summary: "Course 5 of 6 in the Zebron CNA Program. Measure and record vital signs, weight and urine output (NNAAP measurement skills), help with elimination, and give restorative care: positioning, range of motion, transfers, walking and elastic stockings.",
  description:
    "Every NNAAP skills evaluation includes a measurement skill, and much of a CNA's day is spent helping residents move. This course covers temperature, radial pulse, respirations and blood pressure; weight; intake and output, including measuring urine; bedpans, urinals, commodes and specimens; body mechanics; positioning a resident on their side; passive range of motion; transferring from bed to wheelchair and walking with a gait belt; and applying knee-high elastic stockings.\n\nEvery skill must be practised hands-on and checked in your approved training program. **This program is a study aid** and does not certify you.",
  level: "beginner",
  cover: "violet",
  outcomes: [
    "Measure and record vital signs, weight and urine output accurately",
    "Help residents with elimination and collect specimens",
    "Position residents and perform passive range of motion safely",
    "Transfer and walk residents with a gait belt",
  ],
  skills: ["Vital signs", "Weight", "Intake and output", "Elimination", "Positioning", "Range of motion", "Transfers"],
  quiz: {
    name: "CNA: Measurements and Restorative Care",
    slug: "cna-measurements-elimination-and-mobility",
    description: "Vital signs, weight, intake and output, elimination, positioning, range of motion and transfers.",
    tags: ["cna", "nursing assistant", "healthcare", "vital signs", "nnaap"],
  },
  topics: [
    { key: "measurements", name: "Vital signs and measurements", description: "Temperature, pulse, respirations, blood pressure and weight." },
    { key: "elimination", name: "Intake, output and elimination", description: "I&O, urine output, bedpans and specimens." },
    { key: "restorative", name: "Restorative care and mobility", description: "Positioning, ROM, transfers, walking and stockings." },
  ],
  modules: [
    {
      id: "measurements",
      title: "Vital Signs and Weight",
      lessons: [
        {
          id: "tpr",
          title: "Temperature, Pulse and Respirations",
          minutes: 8,
          blocks: [
            text(`
              ## Typical adult ranges (follow the ranges your nurse gives you)

              | Measure | Typical range |
              |---|---|
              | Oral temperature | about 97.6–99.6°F |
              | Pulse | 60–100 beats per minute |
              | Respirations | 12–20 breaths per minute |
              | Blood pressure | under 120/80 mm Hg is considered normal |

              ## Radial pulse (an NNAAP measurement skill)

              Place **two or three fingertips** (not your thumb) on the thumb side of the inside wrist. Count for **one full minute** (on the skills test, count the full 60 seconds), and note rate, rhythm and strength. Record right away.

              ## Respirations (an NNAAP measurement skill)

              Keep your fingers on the wrist after counting the pulse so the resident doesn't know you're watching their breathing. One rise and fall of the chest is one breath. Count for one full minute and note depth, rhythm and any noise or effort.
            `),
            tip("On the skills test, your recorded count must fall within a small range of the evaluator's count. Practise counting a full minute until it's easy."),
            check("Why keep your fingers on the wrist while counting respirations?", ["To feel the breathing", "So the resident doesn't change their breathing", "It's more comfortable", "To warm the wrist"], 1, "People often change their breathing if they know it's being counted."),
          ],
        },
        {
          id: "blood-pressure-weight",
          title: "Blood Pressure and Weight",
          minutes: 8,
          blocks: [
            text(`
              ## Blood pressure

              The resident sits or lies with the **arm supported at heart level**, palm up, after resting. Use the right size cuff on a bare upper arm, about **1 inch above the elbow**, with the arrow over the brachial artery. Don't use an arm with an IV, a dialysis access, a cast or injury, or on the side of a mastectomy.

              **Manual method:** find the radial or brachial pulse, inflate until it disappears and then about 30 mm Hg more (or to the level your instructor teaches), place the stethoscope diaphragm over the brachial artery and deflate slowly (about 2–4 mm Hg per second). The **first** sound is the **systolic** reading; the point where the sound **disappears** is the **diastolic**. Record as systolic/diastolic, for example 124/78. Many facilities also use electronic machines.
            `),
            text(`
              ## Weight (an NNAAP measurement skill)

              Balance (zero) the scale first. The resident wears non-skid footwear, stands in the middle of the scale without holding on, and you read and record the weight. Weigh at the **same time of day, on the same scale, in similar clothing**. Report sudden changes, such as a gain of a few pounds in a day for a resident with heart failure, or steady loss.
            `),
            tip("Clean the stethoscope earpieces and diaphragm with alcohol wipes before and after use."),
            check("When taking a manual blood pressure, the first clear sound you hear is the…", ["Diastolic pressure", "Systolic pressure", "Pulse rate", "Respiratory rate"], 1, "The first sound is systolic; when sounds disappear, that's diastolic."),
          ],
        },
      ],
    },
    {
      id: "elimination",
      title: "Intake, Output and Elimination",
      lessons: [
        {
          id: "intake-output",
          title: "Intake and Output",
          minutes: 7,
          blocks: [
            text(`
              ## Intake

              Intake is everything the resident drinks plus foods that are liquid at room temperature (ice cream, gelatin, soup, ice chips). Record in millilitres: **1 ounce = 30 mL**. Many facilities list standard container sizes (for example a coffee cup or a carton of milk).

              ## Output and measuring urine (an NNAAP measurement skill)

              Output includes urine, liquid stool, vomit and drainage. With gloves on, pour the urine from the bedpan, urinal or catheter bag into a **graduate** (measuring container), place it on a **flat surface** and read it **at eye level**. Record the amount in mL, empty it into the toilet, rinse equipment, then remove gloves and clean your hands. Report urine that is dark, bloody, cloudy, foul-smelling or very low in amount.
            `),
            tip("Read the graduate at eye level on a flat surface. Holding it in the air gives an inaccurate reading."),
            check("How do you read the amount of urine in a graduate?", ["Hold it up to the light", "Place it on a flat surface and read at eye level", "Guess from the bag", "Read it from above"], 1, "A flat surface at eye level gives an accurate reading."),
          ],
        },
        {
          id: "toileting-specimens",
          title: "Toileting, Bedpans and Specimens",
          minutes: 7,
          blocks: [
            text(`
              ## Helping with toileting

              Offer the toilet regularly and answer requests quickly. Use the toilet or a bedside commode when the resident can get up; a bedpan or urinal in bed. For a **standard bedpan**, the wide rounded end goes under the buttocks; a **fracture pan** goes under with the flat, thin end toward the head. Raise the head of the bed to a sitting position if allowed, give privacy, toilet paper and the call light, and help with hand hygiene afterwards.

              Watch for constipation, diarrhoea, incontinence and pain, and report changes. Provide incontinence care promptly to protect skin.
            `),
            text(`
              ## Specimens

              Label every specimen container with the resident's name, room, date and time, and follow instructions. A **clean-catch (midstream) urine** specimen is collected after cleaning the perineal area and after the resident starts to urinate. Don't let the inside of the container or lid touch anything. Stool specimens shouldn't contain urine or toilet paper.
            `),
            tip("Always wear gloves for elimination care and specimen collection."),
            check("When collecting a clean-catch urine specimen, when is the sample taken?", ["The very first drops", "After the stream starts (midstream)", "From the toilet bowl", "From yesterday's bag"], 1, "Midstream urine is less likely to be contaminated."),
          ],
        },
      ],
    },
    {
      id: "restorative",
      title: "Restorative Care and Mobility",
      lessons: [
        {
          id: "positioning-rom",
          title: "Positioning and Range of Motion",
          minutes: 8,
          blocks: [
            text(`
              ## Body mechanics

              Wide base of support, bend at the knees and hips, keep your back straight, hold the load close, pivot your feet instead of twisting, and get help or use a mechanical lift when needed. Raise the bed to a working height.

              ## Positioning on the side (an NNAAP skill)

              Lower the head of the bed, move the resident toward you, raise the side rail if used and turn the resident toward the far side. Bend the top knee, place a pillow under the top leg and arm, a pillow or wedge behind the back, and make sure the resident isn't lying on their arm. Reposition bed-bound residents at least **every 2 hours**, or as the care plan says.
            `),
            text(`
              ## Passive range of motion

              Support the limb **above and below the joint**, move each joint **slowly, smoothly and gently** through its normal range, usually at least 3 times, and **stop if the resident has pain** (and report it). Examples: shoulder flexion and extension, abduction and adduction; knee flexion and extension; ankle dorsiflexion and plantar flexion. Don't force a joint.
            `),
            tip("Ask the resident to tell you if anything hurts, and watch their face during ROM."),
            check("During passive range of motion, the resident winces in pain. What do you do?", ["Continue more slowly", "Stop and report it to the nurse", "Move it faster", "Ignore it"], 1, "Never force a joint; stop and report pain."),
          ],
        },
        {
          id: "transfers-walking-stockings",
          title: "Transfers, Walking and Elastic Stockings",
          minutes: 8,
          blocks: [
            text(`
              ## Bed to wheelchair with a gait belt (an NNAAP skill)

              Place the wheelchair at the side of the bed, on the resident's **stronger side**, with **brakes locked** and footrests out of the way. Help the resident sit on the edge of the bed with non-skid footwear, feet flat, and check for dizziness. Apply the gait belt over clothing at the waist, snug enough that only your fingers fit under it. Count to three, stand with the resident, brace their knees if needed, pivot, and lower them into the chair. Position the feet on the footrests.

              ## Walking with a gait belt

              Stand slightly **behind and to the weaker side**, holding the belt with an underhand grip. Walk at the resident's pace and watch for dizziness or tiredness. If the resident starts to fall, ease them to the floor and protect the head.
            `),
            text(`
              ## Knee-high elastic stockings (an NNAAP skill)

              Apply while the resident is lying down, ideally before they get up. Turn the stocking inside out to the heel, slip it over the toes, foot and heel, then pull it up smoothly. Make sure there are **no wrinkles or twists** and the heel is in place. Stockings help prevent blood clots and swelling.
            `),
            tip("A cane is held on the stronger side. A walker moves first, then the resident steps into it."),
            check("Where should a wheelchair be placed for a bed-to-chair transfer?", ["On the resident's weaker side", "On the resident's stronger side, brakes locked", "At the foot of the bed, unlocked", "In the hallway"], 1, "Leading with the stronger side is safer; locked brakes keep the chair still."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("measurements", "easy", "What is a typical adult resting pulse?", ["30–50", "60–100", "100–140", "150–180"], 1, "60–100 beats per minute."),
    mc("measurements", "medium", "Which fingers should be used to take a radial pulse?", ["The thumb", "Two or three fingertips", "The whole hand", "The little finger only"], 1, "Your thumb has its own pulse."),
    num("measurements", "medium", "You count 9 breaths in 30 seconds. What is the respiratory rate per minute?", 18, 0, "9 × 2 = 18 breaths per minute (on the NNAAP test, count a full minute)."),
    mc("measurements", "medium", "When taking a manual blood pressure, the point where the sound disappears is the…", ["Systolic pressure", "Diastolic pressure", "Pulse", "Mean pressure"], 1, "The last sound marks the diastolic pressure."),
    mc("measurements", "medium", "Where should the arm be for a blood pressure measurement?", ["Above the head", "Supported at heart level", "Hanging down", "Behind the back"], 1, "At heart level for an accurate reading."),
    tf("measurements", "easy", "It's fine to take blood pressure on the arm on the side of a mastectomy.", false, "Avoid that arm, and arms with IVs, dialysis access or injuries."),
    ms("measurements", "medium", "Which give an accurate weight? Select all that apply.", ["Balancing the scale first", "Same time of day", "Similar clothing", "Letting the resident hold the rail"], [0, 1, 2], "The resident should stand without holding on."),
    mc("elimination", "easy", "How many millilitres are in 1 ounce?", ["10", "15", "30", "100"], 2, "1 ounce = 30 mL."),
    num("elimination", "medium", "A resident drank an 8-ounce cup of milk and 4 ounces of juice. How many mL is that?", 360, 0, "12 ounces × 30 mL = 360 mL."),
    mc("elimination", "medium", "Which counts as fluid intake?", ["Toast", "Ice cream", "Rice", "Chicken"], 1, "Foods that are liquid at room temperature count."),
    tf("elimination", "medium", "A graduate should be held at eye level in the air to read it.", false, "Place it on a flat surface and read at eye level."),
    mc("elimination", "medium", "How is a standard bedpan placed?", ["Wide rounded end under the buttocks", "Narrow end under the buttocks", "Upside down", "Under the back"], 0, "The wider rounded end goes under the buttocks."),
    mc("elimination", "medium", "What must be on every specimen label?", ["The CNA's phone number", "Resident's name, room, date and time", "Only the date", "Nothing"], 1, "Correct labelling prevents mix-ups."),
    mc("elimination", "hard", "Which urine finding should be reported?", ["Pale yellow and clear", "Dark, cloudy or bloody urine", "About 300 mL per void", "No odour"], 1, "Dark, cloudy or bloody urine can signal dehydration, infection or bleeding."),
    mc("restorative", "easy", "How often should bed-bound residents usually be repositioned?", ["Every 8 hours", "At least every 2 hours (or per the care plan)", "Once a day", "When they ask"], 1, "At least every 2 hours to prevent pressure injuries."),
    mc("restorative", "medium", "During passive ROM, how should you support the limb?", ["By the fingers only", "Above and below the joint", "Not at all", "By pulling"], 1, "Supporting above and below protects the joint."),
    ord("restorative", "medium", "Put the start of a bed-to-wheelchair transfer in order.", ["Place the wheelchair on the stronger side and lock the brakes", "Help the resident sit on the edge of the bed with footwear on", "Apply the gait belt", "Count and help the resident stand and pivot"], "Chair ready, sit up, belt on, then stand and pivot."),
    mc("restorative", "medium", "When walking with a resident, where should the CNA stand?", ["In front", "Slightly behind and on the weaker side", "On the stronger side only", "Far behind"], 1, "Behind on the weaker side lets you support a fall."),
    tf("restorative", "medium", "Elastic stockings are best applied after the resident has been standing for a while.", false, "Apply while lying down, before legs swell."),
    mc("restorative", "medium", "How tight should a gait belt be?", ["Loose enough to slip", "Snug, with only your fingers fitting underneath", "As tight as possible", "Over bare skin"], 1, "Snug over clothing, with room for your fingers."),
    ms("restorative", "hard", "Which are good body mechanics? Select all that apply.", ["Wide base of support", "Bending at the knees", "Pivoting your feet", "Twisting at the waist"], [0, 1, 2], "Twisting injures the back."),
  ],
};
