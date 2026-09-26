
import {
  CreateOperationalEventInput,
  OperationalEvent,
  OperationalEventQuery,
  UpdateOperationalEventInput,
} from '../models/operational-event.model';

/**
 * Provider-agnostic repository contract for operational events.
 *
 * Application code should depend on this interface rather than
 * Firestore, Firebase Admin, REST APIs, or another infrastructure
 * provider.
 */
export abstract class OperationalEventRepository {
  /**
   * Create an operational event.
   */
  abstract create(
    input: CreateOperationalEventInput,
  ): Promise<OperationalEvent>;

  /**
   * Retrieve a single event.
   */
  abstract getById(
    id: string,
  ): Promise<OperationalEvent | null>;

  /**
   * Query operational events.
   */
  abstract query(
    query?: OperationalEventQuery,
  ): Promise<OperationalEvent[]>;

  /**
   * Update an operational event.
   */
  abstract update(
    id: string,
    input: UpdateOperationalEventInput,
  ): Promise<OperationalEvent>;

  /**
   * Delete an event.
   *
   * This should normally be restricted to administrative
   * maintenance workflows.
   */
  abstract delete(
    id: string,
  ): Promise<void>;
}
