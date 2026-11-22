import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The installable app: manifest, icons and service worker configuration
 * (docs: Knowledge Center "zebron-app" and "dev-installable-app").
 */
const root = process.cwd();
const read = (file: string) => JSON.parse(readFileSync(join(root, file), 'utf8'));

describe('installable app', () => {
  const manifest = read('public/manifest.webmanifest');
  const ngsw = read('ngsw-config.json');
  const angular = read('angular.json');

  it('has a manifest Chrome accepts for installing', () => {
    expect(manifest.name).toBe('Zebron');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url.startsWith('/')).toBe(true);
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(true);
  });

  it('points only at icons that exist', () => {
    const icons = [...manifest.icons, ...manifest.shortcuts.flatMap((s: { icons: unknown[] }) => s.icons)];
    for (const icon of icons as { src: string }[]) {
      expect(existsSync(join(root, 'public', icon.src)), icon.src).toBe(true);
    }
    expect(existsSync(join(root, 'public/icons/apple-touch-icon.png'))).toBe(true);
  });

  it('caches the client page shell (SSR build) and the app code', () => {
    expect(ngsw.index).toBe('/index.csr.html');
    const app = ngsw.assetGroups.find((group: { name: string }) => group.name === 'app');
    expect(app.installMode).toBe('prefetch');
    expect(app.resources.files).toEqual(expect.arrayContaining(['/index.csr.html', '/*.js', '/*.css', '/manifest.webmanifest']));
  });

  it('never stores videos or the Coding Lab sandbox on the device', () => {
    const files: string[] = ngsw.assetGroups.flatMap((group: { resources: { files: string[] } }) => group.resources.files);
    expect(files.some((file) => /\/videos\/|\.mp4\b|\.webm\b|coding-lab/.test(file))).toBe(false);
  });

  it('is turned on for production builds only', () => {
    const build = angular.projects.zebron.architect.build;
    expect(build.configurations.production.serviceWorker).toBe('ngsw-config.json');
    expect(build.options.serviceWorker).toBeUndefined();
    expect(build.configurations.development.serviceWorker).toBeUndefined();
  });
});
