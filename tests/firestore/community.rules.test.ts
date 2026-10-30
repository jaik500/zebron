import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Community permissions:
 * - Public Zebron Community (organizationId null) for every signed-in user.
 * - Private organization communities for active members only.
 * - Authors edit and delete their own posts.
 * - Organization managers+ moderate their community; platform admins all.
 * - Reports, organization topics and direct chat.
 */
describe('Zebron Firestore Security Rules - Community', () => {
  let testEnv: RulesTestEnvironment;

  const ORG = 'org-community';
  const OTHER_ORG = 'org-other';

  const ADMIN = 'platform-admin-uid';
  const MANAGER = 'manager-uid';
  const MEMBER = 'member-uid';
  const OTHER_MEMBER = 'other-member-uid';
  const OUTSIDER = 'outsider-uid';

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'zebron-rules-test',
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await seed();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  // ==========================================================
  // HELPERS
  // ==========================================================

  function db(uid: string) {
    return testEnv.authenticatedContext(uid).firestore();
  }

  function post(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      authorId: MEMBER,
      author: { id: MEMBER, displayName: 'Member' },
      topicId: 'general',
      topicName: 'General',
      title: 'Hello',
      content: 'First post',
      mediaUrls: [],
      tags: [],
      status: 'published',
      moderationStatus: 'approved',
      reactionCounts: { like: 0, love: 0, laugh: 0, celebrate: 0, support: 0, helpful: 0 },
      commentCount: 0,
      viewCount: 0,
      trendingScore: 0,
      organizationId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...overrides,
    };
  }

  async function seed(): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore();

      await setDoc(doc(firestore, `users/${ADMIN}`), { platformRole: 'platform-admin' });

      for (const [id, status] of [[ORG, 'active'], [OTHER_ORG, 'active']]) {
        await setDoc(doc(firestore, `organizations/${id}`), { name: id, status, active: true });
      }

      const memberships: Array<[string, string, string]> = [
        [MANAGER, ORG, 'org_manager'],
        [MEMBER, ORG, 'org_member'],
        [OTHER_MEMBER, ORG, 'org_member'],
        [OUTSIDER, OTHER_ORG, 'org_owner'],
      ];
      for (const [userId, organizationId, role] of memberships) {
        await setDoc(doc(firestore, `organizationMemberships/${userId}_${organizationId}`), {
          userId,
          organizationId,
          role,
          active: true,
        });
      }

      await setDoc(doc(firestore, 'communityPosts/public-post'), post({ authorId: OTHER_MEMBER, author: { id: OTHER_MEMBER, displayName: 'Other' } }));
      // Older public post without the organizationId field.
      const legacy = post();
      delete legacy['organizationId'];
      await setDoc(doc(firestore, 'communityPosts/legacy-post'), legacy);
      await setDoc(doc(firestore, 'communityPosts/org-post'), post({ organizationId: ORG }));
    });
  }

  // ==========================================================
  // POSTS
  // ==========================================================

  describe('creating posts', () => {
    it('lets any signed-in user post to the public Community', async () => {
      await assertSucceeds(setDoc(doc(db(OUTSIDER), 'communityPosts/new'), post({ authorId: OUTSIDER, author: { id: OUTSIDER, displayName: 'O' } })));
    });

    it('lets members post to their organization community', async () => {
      await assertSucceeds(setDoc(doc(db(MEMBER), 'communityPosts/new'), post({ organizationId: ORG })));
    });

    it('denies posting to an organization you do not belong to', async () => {
      await assertFails(setDoc(doc(db(OUTSIDER), 'communityPosts/new'), post({ authorId: OUTSIDER, author: { id: OUTSIDER, displayName: 'O' }, organizationId: ORG })));
    });

    it('denies posting as someone else', async () => {
      await assertFails(setDoc(doc(db(OUTSIDER), 'communityPosts/new'), post()));
    });

    it('denies pre-loaded engagement or moderation', async () => {
      await assertFails(setDoc(doc(db(MEMBER), 'communityPosts/new'), post({ viewCount: 500 })));
      await assertFails(setDoc(doc(db(MEMBER), 'communityPosts/new'), post({ trendingScore: 99 })));
      await assertFails(setDoc(doc(db(MEMBER), 'communityPosts/new'), post({ moderatedBy: MEMBER })));
    });

    it('requires organizationId (null for public posts)', async () => {
      const withoutScope = post();
      delete withoutScope['organizationId'];
      await assertFails(setDoc(doc(db(MEMBER), 'communityPosts/new'), withoutScope));
    });
  });

  describe('reading posts', () => {
    it('lets anyone signed in list the public feed', async () => {
      const feed = query(
        collection(db(OUTSIDER), 'communityPosts'),
        where('organizationId', '==', null),
        where('status', '==', 'published'),
        where('moderationStatus', '==', 'approved'),
      );
      await assertSucceeds(getDocs(feed));
    });

    it('lets members list their organization feed', async () => {
      const feed = query(
        collection(db(MEMBER), 'communityPosts'),
        where('organizationId', '==', ORG),
        where('status', '==', 'published'),
        where('moderationStatus', '==', 'approved'),
      );
      await assertSucceeds(getDocs(feed));
    });

    it('denies outsiders the organization feed and posts', async () => {
      const feed = query(
        collection(db(OUTSIDER), 'communityPosts'),
        where('organizationId', '==', ORG),
        where('status', '==', 'published'),
        where('moderationStatus', '==', 'approved'),
      );
      await assertFails(getDocs(feed));
      await assertFails(getDoc(doc(db(OUTSIDER), 'communityPosts/org-post')));
    });

    it('requires organizationId on every post (run the backfill before deploying)', async () => {
      // Older posts without the field are unreadable until
      // backfillCommunityPostScope sets organizationId: null.
      await assertFails(getDoc(doc(db(OUTSIDER), 'communityPosts/legacy-post')));
    });

    it('reads public posts by ID', async () => {
      await assertSucceeds(getDoc(doc(db(OUTSIDER), 'communityPosts/public-post')));
    });

    it('denies members an unfiltered feed query too', async () => {
      const feed = query(
        collection(db(MEMBER), 'communityPosts'),
        where('status', '==', 'published'),
        where('moderationStatus', '==', 'approved'),
      );
      await assertFails(getDocs(feed));
    });

    it('denies outsiders an unfiltered feed query that would include organization posts', async () => {
      const feed = query(
        collection(db(OUTSIDER), 'communityPosts'),
        where('status', '==', 'published'),
        where('moderationStatus', '==', 'approved'),
      );
      await assertFails(getDocs(feed));
    });
  });

  describe('editing and deleting posts', () => {
    it('lets the author edit the text', async () => {
      await assertSucceeds(updateDoc(doc(db(MEMBER), 'communityPosts/org-post'), {
        title: 'Edited',
        content: 'Edited content',
        editedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
    });

    it('denies editing someone else’s post', async () => {
      await assertFails(updateDoc(doc(db(OTHER_MEMBER), 'communityPosts/org-post'), { title: 'Mine now', updatedAt: serverTimestamp() }));
    });

    it('denies the author changing counters or moderation', async () => {
      await assertFails(updateDoc(doc(db(MEMBER), 'communityPosts/org-post'), { viewCount: 99 }));
      await assertFails(updateDoc(doc(db(MEMBER), 'communityPosts/org-post'), { moderationStatus: 'approved', status: 'published', moderatedBy: MEMBER }));
    });

    it('lets the author delete (soft) their post', async () => {
      await assertSucceeds(updateDoc(doc(db(MEMBER), 'communityPosts/org-post'), {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
    });
  });

  describe('moderation', () => {
    const hide = (uid: string) => ({
      status: 'hidden',
      moderationStatus: 'flagged',
      moderatedBy: uid,
      moderatedAt: serverTimestamp(),
      moderationReason: 'Off topic',
      updatedAt: serverTimestamp(),
    });

    it('lets organization managers hide their organization’s posts', async () => {
      await assertSucceeds(updateDoc(doc(db(MANAGER), 'communityPosts/org-post'), hide(MANAGER)));
    });

    it('denies members moderating', async () => {
      await assertFails(updateDoc(doc(db(OTHER_MEMBER), 'communityPosts/org-post'), hide(OTHER_MEMBER)));
    });

    it('denies organization managers moderating the public Community', async () => {
      await assertFails(updateDoc(doc(db(MANAGER), 'communityPosts/public-post'), hide(MANAGER)));
    });

    it('lets platform admins moderate the public Community', async () => {
      await assertSucceeds(updateDoc(doc(db(ADMIN), 'communityPosts/public-post'), hide(ADMIN)));
    });

    it('lets managers read hidden posts in their organization', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await updateDoc(doc(context.firestore(), 'communityPosts/org-post'), { status: 'hidden' });
      });
      const hidden = query(
        collection(db(MANAGER), 'communityPosts'),
        where('organizationId', '==', ORG),
        where('status', '==', 'hidden'),
      );
      await assertSucceeds(getDocs(hidden));
      await assertFails(getDoc(doc(db(OTHER_MEMBER), 'communityPosts/org-post')));
    });
  });

  // ==========================================================
  // COMMENTS AND REACTIONS
  // ==========================================================

  describe('comments and reactions', () => {
    async function comment(uid: string, postId: string) {
      const firestore = db(uid);
      const batch = writeBatch(firestore);
      const commentRef = doc(collection(firestore, `communityPosts/${postId}/comments`));
      batch.set(commentRef, {
        postId,
        parentCommentId: null,
        authorId: uid,
        author: { id: uid, displayName: 'Someone', photoUrl: null },
        content: 'Nice',
        reactionCounts: {},
        status: 'published',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedAt: null,
      });
      batch.update(doc(firestore, `communityPosts/${postId}`), {
        commentCount: increment(1),
        lastCommentId: commentRef.id,
        updatedAt: serverTimestamp(),
      });
      return batch.commit();
    }

    async function react(uid: string, postId: string) {
      const firestore = db(uid);
      const batch = writeBatch(firestore);
      batch.set(doc(firestore, `communityPosts/${postId}/reactions/${uid}`), {
        id: uid,
        postId,
        userId: uid,
        type: 'like',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(firestore, `communityPosts/${postId}`), {
        'reactionCounts.like': increment(1),
        updatedAt: serverTimestamp(),
      });
      return batch.commit();
    }

    it('lets members comment and react on organization posts', async () => {
      await assertSucceeds(comment(OTHER_MEMBER, 'org-post'));
      await assertSucceeds(react(OTHER_MEMBER, 'org-post'));
    });

    it('denies outsiders commenting or reacting on organization posts', async () => {
      await assertFails(comment(OUTSIDER, 'org-post'));
      await assertFails(react(OUTSIDER, 'org-post'));
    });

    it('lets anyone signed in comment on public posts', async () => {
      await assertSucceeds(comment(OUTSIDER, 'public-post'));
    });

    it('lets managers remove comments in their organization', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'communityPosts/org-post/comments/c1'), {
          postId: 'org-post',
          parentCommentId: null,
          authorId: OTHER_MEMBER,
          author: { id: OTHER_MEMBER },
          content: 'Rude',
          reactionCounts: {},
          status: 'published',
        });
      });
      const remove = { content: '', status: 'deleted', deletedAt: serverTimestamp(), updatedAt: serverTimestamp() };
      await assertFails(updateDoc(doc(db(MEMBER), 'communityPosts/org-post/comments/c1'), remove));
      await assertSucceeds(updateDoc(doc(db(MANAGER), 'communityPosts/org-post/comments/c1'), remove));
    });

    it('denies bookmarking an organization post you cannot see', async () => {
      await assertFails(setDoc(doc(db(OUTSIDER), `users/${OUTSIDER}/communityBookmarks/org-post`), {
        postId: 'org-post',
        userId: OUTSIDER,
        createdAt: serverTimestamp(),
      }));
      await assertSucceeds(setDoc(doc(db(MEMBER), `users/${MEMBER}/communityBookmarks/org-post`), {
        postId: 'org-post',
        userId: MEMBER,
        createdAt: serverTimestamp(),
      }));
    });
  });

  // ==========================================================
  // REPORTS
  // ==========================================================

  describe('reports', () => {
    const report = (uid: string, postId: string, organizationId: string | null) => ({
      postId,
      organizationId,
      reason: 'spam',
      details: '',
      reporterId: uid,
      status: 'open',
      createdAt: serverTimestamp(),
    });

    it('lets a member report an organization post once', async () => {
      await assertSucceeds(setDoc(doc(db(OTHER_MEMBER), `communityReports/${OTHER_MEMBER}_org-post`), report(OTHER_MEMBER, 'org-post', ORG)));
    });

    it('denies a report with the wrong scope or ID', async () => {
      await assertFails(setDoc(doc(db(OTHER_MEMBER), `communityReports/${OTHER_MEMBER}_org-post`), report(OTHER_MEMBER, 'org-post', null)));
      await assertFails(setDoc(doc(db(OTHER_MEMBER), 'communityReports/random-id'), report(OTHER_MEMBER, 'org-post', ORG)));
    });

    it('denies outsiders reporting organization posts', async () => {
      await assertFails(setDoc(doc(db(OUTSIDER), `communityReports/${OUTSIDER}_org-post`), report(OUTSIDER, 'org-post', ORG)));
    });

    it('shows organization reports to managers only', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), `communityReports/${OTHER_MEMBER}_org-post`), {
          postId: 'org-post',
          organizationId: ORG,
          reason: 'spam',
          reporterId: OTHER_MEMBER,
          status: 'open',
        });
      });
      const open = (uid: string) =>
        getDocs(query(collection(db(uid), 'communityReports'), where('organizationId', '==', ORG), where('status', '==', 'open')));
      await assertSucceeds(open(MANAGER));
      await assertFails(open(MEMBER));
      await assertSucceeds(updateDoc(doc(db(MANAGER), `communityReports/${OTHER_MEMBER}_org-post`), {
        status: 'resolved',
        resolvedBy: MANAGER,
        resolvedAt: serverTimestamp(),
        resolution: 'hidden',
      }));
    });
  });

  // ==========================================================
  // TOPICS
  // ==========================================================

  describe('topics', () => {
    const topic = { name: 'Announcements', slug: 'announcements', active: true, sortOrder: 1 };

    it('lets managers manage organization topics and members read them', async () => {
      await assertSucceeds(setDoc(doc(db(MANAGER), `organizations/${ORG}/communityTopics/t1`), topic));
      await assertSucceeds(getDocs(collection(db(MEMBER), `organizations/${ORG}/communityTopics`)));
    });

    it('denies members and outsiders managing or reading organization topics', async () => {
      await assertFails(setDoc(doc(db(MEMBER), `organizations/${ORG}/communityTopics/t1`), topic));
      await assertFails(getDocs(collection(db(OUTSIDER), `organizations/${ORG}/communityTopics`)));
    });

    it('keeps public topics for platform admins', async () => {
      await assertFails(setDoc(doc(db(MANAGER), 'communityTopics/t1'), topic));
      await assertSucceeds(setDoc(doc(db(ADMIN), 'communityTopics/t1'), topic));
    });
  });

  // ==========================================================
  // CHAT
  // ==========================================================

  describe('chat', () => {
    function conversation(ids: string[]) {
      return {
        type: 'direct',
        participantIds: [...ids].sort(),
        participantInfo: ids.map((userId) => ({ userId, displayName: userId })),
        lastMessage: '',
        lastMessageSenderId: '',
        lastMessageAt: null,
        unreadCounts: Object.fromEntries(ids.map((id) => [id, 0])),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
    }

    it('lets a user start a direct conversation that includes them', async () => {
      await assertSucceeds(setDoc(doc(db(MEMBER), 'communityConversations/c1'), conversation([MEMBER, OUTSIDER])));
    });

    it('denies conversations that exclude you or have more than two people', async () => {
      await assertFails(setDoc(doc(db(MEMBER), 'communityConversations/c1'), conversation([OUTSIDER, MANAGER])));
      await assertFails(setDoc(doc(db(MEMBER), 'communityConversations/c1'), conversation([MEMBER, OUTSIDER, MANAGER])));
    });

    it('lets participants send and read messages', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'communityConversations/c1'), { ...conversation([MEMBER, OUTSIDER]), createdAt: new Date(), updatedAt: new Date() });
      });

      const sender = db(MEMBER);
      const batch = writeBatch(sender);
      batch.set(doc(sender, 'communityConversations/c1/messages/m1'), {
        conversationId: 'c1',
        senderId: MEMBER,
        content: 'Hi',
        type: 'text',
        attachment: null,
        status: 'sent',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        readBy: [MEMBER],
      });
      batch.update(doc(sender, 'communityConversations/c1'), {
        lastMessage: 'Hi',
        lastMessageSenderId: MEMBER,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCounts: { [MEMBER]: 0, [OUTSIDER]: 1 },
      });
      await assertSucceeds(batch.commit());

      const reader = db(OUTSIDER);
      const read = writeBatch(reader);
      read.update(doc(reader, 'communityConversations/c1/messages/m1'), {
        readBy: [MEMBER, OUTSIDER],
        status: 'read',
        updatedAt: serverTimestamp(),
      });
      read.update(doc(reader, 'communityConversations/c1'), {
        unreadCounts: { [MEMBER]: 0, [OUTSIDER]: 0 },
        updatedAt: serverTimestamp(),
      });
      await assertSucceeds(read.commit());
    });

    it('denies non-participants and impersonation', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'communityConversations/c1'), { ...conversation([MEMBER, OUTSIDER]), createdAt: new Date(), updatedAt: new Date() });
      });
      const message = (senderId: string) => ({
        conversationId: 'c1',
        senderId,
        content: 'Hi',
        type: 'text',
        attachment: null,
        status: 'sent',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        readBy: [senderId],
      });
      await assertFails(setDoc(doc(db(MANAGER), 'communityConversations/c1/messages/m2'), message(MANAGER)));
      await assertFails(setDoc(doc(db(MEMBER), 'communityConversations/c1/messages/m2'), message(OUTSIDER)));
    });
  });
});
