import { describe, expect, it } from 'vitest';

import { CODE_LANGUAGES, WEB_STARTER } from '../../src/app/features/coding-lab/code-lab.model';
import { WEB_EXERCISES, WEB_TEMPLATES } from '../../src/app/features/coding-lab/lab-exercises';
import { buildPreviewDocument, parseWebCode, protectLoops, serializeWebCode, setWebTab } from '../../src/app/features/coding-lab/web-code';

describe('Coding Lab web pages: tabs in one string', () => {
  it('reads the three tabs', () => {
    const files = parseWebCode('--- html ---\n<h1>Hi</h1>\n--- css ---\nh1 { color: red; }\n--- js ---\nconsole.log(1);');
    expect(files.html).toBe('<h1>Hi</h1>');
    expect(files.css).toBe('h1 { color: red; }');
    expect(files.js).toBe('console.log(1);');
    expect(files.tabs).toEqual(['html', 'css', 'js']);
  });

  it('treats text without markers as HTML only', () => {
    const files = parseWebCode('<p>Just a page</p>');
    expect(files.html).toBe('<p>Just a page</p>');
    expect(files.tabs).toEqual(['html']);
  });

  it('hides tabs whose marker is left out', () => {
    expect(parseWebCode('--- html ---\n<p>x</p>\n--- css ---\np {}').tabs).toEqual(['html', 'css']);
  });

  it('accepts --- javascript --- and keeps text above the first marker in HTML', () => {
    const files = parseWebCode('<p>top</p>\n--- javascript ---\nlet a = 1;');
    expect(files.html).toBe('<p>top</p>');
    expect(files.js).toBe('let a = 1;');
    expect(files.tabs).toEqual(['html', 'js']);
  });

  it('round-trips exactly', () => {
    for (const code of [WEB_STARTER, ...WEB_TEMPLATES.map((template) => template.code), ...WEB_EXERCISES.flatMap((exercise) => [exercise.starter, exercise.solution])]) {
      expect(serializeWebCode(parseWebCode(code))).toBe(code);
    }
  });

  it('changes one tab and keeps the others', () => {
    const code = setWebTab(WEB_STARTER, 'css', 'p { margin: 0; }');
    const files = parseWebCode(code);
    expect(files.css).toBe('p { margin: 0; }');
    expect(files.html).toBe(parseWebCode(WEB_STARTER).html);
    expect(files.js).toBe(parseWebCode(WEB_STARTER).js);
  });

  it('is offered as a Coding Lab language with ```html examples', () => {
    const web = CODE_LANGUAGES.find((language) => language.value === 'web');
    expect(web?.fence).toEqual(['html']);
    expect(web?.starter).toBe(WEB_STARTER);
  });
});

describe('Coding Lab web pages: endless loop protection', () => {
  it('guards for, while and do loops', () => {
    expect(protectLoops('for (let i = 0; i < 3; i++) { x(); }')).toBe('for (let i = 0; i < 3; i++) {__zbLoop(); x(); }');
    expect(protectLoops('while (true) {}')).toBe('while (true) {__zbLoop();}');
    expect(protectLoops('do { n--; } while (n > 0);')).toBe('do {__zbLoop(); n--; } while (n > 0);');
    expect(protectLoops('for await (const x of xs) { y(x); }')).toBe('for await (const x of xs) {__zbLoop(); y(x); }');
  });

  it('guards empty loop bodies', () => {
    expect(protectLoops('while (busy());')).toBe('while (busy()){__zbLoop();};');
    expect(protectLoops('for(;;);')).toBe('for(;;){__zbLoop();};');
  });

  it('leaves strings, comments, regular expressions and properties alone', () => {
    const code = [
      "const a = 'for (;;) {';",
      'const b = "while (x) {";',
      'const c = `for (${n}) {`;',
      '// for (;;) {',
      '/* while (1) { */',
      'const d = /for\\(/.test(s);',
      'obj.while = 1; obj.for(1);',
    ].join('\n');
    expect(protectLoops(code)).toBe(code);
  });

  it('handles nested parentheses in the loop header', () => {
    expect(protectLoops('for (let i = 0; i < f(g(1)); i++) { }')).toBe('for (let i = 0; i < f(g(1)); i++) {__zbLoop(); }');
  });

  it('keeps line numbers (no new lines added)', () => {
    const code = 'let i = 0;\nwhile (i < 10) {\n  i++;\n}\nfor (;;) {\n  break;\n}';
    expect(protectLoops(code).split('\n').length).toBe(code.split('\n').length);
  });
});

describe('Coding Lab web pages: the preview document', () => {
  it('wraps a fragment with the CSS in <head> and the JavaScript at the end of <body>', () => {
    const { html, jsStartLine } = buildPreviewDocument({ html: '<h1>Hi</h1>', css: 'h1 { color: red; }', js: 'console.log(1);\nfoo();' }, 7);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html.indexOf('<style>') < html.indexOf('</head>')).toBe(true);
    expect(html.indexOf('<h1>Hi</h1>') < html.lastIndexOf('console.log(1);')).toBe(true);
    expect(html.includes('var RUN=7')).toBe(true);
    // The JavaScript tab's first line is where the bootstrap says it is.
    expect(html.split('\n')[jsStartLine - 1]).toBe('console.log(1);');
    expect(html.includes(`JS_START=${jsStartLine}`)).toBe(true);
  });

  it('puts the bootstrap first in a full page and the CSS tab after the page\'s own styles', () => {
    const { html } = buildPreviewDocument({ html: '<!doctype html><html><head><style>p{color:red}</style></head><body><p>x</p></body></html>', css: 'p { color: blue; }', js: '' }, 1);
    const boot = html.indexOf('window.__zbLoop');
    expect(boot > html.indexOf('<head>')).toBe(true);
    expect(boot < html.indexOf('p{color:red}')).toBe(true);
    expect(html.indexOf('p{color:red}') < html.indexOf('p { color: blue; }')).toBe(true);
    expect(html.indexOf('p { color: blue; }') < html.indexOf('</head>')).toBe(true);
  });

  it('cannot be broken out of with </script> or </style>', () => {
    const { html } = buildPreviewDocument({ html: '<p>x</p>', css: 'p::after { content: "</style>"; }', js: 'const s = "</script><img src=x>";' }, 1, [
      { name: 'check', code: 'assert("</script>")' },
    ]);
    expect(html.includes('"</script><img')).toBe(false);
    expect(html.includes('"<\\/script><img src=x>"')).toBe(true);
    expect(html.includes('content: "<\\/style>"')).toBe(true);
    expect(html.includes('assert("<\\/script>")')).toBe(true);
  });

  it('protects loops in the JavaScript tab and in the page\'s own scripts', () => {
    const { html } = buildPreviewDocument({ html: '<script>while (true) {}</script><script src="lib.js">for(;;){}</script>', css: '', js: 'for (;;) { }' }, 1);
    expect(html.includes('<script>while (true) {__zbLoop();}</script>')).toBe(true);
    expect(html.includes('<script src="lib.js">for(;;){}</script>')).toBe(true);
    expect(html.includes('for (;;) {__zbLoop(); }')).toBe(true);
  });

  it('adds the checks with their helpers', () => {
    const { html } = buildPreviewDocument({ html: '<h1>Hi</h1>', css: '', js: '' }, 1, [{ name: 'Says hi', code: "assertEqual(text('h1'), 'Hi');" }]);
    expect(html.includes('window.__zbChecks=[{name:"Says hi"')).toBe(true);
    expect(html.includes("assertEqual(text('h1'), 'Hi');")).toBe(true);
    expect(html.includes('TESTS=1')).toBe(true);
  });
});

describe('Coding Lab web exercises', () => {
  it('have unique ids, checks, hints and a solution', () => {
    const ids = WEB_EXERCISES.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const exercise of WEB_EXERCISES) {
      expect(exercise.language).toBe('web');
      expect(exercise.tests.length).toBeGreaterThan(0);
      expect(exercise.hints.length).toBeGreaterThan(0);
      expect(exercise.solution.length).toBeGreaterThan(0);
    }
  });
});
