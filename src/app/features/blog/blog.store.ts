import { computed, inject } from '@angular/core';
import { Timestamp } from 'firebase/firestore';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';

import {
  BlogComment,
  BlogContext,
  BlogPost,
  BlogPostDraft,
  BlogReactionType,
  blogPostId,
  readingMinutes,
  sameBlogContext,
} from './blog.model';
import { BlogService } from './blog.service';

/** What the editor's main button does. */
export type BlogSaveAction = 'draft' | 'submit' | 'publish' | 'schedule';

/** What a reviewer does from Review & manage. */
export type BlogReviewAction = 'approve' | 'request-changes' | 'unpublish';

interface BlogState {
  context: BlogContext | null;

  // Feed
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
  query: string;
  topic: string;

  // Reader
  post: BlogPost | null;
  postLoading: boolean;
  postError: string | null;
  comments: BlogComment[];
  reactionCounts: Record<BlogReactionType, number>;
  myReaction: BlogReactionType | null;

  // Review & manage
  managed: BlogPost[];
  managedLoading: boolean;

  saving: boolean;
}

const initialState: BlogState = {
  context: null,
  posts: [],
  loading: false,
  error: null,
  query: '',
  topic: 'All',
  post: null,
  postLoading: false,
  postError: null,
  comments: [],
  reactionCounts: { helpful: 0, insightful: 0 },
  myReaction: null,
  managed: [],
  managedLoading: false,
  saving: false,
};

const REVIEW_ORDER: Record<BlogPost['status'], number> = {
  in_review: 0,
  changes_requested: 1,
  draft: 2,
  scheduled: 3,
  published: 4,
};

function message(error: unknown, fallback: string): string {
  const code = (error as { code?: string })?.code ?? '';
  return code === 'permission-denied'
    ? 'You do not have permission to do this.'
    : fallback;
}

/**
 * State for every blog page (feed, reader, editor, Review & manage) in
 * all three sections. setContext() is called by each page with the
 * section read from its route; changing section clears the old state.
 */
export const BlogStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed((store) => ({
    topics: computed(() => ['All', ...new Set(store.posts().map((post) => post.topic).filter(Boolean))]),

    filteredPosts: computed(() => {
      const term = store.query().trim().toLowerCase();
      const topic = store.topic();

      return store.posts().filter(
        (post) =>
          (topic === 'All' || post.topic === topic) &&
          (!term ||
            `${post.title} ${post.excerpt} ${post.authorName} ${post.topic}`.toLowerCase().includes(term)),
      );
    }),

    pendingReviewCount: computed(() => store.managed().filter((post) => post.status === 'in_review').length),

    managedSorted: computed(() =>
      [...store.managed()].sort(
        (a, b) =>
          REVIEW_ORDER[a.status] - REVIEW_ORDER[b.status] ||
          (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0),
      ),
    ),

    totalReactions: computed(() =>
      Object.values(store.reactionCounts()).reduce((total, count) => total + count, 0),
    ),
  })),

  withComputed((store) => ({
    /** Pinned post first; otherwise the newest, when not searching. */
    featuredPost: computed(() => {
      if (store.query().trim() || store.topic() !== 'All') {
        return null;
      }

      const posts = store.filteredPosts();
      return posts.find((post) => post.pinned) ?? posts[0] ?? null;
    }),
  })),

  withComputed((store) => ({
    otherPosts: computed(() => store.filteredPosts().filter((post) => post !== store.featuredPost())),

    mostRead: computed(() => store.posts().slice(0, 3)),
  })),

  withMethods(
    (
      store,
      blog = inject(BlogService),
      auth = inject(AuthService),
      logger = inject(LoggerService),
    ) => {
      const context = (): BlogContext => {
        const current = store.context();
        if (!current) {
          throw new Error('The blog section is not set.');
        }
        return current;
      };

      const currentUser = () => {
        const firebaseUser = auth.firebaseUser();
        if (!firebaseUser) {
          throw new Error('Sign in to continue.');
        }

        const profile = auth.user();
        const name =
          profile?.displayName?.trim() ||
          firebaseUser.displayName?.trim() ||
          firebaseUser.email?.split('@')[0] ||
          'Zebron member';

        return { uid: firebaseUser.uid, name };
      };

      const replaceManaged = (postId: string, changes: Partial<BlogPost>) => {
        patchState(store, {
          managed: store.managed().map((post) => (post.id === postId ? { ...post, ...changes } : post)),
        });
      };

      return {
        // ==========================================================
        // CONTEXT AND FILTERS
        // ==========================================================

        setContext(next: BlogContext): void {
          if (sameBlogContext(store.context(), next)) {
            return;
          }

          patchState(store, { ...initialState, context: next });
        },

        setQuery(query: string): void {
          patchState(store, { query });
        },

        setTopic(topic: string): void {
          patchState(store, { topic });
        },

        // ==========================================================
        // FEED
        // ==========================================================

        async loadFeed(): Promise<void> {
          patchState(store, { loading: true, error: null });

          try {
            const posts = await blog.listPublished(context());
            patchState(store, { posts, loading: false });
          } catch (error) {
            logger.error('BlogStore', 'Feed failed to load.', error);
            patchState(store, {
              posts: [],
              loading: false,
              error: message(error, 'The blog could not be loaded. Please try again.'),
            });
          }
        },

        // ==========================================================
        // READER
        // ==========================================================

        async openPost(postId: string): Promise<void> {
          patchState(store, {
            postLoading: true,
            postError: null,
            post: null,
            comments: [],
            reactionCounts: { helpful: 0, insightful: 0 },
            myReaction: null,
          });

          try {
            const ctx = context();
            const post = await blog.getPost(ctx, postId);

            if (!post) {
              patchState(store, { postLoading: false, postError: 'This post was not found or is not available to you.' });
              return;
            }

            patchState(store, { post, postLoading: false });

            if (post.status !== 'published') {
              return;
            }

            const uid = auth.firebaseUser()?.uid ?? null;
            const [comments, reactionCounts, myReaction] = await Promise.all([
              blog.listComments(ctx, postId),
              blog.reactionCounts(ctx, postId),
              uid ? blog.myReaction(ctx, postId, uid) : Promise.resolve(null),
            ]);

            patchState(store, { comments, reactionCounts, myReaction });
          } catch (error) {
            logger.error('BlogStore', 'Post failed to load.', error);
            patchState(store, {
              postLoading: false,
              postError: message(error, 'This post could not be loaded. Please try again.'),
            });
          }
        },

        async addComment(text: string): Promise<boolean> {
          const post = store.post();
          const trimmed = text.trim();

          if (!post || !trimmed) {
            return false;
          }

          try {
            const user = currentUser();
            const comment = { authorId: user.uid, authorName: user.name, text: trimmed.slice(0, 2000) };
            const id = await blog.addComment(context(), post.id, comment);

            patchState(store, {
              comments: [...store.comments(), { id, ...comment, createdAt: Timestamp.now() }],
            });
            return true;
          } catch (error) {
            logger.error('BlogStore', 'Comment failed.', error);
            return false;
          }
        },

        async deleteComment(commentId: string): Promise<void> {
          const post = store.post();
          if (!post) {
            return;
          }

          await blog.deleteComment(context(), post.id, commentId);
          patchState(store, { comments: store.comments().filter((comment) => comment.id !== commentId) });
        },

        /** Choose a reaction; choosing the same one again removes it. */
        async react(type: BlogReactionType): Promise<void> {
          const post = store.post();
          if (!post) {
            return;
          }

          const user = currentUser();
          const previous = store.myReaction();
          const next = previous === type ? null : type;
          const counts = { ...store.reactionCounts() };

          if (previous) {
            counts[previous] = Math.max(0, counts[previous] - 1);
          }
          if (next) {
            counts[next] += 1;
          }

          patchState(store, { myReaction: next, reactionCounts: counts });

          try {
            await blog.setReaction(context(), post.id, user.uid, next);
          } catch (error) {
            logger.error('BlogStore', 'Reaction failed.', error);
            patchState(store, { myReaction: previous, reactionCounts: await blog.reactionCounts(context(), post.id) });
          }
        },

        // ==========================================================
        // EDITOR
        // ==========================================================

        /**
         * Save a post. Returns its ID, or null when saving failed.
         * - draft: keep working on it
         * - submit: send it to a reviewer
         * - publish: go live now (reviewers only)
         * - schedule: go live at publishAt (reviewers only)
         */
        async savePost(
          postId: string | null,
          draft: BlogPostDraft,
          action: BlogSaveAction,
          publishAt: Date | null = null,
        ): Promise<string | null> {
          patchState(store, { saving: true, error: null });

          try {
            const ctx = context();
            const status: BlogPost['status'] =
              action === 'publish'
                ? 'published'
                : action === 'schedule'
                  ? 'scheduled'
                  : action === 'submit'
                    ? 'in_review'
                    : 'draft';

            const payload: Record<string, unknown> = {
              title: draft.title.trim(),
              excerpt: draft.excerpt.trim(),
              content: draft.content,
              topic: draft.topic,
              cover: draft.cover,
              pinned: draft.pinned,
              readingMinutes: readingMinutes(draft.content),
              status,
              reviewNote: null,
              publishAt: action === 'schedule' && publishAt ? Timestamp.fromDate(publishAt) : null,
            };

            if (action === 'publish') {
              payload['publishedAt'] = Timestamp.now();
            }

            if (postId) {
              await blog.updatePost(ctx, postId, payload);
              return postId;
            }

            const user = currentUser();
            const id = blogPostId(draft.title);

            await blog.createPost(ctx, id, {
              ...payload,
              authorId: user.uid,
              authorName: user.name,
              publishedAt: payload['publishedAt'] ?? null,
            });

            return id;
          } catch (error) {
            logger.error('BlogStore', 'Post failed to save.', error);
            patchState(store, { error: message(error, 'The post could not be saved. Please try again.') });
            return null;
          } finally {
            patchState(store, { saving: false });
          }
        },

        /** Load a post for editing, whatever its status. */
        async loadForEdit(postId: string): Promise<BlogPost | null> {
          try {
            return await blog.getPost(context(), postId);
          } catch (error) {
            logger.error('BlogStore', 'Post failed to load for editing.', error);
            return null;
          }
        },

        // ==========================================================
        // REVIEW & MANAGE
        // ==========================================================

        async loadManaged(): Promise<void> {
          patchState(store, { managedLoading: true, error: null });

          try {
            const managed = await blog.listAll(context());
            patchState(store, { managed, managedLoading: false });
          } catch (error) {
            logger.error('BlogStore', 'Review list failed to load.', error);
            patchState(store, {
              managed: [],
              managedLoading: false,
              error: message(error, 'Posts could not be loaded. Please try again.'),
            });
          }
        },

        async review(postId: string, action: BlogReviewAction, note = ''): Promise<boolean> {
          const post = store.managed().find((item) => item.id === postId);
          if (!post) {
            return false;
          }

          const scheduled = post.publishAt && post.publishAt.toMillis() > Date.now();
          const changes: Record<string, unknown> =
            action === 'approve'
              ? scheduled
                ? { status: 'scheduled', reviewNote: null }
                : { status: 'published', publishedAt: Timestamp.now(), reviewNote: null }
              : action === 'request-changes'
                ? { status: 'changes_requested', reviewNote: note.trim() || null }
                : { status: 'draft' };

          try {
            await blog.updatePost(context(), postId, changes);
            replaceManaged(postId, { ...(changes as Partial<BlogPost>), updatedAt: Timestamp.now() });
            return true;
          } catch (error) {
            logger.error('BlogStore', 'Review action failed.', error);
            return false;
          }
        },

        async togglePin(postId: string): Promise<void> {
          const post = store.managed().find((item) => item.id === postId);
          if (!post) {
            return;
          }

          await blog.updatePost(context(), postId, { pinned: !post.pinned });
          replaceManaged(postId, { pinned: !post.pinned });
        },

        async deletePost(postId: string): Promise<boolean> {
          try {
            await blog.deletePost(context(), postId);
            patchState(store, {
              managed: store.managed().filter((post) => post.id !== postId),
              posts: store.posts().filter((post) => post.id !== postId),
            });
            return true;
          } catch (error) {
            logger.error('BlogStore', 'Delete failed.', error);
            return false;
          }
        },
      };
    },
  ),
);
