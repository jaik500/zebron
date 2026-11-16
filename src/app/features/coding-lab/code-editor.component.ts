import { ChangeDetectionStrategy, Component, ElementRef, computed, input, model, output, viewChild } from '@angular/core';

/**
 * A light code editor: line numbers, Tab / Shift+Tab indenting, Enter keeps
 * the indent, Ctrl+Enter (Cmd+Enter) runs. Plain textarea underneath, so it
 * works with screen readers, spell-check off, and on phones.
 */
@Component({
  selector: 'app-code-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
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
  `,
})
export class CodeEditorComponent {
  readonly code = model('');
  readonly label = input('Code editor');
  readonly height = input('18rem');
  readonly readonly = input(false);
  readonly run = output<void>();

  private readonly area = viewChild<ElementRef<HTMLTextAreaElement>>('area');

  protected readonly lineNumbers = computed(() => Array.from({ length: Math.max(1, this.code().split('\n').length) }, (_, index) => index + 1));

  focus(): void {
    this.area()?.nativeElement.focus();
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
    const indent = '  ';

    if (event.key === 'Tab') {
      // Escape then Tab leaves the editor (keyboard users aren't trapped).
      if (event.altKey) return;
      event.preventDefault();
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      if (event.shiftKey || start !== end) {
        const block = value.slice(lineStart, end);
        const lines = block.split('\n');
        const changed = event.shiftKey
          ? lines.map((line) => line.replace(/^ {1,2}/, ''))
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
      if (/[{[(]\s*$/.test(current)) {
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
