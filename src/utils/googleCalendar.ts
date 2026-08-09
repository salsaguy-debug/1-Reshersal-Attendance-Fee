import { AttendanceRecord, Performer } from '../types';

export interface CalendarEvent {
  id: string;
  summary: string;
  date: string; // YYYY-MM-DD
  start?: string;
  end?: string;
  location?: string;
  description?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

export const DEFAULT_CALENDAR_ID = 'l46591dbdq7t070djs0ta7cbac@group.calendar.google.com';

/**
 * Helper function using Google Calendar API client / endpoint to fetch event data
 * from the provided calendar ID 'l46591dbdq7t070djs0ta7cbac@group.calendar.google.com'.
 */
export async function fetchGoogleCalendarEvents(
  calendarId: string = DEFAULT_CALENDAR_ID
): Promise<{ events: CalendarEvent[]; source: string }> {
  try {
    const res = await fetch(`/api/calendar/events?calendarId=${encodeURIComponent(calendarId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.events && data.events.length > 0) {
        return {
          events: data.events,
          source: data.source || 'Google Calendar API'
        };
      }
    }
  } catch (err) {
    console.warn('Backend calendar API unreachable, attempting direct client-side iCal feed fetch:', err);
  }

  // Direct Client-Side Fallback: Fetch Public Google Calendar iCal (.ics) Feed
  try {
    const icalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
    const response = await fetch(icalUrl);
    if (response.ok) {
      const icalText = await response.text();
      const events: CalendarEvent[] = [];

      const veventBlocks = icalText.split('BEGIN:VEVENT');
      veventBlocks.slice(1).forEach((block, idx) => {
        const summaryMatch = block.match(/SUMMARY:(.*?)\r?\n/);
        const dtstartMatch = block.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/);

        if (dtstartMatch) {
          const rawDate = dtstartMatch[1];
          const date = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
          const summary = summaryMatch ? summaryMatch[1].trim() : 'Tradición Dance Co. Rehearsal';

          const attendees: Array<{ email: string; responseStatus: string }> = [];
          const attendeeLines = block.match(/ATTENDEE[^\r\n]+/g) || [];

          attendeeLines.forEach((line: string) => {
            const partstatMatch = line.match(/PARTSTAT=(ACCEPTED|DECLINED|TENTATIVE|NEEDS-ACTION)/i);
            const mailtoMatch = line.match(/mailto:([^\s;>\r\n]+)/i);

            if (mailtoMatch) {
              const email = mailtoMatch[1].toLowerCase().trim();
              let responseStatus = 'needsAction';
              if (partstatMatch) {
                const ps = partstatMatch[1].toUpperCase();
                if (ps === 'ACCEPTED') responseStatus = 'accepted';
                else if (ps === 'DECLINED') responseStatus = 'declined';
                else if (ps === 'TENTATIVE') responseStatus = 'tentative';
              }
              attendees.push({ email, responseStatus });
            }
          });

          events.push({
            id: `ical_evt_${date}_${idx}`,
            summary,
            date,
            attendees
          });
        }
      });

      if (events.length > 0) {
        return {
          events,
          source: 'Live Google Calendar iCal Feed'
        };
      }
    }
  } catch (err) {
    console.warn('Direct iCal feed fetch failed, using fallback practice dates:', err);
  }

  // Fallback baseline practice dates for Tradición Dance Co calendar (Mondays & Wednesdays)
  const fallbackDates = [
    '2026-04-06', '2026-04-08', '2026-04-13', '2026-04-15', '2026-04-20', '2026-04-22', '2026-04-27', '2026-04-29',
    '2026-05-04', '2026-05-06', '2026-05-11', '2026-05-13', '2026-05-18', '2026-05-20', '2026-05-25', '2026-05-27',
    '2026-06-01', '2026-06-03', '2026-06-08', '2026-06-10', '2026-06-15', '2026-06-17', '2026-06-22', '2026-06-24', '2026-06-29',
    '2026-07-01', '2026-07-06', '2026-07-08', '2026-07-13', '2026-07-15', '2026-07-20', '2026-07-22', '2026-07-27', '2026-07-29',
    '2026-08-03', '2026-08-05', '2026-08-10', '2026-08-12', '2026-08-17', '2026-08-19', '2026-08-24', '2026-08-26', '2026-08-31',
    '2026-09-02', '2026-09-07', '2026-09-09', '2026-09-14', '2026-09-16', '2026-09-21', '2026-09-23', '2026-09-28', '2026-09-30',
    '2026-10-05', '2026-10-07', '2026-10-12', '2026-10-14', '2026-10-19', '2026-10-21', '2026-10-26', '2026-10-28',
    '2026-11-02', '2026-11-04', '2026-11-09', '2026-11-11', '2026-11-16', '2026-11-18', '2026-11-23', '2026-11-25', '2026-11-30',
    '2026-12-02', '2026-12-07', '2026-12-09', '2026-12-14', '2026-12-16', '2026-12-21', '2026-12-23', '2026-12-28', '2026-12-30'
  ];
  return {
    events: fallbackDates.map((d, i) => ({
      id: `cal_event_${i}`,
      summary: 'Tradición Dance Co. Rehearsal',
      date: d,
      start: `${d}T09:00:00Z`
    })),
    source: 'Calendar Client Fallback'
  };
}

export function normalizeDateString(rawDate: string): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const m = parts[0].padStart(2, '0');
      const d = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  return trimmed;
}

/**
 * Validates whether a given date is a valid Mon/Wed rehearsal date.
 * Automatically excludes non-rehearsal days such as Friday 2026-04-24 and Saturdays/Sundays.
 */
export function isRehearsalDay(dateStr: string, dayStr?: string): boolean {
  const normDate = normalizeDateString(dateStr);
  if (!normDate) return false;
  // Specific non-rehearsal date blacklist
  if (normDate === '2026-04-24' || normDate === '2026-04-04' || normDate === '2026-04-11' || normDate === '2026-04-18' || normDate === '2026-04-25') {
    return false;
  }

  try {
    const parts = normDate.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dayNum = d.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
      return dayNum === 1 || dayNum === 3; // Strictly Mondays (1) and Wednesdays (3)
    }
  } catch {}

  const dLower = (dayStr || '').trim().toLowerCase();
  return dLower === 'mon' || dLower === 'monday' || dLower === 'wed' || dLower === 'wednesday';
}

/**
 * Uses fetched Google Calendar events to populate missing rehearsal dates
 * for active performers in the application.
 */
export function populateMissingRehearsalDates(
  existingRecords: AttendanceRecord[],
  performers: Performer[],
  calendarEvents: CalendarEvent[],
  feeRules = { unconfirmedFee: 5 },
  baselineDate: string = '2026-04-01',
  currentDateStr?: string
): { updatedRecords: AttendanceRecord[]; addedCount: number } {
  const todayStr = currentDateStr || new Date().toISOString().split('T')[0];

  if (!calendarEvents || calendarEvents.length === 0 || !performers || performers.length === 0) {
    return { updatedRecords: existingRecords.filter(r => isRehearsalDay(r.date, r.day)), addedCount: 0 };
  }

  const recordMap = new Map<string, AttendanceRecord>();
  existingRecords
    .filter(r => isRehearsalDay(r.date, r.day))
    .forEach(r => {
      const normDate = normalizeDateString(r.date);
      const emailLower = (r.performerEmail || '').toLowerCase().trim();
      const key = `${normDate}_${emailLower}`;

      let dayOfWeek = r.day;
      try {
        const parts = normDate.split('-').map(Number);
        if (parts.length === 3) {
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
        }
      } catch {}

      const cleanRec: AttendanceRecord = {
        ...r,
        date: normDate,
        day: dayOfWeek || r.day
      };

      if (!recordMap.has(key) || (r.attended === 'Yes' && recordMap.get(key)?.attended !== 'Yes')) {
        recordMap.set(key, cleanRec);
      }
    });

  let addedCount = 0;

  calendarEvents.forEach(evt => {
    const eventDate = normalizeDateString(evt.date);
    // Ignore events before baselineDate or non-rehearsal days
    if (!eventDate || eventDate < baselineDate || !isRehearsalDay(eventDate)) return;

    // Build map of attendee email -> RSVP status from Google Calendar event if available
    const attendeeRsvpMap = new Map<string, 'Yes' | 'No' | 'Maybe' | 'Awaiting'>();
    if (evt.attendees && Array.isArray(evt.attendees)) {
      evt.attendees.forEach(a => {
        if (!a.email) return;
        const statusStr = String(a.responseStatus || '').toLowerCase();
        let rsvp: 'Yes' | 'No' | 'Maybe' | 'Awaiting' = 'Awaiting';
        if (statusStr === 'accepted' || statusStr === 'yes') rsvp = 'Yes';
        else if (statusStr === 'declined' || statusStr === 'no') rsvp = 'No';
        else if (statusStr === 'tentative' || statusStr === 'maybe') rsvp = 'Maybe';
        attendeeRsvpMap.set(a.email.toLowerCase().trim(), rsvp);
      });
    }

    // Calculate Month Key e.g. "August 2026"
    let monthKey = '';
    try {
      const parts = eventDate.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    } catch {
      monthKey = 'August 2026';
    }
    if (!monthKey) monthKey = 'August 2026';

    let dayOfWeek = 'Mon';
    try {
      const parts = eventDate.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      }
    } catch {
      dayOfWeek = 'Mon';
    }

    performers.forEach(p => {
      const key = `${eventDate}_${p.email.toLowerCase().trim()}`;
      const calRsvp = attendeeRsvpMap.get(p.email.toLowerCase().trim());
      const existing = recordMap.get(key);

      if (!existing) {
        const rsvpVal = calRsvp || 'Awaiting';
        recordMap.set(key, {
          id: `gcal_rec_${eventDate}_${p.id}_${Math.random().toString(36).substring(2, 6)}`,
          date: eventDate,
          day: dayOfWeek,
          performerName: p.name,
          performerEmail: p.email,
          rsvp: rsvpVal,
          attended: 'No',
          fees: rsvpVal === 'Yes' ? 5 : (feeRules.unconfirmedFee ?? 5),
          notes: calRsvp 
            ? `Auto-populated from Google Calendar (RSVP: ${calRsvp})` 
            : `Past practice record (Date: ${eventDate})`,
          monthKey
        });
        addedCount++;
      } else if (calRsvp && calRsvp !== existing.rsvp) {
        recordMap.set(key, {
          ...existing,
          rsvp: calRsvp,
          notes: `RSVP updated from Google Calendar (${calRsvp})`
        });
      }
    });
  });

  return {
    updatedRecords: Array.from(recordMap.values()),
    addedCount
  };
}
