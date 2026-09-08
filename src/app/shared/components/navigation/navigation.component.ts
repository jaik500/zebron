import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <nav
      aria-label="Primary navigation"
      class="flex items-center gap-1"
    >

      @for (
        item of navigationService.visibleItems();
        track item.key
      ) {

        <a
          [routerLink]="item.route"
          routerLinkActive="!bg-[#032D42] !text-white"
          [routerLinkActiveOptions]="{
            exact: item.route === '/'
          }"
          [attr.aria-label]="item.label"
          class="
            inline-flex
            items-center
            gap-2
            rounded-lg
            px-3
            py-2
            text-sm
            font-medium
            text-gray-700
            transition
            hover:bg-gray-100
            hover:text-[#032D42]
          "
        >

          <mat-icon
            class="
              !h-5
              !w-5
              !text-[20px]
            "
            aria-hidden="true"
          >
            {{ item.icon }}
          </mat-icon>

          <span>
            {{ item.label }}
          </span>

        </a>

      }

    </nav>
  `,
})
export class NavigationComponent {

  protected readonly navigationService =
    inject(NavigationService);

}