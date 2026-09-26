
import { Injectable, inject } from '@angular/core';

import {
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
  where,
} from 'firebase/firestore';

import {
  CreateOperationalEventInput,
  OperationalEvent,
  OperationalEventQuery,
  OperationalEventStatus,
  OperationalEventSeverity,
  OperationalEventSource,
  OperationalEventType,
  UpdateOperationalEventInput,
} from '../models/operational-event.model';

import { firestore } from '../services/firebase-config';

import { OperationalEventRepository } from './operational-event.repository';

/**
 * Firebase implementation of the operational-event repository.
 *
 * IMPORTANT:
 * This is the ONLY layer that should know that operational
 * events are currently stored in Firestore.
 */
@Injectable()
export class FirebaseOperationalEventRepository
  extends OperationalEventRepository
{


  private readonly collectionName =
    'operationalEvents';

  async create(
    input: CreateOperationalEventInput,
  ): Promise<OperationalEvent> {
    const eventRef = doc(
      collection(
        firestore,
        this.collectionName,
      ),
    );

    const now = new Date().toISOString();

    const event: OperationalEvent = {
      id: eventRef.id,

      type: input.type,

      severity: input.severity,

      status: 'open',

      source: input.source,

      title: input.title,

      description: input.description,

      feature: input.feature,

      service: input.service,

      operation: input.operation,

      userId: input.userId,

      correlationId: input.correlationId,

      errorCode: input.errorCode,

      errorMessage: input.errorMessage,

      metadata: input.metadata,

      occurrenceCount: 1,

      createdAt: now,

      updatedAt: now,
    };

    await setDoc(eventRef, {
      ...event,

      /**
       * Firestore timestamps are infrastructure concerns and
       * therefore remain inside this adapter.
       */
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return event;
  }

  async getById(
    id: string,
  ): Promise<OperationalEvent | null> {
    const eventRef = doc(
      firestore,
      this.collectionName,
      id,
    );

    const snapshot = await getDoc(eventRef);

    if (!snapshot.exists()) {
      return null;
    }

    return this.mapDocument(
      snapshot.id,
      snapshot.data(),
    );
  }

  async query(
    options: OperationalEventQuery = {},
  ): Promise<OperationalEvent[]> {
    const collectionRef = collection(
      firestore,
      this.collectionName,
    );

    const constraints = [];

    if (options.type) {
      constraints.push(
        where('type', '==', options.type),
      );
    }

    if (options.severity) {
      constraints.push(
        where(
          'severity',
          '==',
          options.severity,
        ),
      );
    }

    if (options.status) {
      constraints.push(
        where(
          'status',
          '==',
          options.status,
        ),
      );
    }

    if (options.source) {
      constraints.push(
        where(
          'source',
          '==',
          options.source,
        ),
      );
    }

    if (options.feature) {
      constraints.push(
        where(
          'feature',
          '==',
          options.feature,
        ),
      );
    }

    if (options.service) {
      constraints.push(
        where(
          'service',
          '==',
          options.service,
        ),
      );
    }

    if (options.userId) {
      constraints.push(
        where(
          'userId',
          '==',
          options.userId,
        ),
      );
    }

    constraints.push(
      orderBy('createdAt', 'desc'),
    );

    if (options.limit) {
      constraints.push(
        limit(options.limit),
      );
    }

    const eventsQuery = query(
      collectionRef,
      ...constraints,
    );

    const snapshot =
      await getDocs(eventsQuery);

    return snapshot.docs.map((document) =>
      this.mapDocument(
        document.id,
        document.data(),
      ),
    );
  }

  async update(
    id: string,
    input: UpdateOperationalEventInput,
  ): Promise<OperationalEvent> {
    const eventRef = doc(
      firestore,
      this.collectionName,
      id,
    );

    const existing = await this.getById(id);

    if (!existing) {
      throw new Error(
        `Operational event '${id}' was not found.`,
      );
    }

    const now = new Date().toISOString();

    const update: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (input.status !== undefined) {
      update['status'] = input.status;
    }

    if (input.severity !== undefined) {
      update['severity'] = input.severity;
    }

    if (input.description !== undefined) {
      update['description'] =
        input.description;
    }

    if (input.metadata !== undefined) {
      update['metadata'] =
        input.metadata;
    }

    if (input.acknowledgedBy !== undefined) {
      update['acknowledgedBy'] =
        input.acknowledgedBy;

      update['acknowledgedAt'] =
        serverTimestamp();
    }

    if (input.resolvedBy !== undefined) {
      update['resolvedBy'] =
        input.resolvedBy;

      update['resolvedAt'] =
        serverTimestamp();
    }

    await updateDoc(
      eventRef,
      update,
    );

    const updated =
      await this.getById(id);

    if (!updated) {
      throw new Error(
        `Operational event '${id}' could not be reloaded.`,
      );
    }

    return {
      ...updated,

      updatedAt: now,

      ...(input.acknowledgedBy
        ? {
            acknowledgedBy:
              input.acknowledgedBy,
            acknowledgedAt: now,
          }
        : {}),

      ...(input.resolvedBy
        ? {
            resolvedBy:
              input.resolvedBy,
            resolvedAt: now,
          }
        : {}),
    };
  }

  async delete(
    id: string,
  ): Promise<void> {
    const eventRef = doc(
      firestore,
      this.collectionName,
      id,
    );

    await deleteDoc(eventRef);
  }

  /**
   * Convert a Firestore document into the domain model.
   *
   * Firebase Timestamp objects never leave this adapter.
   */
  private mapDocument(
    id: string,
    data: Record<string, unknown>,
  ): OperationalEvent {
    return {
      id,

      type:
        data['type'] as OperationalEventType,

      severity:
        data['severity'] as OperationalEventSeverity,

      status:
        data['status'] as OperationalEventStatus,

      source:
        data['source'] as OperationalEventSource,

      title:
        String(data['title'] ?? ''),

      description:
        this.stringValue(data['description']),

      feature:
        this.stringValue(data['feature']),

      service:
        this.stringValue(data['service']),

      operation:
        this.stringValue(data['operation']),

      userId:
        this.stringValue(data['userId']),

      correlationId:
        this.stringValue(
          data['correlationId'],
        ),

      errorCode:
        this.stringValue(data['errorCode']),

      errorMessage:
        this.stringValue(
          data['errorMessage'],
        ),

      metadata:
        this.recordValue(
          data['metadata'],
        ),

      occurrenceCount:
        typeof data['occurrenceCount'] ===
        'number'
          ? data['occurrenceCount']
          : 1,

      createdAt:
        this.timestampToIso(
          data['createdAt'],
        ),

      updatedAt:
        this.timestampToIso(
          data['updatedAt'],
        ),

      acknowledgedAt:
        this.optionalTimestampToIso(
          data['acknowledgedAt'],
        ),

      resolvedAt:
        this.optionalTimestampToIso(
          data['resolvedAt'],
        ),

      acknowledgedBy:
        this.stringValue(
          data['acknowledgedBy'],
        ),

      resolvedBy:
        this.stringValue(
          data['resolvedBy'],
        ),
    };
  }

  private stringValue(
    value: unknown,
  ): string | undefined {
    return typeof value === 'string'
      ? value
      : undefined;
  }

  private recordValue(
    value: unknown,
  ): Record<string, unknown> | undefined {
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value)
    ) {
      return undefined;
    }

    return value as Record<
      string,
      unknown
    >;
  }

  private timestampToIso(
    value: unknown,
  ): string {
    if (
      value &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof (
        value as {
          toDate: unknown;
        }
      ).toDate === 'function'
    ) {
      return (
        value as {
          toDate: () => Date;
        }
      ).toDate().toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'string') {
      return value;
    }

    return new Date().toISOString();
  }

  private optionalTimestampToIso(
    value: unknown,
  ): string | undefined {
    if (value == null) {
      return undefined;
    }

    return this.timestampToIso(value);
  }
}
