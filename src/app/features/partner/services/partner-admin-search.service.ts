import { Injectable, inject } from '@angular/core';

import { collection, getDocs, query, where } from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { TestCourse } from '../../test-center/models/test-course.model';
import { PartnerMemberService } from './partner-member.service';

import { OrganizationMembership } from '../models/organization-membership.model';

export type PartnerSearchCategory = 'course' | 'member' | 'program' | 'settings';

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

interface OrganizationMembershipSearchRecord {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  active: boolean;
  displayName?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerAdminSearchService {
  private readonly membershipCollection = collection(firestore, 'organizationMemberships');

  private readonly memberService = inject(PartnerMemberService);

  /**
   * Search the current organization's administrative resources.
   *
   * Every Firestore query is explicitly organization scoped.
   */
  async search(organizationId: string, searchTerm: string): Promise<PartnerAdminSearchResult[]> {
    const normalizedOrganizationId = organizationId.trim();
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedOrganizationId || !normalizedTerm) {
      return [];
    }

    const [courses, memberships] = await Promise.all([
      this.searchCourses(normalizedOrganizationId, normalizedTerm),
      this.searchMembers(normalizedOrganizationId, normalizedTerm),
    ]);

    return [...courses, ...memberships].sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Search courses belonging to the current organization.
   */
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
        route: '/test-center',
        enabled: true,
        keywords: this.courseKeywords(course),
        metadata: [course.type, course.provider, course.active ? 'Active' : 'Inactive']
          .filter(Boolean)
          .join(' • '),
      }));
  }

  /**
   * Search organization memberships.
   *
   * The membership collection is explicitly constrained to
   * the current organization.
   *
   * If displayName/email have not yet been denormalized onto
   * the membership document, we can still search by:
   *
   * - user ID
   * - role
   * - membership ID
   *
   * The member directory can later populate displayName/email
   * through a controlled organization-member projection.
   */
  private async searchMembers(
    organizationId: string,
    searchTerm: string,
  ): Promise<PartnerAdminSearchResult[]> {
    const members = await this.memberService.getActiveMembers(organizationId);

    return this.memberService.searchMembers(members, searchTerm).map((member) => ({
      id: member.id,

      title: this.memberService.displayName(member),

      description: member.email || `Organization ${this.memberService.roleLabel(member.role)}`,

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
   * Load all courses for one organization.
   *
   * This deliberately uses TestCourseService's existing
   * organization-scoped query rather than getAllCoursesForAdmin().
   */
  private async getOrganizationCourses(organizationId: string): Promise<TestCourse[]> {
    const courseCollection = collection(firestore, 'testCourses');

    const courseQuery = query(courseCollection, where('organizationId', '==', organizationId));

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
    const searchableText = [
      course.name,
      course.slug,
      course.description,
      course.provider ?? '',
      course.type,
      course.certificationCode ?? '',
      course.programId ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(searchTerm);
  }

  private matchesMembership(
    membership: OrganizationMembershipSearchRecord,
    searchTerm: string,
  ): boolean {
    const searchableText = [
      membership.userId,
      membership.id,
      membership.role,
      membership.displayName ?? '',
      membership.email ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(searchTerm);
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

  private formatRole(role: string): string {
    switch (role) {
      case 'owner':
        return 'Owner';

      case 'admin':
        return 'Administrator';

      case 'manager':
        return 'Manager';

      case 'member':
        return 'Member';

      default:
        return role || 'Member';
    }
  }
}
