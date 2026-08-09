import React from 'react';
import { Calendar as CalendarIcon, ExternalLink, X } from 'lucide-react';
import { Language } from '../utils/translations';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarId?: string;
  theme?: 'dark' | 'light';
  lang?: Language;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  calendarId = 'l46591dbdq7t070djs0ta7cbac@group.calendar.google.com',
  theme = 'dark',
  lang = 'en'
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const embedUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=America%2FNew_York`;
  const directUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl shadow-2xl border ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        } overflow-hidden`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  {lang === 'es' ? 'Calendario Oficial de Ensayos' : 'Official Rehearsal Calendar'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Google Calendar
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {calendarId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={directUrl}
              target="_blank"
              rel="noreferrer"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <span>{lang === 'es' ? 'Abrir en Google' : 'Open in Google Calendar'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Iframe Live Calendar Body */}
        <div className="flex-1 w-full bg-slate-950 p-2 relative">
          <iframe
            src={embedUrl}
            title="Tradición Dance Co. Google Calendar"
            className="w-full h-full rounded-xl border border-slate-800/80 bg-white"
            style={{ border: 0 }}
            frameBorder="0"
            scrolling="no"
          />
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-between px-6 py-3 border-t text-xs ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/70 border-slate-800 text-slate-400'
          }`}
        >
          <span className="font-mono text-[11px]">
            {lang === 'es' ? 'Sincronización en tiempo real activa' : 'Live Google Calendar Integration Active'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md text-xs transition-all"
          >
            {lang === 'es' ? 'Cerrar' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
