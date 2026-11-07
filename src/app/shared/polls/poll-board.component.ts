import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { PollCardComponent } from './poll-card.component';
import { PollEditorComponent } from './poll-editor.component';
import { Poll, PollContextType, PollDraft, emptyPollDraft, pollDraftProblems } from './poll.model';
import { PollService } from './poll.service';

/**
 * All polls of one live session, in real time.
 *
 * - Hosts (canManage): write polls ahead of time as drafts or open them
 *   straight away, watch answers come in, reveal the totals and close them.
 * - Everyone else: the open and closed polls, to vote and see shared results.
 *
 *   <app-poll-board [organizationId]="orgId" [parentId]="session.id" [canManage]="isStaff" />
 */
@Component({
  selector: 'app-poll-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, TranslatePipe, PollCardComponent, PollEditorComponent],
  template: `
    <div class="flex min-w-0 flex-col gap-3">
      @if (canManage()) {
        @if (draft(); as current) {
          <section class="min-w-0 rounded-xl border border-[#007979]/30 bg-teal-50/40 p-3 sm:p-4">
            <h3 class="mb-3 text-sm font-semibold text-slate-900">{{ 'New poll' | t }}</h3>
            <app-poll-editor [draft]="current" (draftChange)="draft.set($event)" [showClosingTime]="false" />
            @if (formError()) {
              <p class="mt-2 text-sm text-rose-700" role="alert">{{ formError() | t }}</p>
            }
            <div class="mt-3 flex flex-wrap items-center justify-end gap-2">
              <button type="button" class="h-9 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100" (click)="draft.set(null)">
                {{ 'Cancel' | t }}
              </button>
              <button
                type="button"
                class="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                [disabled]="saving()"
                (click)="save('draft')"
              >
                {{ 'Save for later' | t }}
              </button>
              <button
                type="button"
                class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
                [disabled]="saving()"
                (click)="save('open')"
              >
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">play_arrow</mat-icon>
                {{ 'Open now' | t }}
              </button>
            </div>
          </section>
        } @else {
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-1.5 self-start rounded-lg border border-dashed border-[#007979]/50 px-4 text-sm font-semibold text-[#007979] hover:bg-teal-50"
            (click)="startPoll()"
          >
            <mat-icon class="!h-5 !w-5 !text-xl !leading-none" aria-hidden="true">add_chart</mat-icon>
            {{ 'New poll' | t }}
          </button>
        }
      }

      @if (loadError()) {
        <p class="text-sm text-rose-700" role="alert">{{ loadError() | t }}</p>
      } @else if (polls().length) {
        @for (poll of polls(); track poll.id) {
          <app-poll-card [poll]="poll" [canManage]="canManage()" />
        }
      } @else if (!canManage() && showEmpty()) {
        <p class="text-sm text-slate-500">{{ 'No polls yet. When your host opens one, it appears here.' | t }}</p>
      }
    </div>
  `,
})
export class PollBoardComponent {
  private readonly service = inject(PollService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  readonly organizationId = input.required<string>();
  readonly parentId = input.required<string>();
  readonly contextType = input<PollContextType>('live');
  readonly canManage = input(false);
  /** Show "No polls yet" to learners (off when the board sits inside a busy card). */
  readonly showEmpty = input(true);

  protected readonly polls = signal<Poll[]>([]);
  protected readonly loadError = signal('');
  protected readonly draft = signal<PollDraft | null>(null);
  protected readonly formError = signal('');
  protected readonly saving = signal(false);

  private readonly key = computed(() => `${this.organizationId()}|${this.parentId()}|${this.canManage()}`);

  constructor() {
    effect((onCleanup) => {
      this.key();
      this.loadError.set('');
      const stop = this.service.watchSessionPolls(
        this.organizationId(),
        this.parentId(),
        this.canManage(),
        (polls) => this.polls.set(polls),
        () => this.loadError.set('Polls could not be loaded.'),
      );
      onCleanup(stop);
    });
  }

  protected startPoll(): void {
    this.formError.set('');
    this.draft.set(emptyPollDraft());
  }

  protected async save(status: 'draft' | 'open'): Promise<void> {
    const draft = this.draft();
    if (!draft) return;

    const problems = pollDraftProblems(draft);
    if (problems.length) {
      this.formError.set(problems[0]);
      return;
    }

    const user = this.auth.firebaseUser();
    if (!user) {
      this.formError.set('Sign in to create a poll.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    try {
      await this.service.create(
        { type: this.contextType(), organizationId: this.organizationId(), parentId: this.parentId() },
        draft,
        {
          status,
          resultsVisibility: 'host',
          createdBy: user.uid,
          createdByName: user.displayName || user.email || this.i18n.t('Host'),
        },
      );
      this.draft.set(null);
    } catch {
      this.formError.set('The poll could not be saved. Try again.');
    } finally {
      this.saving.set(false);
    }
  }
}
