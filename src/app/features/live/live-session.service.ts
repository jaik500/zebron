import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../core/services/firebase-config';

/**
 * Virtual Classroom: instructor-led live sessions of an organization.
 *
 *   organizations/{id}/liveSessions/{sessionId}
 *   organizations/{id}/liveSessions/{sessionId}/registrations/{uid}
 *
 * The meeting itself runs in Zoom, Google Meet, Teams, Jitsi or any tool;
 * Zebron keeps the schedule, the link, registrations, attendance and the
 * recording link.
 */

export type LiveProvider = 'jitsi' | 'meet' | 'zoom' | 'teams' | 'other';

export interface LiveSession {
  id: string;
  title: string;
  description: string;
  instructorId: string | null;
  instructorName: string;
  startAt: Date;
  durationMinutes: number;
  /** 0 = no limit. */
  capacity: number;
  provider: LiveProvider;
  meetingUrl: string;
  recordingUrl: string;
  status: 'scheduled' | 'cancelled';
  registeredCount: number;
}

export interface LiveRegistration {
  userId: string;
  name: string;
  email: string | null;
  attended: boolean;
  registeredAt: Date | null;
}

export const LIVE_PROVIDERS: ReadonlyArray<{ id: LiveProvider; name: string; icon: string; createUrl: string | null }> = [
  { id: 'jitsi', name: 'Jitsi Meet', icon: 'auto_awesome', createUrl: null },
  { id: 'meet', name: 'Google Meet', icon: 'videocam', createUrl: 'https://meet.google.com/new' },
  { id: 'zoom', name: 'Zoom', icon: 'video_call', createUrl: 'https://zoom.us/start/videomeeting' },
  { id: 'teams', name: 'Microsoft Teams', icon: 'groups', createUrl: 'https://teams.microsoft.com/l/meeting/new' },
  { id: 'other', name: 'Other link', icon: 'link', createUrl: null },
];

/** Join opens 15 minutes before the start and closes 30 minutes after the end. */
export const JOIN_OPENS_MINUTES = 15;
export const JOIN_CLOSES_MINUTES = 30;

export function sessionEnd(session: Pick<LiveSession, 'startAt' | 'durationMinutes'>): Date {
  return new Date(session.startAt.getTime() + session.durationMinutes * 60_000);
}

export function canJoinNow(session: LiveSession, now = Date.now()): boolean {
  return (
    session.status === 'scheduled' &&
    !!session.meetingUrl &&
    now >= session.startAt.getTime() - JOIN_OPENS_MINUTES * 60_000 &&
    now <= sessionEnd(session).getTime() + JOIN_CLOSES_MINUTES * 60_000
  );
}

/** Which tool a pasted link belongs to. */
export function providerFromUrl(url: string): LiveProvider {
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  })();

  if (host.endsWith('meet.jit.si') || host.includes('jitsi')) return 'jitsi';
  if (host === 'meet.google.com') return 'meet';
  if (host.endsWith('zoom.us')) return 'zoom';
  if (host.endsWith('teams.microsoft.com') || host.endsWith('teams.live.com')) return 'teams';
  return 'other';
}

/** A new Jitsi room: free, no account for learners. */
export function newJitsiLink(organizationSlug: string | null | undefined): string {
  const base = (organizationSlug || 'zebron').replace(/[^a-z0-9-]/gi, '').slice(0, 40) || 'zebron';
  const random = Array.from(crypto.getRandomValues(new Uint8Array(6)), (value) => value.toString(36).padStart(2, '0')).join('');
  return `https://meet.jit.si/Zebron-${base}-${random}`;
}

/** An .ics file so learners can add a session to their own calendar. */
export function sessionCalendarFile(session: LiveSession, organizationName: string): string {
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/[,;]/g, (match) => `\\${match}`).replace(/\r?\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zebron//Virtual Classroom//EN',
    'BEGIN:VEVENT',
    `UID:${session.id}@zebron.org`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(session.startAt)}`,
    `DTEND:${stamp(sessionEnd(session))}`,
    `SUMMARY:${escape(session.title)}`,
    `DESCRIPTION:${escape([session.description, session.meetingUrl ? `Join: ${session.meetingUrl}` : ''].filter(Boolean).join('\n\n'))}`,
    ...(session.meetingUrl ? [`URL:${session.meetingUrl}`, `LOCATION:${escape(session.meetingUrl)}`] : []),
    `ORGANIZER;CN=${escape(organizationName)}:mailto:noreply@zebron.org`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

@Injectable({ providedIn: 'root' })
export class LiveSessionService {
  private sessions(organizationId: string) {
    return collection(firestore, 'organizations', organizationId, 'liveSessions');
  }

  private registrations(organizationId: string, sessionId: string) {
    return collection(firestore, 'organizations', organizationId, 'liveSessions', sessionId, 'registrations');
  }

  async list(organizationId: string): Promise<LiveSession[]> {
    const snapshot = await getDocs(query(this.sessions(organizationId), orderBy('startAt', 'desc'), limit(200)));
    return snapshot.docs.map((document) => this.toSession(document.id, document.data()));
  }

  /**
   * The next few sessions, including any that started in the last 6 hours
   * (dashboards: a few reads instead of the whole list).
   */
  async listUpcoming(organizationId: string, count = 5): Promise<LiveSession[]> {
    const since = Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60_000));
    const snapshot = await getDocs(
      query(this.sessions(organizationId), where('startAt', '>=', since), orderBy('startAt', 'asc'), limit(count)),
    );
    return snapshot.docs.map((document) => this.toSession(document.id, document.data()));
  }

  private toSession(id: string, data: Record<string, unknown>): LiveSession {
    const provider = String(data['provider'] ?? 'other') as LiveProvider;

    return {
      id,
      title: str(data['title']),
      description: str(data['description']),
      instructorId: str(data['instructorId']) || null,
      instructorName: str(data['instructorName']),
      startAt: (data['startAt'] as Timestamp | undefined)?.toDate() ?? new Date(),
      durationMinutes: Number(data['durationMinutes'] ?? 60),
      capacity: Number(data['capacity'] ?? 0),
      provider: LIVE_PROVIDERS.some((item) => item.id === provider) ? provider : 'other',
      meetingUrl: str(data['meetingUrl']),
      recordingUrl: str(data['recordingUrl']),
      status: data['status'] === 'cancelled' ? 'cancelled' : 'scheduled',
      registeredCount: Number(data['registeredCount'] ?? 0),
    };
  }

  /** Create or update (staff and above). The registration count is kept by the server. */
  async save(organizationId: string, session: LiveSession, isNew: boolean, userId: string): Promise<string> {
    const ref = isNew ? doc(this.sessions(organizationId)) : doc(this.sessions(organizationId), session.id);

    await setDoc(
      ref,
      {
        title: session.title.trim().slice(0, 200),
        description: session.description.trim().slice(0, 5000),
        organizationId,
        instructorId: session.instructorId,
        instructorName: session.instructorName.trim().slice(0, 120),
        startAt: Timestamp.fromDate(session.startAt),
        durationMinutes: Math.round(session.durationMinutes),
        capacity: Math.max(0, Math.round(session.capacity)),
        provider: session.provider,
        meetingUrl: session.meetingUrl.trim().slice(0, 500),
        recordingUrl: session.recordingUrl.trim().slice(0, 500),
        status: session.status,
        registeredCount: isNew ? 0 : session.registeredCount,
        ...(isNew ? { createdBy: userId, createdAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return ref.id;
  }

  /** Delete a session and its registrations. */
  async remove(organizationId: string, sessionId: string): Promise<void> {
    const registrations = await getDocs(this.registrations(organizationId, sessionId));
    await Promise.all(registrations.docs.map((registration) => deleteDoc(registration.ref)));
    await deleteDoc(doc(this.sessions(organizationId), sessionId));
  }

  /** Session IDs the person is registered for. */
  async myRegistrations(organizationId: string, sessionIds: string[], userId: string): Promise<Set<string>> {
    const found = await Promise.all(
      sessionIds.map(async (id) => ((await getDoc(doc(this.registrations(organizationId, id), userId))).exists() ? id : null)),
    );
    return new Set(found.filter((id): id is string => !!id));
  }

  async listRegistrations(organizationId: string, sessionId: string): Promise<LiveRegistration[]> {
    const snapshot = await getDocs(this.registrations(organizationId, sessionId));

    return snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          userId: document.id,
          name: str(data['name']) || document.id,
          email: str(data['email']) || null,
          attended: data['attended'] === true,
          registeredAt: (data['registeredAt'] as Timestamp | undefined)?.toDate() ?? null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  setAttendance(organizationId: string, sessionId: string, userId: string, attended: boolean): Promise<void> {
    return updateDoc(doc(this.registrations(organizationId, sessionId), userId), {
      attended,
      attendanceMarkedAt: serverTimestamp(),
    });
  }

  async register(organizationId: string, sessionId: string, action: 'register' | 'cancel'): Promise<{ registered: boolean; registeredCount: number }> {
    const callable = httpsCallable<
      { organizationId: string; sessionId: string; action: string },
      { registered: boolean; registeredCount: number }
    >(firebaseFunctions, 'registerForLiveSession');

    return (await callable({ organizationId, sessionId, action })).data;
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
