import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { httpsCallable } from 'firebase/functions';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../../core/services/auth.service';
import { firebaseFunctions } from '../../../../core/services/firebase-config';
import { NotificationService } from '../../../../core/services/notification.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { CommunityPost } from '../../models/community-post.model';
import {
  COMMUNITY_REPORT_REASONS,
  CommunityModerationService,
  CommunityReport,
} from '../../services/community-moderation.service';
import { CommunityPostService } from '../../services/community-post.service';
import { CommunityScopeService } from '../../services/community-scope.service';

/**
 * Community moderation: open reports and hidden posts.
 *
 * Routes:
 *   /partner/org/:organizationId/community/moderation  (managers, admins, owners)
 *   /admin/community/moderation                        (Zebron platform admins)
 */
@Component({
  selector: 'app-community-moderation',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-[#2a835f]">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 class="text-2xl font-bold text-white">Community moderation</h1>
            <p class="text-sm text-white/85">
              {{ isOrganization ? 'Your organization’s private community' : 'Public Zebron Community' }}
            </p>
          </div>
          <a mat-stroked-button class="!border-white/40 !text-white" [routerLink]="homeRoute">
            <mat-icon>arrow_back</mat-icon>
            Community
          </a>
        </div>
      </header>

      <main class="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        @if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() }}</p>
        }

        <!-- REPORTS -->
        <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <h2 class="font-bold text-gray-900">Open reports</h2>
            <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">{{ reports().length }}</span>
          </div>
          @if (loading()) {
            <p class="p-5 text-sm text-gray-500">Loading…</p>
          } @else if (reports().length === 0) {
            <p class="p-5 text-sm text-gray-500">No open reports.</p>
          } @else {
            <ul class="divide-y divide-gray-100">
              @for (report of reports(); track report.id) {
                <li class="px-5 py-4">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="min-w-0">
                      <a class="font-semibold text-gray-900 hover:text-[#007979]" [routerLink]="postRoute(report.postId)">
                        {{ report.postTitle || 'Post' }}
                      </a>
                      <p class="mt-0.5 text-xs text-gray-500">
                        {{ reasonLabel(report.reason) }} · reported by {{ report.reporterName || 'a member' }}
                        @if (report.createdAt) {
                          · {{ report.createdAt.toDate() | date: 'medium' }}
                        }
                      </p>
                      @if (report.details) {
                        <p class="mt-2 rounded bg-gray-50 p-2 text-sm text-gray-700">{{ report.details }}</p>
                      }
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <button mat-stroked-button type="button" [disabled]="busy() === report.id" (click)="act(report, 'hide')">
                        <mat-icon>visibility_off</mat-icon>
                        Hide
                      </button>
                      <button mat-stroked-button type="button" class="!text-red-700" [disabled]="busy() === report.id" (click)="act(report, 'remove')">
                        <mat-icon>block</mat-icon>
                        Remove
                      </button>
                      <button mat-button type="button" [disabled]="busy() === report.id" (click)="dismiss(report)">Dismiss</button>
                    </div>
                  </div>
                </li>
              }
            </ul>
          }
        </section>

        <!-- HIDDEN POSTS -->
        <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <h2 class="font-bold text-gray-900">Hidden posts</h2>
            <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">{{ hidden().length }}</span>
          </div>
          @if (!loading() && hidden().length === 0) {
            <p class="p-5 text-sm text-gray-500">No hidden posts.</p>
          } @else {
            <ul class="divide-y divide-gray-100">
              @for (post of hidden(); track post.id) {
                <li class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div class="min-w-0">
                    <a class="font-semibold text-gray-900 hover:text-[#007979]" [routerLink]="postRoute(post.id)">{{ post.title }}</a>
                    <p class="mt-0.5 text-xs text-gray-500">
                      by {{ post.author.displayName }}
                      @if (post.moderationReason) {
                        · {{ post.moderationReason }}
                      }
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <button mat-stroked-button type="button" [disabled]="busy() === post.id" (click)="restore(post)">
                      <mat-icon>visibility</mat-icon>
                      Restore
                    </button>
                    <button mat-stroked-button type="button" class="!text-red-700" [disabled]="busy() === post.id" (click)="remove(post)">
                      <mat-icon>block</mat-icon>
                      Remove
                    </button>
                  </div>
                </li>
              }
            </ul>
          }
        </section>

        @if (!isOrganization && isPlatformAdmin()) {
          <section class="rounded-xl border border-sky-200 bg-sky-50 p-5">
            <h2 class="font-bold text-sky-900">Organization communities: prepare older posts</h2>
            <p class="mt-1 text-sm text-sky-900">
              Posts created before organization communities need to be marked as public so they keep showing in the
              public feed. Run this once after deploying (safe to run again).
            </p>
            <button mat-flat-button type="button" class="mt-3" [disabled]="migrating()" (click)="prepareOlderPosts()">
              <mat-icon>sync</mat-icon>
              {{ migrating() ? 'Preparing…' : 'Prepare older posts' }}
            </button>
            @if (migrationResult()) {
              <p class="mt-2 text-sm text-sky-900" role="status">{{ migrationResult() }}</p>
            }
          </section>
        }

        <p class="text-xs text-gray-500">
          Hidden posts disappear from the feed but can be restored. Removed posts are kept for records and never shown again.
          @if (isOrganization) {
            Organization managers, admins and owners moderate this community.
          } @else {
            Zebron platform administrators moderate the public Community.
          }
        </p>
      </main>
    </div>
  `,
})
export class CommunityModerationComponent implements OnInit {
  private readonly moderation = inject(CommunityModerationService);
  private readonly posts = inject(CommunityPostService);
  private readonly scope = inject(CommunityScopeService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly pageTitle = inject(PageTitleService);

  protected readonly isOrganization = this.scope.isOrganizationCommunity();
  protected readonly migrating = signal(false);
  protected readonly migrationResult = signal<string | null>(null);
  protected readonly homeRoute = this.scope.homeRoute();

  protected readonly reports = signal<CommunityReport[]>([]);
  protected readonly hidden = signal<CommunityPost[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  private readonly reasonLabels = computed(
    () => new Map(COMMUNITY_REPORT_REASONS.map((reason) => [reason.value, reason.label] as const)),
  );

  async ngOnInit(): Promise<void> {
    this.pageTitle.setTitle('Community moderation');
    await this.load();
  }

  protected isPlatformAdmin(): boolean {
    return this.auth.isAdmin;
  }

  protected postRoute(postId: string): string[] {
    return [...this.homeRoute, 'post', postId];
  }

  protected reasonLabel(reason: string): string {
    return this.reasonLabels().get(reason as never) ?? reason;
  }

  protected async act(report: CommunityReport, action: 'hide' | 'remove'): Promise<void> {
    await this.run(report.id, async (userId) => {
      await this.posts.moderatePost(report.postId, action, userId, `Report: ${this.reasonLabel(report.reason)}`);
      await this.moderation.resolve(report.id, userId, 'resolved', action === 'hide' ? 'Post hidden' : 'Post removed');
      this.notify.success(action === 'hide' ? 'Post hidden.' : 'Post removed.');
    });
  }

  protected async dismiss(report: CommunityReport): Promise<void> {
    await this.run(report.id, async (userId) => {
      await this.moderation.resolve(report.id, userId, 'dismissed', 'No action');
    });
  }

  protected async restore(post: CommunityPost): Promise<void> {
    await this.run(post.id, async (userId) => {
      await this.posts.moderatePost(post.id, 'restore', userId);
      this.notify.success('Post restored.');
    });
  }

  protected async remove(post: CommunityPost): Promise<void> {
    await this.run(post.id, async (userId) => {
      await this.posts.moderatePost(post.id, 'remove', userId, post.moderationReason ?? '');
      this.notify.success('Post removed.');
    });
  }

  protected async prepareOlderPosts(): Promise<void> {
    this.migrating.set(true);
    this.migrationResult.set(null);
    try {
      const callable = httpsCallable<void, { scanned: number; updated: number }>(firebaseFunctions, 'backfillCommunityPostScope');
      const { data } = await callable();
      this.migrationResult.set(`Checked ${data.scanned} posts; marked ${data.updated} as public.`);
    } catch (error) {
      console.error('[Community moderation] Backfill failed.', error);
      this.migrationResult.set('This did not run. Make sure the functions are deployed, then try again.');
    } finally {
      this.migrating.set(false);
    }
  }

  private async run(id: string, action: (userId: string) => Promise<void>): Promise<void> {
    const userId = this.auth.firebaseUser()?.uid;
    if (!userId) return;

    this.busy.set(id);
    this.error.set(null);
    try {
      await action(userId);
      await this.load();
    } catch (error) {
      console.error('[Community moderation] Action failed.', error);
      this.error.set('That change could not be saved. Only moderators of this community can do this.');
    } finally {
      this.busy.set(null);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const [reports, hidden] = await Promise.allSettled([this.moderation.getOpenReports(), this.posts.getHiddenPosts()]);

    this.reports.set(reports.status === 'fulfilled' ? reports.value : []);
    this.hidden.set(hidden.status === 'fulfilled' ? hidden.value : []);

    if (reports.status === 'rejected' || hidden.status === 'rejected') {
      console.error('[Community moderation] Load failed.', reports, hidden);
      this.error.set('Moderation data could not be loaded. Only moderators of this community can open this page.');
    }

    this.loading.set(false);
  }
}
