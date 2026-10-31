import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';

import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FooterComponent } from './core/components/footer/footer.components';
import { ZebronHeaderComponent } from './shared/components/zebron-header/zebron-header.component';
import { LocalizationService } from './core/services/localization.service';
import { ClaimsSyncService } from './core/services/claims-sync.service';
import { AuthService } from './core/services/auth.service';
import { SupportAssistantComponent } from './features/support/assistant/support-assistant.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FooterComponent,
    ZebronHeaderComponent,
    SupportAssistantComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col">

      <!-- ========================================================
           GLOBAL HEADER
           
           The Home page intentionally does NOT display the
           global application header.
           ======================================================== -->

      @if (showHeader()) {
        <app-zebron-header />
      }

      <!-- ========================================================
           PAGE CONTENT
           ======================================================== -->

      <main class="flex-1">
        <router-outlet />
      </main>

      <!-- ========================================================
           GLOBAL FOOTER
           ======================================================== -->

      <app-footer />

      <!-- ========================================================
           HELP ASSISTANT ("Ask for help"), on every page for everyone.
           Answers are scoped to the organization in the address.
           Admins can switch it off in Admin → Help Assistant.
           ======================================================== -->

      <app-support-assistant
        [organizationId]="assistantOrganizationId()"
        [firstName]="firstName()"
      />

    </div>
  `,
  styles: [],
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly localization = inject(LocalizationService);
  private readonly claimsSync = inject(ClaimsSyncService);

  /**
   * Controls whether the global header is displayed.
   *
   * Home (/):
   *   Header hidden
   *
   * Everything else:
   *   Header displayed
   */
  protected readonly showHeader = signal(
    !this.isHomeRoute(this.router.url),
  );

  private readonly auth = inject(AuthService);

  /** Organization in the current address (/partner/org/<id>/...), if any. */
  protected readonly assistantOrganizationId = signal<string | null>(
    this.organizationIdFrom(this.router.url),
  );

  /** First name for the assistant's greeting. */
  protected readonly firstName = computed(() => {
    const name = this.auth.user()?.displayName?.trim() || this.auth.firebaseUser()?.displayName?.trim() || '';
    return name.split(/\s+/)[0] || null;
  });

  constructor() {
    // Restore the saved language (or the browser's, if supported).
    this.localization.initialize();

    // Keep roles on the sign-in token current (browser only).
    this.claimsSync.start();

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.showHeader.set(
          !this.isHomeRoute(event.urlAfterRedirects),
        );

        this.assistantOrganizationId.set(
          this.organizationIdFrom(event.urlAfterRedirects),
        );
      });
  }

  private organizationIdFrom(url: string): string | null {
    const match = /^\/partner\/org\/([^/?#]+)/.exec(url);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private isHomeRoute(url: string): boolean {
    const normalizedUrl = url
      .split('?')[0]
      .split('#')[0]
      .replace(/\/+$/, '') || '/';

    return normalizedUrl === '/';
  }
}