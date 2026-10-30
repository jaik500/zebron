import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { AuthService } from './core/services/auth.service';
import { SupportAssistantComponent } from './features/support/assistant/support-assistant.component';
import { ZebronHeaderComponent } from './shared/components/zebron-header/zebron-header.component';

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

      <!-- Help assistant: partner portal and support pages, signed-in users -->
      @if (showAssistant() && auth.firebaseUser()) {
        <app-support-assistant
          [organizationId]="assistantOrganizationId()"
          [firstName]="auth.user()?.firstName ?? null"
        />
      }

    </div>
  `,
  styles: [],
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  /** Assistant shows on /partner/... and /support pages. */
  protected readonly showAssistant = signal(this.isAssistantRoute(this.router.url));

  /** Organization taken from /partner/org/:organizationId/... */
  protected readonly assistantOrganizationId = signal(this.organizationFromUrl(this.router.url));

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

  constructor() {
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

        this.showAssistant.set(this.isAssistantRoute(event.urlAfterRedirects));
        this.assistantOrganizationId.set(
          this.organizationFromUrl(event.urlAfterRedirects) ??
            new URLSearchParams(event.urlAfterRedirects.split('?')[1] ?? '').get('organizationId'),
        );
      });
  }

  private isAssistantRoute(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return path.startsWith('/partner') || path.startsWith('/support');
  }

  private organizationFromUrl(url: string): string | null {
    const match = url.split('?')[0].match(/^\/partner\/org\/([^/]+)/);
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