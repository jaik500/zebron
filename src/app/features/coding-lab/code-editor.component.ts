import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';

import type { CodeLanguage } from './code-lab.model';

/**
 * The Coding Lab editor: CodeMirror 6 (syntax colours, bracket matching,
 * auto-closing brackets, search with Ctrl+F, Tab indenting, Ctrl+Enter runs).
 *
 * CodeMirror is loaded only when an editor is shown, in the browser. Until it
 * has loaded (or if it can't), a plain textarea editor with line numbers and
 * the same keys is used, so the lab always works.
 */
@Component({
  selector: 'app-code-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #host class="zb-cm min-h-0 overflow-hidden bg-[#0b1f2a]" [class.hidden]="!ready()" [style.height]="height()"></div>
    @if (!ready()) {
    <div class="flex min-h-0 overflow-hidden bg-[#0b1f2a] font-mono text-[13px] leading-[1.6] sm:text-sm" [style.height]="height()">
      <div
        #gutter
        class="select-none overflow-hidden border-r border-white/10 bg-[#081822] py-3 pl-2 pr-2 text-right text-slate-500"
        aria-hidden="true"
      >
        @for (line of lineNumbers(); track line) {
          <div>{{ line }}</div>
        }
      </div>
      <textarea
        #area
        class="min-w-0 flex-1 resize-none whitespace-pre bg-transparent px-3 py-3 text-slate-100 caret-teal-300 outline-none [tab-size:2] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-400/60"
        [value]="code()"
        [attr.aria-label]="label()"
        [readOnly]="readonly()"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
        wrap="off"
        (input)="code.set(area.value)"
        (scroll)="gutter.scrollTop = area.scrollTop"
        (keydown)="onKeydown($event, area)"
      ></textarea>
    </div>
    }
  `,
})
export class CodeEditorComponent {
  readonly code = model('');
  readonly language = input<CodeLanguage>('javascript');
  readonly label = input('Code editor');
  readonly height = input('18rem');
  readonly readonly = input(false);
  readonly run = output<void>();

  private readonly area = viewChild<ElementRef<HTMLTextAreaElement>>('area');
  private readonly host = viewChild<ElementRef<HTMLDivElement>>('host');

  /** CodeMirror has loaded and replaced the textarea. */
  protected readonly ready = signal(false);
  // CodeMirror objects (typed loosely: the modules load on demand).
  private view: any = null;
  private cm: any = null;
  private destroyed = false;

  constructor() {
    afterNextRender(() => void this.startCodeMirror());

    // Code set from outside (reset, saved work, a solution): put it in the editor.
    effect(() => {
      const code = this.code();
      const view = this.view;
      if (view && this.ready() && view.state.doc.toString() !== code) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
      }
    });

    effect(() => {
      const language = this.language();
      if (this.view && this.ready()) {
        this.view.dispatch({ effects: this.cm.languageSlot.reconfigure(this.languageSupport(language)) });
      }
    });

    effect(() => {
      const readonly = this.readonly();
      if (this.view && this.ready()) {
        this.view.dispatch({ effects: this.cm.readOnlySlot.reconfigure(this.cm.state.EditorState.readOnly.of(readonly)) });
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.view?.destroy();
    });
  }

  private async startCodeMirror(): Promise<void> {
    try {
      const [setup, viewModule, state, commands, javascript, python, theme] = await Promise.all([
        import('codemirror'),
        import('@codemirror/view'),
        import('@codemirror/state'),
        import('@codemirror/commands'),
        import('@codemirror/lang-javascript'),
        import('@codemirror/lang-python'),
        import('@codemirror/theme-one-dark'),
      ]);
      const host = this.host()?.nativeElement;
      if (this.destroyed || !host) return;

      const { EditorView, keymap } = viewModule;
      this.cm = {
        state,
        javascript: javascript.javascript,
        python: python.python,
        languageSlot: new state.Compartment(),
        readOnlySlot: new state.Compartment(),
      };

      this.view = new EditorView({
        parent: host,
        state: state.EditorState.create({
          doc: this.code(),
          extensions: [
            setup.basicSetup,
            state.Prec.highest(
              keymap.of([
                {
                  key: 'Mod-Enter',
                  run: () => {
                    this.run.emit();
                    return true;
                  },
                },
              ]),
            ),
            keymap.of([commands.indentWithTab]),
            this.cm.languageSlot.of(this.languageSupport(this.language())),
            this.cm.readOnlySlot.of(state.EditorState.readOnly.of(this.readonly())),
            state.EditorState.tabSize.of(this.language() === 'python' ? 4 : 2),
            theme.oneDark,
            EditorView.theme({
              '&': { height: '100%', fontSize: '13px', backgroundColor: '#0b1f2a' },
              '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', lineHeight: '1.6' },
              '.cm-gutters': { backgroundColor: '#081822', borderRight: '1px solid rgba(255,255,255,0.08)' },
              '&.cm-focused': { outline: '2px solid rgba(45, 212, 191, 0.6)', outlineOffset: '-2px' },
            }),
            EditorView.contentAttributes.of({ 'aria-label': this.label() }),
            EditorView.updateListener.of((update: any) => {
              if (update.docChanged) {
                this.code.set(update.state.doc.toString());
              }
            }),
          ],
        }),
      });
      this.ready.set(true);
    } catch {
      // CodeMirror isn't available: keep the textarea editor.
    }
  }

  private languageSupport(language: CodeLanguage): unknown {
    return language === 'python' ? this.cm.python() : this.cm.javascript();
  }

  protected readonly lineNumbers = computed(() => Array.from({ length: Math.max(1, this.code().split('\n').length) }, (_, index) => index + 1));

  focus(): void {
    if (this.view) this.view.focus();
    else this.area()?.nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent, area: HTMLTextAreaElement): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.run.emit();
      return;
    }
    if (this.readonly()) {
      return;
    }
    const { selectionStart: start, selectionEnd: end, value } = area;
    const indent = this.language() === 'python' ? '    ' : '  ';

    if (event.key === 'Tab') {
      // Escape then Tab leaves the editor (keyboard users aren't trapped).
      if (event.altKey) return;
      event.preventDefault();
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      if (event.shiftKey || start !== end) {
        const block = value.slice(lineStart, end);
        const lines = block.split('\n');
        const changed = event.shiftKey
          ? lines.map((line) => line.replace(this.language() === 'python' ? /^ {1,4}/ : /^ {1,2}/, ''))
          : lines.map((line) => indent + line);
        const replaced = changed.join('\n');
        this.replace(area, lineStart, end, replaced, start === end ? Math.max(lineStart, start + (replaced.length - block.length)) : lineStart, lineStart + replaced.length);
      } else {
        this.replace(area, start, end, indent, start + indent.length, start + indent.length);
      }
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const current = value.slice(lineStart, start);
      let leading = current.match(/^\s*/)?.[0] ?? '';
      if (/[{[(:]\s*$/.test(current)) {
        leading += indent;
      }
      const text = '\n' + leading;
      this.replace(area, start, end, text, start + text.length, start + text.length);
    }
  }

  private replace(area: HTMLTextAreaElement, from: number, to: number, text: string, selStart: number, selEnd: number): void {
    area.setRangeText(text, from, to, 'end');
    area.setSelectionRange(selStart, selEnd);
    this.code.set(area.value);
  }
}
