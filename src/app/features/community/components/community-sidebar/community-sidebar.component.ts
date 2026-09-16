import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { AuthService } from '../../../../core/services/auth.service';

import { CommunityStore } from '../../store/community.store';

@Component({
  selector: 'app-community-sidebar',
  standalone: true,

  imports: [
    RouterLink,
    RouterLinkActive,

    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],

  template: `
    <div class="space-y-6">

      <!-- ============================================================
           MAIN NAVIGATION
           ============================================================ -->

      <section>

        <h2
          class="px-3 text-xs font-semibold
                 uppercase tracking-wider
                 text-[#6F8B92]"
        >
          Community
        </h2>


        <div class="mt-2 space-y-1">

          <!-- ========================================================
               HOME
               ======================================================== -->

          <button
            mat-button
            type="button"
            class="!w-full !justify-start
                   !rounded-xl
                   !text-[#032D42]
                   hover:!bg-[#E5F4F4]
                   hover:!text-[#007979]"
            [class.!bg-[#E5F4F4]]="
              store.feedMode() === 'home'
            "
            [class.!text-[#007979]]="
              store.feedMode() === 'home'
            "
            (click)="selectHome()"
          >

            <mat-icon
              [class.!text-[#007979]]="
                store.feedMode() === 'home'
              "
            >
              home
            </mat-icon>

            <span class="ml-2">
              Home
            </span>

          </button>


          <!-- ========================================================
               TRENDING
               ======================================================== -->

          <button
            mat-button
            type="button"
            class="!w-full !justify-start
                   !rounded-xl
                   !text-[#032D42]
                   hover:!bg-[#E5F4F4]
                   hover:!text-[#007979]"
            [class.!bg-[#E5F4F4]]="
              store.feedMode() === 'trending'
            "
            [class.!text-[#007979]]="
              store.feedMode() === 'trending'
            "
            (click)="selectTrending()"
          >

            <mat-icon
              [class.!text-[#007979]]="
                store.feedMode() === 'trending'
              "
            >
              local_fire_department
            </mat-icon>

            <span class="ml-2">
              Trending
            </span>

          </button>


          <!-- ========================================================
               FOLLOWING
               ======================================================== -->

          <button
            mat-button
            type="button"
            class="!w-full !justify-start
                   !rounded-xl
                   !text-[#032D42]
                   hover:!bg-[#E5F4F4]
                   hover:!text-[#007979]"
            [class.!bg-[#E5F4F4]]="
              store.feedMode() === 'following'
            "
            [class.!text-[#007979]]="
              store.feedMode() === 'following'
            "
            (click)="selectFollowing()"
          >

            <mat-icon
              [class.!text-[#007979]]="
                store.feedMode() === 'following'
              "
            >
              people
            </mat-icon>

            <span class="ml-2">
              Following
            </span>

          </button>


          <!-- ========================================================
               SAVED
               ======================================================== -->

          <button
            mat-button
            type="button"
            class="!w-full !justify-start
                   !rounded-xl
                   !text-[#032D42]
                   hover:!bg-[#E5F4F4]
                   hover:!text-[#007979]"
            [class.!bg-[#E5F4F4]]="
              store.feedMode() === 'saved'
            "
            [class.!text-[#007979]]="
              store.feedMode() === 'saved'
            "
            (click)="selectSaved()"
          >

            <mat-icon
              [class.!text-[#007979]]="
                store.feedMode() === 'saved'
              "
            >
              bookmark
            </mat-icon>

            <span class="ml-2">
              Saved
            </span>

          </button>

        </div>

      </section>


      <!-- ============================================================
           ADMINISTRATION
           ADMIN ONLY
           ============================================================ -->

      @if (authService.isAdmin) {

        <section>

          <div
            class="border-t border-[#D8E5E8] pt-4"
          >

            <h2
              class="px-3 text-xs font-semibold
                     uppercase tracking-wider
                     text-[#6F8B92]"
            >
              Administration
            </h2>


            <div class="mt-2">

              <a
                mat-button
                routerLink="/admin/community/topics"
                routerLinkActive="!bg-[#E5F4F4] !text-[#007979]"
                [routerLinkActiveOptions]="{
                  exact: true
                }"
                class="!w-full !justify-start
                       !rounded-xl
                       !text-[#032D42]
                       hover:!bg-[#E5F4F4]
                       hover:!text-[#007979]"
              >

                <mat-icon
                  class="!text-[#032D42]"
                  routerLinkActive="!text-[#007979]"
                >
                  settings
                </mat-icon>

                <span class="ml-2">
                  Community Settings
                </span>

              </a>

            </div>

          </div>

        </section>

      }


      <!-- ============================================================
           TOPICS
           ============================================================ -->

      <section>

        <h2
          class="px-3 text-xs font-semibold
                 uppercase tracking-wider
                 text-[#6F8B92]"
        >
          Topics
        </h2>


        <div class="mt-2 space-y-1">

          @for (
            topic of store.topics();
            track topic.id
          ) {

            <button
              mat-button
              type="button"
              class="!w-full !justify-start
                     !rounded-xl
                     !text-[#032D42]
                     hover:!bg-[#E5F4F4]
                     hover:!text-[#007979]"
              [class.!bg-[#E5F4F4]]="
                store.selectedTopicId() === topic.id
              "
              [class.!text-[#007979]]="
                store.selectedTopicId() === topic.id
              "
              (click)="selectTopic(topic.id)"
            >

              @if (topic.icon) {

                <span
                  class="mr-2 text-base"
                  aria-hidden="true"
                >
                  {{ topic.icon }}
                </span>

              } @else {

                <mat-icon
                  [class.!text-[#007979]]="
                    store.selectedTopicId() === topic.id
                  "
                >
                  forum
                </mat-icon>

              }


              <span class="truncate">
                {{ topic.name }}
              </span>

            </button>

          }

        </div>

      </section>

    </div>
  `,

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class CommunitySidebarComponent {

  // ============================================================
  // SERVICES
  // ============================================================

  /**
   * Authentication service.
   *
   * `isAdmin` is the existing application-level
   * administrator check used by adminGuard.
   */
  readonly authService =
    inject(AuthService);


  // ============================================================
  // STORE
  // ============================================================

  readonly store =
    inject(CommunityStore);


  // ============================================================
  // HOME
  // ============================================================

  /**
   * Select the Home feed.
   *
   * Home is a top-level feed mode, so it must use
   * CommunityStore.selectFeedMode() rather than
   * CommunityStore.selectTopic(null).
   */
  async selectHome(): Promise<void> {

    await this.store.selectFeedMode(
      'home',
    );

  }


  // ============================================================
  // TRENDING
  // ============================================================

  /**
   * Select the Trending feed.
   *
   * Trending is a top-level feed mode owned by
   * CommunityStore.
   */
  async selectTrending(): Promise<void> {

    await this.store.selectFeedMode(
      'trending',
    );

  }


  // ============================================================
  // FOLLOWING
  // ============================================================

  /**
   * Select the Following feed.
   *
   * CommunityStore is responsible for loading the users
   * followed by the current user and retrieving their posts.
   */
  async selectFollowing(): Promise<void> {

    await this.store.selectFeedMode(
      'following',
    );

  }


  // ============================================================
  // SAVED
  // ============================================================

  /**
   * Select the Saved feed.
   */
  async selectSaved(): Promise<void> {

    await this.store.selectFeedMode(
      'saved',
    );

  }


  // ============================================================
  // TOPIC
  // ============================================================

  /**
   * Select a specific Community topic.
   *
   * Topics remain separate from the top-level feed modes.
   */
  async selectTopic(
    topicId: string,
  ): Promise<void> {

    await this.store.selectTopic(
      topicId,
    );

  }

}