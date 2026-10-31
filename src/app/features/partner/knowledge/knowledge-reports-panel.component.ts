import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { KnowledgeFeedbackService, KnowledgeReport } from '../../../core/services/knowledge-feedback.service';

/**
 * Open reports on Knowledge Center articles, for the people who look
 * after them: an organization's staff (organizationId) or Zebron
 * platform administrators (organizationId null = Zebron articles).
 * Hidden when there is nothing to review.
 */
@Component({
  selector: 'app-knowledge-reports-panel',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (reports().length) {
      <section class="mb-6 overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 bg-red-50 px-4 py-3 text-left"
          [attr.aria-expanded]="open()"
          (click)="open.set(!open())"
        >
          <span class="flex items-center gap-2 text-sm font-semibold text-red-800">
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">flag</mat-icon>
            {{ (reports().length === 1 ? '1 article report to review' : '{0} article reports to review') | t: [reports().length] }}
          </span>
          <mat-icon class="!text-red-700" aria-hidden="true">{{ open() ? 'expand_less' : 'expand_more' }}</mat-icon>
        </button>

        @if (open()) {
          <ul class="divide-y divide-gray-100">
            @for (report of reports(); track report.id) {
              <li class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-gray-900">{{ report.articleTitle || report.articleId }}</p>
                  <p class="text-sm text-red-700">{{ feedback.reasonLabel(report.reason) | t }}</p>
                  @if (report.details) {
                    <p class="mt-1 whitespace-pre-line text-sm text-gray-600">{{ report.details }}</p>
                  }
                  <p class="mt-1 text-xs text-gray-400">{{ 'Reported by {0}' | t: [report.reporterName || ('a reader' | t)] }}</p>
                </div>
                <button
                  type="button"
                  class="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  [disabled]="busyId() === report.id"
                  (click)="resolve(report)"
                >
                  {{ 'Mark resolved' | t }}
                </button>
              </li>
            }
          </ul>
        }
      </section>
    }
  `,
})
export class KnowledgeReportsPanelComponent implements OnInit {
  /** Organization whose articles to review; null for Zebron articles. */
  readonly organizationId = input<string | null>(null);

  protected readonly feedback = inject(KnowledgeFeedbackService);
  private readonly auth = inject(AuthService);

  protected readonly reports = signal<KnowledgeReport[]>([]);
  protected readonly open = signal(false);
  protected readonly busyId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.reports.set(await this.feedback.openReports(this.organizationId()));
    } catch (error) {
      console.info('[Knowledge Center] Reports not available.', error);
    }
  }

  protected async resolve(report: KnowledgeReport): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) {
      return;
    }
    this.busyId.set(report.id);
    try {
      await this.feedback.resolveReport(report.id, uid);
      this.reports.update((list) => list.filter((item) => item.id !== report.id));
    } finally {
      this.busyId.set(null);
    }
  }
}
