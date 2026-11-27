import {
  ActivityLogEntry,
  CustomActivityDefinition,
  ParsedMessageResult,
} from '../../types';

const START_KEYWORDS = ['start', 'started', 'begin', 'began', 'st'];
const END_KEYWORDS = ['end', 'ended', 'stop', 'stopped', 'finish', 'finished', 'done'];

/**
 * Normalizes user text for rule-based matching without any AI dependency.
 */
function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesActivityTerm(text: string, activity: CustomActivityDefinition): boolean {
  const candidates = [activity.name, ...activity.aliases]
    .map(normalizeText)
    .filter(Boolean);

  return candidates.some((candidate) => {
    if (text === candidate) return true;
    const regex = new RegExp(`(^|\\s)${escapeRegex(candidate)}($|\\s)`, 'i');
    return regex.test(text);
  });
}

function findMatchingActivity(
  cleanedText: string,
  activities: CustomActivityDefinition[]
): CustomActivityDefinition | undefined {
  const active = activities.filter((a) => !a.isArchived);
  // Prefer longest exact/alias match first to avoid partial collisions
  const sorted = [...active].sort((a, b) => b.name.length - a.name.length);

  for (const act of sorted) {
    if (matchesActivityTerm(cleanedText, act)) {
      return act;
    }
  }
  return undefined;
}

/**
 * Extracts a quantity + optional unit from messages like:
 * - "Water 250ml"
 * - "Reading 10 pages"
 * - "Water 500 ml"
 * - "Pushups 25"
 */
function extractQuantityAndUnit(raw: string): {
  strippedText: string;
  quantity?: number;
  unit?: string;
} {
  const match = raw.match(/^(.*?)[\s:]+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);
  if (match) {
    const qty = Number(match[2]);
    if (!Number.isNaN(qty) && qty > 0) {
      return {
        strippedText: normalizeText(match[1]),
        quantity: qty,
        unit: match[3]?.toLowerCase(),
      };
    }
  }

  // Also support quantity before name: "250ml water" or "10 pages reading"
  const prefixMatch = raw.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/);
  if (prefixMatch) {
    const qty = Number(prefixMatch[1]);
    if (!Number.isNaN(qty) && qty > 0) {
      return {
        strippedText: normalizeText(prefixMatch[3]),
        quantity: qty,
        unit: prefixMatch[2]?.toLowerCase(),
      };
    }
  }

  return { strippedText: normalizeText(raw) };
}

function findOpenStartSession(
  activityId: string,
  logs: ActivityLogEntry[]
): ActivityLogEntry | undefined {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  let openStart: ActivityLogEntry | undefined;

  for (const log of sorted) {
    if (log.activityId !== activityId) continue;
    if (log.eventKind === 'start') {
      openStart = log;
    } else if (log.eventKind === 'end' && openStart) {
      if (log.pairedSessionId === openStart.id || !log.pairedSessionId) {
        openStart = undefined;
      }
    }
  }
  return openStart;
}

function isDuplicateRecentEntry(
  activityId: string,
  eventKind: string,
  logs: ActivityLogEntry[],
  targetTimeMs: number
): boolean {
  const TWO_MINUTES_MS = 2 * 60 * 1000;
  return logs.some((log) => {
    if (log.activityId !== activityId || log.eventKind !== eventKind) return false;
    const diff = Math.abs(targetTimeMs - new Date(log.timestamp).getTime());
    return diff < TWO_MINUTES_MS;
  });
}

/**
 * Rule-based activity message parser.
 * Supports Single Event, Duration (Start/End), and Quantity/Count messages.
 */
export function parseActivityMessage(
  rawInput: string,
  activities: CustomActivityDefinition[],
  existingLogs: ActivityLogEntry[],
  targetTimeIso: string = new Date().toISOString()
): ParsedMessageResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      status: 'invalid_input',
      message: 'Please enter an activity message like "Wake Up", "Workout Start", or "Water 250ml".',
    };
  }

  const targetTimeMs = new Date(targetTimeIso).getTime();
  if (Number.isNaN(targetTimeMs)) {
    return { status: 'invalid_input', message: 'Invalid timestamp provided.' };
  }

  const normalized = normalizeText(trimmed);
  const tokens = normalized.split(' ');
  const lastToken = tokens[tokens.length - 1];
  const firstToken = tokens[0];

  const hasStartKeyword =
    START_KEYWORDS.includes(lastToken) || START_KEYWORDS.includes(firstToken);
  const hasEndKeyword =
    END_KEYWORDS.includes(lastToken) || END_KEYWORDS.includes(firstToken);

  if (hasStartKeyword || hasEndKeyword) {
    const cleanedTokens = tokens.filter(
      (t) => !START_KEYWORDS.includes(t) && !END_KEYWORDS.includes(t)
    );
    const cleanedName = cleanedTokens.join(' ').trim();
    if (!cleanedName) {
      return {
        status: 'invalid_input',
        message: 'Please specify which activity you are starting or ending (e.g., "Workout Start").',
      };
    }

    const matched = findMatchingActivity(cleanedName, activities);
    if (!matched) {
      return {
        status: 'unknown_activity',
        suggestedName: cleanedName
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        message: `No activity named "${cleanedName}" found. Would you like to create it?`,
      };
    }

    if (matched.trackingType !== 'duration') {
      return {
        status: 'invalid_input',
        message: `"${matched.name}" is configured as a ${matched.trackingType.replace('_', ' ')} activity, not a start/end duration activity.`,
      };
    }

    const openSession = findOpenStartSession(matched.id, existingLogs);

    if (hasStartKeyword) {
      if (openSession) {
        return {
          status: 'already_active_session',
          activity: matched,
          activeSessionLog: openSession,
          message: `You already have an active "${matched.name}" session in progress. Log "${matched.name} End" before starting a new one.`,
        };
      }
      if (isDuplicateRecentEntry(matched.id, 'start', existingLogs, targetTimeMs)) {
        return {
          status: 'duplicate_entry',
          activity: matched,
          message: `Duplicate "${matched.name} Start" detected within 2 minutes.`,
        };
      }
      return {
        status: 'matched_start',
        activity: matched,
        eventKind: 'start',
        message: `Started ${matched.name} timer.`,
      };
    }

    // End keyword
    if (!openSession) {
      return {
        status: 'missing_start_session',
        activity: matched,
        message: `No active "${matched.name} Start" event found. Log "${matched.name} Start" first or use Late Entry if you forgot to start it.`,
      };
    }

    const startMs = new Date(openSession.timestamp).getTime();
    if (targetTimeMs <= startMs) {
      return {
        status: 'invalid_input',
        message: `End time cannot be earlier than or equal to "${matched.name} Start".`,
      };
    }

    const durationMinutes = Math.max(1, Math.round((targetTimeMs - startMs) / 60000));
    if (durationMinutes > 18 * 60) {
      return {
        status: 'invalid_input',
        message: `Calculated duration (${Math.round(durationMinutes / 60)}h) looks unusually long. Please verify or log via Late Entry.`,
      };
    }

    return {
      status: 'matched_end',
      activity: matched,
      eventKind: 'end',
      activeSessionLog: openSession,
      pairedDurationMinutes: durationMinutes,
      message: `Completed ${matched.name} (${durationMinutes} min).`,
    };
  }

  // Check for quantity / count pattern
  const qtyParsed = extractQuantityAndUnit(trimmed);
  if (qtyParsed.quantity !== undefined) {
    const matchedQtyActivity = findMatchingActivity(qtyParsed.strippedText, activities);
    if (!matchedQtyActivity) {
      return {
        status: 'unknown_activity',
        suggestedName: qtyParsed.strippedText
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        quantity: qtyParsed.quantity,
        unit: qtyParsed.unit ?? 'count',
        message: `"${qtyParsed.strippedText}" is not in your activity list yet. Create it now?`,
      };
    }

    const resolvedUnit = qtyParsed.unit || matchedQtyActivity.unit || 'count';
    return {
      status: 'matched_quantity',
      activity: matchedQtyActivity,
      eventKind: 'quantity',
      quantity: qtyParsed.quantity,
      unit: resolvedUnit,
      message: `Logged ${qtyParsed.quantity} ${resolvedUnit} for ${matchedQtyActivity.name}.`,
    };
  }

  // Exact or alias match for single event, duration shorthand, or quantity default
  const matched = findMatchingActivity(normalized, activities);
  if (!matched) {
    return {
      status: 'unknown_activity',
      suggestedName: trimmed
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      message: `"${trimmed}" is not recognized yet. Create a custom activity for it?`,
    };
  }

  if (matched.trackingType === 'duration') {
    // Convenience toggle: if user types just "Workout", hint start/end or toggle cleanly
    const openSession = findOpenStartSession(matched.id, existingLogs);
    if (!openSession) {
      return {
        status: 'matched_start',
        activity: matched,
        eventKind: 'start',
        message: `Started ${matched.name} session. Type "${matched.name} End" when finished.`,
      };
    }
    const startMs = new Date(openSession.timestamp).getTime();
    if (targetTimeMs <= startMs) {
      return {
        status: 'invalid_input',
        message: `End time must be after "${matched.name} Start".`,
      };
    }
    const durationMinutes = Math.max(1, Math.round((targetTimeMs - startMs) / 60000));
    return {
      status: 'matched_end',
      activity: matched,
      eventKind: 'end',
      activeSessionLog: openSession,
      pairedDurationMinutes: durationMinutes,
      message: `Completed ${matched.name} (${durationMinutes} min).`,
    };
  }

  if (matched.trackingType === 'quantity') {
    const defaultQty = matched.unit === 'ml' ? 250 : 1;
    return {
      status: 'matched_quantity',
      activity: matched,
      eventKind: 'quantity',
      quantity: defaultQty,
      unit: matched.unit,
      message: `Logged ${defaultQty} ${matched.unit} of ${matched.name}.`,
    };
  }

  if (isDuplicateRecentEntry(matched.id, 'single', existingLogs, targetTimeMs)) {
    return {
      status: 'duplicate_entry',
      activity: matched,
      message: `"${matched.name}" was already logged moments ago.`,
    };
  }

  return {
    status: 'matched_single',
    activity: matched,
    eventKind: 'single',
    message: `Logged ${matched.name}.`,
  };
}
