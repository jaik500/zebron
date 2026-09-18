import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const CENSUS_URL =
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2026_Gazetteer/2026_Gaz_counties_national.zip';

const projectRoot = process.cwd();

const dataDirectory = path.join(
  projectRoot,
  'src',
  'app',
  'features',
  'tax-pay-calculator',
  'data'
);

const outputFile = path.join(
  dataDirectory,
  'us-counties.data.ts'
);

const tempDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), 'zebron-counties-')
);

const zipFile = path.join(
  tempDirectory,
  '2026_Gaz_counties_national.zip'
);

const extractDirectory = path.join(
  tempDirectory,
  'extracted'
);

function log(message = '') {
  console.log(message);
}

try {
  log('');
  log('Zebron - 2026 US County Data Generator');
  log('=======================================');
  log('');
  log('Downloading official Census 2026 county Gazetteer...');
  log(CENSUS_URL);
  log('');

  fs.mkdirSync(extractDirectory, {
    recursive: true,
  });

  /*
   * Download the Census ZIP.
   */
  if (process.platform === 'win32') {
    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Invoke-WebRequest -Uri "' +
          CENSUS_URL +
          '" -OutFile "' +
          zipFile +
          '"',
      ],
      {
        stdio: 'inherit',
      }
    );
  } else {
    execFileSync(
      'curl',
      [
        '-L',
        '--fail',
        '--silent',
        '--show-error',
        CENSUS_URL,
        '-o',
        zipFile,
      ],
      {
        stdio: 'inherit',
      }
    );
  }

  if (!fs.existsSync(zipFile)) {
    throw new Error(
      'Download failed. ZIP file was not created:\n' +
        zipFile
    );
  }

  log('');
  log('Download complete.');
  log('');
  log('Extracting Gazetteer...');

  /*
   * Extract ZIP.
   *
   * PowerShell is used on Windows because Git Bash
   * can cause Windows paths to be interpreted incorrectly
   * by tar.exe.
   */
  if (process.platform === 'win32') {
    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Expand-Archive -LiteralPath "' +
          zipFile +
          '" -DestinationPath "' +
          extractDirectory +
          '" -Force',
      ],
      {
        stdio: 'inherit',
      }
    );
  } else {
    execFileSync(
      'unzip',
      [
        '-o',
        zipFile,
        '-d',
        extractDirectory,
      ],
      {
        stdio: 'inherit',
      }
    );
  }

  /*
   * Find extracted TXT file.
   */
  const extractedFiles = fs
    .readdirSync(extractDirectory, {
      recursive: true,
    })
    .filter((file) =>
      file
        .toString()
        .toLowerCase()
        .endsWith('.txt')
    );

  if (extractedFiles.length === 0) {
    throw new Error(
      'No TXT file was found after extracting the Census ZIP.'
    );
  }

  const countyFileName =
    extractedFiles.find((file) =>
      file
        .toString()
        .toLowerCase()
        .includes('counties')
    ) ?? extractedFiles[0];

  const countyFile = path.join(
    extractDirectory,
    countyFileName.toString()
  );

  log('');
  log(
    'County file found: ' +
      countyFileName
  );
  log('');

  /*
   * Read Census Gazetteer.
   *
   * The Census Gazetteer files are pipe-delimited.
   */
  const fileContents = fs.readFileSync(
    countyFile,
    'utf8'
  );

  const lines = fileContents
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error(
      'County Gazetteer file does not contain enough records.'
    );
  }

  /*
   * Parse header.
   */
  const headers = lines[0]
    .split('|')
    .map((header) => header.trim());

  log('Detected columns:');
  log(headers.join(' | '));
  log('');

  const uspsIndex = headers.indexOf('USPS');
  const geoidIndex = headers.indexOf('GEOID');
  const nameIndex = headers.indexOf('NAME');

  if (
    uspsIndex === -1 ||
    geoidIndex === -1 ||
    nameIndex === -1
  ) {
    throw new Error(
      [
        'Could not find the expected Census columns.',
        '',
        'USPS index: ' + uspsIndex,
        'GEOID index: ' + geoidIndex,
        'NAME index: ' + nameIndex,
        '',
        'Headers found:',
        headers.join(', '),
      ].join('\n')
    );
  }

  /*
   * State -> counties.
   */
  const states = {};

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split('|');

    const stateCode =
      columns[uspsIndex]?.trim();

    const geoid =
      columns[geoidIndex]?.trim();

    const countyName =
      columns[nameIndex]?.trim();

    if (
      !stateCode ||
      !geoid ||
      !countyName
    ) {
      continue;
    }

    /*
     * GEOID:
     *
     * SSCCC
     *
     * SS  = state FIPS
     * CCC = county FIPS
     */
    const countyFips = geoid.slice(-3);

    if (!states[stateCode]) {
      states[stateCode] = [];
    }

    states[stateCode].push({
      value:
        stateCode.toLowerCase() +
        '-' +
        countyFips,

      label: countyName,

      fips: geoid,
    });
  }

  /*
   * Sort counties alphabetically.
   */
  for (const stateCode of Object.keys(states)) {
    states[stateCode].sort((a, b) =>
      a.label.localeCompare(
        b.label,
        'en',
        {
          sensitivity: 'base',
        }
      )
    );
  }

  const sortedStates =
    Object.keys(states).sort();

  const totalCounties =
    sortedStates.reduce(
      (total, state) =>
        total + states[state].length,
      0
    );

  log(
    'States found: ' +
      sortedStates.length
  );

  log(
    'County records found: ' +
      totalCounties
  );

  log('');

  /*
   * Generate Angular data file.
   */
  fs.mkdirSync(dataDirectory, {
    recursive: true,
  });

  const generatedData =
    JSON.stringify(
      states,
      null,
      2
    );

  const output = [
    '/**',
    ' * 2026 U.S. County / County-Equivalent Data',
    ' *',
    ' * Source:',
    ' * U.S. Census Bureau',
    ' * 2026 Gazetteer Files - National Counties',
    ' *',
    ' * Generated by:',
    ' * scripts/generate-us-counties.mjs',
    ' *',
    ' * Do not manually edit this file.',
    ' */',
    '',
    'export interface CountyOption {',
    '  value: string;',
    '  label: string;',
    '  fips: string;',
    '}',
    '',
    'export const US_COUNTIES_BY_STATE: Record<',
    '  string,',
    '  CountyOption[]',
    '> = ' +
      generatedData +
      ' as const;',
    '',
  ].join('\n');

  fs.writeFileSync(
    outputFile,
    output,
    'utf8'
  );

  log('County data generated successfully.');
  log('');
  log('Output:');
  log(outputFile);
  log('');
  log(
    'States: ' +
      sortedStates.length
  );
  log(
    'Counties: ' +
      totalCounties
  );
  log('');

} catch (error) {
  console.error('');
  console.error(
    'County generation failed.'
  );
  console.error('');
  console.error(error);

  process.exitCode = 1;

} finally {
  /*
   * Clean up temporary files.
   */
  try {
    fs.rmSync(
      tempDirectory,
      {
        recursive: true,
        force: true,
      }
    );
  } catch {
    // Ignore cleanup errors.
  }
}