import { Injectable } from '@angular/core';
import { Timestamp, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { firebaseFunctions, firebaseStorage, firestore } from '../../core/services/firebase-config';
import { CodeLanguage } from '../coding-lab/code-lab.model';

/**
 * Training group assignments and individual projects.
 *
 *   organizations/{id}/trainingGroups/{groupId}/assignments/{assignmentId}
 *   organizations/{id}/trainingGroups/{groupId}/assignments/{assignmentId}/submissions/{uid}
 *
 * Reading is direct (firestore.rules); every change goes through the Cloud
 * Functions in functions/src/training-group-assignments.ts. Files are
 * uploaded to Storage first (storage.rules), then recorded by the function.
 */

export type AssignmentKind = 'assignment' | 'project';
export type SubmissionType = 'text' | 'link' | 'file' | 'code';
export type SubmissionStatus = 'submitted' | 'needs_revision' | 'complete';

export const SUBMISSION_TYPES: { value: SubmissionType; label: string; icon: string }[] = [
  { value: 'text', label: 'Written answer', icon: 'notes' },
  { value: 'link', label: 'Links (GitHub, website, video)', icon: 'link' },
  { value: 'file', label: 'File uploads', icon: 'attach_file' },
  { value: 'code', label: 'Code (Coding Lab)', icon: 'terminal' },
];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus | 'not_submitted', { label: string; classes: string; icon: string }> = {
  not_submitted: { label: 'Not handed in', classes: 'bg-slate-100 text-slate-700', icon: 'radio_button_unchecked' },
  submitted: { label: 'Awaiting review', classes: 'bg-sky-100 text-sky-800', icon: 'schedule' },
  needs_revision: { label: 'Needs revision', classes: 'bg-amber-100 text-amber-900', icon: 'replay' },
  complete: { label: 'Complete', classes: 'bg-emerald-100 text-emerald-800', icon: 'check_circle' },
};

/** Files are limited to 25 MB (storage.rules) and a few per record. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_MATERIALS = 10;
export const MAX_SUBMISSION_FILES = 5;

export interface AssignmentLink {
  label: string;
  url: string;
}

export interface AssignmentFile {
  name: string;
  path: string;
  size: number;
  contentType: string;
}

export interface GroupAssignment {
  id: string;
  title: string;
  kind: AssignmentKind;
  instructions: string;
  links: AssignmentLink[];
  materials: AssignmentFile[];
  dueAt: Date | null;
  acceptLate: boolean;
  submissionTypes: SubmissionType[];
  codeLanguage: CodeLanguage | null;
  status: 'draft' | 'published';
  counts: { submitted: number; needsRevision: number; complete: number };
  createdByName: string;
  updatedAt: Date | null;
}

export interface AssignmentDraft {
  title: string;
  kind: AssignmentKind;
  instructions: string;
  links: AssignmentLink[];
  materials: AssignmentFile[];
  dueAt: number | null;
  acceptLate: boolean;
  submissionTypes: SubmissionType[];
  codeLanguage: CodeLanguage;
  status: 'draft' | 'published';
}

export interface SubmissionHistoryEntry {
  attempt: number;
  status: SubmissionStatus;
  feedback: string;
  byName: string;
  late: boolean;
  at: Date | null;
}

export interface AssignmentSubmission {
  userId: string;
  userName: string;
  email: string | null;
  text: string;
  links: AssignmentLink[];
  files: AssignmentFile[];
  code: string;
  codeLanguage: CodeLanguage | null;
  status: SubmissionStatus;
  attempt: number;
  late: boolean;
  submittedAt: Date | null;
  feedback: string;
  reviewedByName: string | null;
  reviewedAt: Date | null;
  history: SubmissionHistoryEntry[];
}

export interface SubmissionDraft {
  text: string;
  links: AssignmentLink[];
  files: AssignmentFile[];
  code: string;
}

/** An assignment with the signed-in learner's own submission (My learning, group page). */
export interface MyAssignment {
  organizationId: string;
  groupId: string;
  groupName: string;
  assignment: GroupAssignment;
  submission: AssignmentSubmission | null;
}

@Injectable({ providedIn: 'root' })
export class TrainingGroupAssignmentService {
  private assignments(organizationId: string, groupId: string) {
    return collection(firestore, 'organizations', organizationId, 'trainingGroups', groupId, 'assignments');
  }

  /** A new id, so files can be uploaded before the assignment is first saved. */
  newId(organizationId: string, groupId: string): string {
    return doc(this.assignments(organizationId, groupId)).id;
  }

  /** Staff: every assignment, drafts included. Members: published ones only. */
  async list(organizationId: string, groupId: string, staff: boolean): Promise<GroupAssignment[]> {
    const source = staff
      ? this.assignments(organizationId, groupId)
      : query(this.assignments(organizationId, groupId), where('status', '==', 'published'));
    const snapshot = await getDocs(source);
    return snapshot.docs.map((document) => toAssignment(document.id, document.data())).sort(byDueThenTitle);
  }

  /** Staff: everyone's submissions for one assignment. */
  async listSubmissions(organizationId: string, groupId: string, assignmentId: string): Promise<AssignmentSubmission[]> {
    const snapshot = await getDocs(collection(this.assignments(organizationId, groupId), assignmentId, 'submissions'));
    return snapshot.docs.map((document) => toSubmission(document.id, document.data()));
  }

  /** The signed-in learner's own submission, or null. */
  async getMine(organizationId: string, groupId: string, assignmentId: string, userId: string): Promise<AssignmentSubmission | null> {
    const snapshot = await getDoc(doc(this.assignments(organizationId, groupId), assignmentId, 'submissions', userId));
    return snapshot.exists() ? toSubmission(snapshot.id, snapshot.data()) : null;
  }

  /** Published assignments of the learner's groups, each with their own submission. */
  async listMineAcrossGroups(organizationId: string, userId: string, groups: { id: string; name: string }[]): Promise<MyAssignment[]> {
    const perGroup = await Promise.all(
      groups.map(async (group) => {
        try {
          const assignments = await this.list(organizationId, group.id, false);
          return Promise.all(
            assignments.map(async (assignment) => ({
              organizationId,
              groupId: group.id,
              groupName: group.name,
              assignment,
              submission: await this.getMine(organizationId, group.id, assignment.id, userId).catch(() => null),
            })),
          );
        } catch {
          return [];
        }
      }),
    );
    return perGroup.flat();
  }

  async save(organizationId: string, groupId: string, assignmentId: string, assignment: AssignmentDraft): Promise<void> {
    await this.call('manageTrainingGroupAssignment', { organizationId, groupId, assignmentId, action: 'save', assignment });
  }

  async delete(organizationId: string, groupId: string, assignmentId: string): Promise<void> {
    await this.call('manageTrainingGroupAssignment', { organizationId, groupId, assignmentId, action: 'delete' });
  }

  async submit(organizationId: string, groupId: string, assignmentId: string, work: SubmissionDraft): Promise<{ attempt: number; late: boolean }> {
    return this.call('submitTrainingGroupAssignment', { organizationId, groupId, assignmentId, ...work });
  }

  async review(
    organizationId: string,
    groupId: string,
    assignmentId: string,
    userId: string,
    decision: 'complete' | 'needs_revision',
    feedback: string,
  ): Promise<void> {
    await this.call('reviewTrainingGroupSubmission', { organizationId, groupId, assignmentId, userId, decision, feedback });
  }

  /**
   * Upload one file into an assignment's materials (staff) or the learner's
   * own submission folder. The name gets a short prefix so files with the
   * same name don't replace each other.
   */
  async upload(
    organizationId: string,
    groupId: string,
    assignmentId: string,
    folder: 'materials' | { submissionOf: string },
    file: File,
  ): Promise<AssignmentFile> {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error('Files can be up to 25 MB.');
    }
    const base = `organizations/${organizationId}/trainingGroups/${groupId}/assignments/${assignmentId}`;
    const where = folder === 'materials' ? `${base}/materials` : `${base}/submissions/${folder.submissionOf}`;
    const safeName = file.name.replace(/[^\w.\- ]+/g, '_').slice(-120) || 'file';
    const path = `${where}/${Date.now().toString(36)}-${safeName}`;
    await uploadBytes(ref(firebaseStorage, path), file, { contentType: file.type || 'application/octet-stream' });
    return { name: file.name, path, size: file.size, contentType: file.type || 'application/octet-stream' };
  }

  /** Remove a file that was uploaded but never recorded (a learner changed their mind). */
  async discard(path: string): Promise<void> {
    await deleteObject(ref(firebaseStorage, path)).catch(() => undefined);
  }

  /** A link to open a file (Storage checks who may read it). */
  fileUrl(path: string): Promise<string> {
    return getDownloadURL(ref(firebaseStorage, path));
  }

  private async call<T>(name: string, data: Record<string, unknown>): Promise<T> {
    const callable = httpsCallable<Record<string, unknown>, T>(firebaseFunctions, name);
    return (await callable(data)).data;
  }
}

/** Earliest due date first (no due date last), then title. */
function byDueThenTitle(a: GroupAssignment, b: GroupAssignment): number {
  const due = (item: GroupAssignment) => item.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return due(a) - due(b) || a.title.localeCompare(b.title);
}

function toAssignment(id: string, data: Record<string, unknown>): GroupAssignment {
  const counts = (data['counts'] ?? {}) as Record<string, unknown>;
  const types = Array.isArray(data['submissionTypes']) ? data['submissionTypes'] : [];
  return {
    id,
    title: str(data['title']) || 'Assignment',
    kind: data['kind'] === 'project' ? 'project' : 'assignment',
    instructions: typeof data['instructions'] === 'string' ? data['instructions'] : '',
    links: links(data['links']),
    materials: files(data['materials']),
    dueAt: date(data['dueAt']),
    acceptLate: data['acceptLate'] !== false,
    submissionTypes: (['text', 'link', 'file', 'code'] as SubmissionType[]).filter((type) => types.includes(type)),
    codeLanguage: data['codeLanguage'] === 'python' ? 'python' : data['codeLanguage'] === 'javascript' ? 'javascript' : null,
    status: data['status'] === 'published' ? 'published' : 'draft',
    counts: { submitted: num(counts['submitted']), needsRevision: num(counts['needsRevision']), complete: num(counts['complete']) },
    createdByName: str(data['createdByName']),
    updatedAt: date(data['updatedAt']),
  };
}

function toSubmission(userId: string, data: Record<string, unknown>): AssignmentSubmission {
  const status = data['status'];
  return {
    userId,
    userName: str(data['userName']) || 'Learner',
    email: str(data['email']) || null,
    text: typeof data['text'] === 'string' ? data['text'] : '',
    links: links(data['links']),
    files: files(data['files']),
    code: typeof data['code'] === 'string' ? data['code'] : '',
    codeLanguage: data['codeLanguage'] === 'python' ? 'python' : data['codeLanguage'] === 'javascript' ? 'javascript' : null,
    status: status === 'complete' || status === 'needs_revision' ? status : 'submitted',
    attempt: num(data['attempt']) || 1,
    late: data['late'] === true,
    submittedAt: date(data['submittedAt']),
    feedback: typeof data['feedback'] === 'string' ? data['feedback'] : '',
    reviewedByName: str(data['reviewedByName']) || null,
    reviewedAt: date(data['reviewedAt']),
    history: Array.isArray(data['history'])
      ? data['history'].map((entry: Record<string, unknown>) => ({
          attempt: num(entry['attempt']),
          status: entry['status'] === 'complete' || entry['status'] === 'needs_revision' ? entry['status'] : 'submitted',
          feedback: str(entry['feedback']),
          byName: str(entry['byName']),
          late: entry['late'] === true,
          at: date(entry['at']),
        }))
      : [],
  };
}

function links(value: unknown): AssignmentLink[] {
  return Array.isArray(value)
    ? value
        .map((item: Record<string, unknown>) => ({ label: str(item?.['label']), url: str(item?.['url']) }))
        .filter((item) => /^https?:\/\//i.test(item.url))
    : [];
}

function files(value: unknown): AssignmentFile[] {
  return Array.isArray(value)
    ? value
        .map((item: Record<string, unknown>) => ({
          name: str(item?.['name']) || 'File',
          path: str(item?.['path']),
          size: num(item?.['size']),
          contentType: str(item?.['contentType']),
        }))
        .filter((item) => item.path)
    : [];
}

function date(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
