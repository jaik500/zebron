import { Timestamp } from 'firebase/firestore';

export type JobStatus = 'draft' | 'active' | 'closed';

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';

export type WorkArrangement = 'on-site' | 'hybrid' | 'remote';

export interface JobCompensation {
  min?: number;
  max?: number;
  currency?: string;
  period?: 'hour' | 'year';
}

export interface Job {
  id?: string;

  title: string;
  companyId?: string;
  organizationId: string;
  organizationName: string;

  description: string;

  employmentType: EmploymentType;
  workArrangement: WorkArrangement;

  categoryId?: string;
  categoryName?: string;

  location?: {
    city?: string;
    state?: string;
    country?: string;
  };

  compensation?: JobCompensation;

  skills: string[];
  tags: string[];

  applicationUrl: string;

  applicationDeadline?: Timestamp | null;

  status: JobStatus;

  featured: boolean;

  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
