import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  CommunityPostDialogComponent,
  CommunityPostDialogData,
  CommunityPostDialogMode,
  CommunityPostDialogResult,
} from '../components/community-post-dialog/community-post-dialog.component';
import { CommunityPost } from '../models/community-post.model';
import { CommunityModerationService } from './community-moderation.service';
import { CommunityPostService } from './community-post.service';

/** What happened to the post, so the caller can update its view. */
export type CommunityPostActionOutcome =
  | { kind: 'updated'; post: CommunityPost }
  | { kind: 'removed' }
  | { kind: 'none' };

/**
 * Post actions shared by the feed card and the post page.
 *
 * - Author: edit, delete.
 * - Anyone who can see the post: report.
 * - Moderators (platform admins; organization managers, admins and
 *   owners in their organization's community): hide, remove.
 *
 * The buttons are only shown to the right people; Firestore rules
 * are the real enforcement.
 */
@Injectable({ providedIn: 'root' })
export class CommunityPostActionsService {
  private readonly dialog = inject(MatDialog);
  private readonly posts = inject(CommunityPostService);
  private readonly moderation = inject(CommunityModerationService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  currentUserId(): string | null {
    return this.auth.firebaseUser()?.uid ?? null;
  }

  isAuthor(post: CommunityPost): boolean {
    const userId = this.currentUserId();
    return !!userId && post.authorId === userId;
  }

  canModerate(): boolean {
    return this.moderation.canModerate();
  }

  async run(mode: CommunityPostDialogMode, post: CommunityPost): Promise<CommunityPostActionOutcome> {
    const userId = this.currentUserId();
    if (!userId) {
      this.notify.warning('Sign in to continue.');
      return { kind: 'none' };
    }

    const result = await firstValueFrom(
      this.dialog
        .open<CommunityPostDialogComponent, CommunityPostDialogData, CommunityPostDialogResult>(CommunityPostDialogComponent, {
          data: { mode, post },
          width: mode === 'edit' ? '640px' : '480px',
          maxWidth: '95vw',
        })
        .afterClosed(),
    );

    if (!result) {
      return { kind: 'none' };
    }

    try {
      switch (result.mode) {
        case 'edit': {
          await this.posts.updatePost(post.id, result);
          this.notify.success('Post updated.');
          const tags = result.tags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
          return { kind: 'updated', post: { ...post, title: result.title.trim(), content: result.content.trim(), tags } };
        }
        case 'delete':
          await this.posts.deleteOwnPost(post.id);
          this.notify.success('Post deleted.');
          return { kind: 'removed' };
        case 'report':
          await this.moderation.report(
            post,
            { id: userId, name: this.auth.user()?.displayName ?? '' },
            result.reason,
            result.details,
          );
          this.notify.success('Thanks. The moderators will review this post.');
          return { kind: 'none' };
        case 'hide':
        case 'remove':
          await this.posts.moderatePost(post.id, result.mode, userId, result.reason);
          this.notify.success(result.mode === 'hide' ? 'Post hidden.' : 'Post removed.');
          return { kind: 'removed' };
      }
    } catch (error) {
      console.error('[Community] Post action failed.', error);
      const code = (error as { code?: string } | null)?.code;

      if (result.mode === 'report' && code === 'permission-denied') {
        this.notify.info('You have already reported this post.');
      } else if (code === 'permission-denied') {
        this.notify.error('You do not have permission to do that.');
      } else {
        this.notify.error('That did not work. Please try again.');
      }
    }

    return { kind: 'none' };
  }
}
