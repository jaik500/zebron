import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CommunityPostComposerComponent } from '../../components/community-post-composer/community-post-composer.component';

import { CommunityStore } from '../../store/community.store';

import { CommunityFeedComponent } from '../../components/community-feed/community-feed.component';

import { CommunitySidebarComponent } from '../../components/community-sidebar/community-sidebar.component';

import { CommunityTrendingComponent } from '../../components/community-trending/community-trending.component';

import { CommunityNotificationStore } from '../../store/community-notification.store';

import { AuthService } from '../../../../core/services/auth.service';
import { PageTitleService } from '../../../../core/services/page-title.service';

@Component({
  selector: 'app-community-home',
  standalone: true,

  imports: [
    RouterLink,

    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    MatDialogModule,
    MatTooltipModule,

    CommunitySidebarComponent,
    CommunityFeedComponent,
    CommunityTrendingComponent,
  ],

  template: `
    <mat-sidenav-container
      class="min-h-[calc(100vh-64px)]
             bg-[#F6FAFA] mt-15"
    >
      <!-- ==========================================================
           MOBILE NAVIGATION
           ========================================================== -->

      <mat-sidenav #mobileNav mode="over" class="w-72 bg-white p-5">
        <div
          class="mb-6 flex items-center
                 justify-between"
        >
          <h2
            class="text-lg font-semibold
                   text-[#032D42]"
          >
            Community
          </h2>

          <button
            mat-icon-button
            type="button"
            aria-label="Close navigation"
            class="!text-[#032D42]"
            (click)="mobileNav.close()"
          >
            <mat-icon> close </mat-icon>
          </button>
        </div>

        <app-community-sidebar />
      </mat-sidenav>

      <!-- ==========================================================
           CONTENT
           ========================================================== -->

      <mat-sidenav-content>
        <!-- ========================================================
             COMMUNITY HEADER
             ======================================================== -->

        <div
          class="sticky top-0 z-20
                 border-b border-[#032D42]
                 bg-[#2A835F]
                 shadow-sm"
        >
          <div
            class="mx-auto flex max-w-7xl
                   items-center gap-3
                   px-4 
                   sm:px-6 lg:px-8"
          >
            <!-- Mobile menu -->

            <button
              mat-icon-button
              type="button"
              class="lg:!hidden
                     !text-white"
              aria-label="Open community navigation"
              (click)="mobileNav.open()"
            >
              <mat-icon> menu </mat-icon>
            </button>

            <!-- Community title -->

            <div class="min-w-0 flex-1">
              <p
                class="hidden text-sm
                       text-white/80
                       sm:block"
              >
                Connect, share and grow together.
              </p>
            </div>

            <!-- ====================================================
                 MESSAGES
                 ==================================================== -->

            <button
              mat-icon-button
              type="button"
              aria-label="Messages"
              matTooltip="chat"
              class="!text-white
                     hover:!bg-white/10"
            >
              <mat-icon> chat </mat-icon>
            </button>

            <!-- ====================================================
                 NOTIFICATIONS
                 ==================================================== -->

            <a
              mat-icon-button
              routerLink="/community/notifications"
              aria-label="Notifications"
              matTooltip="Notifications"
              class="relative
                     !text-white
                     hover:!bg-white/10"
            >
              <mat-icon>
                {{ hasUnreadNotifications() ? 'notifications' : 'notifications_none' }}
              </mat-icon>

              <!-- Unread badge -->

              @if (hasUnreadNotifications()) {
                <span
                  class="absolute right-0.5
                         top-0.5
                         flex h-4 min-w-4
                         items-center
                         justify-center
                         rounded-full
                         bg-red-500
                         px-1
                         text-[10px]
                         font-bold
                         leading-none
                         text-white
                         ring-2
                         ring-[#032D42]"
                >
                  {{ unreadNotificationCount() > 99 ? '99+' : unreadNotificationCount() }}
                </span>
              }
            </a>

            <!-- ====================================================
     COMMUNITY PROFILE
     ==================================================== -->

            @if (currentUserId()) {
              <a
                mat-icon-button
                [routerLink]="['/community/users', currentUserId()]"
                aria-label="My community profile"
                matTooltip="My profile"
                class="!text-white
           hover:!bg-white/10"
              >
                <mat-icon> account_circle </mat-icon>
              </a>
            }
          </div>
        </div>

        <!-- ========================================================
             MAIN LAYOUT
             ======================================================== -->

        <main
          class="mx-auto max-w-7xl
                 px-4 py-6
                 sm:px-6 lg:px-8"
        >
          <div
            class="grid grid-cols-1
                   gap-6
                   lg:grid-cols-[220px_minmax(0,1fr)_280px]"
          >
            <!-- ====================================================
                 LEFT NAVIGATION
                 ==================================================== -->

            <aside class="hidden lg:block">
              <div class="sticky top-24">
                <app-community-sidebar />
              </div>
            </aside>

            <!-- ====================================================
                 CENTER FEED
                 ==================================================== -->

            <section class="min-w-0">
              <!-- Composer -->

              <mat-card
                class="mb-5
                       !rounded-2xl
                       !border
                       !border-[#D6E6E7]
                       !bg-white
                       !shadow-none"
              >
                <button
                  mat-button
                  type="button"
                  class="!h-auto
                         !w-full
                         !justify-start
                         !rounded-xl
                         !px-4
                         !py-4
                         !text-left
                         !text-[#6F8B92]
                         hover:!bg-[#E5F4F4]"
                  (click)="openPostComposer()"
                >
                  <mat-icon class="!text-[#007979]"> edit </mat-icon>

                  <span class="ml-2"> Share something with the community... </span>
                </button>

                <mat-divider class="!border-[#D6E6E7]" />

                <div
                  class="flex items-center
                         gap-1 px-2 py-2"
                >
                  <button
                    mat-button
                    type="button"
                    class="!text-[#007979]
                           hover:!bg-[#E5F4F4]"
                  >
                    <mat-icon> image </mat-icon>

                    Photo
                  </button>

                  <button
                    mat-button
                    type="button"
                    class="!text-[#007979]
                           hover:!bg-[#E5F4F4]"
                  >
                    <mat-icon> link </mat-icon>

                    Resource
                  </button>

                  <button
                    mat-button
                    type="button"
                    class="!text-[#007979]
                           hover:!bg-[#E5F4F4]"
                  >
                    <mat-icon> poll </mat-icon>

                    Poll
                  </button>
                </div>
              </mat-card>

              <!-- ==================================================
                   ACTIVE TOPIC
                   ================================================== -->

              @if (store.selectedTopic()) {
                <div
                  class="mb-4 flex
                         items-center
                         justify-between"
                >
                  <div>
                    <div
                      class="text-sm
                             text-[#6F8B92]"
                    >
                      Topic
                    </div>

                    <h2
                      class="text-xl
                             font-semibold
                             text-[#032D42]"
                    >
                      {{ store.selectedTopic()?.name }}
                    </h2>
                  </div>

                  <button
                    mat-button
                    type="button"
                    class="!text-[#007979]
                           hover:!bg-[#E5F4F4]"
                    (click)="clearTopic()"
                  >
                    Clear
                  </button>
                </div>
              }

              <app-community-feed />
            </section>

            <!-- ====================================================
                 RIGHT RAIL
                 ==================================================== -->

            <aside class="hidden xl:block">
              <div class="sticky top-24">
                <app-community-trending />
              </div>
            </aside>
          </div>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityHomeComponent implements OnInit {
  // =============================================================
  // STORES
  // =============================================================

  readonly store = inject(CommunityStore);

  readonly notificationStore = inject(CommunityNotificationStore);

  // =============================================================
  // SERVICES
  // =============================================================

  private readonly authService = inject(AuthService);

  readonly pageTitleService = inject(PageTitleService);

  private readonly dialog = inject(MatDialog);

  // =============================================================
  // INITIALIZATION
  // =============================================================

  ngOnInit(): void {
    void this.store.loadInitialData();

    this.loadNotifications();
  }

  constructor() {
    this.pageTitleService.setTitle('Community');
  }

  // =============================================================
  // LOAD NOTIFICATIONS
  // =============================================================

  private loadNotifications(): void {
    const currentUserId = this.currentUserId();

    if (!currentUserId) {
      return;
    }

    void this.notificationStore.loadNotifications(currentUserId, 50);
  }

  // =============================================================
  // CURRENT USER
  // =============================================================

  currentUserId(): string | null {
    return this.authService.user()?.id ?? this.authService.firebaseUser()?.uid ?? null;
  }

  // =============================================================
  // NOTIFICATION STATE
  // =============================================================

  hasUnreadNotifications(): boolean {
    return this.notificationStore.hasUnread();
  }

  unreadNotificationCount(): number {
    return this.notificationStore.unreadCount();
  }

  // =============================================================
  // POST COMPOSER
  // =============================================================

  openPostComposer(): void {
    this.dialog.open(CommunityPostComposerComponent, {
      width: '100%',
      maxWidth: '680px',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'community-post-dialog',
    });
  }

  // =============================================================
  // CLEAR TOPIC
  // =============================================================

  async clearTopic(): Promise<void> {
    await this.store.selectTopic(null);
  }
}
