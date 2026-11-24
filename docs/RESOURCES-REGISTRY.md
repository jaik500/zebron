# Resources registry

> **First version, built from the two DMV seed scripts on 23 November 2026, not read from Firestore.** It lists every listing those scripts create (batch 2 may not be loaded yet), shows them all as drafts, and does not include listings admins added by hand. Run `node scripts/export-resources-registry.mjs` to replace it with the live directory.

Normally generated from Firestore project `zebron-2b49f` by `node scripts/export-resources-registry.mjs`. Do not edit by hand: change the listings (seed scripts or Admin → Resources), or `scripts/resources-left-out.json`, and run the export again.

**75 listings**: 75 draft. 75 added by seed scripts, 0 by admins.

## Before adding resources

1. Run the export so this file is current, then search it for the provider's **name, website and phone**.
2. Check **Checked and left out** below: those were already researched and dropped, with the reason.
3. Put new listings in a new batch script (`scripts/seed-resources-<area>-<n>.mjs`) that calls `seedResources()` from `scripts/lib/seed-resources.mjs`. The engine skips a listing whose slug exists and **refuses** one whose name or website matches any listing in Firestore (whoever added it), unless `--allow-duplicates`. A shared phone number only prints a note, because one call centre often serves several programs.
4. After loading, run this export again and commit the updated registry.

## Listings by category

### Basic needs (2)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A Wider Circle | `a-wider-circle` | Organization | Washington, DC region | 301-608-3504 | awidercircle.org | 9159 Brookville Rd, Silver Spring, MD 20910 | draft | 2026-11-23 | seed script |
| Greater DC Diaper Bank | `greater-dc-diaper-bank` | Program | Washington, DC, Maryland and Virginia | 202-702-4001 | greaterdcdiaperbank.org | — | draft | 2026-11-23 | seed script |

### Business & Entrepreneurship (2)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Maryland Small Business Development Center (SBDC) | `maryland-sbdc` | Online tool | Maryland | — | marylandsbdc.org | Online | draft | 2026-11-23 | seed script |
| SCORE free business mentoring | `score-business-mentoring` | Online tool | Anywhere in the United States | — | score.org/find-mentor | Online | draft | 2026-11-23 | seed script |

### Child care and families (4)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DC Child Care Subsidy Program | `dc-child-care-subsidy-program` | Program | Washington, DC | 202-727-6436 | osse.dc.gov/childcaresubsidyfaq | Online | draft | 2026-11-23 | seed script |
| Fairfax County Child Care Assistance and Referral (CCAR) | `fairfax-child-care-assistance-and-referral` | Organization | Fairfax County, VA | 703-449-8484 | fairfaxcounty.gov/neighborhood-community-services/ccar/applying-for-child-care-assistance | 12011 Government Center Pkwy, 8th Floor, Fairfax, VA 22035 | draft | 2026-11-23 | seed script |
| Maryland Child Care Scholarship Program | `maryland-child-care-scholarship` | Program | Maryland | 877-227-0125 | earlychildhood.marylandpublicschools.org/node/620 | Online | draft | 2026-11-23 | seed script |
| Virginia Child Care Subsidy Program | `virginia-child-care-subsidy-program` | Program | Virginia | 1-855-635-4370 | childcare.virginia.gov/families/paying-for-child-care | Online | draft | 2026-11-23 | seed script |

### Crisis hotlines (4)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 988 Suicide & Crisis Lifeline | `988-suicide-crisis-lifeline` | Hotline | Anywhere in the United States | 988 | 988lifeline.org | — | draft | 2026-11-23 | seed script |
| DC Victim Hotline | `dc-victim-hotline` | Hotline | Washington, DC | 1-844-443-5732 | dcvictim.org | — | draft | 2026-11-23 | seed script |
| Montgomery County 24-Hour Crisis Center | `montgomery-county-crisis-center` | Organization | Montgomery County, MD | 240-777-4000 | montgomerycountymd.gov/HHS-Program/BHCS/CrisisCentermain.html | 1301 Piccard Dr, Rockville, MD 20850 | draft | 2026-11-23 | seed script |
| National Domestic Violence Hotline | `national-domestic-violence-hotline` | Hotline | Anywhere in the United States | 1-800-799-7233 | thehotline.org | — | draft | 2026-11-23 | seed script |

### Education & Language (2)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Carlos Rosario International Public Charter School | `carlos-rosario-school` | Program | Washington, DC (some programs open to MD and VA residents) | 202-797-4700 | carlosrosario.org | 1100 Harvard St NW, Washington, DC 20009 | draft | 2026-11-23 | seed script |
| English Empowerment Center | `english-empowerment-center` | Program | Northern Virginia | 703-237-0866 | englishempowermentcenter.org | 2855 Annandale Rd, Falls Church, VA 22042 | draft | 2026-11-23 | seed script |

### Employment (5)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Baltimore City American Job Center (MOED) | `baltimore-american-job-center` | Organization | Baltimore City, MD | 410-396-3009 | baltimorecity.gov/moed | 850 W North Ave, Baltimore, MD 21217 | draft | 2026-11-23 | seed script |
| DC American Job Center (DOES Headquarters) | `dc-american-job-center-headquarters` | Organization | Washington, DC | 202-724-2337 | does.dc.gov | 4058 Minnesota Ave NE, Washington, DC 20019 | draft | 2026-11-23 | seed script |
| Employ Prince George's: American Job Center Largo | `employ-prince-georges-largo` | Organization | Prince George's County, MD | 301-618-8425 | employpg.org | 1801 McCormick Dr, Suite 120, Largo, MD 20774 | draft | 2026-11-23 | seed script |
| Virginia Career Works: Fairfax Annandale Center | `virginia-career-works-annandale` | Organization | Northern Virginia | 703-533-5400 | fairfaxcounty.gov/familyservices/employment-and-training | 7611 Little River Turnpike, Suite 300W, Annandale, VA 22003 | draft | 2026-11-23 | seed script |
| WorkSource Montgomery: Wheaton American Job Center | `worksource-montgomery-wheaton` | Organization | Montgomery County, MD | 301-929-6880 | worksourcemontgomery.com | 11510 Georgia Ave, First Floor, Wheaton, MD 20902 | draft | 2026-11-23 | seed script |

### Food (9)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ALIVE! (Alexandria) | `alive-alexandria` | Program | City of Alexandria, VA | 703-837-9300 | alive-inc.org | — | draft | 2026-11-23 | seed script |
| Arlington Food Assistance Center (AFAC) | `arlington-food-assistance-center` | Organization | Arlington County, VA | 571-384-1448 | afac.org | 2708 S Nelson St, Arlington, VA 22206 | draft | 2026-11-23 | seed script |
| Capital Area Food Bank: Find Food and Hunger Lifeline | `capital-area-food-bank-find-food` | Online tool | DC, Montgomery and Prince George's counties (MD), Northern Virginia | 202-644-9807 | capitalareafoodbank.org/find-food-assistance | Online | draft | 2026-11-23 | seed script |
| DC WIC | `dc-wic` | Program | Washington, DC | 202-442-9397 | dchealth.dc.gov/service/special-supplemental-nutrition-program-women-infants-and-children-wic | — | draft | 2026-11-23 | seed script |
| Food for Others | `food-for-others-fairfax` | Organization | Northern Virginia | 703-207-9173 | foodforothers.org | 2938 Prosperity Ave, Fairfax, VA 22031 | draft | 2026-11-23 | seed script |
| Manna Food Center | `manna-food-center` | Organization | Montgomery County, MD | 301-424-1130 | mannafood.org | — | draft | 2026-11-23 | seed script |
| Maryland Food Bank: Find Food | `maryland-food-bank-find-food` | Online tool | Maryland, except Montgomery and Prince George's counties | — | mdfoodbank.org | Online | draft | 2026-11-23 | seed script |
| Maryland WIC | `maryland-wic` | Program | Maryland | 1-800-242-4942 | health.maryland.gov/phpa/wic/Pages/Home.aspx | — | draft | 2026-11-23 | seed script |
| Virginia WIC | `virginia-wic` | Program | Virginia | 1-888-942-3663 | vdh.virginia.gov/wic | — | draft | 2026-11-23 | seed script |

### Government and public services (3)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 211 Maryland | `211-maryland` | Hotline | Maryland | 211 | 211md.org | — | draft | 2026-11-23 | seed script |
| 211 Virginia | `211-virginia` | Hotline | Virginia | 211 | 211virginia.org | — | draft | 2026-11-23 | seed script |
| DC 211 Warmline | `dc-211-warmline` | Hotline | Washington, DC | 211 | 211warmline.dc.gov | — | draft | 2026-11-23 | seed script |

### Healthcare (10)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CCI Health Services (Silver Spring) | `cci-health-services-silver-spring` | Organization | Montgomery and Prince George's counties, MD | 240-650-0811 | cciweb.org | 8630 Fenton St, Suite 1200, Silver Spring, MD 20910 | draft | 2026-11-23 | seed script |
| Cover Virginia (Medicaid and FAMIS) | `cover-virginia` | Hotline | Virginia | 1-833-522-5582 | dmas.virginia.gov/for-applicants/applying-for-medicaid | — | draft | 2026-11-23 | seed script |
| DC Health Link (health insurance) | `dc-health-link` | Online tool | Washington, DC | 1-855-532-5465 | dchealthlink.com | Online | draft | 2026-11-23 | seed script |
| Health Care for the Homeless (Baltimore) | `health-care-for-the-homeless-baltimore` | Organization | Baltimore and Maryland | 410-837-5533 | hchmd.org | 421 Fallsway, Baltimore, MD 21202 | draft | 2026-11-23 | seed script |
| La Clínica del Pueblo (Hyattsville) | `la-clinica-del-pueblo-hyattsville` | Organization | Prince George's County, MD | 301-431-0901 | lcdp.org | 2970 Belcrest Center Dr, Suite 301, Hyattsville, MD 20782 | draft | 2026-11-23 | seed script |
| Lunera Health (formerly Greater Prince William Community Health Center) | `lunera-health-prince-william` | Organization | Prince William County, VA | 703-680-7950 | lunerahealth.org | 3350 Commission Ct, Woodbridge, VA 22192 | draft | 2026-11-23 | seed script |
| Mary's Center | `marys-center` | Organization | Washington, DC, Montgomery and Prince George's counties (MD) | 844-796-2797 | maryscenter.org | 2333 Ontario Rd NW, Washington, DC 20009 | draft | 2026-11-23 | seed script |
| Maryland Health Connection (Medicaid and health plans) | `maryland-health-connection` | Online tool | Maryland | 1-855-642-8572 | marylandhealthconnection.gov | Online | draft | 2026-11-23 | seed script |
| Neighborhood Health | `neighborhood-health-virginia` | Organization | Alexandria, Arlington and Fairfax County, VA | 703-535-5568 | neighborhoodhealthva.org | — | draft | 2026-11-23 | seed script |
| Unity Health Care | `unity-health-care` | Organization | Washington, DC | 202-469-4699 | unityhealthcare.org | — | draft | 2026-11-23 | seed script |

### Housing (6)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Alexandria Homeless Services Assessment Center (HSAC) | `alexandria-homeless-services-assessment-center` | Organization | City of Alexandria, VA | 703-746-5700 | alexandriava.gov | 4850 Mark Center Dr, 5th Floor, Alexandria, VA 22311 | draft | 2026-11-23 | seed script |
| Arlington Housing Crisis Hotline | `arlington-housing-crisis-hotline` | Hotline | Arlington County, VA | 703-228-1010 | arlingtonva.us/Government/Departments/DHS/Public-Assistance/Homelessness | — | draft | 2026-11-23 | seed script |
| Baltimore City Shelter Hotline | `baltimore-city-shelter-hotline` | Hotline | Baltimore City, MD | 443-984-9540 | baltimorecity.gov/homeless/shelter-resources-housing-assistance | — | draft | 2026-11-23 | seed script |
| DC Shelter Hotline | `dc-shelter-hotline` | Hotline | Washington, DC | 202-399-7093 | dhs.dc.gov/service/homeless-services | — | draft | 2026-11-23 | seed script |
| Housing Counseling Services | `housing-counseling-services-dc` | Organization | Washington, DC area | 202-667-7006 | housingetc.org | 2410 17th St NW, Suite 100, Washington, DC 20009 | draft | 2026-11-23 | seed script |
| Prince George's County Homeless Hotline | `prince-georges-homeless-hotline` | Hotline | Prince George's County, MD | 1-888-731-0999 | princegeorgescountymd.gov/1672/Emergency-Shelter | — | draft | 2026-11-23 | seed script |

### Immigration & Legal (4)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ayuda | `ayuda` | Program | Washington, DC, Maryland and Virginia | 202-387-4848 | ayuda.com | — | draft | 2026-11-23 | seed script |
| Legal Aid DC | `legal-aid-dc` | Organization | Washington, DC | 202-628-1161 | legalaiddc.org | 1331 H St NW, Suite 350, Washington, DC 20005 | draft | 2026-11-23 | seed script |
| Legal Services of Northern Virginia | `legal-services-northern-virginia` | Program | Northern Virginia | 703-778-6800 | lsnv.org | — | draft | 2026-11-23 | seed script |
| Maryland Legal Aid | `maryland-legal-aid` | Program | Maryland | 410-951-7750 | mdlab.org | — | draft | 2026-11-23 | seed script |

### Mental health (3)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DC Access HelpLine (Department of Behavioral Health) | `dc-access-helpline` | Hotline | Washington, DC | 1-888-793-4357 | dbh.dc.gov/service/access-helpline | — | draft | 2026-11-23 | seed script |
| EveryMind Montgomery County Hotline | `everymind-montgomery-hotline` | Hotline | Montgomery County, MD | 301-738-2255 | every-mind.org | — | draft | 2026-11-23 | seed script |
| Fairfax-Falls Church Community Services Board (CSB) | `fairfax-falls-church-csb` | Organization | Fairfax County, City of Fairfax and City of Falls Church, VA | 703-383-8500 | fairfaxcounty.gov/community-services-board | — | draft | 2026-11-23 | seed script |

### Money and taxes (5)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CASH Campaign of Maryland | `cash-campaign-of-maryland` | Program | Maryland | 410-528-8006 | cashmd.org | — | draft | 2026-11-23 | seed script |
| DC public benefits: SNAP, TANF and Medicaid (District Direct) | `dc-public-benefits-district-direct` | Online tool | Washington, DC | 202-727-5355 | dhs.dc.gov/page/apply-benefits | Online | draft | 2026-11-23 | seed script |
| IRS Free Tax Help (VITA and TCE) | `irs-vita-free-tax-help` | Online tool | Anywhere in the United States | 800-906-9887 | irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers | Online | draft | 2026-11-23 | seed script |
| Maryland benefits: SNAP, cash assistance and Medical Assistance | `maryland-benefits-snap-tca-medical-assistance` | Online tool | Maryland | 1-800-332-6347 | dhs.maryland.gov | Online | draft | 2026-11-23 | seed script |
| Virginia CommonHelp: SNAP, TANF, Medicaid and more | `virginia-commonhelp-benefits` | Online tool | Virginia | 1-855-635-4370 | dss.virginia.gov/relief/tanf/apply | Online | draft | 2026-11-23 | seed script |

### Older adults (3)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DC Department of Aging and Community Living (DACL) | `dc-department-of-aging-and-community-living` | Organization | Washington, DC | 202-724-5626 | dacl.dc.gov | 500 K St NE, Washington, DC 20002 | draft | 2026-11-23 | seed script |
| Fairfax Area Agency on Aging: Aging, Disability & Caregiver Resources Line | `fairfax-aging-disability-caregiver-line` | Hotline | Fairfax County, City of Fairfax and City of Falls Church, VA | 703-324-7948 | fairfaxcounty.gov/familyservices/older-adults | — | draft | 2026-11-23 | seed script |
| Maryland Access Point (Maryland Department of Aging) | `maryland-access-point` | Hotline | Maryland | 1-800-243-3425 | aging.maryland.gov/Pages/maryland-access-point.aspx | — | draft | 2026-11-23 | seed script |

### Re-entry (2)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DC Mayor's Office on Returning Citizen Affairs (MORCA) | `dc-mayors-office-returning-citizen-affairs` | Organization | Washington, DC | 202-715-7670 | communityaffairs.dc.gov/morca | 2100 Martin Luther King Jr Ave SE, Suite 100, Washington, DC 20020 | draft | 2026-11-23 | seed script |
| OAR (Offender Aid and Restoration) of Arlington | `oar-arlington` | Program | Arlington, Alexandria and Falls Church, VA | 703-745-5441 | oaronline.org | 1400 N Uhle St, Suite 704, Arlington, VA 22201 | draft | 2026-11-23 | seed script |

### Substance use (4)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CarePoint Response (formerly Baltimore Crisis Response) | `carepoint-response-baltimore` | Hotline | Baltimore City and Central Maryland | 410-433-5255 | bcresponse.org | — | draft | 2026-11-23 | seed script |
| Montgomery County Access to Behavioral Health Services | `montgomery-access-to-behavioral-health` | Hotline | Montgomery County, MD | 240-777-1770 | montgomerycountymd.gov/hhs-program/bhcs/bhcsaccbehavhealthsvcs-p239.html | 27 Courthouse Square, Suite 101, Rockville, MD 20850 | draft | 2026-11-23 | seed script |
| Prince George's County Local Behavioral Health Authority | `prince-georges-behavioral-health-authority` | Hotline | Prince George's County, MD | 301-856-9500 | princegeorgescountymd.gov/departments-offices/health/local-behavioral-health-authority-lbha | — | draft | 2026-11-23 | seed script |
| SAMHSA National Helpline | `samhsa-national-helpline` | Hotline | Anywhere in the United States | 1-800-662-4357 | samhsa.gov/find-help/helplines/national-helpline | — | draft | 2026-11-23 | seed script |

### Transportation (2)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Metro Lift reduced fares (SNAP) | `metro-lift-reduced-fares` | Online tool | Washington, DC, Maryland and Virginia | — | wmata.com/fares/Reduced-Fare-Programs/MetroLift | Online | draft | 2026-11-23 | seed script |
| MetroAccess paratransit | `metroaccess-paratransit` | Program | Washington, DC, Maryland and Virginia (Metro service area) | 202-962-2700 | wmata.com/ride/accessibility/metro-access/registering-for-metroaccess.html | 655 Virginia Ave SW, Washington, DC 20024 | draft | 2026-11-23 | seed script |

### Utility assistance (3)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DC Energy Assistance (LIHEAP and Utility Discount Program) | `dc-energy-assistance` | Program | Washington, DC | 202-535-2600 | doee.dc.gov/service/energy-assistance | — | draft | 2026-11-23 | seed script |
| Maryland Office of Home Energy Programs (OHEP) | `maryland-office-of-home-energy-programs` | Program | Maryland | 1-800-332-6347 | dhs.maryland.gov/office-of-home-energy-programs | — | draft | 2026-11-23 | seed script |
| Virginia Energy Assistance Program | `virginia-energy-assistance-program` | Program | Virginia | 1-855-635-4370 | dss.virginia.gov/benefit/ea | — | draft | 2026-11-23 | seed script |

### Youth programs (2)

| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Identity, Inc. | `identity-inc` | Program | Montgomery County, MD | — | identity-youth.org | — | draft | 2026-11-23 | seed script |
| Latin American Youth Center (LAYC) | `latin-american-youth-center` | Program | Washington, DC, Montgomery and Prince George's counties (MD) | 202-319-2225 | layc-dc.org | 1419 Columbia Rd NW, Washington, DC 20009 | draft | 2026-11-23 | seed script |

## Possible duplicates already in the directory

None found (no two listings share a name or website).

## Checked and left out

Researched but not added. Don't research these again unless the reason no longer applies; remove an entry from `scripts/resources-left-out.json` when the provider is added.

| Provider | Area | Why it was left out | Checked |
| --- | --- | --- | --- |
| Literacy Council of Montgomery County | Montgomery County, MD | Its old web address (literacycouncilmcmd.org) now shows unrelated spam content; no current official page found. | 2026-11-23 |
| Fairfax County Coordinated Services Planning (CSP) | Fairfax County, VA | Official county page could not be loaded to confirm phone and hours. | 2026-11-23 |
| Virginia Career Works: Prince William Center | Prince William County, VA | Address and phone found only on third-party sites, not on an official page. | 2026-11-23 |
| Greater Baden Medical Services (Prince George's County centers) | Prince George's County, MD | Its website lists only Southern Maryland (Charles and St. Mary's) centers, so no Prince George's site could be confirmed. | 2026-11-23 |
| Latino Economic Development Center (LEDC) | DC and Maryland | Website did not load to confirm offices and phone. | 2026-11-23 |
