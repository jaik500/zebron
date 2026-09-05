

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// ============================================================
// ANGULAR MATERIAL
// ============================================================

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// ============================================================
// COMMUNITY
// ============================================================

import { CommunityStore } from '../../store/community.store';

import {
  CommunityPostType,
} from '../../../../core/models/community/community-post.model';


// ============================================================
// COMPONENT
// ============================================================

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
    MatTooltipModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `

    <!-- ============================================================
         PAGE
         ============================================================ -->

    <div class="community-page">

      <!-- ==========================================================
           HERO
           ========================================================== -->

      <section class="community-hero">

        <div class="hero-inner">

          <div class="hero-content">

            <div class="eyebrow hero-eyebrow">
              <mat-icon aria-hidden="true">
                groups
              </mat-icon>

              <span>
                Zebron Community
              </span>
            </div>

            <h1>
              Connect. Learn. Share.
            </h1>

            <p>
              Connect with other Zebron members, ask questions,
              share experiences, discover opportunities, and stay
              informed about what's happening in the community.
            </p>

          </div>

          <div class="hero-actions">

            <a
              mat-flat-button
              class="hero-primary-button"
              routerLink="/community/new"
              [queryParams]="{ type: 'question' }"
            >
              <mat-icon>
                help_outline
              </mat-icon>

              Ask a Question
            </a>

            <a
              mat-stroked-button
              class="hero-secondary-button"
              routerLink="/community/new"
              [queryParams]="{ type: 'discussion' }"
            >
              <mat-icon>
                add_comment
              </mat-icon>

              Start a Discussion
            </a>

          </div>

        </div>

      </section>


      <!-- ==========================================================
           MAIN
           ========================================================== -->

      <main class="community-content">

        <!-- ========================================================
             LOADING
             ======================================================== -->

        @if (store.loading()) {

          <div class="loading-container">

            <mat-spinner
              diameter="42"
              strokeWidth="4"
              aria-label="Loading community"
            />

            <p>
              Loading community activity...
            </p>

          </div>

        }

        <!-- ========================================================
             ERROR
             ======================================================== -->

        @else if (store.error()) {

          <mat-card
            class="error-card"
            appearance="outlined"
          >

            <div class="status-icon error-icon">
              <mat-icon>
                error_outline
              </mat-icon>
            </div>

            <h2>
              We couldn't load the community
            </h2>

            <p>
              {{ store.error() }}
            </p>

            <button
              mat-flat-button
              color="primary"
              type="button"
              (click)="reload()"
            >
              <mat-icon>
                refresh
              </mat-icon>

              Try Again
            </button>

          </mat-card>

        }

        <!-- ========================================================
             COMMUNITY CONTENT
             ======================================================== -->

        @else {

          <!-- ======================================================
               QUICK NAVIGATION
               ====================================================== -->

          <section class="quick-navigation">

            <a
              mat-card
              class="quick-nav-card active"
              routerLink="/community"
            >
              <div class="quick-nav-icon">
                <mat-icon>
                  home
                </mat-icon>
              </div>

              <div class="quick-nav-content">
                <strong>Community Home</strong>
                <span>Latest community activity</span>
              </div>
            </a>


            <a
              mat-card
              class="quick-nav-card"
              routerLink="/community"
              [queryParams]="{ type: 'discussion' }"
            >
              <div class="quick-nav-icon">
                <mat-icon>
                  forum
                </mat-icon>
              </div>

              <div class="quick-nav-content">
                <strong>Discussions</strong>
                <span>Share ideas and experiences</span>
              </div>
            </a>


            <a
              mat-card
              class="quick-nav-card"
              routerLink="/community"
              [queryParams]="{ type: 'question' }"
            >
              <div class="quick-nav-icon">
                <mat-icon>
                  help
                </mat-icon>
              </div>

              <div class="quick-nav-content">
                <strong>Questions</strong>
                <span>Ask the community</span>
              </div>
            </a>


            <a
              mat-card
              class="quick-nav-card"
              routerLink="/community"
              [queryParams]="{ type: 'news' }"
            >
              <div class="quick-nav-icon">
                <mat-icon>
                  newspaper
                </mat-icon>
              </div>

              <div class="quick-nav-content">
                <strong>News</strong>
                <span>Community news and updates</span>
              </div>
            </a>


            <a
              mat-card
              class="quick-nav-card"
              routerLink="/community"
              [queryParams]="{ type: 'event' }"
            >
              <div class="quick-nav-icon">
                <mat-icon>
                  event
                </mat-icon>
              </div>

              <div class="quick-nav-content">
                <strong>Events</strong>
                <span>Upcoming events</span>
              </div>
            </a>


            <a
              mat-card
              class="quick-nav-card"
              routerLink="/community"
              [queryParams]="{ type: 'opportunity' }"
            >
              <div class="quick-nav-icon">
                <mat-icon>
                  rocket_launch
                </mat-icon>
              </div>

              <div class="quick-nav-content">
                <strong>Opportunities</strong>
                <span>Jobs, programs and opportunities</span>
              </div>
            </a>

          </section>


          <!-- ======================================================
               CONTENT GRID
               ====================================================== -->

          <div class="content-grid">

            <!-- ====================================================
                 MAIN COLUMN
                 ==================================================== -->

            <div class="main-column">

              <!-- ==================================================
                   OFFICIAL INFORMATION
                   ================================================== -->

              @if (store.officialPosts().length > 0) {

                <section class="content-section">

                  <div class="section-heading">

                    <div>
                      <div class="section-eyebrow important">
                        OFFICIAL INFORMATION
                      </div>

                      <h2>
                        Announcements
                      </h2>

                      <p>
                        Important information and updates from Zebron.
                      </p>
                    </div>

                    <a
                      mat-button
                      color="primary"
                      routerLink="/community"
                      [queryParams]="{ type: 'announcement' }"
                    >
                      View all

                      <mat-icon>
                        arrow_forward
                      </mat-icon>
                    </a>

                  </div>


                  <div class="announcement-list">

                    @for (
                      post of store.officialPosts();
                      track post.id
                    ) {

                      <mat-card
                        class="announcement-card"
                        appearance="outlined"
                      >

                        <a
                          class="card-link"
                          [routerLink]="[
                            '/community/post',
                            post.id
                          ]"
                        >

                          <div class="announcement-icon">
                            <mat-icon>
                              campaign
                            </mat-icon>
                          </div>

                          <div class="post-card-content">

                            <div class="post-meta">

                              <mat-chip-set
                                aria-label="Post type"
                              >
                                <mat-chip>
                                  {{
                                    getPostTypeLabel(
                                      post.postType
                                    )
                                  }}
                                </mat-chip>
                              </mat-chip-set>

                              @if (post.important) {
                                <span class="important-badge">
                                  <mat-icon>
                                    priority_high
                                  </mat-icon>

                                  Important
                                </span>
                              }

                              @if (post.pinned) {
                                <span class="pinned-badge">
                                  <mat-icon>
                                    push_pin
                                  </mat-icon>

                                  Pinned
                                </span>
                              }

                            </div>

                            <h3>
                              {{ post.title }}
                            </h3>

                            <p>
                              {{ truncate(post.content, 180) }}
                            </p>

                            <span class="post-date">
                              <mat-icon>
                                schedule
                              </mat-icon>

                              {{
                                formatDate(
                                  post.publishedAt ||
                                  post.createdAt
                                )
                              }}
                            </span>

                          </div>

                        </a>

                      </mat-card>

                    }

                  </div>

                </section>

              }


              <!-- ==================================================
                   DISCUSSIONS
                   ================================================== -->

              <section class="content-section">

                <div class="section-heading">

                  <div>
                    <div class="section-eyebrow">
                      COMMUNITY
                    </div>

                    <h2>
                      Recent Discussions
                    </h2>

                    <p>
                      See what Zebron members are talking about.
                    </p>
                  </div>

                  <a
                    mat-button
                    color="primary"
                    routerLink="/community"
                    [queryParams]="{ type: 'discussion' }"
                  >
                    View all

                    <mat-icon>
                      arrow_forward
                    </mat-icon>
                  </a>

                </div>


                @if (store.discussionPosts().length > 0) {

                  <div class="post-list">

                    @for (
                      post of store.discussionPosts();
                      track post.id
                    ) {

                      <mat-card
                        class="post-card"
                        appearance="outlined"
                      >

                        <a
                          class="card-link"
                          [routerLink]="[
                            '/community/post',
                            post.id
                          ]"
                        >

                          <div class="avatar">

                            @if (post.authorPhotoUrl) {

                              <img
                                [src]="post.authorPhotoUrl"
                                [alt]="post.authorName"
                              />

                            } @else {

                              <span>
                                {{
                                  getInitials(
                                    post.authorName
                                  )
                                }}
                              </span>

                            }

                          </div>


                          <div class="post-card-content">

                            <div class="post-meta">

                              <mat-chip-set
                                aria-label="Post type"
                              >
                                <mat-chip>
                                  Discussion
                                </mat-chip>
                              </mat-chip-set>

                              @if (post.pinned) {
                                <mat-icon
                                  class="small-pinned-icon"
                                  matTooltip="Pinned post"
                                >
                                  push_pin
                                </mat-icon>
                              }

                            </div>

                            <h3>
                              {{ post.title }}
                            </h3>

                            <p>
                              {{ truncate(post.content, 180) }}
                            </p>

                            <div class="post-footer">

                              <span>
                                {{ post.authorName }}
                              </span>

                              <span>
                                {{ formatDate(post.createdAt) }}
                              </span>

                              <span>
                                <mat-icon>
                                  chat_bubble_outline
                                </mat-icon>

                                {{ post.commentCount || 0 }}
                              </span>

                              <span>
                                <mat-icon>
                                  favorite_border
                                </mat-icon>

                                {{ post.likeCount || 0 }}
                              </span>

                            </div>

                          </div>

                        </a>

                      </mat-card>

                    }

                  </div>

                } @else {

                  <ng-container
                    *ngTemplateOutlet="
                      emptyState;
                      context: {
                        icon: 'forum',
                        title: 'No discussions yet',
                        text: 'Be the first person to start a conversation with the Zebron community.',
                        buttonText: 'Start a Discussion',
                        type: 'discussion'
                      }
                    "
                  />

                }

              </section>


              <!-- ==================================================
                   QUESTIONS
                   ================================================== -->

              <section class="content-section">

                <div class="section-heading">

                  <div>
                    <div class="section-eyebrow">
                      HELP EACH OTHER
                    </div>

                    <h2>
                      Questions
                    </h2>

                    <p>
                      Questions from members of the Zebron community.
                    </p>
                  </div>

                  <a
                    mat-button
                    color="primary"
                    routerLink="/community"
                    [queryParams]="{ type: 'question' }"
                  >
                    View all

                    <mat-icon>
                      arrow_forward
                    </mat-icon>
                  </a>

                </div>


                @if (store.questionPosts().length > 0) {

                  <div class="question-list">

                    @for (
                      post of store.questionPosts();
                      track post.id
                    ) {

                      <mat-card
                        class="question-card"
                        appearance="outlined"
                      >

                        <a
                          class="card-link"
                          [routerLink]="[
                            '/community/post',
                            post.id
                          ]"
                        >

                          <div class="question-icon">
                            <mat-icon>
                              help
                            </mat-icon>
                          </div>

                          <div class="post-card-content">

                            <h3>
                              {{ post.title }}
                            </h3>

                            <p>
                              {{ truncate(post.content, 150) }}
                            </p>

                            <div class="post-footer">

                              <span>
                                {{ post.authorName }}
                              </span>

                              <span>
                                {{ formatDate(post.createdAt) }}
                              </span>

                              <span>
                                <mat-icon>
                                  forum
                                </mat-icon>

                                {{ post.commentCount || 0 }}
                                answers
                              </span>

                            </div>

                          </div>

                          <mat-icon class="question-arrow">
                            arrow_forward
                          </mat-icon>

                        </a>

                      </mat-card>

                    }

                  </div>

                } @else {

                  <ng-container
                    *ngTemplateOutlet="
                      emptyState;
                      context: {
                        icon: 'help_outline',
                        title: 'No questions yet',
                        text: 'Have a question? Ask the Zebron community.',
                        buttonText: 'Ask a Question',
                        type: 'question'
                      }
                    "
                  />

                }

              </section>

            </div>


            <!-- ====================================================
                 SIDEBAR
                 ==================================================== -->

            <aside class="sidebar">

              <!-- ==================================================
                   WELCOME
                   ================================================== -->

              <mat-card class="sidebar-card welcome-card">

                <div class="welcome-icon">
                  <mat-icon>
                    waving_hand
                  </mat-icon>
                </div>

                <h2>
                  Welcome to Community
                </h2>

                <p>
                  Connect with other Zebron members, exchange
                  knowledge, ask questions, and discover
                  opportunities.
                </p>

                <a
                  mat-flat-button
                  color="primary"
                  class="full-width"
                  routerLink="/community/new"
                >
                  <mat-icon>
                    add
                  </mat-icon>

                  Create a Post
                </a>

              </mat-card>


              <!-- ==================================================
                   GUIDELINES
                   ================================================== -->

              <mat-card class="sidebar-card">

                <div class="sidebar-heading">

                  <mat-icon>
                    shield
                  </mat-icon>

                  <h3>
                    Community Guidelines
                  </h3>

                </div>

                <mat-divider />

                <ul class="guidelines">

                  <li>
                    <mat-icon>check_circle</mat-icon>
                    <span>Be respectful and helpful.</span>
                  </li>

                  <li>
                    <mat-icon>check_circle</mat-icon>
                    <span>Share accurate information.</span>
                  </li>

                  <li>
                    <mat-icon>check_circle</mat-icon>
                    <span>Protect personal information.</span>
                  </li>

                  <li>
                    <mat-icon>check_circle</mat-icon>
                    <span>Keep discussions constructive.</span>
                  </li>

                  <li>
                    <mat-icon>check_circle</mat-icon>
                    <span>Report inappropriate content.</span>
                  </li>

                </ul>

              </mat-card>


              <!-- ==================================================
                   ACTIVITY
                   ================================================== -->

              <mat-card class="sidebar-card">

                <div class="sidebar-heading">

                  <mat-icon>
                    insights
                  </mat-icon>

                  <h3>
                    Community Activity
                  </h3>

                </div>

                <mat-divider />

                <div class="activity-grid">

                  <div class="activity-stat">
                    <strong>
                      {{ store.posts().length }}
                    </strong>

                    <span>
                      Recent Posts
                    </span>
                  </div>

                  <div class="activity-stat">
                    <strong>
                      {{ store.discussionPosts().length }}
                    </strong>

                    <span>
                      Discussions
                    </span>
                  </div>

                  <div class="activity-stat">
                    <strong>
                      {{ store.questionPosts().length }}
                    </strong>

                    <span>
                      Questions
                    </span>
                  </div>

                </div>

              </mat-card>


              <!-- ==================================================
                   EXPLORE
                   ================================================== -->

              <mat-card class="sidebar-card">

                <div class="sidebar-heading">

                  <mat-icon>
                    explore
                  </mat-icon>

                  <h3>
                    Explore Community
                  </h3>

                </div>

                <mat-divider />

                <nav class="explore-links">

                  <a
                    routerLink="/community"
                    [queryParams]="{ type: 'news' }"
                  >
                    <mat-icon>newspaper</mat-icon>
                    <span>News</span>
                    <mat-icon class="link-arrow">
                      arrow_forward
                    </mat-icon>
                  </a>

                  <a
                    routerLink="/community"
                    [queryParams]="{ type: 'announcement' }"
                  >
                    <mat-icon>campaign</mat-icon>
                    <span>Announcements</span>
                    <mat-icon class="link-arrow">
                      arrow_forward
                    </mat-icon>
                  </a>

                  <a
                    routerLink="/community"
                    [queryParams]="{ type: 'event' }"
                  >
                    <mat-icon>event</mat-icon>
                    <span>Events</span>
                    <mat-icon class="link-arrow">
                      arrow_forward
                    </mat-icon>
                  </a>

                  <a
                    routerLink="/community"
                    [queryParams]="{ type: 'opportunity' }"
                  >
                    <mat-icon>rocket_launch</mat-icon>
                    <span>Opportunities</span>
                    <mat-icon class="link-arrow">
                      arrow_forward
                    </mat-icon>
                  </a>

                  <a
                    routerLink="/community"
                    [queryParams]="{ type: 'notice' }"
                  >
                    <mat-icon>info</mat-icon>
                    <span>Notices</span>
                    <mat-icon class="link-arrow">
                      arrow_forward
                    </mat-icon>
                  </a>

                </nav>

              </mat-card>


              <!-- ==================================================
                   MY COMMUNITY
                   ================================================== -->

              @if (store.currentUser()) {

                <mat-card
                  class="sidebar-card my-community-card"
                >

                  <div class="sidebar-heading">

                    <mat-icon>
                      person
                    </mat-icon>

                    <h3>
                      My Community
                    </h3>

                  </div>

                  <p>
                    Manage your posts and community activity.
                  </p>

                  <a
                    mat-stroked-button
                    class="full-width"
                    routerLink="/community/my-posts"
                  >
                    <mat-icon>
                      article
                    </mat-icon>

                    My Posts
                  </a>

                </mat-card>

              }

            </aside>

          </div>

        }

      </main>

    </div>


    <!-- ============================================================
         REUSABLE EMPTY STATE
         ============================================================ -->

    <ng-template
      #emptyState
      let-icon="icon"
      let-title="title"
      let-text="text"
      let-buttonText="buttonText"
      let-type="type"
    >

      <mat-card
        class="empty-card"
        appearance="outlined"
      >

        <div class="status-icon empty-icon">
          <mat-icon>
            {{ icon }}
          </mat-icon>
        </div>

        <h3>
          {{ title }}
        </h3>

        <p>
          {{ text }}
        </p>

        <a
          mat-flat-button
          color="primary"
          routerLink="/community/new"
          [queryParams]="{ type: type }"
        >
          <mat-icon>
            {{ type === 'question' ? 'help' : 'add_comment' }}
          </mat-icon>

          {{ buttonText }}
        </a>

      </mat-card>

    </ng-template>
  `,

  // ============================================================
  // OPTIMIZED COMPONENT STYLES
  // ============================================================
  //
  // The original component contained a very large amount of
  // repetitive CSS. This version consolidates shared selectors
  // while retaining the same overall visual hierarchy.
  //
  // ============================================================

  styles: [`

    :host {
      display: block;
      min-height: 100%;
    }

    .community-page {
      min-height: 100vh;
      background: #f8fafc;
      color: #172033;
    }

    /* ==========================================================
       HERO
       ========================================================== */

    .community-hero {
      padding: 48px 24px;
      color: white;
      background: linear-gradient(
        135deg,
        #0f172a,
        #172554 50%,
        #1e3a8a
      );
    }

    .hero-inner {
      max-width: 1280px;
      margin: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 40px;
    }

    .hero-content {
      max-width: 720px;
    }

    .eyebrow {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .1em;
      text-transform: uppercase;
    }

    .hero-eyebrow {
      margin-bottom: 12px;
      opacity: .88;
    }

    .hero-eyebrow mat-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
    }

    .hero-content h1 {
      margin: 0 0 14px;
      font-size: clamp(34px, 5vw, 54px);
      line-height: 1.05;
      font-weight: 800;
      letter-spacing: -.035em;
    }

    .hero-content p {
      max-width: 680px;
      margin: 0;
      color: rgba(255,255,255,.82);
      font-size: 17px;
      line-height: 1.7;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      flex-shrink: 0;
    }

    .hero-primary-button,
    .hero-secondary-button {
      min-height: 44px;
    }

    .hero-primary-button {
      background: white !important;
      color: #1d4ed8 !important;
    }

    .hero-secondary-button {
      color: white !important;
      border-color: rgba(255,255,255,.35) !important;
    }

    /* ==========================================================
       MAIN
       ========================================================== */

    .community-content {
      max-width: 1280px;
      margin: auto;
      padding: 32px 24px 64px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: minmax(0,1fr) 320px;
      gap: 28px;
      align-items: start;
    }

    .main-column {
      min-width: 0;
    }

    /* ==========================================================
       QUICK NAVIGATION
       ========================================================== */

    .quick-navigation {
      display: grid;
      grid-template-columns: repeat(3,minmax(0,1fr));
      gap: 12px;
      margin-bottom: 32px;
    }

    .quick-nav-card {
      display: flex;
      align-items: center;
      gap: 13px;
      padding: 16px;
      color: #172033;
      text-decoration: none;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      transition: .15s ease;
    }

    .quick-nav-card:hover {
      transform: translateY(-1px);
      border-color: #bfdbfe;
      box-shadow: 0 6px 18px rgba(15,23,42,.07);
    }

    .quick-nav-card.active {
      background: #eff6ff;
      border-color: #93c5fd;
    }

    .quick-nav-icon,
    .question-icon,
    .announcement-icon {
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border-radius: 10px;
    }

    .quick-nav-icon {
      background: #f1f5f9;
      color: #2563eb;
    }

    .quick-nav-content {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .quick-nav-content strong {
      font-size: 14px;
      font-weight: 750;
    }

    .quick-nav-content span {
      color: #64748b;
      font-size: 12px;
      line-height: 1.4;
    }

    /* ==========================================================
       SECTIONS
       ========================================================== */

    .content-section {
      margin-bottom: 36px;
    }

    .section-heading {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 16px;
    }

    .section-eyebrow {
      margin-bottom: 5px;
      color: #2563eb;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .1em;
    }

    .section-eyebrow.important {
      color: #dc2626;
    }

    .section-heading h2 {
      margin: 0;
      color: #172033;
      font-size: 24px;
      line-height: 1.2;
      font-weight: 800;
    }

    .section-heading p {
      margin: 5px 0 0;
      color: #64748b;
      font-size: 14px;
    }

    /* ==========================================================
       CARDS
       ========================================================== */

    .announcement-list,
    .post-list,
    .question-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .announcement-card {
      border-left: 4px solid #dc2626;
      border-color: #fecaca;
    }

    .post-card,
    .question-card {
      transition: .15s ease;
    }

    .post-card:hover,
    .question-card:hover {
      transform: translateY(-1px);
      border-color: #cbd5e1;
      box-shadow: 0 7px 20px rgba(15,23,42,.06);
    }

    .card-link {
      display: flex;
      width: 100%;
      gap: 16px;
      box-sizing: border-box;
      padding: 18px;
      color: inherit;
      text-decoration: none;
    }

    .post-card-content {
      min-width: 0;
      flex: 1;
    }

    .post-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 7px;
    }

    mat-chip-set {
      display: inline-flex;
    }

    mat-chip {
      min-height: 25px !important;
      font-size: 10px !important;
      font-weight: 750 !important;
      --mdc-chip-label-text-color: #1d4ed8;
      --mdc-chip-elevated-container-color: #eff6ff;
      --mdc-chip-outline-color: transparent;
    }

    .announcement-card h3,
    .post-card h3,
    .question-card h3 {
      margin: 8px 0 6px;
      color: #172033;
      font-size: 16px;
      line-height: 1.4;
      font-weight: 750;
    }

    .announcement-card p,
    .post-card p,
    .question-card p {
      margin: 0;
      color: #64748b;
      font-size: 13px;
      line-height: 1.55;
    }

    /* ==========================================================
       POST META / FOOTER
       ========================================================== */

    .important-badge,
    .pinned-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-weight: 750;
    }

    .important-badge {
      color: #c2410c;
    }

    .pinned-badge,
    .small-pinned-icon {
      color: #92400e;
    }

    .important-badge mat-icon,
    .pinned-badge mat-icon {
      width: 14px;
      height: 14px;
      font-size: 14px;
    }

    .small-pinned-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }

    .post-date,
    .post-footer span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .post-date {
      margin-top: 9px;
      color: #94a3b8;
      font-size: 11px;
    }

    .post-date mat-icon,
    .post-footer mat-icon {
      width: 14px;
      height: 14px;
      font-size: 14px;
    }

    .post-footer {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 13px;
      margin-top: 11px;
      color: #94a3b8;
      font-size: 11px;
    }

    /* ==========================================================
       AVATAR
       ========================================================== */

    .avatar {
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      background: #dbeafe;
      border-radius: 50%;
      color: #1d4ed8;
      font-size: 13px;
      font-weight: 800;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* ==========================================================
       QUESTIONS
       ========================================================== */

    .question-icon {
      background: #eff6ff;
      color: #2563eb;
    }

    .question-content h3 {
      margin: 0 0 5px;
    }

    .question-arrow {
      flex-shrink: 0;
      color: #94a3b8;
    }

    /* ==========================================================
       SIDEBAR
       ========================================================== */

    .sidebar {
      position: sticky;
      top: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sidebar-card {
      padding: 20px;
      border-radius: 14px;
    }

    .welcome-card {
      background: linear-gradient(
        145deg,
        #eff6ff,
        #fff
      );
      border-color: #bfdbfe;
    }

    .welcome-icon,
    .status-icon {
      width: 46px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
    }

    .welcome-icon {
      margin-bottom: 12px;
      background: white;
      color: #2563eb;
      box-shadow: 0 3px 10px rgba(15,23,42,.05);
    }

    .welcome-card h2 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 800;
    }

    .welcome-card p,
    .my-community-card p {
      margin: 0 0 17px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.6;
    }

    .full-width {
      width: 100%;
    }

    .sidebar-heading {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-bottom: 15px;
    }

    .sidebar-heading mat-icon {
      color: #2563eb;
    }

    .sidebar-heading h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
    }

    .sidebar-card mat-divider {
      margin-bottom: 14px;
    }

    /* ==========================================================
       GUIDELINES
       ========================================================== */

    .guidelines {
      display: flex;
      flex-direction: column;
      gap: 11px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .guidelines li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
    }

    .guidelines li mat-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: #16a34a;
      font-size: 16px;
    }

    /* ==========================================================
       ACTIVITY
       ========================================================== */

    .activity-grid {
      display: grid;
      grid-template-columns: repeat(3,minmax(0,1fr));
      gap: 7px;
    }

    .activity-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 11px 5px;
      background: #f8fafc;
      border-radius: 9px;
      text-align: center;
    }

    .activity-stat strong {
      color: #172033;
      font-size: 19px;
      font-weight: 800;
    }

    .activity-stat span {
      margin-top: 3px;
      color: #64748b;
      font-size: 9px;
      line-height: 1.2;
    }

    /* ==========================================================
       EXPLORE
       ========================================================== */

    .explore-links {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .explore-links a {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 42px;
      padding: 0 7px;
      border-radius: 8px;
      color: #475569;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
    }

    .explore-links a:hover {
      background: #f8fafc;
      color: #2563eb;
    }

    .explore-links a > mat-icon:first-child {
      width: 21px;
      height: 21px;
      font-size: 21px;
    }

    .link-arrow {
      width: 18px;
      height: 18px;
      margin-left: auto;
      color: #94a3b8;
      font-size: 18px;
    }

    /* ==========================================================
       EMPTY / LOADING / ERROR
       ========================================================== */

    .empty-card,
    .error-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .empty-card {
      padding: 38px 24px;
    }

    .empty-icon {
      margin-bottom: 12px;
      background: #f1f5f9;
      color: #64748b;
      border-radius: 50%;
    }

    .empty-card h3 {
      margin: 0 0 6px;
      font-size: 16px;
      font-weight: 800;
    }

    .empty-card p {
      max-width: 460px;
      margin: 0 0 18px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.55;
    }

    .loading-container {
      min-height: 360px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #64748b;
    }

    .loading-container p {
      margin-top: 15px;
      font-size: 13px;
    }

    .error-card {
      min-height: 320px;
      justify-content: center;
      padding: 30px;
    }

    .error-icon {
      margin-bottom: 13px;
      background: #fef2f2;
      color: #dc2626;
      border-radius: 50%;
    }

    .error-card h2 {
      margin: 0 0 7px;
      font-size: 19px;
    }

    .error-card p {
      max-width: 520px;
      margin: 0 0 18px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.5;
    }

    /* ==========================================================
       RESPONSIVE
       ========================================================== */

    @media (max-width: 1050px) {

      .content-grid {
        grid-template-columns: minmax(0,1fr) 285px;
      }

      .quick-navigation {
        grid-template-columns: repeat(2,minmax(0,1fr));
      }

    }

    @media (max-width: 800px) {

      .community-hero {
        padding: 38px 20px;
      }

      .hero-inner {
        flex-direction: column;
        align-items: flex-start;
        gap: 25px;
      }

      .hero-actions {
        width: 100%;
      }

      .hero-actions a {
        flex: 1;
      }

      .community-content {
        padding: 25px 18px 50px;
      }

      .content-grid {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
      }

    }

    @media (max-width: 560px) {

      .community-hero {
        padding: 30px 16px;
      }

      .hero-content h1 {
        font-size: 35px;
      }

      .hero-content p {
        font-size: 15px;
      }

      .hero-actions {
        flex-direction: column;
      }

      .hero-actions a {
        width: 100%;
      }

      .community-content {
        padding: 20px 14px 40px;
      }

      .quick-navigation {
        grid-template-columns: 1fr;
      }

      .section-heading {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .card-link {
        padding: 15px;
      }

      .question-arrow {
        display: none;
      }

      .post-footer {
        gap: 8px;
      }

    }

  `],
})
export class CommunityHomeComponent implements OnInit {

  // ============================================================
  // COMMUNITY STORE
  // ============================================================

  readonly store =
    inject(CommunityStore);


  // ============================================================
  // INITIALIZATION
  // ============================================================

  ngOnInit(): void {

    this.store.loadCommunity();

  }


  // ============================================================
  // RELOAD
  // ============================================================

  reload(): void {

    this.store.loadCommunity();

  }


  // ============================================================
  // POST TYPE LABEL
  // ============================================================

  getPostTypeLabel(
    postType: CommunityPostType,
  ): string {

    switch (postType) {

      case 'discussion':
        return 'Discussion';

      case 'question':
        return 'Question';

      case 'announcement':
        return 'Announcement';

      case 'news':
        return 'News';

      case 'event':
        return 'Event';

      case 'opportunity':
        return 'Opportunity';

      case 'notice':
        return 'Notice';

      default:
        return 'Community';
    }
  }


  // ============================================================
  // INITIALS
  // ============================================================

  getInitials(
    name: string,
  ): string {

    if (!name) {
      return '?';
    }

    const parts =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {

      return parts[0]
        .substring(0, 2)
        .toUpperCase();

    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }


  // ============================================================
  // TRUNCATE
  // ============================================================

  truncate(
    value: string,
    maxLength: number,
  ): string {

    if (!value) {
      return '';
    }

    if (value.length <= maxLength) {
      return value;
    }

    return (
      value.substring(0, maxLength).trim() +
      '...'
    );
  }


  // ============================================================
  // FORMAT DATE
  // ============================================================

  formatDate(
    value: unknown,
  ): string {

    if (!value) {
      return '';
    }

    try {

      // --------------------------------------------------------
      // Firestore Timestamp
      // --------------------------------------------------------

      if (
        typeof value === 'object' &&
        value !== null &&
        'toDate' in value &&
        typeof (
          value as {
            toDate?: unknown;
          }
        ).toDate === 'function'
      ) {

        const date =
          (
            value as {
              toDate: () => Date;
            }
          ).toDate();

        return this.formatDateObject(date);
      }


      // --------------------------------------------------------
      // Native Date
      // --------------------------------------------------------

      if (value instanceof Date) {

        return this.formatDateObject(value);

      }


      // --------------------------------------------------------
      // Fallback
      // --------------------------------------------------------

      const date =
        new Date(
          value as string | number,
        );

      if (!Number.isNaN(date.getTime())) {

        return this.formatDateObject(date);

      }

    } catch (error) {

      console.warn(
        'Unable to format community date:',
        error,
      );

    }

    return '';
  }


  // ============================================================
  // DATE OBJECT
  // ============================================================

  private formatDateObject(
    date: Date,
  ): string {

    return new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    ).format(date);

  }

}

