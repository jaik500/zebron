import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from '../../../../core/services/firebase-config';
import { PageTitleService } from '../../../../core/services/page-title.service';

/** Returned by the getOrganizationMemberProfile Cloud Function. */
interface OrganizationMemberProfile {
  userId: string;
  organizationId: string;
  role: string;
  active: boolean;
  joinedAt: string | null;

  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  city: string | null;
  state: string | null;
  currentCountry: string | null;
  photoUrl: string | null;
  bio: string | null;

  accountCreatedAt: string | null;
  lastSignInAt: string | null;

  nameComplete: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  org_owner: 'Owner',
  org_admin: 'Administrator',
  org_manager: 'Manager',
  org_staff: 'Staff',
  org_member: 'Member',
};

/**
 * Read-only profile of one organization member, opened from the
 * Administration page so managers can confirm who someone is.
 *
 * Route: /partner/org/:organizationId/members/:userId (manager and above).
 */
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [
    TranslatePipe,DatePipe, RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-[#2a835f]">
        <div
          class="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
        >
          <div class="min-w-0">
            <h1 class="truncate text-2xl font-bold text-white">{{ 'Member Profile' | t }}</h1>
            <p class="text-sm text-white/80">{{ 'Confirm who this person is before changing their access.' | t }}</p>
          </div>

          <a
            mat-stroked-button
            class="!border-white/40 !text-white"
            [routerLink]="['/partner/org', organizationId, 'settings']"
          >
            <mat-icon>arrow_back</mat-icon>
            {{ 'Administration' | t }}
          </a>
        </div>
      </header>

      <main class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        @if (loading()) {
          <section class="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            {{ 'Loading member profile…' | t }}
          </section>
        } @else if (error()) {
          <section class="rounded-xl border border-red-200 bg-red-50 p-6" role="alert">
            <h2 class="font-semibold text-red-900">{{ 'Unable to load this profile' | t }}</h2>
            <p class="mt-1 text-sm text-red-800">{{ error() | t }}</p>
          </section>
        } @else if (profile(); as member) {
          <!-- IDENTITY -->
          <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
              @if (member.photoUrl) {
                <img
                  [src]="member.photoUrl"
                  alt=""
                  class="h-20 w-20 shrink-0 rounded-full object-cover"
                />
              } @else {
                <div
                  class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-teal-50 text-2xl font-bold text-[#007979]"
                >
                  {{ initials() }}
                </div>
              }

              <div class="min-w-0 flex-1">
                <h2 class="break-words text-2xl font-bold text-gray-900">
                  {{ member.displayName || member.email || ('Unnamed member' | t) }}
                </h2>

                @if (member.preferredName) {
                  <p class="mt-1 text-sm text-gray-500">{{ 'Goes by {0}' | t: [member.preferredName] }}</p>
                }

                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <span class="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[#007979]">
                    {{ roleLabel() | t }}
                  </span>

                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-semibold"
                    [class.bg-emerald-50]="member.active"
                    [class.text-emerald-700]="member.active"
                    [class.bg-gray-100]="!member.active"
                    [class.text-gray-600]="!member.active"
                  >
                    {{ member.active ? ('Active' | t) : ('Inactive' | t) }}
                  </span>

                  @if (!member.nameComplete) {
                    <span class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      {{ 'Name not completed' | t }}
                    </span>
                  }
                </div>
              </div>
            </div>

            @if (!member.nameComplete) {
              <p class="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {{ 'This person hasn\\u0027t added their first and last name yet. They see a reminder on their dashboard until they do.' | t }}
              </p>
            }
          </section>

          <!-- DETAILS -->
          <section class="mt-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-[#007979]">{{ 'Contact' | t }}</h3>

            <dl class="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-medium text-gray-500">{{ 'Email' | t }}</dt>
                <dd class="mt-1 flex flex-wrap items-center gap-2 break-all text-sm text-gray-900">
                  @if (member.email) {
                    <a class="text-[#007979] hover:underline" [href]="'mailto:' + member.email">{{ member.email }}</a>
                    <span
                      class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      [class.bg-emerald-50]="member.emailVerified"
                      [class.text-emerald-700]="member.emailVerified"
                      [class.bg-gray-100]="!member.emailVerified"
                      [class.text-gray-600]="!member.emailVerified"
                    >
                      {{ member.emailVerified ? ('Verified' | t) : ('Not verified' | t) }}
                    </span>
                  } @else {
                    <span class="text-gray-400">{{ 'Not provided' | t }}</span>
                  }
                </dd>
              </div>

              <div>
                <dt class="text-xs font-medium text-gray-500">{{ 'Phone' | t }}</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ member.phone || '—' }}
                </dd>
              </div>

              <div>
                <dt class="text-xs font-medium text-gray-500">{{ 'First name' | t }}</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ member.firstName || '—' }}</dd>
              </div>

              <div>
                <dt class="text-xs font-medium text-gray-500">{{ 'Last name' | t }}</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ member.lastName || '—' }}</dd>
              </div>

              <div class="sm:col-span-2">
                <dt class="text-xs font-medium text-gray-500">{{ 'Location' | t }}</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ location() || '—' }}</dd>
              </div>
            </dl>

            @if (member.bio) {
              <div class="mt-5 border-t border-gray-100 pt-4">
                <h4 class="text-xs font-medium text-gray-500">{{ 'About' | t }}</h4>
                <p class="mt-1 whitespace-pre-line text-sm leading-6 text-gray-700">{{ member.bio }}</p>
              </div>
            }
          </section>

          <section class="mt-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-[#007979]">{{ 'Account' | t }}</h3>

            <dl class="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-3">
              <div>
                <dt class="text-xs font-medium text-gray-500">{{ 'Joined organization' | t }}</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ member.joinedAt ? (member.joinedAt | date: 'mediumDate') : '—' }}
                </dd>
              </div>

              <div>
                <dt class="text-xs font-medium text-gray-500">{{ 'Zebron account created' | t }}</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ member.accountCreatedAt ? (member.accountCreatedAt | date: 'mediumDate') : '—' }}
                </dd>
              </div>

              <div>
                <dt class="text-xs font-medium text-gray-500">{{ 'Last signed in' | t }}</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ member.lastSignInAt ? (member.lastSignInAt | date: 'medium') : '—' }}
                </dd>
              </div>
            </dl>
          </section>
        }
      </main>
    </div>
  `,
})
export class MemberProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pageTitleService = inject(PageTitleService);

  protected readonly organizationId =
    this.route.snapshot.paramMap.get('organizationId') ?? '';

  private readonly userId = this.route.snapshot.paramMap.get('userId') ?? '';

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly profile = signal<OrganizationMemberProfile | null>(null);

  protected readonly roleLabel = computed(
    () => ROLE_LABELS[this.profile()?.role ?? ''] ?? 'Member',
  );

  protected readonly location = computed(() => {
    const member = this.profile();

    return [member?.city, member?.state, member?.currentCountry]
      .filter(Boolean)
      .join(', ');
  });

  protected readonly initials = computed(() => {
    const member = this.profile();
    const name = member?.displayName?.trim();

    if (name) {
      const words = name.split(/\s+/).filter(Boolean);

      return (
        words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)
      ).toUpperCase();
    }

    return member?.email ? member.email.slice(0, 2).toUpperCase() : '?';
  });

  async ngOnInit(): Promise<void> {
    this.pageTitleService.setTitle('Member Profile');

    if (!this.organizationId || !this.userId) {
      this.error.set('This member link is incomplete.');
      this.loading.set(false);
      return;
    }

    try {
      const getProfile = httpsCallable<
        { organizationId: string; userId: string },
        OrganizationMemberProfile
      >(firebaseFunctions, 'getOrganizationMemberProfile');

      const result = await getProfile({
        organizationId: this.organizationId,
        userId: this.userId,
      });

      this.profile.set(result.data);

      const name = result.data.displayName || result.data.email;

      if (name) {
        this.pageTitleService.setTitle(`${name} | Member Profile`);
      }
    } catch (error: unknown) {
      console.error('Failed to load member profile.', error);

      this.error.set(
        error instanceof Error && error.message
          ? error.message
          : 'An unexpected error occurred. Please try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
