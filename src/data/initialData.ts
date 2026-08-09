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
  googleSheetId: '19ujUnwwjcsu0NUDFhEh3nFs-axCCGJc4HEW2lT2uCAk',
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/19ujUnwwjcsu0NUDFhEh3nFs-axCCGJc4HEW2lT2uCAk/edit?usp=sharing',
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

export const INITIAL_PERFORMERS: Performer[] = [
  { id: 'p_1', name: 'Victoria E Rodriguez', email: 'vibtg18@gmail.com', role: 'Dancer' },
  { id: 'p_2', name: 'Paola Gonzalez', email: 'paolamgonzalez21@gmail.com', role: 'Dancer' },
  { id: 'p_3', name: 'Nohely Gonzales Ly', email: 'nohelytradiciones@gmail.com', role: 'Dancer' },
  { id: 'p_4', name: 'Mirelys Corsoro', email: 'ms.mirelys.m@gmail.com', role: 'Dancer' },
  { id: 'p_5', name: 'Magdiel', email: 'miranda.magdiel@gmail.com', role: 'Dancer' },
  { id: 'p_6', name: 'Meyboll Menard', email: 'meybollmg@gmail.com', role: 'Dancer' },
  { id: 'p_7', name: 'Luis Mario Febres', email: 'luismariofebres@gmail.com', role: 'Dancer' },
  { id: 'p_8', name: 'Laura María Puentes Luna', email: 'laurapuentesluna@gmail.com', role: 'Dancer' },
  { id: 'p_9', name: 'Kristen Holmes', email: 'kristencholmes@gmail.com', role: 'Dancer' },
  { id: 'p_10', name: 'Josey Miranda', email: 'jleemiranda531@gmail.com', role: 'Dancer' },
  { id: 'p_11', name: 'Jose Rivera-Bobea', email: 'jebprsj@gmail.com', role: 'Dancer' },
  { id: 'p_12', name: 'Ingrid Plata Williams', email: 'ingridplata640@gmail.com', role: 'Dancer' },
  { id: 'p_13', name: 'Aron Jimenez', email: 'huneco27@gmail.com', role: 'Dancer' },
  { id: 'p_14', name: 'Alexandra Gomez', email: 'adevalle12@gmail.com', role: 'Dancer' }
];

export const INITIAL_PRACTICE_EVENTS: PracticeEvent[] = [];

export const INITIAL_FORM_RESPONSES: FormResponseRecord[] = [];

export const INITIAL_EXCLUSIONS: ExcludedPerformer[] = [];

const REHEARSAL_DATES_2026 = [
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

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = REHEARSAL_DATES_2026.flatMap((dateStr, idx) => {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const day = d.toLocaleDateString('en-US', { weekday: 'short' });
  const todayStr = '2026-08-09';
  const isFuture = dateStr > todayStr;

  return INITIAL_PERFORMERS.map((p, pIdx) => ({
    id: `rec_init_${dateStr}_${pIdx}_${idx}`,
    date: dateStr,
    day,
    performerName: p.name,
    performerEmail: p.email,
    rsvp: 'Awaiting' as const,
    attended: 'No' as const,
    fees: isFuture ? 0 : 5,
    notes: isFuture ? `Future scheduled practice session (${dateStr})` : `Scheduled practice session (${dateStr})`,
    monthKey
  }));
});

export const INITIAL_REPORT_LOGS: ReportLog[] = [];

