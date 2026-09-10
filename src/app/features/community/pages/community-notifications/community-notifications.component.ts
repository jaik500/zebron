import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HotToastService } from '@ngxpert/hot-toast';

import { CommunityNotification } from '../../models/community-notification.model';
import { CommunityNotificationStore } from '../../store/community-notification.store';

import { AuthService } from '../../../../core/services/auth.service';
import { PageTitleService } from '../../../../core/services/page-title.service';

@Component({
  selector: 'app-community-notifications',
  standalone: true,

  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],

  template: `
    <div class="min-h-screen bg-[#F7FAFA] mt-15">
      <!-- ============================================================
           PAGE HEADER
           ============================================================ -->

      <section
        class="border-b border-[#D6E6E7]
               bg-[#2a835f] "
      >
        <div
          class="mx-auto max-w-5xl
                 px-4 pt-1
                 sm:px-6 lg:px-8"
        >
          <div
            class="flex flex-col
                   gap-5
                   sm:flex-row
                   sm:items-center
                   sm:justify-between"
          >
            <div>
              <!-- Breadcrumb -->

              <div
                class=" flex items-center
                       gap-3 text-md
                       text-white/80 px-13"
              >
                <a routerLink="/community" class="hover:text-white"> Community </a>

                <mat-icon
                  class="!h-6 !w-4
                         !text-base"
                >
                  chevron_right
                </mat-icon>

                <span> Notifications </span>
              </div>

              <!-- Title -->

              <div class="flex items-center gap-2">
                <div
  class="flex h-11 w-11
         shrink-0
         items-center
         justify-center
         rounded-full
         bg-[#E5F4F4]"
>
  <mat-icon
    class="!m-0
           !h-5
           !w-6.3
           !text-[28px]
           !leading-4
           !text-[#007979]"
  >
    notifications
  </mat-icon>
</div>

                <div>
                  <p
                    class=" text-sm
                           text-white/80
                           sm:text-base"
                  >
                    Stay up to date with activity from the Zebron community.
                  </p>
                </div>
              </div>
            </div>

            <!-- Header Actions -->

            <div
              class="flex items-center
                     gap-2"
            >
              @if (hasUnread()) {
                <button
                  mat-stroked-button
                  type="button"
                  class="!rounded-xl
                         !border-[#B8D1D3]
                         !text-[#007979]"
                  [disabled]="notificationStore.markingAllAsRead()"
                  (click)="markAllAsRead()"
                >
                  @if (notificationStore.markingAllAsRead()) {
                    <mat-spinner diameter="18" />
                  } @else {
                    <mat-icon class="mr-1"> done_all </mat-icon>
                  }

                  Mark all as read
                </button>
              }

             
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================
           MAIN CONTENT
           ============================================================ -->

      <main
        class="mx-auto max-w-5xl
               px-4 py-2
               sm:px-6 sm:py-4
               lg:px-8"
      >
        <!-- ==========================================================
             LOADING
             ========================================================== -->

        @if (notificationStore.loading()) {
          <div
            class="flex min-h-[360px]
                   items-center
                   justify-center"
          >
            <div
              class="flex flex-col
                     items-center
                     gap-4"
            >
              <mat-spinner diameter="42" />

              <p
                class="text-sm
                       text-[#6B7D84]"
              >
                Loading notifications...
              </p>
            </div>
          </div>
        }

        <!-- ==========================================================
             ERROR
             ========================================================== -->

        @else if (notificationStore.error()) {
          <mat-card
            class="!rounded-2xl
                   !border
                   !border-red-100
                   !bg-white
                   !shadow-none"
          >
            <div
              class="flex flex-col
                     items-center
                     px-6 py-12
                     text-center"
            >
              <div
                class="flex h-14 w-14
                       items-center
                       justify-center
                       rounded-full
                       bg-red-50"
              >
                <mat-icon
                  class="!text-2xl
                         !text-red-500"
                >
                  error_outline
                </mat-icon>
              </div>

              <h2
                class="mt-4 text-lg
                       font-semibold
                       text-[#032D42]"
              >
                Unable to load notifications
              </h2>

              <p
                class="mt-2 max-w-md
                       text-sm leading-6
                       text-[#6B7D84]"
              >
                We couldn't load your notifications right now. Please try again.
              </p>

              <button
                mat-flat-button
                type="button"
                class="mt-5
                       !rounded-xl
                       !bg-[#007979]
                       !text-white"
                (click)="loadNotifications()"
              >
                <mat-icon class="mr-1"> refresh </mat-icon>

                Try again
              </button>
            </div>
          </mat-card>
        }

        <!-- ==========================================================
             EMPTY STATE
             ========================================================== -->

        @else if (notificationStore.notifications().length === 0) {
          <mat-card
            class="!rounded-2xl
                   !border
                   !border-[#D6E6E7]
                   !bg-white
                   !shadow-none"
          >
            <div
              class="flex flex-col
                     items-center
                     px-6 py-16
                     text-center"
            >
              <div
                class="flex h-16 w-16
                       items-center
                       justify-center
                       rounded-full
                       bg-[#E5F4F4]"
              >
                <mat-icon
                  class="!text-3xl
                         !text-[#007979]"
                >
                  notifications_none
                </mat-icon>
              </div>

              <h2
                class="mt-5 text-lg
                       font-semibold
                       text-[#032D42]"
              >
                No notifications yet
              </h2>

              <p
                class="mt-2 max-w-md
                       text-sm leading-6
                       text-[#6B7D84]"
              >
                When people interact with you or your Community content, you'll see notifications
                here.
              </p>

              <a
                mat-flat-button
                routerLink="/community"
                class="mt-5
                       !rounded-xl
                       !bg-[#007979]
                       !text-white"
              >
                <mat-icon class="mr-1"> groups </mat-icon>

                Explore Community
              </a>
            </div>
          </mat-card>
        }

        <!-- ==========================================================
             NOTIFICATIONS
             ========================================================== -->

        @else {
          <div
            class="overflow-hidden
                   rounded-2xl
                   border
                   border-[#D6E6E7]
                   bg-white"
          >
            @for (
              notification of notificationStore.notifications();
              track notification.id;
              let first = $first
            ) {
              <button
                type="button"
                class="group block w-full
                       text-left
                       transition-colors
                       hover:bg-[#F7FAFA]"
                [class.bg-[#EAF7F7]]="!notification.read"
                [class.border-t]="!first"
                [class.border-[#E8F0F1]]="!first"
                [disabled]="notificationStore.markingAsRead()"
                (click)="openNotification(notification)"
              >
                <div
                  class="flex items-start
                         gap-4
                         px-4 py-4
                         sm:px-6"
                >
                  <!-- ==================================================
                       ACTOR AVATAR
                       ================================================== -->

                  <div
                    class="flex h-11 w-11
                           shrink-0
                           items-center
                           justify-center
                           overflow-hidden
                           rounded-full
                           bg-[#E5F4F4]
                           text-sm
                           font-semibold
                           text-[#007979]"
                  >
                    @if (notification.actorPhotoUrl) {
                      <img
                        [src]="notification.actorPhotoUrl"
                        [alt]="notification.actorDisplayName ?? 'Zebron User'"
                        class="h-full w-full
                               object-cover"
                      />
                    } @else {
                      {{ getInitials(notification.actorDisplayName) }}
                    }
                  </div>

                  <!-- ==================================================
                       CONTENT
                       ================================================== -->

                  <div class="min-w-0 flex-1">
                    <div
                      class="flex items-start
                             justify-between
                             gap-3"
                    >
                      <p
                        class="text-sm
                               leading-6
                               text-[#032D42]"
                        [class.font-semibold]="!notification.read"
                      >
                        {{ notification.message }}
                      </p>

                      @if (!notification.read) {
                        <span
                          class="mt-2 h-2.5
                                 w-2.5
                                 shrink-0
                                 rounded-full
                                 bg-[#007979]"
                          aria-label="Unread"
                        ></span>
                      }
                    </div>

                    <div
                      class="mt-1 flex
                             items-center
                             gap-2
                             text-xs
                             text-[#8A9AA0]"
                    >
                      <mat-icon
                        class="!h-4
                               !w-4
                               !text-sm"
                      >
                        {{ getNotificationIcon(notification) }}
                      </mat-icon>

                      <span>
                        {{ formatTimestamp(notification) }}
                      </span>
                    </div>
                  </div>

                  <!-- ==================================================
                       OPEN ICON
                       ================================================== -->

                  <mat-icon
                    class="mt-2
                           shrink-0
                           !text-lg
                           !text-[#8A9AA0]
                           transition
                           group-hover:!text-[#007979]"
                  >
                    chevron_right
                  </mat-icon>
                </div>
              </button>
            }
          </div>
        }
      </main>
    </div>
  `,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityNotificationsComponent implements OnInit {
  // =============================================================
  // SERVICES
  // =============================================================

  readonly notificationStore = inject(CommunityNotificationStore);

  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  private readonly toast = inject(HotToastService);

  private readonly pageTitle = inject(PageTitleService);

  // =============================================================
  // STATE
  // =============================================================

  readonly hasUnread = computed(() =>
    this.notificationStore.notifications().some((notification) => !notification.read),
  );

  // =============================================================
  // INITIALIZATION
  // =============================================================

  ngOnInit(): void {
    this.pageTitle.setTitle('Community Notifications');

    this.loadNotifications();
  }

  // =============================================================
  // CURRENT USER
  // =============================================================

  private currentUserId(): string | null {
    return this.authService.user()?.id ?? this.authService.firebaseUser()?.uid ?? null;
  }

  // =============================================================
  // LOAD NOTIFICATIONS
  // =============================================================

  loadNotifications(): void {
    const currentUserId = this.currentUserId();

    if (!currentUserId) {
      this.toast.error('Please sign in to view your notifications.');

      return;
    }

    void this.notificationStore.loadNotifications(currentUserId, 50);
  }

  // =============================================================
  // MARK ALL AS READ
  // =============================================================

  async markAllAsRead(): Promise<void> {
    const currentUserId = this.currentUserId();

    if (!currentUserId) {
      return;
    }

    await this.notificationStore.markAllAsRead(currentUserId);

    if (!this.notificationStore.error()) {
      this.toast.success('All notifications marked as read.');
    }
  }

  // =============================================================
  // OPEN NOTIFICATION
  // =============================================================

  async openNotification(notification: CommunityNotification): Promise<void> {
    if (!notification.read) {
      await this.notificationStore.markAsRead(notification.id);
    }

    const route = this.getNotificationRoute(notification);

    if (!route) {
      return;
    }

    await this.router.navigateByUrl(route);
  }

  // =============================================================
  // NOTIFICATION ROUTE
  // =============================================================

  private getNotificationRoute(notification: CommunityNotification): string | null {
    if (notification.route) {
      return notification.route;
    }

    if (notification.postId) {
      return `/community/posts/${notification.postId}`;
    }

    if (notification.actorId) {
      return `/community/users/${notification.actorId}`;
    }

    return null;
  }

  // =============================================================
  // NOTIFICATION ICON
  // =============================================================

  getNotificationIcon(notification: CommunityNotification): string {
    switch (notification.type) {
      case 'follow':
        return 'person_add';

      case 'post_reaction':
        return 'favorite';

      case 'comment':
        return 'chat_bubble';

      case 'comment_reaction':
        return 'favorite';

      case 'reply':
        return 'reply';

      case 'mention':
        return 'alternate_email';

      case 'moderation':
        return 'admin_panel_settings';

      case 'system':
        return 'info';

      default:
        return 'notifications';
    }
  }

  // =============================================================
  // TIMESTAMP
  // =============================================================

  formatTimestamp(notification: CommunityNotification): string {
    const timestamp = notification.createdAt;

    if (!timestamp) {
      return 'Recently';
    }

    const date = timestamp.toDate();

    const now = new Date();

    const difference = now.getTime() - date.getTime();

    const seconds = Math.floor(difference / 1000);

    if (seconds < 60) {
      return 'Just now';
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  // =============================================================
  // INITIALS
  // =============================================================

  getInitials(displayName: string | null | undefined): string {
    if (!displayName?.trim()) {
      return '?';
    }

    const parts = displayName.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
