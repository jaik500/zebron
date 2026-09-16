import { Timestamp } from "firebase/firestore";


export interface ContentMetric {
  label: string;
  value: number;
  icon: string;
  description: string;
}

export interface OperationTool {
  name: string;
  category: string;
  description: string;
  icon: string;
  website: string;
  free: boolean;
}

export interface ContentMilestone {
  title: string;
  feature: string;
  development: string;
  testing: string;
  capture: string;
  content: string;
  potentialYoutube: string;
  screenshots: number;
  recordings: number;
  notes: number;
  storageUrl?: string;
}

export interface ContentCapture {
  id: string;

  milestoneId: string;

  type:
    | 'screenshot'
    | 'recording'
    | 'before-after'
    | 'note'
    | 'demo';

  title: string;

  description?: string;

  storageUrl?: string;

  capturedAt?: Timestamp | null;

  tags?: string[];

  usedInContentIds?: string[];

  status:
    | 'captured'
    | 'reviewed'
    | 'used'
    | 'archived';

  createdAt?: Timestamp | null;

  updatedAt?: Timestamp | null;
}

// Content Item

export interface ContentItem {
  id: string;

  title: string;

  description?: string;

  type:
    | 'video'
    | 'short'
    | 'post'
    | 'article'
    | 'tutorial'
    | 'image';

  platform:
    | 'youtube'
    | 'youtube-short'
    | 'instagram'
    | 'tiktok'
    | 'linkedin'
    | 'website'
    | 'other';

  category?: string;

  status:
    | 'idea'
    | 'planned'
    | 'capturing'
    | 'scripting'
    | 'editing'
    | 'review'
    | 'ready'
    | 'published'
    | 'archived';

  milestoneId?: string;

  captureIds?: string[];

  externalFolderUrl?: string;

  publishedUrl?: string;

  scheduledAt?: Timestamp | null;

  publishedAt?: Timestamp | null;

  createdAt?: Timestamp | null;

  updatedAt?: Timestamp | null;
}