import { ChangeDetectionStrategy, Component, computed, inject, input, model, output } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { I18nService } from '../../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';

/**
 * Shared mailbox popups for the admin Inbox (contact-mailbox) and Sent
 * (sent-email) pages, so both look and behave exactly the same:
 *
 * - <app-mail-reader>: read one email (toolbar, subject, sender, body,
 *   footer actions, print).
 * - <app-mail-composer>: write a new email, reply or forward.
 *
 * Both are presentational: the page owns the data and the actions.
 */

export type MailBadgeTone = 'new' | 'read' | 'archived' | 'neutral';

const BADGE_CLASSES: Record<MailBadgeTone, string> = {
  new: 'bg-blue-50 text-blue-700',
  read: 'bg-emerald-50 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600',
  neutral: 'bg-slate-100 text-slate-600',
};

// =====================================================================
// READER
// =====================================================================

@Component({
  selector: 'app-mail-reader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  imports: [MatIconModule, TranslatePipe],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 backdrop-blur-[2px] sm:items-center sm:p-6"
      (click)="closed.emit()"
    >
      <section
        class="flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[88vh] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mail-reader-subject"
        (click)="$event.stopPropagation()"
      >
        <!-- Toolbar -->
        <div class="flex shrink-0 items-center gap-1 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-3 py-2 sm:px-5">
          <button type="button" (click)="closed.emit()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" [attr.aria-label]="'Back' | t" [title]="'Back' | t">
            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">arrow_back</mat-icon>
          </button>

          @if (showArchive() || showDelete()) {
            <span class="mx-1 h-5 w-px bg-white/30" aria-hidden="true"></span>
          }

          @if (showArchive()) {
            @if (archived()) {
              <button type="button" (click)="unarchive.emit()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" [attr.aria-label]="'Move to inbox' | t" [title]="'Move to inbox' | t">
                <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">unarchive</mat-icon>
              </button>
            } @else {
              <button type="button" (click)="archive.emit()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" [attr.aria-label]="'Archive' | t" [title]="'Archive' | t">
                <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">archive</mat-icon>
              </button>
            }
          }

          @if (showDelete()) {
            <button type="button" (click)="delete.emit()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" [attr.aria-label]="'Delete' | t" [title]="'Delete' | t">
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">delete</mat-icon>
            </button>
          }

          <div class="ml-auto flex items-center gap-1">
            <button type="button" (click)="print()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" [attr.aria-label]="'Print' | t" [title]="'Print' | t">
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">print</mat-icon>
            </button>
            <button type="button" (click)="closed.emit()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60" [attr.aria-label]="'Close' | t" [title]="'Close' | t">
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Message -->
        <div class="min-h-0 flex-1 overflow-y-auto">
          <div class="px-5 pb-8 pt-6 sm:px-10">
            <div class="flex flex-wrap items-start gap-x-3 gap-y-2">
              <h2 id="mail-reader-subject" class="min-w-0 flex-1 break-words text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
                {{ subject() || ('(No subject)' | t) }}
              </h2>
              @if (badge()) {
                <span [class]="'mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ' + badgeClass()">
                  {{ badge()! | t }}
                </span>
              }
            </div>

            <div class="mt-6 flex items-start gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#007979] text-base font-semibold text-white" aria-hidden="true">
                {{ initial() }}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <p class="min-w-0 truncate text-sm text-slate-900">
                    <span class="font-semibold">{{ fromName() || fromEmail() }}</span>
                    @if (fromName() && fromEmail() && fromName() !== fromEmail()) {
                      <span class="text-slate-500">&lt;{{ fromEmail() }}&gt;</span>
                    }
                  </p>
                  <p class="shrink-0 text-xs text-slate-500">{{ date() }}</p>
                </div>
                <p class="mt-0.5 truncate text-xs text-slate-500">{{ 'to {0}' | t: [to()] }}</p>
              </div>
            </div>

            <div class="mt-6 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-800 sm:pl-[52px]">{{ body() }}</div>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          @if (showReply()) {
            <button type="button" (click)="reply.emit()" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006666]">
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">reply</mat-icon>
              {{ 'Reply' | t }}
            </button>
          }
          <button
            type="button"
            (click)="forward.emit()"
            [class]="showReply()
              ? 'inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
              : 'inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006666]'"
          >
            <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]">forward</mat-icon>
            {{ 'Forward' | t }}
          </button>
          <button type="button" (click)="closed.emit()" class="ml-auto inline-flex h-9 items-center rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
            {{ 'Close' | t }}
          </button>
        </div>
      </section>
    </div>
  `,
})
export class MailReaderComponent {
  readonly subject = input('');
  readonly fromName = input('');
  readonly fromEmail = input('');
  readonly to = input('Zebron');
  readonly date = input('');
  readonly body = input('');

  /** Small label beside the subject (status or type). */
  readonly badge = input<string | null>(null);
  readonly badgeTone = input<MailBadgeTone>('neutral');

  /** Label for the print page band, e.g. "Contact message". */
  readonly printLabel = input('Email');

  readonly showReply = input(false);
  readonly showArchive = input(false);
  readonly archived = input(false);
  readonly showDelete = input(true);

  readonly closed = output<void>();
  readonly reply = output<void>();
  readonly forward = output<void>();
  readonly archive = output<void>();
  readonly unarchive = output<void>();
  readonly delete = output<void>();

  private readonly i18n = inject(I18nService);

  protected readonly badgeClass = computed(() => BADGE_CLASSES[this.badgeTone()]);

  protected readonly initial = computed(() => (this.fromName() || this.fromEmail() || 'Z').charAt(0).toUpperCase());

  /** Print just this email, laid out as a clean page in a hidden frame. */
  print(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const escape = (value: string | null | undefined) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const from =
      this.fromName() && this.fromEmail() && this.fromName() !== this.fromEmail()
        ? `${this.fromName()} <${this.fromEmail()}>`
        : this.fromName() || this.fromEmail();
    const t = (text: string, params?: Array<string | number>) => this.i18n.t(text, params);
    const rows = [
      [t('From'), from],
      [t('To'), this.to()],
      [t('Date'), this.date()],
      ...(this.badge() ? [[t('Status'), t(this.badge()!)]] : []),
    ]
      .map(([label, value]) => `<tr><th>${label}</th><td>${escape(value)}</td></tr>`)
      .join('');
    const printed = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());

    const html = `<!doctype html>
<html lang="${this.i18n.language()}">
<head>
<meta charset="utf-8" />
<title>${escape(this.subject() || t('Email'))}</title>
<style>
  @page { margin: 16mm; }
  body { margin: 0; font-family: Roboto, Arial, sans-serif; color: #0f172a; font-size: 12pt; }
  .band { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 6px;
          background: linear-gradient(90deg, #007979, #00706f, #2a835f); color: #fff;
          -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .band strong { font-size: 13pt; letter-spacing: .02em; }
  .band span { font-size: 9pt; opacity: .9; }
  h1 { margin: 18px 0 10px; font-size: 17pt; line-height: 1.3; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 14px; }
  th { width: 70px; padding: 3px 10px 3px 0; text-align: left; vertical-align: top; color: #64748b; font-weight: 600; font-size: 10pt; }
  td { padding: 3px 0; font-size: 10.5pt; }
  .body { border-top: 1px solid #e2e8f0; padding-top: 14px; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6; }
  footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 6px; color: #94a3b8; font-size: 8.5pt; }
</style>
</head>
<body>
  <div class="band"><strong>ZEBRON</strong><span>${escape(t(this.printLabel()))}</span></div>
  <h1>${escape(this.subject() || t('(No subject)'))}</h1>
  <table>${rows}</table>
  <div class="body">${escape(this.body())}</div>
  <footer>${escape(t('Printed {0} from the Zebron Mailbox', [printed]))}</footer>
</body>
</html>`;

    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(frame);

    const frameDocument = frame.contentDocument;
    const frameWindow = frame.contentWindow;
    if (!frameDocument || !frameWindow) {
      frame.remove();
      return;
    }

    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    frameWindow.addEventListener('afterprint', () => setTimeout(() => frame.remove(), 500), { once: true });
    setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
      // Fallback for browsers that don't fire afterprint on frames.
      setTimeout(() => frame.isConnected && frame.remove(), 60_000);
    }, 50);
  }
}

// =====================================================================
// COMPOSER
// =====================================================================

export interface MailDraft {
  to: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-mail-composer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cancel()' },
  imports: [MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslatePipe],
  template: `
    <div
      class="fixed inset-0 z-[60] flex items-stretch justify-center bg-slate-900/60 backdrop-blur-[2px] sm:items-center sm:p-6"
      (click)="cancel()"
    >
      <section
        class="flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[88vh] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mail-composer-title"
        (click)="$event.stopPropagation()"
      >
        <header class="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-4 py-3 sm:px-6">
          <div class="min-w-0">
            <h2 id="mail-composer-title" class="truncate text-lg font-semibold text-white">{{ heading() | t }}</h2>
            <p class="truncate text-xs text-white/80">{{ 'Send an email from Zebron.' | t }}</p>
          </div>
          <button
            type="button"
            (click)="cancel()"
            [disabled]="sending()"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-50"
            [attr.aria-label]="'Close' | t"
            [title]="'Close' | t"
          >
            <mat-icon class="!m-0 !h-5 !w-5 !text-[20px]">close</mat-icon>
          </button>
        </header>

        <form class="flex min-h-0 flex-1 flex-col" (submit)="$event.preventDefault(); submit()">
          <!-- Fields (scroll only on very short screens) -->
          <div class="min-h-0 flex-1 overflow-y-auto px-4 pt-4 sm:px-6">
            @if (error()) {
              <div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {{ error() | t }}
              </div>
            }

            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>{{ 'To' | t }}</mat-label>
              <input
                matInput
                type="email"
                [value]="to()"
                (input)="to.set($any($event.target).value)"
                [placeholder]="'recipient@example.com' | t"
                autocomplete="email"
                required
                [disabled]="sending()"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>{{ 'Subject' | t }}</mat-label>
              <input
                matInput
                type="text"
                [value]="subject()"
                (input)="subject.set($any($event.target).value)"
                [placeholder]="'Message subject' | t"
                required
                [disabled]="sending()"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>{{ 'Message' | t }}</mat-label>
              <textarea
                matInput
                rows="10"
                [value]="message()"
                (input)="message.set($any($event.target).value)"
                [placeholder]="'Write your message...' | t"
                required
                [disabled]="sending()"
              ></textarea>
            </mat-form-field>
          </div>

          <!-- Actions: always visible -->
          <div class="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <button
              type="button"
              (click)="cancel()"
              [disabled]="sending()"
              class="h-9 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {{ 'Cancel' | t }}
            </button>
            <button
              type="submit"
              [disabled]="sending()"
              class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <mat-icon class="!m-0 !h-[18px] !w-[18px] !text-[18px]" [class.animate-spin]="sending()">{{ sending() ? 'refresh' : 'send' }}</mat-icon>
              {{ (sending() ? 'Sending...' : submitLabel()) | t }}
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
})
export class MailComposerComponent {
  readonly heading = input('New email');
  readonly submitLabel = input('Send');
  readonly sending = input(false);
  readonly error = input<string | null>(null);

  /** Two-way bound fields: [(to)], [(subject)], [(message)]. */
  readonly to = model('');
  readonly subject = model('');
  readonly message = model('');

  readonly send = output<MailDraft>();
  readonly cancelled = output<void>();

  submit(): void {
    if (this.sending()) {
      return;
    }
    this.send.emit({ to: this.to().trim(), subject: this.subject().trim(), message: this.message().trim() });
  }

  cancel(): void {
    if (!this.sending()) {
      this.cancelled.emit();
    }
  }
}
