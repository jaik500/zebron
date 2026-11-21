import { describe, expect, it } from 'vitest';

import type { BootcampProgram } from '../../src/app/features/bootcamps/bootcamp.model';
import {
  CourseLike,
  CourseState,
  courseFields,
  matchBootcamps,
  nextInProgram,
  normalizeSkill,
  similarCourses,
} from '../../src/app/features/courses/next-steps';

/** Suggestions on the course summary page after a course is finished. */
describe('Next steps after a course', () => {
  const course = (id: string, overrides: Partial<CourseLike> = {}): CourseLike => ({
    id,
    organizationId: null,
    title: id,
    topic: '',
    program: '',
    programOrder: null,
    level: 'beginner',
    skills: [],
    ...overrides,
  });

  const cyber = (order: number, skills: string[] = []) =>
    course(`cyber-${order}`, { program: 'Cybersecurity Program', programOrder: order, topic: 'Security', skills });

  const none = (): CourseState => null;

  describe('normalizeSkill', () => {
    it('matches common spellings of the same skill', () => {
      expect(normalizeSkill('Amazon Web Services')).toBe('aws');
      expect(normalizeSkill('  AWS ')).toBe('aws');
      expect(normalizeSkill('Amazon Web Services (AWS)')).toBe('aws');
      expect(normalizeSkill('JS')).toBe('javascript');
      expect(normalizeSkill('Cyber Security')).toBe('cybersecurity');
    });
  });

  describe('nextInProgram', () => {
    const catalog = [cyber(1), cyber(2), cyber(3), cyber(4)];

    it('suggests the next course in the program', () => {
      const step = nextInProgram(catalog[0], catalog, none);
      expect(step?.next?.id).toBe('cyber-2');
      expect(step?.position).toBe(2);
      expect(step?.total).toBe(4);
    });

    it('skips courses already finished', () => {
      const done = (c: CourseLike): CourseState => (c.id === 'cyber-2' ? 'completed' : null);
      expect(nextInProgram(catalog[0], catalog, done)?.next?.id).toBe('cyber-3');
    });

    it('goes back to an earlier unfinished course after the last one', () => {
      const done = (c: CourseLike): CourseState => (c.id === 'cyber-1' || c.id === 'cyber-3' ? 'completed' : null);
      expect(nextInProgram(catalog[3], catalog, done)?.next?.id).toBe('cyber-2');
    });

    it('reports a finished program', () => {
      const done = (): CourseState => 'completed';
      const step = nextInProgram(catalog[3], catalog, done);
      expect(step?.next).toBeNull();
      expect(step?.completed).toBe(4);
    });

    it('stays within the same provider and returns null outside a program', () => {
      const other = course('org-cyber-2', { program: 'Cybersecurity Program', programOrder: 2, organizationId: 'org-1' });
      expect(nextInProgram(catalog[0], [catalog[0], other], none)?.next).toBeNull();
      expect(nextInProgram(course('solo'), catalog, none)).toBeNull();
    });
  });

  describe('similarCourses', () => {
    const finished = course('aws-basics', { topic: 'Cloud', skills: ['AWS', 'IAM', 'S3'], level: 'beginner' });

    it('ranks shared skills above the same topic, and leaves out finished courses', () => {
      const catalog = [
        finished,
        course('same-topic', { topic: 'Cloud' }),
        course('two-skills', { skills: ['Amazon Web Services', 'IAM'] }),
        course('unrelated', { topic: 'Design', skills: ['Figma'] }),
        course('done', { skills: ['AWS', 'IAM', 'S3'] }),
      ];
      const stateOf = (c: CourseLike): CourseState => (c.id === 'done' ? 'completed' : null);
      const result = similarCourses(finished, catalog, stateOf).map((item) => item.course.id);
      expect(result).toEqual(['two-skills', 'same-topic']);
    });

    it('prefers the next level up and leaves out excluded courses', () => {
      const catalog = [
        course('intermediate', { topic: 'Cloud', level: 'intermediate' }),
        course('beginner', { topic: 'Cloud', level: 'beginner' }),
        course('next-in-program', { topic: 'Cloud', level: 'intermediate' }),
      ];
      const result = similarCourses(finished, catalog, none, { exclude: [catalog[2]] }).map((item) => item.course.id);
      expect(result).toEqual(['intermediate', 'beginner']);
    });
  });

  describe('bootcamps', () => {
    const program = (id: string, overrides: Partial<BootcampProgram> = {}): BootcampProgram =>
      ({
        id,
        title: id,
        field: 'other',
        summary: '',
        format: 'online',
        schedule: 'part-time',
        durationWeeks: 12,
        hoursPerWeek: 10,
        tuition: 0,
        financing: [],
        costNote: '',
        prerequisites: '',
        requiresDegree: false,
        englishSupport: false,
        workAuthorization: '',
        certifications: [],
        skills: [],
        placementRate: null,
        outcomesSource: '',
        applyUrl: '',
        starts: [],
        recommended: false,
        zebronTake: '',
        ...overrides,
      }) as BootcampProgram;

    it('works out bootcamp fields from a course', () => {
      expect([...courseFields(course('x', { title: 'AWS Cloud Practitioner Exam Prep' }))]).toContain('cloud');
      expect([...courseFields(course('x', { skills: ['CompTIA A+'] }))]).toContain('it-support');
      expect([...courseFields(course('x', { title: 'JavaScript basics' }))]).toEqual(['software']);
    });

    it('matches on shared skills and field, one program per bootcamp', () => {
      const finished = course('sec', { title: 'Security+ Exam Prep', skills: ['Incident response', 'SIEM'] });
      const result = matchBootcamps(
        finished,
        [
          { resourceId: 'camp-a', programs: [program('a-soc', { field: 'cybersecurity', skills: ['SIEM', 'Incident Response'] }), program('a-web', { field: 'software' })] },
          { resourceId: 'camp-b', programs: [program('b-cyber', { field: 'cybersecurity', recommended: true })] },
          { resourceId: 'camp-c', programs: [program('c-ux', { field: 'ux', skills: ['Figma'] })] },
        ],
        { today: '2026-11-21' },
      );
      expect(result.map((match) => match.program.id)).toEqual(['a-soc', 'b-cyber']);
      expect(result[0].sharedSkills).toEqual(['SIEM', 'Incident Response']);
    });

    it('finds the next start date from today', () => {
      const finished = course('cloud', { title: 'Cloud basics' });
      const [match] = matchBootcamps(
        finished,
        [{ resourceId: 'camp', programs: [program('p', { field: 'cloud', starts: [{ date: '2026-01-10' }, { date: '2027-02-01' }, { date: '2026-12-05' }] })] }],
        { today: '2026-11-21' },
      );
      expect(match.nextStart).toBe('2026-12-05');
    });
  });
});
