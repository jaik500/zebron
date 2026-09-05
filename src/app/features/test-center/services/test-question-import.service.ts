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
   * Firestore supports a maximum of 500 writes per batch.
   *
   * Keep some headroom for future metadata writes.
   */
  private readonly batchSize = 400;

  // =========================================================
  // IMPORT QUESTION BANK
  // =========================================================

  /**
   * Import a question bank into a Test Center course.
   *
   * The caller supplies:
   *
   * 1. The selected course ID
   * 2. Topic definitions owned by the question bank
   * 3. Question records
   *
   * Existing topics are reused.
   *
   * Missing topics are created automatically.
   *
   * Questions are then imported and linked to the resolved
   * Firestore topic IDs.
   *
   * Question documents use deterministic IDs based on seedId,
   * making repeated imports safe.
   */
  async importQuestionBank(
    courseId: string,
    topicDefinitions: readonly TestQuestionImportTopic[],
    records: readonly TestQuestionImportRecord[],
  ): Promise<TestQuestionImportResult> {
    const result: TestQuestionImportResult = {
      total: records.length,
      created: 0,
      updated: 0,
      topicsCreated: 0,
      topicsExisting: 0,
      failed: 0,
      errors: [],
    };

    // -------------------------------------------------------
    // Validate course
    // -------------------------------------------------------

    if (!courseId) {
      throw new Error(
        'A Test Center course is required before importing questions.',
      );
    }

    // -------------------------------------------------------
    // Validate question bank
    // -------------------------------------------------------

    if (records.length === 0) {
      return result;
    }

    const validationErrors =
      this.validateQuestionBank(records);

    if (validationErrors.length > 0) {
      throw new Error(
        [
          'Question bank validation failed:',
          '',
          ...validationErrors,
        ].join('\n'),
      );
    }

    // -------------------------------------------------------
    // Validate topic definitions
    // -------------------------------------------------------

    const topicValidationErrors =
      this.validateTopicDefinitions(
        topicDefinitions,
        records,
      );

    if (topicValidationErrors.length > 0) {
      throw new Error(
        [
          'Question-bank topic validation failed:',
          '',
          ...topicValidationErrors,
        ].join('\n'),
      );
    }

    // -------------------------------------------------------
    // Load existing course topics
    // -------------------------------------------------------

    const existingTopics =
      await this.loadCourseTopics(
        courseId,
      );

    // -------------------------------------------------------
    // Resolve or create topics
    // -------------------------------------------------------

    const resolvedTopics =
      await this.resolveOrCreateTopics(
        courseId,
        existingTopics,
        topicDefinitions,
        records,
        result,
      );

    // -------------------------------------------------------
    // Load existing questions
    // -------------------------------------------------------

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
            'courseId',
            '==',
            courseId,
          ),
        ),
      );

    const existingIds =
      new Set<string>(
        existingSnapshot.docs.map(
          (document) =>
            document.id,
        ),
      );

    // =======================================================
    // IMPORT QUESTIONS
    // =======================================================

    for (
      let start = 0;
      start < records.length;
      start += this.batchSize
    ) {
      const chunk =
        records.slice(
          start,
          start + this.batchSize,
        );

      const batch =
        writeBatch(firestore);

      for (const record of chunk) {
        const topic =
          resolvedTopics.get(
            record.topicKey,
          );

        if (!topic) {
          result.failed++;

          result.errors.push(
            `${record.seedId}: topic "${record.topicKey}" could not be resolved.`,
          );

          continue;
        }

        // ---------------------------------------------------
        // Deterministic question ID
        // ---------------------------------------------------

        const questionId =
          this.normalizeQuestionKey(
            record.seedId,
          );

        const questionReference =
          doc(
            firestore,
            'testQuestions',
            questionId,
          );

        const alreadyExists =
          existingIds.has(
            questionId,
          );

        // ---------------------------------------------------
        // Question document
        // ---------------------------------------------------

        const payload = {
          courseId,

          topicId:
            topic.id,

          question:
            record.question.trim(),

          type:
            record.type,

          options:
            record.options.map(
              (option) => ({
                id:
                  option.id.trim(),

                text:
                  option.text.trim(),
              }),
            ),

          correctAnswer:
            record.correctAnswer.trim(),

          explanation:
            record.explanation?.trim() ||
            null,

          hint:
            record.hint?.trim() ||
            null,

          difficulty:
            record.difficulty,

          tags:
            [
              ...new Set(
                record.tags
                  .map(
                    (tag) =>
                      tag
                        .trim()
                        .toLowerCase(),
                  )
                  .filter(Boolean),
              ),
            ],

          sourceType:
            record.sourceType,

          sourceReference:
            record.sourceReference?.trim() ||
            null,

          status:
            record.status,

          /**
           * Original question-bank identifier.
           */
          importKey:
            record.seedId,

          /**
           * Original semantic topic key.
           */
          importTopicKey:
            record.topicKey,

          updatedAt:
            serverTimestamp(),

          ...(alreadyExists
            ? {}
            : {
                createdAt:
                  serverTimestamp(),
              }),
        };

        batch.set(
          questionReference,
          payload,
          {
            merge: true,
          },
        );

        if (alreadyExists) {
          result.updated++;
        } else {
          result.created++;
        }
      }

      await batch.commit();
    }

    // -------------------------------------------------------
    // Refresh cached question counts
    // -------------------------------------------------------

    const refreshedTopics =
      await this.loadCourseTopics(
        courseId,
      );

    await this.refreshQuestionCounts(
      courseId,
      refreshedTopics,
    );

    return result;
  }

  // =========================================================
  // RESOLVE / CREATE TOPICS
  // =========================================================

  /**
   * Resolve existing topics first.
   *
   * If a question-bank topic cannot be matched, create it
   * using the metadata supplied by the question bank.
   */
  private async resolveOrCreateTopics(
    courseId: string,
    existingTopics: TestTopic[],
    topicDefinitions: readonly TestQuestionImportTopic[],
    records: readonly TestQuestionImportRecord[],
    result: TestQuestionImportResult,
  ): Promise<Map<string, TestTopic>> {
    const resolved =
      new Map<string, TestTopic>();

    const topicsByKey =
      new Map<string, TestQuestionImportTopic>();

    for (
      const definition of topicDefinitions
    ) {
      topicsByKey.set(
        definition.key,
        definition,
      );
    }

    // -------------------------------------------------------
    // Determine which topic keys are actually used
    // -------------------------------------------------------

    const usedTopicKeys =
      [
        ...new Set(
          records.map(
            (record) =>
              record.topicKey,
          ),
        ),
      ];

    // -------------------------------------------------------
    // Find highest existing sort order
    // -------------------------------------------------------

    let nextSortOrder =
      existingTopics.reduce(
        (
          max,
          topic,
        ) =>
          Math.max(
            max,
            Number.isFinite(
              topic.sortOrder,
            )
              ? topic.sortOrder
              : 0,
          ),
        0,
      ) + 1;

    // -------------------------------------------------------
    // Resolve each bank topic
    // -------------------------------------------------------

    for (
      const topicKey of usedTopicKeys
    ) {
      const definition =
        topicsByKey.get(
          topicKey,
        );

      if (!definition) {
        result.failed++;

        result.errors.push(
          `Topic "${topicKey}" is used by the question bank but has no topic definition.`,
        );

        continue;
      }

      // -----------------------------------------------------
      // Look for an existing topic
      // -----------------------------------------------------

      const existing =
        this.findMatchingTopic(
          existingTopics,
          definition,
        );

      if (existing) {
        resolved.set(
          topicKey,
          existing,
        );

        result.topicsExisting++;

        continue;
      }

      // -----------------------------------------------------
      // Create missing topic
      // -----------------------------------------------------

      const topicReference =
        await addDoc(
          collection(
            firestore,
            'testTopics',
          ),
          {
            courseId,

            name:
              definition.name.trim(),

            slug:
              this.normalizeSlug(
                definition.slug,
              ),

            description:
              definition.description?.trim() ||
              null,

            sortOrder:
              nextSortOrder++,

            questionCount:
              0,

            active:
              true,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
        );

   const createdTopic =
  {
    id: topicReference.id,
    courseId,
    name: definition.name.trim(),
    slug: this.normalizeSlug(definition.slug),
    description: definition.description?.trim(),
    sortOrder: nextSortOrder - 1,
    questionCount: 0,
    active: true,
  } as TestTopic;

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

  // =========================================================
  // EXISTING TOPIC MATCHING
  // =========================================================

  /**
   * Match a bank topic against an existing Firestore topic.
   *
   * Matching is deliberately based on semantic metadata,
   * never on Firestore document IDs.
   */
  private findMatchingTopic(
    topics: TestTopic[],
    definition: TestQuestionImportTopic,
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

        // Exact slug
        if (
          topicSlug === slug
        ) {
          return true;
        }

        // Exact name
        if (
          topicName === name
        ) {
          return true;
        }

        // Bank key equals slug/name
        if (
          topicSlug === key ||
          topicName === key
        ) {
          return true;
        }

        // Semantic containment
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

  // =========================================================
  // LOAD COURSE TOPICS
  // =========================================================

  private async loadCourseTopics(
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
            id:
              document.id,

            ...document.data(),
          }) as TestTopic,
      )
      .sort(
        (a, b) =>
          a.sortOrder -
          b.sortOrder,
      );
  }

  // =========================================================
  // VALIDATION
  // =========================================================

  private validateQuestionBank(
    records: readonly TestQuestionImportRecord[],
  ): string[] {
    const errors: string[] = [];

    const seedIds =
      new Set<string>();

    for (
      let index = 0;
      index < records.length;
      index++
    ) {
      const record =
        records[index];

      const label =
        record.seedId?.trim() ||
        `Question ${index + 1}`;

      // -----------------------------------------------------
      // seedId
      // -----------------------------------------------------

      if (
        !record.seedId?.trim()
      ) {
        errors.push(
          `Question ${index + 1}: seedId is required.`,
        );
      } else if (
        seedIds.has(
          record.seedId.trim(),
        )
      ) {
        errors.push(
          `${label}: duplicate seedId.`,
        );
      } else {
        seedIds.add(
          record.seedId.trim(),
        );
      }

      // -----------------------------------------------------
      // topicKey
      // -----------------------------------------------------

      if (
        !record.topicKey?.trim()
      ) {
        errors.push(
          `${label}: topicKey is required.`,
        );
      }

      // -----------------------------------------------------
      // question
      // -----------------------------------------------------

      if (
        !record.question?.trim()
      ) {
        errors.push(
          `${label}: question text is required.`,
        );
      }

      // -----------------------------------------------------
      // type
      // -----------------------------------------------------

      if (
        record.type !==
          'multiple-choice' &&
        record.type !==
          'true-false'
      ) {
        errors.push(
          `${label}: invalid question type.`,
        );
      }

      // -----------------------------------------------------
      // options
      // -----------------------------------------------------

      if (
        !Array.isArray(
          record.options,
        ) ||
        record.options.length < 2
      ) {
        errors.push(
          `${label}: at least two options are required.`,
        );
      } else {
        const optionIds =
          record.options.map(
            (option) =>
              option.id.trim(),
          );

        if (
          record.options.some(
            (option) =>
              !option.id?.trim() ||
              !option.text?.trim(),
          )
        ) {
          errors.push(
            `${label}: every option requires an ID and text.`,
          );
        }

        if (
          new Set(optionIds).size !==
          optionIds.length
        ) {
          errors.push(
            `${label}: option IDs must be unique.`,
          );
        }

        if (
          !optionIds.includes(
            record.correctAnswer?.trim(),
          )
        ) {
          errors.push(
            `${label}: correctAnswer does not match an option ID.`,
          );
        }
      }

      // -----------------------------------------------------
      // difficulty
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // source
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // status
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // tags
      // -----------------------------------------------------

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

  // =========================================================
  // TOPIC VALIDATION
  // =========================================================

  private validateTopicDefinitions(
    definitions: readonly TestQuestionImportTopic[],
    records: readonly TestQuestionImportRecord[],
  ): string[] {
    const errors: string[] = [];

    const definitionKeys =
      new Set<string>();

    for (
      const definition of definitions
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
      const topicKey of missingDefinitions
    ) {
      errors.push(
        `Question bank uses topic "${topicKey}" but no topic definition exists.`,
      );
    }

    return errors;
  }

  // =========================================================
  // QUESTION COUNTS
  // =========================================================

  private async refreshQuestionCounts(
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
      new Map<string, number>();

    for (
      const question
      of publishedQuestions
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

  // =========================================================
  // NORMALIZATION
  // =========================================================

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
}