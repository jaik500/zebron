import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { APPLICATION_DEFINITIONS } from '../../src/app/core/registries/application.registry';
import {
  catalogApplications,
  catalogKnowledgeKey,
  killSwitchDependencies,
} from '../../src/app/core/registries/application-catalog';
import { CONFIGURATION_APPLICATIONS } from '../../src/app/core/registries/configuration-application.registry';
import { KNOWLEDGE_CONFIGURATION } from '../../src/app/core/config/knowledge.config';
import { CONFIGURATION_FEATURES } from '../../src/app/features/admin/pages/configuration/configuration-feature.registry';

/**
 * The application registry is the one list of applications
 * (see application-catalog.ts). These checks catch lists that drift.
 */
const root = resolve(__dirname, '../..');
const enabledKeys = catalogApplications().map((application) => application.key);
const allKeys = APPLICATION_DEFINITIONS.map((application) => application.key);

describe('application lists', () => {
  it('builds the Settings filter from every enabled application', () => {
    expect(CONFIGURATION_APPLICATIONS.map((application) => application.key)).toEqual(enabledKeys);
  });

  it('lists every enabled application except Core in the Knowledge Center', () => {
    const keys = KNOWLEDGE_CONFIGURATION.applications.map((application) => application.key);
    for (const key of enabledKeys.filter((key) => key !== 'core')) {
      expect(keys).toContain(catalogKnowledgeKey(key));
    }
    expect(keys).toContain('platform');
  });

  it('only depends on applications that exist', () => {
    for (const application of catalogApplications()) {
      for (const dependency of killSwitchDependencies(application)) {
        expect(allKeys, `${application.key} depends on ${dependency}`).toContain(dependency);
      }
    }
  });

  it('groups every Settings card under a registry application', () => {
    for (const card of CONFIGURATION_FEATURES) {
      expect(allKeys, card.key).toContain(card.applicationKey);
    }
  });

  it('covers every enabled application in the inventory generator', () => {
    const script = readFileSync(resolve(root, 'scripts/generate-application-inventory.mjs'), 'utf8');
    const block = script.slice(script.indexOf('const APPLICATIONS = {'), script.indexOf('};', script.indexOf('const APPLICATIONS = {')));
    const keys = new Set(
      [...block.matchAll(/^ {2}'?([a-z-]+)'?: \{/gm)].map((match) => match[1]),
    );
    const registryKeys = new Set(
      [...block.matchAll(/registryKey: '([a-z-]+)'/g)].map((match) => match[1]),
    );
    for (const key of enabledKeys) {
      expect(keys.has(key) || registryKeys.has(key), `inventory is missing ${key}`).toBe(true);
    }
  });

  it('names every application in the server emails', () => {
    const source = readFileSync(resolve(root, 'functions/src/organization-contracts.ts'), 'utf8');
    const start = source.indexOf('function applicationName(');
    const block = source.slice(start, source.indexOf('};', start));
    for (const key of allKeys) {
      expect(block, `server name list is missing ${key}`).toContain(`"${key}"`);
    }
  });
});
