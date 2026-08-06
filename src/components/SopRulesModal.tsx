import React, { useEffect } from 'react';
import { X, ShieldAlert, Sparkles } from 'lucide-react';
import { SystemConfig } from '../types';
import { Language } from '../utils/translations';
import { SopRulesBanner } from './SopRulesBanner';

interface SopRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfig;
  theme?: 'dark' | 'light';
  lang?: Language;
}

export const SopRulesModal: React.FC<SopRulesModalProps> = ({
  isOpen,
  onClose,
  config,
  theme = 'dark',
  lang = 'en'
}) => {
  const isLight = theme === 'light';
  const isEs = lang === 'es';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-5xl rounded-2xl shadow-2xl border overflow-hidden transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'
        }`}>
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>{isEs ? 'Motor de Cumplimiento SOP' : 'Fee SOP Compliance Engine'}</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/30 font-mono font-bold shrink-0">
                  {config.systemVersion}
                </span>
              </h2>
              <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isEs
                  ? 'Reglas de cálculo de tarifas y matriz de decisión de penalizaciones SOP BTG REV 7.4 / REV 8'
                  : 'Fee calculation rules & decision matrix under SOP BTG REV 7.4 / REV 8'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {config.calendarId && (
              <div className={`hidden sm:flex text-xs items-center gap-2 px-3 py-1.5 rounded-lg border font-medium ${
                isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Calendar Sync ID: <span className="font-mono font-semibold text-[11px]">{config.calendarId}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title={isEs ? 'Cerrar' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <SopRulesBanner config={config} theme={theme} lang={lang} hideHeader={true} />
          
          <div className={`mt-4 p-4 rounded-xl border text-xs flex items-center justify-between ${
            isLight ? 'bg-indigo-50/50 border-indigo-100 text-slate-700' : 'bg-indigo-950/30 border-indigo-900/50 text-indigo-200'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                {isEs
                  ? 'Estas reglas se aplican automáticamente en la hoja de cálculo, importaciones en vivo y simulador.'
                  : 'These SOP rules are automatically enforced across the master spreadsheet, live imports, and check-in simulator.'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-all shadow-sm shrink-0"
            >
              {isEs ? 'Entendido' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
