import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from '../../../core/services/firebase-config';

interface Citation {
  number: number;
  id: string;
  kind: 'platform_article' | 'organization_article' | 'guide';
  title: string;
  link: string | null;
  excerpt: string;
  content: string;
}

interface AssistantReply {
  answer: string;
  mode: 'ai' | 'search';
  citations: Citation[];
  suggestTicket: boolean;
  scope: { organizationName: string | null; role: string | null };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  reply?: AssistantReply;
}

const STORAGE_KEY = 'zebron:assistant:';

/**
 * Floating help assistant. Answers come from the server, scoped to the
 * organization in the current page and the person's role there.
 */
@Component({
  selector: 'app-support-assistant',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!open()) {
      <button
        type="button"
        class="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-[#007979] px-5 text-white shadow-lg transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-[#007979]/30"
        aria-label="Open the Zebron help assistant"
        (click)="open.set(true)"
      >
        <mat-icon>forum</mat-icon>
        <span class="hidden font-semibold sm:inline">Ask for help</span>
      </button>
    } @else {
      <section
        class="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[36rem] sm:w-[24rem] sm:rounded-2xl"
        role="dialog"
        aria-label="Zebron help assistant"
      >
        <!-- Header -->
        <header class="flex items-center justify-between gap-2 bg-gradient-to-r from-[#032D42] to-[#007979] px-4 py-3 text-white">
          <div class="min-w-0">
            <p class="font-semibold">Zebron Assistant</p>
            <p class="truncate text-xs text-white/75">
              {{ scopeLabel() }}
            </p>
          </div>
          <div class="flex shrink-0 items-center">
            <button mat-icon-button type="button" class="!text-white" aria-label="Start over" title="Start over" (click)="reset()">
              <mat-icon>restart_alt</mat-icon>
            </button>
            <button mat-icon-button type="button" class="!text-white" aria-label="Close assistant" title="Close" (click)="open.set(false)">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </header>

        <!-- Messages -->
        <div #scroller class="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4" aria-live="polite">
          @if (messages().length === 0) {
            <div class="rounded-xl bg-white p-4 text-sm text-gray-700 shadow-sm">
              <p class="font-semibold text-gray-900">Hi{{ firstName() ? ' ' + firstName() : '' }}! How can I help?</p>
              <p class="mt-1 text-gray-600">I answer from Zebron's help articles{{ organizationId() ? ' and your organization\\'s' : '' }}, based on what your role can do.</p>
              <div class="mt-3 flex flex-wrap gap-2">
                @for (suggestion of suggestions; track suggestion) {
                  <button type="button" class="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 hover:border-[#007979] hover:text-[#007979]" (click)="ask(suggestion)">
                    {{ suggestion }}
                  </button>
                }
              </div>
            </div>
          }

          @for (message of messages(); track $index; let messageIndex = $index) {
            @if (message.role === 'user') {
              <div class="flex justify-end">
                <p class="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-[#007979] px-3 py-2 text-sm text-white">{{ message.text }}</p>
              </div>
            } @else {
              <div class="max-w-[95%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-gray-800 shadow-sm">
                <p class="whitespace-pre-wrap break-words leading-6">{{ display(message.text) }}</p>

                @if (message.reply?.citations?.length) {
                  <div class="mt-2 border-t border-gray-100 pt-2">
                    <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Sources</p>
                    <ul class="mt-1 space-y-1">
                      @for (citation of message.reply!.citations; track citation.id) {
                        <li>
                          <button type="button" class="flex w-full items-start gap-1.5 rounded px-1 py-0.5 text-left text-xs text-[#007979] hover:bg-teal-50"
                            [attr.aria-expanded]="expanded() === messageIndex + ':' + citation.id"
                            (click)="toggle(messageIndex + ':' + citation.id)">
                            <span class="font-semibold">[{{ citation.number }}]</span>
                            <span class="flex-1">{{ citation.title }}</span>
                            <span class="shrink-0 text-gray-400">{{ kindLabel(citation.kind) }}</span>
                          </button>
                          @if (expanded() === messageIndex + ':' + citation.id) {
                            <div class="mt-1 max-h-60 overflow-y-auto rounded-lg bg-gray-50 p-2 text-xs leading-5 text-gray-700">
                              <p class="whitespace-pre-wrap">{{ citation.content || citation.excerpt }}</p>
                              @if (citation.link) {
                                <a [routerLink]="citation.link.split('?')[0]" class="mt-2 inline-flex items-center gap-1 font-semibold text-[#007979] hover:underline" (click)="open.set(false)">
                                  Open page
                                  <mat-icon class="!h-3.5 !w-3.5 !text-sm">arrow_forward</mat-icon>
                                </a>
                              }
                            </div>
                          }
                        </li>
                      }
                    </ul>
                  </div>
                }

                @if (message.reply?.suggestTicket) {
                  <button type="button" class="mt-2 inline-flex items-center gap-1 rounded-lg border border-[#007979]/30 px-2.5 py-1 text-xs font-semibold text-[#007979] hover:bg-teal-50" (click)="openTicket()">
                    <mat-icon class="!h-4 !w-4 !text-base">confirmation_number</mat-icon>
                    Still stuck? Open a support ticket
                  </button>
                }

                @if (message.reply?.mode === 'search') {
                  <p class="mt-2 text-[11px] text-gray-400">Matched from help articles.</p>
                }
              </div>
            }
          }

          @if (thinking()) {
            <div class="inline-flex items-center gap-1 rounded-2xl bg-white px-3 py-2 shadow-sm" aria-label="Thinking">
              <span class="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
              <span class="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
              <span class="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
            </div>
          }

          @if (error()) {
            <p class="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800" role="alert">{{ error() }}</p>
          }
        </div>

        <!-- Input -->
        <form class="flex items-end gap-2 border-t border-gray-200 bg-white p-3" (ngSubmit)="ask(draft)">
          <textarea
            #input
            rows="1"
            maxlength="1000"
            class="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-base focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/20 sm:text-sm"
            placeholder="Ask a question…"
            aria-label="Your question"
            [(ngModel)]="draft"
            name="question"
            (keydown.enter)="onEnter($event)"
          ></textarea>
          <button mat-icon-button type="submit" class="!bg-[#007979] !text-white" aria-label="Send" [disabled]="thinking() || !draft.trim()">
            <mat-icon>send</mat-icon>
          </button>
        </form>

        <p class="bg-white px-3 pb-2 text-[10px] text-gray-400">
          AI answers can be wrong. Check the sources, and open a ticket for anything urgent.
        </p>
      </section>
    }
  `,
})
export class SupportAssistantComponent {
  /** Organization from the current page, if any. */
  readonly organizationId = input<string | null>(null);
  readonly firstName = input<string | null>(null);

  private readonly router = inject(Router);
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  protected readonly suggestions = [
    'What can my role do?',
    'How do I invite someone?',
    'How do I import questions?',
    'How do I contact Zebron support?',
  ];

  protected readonly open = signal(false);
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly thinking = signal(false);
  protected readonly error = signal('');
  protected readonly expanded = signal<string | null>(null);
  protected readonly lastScope = signal<AssistantReply['scope'] | null>(null);

  protected draft = '';

  protected readonly scopeLabel = computed(() => {
    const scope = this.lastScope();

    if (scope?.organizationName) {
      return `${scope.organizationName}${scope.role ? ' · ' + scope.role : ''}`;
    }

    return this.organizationId() ? 'Your organization' : 'Zebron help';
  });

  constructor() {
    // A separate conversation per organization, kept for this browser tab.
    effect(() => {
      const key = STORAGE_KEY + (this.organizationId() ?? 'none');

      try {
        const saved = sessionStorage.getItem(key);
        this.messages.set(saved ? (JSON.parse(saved) as ChatMessage[]) : []);
      } catch {
        this.messages.set([]);
      }

      this.lastScope.set(null);
    });

    effect(() => {
      const messages = this.messages();
      const key = STORAGE_KEY + (this.organizationId() ?? 'none');

      try {
        sessionStorage.setItem(key, JSON.stringify(messages.slice(-20)));
      } catch {
        // Storage unavailable; the conversation lasts until reload.
      }

      queueMicrotask(() => {
        const element = this.scroller()?.nativeElement;
        if (element) {
          element.scrollTop = element.scrollHeight;
        }
      });
    });
  }

  protected onEnter(event: Event): void {
    const keyboard = event as KeyboardEvent;

    if (!keyboard.shiftKey) {
      keyboard.preventDefault();
      void this.ask(this.draft);
    }
  }

  protected async ask(text: string): Promise<void> {
    const question = text.trim();

    if (!question || this.thinking()) {
      return;
    }

    const history = this.messages().map((message) => ({ role: message.role, text: message.text }));

    this.messages.update((messages) => [...messages, { role: 'user', text: question }]);
    this.draft = '';
    this.thinking.set(true);
    this.error.set('');

    try {
      const callable = httpsCallable<
        { question: string; organizationId: string | null; history: Array<{ role: string; text: string }> },
        AssistantReply
      >(firebaseFunctions, 'askSupportAssistant');

      const result = await callable({ question, organizationId: this.organizationId(), history });

      this.lastScope.set(result.data.scope);
      this.messages.update((messages) => [...messages, { role: 'assistant', text: result.data.answer, reply: result.data }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      this.error.set(
        !message || /^internal$/i.test(message)
          ? 'The assistant is not available right now. Try again shortly, or open a support ticket.'
          : message,
      );
    } finally {
      this.thinking.set(false);
    }
  }

  protected reset(): void {
    this.messages.set([]);
    this.error.set('');
    this.expanded.set(null);
  }

  protected toggle(key: string): void {
    this.expanded.set(this.expanded() === key ? null : key);
  }

  /** Light cleanup of model formatting for plain-text display. */
  protected display(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^\s*[*-]\s+/gm, '• ').replace(/^#+\s*/gm, '');
  }

  protected kindLabel(kind: Citation['kind']): string {
    return kind === 'organization_article' ? 'Your org' : kind === 'guide' ? 'Guide' : 'Zebron';
  }

  /** Opens Help & Support with the conversation as the ticket details. */
  protected openTicket(): void {
    const lastQuestion = [...this.messages()].reverse().find((message) => message.role === 'user')?.text ?? '';
    const transcript = this.messages()
      .slice(-6)
      .map((message) => `${message.role === 'user' ? 'Me' : 'Assistant'}: ${message.text}`)
      .join('\n\n')
      .slice(0, 1500);

    this.open.set(false);

    void this.router.navigate(['/support'], {
      queryParams: {
        ...(this.organizationId() ? { organizationId: this.organizationId() } : {}),
        subject: lastQuestion.slice(0, 140),
        details: `${lastQuestion}\n\n--- Conversation with the assistant ---\n${transcript}`,
        from: typeof window !== 'undefined' ? window.location.pathname : undefined,
      },
    });
  }
}
