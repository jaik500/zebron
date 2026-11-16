import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../core/services/firebase-config';

/**
 * Training Groups: cohorts and other groups of learners going through
 * training together.
 *
 *   organizations/{id}/trainingGroups/{groupId}                 the group
 *   organizations/{id}/trainingGroups/{groupId}/members/{uid}   the roster
 *   organizations/{id}/trainingGroupEnrollments/{uid}            { groupIds } per person
 *
 *   organizations/{id}/trainingGroups/{groupId}/courses/{key}   courses given to the whole group
 *
 * The roster, the per-person index and memberCount are written only by the
 * manageTrainingGroupMembers Cloud Function, which enforces the capacity.
 * Group courses are written by manageTrainingGroupCourses, which turns each
 * into an ordinary course assignment for every member.
 */

/** Only cohorts for now; apprenticeships, corporate training and open groups can follow. */
export type TrainingGroupType = 'cohort';
export type TrainingGroupDelivery = 'online' | 'in_person' | 'hybrid';
/** Set by hand; otherwise the status follows the dates. */
export type TrainingGroupManualStatus = 'draft' | 'cancelled' | null;
export type TrainingGroupStatus = 'draft' | 'cancelled' | 'upcoming' | 'active' | 'completed';

export interface TrainingGroup {
  id: string;
  organizationId: string;
  name: string;
  type: TrainingGroupType;
  description: string;
  programName: string;
  startDate: Date | null;
  endDate: Date | null;
  /** 0 = no limit. */
  capacity: number;
  deliveryMode: TrainingGroupDelivery;
  location: string;
  leadIds: string[];
  instructorIds: string[];
  manualStatus: TrainingGroupManualStatus;
  memberCount: number;
  /** An admin reopened the group after its end date (it is no longer locked or archived). */
  reopened: boolean;
  /** When the completion summary was last built (null: never). */
  summaryAt: Date | null;
  /** How people get in: added by leads, request to join (members), or apply by link. */
  enrollmentMode: EnrollmentMode;
  enrollmentOpensAt: Date | null;
  enrollmentClosesAt: Date | null;
  waitlistEnabled: boolean;
  /** Request mode only: members join without waiting for approval. */
  autoApprove: boolean;
  /** Up to 5 questions shown on the request or application form. */
  applicationQuestions: string[];
  /** Kept by the enrollment functions. */
  pendingRequests: number;
  waitlistCount: number;
}

export type EnrollmentMode = 'invite' | 'request' | 'application';

export const ENROLLMENT_MODES: { value: EnrollmentMode; label: string; hint: string }[] = [
  { value: 'invite', label: 'Invite only', hint: 'Leads add people. Nobody can ask to join.' },
  { value: 'request', label: 'Request to join', hint: 'Organization members ask to join; a lead approves.' },
  { value: 'application', label: 'Application', hint: 'Anyone with the link applies; approved applicants are invited to the organization.' },
];

export type JoinRequestStatus = 'pending' | 'waitlisted' | 'invited' | 'enrolled' | 'declined' | 'withdrawn';

export const REQUEST_STATUS_LABELS: Record<JoinRequestStatus, { label: string; classes: string }> = {
  pending: { label: 'Waiting for review', classes: 'bg-amber-100 text-amber-900' },
  waitlisted: { label: 'On the waitlist', classes: 'bg-sky-100 text-sky-900' },
  invited: { label: 'Invited', classes: 'bg-violet-100 text-violet-900' },
  enrolled: { label: 'Enrolled', classes: 'bg-emerald-100 text-emerald-900' },
  declined: { label: 'Declined', classes: 'bg-rose-100 text-rose-900' },
  withdrawn: { label: 'Withdrawn', classes: 'bg-slate-100 text-slate-700' },
};

/** A request or application, as the group's staff see it. */
export interface JoinRequest {
  userId: string;
  name: string;
  email: string | null;
  type: 'request' | 'application';
  isOrganizationMember: boolean;
  answers: { question: string; answer: string }[];
  status: JoinRequestStatus;
  createdAt: Date | null;
  decidedAt: Date | null;
  decisionNote: string;
  waitlistedAt: Date | null;
}

export interface EnrollmentLogEntry {
  id: string;
  action: string;
  userName: string;
  actorName: string;
  note: string;
  at: Date | null;
}

/** What the join page and the open-groups list show (getTrainingGroupEnrollment). */
export interface PublicGroupInfo {
  organizationId: string;
  organizationName: string;
  groupId: string;
  name: string;
  programName: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  deliveryMode: string;
  location: string;
  mode: EnrollmentMode;
  opensAt: string | null;
  closesAt: string | null;
  spotsLeft: number | null;
  waitlistEnabled: boolean;
  questions: string[];
  closedReason: string | null;
}

export interface OwnRequest {
  status: JoinRequestStatus;
  createdAt: string | null;
  decisionNote: string;
}

/** One person's line in a completion summary. */
export interface TrainingGroupSummaryMember {
  userId: string;
  name: string;
  email: string | null;
  /** Group course key -> 'completed' | 'in_progress' | 'not_started'. */
  status: Record<string, 'completed' | 'in_progress' | 'not_started'>;
  /** Group course key -> completion time (ms). */
  completedAt: Record<string, number>;
  finishedAll: boolean;
}

/** The snapshot built when a group ends (refreshTrainingGroupSummary). */
export interface TrainingGroupSummary {
  generatedAt: Date | null;
  generatedBy: string;
  memberCount: number;
  finishedAll: number;
  truncated: boolean;
  courses: { key: string; courseTitle: string; lessonTitle: string | null; dueAt: number | null; done: number; inProgress: number; notStarted: number }[];
  members: TrainingGroupSummaryMember[];
}

/** One person from the organization's member directory. */
export interface DirectoryPerson {
  userId: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

/** Organization roles as people read them. */
export const ROLE_LABELS: Record<string, string> = {
  org_member: 'Member',
  org_staff: 'Staff',
  org_manager: 'Manager',
  org_admin: 'Admin',
  org_owner: 'Owner',
};

/** A course (or one lesson of it) assigned to a whole group. */
export interface TrainingGroupCourse {
  key: string;
  courseId: string;
  courseTitle: string;
  cover: string;
  lessonId: string | null;
  lessonTitle: string | null;
  dueAt: Date | null;
  required: boolean;
  note: string;
  assignedByName: string;
  assignedAt: Date | null;
}

export interface GroupCourseChange {
  action: 'assign' | 'update' | 'remove';
  courseId: string;
  lessonId: string | null;
  dueAt?: number | null;
  required?: boolean;
  note?: string;
}

export interface TrainingGroupMember {
  userId: string;
  name: string;
  email: string | null;
  enrolledAt: Date | null;
}

/** Groups to filter by, and who is in each (group id -> user ids). */
export interface GroupFilter {
  groups: { id: string; name: string }[];
  members: Map<string, Set<string>>;
}

export const TRAINING_GROUP_TYPES: { value: TrainingGroupType; label: string }[] = [{ value: 'cohort', label: 'Cohort' }];

export const DELIVERY_MODES: { value: TrainingGroupDelivery; label: string; icon: string }[] = [
  { value: 'online', label: 'Online', icon: 'laptop' },
  { value: 'in_person', label: 'In person', icon: 'apartment' },
  { value: 'hybrid', label: 'Hybrid', icon: 'devices' },
];

export const STATUS_LABELS: Record<TrainingGroupStatus, { label: string; classes: string }> = {
  draft: { label: 'Draft', classes: 'bg-slate-100 text-slate-700' },
  cancelled: { label: 'Cancelled', classes: 'bg-rose-100 text-rose-800' },
  upcoming: { label: 'Upcoming', classes: 'bg-sky-100 text-sky-800' },
  active: { label: 'Active', classes: 'bg-emerald-100 text-emerald-800' },
  completed: { label: 'Completed', classes: 'bg-violet-100 text-violet-800' },
};

/** Days after the end date before a completed group is archived. */
export const ARCHIVE_AFTER_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

/**
 * A completed group is locked: no members or courses change, and only
 * owners and admins can edit it, until an admin reopens it.
 */
export function isLocked(group: Pick<TrainingGroup, 'manualStatus' | 'startDate' | 'endDate' | 'reopened'>, now = Date.now()): boolean {
  return groupStatus(group, now) === 'completed' && !group.reopened;
}

/**
 * Archived: locked for more than ARCHIVE_AFTER_DAYS. Archived groups leave
 * the group filters and learners' My learning, and move to the Archived tab.
 */
export function isArchived(group: Pick<TrainingGroup, 'manualStatus' | 'startDate' | 'endDate' | 'reopened'>, now = Date.now()): boolean {
  return isLocked(group, now) && !!group.endDate && group.endDate.getTime() + (ARCHIVE_AFTER_DAYS + 1) * DAY <= now;
}

/**
 * Draft and cancelled are set by hand. Otherwise: upcoming before the start
 * date, completed after the end date (the whole end day counts), active in
 * between or when no dates are set.
 */
export function groupStatus(group: Pick<TrainingGroup, 'manualStatus' | 'startDate' | 'endDate'>, now = Date.now()): TrainingGroupStatus {
  if (group.manualStatus) {
    return group.manualStatus;
  }
  if (group.startDate && group.startDate.getTime() > now) {
    return 'upcoming';
  }
  if (group.endDate && group.endDate.getTime() + 24 * 60 * 60 * 1000 <= now) {
    return 'completed';
  }
  return 'active';
}

/** A new, empty group, led by its creator. */
export function newTrainingGroup(organizationId: string, leadId: string): TrainingGroup {
  return {
    id: '',
    organizationId,
    name: '',
    type: 'cohort',
    description: '',
    programName: '',
    startDate: null,
    endDate: null,
    capacity: 0,
    deliveryMode: 'online',
    location: '',
    leadIds: leadId ? [leadId] : [],
    instructorIds: [],
    manualStatus: null,
    memberCount: 0,
    reopened: false,
    summaryAt: null,
    enrollmentMode: 'invite',
    enrollmentOpensAt: null,
    enrollmentClosesAt: null,
    waitlistEnabled: false,
    autoApprove: false,
    applicationQuestions: [],
    pendingRequests: 0,
    waitlistCount: 0,
  };
}

@Injectable({ providedIn: 'root' })
export class TrainingGroupService {
  private groups(organizationId: string) {
    return collection(firestore, 'organizations', organizationId, 'trainingGroups');
  }

  /** Every group of the organization (staff and above). */
  async list(organizationId: string): Promise<TrainingGroup[]> {
    const snapshot = await getDocs(this.groups(organizationId));
    return snapshot.docs.map((document) => toGroup(document.id, organizationId, document.data())).sort(byStartThenName);
  }

  async get(organizationId: string, groupId: string): Promise<TrainingGroup | null> {
    const snapshot = await getDoc(doc(this.groups(organizationId), groupId));
    return snapshot.exists() ? toGroup(snapshot.id, organizationId, snapshot.data()) : null;
  }

  /** Create (no id) or update a group. Returns its id. */
  async save(group: TrainingGroup, userId: string): Promise<string> {
    const data = {
      organizationId: group.organizationId,
      name: group.name.trim(),
      type: group.type,
      description: group.description.trim(),
      programName: group.programName.trim(),
      startDate: group.startDate ? Timestamp.fromDate(group.startDate) : null,
      endDate: group.endDate ? Timestamp.fromDate(group.endDate) : null,
      capacity: Math.max(0, Math.floor(Number(group.capacity) || 0)),
      deliveryMode: group.deliveryMode,
      location: group.location.trim(),
      leadIds: [...new Set(group.leadIds)],
      instructorIds: [...new Set(group.instructorIds)],
      manualStatus: group.manualStatus,
      enrollmentMode: group.enrollmentMode,
      enrollmentOpensAt: group.enrollmentOpensAt ? Timestamp.fromDate(group.enrollmentOpensAt) : null,
      enrollmentClosesAt: group.enrollmentClosesAt ? Timestamp.fromDate(group.enrollmentClosesAt) : null,
      waitlistEnabled: group.waitlistEnabled,
      autoApprove: group.enrollmentMode === 'request' && group.autoApprove,
      applicationQuestions: group.applicationQuestions.map((question) => question.trim()).filter(Boolean).slice(0, 5),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (group.id) {
      // memberCount, createdAt and createdBy are left as they are.
      await updateDoc(doc(this.groups(group.organizationId), group.id), data);
      return group.id;
    }

    const reference = doc(this.groups(group.organizationId));
    await setDoc(reference, { ...data, memberCount: 0, createdAt: serverTimestamp(), createdBy: userId });
    return reference.id;
  }

  // ---------- Enrollment (requests, applications, waitlist) ----------

  /** Requests and applications for a group (its staff). */
  async listRequests(organizationId: string, groupId: string): Promise<JoinRequest[]> {
    const snapshot = await getDocs(collection(this.groups(organizationId), groupId, 'requests'));
    const date = (value: unknown) => (value instanceof Timestamp ? value.toDate() : null);
    return snapshot.docs.map((document) => {
      const data = document.data();
      return {
        userId: document.id,
        name: str(data['name']) || 'Applicant',
        email: str(data['email']) || null,
        type: data['type'] === 'application' ? 'application' : 'request',
        isOrganizationMember: data['isOrganizationMember'] === true,
        answers: Array.isArray(data['answers']) ? (data['answers'] as { question: string; answer: string }[]) : [],
        status: (str(data['status']) || 'pending') as JoinRequestStatus,
        createdAt: date(data['createdAt']),
        decidedAt: date(data['decidedAt']),
        decisionNote: str(data['decisionNote']),
        waitlistedAt: date(data['waitlistedAt']),
      };
    });
  }

  /** The latest enrollment events for a group (its staff). */
  async listEnrollmentLog(organizationId: string, groupId: string, max = 50): Promise<EnrollmentLogEntry[]> {
    const snapshot = await getDocs(
      query(collection(this.groups(organizationId), groupId, 'enrollmentLog'), orderBy('at', 'desc'), limit(max)),
    );
    return snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        action: str(data['action']),
        userName: str(data['userName']),
        actorName: str(data['actorName']),
        note: str(data['note']),
        at: data['at'] instanceof Timestamp ? data['at'].toDate() : null,
      };
    });
  }

  /** A lead approves or declines a request. */
  async decideRequest(organizationId: string, groupId: string, userId: string, decision: 'approve' | 'decline', note = ''): Promise<string> {
    const callable = httpsCallable<object, { status: string }>(firebaseFunctions, 'decideTrainingGroupRequest');
    return (await callable({ organizationId, groupId, userId, decision, note })).data.status;
  }

  /** The join page: public group details and the caller's own request. */
  async getEnrollment(organizationId: string, groupId: string): Promise<{
    group: PublicGroupInfo;
    isOrganizationMember: boolean;
    isGroupMember: boolean;
    request: OwnRequest | null;
  }> {
    const callable = httpsCallable<object, {
      group: PublicGroupInfo;
      isOrganizationMember: boolean;
      isGroupMember: boolean;
      request: OwnRequest | null;
    }>(firebaseFunctions, 'getTrainingGroupEnrollment');
    return (await callable({ organizationId, groupId })).data;
  }

  /** Ask to join or apply (answers in question order), or withdraw. */
  async submitRequest(organizationId: string, groupId: string, action: 'submit' | 'withdraw', answers: string[] = []): Promise<string> {
    const callable = httpsCallable<object, { status: string }>(firebaseFunctions, 'submitTrainingGroupRequest');
    return (await callable({ organizationId, groupId, action, answers })).data.status;
  }

  /** Groups a member can ask to join now. */
  async listOpenGroups(organizationId: string): Promise<(PublicGroupInfo & { request: OwnRequest | null })[]> {
    const callable = httpsCallable<object, { groups: (PublicGroupInfo & { request: OwnRequest | null })[] }>(
      firebaseFunctions,
      'listOpenTrainingGroups',
    );
    return (await callable({ organizationId })).data.groups;
  }

  /** Owners and admins: reopen a completed group, or lock it again. */
  async setReopened(organizationId: string, groupId: string, reopened: boolean, userId: string): Promise<void> {
    await updateDoc(doc(this.groups(organizationId), groupId), { reopened, updatedAt: serverTimestamp(), updatedBy: userId });
  }

  /** The completion summary, or null when none was built yet. */
  async getSummary(organizationId: string, groupId: string): Promise<TrainingGroupSummary | null> {
    const snapshot = await getDoc(doc(this.groups(organizationId), groupId, 'summary', 'final'));
    if (!snapshot.exists()) {
      return null;
    }
    const data = snapshot.data();
    return {
      generatedAt: data['generatedAt'] instanceof Timestamp ? data['generatedAt'].toDate() : null,
      generatedBy: str(data['generatedBy']),
      memberCount: Number(data['memberCount'] ?? 0),
      finishedAll: Number(data['finishedAll'] ?? 0),
      truncated: data['truncated'] === true,
      courses: Array.isArray(data['courses']) ? (data['courses'] as TrainingGroupSummary['courses']) : [],
      members: Array.isArray(data['members']) ? (data['members'] as TrainingGroupSummaryMember[]) : [],
    };
  }

  /** Build (or rebuild) the completion summary now. */
  async refreshSummary(organizationId: string, groupId: string): Promise<void> {
    const callable = httpsCallable<{ organizationId: string; groupId: string }, { memberCount: number }>(
      firebaseFunctions,
      'refreshTrainingGroupSummary',
    );
    await callable({ organizationId, groupId });
  }

  /** Owners and admins, once everyone has been withdrawn. */
  async delete(organizationId: string, groupId: string): Promise<void> {
    await deleteDoc(doc(this.groups(organizationId), groupId));
  }

  /** The roster (managers, and the group's leads and instructors). */
  async listMembers(organizationId: string, groupId: string): Promise<TrainingGroupMember[]> {
    const snapshot = await getDocs(collection(this.groups(organizationId), groupId, 'members'));
    return snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          userId: document.id,
          name: str(data['name']) || str(data['email']) || 'Member',
          email: str(data['email']) || null,
          enrolledAt: data['enrolledAt'] instanceof Timestamp ? data['enrolledAt'].toDate() : null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Add people to a group, or withdraw them (capacity checked on the server). */
  async changeMembers(
    organizationId: string,
    groupId: string,
    action: 'add' | 'remove',
    userIds: string[],
  ): Promise<{ changed: number; memberCount: number }> {
    const callable = httpsCallable<
      { organizationId: string; groupId: string; action: string; userIds: string[] },
      { changed: number; memberCount: number }
    >(firebaseFunctions, 'manageTrainingGroupMembers');

    return (await callable({ organizationId, groupId, action, userIds })).data;
  }

  /** Courses given to the whole group (its staff and its members). */
  async listCourses(organizationId: string, groupId: string): Promise<TrainingGroupCourse[]> {
    const snapshot = await getDocs(collection(this.groups(organizationId), groupId, 'courses'));
    const date = (value: unknown) => (value instanceof Timestamp ? value.toDate() : null);
    return snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          key: document.id,
          courseId: str(data['courseId']),
          courseTitle: str(data['courseTitle']) || 'Course',
          cover: str(data['cover']) || 'teal',
          lessonId: str(data['lessonId']) || null,
          lessonTitle: str(data['lessonTitle']) || null,
          dueAt: date(data['dueAt']),
          required: data['required'] !== false,
          note: str(data['note']),
          assignedByName: str(data['assignedByName']),
          assignedAt: date(data['assignedAt']),
        };
      })
      .sort((a, b) => (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) || a.courseTitle.localeCompare(b.courseTitle));
  }

  /** Assign a course to the whole group, change it or take it off (assignments follow on the server). */
  async changeCourse(organizationId: string, groupId: string, change: GroupCourseChange): Promise<{ changed: number }> {
    const callable = httpsCallable<GroupCourseChange & { organizationId: string; groupId: string }, { changed: number }>(
      firebaseFunctions,
      'manageTrainingGroupCourses',
    );
    return (await callable({ organizationId, groupId, ...change })).data;
  }

  /**
   * Everyone in the organization with their names, emails and roles
   * (getOrganizationMemberDirectory; managers and above), by name.
   */
  async loadDirectory(organizationId: string): Promise<DirectoryPerson[]> {
    const callable = httpsCallable<
      { organizationId: string },
      { members: { userId: string; displayName: string | null; email: string | null; role: string | null; active?: boolean }[] }
    >(firebaseFunctions, 'getOrganizationMemberDirectory');
    const members = (await callable({ organizationId })).data.members ?? [];
    return members
      .map((member) => ({
        userId: member.userId,
        name: member.displayName?.trim() || member.email?.trim() || 'Unnamed member',
        email: member.email?.trim() ?? '',
        role: member.role ?? 'org_member',
        active: member.active !== false,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Each person's groups: userId -> group ids (staff and above). Used by the group filters. */
  async listEnrollments(organizationId: string): Promise<Map<string, string[]>> {
    const snapshot = await getDocs(collection(firestore, 'organizations', organizationId, 'trainingGroupEnrollments'));
    return new Map(
      snapshot.docs.map((document) => {
        const ids = document.data()['groupIds'];
        return [document.id, Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []];
      }),
    );
  }

  /**
   * For the "group" filters on Team progress and Test Center results: the
   * organization's groups (drafts, cancelled and archived left out) and who is in
   * each. null when the organization has no Training Groups, or none yet.
   */
  async loadGroupFilter(organizationId: string): Promise<GroupFilter | null> {
    try {
      const [groups, enrollments] = await Promise.all([this.list(organizationId), this.listEnrollments(organizationId)]);
      const shown = groups.filter((group) => !group.manualStatus && !isArchived(group));
      if (!shown.length) {
        return null;
      }
      const members = new Map<string, Set<string>>(shown.map((group) => [group.id, new Set<string>()]));
      for (const [userId, groupIds] of enrollments) {
        for (const groupId of groupIds) {
          members.get(groupId)?.add(userId);
        }
      }
      return { groups: shown.map((group) => ({ id: group.id, name: group.name })), members };
    } catch {
      // No Training Groups (or no access): the filter is simply not shown.
      return null;
    }
  }

  /** The signed-in person's own groups in an organization. */
  async listMine(organizationId: string, userId: string): Promise<TrainingGroup[]> {
    const index = await getDoc(doc(firestore, 'organizations', organizationId, 'trainingGroupEnrollments', userId));
    const ids: unknown = index.exists() ? index.data()['groupIds'] : [];
    if (!Array.isArray(ids) || !ids.length) {
      return [];
    }

    const groups = await Promise.all(
      ids
        .filter((id): id is string => typeof id === 'string')
        .map((id) => this.get(organizationId, id).catch(() => null)),
    );
    return groups
      .filter((group): group is TrainingGroup => !!group && group.manualStatus !== 'draft' && !isArchived(group))
      .sort(byStartThenName);
  }
}

function toGroup(id: string, organizationId: string, data: Record<string, unknown>): TrainingGroup {
  const date = (value: unknown) => (value instanceof Timestamp ? value.toDate() : null);
  const ids = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
  const manual = data['manualStatus'];
  const delivery = data['deliveryMode'];

  return {
    id,
    organizationId,
    name: str(data['name']) || 'Training group',
    type: 'cohort',
    description: str(data['description']),
    programName: str(data['programName']),
    startDate: date(data['startDate']),
    endDate: date(data['endDate']),
    capacity: typeof data['capacity'] === 'number' ? data['capacity'] : 0,
    deliveryMode: delivery === 'in_person' || delivery === 'hybrid' ? delivery : 'online',
    location: str(data['location']),
    leadIds: ids(data['leadIds']),
    instructorIds: ids(data['instructorIds']),
    manualStatus: manual === 'draft' || manual === 'cancelled' ? manual : null,
    memberCount: typeof data['memberCount'] === 'number' ? data['memberCount'] : 0,
    reopened: data['reopened'] === true,
    summaryAt: date(data['summaryAt']),
    enrollmentMode: data['enrollmentMode'] === 'request' || data['enrollmentMode'] === 'application' ? data['enrollmentMode'] : 'invite',
    enrollmentOpensAt: date(data['enrollmentOpensAt']),
    enrollmentClosesAt: date(data['enrollmentClosesAt']),
    waitlistEnabled: data['waitlistEnabled'] === true,
    autoApprove: data['autoApprove'] === true,
    applicationQuestions: Array.isArray(data['applicationQuestions']) ? data['applicationQuestions'].map((question: unknown) => str(question)).filter(Boolean) : [],
    pendingRequests: typeof data['pendingRequests'] === 'number' ? data['pendingRequests'] : 0,
    waitlistCount: typeof data['waitlistCount'] === 'number' ? data['waitlistCount'] : 0,
  };
}

/** Soonest start first (groups without a start date last), then by name. */
function byStartThenName(a: TrainingGroup, b: TrainingGroup): number {
  const start = (group: TrainingGroup) => group.startDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return start(a) - start(b) || a.name.localeCompare(b.name);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
