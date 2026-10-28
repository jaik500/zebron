import { Injectable, inject } from '@angular/core';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { ApplicationRegistryService } from '../../../core/services/application-registry.service';
import { TestCourse } from '../../test-center/models/test-course.model';
import { PartnerMemberService } from './partner-member.service';

export type PartnerSearchCategory =
  | 'application'
  | 'course'
  | 'member'
  | 'program'
  | 'settings';

export interface PartnerAdminSearchResult {
  id: string;
  title: string;
  description: string;
  category: PartnerSearchCategory;
  icon: string;
  route: string;
  enabled: boolean;
  keywords: string[];
  metadata?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerAdminSearchService {
  private readonly memberService = inject(PartnerMemberService);
  private readonly applicationRegistry = inject(ApplicationRegistryService);

  /**
   * Search resources available to the current organization.
   * Course and member searches remain scoped to that organization.
   */
  async search(
    organizationId: string,
    searchTerm: string,
  ): Promise<PartnerAdminSearchResult[]> {
    const normalizedOrganizationId = organizationId.trim();
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedOrganizationId || !normalizedTerm) {
      return [];
    }

    const [applications, courses, members] = await Promise.all([
      Promise.resolve(
        this.searchApplications(normalizedOrganizationId, normalizedTerm),
      ),
      this.searchCourses(normalizedOrganizationId, normalizedTerm),
      this.searchMembers(normalizedOrganizationId, normalizedTerm),
    ]);

    const uniqueResults = new Map<string, PartnerAdminSearchResult>();

    for (const result of [...applications, ...courses, ...members]) {
      const key = `${result.category}:${result.id}`;
      if (!uniqueResults.has(key)) {
        uniqueResults.set(key, result);
      }
    }

    return [...uniqueResults.values()].sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }

  /**
   * Search enabled applications from the application registry.
   * Test Center search results open the learner-facing experience.
   */
  private searchApplications(
    organizationId: string,
    searchTerm: string,
  ): PartnerAdminSearchResult[] {
    const applications = this.applicationRegistry.getEnabledApplications();

    return applications
      .filter((application) => {
        const searchableText = [
          application.id,
          application.name,
          application.description,
          application.route,
          ...(application.id === 'test-center'
            ? ['test center', 'testing', 'assessment', 'courses', 'learning']
            : []),
        ]
          .join(' ')
          .toLowerCase();

        return searchableText.includes(searchTerm);
      })
      .map((application) => {
        const isTestCenter = application.id === 'test-center';
        const route = isTestCenter
          ? `/partner/org/${encodeURIComponent(organizationId)}/learn/test-center`
          : application.route.replace(':organizationId', organizationId);

       return {
  id: application.id,
  title: application.name,
  description: application.description,
  category: 'application' as const,
  icon: application.icon ?? 'apps',
  route,
  enabled: true,
  keywords: [
    application.id,
    application.name,
    application.description,
    application.route,
  ],
  metadata: 'Application',
};
      });
  }

  /** Search courses belonging to the current organization. */
  private async searchCourses(
    organizationId: string,
    searchTerm: string,
  ): Promise<PartnerAdminSearchResult[]> {
    const courses = await this.getOrganizationCourses(organizationId);

    return courses
      .filter((course) => this.matchesCourse(course, searchTerm))
      .map((course) => ({
        id: course.id,
        title: course.name,
        description: course.description || 'Organization Test Center course.',
        category: 'course' as const,
        icon: 'school',
        route: `/partner/org/${encodeURIComponent(organizationId)}/learn/test-center`,
        enabled: true,
        keywords: this.courseKeywords(course),
        metadata: [
          course.type,
          course.provider,
          course.active ? 'Active' : 'Inactive',
        ]
          .filter(Boolean)
          .join(' • '),
      }));
  }

  /** Search active members of the current organization. */
  private async searchMembers(
    organizationId: string,
    searchTerm: string,
  ): Promise<PartnerAdminSearchResult[]> {
    const members = await this.memberService.getActiveMembers(organizationId);

    return this.memberService.searchMembers(members, searchTerm).map((member) => ({
      id: member.id,
      title: this.memberService.displayName(member),
      description:
        member.email || `Organization ${this.memberService.roleLabel(member.role)}`,
      category: 'member' as const,
      icon: 'person',
      route: '/partner/admin/members',
      enabled: false,
      keywords: [
        member.displayName ?? '',
        member.email ?? '',
        member.userId,
        member.role,
        member.title ?? '',
      ],
      metadata: this.memberService.roleLabel(member.role),
    }));
  }

  /**
   * Load courses belonging to one organization. The organizationId
   * constraint is intentional; do not replace with an unscoped query.
   */
  private async getOrganizationCourses(
    organizationId: string,
  ): Promise<TestCourse[]> {
    const courseCollection = collection(firestore, 'testCourses');
    const courseQuery = query(
      courseCollection,
      where('organizationId', '==', organizationId),
    );
    const snapshot = await getDocs(courseQuery);

    return snapshot.docs
      .map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as TestCourse,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private matchesCourse(course: TestCourse, searchTerm: string): boolean {
    return this.courseKeywords(course)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm);
  }

  private courseKeywords(course: TestCourse): string[] {
    return [
      course.name,
      course.slug,
      course.description,
      course.provider ?? '',
      course.type,
      course.certificationCode ?? '',
      course.programId ?? '',
    ].filter(Boolean);
  }
}
