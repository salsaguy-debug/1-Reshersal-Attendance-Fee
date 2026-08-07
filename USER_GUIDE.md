# Tradición Dance Co. — Attendance & Fee Automation System (BTG REV 7.4)
## Complete Interactive User Guide & Function Reference

Welcome to the official User Guide for the **Tradición Dance Co. Attendance & Fee Automation System**. This document provides an exhaustive, step-by-step breakdown of every single button, dropdown menu, link, toggle, filter, and modal feature available in the application.

---

## 📋 Table of Contents
1. [Top Navigation Header & Global Toolbar](#1-top-navigation-header--global-toolbar)
2. [Actions & Tools Dropdown Menu](#2-actions--tools-dropdown-menu)
3. [Spreadsheet View (Interactive Data Grid)](#3-spreadsheet-view-interactive-data-grid)
4. [SOP BTG REV 7.4 Business Rules & Fee Calculation Engine](#4-sop-btg-rev-74-business-rules--fee-calculation-engine)
5. [Check-In Simulator](#5-check-in-simulator)
6. [Reports & Email Suite (AI Executive Summaries)](#6-reports--email-suite-ai-executive-summaries)
7. [Apps Script (Code.gs) Exporter](#7-apps-script-codegs-exporter)
8. [System Configuration Panel](#8-system-configuration-panel)
9. [Live Data Import Modal](#9-live-data-import-modal)

---

## 1. Top Navigation Header & Global Toolbar

The top header bar remains fixed at the top of your screen for immediate access to navigation and essential utilities.

| UI Element | Type | Description |
| :--- | :--- | :--- |
| **Company Brand Title** | Brand Header | Displays `Rehearsal Absences / System 7.4.0 (SOP BTG Compliance Engine)`. |
| **Auto-Save Status Indicator** | Live Badge | Displays real-time status: `Saving...` (amber spinner) when updates occur, and `Changes Saved` (green checkmark) when local storage is updated. |
| **`📊 Spreadsheet View` Button** | Navigation Button | Navigates directly to the main interactive spreadsheet grid. Highlighted when active. |
| **`📑 More Actions v` Button** | Dropdown Trigger | Opens the comprehensive **Actions & Tools Popover Menu**. |
| **`us EN / mx ES` Language Switcher** | Toggle Pill | Switches the entire application interface instantly between **English** (`EN`) and **Spanish** (`ES`). Selection is saved automatically. |
| **`⚙️` Settings Button** | Solid Icon Button | Opens the **System Configuration Panel** to edit fee rules, calendar IDs, and API settings. |
| **`☀️ / 🌙` Theme Toggle Button** | Icon Button | Switches the UI color palette between **Day Mode** (Light slate theme) and **Night Mode** (Dark slate theme). |

---

## 2. Actions & Tools Dropdown Menu

Clicking **`More Actions v`** in the top bar opens a floating popover containing KPI summary metrics, primary tools, view switches, and data management controls.

### 📊 KPI Summary Metrics Cards (2x2 Grid)
* **Company Outstanding Fees (`$`)**: Displays the total live dollar amount of unpaid SOP penalties across all performers.
* **Flagged SOP Penalty Sessions (`⚠️`)**: Displays the total number of rehearsal records where a $5 penalty was triggered.
* **Active Rehearsal Performers (`👥`)**: Displays the count of active dancers currently tracked in the system.
* **Excluded Performers (`🛡️`)**: Displays the count of blacklisted performers removed from roster fee calculations.

### 🚀 Primary Actions Section
* **`📘 User Guide & System SOP`**: Opens the interactive User Guide & SOP Decision Matrix modal.
* **`📥 Import Live (CSV / Sheet)`**: Opens the Live Data Import modal to import production records or form responses.
* **`🔄 Sync (Rev 7.4)`**: Runs the master sync algorithm across Google Calendar events, Google Form responses, and physical attendance records.
* **`🔄 Force Update & Refresh Months`**: Recalculates all 12+ monthly tabs, recalculates fee totals, and repopulates practice dates.
* **`📅 Sync Google Calendar API`**: Queries Google Calendar API v3 (or public iCal feed) to pull company rehearsal dates.
* **`🖴 Save Backup to Google Drive`**: Exports current attendance records and master summaries to Google Drive as CSV or JSON files.
* **`🛡️ Fee SOP Compliance Engine`**: Displays fee calculation decision rules and SOP BTG REV 7.4 guidelines.

### 👁️ Views & Tools Section
* **`📊 Spreadsheet View`**: Switches to the main spreadsheet view (indicated by a green dot indicator when active).
* **`☑️ Check-in Simulator`**: Switches to the attendance check-in sandbox tool.
* **`✉️ Reports & Email Suite`**: Switches to the Gemini AI executive report generator.
* **`💻 Code.gs Exporter`**: Switches to the Google Apps Script code viewer.

### 🗑️ Data Management Section
* **`🗑️ Delete All Test Data`**: Prompts a confirmation modal to clear all attendance records, responses, exclusions, and report logs.
* **`🔄 Reset Sample Baseline Data`**: Prompts a confirmation modal to restore default demo records and sample settings.

---

## 3. Spreadsheet View (Interactive Data Grid)

The Spreadsheet View emulates a live Google Sheets workbook with tabs, search tools, sorting, and inline editing.

### 🛠️ Toolbar Controls
* **`Bound Script: activeSpreadsheet`**: Confirms Google Workspace Apps Script trigger binding.
* **`Viewing sheet tab: [Tab Name]`**: Shows the active tab name (dynamically translated into Spanish when language is set to ES).
* **`🔄 Force Update Months`**: Recalculates monthly totals.
* **`📥 Export CSV`**: Downloads the active tab data as a clean `.csv` file.
* **`➕ Add Performer Record`**: Opens a form to add a manual attendance entry for a performer on a specific date.
* **`👤 Exclude Performer`**: Opens a modal to add a performer to the roster exclusion blocklist.
* **`📥 Bulk CSV Import`**: Opens a text/drag-and-drop importer to blacklist multiple performers at once.
* **`🗑️ Scrub & Purge Exclusions Now`**: Immediately purges all blacklisted email addresses from all attendance tables.

### 📑 Sheet Tabs Bar
1. **`Resumen Maestro / Master Summary (Aggregate)`**: Consolidates annual total fees, monthly balances, and account statuses (`Outstanding` vs `Paid in Full`).
2. **`[Month Year]` Tabs** (e.g. `April 2026`, `May 2026`, ..., `December 2026`): Monthly attendance logs.
3. **`Respuestas del Formulario 1 / Form Responses 1`**: Log of check-ins submitted via Google Forms.
4. **`Integrantes Excluidos / Excluded these Performers`**: Roster blocklist showing exclusion reasons and date added.

### 🔍 Search & Filter Bar
* **Search Input (`🔍`)**: Instant search across performer names, email addresses, dates, and notes.
* **Filter by Performer Email**: Restricts table rows to display only records for a single selected dancer.
* **Filter by RSVP Status**: Filters records by `All RSVPs`, `Yes (Confirmed)`, `No (Excused)`, `Maybe (Tentative)`, or `Awaiting (Pending)`.
* **Filter by Attended Status**: Filters records by `All Attendance`, `Yes (Present)`, or `No (Absent)`.

---

## 4. SOP BTG REV 7.4 Business Rules & Fee Calculation Engine

The system automatically calculates performer fee penalties based on Standard Operating Procedure (SOP) BTG REV 7.4:

```text
+------------------------+-------------------+--------------------+--------------+
| RSVP Status            | Attended (Physical)| Fee Penalty ($)    | Classification|
+------------------------+-------------------+--------------------+--------------+
| Yes (Confirmed)        | Yes (Present)     | $0.00              | Verified ($0)|
| No (Excused prior)     | No (Absent)       | $0.00              | Excused ($0) |
| Awaiting / Maybe       | Yes or No         | $5.00              | Penalty ($5) |
| Yes (Confirmed)        | No (Absent)       | $5.00              | Penalty ($5) |
+------------------------+-------------------+--------------------+--------------+
```

---

## 5. Check-In Simulator

The Check-In Simulator lets you test live check-ins without opening Google Forms.

1. **Performer Dropdown**: Select a performer from the roster.
2. **Practice Date Dropdown**: Select the target rehearsal date.
3. **RSVP Status**: Choose `Yes`, `No`, `Maybe`, or `Awaiting`.
4. **Check-In Status**: Select `Yes (Present)` or `No (Absent)`.
5. **`Submit Form Check-In` Button**: Inserts a form response record, automatically creates/updates the attendance entry, and calculates fee penalties in real-time.

---

## 6. Reports & Email Suite (AI Executive Summaries)

Powered by **Google Gemini 3.6 Flash** (`@google/genai`), this module generates executive reports and email templates.

1. **Report Type Selector**:
   * `Weekly Executive Digest`
   * `Monthly Financial Audit`
   * `Performer Reminder Notice`
2. **`✨ Generate AI Executive Summary` Button**: Triggers Gemini AI to analyze attendance records, calculate total company balances, identify top performers with pending balances, and compose a professional email draft.
3. **`📧 Dispatch Email Report` Button**: Simulates dispatching the email summary to company directors via Google Workspace `MailApp`.

---

## 7. Apps Script (Code.gs) Exporter

Provides production-ready Google Apps Script code for deployment to Google Sheets.

* **`📋 Copy Code` Button**: Copies the entire `Code.gs` script to your clipboard.
* **Deployment Instructions**: Steps to paste the script into **Google Sheets > Extensions > Apps Script** and set up `onEdit` and `onFormSubmit` triggers.

---

## 8. System Configuration Panel

Access via the **`⚙️` Settings** button in the top bar.

* **Fee Rules**: Customize penalty amounts for unconfirmed RSVPs and no-shows ($5 default).
* **Google Integration Settings**: Update Google Calendar ID (`l46591dbdq7t070djs0ta7cbac@group.calendar.google.com`), Google Sheet ID, and Apps Script Webhook URL.
* **`💾 Save Configuration` Button**: Saves settings to local storage.

---

* **Import Options**: `Merge with existing data` or `Replace current dataset`.

---

## 10. Multi-User Real-Time Collaboration & Shared Storage Architecture (3-User Setup)

To allow 3 or more administrators to edit records simultaneously without losing data:

1. **Centralized Shared Database (`/api/shared-data`)**:
   - The application automatically synchronizes all attendance records, form responses, exclusions, and payment ledgers to a shared server-backed JSON store (`data/shared-database.json`).
   - Any modification made by User 1, User 2, or User 3 is saved instantly to the server database and broadcast to all connected web app clients via 3-second live background polling and window focus listeners.
   - Look for the **`🟢 Shared DB Live (3 Users Sync)`** indicator badge in the top navigation bar to confirm active real-time connection.

2. **Google Sheets Concurrent Multi-User Editing**:
   - For collaborative cloud editing, deploy the Google Apps Script (`Code.gs`) to your shared Google Sheet URL (`Google Workspace > Extensions > Apps Script`).
   - Multiple users can open and edit the same Google Sheet simultaneously in real time. The app's `Sync (Rev 7.4)` tool seamlessly pulls and merges live changes from all users.

---

## 11. Popup Fee & Attendance Calculator Widget

Access via the bottom-right floating calculator button (`🧮`) or **`More Actions v` > `Fee & Balance Calculator`**.

* **Interactive Keypad & LED Display**: Full support for basic math operations (`+`, `-`, `×`, `÷`, `%`, `±`, `.`, `AC`, `⌫`).
* **SOP Fast Preset Buttons**:
  * **`+$5 (Penalización)`**: Instantly adds the standard $5 SOP unconfirmed / no-show penalty.
  * **`+$10 (Doble)`**: Instantly adds double penalties ($10) for two unexcused absences.
* **`📋 Copy Result` Button**: Copies the calculated total directly to your clipboard for quick pasting into attendance notes or payment transaction forms.
* **Keyboard Shortcuts**: Keyboard support enabled (numbers 0-9, operators, `Enter` / `=`, `Backspace`, `Escape` to close).
