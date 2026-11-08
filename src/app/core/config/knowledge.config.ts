import {
  KnowledgeAudience,
  KnowledgeContentType,
} from '../models/knowledge-article.model';
import {
  catalogApplications,
  catalogKnowledgeKey,
} from '../registries/application-catalog';

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

  /*
   * Built from the application registry (see application-catalog.ts).
   * "platform" covers Zebron-wide articles. Keys are stored on articles,
   * so Jobs & Training keeps its older key "jobs".
   */
  applications: [
    {
      key: 'platform',
      name: 'Zebron Platform',
      description:
        'Platform-wide documentation, administration, and operational guidance.',
    },
    ...catalogApplications()
      .filter((application) => application.key !== 'core')
      .map((application) => ({
        key: catalogKnowledgeKey(application.key),
        name: application.name,
        description: `Documentation and guidance for ${application.name}.`,
      })),
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