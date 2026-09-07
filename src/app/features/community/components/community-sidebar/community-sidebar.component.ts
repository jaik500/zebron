
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { CommunityStore } from '../../store/community.store';

@Component({
  selector: 'app-community-sidebar',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
  template: `
    <div class="space-y-6">

      <!-- Main navigation -->
      <section>

        <h2
          class="px-3 text-xs font-semibold
                 uppercase tracking-wider
                 text-[#6F8B92]"
        >
          Community
        </h2>

        <div class="mt-2 space-y-1">

          <button
            mat-button
            type="button"
            class="!w-full !justify-start
                   !rounded-xl
                   !text-[#032D42]
                   hover:!bg-[#E5F4F4]"
            [class.!bg-[#E5F4F4]]="
              !store.selectedTopicId()
            "
            [class.!text-[#007979]]="
              !store.selectedTopicId()
            "
            (click)="selectAll()"
          >
            <mat-icon
              [class.!text-[#007979]]="
                !store.selectedTopicId()
              "
            >
              home
            </mat-icon>

            <span class="ml-2">
              Home
            </span>
          </button>

          <button
            mat-button
            type="button"
            class="!w-full !justify-start
                   !rounded-xl
                   !text-[#032D42]
                   hover:!bg-[#E5F4F4]
                   hover:!text-[#007979]"
          >
            <mat-icon
              class="!text-[#007979]"
            >
              local_fire_department
            </mat-icon>

            <span class="ml-2">
              Trending
            </span>
          </button>

          <button
            mat-button
            type="button"
            class="!w-full !justify-start
                   !rounded-xl
                   !text-[#032D42]
                   hover:!bg-[#E5F4F4]
                   hover:!text-[#007979]"
          >
            <mat-icon
              class="!text-[#007979]"
            >
              people
            </mat-icon>

            <span class="ml-2">
              Following
            </span>
          </button>

          <button
            mat-button
            type="button"
            class="!w-full !justify-start
                   !rounded-xl
                   !text-[#032D42]
                   hover:!bg-[#E5F4F4]
                   hover:!text-[#007979]"
          >
            <mat-icon
              class="!text-[#007979]"
            >
              bookmark
            </mat-icon>

            <span class="ml-2">
              Saved
            </span>
          </button>

        </div>
      </section>

      <!-- Topics -->
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
                  class="!text-[#007979]"
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
  readonly store = inject(CommunityStore);

  async selectAll(): Promise<void> {
    await this.store.selectTopic(null);
  }

  async selectTopic(
    topicId: string,
  ): Promise<void> {
    await this.store.selectTopic(topicId);
  }
}

