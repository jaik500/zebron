import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  MatButtonModule,
} from '@angular/material/button';

import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatInputModule,
} from '@angular/material/input';

import {
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';

import {
  AuthService,
} from '../../../../../core/services/auth.service';

import {
  LoggerService,
} from '../../../../../core/services/logger.service';

import {
  CommunityUser,
} from '../../../models/community-user.model';

import {
  CommunityUserService,
} from '../../../services/community-user.service';

@Component({
  selector: 'app-new-conversation-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div class="w-full sm:w-[480px]">

      <!-- HEADER -->
      <div
        class="flex items-center justify-between border-b px-5 py-4"
      >
        <div>
          <h2
            class="text-lg font-semibold text-gray-900"
          >
            New conversation
          </h2>

          <p
            class="mt-0.5 text-sm text-gray-500"
          >
            Choose a community member to message.
          </p>
        </div>

        <button
          mat-icon-button
          type="button"
          aria-label="Close"
          (click)="close()"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- SEARCH -->
      <div class="border-b px-5 py-4">
        <mat-form-field
          appearance="outline"
          class="w-full"
        >
          <mat-label>Search community members</mat-label>

          <mat-icon
            matPrefix
            class="mr-2"
          >
            search
          </mat-icon>

          <input
            matInput
            [value]="searchTerm()"
            (input)="setSearchTerm($any($event.target).value)"
            placeholder="Name, location, or country"
            autocomplete="off"
          />

          @if (searchTerm()) {
            <button
              mat-icon-button
              matSuffix
              type="button"
              aria-label="Clear search"
              (click)="clearSearch()"
            >
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>

      <!-- CONTENT -->
      <div class="max-h-[420px] overflow-y-auto">

        @if (loading()) {

          <div
            class="flex min-h-[240px] items-center justify-center"
          >
            <div class="flex flex-col items-center gap-3">
              <mat-spinner diameter="36"></mat-spinner>

              <span class="text-sm text-gray-500">
                Loading community members...
              </span>
            </div>
          </div>

        } @else if (error()) {

          <div class="p-5">
            <div
              class="rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <div
                class="flex items-start gap-3"
              >
                <mat-icon
                  class="text-red-500"
                >
                  error_outline
                </mat-icon>

                <div class="flex-1">
                  <p
                    class="text-sm font-medium text-red-800"
                  >
                    Unable to load community members
                  </p>

                  <p
                    class="mt-1 text-sm text-red-700"
                  >
                    {{ error() }}
                  </p>
                </div>
              </div>

              <button
                mat-stroked-button
                type="button"
                class="mt-4"
                (click)="loadMembers()"
              >
                <mat-icon>refresh</mat-icon>
                Try again
              </button>
            </div>
          </div>

        } @else if (filteredMembers().length === 0) {

          <div
            class="flex min-h-[240px] flex-col items-center justify-center px-6 text-center"
          >
            <mat-icon
              class="!h-12 !w-12 !text-[48px] text-gray-300"
            >
              person_search
            </mat-icon>

            <h3
              class="mt-3 text-sm font-semibold text-gray-800"
            >
              No members found
            </h3>

            <p
              class="mt-1 max-w-sm text-sm text-gray-500"
            >
              @if (searchTerm()) {
                No community members match "{{ searchTerm() }}".
                Try a different search.
              } @else {
                There are no other community members available yet.
              }
            </p>
          </div>

        } @else {

          <div class="divide-y">

            @for (
              member of filteredMembers();
              track member.id
            ) {

              <button
                type="button"
                class="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
                [disabled]="selectingUserId() === member.id"
                (click)="selectMember(member)"
              >

                <!-- AVATAR -->
                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100"
                >

                  @if (member.photoUrl) {

                    <img
                      class="h-full w-full object-cover"
                      [src]="member.photoUrl"
                      [alt]="member.displayName"
                    />

                  } @else {

                    <span
                      class="text-sm font-semibold text-gray-600"
                    >
                      {{ getInitials(member.displayName) }}
                    </span>

                  }

                </div>

                <!-- MEMBER -->
                <div class="min-w-0 flex-1">

                  <div
                    class="truncate text-sm font-semibold text-gray-900"
                  >
                    {{ member.displayName }}
                  </div>

                  <div
                    class="mt-0.5 truncate text-xs text-gray-500"
                  >
                    {{ getLocation(member) }}
                  </div>

                </div>

                <!-- SELECTING -->
                @if (selectingUserId() === member.id) {

                  <mat-spinner diameter="24"></mat-spinner>

                } @else {

                  <mat-icon
                    class="text-gray-400"
                  >
                    chevron_right
                  </mat-icon>

                }

              </button>

            }

          </div>

        }

      </div>

      <!-- FOOTER -->
      <div
        class="flex justify-end border-t px-5 py-3"
      >
        <button
          mat-button
          type="button"
          (click)="close()"
        >
          Cancel
        </button>
      </div>

    </div>
  `,
})
export class NewConversationDialogComponent
  implements OnInit {

  private readonly dialogRef =
    inject(
      MatDialogRef<NewConversationDialogComponent>,
    );

  private readonly userService =
    inject(CommunityUserService);

  private readonly authService =
    inject(AuthService);

  private readonly logger =
    inject(LoggerService);

  readonly members =
    signal<CommunityUser[]>([]);

  readonly loading =
    signal<boolean>(false);

  readonly error =
    signal<string | null>(null);

  readonly searchTerm =
    signal<string>('');

  readonly selectingUserId =
    signal<string | null>(null);

  readonly filteredMembers =
    computed<CommunityUser[]>(() => {

      const term =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const currentUserId =
        this.currentUserId();

      return this.members()
        .filter(
          (member) =>
            member.id !== currentUserId,
        )
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

  ngOnInit(): void {
    void this.loadMembers();
  }

  async loadMembers(): Promise<void> {

    this.loading.set(true);
    this.error.set(null);

    try {

      const users =
        await this.userService
          .getCommunityUsers(50);

      this.members.set(users);

      this.logger.info(
        'NewConversationDialog',
        'Community members loaded.',
        {
          count: users.length,
        },
      );

    } catch (error) {

      this.logger.error(
        'NewConversationDialog',
        'Failed to load community members.',
        error,
      );

      this.error.set(
        'We could not load community members right now.',
      );

    } finally {

      this.loading.set(false);

    }
  }

  setSearchTerm(
    value: string,
  ): void {
    this.searchTerm.set(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  async selectMember(
    member: CommunityUser,
  ): Promise<void> {

    this.selectingUserId.set(member.id);

    try {

      this.dialogRef.close(member);

    } finally {

      this.selectingUserId.set(null);

    }
  }

  close(): void {
    this.dialogRef.close();
  }

  getInitials(
    displayName: string,
  ): string {

    const parts =
      displayName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
      return '?';
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

  getLocation(
    member: CommunityUser,
  ): string {

    const location = [
      member.city,
      member.state,
      member.currentCountry,
    ]
      .filter(Boolean)
      .join(', ');

    return (
      location ||
      member.countryOfOrigin ||
      'Community member'
    );
  }

  private currentUserId(): string | null {

    return (
      this.authService.user()?.id ??
      this.authService.firebaseUser()?.uid ??
      null
    );
  }
}
