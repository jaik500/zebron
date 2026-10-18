import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

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
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
} from 'firebase/firestore';

import fs from 'node:fs';

describe('Zebron Firestore Security Rules - Knowledge', () => {
  let testEnv: RulesTestEnvironment;

  // ---------------------------------------------------------------------------
  // TEST ENVIRONMENT
  // ---------------------------------------------------------------------------

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'zebron-knowledge-rules-test',
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  // ---------------------------------------------------------------------------
  // SEED HELPERS
  // ---------------------------------------------------------------------------

  async function seedUser(
    userId: string,
    role: 'user' | 'admin' = 'user',
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `users/${userId}`), {
        id: userId,
        email: `${userId}@example.com`,
        displayName: userId,
        role,
      });
    });
  }

  async function seedArticle(
    articleId: string,
    options: {
      status?: 'draft' | 'published' | 'archived';
      applicationKey?: string;
      title?: string;
      version?: number;
    } = {},
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `knowledgeArticles/${articleId}`), {
        id: articleId,
        applicationKey:
          options.applicationKey ?? 'community',
        title:
          options.title ?? `Knowledge Article ${articleId}`,
        summary:
          'Test knowledge article.',
        content:
          'This is test knowledge article content.',
        contentType:
          'guide',
        category:
          'Testing',
        tags:
          ['test', 'knowledge'],
        audience:
          ['user'],
        status:
          options.status ?? 'published',
        version:
          options.version ?? 1,
        authorId:
          'admin-1',
        createdAt:
          '2026-09-20T00:00:00.000Z',
        updatedAt:
          '2026-09-20T00:00:00.000Z',
        publishedAt:
          options.status === 'draft'
            ? null
            : '2026-09-20T00:00:00.000Z',
        archivedAt:
          options.status === 'archived'
            ? '2026-09-20T00:00:00.000Z'
            : null,
        downloadable:
          true,
        metadata:
          {},
      });
    });
  }

  async function seedArticleVersion(
    versionId: string,
    articleId: string,
    version = 1,
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(
          context.firestore(),
          `knowledgeArticleVersions/${versionId}`,
        ),
        {
          id: versionId,
          articleId,
          version,
          title: `Version ${version}`,
          summary: 'Test version.',
          content: 'Test version content.',
          contentType: 'guide',
          category: 'Testing',
          tags: ['test'],
          audience: ['user'],
          createdBy: 'admin-1',
          createdAt: '2026-09-20T00:00:00.000Z',
          publishedAt: '2026-09-20T00:00:00.000Z',
          archivedAt: null,
        },
      );
    });
  }

  // ---------------------------------------------------------------------------
  // KNOWLEDGE ARTICLES - READ
  // ---------------------------------------------------------------------------

  describe('knowledge articles - read', () => {
    it('denies an unauthenticated user from reading a published article', async () => {
      await seedArticle('article-1', {
        status: 'published',
      });

      const db =
        testEnv.unauthenticatedContext().firestore();

      await assertFails(
        getDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
        ),
      );
    });

    it('allows an authenticated user to read a published article', async () => {
      await seedUser('user-1');

      await seedArticle('article-1', {
        status: 'published',
      });

      const db =
        testEnv.authenticatedContext('user-1').firestore();

      await assertSucceeds(
        getDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
        ),
      );
    });

    it('denies an authenticated user from reading a draft article', async () => {
      await seedUser('user-1');

      await seedArticle('article-1', {
        status: 'draft',
      });

      const db =
        testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        getDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
        ),
      );
    });

    it('denies an authenticated user from reading an archived article', async () => {
      await seedUser('user-1');

      await seedArticle('article-1', {
        status: 'archived',
      });

      const db =
        testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        getDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
        ),
      );
    });

    it('allows a platform admin to read a draft article', async () => {
      await seedUser('admin-1', 'admin');

      await seedArticle('article-1', {
        status: 'draft',
      });

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        getDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
        ),
      );
    });

    it('allows a platform admin to read an archived article', async () => {
      await seedUser('admin-1', 'admin');

      await seedArticle('article-1', {
        status: 'archived',
      });

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        getDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
        ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // KNOWLEDGE ARTICLES - QUERY
  // ---------------------------------------------------------------------------

  describe('knowledge articles - query', () => {
    it('allows a user to query published articles for an application', async () => {
      await seedUser('user-1');

      await seedArticle('community-1', {
        applicationKey: 'community',
        status: 'published',
      });

      await seedArticle('community-2', {
        applicationKey: 'community',
        status: 'published',
      });

      await seedArticle('tax-1', {
        applicationKey: 'tax-pay',
        status: 'published',
      });

      const db =
        testEnv.authenticatedContext('user-1').firestore();

      const articlesQuery = query(
        collection(db, 'knowledgeArticles'),
        where('applicationKey', '==', 'community'),
        where('status', '==', 'published'),
        orderBy('updatedAt', 'desc'),
      );

      const snapshot =
        await assertSucceeds(
          getDocs(articlesQuery),
        );

      expect(snapshot.docs).toHaveLength(2);

      expect(
        snapshot.docs
          .map((entry) => entry.id)
          .sort(),
      ).toEqual([
        'community-1',
        'community-2',
      ]);
    });

    it('denies an unscoped knowledge article query to a regular user', async () => {
      await seedUser('user-1');

      await seedArticle('article-1', {
        status: 'published',
      });

      const db =
        testEnv.authenticatedContext('user-1').firestore();

      const articlesQuery =
        query(
          collection(db, 'knowledgeArticles'),
        );

      await assertFails(
        getDocs(articlesQuery),
      );
    });

    it('allows a platform admin to query all knowledge articles', async () => {
      await seedUser('admin-1', 'admin');

      await seedArticle('published-1', {
        status: 'published',
      });

      await seedArticle('draft-1', {
        status: 'draft',
      });

      await seedArticle('archived-1', {
        status: 'archived',
      });

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      const articlesQuery =
        query(
          collection(db, 'knowledgeArticles'),
        );

      const snapshot =
        await assertSucceeds(
          getDocs(articlesQuery),
        );

      expect(snapshot.docs).toHaveLength(3);
    });
  });

  // ---------------------------------------------------------------------------
  // KNOWLEDGE ARTICLES - CREATE
  // ---------------------------------------------------------------------------

  describe('knowledge articles - create', () => {
    it('denies an unauthenticated user from creating an article', async () => {
      const db =
        testEnv.unauthenticatedContext().firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
          {
            id: 'article-1',
            applicationKey: 'community',
            title: 'Unauthorized Article',
            summary: 'Should fail.',
            content: 'Unauthorized content.',
            contentType: 'guide',
            category: 'Testing',
            tags: ['test'],
            audience: ['user'],
            status: 'draft',
            version: 1,
            authorId: 'user-1',
            createdAt: '2026-09-20T00:00:00.000Z',
            updatedAt: '2026-09-20T00:00:00.000Z',
            downloadable: true,
          },
        ),
      );
    });

    it('denies a regular user from creating an article', async () => {
      await seedUser('user-1');

      const db =
        testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
          {
            id: 'article-1',
            applicationKey: 'community',
            title: 'Unauthorized Article',
            summary: 'Should fail.',
            content: 'Unauthorized content.',
            contentType: 'guide',
            category: 'Testing',
            tags: ['test'],
            audience: ['user'],
            status: 'draft',
            version: 1,
            authorId: 'user-1',
            createdAt: '2026-09-20T00:00:00.000Z',
            updatedAt: '2026-09-20T00:00:00.000Z',
            downloadable: true,
          },
        ),
      );
    });

    it('allows a platform admin to create an article', async () => {
      await seedUser('admin-1', 'admin');

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        setDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
          {
            id: 'article-1',
            applicationKey: 'community',
            title: 'Community Guide',
            summary: 'Community documentation.',
            content: 'Community guide content.',
            contentType: 'guide',
            category: 'Community',
            tags: ['community'],
            audience: ['user'],
            status: 'draft',
            version: 1,
            authorId: 'admin-1',
            createdAt: '2026-09-20T00:00:00.000Z',
            updatedAt: '2026-09-20T00:00:00.000Z',
            downloadable: true,
          },
        ),
      );
    });

    it('denies an article whose document ID does not match its id field', async () => {
      await seedUser('admin-1', 'admin');

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
          {
            id: 'different-id',
            applicationKey: 'community',
            title: 'Invalid Article',
            content: 'Invalid content.',
            contentType: 'guide',
            category: 'Testing',
            tags: [],
            audience: ['user'],
            status: 'draft',
            version: 1,
            authorId: 'admin-1',
            createdAt: '2026-09-20T00:00:00.000Z',
            updatedAt: '2026-09-20T00:00:00.000Z',
            downloadable: true,
          },
        ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // KNOWLEDGE ARTICLES - UPDATE
  // ---------------------------------------------------------------------------

  describe('knowledge articles - update', () => {
    it('denies a regular user from updating an article', async () => {
      await seedUser('user-1');

      await seedArticle('article-1');

      const db =
        testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        updateDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
          {
            title: 'Unauthorized Update',
          },
        ),
      );
    });

    it('allows a platform admin to update an article', async () => {
      await seedUser('admin-1', 'admin');

      await seedArticle('article-1');

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        updateDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
          {
            title: 'Updated Article',
            updatedAt:
              '2026-09-20T01:00:00.000Z',
          },
        ),
      );
    });

    it('denies an admin from changing the article document identity', async () => {
      await seedUser('admin-1', 'admin');

      await seedArticle('article-1');

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertFails(
        updateDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
          {
            id: 'different-id',
          },
        ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // KNOWLEDGE ARTICLES - DELETE
  // ---------------------------------------------------------------------------

  describe('knowledge articles - delete', () => {
    it('denies a regular user from deleting an article', async () => {
      await seedUser('user-1');

      await seedArticle('article-1');

      const db =
        testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        deleteDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
        ),
      );
    });

    it('allows a platform admin to delete an article', async () => {
      await seedUser('admin-1', 'admin');

      await seedArticle('article-1', {
        status: 'archived',
      });

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        deleteDoc(
          doc(
            db,
            'knowledgeArticles/article-1',
          ),
        ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // KNOWLEDGE ARTICLE VERSIONS - READ
  // ---------------------------------------------------------------------------

  describe('knowledge article versions - read', () => {
    it('denies a regular user from reading version history', async () => {
      await seedUser('user-1');

      await seedArticle('article-1');

      await seedArticleVersion(
        'article-1-v1',
        'article-1',
      );

      const db =
        testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        getDoc(
          doc(
            db,
            'knowledgeArticleVersions/article-1-v1',
          ),
        ),
      );
    });

    it('allows a platform admin to read version history', async () => {
      await seedUser('admin-1', 'admin');

      await seedArticle('article-1');

      await seedArticleVersion(
        'article-1-v1',
        'article-1',
      );

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        getDoc(
          doc(
            db,
            'knowledgeArticleVersions/article-1-v1',
          ),
        ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // KNOWLEDGE ARTICLE VERSIONS - CREATE
  // ---------------------------------------------------------------------------

  describe('knowledge article versions - create', () => {
    it('denies a regular user from creating a version', async () => {
      await seedUser('user-1');

      await seedArticle('article-1');

      const db =
        testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'knowledgeArticleVersions/article-1-v1',
          ),
          {
            id: 'article-1-v1',
            articleId: 'article-1',
            version: 1,
            title: 'Version 1',
            content: 'Version content.',
            contentType: 'guide',
            category: 'Testing',
            tags: ['test'],
            audience: ['user'],
            createdBy: 'user-1',
            createdAt: '2026-09-20T00:00:00.000Z',
          },
        ),
      );
    });

    it('allows a platform admin to create a version', async () => {
      await seedUser('admin-1', 'admin');

      await seedArticle('article-1');

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        setDoc(
          doc(
            db,
            'knowledgeArticleVersions/article-1-v1',
          ),
          {
            id: 'article-1-v1',
            articleId: 'article-1',
            version: 1,
            title: 'Version 1',
            content: 'Version content.',
            contentType: 'guide',
            category: 'Testing',
            tags: ['test'],
            audience: ['user'],
            createdBy: 'admin-1',
            createdAt: '2026-09-20T00:00:00.000Z',
          },
        ),
      );
    });

    it('denies a version whose document ID does not match its id field', async () => {
      await seedUser('admin-1', 'admin');

      await seedArticle('article-1');

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'knowledgeArticleVersions/article-1-v1',
          ),
          {
            id: 'different-version-id',
            articleId: 'article-1',
            version: 1,
            title: 'Version 1',
            content: 'Version content.',
            contentType: 'guide',
            category: 'Testing',
            tags: ['test'],
            audience: ['user'],
            createdBy: 'admin-1',
            createdAt: '2026-09-20T00:00:00.000Z',
          },
        ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // KNOWLEDGE ARTICLE VERSIONS - IMMUTABILITY
  // ---------------------------------------------------------------------------

  describe('knowledge article versions - immutability', () => {
    it('denies version updates even for a platform admin', async () => {
      await seedUser('admin-1', 'admin');

      await seedArticleVersion(
        'article-1-v1',
        'article-1',
      );

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertFails(
        updateDoc(
          doc(
            db,
            'knowledgeArticleVersions/article-1-v1',
          ),
          {
            title: 'Modified Version',
          },
        ),
      );
    });

    it('denies version deletion even for a platform admin', async () => {
      await seedUser('admin-1', 'admin');

      await seedArticleVersion(
        'article-1-v1',
        'article-1',
      );

      const db =
        testEnv.authenticatedContext('admin-1').firestore();

      await assertFails(
        deleteDoc(
          doc(
            db,
            'knowledgeArticleVersions/article-1-v1',
          ),
        ),
      );
    });
  });
});