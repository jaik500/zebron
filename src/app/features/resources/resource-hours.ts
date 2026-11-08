import { Availability, AvailabilityDay } from '../../core/models/availability.model';

/**
 * Whether a resource is open, from its opening hours (Admin → Resources →
 * Availability), in the visitor's local time. Unknown when no hours were
 * entered.
 */
export interface OpenState {
  /** true = open now, false = closed now, null = no hours to tell. */
  open: boolean | null;
  /** "Open now · until 5:00 PM", "Opens at 9:00 AM", "Closed today"… */
  label: string;
}

const DAY_KEYS: (keyof Availability)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const minutes = (value: string | undefined): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value?.trim() ?? '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

/** 540 → "9:00 AM". */
export function clockLabel(total: number): string {
  const hours = Math.floor(total / 60) % 24;
  return `${hours % 12 || 12}:${String(total % 60).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

export function openState(availability: Availability | undefined, now = new Date()): OpenState {
  if (!availability) {
    return { open: null, label: '' };
  }
  if (availability.alwaysAvailable) {
    return { open: true, label: 'Open 24/7' };
  }

  const today = availability[DAY_KEYS[now.getDay()]] as AvailabilityDay | undefined;
  const hasHours = DAY_KEYS.some((key) => {
    const day = availability[key] as AvailabilityDay | undefined;
    return !!day?.open;
  });
  if (!hasHours) {
    return { open: null, label: availability.byAppointment ? 'By appointment' : '' };
  }
  if (!today?.open) {
    return { open: false, label: 'Closed today' };
  }

  const opens = minutes(today.openTime);
  const closes = minutes(today.closeTime);
  if (opens === null || closes === null) {
    return { open: null, label: 'Open today' };
  }
  const current = now.getHours() * 60 + now.getMinutes();
  // Closing after midnight (e.g. 6 PM – 2 AM) counts as the same evening.
  const closesAt = closes <= opens ? closes + 24 * 60 : closes;
  if (current >= opens && current < closesAt) {
    return { open: true, label: `Open now · until ${clockLabel(closes)}` };
  }
  if (current < opens) {
    return { open: false, label: `Opens at ${clockLabel(opens)}` };
  }
  return { open: false, label: 'Closed now' };
}
