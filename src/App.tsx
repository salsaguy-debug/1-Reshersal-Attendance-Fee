import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Mail,
  ClipboardCheck,
  Code2,
  Settings,
  RefreshCw,
  Sparkles,
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Sun,
  Moon,
  Globe,
  FileUp,
  Calculator
} from 'lucide-react';

import logoImg from './assets/logo.jpg';
import { PerformerDetailView, PaymentTransaction } from './components/PerformerDetailView';

import {
  Performer,
  AttendanceRecord,
  MasterSummaryRow,
  FormResponseRecord,
  ExcludedPerformer,
  RsvpStatus,
  AttendedStatus,
  SystemConfig,
  ReportLog
} from './types';

import {
  INITIAL_CONFIG,
  INITIAL_PERFORMERS,
  INITIAL_PRACTICE_EVENTS,
  INITIAL_FORM_RESPONSES,
  INITIAL_EXCLUSIONS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_REPORT_LOGS
} from './data/initialData';

import {
  fetchGoogleCalendarEvents,
  populateMissingRehearsalDates,
  DEFAULT_CALENDAR_ID
} from './utils/googleCalendar';

import { translations, Language } from './utils/translations';
import { getDerivedMonths, formatMonthKey } from './utils/monthUtils';
import { SopRulesBanner } from './components/SopRulesBanner';
import { SopRulesModal } from './components/SopRulesModal';
import { SpreadsheetView } from './components/SpreadsheetView';
import { CheckInSimulator } from './components/CheckInSimulator';
import { ReportsModal } from './components/ReportsModal';
import { AppsScriptViewer } from './components/AppsScriptViewer';
import { ConfigPanel } from './components/ConfigPanel';
import { LiveImportModal } from './components/LiveImportModal';
import { MoreActionsDropdown } from './components/MoreActionsDropdown';
import { SyncSummaryModal, SyncStats } from './components/SyncSummaryModal';
import { CalculatorWidget } from './components/CalculatorWidget';
import { fetchLiveGoogleSheetData } from './utils/googleSheetClient';

export default function App() {
  const [config, setConfig] = useState<SystemConfig>(() => {
    try {
      const saved = localStorage.getItem('tradicion_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_CONFIG,
          ...parsed,
          googleSheetId: parsed.googleSheetId || INITIAL_CONFIG.googleSheetId,
          googleSheetUrl: parsed.googleSheetUrl || INITIAL_CONFIG.googleSheetUrl
        };
      }
      return INITIAL_CONFIG;
    } catch {
      return INITIAL_CONFIG;
    }
  });

  const [performers, setPerformers] = useState<Performer[]>(() => {
    try {
      const saved = localStorage.getItem('tradicion_performers');
      return saved ? JSON.parse(saved) : INITIAL_PERFORMERS;
    } catch {
      return INITIAL_PERFORMERS;
    }
  });

  const [practices] = useState(INITIAL_PRACTICE_EVENTS);

  // Theme & Language State with persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('tradicion_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('tradicion_lang');
      return (saved === 'es' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const t = translations[lang];

  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tradicion_records');
      const parsed = saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
      const legacySat = new Set(['2026-04-04', '2026-04-11', '2026-04-18', '2026-04-25']);
      return Array.isArray(parsed)
        ? parsed.filter((r: AttendanceRecord) => !legacySat.has(r.date) && r.day !== 'Sat' && r.day !== 'Saturday')
        : INITIAL_ATTENDANCE_RECORDS;
    } catch {
      return INITIAL_ATTENDANCE_RECORDS;
    }
  });

  const [formResponses, setFormResponses] = useState<FormResponseRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tradicion_form_responses');
      return saved ? JSON.parse(saved) : INITIAL_FORM_RESPONSES;
    } catch {
      return INITIAL_FORM_RESPONSES;
    }
  });

  const [exclusions, setExclusions] = useState<ExcludedPerformer[]>(() => {
    try {
      const saved = localStorage.getItem('tradicion_exclusions');
      return saved ? JSON.parse(saved) : INITIAL_EXCLUSIONS;
    } catch {
      return INITIAL_EXCLUSIONS;
    }
  });

  const [reportLogs, setReportLogs] = useState<ReportLog[]>(() => {
    try {
      const saved = localStorage.getItem('tradicion_report_logs');
      return saved ? JSON.parse(saved) : INITIAL_REPORT_LOGS;
    } catch {
      return INITIAL_REPORT_LOGS;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('Master Summary');
  const [activeView, setActiveView] = useState<'sheet' | 'performer' | 'reports' | 'checkin' | 'script' | 'config'>('sheet');
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [showSopModal, setShowSopModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounced Auto-Save Status & Multi-User Real-Time Sync State
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [sharedSyncStatus, setSharedSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [sharedRevision, setSharedRevision] = useState<number>(1);
  const isFirstRender = useRef(true);
  const isRemoteUpdating = useRef(false);

  // Initial Boot Sync & Background Auto-Sync Engine
  useEffect(() => {
    let isSubscribed = true;

    const initBootSync = async () => {
      let isBackendConnected = false;
      try {
        const res = await fetch('/api/shared-data');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const sData = json.data;
            isRemoteUpdating.current = true;
            if (sData.config) setConfig(sData.config);
            if (Array.isArray(sData.records) && sData.records.length > 0) {
              const legacySat = new Set(['2026-04-04', '2026-04-11', '2026-04-18', '2026-04-25']);
              setRecords(sData.records.filter((r: AttendanceRecord) => !legacySat.has(r.date)));
            }
            if (Array.isArray(sData.formResponses) && sData.formResponses.length > 0) setFormResponses(sData.formResponses);
            if (Array.isArray(sData.exclusions) && sData.exclusions.length > 0) setExclusions(sData.exclusions);
            if (Array.isArray(sData.reportLogs) && sData.reportLogs.length > 0) setReportLogs(sData.reportLogs);
            if (Array.isArray(sData.performers) && sData.performers.length > 0) setPerformers(sData.performers);
            if (Array.isArray(sData.payments) && sData.payments.length > 0) setPayments(sData.payments);
            if (json.revision) setSharedRevision(json.revision);
            setSharedSyncStatus('connected');
            isBackendConnected = true;
            setTimeout(() => { isRemoteUpdating.current = false; }, 350);
          }
        }
      } catch (err) {
        console.warn('Shared DB endpoint offline (GitHub Pages static host), switching to direct Live Google Sheet sync:', err);
      }

      // If backend API is not present (GitHub Pages static site), run direct live Google Sheet sync immediately
      if (!isBackendConnected && isSubscribed) {
        setSharedSyncStatus('connected');
        await runSyncAlgorithm({ silent: true });
      }
    };

    initBootSync();

    // Instant Scrub of Legacy Saturday Fallback Dates
    const legacySat = new Set(['2026-04-04', '2026-04-11', '2026-04-18', '2026-04-25']);
    setRecords(prev => prev.filter(r => !legacySat.has(r.date)));

    // 15-second background auto-sync timer for multi-browser real-time parity
    const syncInterval = setInterval(() => {
      if (isSubscribed) {
        runSyncAlgorithm({ silent: true });
      }
    }, 15000);

    return () => {
      isSubscribed = false;
      clearInterval(syncInterval);
    };
  }, []);

  // Helper to extract & sync unique performers list from attendance records and form responses
  const derivePerformersList = (
    currentPerformers: Performer[],
    attRecords: AttendanceRecord[],
    responses: FormResponseRecord[]
  ): Performer[] => {
    const map = new Map<string, Performer>();

    currentPerformers.forEach(p => {
      if (p.email && p.email.includes('@')) {
        map.set(p.email.toLowerCase().trim(), p);
      }
    });

    attRecords.forEach(r => {
      const emailKey = (r.performerEmail || '').toLowerCase().trim();
      if (emailKey && emailKey.includes('@') && !map.has(emailKey)) {
        map.set(emailKey, {
          id: `p_${Math.random().toString(36).substring(2, 7)}`,
          name: r.performerName || emailKey.split('@')[0],
          email: r.performerEmail.trim(),
          role: 'Dancer'
        });
      }
    });

    responses.forEach(fr => {
      const emailKey = (fr.performerEmail || '').toLowerCase().trim();
      if (emailKey && emailKey.includes('@') && !map.has(emailKey)) {
        map.set(emailKey, {
          id: `p_${Math.random().toString(36).substring(2, 7)}`,
          name: fr.performerName || emailKey.split('@')[0],
          email: fr.performerEmail.trim(),
          role: 'Dancer'
        });
      }
    });

    return Array.from(map.values());
  };

  // Debounced Auto-Save to LocalStorage & Centralized Server Database (3-User Shared Real-Time Storage)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isRemoteUpdating.current) return;

    setAutoSaveStatus('saving');
    setSharedSyncStatus('syncing');

    const saveTimer = setTimeout(async () => {
      try {
        localStorage.setItem('tradicion_config', JSON.stringify(config));
        localStorage.setItem('tradicion_records', JSON.stringify(records));
        localStorage.setItem('tradicion_form_responses', JSON.stringify(formResponses));
        localStorage.setItem('tradicion_exclusions', JSON.stringify(exclusions));
        localStorage.setItem('tradicion_report_logs', JSON.stringify(reportLogs));
        localStorage.setItem('tradicion_performers', JSON.stringify(performers));
        localStorage.setItem('tradicion_theme', theme);
        localStorage.setItem('tradicion_lang', lang);
        setAutoSaveStatus('saved');

        // Broadcast changes to shared real-time server database for all 3 users
        const res = await fetch('/api/shared-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config,
            records,
            formResponses,
            exclusions,
            reportLogs,
            performers,
            payments,
            clientRevision: sharedRevision
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.revision) setSharedRevision(json.revision);
          setSharedSyncStatus('connected');
        }
      } catch (e) {
        console.error('Failed to sync state to shared server database:', e);
        setAutoSaveStatus('idle');
        setSharedSyncStatus('offline');
      }
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [config, records, formResponses, exclusions, reportLogs, performers, payments, theme, lang]);

  // Real-Time 3-User Polling & Sync Listener (Polls shared database every 3 seconds & on tab focus)
  useEffect(() => {
    const pollSharedDatabase = async () => {
      if (isRemoteUpdating.current) return;
      try {
        const res = await fetch('/api/shared-data/status');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.revision && json.revision > sharedRevision) {
            console.log(`[Real-Time Sync] Detected remote update (Rev ${json.revision} > local Rev ${sharedRevision}). Pulling shared state...`);
            const dataRes = await fetch('/api/shared-data');
            if (dataRes.ok) {
              const dataJson = await dataRes.json();
              if (dataJson.success && dataJson.data) {
                const sData = dataJson.data;
                isRemoteUpdating.current = true;
                if (sData.config) setConfig(sData.config);
                if (Array.isArray(sData.records)) setRecords(sData.records);
                if (Array.isArray(sData.formResponses)) setFormResponses(sData.formResponses);
                if (Array.isArray(sData.exclusions)) setExclusions(sData.exclusions);
                if (Array.isArray(sData.reportLogs)) setReportLogs(sData.reportLogs);
                if (Array.isArray(sData.performers)) setPerformers(sData.performers);
                if (Array.isArray(sData.payments)) setPayments(sData.payments);
                setSharedRevision(dataJson.revision);
                setSharedSyncStatus('connected');
                setTimeout(() => { isRemoteUpdating.current = false; }, 350);
              }
            }
          }
        }
      } catch (err) {
        // Silently handle polling disconnects
      }
    };

    const intervalId = setInterval(pollSharedDatabase, 3000);
    const handleFocus = () => pollSharedDatabase();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [sharedRevision]);

  // Keep 'saved' status visible for 3 seconds before resetting to idle
  useEffect(() => {
    if (autoSaveStatus === 'saved') {
      const resetTimer = setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
      return () => clearTimeout(resetTimer);
    }
  }, [autoSaveStatus]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const resetAllDataToDefault = () => {
    setConfirmModal({
      isOpen: true,
      title: lang === 'es' ? 'Restablecer Datos de Muestra' : 'Reset Sample Baseline Data',
      message: lang === 'es'
        ? '¿Estás seguro de que deseas restablecer todos los registros y la configuración a los datos de prueba predeterminados?'
        : 'Are you sure you want to reset all app records and settings to the default sample baseline data?',
      confirmText: lang === 'es' ? 'Sí, Restablecer Datos' : 'Yes, Reset Baseline Data',
      isDanger: false,
      onConfirm: () => {
        localStorage.removeItem('tradicion_config');
        localStorage.removeItem('tradicion_records');
        localStorage.removeItem('tradicion_form_responses');
        localStorage.removeItem('tradicion_exclusions');
        localStorage.removeItem('tradicion_report_logs');
        setConfig(INITIAL_CONFIG);
        setRecords(INITIAL_ATTENDANCE_RECORDS);
        setFormResponses(INITIAL_FORM_RESPONSES);
        setExclusions(INITIAL_EXCLUSIONS);
        setReportLogs(INITIAL_REPORT_LOGS);
        showToast(lang === 'es' ? 'Se restablecieron todos los datos predeterminados.' : 'All app data has been reset to defaults.');
        setConfirmModal(null);
      }
    });
  };

  const deleteAllTestData = () => {
    setConfirmModal({
      isOpen: true,
      title: lang === 'es' ? 'Eliminar Todos los Datos de Prueba' : 'Delete All Test Data',
      message: lang === 'es'
        ? '¿Estás seguro de que deseas eliminar TODOS los datos? Esto vaciará completamente todos los registros de asistencia, respuestas de formulario, exclusiones y reportes.'
        : 'Are you sure you want to delete ALL test data? This will completely clear all attendance records, form responses, exclusions, and email report logs.',
      confirmText: lang === 'es' ? 'Sí, Eliminar Todo' : 'Yes, Delete All Test Data',
      isDanger: true,
      onConfirm: () => {
        setRecords([]);
        setFormResponses([]);
        setExclusions([]);
        setReportLogs([]);
        setPerformers([]);
        localStorage.removeItem('tradicion_records');
        localStorage.removeItem('tradicion_form_responses');
        localStorage.removeItem('tradicion_exclusions');
        localStorage.removeItem('tradicion_report_logs');
        localStorage.removeItem('tradicion_performers');
        showToast(lang === 'es' ? 'Se eliminaron todos los datos de prueba.' : 'All test data has been deleted.');
        setConfirmModal(null);
      }
    });
  };

  // Fee calculation engine matching SOP BTG REV 7.4 / REV 8
  const calculateSopFee = (rsvp: RsvpStatus | string, attended: AttendedStatus | string): number => {
    const r = String(rsvp || '').trim().toLowerCase();
    const a = String(attended || '').trim().toLowerCase();
    const isAttended = a === 'yes' || a === 'present' || a === '1' || a === 'true';

    if (r === 'no' || r === 'excused') {
      return isAttended ? (config.feeRules.unannouncedFee ?? 5) : config.feeRules.excusedFee;
    }
    if (r === 'awaiting' || r === 'maybe' || r === 'tentative' || r === 'unconfirmed' || r === '') {
      return config.feeRules.unconfirmedFee ?? 5;
    }
    if (r === 'yes' || r === 'confirmed') {
      return isAttended ? config.feeRules.verifiedFee : config.feeRules.noShowPenalty;
    }
    return config.feeRules.unconfirmedFee ?? 5;
  };

  const getFeeNote = (rsvp: RsvpStatus | string, attended: AttendedStatus | string, fee: number): string => {
    const r = String(rsvp || '').trim().toLowerCase();
    const a = String(attended || '').trim().toLowerCase();
    const isAttended = a === 'yes' || a === 'present' || a === '1' || a === 'true';

    if (fee === 0) {
      if (r === 'no' || r === 'excused') return 'Excused Absence ($0)';
      return 'Verified Present ($0)';
    }

    if ((r === 'no' || r === 'excused') && isAttended) {
      return `Unannounced Attendance penalty (RSVP No but Attended = $${fee})`;
    }

    if ((r === 'yes' || r === 'confirmed') && !isAttended) {
      return `No-show penalty (RSVP Yes but Attended No = $${fee})`;
    }

    if (r === 'awaiting' || r === 'maybe' || r === 'tentative' || r === 'unconfirmed' || r === '') {
      return `Unconfirmed status penalty (RSVP: ${rsvp || 'Awaiting'} = $${fee})`;
    }

    return `Unconfirmed status penalty ($${fee})`;
  };

  // Rebuild Master Summary
  const masterSummary: MasterSummaryRow[] = useMemo(() => {
    const map: Record<string, MasterSummaryRow> = {};

    records.forEach(r => {
      const email = r.performerEmail.toLowerCase();
      if (!map[email]) {
        map[email] = {
          performerName: r.performerName,
          performerEmail: r.performerEmail,
          monthlyFees: {},
          totalFees: 0,
          unpaidCount: 0,
          status: 'Paid'
        };
      }

      const currentMonthly = map[email].monthlyFees[r.monthKey] || 0;
      map[email].monthlyFees[r.monthKey] = currentMonthly + r.fees;
      map[email].totalFees += r.fees;
      if (r.fees > 0) map[email].unpaidCount += 1;
    });

    Object.values(map).forEach(m => {
      m.status = m.totalFees > 0 ? 'Outstanding' : 'Paid';
    });

    return Object.values(map);
  }, [records]);

  // Derived available months across records, form responses, and active months config
  const availableMonths = useMemo(() => {
    return getDerivedMonths(records, formResponses, config.activeMonths, config.baselineDate || '2026-04-01');
  }, [records, formResponses, config.activeMonths, config.baselineDate]);

  // Explicit Force Refresh & Update All Month Tabs & Attendance Records
  const handleForceUpdateMonths = async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch latest Google Calendar events
      const { events, source } = await fetchGoogleCalendarEvents(DEFAULT_CALENDAR_ID);
      const baseline = config.baselineDate || '2026-04-01';
      const { updatedRecords: baseRecords, addedCount } = populateMissingRehearsalDates(
        records,
        performers,
        events,
        config.feeRules,
        baseline
      );

      // 2. Normalize and ensure all records have valid monthKey properties, filtering out records prior to baselineDate and fake legacy Saturdays
      const legacySaturdayDates = new Set(['2026-04-04', '2026-04-11', '2026-04-18', '2026-04-25']);
      const normalizedRecords = baseRecords
        .filter(r => !r.date || r.date >= baseline)
        .filter(r => !legacySaturdayDates.has(r.date))
        .map(r => {
          let monthKey = r.monthKey;
          if (!monthKey && r.date) {
            try {
              const parts = r.date.split('-').map(Number);
              if (parts.length === 3) {
                const d = new Date(parts[0], parts[1] - 1, parts[2]);
                monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              }
            } catch {}
          }
          return {
            ...r,
            monthKey: monthKey || 'August 2026'
          };
        });

      // 3. Derive full chronological set of months starting from baselineDate
      const refreshedMonths = getDerivedMonths(normalizedRecords, formResponses, config.activeMonths, baseline);

      // 4. Update records and config state
      setRecords(normalizedRecords);
      setConfig(prev => ({
        ...prev,
        activeMonths: refreshedMonths
      }));
      setPerformers(prev => derivePerformersList(prev, normalizedRecords, formResponses));

      showToast(
        lang === 'es'
          ? `¡Actualización Forzada Completada! ${refreshedMonths.length} meses sincronizados desde ${baseline} (${source}).`
          : `Force update complete! ${refreshedMonths.length} month sheets updated & synced from ${baseline} (${source}).`
      );
    } catch (err: any) {
      showToast(`Force Update Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddMonthTab = (newMonth: string) => {
    if (!newMonth || !newMonth.trim()) return;
    const formatted = newMonth.trim();
    if (!config.activeMonths.includes(formatted)) {
      setConfig(prev => ({
        ...prev,
        activeMonths: getDerivedMonths(records, formResponses, [...prev.activeMonths, formatted], config.baselineDate || '2026-04-01')
      }));
      showToast(lang === 'es' ? `¡Pestaña de mes "${formatted}" agregada!` : `Added month sheet tab "${formatted}"!`);
    }
  };

  // Google Calendar API Sync Handler
  const handleSyncCalendarEvents = async () => {
    setIsSyncing(true);
    try {
      const { events, source } = await fetchGoogleCalendarEvents(DEFAULT_CALENDAR_ID);
      const baseline = config.baselineDate || '2026-04-01';
      const { updatedRecords, addedCount } = populateMissingRehearsalDates(
        records,
        performers,
        events,
        config.feeRules,
        baseline
      );

      if (addedCount > 0) {
        setRecords(updatedRecords);
        showToast(
          lang === 'es'
            ? `¡Se poblaron ${addedCount} fecha(s) de ensayo desde Google Calendar (${source})!`
            : `Populated ${addedCount} missing rehearsal date(s) from Google Calendar (${source})!`
        );
      } else {
        showToast(
          lang === 'es'
            ? `Todas las fechas del Google Calendar ya están al día (${events.length} eventos).`
            : `All ${events.length} Google Calendar rehearsal dates are already up to date.`
        );
      }
    } catch (err: any) {
      showToast(`Calendar Sync Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync All Data (Rev 7.4) algorithm simulation
  const runSyncAlgorithm = async (options?: { silent?: boolean }) => {
    setIsSyncing(true);

    try {
      // 0. Fetch Google Calendar events directly from calendar ID l46591dbdq7t070djs0ta7cbac@group.calendar.google.com
      const { events, source } = await fetchGoogleCalendarEvents(config.calendarId || DEFAULT_CALENDAR_ID);
      const baseline = config.baselineDate || '2026-04-01';
      const { updatedRecords: baseRecords } = populateMissingRehearsalDates(
        records,
        performers,
        events,
        config.feeRules,
        baseline
      );

      // 0.5 Direct Live Fetch from Google Sheet ID 19ujUnwwjcsu0NUDFhEh3nFs-axCCGJc4HEW2lT2uCAk (No Apps Script needed!)
      let activeFormResponses = formResponses;
      try {
        const sheetTargetId = config.googleSheetId || '19ujUnwwjcsu0NUDFhEh3nFs-axCCGJc4HEW2lT2uCAk';
        let directResponses: any[] = [];
        try {
          const sheetRes = await fetch(`/api/sheet/live-sync?sheetId=${sheetTargetId}`);
          if (sheetRes.ok) {
            const sheetData = await sheetRes.json();
            if (sheetData.success && Array.isArray(sheetData.formResponses)) {
              directResponses = sheetData.formResponses;
            }
          }
        } catch {}

        if (directResponses.length === 0) {
          directResponses = await fetchLiveGoogleSheetData(sheetTargetId);
        }

        if (directResponses.length > 0) {
          activeFormResponses = directResponses;
          setFormResponses(directResponses);
        }
      } catch (err) {
        console.warn('Direct Google Sheet fetch fallback:', err);
      }

      // 1. Load Exclusions and Purge
      const excludedEmails = new Set(exclusions.map(e => e.email.toLowerCase().trim()));

      // 2. Build attendance map and sync Form Check-Ins into Attendance Records
      const recordMap = new Map<string, AttendanceRecord>(
        baseRecords.map(r => [`${r.date}_${r.performerEmail.toLowerCase().trim()}`, r])
      );

      activeFormResponses.forEach(fr => {
        const email = fr.performerEmail.toLowerCase().trim();
        if (!email || excludedEmails.has(email)) return;

        const key = `${fr.practiceDate}_${email}`;
        const existingRec = recordMap.get(key);
        const checkInAttended: AttendedStatus = fr.checkInStatus === 'Yes' ? 'Yes' : 'No';
        const frRsvp: RsvpStatus = fr.rsvpStatus || 'Awaiting';

        let monthKey = '';
        try {
          const parts = fr.practiceDate.split('-').map(Number);
          if (parts.length === 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
        } catch {}
        if (!monthKey) monthKey = 'August 2026';

        let dayOfWeek = 'Mon';
        try {
          const parts = fr.practiceDate.split('-').map(Number);
          if (parts.length === 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
          }
        } catch {}

        if (existingRec) {
          const finalRsvp = (frRsvp && frRsvp !== 'Awaiting') ? frRsvp : existingRec.rsvp;
          const fee = calculateSopFee(finalRsvp, checkInAttended);
          recordMap.set(key, {
            ...existingRec,
            rsvp: finalRsvp,
            attended: checkInAttended,
            fees: fee,
            notes: getFeeNote(finalRsvp, checkInAttended, fee)
          });
        } else {
          const finalRsvp = frRsvp;
          const fee = calculateSopFee(finalRsvp, checkInAttended);
          recordMap.set(key, {
            id: `fr_att_${fr.practiceDate}_${Math.random().toString(36).substring(2, 6)}`,
            date: fr.practiceDate,
            day: dayOfWeek,
            monthKey,
            performerName: fr.performerName || email.split('@')[0],
            performerEmail: fr.performerEmail,
            rsvp: finalRsvp,
            attended: checkInAttended,
            fees: fee,
            notes: getFeeNote(finalRsvp, checkInAttended, fee)
          });
        }
      });

      // 3. Filter out excluded performers and legacy fake Saturday dates, then recalculate fees
      const legacySaturdayDates = new Set(['2026-04-04', '2026-04-11', '2026-04-18', '2026-04-25']);
      const updated = Array.from(recordMap.values())
        .filter(r => !excludedEmails.has(r.performerEmail.toLowerCase().trim()))
        .filter(r => !legacySaturdayDates.has(r.date))
        .map(r => {
          const fee = calculateSopFee(r.rsvp, r.attended);
          return {
            ...r,
            fees: fee,
            notes: getFeeNote(r.rsvp, r.attended, fee)
          };
        });

      const nextPerformers = derivePerformersList(performers, updated, formResponses);
      setRecords(updated);
      setPerformers(nextPerformers);

      // Build stats object for modal
      const totalOutstanding = updated.reduce((sum, r) => sum + (r.fees || 0), 0);
      const statsObj: SyncStats = {
        calendarEventsCount: events.length,
        formResponsesCount: formResponses.length,
        attendanceRecordsCount: updated.length,
        activePerformersCount: nextPerformers.length,
        totalOutstandingFees: totalOutstanding,
        excludedCount: exclusions.length,
        lastSyncedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: source || 'Google Calendar API v3'
      };

      setSyncStats(statsObj);
      setSharedSyncStatus('connected');

      if (!options?.silent) {
        setShowSyncModal(true);
        showToast(
          lang === 'es'
            ? '¡Sincronización de Google Calendar, Form Responses y Penalizaciones Completada!'
            : 'Attendance, Calendar & Fees Sync Complete! (BTG REV 7.4)'
        );
      }
    } catch (err: any) {
      if (!options?.silent) {
        showToast(`Sync Failed: ${err.message}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSimulateNewCheckIn = () => {
    // Pick a dancer from performers
    const sampleDancer = performers[0] || { name: 'Alex Rivera', email: 'alex.rivera@tradicion.org' };
    const dateStr = '2026-08-08';
    
    handleAddCheckIn(sampleDancer.email, sampleDancer.name, dateStr, 'Yes', 'Yes');
    showToast(`Inserted simulated Form Check-In for ${sampleDancer.name} on ${dateStr}! Re-running Sync...`);
    
    // Trigger sync right after
    setTimeout(() => {
      runSyncAlgorithm();
    }, 300);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportToDrive = async () => {
    showToast(lang === 'es' ? 'Exportando hoja de asistencia a Google Drive...' : 'Exporting attendance backup to Google Drive...');
    try {
      const response = await fetch('/api/drive/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: `Tradicion_Attendance_Backup_${new Date().toISOString().substring(0, 10)}.csv`,
          fileType: 'csv',
          records,
          masterSummary
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast(
          lang === 'es'
            ? `¡Guardado en Google Drive! ARCHIVO: ${data.fileName}`
            : `Saved to Google Drive! File: ${data.fileName}`
        );
      } else {
        throw new Error(data.message || 'Drive export failed');
      }
    } catch (err: any) {
      showToast(`Drive Export Error: ${err.message}`);
    }
  };

  // Record Handlers
  const handleUpdateRecord = (id: string, newRsvp: RsvpStatus, newAttended: AttendedStatus) => {
    setRecords(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          const fee = calculateSopFee(newRsvp, newAttended);
          return {
            ...r,
            rsvp: newRsvp,
            attended: newAttended,
            fees: fee,
            notes: getFeeNote(newRsvp, newAttended, fee)
          };
        }
        return r;
      });
      setPerformers(p => derivePerformersList(p, updated, formResponses));
      return updated;
    });
  };

  const handleBatchUpdateRecords = (
    ids: string[],
    updates: { rsvp?: RsvpStatus; attended?: AttendedStatus }
  ) => {
    const idSet = new Set(ids);
    setRecords(prev => {
      const updated = prev.map(r => {
        if (idSet.has(r.id)) {
          const nextRsvp = updates.rsvp !== undefined ? updates.rsvp : r.rsvp;
          const nextAttended = updates.attended !== undefined ? updates.attended : r.attended;
          const fee = calculateSopFee(nextRsvp, nextAttended);
          return {
            ...r,
            rsvp: nextRsvp,
            attended: nextAttended,
            fees: fee,
            notes: getFeeNote(nextRsvp, nextAttended, fee)
          };
        }
        return r;
      });
      setPerformers(p => derivePerformersList(p, updated, formResponses));
      return updated;
    });
    showToast(
      lang === 'es'
        ? `Se actualizaron ${ids.length} registro(s) de ensayo exitosamente.`
        : `Updated ${ids.length} rehearsal record(s) successfully.`
    );
  };

  const handleAddRecord = (monthKey: string, rec: Omit<AttendanceRecord, 'id' | 'fees'>) => {
    const fee = calculateSopFee(rec.rsvp, rec.attended);
    const newRecord: AttendanceRecord = {
      ...rec,
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      monthKey,
      fees: fee,
      notes: rec.notes || getFeeNote(rec.rsvp, rec.attended, fee)
    };
    setRecords(prev => {
      const updated = [newRecord, ...prev];
      setPerformers(p => derivePerformersList(p, updated, formResponses));
      return updated;
    });
    showToast(`Added new rehearsal record for ${rec.performerName}`);
  };

  const handleDeleteRecord = (id: string) => {
    const targetRecord = records.find(r => r.id === id);
    const performerName = targetRecord?.performerName || (lang === 'es' ? 'este registro' : 'this record');
    const dateStr = targetRecord?.date ? ` (${targetRecord.date})` : '';
    const nameWithDate = `${performerName}${dateStr}`;

    setConfirmModal({
      isOpen: true,
      title: t.confirmTitleDeleteRecord || (lang === 'es' ? 'Eliminar Registro de Asistencia' : 'Delete Attendance Record'),
      message: (t.confirmMessageDeleteRecord || (lang === 'es'
        ? '¿Estás seguro de que deseas eliminar el registro de asistencia de "{name}"? Esta acción no se puede deshacer.'
        : 'Are you sure you want to delete the attendance record for "{name}"? This action cannot be undone.'
      )).replace('{name}', nameWithDate),
      confirmText: t.confirmBtnDeleteRecord || (lang === 'es' ? 'Sí, Eliminar Registro' : 'Yes, Delete Record'),
      isDanger: true,
      onConfirm: () => {
        setRecords(prev => prev.filter(r => r.id !== id));
        showToast(lang === 'es' ? `Se eliminó el registro de ${performerName}.` : `Record for ${performerName} deleted.`);
        setConfirmModal(null);
      }
    });
  };

  // Exclusion Handlers
  const executeAddExclusion = (email: string, name: string, reason: string) => {
    const newEx: ExcludedPerformer = {
      email,
      name,
      reason,
      addedDate: new Date().toISOString().split('T')[0]
    };
    setExclusions(prev => [...prev, newEx]);

    // Immediately scrub matching rows
    setRecords(prev => prev.filter(r => r.performerEmail.toLowerCase() !== email.toLowerCase()));
    showToast(lang === 'es'
      ? `Se excluyó a ${email} y se depuraron los registros coincidentes.`
      : `Excluded ${email} and purged matching rows across all sheets.`);
  };

  const handleAddExclusion = (email: string, name: string, reason: string) => {
    const matchingCount = records.filter(r => r.performerEmail.toLowerCase() === email.toLowerCase()).length;

    if (matchingCount > 0) {
      setConfirmModal({
        isOpen: true,
        title: lang === 'es' ? 'Excluir Integrante y Depurar Registros' : 'Exclude Performer & Scrub Records',
        message: lang === 'es'
          ? `Excluir a "${name || email}" también eliminará automáticamente ${matchingCount} registro(s) de asistencia coincidentes. ¿Deseas continuar?`
          : `Excluding "${name || email}" will also automatically purge and delete ${matchingCount} matching attendance record(s). Do you want to proceed?`,
        confirmText: lang === 'es' ? 'Sí, Excluir y Depurar' : 'Yes, Exclude & Scrub',
        isDanger: true,
        onConfirm: () => {
          executeAddExclusion(email, name, reason);
          setConfirmModal(null);
        }
      });
    } else {
      executeAddExclusion(email, name, reason);
    }
  };

  const handleBulkAddExclusions = (items: Array<{ email: string; name?: string; reason?: string }>) => {
    const addedDate = new Date().toISOString().split('T')[0];
    const existingEmails = new Set(exclusions.map(e => e.email.toLowerCase().trim()));
    const newExclusions: ExcludedPerformer[] = [];
    const newlyAddedEmails = new Set<string>();

    items.forEach(item => {
      const trimmedEmail = item.email.trim().toLowerCase();
      if (
        trimmedEmail &&
        trimmedEmail.includes('@') &&
        !existingEmails.has(trimmedEmail) &&
        !newlyAddedEmails.has(trimmedEmail)
      ) {
        newlyAddedEmails.add(trimmedEmail);
        newExclusions.push({
          email: item.email.trim(),
          name: item.name?.trim() || item.email.trim().split('@')[0],
          reason: item.reason?.trim() || 'Bulk CSV Import',
          addedDate
        });
      }
    });

    if (newExclusions.length > 0) {
      setExclusions(prev => [...prev, ...newExclusions]);

      // Scrub matching rows across all attendance records
      const allNewEmails = new Set(newExclusions.map(e => e.email.toLowerCase()));
      setRecords(prev => prev.filter(r => !allNewEmails.has(r.performerEmail.toLowerCase())));
      showToast(lang === 'es'
        ? `Se importaron ${newExclusions.length} integrante(s) excluidos y se depuraron sus registros.`
        : `Bulk imported ${newExclusions.length} excluded performer(s) & purged matching rehearsal records.`);
    } else {
      showToast(lang === 'es'
        ? 'No hay nuevas direcciones de correo válidas para importar.'
        : 'No new valid email addresses to import (all addresses were already excluded or invalid).');
    }
  };

  const handleDeleteExclusion = (email: string) => {
    const ex = exclusions.find(e => e.email.toLowerCase() === email.toLowerCase());
    const displayName = ex?.name ? `${ex.name} (${email})` : email;

    setConfirmModal({
      isOpen: true,
      title: t.confirmTitleDeleteExclusion || (lang === 'es' ? 'Remover Integrante Excluido' : 'Remove Excluded Performer'),
      message: (t.confirmMessageDeleteExclusion || (lang === 'es'
        ? '¿Estás seguro de que deseas remover a "{name}" de la lista de exclusión?'
        : 'Are you sure you want to remove "{name}" from the exclusion list?'
      )).replace('{name}', displayName),
      confirmText: t.confirmBtnDeleteExclusion || (lang === 'es' ? 'Sí, Remover' : 'Yes, Remove'),
      isDanger: true,
      onConfirm: () => {
        setExclusions(prev => prev.filter(e => e.email.toLowerCase() !== email.toLowerCase()));
        showToast(lang === 'es' ? `Se removió a ${email} de las exclusiones.` : `Removed ${email} from exclusions.`);
        setConfirmModal(null);
      }
    });
  };

  const handlePurgeExclusions = () => {
    const count = exclusions.length;
    const excludedEmails = new Set(exclusions.map(e => e.email.toLowerCase().trim()));
    const matchingRecordsCount = records.filter(r => excludedEmails.has(r.performerEmail.toLowerCase())).length;

    setConfirmModal({
      isOpen: true,
      title: t.confirmTitlePurgeExclusions || (lang === 'es' ? 'Depurar Exclusiones' : 'Scrub & Purge Exclusions'),
      message: lang === 'es'
        ? `¿Estás seguro de que deseas eliminar todas las filas de asistencia (${matchingRecordsCount} registro(s)) que coinciden con los correos excluidos (${count} integrante(s))?`
        : `Are you sure you want to purge all rehearsal attendance records (${matchingRecordsCount} record(s)) matching the blacklisted exclusion emails (${count} performer(s))?`,
      confirmText: t.confirmBtnPurgeExclusions || (lang === 'es' ? 'Sí, Depurar Ahora' : 'Yes, Purge Now'),
      isDanger: true,
      onConfirm: () => {
        setRecords(prev => prev.filter(r => !excludedEmails.has(r.performerEmail.toLowerCase())));
        showToast(lang === 'es' ? `Depuración Dinámica: ¡Se eliminaron ${matchingRecordsCount} registro(s)!` : `Dynamic Scrub: ${matchingRecordsCount} blacklisted record(s) purged!`);
        setConfirmModal(null);
      }
    });
  };

  const handleDeletePayment = (id: string) => {
    const pay = payments.find(p => p.id === id);
    const amountStr = pay ? `$${pay.amount.toFixed(2)} (${pay.method})` : '';

    setConfirmModal({
      isOpen: true,
      title: lang === 'es' ? 'Eliminar Registro de Pago' : 'Delete Payment Transaction',
      message: lang === 'es'
        ? `¿Estás seguro de que deseas eliminar el registro de pago de ${amountStr}? Esta acción no se puede deshacer.`
        : `Are you sure you want to delete the payment transaction of ${amountStr}? This action cannot be undone.`,
      confirmText: lang === 'es' ? 'Sí, Eliminar Pago' : 'Yes, Delete Payment',
      isDanger: true,
      onConfirm: () => {
        setPayments(prev => prev.filter(p => p.id !== id));
        showToast(lang === 'es' ? 'Registro de pago eliminado.' : 'Payment transaction deleted.');
        setConfirmModal(null);
      }
    });
  };

  const handleAddCheckIn = (email: string, name: string, practiceDate: string, status: 'Yes' | 'No', rsvpStatus?: RsvpStatus) => {
    const finalRsvp = rsvpStatus || 'Awaiting';
    const newFr: FormResponseRecord = {
      id: `fr_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      performerEmail: email,
      performerName: name,
      practiceDate,
      checkInStatus: status,
      rsvpStatus: finalRsvp
    };
    setFormResponses(prev => [newFr, ...prev]);

    // Automatically update or create attendance record
    setRecords(prev => {
      const excludedEmails = new Set(exclusions.map(e => e.email.toLowerCase().trim()));
      if (excludedEmails.has(email.toLowerCase().trim())) return prev;

      let found = false;
      const updated = prev.map(r => {
        if (r.date === practiceDate && r.performerEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
          found = true;
          const nextRsvp = (rsvpStatus && rsvpStatus !== 'Awaiting') ? rsvpStatus : (rsvpStatus || r.rsvp);
          const fee = calculateSopFee(nextRsvp, status);
          return {
            ...r,
            rsvp: nextRsvp,
            attended: status,
            fees: fee,
            notes: getFeeNote(nextRsvp, status, fee)
          };
        }
        return r;
      });

      if (!found) {
        let monthKey = '';
        try {
          const parts = practiceDate.split('-').map(Number);
          if (parts.length === 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
        } catch {}
        if (!monthKey) monthKey = 'August 2026';

        let dayOfWeek = 'Sat';
        try {
          const parts = practiceDate.split('-').map(Number);
          if (parts.length === 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
          }
        } catch {}

        const fee = calculateSopFee(finalRsvp, status);
        updated.push({
          id: `fr_att_${practiceDate}_${Math.random().toString(36).substring(2, 6)}`,
          date: practiceDate,
          day: dayOfWeek,
          monthKey,
          performerName: name || email.split('@')[0],
          performerEmail: email,
          rsvp: finalRsvp,
          attended: status,
          fees: fee,
          notes: getFeeNote(finalRsvp, status, fee)
        });
      }

      setPerformers(p => derivePerformersList(p, updated, [newFr]));
      return updated;
    });
  };

  // Live Production Data Import Handlers
  const [showLiveImportModal, setShowLiveImportModal] = useState(false);

  const handleImportAttendanceRecords = (importedRecords: AttendanceRecord[], mode: 'merge' | 'replace') => {
    // Recalculate fees according to current SOP rules
    const processed = importedRecords.map(r => {
      const fee = calculateSopFee(r.rsvp, r.attended);
      return {
        ...r,
        fees: fee,
        notes: r.notes || getFeeNote(r.rsvp, r.attended, fee)
      };
    });

    if (mode === 'replace') {
      setRecords(processed);
      setPerformers(prev => derivePerformersList(prev, processed, formResponses));
      showToast(`Replaced dataset with ${processed.length} imported production attendance record(s).`);
    } else {
      setRecords(prev => {
        const existingMap = new Map<string, AttendanceRecord>(prev.map(r => [`${r.date}_${r.performerEmail.toLowerCase()}`, r]));
        processed.forEach(r => {
          const key = `${r.date}_${r.performerEmail.toLowerCase()}`;
          existingMap.set(key, r);
        });
        const combined = Array.from(existingMap.values());
        setPerformers(p => derivePerformersList(p, combined, formResponses));
        return combined;
      });
      showToast(`Merged ${processed.length} imported production attendance record(s).`);
    }
  };

  const handleImportFormResponses = (importedResponses: FormResponseRecord[], mode: 'merge' | 'replace') => {
    let finalResponses: FormResponseRecord[] = [];
    if (mode === 'replace') {
      finalResponses = importedResponses;
      setFormResponses(importedResponses);
      showToast(`Replaced form responses with ${importedResponses.length} production record(s).`);
    } else {
      setFormResponses(prev => {
        const existingMap = new Map<string, FormResponseRecord>(prev.map(fr => [`${fr.practiceDate}_${fr.performerEmail.toLowerCase()}`, fr]));
        importedResponses.forEach(fr => {
          const key = `${fr.practiceDate}_${fr.performerEmail.toLowerCase()}`;
          existingMap.set(key, fr);
        });
        const merged = Array.from(existingMap.values());
        finalResponses = merged;
        return merged;
      });
    }

    const responsesToSync = finalResponses.length > 0 ? finalResponses : importedResponses;

    // Immediately synchronize form responses into Attendance Records
    setRecords(prevRecords => {
      const excludedEmails = new Set(exclusions.map(e => e.email.toLowerCase().trim()));
      const recordMap = new Map<string, AttendanceRecord>(prevRecords.map(r => [`${r.date}_${r.performerEmail.toLowerCase().trim()}`, r]));

      responsesToSync.forEach(fr => {
        const email = fr.performerEmail.toLowerCase().trim();
        if (!email || excludedEmails.has(email)) return;

        const key = `${fr.practiceDate}_${email}`;
        const existingRec = recordMap.get(key);
        const checkInAttended: AttendedStatus = fr.checkInStatus === 'Yes' ? 'Yes' : 'No';
        const frRsvp: RsvpStatus = fr.rsvpStatus || 'Awaiting';

        let monthKey = '';
        try {
          const parts = fr.practiceDate.split('-').map(Number);
          if (parts.length === 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
        } catch {}
        if (!monthKey) monthKey = 'August 2026';

        let dayOfWeek = 'Sat';
        try {
          const parts = fr.practiceDate.split('-').map(Number);
          if (parts.length === 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
          }
        } catch {}

        if (existingRec) {
          const finalRsvp = (frRsvp && frRsvp !== 'Awaiting') ? frRsvp : existingRec.rsvp;
          const fee = calculateSopFee(finalRsvp, checkInAttended);
          recordMap.set(key, {
            ...existingRec,
            rsvp: finalRsvp,
            attended: checkInAttended,
            fees: fee,
            notes: getFeeNote(finalRsvp, checkInAttended, fee)
          });
        } else {
          const finalRsvp = frRsvp;
          const fee = calculateSopFee(finalRsvp, checkInAttended);
          recordMap.set(key, {
            id: `fr_att_${fr.practiceDate}_${Math.random().toString(36).substring(2, 6)}`,
            date: fr.practiceDate,
            day: dayOfWeek,
            monthKey,
            performerName: fr.performerName || email.split('@')[0],
            performerEmail: fr.performerEmail,
            rsvp: finalRsvp,
            attended: checkInAttended,
            fees: fee,
            notes: getFeeNote(finalRsvp, checkInAttended, fee)
          });
        }
      });

      const nextRecords = Array.from(recordMap.values());
      setPerformers(p => derivePerformersList(p, nextRecords, responsesToSync));
      return nextRecords;
    });
  };

  const handleImportExclusions = (importedExclusions: ExcludedPerformer[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setExclusions(importedExclusions);
      const excludedEmails = new Set(importedExclusions.map(e => e.email.toLowerCase().trim()));
      setRecords(prev => prev.filter(r => !excludedEmails.has(r.performerEmail.toLowerCase())));
      showToast(`Replaced exclusions with ${importedExclusions.length} production record(s) & purged matching attendance.`);
    } else {
      handleBulkAddExclusions(importedExclusions);
    }
  };

  // Key metrics for top dashboard cards / dropdown summary
  const totalOutstandingBalance = masterSummary.reduce((acc, m) => acc + m.totalFees, 0);
  const totalFlaggedPenalties = records.filter(r => r.fees > 0).length;

  const kpiStats = useMemo(() => ({
    totalOutstandingBalance,
    totalFlaggedPenalties,
    activePerformersCount: performers.length,
    excludedPerformersCount: exclusions.length
  }), [totalOutstandingBalance, totalFlaggedPenalties, performers.length, exclusions.length]);

  const handleUpdatePerformer = (oldEmail: string, updated: Performer) => {
    setPerformers(prev => prev.map(p => p.email.toLowerCase().trim() === oldEmail.toLowerCase().trim() ? updated : p));
    setRecords(prev => prev.map(r => r.performerEmail.toLowerCase().trim() === oldEmail.toLowerCase().trim() ? { ...r, performerEmail: updated.email, performerName: updated.name } : r));
    showToast(lang === 'es' ? `Perfil de ${updated.name} actualizado correctamente.` : `Updated ${updated.name}'s performer profile.`);
  };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Main Navigation Header */}
      <header className={`border-b sticky top-0 z-40 shadow-xl transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Company Brand Title */}
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = './logo.jpg'; }}
              alt="Tradición Dance Co. Logo"
              className="w-10 h-10 rounded-full object-cover shadow-md ring-2 ring-indigo-500/30 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`font-bold text-lg sm:text-xl tracking-tight leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {t.systemTitle}
                </h1>

                {/* Debounced Auto-Save Status Indicator */}
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all duration-300 ${
                    autoSaveStatus === 'saving'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 opacity-100 scale-100'
                      : autoSaveStatus === 'saved'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 opacity-100 scale-100'
                      : 'opacity-0 scale-95 pointer-events-none hidden sm:flex'
                  }`}
                >
                  {autoSaveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                      <span>{t.saving}</span>
                    </>
                  ) : autoSaveStatus === 'saved' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{t.changesSaved}</span>
                    </>
                  ) : null}
                </div>

                {/* Real-Time Multi-User Shared Sync Badge */}
                <div
                  title={lang === 'es'
                    ? 'Base de datos compartida en tiempo real activa. Hasta 3 usuarios pueden actualizar simultáneamente sin perder información.'
                    : 'Live multi-user shared server database active. Up to 3 users can edit simultaneously in real time without losing data.'
                  }
                  className={`hidden md:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-sm transition-all ${
                    sharedSyncStatus === 'syncing'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : sharedSyncStatus === 'connected'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    sharedSyncStatus === 'syncing' ? 'bg-amber-500 animate-ping' : sharedSyncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`} />
                  <span>
                    {sharedSyncStatus === 'syncing'
                      ? (lang === 'es' ? 'Sincronizando...' : 'Syncing Shared DB...')
                      : sharedSyncStatus === 'connected'
                      ? (lang === 'es' ? '🟢 Servidor Compartido en Vivo (3 Usuarios)' : '🟢 Shared DB Live (3 Users Sync)')
                      : (lang === 'es' ? '🔴 Guardado Local' : '🔴 Local Storage Mode')}
                  </span>
                </div>
              </div>
              <p className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.systemSubtitle}
              </p>
            </div>
          </div>

          {/* Navigation & Action Dropdown */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('sheet')}
              className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-bold transition-all shadow-xs border ${
                activeView === 'sheet'
                  ? 'bg-slate-50/90 text-slate-900 border-slate-200/90 shadow-xs font-bold'
                  : isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>{t.spreadsheetView}</span>
            </button>

            <button
              onClick={() => setActiveView('performer')}
              className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-bold transition-all shadow-xs border ${
                activeView === 'performer'
                  ? 'bg-slate-50/90 text-slate-900 border-slate-200/90 shadow-xs font-bold'
                  : isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>{t.byPerformer}</span>
            </button>

            {/* "More Actions" Dropdown Button */}
            <MoreActionsDropdown
              onOpenLiveImport={() => setShowLiveImportModal(true)}
              onRunSync={runSyncAlgorithm}
              onSyncCalendarEvents={handleSyncCalendarEvents}
              onForceUpdateMonths={handleForceUpdateMonths}
              onExportToDrive={handleExportToDrive}
              onExportCsv={() => {
                let csvRows: string[] = [];
                csvRows.push(['Performer Name', 'Email', ...availableMonths, 'Total Fees', 'Status'].join(','));
                masterSummary.forEach(m => {
                  const row = [
                    `"${m.performerName}"`,
                    `"${m.performerEmail}"`,
                    ...availableMonths.map(mn => m.monthlyFees[mn] || 0),
                    m.totalFees,
                    m.totalFees > 0 ? 'Outstanding' : 'Paid in Full'
                  ];
                  csvRows.push(row.join(','));
                });
                const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Tradicion_MasterSummary_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              onAddExclusion={() => {
                setActiveTab('Excluded these Performers');
                setActiveView('sheet');
              }}
              onBulkImportCsv={() => setShowLiveImportModal(true)}
              onPurgeExclusions={handlePurgeExclusions}
              isSyncing={isSyncing}
              activeView={activeView}
              setActiveView={setActiveView}
              onResetData={resetAllDataToDefault}
              onDeleteAllTestData={deleteAllTestData}
              onOpenSopRules={() => setShowSopModal(true)}
              onOpenCalculator={() => setShowCalculator(true)}
              stats={kpiStats}
              theme={theme}
              lang={lang}
            />
          </nav>

          {/* Right Header Utilities: Language Toggle, System Settings, Day/Night Toggle matching image */}
          <div className="flex items-center gap-2.5">
            {/* Language Toggle (EN / ES) matching attached image pill format */}
            <div className={`flex items-center p-1 rounded-2xl border text-xs font-semibold shadow-xs ${
              isLight ? 'bg-slate-100/90 border-slate-200/90' : 'bg-slate-950 border-slate-800'
            }`}>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  lang === 'en'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to English"
              >
                <span className="text-[10px] font-bold lowercase tracking-tight opacity-90 font-mono">us</span>
                <span className="font-extrabold">EN</span>
              </button>
              <button
                onClick={() => setLang('es')}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  lang === 'es'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
                title="Cambiar a Español"
              >
                <span className="text-[10px] font-bold lowercase tracking-tight opacity-90 font-mono">mx</span>
                <span className="font-extrabold">ES</span>
              </button>
            </div>

            {/* System Settings Button (Config) - Solid indigo/purple button matching image */}
            <button
              onClick={() => setActiveView(prev => prev === 'config' ? 'sheet' : 'config')}
              className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-md flex items-center justify-center transition-all"
              title={lang === 'es' ? 'Configuración del Sistema' : 'System Configuration Settings'}
            >
              <Settings className="w-4 h-4 text-white" />
            </button>

            {/* Day / Night Mode Toggle - Soft amber button matching image */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200/90 text-amber-500 shadow-xs flex items-center justify-center transition-all"
              title={isLight ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            >
              {isLight ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dynamic View Switcher */}

        {/* Dynamic View Switcher */}
        {activeView === 'sheet' && (
          <SpreadsheetView
            records={records}
            masterSummary={masterSummary}
            formResponses={formResponses}
            exclusions={exclusions}
            performers={performers}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            availableMonths={availableMonths}
            onUpdateRecord={handleUpdateRecord}
            onBatchUpdateRecords={handleBatchUpdateRecords}
            onAddRecord={handleAddRecord}
            onDeleteRecord={handleDeleteRecord}
            onPurgeExclusions={handlePurgeExclusions}
            onAddExclusion={handleAddExclusion}
            onBulkAddExclusions={handleBulkAddExclusions}
            onDeleteExclusion={handleDeleteExclusion}
            onRunSync={runSyncAlgorithm}
            onForceUpdateMonths={handleForceUpdateMonths}
            onAddMonthTab={handleAddMonthTab}
            onOpenLiveImport={() => setShowLiveImportModal(true)}
            isSyncing={isSyncing}
            theme={theme}
            lang={lang}
            activeView={activeView}
            setActiveView={setActiveView}
            onResetData={resetAllDataToDefault}
            onOpenSopRules={() => setShowSopModal(true)}
          />
        )}

        {activeView === 'performer' && (
          <PerformerDetailView
            performers={performers}
            records={records}
            exclusions={exclusions}
            config={config}
            theme={theme}
            lang={lang}
            onUpdateRecord={handleUpdateRecord}
            onToggleExclusion={(email, name) => {
              const isEx = exclusions.some(e => e.email.toLowerCase().trim() === email.toLowerCase().trim());
              if (isEx) {
                handleDeleteExclusion(email);
              } else {
                handleAddExclusion(email, name, 'Administrative Blocklist');
              }
            }}
            payments={payments}
            onAddPayment={pay => setPayments(prev => [pay, ...prev])}
            onDeletePayment={handleDeletePayment}
            onUpdatePerformer={handleUpdatePerformer}
          />
        )}

        {activeView === 'reports' && (
          <ReportsModal
            config={config}
            records={records}
            masterSummary={masterSummary}
            reportLogs={reportLogs}
            onAddReportLog={log => setReportLogs(prev => [log, ...prev])}
            theme={theme}
            lang={lang}
          />
        )}

        {activeView === 'checkin' && (
          <CheckInSimulator
            performers={performers}
            practices={practices}
            onSubmitCheckIn={handleAddCheckIn}
            theme={theme}
            lang={lang}
          />
        )}

        {activeView === 'script' && <AppsScriptViewer theme={theme} lang={lang} />}

        {activeView === 'config' && (
          <ConfigPanel
            config={config}
            onUpdateConfig={setConfig}
            onResetData={resetAllDataToDefault}
            theme={theme}
            lang={lang}
          />
        )}
      </main>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Live Production Data Import Modal */}
      <LiveImportModal
        isOpen={showLiveImportModal}
        onClose={() => setShowLiveImportModal(false)}
        onImportAttendanceRecords={handleImportAttendanceRecords}
        onImportFormResponses={handleImportFormResponses}
        onImportExclusions={handleImportExclusions}
        feeRules={config.feeRules}
        theme={theme}
        lang={lang}
      />

      {/* Fee SOP Compliance Engine Modal */}
      <SopRulesModal
        isOpen={showSopModal}
        onClose={() => setShowSopModal(false)}
        config={config}
        theme={theme}
        lang={lang}
      />

      {/* Sync Algorithm Execution Summary Modal */}
      {syncStats && (
        <SyncSummaryModal
          isOpen={showSyncModal}
          onClose={() => setShowSyncModal(false)}
          stats={syncStats}
          onReRunSync={runSyncAlgorithm}
          onSimulateNewCheckIn={handleSimulateNewCheckIn}
          isSyncing={isSyncing}
          theme={theme}
          lang={lang}
        />
      )}

      {/* Interactive Confirmation Action Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className={`border rounded-2xl p-6 w-full max-w-md shadow-2xl transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmModal.isDanger
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {confirmModal.title}
                </h3>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {lang === 'es' ? 'Acción de gestión de datos' : 'Data Management Action'}
                </p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {confirmModal.message}
            </p>

            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                  confirmModal.isDanger
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Fee & Attendance Calculator Widget */}
      <CalculatorWidget
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        theme={theme}
        lang={lang}
      />
    </div>
  );
}
