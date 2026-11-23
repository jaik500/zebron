/**
 * Zebron Coding Lab: web pages (HTML, CSS and JavaScript).
 *
 * A web project or exercise is stored as one string (like the other
 * languages), with a marker line before each tab:
 *
 *   --- html ---
 *   <h1>Hello</h1>
 *   --- css ---
 *   h1 { color: teal; }
 *   --- js ---
 *   console.log('ready');
 *
 * Text without markers is all HTML (so a pasted page or an ```html lesson
 * example just works). A tab whose marker is left out is hidden, so an
 * exercise can offer only the HTML tab, or HTML and CSS.
 *
 * The preview page is built here (buildPreviewDocument) and written into
 * public/coding-lab/preview.html, which CodeRunnerService loads in an
 * opaque-origin iframe (sandbox="allow-scripts allow-forms").
 */
import type { CodeTest } from './code-lab.model';

export type WebTab = 'html' | 'css' | 'js';

export const WEB_TABS: { value: WebTab; label: string }[] = [
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'js', label: 'JavaScript' },
];

export interface WebFiles {
  html: string;
  css: string;
  js: string;
  /** Tabs that have a marker (HTML is always shown). */
  tabs: WebTab[];
}

const MARKER = /^\s*---\s*(html|css|js|javascript)\s*---\s*$/i;

export function parseWebCode(code: string): WebFiles {
  const files: WebFiles = { html: '', css: '', js: '', tabs: ['html'] };
  const lines = (code ?? '').split('\n');
  if (!lines.some((line) => MARKER.test(line))) {
    files.html = code ?? '';
    return files;
  }
  const sections: Record<WebTab, string[] | null> = { html: null, css: null, js: null };
  let current: WebTab = 'html';
  const before: string[] = [];
  for (const line of lines) {
    const match = MARKER.exec(line);
    if (match) {
      const name = match[1].toLowerCase();
      current = name === 'javascript' ? 'js' : (name as WebTab);
      sections[current] ??= [];
      continue;
    }
    const target = sections[current];
    if (target) target.push(line);
    else before.push(line);
  }
  // Text above the first marker belongs to the HTML tab.
  const html = [...(before.some((line) => line.trim()) ? before : []), ...(sections.html ?? [])];
  files.html = html.join('\n');
  files.css = (sections.css ?? []).join('\n');
  files.js = (sections.js ?? []).join('\n');
  files.tabs = WEB_TABS.map((tab) => tab.value).filter((tab) => tab === 'html' || sections[tab] !== null);
  return files;
}

export function serializeWebCode(files: Pick<WebFiles, 'html' | 'css' | 'js'> & { tabs?: WebTab[] }): string {
  const tabs = files.tabs ?? ['html', 'css', 'js'];
  return WEB_TABS.filter((tab) => tab.value === 'html' || tabs.includes(tab.value))
    .map((tab) => `--- ${tab.value} ---\n${files[tab.value]}`)
    .join('\n');
}

/** Replace one tab's text and keep the rest. */
export function setWebTab(code: string, tab: WebTab, text: string): string {
  const files = parseWebCode(code);
  files[tab] = text;
  if (!files.tabs.includes(tab)) files.tabs = WEB_TABS.map((item) => item.value).filter((item) => files.tabs.includes(item) || item === tab);
  return serializeWebCode(files);
}

// ------------------------------------------------------------------
// Loop protection: a loop that never ends would freeze the page, so every
// loop body calls __zbLoop(), which stops a loop running for too long.
// ------------------------------------------------------------------

interface Token {
  kind: 'word' | 'punct' | 'skip';
  value: string;
  start: number;
  end: number;
}

const REGEX_AFTER_WORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  const length = code.length;
  const lastSignificant = () => tokens[tokens.length - 1];

  while (index < length) {
    const char = code[index];
    const next = code[index + 1];

    if (/\s/.test(char)) {
      index++;
      continue;
    }
    // Comments
    if (char === '/' && next === '/') {
      const end = code.indexOf('\n', index);
      index = end === -1 ? length : end;
      continue;
    }
    if (char === '/' && next === '*') {
      const end = code.indexOf('*/', index + 2);
      index = end === -1 ? length : end + 2;
      continue;
    }
    // Strings
    if (char === '"' || char === "'") {
      const start = index++;
      while (index < length && code[index] !== char && code[index] !== '\n') {
        if (code[index] === '\\') index++;
        index++;
      }
      index++;
      tokens.push({ kind: 'skip', value: 'string', start, end: index });
      continue;
    }
    // Template literals (with ${ } expressions, skipped as a whole)
    if (char === '`') {
      const start = index++;
      let depth = 0;
      while (index < length) {
        const current = code[index];
        if (current === '\\') {
          index += 2;
          continue;
        }
        if (depth === 0 && current === '`') break;
        if (current === '$' && code[index + 1] === '{') {
          depth++;
          index += 2;
          continue;
        }
        if (depth > 0 && current === '}') depth--;
        else if (depth > 0 && current === '{') depth++;
        index++;
      }
      index++;
      tokens.push({ kind: 'skip', value: 'template', start, end: index });
      continue;
    }
    // Regular expression literals
    if (char === '/') {
      const previous = lastSignificant();
      const regexAllowed =
        !previous ||
        (previous.kind === 'punct' && !/^[)\]}]$/.test(previous.value)) ||
        (previous.kind === 'word' && REGEX_AFTER_WORDS.has(previous.value));
      if (regexAllowed) {
        const start = index++;
        let inClass = false;
        while (index < length && code[index] !== '\n') {
          const current = code[index];
          if (current === '\\') {
            index += 2;
            continue;
          }
          if (current === '[') inClass = true;
          else if (current === ']') inClass = false;
          else if (current === '/' && !inClass) break;
          index++;
        }
        index++;
        while (index < length && /[a-z]/i.test(code[index])) index++;
        tokens.push({ kind: 'skip', value: 'regex', start, end: index });
        continue;
      }
    }
    // Words (identifiers, keywords, numbers)
    if (/[\w$]/.test(char)) {
      const start = index;
      while (index < length && /[\w$]/.test(code[index])) index++;
      tokens.push({ kind: 'word', value: code.slice(start, index), start, end: index });
      continue;
    }
    tokens.push({ kind: 'punct', value: char, start: index, end: index + 1 });
    index++;
  }
  return tokens;
}

/** Add a guard to every for, while and do loop (code only, not strings or comments). */
export function protectLoops(code: string, guard = '__zbLoop();'): string {
  const tokens = tokenize(code);
  const inserts: { at: number; text: string }[] = [];

  const matchingParen = (open: number): number => {
    let depth = 0;
    for (let position = open; position < tokens.length; position++) {
      const value = tokens[position].kind === 'punct' ? tokens[position].value : '';
      if (value === '(') depth++;
      else if (value === ')' && --depth === 0) return position;
    }
    return -1;
  };

  for (let position = 0; position < tokens.length; position++) {
    const token = tokens[position];
    if (token.kind !== 'word') continue;
    const previous = tokens[position - 1];
    if (previous?.kind === 'punct' && previous.value === '.') continue;

    if (token.value === 'do') {
      const body = tokens[position + 1];
      if (body?.kind === 'punct' && body.value === '{') inserts.push({ at: body.end, text: guard });
      continue;
    }
    if (token.value !== 'for' && token.value !== 'while') continue;

    let open = position + 1;
    if (tokens[open]?.kind === 'word' && tokens[open].value === 'await') open++;
    if (tokens[open]?.kind !== 'punct' || tokens[open].value !== '(') continue;
    const close = matchingParen(open);
    if (close === -1) continue;
    const body = tokens[close + 1];
    if (!body) continue;
    if (body.kind === 'punct' && body.value === '{') {
      inserts.push({ at: body.end, text: guard });
    } else if (body.kind === 'punct' && body.value === ';') {
      // while (x); or the end of do { } while (x);
      const beforeWhile = tokens[position - 1];
      const endsDoWhile = token.value === 'while' && beforeWhile?.kind === 'punct' && beforeWhile.value === '}';
      if (!endsDoWhile) inserts.push({ at: body.start, text: `{${guard}}` });
    }
    // Loops without braces around a single statement are left as they are.
  }

  let result = code;
  for (const insert of inserts.sort((a, b) => b.at - a.at)) {
    result = result.slice(0, insert.at) + insert.text + result.slice(insert.at);
  }
  return result;
}

// ------------------------------------------------------------------
// The preview document
// ------------------------------------------------------------------

/** Time a single loop may run before it is stopped. */
export const LOOP_LIMIT_MS = 2500;
/** Time each check may take. */
export const CHECK_LIMIT_MS = 3000;

const escapeScript = (code: string) => code.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
const escapeStyle = (css: string) => css.replace(/<\/(style)/gi, '<\\/$1');

/** Protect loops in the page's own <script> elements (not those with src). */
function protectInlineScripts(html: string): string {
  return html.replace(/(<script\b([^>]*)>)([\s\S]*?)(<\/script>)/gi, (whole, open: string, attributes: string, body: string, close: string) => {
    if (/\bsrc\s*=/i.test(attributes)) return whole;
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attributes)?.[1]?.toLowerCase();
    if (type && !['text/javascript', 'module', 'application/javascript'].includes(type)) return whole;
    return open + protectLoops(body) + close;
  });
}

/**
 * The script that runs first in the preview: it sends console output and
 * errors to the Coding Lab, stops endless loops, and runs the checks once
 * the page has loaded. It must not contain the text "</script".
 */
function bootstrapScript(runId: number, jsStartLine: number, jsLines: number, testCount: number): string {
  return `(function(){
var RUN=${runId},JS_START=${jsStartLine},JS_LINES=${jsLines},TESTS=${testCount},P=window.parent,printed=[];
function send(m){m.source='zebron-web-preview';m.runId=RUN;try{P.postMessage(m,'*')}catch(e){}}
function fmt(v){if(typeof v==='string')return v;if(v instanceof Error)return v.name+': '+v.message;if(typeof Element!=='undefined'&&v instanceof Element){var t=v.outerHTML;return t.length>200?t.slice(0,200)+'…':t}try{var j=JSON.stringify(v);return j===undefined?String(v):j}catch(e){return String(v)}}
function show(v){return typeof v==='string'?JSON.stringify(v):fmt(v)}
function out(stream){return function(){var text=Array.prototype.map.call(arguments,fmt).join(' ');if(stream==='stdout')printed.push(text);send({type:'output',stream:stream,text:text})}}
var c=window.console;c.log=c.info=c.debug=c.table=out('stdout');c.warn=c.error=out('stderr');
window.alert=function(m){out('stdout')('[alert] '+fmt(m===undefined?'':m))};
window.confirm=function(){out('stderr')('confirm() is not available in the preview; it returns false.');return false};
window.prompt=function(){out('stderr')('prompt() is not available in the preview; it returns null.');return null};
function where(line,file){if(!line)return'';if(/zebron-script\\.js$/.test(file||''))return line>1?' (JavaScript line '+(line-1)+')':'';if(line>=JS_START&&line<JS_START+JS_LINES)return' (JavaScript line '+(line-JS_START+1)+')';return' (in a script in your HTML)'}
window.addEventListener('error',function(e){if(e.target&&e.target!==window&&e.target.tagName){send({type:'output',stream:'stderr',text:'Could not load '+(e.target.src||e.target.href||'a file')+' ('+e.target.tagName.toLowerCase()+').'});return}var msg=e.error&&e.error.name?e.error.name+': '+e.error.message:(e.message||'Error');send({type:'error',text:msg+where(e.lineno,e.filename)})},true);
window.addEventListener('unhandledrejection',function(e){send({type:'error',text:'Uncaught (in promise) '+fmt(e.reason)})});
var loopStart=0,loopLast=0;
window.__zbLoop=function(){var now=performance.now();if(now-loopLast>100)loopStart=now;loopLast=now;if(now-loopStart>${LOOP_LIMIT_MS}){loopStart=now;throw new Error('Stopped a loop that ran for more than ${LOOP_LIMIT_MS / 1000} seconds. Is there a loop that never ends?')}};
function find(sel){var el=document.querySelector(sel);if(!el)throw new Error('No element on the page matches "'+sel+'"');return el}
var helpers={
assert:function(ok,message){if(!ok)throw new Error(message||'Assertion failed')},
assertEqual:function(actual,expected,message){if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error(message||('Expected '+show(expected)+' but got '+show(actual)))},
$:function(sel){return document.querySelector(sel)},
$$:function(sel){return Array.prototype.slice.call(document.querySelectorAll(sel))},
text:function(sel){return (find(sel).textContent||'').replace(/\\s+/g,' ').trim()},
style:function(sel,prop){return getComputedStyle(find(sel)).getPropertyValue(prop).trim()},
color:function(value){var el=document.createElement('span');el.style.color=value;document.body.appendChild(el);var rgb=getComputedStyle(el).color;el.remove();return rgb},
click:function(sel){find(sel).click()},
type:function(sel,value){var el=find(sel);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))},
wait:function(ms){return new Promise(function(r){setTimeout(r,Math.min(Number(ms)||0,2000))})},
__output:function(){return printed.join('\\n')}
};
window.__zbRunChecks=function(list){var results=[],i=0;
function next(){if(i>=list.length){send({type:'done',tests:results});return}var test=list[i++];var timer;
var limit=new Promise(function(_,reject){timer=setTimeout(function(){reject(new Error('This check took more than ${CHECK_LIMIT_MS / 1000} seconds.'))},${CHECK_LIMIT_MS})});
Promise.race([Promise.resolve().then(function(){return test.run(helpers)}),limit]).then(function(){results.push({name:test.name,passed:true,message:''})},function(err){results.push({name:test.name,passed:false,message:err&&err.message?err.message:String(err)})}).then(function(){clearTimeout(timer);next()})}
next()};
var started=false;function start(){if(started)return;started=true;setTimeout(function(){if(TESTS&&window.__zbChecks)window.__zbRunChecks(window.__zbChecks);else send({type:'done',tests:[]})},30)}
window.addEventListener('load',start);
document.addEventListener('DOMContentLoaded',function(){setTimeout(start,3000)});
})();`;
}

export interface PreviewDocument {
  /** The full page written into the preview frame. */
  html: string;
  /** First line of the JavaScript tab in the page (for error messages). */
  jsStartLine: number;
}

/** Build the page the preview shows: the learner's HTML, CSS and JavaScript, plus the checks. */
export function buildPreviewDocument(files: Pick<WebFiles, 'html' | 'css' | 'js'>, runId: number, tests: CodeTest[] = []): PreviewDocument {
  const html = protectInlineScripts(files.html ?? '');
  const css = files.css?.trim() ? `<style>\n${escapeStyle(files.css)}\n</style>` : '';
  const jsOpen = '<script>\n';
  const js = files.js?.trim() ? `${jsOpen}${escapeScript(protectLoops(files.js))}\n//# sourceURL=zebron-script.js\n</script>` : '';
  const checks = tests.length
    ? `<script>window.__zbChecks=[${tests
        .map(
          (test) =>
            `{name:${JSON.stringify(test.name)},run:async function(h){var assert=h.assert,assertEqual=h.assertEqual,$=h.$,$$=h.$$,text=h.text,style=h.style,color=h.color,click=h.click,type=h.type,wait=h.wait,__output=h.__output;\n${escapeScript(test.code)}\n}}`,
        )
        .join(',')}];</script>`
    : '';
  const jsLines = files.js?.trim() ? files.js.split('\n').length : 0;

  // The bootstrap is built twice: first to find where the JavaScript lands, then with that line.
  const assemble = (bootstrap: string) => {
    const boot = `<script>${bootstrap}</script>`;
    const isDocument = /<html[\s>]|<head[\s>]|<body[\s>]|<!doctype/i.test(html);
    if (!isDocument) {
      return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${boot}\n${css}\n</head>\n<body>\n${html}\n${js}\n${checks}\n</body>\n</html>`;
    }
    let page = html;
    // Bootstrap first thing in <head> (or at the very start).
    const head = /<head\b[^>]*>/i.exec(page);
    if (head) page = page.slice(0, head.index + head[0].length) + boot + page.slice(head.index + head[0].length);
    else {
      const htmlTag = /<html\b[^>]*>/i.exec(page);
      const at = htmlTag ? htmlTag.index + htmlTag[0].length : /<!doctype[^>]*>/i.exec(page)?.[0].length ?? 0;
      page = page.slice(0, at) + boot + page.slice(at);
    }
    // CSS at the end of <head> (after the page's own styles, so the CSS tab wins).
    if (css) {
      const headEnd = page.search(/<\/head>/i);
      page = headEnd >= 0 ? page.slice(0, headEnd) + css + page.slice(headEnd) : page.replace(boot, boot + css);
    }
    // JavaScript and checks at the end of <body>.
    const tail = `${js}${checks}`;
    if (tail) {
      const bodyEnd = page.search(/<\/body>/i);
      page = bodyEnd >= 0 ? page.slice(0, bodyEnd) + '\n' + tail + page.slice(bodyEnd) : page + '\n' + tail;
    }
    return page;
  };

  const lineOf = (page: string) => {
    if (!js) return 0;
    const at = page.indexOf(jsOpen + escapeScript(protectLoops(files.js)));
    return at < 0 ? 0 : page.slice(0, at + jsOpen.length).split('\n').length;
  };
  const draft = assemble(bootstrapScript(runId, 0, jsLines, tests.length));
  const jsStartLine = lineOf(draft);
  const page = assemble(bootstrapScript(runId, jsStartLine, jsLines, tests.length));
  return { html: page, jsStartLine };
}
