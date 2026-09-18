export type WorkerType =
  | 'w2'
  | '1099'
  | 'mixed';

export type W2PayType =
  | 'salary'
  | 'hourly';

export type PayFrequency =
  | 'weekly'
  | 'biweekly'
  | 'semimonthly'
  | 'monthly'
  | 'annually';

export type FilingStatus =
  | 'single'
  | 'married-filing-jointly'
  | 'married-filing-separately'
  | 'head-of-household';

export type DeductionType =
  | 'pre-tax'
  | 'post-tax';

export interface BusinessExpense {
  id: string;
  name: string;
  amount: number;
}

export interface Deduction {
  id: string;
  name: string;
  amount: number;
  type: DeductionType;
  frequency: PayFrequency;
}