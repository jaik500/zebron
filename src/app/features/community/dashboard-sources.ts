import { inject } from '@angular/core';

import { DataSourceDefinition, ListData } from '../../shared/dashboards/data-source.registry';
import { CommunityPostService } from './services/community-post.service';

/** Community data sources for dashboards: the organization's own community only. */
export const COMMUNITY_DATA_SOURCES: DataSourceDefinition[] = [
  {
    key: 'community.recentPosts',
    name: 'Latest community posts',
    appId: 'community',
    shape: 'list',
    async load(context, config): Promise<ListData> {
      const service = inject(CommunityPostService);
      const count = Math.min(8, Math.max(1, Number(config['limit']) || 5));
      const posts = await service.getRecentForOrganization(context.organizationId, count);
      const base = `${context.basePath}/community`;

      return {
        kind: 'list',
        link: base,
        items: posts.map((post) => ({
          title: post.title,
          subtitle: [post.author?.displayName, post.topicName].filter(Boolean).join(' · ') || undefined,
          link: `${base}/post/${post.id}`,
          icon: post.pollId ? 'poll' : 'forum',
        })),
      };
    },
  },
];
