export type RsvpStatus = 'Yes' | 'No' | 'Maybe' | 'Awaiting';
export type AttendedStatus = 'Yes' | 'No';

export interface Performer {
  id: string;
  name: string;
  email: string;
  role: 'Dancer' | 'Lead' | 'Soloist' | 'Apprentice' | 'Choreographer';
  phone?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  day: string;  // Mon, Tue, etc.
  monthKey: string; // e.g. "April 2026"
  performerName: string;
  performerEmail: string;
  rsvp: RsvpStatus;
  attended: AttendedStatus;
  fees: number;
  notes?: string;
}

export interface MasterSummaryRow {
  performerName: string;
  performerEmail: string;
  monthlyFees: Record<string, number>; // e.g. { "April 2026": 5, "May 2026": 0 }
  totalFees: number;
  unpaidCount: number;
  status: 'Paid' | 'Outstanding';
}

export interface FormResponseRecord {
  id: string;
  timestamp: string;
  performerEmail: string;
  performerName: string;
  practiceDate: string;
  checkInStatus: 'Yes' | 'No';
  rsvpStatus?: RsvpStatus;
  notes?: string;
}

export interface ExcludedPerformer {
  email: string;
  name: string;
  reason: string;
  addedDate: string;
}

export interface PracticeEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location: string;
  type: 'Practice' | 'Rehearsal' | 'Training';
  invitedCount: number;
}

export interface SystemConfig {
  calendarId: string;
  adminEmails: string[];
  fallbackExclusions: string[];
  baselineDate: string;
  feeRules: {
    excusedFee: number;       // RSVP = No + Attended = No -> $0
    unannouncedFee?: number;   // RSVP = No + Attended = Yes -> $5
    unconfirmedFee: number;   // RSVP = Awaiting or Maybe -> $5
    noShowPenalty: number;    // RSVP = Yes + Attended = No -> $5
    verifiedFee: number;      // RSVP = Yes + Attended = Yes -> $0
  };
  activeMonths: string[];
  companyName: string;
  systemVersion: string;
}

export interface ReportLog {
  id: string;
  type: 'Weekly' | 'Monthly Final';
  sentAt: string;
  recipients: string[];
  summaryText: string;
  totalOutstanding: number;
}
