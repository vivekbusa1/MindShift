/**
 * Timezone-aware date & duration utilities for Mindshift.
 * Ensures streak boundaries, daily logs, and reports respect the user's configured timezone.
 */

const VALID_TIMEZONE_CACHE = new Map<string, boolean>();

export function resolveSafeTimezone(timezone?: string): string {
  const candidate = timezone?.trim() || 'UTC';
  if (VALID_TIMEZONE_CACHE.get(candidate)) {
    return candidate;
  }
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: candidate }).format(new Date());
    VALID_TIMEZONE_CACHE.set(candidate, true);
    return candidate;
  } catch {
    return 'UTC';
  }
}

/**
 * Returns YYYY-MM-DD in the user's configured timezone.
 */
export function getDateKeyInTimezone(dateInput: Date | string, timezone?: string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const tz = resolveSafeTimezone(timezone);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function getTodayDateKey(timezone?: string): string {
  return getDateKeyInTimezone(new Date(), timezone);
}

/**
 * Shifts a YYYY-MM-DD key by `deltaDays` using calendar math (UTC midnight avoids DST drift).
 */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export function getPastDateKeys(endDateKey: string, count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(shiftDateKey(endDateKey, -i));
  }
  return keys;
}

export function getMonthDateKeys(monthKey: string): string[] {
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const keys: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dd = String(d).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    keys.push(`${y}-${mm}-${dd}`);
  }
  return keys;
}

export function formatTimeInTimezone(isoString: string, timezone?: string): string {
  const tz = resolveSafeTimezone(timezone);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

export function formatDateHeader(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(dt);
}

export function formatFullDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(dt);
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(dt);
}

export function formatShortWeekday(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
  }).format(dt);
}

export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) {
    return 'Not Recorded';
  }
  const safe = Math.max(0, Math.round(minutes));
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function parseHHMMToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return ((h % 24) + 24) % 24 * 60 + Math.max(0, Math.min(59, m));
}

export function formatMinutesAsTime12h(totalMinutes: number): string {
  const norm = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(norm / 60);
  const m = norm % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function getMinutesOfDayInTimezone(isoString: string, timezone?: string): number {
  const tz = resolveSafeTimezone(timezone);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(isoString));
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

export function getGreetingForHour(timezone?: string): string {
  const mins = getMinutesOfDayInTimezone(new Date().toISOString(), timezone);
  const hour = Math.floor(mins / 60);
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function isWithinLateEntryWindow(
  targetTimestampIso: string,
  windowHours: number,
  nowMs: number = Date.now()
): { valid: boolean; reason?: string } {
  const targetMs = new Date(targetTimestampIso).getTime();
  if (Number.isNaN(targetMs)) {
    return { valid: false, reason: 'Invalid date or time selected.' };
  }
  if (targetMs > nowMs + 60 * 1000) {
    return { valid: false, reason: 'Future timestamps are not allowed.' };
  }
  const maxAgeMs = windowHours * 60 * 60 * 1000;
  if (nowMs - targetMs > maxAgeMs) {
    return {
      valid: false,
      reason: `Late entries are only allowed within the configured ${windowHours}-hour correction window.`,
    };
  }
  return { valid: true };
}

export function createId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}
