import { check, mc, ms, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 4,
  id: "hha-personal-care-and-mobility",
  title: "Personal Care, Skin Care and Safe Mobility",
  summary: "Course 4 of 6 in the Zebron Home Health Aide Program. Help with bathing, grooming, dressing and toileting while promoting independence, prevent pressure injuries, and move clients safely with good body mechanics.",
  description:
    "Personal care is at the heart of the aide's work. This course covers bathing (including perineal and catheter care), grooming, mouth care, dressing and toileting; protecting the skin and preventing pressure injuries; and moving clients safely: body mechanics, positioning, range of motion, transfers, walking, and assistive devices.\n\nSkills such as bathing, transfers and positioning must be practised hands-on and checked by a registered nurse during your approved training. **This program is a study aid** and does not certify or license you.",
  level: "beginner",
  cover: "sunrise",
  outcomes: [
    "Give personal care that protects privacy and promotes independence",
    "Recognise early pressure injury signs and prevent them",
    "Use good body mechanics and safe transfer techniques",
    "Support walking, positioning and range of motion safely",
  ],
  skills: ["Bathing and grooming", "Perineal and catheter care", "Pressure injury prevention", "Body mechanics", "Transfers", "Range of motion"],
  quiz: {
    name: "HHA: Personal Care and Mobility",
    slug: "hha-personal-care-and-mobility",
    description: "Bathing, grooming, toileting, skin care, body mechanics, transfers and range of motion.",
    tags: ["home health aide", "healthcare", "personal care"],
  },
  topics: [
    { key: "personal-care", name: "Personal care", description: "Bathing, grooming, mouth care, dressing and toileting." },
    { key: "skin", name: "Skin care", description: "Pressure injuries and skin observation." },
    { key: "mobility", name: "Safe mobility", description: "Body mechanics, transfers, walking, positioning and range of motion." },
  ],
  modules: [
    {
      id: "personal-care",
      title: "Personal Care",
      lessons: [
        {
          id: "principles",
          title: "Principles of Personal Care",
          minutes: 6,
          blocks: [
            text(`
              ## Every procedure

              Before: clean your hands, introduce yourself, explain what you'll do, gather supplies, and provide privacy (close doors and curtains, cover the client).

              During: let the client do as much as they can (**promote independence**), offer choices ("blue shirt or green?"), keep them warm and covered, and watch for changes.

              After: make sure they're comfortable and safe, put items within reach, clean up, clean your hands and document.
            `),
            tip("Doing everything for a client is faster, but helping them do it themselves keeps their strength and dignity."),
            check("Why should you let a client do as much of their own care as they can?", ["It saves you work", "It maintains strength, skills and dignity", "It's required by the family", "It makes the visit shorter"], 1, "Promoting independence keeps abilities and self-esteem."),
          ],
        },
        {
          id: "bathing",
          title: "Bathing and Perineal Care",
          minutes: 8,
          blocks: [
            text(`
              ## Bathing

              Clients may take a shower, tub bath, or bed bath. Check water temperature with a thermometer or your wrist (comfortably warm, not hot; many agencies use about 105–110°F as a guide); people with diabetes or reduced feeling can be burned without noticing.

              For a bed bath, wash from **cleanest to dirtiest**: eyes (inner to outer corner, no soap), face, arms, chest, abdomen, legs, back, and perineal area last. Change the water when it cools or becomes soapy or dirty.
            `),
            text(`
              ## Perineal and catheter care

              Wear gloves. For women, wipe **front to back**; for men, clean the tip of the penis in a circular motion outward, retracting and returning the foreskin if uncircumcised. For a urinary catheter, clean the tubing **away from the body** for about 4 inches, keep the drainage bag **below the bladder** and off the floor, and keep the tubing free of kinks.
            `),
            tip("Shower chairs, hand-held showers and grab bars make bathing safer. Never leave a client alone in the tub."),
            check("When cleaning a urinary catheter, which direction do you wipe the tubing?", ["Toward the body", "Away from the body", "Back and forth", "It doesn't matter"], 1, "Wiping away from the body keeps germs out of the bladder."),
          ],
        },
        {
          id: "grooming-dressing-toileting",
          title: "Grooming, Dressing and Toileting",
          minutes: 7,
          blocks: [
            text(`
              ## Grooming and mouth care

              Help with hair, shaving (use an electric razor for clients on blood thinners), nail care (aides usually do not cut toenails of clients with diabetes or poor circulation) and mouth care. Clean dentures over a towel-lined sink in cool water and store them in a labelled cup.

              ## Dressing

              Dress the **weak or affected side first** and undress it last. Choose loose clothing with simple fasteners.
            `),
            text(`
              ## Toileting

              Offer the toilet, commode, bedpan or urinal regularly, give privacy and time, and help with hygiene. Note and report changes in urine (colour, amount, odour, blood) and bowel movements (constipation, diarrhoea, black or bloody stools). Handle incontinence matter-of-factly and change products promptly to protect skin.
            `),
            tip("Remember for dressing: weak side in first, out last."),
            check("A client has weakness on the left side after a stroke. Which arm goes into the shirt first?", ["Right", "Left", "Either", "Both at once"], 1, "Dress the weak side first so the strong side can manage last."),
          ],
        },
      ],
    },
    {
      id: "skin-care",
      title: "Skin Care",
      lessons: [
        {
          id: "pressure-injuries",
          title: "Preventing Pressure Injuries",
          minutes: 7,
          blocks: [
            text(`
              ## Who gets them

              Pressure injuries (bedsores) form where bone presses skin against a surface: heels, tailbone (sacrum), hips, elbows, shoulder blades, back of the head and ears. Risk is highest for clients who are immobile, incontinent, poorly nourished or dehydrated.

              ## Early signs

              Redness that doesn't fade when pressure is relieved, warmth, firmness, tenderness, blisters or open areas. On darker skin, look for colour changes (purple, blue or darker areas), warmth, or a different feel. Report any change right away.
            `),
            text(`
              ## Prevention

              - Reposition at least **every 2 hours** in bed (or as the care plan says), more often in a chair.
              - Keep skin clean and dry; change wet linens and briefs promptly.
              - Avoid friction and shearing: lift, don't drag, using a draw sheet.
              - Encourage fluids and food as allowed; keep linens smooth.
              - Don't massage reddened areas.
            `),
            tip("Check the skin during every bath and position change; heels are easy to miss."),
            check("Which is an early sign of a pressure injury?", ["Redness that doesn't fade after pressure is relieved", "Clean, dry skin", "A tan", "Warm hands"], 0, "Persistent redness or colour change is an early warning."),
          ],
        },
      ],
    },
    {
      id: "mobility",
      title: "Safe Mobility",
      lessons: [
        {
          id: "body-mechanics",
          title: "Body Mechanics",
          minutes: 6,
          blocks: [
            text(`
              ## Protect your back

              - Keep a **wide base of support** (feet shoulder-width apart).
              - **Bend your knees and hips**, not your waist; keep your back straight.
              - Hold loads **close to your body**.
              - **Pivot your feet**; don't twist your back.
              - Push or slide rather than lift when possible, and ask for help or use a lift when the client can't bear weight.
            `),
            tip("Raise the bed to waist height before care, then lower it again before you leave."),
            check("Which is good body mechanics?", ["Bending at the waist", "Twisting to reach", "Bending your knees and keeping the load close", "Lifting with arms extended"], 2, "Bending the knees and holding loads close uses the strong leg muscles."),
          ],
        },
        {
          id: "transfers-and-walking",
          title: "Transfers and Walking",
          minutes: 8,
          blocks: [
            text(`
              ## Bed to chair with a gait belt

              1. Explain the transfer; lock wheelchair and bed brakes; place the chair on the client's **strong side** at a slight angle.
              2. Help the client sit on the edge of the bed with feet flat; check for dizziness.
              3. Apply the **gait (transfer) belt** snugly over clothing, with room for your fingers.
              4. Count with the client ("1, 2, 3, stand"), grasp the belt with an underhand grip, brace their knees if needed and help them stand.
              5. Pivot to the chair; have them reach for the armrests and sit slowly.
            `),
            text(`
              ## Walking and devices

              Walk slightly behind and on the **weak side**, holding the gait belt. With a **cane**, the client holds it on the **strong side**. With a **walker**, the client moves the walker forward, then steps into it. Mechanical (Hoyer) lifts need training, the right sling and, per most agency policies, two people.
            `),
            tip("Never let a client hold onto your neck during a transfer."),
            check("Which hand should a client use for a cane?", ["The weak side", "The strong side", "Either", "Both"], 1, "The cane is held on the strong side to support the weak leg."),
          ],
        },
        {
          id: "positioning-rom",
          title: "Positioning and Range of Motion",
          minutes: 7,
          blocks: [
            text(`
              ## Positions

              - **Fowler's**: sitting up, head of bed 45–60°, for eating and breathing.
              - **Supine**: lying on the back.
              - **Lateral**: on the side, pillows behind the back and between knees.
              - **Sims'**: left side with the top knee bent, often used for enemas.
              - **Prone**: on the stomach (less common for older adults).

              Use pillows to keep the body aligned and to keep heels off the bed.
            `),
            text(`
              ## Range of motion (ROM)

              ROM exercises keep joints moving. **Active** ROM: the client does it; **passive**: you move the joint gently for them, as assigned. Support the joint, move slowly and smoothly, repeat as the plan says (often 3–5 times), and **stop if the client has pain**. Don't do ROM on the neck unless the plan specifically includes it.
            `),
            tip("Physical therapists often leave an exercise sheet. Follow it exactly and report how the client tolerated it."),
            check("While doing range of motion, the client says it hurts. What should you do?", ["Push a little further", "Stop and report it", "Do it faster", "Ignore it"], 1, "Never force a joint; stop and report pain."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("personal-care", "easy", "What should you do before any personal care procedure?", ["Clean your hands, explain and provide privacy", "Start right away", "Turn up the radio", "Ask the family to leave the house"], 0, "Hand hygiene, explanation and privacy come first."),
    mc("personal-care", "medium", "In a bed bath, which area is washed first?", ["Feet", "Eyes", "Perineal area", "Back"], 1, "Wash cleanest to dirtiest, starting with the eyes."),
    mc("personal-care", "medium", "How should a female client's perineal area be cleaned?", ["Back to front", "Front to back", "In circles", "Any direction"], 1, "Front to back prevents moving germs toward the urethra."),
    mc("personal-care", "medium", "Where should a urinary drainage bag hang?", ["Above the bladder", "Below the bladder, off the floor", "On the floor", "On the client's lap"], 1, "Below the bladder prevents backflow; off the floor prevents contamination."),
    tf("personal-care", "easy", "When dressing a client with a weak side, put clothing on the weak side first.", true, "Weak side in first, out last."),
    mc("personal-care", "hard", "Why use an electric razor for a client on blood thinners?", ["It's faster", "It lowers the risk of cuts and bleeding", "It's quieter", "It's required by Medicare"], 1, "Blood thinners make cuts bleed more."),
    ms("personal-care", "medium", "Which changes in elimination should you report? Select all that apply.", ["Blood in urine", "Black or bloody stools", "Constipation for several days", "Normal light-yellow urine"], [0, 1, 2], "Blood, black stools and constipation need reporting."),
    mc("personal-care", "medium", "How should dentures be cleaned?", ["In hot water over a bare sink", "In cool water over a towel-lined sink", "With bleach", "They don't need cleaning"], 1, "Cool water protects their shape; a towel prevents breakage."),
    mc("skin", "easy", "Which area is most at risk for a pressure injury?", ["The tailbone", "The forehead", "The palm", "The stomach"], 0, "Bony areas such as the sacrum (tailbone) and heels are high risk."),
    mc("skin", "medium", "How often should a bed-bound client usually be repositioned?", ["Once a day", "At least every 2 hours (or per the care plan)", "Every 8 hours", "Only when they ask"], 1, "Repositioning at least every 2 hours relieves pressure."),
    tf("skin", "medium", "You should massage reddened areas over bones to improve circulation.", false, "Massaging reddened areas can damage tissue further."),
    ms("skin", "medium", "Which help prevent pressure injuries? Select all that apply.", ["Keeping skin clean and dry", "Lifting rather than dragging", "Keeping linens smooth", "Leaving wet briefs until the next visit"], [0, 1, 2], "Moisture, friction and wrinkles all damage skin."),
    mc("skin", "hard", "On darker skin, an early pressure injury may look like…", ["Bright pink only", "A purple, bluish or darker area that may feel warm or firm", "No change ever", "A white spot"], 1, "On darker skin, look for colour change, warmth and firmness."),
    mc("mobility", "easy", "Which keeps your back safe when lifting?", ["Bending at the waist", "Bending your knees with a wide stance", "Twisting your spine", "Holding loads far from your body"], 1, "Use your legs and a wide base of support."),
    ord("mobility", "medium", "Put the start of a bed-to-chair transfer in order.", ["Explain and lock the brakes", "Help the client sit on the edge of the bed", "Apply the gait belt", "Count and help the client stand"], "Prepare, sit, belt, then stand on a count."),
    mc("mobility", "medium", "Where should the wheelchair be placed for a transfer?", ["On the client's weak side", "On the client's strong side", "Behind the client", "In another room"], 1, "Place the chair on the strong side so the client can lead with it."),
    mc("mobility", "medium", "When walking with a client, where should the aide stand?", ["In front", "Slightly behind on the weak side", "On the strong side", "Two steps ahead"], 1, "Stand slightly behind on the weak side, holding the gait belt."),
    mc("mobility", "medium", "Fowler's position means…", ["Lying flat", "Sitting up with the head of the bed raised about 45–60°", "Lying on the stomach", "Standing"], 1, "Fowler's position is semi-sitting, good for eating and breathing."),
    tf("mobility", "easy", "A client may hold onto the aide's neck during a transfer.", false, "This can injure the aide; use the gait belt and armrests."),
    mc("mobility", "medium", "Passive range of motion means…", ["The client exercises alone", "The aide gently moves the client's joints", "The client lifts weights", "No movement"], 1, "In passive ROM the aide moves the joint for the client."),
    mc("mobility", "hard", "Using a walker, the client should…", ["Step first, then move the walker", "Move the walker forward, then step into it", "Carry the walker", "Lean over the walker while walking fast"], 1, "Move the walker forward, then step into it."),
  ],
};
