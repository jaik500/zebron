import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { PageTitleService } from '../../../../core/services/page-title.service';
import {
  ContractTerms,
  ContractTermsSection,
  OrganizationContractService,
  REQUEST_STATUS_CLASSES,
  REQUEST_STATUS_LABELS,
  ServiceRequest,
  ServiceRequestStatus,
} from '../../../partner/contract/organization-contract.service';

type Tab = 'requests' | 'terms';
type StatusFilter = 'open' | 'all' | ServiceRequestStatus;

/**
 * Zebron admin: partner requests (new apps, suspensions, retirements,
 * terminations, ownership transfers, exports, questions) and the
 * partner agreement text.
 *
 * Route: /admin/organizations/requests (platform administrators).
 */
@Component({
  selector: 'app-organization-service-requests',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-[#032D42]">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 class="text-2xl font-bold text-white">Partner Requests</h1>
            <p class="text-sm text-white/75">Review partner requests and manage the partner agreement.</p>
          </div>
          <a mat-stroked-button class="!border-white/40 !text-white" routerLink="/admin">
            <mat-icon>arrow_back</mat-icon>
            Admin
          </a>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="mb-5 flex flex-wrap gap-2">
          <button type="button" class="rounded-full border px-4 py-1.5 text-sm font-medium"
            [class]="tab() === 'requests' ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-gray-200 bg-white text-gray-700'"
            (click)="tab.set('requests')">
            Requests
            @if (openCount() > 0) {
              <span class="ml-1 rounded-full bg-[#007979] px-1.5 text-[11px] font-bold text-white">{{ openCount() }}</span>
            }
          </button>
          <button type="button" class="rounded-full border px-4 py-1.5 text-sm font-medium"
            [class]="tab() === 'terms' ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-gray-200 bg-white text-gray-700'"
            (click)="openTermsEditor()">
            Partner agreement
          </button>
        </div>

        @if (message()) {
          <p class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{{ message() }}</p>
        }
        @if (error()) {
          <p class="mb-4 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() }}</p>
        }

        @if (loading()) {
          <p class="text-sm text-gray-500">Loading…</p>
        } @else if (tab() === 'requests') {
          <!-- ============ FILTERS ============ -->
          <div class="mb-4 grid gap-x-3 sm:grid-cols-[14rem_1fr]">
            <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
              <mat-label>Status</mat-label>
              <mat-select [value]="statusFilter()" (selectionChange)="statusFilter.set($event.value)">
                <mat-option value="open">Needs Zebron (open)</mat-option>
                <mat-option value="awaiting_owner">Waiting for partner owner</mat-option>
                <mat-option value="completed">Completed</mat-option>
                <mat-option value="rejected">Not approved</mat-option>
                <mat-option value="all">All</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
              <mat-icon matPrefix>search</mat-icon>
              <mat-label>Search organization or request</mat-label>
              <input matInput [ngModel]="search()" (ngModelChange)="search.set($event)" name="search" />
            </mat-form-field>
          </div>

          @if (filtered().length === 0) {
            <section class="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No requests here.
            </section>
          } @else {
            <div class="space-y-3">
              @for (item of filtered(); track item.id) {
                <article class="rounded-xl border bg-white p-5 shadow-sm"
                  [class]="item.type === 'terminate_contract' ? 'border-red-200' : 'border-gray-200'">
                  <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="font-semibold text-gray-900">{{ item.organizationName }}</p>
                        <span class="text-gray-300">·</span>
                        <p class="font-medium" [class]="item.type === 'terminate_contract' ? 'text-red-800' : 'text-gray-800'">{{ item.title }}</p>
                        <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="statusClass(item.status)">{{ statusLabel(item) }}</span>
                      </div>

                      <p class="mt-1 text-xs text-gray-500">
                        {{ item.requestedByName || 'Unknown' }}{{ item.requestedByRole ? ' (' + roleLabel(item.requestedByRole) + ')' : '' }}
                        · {{ item.createdAt | date: 'medium' }}
                        @if (item.ownerApprovedByName) {
                          · owner approved: {{ item.ownerApprovedByName }}
                        }
                      </p>

                      @if (item.newOwnerName) {
                        <p class="mt-1 text-sm text-gray-700">New owner: <strong>{{ item.newOwnerName }}</strong></p>
                      }
                      @if (item.terminationEffectiveDate) {
                        <p class="mt-1 text-sm text-red-800">Access ends {{ item.terminationEffectiveDate | date: 'longDate' }} (the partner can cancel until then).</p>
                      }
                      @if (item.reason) {
                        <p class="mt-2 whitespace-pre-line break-words rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{{ item.reason }}</p>
                      }
                      @if (item.outcome) {
                        <p class="mt-2 text-sm text-gray-700"><strong>Outcome:</strong> {{ item.outcome }}</p>
                      }

                      @if (item.history.length > 0) {
                        <details class="mt-2 text-xs text-gray-500">
                          <summary class="cursor-pointer">History ({{ item.history.length }})</summary>
                          <ul class="mt-1 space-y-0.5">
                            @for (entry of item.history; track $index) {
                              <li>{{ entry.at | date: 'short' }} · {{ entry.byName || 'System' }}: {{ entry.message }}</li>
                            }
                          </ul>
                        </details>
                      }
                    </div>

                    @if (item.status === 'submitted' && !(item.type === 'terminate_contract' && acknowledged(item))) {
                      <div class="w-full shrink-0 lg:w-80">
                        <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
                          <mat-label>{{ item.type === 'terminate_contract' ? 'Note to partner (optional)' : 'Note (required to reject)' }}</mat-label>
                          <textarea matInput rows="2" [ngModel]="notes()[item.id] ?? ''" (ngModelChange)="setNote(item.id, $event)" [name]="'note-' + item.id"></textarea>
                        </mat-form-field>

                        <div class="mt-2 flex flex-wrap justify-end gap-2">
                          @if (item.type !== 'terminate_contract') {
                            <button mat-stroked-button type="button" [disabled]="busyId() === item.id || !(notes()[item.id] ?? '').trim()" (click)="review(item, 'reject')">Reject</button>
                          }
                          <button mat-flat-button type="button" class="!bg-[#007979] !text-white" [disabled]="busyId() === item.id" (click)="review(item, 'approve')">
                            <mat-icon>check</mat-icon>
                            {{ approveLabel(item) }}
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </article>
              }
            </div>
          }
        } @else {
          <!-- ============ AGREEMENT EDITOR ============ -->
          <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <p class="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Saving creates a new version. Partner owners are asked to accept it, and earlier versions are kept.
              The default text is a template; have it reviewed by a lawyer before relying on it.
            </p>

            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>Agreement title</mat-label>
              <input matInput [(ngModel)]="termsTitle" name="termsTitle" />
            </mat-form-field>

            @for (section of termsSections; track $index; let index = $index) {
              <div class="mb-4 rounded-xl border border-gray-200 p-4">
                <div class="flex items-start gap-2">
                  <mat-form-field appearance="outline" class="zb-field zb-field--grow">
                    <mat-label>Section heading</mat-label>
                    <input matInput [(ngModel)]="section.heading" [name]="'heading-' + index" />
                  </mat-form-field>
                  <button mat-icon-button type="button" aria-label="Move up" title="Move up" [disabled]="index === 0" (click)="moveSection(index, -1)">
                    <mat-icon>arrow_upward</mat-icon>
                  </button>
                  <button mat-icon-button type="button" aria-label="Remove section" title="Remove section" (click)="removeSection(index)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                <mat-form-field appearance="outline" class="zb-field zb-field--flush">
                  <mat-label>Text</mat-label>
                  <textarea matInput rows="4" [(ngModel)]="section.body" [name]="'body-' + index"></textarea>
                </mat-form-field>
              </div>
            }

            <div class="flex flex-wrap justify-between gap-2">
              <button mat-stroked-button type="button" (click)="addSection()">
                <mat-icon>add</mat-icon>
                Add section
              </button>
              <button mat-flat-button type="button" class="!bg-[#007979] !text-white" [disabled]="savingTerms()" (click)="saveTerms()">
                <mat-icon>save</mat-icon>
                {{ savingTerms() ? 'Saving…' : 'Save new version' }}
              </button>
            </div>

            @if (terms(); as current) {
              <p class="mt-3 text-xs text-gray-500">
                Current version {{ current.version }}{{ current.updatedAt ? ', saved ' : ' (default template)' }}{{ current.updatedAt ? (current.updatedAt | date: 'medium') : '' }}
              </p>
            }
          </section>
        }
      </main>
    </div>
  `,
})
export class OrganizationServiceRequestsComponent implements OnInit {
  private readonly contracts = inject(OrganizationContractService);
  private readonly pageTitleService = inject(PageTitleService);

  protected readonly tab = signal<Tab>('requests');
  protected readonly requests = signal<ServiceRequest[]>([]);
  protected readonly terms = signal<ContractTerms | null>(null);
  protected readonly statusFilter = signal<StatusFilter>('open');
  protected readonly search = signal('');
  protected readonly notes = signal<Record<string, string>>({});
  protected readonly loading = signal(true);
  protected readonly busyId = signal<string | null>(null);
  protected readonly savingTerms = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');

  protected termsTitle = '';
  protected termsSections: ContractTermsSection[] = [];

  protected readonly openCount = computed(
    () => this.requests().filter((item) => item.status === 'submitted' && !this.acknowledged(item)).length,
  );

  protected readonly filtered = computed(() => {
    const filter = this.statusFilter();
    const term = this.search().trim().toLowerCase();

    return this.requests()
      .filter((item) =>
        filter === 'all' ? true : filter === 'open' ? item.status === 'submitted' : item.status === filter,
      )
      .filter(
        (item) =>
          !term ||
          [item.organizationName, item.title, item.requestedByName ?? '', item.reason ?? '']
            .some((value) => value.toLowerCase().includes(term)),
      );
  });

  async ngOnInit(): Promise<void> {
    this.pageTitleService.setTitle('Admin | Partner Requests');
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const result = await this.contracts.listAllRequests();
      this.requests.set(result.requests);
      this.terms.set(result.terms);
    } catch (error) {
      this.error.set(this.messageOf(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected setNote(id: string, value: string): void {
    this.notes.update((notes) => ({ ...notes, [id]: value }));
  }

  protected async review(item: ServiceRequest, decision: 'approve' | 'reject'): Promise<void> {
    this.busyId.set(item.id);
    this.error.set('');
    this.message.set('');

    try {
      const result = await this.contracts.review(item.id, decision, (this.notes()[item.id] ?? '').trim());
      this.message.set(
        decision === 'reject'
          ? `Rejected: ${item.organizationName} · ${item.title}. The partner has been told.`
          : `${item.organizationName}: ${result.outcome}`,
      );
      await this.load();
    } catch (error) {
      this.error.set(this.messageOf(error));
    } finally {
      this.busyId.set(null);
    }
  }

  protected acknowledged(item: ServiceRequest): boolean {
    return item.type === 'terminate_contract' && item.history.some((entry) => entry.message.startsWith('Zebron:'));
  }

  protected approveLabel(item: ServiceRequest): string {
    switch (item.type) {
      case 'add_application':
        return 'Approve & provision';
      case 'suspend_application':
        return 'Suspend app';
      case 'resume_application':
        return 'Resume app';
      case 'retire_application':
        return 'Retire app';
      case 'transfer_ownership':
        return 'Transfer ownership';
      case 'terminate_contract':
        return 'Acknowledge';
      default:
        return 'Mark as done';
    }
  }

  protected statusLabel(item: ServiceRequest): string {
    if (item.type === 'terminate_contract' && item.status === 'submitted') {
      return this.acknowledged(item) ? 'In notice period' : 'Notice given';
    }

    return REQUEST_STATUS_LABELS[item.status] ?? item.status;
  }

  protected statusClass(status: ServiceRequestStatus): string {
    return REQUEST_STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600';
  }

  protected roleLabel(role: string): string {
    return (
      {
        org_owner: 'Owner',
        org_admin: 'Admin',
        org_manager: 'Manager',
        platform_admin: 'Zebron',
      } as Record<string, string>
    )[role] ?? role;
  }

  // ---------------- Agreement editor ----------------

  protected openTermsEditor(): void {
    const current = this.terms();

    this.termsTitle = current?.title ?? 'Zebron Partner Agreement';
    this.termsSections = (current?.sections ?? []).map((section) => ({ ...section }));
    this.tab.set('terms');
  }

  protected addSection(): void {
    this.termsSections = [...this.termsSections, { heading: `${this.termsSections.length + 1}. New section`, body: '' }];
  }

  protected removeSection(index: number): void {
    this.termsSections = this.termsSections.filter((_, position) => position !== index);
  }

  protected moveSection(index: number, direction: -1 | 1): void {
    const target = index + direction;

    if (target < 0 || target >= this.termsSections.length) {
      return;
    }

    const next = [...this.termsSections];
    [next[index], next[target]] = [next[target], next[index]];
    this.termsSections = next;
  }

  protected async saveTerms(): Promise<void> {
    this.savingTerms.set(true);
    this.error.set('');
    this.message.set('');

    try {
      const result = await this.contracts.updateTerms(
        this.termsTitle.trim(),
        this.termsSections
          .map((section) => ({ heading: section.heading.trim(), body: section.body.trim() }))
          .filter((section) => section.heading && section.body),
      );

      this.message.set(`Saved agreement version ${result.version}. Partner owners will be asked to accept it.`);
      await this.load();
      this.openTermsEditor();
    } catch (error) {
      this.error.set(this.messageOf(error));
    } finally {
      this.savingTerms.set(false);
    }
  }

  private messageOf(error: unknown): string {
    return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
  }
}
