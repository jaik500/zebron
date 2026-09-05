import {
  TestQuestionImportRecord,
  TestQuestionImportTopic,
} from '../models/test-question-import.model';
import { CSA_QUESTION_BANK, CSA_QUESTION_BANK_TOPICS } from './csa-question-bank';
import {
  CYBERSECURITY_QUESTION_BANK,
  CYBERSECURITY_QUESTION_BANK_TOPICS,
} from './cybersecurity-question-bank';
/** * Describes an importable Test Center question bank. * * The registry keeps the admin UI independent from the * individual question-bank implementations. */ export interface TestQuestionBankDefinition {
  /** * Stable internal identifier. * * This should never be changed after the bank is used. */ readonly id: string;
  /** * Human-readable name displayed to administrators. */ readonly name: string;
  /** * Optional description displayed in the admin UI. */ readonly description?: string;
  /** * Topic definitions owned by the question bank. */ readonly topics: readonly TestQuestionImportTopic[];
  /** * Questions belonging to the question bank. */ readonly questions: readonly TestQuestionImportRecord[];
}
/** * Central registry of all built-in Test Center question banks. * * To add a new bank: * * 1. Create its question-bank data file. * 2. Import its topics and questions here. * 3. Add one entry to this array. * * The admin component does not need to be modified. */ export const TEST_QUESTION_BANKS: readonly TestQuestionBankDefinition[] =
  [
    {
      id: 'csa',
      name: 'CSA',
      description: 'CSA practice and assessment question bank.',
      topics: CSA_QUESTION_BANK_TOPICS,
      questions: CSA_QUESTION_BANK,
    },
    {
      id: 'cybersecurity',
      name: 'Cybersecurity',
      description: 'Cybersecurity fundamentals and security operations question bank.',
      topics: CYBERSECURITY_QUESTION_BANK_TOPICS,
      questions: CYBERSECURITY_QUESTION_BANK,
    },
  ];
