import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ExternalLink, X, Users, CheckCircle2, XCircle, Clock, HelpCircle, Filter, Check, AlertCircle } from 'lucide-react';
import { Language } from '../utils/translations';
import { AttendanceRecord, Performer, RsvpStatus, AttendedStatus } from '../types';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarId?: string;
  records?: AttendanceRecord[];
  performers?: Performer[];
  onUpdateRecord?: (id: string, newRsvp: RsvpStatus, newAttended: AttendedStatus) => void;
  theme?: 'dark' | 'light';
  lang?: Language;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  calendarId = 'l46591dbdq7t070djs0ta7cbac@group.calendar.google.com',
  records = [],
  performers = [],
  onUpdateRecord,
  theme = 'dark',
  lang = 'en'
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'responses'>('responses');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [filterRsvp, setFilterRsvp] = useState<'ALL' | 'Yes' | 'No' | 'Maybe' | 'Awaiting'>('ALL');

  const isLight = theme === 'light';
  const embedUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=America%2FNew_York`;
  const directUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`;

  // Extract unique sorted rehearsal dates
  const sortedDates = useMemo(() => {
    const datesSet = new Set<string>();
    records.forEach(r => {
      if (r.date) datesSet.add(r.date);
    });
    return Array.from(datesSet).sort((a, b) => b.localeCompare(a)); // Descending order (newest first)
  }, [records]);

  // Set default selected date if not selected yet
  const effectiveDate = selectedDate || sortedDates[0] || '2026-08-05';

  // Get records for the selected practice date
  const dateRecords = useMemo(() => {
    return records.filter(r => r.date === effectiveDate);
  }, [records, effectiveDate]);

  // Response Statistics for selected date
  const stats = useMemo(() => {
    let confirmed = 0;
    let excused = 0;
    let maybe = 0;
    let awaiting = 0;

    dateRecords.forEach(r => {
      const rLower = (r.rsvp || '').toLowerCase();
      if (rLower === 'yes' || rLower === 'confirmed') confirmed++;
      else if (rLower === 'no' || rLower === 'excused') excused++;
      else if (rLower === 'maybe' || rLower === 'tentative') maybe++;
      else awaiting++;
    });

    return { confirmed, excused, maybe, awaiting, total: dateRecords.length };
  }, [dateRecords]);

  // Filtered records by selected filter tab
  const filteredRecords = useMemo(() => {
    if (filterRsvp === 'ALL') return dateRecords;
    return dateRecords.filter(r => {
      const rLower = (r.rsvp || '').toLowerCase();
      if (filterRsvp === 'Yes') return rLower === 'yes' || rLower === 'confirmed';
      if (filterRsvp === 'No') return rLower === 'no' || rLower === 'excused';
      if (filterRsvp === 'Maybe') return rLower === 'maybe' || rLower === 'tentative';
      if (filterRsvp === 'Awaiting') return rLower === 'awaiting' || rLower === 'pending' || !rLower;
      return true;
    });
  }, [dateRecords, filterRsvp]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl h-[88vh] flex flex-col rounded-2xl shadow-2xl border ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        } overflow-hidden`}
      >
        {/* Modal Header */}
        <div
          className={`flex flex-wrap items-center justify-between px-6 py-4 border-b gap-3 ${
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
                  {lang === 'es' ? 'Respuestas del Calendario de Ensayos' : 'Rehearsal Calendar & Responses'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Google Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {calendarId}
              </p>
            </div>
          </div>

          {/* Navigation View Tabs */}
          <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
            isLight ? 'bg-slate-200/70 border-slate-300' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => setActiveTab('responses')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'responses'
                  ? 'bg-indigo-600 text-white shadow-md font-bold'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{lang === 'es' ? '👥 Quién Respondió' : '👥 Who Responded (Audit)'}</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-md font-bold'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>{lang === 'es' ? '📅 Google Calendar' : '📅 Embedded Calendar'}</span>
            </button>
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
              <span>{lang === 'es' ? 'Abrir en Google' : 'Open in Google'}</span>
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

        {/* Modal Body */}
        {activeTab === 'calendar' ? (
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
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Control Bar: Select Date & Response Stats */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {lang === 'es' ? 'Seleccionar Fecha de Ensayo:' : 'Select Rehearsal Session:'}
                </label>
                <select
                  value={effectiveDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  {sortedDates.map(d => (
                    <option key={d} value={d}>
                      📅 {d} ({records.find(r => r.date === d)?.day || 'Rehearsal'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Response Summary Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5 text-xs font-extrabold font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{stats.confirmed} {lang === 'es' ? 'Confirmados (Yes)' : 'Confirmed (Yes)'}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-1.5 text-xs font-extrabold font-mono">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>{stats.excused} {lang === 'es' ? 'Excusados (No)' : 'Excused (No)'}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1.5 text-xs font-extrabold font-mono">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{stats.awaiting} {lang === 'es' ? 'Pendientes' : 'Awaiting'}</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              <button
                onClick={() => setFilterRsvp('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterRsvp === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                }`}
              >
                All Performers ({dateRecords.length})
              </button>
              <button
                onClick={() => setFilterRsvp('Yes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterRsvp === 'Yes'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                }`}
              >
                ✓ Confirmed ({stats.confirmed})
              </button>
              <button
                onClick={() => setFilterRsvp('No')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterRsvp === 'No'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                }`}
              >
                ❌ Excused ({stats.excused})
              </button>
              <button
                onClick={() => setFilterRsvp('Awaiting')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterRsvp === 'Awaiting'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                }`}
              >
                ⏳ Awaiting ({stats.awaiting})
              </button>
            </div>

            {/* Performers Response Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecords.map(r => {
                const rLower = (r.rsvp || '').toLowerCase();
                const isYes = rLower === 'yes' || rLower === 'confirmed';
                const isNo = rLower === 'no' || rLower === 'excused';
                const isMaybe = rLower === 'maybe' || rLower === 'tentative';
                const isAttended = (r.attended || '').toLowerCase() === 'yes';

                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-100 dark:text-slate-100">
                          {r.performerName}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {r.performerEmail}
                        </p>
                      </div>

                      {/* RSVP Badge */}
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 font-mono border ${
                        isYes
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isNo
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : isMaybe
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-amber-400 border-amber-500/20'
                      }`}>
                        {isYes && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {isNo && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        {isMaybe && <HelpCircle className="w-3.5 h-3.5 text-amber-400" />}
                        {!isYes && !isNo && !isMaybe && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                        <span>
                          {isYes ? '✓ Confirmed (Yes)' : isNo ? '❌ Excused (No)' : isMaybe ? '❓ Maybe' : '⏳ Awaiting'}
                        </span>
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${isAttended ? 'text-emerald-400' : 'text-slate-400'}`}>
                          Check-in: <strong className="font-mono">{r.attended === 'Yes' ? 'Present' : 'Absent'}</strong>
                        </span>
                        <span className={`font-mono font-extrabold ${r.fees > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          Fee: ${r.fees.toFixed(2)}
                        </span>
                      </div>

                      {/* One-Click Quick Action Buttons */}
                      {onUpdateRecord && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onUpdateRecord(r.id, 'Yes', r.attended)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-500/30"
                            title="Mark RSVP as Confirmed (Yes)"
                          >
                            Set Yes
                          </button>
                          <button
                            onClick={() => onUpdateRecord(r.id, 'No', r.attended)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white transition-colors border border-rose-500/30"
                            title="Mark RSVP as Excused (No)"
                          >
                            Set No
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredRecords.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 text-sm font-medium">
                  No performer responses match the selected filter for this practice date.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-between px-6 py-3 border-t text-xs ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/70 border-slate-800 text-slate-400'
          }`}
        >
          <span className="font-mono text-[11px]">
            {lang === 'es' ? 'Inspección de respuestas y asistencia en tiempo real' : 'Live Calendar & Response Audit Inspector Active'}
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
