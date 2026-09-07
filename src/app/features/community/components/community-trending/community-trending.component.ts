
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { CommunityStore } from '../../store/community.store';

@Component({
  selector: 'app-community-trending',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  template: `
    <div class="space-y-5">

      <!-- Trending topics -->
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

              <span
                class="mr-2"
              >
                {{ topic.icon || '💬' }}
              </span>

              <span
                class="truncate"
              >
                {{ topic.name }}
              </span>

            </button>

          }

        </div>

      </mat-card>

      <!-- Community information -->
      <mat-card
        class="!rounded-2xl
               !border !border-[#D6E6E7]
               !bg-white
               !shadow-none"
      >

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

      </mat-card>

    </div>
  `,

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class CommunityTrendingComponent {
  readonly store = inject(CommunityStore);

  async selectTopic(
    topicId: string,
  ): Promise<void> {
    await this.store.selectTopic(topicId);
  }
}

