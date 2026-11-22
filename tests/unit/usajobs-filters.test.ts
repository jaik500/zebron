import { describe, expect, it } from 'vitest';

import { classifyLevel, isExecutiveTitle } from '../../functions/src/job-aggregation/usajobs-levels';
import { isImportedSector, sectorsOf } from '../../functions/src/job-aggregation/usajobs-sectors';

/** Which USAJOBS listings Zebron imports. */
describe('USAJOBS import filters', () => {
  describe('fields', () => {
    it('imports IT, healthcare, finance and management jobs', () => {
      expect(sectorsOf(['2210'], [])).toEqual(['it']);
      expect(sectorsOf(['0610'], [])).toEqual(['healthcare']);
      expect(sectorsOf(['0510'], [])).toEqual(['finance']);
      expect(sectorsOf(['0343'], [])).toEqual(['management']);
      expect(isImportedSector(sectorsOf(['0343'], []))).toBe(true);
    });

    it('tags military employers but does not import them on their own', () => {
      const armyMechanic = sectorsOf(['5803'], ['Department of the Army']);
      expect(armyMechanic).toEqual(['armed-forces']);
      expect(isImportedSector(armyMechanic)).toBe(false);

      const armyIt = sectorsOf(['2210'], ['Department of the Army']);
      expect(armyIt).toEqual(['it', 'armed-forces']);
      expect(isImportedSector(armyIt)).toBe(true);
    });

    it('leaves out other fields', () => {
      expect(isImportedSector(sectorsOf(['0083'], ['Department of Justice']))).toBe(false);
    });
  });

  describe('levels', () => {
    const gs = (low: string, high: string, title = 'IT Specialist') => classifyLevel({ payPlans: ['GS'], lowGrade: low, highGrade: high, title });

    it('maps General Schedule grades to entry, mid and senior', () => {
      expect(gs('05', '07')).toBe('entry');
      expect(gs('07', '09')).toBe('entry');
      expect(gs('09', '11')).toBe('mid');
      expect(gs('11', '12')).toBe('mid');
      expect(gs('12', '13')).toBe('senior');
      expect(gs('14', '14')).toBe('senior');
    });

    it('leaves out GS-15 only, but keeps ranges that start lower', () => {
      expect(gs('15', '15')).toBe('executive');
      expect(gs('13', '15')).toBe('senior');
    });

    it('leaves out executive pay plans whatever the title', () => {
      expect(classifyLevel({ payPlans: ['ES'], title: 'IT Program Manager' })).toBe('executive');
      expect(classifyLevel({ payPlans: ['SL'], title: 'Senior Advisor' })).toBe('executive');
      expect(classifyLevel({ payPlans: ['EX'], title: 'Assistant Secretary for Health' })).toBe('executive');
    });

    it('leaves out top leadership titles', () => {
      expect(isExecutiveTitle('Chief Information Officer')).toBe(true);
      expect(isExecutiveTitle('Director, Office of Information Technology')).toBe(true);
      expect(isExecutiveTitle('Deputy Director for Finance')).toBe(true);
      expect(isExecutiveTitle('Chief, Nursing Service')).toBe(true);
      expect(gs('13', '14', 'Supervisory IT Specialist (Director of Operations)')).toBe('executive');
    });

    it('keeps ordinary titles that only look senior', () => {
      expect(isExecutiveTitle('IT Specialist (Systems Administration)')).toBe(false);
      expect(isExecutiveTitle('Executive Assistant')).toBe(false);
      expect(isExecutiveTitle('Program Analyst')).toBe(false);
      expect(isExecutiveTitle('Medical Support Assistant')).toBe(false);
    });

    it('uses the title for other pay plans', () => {
      expect(classifyLevel({ payPlans: ['VN'], title: 'Registered Nurse' })).toBe('mid');
      expect(classifyLevel({ payPlans: ['VN'], title: 'Supervisory Registered Nurse' })).toBe('senior');
      expect(classifyLevel({ payPlans: ['GS'], title: 'Nursing Assistant' })).toBe('entry');
      expect(classifyLevel({ payPlans: ['WG'], title: 'Pharmacy Technician Trainee' })).toBe('entry');
    });
  });
});
