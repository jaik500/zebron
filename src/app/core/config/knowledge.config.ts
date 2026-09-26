import {
  KnowledgeAudience,
  KnowledgeContentType,
} from '../models/knowledge-article.model';

export interface KnowledgeApplicationDefinition {
  key: string;
  name: string;
  description: string;
}

export interface KnowledgeConfiguration {
  enabled: boolean;

  /**
   * Applications currently participating in the
   * Knowledge Platform.
   */
  applications: KnowledgeApplicationDefinition[];

  /**
   * Content types supported by the platform.
   */
  contentTypes: KnowledgeContentType[];

  /**
   * Supported audiences.
   */
  audiences: KnowledgeAudience[];

  /**
   * Default number of articles shown in lists.
   */
  defaultPageSize: number;

  /**
   * Maximum article content size in characters.
   */
  maxContentLength: number;

  /**
   * Whether PDF generation/download is enabled.
   */
  pdfDownloadsEnabled: boolean;
}

export const KNOWLEDGE_CONFIGURATION: KnowledgeConfiguration = {
  enabled: true,

  applications: [
    {
      key: 'platform',
      name: 'Zebron Platform',
      description:
        'Platform-wide documentation, administration, and operational guidance.',
    },
    {
      key: 'community',
      name: 'Community',
      description:
        'Documentation and guidance for the Community application.',
    },
    {
      key: 'resources',
      name: 'Resources',
      description:
        'Documentation and guidance for the Resources application.',
    },
    {
      key: 'jobs',
      name: 'Jobs',
      description:
        'Documentation and guidance for the Jobs application.',
    },
    {
      key: 'test-center',
      name: 'Test Center',
      description:
        'Documentation and learning material for the Test Center.',
    },
    {
      key: 'tax-pay',
      name: 'Tax & Pay',
      description:
        'Documentation and administration guidance for Tax & Pay.',
    },
  ],

  contentTypes: [
    'documentation',
    'guide',
    'how-to',
    'troubleshooting',
    'reference',
    'faq',
    'learning',
  ],

  audiences: [
    'user',
    'admin',
    'support',
    'developer',
    'all',
  ],

  defaultPageSize: 20,

  maxContentLength: 250_000,

  pdfDownloadsEnabled: true,
};