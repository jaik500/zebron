export interface Group {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  systemManaged: boolean;
  metadata?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}