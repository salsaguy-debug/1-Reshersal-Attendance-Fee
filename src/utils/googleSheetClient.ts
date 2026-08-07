export async function fetchLiveGoogleSheetData(
  sheetId: string = '19ujUnwwjcsu0NUDFhEh3nFs-axCCGJc4HEW2lT2uCAk'
): Promise<any[]> {
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  try {
    const res = await fetch(gvizUrl);
    if (!res.ok) return [];
    const csvText = await res.text();
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const parseCsvLine = (text: string) => {
      const result: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim().replace(/^"|"$/g, ''));
          cur = "";
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const responses: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length >= 4) {
        const timestamp = cols[0] || new Date().toISOString();
        const rawDate = cols[1] || "";
        const performerName = cols[2] || "";
        const performerEmail = cols[3] || "";
        const attendingNotes = cols[4] || "Verified Form Submission";

        let practiceDate = rawDate;
        if (rawDate.includes('/')) {
          const parts = rawDate.split('/');
          if (parts.length === 3) {
            const m = parts[0].padStart(2, '0');
            const d = parts[1].padStart(2, '0');
            const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            practiceDate = `${y}-${m}-${d}`;
          }
        }

        if (performerEmail && performerEmail.includes('@')) {
          responses.push({
            id: `fr_live_${i}`,
            timestamp,
            performerEmail: performerEmail.trim().toLowerCase(),
            performerName: performerName.trim() || performerEmail.split('@')[0],
            practiceDate,
            checkInStatus: 'Yes',
            rsvpStatus: 'Yes',
            notes: attendingNotes
          });
        }
      }
    }
    return responses;
  } catch (err) {
    console.warn('Client Google Sheet GViz fetch error:', err);
    return [];
  }
}
