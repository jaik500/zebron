import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { CommunityPostAuthor } from '../../models/community-post.model';
import { CommunityStore } from '../../store/community.store';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-community-trending',
  standalone: true,

  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],

  template: `
    <div class="space-y-5">

      <!-- ============================================================
           TRENDING TOPICS
           ============================================================ -->

      <mat-card
        class="!rounded-2xl
               !border !border-[#D6E6E7]
               !bg-white
               !shadow-none"
      >

        <div
          class="flex items-center gap-2"
        >

          <mat-icon
            class="!text-[#007979]"
          >
            local_fire_department
          </mat-icon>

          <h2
            class="text-base font-semibold
                   text-[#032D42]"
          >
            Trending Topics
          </h2>

        </div>

        <div class="mt-4 space-y-2">

          @for (
            topic of store.topics().slice(0, 5);
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
              (click)="selectTopic(topic.id)"
            >

              <span class="mr-2">
                {{ topic.icon || '💬' }}
              </span>

              <span class="truncate">
                {{ topic.name }}
              </span>

            </button>

          }

          @if (store.topics().length === 0) {
            <p
              class="px-2 py-3 text-sm
                     text-[#6B7D84]"
            >
              No topics available yet.
            </p>
          }

        </div>

      </mat-card>


      <!-- ============================================================
           SUGGESTED MEMBERS
           ============================================================ -->

      @if (suggestedMembers().length > 0) {

        <mat-card
          class="!rounded-2xl
                 !border !border-[#D6E6E7]
                 !bg-white
                 !shadow-none"
        >

          <div
            class="flex items-center justify-between"
          >

            <div
              class="flex items-center gap-2"
            >

              <mat-icon
                class="!text-[#007979]"
              >
                people
              </mat-icon>

              <h2
                class="text-base font-semibold
                       text-[#032D42]"
              >
                Suggested Members
              </h2>

            </div>

            <span
              class="rounded-full
                     bg-[#E5F4F4]
                     px-2 py-0.5
                     text-xs font-medium
                     text-[#007979]"
            >
              {{ suggestedMembers().length }}
            </span>

          </div>


          <div class="mt-4 space-y-1">

            @for (
              member of suggestedMembers();
              track member.id
            ) {

              <div
                class="group flex items-center gap-3
                       rounded-xl px-2 py-2
                       transition-colors
                       hover:bg-[#F4FAFA]"
              >

                <!-- ==================================================
                     MEMBER PROFILE
                     ================================================== -->

                <a
                  [routerLink]="[
                    '/community/users',
                    member.id
                  ]"
                  class="flex h-10 w-10 shrink-0
                         items-center justify-center
                         overflow-hidden rounded-full
                         bg-[#E5F4F4]
                         text-sm font-semibold
                         text-[#007979]
                         transition-all
                         hover:ring-2
                         hover:ring-[#007979]/30"
                  [attr.aria-label]="
                    'View ' +
                    member.displayName +
                    ' profile'
                  "
                >

                  @if (member.photoUrl) {

                    <img
                      [src]="member.photoUrl"
                      [alt]="member.displayName"
                      class="h-full w-full
                             object-cover"
                    />

                  } @else {

                    {{ getInitials(member.displayName) }}

                  }

                </a>


                <!-- ==================================================
                     MEMBER DETAILS
                     ================================================== -->

                <a
                  [routerLink]="[
                    '/community/users',
                    member.id
                  ]"
                  class="min-w-0 flex-1"
                >

                  <p
                    class="truncate text-sm
                           font-semibold
                           text-[#032D42]
                           group-hover:text-[#007979]"
                  >
                    {{ member.displayName }}
                  </p>

                  @if (member.currentCountry) {

                    <p
                      class="mt-0.5 truncate
                             text-xs
                             text-[#6B7D84]"
                    >
                      {{ member.currentCountry }}
                    </p>

                  } @else if (member.city) {

                    <p
                      class="mt-0.5 truncate
                             text-xs
                             text-[#6B7D84]"
                    >
                      {{ member.city }}
                    </p>

                  } @else {

                    <p
                      class="mt-0.5 text-xs
                             text-[#6B7D84]"
                    >
                      Community member
                    </p>

                  }

                </a>


                <!-- ==================================================
                     VIEW PROFILE
                     ================================================== -->

                <a
                  mat-icon-button
                  [routerLink]="[
                    '/community/users',
                    member.id
                  ]"
                  matTooltip="View profile"
                  [attr.aria-label]="
                    'View ' +
                    member.displayName +
                    ' profile'
                  "
                >

                  <mat-icon>
                    chevron_right
                  </mat-icon>

                </a>

              </div>

            }

          </div>


          <!-- ========================================================
               VIEW MORE
               ======================================================== -->

          <div
            class="mt-3 border-t
                   border-[#E8F0F1]
                   pt-3"
          >

            <a
              mat-button
              routerLink="/community"
              class="!w-full
                     !rounded-xl
                     !text-[#007979]"
            >
              <mat-icon class="mr-1">
                people
              </mat-icon>

              Discover more members
            </a>

          </div>

        </mat-card>

      }


      <!-- ============================================================
           COMMUNITY INFORMATION
           ============================================================ -->

      <mat-card
        class="!rounded-2xl
               !border !border-[#D6E6E7]
               !bg-white
               !shadow-none"
      >

        <div
          class="flex items-start gap-3"
        >

          <div
            class="flex h-10 w-10
                   shrink-0
                   items-center
                   justify-center
                   rounded-xl
                   bg-[#E5F4F4]"
          >

            <mat-icon
              class="!text-[#007979]"
            >
              groups
            </mat-icon>

          </div>

          <div>

            <h2
              class="text-base font-semibold
                     text-[#032D42]"
            >
              Welcome to Zebron Community
            </h2>

            <p
              class="mt-2 text-sm leading-6
                     text-[#475D66]"
            >
              Connect with people, exchange
              experiences, ask questions and
              discover helpful resources.
            </p>

          </div>

        </div>

      </mat-card>

    </div>
  `,

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class CommunityTrendingComponent {

  // ============================================================
  // SERVICES
  // ============================================================

  readonly store =
    inject(CommunityStore);

  private readonly authService =
    inject(AuthService);


  // ============================================================
  // SUGGESTED MEMBERS
  // ============================================================

  /**
   * Build member suggestions from authors already present
   * in the Community feed.
   *
   * This intentionally avoids a new Firestore query.
   * CommunityStore already owns the loaded community posts.
   */
  readonly suggestedMembers =
    computed<CommunityPostAuthor[]>(() => {

      const currentUserId =
        this.currentUserId();

      const members =
        new Map<string, CommunityPostAuthor>();

      for (
        const post of this.store.posts()
      ) {

        const author =
          post.author;

        if (!author?.id) {
          continue;
        }

        // Do not suggest the current user.
        if (
          currentUserId &&
          author.id === currentUserId
        ) {
          continue;
        }

        // Deduplicate authors.
        if (
          !members.has(author.id)
        ) {
          members.set(
            author.id,
            author,
          );
        }

      }

      return Array.from(
        members.values(),
      ).slice(0, 5);

    });


  // ============================================================
  // CURRENT USER
  // ============================================================

  private currentUserId(): string | null {

    return (
      this.authService.user()?.id ??
      this.authService.firebaseUser()?.uid ??
      null
    );

  }


  // ============================================================
  // TOPIC SELECTION
  // ============================================================

  async selectTopic(
    topicId: string,
  ): Promise<void> {

    await this.store.selectTopic(
      topicId,
    );

  }


  // ============================================================
  // MEMBER INITIALS
  // ============================================================

  getInitials(
    displayName:
      string | null | undefined,
  ): string {

    if (
      !displayName?.trim()
    ) {
      return '?';
    }

    const parts =
      displayName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (
      parts.length === 1
    ) {

      return parts[0]
        .substring(0, 2)
        .toUpperCase();

    }

    return (
      parts[0][0] +
      parts[
        parts.length - 1
      ][0]
    ).toUpperCase();

  }

}