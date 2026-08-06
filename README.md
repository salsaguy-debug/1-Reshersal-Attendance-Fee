# Tradición Dance Co. — Attendance & Fee Automation System (BTG REV 7.4)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-3.6_Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An enterprise-grade rehearsal attendance monitoring, RSVP tracking, dynamic performer exclusion management, and fee calculation automation system built for **Tradición Dance Co.** according to **Standard Operating Procedure (SOP) BTG REV 7.4**.

---

## 🌟 Key Features

* 📊 **Interactive Attendance Spreadsheet**: Comprehensive view of rehearsal schedules, dancer attendance statuses, RSVP responses, and automated fee assessments across rehearsal dates.
* ⚖️ **SOP BTG REV 7.4 Fee Automation**:
  * **Verified Attendance ($0)**: RSVP = "Yes" and Attended = "Yes".
  * **Excused Absence ($0)**: RSVP = "No" (Excused absence submitted prior to rehearsal).
  * **Unconfirmed Penalty ($5)**: RSVP left as "Awaiting" or "Maybe" by deadline.
  * **No-Show Penalty ($5)**: RSVP = "Yes" but failed to attend rehearsal without notice.
* 📅 **Google Calendar Integration**: Direct sync with company Google Calendar via Calendar API v3, featuring a public iCal feed fallback parser and baseline rehearsal date scheduler.
* 🤖 **AI Executive Digest & Report Generator**: Leverages **Google Gemini 3.6 Flash** to analyze attendance patterns, compute outstanding balances, generate executive reports, and draft customized performer reminder emails.
* 📑 **Google Apps Script Bridge (BTG REV 7.4)**: Embedded script viewer and live sync modal for deploying Apps Script triggers directly to Google Sheets.
* 📤 **Google Drive Backups & Exports**: Export full attendance records and balance summaries to CSV or JSON formats for archivism and offline analysis.
* ⚡ **Live Check-In Simulator**: Built-in test sandbox to simulate live attendance check-ins, guest entries, and instantaneous SOP fee calculation.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide React
* **Backend**: Node.js, Express.js, Vite Dev Middleware, esbuild
* **AI & APIs**: `@google/genai` (Gemini AI SDK), Google Calendar API v3, Google Workspace Apps Script
* **Build System**: Vite 6, tsx, esbuild

---

## 📁 Directory Structure

```text
rehearsal-attendance/
├── assets/                  # Brand assets and images
├── src/
│   ├── components/          # Reusable UI components & modals
│   │   ├── AppsScriptViewer.tsx    # Apps Script BTG REV 7.4 viewer
│   │   ├── CheckInSimulator.tsx    # Live attendance check-in sandbox
│   │   ├── ConfigPanel.tsx         # System settings & configuration
│   │   ├── LiveImportModal.tsx     # Google Sheets live import modal
│   │   ├── MoreActionsDropdown.tsx # Action menu (Exports, Sync, AI)
│   │   ├── ReportsModal.tsx        # AI Report generator modal
│   │   ├── SopRulesBanner.tsx      # SOP BTG REV 7.4 quick reference
│   │   ├── SopRulesModal.tsx       # Detailed SOP rules modal
│   │   ├── SpreadsheetView.tsx     # Interactive spreadsheet grid
│   │   └── SyncSummaryModal.tsx    # Calendar & attendance sync modal
│   ├── data/                # Initial baseline data and Apps Script code
│   │   ├── appsScriptCode.ts       # BTG REV 7.4 Apps Script definitions
│   │   └── initialData.ts          # Default performer & attendance dataset
│   ├── utils/               # Helper utilities (Calendar, Month math, i18n)
│   ├── App.tsx              # Main application entry component
│   ├── main.tsx             # React DOM root entry
│   ├── types.ts             # TypeScript interface definitions
│   └── index.css            # Tailwind CSS styling entry
├── server.ts                # Express backend server with Gemini & API routes
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript compiler configuration
├── package.json             # Project dependencies and npm scripts
├── .env.example             # Environment variables documentation template
└── LICENSE                  # MIT License
```

---

## 🚀 Quick Start & Installation

### Prerequisites

* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/rehearsal-attendance.git
cd rehearsal-attendance
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory (refer to `.env.example`):

```bash
cp .env.example .env.local
```

Fill in your configuration:

```env
# Required for AI Executive Summaries
GEMINI_API_KEY="your_gemini_api_key_here"

# Optional Google Calendar API Key
GOOGLE_CALENDAR_API_KEY="your_google_calendar_api_key_here"

# Application URL & Port
APP_URL="http://localhost:3000"
PORT=3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

---

## 📦 Building for Production

To create an optimized production build and bundle the backend server:

```bash
npm run build
```

Start the production Express server:

```bash
npm start
```

---

## 📜 Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server with Vite dev middleware (`server.ts`). |
| `npm run build` | Builds the client bundle (`vite build`) and server bundle (`esbuild`). |
| `npm start` | Launches the compiled production Node server (`dist/server.cjs`). |
| `npm run clean` | Cross-platform cleanup of output build directories. |
| `npm run lint` | Runs TypeScript type checking without emitting files (`tsc --noEmit`). |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
