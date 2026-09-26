import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  ApplicationDependency,
  ApplicationDependencyStatus,
  ApplicationImplementationManifest,
  ApplicationReadiness,
  ApplicationReadinessSummary,
} from '../models/application-implementation.model';

import {
  APPLICATION_IMPLEMENTATION_MANIFESTS,
} from '../config/application-implementation-manifests';

import {
  GENERATED_APPLICATION_IMPLEMENTATION_MANIFESTS,
} from '../config/generated-application-inventory';

import { LoggerService } from './logger.service';

import { ApplicationReadinessValidatorService } from './application-readiness-validator.service';

import {
  ApplicationValidationResult,
  ApplicationValidationSummary,
} from '../models/application-readiness-validation.model';

@Injectable({
  providedIn: 'root',
})
export class ApplicationReadinessService {
  private readonly logger = inject(
    LoggerService,
  );

  private readonly validator =
    inject(
      ApplicationReadinessValidatorService,
    );

  private readonly manifestsState =
    signal<ApplicationImplementationManifest[]>(
      this.mergeManifests(
        APPLICATION_IMPLEMENTATION_MANIFESTS,
        GENERATED_APPLICATION_IMPLEMENTATION_MANIFESTS,
      ),
    );

  private readonly validationState =
    signal<ApplicationValidationResult[]>(
      [],
    );

  readonly manifests = computed(() =>
    this.manifestsState(),
  );

  readonly applications = computed(() =>
    this.manifestsState().map(
      (manifest) => ({
        applicationKey:
          manifest.applicationKey,
        applicationName:
          manifest.applicationName,
        description:
          manifest.description,
      }),
    ),
  );

  readonly validationResults =
    computed(() =>
      this.validationState(),
    );

  readonly validationSummary =
    computed<ApplicationValidationSummary>(
      () =>
        this.validator.createSummary(
          this.validationState(),
        ),
    );

  getManifest(
    applicationKey: string,
  ): ApplicationImplementationManifest | null {
    return (
      this.manifestsState().find(
        (manifest) =>
          manifest.applicationKey ===
          applicationKey,
      ) ?? null
    );
  }

  getReadiness(
    applicationKey: string,
  ): ApplicationReadiness | null {
    const manifest =
      this.getManifest(
        applicationKey,
      );

    if (!manifest) {
      return null;
    }

    return {
      manifest,
      dependencies:
        manifest.dependencies,
      summary:
        this.createSummary(
          manifest,
        ),
    };
  }

  getAllReadiness():
    ApplicationReadiness[] {
    return this.manifestsState().map(
      (manifest) => ({
        manifest,
        dependencies:
          manifest.dependencies,
        summary:
          this.createSummary(
            manifest,
          ),
      }),
    );
  }

  async validate(): Promise<
    ApplicationValidationResult[]
  > {
    const results =
      await this.validator.validate(
        this.manifestsState(),
      );

    this.validationState.set(
      results,
    );

    /*
     * Apply validation outcomes to
     * dependency readiness.
     */
    this.applyValidationResults(
      results,
    );

    this.logger.info(
      'ApplicationReadinessService',
      'Application readiness validation completed.',
    );

    return results;
  }

  markDetected(
    applicationKey: string,
    dependencyId: string,
  ): void {
    this.setDependencyStatus(
      applicationKey,
      dependencyId,
      'detected',
    );
  }

  markMissing(
    applicationKey: string,
    dependencyId: string,
  ): void {
    this.setDependencyStatus(
      applicationKey,
      dependencyId,
      'missing',
    );
  }

  markWarning(
    applicationKey: string,
    dependencyId: string,
  ): void {
    this.setDependencyStatus(
      applicationKey,
      dependencyId,
      'warning',
    );
  }

  markError(
    applicationKey: string,
    dependencyId: string,
  ): void {
    this.setDependencyStatus(
      applicationKey,
      dependencyId,
      'error',
    );
  }

  setDependencyStatus(
    applicationKey: string,
    dependencyId: string,
    status: ApplicationDependencyStatus,
  ): void {
    this.manifestsState.update(
      (manifests) =>
        manifests.map(
          (manifest) => {
            if (
              manifest.applicationKey !==
              applicationKey
            ) {
              return manifest;
            }

            return {
              ...manifest,

              dependencies:
                manifest.dependencies.map(
                  (dependency) =>
                    dependency.id ===
                    dependencyId
                      ? {
                          ...dependency,
                          status,
                        }
                      : dependency,
                ),
            };
          },
        ),
    );
  }

  private applyValidationResults(
    results: ApplicationValidationResult[],
  ): void {
    for (const result of results) {
      for (const issue of result.issues) {
        if (issue.status === 'failed') {
          this.setDependencyStatus(
            result.applicationKey,
            issue.dependencyId,
            'error',
          );

          continue;
        }

        if (
          issue.status === 'warning'
        ) {
          this.setDependencyStatus(
            result.applicationKey,
            issue.dependencyId,
            'warning',
          );
        }
      }
    }
  }

  private createSummary(
    manifest: ApplicationImplementationManifest,
  ): ApplicationReadinessSummary {
    const dependencies =
      manifest.dependencies;

    const total =
      dependencies.length;

    const discovered =
      dependencies.filter(
        (dependency) =>
          !!dependency.path,
      ).length;

    const declared =
      dependencies.filter(
        (dependency) =>
          !dependency.path,
      ).length;

    const detected =
      dependencies.filter(
        (dependency) =>
          dependency.status ===
          'detected',
      ).length;

    const missing =
      dependencies.filter(
        (dependency) =>
          dependency.status ===
          'missing',
      ).length;

    const warnings =
      dependencies.filter(
        (dependency) =>
          dependency.status ===
          'warning',
      ).length;

    const errors =
      dependencies.filter(
        (dependency) =>
          dependency.status ===
          'error',
      ).length;

    const unknown =
      dependencies.filter(
        (dependency) =>
          dependency.status ===
          'unknown',
      ).length;

    const required =
      dependencies.filter(
        (dependency) =>
          dependency.required,
      ).length;

    const requiredMissing =
      dependencies.filter(
        (dependency) =>
          dependency.required &&
          dependency.status ===
            'missing',
      ).length;

    const requiredErrors =
      dependencies.filter(
        (dependency) =>
          dependency.required &&
          dependency.status ===
            'error',
      ).length;

    return {
      applicationKey:
        manifest.applicationKey,

      applicationName:
        manifest.applicationName,

      total,
      discovered,
      declared,

      detected,
      missing,
      warnings,
      errors,
      unknown,

      required,
      requiredMissing,
      requiredErrors,

      operational:
        requiredMissing === 0 &&
        requiredErrors === 0,
    };
  }

  private mergeManifests(
    declared: ApplicationImplementationManifest[],
    generated: ApplicationImplementationManifest[],
  ): ApplicationImplementationManifest[] {
    const declaredByApplication =
      new Map<
        string,
        ApplicationImplementationManifest
      >();

    for (const manifest of declared) {
      declaredByApplication.set(
        manifest.applicationKey,
        structuredClone(manifest),
      );
    }

    return generated.map(
      (generatedManifest) => {
        const declaredManifest =
          declaredByApplication.get(
            generatedManifest.applicationKey,
          );

        if (!declaredManifest) {
          return structuredClone(
            generatedManifest,
          );
        }

        const mergedDependencies =
          generatedManifest.dependencies.map(
            (generatedDependency) => {
              const matchingDeclared =
                this.findMatchingDeclaredDependency(
                  generatedDependency,
                  declaredManifest.dependencies,
                );

              if (!matchingDeclared) {
                return generatedDependency;
              }

              return {
                ...generatedDependency,

                name:
                  matchingDeclared.name ||
                  generatedDependency.name,

                description:
                  matchingDeclared.description ??
                  generatedDependency.description,

                required:
                  matchingDeclared.required ??
                  generatedDependency.required,

                metadata: {
                  ...generatedDependency.metadata,
                  ...matchingDeclared.metadata,
                },
              };
            },
          );

        const logicalRequirements =
          declaredManifest.dependencies.filter(
            (dependency) =>
              !dependency.path &&
              this.isLogicalDependency(
                dependency,
              ),
          );

        return {
          ...generatedManifest,

          applicationName:
            declaredManifest.applicationName ||
            generatedManifest.applicationName,

          description:
            declaredManifest.description ??
            generatedManifest.description,

          dependencies: [
            ...mergedDependencies,
            ...logicalRequirements,
          ],
        };
      },
    );
  }

  private findMatchingDeclaredDependency(
    generated: ApplicationDependency,
    declared: ApplicationDependency[],
  ): ApplicationDependency | null {
    if (generated.path) {
      const pathMatch =
        declared.find(
          (dependency) =>
            dependency.path ===
            generated.path,
        );

      if (pathMatch) {
        return pathMatch;
      }
    }

    const generatedName =
      this.normalizeDependencyName(
        generated.name,
      );

    return (
      declared.find(
        (dependency) =>
          !dependency.path &&
          dependency.type ===
            generated.type &&
          this.normalizeDependencyName(
            dependency.name,
          ) === generatedName,
      ) ?? null
    );
  }

  private normalizeDependencyName(
    name: string,
  ): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\\/g, '/')
      .replace(/\.ts$/, '')
      .replace(
        /[^a-z0-9/.-]/g,
        '',
      );
  }

  private isLogicalDependency(
    dependency: ApplicationDependency,
  ): boolean {
    return [
      'firestore-collection',
      'firestore-index',
      'firestore-rule',
      'cloud-function',
      'external-service',
    ].includes(
      dependency.type,
    );
  }
}