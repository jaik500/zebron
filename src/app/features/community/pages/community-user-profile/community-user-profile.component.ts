import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { HotToastService } from '@ngxpert/hot-toast';

import { PageTitleService } from '../../../../core/services/page-title.service';

import { CommunityFollowStore } from '../../store/community-follow.store';

import { CommunityUser } from '../../models/community-user.model';

import { CommunityUserService } from '../../services/community-user.service';
import { AuthService } from '../../../../core/services/auth.service';



@Component({
  selector: 'app-community-user-profile',

  standalone: true,

  imports: [
    RouterLink,
    MatIconModule,
  ],

  template: `
    <main
      class="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8"
    >

      <!-- =========================================================
           Back navigation
           ========================================================= -->
      <div class="mb-5">
        <a
          routerLink="/community"
          class="inline-flex items-center gap-1.5
                 text-sm font-medium
                 text-[#007979]
                 transition
                 hover:text-[#032D42]
                 focus:outline-none
                 focus:ring-2
                 focus:ring-[#007979]/20"
        >
          <mat-icon
            class="!m-0 !h-5 !w-5 !text-[20px]"
            aria-hidden="true"
          >
            arrow_back
          </mat-icon>

          Back to Community
        </a>
      </div>


      <!-- =========================================================
           Loading state
           ========================================================= -->
      @if (loading()) {

        <section
          class="rounded-2xl
                 border border-gray-200
                 bg-white
                 p-8
                 shadow-sm"
        >
          <div
            class="flex flex-col items-center
                   justify-center
                   py-12
                   text-center"
          >

            <div
              class="h-10 w-10
                     animate-spin
                     rounded-full
                     border-4
                     border-gray-200
                     border-t-[#007979]"
              aria-hidden="true"
            ></div>

            <p
              class="mt-4
                     text-sm
                     font-medium
                     text-gray-600"
            >
              Loading community profile...
            </p>

          </div>
        </section>
      }


      <!-- =========================================================
           Error / user not found
           ========================================================= -->
      @else if (error()) {

        <section
          class="rounded-2xl
                 border border-red-200
                 bg-white
                 p-8
                 shadow-sm"
        >
          <div
            class="mx-auto max-w-md
                   text-center"
          >

            <div
              class="mx-auto flex h-14 w-14
                     items-center justify-center
                     rounded-full
                     bg-red-50
                     text-red-600"
            >
              <mat-icon
                class="!m-0 !h-7 !w-7 !text-[28px]"
                aria-hidden="true"
              >
                person_off
              </mat-icon>
            </div>

            <h1
              class="mt-4
                     text-xl
                     font-semibold
                     text-[#032D42]"
            >
              Profile unavailable
            </h1>

            <p
              class="mt-2
                     text-sm
                     leading-6
                     text-gray-500"
            >
              {{ error() }}
            </p>

            <a
              routerLink="/community"
              class="mt-6
                     inline-flex
                     items-center
                     gap-2
                     rounded-lg
                     bg-[#032D42]
                     px-5
                     py-2.5
                     text-sm
                     font-semibold
                     text-white
                     transition
                     hover:bg-[#032D42]/90
                     focus:outline-none
                     focus:ring-2
                     focus:ring-[#032D42]/20"
            >
              <mat-icon
                class="!m-0 !h-5 !w-5 !text-[20px]"
                aria-hidden="true"
              >
                groups
              </mat-icon>

              Go to Community
            </a>

          </div>
        </section>
      }


      <!-- =========================================================
           Community user profile
           ========================================================= -->
      @else if (user(); as communityUser) {

        <section
          class="overflow-hidden
                 rounded-2xl
                 border border-gray-200
                 bg-white
                 shadow-sm"
        >

          <!-- =======================================================
               Profile header
               ======================================================= -->
          <div
            class="bg-[#032D42]
                   px-5
                   py-7
                   text-white
                   sm:px-8
                   sm:py-9"
          >

            <div
              class="flex flex-col
                     gap-6
                     sm:flex-row
                     sm:items-center
                     sm:justify-between"
            >

              <!-- User identity -->
              <div
                class="flex min-w-0
                       items-center
                       gap-4"
              >

                <!-- Avatar -->
                @if (communityUser.photoUrl) {

                  <img
                    [src]="communityUser.photoUrl"
                    [alt]="communityUserName(communityUser)"
                    class="h-20 w-20
                           shrink-0
                           rounded-full
                           object-cover
                           ring-2
                           ring-white/20
                           sm:h-24
                           sm:w-24"
                  />

                } @else {

                  <div
                    class="flex h-20 w-20
                           shrink-0
                           items-center
                           justify-center
                           rounded-full
                           bg-white/15
                           text-2xl
                           font-bold
                           text-white
                           ring-2
                           ring-white/20
                           sm:h-24
                           sm:w-24
                           sm:text-3xl"
                  >
                    {{ initials(communityUserName(communityUser)) }}
                  </div>

                }


                <!-- Name and location -->
                <div
                  class="min-w-0"
                >

                  <p
                    class="text-xs
                           font-semibold
                           uppercase
                           tracking-wide
                           text-blue-100"
                  >
                    Community member
                  </p>

                  <h1
                    class="mt-1
                           truncate
                           text-2xl
                           font-bold
                           tracking-tight
                           sm:text-3xl"
                  >
                    {{ communityUserName(communityUser) }}
                  </h1>

                  @if (communityUserLocation(communityUser); as location) {

                    <p
                      class="mt-1
                             flex
                             items-center
                             gap-1
                             truncate
                             text-sm
                             text-blue-100"
                    >
                      <mat-icon
                        class="!m-0 !h-4 !w-4 !text-[16px]"
                        aria-hidden="true"
                      >
                        location_on
                      </mat-icon>

                      {{ location }}
                    </p>

                  }

                </div>

              </div>


              <!-- =================================================
                   Follow action
                   ================================================= -->
              @if (!isCurrentUser(communityUser.id)) {

                <button
                  type="button"
                  (click)="toggleFollow(communityUser.id)"
                  [disabled]="followLoading()"
                  class="inline-flex
                         shrink-0
                         items-center
                         justify-center
                         gap-2
                         rounded-lg
                         px-5
                         py-2.5
                         text-sm
                         font-semibold
                         shadow-sm
                         transition
                         focus:outline-none
                         focus:ring-2
                         disabled:cursor-not-allowed
                         disabled:opacity-60"
                  [class.bg-[#7CC242]]="!isFollowing()"
                  [class.text-[#032D42]]="!isFollowing()"
                  [class.hover:bg-[#8ED957]]="!isFollowing()"
                  [class.bg-white]="isFollowing()"
                  [class.text-[#032D42]]="isFollowing()"
                  [class.hover:bg-gray-100]="isFollowing()"
                  [class.focus:ring-white/40]="true"
                >

                  @if (followLoading()) {

                    <span
                      class="h-4 w-4
                             animate-spin
                             rounded-full
                             border-2
                             border-current
                             border-t-transparent"
                      aria-hidden="true"
                    ></span>

                    {{ isFollowing() ? 'Updating...' : 'Updating...' }}

                  } @else {

                    <mat-icon
                      class="!m-0 !h-5 !w-5 !text-[20px]"
                      aria-hidden="true"
                    >
                      {{ isFollowing() ? 'person_remove' : 'person_add' }}
                    </mat-icon>

                    {{ isFollowing() ? 'Following' : 'Follow' }}

                  }

                </button>

              } @else {

                <span
                  class="inline-flex
                         shrink-0
                         items-center
                         gap-2
                         rounded-lg
                         border
                         border-white/20
                         bg-white/10
                         px-5
                         py-2.5
                         text-sm
                         font-semibold
                         text-white"
                >
                  <mat-icon
                    class="!m-0 !h-5 !w-5 !text-[20px]"
                    aria-hidden="true"
                  >
                    person
                  </mat-icon>

                  You
                </span>

              }

            </div>

          </div>


          <!-- =======================================================
               Profile statistics
               ======================================================= -->
          <div
            class="grid
                   grid-cols-2
                   divide-x
                   divide-gray-200
                   border-b
                   border-gray-200"
          >

            <div
              class="px-5
                     py-5
                     text-center"
            >
              <p
                class="text-2xl
                       font-bold
                       text-[#032D42]"
              >
                {{ communityFollowStore.followersCount() }}
              </p>

              <p
                class="mt-1
                       text-xs
                       font-semibold
                       uppercase
                       tracking-wide
                       text-gray-500"
              >
                Followers
              </p>
            </div>


            <div
              class="px-5
                     py-5
                     text-center"
            >
              <p
                class="text-2xl
                       font-bold
                       text-[#032D42]"
              >
                {{ communityFollowStore.followingCount() }}
              </p>

              <p
                class="mt-1
                       text-xs
                       font-semibold
                       uppercase
                       tracking-wide
                       text-gray-500"
              >
                Following
              </p>
            </div>

          </div>


          <!-- =======================================================
               Profile information
               ======================================================= -->
          <div
            class="p-6
                   sm:p-8"
          >

            <!-- Bio -->
            @if (communityUser.bio) {

              <section>
                <p
                  class="text-xs
                         font-semibold
                         uppercase
                         tracking-wide
                         text-[#007979]"
                >
                  About
                </p>

                <p
                  class="mt-2
                         max-w-3xl
                         text-sm
                         leading-7
                         text-gray-600"
                >
                  {{ communityUser.bio }}
                </p>
              </section>

            }


            <!-- Additional information -->
            <div
              class="mt-7
                     grid
                     gap-4
                     sm:grid-cols-2"
            >

              @if (communityUser.currentCountry) {

                <div
                  class="rounded-xl
                         border
                         border-gray-200
                         bg-gray-50
                         p-4"
                >
                  <p
                    class="text-xs
                           font-semibold
                           uppercase
                           tracking-wide
                           text-gray-500"
                  >
                    Current country
                  </p>

                  <p
                    class="mt-1
                           text-sm
                           font-semibold
                           text-[#032D42]"
                  >
                    {{ communityUser.currentCountry }}
                  </p>
                </div>

              }


              @if (communityUser.city || communityUser.state) {

                <div
                  class="rounded-xl
                         border
                         border-gray-200
                         bg-gray-50
                         p-4"
                >
                  <p
                    class="text-xs
                           font-semibold
                           uppercase
                           tracking-wide
                           text-gray-500"
                  >
                    Location
                  </p>

                  <p
                    class="mt-1
                           text-sm
                           font-semibold
                           text-[#032D42]"
                  >
                    {{ communityUserLocation(communityUser) }}
                  </p>
                </div>

              }


              @if (communityUser.countryOfOrigin) {

                <div
                  class="rounded-xl
                         border
                         border-gray-200
                         bg-gray-50
                         p-4"
                >
                  <p
                    class="text-xs
                           font-semibold
                           uppercase
                           tracking-wide
                           text-gray-500"
                  >
                    Country of origin
                  </p>

                  <p
                    class="mt-1
                           text-sm
                           font-semibold
                           text-[#032D42]"
                  >
                    {{ communityUser.countryOfOrigin }}
                  </p>
                </div>

              }


              @if (communityUser.website) {

                <div
                  class="rounded-xl
                         border
                         border-gray-200
                         bg-gray-50
                         p-4"
                >
                  <p
                    class="text-xs
                           font-semibold
                           uppercase
                           tracking-wide
                           text-gray-500"
                  >
                    Website
                  </p>

                  <a
                    [href]="communityUser.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-1
                           inline-flex
                           items-center
                           gap-1
                           text-sm
                           font-semibold
                           text-[#007979]
                           hover:text-[#032D42]"
                  >
                    Visit website

                    <mat-icon
                      class="!m-0 !h-4 !w-4 !text-[16px]"
                      aria-hidden="true"
                    >
                      open_in_new
                    </mat-icon>
                  </a>
                </div>

              }

            </div>


            <!-- =====================================================
                 Community activity placeholder
                 ===================================================== -->
            <section
              class="mt-8
                     border-t
                     border-gray-200
                     pt-7"
            >

              <div
                class="flex
                       flex-col
                       gap-2
                       sm:flex-row
                       sm:items-center
                       sm:justify-between"
              >

                <div>
                  <p
                    class="text-xs
                           font-semibold
                           uppercase
                           tracking-wide
                           text-[#007979]"
                  >
                    Community
                  </p>

                  <h2
                    class="mt-1
                           text-lg
                           font-semibold
                           text-[#032D42]"
                  >
                    Recent activity
                  </h2>
                </div>

                <span
                  class="inline-flex
                         w-fit
                         rounded-full
                         bg-[#007979]/10
                         px-3
                         py-1
                         text-xs
                         font-semibold
                         text-[#007979]"
                >
                  Coming soon
                </span>

              </div>

              <div
                class="mt-4
                       rounded-xl
                       border
                       border-dashed
                       border-gray-300
                       bg-gray-50
                       p-6
                       text-center"
              >

                <mat-icon
                  class="!m-0 !h-8 !w-8 !text-[32px] text-gray-400"
                  aria-hidden="true"
                >
                  forum
                </mat-icon>

                <p
                  class="mt-3
                         text-sm
                         text-gray-500"
                >
                  This member's recent posts and community activity
                  will appear here.
                </p>

              </div>

            </section>

          </div>

        </section>

      }

    </main>
  `,
})
export class CommunityUserProfileComponent implements OnInit {

  // =============================================================
  // Services
  // =============================================================

  private readonly route =
    inject(ActivatedRoute);

  private readonly userService =
    inject(CommunityUserService);

    protected readonly authService =
  inject(AuthService);

  protected readonly communityFollowStore =
    inject(CommunityFollowStore);

  protected readonly toast =
    inject(HotToastService);

  readonly pageTitleService =
    inject(PageTitleService);


  // =============================================================
  // UI state
  // =============================================================

  protected readonly user =
    signal<CommunityUser | null>(null);

  protected readonly loading =
    signal(true);

  protected readonly error =
    signal<string | null>(null);

  protected readonly followLoading =
    signal(false);


  // =============================================================
  // Current follow state
  // =============================================================

  protected readonly isFollowing =
    signal(false);


  // =============================================================
  // Current authenticated user
  // =============================================================

  private currentUserId = '';


  // =============================================================
  // Constructor
  // =============================================================

  constructor() {

    this.pageTitleService.setTitle(
      'Community Profile',
    );

  }


  // =============================================================
  // Initialize
  // =============================================================

  ngOnInit(): void {

    void this.loadProfile();

  }


  // =============================================================
  // Load community profile
  // =============================================================

  private async loadProfile(): Promise<void> {

    const userId =
      this.route.snapshot.paramMap.get(
        'userId',
      );

    if (!userId) {

      this.error.set(
        'The requested community profile could not be found.',
      );

      this.loading.set(false);

      return;

    }


    this.loading.set(true);

    this.error.set(null);


    try {

      const communityUser =
        await this.userService.getUserById(
          userId,
        );


      if (!communityUser) {

        this.error.set(
          'This community member does not exist or is no longer available.',
        );

        return;

      }


      this.user.set(
        communityUser,
      );


      /*
       * Load the current user's follow relationship
       * and the profile owner's follower/following
       * information.
       */
      const authUserId =
        await this.getCurrentUserId();

      this.currentUserId =
        authUserId;


      await Promise.all([

        this.communityFollowStore.loadFollowers(
          communityUser.id,
        ),

        this.communityFollowStore.loadFollowing(
          communityUser.id,
        ),

        authUserId &&
        authUserId !== communityUser.id
          ? this.loadFollowStatus(
              authUserId,
              communityUser.id,
            )
          : Promise.resolve(),

      ]);

    } catch (error) {

      console.error(
        '[CommunityUserProfile] Failed to load profile:',
        error,
      );

      this.error.set(
        'Unable to load this community profile. Please try again.',
      );

    } finally {

      this.loading.set(false);

    }

  }


  // =============================================================
  // Get authenticated user ID
  // =============================================================

 private getCurrentUserId(): string {
  return this.authService.user()?.id ?? '';
}


  // =============================================================
  // Load follow status
  // =============================================================

  private async loadFollowStatus(
    followerId: string,
    followingId: string,
  ): Promise<void> {

    const following =
      await this.communityFollowStore.checkFollowing(
        followerId,
        followingId,
      );

    this.isFollowing.set(
      following,
    );

  }


  // =============================================================
  // Toggle follow
  // =============================================================

  protected async toggleFollow(
    followingId: string,
  ): Promise<void> {

    if (
      !this.currentUserId ||
      !followingId ||
      this.currentUserId === followingId ||
      this.followLoading()
    ) {

      return;

    }


    this.followLoading.set(true);


    try {

      const following =
        await this.communityFollowStore.toggleFollow(
          this.currentUserId,
          followingId,
        );


      this.isFollowing.set(
        following,
      );


      /*
       * Refresh the profile's follower/following
       * counts after the relationship changes.
       */
      await Promise.all([

        this.communityFollowStore.loadFollowers(
          followingId,
        ),

        this.communityFollowStore.loadFollowing(
          followingId,
        ),

      ]);


      if (following) {

        this.toast.success(
          'You are now following this member.',
        );

      } else {

        this.toast.success(
          'You are no longer following this member.',
        );

      }

    } catch (error) {

      console.error(
        '[CommunityUserProfile] Failed to update follow:',
        error,
      );

      this.toast.error(
        'Unable to update the follow status. Please try again.',
      );

    } finally {

      this.followLoading.set(false);

    }

  }


  // =============================================================
  // Determine whether this is the current user's profile
  // =============================================================

  protected isCurrentUser(
    userId: string,
  ): boolean {

    return (
      !!this.currentUserId &&
      this.currentUserId === userId
    );

  }


  // =============================================================
  // Display name
  // =============================================================

  protected communityUserName(
    user: CommunityUser,
  ): string {

    return (
      user.preferredName?.trim() ||
      user.displayName?.trim() ||
      'Zebron User'
    );

  }


  // =============================================================
  // Location
  // =============================================================

  protected communityUserLocation(
    user: CommunityUser,
  ): string {

    return [
      user.city,
      user.state,
      user.currentCountry,
    ]
      .map(
        (value) => value?.trim(),
      )
      .filter(Boolean)
      .join(', ');

  }


  // =============================================================
  // Initials
  // =============================================================

  protected initials(
    value: string,
  ): string {

    const parts =
      value
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if (parts.length === 0) {

      return 'ZU';

    }


    if (parts.length === 1) {

      return parts[0]
        .substring(0, 2)
        .toUpperCase();

    }


    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();

  }

}