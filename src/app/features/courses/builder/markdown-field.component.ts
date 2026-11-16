import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { renderKnowledgeContent } from '../../partner/knowledge/knowledge-content.util';

interface FormatTool {
  key: string;
  icon: string;
  label: string;
  before: string;
  after: string;
  placeholder: string;
  /** Applies to whole lines (headings, lists, quotes). */
  line?: boolean;
  /** Inserts a block of its own (code block, table), on new lines. */
  block?: boolean;
  shortcut?: string;
}

const TOOLS: FormatTool[] = [
  { key: 'h1', icon: 'title', label: 'Heading', before: '# ', after: '', placeholder: 'Heading', line: true },
  { key: 'h2', icon: 'format_size', label: 'Subheading', before: '## ', after: '', placeholder: 'Subheading', line: true },
  { key: 'bold', icon: 'format_bold', label: 'Bold (Ctrl+B)', before: '**', after: '**', placeholder: 'bold text', shortcut: 'b' },
  { key: 'italic', icon: 'format_italic', label: 'Italic (Ctrl+I)', before: '*', after: '*', placeholder: 'italic text', shortcut: 'i' },
  { key: 'ul', icon: 'format_list_bulleted', label: 'Bulleted list', before: '- ', after: '', placeholder: 'List item', line: true },
  { key: 'ol', icon: 'format_list_numbered', label: 'Numbered list', before: '1. ', after: '', placeholder: 'Step', line: true },
  { key: 'quote', icon: 'format_quote', label: 'Quote or note', before: '> ', after: '', placeholder: 'Quote', line: true },
  { key: 'link', icon: 'link', label: 'Link (Ctrl+K)', before: '[', after: '](https://)', placeholder: 'link text', shortcut: 'k' },
  { key: 'code', icon: 'code', label: 'Code in a sentence', before: '`', after: '`', placeholder: 'code' },
  { key: 'codeblock', icon: 'data_object', label: 'Code block (Python and JavaScript get a Run button)', before: '```python\n', after: '\n```', placeholder: 'print("Hello")', block: true },
  {
    key: 'table',
    icon: 'table_chart',
    label: 'Table',
    before: '| Column 1 | Column 2 |\n| --- | --- |\n| ',
    after: ' | Value |',
    placeholder: 'Value',
    block: true,
  },
];

/**
 * Lesson text with a formatting toolbar and a preview, so authors don't
 * need to know Markdown: select text and click Bold, Heading, List...
 * The text is stored as the light Markdown lessons use.
 */
@Component({
  selector: 'app-markdown-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, TranslatePipe],
  template: `
    <div class="rounded-xl border border-slate-300 bg-white focus-within:border-[#007979] focus-within:ring-2 focus-within:ring-teal-100">
      <div class="flex flex-wrap items-center gap-0.5 border-b border-slate-100 px-1.5 py-1" role="toolbar" [attr.aria-label]="('Formatting for {0}' | t: [label() | t])">
        @for (tool of tools(); track tool.key) {
          <button
            type="button"
            (click)="apply(tool)"
            [disabled]="preview()"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
            [attr.aria-label]="tool.label | t"
            [title]="tool.label | t"
          >
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ tool.icon }}</mat-icon>
          </button>
        }
        <span class="flex-1"></span>
        <button
          type="button"
          (click)="preview.set(!preview())"
          [attr.aria-pressed]="preview()"
          class="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-semibold text-[#007979] hover:bg-teal-50"
        >
          <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ preview() ? 'edit' : 'visibility' }}</mat-icon>
          {{ (preview() ? 'Write' : 'Preview') | t }}
        </button>
      </div>

      @if (preview()) {
        <div class="md-preview min-h-[8rem] px-4 py-3 text-[15px] leading-7 text-slate-800" [innerHTML]="previewHtml()"></div>
        @if (!value().trim()) {
          <p class="px-4 pb-3 text-sm text-slate-400">{{ 'Nothing to preview yet.' | t }}</p>
        }
      } @else {
        <label class="sr-only" [attr.for]="id">{{ label() | t }}</label>
        <textarea
          #area
          [id]="id"
          class="block w-full resize-y rounded-b-xl border-0 bg-transparent px-3 py-2.5 text-[15px] leading-6 text-slate-800 outline-none"
          [rows]="rows()"
          [value]="value()"
          [placeholder]="placeholder() | t"
          (input)="valueChange.emit(area.value)"
          (keydown)="onKeydown($event)"
        ></textarea>
      }
    </div>
    <p class="mt-1 text-xs text-slate-500">{{ 'Select text, then use the buttons to format it. Preview shows it the way learners will see it.' | t }}</p>
  `,
  styles: [
    `
      :host { display: block; }
      :host ::ng-deep .md-preview h2 { font-size: 1.2rem; font-weight: 700; margin: 1rem 0 0.4rem; color: #00605f; }
      :host ::ng-deep .md-preview h3 { font-size: 1.05rem; font-weight: 700; margin: 0.9rem 0 0.3rem; color: #00605f; }
      :host ::ng-deep .md-preview h4 { font-weight: 700; margin: 0.8rem 0 0.3rem; }
      :host ::ng-deep .md-preview p { margin: 0 0 0.8rem; }
      :host ::ng-deep .md-preview ul { list-style: disc; margin: 0 0 0.8rem 1.4rem; }
      :host ::ng-deep .md-preview ol { list-style: decimal; margin: 0 0 0.8rem 1.4rem; }
      :host ::ng-deep .md-preview a { color: #007979; text-decoration: underline; }
      :host ::ng-deep .md-preview blockquote { border-left: 4px solid #007979; background: #f0fdfa; padding: 0.5rem 1rem; margin: 0.8rem 0; }
      :host ::ng-deep .md-preview code { background: #f1f5f9; border-radius: 4px; padding: 0.1rem 0.3rem; font-size: 0.9em; }
      :host ::ng-deep .md-preview pre { background: #0f172a; color: #f8fafc; border-radius: 8px; padding: 0.8rem 1rem; overflow-x: auto; margin: 0 0 0.8rem; }
      :host ::ng-deep .md-preview pre code { background: transparent; padding: 0; }
      :host ::ng-deep .md-preview img, :host ::ng-deep .md-preview video { max-width: 100%; border-radius: 8px; }
      :host ::ng-deep .md-preview table { border-collapse: collapse; margin: 0 0 0.8rem; font-size: 0.95em; }
      :host ::ng-deep .md-preview th, :host ::ng-deep .md-preview td { border: 1px solid #e2e8f0; padding: 0.35rem 0.6rem; text-align: left; }
      :host ::ng-deep .md-preview th { background: #f8fafc; }
      :host ::ng-deep .md-preview > *:last-child { margin-bottom: 0; }
    `,
  ],
})
export class MarkdownFieldComponent {
  private readonly i18n = inject(I18nService);

  readonly value = input('');
  readonly label = input('Text');
  readonly rows = input(6);
  readonly placeholder = input('');
  /** Tips are short: no headings, code blocks or tables. */
  readonly compact = input(false);
  readonly valueChange = output<string>();

  protected readonly id = `md-${Math.random().toString(36).slice(2, 9)}`;
  protected readonly preview = signal(false);
  protected readonly tools = computed(() =>
    this.compact() ? TOOLS.filter((tool) => !['h1', 'h2', 'codeblock', 'table'].includes(tool.key)) : TOOLS,
  );
  protected readonly previewHtml = computed(() => (this.preview() ? renderKnowledgeContent(this.value()) : ''));

  private readonly area = viewChild<ElementRef<HTMLTextAreaElement>>('area');

  protected onKeydown(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const tool = this.tools().find((item) => item.shortcut === event.key.toLowerCase());
    if (tool) {
      event.preventDefault();
      this.apply(tool);
    }
  }

  /** Format the selection (or insert a placeholder) and keep the cursor sensible. */
  protected apply(tool: FormatTool): void {
    const area = this.area()?.nativeElement;
    const text = this.value();
    let start = area?.selectionStart ?? text.length;
    let end = area?.selectionEnd ?? text.length;
    let insert: string;
    let selectFrom: number;
    let selectTo: number;

    if (tool.line) {
      // Whole lines: extend the selection to line starts and ends.
      start = text.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = text.indexOf('\n', end);
      end = lineEnd === -1 ? text.length : lineEnd;
      const lines = (text.slice(start, end) || this.i18n.t(tool.placeholder)).split('\n');
      const marker = /^(#{1,3} |[-*] |\d+\. |> )/;
      insert = lines
        .map((line, index) => {
          const plain = line.replace(marker, '');
          if (!plain.trim()) return line;
          const before = tool.key === 'ol' ? `${index + 1}. ` : tool.before;
          // Clicking the same button again removes the formatting.
          return line.startsWith(before) ? plain : before + plain;
        })
        .join('\n');
      selectFrom = start;
      selectTo = start + insert.length;
    } else {
      const selected = text.slice(start, end) || this.i18n.t(tool.placeholder);
      const newLine = tool.block && start > 0 && text[start - 1] !== '\n' ? '\n\n' : '';
      const trailing = tool.block && text.slice(end, end + 1) !== '\n' && end < text.length ? '\n' : '';
      insert = newLine + tool.before + selected + tool.after + trailing;
      selectFrom = start + newLine.length + tool.before.length;
      selectTo = selectFrom + selected.length;
    }

    const next = text.slice(0, start) + insert + text.slice(end);
    this.valueChange.emit(next);
    queueMicrotask(() => {
      if (!area) return;
      area.value = next;
      area.focus();
      area.setSelectionRange(selectFrom, selectTo);
    });
  }
}
