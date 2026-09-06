import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  CommunityPostType,
} from '../../../../core/models/community/community-post.model';

import { CommunityStore } from '../../store/community.store';

import { CommunityPostCardComponent } from '../../components/community-post-card/community-post-card.component';


@Component({
  selector: 'app-community-home',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,

    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,

    CommunityPostCardComponent,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div class="community-page">

      <!-- ======================================================
           HERO
           ====================================================== -->

      <section class="hero">

        <div class="hero-content">

          <div class="eyebrow">
            ZEBRON COMMUNITY
          </div>

          <h1>
            {{ selectedPostTypeLabel() }}
          </h1>

          <p>
            {{ selectedPostTypeDescription() }}
          </p>

          <div class="hero-actions">

            <a
              mat-flat-button
              color="primary"
              routerLink="/community/new"
            >
              <mat-icon>add</mat-icon>
              Create a Post
            </a>

            @if (selectedPostType()) {
              <a
                mat-stroked-button
                routerLink="/community"
              >
                <mat-icon>home</mat-icon>
                Community Home
              </a>
            }

          </div>

        </div>

      </section>


      <!-- ======================================================
           CONTENT
           ====================================================== -->

      <main class="content">

        <!-- ====================================================
             QUICK NAVIGATION
             ==================================================== -->

        <section class="navigation">

          <a
            class="navigation-item"
            routerLink="/community"
          >
            <mat-icon>home</mat-icon>
            <span>Home</span>
          </a>

          <a
            class="navigation-item"
            routerLink="/community"
            [queryParams]="{ type: 'discussion' }"
          >
            <mat-icon>forum</mat-icon>
            <span>Discussions</span>
          </a>

          <a
            class="navigation-item"
            routerLink="/community"
            [queryParams]="{ type: 'question' }"
          >
            <mat-icon>help_outline</mat-icon>
            <span>Questions</span>
          </a>

          <a
            class="navigation-item"
            routerLink="/community"
            [queryParams]="{ type: 'news' }"
          >
            <mat-icon>newspaper</mat-icon>
            <span>News</span>
          </a>

          <a
            class="navigation-item"
            routerLink="/community"
            [queryParams]="{ type: 'event' }"
          >
            <mat-icon>event</mat-icon>
            <span>Events</span>
          </a>

          <a
            class="navigation-item"
            routerLink="/community"
            [queryParams]="{ type: 'opportunity' }"
          >
            <mat-icon>work_outline</mat-icon>
            <span>Opportunities</span>
          </a>

        </section>


        <!-- ====================================================
             ERROR
             ==================================================== -->

        @if (store.error()) {

          <mat-card
            class="error-card"
            appearance="outlined"
          >
            <mat-icon>error_outline</mat-icon>

            <div>
              <strong>
                We couldn't load the community
              </strong>

              <p>
                {{ store.error() }}
              </p>
            </div>

            <button
              mat-button
              color="primary"
              type="button"
              (click)="reload()"
            >
              Retry
            </button>
          </mat-card>

        }


        <!-- ====================================================
             LOADING
             ==================================================== -->

        @if (store.loading()) {

          <div class="loading">

            <mat-spinner diameter="42"></mat-spinner>

            <p>
              Loading community activity...
            </p>

          </div>

        } @else {

          <!-- ==================================================
               FILTER HEADER
               ================================================== -->

          <div class="section-header">

            <div>

              <div class="section-eyebrow">
                COMMUNITY
              </div>

              <h2>
                {{ selectedPostTypeLabel() }}
              </h2>

              <p>
                {{ store.resultCount() }}
                {{ store.resultCount() === 1 ? 'post' : 'posts' }}
              </p>

            </div>

            @if (store.hasActiveFilters()) {

              <button
                mat-button
                type="button"
                (click)="clearFilters()"
              >
                <mat-icon>clear</mat-icon>
                Clear Filters
              </button>

            }

          </div>


          <!-- ==================================================
               POSTS
               ================================================== -->

          @if (filteredPosts().length > 0) {

            <div class="post-grid">

              @for (
                post of filteredPosts();
                track post.id
              ) {

                <app-community-post-card
                  [post]="post"
                />

              }

            </div>

          } @else {

            <mat-card
              class="empty-card"
              appearance="outlined"
            >

              <mat-icon>
                forum
              </mat-icon>

              <h3>
                No posts found
              </h3>

              <p>
                There are no posts matching the current view.
              </p>

              <a
                mat-flat-button
                color="primary"
                routerLink="/community/new"
              >
                <mat-icon>add</mat-icon>
                Create a Post
              </a>

            </mat-card>

          }

        }

      </main>

    </div>
  `,

  styles: [
    `
      :host {
        display: block;
      }

      .community-page {
        min-height: 100%;
        background: #f8fafc;
      }


      /* ========================================================
         HERO
         ======================================================== */

      .hero {
        padding: 56px 24px;

        background:
          linear-gradient(
            135deg,
            #172554,
            #1e3a8a
          );

        color: white;
      }

      .hero-content {
        width: min(1180px, 100%);
        margin: 0 auto;
      }

      .eyebrow,
      .section-eyebrow {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.12em;
      }

      .eyebrow {
        opacity: 0.75;
      }

      .hero h1 {
        margin: 8px 0 10px;

        font-size: clamp(34px, 5vw, 54px);
        line-height: 1.05;
        font-weight: 800;
      }

      .hero p {
        max-width: 720px;
        margin: 0;

        color: rgba(255, 255, 255, 0.82);

        font-size: 17px;
        line-height: 1.6;
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;

        margin-top: 26px;
      }


      /* ========================================================
         CONTENT
         ======================================================== */

      .content {
        width: min(1180px, 100%);

        margin: 0 auto;

        padding: 28px 24px 60px;
      }


      /* ========================================================
         NAVIGATION
         ======================================================== */

      .navigation {
        display: grid;
        grid-template-columns:
          repeat(6, minmax(0, 1fr));

        gap: 10px;

        margin-bottom: 34px;
      }

      .navigation-item {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;

        min-height: 50px;

        padding: 10px;

        border: 1px solid #e2e8f0;
        border-radius: 10px;

        background: white;

        color: #334155;

        text-decoration: none;

        font-size: 13px;
        font-weight: 600;

        transition:
          background 150ms ease,
          border-color 150ms ease,
          transform 150ms ease;
      }

      .navigation-item:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        transform: translateY(-1px);
      }

      .navigation-item mat-icon {
        width: 19px;
        height: 19px;

        font-size: 19px;
      }


      /* ========================================================
         SECTION HEADER
         ======================================================== */

      .section-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;

        margin-bottom: 18px;
      }

      .section-eyebrow {
        color: #64748b;
      }

      .section-header h2 {
        margin: 4px 0;

        color: #172033;

        font-size: 26px;
        line-height: 1.2;
        font-weight: 750;
      }

      .section-header p {
        margin: 0;

        color: #64748b;

        font-size: 14px;
      }


      /* ========================================================
         POSTS
         ======================================================== */

      .post-grid {
        display: grid;

        grid-template-columns:
          repeat(2, minmax(0, 1fr));

        gap: 16px;
      }


      /* ========================================================
         LOADING
         ======================================================== */

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        min-height: 300px;

        color: #64748b;
      }

      .loading p {
        margin-top: 16px;
      }


      /* ========================================================
         ERROR
         ======================================================== */

      .error-card {
        display: flex;
        align-items: center;
        gap: 14px;

        margin-bottom: 24px;

        padding: 16px;

        border-radius: 12px;
      }

      .error-card > mat-icon {
        color: #b42318;
      }

      .error-card p {
        margin: 3px 0 0;

        color: #64748b;
      }

      .error-card button {
        margin-left: auto;
      }


      /* ========================================================
         EMPTY
         ======================================================== */

      .empty-card {
        display: flex;
        flex-direction: column;
        align-items: center;

        padding: 60px 24px;

        text-align: center;
      }

      .empty-card > mat-icon {
        width: 42px;
        height: 42px;

        margin-bottom: 12px;

        color: #94a3b8;

        font-size: 42px;
      }

      .empty-card h3 {
        margin: 0 0 8px;

        font-size: 20px;
      }

      .empty-card p {
        margin: 0 0 20px;

        color: #64748b;
      }


      /* ========================================================
         RESPONSIVE
         ======================================================== */

      @media (max-width: 900px) {

        .navigation {
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
        }

      }

      @media (max-width: 700px) {

        .hero {
          padding: 42px 18px;
        }

        .content {
          padding:
            22px
            16px
            45px;
        }

        .navigation {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .post-grid {
          grid-template-columns: 1fr;
        }

        .section-header {
          align-items: flex-start;
          flex-direction: column;
        }

      }

      @media (max-width: 480px) {

        .navigation {
          grid-template-columns: 1fr;
        }

        .hero-actions {
          flex-direction: column;
        }

        .hero-actions a {
          width: 100%;
        }

      }
    `,
  ],
})
export class CommunityHomeComponent implements OnInit {

  // ============================================================
  // DEPENDENCIES
  // ============================================================

  protected readonly store =
    inject(CommunityStore);

  private readonly route =
    inject(ActivatedRoute);

  private readonly destroyRef =
    inject(DestroyRef);


  // ============================================================
  // FILTERED POSTS
  // ============================================================

  protected readonly filteredPosts =
    computed(() => {

      return [...this.store.filteredPosts()]
        .sort((a, b) => {

          // Pinned first.
          if (a.pinned !== b.pinned) {
            return a.pinned ? -1 : 1;
          }

          // Featured second.
          if (a.featured !== b.featured) {
            return a.featured ? -1 : 1;
          }

          const aTime =
            a.publishedAt?.toMillis?.()
            ??
            a.createdAt?.toMillis?.()
            ??
            0;

          const bTime =
            b.publishedAt?.toMillis?.()
            ??
            b.createdAt?.toMillis?.()
            ??
            0;

          return bTime - aTime;
        });

    });


  // ============================================================
  // SELECTED TYPE
  // ============================================================

  protected readonly selectedPostType =
    computed(() =>
      this.store.selectedPostType()
    );


  protected readonly selectedPostTypeLabel =
    computed(() => {

      const type =
        this.selectedPostType();

      if (!type) {
        return 'Community';
      }

      return this.getPostTypeLabel(type);
    });


  protected readonly selectedPostTypeDescription =
    computed(() => {

      switch (this.selectedPostType()) {

        case 'discussion':
          return 'Share ideas, experiences, opinions, and conversations with the Zebron community.';

        case 'question':
          return 'Ask questions and get helpful answers from other Zebron members.';

        case 'announcement':
          return 'Important announcements and official information from Zebron.';

        case 'news':
          return 'News, updates, and information relevant to the Zebron community.';

        case 'event':
          return 'Discover upcoming events and community activities.';

        case 'opportunity':
          return 'Explore jobs, programs, resources, and other opportunities.';

        case 'notice':
          return 'Community notices and important information for members.';

        default:
          return 'Connect, learn, share, and discover what is happening across the Zebron community.';

      }

    });


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    /*
     * Read URL filters.
     *
     * This fixes the previous behavior where links such as:
     *
     * /community?type=discussion
     *
     * changed the URL but did not reliably update the
     * CommunityStore.
     */

    this.route.queryParamMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(params => {

        const type =
          this.parsePostType(
            params.get('type'),
          );

        this.store.setPostType(type);

        this.store.setSearchTerm(
          params.get('search') ?? '',
        );

      });


    /*
     * Load the Community data once.
     */
    void this.store.loadCommunity();

  }


  // ============================================================
  // RELOAD
  // ============================================================

  protected reload(): void {
    void this.store.loadCommunity();
  }


  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  protected clearFilters(): void {
    this.store.clearFilters();
  }


  // ============================================================
  // POST TYPE
  // ============================================================

  private parsePostType(
    value: string | null,
  ): CommunityPostType | null {

    switch (value) {

      case 'discussion':
      case 'question':
      case 'announcement':
      case 'news':
      case 'event':
      case 'opportunity':
      case 'notice':
        return value;

      default:
        return null;
    }
  }


  private getPostTypeLabel(
    type: CommunityPostType,
  ): string {

    switch (type) {

      case 'discussion':
        return 'Discussions';

      case 'question':
        return 'Questions';

      case 'announcement':
        return 'Announcements';

      case 'news':
        return 'News';

      case 'event':
        return 'Events';

      case 'opportunity':
        return 'Opportunities';

      case 'notice':
        return 'Notices';

      default:
        return 'Community';
    }
  }
}