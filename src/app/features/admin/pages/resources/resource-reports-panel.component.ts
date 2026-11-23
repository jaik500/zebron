import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';

import { ResourceReport, ResourceReportService, reportReasonLabel } from '../../../resources/resource-report.service';

/**
 * Open "Report a problem" reports for the resource being edited
 * (Admin → Resources → resource form). Fix the details in the form,
 * then press Fixed; press Dismiss when the report is not right.
 * The resource admin page keeps the reports live (ResourceReportService.watch).
 */
@Component({
  selector: 'app-resource-reports-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule],
  template: `
    @if (reports().length) {
      <div class="mb-5 rounded-xl border border-red-200 bg-red-50 p-4" role="region" aria-label="Reported problems">
        <p class="flex items-center gap-2 text-sm font-semibold text-red-800">
          <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">flag</mat-icon>
          {{ reports().length }} reported {{ reports().length === 1 ? 'problem' : 'problems' }}
        </p>
        <ul class="mt-3 space-y-3">
          @for (report of reports(); track report.id) {
            <li class="rounded-lg bg-white p-3 text-sm shadow-sm">
              <p class="font-medium text-gray-900">{{ label(report) }}</p>
              @if (report.details) {
                <p class="mt-1 whitespace-pre-line text-gray-700 [overflow-wrap:anywhere]">{{ report.details }}</p>
              }
              <p class="mt-1 text-xs text-gray-500">
                {{ report.createdAt ? (report.createdAt | date: 'MMM d, y, h:mm a') : 'Just now' }}
                · {{ report.reportedBy ? 'signed-in visitor' : 'guest' }}
                @if (report.contactEmail) {
                  · <a class="font-medium text-[#007979] hover:underline" [href]="'mailto:' + report.contactEmail">{{ report.contactEmail }}</a>
                }
              </p>
              <div class="mt-2 flex gap-2">
                <button type="button" (click)="close(report, 'resolved')" [disabled]="busy() === report.id"
                  class="inline-flex items-center gap-1 rounded-md bg-[#007979] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#006666] disabled:opacity-50">
                  <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">check</mat-icon>Fixed
                </button>
                <button type="button" (click)="close(report, 'dismissed')" [disabled]="busy() === report.id"
                  class="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  Dismiss
                </button>
              </div>
            </li>
          }
        </ul>
        <p class="mt-3 text-xs text-red-800/80">Correct the details below and save, then mark the report Fixed. Verify the resource again if you checked it with the provider.</p>
      </div>
    }
  `,
})
export class ResourceReportsPanelComponent {
  private readonly service = inject(ResourceReportService);
  private readonly toast = inject(HotToastService);

  readonly resourceId = input<string | null>(null);

  protected readonly busy = signal<string | null>(null);

  protected readonly reports = computed(() => {
    const id = this.resourceId();
    return id ? this.service.openReports().filter((report) => report.resourceId === id) : [];
  });

  protected label(report: ResourceReport): string {
    return reportReasonLabel(report.reason);
  }

  protected async close(report: ResourceReport, status: 'resolved' | 'dismissed'): Promise<void> {
    this.busy.set(report.id);
    try {
      await this.service.close(report.id, status);
      this.toast.success(status === 'resolved' ? 'Report marked fixed.' : 'Report dismissed.');
    } catch {
      this.toast.error('The report could not be updated. Try again.');
    } finally {
      this.busy.set(null);
    }
  }
}
