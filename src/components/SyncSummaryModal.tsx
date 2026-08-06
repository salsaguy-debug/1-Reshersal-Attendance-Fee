import React from 'react';
import { RefreshCw, Calendar, FileText, Users, DollarSign, ShieldCheck, CheckCircle2, X, PlusCircle, ArrowRight } from 'lucide-react';
import { Language } from '../utils/translations';

export interface SyncStats {
  calendarEventsCount: number;
  formResponsesCount: number;
  attendanceRecordsCount: number;
  activePerformersCount: number;
  totalOutstandingFees: number;
  excludedCount: number;
  lastSyncedTime: string;
  source: string;
}

interface SyncSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: SyncStats;
  onReRunSync: () => void;
  onSimulateNewCheckIn: () => void;
  isSyncing?: boolean;
  theme?: 'dark' | 'light';
  lang?: Language;
}

export const SyncSummaryModal: React.FC<SyncSummaryModalProps> = ({
  isOpen,
  onClose,
  stats,
  onReRunSync,
  onSimulateNewCheckIn,
  isSyncing = false,
  theme = 'dark',
  lang = 'en'
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const isEs = lang === 'es';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className={`border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isEs ? 'Resultado de Sincronización (Rev 7.4)' : 'Sync Algorithm (Rev 7.4) Execution Results'}
                </h2>
                <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {isEs ? 'COMPLETADO' : 'ACTIVE'}
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isEs 
                  ? `Última sincronización: ${stats.lastSyncedTime || 'Hace un momento'}` 
                  : `Last synced at ${stats.lastSyncedTime || 'Just now'}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Status Message */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isLight ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
          }`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">
                {isEs ? '¡Algoritmo de Sincronización Ejecutado Correctamente!' : 'Sync Algorithm Successfully Executed!'}
              </span>
              <p className="mt-0.5 opacity-90">
                {isEs
                  ? 'Se han reconciliado los eventos de Google Calendar, las respuestas de Google Form Check-In, las penalizaciones del SOP y la lista de exclusiones.'
                  : 'Reconciled Google Calendar rehearsal dates, Google Form Check-In responses, SOP fee rules, and exclusion blocklist.'}
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Metric 1: Calendar Events */}
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium">{isEs ? 'Eventos Calendar' : 'Calendar Events'}</span>
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-lg font-bold font-mono text-indigo-400">
                {stats.calendarEventsCount}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate" title={stats.source}>
                ID: l46591...
              </div>
            </div>

            {/* Metric 2: Form Responses */}
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium">{isEs ? 'Respuestas Form' : 'Form Responses'}</span>
                <FileText className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-lg font-bold font-mono text-sky-400">
                {stats.formResponsesCount}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {isEs ? 'Check-Ins Mapeados' : 'Check-Ins Mapped'}
              </div>
            </div>

            {/* Metric 3: Total Attendance Records */}
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium">{isEs ? 'Registros Totales' : 'Total Records'}</span>
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {stats.attendanceRecordsCount}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {isEs ? 'Ensayo x Performer' : 'Rehearsals x Performer'}
              </div>
            </div>

            {/* Metric 4: Active Performers */}
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium">{isEs ? 'Bailarines Activos' : 'Active Dancers'}</span>
                <Users className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-lg font-bold font-mono text-purple-400">
                {stats.activePerformersCount}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {isEs ? 'En Elenco' : 'In Roster'}
              </div>
            </div>

            {/* Metric 5: Total Outstanding Fees */}
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium">{isEs ? 'Penalizaciones SOP' : 'SOP Penalties'}</span>
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-lg font-bold font-mono text-rose-400">
                ${stats.totalOutstandingFees.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {isEs ? 'Balance Acumulado' : 'Calculated Balance'}
              </div>
            </div>

            {/* Metric 6: Exclusions */}
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium">{isEs ? 'Lista de Exclusión' : 'Exclusions Purged'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold font-mono text-amber-400">
                {stats.excludedCount}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {isEs ? 'Excluidos Filtrados' : 'Emails Blacklisted'}
              </div>
            </div>
          </div>

          {/* Test Live Interactive Simulation Helper */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-indigo-50/50 border-indigo-200' : 'bg-indigo-950/20 border-indigo-800/50'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  <span>{isEs ? '¿Quieres probar cambios en vivo?' : 'Test Live Data Flow?'}</span>
                </div>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isEs 
                    ? 'Agrega un Form Response simulado y re-ejecuta la sincronización para ver cambios instantáneos en la tabla.' 
                    : 'Insert a simulated Form Check-In response and re-run sync to see live table updates.'}
                </p>
              </div>

              <button
                onClick={onSimulateNewCheckIn}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5"
              >
                <span>{isEs ? 'Simular Check-In' : 'Simulate Response'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            onClick={onReRunSync}
            disabled={isSyncing}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isEs ? 'Re-Sincronizar Ahora' : 'Re-Run Sync'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            {isEs ? 'Cerrar' : 'Done / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
