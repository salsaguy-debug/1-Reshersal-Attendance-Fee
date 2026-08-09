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

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [];

export const INITIAL_REPORT_LOGS: ReportLog[] = [];

