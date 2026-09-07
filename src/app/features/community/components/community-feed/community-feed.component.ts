
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CommunityStore } from '../../store/community.store';

import { CommunityPostCardComponent } from '../community-post-card/community-post-card.component';

@Component({
  selector: 'app-community-feed',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommunityPostCardComponent,
  ],
  template: `
    <section>

      <!-- Loading -->
      @if (store.loading()) {

        <div
          class="flex min-h-64 items-center
                 justify-center"
        >
          <mat-spinner
            diameter="40"
            class="community-spinner"
          />
        </div>

      } @else {

        <!-- Error -->
        @if (store.error()) {
          <div
            class="mb-4 rounded-xl border
                   border-red-200
                   bg-red-50 p-4"
          >
            <div
              class="flex items-center
                     justify-between gap-4"
            >

              <div
                class="flex items-center gap-2
                       text-sm text-red-700"
              >
                <mat-icon>
                  error_outline
                </mat-icon>

                <span>
                  {{ store.error() }}
                </span>
              </div>

              <button
                mat-button
                type="button"
                class="!text-[#007979]
                       hover:!bg-[#E5F4F4]"
                (click)="refresh()"
              >
                Try again
              </button>

            </div>
          </div>
        }

        <!-- Empty state -->
        @if (store.isEmpty()) {

          <div
            class="rounded-2xl border
                   border-dashed
                   border-[#B8D0D2]
                   bg-white p-10 text-center"
          >

            <mat-icon
              class="!h-12 !w-12 !text-5xl
                     !text-[#7DD3D3]"
            >
              forum
            </mat-icon>

            <h2
              class="mt-4 text-lg font-semibold
                     text-[#032D42]"
            >
              No posts found
            </h2>

            <p
              class="mt-2 text-sm
                     text-[#6F8B92]"
            >
              Be the first person to start
              a conversation.
            </p>

          </div>

        } @else {

          <!-- Posts -->
          <div class="space-y-4">

            @for (
              post of store.filteredPosts();
              track post.id
            ) {
              <app-community-post-card
                [post]="post"
              />
            }

          </div>

          <!-- Load more -->
          @if (store.hasMore()) {

            <div
              class="flex justify-center py-8"
            >

              <button
                mat-stroked-button
                type="button"
                class="!border-[#007979]
                       !text-[#007979]
                       hover:!bg-[#E5F4F4]"
                [disabled]="
                  store.loadingMore()
                "
                (click)="loadMore()"
              >

                @if (
                  store.loadingMore()
                ) {

                  <mat-spinner
                    diameter="20"
                    class="community-spinner"
                  />

                  <span
                    class="ml-2"
                  >
                    Loading...
                  </span>

                } @else {

                  Load more

                }

              </button>

            </div>

          }

        }

      }

    </section>
  `,

  styles: [`
    /*
     * Zebron Community Feed
     *
     * Keep the feed component behavior and
     * data handling unchanged. These styles
     * only provide Zebron branding for the
     * Material progress indicators.
     */

    .community-spinner {
      --mdc-circular-progress-active-indicator-color: #007979;
    }
  `],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class CommunityFeedComponent {
  readonly store = inject(CommunityStore);

  async loadMore(): Promise<void> {
    await this.store.loadMore();
  }

  async refresh(): Promise<void> {
    await this.store.refresh();
  }
}

