import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  FileUp,
  RefreshCw,
  ClipboardCheck,
  Mail,
  Code2,
  FileSpreadsheet,
  Layers,
  ShieldAlert,
  DollarSign,
  AlertTriangle,
  Users,
  ShieldCheck,
  BarChart3,
  Trash2,
  RotateCcw,
  Calendar,
  HardDrive,
  BookOpen
} from 'lucide-react';
import { Language, translations } from '../utils/translations';

export interface KpiSummaryData {
  totalOutstandingBalance: number;
  totalFlaggedPenalties: number;
  activePerformersCount: number;
  excludedPerformersCount: number;
}

interface MoreActionsDropdownProps {
  onOpenLiveImport: () => void;
  onRunSync: () => void;
  onSyncCalendarEvents?: () => void;
  onForceUpdateMonths?: () => void;
  onExportToDrive?: () => void;
  isSyncing: boolean;
  activeView: 'sheet' | 'performer' | 'reports' | 'checkin' | 'script' | 'config';
  setActiveView: (view: 'sheet' | 'performer' | 'reports' | 'checkin' | 'script' | 'config') => void;
  onResetData?: () => void;
  onDeleteAllTestData?: () => void;
  onOpenSopRules?: () => void;
  stats?: KpiSummaryData;
  theme?: 'dark' | 'light';
  lang?: Language;
  buttonSize?: 'normal' | 'compact';
}

export const MoreActionsDropdown: React.FC<MoreActionsDropdownProps> = ({
  onOpenLiveImport,
  onRunSync,
  onSyncCalendarEvents,
  onForceUpdateMonths,
  onExportToDrive,
  isSyncing,
  activeView,
  setActiveView,
  onResetData,
  onDeleteAllTestData,
  onOpenSopRules,
  stats,
  theme = 'dark',
  lang = 'en',
  buttonSize = 'normal'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';
  const isEs = lang === 'es';
  const t = translations[lang] || translations.en;

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectView = (view: 'sheet' | 'performer' | 'reports' | 'checkin' | 'script' | 'config') => {
    setActiveView(view);
    setIsOpen(false);
  };

  const handleTriggerLiveImport = () => {
    onOpenLiveImport();
    setIsOpen(false);
  };

  const handleTriggerSync = () => {
    onRunSync();
    setIsOpen(false);
  };

  const handleTriggerReset = () => {
    if (onResetData) {
      onResetData();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button: "More Actions" / "Más Acciones" matching attached image */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-2 font-bold transition-all rounded-2xl shadow-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
          buttonSize === 'compact'
            ? 'px-3 py-1.5 text-xs'
            : 'px-4 py-2 text-xs sm:text-sm'
        } ${
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
            : isLight
            ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm'
            : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-700'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Layers className={`w-4 h-4 ${isOpen ? 'text-white' : 'text-indigo-600'}`} />
        <span>{t.moreActions}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Floating Dropdown Panel matching Image 2 */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-150 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800 divide-y divide-slate-100'
              : 'bg-slate-900 border-slate-800 text-slate-100 divide-y divide-slate-800/80'
          }`}
        >
          {/* Header Tagline */}
          <div className={`px-4 py-3 border-b text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/80 border-slate-800 text-slate-400'
          }`}>
            <span>{t.actionsToolsMenu}</span>
            <span className="font-mono text-[10px] text-purple-700 bg-purple-100 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 font-bold">
              REV 7.4 / REV 8
            </span>
          </div>

          {/* Key Metrics / KPI Summary Block */}
          {stats && (
            <div className={`p-3 border-b ${
              isLight ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="px-1 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                <span>{t.kpiSummaryMetrics}</span>
                <BarChart3 className="w-4 h-4 text-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* 1. Outstanding Fees */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="min-w-0 pr-1">
                    <div className="text-[10px] font-medium text-slate-400 truncate">
                      {isEs ? 'Balance Pendien...' : 'Company Outstan...'}
                    </div>
                    <div className="text-sm font-extrabold text-rose-500 font-mono mt-0.5">
                      ${stats.totalOutstandingBalance.toFixed(2)}
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>

                {/* 2. Flagged SOP Penalty Sessions */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="min-w-0 pr-1">
                    <div className="text-[10px] font-medium text-slate-400 truncate">
                      {isEs ? 'Penalizaciones SOP...' : 'Flagged SOP Penal...'}
                    </div>
                    <div className="text-sm font-extrabold text-amber-500 font-mono mt-0.5">
                      {stats.totalFlaggedPenalties}
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg shrink-0 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>

                {/* 3. Active Rehearsal Performers */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="min-w-0 pr-1">
                    <div className="text-[10px] font-medium text-slate-400 truncate">
                      {isEs ? 'Bailarines Activos...' : 'Active Rehearsal P...'}
                    </div>
                    <div className="text-sm font-extrabold text-indigo-400 font-mono mt-0.5">
                      {stats.activePerformersCount}
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg shrink-0 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>

                {/* 4. Excluded Performers (Blocklist) */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="min-w-0 pr-1">
                    <div className="text-[10px] font-medium text-slate-400 truncate">
                      {isEs ? 'Bailarines Excluid...' : 'Excluded Performe...'}
                    </div>
                    <div className="text-sm font-extrabold text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                      {stats.excludedPerformersCount}
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shrink-0 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-2 space-y-1.5">
            {/* Section 1: Live Data & Sync Actions */}
            <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
              {t.primaryActions}
            </div>

            {/* User Guide & System SOP */}
            {onOpenSopRules && (
              <button
                onClick={() => {
                  onOpenSopRules();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                  isLight ? 'hover:bg-blue-50 text-slate-800' : 'hover:bg-blue-950/40 text-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 mt-0.5 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-blue-500 flex items-center justify-between">
                    <span>{t.userGuide}</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">Guide</span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.userGuideDesc}
                  </p>
                </div>
              </button>
            )}

            {/* 1. Import Live Data */}
            <button
              onClick={handleTriggerLiveImport}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                isLight ? 'hover:bg-emerald-50 text-slate-800' : 'hover:bg-emerald-950/40 text-slate-100'
              }`}
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mt-0.5 shrink-0">
                <FileUp className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-emerald-500 flex items-center justify-between">
                  <span>{t.importLive}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-medium">CSV / Sheet</span>
                </div>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {t.importLiveDesc}
                </p>
              </div>
            </button>

            {/* 2. Sync (Rev 7.4) */}
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                isLight ? 'hover:bg-indigo-50 text-slate-800' : 'hover:bg-indigo-950/40 text-slate-100'
              } ${isSyncing ? 'opacity-50' : ''}`}
            >
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 mt-0.5 shrink-0">
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-indigo-500 flex items-center justify-between">
                  <span>{t.syncRev74}</span>
                  {isSyncing && <span className="text-[10px] text-amber-400 font-mono animate-pulse">{t.syncing}</span>}
                </div>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {t.syncRev74Desc}
                </p>
              </div>
            </button>

            {/* Force Update & Refresh Months */}
            {onForceUpdateMonths && (
              <button
                onClick={() => {
                  onForceUpdateMonths();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                  isLight ? 'hover:bg-indigo-50 text-slate-800' : 'hover:bg-indigo-950/40 text-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 mt-0.5 shrink-0">
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-500' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-indigo-500 flex items-center justify-between">
                    <span>{t.forceUpdateMonths}</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono font-medium">Sync Tabs</span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.forceUpdateMonthsDesc}
                  </p>
                </div>
              </button>
            )}

            {/* Google Calendar API Sync */}
            {onSyncCalendarEvents && (
              <button
                onClick={() => {
                  onSyncCalendarEvents();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                  isLight ? 'hover:bg-sky-50 text-slate-800' : 'hover:bg-sky-950/40 text-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20 mt-0.5 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-sky-500 flex items-center justify-between">
                    <span>{t.syncCalendarApi}</span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded font-mono font-medium">Calendar API</span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.syncCalendarApiDesc}
                  </p>
                </div>
              </button>
            )}

            {/* Google Drive Export & Backup */}
            {onExportToDrive && (
              <button
                onClick={() => {
                  onExportToDrive();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                  isLight ? 'hover:bg-teal-50 text-slate-800' : 'hover:bg-teal-950/40 text-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20 mt-0.5 shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-teal-500 flex items-center justify-between">
                    <span>{t.saveBackupDrive}</span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded font-mono font-medium">Drive API</span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.saveBackupDriveDesc}
                  </p>
                </div>
              </button>
            )}

            {/* 3. Fee SOP Compliance Engine (BTG REV 7.4) */}
            {onOpenSopRules && (
              <button
                onClick={() => {
                  onOpenSopRules();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                  isLight ? 'hover:bg-amber-50 text-slate-800' : 'hover:bg-amber-950/40 text-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mt-0.5 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-amber-500 flex items-center justify-between">
                    <span>{t.feeSopEngine}</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">REV 7.4</span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.feeSopEngineDesc}
                  </p>
                </div>
              </button>
            )}

            <div className={`my-1.5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`} />

            {/* Section 2: View Switching Suite */}
            <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {t.viewsTools}
            </div>

            {/* 4. Spreadsheet View */}
            <button
              onClick={() => handleSelectView('sheet')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                activeView === 'sheet'
                  ? isLight ? 'bg-indigo-50 border border-indigo-200 font-bold text-indigo-900' : 'bg-indigo-950/60 border border-indigo-800/80 text-white font-bold'
                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex-1 flex items-center justify-between text-xs">
                <span>{t.spreadsheetView}</span>
                {activeView === 'sheet' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                )}
              </div>
            </button>

            {/* 4b. By Performer */}
            <button
              onClick={() => handleSelectView('performer')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                activeView === 'performer'
                  ? isLight ? 'bg-indigo-50 border border-indigo-200 font-bold text-indigo-900' : 'bg-indigo-950/60 border border-indigo-800/80 text-white font-bold'
                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="flex-1 flex items-center justify-between text-xs">
                <span>{t.byPerformer}</span>
                {activeView === 'performer' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs" />
                )}
              </div>
            </button>

            {/* 5. Check-in Simulator */}
            <button
              onClick={() => handleSelectView('checkin')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                activeView === 'checkin'
                  ? isLight ? 'bg-indigo-50 border border-indigo-200 font-bold text-indigo-900' : 'bg-indigo-950/60 border border-indigo-800/80 text-white font-bold'
                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="flex-1 flex items-center justify-between text-xs">
                <span>{t.checkinSimulator}</span>
                {activeView === 'checkin' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-xs" />
                )}
              </div>
            </button>

            {/* 6. Reports & Email Suite */}
            <button
              onClick={() => handleSelectView('reports')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                activeView === 'reports'
                  ? isLight ? 'bg-indigo-50 border border-indigo-200 font-bold text-indigo-900' : 'bg-indigo-950/60 border border-indigo-800/80 text-white font-bold'
                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 flex items-center justify-between text-xs">
                <span>{t.reportsSuite}</span>
                {activeView === 'reports' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs" />
                )}
              </div>
            </button>

            {/* 7. Code Exporter (Code.gs) */}
            <button
              onClick={() => handleSelectView('script')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                activeView === 'script'
                  ? isLight ? 'bg-indigo-50 border border-indigo-200 font-bold text-indigo-900' : 'bg-indigo-950/60 border border-indigo-800/80 text-white font-bold'
                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="flex-1 flex items-center justify-between text-xs">
                <span>{t.codeExporter}</span>
                {activeView === 'script' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-xs" />
                )}
              </div>
            </button>

            {/* Section 3: Data Management & Reset */}
            {(onDeleteAllTestData || onResetData) && (
              <>
                <div className={`my-1.5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`} />
                <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-rose-500 font-mono">
                  {t.dataManagement}
                </div>

                {onDeleteAllTestData && (
                  <button
                    onClick={() => {
                      onDeleteAllTestData();
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                      isLight ? 'hover:bg-rose-50 text-rose-700' : 'hover:bg-rose-950/40 text-rose-300'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-rose-500">
                        {t.deleteAllTestData}
                      </div>
                      <p className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {t.deleteAllTestDataDesc}
                      </p>
                    </div>
                  </button>
                )}

                {onResetData && (
                  <button
                    onClick={handleTriggerReset}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                      isLight ? 'hover:bg-amber-50 text-amber-800' : 'hover:bg-amber-950/40 text-amber-300'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {t.resetSampleData}
                      </div>
                      <p className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {t.resetSampleDataDesc}
                      </p>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
