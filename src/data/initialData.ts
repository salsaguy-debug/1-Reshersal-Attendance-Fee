import {
  Performer,
  AttendanceRecord,
  FormResponseRecord,
  ExcludedPerformer,
  PracticeEvent,
  SystemConfig,
  ReportLog
} from '../types';

export const INITIAL_CONFIG: SystemConfig = {
  companyName: 'Tradición Dance Co.',
  systemVersion: 'BTG REV 7.4',
  calendarId: 'l46591dbdq7t070djs0ta7cbac@group.calendar.google.com',
  adminEmails: ['rodriguez2113@gmail.com', 'admin@tradiciondance.org', 'director@tradiciondance.org'],
  fallbackExclusions: ['former.dancer@tradiciondance.com', 'archived.member@gmail.com'],
  baselineDate: '2026-04-01',
  feeRules: {
    excusedFee: 0,       // RSVP = No + Attended = No ($0)
    unannouncedFee: 5,   // RSVP = No + Attended = Yes ($5)
    unconfirmedFee: 5,   // RSVP = Awaiting or Maybe ($5)
    noShowPenalty: 5,    // RSVP = Yes + Attended = No ($5)
    verifiedFee: 0,      // RSVP = Yes + Attended = Yes ($0)
  },
  activeMonths: [
    'April 2026',
    'May 2026',
    'June 2026',
    'July 2026',
    'August 2026',
    'September 2026',
    'October 2026',
    'November 2026',
    'December 2026'
  ]
};

export const INITIAL_PERFORMERS: Performer[] = [];

export const INITIAL_PRACTICE_EVENTS: PracticeEvent[] = [];

export const INITIAL_FORM_RESPONSES: FormResponseRecord[] = [];

export const INITIAL_EXCLUSIONS: ExcludedPerformer[] = [];

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [];

export const INITIAL_REPORT_LOGS: ReportLog[] = [];

