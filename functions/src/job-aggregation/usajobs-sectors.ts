/**
 * The kinds of USAJOBS listings Zebron imports.
 *
 * USAJOBS classifies every federal job by occupational series (a 4-digit
 * code, sent as JobCategory). IT, healthcare and finance jobs are found by
 * series; armed forces jobs are civilian jobs with the military
 * departments, found by agency. A listing is imported only when it falls
 * into at least one sector; it can be in several (an IT job with the Army
 * is both "it" and "armed-forces").
 *
 * Series codes: https://data.usajobs.gov/api/codelist/occupationalseries
 * Agency codes: https://data.usajobs.gov/api/codelist/agencysubelements
 */
export type JobSector = 'it' | 'healthcare' | 'armed-forces' | 'finance';

export interface JobSectorDefinition {
  key: JobSector;
  /** Shown as a tag on the listing. */
  label: string;
  /** Occupational series in this sector (searched with JobCategoryCode). */
  series: readonly string[];
}

export const JOB_SECTORS: readonly JobSectorDefinition[] = [
  {
    key: 'it',
    label: 'Information Technology',
    series: [
      '2210', // Information Technology Management (incl. cybersecurity)
      '1550', // Computer Science
      '0854', // Computer Engineering
      '0391', // Telecommunications
      '0332', // Computer Operation
      '0335', // Computer Clerk and Assistant
    ],
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    series: [
      '0180', // Psychology
      '0181', // Psychology Aid and Technician
      '0185', // Social Work
      '0601', // General Health Science
      '0602', // Medical Officer
      '0603', // Physician Assistant
      '0610', // Nurse
      '0620', // Practical Nurse
      '0621', // Nursing Assistant
      '0630', // Dietitian and Nutritionist
      '0631', // Occupational Therapist
      '0633', // Physical Therapist
      '0636', // Rehabilitation Therapy Assistant
      '0640', // Health Aid and Technician
      '0642', // Nuclear Medicine Technician
      '0644', // Medical Technologist
      '0645', // Medical Technician
      '0646', // Pathology Technician
      '0647', // Diagnostic Radiologic Technician
      '0649', // Medical Instrument Technician
      '0651', // Respiratory Therapist
      '0660', // Pharmacist
      '0661', // Pharmacy Technician
      '0662', // Optometrist
      '0665', // Speech Pathology and Audiology
      '0669', // Medical Records Administration
      '0670', // Health System Administration
      '0671', // Health System Specialist
      '0675', // Medical Records Technician
      '0679', // Medical Support Assistance
      '0680', // Dental Officer
      '0681', // Dental Assistant
      '0682', // Dental Hygiene
      '0685', // Public Health Program Specialist
    ],
  },
  {
    key: 'finance',
    label: 'Banking, Finance & Accounting',
    series: [
      '0501', // Financial Administration and Program
      '0503', // Financial Clerical and Technician
      '0505', // Financial Management
      '0510', // Accounting
      '0511', // Auditing
      '0525', // Accounting Technician
      '0526', // Tax Specialist
      '0530', // Cash Processing
      '0540', // Voucher Examining
      '0544', // Civilian Pay
      '0545', // Military Pay
      '0560', // Budget Analysis
      '0561', // Budget Clerical and Assistance
      '0570', // Financial Institution Examining (bank examiners)
      '0580', // Credit Union Examiner
      '0592', // Tax Examining
      '1160', // Financial Analysis
      '1163', // Insurance Examining
      '1165', // Loan Specialist
    ],
  },
  {
    key: 'armed-forces',
    label: 'Armed Forces',
    series: [],
  },
];

/**
 * Military departments (searched with Organization): Defense, Army, Navy,
 * Air Force, Marine Corps, Army and Air National Guard, Coast Guard.
 */
export const ARMED_FORCES_AGENCIES: readonly string[] = ['DD', 'AR', 'NV', 'AF', 'NV27', 'ARNG', 'AFNG', 'HSAC'];

/** Recognizes armed forces employers by name (the search above may miss sub-agencies). */
const ARMED_FORCES_NAME =
  /\b(department of defense|department of the army|department of the navy|department of the air force|u\.?s\.? army|u\.?s\.? navy|naval|air force|marine corps|coast guard|national guard|defense (logistics|health|information|contract|finance))\b/i;

/** Every series Zebron imports (IT, healthcare and finance), for JobCategoryCode. */
export const IMPORTED_SERIES: readonly string[] = JOB_SECTORS.flatMap((sector) => sector.series);

/**
 * The sectors a listing belongs to.
 *
 * @param seriesCodes its JobCategory codes (occupational series)
 * @param employerNames its department and organization names
 */
export function sectorsOf(seriesCodes: readonly string[], employerNames: readonly string[]): JobSector[] {
  const sectors = new Set<JobSector>();
  for (const sector of JOB_SECTORS) {
    if (sector.series.some((code) => seriesCodes.includes(code))) {
      sectors.add(sector.key);
    }
  }
  if (employerNames.some((name) => ARMED_FORCES_NAME.test(name))) {
    sectors.add('armed-forces');
  }
  return JOB_SECTORS.map((sector) => sector.key).filter((key) => sectors.has(key));
}

export function sectorLabel(key: JobSector): string {
  return JOB_SECTORS.find((sector) => sector.key === key)?.label ?? key;
}
