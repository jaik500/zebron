import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CommunityPost } from '../../../../core/models/community/community-post.model';

@Component({
  selector: 'app-community-post-card',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,

    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <mat-card
      class="post-card"
      appearance="outlined"
    >
      <a
        class="post-link"
        [routerLink]="['/community/post', post().id]"
        [attr.aria-label]="'Open post: ' + post().title"
      >

        <!-- ======================================================
             AUTHOR
             ====================================================== -->

        <div class="avatar">
          @if (post().authorPhotoUrl) {
            <img
              [src]="post().authorPhotoUrl"
              [alt]="post().authorName"
            />
          } @else {
            <span>
              {{ getInitials(post().authorName) }}
            </span>
          }
        </div>


        <!-- ======================================================
             CONTENT
             ====================================================== -->

        <div class="post-content">

          <!-- --------------------------------------------------
               META
               -------------------------------------------------- -->

          <div class="post-meta">

            <mat-chip-set aria-label="Post type">
              <mat-chip>
                {{ getPostTypeLabel(post().postType) }}
              </mat-chip>
            </mat-chip-set>


            @if (post().pinned) {
              <mat-icon
                class="meta-icon"
                matTooltip="Pinned post"
                aria-label="Pinned post"
              >
                push_pin
              </mat-icon>
            }


            @if (post().featured) {
              <mat-icon
                class="meta-icon"
                matTooltip="Featured post"
                aria-label="Featured post"
              >
                star
              </mat-icon>
            }


            @if (post().important) {
              <mat-icon
                class="meta-icon important-icon"
                matTooltip="Important post"
                aria-label="Important post"
              >
                priority_high
              </mat-icon>
            }

          </div>


          <!-- --------------------------------------------------
               TITLE
               -------------------------------------------------- -->

          <h3>
            {{ post().title }}
          </h3>


          <!-- --------------------------------------------------
               CONTENT PREVIEW
               -------------------------------------------------- -->

          <p class="post-preview">
            {{ truncate(post().content, 220) }}
          </p>


          <!-- --------------------------------------------------
               TAGS
               -------------------------------------------------- -->

          @if (post().tags.length) {
            <div class="tags">

              @for (
                tag of post().tags.slice(0, 4);
                track tag
              ) {
                <span class="tag">
                  #{{ tag }}
                </span>
              }

            </div>
          }


          <!-- --------------------------------------------------
               FOOTER
               -------------------------------------------------- -->

          <div class="post-footer">

            <span>
              {{ post().authorName }}
            </span>

            <span>
              {{ formatDate(post().publishedAt ?? post().createdAt) }}
            </span>

            <span>
              <mat-icon>
                visibility
              </mat-icon>

              {{ post().viewCount || 0 }}
            </span>

            <span>
              <mat-icon>
                chat_bubble_outline
              </mat-icon>

              {{ post().commentCount || 0 }}
            </span>

            <span>
              <mat-icon>
                favorite_border
              </mat-icon>

              {{ post().likeCount || 0 }}
            </span>

          </div>

        </div>


        <!-- ======================================================
             ARROW
             ====================================================== -->

        <mat-icon class="post-arrow">
          arrow_forward
        </mat-icon>

      </a>
    </mat-card>
  `,

  styles: [
    `
      :host {
        display: block;
      }

      .post-card {
        height: 100%;
        border-radius: 14px;
        overflow: hidden;
        transition:
          transform 160ms ease,
          box-shadow 160ms ease,
          border-color 160ms ease;
      }

      .post-card:hover {
        transform: translateY(-2px);
        box-shadow:
          0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .post-link {
        position: relative;

        display: grid;
        grid-template-columns: 46px minmax(0, 1fr) 24px;

        gap: 14px;

        min-height: 180px;

        padding: 18px;

        color: inherit;
        text-decoration: none;
      }

      /* ========================================================
         AVATAR
         ======================================================== */

      .avatar {
        width: 46px;
        height: 46px;

        flex-shrink: 0;

        display: flex;
        align-items: center;
        justify-content: center;

        overflow: hidden;

        border-radius: 50%;

        background:
          linear-gradient(
            135deg,
            #e8eefc,
            #d9e2f7
          );

        color: #334155;

        font-size: 15px;
        font-weight: 700;
      }

      .avatar img {
        width: 100%;
        height: 100%;

        object-fit: cover;
      }


      /* ========================================================
         CONTENT
         ======================================================== */

      .post-content {
        min-width: 0;
      }


      /* ========================================================
         META
         ======================================================== */

      .post-meta {
        display: flex;
        align-items: center;
        gap: 6px;

        min-height: 30px;

        margin-bottom: 8px;
      }

      .post-meta mat-chip {
        font-size: 12px;
      }

      .meta-icon {
        width: 18px;
        height: 18px;

        font-size: 18px;
      }

      .important-icon {
        color: #b42318;
      }


      /* ========================================================
         TITLE
         ======================================================== */

      h3 {
        margin: 0;

        color: #172033;

        font-size: 18px;
        line-height: 1.35;
        font-weight: 700;
      }


      /* ========================================================
         PREVIEW
         ======================================================== */

      .post-preview {
        margin: 8px 0 12px;

        color: #64748b;

        font-size: 14px;
        line-height: 1.55;
      }


      /* ========================================================
         TAGS
         ======================================================== */

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        margin-bottom: 12px;
      }

      .tag {
        padding: 3px 8px;

        border-radius: 999px;

        background: #f1f5f9;

        color: #475569;

        font-size: 11px;
        line-height: 1.4;
      }


      /* ========================================================
         FOOTER
         ======================================================== */

      .post-footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;

        gap: 12px;

        color: #64748b;

        font-size: 12px;
      }

      .post-footer span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .post-footer mat-icon {
        width: 16px;
        height: 16px;

        font-size: 16px;
      }


      /* ========================================================
         ARROW
         ======================================================== */

      .post-arrow {
        align-self: center;

        color: #94a3b8;

        transition:
          transform 160ms ease,
          color 160ms ease;
      }

      .post-link:hover .post-arrow {
        color: #334155;
        transform: translateX(3px);
      }


      /* ========================================================
         RESPONSIVE
         ======================================================== */

      @media (max-width: 600px) {

        .post-link {
          grid-template-columns: 40px minmax(0, 1fr);

          gap: 12px;

          padding: 15px;
        }

        .avatar {
          width: 40px;
          height: 40px;
        }

        .post-arrow {
          display: none;
        }

        h3 {
          font-size: 16px;
        }

        .post-footer {
          gap: 8px;
        }

      }
    `,
  ],
})
export class CommunityPostCardComponent {

  /**
   * Community post supplied by the parent page.
   */
  readonly post = input.required<CommunityPost>();


  // ============================================================
  // POST TYPE
  // ============================================================

  protected getPostTypeLabel(
    type: CommunityPost['postType'],
  ): string {

    switch (type) {

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

  protected getInitials(
    name: string | undefined,
  ): string {

    if (!name?.trim()) {
      return 'Z';
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

  protected truncate(
    value: string | undefined,
    maxLength: number,
  ): string {

    if (!value) {
      return '';
    }

    const text = value.trim();

    if (text.length <= maxLength) {
      return text;
    }

    return `${text.substring(0, maxLength).trim()}…`;
  }


  // ============================================================
  // DATE
  // ============================================================

  protected formatDate(
    timestamp: CommunityPost['createdAt'],
  ): string {

    if (!timestamp) {
      return '';
    }

    try {

      return timestamp
        .toDate()
        .toLocaleDateString(
          'en-US',
          {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          },
        );

    } catch {

      return '';

    }
  }
}