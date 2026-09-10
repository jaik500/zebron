import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HotToastService } from '@ngxpert/hot-toast';

import { CommunityUser } from '../../models/community-user.model';
import { CommunityUserService } from '../../services/community-user.service';
import { CommunityFollowStore } from '../../store/community-follow.store';

import { AuthService } from '../../../../core/services/auth.service';
import { PageTitleService } from '../../../../core/services/page-title.service';

@Component({
  selector: 'app-community-members',
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
    <div class="min-h-screen bg-[#F7FAFA]">
      <!-- ============================================================
           PAGE HEADER
           ============================================================ -->

      <section
        class="border-b border-[#D6E6E7]
               bg-white"
      >
        <div
          class="mx-auto max-w-7xl
                 px-4 py-8
                 sm:px-6 lg:px-8"
        >
          <div
            class="flex flex-col
                   gap-5
                   md:flex-row
                   md:items-center
                   md:justify-between"
          >
            <div>
              <div
                class="mb-2 flex items-center
                       gap-2 text-sm
                       text-[#6B7D84]"
              >
                <a routerLink="/community" class="hover:text-[#007979]"> Community </a>

                <mat-icon
                  class="!h-4 !w-4
                         !text-base"
                >
                  chevron_right
                </mat-icon>

                <span> Members </span>
              </div>

              <div class="flex items-center gap-3">
                <div
                  class="flex h-12 w-12
                         shrink-0 items-center
                         justify-center
                         rounded-2xl
                         bg-[#E5F4F4]"
                >
                  <mat-icon
                    class="!text-2xl
                           !text-[#007979]"
                  >
                    groups
                  </mat-icon>
                </div>

                <div>
                  <h1
                    class="text-2xl
                           font-bold
                           tracking-tight
                           text-[#032D42]
                           sm:text-3xl"
                  >
                    Community Members
                  </h1>

                  <p
                    class="mt-1 text-sm
                           text-[#6B7D84]
                           sm:text-base"
                  >
                    Discover people, connect with the community, and build meaningful connections.
                  </p>
                </div>
              </div>
            </div>

            <!-- Back to Community -->

            <a
              mat-stroked-button
              routerLink="/community"
              class="!rounded-xl
                     !border-[#B8D1D3]
                     !text-[#007979]"
            >
              <mat-icon class="mr-1"> arrow_back </mat-icon>

              Community
            </a>
          </div>
        </div>
      </section>

      <!-- ============================================================
           MAIN CONTENT
           ============================================================ -->

      <main
        class="mx-auto max-w-7xl
               px-4 py-6
               sm:px-6 sm:py-8
               lg:px-8"
      >
        <!-- ==========================================================
             SEARCH
             ========================================================== -->

        <mat-card
          class="!rounded-2xl
                 !border !border-[#D6E6E7]
                 !bg-white
                 !shadow-none"
        >
          <div
            class="flex flex-col
                   gap-4
                   md:flex-row
                   md:items-center
                   md:justify-between"
          >
            <div class="relative flex-1">
              <mat-icon
                class="pointer-events-none
                       absolute left-3 top-1/2
                       z-10 -translate-y-1/2
                       !text-[#6B7D84]"
              >
                search
              </mat-icon>

              <input
                type="search"
                [value]="searchTerm()"
                (input)="setSearchTerm($any($event.target).value)"
                placeholder="Search community members..."
                aria-label="Search community members"
                class="h-12 w-full
                       rounded-xl
                       border border-[#D6E6E7]
                       bg-[#F7FAFA]
                       pl-11 pr-11
                       text-sm
                       text-[#032D42]
                       outline-none
                       transition
                       placeholder:text-[#8A9AA0]
                       focus:border-[#007979]
                       focus:bg-white
                       focus:ring-2
                       focus:ring-[#007979]/10"
              />

              @if (searchTerm()) {
                <button
                  mat-icon-button
                  type="button"
                  class="!absolute
                         !right-1
                         !top-1/2
                         !-translate-y-1/2"
                  aria-label="Clear member search"
                  matTooltip="Clear search"
                  (click)="clearSearch()"
                >
                  <mat-icon> close </mat-icon>
                </button>
              }
            </div>

            <!-- Result Count -->

            <div
              class="flex shrink-0
                     items-center gap-2
                     text-sm
                     text-[#6B7D84]"
            >
              <mat-icon
                class="!text-xl
                       !text-[#007979]"
              >
                people
              </mat-icon>

              <span>
                {{ filteredMembers().length }}
                {{ filteredMembers().length === 1 ? 'member' : 'members' }}
              </span>
            </div>
          </div>
        </mat-card>

        <!-- ==========================================================
             LOADING
             ========================================================== -->

        @if (loading()) {
          <div
            class="flex min-h-[320px]
                   items-center
                   justify-center"
          >
            <div
              class="flex flex-col
                     items-center gap-4"
            >
              <mat-spinner diameter="42" />

              <p
                class="text-sm
                       text-[#6B7D84]"
              >
                Loading community members...
              </p>
            </div>
          </div>
        }

        <!-- ==========================================================
             ERROR
             ========================================================== -->

        @else if (error()) {
          <mat-card
            class="mt-6 !rounded-2xl
                   !border !border-red-100
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
                Unable to load members
              </h2>

              <p
                class="mt-2 max-w-md
                       text-sm leading-6
                       text-[#6B7D84]"
              >
                We couldn't load the community members right now. Please try again.
              </p>

              <button
                mat-flat-button
                type="button"
                class="mt-5
                       !rounded-xl
                       !bg-[#007979]
                       !text-white"
                (click)="loadMembers()"
              >
                <mat-icon class="mr-1"> refresh </mat-icon>

                Try again
              </button>
            </div>
          </mat-card>
        }

        <!-- ==========================================================
             MEMBER GRID
             ========================================================== -->

        @else {
          @if (filteredMembers().length > 0) {
            <div
              class="mt-6 grid
                     grid-cols-1
                     gap-4
                     sm:grid-cols-2
                     lg:grid-cols-3
                     xl:grid-cols-4"
            >
              @for (member of filteredMembers(); track member.id) {
                <mat-card
                  class="group
                         !rounded-2xl
                         !border
                         !border-[#D6E6E7]
                         !bg-white
                         !shadow-none
                         transition-all
                         hover:-translate-y-0.5
                         hover:!border-[#B8D1D3]
                         hover:shadow-sm"
                >
                  <!-- ==================================================
                       MEMBER HEADER
                       ================================================== -->

                  <div
                    class="flex items-start
                           justify-between"
                  >
                    <a
                      [routerLink]="['/community/users', member.id]"
                      class="flex h-16 w-16
                             shrink-0
                             items-center
                             justify-center
                             overflow-hidden
                             rounded-full
                             bg-[#E5F4F4]
                             text-lg font-semibold
                             text-[#007979]
                             ring-4 ring-white
                             transition
                             hover:ring-[#E5F4F4]"
                      [attr.aria-label]="'View ' + member.displayName + ' profile'"
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

                    <!-- Profile Button -->

                    <a
                      mat-icon-button
                      [routerLink]="['/community/users', member.id]"
                      matTooltip="View profile"
                      [attr.aria-label]="'View ' + member.displayName + ' profile'"
                    >
                      <mat-icon> open_in_new </mat-icon>
                    </a>
                  </div>

                  <!-- ==================================================
                       MEMBER INFORMATION
                       ================================================== -->

                  <div class="mt-4">
                    <a [routerLink]="['/community/users', member.id]" class="block">
                      <h2
                        class="truncate text-base
                               font-semibold
                               text-[#032D42]
                               group-hover:text-[#007979]"
                      >
                        {{ member.displayName }}
                      </h2>
                    </a>

                    <!-- Location -->

                    @if (member.city || member.state || member.currentCountry) {
                      <div
                        class="mt-2 flex items-center
                               gap-1.5 text-xs
                               text-[#6B7D84]"
                      >
                        <mat-icon
                          class="!h-4 !w-4
                                 !text-base"
                        >
                          location_on
                        </mat-icon>

                        <span class="truncate">
                          {{ getLocation(member) }}
                        </span>
                      </div>
                    }

                    <!-- Country of Origin -->

                    @if (member.countryOfOrigin) {
                      <div
                        class="mt-1.5 flex items-center
                               gap-1.5 text-xs
                               text-[#6B7D84]"
                      >
                        <mat-icon
                          class="!h-4 !w-4
                                 !text-base"
                        >
                          public
                        </mat-icon>

                        <span class="truncate">
                          From
                          {{ member.countryOfOrigin }}
                        </span>
                      </div>
                    }

                    <!-- Bio -->

                    @if (member.bio) {
                      <p
                        class="mt-3 line-clamp-3
                               min-h-[60px]
                               text-sm leading-5
                               text-[#475D66]"
                      >
                        {{ member.bio }}
                      </p>
                    } @else {
                      <p
                        class="mt-3 min-h-[60px]
                               text-sm italic
                               leading-5
                               text-[#8A9AA0]"
                      >
                        Community member
                      </p>
                    }
                  </div>

                  <!-- ==================================================
                       ACTIONS
                       ================================================== -->

                  <div
                    class="mt-5
                           border-t
                           border-[#E8F0F1]
                           pt-4"
                  >
                    <div
                      class="flex items-center
                             justify-between
                             gap-2"
                    >
                      <a
                        mat-stroked-button
                        [routerLink]="['/community/users', member.id]"
                        class="!min-w-0
                               !flex-1
                               !rounded-xl
                               !border-[#B8D1D3]
                               !text-[#007979]"
                      >
                        <mat-icon class="mr-1"> person </mat-icon>

                        Profile
                      </a>

                      <button
                        mat-flat-button
                        type="button"
                        class="!min-w-0
                               !rounded-xl
                               !bg-[#007979]
                               !text-white"
                        [disabled]="isToggling(member.id)"
                        (click)="toggleFollow(member)"
                      >
                        @if (isToggling(member.id)) {
                          <mat-spinner diameter="18" />
                        } @else {
                          <ng-container>
                            <mat-icon class="mr-1">
                              {{ isFollowing(member.id) ? 'person_remove' : 'person_add' }}
                            </mat-icon>
                          </ng-container>
                          {{ isFollowing(member.id) ? 'Following' : 'Follow' }}
                        }
                      </button>
                    </div>
                  </div>
                </mat-card>
              }
            </div>
          }

          <!-- ========================================================
               EMPTY STATE
               ======================================================== -->

          @else {
            <mat-card
              class="mt-6 !rounded-2xl
                     !border !border-[#D6E6E7]
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
                    person_search
                  </mat-icon>
                </div>

                @if (searchTerm()) {
                  <h2
                    class="mt-5 text-lg
                           font-semibold
                           text-[#032D42]"
                  >
                    No members found
                  </h2>

                  <p
                    class="mt-2 max-w-md
                           text-sm leading-6
                           text-[#6B7D84]"
                  >
                    No community members match "{{ searchTerm() }}". Try a different name, country,
                    or location.
                  </p>

                  <button
                    mat-button
                    type="button"
                    class="mt-4
                           !rounded-xl
                           !text-[#007979]"
                    (click)="clearSearch()"
                  >
                    Clear search
                  </button>
                } @else {
                  <h2
                    class="mt-5 text-lg
                           font-semibold
                           text-[#032D42]"
                  >
                    No community members yet
                  </h2>

                  <p
                    class="mt-2 max-w-md
                           text-sm leading-6
                           text-[#6B7D84]"
                  >
                    Community members will appear here as people join Zebron.
                  </p>
                }
              </div>
            </mat-card>
          }
        }
      </main>
    </div>
  `,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityMembersComponent implements OnInit {
  // =============================================================
  // SERVICES
  // =============================================================

  private readonly userService = inject(CommunityUserService);

  private readonly followStore = inject(CommunityFollowStore);

  private readonly authService = inject(AuthService);

  private readonly toast = inject(HotToastService);

  private readonly pageTitle = inject(PageTitleService);

  // =============================================================
  // STATE
  // =============================================================

  readonly members = signal<CommunityUser[]>([]);

  readonly loading = signal<boolean>(false);

  readonly error = signal<string | null>(null);

  readonly searchTerm = signal<string>('');

  readonly togglingUserId = signal<string | null>(null);

  // =============================================================
  // FILTERED MEMBERS
  // =============================================================

  readonly filteredMembers = computed<CommunityUser[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();

    const currentUserId = this.currentUserId();

    return this.members()
      .filter((member) => member.id !== currentUserId)
      .filter((member) => {
        if (!term) {
          return true;
        }

        const searchableText = [
          member.displayName,
          member.firstName,
          member.lastName,
          member.preferredName,
          member.bio,
          member.countryOfOrigin,
          member.currentCountry,
          member.city,
          member.state,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(term);
      });
  });

  // =============================================================
  // INITIALIZATION
  // =============================================================

  ngOnInit(): void {
    this.pageTitle.setTitle('Community Members');

    void this.loadMembers();
  }

  // =============================================================
  // LOAD MEMBERS
  // =============================================================

  async loadMembers(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const users = await this.userService.getCommunityUsers(50);

      this.members.set(users);

      const currentUserId = this.currentUserId();

      if (currentUserId) {
        await this.followStore.loadFollowing(currentUserId);
      }
    } catch (error) {
      console.error('[CommunityMembers] Failed to load members:', error);

      this.error.set('Unable to load community members.');
    } finally {
      this.loading.set(false);
    }
  }

  // =============================================================
  // SEARCH
  // =============================================================

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  // =============================================================
  // CURRENT USER
  // =============================================================

  private currentUserId(): string | null {
    return this.authService.user()?.id ?? this.authService.firebaseUser()?.uid ?? null;
  }

  // =============================================================
  // FOLLOW STATE
  // =============================================================

isFollowing(
  userId: string,
): boolean {

  return this.followStore
    .following()
    .some(
      (follow) =>
        follow.followingId === userId,
    );

}

  isToggling(userId: string): boolean {
    return this.togglingUserId() === userId;
  }

  // =============================================================
  // TOGGLE FOLLOW
  // =============================================================

  async toggleFollow(member: CommunityUser): Promise<void> {
    const currentUserId = this.currentUserId();

    if (!currentUserId) {
      this.toast.error('Please sign in to follow community members.');
      return;
    }

    if (this.togglingUserId()) {
      return;
    }

    this.togglingUserId.set(member.id);

    try {
      const following = await this.followStore.toggleFollow(currentUserId, member.id);

      this.toast.success(
        following
          ? `You are now following ${member.displayName}.`
          : `You unfollowed ${member.displayName}.`,
      );
    } catch (error) {
      console.error('[CommunityMembers] Failed to toggle follow:', error);

      this.toast.error('Unable to update the follow status. Please try again.');
    } finally {
      this.togglingUserId.set(null);
    }
  }

  // =============================================================
  // LOCATION
  // =============================================================

  getLocation(member: CommunityUser): string {
    return [member.city, member.state, member.currentCountry].filter(Boolean).join(', ');
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
