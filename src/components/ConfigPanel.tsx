import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Calendar, Mail, DollarSign, Shield, RotateCcw, Database } from 'lucide-react';
import { SystemConfig } from '../types';
import { Language } from '../utils/translations';

interface ConfigPanelProps {
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  onResetData?: () => void;
  theme?: 'dark' | 'light';
  lang?: Language;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onUpdateConfig,
  onResetData,
  theme = 'dark',
  lang = 'en'
}) => {
  const isLight = theme === 'light';
  const isEs = lang === 'es';
  const [calId, setCalId] = useState(config.calendarId);
  const [adminEmailsText, setAdminEmailsText] = useState(config.adminEmails.join(', '));
  const [baselineDate, setBaselineDate] = useState(config.baselineDate);

  const [unconfirmedFee, setUnconfirmedFee] = useState(config.feeRules.unconfirmedFee);
  const [noShowPenalty, setNoShowPenalty] = useState(config.feeRules.noShowPenalty);

  const [savedStatus, setSavedStatus] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const emails = adminEmailsText
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);

    onUpdateConfig({
      ...config,
      calendarId: calId,
      adminEmails: emails,
      baselineDate,
      feeRules: {
        ...config.feeRules,
        unconfirmedFee: Number(unconfirmedFee) || 5,
        noShowPenalty: Number(noShowPenalty) || 5
      }
    });

    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  return (
    <div className={`border rounded-xl p-5 shadow-lg mb-8 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      <div className={`flex items-center gap-3 pb-3 border-b mb-4 ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-500">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-bold text-base flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {isEs ? 'Constantes de Configuración del Sistema (CONFIG)' : 'System Configuration Constants (CONFIG)'}
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
            }`}>
              Rev 7.4
            </span>
          </h3>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {isEs 
              ? 'Variables globales que rigen la sincronización con Google Calendar, listas de distribución administrativa y reglas de tarifas.'
              : 'Global variables governing Google Calendar sync, administrative dispatch lists, and fee rules.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block font-semibold mb-1.5 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}>
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              {isEs ? 'ID de Google Calendar (CAL_ID)' : 'Google Calendar ID (CAL_ID)'}
            </label>
            <input
              type="text"
              value={calId}
              onChange={e => setCalId(e.target.value)}
              className={`w-full border rounded-lg p-2.5 font-mono focus:outline-none focus:border-indigo-500 ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
              required
            />
            <span className={`text-[11px] mt-1 block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              {isEs 
                ? 'Identificador del calendario de Google con ensayos de danza y eventos.'
                : 'Identifier for the Google Calendar holding dance rehearsals & practice events.'}
            </span>
          </div>

          <div>
            <label className={`block font-semibold mb-1.5 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}>
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              {isEs ? 'Lista de Contactos Administradores (Separados por coma)' : 'Administrator Email Contact List (Comma-Separated)'}
            </label>
            <input
              type="text"
              value={adminEmailsText}
              onChange={e => setAdminEmailsText(e.target.value)}
              className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
              required
            />
            <span className={`text-[11px] mt-1 block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              {isEs 
                ? 'Recibe los reportes financieros semanales y mensuales automatizados.'
                : 'Receives automated Weekly and Monthly financial reports.'}
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <div>
            <label className={`block font-semibold mb-1.5 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}>
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              {isEs ? 'Fecha Base de Sincronización' : 'Baseline Configuration Sync Date'}
            </label>
            <input
              type="date"
              value={baselineDate}
              onChange={e => setBaselineDate(e.target.value)}
              className={`w-full border rounded-lg p-2 font-mono ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            />
          </div>

          <div>
            <label className={`block font-semibold mb-1.5 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}>
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
              {isEs ? 'Tarifa por Sin Confirmar ($)' : 'Unconfirmed Status Penalty ($)'}
            </label>
            <input
              type="number"
              value={unconfirmedFee}
              onChange={e => setUnconfirmedFee(Number(e.target.value))}
              className={`w-full border rounded-lg p-2 font-mono ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              {isEs ? 'RSVP = Sin Respuesta / Tal vez' : 'RSVP = Awaiting / Maybe'}
            </span>
          </div>

          <div>
            <label className={`block font-semibold mb-1.5 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}>
              <DollarSign className="w-3.5 h-3.5 text-rose-500" />
              {isEs ? 'Tarifa por Inasistencia ($)' : 'No-Show Penalty ($)'}
            </label>
            <input
              type="number"
              value={noShowPenalty}
              onChange={e => setNoShowPenalty(Number(e.target.value))}
              className={`w-full border rounded-lg p-2 font-mono ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              {isEs ? 'RSVP = Sí + Asistencia = No' : 'RSVP = Yes + Attended = No'}
            </span>
          </div>
        </div>

        <div className={`pt-3 flex flex-wrap items-center justify-between gap-3 border-t ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          {savedStatus ? (
            <span className="text-emerald-500 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {isEs 
                ? '¡Configuración guardada y actualizada en todo el sistema!' 
                : 'Configuration saved & updated across script runtime!'}
            </span>
          ) : (
            <span className={`text-[11px] flex items-center gap-1.5 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              {isEs ? 'Los datos de la aplicación se guardan automáticamente en tu navegador.' : 'All app data is automatically saved locally in your browser.'}
            </span>
          )}

          <div className="flex items-center gap-2">
            {onResetData && (
              <button
                type="button"
                onClick={onResetData}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors border text-xs font-medium ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-rose-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                {isEs ? 'Restablecer Datos' : 'Reset All Data'}
              </button>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow text-xs"
            >
              <Save className="w-4 h-4" />
              {isEs ? 'Guardar Configuración' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
