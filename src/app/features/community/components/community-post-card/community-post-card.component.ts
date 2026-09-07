
import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { CommunityPost } from '../../models/community-post.model';

@Component({
  selector: 'app-community-post-card',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <mat-card
      class="!rounded-2xl
             !border !border-[#D6E6E7]
             !bg-white
             !shadow-none
             hover:!border-[#7DD3D3]"
    >

      <!-- Header -->
      <div
        class="flex items-start justify-between gap-3"
      >

        <div
          class="flex min-w-0 items-center gap-3"
        >

          <!-- Avatar -->
          @if (post().author.photoUrl) {

            <img
              [src]="post().author.photoUrl"
              [alt]="
                post().author.displayName
              "
              class="h-10 w-10 rounded-full
                     object-cover
                     ring-2 ring-[#E5F4F4]"
            />

          } @else {

            <div
              class="flex h-10 w-10 items-center
                     justify-center rounded-full
                     bg-[#E5F4F4]
                     text-sm font-semibold
                     text-[#007979]"
            >
              {{
                post().author.displayName
                  .charAt(0)
                  .toUpperCase()
              }}
            </div>

          }

          <div class="min-w-0">

            <div
              class="truncate font-semibold
                     text-[#032D42]"
            >
              {{ post().author.displayName }}
            </div>

            <div
              class="text-xs
                     text-[#6F8B92]"
            >
              {{ post().topicName || 'Community' }}
            </div>

          </div>

        </div>

        <button
          mat-icon-button
          type="button"
          aria-label="Post options"
          class="!text-[#475D66]
                 hover:!bg-[#E5F4F4]
                 hover:!text-[#007979]"
          [matMenuTriggerFor]="postMenu"
        >
          <mat-icon>more_vert</mat-icon>
        </button>

        <mat-menu #postMenu="matMenu">

          <button
            mat-menu-item
          >
            <mat-icon
              class="!text-[#007979]"
            >
              bookmark_border
            </mat-icon>

            <span>Save post</span>
          </button>

          <button
            mat-menu-item
          >
            <mat-icon
              class="!text-[#007979]"
            >
              flag
            </mat-icon>

            <span>Report</span>
          </button>

        </mat-menu>

      </div>

      <!-- Content -->
      <div class="mt-4">

        <h2
          class="text-lg font-semibold
                 text-[#032D42]"
        >
          {{ post().title }}
        </h2>

        <p
          class="mt-2 whitespace-pre-line
                 text-sm leading-6
                 text-[#475D66]"
        >
          {{ post().content }}
        </p>

      </div>

      <!-- Actions -->
      <div
        class="mt-5 flex items-center
               border-t border-[#D6E6E7]
               pt-3"
      >

        <button
          mat-button
          type="button"
          class="!text-[#007979]
                 hover:!bg-[#E5F4F4]"
        >
          <mat-icon>
            thumb_up_off_alt
          </mat-icon>

          <span class="ml-1">
            {{ reactionCount('like') }}
          </span>
        </button>

        <button
          mat-button
          type="button"
          class="!text-[#007979]
                 hover:!bg-[#E5F4F4]"
        >
          <mat-icon>
            favorite_border
          </mat-icon>

          <span class="ml-1">
            {{ reactionCount('love') }}
          </span>
        </button>

        <button
          mat-button
          type="button"
          class="!text-[#007979]
                 hover:!bg-[#E5F4F4]"
        >
          <mat-icon>
            chat_bubble_outline
          </mat-icon>

          <span class="ml-1">
            {{ post().commentCount }}
          </span>
        </button>

        <button
          mat-button
          type="button"
          class="ml-auto
                 !text-[#007979]
                 hover:!bg-[#E5F4F4]"
        >
          <mat-icon>
            share
          </mat-icon>

          <span class="ml-1">
            Share
          </span>
        </button>

      </div>

    </mat-card>
  `,

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class CommunityPostCardComponent {
  readonly post = input.required<CommunityPost>();

  reactionCount(
    type: string,
  ): number {
    return this.post()
      .reactionCounts?.[type] ?? 0;
  }
}

