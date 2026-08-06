import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, User, Calendar, Send, HelpCircle } from 'lucide-react';
import { Performer, PracticeEvent, RsvpStatus } from '../types';
import { Language } from '../utils/translations';

interface CheckInSimulatorProps {
  performers: Performer[];
  practices: PracticeEvent[];
  onSubmitCheckIn: (email: string, name: string, practiceDate: string, status: 'Yes' | 'No', rsvpStatus?: RsvpStatus) => void;
  theme?: 'dark' | 'light';
  lang?: Language;
}

export const CheckInSimulator: React.FC<CheckInSimulatorProps> = ({
  performers,
  practices,
  onSubmitCheckIn,
  theme = 'dark',
  lang = 'en'
}) => {
  const isLight = theme === 'light';
  const isEs = lang === 'es';
  const [selectedPerformerEmail, setSelectedPerformerEmail] = useState(performers[0]?.email || '');
  const [selectedPracticeDate, setSelectedPracticeDate] = useState(practices[0]?.date || '2026-04-02');
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('Yes');
  const [checkInStatus, setCheckInStatus] = useState<'Yes' | 'No'>('Yes');
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const performer = performers.find(p => p.email === selectedPerformerEmail);
    const name = performer ? performer.name : selectedPerformerEmail.split('@')[0];

    onSubmitCheckIn(selectedPerformerEmail, name, selectedPracticeDate, checkInStatus, rsvpStatus);
    const statusLabel = checkInStatus === 'Yes' 
      ? (isEs ? 'Sí (Presente)' : 'Yes (Present)') 
      : (isEs ? 'No (Ausente)' : 'No (Absent)');
    
    setLastSubmitted(
      isEs
        ? `Asistencia registrada para ${name} el ${selectedPracticeDate} (RSVP: ${rsvpStatus}, Asistencia: ${statusLabel})`
        : `Check-in recorded for ${name} on ${selectedPracticeDate} (RSVP: ${rsvpStatus}, Attended: ${checkInStatus})`
    );
    setTimeout(() => setLastSubmitted(null), 4000);
  };

  return (
    <div className={`border rounded-xl p-5 shadow-lg mb-8 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      <div className={`flex items-center gap-3 pb-3 border-b mb-4 ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500">
          <ClipboardCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-bold text-base flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {isEs ? 'Formulario de Asistencia a Ensayos (Simulador)' : 'Performer Rehearsal Check-In Form (Simulator)'}
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {isEs ? 'Pestaña: Respuestas de Formulario 1' : 'Tab: Form Responses 1'}
            </span>
          </h3>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {isEs 
              ? 'Simula las respuestas de RSVP y asistencia física enviadas por los bailarines para verificar el control de ensayos.' 
              : 'Simulates RSVP choices and physical check-in responses submitted by dancers.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
        <div>
          <label className={`block font-medium mb-1.5 flex items-center gap-1.5 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <User className="w-3.5 h-3.5 text-indigo-500" />
            {isEs ? 'Seleccionar Bailarín/a' : 'Select Performer'}
          </label>
          <select
            value={selectedPerformerEmail}
            onChange={e => setSelectedPerformerEmail(e.target.value)}
            className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            {performers.map(p => (
              <option key={p.id} value={p.email}>
                {p.name} ({p.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block font-medium mb-1.5 flex items-center gap-1.5 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            {isEs ? 'Fecha de Ensayo' : 'Practice Date'}
          </label>
          <select
            value={selectedPracticeDate}
            onChange={e => setSelectedPracticeDate(e.target.value)}
            className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 font-mono ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            {practices.map(pr => (
              <option key={pr.id} value={pr.date}>
                {pr.date} - {pr.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block font-medium mb-1.5 flex items-center gap-1.5 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            {isEs ? 'Estado RSVP (Google Form)' : 'RSVP Status (Form)'}
          </label>
          <select
            value={rsvpStatus}
            onChange={e => setRsvpStatus(e.target.value as RsvpStatus)}
            className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            <option value="Yes">✓ Yes ({isEs ? 'Confirmado' : 'Confirmed'})</option>
            <option value="No">ℹ No ({isEs ? 'Justificado' : 'Excused'})</option>
            <option value="Maybe">? Maybe ({isEs ? 'Tal vez' : 'Tentative'})</option>
            <option value="Awaiting">⧖ Awaiting ({isEs ? 'Pendiente' : 'Pending'})</option>
          </select>
        </div>

        <div>
          <label className={`block font-medium mb-1.5 flex items-center gap-1.5 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            {isEs ? 'Asistencia Física (Presencia)' : 'Physical Attendance'}
          </label>
          <select
            value={checkInStatus}
            onChange={e => setCheckInStatus(e.target.value as 'Yes' | 'No')}
            className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            <option value="Yes">{isEs ? 'Sí (Presente)' : 'Yes (Present)'}</option>
            <option value="No">{isEs ? 'No (Ausente)' : 'No (Absent)'}</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
            {isEs ? 'Registrar Asistencia' : 'Submit Check-In'}
          </button>
        </div>
      </form>

      {lastSubmitted && (
        <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{lastSubmitted}</span>
        </div>
      )}
    </div>
  );
};
