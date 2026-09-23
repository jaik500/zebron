import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import { TestTopic } from '../models/test-topic.model';

import {
  TestQuestionImportRecord,
  TestQuestionImportResult,
  TestQuestionImportTopic,
} from '../models/test-question-import.model';

@Injectable({
  providedIn: 'root',
})
export class TestQuestionImportService {
  /**
   * Firestore maximum is 500 writes per batch.
   *
   * Keep headroom for future metadata writes.
   */
  private readonly batchSize = 400;

  // ============================================================
  // IMPORT QUESTION BANK
  // ============================================================

  async importQuestionBank(
    organizationId: string,
    courseId: string,
    topicDefinitions:
      readonly TestQuestionImportTopic[],
    records:
      readonly TestQuestionImportRecord[],
  ): Promise<TestQuestionImportResult> {
    this.requireOrganizationId(
      organizationId,
    );

    if (!courseId?.trim()) {
      throw new Error(
        'A Test Center course is required before importing questions.',
      );
    }

    const result:
      TestQuestionImportResult = {
      total: records.length,
      created: 0,
      updated: 0,
      topicsCreated: 0,
      topicsExisting: 0,
      failed: 0,
      errors: [],
    };

    if (records.length === 0) {
      return result;
    }

    // ==========================================================
    // VALIDATE COURSE OWNERSHIP
    // ==========================================================

    await this.validateCourse(
      organizationId,
      courseId,
    );

    // ==========================================================
    // VALIDATE QUESTION BANK
    // ==========================================================

    const validationErrors =
      this.validateQuestionBank(
        records,
      );

    if (
      validationErrors.length > 0
    ) {
      throw new Error(
        [
          'Question bank validation failed:',
          '',
          ...validationErrors,
        ].join('\n'),
      );
    }

    // ==========================================================
    // VALIDATE TOPIC DEFINITIONS
    // ==========================================================

    const topicValidationErrors =
      this.validateTopicDefinitions(
        topicDefinitions,
        records,
      );

    if (
      topicValidationErrors.length > 0
    ) {
      throw new Error(
        [
          'Question-bank topic validation failed:',
          '',
          ...topicValidationErrors,
        ].join('\n'),
      );
    }

    // ==========================================================
    // LOAD EXISTING TOPICS
    // ==========================================================

    const existingTopics =
      await this.loadCourseTopics(
        organizationId,
        courseId,
      );

    // ==========================================================
    // RESOLVE / CREATE TOPICS
    // ==========================================================

    const resolvedTopics =
      await this.resolveOrCreateTopics(
        organizationId,
        courseId,
        existingTopics,
        topicDefinitions,
        records,
        result,
      );

    // ==========================================================
    // LOAD EXISTING QUESTIONS
    // ==========================================================

    const questionsCollection =
      collection(
        firestore,
        'testQuestions',
      );

    const existingSnapshot =
      await getDocs(
        query(
          questionsCollection,

          where(
            'organizationId',
            '==',
            organizationId,
          ),

          where(
            'courseId',
            '==',
            courseId,
          ),
        ),
      );

    const existingQuestions =
      new Map<
        string,
        string
      >();

    for (
      const document of
        existingSnapshot.docs
    ) {
      const data =
        document.data();

      const importKey =
        data['importKey'];

      if (
        typeof importKey ===
        'string' &&
        importKey.trim()
      ) {
        existingQuestions.set(
          this.normalizeQuestionKey(
            importKey,
          ),
          document.id,
        );
      }
    }

    // ==========================================================
    // BUILD QUESTION OPERATIONS
    // ==========================================================

    const operations: Array<{
      id: string;
      exists: boolean;
      payload: Record<string, unknown>;
    }> = [];

    for (
      const record of records
    ) {
      try {
        const topic =
          resolvedTopics.get(
            record.topicKey,
          );

        if (!topic) {
          throw new Error(
            `Topic "${record.topicKey}" could not be resolved.`,
          );
        }

        const importKey =
          this.normalizeQuestionKey(
            record.seedId,
          );

        const existingId =
          existingQuestions.get(
            importKey,
          );

        const questionId =
          existingId ??
          importKey;

        const payload:
          Record<string, unknown> = {
          organizationId,

          courseId,

          topicId:
            topic.id,

          question:
            record.question.trim(),

          type:
            record.type,

          options:
            record.options,

          correctAnswer:
            record.correctAnswer,

          explanation:
            record.explanation?.trim() ||
            null,

          hint:
            record.hint?.trim() ||
            null,

          difficulty:
            record.difficulty,

          tags:
            record.tags ?? [],

          sourceType:
            record.sourceType,

          sourceReference:
            record.sourceReference?.trim() ||
            null,

          status:
            record.status,

          importKey,

          importTopicKey:
            record.topicKey,

          updatedAt:
            serverTimestamp(),
        };

        if (!existingId) {
          payload['createdAt'] =
            serverTimestamp();
        }

        operations.push({
          id: questionId,
          exists: Boolean(
            existingId,
          ),
          payload,
        });
      } catch (error) {
        result.failed++;

        result.errors.push(
          `Question "${record.seedId}": ${
            this.getErrorMessage(error)
          }`,
        );
      }
    }

    // ==========================================================
    // WRITE QUESTIONS IN BATCHES
    // ==========================================================

    for (
      let index = 0;
      index < operations.length;
      index += this.batchSize
    ) {
      const batch =
        writeBatch(firestore);

      const chunk =
        operations.slice(
          index,
          index + this.batchSize,
        );

      for (
        const operation of chunk
      ) {
        const reference =
          doc(
            firestore,
            'testQuestions',
            operation.id,
          );

        batch.set(
          reference,
          operation.payload,
          {
            merge: true,
          },
        );

        if (
          operation.exists
        ) {
          result.updated++;
        } else {
          result.created++;
        }
      }

      await batch.commit();
    }

    // ==========================================================
    // REFRESH COUNTS
    // ==========================================================

    const refreshedTopics =
      await this.loadCourseTopics(
        organizationId,
        courseId,
      );

    await this.refreshQuestionCounts(
      organizationId,
      courseId,
      refreshedTopics,
    );

    return result;
  }

  // ============================================================
  // LOAD COURSE TOPICS
  // ============================================================

  private async loadCourseTopics(
    organizationId: string,
    courseId: string,
  ): Promise<TestTopic[]> {
    const snapshot =
      await getDocs(
        query(
          collection(
            firestore,
            'testTopics',
          ),

          where(
            'organizationId',
            '==',
            organizationId,
          ),

          where(
            'courseId',
            '==',
            courseId,
          ),
        ),
      );

    return snapshot.docs
      .map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as TestTopic,
      )
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder,
      );
  }

  // ============================================================
  // RESOLVE OR CREATE TOPICS
  // ============================================================

  private async resolveOrCreateTopics(
    organizationId: string,
    courseId: string,
    existingTopics: TestTopic[],
    definitions:
      readonly TestQuestionImportTopic[],
    records:
      readonly TestQuestionImportRecord[],
    result: TestQuestionImportResult,
  ): Promise<
    Map<string, TestTopic>
  > {
    const resolved =
      new Map<string, TestTopic>();

    const definitionsByKey =
      new Map(
        definitions.map(
          (definition) => [
            definition.key,
            definition,
          ],
        ),
      );

    const requiredKeys =
      [
        ...new Set(
          records.map(
            (record) =>
              record.topicKey,
          ),
        ),
      ];

    let nextSortOrder =
      existingTopics.length > 0
        ? Math.max(
            ...existingTopics.map(
              (topic) =>
                topic.sortOrder,
            ),
          ) + 1
        : 0;

    for (
      const topicKey of
        requiredKeys
    ) {
      const definition =
        definitionsByKey.get(
          topicKey,
        );

      if (!definition) {
        throw new Error(
          `No topic definition exists for "${topicKey}".`,
        );
      }

      const matchingTopic =
        this.findMatchingTopic(
          existingTopics,
          definition,
        );

      if (matchingTopic) {
        resolved.set(
          topicKey,
          matchingTopic,
        );

        result.topicsExisting++;

        continue;
      }

      // --------------------------------------------------------
      // Create topic
      // --------------------------------------------------------

      const topicReference =
        await addDoc(
          collection(
            firestore,
            'testTopics',
          ),
          {
            organizationId,

            courseId,

            name:
              definition.name.trim(),

            slug:
              this.normalizeSlug(
                definition.slug,
              ),

            description:
              definition.description
                ?.trim() ||
              null,

            sortOrder:
              nextSortOrder,

            questionCount: 0,

            active: true,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
        );

      const createdTopic =
        {
          id:
            topicReference.id,

          organizationId,

          courseId,

          name:
            definition.name.trim(),

          slug:
            this.normalizeSlug(
              definition.slug,
            ),

          description:
            definition.description
              ?.trim(),

          sortOrder:
            nextSortOrder,

          questionCount: 0,

          active: true,
        } as TestTopic;

      nextSortOrder++;

      resolved.set(
        topicKey,
        createdTopic,
      );

      existingTopics.push(
        createdTopic,
      );

      result.topicsCreated++;
    }

    return resolved;
  }

  // ============================================================
  // MATCH EXISTING TOPIC
  // ============================================================

  private findMatchingTopic(
    topics: TestTopic[],
    definition:
      TestQuestionImportTopic,
  ): TestTopic | undefined {
    const key =
      this.normalizeTopicValue(
        definition.key,
      );

    const name =
      this.normalizeTopicValue(
        definition.name,
      );

    const slug =
      this.normalizeTopicValue(
        definition.slug,
      );

    return topics.find(
      (topic) => {
        const topicName =
          this.normalizeTopicValue(
            topic.name,
          );

        const topicSlug =
          this.normalizeTopicValue(
            topic.slug,
          );

        if (
          topicSlug === slug
        ) {
          return true;
        }

        if (
          topicName === name
        ) {
          return true;
        }

        if (
          topicSlug === key ||
          topicName === key
        ) {
          return true;
        }

        if (
          topicSlug.includes(key) ||
          topicName.includes(key)
        ) {
          return true;
        }

        return false;
      },
    );
  }

  // ============================================================
  // REFRESH QUESTION COUNTS
  // ============================================================

  private async refreshQuestionCounts(
    organizationId: string,
    courseId: string,
    topics: TestTopic[],
  ): Promise<void> {
    const snapshot =
      await getDocs(
        query(
          collection(
            firestore,
            'testQuestions',
          ),

          where(
            'organizationId',
            '==',
            organizationId,
          ),

          where(
            'courseId',
            '==',
            courseId,
          ),
        ),
      );

    const publishedQuestions =
      snapshot.docs.filter(
        (document) =>
          document.data()[
            'status'
          ] === 'published',
      );

    const countByTopic =
      new Map<
        string,
        number
      >();

    for (
      const question of
        publishedQuestions
    ) {
      const topicId =
        question.data()[
          'topicId'
        ] as string;

      countByTopic.set(
        topicId,
        (
          countByTopic.get(
            topicId,
          ) ?? 0
        ) + 1,
      );
    }

    const batch =
      writeBatch(firestore);

    for (
      const topic of topics
    ) {
      batch.update(
        doc(
          firestore,
          'testTopics',
          topic.id,
        ),
        {
          questionCount:
            countByTopic.get(
              topic.id,
            ) ?? 0,

          updatedAt:
            serverTimestamp(),
        },
      );
    }

    batch.update(
      doc(
        firestore,
        'testCourses',
        courseId,
      ),
      {
        questionCount:
          publishedQuestions.length,

        updatedAt:
          serverTimestamp(),
      },
    );

    await batch.commit();
  }

  // ============================================================
  // VALIDATE QUESTION BANK
  // ============================================================

  private validateQuestionBank(
    records:
      readonly TestQuestionImportRecord[],
  ): string[] {
    const errors: string[] = [];

    const seedIds =
      new Set<string>();

    for (
      const record of records
    ) {
      const label =
        `Question "${record.seedId}"`;

      if (
        !record.seedId?.trim()
      ) {
        errors.push(
          'A question is missing seedId.',
        );
      } else {
        const normalized =
          this.normalizeQuestionKey(
            record.seedId,
          );

        if (
          seedIds.has(normalized)
        ) {
          errors.push(
            `${label}: duplicate seedId.`,
          );
        }

        seedIds.add(normalized);
      }

      if (
        !record.topicKey?.trim()
      ) {
        errors.push(
          `${label}: topicKey is required.`,
        );
      }

      if (
        !record.question?.trim()
      ) {
        errors.push(
          `${label}: question text is required.`,
        );
      }

      if (
        !Array.isArray(
          record.options,
        ) ||
        record.options.length === 0
      ) {
        errors.push(
          `${label}: options are required.`,
        );
      }

      if (
        !record.correctAnswer?.trim()
      ) {
        errors.push(
          `${label}: correctAnswer is required.`,
        );
      }

      if (
        ![
          'easy',
          'medium',
          'hard',
        ].includes(
          record.difficulty,
        )
      ) {
        errors.push(
          `${label}: invalid difficulty.`,
        );
      }

      if (
        ![
          'multiple-choice',
          'true-false',
        ].includes(
          record.type,
        )
      ) {
        errors.push(
          `${label}: invalid question type.`,
        );
      }

      if (
        ![
          'original',
          'licensed',
        ].includes(
          record.sourceType,
        )
      ) {
        errors.push(
          `${label}: invalid sourceType.`,
        );
      }

      if (
        ![
          'draft',
          'published',
          'archived',
        ].includes(
          record.status,
        )
      ) {
        errors.push(
          `${label}: invalid status.`,
        );
      }

      if (
        !Array.isArray(
          record.tags,
        )
      ) {
        errors.push(
          `${label}: tags must be an array.`,
        );
      }
    }

    return errors;
  }

  // ============================================================
  // VALIDATE TOPIC DEFINITIONS
  // ============================================================

  private validateTopicDefinitions(
    definitions:
      readonly TestQuestionImportTopic[],
    records:
      readonly TestQuestionImportRecord[],
  ): string[] {
    const errors: string[] = [];

    const definitionKeys =
      new Set<string>();

    for (
      const definition of
        definitions
    ) {
      if (
        !definition.key?.trim()
      ) {
        errors.push(
          'A topic definition is missing its key.',
        );
      }

      if (
        !definition.name?.trim()
      ) {
        errors.push(
          `Topic "${definition.key}": name is required.`,
        );
      }

      if (
        !definition.slug?.trim()
      ) {
        errors.push(
          `Topic "${definition.key}": slug is required.`,
        );
      }

      if (
        definitionKeys.has(
          definition.key,
        )
      ) {
        errors.push(
          `Duplicate topic definition: "${definition.key}".`,
        );
      }

      definitionKeys.add(
        definition.key,
      );
    }

    const missingDefinitions =
      [
        ...new Set(
          records
            .map(
              (record) =>
                record.topicKey,
            )
            .filter(
              (topicKey) =>
                !definitionKeys.has(
                  topicKey,
                ),
            ),
        ),
      ];

    for (
      const topicKey of
        missingDefinitions
    ) {
      errors.push(
        `Question bank uses topic "${topicKey}" but no topic definition exists.`,
      );
    }

    return errors;
  }

  // ============================================================
  // VALIDATE COURSE
  // ============================================================

  private async validateCourse(
    organizationId: string,
    courseId: string,
  ): Promise<void> {
    const snapshot =
      await import(
        'firebase/firestore'
      ).then(({ getDoc }) =>
        getDoc(
          doc(
            firestore,
            'testCourses',
            courseId,
          ),
        ),
      );

    if (
      !snapshot.exists() ||
      snapshot.data()[
        'organizationId'
      ] !== organizationId
    ) {
      throw new Error(
        'The selected Test Center course does not belong to the current organization.',
      );
    }
  }

  // ============================================================
  // NORMALIZATION
  // ============================================================

  private normalizeTopicValue(
    value: string,
  ): string {
    return value
      .toLowerCase()
      .trim()
      .replace(
        /&/g,
        'and',
      )
      .replace(
        /[-_/]+/g,
        ' ',
      )
      .replace(
        /[^a-z0-9\s]+/g,
        ' ',
      )
      .replace(
        /\bmgmt\b/g,
        'management',
      )
      .replace(
        /\s+/g,
        ' ',
      )
      .trim();
  }

  private normalizeSlug(
    value: string,
  ): string {
    return value
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /-+/g,
        '-',
      )
      .replace(
        /^-|-$/g,
        '',
      );
  }

  private normalizeQuestionKey(
    value: string,
  ): string {
    const normalized =
      value
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9_-]/g,
          '-',
        )
        .replace(
          /-+/g,
          '-',
        )
        .replace(
          /^-|-$/g,
          '',
        );

    if (!normalized) {
      throw new Error(
        'A question-bank record contains an invalid seedId.',
      );
    }

    return normalized;
  }

  private requireOrganizationId(
    organizationId: string,
  ): void {
    if (!organizationId?.trim()) {
      throw new Error(
        'An organization is required for Test Center operations.',
      );
    }
  }

  private getErrorMessage(
    error: unknown,
  ): string {
    if (
      error instanceof Error
    ) {
      return error.message;
    }

    return String(error);
  }
}