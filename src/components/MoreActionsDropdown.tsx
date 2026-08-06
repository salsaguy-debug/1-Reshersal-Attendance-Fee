import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  FileUp,
  RefreshCw,
  ClipboardCheck,
  Mail,
  Code2,
  Sparkles,
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
  HardDrive
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
  activeView: 'sheet' | 'reports' | 'checkin' | 'script' | 'config';
  setActiveView: (view: 'sheet' | 'reports' | 'checkin' | 'script' | 'config') => void;
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
  const t = translations[lang] || translations.en;

  // Close dropdown when clicking outside
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

  const handleSelectView = (view: 'sheet' | 'reports' | 'checkin' | 'script' | 'config') => {
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
      {/* Trigger Button: "More Actions" */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-2 font-semibold transition-all rounded-xl shadow-md border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
          buttonSize === 'compact'
            ? 'px-3 py-1.5 text-xs'
            : 'px-4 py-2 text-xs sm:text-sm'
        } ${
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
            : isLight
            ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-indigo-400'
            : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-700 hover:border-indigo-500'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Layers className={`w-4 h-4 ${isOpen ? 'text-white' : 'text-indigo-400'}`} />
        <span>{lang === 'es' ? 'Más Acciones' : 'More Actions'}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : isLight ? 'text-slate-500' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-150 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800 divide-slate-100'
              : 'bg-slate-900 border-slate-800 text-slate-100 divide-slate-800/80'
          }`}
        >
          {/* Header Tagline */}
          <div className={`px-4 py-2.5 border-b text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/80 border-slate-800 text-slate-400'
          }`}>
            <span>{lang === 'es' ? 'Menú de Acciones y Vistas' : 'Actions & Tools Menu'}</span>
            <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              REV 7.4 / REV 8
            </span>
          </div>

          {/* Key Metrics / KPI Summary Block */}
          {stats && (
            <div className={`p-2.5 border-b ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="px-1 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                <span>{lang === 'es' ? 'Resumen Ejecutivo' : 'KPI Summary Metrics'}</span>
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* 1. Outstanding Fees */}
                <div className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="min-w-0 pr-1">
                    <div className="text-[10px] font-medium text-slate-400 truncate">
                      {t.companyOutstanding || 'Outstanding Fees'}
                    </div>
                    <div className="text-sm font-extrabold text-rose-500 font-mono mt-0.5">
                      ${stats.totalOutstandingBalance.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg shrink-0">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* 2. Flagged SOP Penalty Sessions */}
                <div className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="min-w-0 pr-1">
                    <div className="text-[10px] font-medium text-slate-400 truncate">
                      {t.flaggedPenaltySessions || 'SOP Penalties'}
                    </div>
                    <div className="text-sm font-extrabold text-amber-500 font-mono mt-0.5">
                      {stats.totalFlaggedPenalties}
                    </div>
                  </div>
                  <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* 3. Active Rehearsal Performers */}
                <div className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="min-w-0 pr-1">
                    <div className="text-[10px] font-medium text-slate-400 truncate">
                      {t.activePerformers || 'Active Performers'}
                    </div>
                    <div className="text-sm font-extrabold text-indigo-400 font-mono mt-0.5">
                      {stats.activePerformersCount}
                    </div>
                  </div>
                  <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* 4. Excluded Performers (Blocklist) */}
                <div className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="min-w-0 pr-1">
                    <div className="text-[10px] font-medium text-slate-400 truncate">
                      {t.excludedPerformers || 'Blocklist'}
                    </div>
                    <div className="text-sm font-extrabold text-slate-300 font-mono mt-0.5">
                      {stats.excludedPerformersCount}
                    </div>
                  </div>
                  <div className="p-1.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-lg shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-1.5 space-y-1">
            {/* Section 1: Live Data & Sync Actions */}
            <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
              {lang === 'es' ? 'Acciones Principales' : 'Primary Actions'}
            </div>

            {/* 1. Import Live Data */}
            <button
              onClick={handleTriggerLiveImport}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                isLight ? 'hover:bg-emerald-50 text-slate-800' : 'hover:bg-emerald-950/40 text-slate-100'
              }`}
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5 shrink-0">
                <FileUp className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-emerald-400 flex items-center justify-between">
                  <span>Import Live</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">CSV / Sheet</span>
                </div>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {lang === 'es' ? 'Importar datos de asistencia reales' : 'Import live attendance from CSV or Sheets'}
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
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5 shrink-0">
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-indigo-400 flex items-center justify-between">
                  <span>Sync (Rev 7.4)</span>
                  {isSyncing && <span className="text-[10px] text-amber-400 font-mono animate-pulse">{t.syncing}</span>}
                </div>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {lang === 'es' ? 'Sincronizar Google Calendar y Form Responses 1' : 'Run sync algorithm across Calendar & Forms'}
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
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5 shrink-0">
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-indigo-400 flex items-center justify-between">
                    <span>{lang === 'es' ? 'Forzar Actualización de Meses' : 'Force Update & Refresh Months'}</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">Sync Tabs</span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {lang === 'es' ? 'Recalcular todos los meses y poblar eventos' : 'Recalculate all 12+ month sheets & sync calendar events'}
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
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 mt-0.5 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-sky-400 flex items-center justify-between">
                    <span>{lang === 'es' ? 'Sincronizar Google Calendar' : 'Sync Google Calendar API'}</span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-mono">Calendar API</span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {lang === 'es' ? 'Poblar fechas faltantes desde ID l46591...' : 'Populate missing rehearsal dates from Calendar ID'}
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
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 mt-0.5 shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-teal-400 flex items-center justify-between">
                    <span>{lang === 'es' ? 'Guardar Respaldo en Google Drive' : 'Save Backup to Google Drive'}</span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded font-mono">Drive API</span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {lang === 'es' ? 'Exportar hoja de asistencia a Google Drive' : 'Export current attendance spreadsheet to Google Drive'}
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
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 mt-0.5 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-amber-500 flex items-center justify-between">
                    <span>Fee SOP Compliance Engine</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-mono font-bold">REV 7.4</span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {lang === 'es' ? 'Ver reglas de cálculo de tarifas y matriz de decisión' : 'View fee calculation rules & decision matrix'}
                  </p>
                </div>
              </button>
            )}

            <div className={`my-1.5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`} />

            {/* Section 2: View Switching Suite */}
            <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {lang === 'es' ? 'Vistas y Herramientas' : 'Views & Tools'}
            </div>

            {/* 4. Spreadsheet View */}
            <button
              onClick={() => handleSelectView('sheet')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${
                activeView === 'sheet'
                  ? isLight ? 'bg-indigo-50 border border-indigo-200 font-bold' : 'bg-indigo-950/60 border border-indigo-800/80 text-white'
                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 flex items-center justify-between text-xs">
                <span>{t.spreadsheetView}</span>
                {activeView === 'sheet' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                )}
              </div>
            </button>

            {/* 5. Check-in Simulator */}
            <button
              onClick={() => handleSelectView('checkin')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${
                activeView === 'checkin'
                  ? isLight ? 'bg-indigo-50 border border-indigo-200 font-bold' : 'bg-indigo-950/60 border border-indigo-800/80 text-white'
                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="flex-1 flex items-center justify-between text-xs">
                <span>Check-in Simulator</span>
                {activeView === 'checkin' && (
                  <span className="w-2 h-2 rounded-full bg-sky-400 shadow-sm" />
                )}
              </div>
            </button>

            {/* 6. Reports & Email Suite */}
            <button
              onClick={() => handleSelectView('reports')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${
                activeView === 'reports'
                  ? isLight ? 'bg-indigo-50 border border-indigo-200 font-bold' : 'bg-indigo-950/60 border border-indigo-800/80 text-white'
                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 flex items-center justify-between text-xs">
                <span>{t.reportsSuite}</span>
                {activeView === 'reports' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
                )}
              </div>
            </button>

            {/* 7. Code Exporter (Code.gs) */}
            <button
              onClick={() => handleSelectView('script')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${
                activeView === 'script'
                  ? isLight ? 'bg-indigo-50 border border-indigo-200 font-bold' : 'bg-indigo-950/60 border border-indigo-800/80 text-white'
                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="flex-1 flex items-center justify-between text-xs">
                <span>{t.codeExporter}</span>
                {activeView === 'script' && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-sm" />
                )}
              </div>
            </button>

            {/* Section 3: Data Management & Reset */}
            {(onDeleteAllTestData || onResetData) && (
              <>
                <div className={`my-1.5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`} />
                <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">
                  {lang === 'es' ? 'Gestión de Datos' : 'Data Management'}
                </div>

                {onDeleteAllTestData && (
                  <button
                    onClick={() => {
                      onDeleteAllTestData();
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${
                      isLight ? 'hover:bg-rose-50 text-rose-700' : 'hover:bg-rose-950/40 text-rose-300'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-rose-500">
                        {lang === 'es' ? 'Eliminar Todos los Datos de Prueba' : 'Delete All Test Data'}
                      </div>
                      <p className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {lang === 'es' ? 'Vaciar todas las listas y registros de asistencia' : 'Wipe all records, responses & exclusions'}
                      </p>
                    </div>
                  </button>
                )}

                {onResetData && (
                  <button
                    onClick={handleTriggerReset}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${
                      isLight ? 'hover:bg-amber-50 text-amber-800' : 'hover:bg-amber-950/40 text-amber-300'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {lang === 'es' ? 'Restablecer Datos de Muestra' : 'Reset Sample Baseline Data'}
                      </div>
                      <p className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {lang === 'es' ? 'Restaurar datos de prueba por defecto' : 'Restore initial sample demo records'}
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
