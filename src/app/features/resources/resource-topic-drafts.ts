import type { ResourceTopicLink } from './resource-needs';

/**
 * Drafted content for the "Search by Category" topics, for Maryland, DC and
 * Virginia (checked November 2026). Loaded with the topics in Admin → Topics
 * and editable there. Programs and links change: review them each year.
 */
export interface TopicDraftContent {
  intro: string;
  tips: string[];
  links: ResourceTopicLink[];
}

const call211 = { label: 'Call 211 (24/7)', url: 'tel:211' };
const md211 = { label: '211 Maryland', url: 'https://211md.org' };
const dc211 = { label: 'DC 211 Warmline', url: 'https://211warmline.dc.gov' };
const va211 = { label: '211 Virginia', url: 'https://211virginia.org' };
const mdBenefits = { label: 'Apply in Maryland (myMDTHINK)', url: 'https://mymdthink.maryland.gov' };
const dcBenefits = { label: 'Apply in DC (District Direct)', url: 'https://districtdirect.dc.gov' };
const vaBenefits = { label: 'Apply in Virginia (CommonHelp)', url: 'https://commonhelp.virginia.gov' };

export const TOPIC_DRAFTS: Record<string, TopicDraftContent> = {
  food: {
    intro:
      'Food pantries and free meal programs give groceries or hot meals at no cost, and most do not ask for ID or proof of income. ' +
      'SNAP (food stamps) adds money for groceries every month; many immigrants and working families qualify. You can apply online in Maryland, DC or Virginia.',
    tips: [
      'Call or check hours before you go: pantry days change, especially around holidays.',
      'Bring bags or a cart. Some pantries ask for proof of address, but many do not.',
      'Ask the pantry if they can help you apply for SNAP or WIC on the spot.',
      'Children can usually get free school meals; ask your school about the free meal program.',
    ],
    links: [
      { label: 'Find food near you (Capital Area Food Bank)', url: 'https://www.capitalareafoodbank.org/find-food-assistance/' },
      { label: 'Maryland Food Bank', url: 'https://mdfoodbank.org' },
      mdBenefits,
      dcBenefits,
      vaBenefits,
      call211,
    ],
  },
  housing: {
    intro:
      'Help with housing includes emergency shelter, help paying rent or a deposit, eviction prevention and longer-term affordable housing. ' +
      'Wait lists for housing vouchers are long, so it helps to apply early and to ask about emergency rent help at the same time.',
    tips: [
      'If you have an eviction notice, get help right away: free legal help can often stop or delay an eviction.',
      'Keep copies of your lease, rent receipts and any notices from your landlord.',
      'For shelter tonight, call 211; they know which shelters have space.',
      'Never pay anyone to get on a housing wait list: applying is free.',
    ],
    links: [
      { label: 'HUD: rental help', url: 'https://www.hud.gov/topics/rental_assistance' },
      { label: 'DC Housing Authority', url: 'https://www.dchousing.org' },
      { label: 'Maryland housing programs (DHCD)', url: 'https://dhcd.maryland.gov' },
      { label: 'Virginia Housing', url: 'https://www.virginiahousing.com' },
      call211,
    ],
  },
  'mental-health': {
    intro:
      'Counseling, therapy and support groups can help with stress, anxiety, depression, grief and trauma, including the stress of moving to a new country. ' +
      'Many clinics charge on a sliding scale or accept Medicaid, and some offer services in languages other than English.',
    tips: [
      'If you or someone else is in crisis, call or text 988 any time. In danger right now, call 911.',
      'Ask whether the clinic sees people without insurance and whether fees depend on income.',
      'Ask for a counselor who speaks your language, or for a free interpreter.',
    ],
    links: [
      { label: 'Call or text 988', url: 'tel:988' },
      { label: '988 Lifeline (chat)', url: 'https://988lifeline.org' },
      { label: 'Find treatment (FindTreatment.gov)', url: 'https://findtreatment.gov' },
      md211,
    ],
  },
  health: {
    intro:
      'Community health centers give medical, dental and sometimes vision care, and charge based on what you can pay. ' +
      'Medicaid and low-cost health insurance are available in Maryland, DC and Virginia; children and pregnant women often qualify even when parents do not.',
    tips: [
      'In an emergency, call 911 or go to the nearest emergency room: hospitals must treat you.',
      'Bring an ID and a list of the medicines you take.',
      'Ask about the sliding-scale fee if you do not have insurance.',
      'You can apply for Medicaid any time of year.',
    ],
    links: [
      { label: 'Find a health center (HRSA)', url: 'https://findahealthcenter.hrsa.gov' },
      { label: 'Maryland Health Connection', url: 'https://www.marylandhealthconnection.gov' },
      { label: 'DC Health Link', url: 'https://www.dchealthlink.com' },
      { label: 'Cover Virginia (Medicaid)', url: 'https://coverva.dmas.virginia.gov' },
      { label: 'HealthCare.gov', url: 'https://www.healthcare.gov' },
    ],
  },
  crisis: {
    intro:
      'If you are in danger or in crisis, help is available right now, 24 hours a day, for free. ' +
      'These lines are confidential and have interpreters. You do not need insurance or papers to call.',
    tips: [
      'In immediate danger, call 911.',
      'For a mental health or suicide crisis, call or text 988.',
      'If someone at home is hurting you, the domestic violence hotline can help you plan to stay safe.',
    ],
    links: [
      { label: 'Emergency: 911', url: 'tel:911' },
      { label: 'Suicide and crisis: 988', url: 'tel:988' },
      { label: 'Domestic violence hotline: 1-800-799-7233', url: 'tel:18007997233' },
      { label: 'Sexual assault hotline (RAINN): 1-800-656-4673', url: 'tel:18006564673' },
      call211,
    ],
  },
  substance: {
    intro:
      'Treatment for alcohol and drug use works, and recovery is possible. Options include counseling, medication, outpatient programs and residential care. ' +
      'Many programs are free or low cost and confidential.',
    tips: [
      'The SAMHSA helpline is free, confidential and open 24/7, in English and Spanish.',
      'Ask about medication for opioid use (buprenorphine or methadone): it greatly lowers the risk of overdose.',
      'Carry naloxone (Narcan) if you or someone you know uses opioids; pharmacies sell it without a prescription.',
    ],
    links: [
      { label: 'SAMHSA helpline: 1-800-662-4357', url: 'tel:18006624357' },
      { label: 'Find treatment (FindTreatment.gov)', url: 'https://findtreatment.gov' },
      { label: 'Call or text 988', url: 'tel:988' },
    ],
  },
  jobs: {
    intro:
      'American Job Centers help for free with job search, resumes, interviews and training. They can also help you get credentials from another country recognized. ' +
      'Many training programs are paid for by WIOA grants if you qualify.',
    tips: [
      'Make a simple resume first, even a short one: job centers can help you improve it.',
      'Ask about free training (WIOA) for in-demand jobs such as IT, health care and trades.',
      'If you have a degree from another country, ask about credential evaluation.',
      'Browse open jobs on the Zebron job board.',
    ],
    links: [
      { label: 'Zebron job board', url: 'https://zebron.org/jobs' },
      { label: 'Maryland Workforce Exchange', url: 'https://mwejobs.maryland.gov' },
      { label: 'DC Networks (jobs)', url: 'https://www.dcnetworks.org' },
      { label: 'Virginia Workforce Connection', url: 'https://www.vawc.virginia.gov' },
      { label: 'CareerOneStop', url: 'https://www.careeronestop.org' },
    ],
  },
  bootcamps: { intro: '', tips: [], links: [] },
  education: {
    intro:
      'Free English (ESL) classes, GED and high school completion programs, and community colleges help adults keep learning at any age. ' +
      'Community colleges have low tuition for residents, and federal student aid can help pay for college.',
    tips: [
      'Ask about placement tests and class times that fit your work schedule.',
      'Fill in the FAFSA to see what grants you qualify for; many students pay nothing.',
      'Bring any school records or diplomas you have, even from another country.',
    ],
    links: [
      { label: 'Federal student aid (FAFSA)', url: 'https://studentaid.gov' },
      { label: 'GED', url: 'https://ged.com' },
      { label: 'Zebron free courses', url: 'https://zebron.org/courses' },
      md211,
    ],
  },
  legal: {
    intro:
      'Legal aid organizations give free legal help to people with low incomes for housing, family, benefits, work and consumer problems. ' +
      'For immigration, only use a licensed attorney or an accredited representative of a recognized organization: never a "notario".',
    tips: [
      'Call early: legal aid offices often have deadlines and wait lists.',
      'Keep copies of all papers, notices and court dates.',
      'Check that an immigration helper is on the Department of Justice list of accredited representatives.',
      'USCIS forms are free to download; do not pay for blank forms.',
    ],
    links: [
      { label: 'Maryland Legal Aid', url: 'https://www.mdlab.org' },
      { label: 'Legal Aid DC', url: 'https://www.legalaiddc.org' },
      { label: 'Virginia legal aid', url: 'https://www.valegalaid.org' },
      { label: 'USCIS', url: 'https://www.uscis.gov' },
      { label: 'Find legal aid (LSC)', url: 'https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help' },
    ],
  },
  money: {
    intro:
      'Programs can help with cash, emergency bills and taxes: TANF cash assistance, emergency assistance, free tax preparation and scholarships for school. ' +
      'Free tax help (VITA) can get you every credit you are owed, such as the Earned Income Tax Credit.',
    tips: [
      'Apply for several programs at once through your state benefits website.',
      'Use free tax preparation instead of paid services that take a fee from your refund.',
      'Be careful of anyone asking for money to "guarantee" a grant: real grants do not charge.',
    ],
    links: [
      mdBenefits,
      dcBenefits,
      vaBenefits,
      { label: 'Free tax help (IRS VITA)', url: 'https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers' },
      { label: 'Find benefits (USA.gov)', url: 'https://www.usa.gov/benefits' },
    ],
  },
  utilities: {
    intro:
      'Energy assistance (LIHEAP) helps pay heating, cooling and electric bills, and can help restore service that was cut off. ' +
      'Utility companies also offer payment plans and discounts.',
    tips: [
      'Apply before you get a shut-off notice; funds are limited and some programs close when money runs out.',
      'Have a recent utility bill, ID and proof of income ready.',
      'Call your utility company and ask about a payment plan or budget billing.',
    ],
    links: [
      { label: 'Maryland energy assistance (OHEP)', url: 'https://dhs.maryland.gov/office-of-home-energy-programs/' },
      { label: 'DC energy assistance (DOEE)', url: 'https://doee.dc.gov/energyassistance' },
      vaBenefits,
      call211,
    ],
  },
  'basic-needs': {
    intro:
      'Community groups give free clothing, diapers, hygiene items, furniture and household goods. ' +
      'Diaper banks work through local partners such as clinics and family centers.',
    tips: [
      'Call first to ask what they have in stock and whether you need a referral.',
      'Ask your child\'s clinic or WIC office about free diapers.',
    ],
    links: [
      { label: 'Find a diaper bank', url: 'https://nationaldiaperbanknetwork.org' },
      call211,
      md211,
      va211,
    ],
  },
  transportation: {
    intro:
      'Public transit, reduced fares and free rides to medical appointments can help you get to work, school and care. ' +
      'Medicaid covers rides to medical appointments if you have no other way to get there.',
    tips: [
      'Ask about reduced fares for people with low income, seniors and people with disabilities.',
      'Book Medicaid rides a few days ahead.',
    ],
    links: [
      { label: 'Metro (WMATA)', url: 'https://www.wmata.com' },
      { label: 'Maryland transit (MTA)', url: 'https://www.mta.maryland.gov' },
      call211,
    ],
  },
  families: {
    intro:
      'Help for families includes child care assistance, Head Start and pre-K, WIC food for pregnant women and young children, and parenting support. ' +
      'Many of these programs are free for families with low incomes.',
    tips: [
      'Apply for child care assistance before you start a job or school; approval takes time.',
      'WIC serves pregnant women and children under 5, including many immigrant families.',
    ],
    links: [
      { label: 'Find child care (ChildCare.gov)', url: 'https://childcare.gov' },
      { label: 'WIC (USDA)', url: 'https://www.fns.usda.gov/wic' },
      mdBenefits,
      dcBenefits,
      vaBenefits,
    ],
  },
  youth: {
    intro:
      'Programs for young people include after-school activities, mentoring, summer jobs, tutoring and support for teens who are struggling.',
    tips: [
      'Teens can call or text 988 for free, confidential support at any time.',
      'Ask your school counselor about summer jobs and mentoring programs.',
    ],
    links: [
      { label: 'Call or text 988', url: 'tel:988' },
      { label: 'Youth.gov', url: 'https://youth.gov' },
      call211,
    ],
  },
  'older-adults': {
    intro:
      'Older adults can get help with benefits, meals, in-home care, transportation and caregiver support through local aging offices.',
    tips: [
      'The Eldercare Locator connects you to your local office on aging.',
      'Ask about Meals on Wheels and senior center programs.',
      'Check Medicare and Social Security benefits once a year.',
    ],
    links: [
      { label: 'Eldercare Locator', url: 'https://eldercare.acl.gov' },
      { label: 'Maryland Department of Aging', url: 'https://aging.maryland.gov' },
      { label: 'DC Department of Aging and Community Living', url: 'https://dacl.dc.gov' },
      { label: 'Social Security', url: 'https://www.ssa.gov' },
    ],
  },
  business: {
    intro:
      'Small Business Development Centers and the SBA give free advice on starting a business, writing a plan, getting a loan and growing.',
    tips: [
      'Advising at Small Business Development Centers is free.',
      'Register your business with the state before you start selling.',
    ],
    links: [
      { label: 'SBA: local help', url: 'https://www.sba.gov/local-assistance' },
      { label: 'Maryland small business', url: 'https://gomdsmallbiz.maryland.gov' },
      { label: 'SBA', url: 'https://www.sba.gov' },
    ],
  },
  community: {
    intro:
      'Community centers, libraries and local groups run free workshops, classes, cultural events and volunteer activities. ' +
      'They are a good way to meet neighbors and learn about other help nearby.',
    tips: ['Public libraries offer free computers, Wi-Fi, classes and events.', 'Volunteering builds experience and references for jobs.'],
    links: [{ label: 'Volunteer opportunities', url: 'https://www.volunteermatch.org' }, call211],
  },
  government: {
    intro:
      'Government offices help with IDs and driver\'s licenses, Social Security, immigration papers and public benefits.',
    tips: [
      'Many offices need an appointment: book online before you go.',
      'Use official .gov websites; forms are free.',
    ],
    links: [
      { label: 'USA.gov', url: 'https://www.usa.gov' },
      { label: 'Maryland MVA', url: 'https://mva.maryland.gov' },
      { label: 'DC DMV', url: 'https://dmv.dc.gov' },
      { label: 'Virginia DMV', url: 'https://www.dmv.virginia.gov' },
      { label: 'Social Security', url: 'https://www.ssa.gov' },
    ],
  },
  reentry: {
    intro:
      'Support after incarceration includes help with IDs, housing, jobs, record expungement and reconnecting with family.',
    tips: [
      'Ask about expunging or shielding your record; it can open more jobs and housing.',
      'Many employers hire people with records: job centers know which ones.',
    ],
    links: [
      { label: 'DC Office on Returning Citizen Affairs', url: 'https://orca.dc.gov' },
      { label: 'Reentry help (CareerOneStop)', url: 'https://www.careeronestop.org' },
      call211,
    ],
  },
};
