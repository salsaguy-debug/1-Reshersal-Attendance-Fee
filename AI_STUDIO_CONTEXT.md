# 🤖 Google AI Studio Context & Quick-Start Guide
## Tradición Dance Co. — Rehearsal Attendance & SOP Fee Ledger (BTG REV 7.4)

### 📌 Project Overview
This repository contains the enterprise attendance tracking, Google Calendar sync, and SOP fee ledger for **Tradición Dance Co.**

* **GitHub Repository**: [https://github.com/salsaguy-debug/1-Reshersal-Attendance-Fee](https://github.com/salsaguy-debug/1-Reshersal-Attendance-Fee)
* **Live GitHub Pages App**: [https://salsaguy-debug.github.io/1-Reshersal-Attendance-Fee/](https://salsaguy-debug.github.io/1-Reshersal-Attendance-Fee/)

---

### 📋 COPY-PASTE SYSTEM PROMPT FOR GOOGLE AI STUDIO

Copy and paste the text block below into Google AI Studio when starting a chat session:

```text
You are assisting with the Tradición Dance Co. Rehearsal Attendance & SOP Fee Ledger web application (built with React 19, TypeScript, Vite, Tailwind CSS, Node.js/Express, and Google Calendar API).

Key Rules & Features:
1. Standard Operating Procedure (SOP BTG REV 7.4):
   - Practice Days: Mondays & Wednesdays.
   - Verified Present (RSVP: Yes, Attended: Yes) = $0.00
   - Excused Absence (RSVP: No, Attended: No) = $0.00
   - Tentative Notice (RSVP: Maybe, Attended: No) = $0.00
   - Unconfirmed Penalty (RSVP: Awaiting, Attended: No) = $5.00
   - No-Show Penalty (RSVP: Yes, Attended: No) = $5.00

2. Exact 5-Column Table Layout:
   All performer ledger tables use the exact 5-column structure:
   [ # | Practice Date & Day | Calendar RSVP Response | Physical Attendance | SOP Fee Status ]

3. State & Sync Preservation:
   - User dropdown edits set `isUserModified: true` and persist immediately to localStorage and /api/shared-data.
   - Background polling (15s timer) and runSyncAlgorithm pause for 10 seconds following any local mutation (`lastMutationTimeRef`).
   - Sync never overwrites user-modified records.

4. Email Dispatch Options:
   - Provides direct Gmail Web compose window (`https://mail.google.com/mail/?view=cm...`), Outlook Web, and desktop Mail App (`mailto:` with length truncation protection).

Please help me implement feature additions, bug fixes, or optimizations while maintaining full TypeScript type safety (npm run lint ; npm run build).
```

---

### 🛠️ Quick CLI Commands for AI Studio Terminal
```bash
# 1. Install dependencies
npm install

# 2. Run local dev server (http://localhost:5173)
npm run dev

# 3. Lint and Build check
npm run lint ; npm run build

# 4. Commit and push changes
git add .
git commit -m "Update features from AI Studio"
git push origin main
```
