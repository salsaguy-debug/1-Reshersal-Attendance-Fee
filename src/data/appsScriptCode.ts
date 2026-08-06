export const APPS_SCRIPT_REV74_CODE = `/**
 * ==============================================================================
 * Tradición Dance Co. Attendance & Fee Automation System
 * Version: BTG REV 8 (Full Calendar + Form Responses 1 Integration)
 * Platform: Google Apps Script for Google Sheets, Calendar API, MailApp
 * ==============================================================================
 * 
 * WHY CALENDAR IS REQUIRED:
 * Form Responses 1 only registers dancers who filled out a form check-in.
 * To capture April, May, June, and all practice dates, and calculate:
 *   - No-Show Penalties ($5) for RSVP=Yes but Attended=No
 *   - Unconfirmed Penalties ($5) for RSVP=Awaiting/Maybe but Attended=No
 *   - Unannounced Penalties ($5) for RSVP=No but Attended=Yes
 * The script reads scheduled rehearsals & invited dancers from Google Calendar,
 * cross-references check-ins from "Form Responses 1", and updates Monthly Tabs
 * and the Master Summary report automatically.
 */

// 1. CONFIGURATION CONSTANTS
const CONFIG = {
  CAL_ID: 'l46591dbdq7t070djs0ta7cbac@group.calendar.google.com',
  ADMIN_EMAILS: ['rodriguez2113@gmail.com', 'admin@tradiciondance.org', 'director@tradiciondance.org'],
  BASELINE_DATE: new Date('2026-04-01T00:00:00Z'),
  FALLBACK_EXCLUSIONS: ['former.dancer@tradiciondance.com', 'archived.member@gmail.com'],
  FEE_RULES: {
    EXCUSED_FEE: 0,       // RSVP = No + Attended = No ($0)
    UNANNOUNCED_FEE: 5,   // RSVP = No + Attended = Yes ($5 penalty)
    UNCONFIRMED_FEE: 5,   // RSVP = Awaiting or Maybe ($5 penalty)
    NOSHOW_FEE: 5,        // RSVP = Yes + Attended = No ($5 penalty)
    VERIFIED_FEE: 0       // RSVP = Yes + Attended = Yes ($0)
  },
  PRACTICE_KEYWORDS: ['practice', 'rehearsal', 'training', 'ensayo', 'folklorico', 'zapateado'],
  SHEETS: {
    FORM_RESPONSES: 'Form Responses 1',
    EXCLUSIONS: 'Excluded these Performers',
    MASTER_SUMMARY: 'Master Summary'
  },
  THEME_COLORS: {
    HEADER_BG: '#1e293b',
    HEADER_FG: '#ffffff',
    ACCENT_RED: '#f87171',
    ACCENT_GREEN: '#4ade80'
  }
};

/**
 * Custom UI Menu Injection when Spreadsheet Opens
 */
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('💃 Tradición REV 8')
      .addItem('🔄 Sync Calendar & Form Responses 1', 'syncCalendarAndFormResponses')
      .addSeparator()
      .addItem('🧹 Purge Excluded Performers', 'purgeExclusions')
      .addItem('📊 Rebuild Master Summary', 'rebuildMasterSummary')
      .addSeparator()
      .addItem('📧 Send Weekly Summary Report', 'sendWeeklyReport')
      .addToUi();
  } catch (e) {
    Logger.log('Non-interactive context: UI menu skipped.');
  }
}

/**
 * Automatically triggered when a Google Form is submitted
 */
function onFormSubmit(e) {
  Logger.log('Form submission detected. Syncing Calendar & Attendance...');
  syncCalendarAndFormResponses();
}

/**
 * MAIN ENGINE: Reads Calendar (April, May, June, etc.) + Form Responses 1 & calculates SOP Penalties
 */
function syncCalendarAndFormResponses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const exclusions = loadExclusions();

  // 1. Build check-in map from Form Responses 1
  const formSheet = ss.getSheetByName(CONFIG.SHEETS.FORM_RESPONSES);
  const attendanceCheckInMap = {};

  if (formSheet && formSheet.getLastRow() >= 2) {
    const headers = formSheet.getRange(1, 1, 1, formSheet.getLastColumn()).getValues()[0].map(h => String(h).toLowerCase().trim());
    let colEmail = headers.findIndex(h => h.includes('email') || h.includes('correo'));
    let colDate = headers.findIndex(h => h.includes('date') || h.includes('fecha') || h.includes('practice'));
    let colCheckIn = headers.findIndex(h => h.includes('check') || h.includes('attended') || h.includes('status'));

    if (colEmail === -1) colEmail = 1;
    if (colDate === -1) colDate = 3;
    if (colCheckIn === -1) colCheckIn = 4;

    const rawData = formSheet.getRange(2, 1, formSheet.getLastRow() - 1, formSheet.getLastColumn()).getValues();
    rawData.forEach(row => {
      const email = String(row[colEmail] || '').toLowerCase().trim();
      if (!email) return;

      let dateVal = row[colDate];
      let dateObj = dateVal instanceof Date ? dateVal : new Date(dateVal);
      if (isNaN(dateObj.getTime())) return;

      const dateStr = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      const rawAttended = String(row[colCheckIn] || '').toLowerCase().trim();
      const isAttended = (rawAttended.includes('yes') || rawAttended.includes('si') || rawAttended.includes('present') || rawAttended === '1' || rawAttended === 'true');

      attendanceCheckInMap[email + '|' + dateStr] = isAttended ? 'Yes' : 'No';
    });
  }

  // 2. Fetch Practice Events from Google Calendar (April 2026 onwards)
  const calendar = CalendarApp.getCalendarById(CONFIG.CAL_ID);
  if (!calendar) {
    Logger.log('Calendar ID not found or unauthorized: ' + CONFIG.CAL_ID);
    return;
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000)); // Next 6 months
  const events = calendar.getEvents(CONFIG.BASELINE_DATE, endDate);

  const monthlyGroupedData = {};

  events.forEach(event => {
    const title = event.getTitle().toLowerCase();
    const isPractice = CONFIG.PRACTICE_KEYWORDS.some(kw => title.includes(kw));
    if (!isPractice) return;

    const startTime = event.getStartTime();
    const dateStr = Utilities.formatDate(startTime, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const dayStr = Utilities.formatDate(startTime, Session.getScriptTimeZone(), 'EEE');
    const monthKey = Utilities.formatDate(startTime, Session.getScriptTimeZone(), 'MMMM yyyy');

    const guestList = event.getGuestList(true);
    guestList.forEach(guest => {
      const email = guest.getEmail().toLowerCase().trim();
      if (!email || exclusions.has(email)) return;

      let name = guest.getName() || email.split('@')[0];
      name = name.replace(/[._]/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());

      // Calendar RSVP Status
      let rsvpStatus = 'Awaiting';
      const nativeStatus = guest.getGuestStatus();
      if (nativeStatus === CalendarApp.GuestStatus.YES) rsvpStatus = 'Yes';
      else if (nativeStatus === CalendarApp.GuestStatus.NO) rsvpStatus = 'No';
      else if (nativeStatus === CalendarApp.GuestStatus.MAYBE) rsvpStatus = 'Maybe';

      // Actual Check-In Status from Form Responses 1 (defaults to No if absent)
      const key = email + '|' + dateStr;
      const attendedStatus = attendanceCheckInMap[key] || 'No';

      // Calculate Penalty Fee & Note
      const fee = calculateFee(rsvpStatus, attendedStatus);
      const noteStr = getFeeNote(rsvpStatus, attendedStatus, fee);

      if (!monthlyGroupedData[monthKey]) {
        monthlyGroupedData[monthKey] = [];
      }

      monthlyGroupedData[monthKey].push([
        dateStr,
        dayStr,
        \`\${name} (\${email})\`,
        rsvpStatus,
        attendedStatus,
        fee,
        noteStr
      ]);
    });
  });

  // 3. Write data to Monthly Tabs (April 2026, May 2026, June 2026, etc.)
  Object.keys(monthlyGroupedData).forEach(monthKey => {
    let monthSheet = ss.getSheetByName(monthKey) || ss.insertSheet(monthKey);
    monthSheet.clearContents();

    const headersList = [['Date', 'Day', 'Performer (Email)', 'RSVP Status', 'Attended Status', 'Fee ($)', 'Notes']];
    const rows = monthlyGroupedData[monthKey];
    rows.sort((a, b) => a[0].localeCompare(b[0])); // Chronological sort

    monthSheet.getRange(1, 1, 1, 7).setValues(headersList)
      .setBackground(CONFIG.THEME_COLORS.HEADER_BG)
      .setFontColor(CONFIG.THEME_COLORS.HEADER_FG)
      .setFontWeight('bold');

    if (rows.length > 0) {
      monthSheet.getRange(2, 1, rows.length, 7).setValues(rows);
      monthSheet.getRange(2, 6, rows.length, 1).setNumberFormat('$#,##0.00');
    }

    if (typeof monthSheet.autoResizeColumns === 'function') {
      monthSheet.autoResizeColumns(1, 7);
    }
  });

  purgeExclusions();
  rebuildMasterSummary();
  ss.toast('Calendar & Form Responses 1 successfully synced!', 'Complete');
}

/**
 * Load Exclusions
 */
function loadExclusions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const exclusionSheet = ss.getSheetByName(CONFIG.SHEETS.EXCLUSIONS);
  const exclusions = new Set(CONFIG.FALLBACK_EXCLUSIONS.map(e => String(e).toLowerCase().trim()));

  if (exclusionSheet) {
    const lastRow = exclusionSheet.getLastRow();
    if (lastRow > 1) {
      const data = exclusionSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      data.forEach(row => {
        const val = String(row[0]).toLowerCase().trim();
        if (val) exclusions.add(val);
      });
    }
  }
  return exclusions;
}

/**
 * Purge Exclusions
 */
function purgeExclusions() {
  const exclusions = loadExclusions();
  if (exclusions.size === 0) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (sheetName === CONFIG.SHEETS.FORM_RESPONSES || sheetName === CONFIG.SHEETS.EXCLUSIONS) return;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return;

    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headerRow = data[0];
    const targetColIdx = (sheetName === CONFIG.SHEETS.MASTER_SUMMARY) ? 0 : 2;

    const filteredData = [headerRow];
    for (let i = 1; i < data.length; i++) {
      const cellVal = String(data[i][targetColIdx] || '').toLowerCase();
      let isExcluded = false;
      exclusions.forEach(ex => {
        if (ex && cellVal.includes(ex)) isExcluded = true;
      });
      if (!isExcluded) filteredData.push(data[i]);
    }

    if (filteredData.length !== data.length) {
      sheet.clearContents();
      sheet.getRange(1, 1, filteredData.length, lastCol).setValues(filteredData);
    }
  });
}

/**
 * Calculate SOP REV 7.4 Fee
 */
function calculateFee(rsvp, attended) {
  const r = String(rsvp || '').toLowerCase().trim();
  const a = String(attended || '').toLowerCase().trim();
  const isAttended = (a.includes('yes') || a.includes('si') || a.includes('present') || a === '1' || a === 'true');

  if (r.includes('no') || r.includes('excused')) {
    return isAttended ? CONFIG.FEE_RULES.UNANNOUNCED_FEE : CONFIG.FEE_RULES.EXCUSED_FEE;
  }
  if (r.includes('yes') || r.includes('si') || r.includes('confirmed')) {
    return isAttended ? CONFIG.FEE_RULES.VERIFIED_FEE : CONFIG.FEE_RULES.NOSHOW_FEE;
  }
  return CONFIG.FEE_RULES.UNCONFIRMED_FEE;
}

/**
 * Note descriptor
 */
function getFeeNote(rsvp, attended, fee) {
  const r = String(rsvp || '').toLowerCase().trim();
  const a = String(attended || '').toLowerCase().trim();
  const isAttended = (a.includes('yes') || a.includes('si') || a.includes('present') || a === '1' || a === 'true');

  if (r.includes('no') || r.includes('excused')) {
    return isAttended ? \`SOP Rev 7.4 Penalty: Unannounced ($\${fee})\` : 'Excused ($0)';
  }
  if (r.includes('yes') || r.includes('si') || r.includes('confirmed')) {
    return isAttended ? 'Verified ($0)' : \`SOP Rev 7.4 Penalty: No-Show ($\${fee})\`;
  }
  return \`SOP Rev 7.4 Penalty: Unconfirmed ($\${fee})\`;
}

/**
 * Rebuild Master Summary
 */
function rebuildMasterSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let masterSheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_SUMMARY) || ss.insertSheet(CONFIG.SHEETS.MASTER_SUMMARY);

  const sheets = ss.getSheets();
  const summaryMap = {};

  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (name === CONFIG.SHEETS.MASTER_SUMMARY || name === CONFIG.SHEETS.FORM_RESPONSES || name === CONFIG.SHEETS.EXCLUSIONS) {
      return;
    }
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    data.forEach(row => {
      const performerStr = String(row[2] || '').trim();
      if (!performerStr) return;

      const emailMatch = performerStr.match(/\\(([^)]+)\\)/);
      const email = emailMatch ? emailMatch[1].trim().toLowerCase() : performerStr.toLowerCase();
      const fee = parseFloat(row[5]) || 0;

      if (!summaryMap[email]) {
        summaryMap[email] = { name: performerStr, totalFees: 0, count: 0 };
      }
      summaryMap[email].totalFees += fee;
      summaryMap[email].count += 1;
    });
  });

  masterSheet.clearContents();
  const summaryRows = [['Performer / Email', 'Total Rehearsals', 'Outstanding Balance ($)', 'Status']];

  Object.keys(summaryMap).sort().forEach(email => {
    const item = summaryMap[email];
    const statusStr = item.totalFees > 0 ? '⚠️ Balance Due' : '✅ Cleared';
    summaryRows.push([item.name, item.count, item.totalFees, statusStr]);
  });

  masterSheet.getRange(1, 1, summaryRows.length, 4).setValues(summaryRows);
  masterSheet.getRange(1, 1, 1, 4)
    .setBackground(CONFIG.THEME_COLORS.HEADER_BG)
    .setFontColor(CONFIG.THEME_COLORS.HEADER_FG)
    .setFontWeight('bold');

  if (summaryRows.length > 1) {
    masterSheet.getRange(2, 3, summaryRows.length - 1, 1).setNumberFormat('$#,##0.00');
  }

  if (typeof masterSheet.autoResizeColumns === 'function') {
    masterSheet.autoResizeColumns(1, 4);
  }
}

/**
 * Weekly Report
 */
function sendWeeklyReport() {
  rebuildMasterSummary();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_SUMMARY);

  if (!masterSheet || masterSheet.getLastRow() < 2) return;

  const data = masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, 4).getValues();
  let totalBalance = 0;
  let delinquentCount = 0;
  let tableHtml = \`<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: sans-serif;">
    <tr style="background-color: \${CONFIG.THEME_COLORS.HEADER_BG}; color: white;">
      <th>Performer / Email</th><th>Rehearsals</th><th>Balance</th><th>Status</th>
    </tr>\`;

  data.forEach(row => {
    const balance = parseFloat(row[2]) || 0;
    totalBalance += balance;
    if (balance > 0) delinquentCount++;

    const rowBg = balance > 0 ? '#fef2f2' : '#ffffff';
    tableHtml += \`<tr style="background-color: \${rowBg};">
      <td>\${row[0]}</td>
      <td style="text-align: center;">\${row[1]}</td>
      <td style="text-align: right;">$\${balance.toFixed(2)}</td>
      <td>\${row[3]}</td>
    </tr>\`;
  });
  tableHtml += '</table>';

  const bodyHtml = \`
    <h2>💃 Tradición Dance Co. - Weekly Balance Report</h2>
    <p><b>Date:</b> \${new Date().toLocaleDateString()}</p>
    <p><b>Total Outstanding Fees:</b> $\${totalBalance.toFixed(2)}<br>
    <b>Performers with Balance Due:</b> \${delinquentCount}</p>
    \${tableHtml}
  \`;

  CONFIG.ADMIN_EMAILS.forEach(email => {
    try {
      MailApp.sendEmail({
        to: email,
        subject: \`[Tradición REV 8] Weekly Financial Summary - $\${totalBalance.toFixed(2)} Due\`,
        htmlBody: bodyHtml
      });
    } catch (e) {
      Logger.log(\`Failed sending email to \${email}: \` + e.message);
    }
  });
}
`;
