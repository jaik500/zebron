import { Timestamp } from 'firebase/firestore';

export type LearnerStatus =
  | 'active'
  | 'inactive'
  | 'completed'
  | 'not-started';

export interface TestCenterLearner {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: string;
  active: boolean;
  enrolledQuizIds: string[];
  enrolledCourseNames: string[];
  completedQuizIds: string[];
  assessmentCount: number;
  averageScore: number | null;
  latestScore: number | null;
  lastAssessmentAt: Date | null;
  status: LearnerStatus;
}

export interface LearnerCourseProgress {
  quizId: string;
  quizName: string;
  status: 'not-started' | 'in-progress' | 'completed';
  assessmentCount: number;
  averageScore: number | null;
  latestScore: number | null;
  lastActivityAt: Date | null;
}

export interface LearnerAssessmentSummary {
  id: string;
  attemptId: string;
  quizId: string;
  quizName: string;
  scorePercentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  totalQuestions: number;
  completedAt: Date | null;
  mode: 'practice' | 'exam';
}

export interface LearnerDashboard {
  learner: TestCenterLearner;
  courses: LearnerCourseProgress[];
  assessments: LearnerAssessmentSummary[];
  totalAssessments: number;
  averageScore: number | null;
  completedCourses: number;
  lastActivityAt: Date | null;
}

export function timestampToDate(
  value: unknown
): Date | null {
  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate();
  }

  return null;
}