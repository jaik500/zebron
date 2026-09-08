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
import { ZebronHeaderComponent } from './shared/components/zebron-header/zebron-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FooterComponent,
    ZebronHeaderComponent,
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

    </div>
  `,
  styles: [],
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

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
      });
  }

  private isHomeRoute(url: string): boolean {
    const normalizedUrl = url
      .split('?')[0]
      .split('#')[0]
      .replace(/\/+$/, '') || '/';

    return normalizedUrl === '/';
  }
}