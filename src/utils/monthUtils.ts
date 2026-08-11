import { AttendanceRecord, FormResponseRecord } from '../types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Parses a month string like "April 2026" or "2026-04" into a Date object (1st of that month)
 */
export function parseMonthKeyToDate(monthKey: string): Date | null {
  if (!monthKey) return null;

  const trimmed = monthKey.trim();
  
  // Pattern: "April 2026" or "Abril 2026"
  const spaceParts = trimmed.split(/\s+/);
  if (spaceParts.length === 2) {
    const monthStr = spaceParts[0];
    const yearNum = parseInt(spaceParts[1], 10);
    if (!isNaN(yearNum)) {
      const monthIdx = MONTH_NAMES.findIndex(
        m => m.toLowerCase() === monthStr.toLowerCase()
      );
      if (monthIdx !== -1) {
        return new Date(yearNum, monthIdx, 1);
      }
    }
  }

  // Pattern: "2026-04" or "2026-04-15"
  const dashParts = trimmed.split('-').map(Number);
  if (dashParts.length >= 2 && !isNaN(dashParts[0]) && !isNaN(dashParts[1])) {
    const year = dashParts[0];
    const month = dashParts[1] - 1;
    return new Date(year, month, 1);
  }

  return null;
}

/**
 * Format Date object to standard month key string "Month YYYY" (e.g. "April 2026")
 */
export function formatMonthKey(date: Date): string {
  const monthName = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${monthName} ${year}`;
}

/**
 * Derives and chronologically sorts all available months across records, form responses, and config list.
 * Ensures all months starting from baselineDate (e.g. "2026-04-01") to latest record are present and updated.
 */
export function getDerivedMonths(
  records: AttendanceRecord[] = [],
  formResponses: FormResponseRecord[] = [],
  configuredMonths: string[] = [],
  baselineDate: string = '2026-04-01'
): string[] {
  const monthSet = new Set<string>();

  const baselineParsed = parseMonthKeyToDate(baselineDate) || new Date(2026, 3, 1);

  // 1. Collect from configured active months if on or after baseline month
  configuredMonths.forEach(m => {
    if (m && m.trim()) {
      const parsed = parseMonthKeyToDate(m.trim());
      if (parsed && parsed.getTime() >= baselineParsed.getTime()) {
        monthSet.add(m.trim());
      }
    }
  });

  // Default baseline months for 2026 starting from baseline month if empty
  if (monthSet.size === 0) {
    const startMonth = baselineParsed.getMonth();
    for (let i = startMonth; i < 12; i++) {
      monthSet.add(`${MONTH_NAMES[i]} ${baselineParsed.getFullYear()}`);
    }
  }

  // 2. Collect from records monthKey & date
  records.forEach(r => {
    if (r.monthKey) {
      const parsed = parseMonthKeyToDate(r.monthKey.trim());
      if (parsed && parsed.getTime() >= baselineParsed.getTime()) {
        monthSet.add(r.monthKey.trim());
      }
    }
    if (r.date && r.date >= baselineDate) {
      const parts = r.date.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        monthSet.add(formatMonthKey(d));
      }
    }
  });

  // 3. Collect from form responses
  formResponses.forEach(fr => {
    if (fr.practiceDate && fr.practiceDate >= baselineDate) {
      const parts = fr.practiceDate.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        monthSet.add(formatMonthKey(d));
      }
    }
  });

  // 4. Convert to Date objects, sort chronologically, and re-format
  const parsedDates: { raw: string; date: Date }[] = [];

  monthSet.forEach(m => {
    const d = parseMonthKeyToDate(m);
    if (d && d.getTime() >= baselineParsed.getTime()) {
      parsedDates.push({ raw: m, date: d });
    }
  });

  // Sort by date ascending
  parsedDates.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Deduplicate formatted strings preserving chronological order
  const result: string[] = [];
  const seenFormatted = new Set<string>();

  parsedDates.forEach(item => {
    const formatted = formatMonthKey(item.date);
    if (!seenFormatted.has(formatted)) {
      seenFormatted.add(formatted);
      result.push(formatted);
    }
  });

  return result.length > 0 ? result : ['April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026'];
}

/**
 * Formats a YYYY-MM-DD date string into standard MM-DD-YYYY format
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[2]}-${match[3]}-${match[1]}`;
  }
  return dateStr;
}

