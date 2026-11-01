import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { firestore } from '../../../core/services/firebase-config';
import { PageTitleService } from '../../../core/services/page-title.service';

import { courseDate } from '../course.model';

interface VerifiedCertificate {
  code: string;
  learnerName: string;
  courseTitle: string;
  providerName: string;
  skills: string[];
  score: number | null;
  issuedAt: Timestamp | null;
  revoked: boolean;
  /** Certification credentials expire; course certificates do not. */
  kind: 'course' | 'certification';
  expiresAt: Timestamp | null;
}

/**
 * Public certificate check: /verify and /verify/<code>. Employers type the
 * code printed on a certificate and see who earned it, for which course,
 * when and with what score. Certificates are issued by the course exam
 * Cloud Function (certificates/{code}); anyone may read one by its code.
 */
@Component({
  selector: 'app-certificate-verify',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, TranslatePipe],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <p class="text-xs font-bold uppercase tracking-[0.15em] text-white/80">{{ 'Zebron Learning' | t }}</p>
          <h1 class="mt-1 text-2xl font-bold">{{ 'Check a certificate' | t }}</h1>
          <p class="mt-1 text-sm text-white/85">{{ 'Enter the code printed on a Zebron certificate to confirm it is genuine.' | t }}</p>

          <form class="mt-4 flex gap-2" (ngSubmit)="check()">
            <label class="sr-only" for="certificate-code">{{ 'Certificate code' | t }}</label>
            <input
              id="certificate-code"
              name="code"
              class="h-11 min-w-0 flex-1 rounded-lg border-0 px-4 font-mono text-base uppercase tracking-wider text-slate-900 outline-none focus:ring-2 focus:ring-white/60"
              placeholder="ZB-XXXX-XXXX"
              autocomplete="off"
              [(ngModel)]="input"
            />
            <button type="submit" class="h-11 shrink-0 rounded-lg bg-white px-5 font-bold text-[#007979] hover:bg-teal-50 disabled:opacity-60" [disabled]="loading()">
              {{ (loading() ? 'Checking...' : 'Check') | t }}
            </button>
          </form>
        </div>
      </header>

      <div class="mx-auto max-w-3xl px-4 py-6 sm:px-6" aria-live="polite">
        @if (certificate(); as found) {
          @if (found.revoked) {
            <section class="rounded-2xl border-2 border-rose-200 bg-white p-6">
              <p class="flex items-center gap-2 font-semibold text-rose-800">
                <mat-icon aria-hidden="true">block</mat-icon>{{ 'This certificate has been withdrawn.' | t }}
              </p>
            </section>
          } @else {
            <section class="rounded-2xl border-2 border-emerald-200 bg-white p-6">
              <p class="flex items-center gap-2 font-semibold text-emerald-700">
                <mat-icon aria-hidden="true">verified</mat-icon>{{ 'Genuine Zebron certificate' | t }}
              </p>
              <dl class="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt class="text-xs uppercase tracking-wide text-slate-500">{{ 'Awarded to' | t }}</dt>
                  <dd class="text-lg font-semibold text-slate-900">{{ found.learnerName }}</dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-slate-500">{{ (found.kind === 'certification' ? 'Certification' : 'Course') | t }}</dt>
                  <dd class="text-lg font-semibold text-slate-900">{{ found.courseTitle }}</dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-slate-500">{{ 'Issued by' | t }}</dt>
                  <dd class="text-slate-800">{{ found.providerName === 'Zebron' ? 'Zebron' : 'Zebron · ' + found.providerName }}</dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-slate-500">{{ 'Date' | t }}</dt>
                  <dd class="text-slate-800">{{ issued() }}</dd>
                </div>
                @if (found.expiresAt) {
                  <div>
                    <dt class="text-xs uppercase tracking-wide text-slate-500">{{ 'Valid until' | t }}</dt>
                    <dd [class]="expired() ? 'font-semibold text-rose-700' : 'text-slate-800'">
                      {{ expiry() }}
                      @if (expired()) {
                        · {{ 'Expired' | t }}
                      }
                    </dd>
                  </div>
                }
                @if (found.score !== null) {
                  <div>
                    <dt class="text-xs uppercase tracking-wide text-slate-500">{{ 'Final exam score' | t }}</dt>
                    <dd class="text-slate-800">{{ found.score }}%</dd>
                  </div>
                }
                <div>
                  <dt class="text-xs uppercase tracking-wide text-slate-500">{{ 'Certificate code' | t }}</dt>
                  <dd class="font-mono text-slate-800">{{ found.code }}</dd>
                </div>
              </dl>
              @if (found.skills.length) {
                <div class="mt-4 flex flex-wrap gap-1">
                  @for (skill of found.skills; track skill) {
                    <span class="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-[#007979]">{{ skill }}</span>
                  }
                </div>
              }
            </section>
          }
        } @else if (notFound()) {
          <section class="rounded-2xl border-2 border-amber-200 bg-white p-6">
            <p class="flex items-center gap-2 font-semibold text-amber-800">
              <mat-icon aria-hidden="true">help</mat-icon>{{ 'No certificate has this code.' | t }}
            </p>
            <p class="mt-1 text-sm text-slate-600">{{ 'Check the code for typing mistakes. Codes look like ZB-7Q4K-M2XP.' | t }}</p>
          </section>
        }
      </div>
    </main>
  `,
})
export class CertificateVerifyComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  protected input = this.route.snapshot.paramMap.get('code') ?? '';
  protected readonly loading = signal(false);
  protected readonly certificate = signal<VerifiedCertificate | null>(null);
  protected readonly notFound = signal(false);

  protected readonly issued = computed(() =>
    courseDate(this.certificate()?.issuedAt, this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US'),
  );

  protected readonly expiry = computed(() =>
    courseDate(this.certificate()?.expiresAt, this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US'),
  );

  protected readonly expired = computed(() => {
    const expiresAt = this.certificate()?.expiresAt;
    return !!expiresAt && expiresAt.toMillis() < Date.now();
  });

  constructor() {
    inject(PageTitleService).setDocumentTitle(this.i18n.t('Check a certificate'));
    if (this.input) {
      void this.check();
    }
  }

  protected async check(): Promise<void> {
    const code = this.input.trim().toUpperCase().replace(/\s+/g, '');
    if (!/^ZB-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
      this.certificate.set(null);
      this.notFound.set(!!code);
      return;
    }

    this.loading.set(true);
    try {
      const snapshot = await getDoc(doc(firestore, 'certificates', code));
      const data = snapshot.data();
      this.certificate.set(
        snapshot.exists() && data
          ? {
              code,
              learnerName: String(data['learnerName'] ?? ''),
              courseTitle: String(data['courseTitle'] ?? ''),
              providerName: String(data['providerName'] ?? 'Zebron'),
              skills: Array.isArray(data['skills']) ? data['skills'].map(String) : [],
              score: typeof data['score'] === 'number' ? data['score'] : null,
              issuedAt: (data['issuedAt'] as Timestamp | null) ?? null,
              revoked: data['revoked'] === true,
              kind: data['kind'] === 'certification' ? 'certification' : 'course',
              expiresAt: (data['expiresAt'] as Timestamp | null | undefined) ?? null,
            }
          : null,
      );
      this.notFound.set(!snapshot.exists());
      void this.router.navigate(['/verify', code], { replaceUrl: true });
    } catch {
      this.certificate.set(null);
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
