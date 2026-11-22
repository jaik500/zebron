import { check, mc, ms, ord, text, tf, tip } from "../lib/program-helpers.mjs";

export default {
  order: 4,
  id: "cna-personal-care-skills",
  title: "Personal Care Skills and Bedmaking",
  summary: "Course 4 of 6 in the Zebron CNA Program. The steps behind common NNAAP personal care skills: bed bath, perineal and catheter care, mouth and denture care, nail and foot care, dressing, feeding, and making an occupied bed.",
  description:
    "This course walks through the personal care skills CNAs do every day and that commonly appear on the NNAAP skills evaluation: the opening and closing steps every skill shares, a modified bed bath, perineal care, catheter care, mouth care (including for unconscious residents) and denture care, fingernail and foot care, dressing a resident with a weak arm, feeding a resident who can't feed themselves, and making occupied and unoccupied beds.\n\nReading steps is not the same as practising them: every skill must be practised hands-on and checked in your approved training program. **This program is a study aid** and does not certify you.",
  level: "beginner",
  cover: "sunrise",
  outcomes: [
    "Use the same safe opening and closing steps for every skill",
    "Give a bed bath, perineal care and catheter care in the correct order",
    "Give mouth, denture, nail and foot care safely",
    "Dress, feed and make a bed for a resident while promoting dignity",
  ],
  skills: ["Bed bath", "Perineal care", "Catheter care", "Mouth and denture care", "Dressing", "Feeding", "Bedmaking"],
  quiz: {
    name: "CNA: Personal Care Skills",
    slug: "cna-personal-care-skills",
    description: "Opening and closing steps, bathing, perineal and catheter care, oral care, dressing, feeding and bedmaking.",
    tags: ["cna", "nursing assistant", "healthcare", "personal care", "nnaap"],
  },
  topics: [
    { key: "hygiene", name: "Bathing and perineal care", description: "Opening and closing steps, bed bath, perineal and catheter care." },
    { key: "grooming", name: "Oral care, grooming and dressing", description: "Mouth, denture, nail and foot care; dressing." },
    { key: "feeding-beds", name: "Feeding and bedmaking", description: "Assisting with meals and making beds." },
  ],
  modules: [
    {
      id: "hygiene",
      title: "Bathing and Perineal Care",
      lessons: [
        {
          id: "opening-closing",
          title: "Opening and Closing Steps",
          minutes: 6,
          blocks: [
            text(`
              ## Before every skill

              1. Knock and introduce yourself by name and title.
              2. Identify the resident (name band or the facility's method) and address them by name.
              3. Explain the procedure in simple words; speak clearly and face the resident.
              4. **Provide privacy**: close the door, pull the curtain, cover the resident.
              5. Perform **hand hygiene**; gather supplies.
              6. Raise the bed to a safe working height and lock the brakes, if needed.
            `),
            text(`
              ## After every skill

              1. Make the resident comfortable and in good body alignment.
              2. Lower the bed to the **lowest position**, brakes locked.
              3. Place the **call light within reach**.
              4. Remove and dispose of used supplies; open the curtain if the resident wishes.
              5. Perform **hand hygiene**.
              6. Report and document as required.
            `),
            tip("Learn these as one routine. Many candidates fail a skill because they forget the call light or a closing hand hygiene step."),
            check("Which is a closing step for every skill?", ["Raise the bed to its highest position", "Place the call light within reach", "Leave the curtain closed", "Skip hand hygiene if you wore gloves"], 1, "The call light keeps the resident able to call for help."),
          ],
        },
        {
          id: "bed-bath",
          title: "Bed Bath",
          minutes: 7,
          blocks: [
            text(`
              ## Getting ready

              Check water temperature with a bath thermometer (commonly 105–110°F, or your facility's range) or by having the resident check it, and change the water if it cools or gets dirty. Cover the resident with a bath blanket, exposing only the part you're washing.

              ## Order: clean to dirty

              1. **Eyes**: water only, no soap; wipe from **inner to outer corner**, using a different part of the washcloth for each eye.
              2. **Face, ears and neck**: soap only if the resident wants it.
              3. **Arms, hands and underarms**: wash from the hand toward the underarm, supporting the arm at the joints; rinse and pat dry.
              4. Chest and abdomen, then legs and feet, then back and buttocks, then perineal care with clean water and a clean washcloth.
            `),
            tip("Long, firm strokes from the far side of the body toward you, distal to proximal on the limbs, help circulation."),
            check("How are the eyes washed during a bed bath?", ["With soap, outer to inner corner", "With water only, inner to outer corner, a clean part of the cloth for each eye", "Last", "They aren't washed"], 1, "No soap; inner to outer corner prevents moving debris into the tear duct."),
          ],
        },
        {
          id: "perineal-catheter",
          title: "Perineal and Catheter Care",
          minutes: 7,
          blocks: [
            text(`
              ## Female perineal care

              Wear gloves and place a waterproof pad under the buttocks. Separate the labia and wash from **front to back** (urethra toward anus), using a **clean area of the washcloth for each stroke**. Rinse and pat dry the same way. Then turn the resident on her side and wash the rectal area front to back.

              ## Male perineal care

              Wash the tip of the penis in a circular motion from the urethra outward, then the shaft and scrotum. If uncircumcised, gently pull back the foreskin to clean and **always return it** to its normal position.
            `),
            text(`
              ## Indwelling catheter care

              With gloves on, hold the catheter near the meatus to avoid tugging. Clean at least **4 inches of tubing**, moving **away from the meatus**, one stroke per clean area of washcloth. Keep the drainage bag **below the level of the bladder** and off the floor, the tubing free of kinks, and the catheter secured to the thigh. Report blood, cloudy or foul-smelling urine, leaks or pain.
            `),
            tip("Never raise the drainage bag above the bladder, even when moving the resident. Clamp it only if the nurse tells you to."),
            check("How far along the catheter tubing should you clean?", ["Half an inch", "At least 4 inches, moving away from the meatus", "Only where it meets the bag", "Toward the body"], 1, "Clean about 4 inches away from the meatus to keep germs out of the bladder."),
          ],
        },
      ],
    },
    {
      id: "grooming-dressing",
      title: "Oral Care, Grooming and Dressing",
      lessons: [
        {
          id: "mouth-dentures",
          title: "Mouth and Denture Care",
          minutes: 7,
          blocks: [
            text(`
              ## Mouth care

              Raise the head of the bed so the resident is upright, protect the chest with a towel, brush all surfaces of the teeth and the tongue gently, offer water to rinse and an emesis basin to spit, and give lip moisturiser if wanted. Report sores, bleeding gums, loose teeth or a white coating.

              ## Unconscious residents

              Position the resident on their **side** with the head turned, to prevent **aspiration**. Use swabs or a soft toothbrush with very little liquid; never put your fingers in the mouth. Many facilities give mouth care to unconscious residents at least every 2 hours. Tell the resident what you're doing; they may hear you.
            `),
            text(`
              ## Denture care

              Line the sink with a towel and partly fill it with water to cushion a drop. Brush all surfaces of the denture with a denture brush and **cool or lukewarm water** (hot water can warp it). Store dentures in a **labelled denture cup** with cool water or solution, or reinsert them as the resident prefers, and give mouth care for the gums.
            `),
            tip("Dentures are expensive and personal. Always label the cup with the resident's name and room."),
            check("Why line the sink with a towel when cleaning dentures?", ["To keep it warm", "To cushion the denture if dropped", "To dry the brush", "It's not necessary"], 1, "A towel and water prevent breakage."),
          ],
        },
        {
          id: "nails-feet-dressing",
          title: "Nail and Foot Care and Dressing",
          minutes: 7,
          blocks: [
            text(`
              ## Fingernail and foot care

              Soak hands or feet in warm water (check temperature), clean under nails with an orange stick, file fingernails straight across with an emery board, and push back cuticles gently. Dry well, **especially between the toes**, and apply lotion to the feet but **not between the toes**. CNAs usually **do not cut toenails**, and don't cut nails of residents with **diabetes** or poor circulation.

              ## Dressing a resident with a weak arm

              Let the resident choose clothing. Remove clothing from the **strong side first**; put clothing on the **weak side first**. Gently guide the weak arm through the sleeve without pulling, support the joints, and finish with non-skid footwear. Check that clothes are straight and not twisted.
            `),
            tip("Weak side: last off, first on."),
            check("Where should lotion NOT be applied during foot care?", ["The heels", "The tops of the feet", "Between the toes", "The soles"], 2, "Moisture between the toes can cause skin breakdown and fungus."),
          ],
        },
      ],
    },
    {
      id: "feeding-beds",
      title: "Feeding and Bedmaking",
      lessons: [
        {
          id: "feeding",
          title: "Feeding a Resident",
          minutes: 7,
          blocks: [
            text(`
              ## Before the meal

              Offer toileting and hand hygiene, put in dentures, glasses and hearing aids. Position the resident **upright (about 75–90 degrees)**. Check the **diet card** against the tray and the resident's name; check food temperatures.

              ## While feeding

              **Sit at eye level** facing the resident. Tell them what's on the tray and ask what they'd like first. Offer small bites (about a third of a spoon), alternate food and fluids, give time to chew and swallow, and talk with the resident. Use napkins to protect clothing and wipe the mouth as needed.

              ## After the meal

              Keep the resident upright for at least 30 minutes, record the **percentage eaten** and fluids taken in mL, and report coughing, choking, pocketing food or a poor appetite.
            `),
            tip("If a resident coughs or chokes while eating, stop feeding and tell the nurse. They may need thickened liquids or a swallowing evaluation."),
            check("Where should you sit when feeding a resident?", ["Standing over them", "At eye level, facing them", "Behind them", "Across the room"], 1, "Sitting at eye level is respectful and helps you watch for swallowing problems."),
          ],
        },
        {
          id: "bedmaking",
          title: "Making Occupied and Unoccupied Beds",
          minutes: 7,
          blocks: [
            text(`
              ## Linen handling

              Carry clean linen away from your uniform, bring only what you need, and never put it on the floor. Roll soiled linen **dirty side in**, hold it away from your body, don't shake it, and place it straight into the hamper or bag.

              ## Occupied bed

              Lock the brakes, raise the bed, lower the head of the bed as tolerated, and raise the side rail on the far side if used. Turn the resident toward the far side, roll the soiled linen toward the resident's back, place the clean bottom sheet and fanfold it under the soiled linen, then turn the resident over the rolled linen to the clean side. Remove the soiled linen, pull the clean sheet through and tighten it so there are **no wrinkles**. Change the pillowcase, cover with the top sheet and blanket, and leave room for toes.
            `),
            tip("Wrinkles and crumbs in a bed cause pressure injuries. Smooth and tighten the bottom sheet every time."),
            check("How should soiled linen be handled?", ["Shake it out", "Roll it dirty side in and hold it away from your body", "Put it on the floor", "Carry it against your uniform"], 1, "Rolling and holding it away prevents spreading germs."),
          ],
        },
      ],
    },
  ],
  questions: [
    mc("hygiene", "easy", "Which step comes first in any resident care skill?", ["Raise the bed", "Knock and introduce yourself", "Put on gloves", "Lower the side rails"], 1, "Knock and introduce yourself, then identify the resident and explain."),
    mc("hygiene", "medium", "During a bed bath, what is washed last?", ["The face", "The arms", "The perineal area", "The chest"], 2, "Wash clean to dirty, with perineal care last."),
    mc("hygiene", "medium", "Why use a bath blanket?", ["To dry the resident", "To keep the resident warm and covered for privacy", "To protect the floor", "To wash the back"], 1, "Expose only the area being washed."),
    tf("hygiene", "easy", "Soap is used to wash a resident's eyes.", false, "Use water only for the eyes."),
    mc("hygiene", "medium", "For female perineal care, which direction do you wipe?", ["Back to front", "Front to back", "Side to side", "Any direction"], 1, "Front to back moves germs away from the urethra."),
    mc("hygiene", "medium", "Where should a urinary drainage bag be kept?", ["On the bed", "Below the bladder and off the floor", "On the floor", "Above the bladder"], 1, "Below the bladder prevents backflow; off the floor prevents contamination."),
    mc("hygiene", "hard", "After cleaning an uncircumcised male resident, what must you do?", ["Leave the foreskin retracted", "Return the foreskin to its normal position", "Apply powder", "Report it as abnormal"], 1, "A retracted foreskin can swell and cut off circulation."),
    ord("hygiene", "medium", "Put the closing steps in order.", ["Make the resident comfortable", "Lower the bed and lock the brakes", "Place the call light within reach", "Perform hand hygiene"], "Comfort, low bed, call light, then hand hygiene."),
    mc("grooming", "easy", "What temperature of water should be used to clean dentures?", ["Boiling", "Hot", "Cool or lukewarm", "Ice cold"], 2, "Hot water can warp dentures."),
    mc("grooming", "medium", "How should an unconscious resident be positioned for mouth care?", ["Flat on the back", "On the side with the head turned", "Sitting with head back", "Prone"], 1, "Side-lying lets fluid drain out and prevents aspiration."),
    tf("grooming", "medium", "CNAs routinely cut the toenails of residents with diabetes.", false, "Nail cutting for residents with diabetes or poor circulation is done by a nurse or podiatrist."),
    mc("grooming", "medium", "When dressing a resident with a weak right arm, which sleeve goes on first?", ["Left", "Right", "Either", "Neither"], 1, "Weak side first."),
    ms("grooming", "medium", "Which are correct for foot care? Select all that apply.", ["Check water temperature", "Dry well between the toes", "Apply lotion between the toes", "Report sores or colour changes"], [0, 1, 3], "Don't put lotion between the toes."),
    mc("grooming", "medium", "How should fingernails be filed?", ["In a deep curve", "Straight across", "Into points", "They should be bitten"], 1, "Filing straight across helps prevent ingrown nails and skin injury."),
    mc("grooming", "hard", "Which oral finding should be reported?", ["Pink gums", "Bleeding gums or sores", "Clean teeth", "Moist tongue"], 1, "Bleeding gums and sores need the nurse's attention."),
    mc("feeding-beds", "easy", "How should a resident be positioned for meals?", ["Lying flat", "Upright, about 75–90 degrees", "On the side", "Head lower than feet"], 1, "Upright positioning helps prevent choking and aspiration."),
    mc("feeding-beds", "medium", "What should you check before feeding a resident?", ["The TV schedule", "The diet card against the tray and the resident's name", "The weather", "Your phone"], 1, "Confirm the right diet for the right resident."),
    tf("feeding-beds", "medium", "When feeding, give large spoonfuls to finish the meal faster.", false, "Small bites (about a third of a spoon) are safer."),
    mc("feeding-beds", "medium", "A resident ate half of her lunch. What do you record?", ["10%", "25%", "50%", "100%"], 2, "Half is 50%."),
    mc("feeding-beds", "medium", "How should clean linen be carried?", ["Against your uniform", "Away from your uniform", "On the floor first", "Over your shoulder"], 1, "Keep clean linen away from your uniform."),
    ms("feeding-beds", "medium", "Which are correct when making an occupied bed? Select all that apply.", ["Lock the brakes", "Tighten the bottom sheet so there are no wrinkles", "Shake soiled linen to remove crumbs", "Leave room for the resident's toes"], [0, 1, 3], "Never shake soiled linen."),
    mc("feeding-beds", "hard", "During a meal, the resident coughs and her voice sounds wet. What should you do?", ["Give a big drink of water", "Stop feeding and tell the nurse", "Lay her flat", "Keep going faster"], 1, "These are signs of aspiration risk."),
  ],
};
