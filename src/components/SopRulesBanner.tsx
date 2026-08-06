import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { SystemConfig } from '../types';
import { Language } from '../utils/translations';

interface SopRulesBannerProps {
  config: SystemConfig;
  theme?: 'dark' | 'light';
  lang?: Language;
  hideHeader?: boolean;
}

export const SopRulesBanner: React.FC<SopRulesBannerProps> = ({ config, theme = 'dark', lang = 'en', hideHeader = false }) => {
  const isLight = theme === 'light';
  const isEs = lang === 'es';

  return (
    <div className={`border rounded-xl p-4 shadow-sm mb-6 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
    }`}>
      {!hideHeader && (
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold flex items-center gap-2 text-base ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {isEs ? 'Motor de Cumplimiento SOP' : 'Fee SOP Compliance Engine'}
                <span className="text-xs bg-indigo-500/20 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-500/30 font-mono font-bold">
                  {config.systemVersion}
                </span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isEs
                  ? 'Reglas automáticas de cálculo de tarifas aplicadas por bailarín por ensayo'
                  : 'Automated fee calculation rules applied per performer per practice session'}
              </p>
            </div>
          </div>
          <div className={`text-xs flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
          }`}>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Calendar Sync ID: <span className="font-mono font-semibold">{config.calendarId}</span>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5 ${hideHeader ? '' : 'mt-3'}`}>
        {/* Rule 1: Verified Attendance */}
        <div className={`p-2.5 rounded-lg border transition-colors ${
          isLight
            ? 'bg-emerald-50/60 border-emerald-200'
            : 'bg-slate-950/70 border-emerald-900/40 hover:border-emerald-700/50'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {isEs ? 'Asistencia Verificada' : 'Verified Present'}
            </span>
            <span className="text-xs font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded">
              $0
            </span>
          </div>
          <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            RSVP = <strong>Yes</strong> &amp; {isEs ? 'Asistió' : 'Attended'} = <strong>Yes</strong>
          </p>
        </div>

        {/* Rule 2: Excused Absence */}
        <div className={`p-2.5 rounded-lg border transition-colors ${
          isLight
            ? 'bg-sky-50/60 border-sky-200'
            : 'bg-slate-950/70 border-sky-900/40 hover:border-sky-700/50'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-sky-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600 shrink-0" />
              {isEs ? 'Ausencia Justificada' : 'Excused Absence'}
            </span>
            <span className="text-xs font-bold font-mono bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.5 rounded">
              $0
            </span>
          </div>
          <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            RSVP = <strong>No</strong> &amp; {isEs ? 'Asistió' : 'Attended'} = <strong>No</strong>
          </p>
        </div>

        {/* Rule 3: No-Show Penalty */}
        <div className={`p-2.5 rounded-lg border transition-colors ${
          isLight
            ? 'bg-rose-50/60 border-rose-200'
            : 'bg-slate-950/70 border-rose-900/40 hover:border-rose-700/50'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              {isEs ? 'Falta Sin Aviso' : 'No-Show Penalty'}
            </span>
            <span className="text-xs font-bold font-mono bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded">
              ${config.feeRules.noShowPenalty}
            </span>
          </div>
          <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            RSVP = <strong>Yes</strong> &amp; {isEs ? 'Asistió' : 'Attended'} = <strong className="text-rose-600">No</strong>
          </p>
        </div>

        {/* Rule 4: Unannounced Walk-in / RSVP No but Attended */}
        <div className={`p-2.5 rounded-lg border transition-colors ${
          isLight
            ? 'bg-orange-50/60 border-orange-200'
            : 'bg-slate-950/70 border-orange-900/40 hover:border-orange-700/50'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-orange-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
              {isEs ? 'Asistencia Sin Aviso' : 'Unannounced Attendance'}
            </span>
            <span className="text-xs font-bold font-mono bg-orange-100 text-orange-800 border border-orange-300 px-1.5 py-0.5 rounded">
              ${config.feeRules.unannouncedFee ?? 5}
            </span>
          </div>
          <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            RSVP = <strong>No</strong> &amp; {isEs ? 'Asistió' : 'Attended'} = <strong className="text-orange-600">Yes</strong>
          </p>
        </div>

        {/* Rule 5: Unconfirmed Penalty */}
        <div className={`p-2.5 rounded-lg border transition-colors ${
          isLight
            ? 'bg-amber-50/60 border-amber-200'
            : 'bg-slate-950/70 border-amber-900/40 hover:border-amber-700/50'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              {isEs ? 'Sin Confirmar' : 'Unconfirmed Status'}
            </span>
            <span className="text-xs font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded">
              ${config.feeRules.unconfirmedFee}
            </span>
          </div>
          <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            RSVP = <strong>Awaiting</strong> / <strong>Maybe</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

