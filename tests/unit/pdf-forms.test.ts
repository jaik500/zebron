import { describe, expect, it } from 'vitest';

import { createLinkService, filledFileName } from '../../src/app/features/documents/pdf-forms';

/** A stand-in for an <a> element (the unit tests run without a browser). */
function fakeLink() {
  const attributes = new Map<string, string>();
  return {
    href: '',
    target: '',
    rel: '',
    title: '',
    removeAttribute: (name: string) => attributes.delete(name),
  } as unknown as HTMLAnchorElement;
}

describe('Fillable PDF forms in My documents', () => {
  it('names a filled-in copy after the original', () => {
    expect(filledFileName('Volunteer form.pdf')).toBe('Volunteer form (filled).pdf');
    expect(filledFileName('w-4.PDF')).toBe('w-4 (filled).pdf');
    // Filling in a filled copy doesn't stack "(filled)".
    expect(filledFileName('Volunteer form (filled).pdf')).toBe('Volunteer form (filled).pdf');
  });

  it('opens web and email links from the PDF in a new tab, and nothing else', () => {
    const pages = { goTo: () => undefined, current: () => 1, count: () => 3 };
    const service = createLinkService(() => null, pages);

    const web = fakeLink();
    service.addLinkAttributes(web, 'https://www.w3.org/');
    expect(web.href).toBe('https://www.w3.org/');
    expect(web.target).toBe('_blank');
    expect(web.rel.includes('noopener')).toBe(true);

    const script = fakeLink();
    service.addLinkAttributes(script, 'javascript:alert(1)');
    expect(script.href).toBe('');

    const file = fakeLink();
    service.addLinkAttributes(file, 'file:///etc/passwd');
    expect(file.href).toBe('');
  });

  it('moves between pages for the PDF\'s named actions', () => {
    const visited: number[] = [];
    const service = createLinkService(() => null, { goTo: (page) => visited.push(page), current: () => 2, count: () => 5 });
    service.executeNamedAction('NextPage');
    service.executeNamedAction('PrevPage');
    service.executeNamedAction('LastPage');
    service.executeNamedAction('Print');
    expect(visited).toEqual([3, 1, 5]);
  });
});
