export type ApplicationDependencyType =
  | 'page'
  | 'component'
  | 'service'
  | 'store'
  | 'model'
  | 'data'
  | 'repository'
  | 'adapter'
  | 'guard'
  | 'route'
  | 'firestore-collection'
  | 'firestore-index'
  | 'firestore-rule'
  | 'cloud-function'
  | 'external-service';

export type ApplicationDependencyStatus =
  | 'detected'
  | 'missing'
  | 'warning'
  | 'error'
  | 'unknown';

export interface ApplicationDependency {
  /**
   * Stable identifier for the dependency.
   */
  id: string;

  /**
   * Zebron application that owns this dependency.
   */
  applicationKey: string;

  /**
   * Human-readable dependency name.
   */
  name: string;

  /**
   * Relative source/configuration path when applicable.
   */
  path?: string;

  /**
   * Architectural type.
   */
  type: ApplicationDependencyType;

  /**
   * Whether this dependency is required
   * for the application to be considered operational.
   */
  required: boolean;

  /**
   * Current readiness status.
   */
  status: ApplicationDependencyStatus;

  /**
   * Optional explanation.
   */
  description?: string;

  /**
   * Optional dependency identifiers.
   */
  dependsOn?: string[];

  /**
   * Optional metadata.
   */
  metadata?: Record<string, unknown>;
}

export interface ApplicationImplementationManifest {
  /**
   * Stable application identifier.
   */
  applicationKey: string;

  /**
   * Human-readable application name.
   */
  applicationName: string;

  /**
   * Application description.
   */
  description?: string;

  /**
   * Implementation dependencies.
   */
  dependencies: ApplicationDependency[];
}

export interface ApplicationReadinessSummary {
  applicationKey: string;
  applicationName: string;

  /** Total canonical dependencies after reconciliation. */
  total: number;

  /** Dependencies discovered from the source/infrastructure inventory. */
  discovered: number;

  /** Logical requirements declared by the application architecture. */
  declared: number;

  detected: number;
  missing: number;
  warnings: number;
  errors: number;
  unknown: number;

  required: number;
  requiredMissing: number;
  requiredErrors: number;

  operational: boolean;
}

export interface ApplicationReadiness {
  manifest: ApplicationImplementationManifest;

  summary: ApplicationReadinessSummary;

  dependencies: ApplicationDependency[];
}