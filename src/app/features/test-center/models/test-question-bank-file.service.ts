import { Injectable, inject } from '@angular/core';

import {
  TestQuestionImportRecord,
  TestQuestionImportResult,
  TestQuestionImportTopic,
} from '../models/test-question-import.model';

import { TestQuestionImportService } from '../services/test-question-import.service';

export interface TestQuestionBankFile {
  course?: {
    name?: string;
    slug?: string;
    description?: string;
    provider?: string;
    type?: string;
    certificationCode?: string;
    active?: boolean;
    questionCount?: number;
  };

  topics: TestQuestionImportTopic[];

  questions: TestQuestionImportRecord[];
}

export interface TestQuestionBankPreview {
  fileName: string;
  courseName: string;
  courseSlug: string;
  topicCount: number;
  questionCount: number;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class TestQuestionBankFileService {
  private readonly importService = inject(
    TestQuestionImportService,
  );

  /**
   * Read and parse a question-bank JSON file
   * entirely in the browser.
   */
  async parseFile(
    file: File,
  ): Promise<TestQuestionBankFile> {
    if (!file) {
      throw new Error('Please select a question-bank file.');
    }

    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith('.json')) {
      throw new Error(
        'Only JSON question-bank files are currently supported.',
      );
    }

    let rawText: string;

    try {
      rawText = await file.text();
    } catch {
      throw new Error(
        'The question-bank file could not be read.',
      );
    }

    if (!rawText.trim()) {
      throw new Error(
        'The question-bank file is empty.',
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error(
        'The selected file contains invalid JSON.',
      );
    }

    return this.validateFile(parsed);
  }

  /**
   * Generate a preview without writing anything
   * to Firestore.
   */
  createPreview(
    fileName: string,
    bank: TestQuestionBankFile,
  ): TestQuestionBankPreview {
    return {
      fileName,
      courseName:
        bank.course?.name?.trim() || 'Not specified',
      courseSlug:
        bank.course?.slug?.trim() || 'Not specified',
      topicCount: bank.topics.length,
      questionCount: bank.questions.length,
      publishedCount:
        bank.questions.filter(
          (question) =>
            question.status === 'published',
        ).length,
      draftCount:
        bank.questions.filter(
          (question) =>
            question.status === 'draft',
        ).length,
      archivedCount:
        bank.questions.filter(
          (question) =>
            question.status === 'archived',
        ).length,
    };
  }

  /**
   * Import the parsed question bank using the
   * existing Firestore import service.
   */
  async importFile(
    courseId: string,
    bank: TestQuestionBankFile,
  ): Promise<TestQuestionImportResult> {
    return this.importService.importQuestionBank(
      courseId,
      bank.topics,
      bank.questions,
    );
  }

  /**
   * Validate the browser-uploaded object before
   * anything reaches Firestore.
   */
  private validateFile(
    value: unknown,
  ): TestQuestionBankFile {
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value)
    ) {
      throw new Error(
        'The question-bank file must contain a JSON object.',
      );
    }

    const bank = value as Record<string, unknown>;

    if (!Array.isArray(bank['topics'])) {
      throw new Error(
        'The question-bank file must contain a "topics" array.',
      );
    }

    if (!Array.isArray(bank['questions'])) {
      throw new Error(
        'The question-bank file must contain a "questions" array.',
      );
    }

    if (bank['questions'].length === 0) {
      throw new Error(
        'The question-bank file contains no questions.',
      );
    }

    const topics =
      bank['topics'] as unknown[];

    const questions =
      bank['questions'] as unknown[];

    this.validateTopics(topics);
    this.validateQuestions(questions);

    return {
      course:
        typeof bank['course'] === 'object' &&
        bank['course'] !== null
          ? (bank['course'] as TestQuestionBankFile['course'])
          : undefined,

      topics:
        topics as TestQuestionImportTopic[],

      questions:
        questions as TestQuestionImportRecord[],
    };
  }

  private validateTopics(
    topics: unknown[],
  ): void {
    const keys = new Set<string>();

    topics.forEach((value, index) => {
      if (
        typeof value !== 'object' ||
        value === null
      ) {
        throw new Error(
          `Topic ${index + 1} is invalid.`,
        );
      }

      const topic =
        value as Record<string, unknown>;

      const key =
        typeof topic['key'] === 'string'
          ? topic['key'].trim()
          : '';

      const name =
        typeof topic['name'] === 'string'
          ? topic['name'].trim()
          : '';

      const slug =
        typeof topic['slug'] === 'string'
          ? topic['slug'].trim()
          : '';

      if (!key) {
        throw new Error(
          `Topic ${index + 1}: key is required.`,
        );
      }

      if (!name) {
        throw new Error(
          `Topic ${index + 1}: name is required.`,
        );
      }

      if (!slug) {
        throw new Error(
          `Topic ${index + 1}: slug is required.`,
        );
      }

      if (keys.has(key)) {
        throw new Error(
          `Duplicate topic key: ${key}`,
        );
      }

      keys.add(key);
    });
  }

  private validateQuestions(
    questions: unknown[],
  ): void {
    const seedIds = new Set<string>();

    questions.forEach((value, index) => {
      const number = index + 1;

      if (
        typeof value !== 'object' ||
        value === null
      ) {
        throw new Error(
          `Question ${number} is invalid.`,
        );
      }

      const question =
        value as Record<string, unknown>;

      const seedId =
        typeof question['seedId'] === 'string'
          ? question['seedId'].trim()
          : '';

      const topicKey =
        typeof question['topicKey'] === 'string'
          ? question['topicKey'].trim()
          : '';

      const questionText =
        typeof question['question'] === 'string'
          ? question['question'].trim()
          : '';

      const correctAnswer =
        typeof question['correctAnswer'] === 'string'
          ? question['correctAnswer'].trim()
          : '';

      const options =
        question['options'];

      if (!seedId) {
        throw new Error(
          `Question ${number}: seedId is required.`,
        );
      }

      if (seedIds.has(seedId)) {
        throw new Error(
          `Question ${number}: duplicate seedId "${seedId}".`,
        );
      }

      seedIds.add(seedId);

      if (!topicKey) {
        throw new Error(
          `${seedId}: topicKey is required.`,
        );
      }

      if (!questionText) {
        throw new Error(
          `${seedId}: question text is required.`,
        );
      }

      if (
        question['type'] !==
          'multiple-choice' &&
        question['type'] !==
          'true-false'
      ) {
        throw new Error(
          `${seedId}: unsupported question type.`,
        );
      }

      if (!Array.isArray(options)) {
        throw new Error(
          `${seedId}: options must be an array.`,
        );
      }

      if (options.length < 2) {
        throw new Error(
          `${seedId}: at least two answer options are required.`,
        );
      }

      const optionIds = new Set<string>();

      options.forEach(
        (optionValue, optionIndex) => {
          if (
            typeof optionValue !== 'object' ||
            optionValue === null
          ) {
            throw new Error(
              `${seedId}: option ${optionIndex + 1} is invalid.`,
            );
          }

          const option =
            optionValue as Record<string, unknown>;

          const id =
            typeof option['id'] === 'string'
              ? option['id'].trim()
              : '';

          const text =
            typeof option['text'] === 'string'
              ? option['text'].trim()
              : '';

          if (!id) {
            throw new Error(
              `${seedId}: option ${optionIndex + 1} requires an ID.`,
            );
          }

          if (!text) {
            throw new Error(
              `${seedId}: option ${id} requires text.`,
            );
          }

          if (optionIds.has(id)) {
            throw new Error(
              `${seedId}: duplicate option ID "${id}".`,
            );
          }

          optionIds.add(id);
        },
      );

      if (!correctAnswer) {
        throw new Error(
          `${seedId}: correctAnswer is required.`,
        );
      }

      if (!optionIds.has(correctAnswer)) {
        throw new Error(
          `${seedId}: correctAnswer "${correctAnswer}" does not match an option ID.`,
        );
      }

      if (
        question['difficulty'] !== 'easy' &&
        question['difficulty'] !== 'medium' &&
        question['difficulty'] !== 'hard'
      ) {
        throw new Error(
          `${seedId}: difficulty must be easy, medium, or hard.`,
        );
      }

      if (
        question['sourceType'] !== 'original' &&
        question['sourceType'] !== 'licensed'
      ) {
        throw new Error(
          `${seedId}: sourceType must be original or licensed.`,
        );
      }

      if (
        question['status'] !== 'draft' &&
        question['status'] !== 'published' &&
        question['status'] !== 'archived'
      ) {
        throw new Error(
          `${seedId}: status is invalid.`,
        );
      }
    });
  }
}