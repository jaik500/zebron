import {
  Injectable,
  inject,
} from '@angular/core';

import {
  ApplicationDependency,
  ApplicationDependencyType,
  ApplicationImplementationManifest,
} from '../models/application-implementation.model';

import {
  ApplicationValidationIssue,
  ApplicationValidationResult,
  ApplicationValidationStatus,
  ApplicationValidationSummary,
} from '../models/application-readiness-validation.model';

import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class ApplicationReadinessValidatorService {
  private readonly logger = inject(LoggerService);

  async validate(
    manifests: ApplicationImplementationManifest[],
  ): Promise<ApplicationValidationResult[]> {
    const validatedAt =
      new Date().toISOString();

    const results: ApplicationValidationResult[] = [];

    for (const manifest of manifests) {
      results.push(
        this.validateApplication(
          manifest,
          validatedAt,
        ),
      );
    }

    this.logger.info(
      'ApplicationReadinessValidatorService',
      `Validated ${results.length} application manifests.`,
    );

    return results;
  }

  createSummary(
    results: ApplicationValidationResult[],
  ): ApplicationValidationSummary {
    return {
      applications: results.length,

      passed: results.filter(
        (result) =>
          result.status === 'passed',
      ).length,

      warnings: results.filter(
        (result) =>
          result.status === 'warning',
      ).length,

      failed: results.filter(
        (result) =>
          result.status === 'failed',
      ).length,

      checked: results.reduce(
        (total, result) =>
          total + result.checked,
        0,
      ),

      issues: results.reduce(
        (total, result) =>
          total +
          result.issues.length,
        0,
      ),

      validatedAt:
        results.length > 0
          ? results[0].validatedAt
          : null,
    };
  }

  private validateApplication(
    manifest: ApplicationImplementationManifest,
    validatedAt: string,
  ): ApplicationValidationResult {
    const issues: ApplicationValidationIssue[] = [];

    for (const dependency of manifest.dependencies) {
      issues.push(
        ...this.validateDependency(
          manifest,
          dependency,
        ),
      );
    }

    const checked =
      manifest.dependencies.length;

    const failed =
      issues.filter(
        (issue) =>
          issue.status === 'failed',
      ).length;

    const warnings =
      issues.filter(
        (issue) =>
          issue.status === 'warning',
      ).length;

    const passed =
      Math.max(
        0,
        checked -
          failed -
          warnings,
      );

    let status: ApplicationValidationStatus =
      'passed';

    if (failed > 0) {
      status = 'failed';
    } else if (warnings > 0) {
      status = 'warning';
    }

    return {
      applicationKey:
        manifest.applicationKey,

      applicationName:
        manifest.applicationName,

      status,

      checked,
      passed,
      warnings,
      failed,

      issues,

      validatedAt,
    };
  }

  private validateDependency(
    manifest: ApplicationImplementationManifest,
    dependency: ApplicationDependency,
  ): ApplicationValidationIssue[] {
    const issues: ApplicationValidationIssue[] =
      [];

    if (
      !dependency.id ||
      dependency.id.trim().length === 0
    ) {
      issues.push({
        dependencyId:
          dependency.id || 'unknown',
        applicationKey:
          manifest.applicationKey,
        status: 'failed',
        message:
          'Dependency does not have a valid identifier.',
        path: dependency.path,
      });

      return issues;
    }

    if (
      dependency.applicationKey !==
      manifest.applicationKey
    ) {
      issues.push({
        dependencyId: dependency.id,
        applicationKey:
          manifest.applicationKey,
        status: 'failed',
        message:
          'Dependency application key does not match its application manifest.',
        path: dependency.path,
      });
    }

    if (
      !dependency.name ||
      dependency.name.trim().length === 0
    ) {
      issues.push({
        dependencyId: dependency.id,
        applicationKey:
          manifest.applicationKey,
        status: 'failed',
        message:
          'Dependency does not have a name.',
        path: dependency.path,
      });
    }

    if (
      !this.isSupportedDependencyType(
        dependency.type,
      )
    ) {
      issues.push({
        dependencyId: dependency.id,
        applicationKey:
          manifest.applicationKey,
        status: 'failed',
        message:
          `Unsupported dependency type: ${dependency.type}.`,
        path: dependency.path,
      });
    }

    /*
     * File-backed dependencies should have a path.
     */
    if (
      this.requiresPath(dependency.type) &&
      !dependency.path
    ) {
      issues.push({
        dependencyId: dependency.id,
        applicationKey:
          manifest.applicationKey,
        status: 'failed',
        message:
          'File-backed dependency does not have a source path.',
      });
    }

    /*
     * Logical infrastructure dependencies do not
     * require a source path.
     */
    if (
      !this.requiresPath(dependency.type) &&
      !dependency.path
    ) {
      if (
        !this.hasLogicalIdentity(
          dependency,
        )
      ) {
        issues.push({
          dependencyId: dependency.id,
          applicationKey:
            manifest.applicationKey,
          status: 'warning',
          message:
            'Logical dependency does not contain enough metadata to perform runtime validation.',
        });
      }
    }

    /*
     * Unknown status is not treated as a failure yet.
     * Runtime validators will populate this later.
     */
    if (
      dependency.status === 'unknown'
    ) {
      issues.push({
        dependencyId: dependency.id,
        applicationKey:
          manifest.applicationKey,
        status: 'warning',
        message:
          'Dependency has not yet been validated at runtime.',
        path: dependency.path,
      });
    }

    return issues;
  }

  private requiresPath(
    type: ApplicationDependencyType,
  ): boolean {
    return [
      'page',
      'component',
      'service',
      'store',
      'model',
      'data',
      'repository',
      'adapter',
      'guard',
      'route',
    ].includes(type);
  }

  private hasLogicalIdentity(
    dependency: ApplicationDependency,
  ): boolean {
    return Boolean(
      dependency.name?.trim() ||
        dependency.metadata,
    );
  }

  private isSupportedDependencyType(
    type: ApplicationDependencyType,
  ): boolean {
    return [
      'page',
      'component',
      'service',
      'store',
      'model',
      'data',
      'repository',
      'adapter',
      'guard',
      'route',
      'firestore-collection',
      'firestore-index',
      'firestore-rule',
      'cloud-function',
      'external-service',
    ].includes(type);
  }
}