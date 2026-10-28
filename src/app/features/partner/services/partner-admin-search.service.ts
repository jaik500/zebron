import { Injectable, inject } from '@angular/core';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { ApplicationRegistryService } from '../../../core/services/application-registry.service';
import { OrganizationContextStore } from '../../organizations/stores/organization-context.store';
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
  private readonly organizationStore = inject(OrganizationContextStore);

  /**
   * Search resources available to the current organization.
   *
   * Each category fails independently. A Firestore error in course
   * or member search must not suppress matching application results.
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

    // Only search resources for the organization currently selected.
    if (
      this.organizationStore.selectedOrganizationId() !==
      normalizedOrganizationId
    ) {
      return [];
    }

    const [applicationsResult, coursesResult, membersResult] =
      await Promise.allSettled([
        Promise.resolve(
          this.searchApplications(
            normalizedOrganizationId,
            normalizedTerm,
          ),
        ),
        this.searchCourses(normalizedOrganizationId, normalizedTerm),
        this.searchMembers(normalizedOrganizationId, normalizedTerm),
      ]);

    const results: PartnerAdminSearchResult[] = [];

    if (applicationsResult.status === 'fulfilled') {
      results.push(...applicationsResult.value);
    } else {
      console.error(
        '[Partner Search] Application search failed:',
        applicationsResult.reason,
      );
    }

    if (coursesResult.status === 'fulfilled') {
      results.push(...coursesResult.value);
    } else {
      console.error(
        '[Partner Search] Course search failed:',
        coursesResult.reason,
      );
    }

    if (membersResult.status === 'fulfilled') {
      results.push(...membersResult.value);
    } else {
      console.error(
        '[Partner Search] Member search failed:',
        membersResult.reason,
      );
    }

    const uniqueResults = new Map<string, PartnerAdminSearchResult>();

    for (const result of results) {
      const key = `${result.category}:${result.id}`;

      if (!uniqueResults.has(key)) {
        uniqueResults.set(key, result);
      }
    }

    return [...uniqueResults.values()].sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }

  /** Search only applications actively provisioned for this organization. */
  private searchApplications(
    organizationId: string,
    searchTerm: string,
  ): PartnerAdminSearchResult[] {
    const applications = this.applicationRegistry.getEnabledApplications();

    return applications
      .filter((application) =>
        this.organizationStore.hasActiveApplication(application.id),
      )
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
        const route =
          application.id === 'test-center'
            ? `/partner/org/${encodeURIComponent(organizationId)}/learn/test-center`
            : application.route.replace(
                ':organizationId',
                encodeURIComponent(organizationId),
              );

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

  /** Search courses only when Test Center is active for this organization. */
  private async searchCourses(
    organizationId: string,
    searchTerm: string,
  ): Promise<PartnerAdminSearchResult[]> {
    if (!this.organizationStore.hasActiveApplication('test-center')) {
      return [];
    }

    const courses = await this.getOrganizationCourses(organizationId);

    return courses
      .filter((course) => this.matchesCourse(course, searchTerm))
      .map((course) => ({
        id: course.id,
        title: course.name,
        description:
          course.description || 'Organization Test Center course.',
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

  /** Search active members belonging to the current organization. */
  private async searchMembers(
    organizationId: string,
    searchTerm: string,
  ): Promise<PartnerAdminSearchResult[]> {
    const members =
      await this.memberService.getActiveMembers(organizationId);

    return this.memberService
      .searchMembers(members, searchTerm)
      .map((member) => ({
        id: member.id,
        title: this.memberService.displayName(member),
        description:
          member.email ||
          `Organization ${this.memberService.roleLabel(member.role)}`,
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
   * Load courses belonging to one organization. Keep the organizationId
   * constraint so courses from other organizations are never searched.
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

  private matchesCourse(
    course: TestCourse,
    searchTerm: string,
  ): boolean {
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
