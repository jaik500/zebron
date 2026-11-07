import { inject } from '@angular/core';

import { DataSourceDefinition, ListData } from '../../shared/dashboards/data-source.registry';
import { LiveSessionService, canJoinNow, sessionEnd } from './live-session.service';

/** Virtual Classroom data sources for dashboards (members of organizations with the Virtual Classroom). */
export const LIVE_DATA_SOURCES: DataSourceDefinition[] = [
  {
    key: 'virtualClassroom.upcomingSessions',
    name: 'Upcoming live sessions',
    appId: 'virtual-classroom',
    shape: 'list',
    async load(context, config): Promise<ListData> {
      const service = inject(LiveSessionService);
      const count = Math.min(8, Math.max(1, Number(config['limit']) || 5));
      // A few reads: the next sessions only (cost rule 1).
      const sessions = (await service.listUpcoming(context.organizationId, count + 2))
        .filter((session) => session.status === 'scheduled' && sessionEnd(session).getTime() > Date.now())
        .slice(0, count);
      const link = `${context.basePath}/live`;

      return {
        kind: 'list',
        link,
        items: sessions.map((session) => ({
          title: session.title,
          subtitle: canJoinNow(session)
            ? 'Live now'
            : session.startAt.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
          link,
          icon: canJoinNow(session) ? 'sensors' : 'live_tv',
        })),
      };
    },
  },
];
