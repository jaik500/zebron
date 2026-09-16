import { Timestamp } from 'firebase/firestore';

export interface OperationTool {
  id: string;

  name: string;

  category:
    | 'ai'
    | 'production'
    | 'design'
    | 'development'
    | 'marketing'
    | 'storage'
    | 'operations'
    | 'publishing'
    | 'other';

  description: string;

  purpose: string;

  website: string;

  pricing?: string;

  freeTier?: boolean;

  howWeUseIt: string[];

  instructions: string[];

  tips?: string[];

  active: boolean;

  createdAt?: Timestamp | null;

  updatedAt?: Timestamp | null;
}