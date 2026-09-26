import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const APP_ROOT = path.join(ROOT, 'src', 'app');
const FEATURES_ROOT = path.join(APP_ROOT, 'features');
const CORE_ROOT = path.join(APP_ROOT, 'core');

const OUTPUT = path.join(
  APP_ROOT,
  'core',
  'config',
  'generated-application-inventory.ts',
);

const APPLICATIONS = {
  community: {
    name: 'Community',
    featureDirectory: 'community',
  },

  resources: {
    name: 'Resources',
    featureDirectory: 'resources',
  },

  jobs: {
    name: 'Jobs',
    featureDirectory: 'jobs',
  },

  'test-center': {
    name: 'Test Center',
    featureDirectory: 'test-center',
  },

  'tax-pay': {
    name: 'Tax & Pay',
    featureDirectory: 'tax-pay-calculator',
  },
};

const FILE_TYPE_RULES = [
  {
    suffixes: ['.component.ts'],
    type: 'component',
  },
  {
    suffixes: ['.service.ts'],
    type: 'service',
  },
  {
    suffixes: ['.store.ts'],
    type: 'store',
  },
  {
    suffixes: ['.model.ts'],
    type: 'model',
  },
  {
    suffixes: ['.repository.ts'],
    type: 'repository',
  },
  {
    suffixes: ['.guard.ts'],
    type: 'guard',
  },
  {
    suffixes: ['.data.ts'],
    type: 'data',
  },
];

function normalizePath(filePath) {
  return filePath
    .replaceAll(path.sep, '/')
    .replace(/^\/+/, '');
}

function relativeToRoot(filePath) {
  return normalizePath(
    path.relative(ROOT, filePath),
  );
}

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const results = [];

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    if (
      entry.name === 'node_modules' ||
      entry.name === '.git' ||
      entry.name === 'dist'
    ) {
      continue;
    }

    const fullPath = path.join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

function classifyFile(filePath) {
  const name = path.basename(filePath);

  for (const rule of FILE_TYPE_RULES) {
    if (
      rule.suffixes.some((suffix) =>
        name.endsWith(suffix),
      )
    ) {
      return rule.type;
    }
  }

  return null;
}

function dependencyId(
  applicationKey,
  type,
  relativePath,
) {
  const normalized = relativePath
    .replace(/^src\/app\/features\//, '')
    .replace(/\.[^.]+$/, '')
    .replaceAll('/', '.')
    .replaceAll('-', '_');

  return `${applicationKey}.${type}.${normalized}`;
}

function displayName(filePath) {
  return path
    .basename(filePath)
    .replace(/\.ts$/, '')
    .replace(/\.(component|service|store|model|repository|guard|data)$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function isApplicationFile(filePath) {
  const normalized = relativeToRoot(filePath);

  return normalized.startsWith(
    'src/app/features/',
  );
}

function createDependencies(
  applicationKey,
  application,
) {
  const featureRoot = path.join(
    FEATURES_ROOT,
    application.featureDirectory,
  );

  const files = walk(featureRoot);

  return files
    .map((filePath) => {
      const type = classifyFile(filePath);

      if (!type) {
        return null;
      }

      if (!isApplicationFile(filePath)) {
        return null;
      }

      const relativePath =
        relativeToRoot(filePath);

      return {
        id: dependencyId(
          applicationKey,
          type,
          relativePath,
        ),

        applicationKey,

        name: displayName(filePath),

        path: relativePath,

        type,

        required: true,

        status: 'detected',

        metadata: {
          generated: true,
          source: 'source-tree',
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      a.path.localeCompare(b.path),
    );
}

function createSpecialDependencies(
  applicationKey,
) {
  const dependencies = [];

  if (applicationKey === 'tax-pay') {
    const knownFiles = [
      'src/app/features/tax-pay-calculator/data/tax-pay-configuration-2026.ts',
      'src/app/features/tax-pay-calculator/data/maryland-local-tax-rates.data.ts',
      'src/app/features/tax-pay-calculator/data/us-counties.data.ts',
      'firestore.rules',
      'firestore.indexes.json',
    ];

    for (const file of knownFiles) {
      const exists = fs.existsSync(
        path.join(ROOT, file),
      );

      let type = 'data';

      if (file === 'firestore.rules') {
        type = 'firestore-rule';
      }

      if (file === 'firestore.indexes.json') {
        type = 'firestore-index';
      }

      dependencies.push({
        id: `${applicationKey}.${type}.${file
          .replaceAll('/', '.')
          .replaceAll('.', '_')}`,

        applicationKey,

        name: path.basename(file),

        path: file,

        type,

        required: true,

        status: exists
          ? 'detected'
          : 'missing',

        metadata: {
          generated: true,
          source: 'filesystem',
        },
      });
    }
  }

  return dependencies;
}

function createManifest(
  applicationKey,
  application,
) {
  const dependencies = [
    ...createDependencies(
      applicationKey,
      application,
    ),
    ...createSpecialDependencies(
      applicationKey,
    ),
  ];

  return {
    applicationKey,

    applicationName:
      application.name,

    description:
      `${application.name} application implementation inventory.`,

    dependencies,
  };
}

function createInventory() {
  return Object.entries(APPLICATIONS).map(
    ([applicationKey, application]) =>
      createManifest(
        applicationKey,
        application,
      ),
  );
}

function escapeString(value) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`');
}

function generateSource(inventory) {
  const generatedAt =
    new Date().toISOString();

  return `/**
 * GENERATED FILE
 *
 * DO NOT EDIT MANUALLY.
 *
 * Generated by:
 * scripts/generate-application-inventory.mjs
 *
 * Generated at:
 * ${generatedAt}
 */

import type {
  ApplicationImplementationManifest,
} from '../models/application-implementation.model';

export const GENERATED_APPLICATION_IMPLEMENTATION_MANIFESTS:
  ApplicationImplementationManifest[] = ${JSON.stringify(
    inventory,
    null,
    2,
  )};
`;
}

const inventory =
  createInventory();

fs.mkdirSync(
  path.dirname(OUTPUT),
  {
    recursive: true,
  },
);

fs.writeFileSync(
  OUTPUT,
  generateSource(inventory),
  'utf8',
);

const totalDependencies =
  inventory.reduce(
    (total, application) =>
      total +
      application.dependencies.length,
    0,
  );

console.log(
  `Generated application inventory: ${OUTPUT}`,
);

console.log(
  `Applications: ${inventory.length}`,
);

console.log(
  `Dependencies: ${totalDependencies}`,
);

for (const application of inventory) {
  console.log(
    `  ${application.applicationName}: ${application.dependencies.length}`,
  );
}