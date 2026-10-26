import { Timestamp } from 'firebase/firestore';

export type QaTaskStatus =
  | 'open'
  | 'in_progress'
  | 'submitted'
  | 'closed';

export type QaResultStatus =
  | 'pass'
  | 'fail'
  | 'blocked';

export interface QaTask {
  id: string;
  title: string;
  description: string;
  application: string;
  instructions: string;
  expectedResult: string;
  assignedTesterIds: string[];
  status: QaTaskStatus;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueDate?: Timestamp;
}

export interface QaSubmission {
  id: string;
  taskId: string;
  testerId: string;
  result: QaResultStatus;
  feedback: string;
  createdAt: Timestamp;
}
