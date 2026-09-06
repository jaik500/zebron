import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  RouterLink,
} from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CommunityStore } from '../../store/community.store';

import { CommunityPost } from '../../../../core/models/community/community-post.model';

import { AuthService } from '../../../../core/services/auth.service';

import { CommunityPostCardComponent } from '../../components/community-post-card/community-post-card.component';


@Component({
  selector: 'app-my-posts',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,

    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,

    CommunityPostCardComponent,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <main class="page">

      <div class="container">

        <!-- ====================================================
             HEADER
             ==================================================== -->

        <header class="page-header">

          <div>

            <a
              mat-button
              routerLink="/community"
              class="back-link"
            >
              <mat-icon>
                arrow_back
              </mat-icon>

              Back to Community
            </a>

            <div class="eyebrow">
              MY COMMUNITY
            </div>

            <h1>
              My Posts
            </h1>

            <p>
              Manage and review the posts you have shared
              with the Zebron community.
            </p>

          </div>


          <a
            mat-flat-button
            color="primary"
            routerLink="/community/new"
          >
            <mat-icon>
              add
            </mat-icon>

            Create Post
          </a>

        </header>


        <!-- ====================================================
             STATS
             ==================================================== -->

        <section class="stats">

          <mat-card appearance="outlined">

            <mat-card-content>

              <div class="stat-icon">
                <mat-icon>
                  article
                </mat-icon>
              </div>

              <div>
                <strong>
                  {{ posts().length }}
                </strong>

                <span>
                  Total Posts
                </span>
              </div>

            </mat-card-content>

          </mat-card>


          <mat-card appearance="outlined">

            <mat-card-content>

              <div class="stat-icon">
                <mat-icon>
                  visibility
                </mat-icon>
              </div>

              <div>
                <strong>
                  {{ totalViews() }}
                </strong>

                <span>
                  Total Views
                </span>
              </div>

            </mat-card-content>

          </mat-card>


          <mat-card appearance="outlined">

            <mat-card-content>

              <div class="stat-icon">
                <mat-icon>
                  chat_bubble_outline
                </mat-icon>
              </div>

              <div>
                <strong>
                  {{ totalComments() }}
                </strong>

                <span>
                  Comments
                </span>
              </div>

            </mat-card-content>

          </mat-card>


          <mat-card appearance="outlined">

            <mat-card-content>

              <div class="stat-icon">
                <mat-icon>
                  favorite_border
                </mat-icon>
              </div>

              <div>
                <strong>
                  {{ totalLikes() }}
                </strong>

                <span>
                  Likes
                </span>
              </div>

            </mat-card-content>

          </mat-card>

        </section>


        <!-- ====================================================
             LOADING
             ==================================================== -->

        @if (store.loading()) {

          <div class="loading">

            <mat-spinner diameter="42"></mat-spinner>

            <p>
              Loading your posts...
            </p>

          </div>

        } @else if (posts().length > 0) {

          <!-- ==================================================
               POSTS
               ================================================== -->

          <section>

            <div class="section-heading">

              <div>

                <div class="eyebrow">
                  YOUR ACTIVITY
                </div>

                <h2>
                  Your Community Posts
                </h2>

              </div>

              <span class="count">
                {{ posts().length }}
              </span>

            </div>


            <div class="post-grid">

              @for (
                post of posts();
                track post.id
              ) {

                <div class="post-wrapper">

                  <app-community-post-card
                    [post]="post"
                  />


                  <!-- ========================================
                       POST MANAGEMENT
                       ======================================== -->

                  <div class="management">

                    <a
                      mat-button
                      [routerLink]="[
                        '/community/post',
                        post.id
                      ]"
                    >
                      <mat-icon>
                        visibility
                      </mat-icon>

                      View
                    </a>

                    @if (canEdit(post)) {

                      <a
                        mat-button
                        [routerLink]="[
                          '/community/edit',
                          post.id
                        ]"
                      >
                        <mat-icon>
                          edit
                        </mat-icon>

                        Edit
                      </a>

                    }

                  </div>

                </div>

              }

            </div>

          </section>

        } @else {

          <!-- ==================================================
               EMPTY
               ================================================== -->

          <mat-card
            class="empty-card"
            appearance="outlined"
          >

            <mat-icon>
              article
            </mat-icon>

            <h2>
              You haven't created any posts yet
            </h2>

            <p>
              Start a discussion, ask a question, share an
              opportunity, or post useful information.
            </p>

            <a
              mat-flat-button
              color="primary"
              routerLink="/community/new"
            >
              <mat-icon>
                add
              </mat-icon>

              Create Your First Post
            </a>

          </mat-card>

        }

      </div>

    </main>
  `,

  styles: [
    `
      :host {
        display: block;
      }

      .page {
        min-height: 100%;
        background: #f8fafc;
      }

      .container {
        width: min(1180px, 100%);
        margin: 0 auto;

        padding: 24px 20px 60px;
      }


      /* ========================================================
         HEADER
         ======================================================== */

      .page-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;

        gap: 20px;

        margin-bottom: 25px;
      }

      .back-link {
        display: flex;
        width: fit-content;

        margin-bottom: 18px;
      }

      .eyebrow {
        color: #64748b;

        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
      }

      .page-header h1 {
        margin: 5px 0 8px;

        color: #172033;

        font-size: clamp(30px, 5vw, 42px);
        line-height: 1.15;
        font-weight: 800;
      }

      .page-header p {
        max-width: 650px;

        margin: 0;

        color: #64748b;

        font-size: 15px;
        line-height: 1.6;
      }


      /* ========================================================
         STATS
         ======================================================== */

      .stats {
        display: grid;

        grid-template-columns:
          repeat(4, minmax(0, 1fr));

        gap: 12px;

        margin-bottom: 34px;
      }

      .stats mat-card {
        border-radius: 13px;
      }

      .stats mat-card-content {
        display: flex;
        align-items: center;
        gap: 12px;

        padding: 17px;
      }

      .stat-icon {
        width: 38px;
        height: 38px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 10px;

        background: #eef2ff;
        color: #3730a3;
      }

      .stat-icon mat-icon {
        width: 20px;
        height: 20px;

        font-size: 20px;
      }

      .stats strong {
        display: block;

        color: #172033;

        font-size: 21px;
        line-height: 1.1;
      }

      .stats span {
        display: block;

        margin-top: 3px;

        color: #64748b;

        font-size: 12px;
      }


      /* ========================================================
         SECTION
         ======================================================== */

      .section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;

        margin-bottom: 17px;
      }

      .section-heading h2 {
        margin: 5px 0 0;

        color: #172033;

        font-size: 25px;
        font-weight: 750;
      }

      .count {
        min-width: 30px;

        padding: 5px 9px;

        border-radius: 999px;

        background: #e2e8f0;

        color: #334155;

        text-align: center;

        font-size: 12px;
        font-weight: 700;
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

      .post-wrapper {
        min-width: 0;
      }

      .management {
        display: flex;
        align-items: center;
        justify-content: flex-end;

        gap: 4px;

        padding:
          3px
          8px;

        border:
          1px solid #e2e8f0;

        border-top: 0;

        border-radius:
          0
          0
          12px
          12px;

        background: white;
      }

      .management button,
      .management a {
        font-size: 12px;
      }


      /* ========================================================
         LOADING
         ======================================================== */

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;

        padding: 90px 20px;

        color: #64748b;
      }

      .loading p {
        margin-top: 15px;
      }


      /* ========================================================
         EMPTY
         ======================================================== */

      .empty-card {
        display: flex;
        flex-direction: column;
        align-items: center;

        padding: 70px 25px;

        text-align: center;

        border-radius: 16px;
      }

      .empty-card > mat-icon {
        width: 48px;
        height: 48px;

        color: #94a3b8;

        font-size: 48px;
      }

      .empty-card h2 {
        margin: 16px 0 8px;

        color: #172033;

        font-size: 22px;
      }

      .empty-card p {
        max-width: 560px;

        margin: 0 0 22px;

        color: #64748b;

        line-height: 1.6;
      }


      /* ========================================================
         RESPONSIVE
         ======================================================== */

      @media (max-width: 850px) {

        .stats {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .post-grid {
          grid-template-columns: 1fr;
        }

      }

      @media (max-width: 600px) {

        .container {
          padding:
            18px
            14px
            45px;
        }

        .page-header {
          align-items: flex-start;
          flex-direction: column;
        }

        .page-header > a {
          width: 100%;
          justify-content: center;
        }

      }

      @media (max-width: 430px) {

        .stats {
          grid-template-columns: 1fr;
        }

      }
    `,
  ],
})
export class MyPostsComponent
  implements OnInit {

  // ============================================================
  // DEPENDENCIES
  // ============================================================

  protected readonly store =
    inject(CommunityStore);

  private readonly authService =
    inject(AuthService);


  // ============================================================
  // POSTS
  // ============================================================

  protected readonly posts =
    computed(() => {

      return [...this.store.myPosts()]
        .sort((a, b) => {

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
  // STATISTICS
  // ============================================================

  protected readonly totalViews =
    computed(() =>
      this.posts().reduce(
        (total, post) =>
          total + (post.viewCount || 0),
        0,
      ),
    );


  protected readonly totalComments =
    computed(() =>
      this.posts().reduce(
        (total, post) =>
          total + (post.commentCount || 0),
        0,
      ),
    );


  protected readonly totalLikes =
    computed(() =>
      this.posts().reduce(
        (total, post) =>
          total + (post.likeCount || 0),
        0,
      ),
    );


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    /*
     * CommunityStore.loadCommunity() calculates myPosts
     * from the currently authenticated user.
     */
    void this.store.loadCommunity();

  }


  // ============================================================
  // EDIT PERMISSION
  // ============================================================

  protected canEdit(
    post: CommunityPost,
  ): boolean {

    const user =
      this.authService.user();

    if (!user) {
      return false;
    }

    return post.authorId === user.id;
  }

}