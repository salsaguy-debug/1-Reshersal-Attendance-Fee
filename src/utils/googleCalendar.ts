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
    if (!res.ok) {
      throw new Error(`Calendar API returned HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      events: data.events || [],
      source: data.source || 'Google Calendar API'
    };
  } catch (err) {
    console.warn('Backend calendar API unreachable, using client-side fallback:', err);
    // Fallback baseline practice dates for Tradición Dance Co calendar ID
    const fallbackDates = [
      '2026-04-04', '2026-04-11', '2026-04-18', '2026-04-25',
      '2026-05-02', '2026-05-09', '2026-05-16', '2026-05-23', '2026-05-30',
      '2026-06-06', '2026-06-13', '2026-06-20', '2026-06-27',
      '2026-07-04', '2026-07-11', '2026-07-18', '2026-07-25',
      '2026-08-01', '2026-08-08', '2026-08-15', '2026-08-22', '2026-08-29',
      '2026-09-05', '2026-09-12', '2026-09-19', '2026-09-26',
      '2026-10-03', '2026-10-10', '2026-10-17', '2026-10-24', '2026-10-31',
      '2026-11-07', '2026-11-14', '2026-11-21', '2026-11-28'
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
  baselineDate: string = '2026-04-01'
): { updatedRecords: AttendanceRecord[]; addedCount: number } {
  if (!calendarEvents || calendarEvents.length === 0 || !performers || performers.length === 0) {
    return { updatedRecords: existingRecords, addedCount: 0 };
  }

  const recordMap = new Map<string, AttendanceRecord>();
  existingRecords.forEach(r => {
    recordMap.set(`${r.date}_${r.performerEmail.toLowerCase().trim()}`, r);
  });

  let addedCount = 0;

  calendarEvents.forEach(evt => {
    const eventDate = evt.date;
    if (!eventDate || eventDate < baselineDate) return;

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

    // Calculate Month Key e.g. "April 2026"
    let monthKey = '';
    try {
      const parts = eventDate.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    } catch {
      monthKey = 'April 2026';
    }
    if (!monthKey) monthKey = 'April 2026';

    let dayOfWeek = 'Sat';
    try {
      const parts = eventDate.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      }
    } catch {
      dayOfWeek = 'Sat';
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
            : `Auto-populated from Google Calendar ID: ${DEFAULT_CALENDAR_ID}`,
          monthKey
        });
        addedCount++;
      } else if (calRsvp && calRsvp !== existing.rsvp) {
        // Update RSVP status if calendar provides updated response status
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
