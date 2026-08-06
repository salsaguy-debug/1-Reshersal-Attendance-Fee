import React, { useState } from 'react';
import {
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  Calendar,
  DollarSign,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { AttendanceRecord, MasterSummaryRow, SystemConfig, ReportLog } from '../types';
import { Language, translations } from '../utils/translations';

interface ReportsModalProps {
  config: SystemConfig;
  records: AttendanceRecord[];
  masterSummary: MasterSummaryRow[];
  reportLogs: ReportLog[];
  onAddReportLog: (log: ReportLog) => void;
  theme?: 'dark' | 'light';
  lang?: Language;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  config,
  records,
  masterSummary,
  reportLogs,
  onAddReportLog,
  theme = 'dark',
  lang = 'en'
}) => {
  const isLight = theme === 'light';
  const isEs = lang === 'es';
  const t = translations[lang] || translations.en;
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'ai'>('weekly');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copiedAi, setCopiedAi] = useState(false);

  // Compute stats for reports
  const totalCompanyOutstanding = masterSummary.reduce((acc, m) => acc + m.totalFees, 0);
  const performersWithFees = masterSummary.filter(m => m.totalFees > 0);
  const penaltyRecords = records.filter(r => r.fees > 0);

  const handleSendWeeklyReport = async () => {
    setIsSending(true);
    setSendStatus(null);

    try {
      const res = await fetch('/api/reports/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'Weekly Absence & Fee Report',
          recipientEmails: config.adminEmails,
          subject: `📊 Tradición Weekly Attendance & Fee Report - ${new Date().toISOString().split('T')[0]}`,
          bodyHtml: `<p>Weekly Absence and Fee report dispatched for ${penaltyRecords.length} flagged sessions.</p>`
        })
      });

      const data = await res.json();
      if (data.success) {
        setSendStatus(
          isEs
            ? `Reporte semanal enviado con éxito a ${config.adminEmails.join(', ')}`
            : `Weekly report emailed successfully to ${config.adminEmails.join(', ')}`
        );
        onAddReportLog({
          id: `rep_${Date.now()}`,
          type: 'Weekly',
          sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          recipients: config.adminEmails,
          summaryText: isEs
            ? `Reporte semanal enviado. ${penaltyRecords.length} sesiones con penalización identificadas por un total de $${penaltyRecords.reduce((acc, r) => acc + r.fees, 0).toFixed(2)}.`
            : `Weekly report sent. ${penaltyRecords.length} penalty sessions flagged totaling $${penaltyRecords.reduce((acc, r) => acc + r.fees, 0).toFixed(2)}.`,
          totalOutstanding: penaltyRecords.reduce((acc, r) => acc + r.fees, 0)
        });
      }
    } catch (err) {
      setSendStatus(isEs ? 'Error al enviar el correo. Revisa el registro del servidor.' : 'Failed to dispatch email. Check server log.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMonthlyReport = async () => {
    setIsSending(true);
    setSendStatus(null);

    try {
      const res = await fetch('/api/reports/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'Monthly Executive Final Report',
          recipientEmails: config.adminEmails,
          subject: `🏆 Tradición Monthly Executive Financial Summary - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          bodyHtml: `<p>Monthly executive report dispatched. Total company balance: $${totalCompanyOutstanding.toFixed(2)}.</p>`
        })
      });

      const data = await res.json();
      if (data.success) {
        setSendStatus(
          isEs
            ? '¡Reporte mensual ejecutivo enviado con éxito a los directores!'
            : 'Monthly Executive report emailed successfully to directors!'
        );
        onAddReportLog({
          id: `rep_${Date.now()}`,
          type: 'Monthly Final',
          sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          recipients: config.adminEmails,
          summaryText: isEs
            ? `Reporte mensual cerrado. Balance total de la compañía: $${totalCompanyOutstanding.toFixed(2)} a través de ${performersWithFees.length} bailarines.`
            : `Monthly report closed out. Total company balance: $${totalCompanyOutstanding.toFixed(2)} across ${performersWithFees.length} performers.`,
          totalOutstanding: totalCompanyOutstanding
        });
      }
    } catch (err) {
      setSendStatus(isEs ? 'Error al enviar el reporte mensual.' : 'Failed to dispatch monthly report.');
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateAiSummary = async () => {
    setIsGeneratingAi(true);
    setAiSummary(null);

    try {
      const res = await fetch('/api/reports/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceRecords: records,
          masterSummary,
          reportType: 'Weekly & Monthly SOP Review'
        })
      });

      const data = await res.json();
      if (data.summary) {
        setAiSummary(data.summary);
      } else if (data.fallbackSummary) {
        setAiSummary(data.fallbackSummary);
      }
    } catch (err) {
      setAiSummary(isEs ? 'Error de comunicación con la ruta del servidor de IA.' : 'Failed to communicate with AI server route.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const copyAiText = () => {
    if (aiSummary) {
      navigator.clipboard.writeText(aiSummary);
      setCopiedAi(true);
      setTimeout(() => setCopiedAi(false), 2000);
    }
  };

  return (
    <div className={`border rounded-xl shadow-xl overflow-hidden mb-8 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {isEs ? '📊 Menú de Reportes y Envíos de Correo' : '📊 Custom UI Menu: Reports & Email Dispatches'}
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
              }`}>
                {isEs ? 'Servicio MailApp Activo' : 'MailApp Service Active'}
              </span>
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isEs 
                ? 'Envía reportes semanales y mensuales automatizados directamente a los contactos de correo administrativo.'
                : 'Dispatches automated Weekly & Monthly reports directly to administrative email contacts'}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className={`flex items-center gap-1 p-1 rounded-lg border text-xs ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'weekly' ? 'bg-indigo-600 text-white shadow font-bold' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isEs ? 'Reporte Semanal' : 'Weekly Report'}
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'monthly' ? 'bg-indigo-600 text-white shadow font-bold' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isEs ? 'Reporte Mensual Final' : 'Monthly Final Report'}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow font-bold'
                : isLight ? 'text-purple-700 hover:text-purple-900' : 'text-purple-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isEs ? 'Resumen Ejecutivo IA' : 'AI Executive Digest'}
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Weekly Report View */}
        {activeTab === 'weekly' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div>
                <h4 className={`font-bold text-sm flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}>
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  {isEs ? 'Desglose Semanal de Ausencias y Tarifas (sendWeeklyReport)' : 'Weekly Absence & Fee Breakdown (sendWeeklyReport)'}
                </h4>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isEs 
                    ? 'Marca RSVPs sin confirmar ($5), penalizaciones por inasistencia ($5) y asistencia verificada en el ciclo semanal activo.'
                    : 'Flags unconfirmed RSVPs ($5), no-show penalties ($5), and verified attendance across the active weekly cycle.'}
                </p>
              </div>

              <button
                onClick={handleSendWeeklyReport}
                disabled={isSending}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg flex items-center gap-2 transition-all shadow shrink-0 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isEs ? 'Enviar Reporte Semanal por MailApp' : 'Send Weekly Report via MailApp'}
              </button>
            </div>

            {/* Email HTML Preview */}
            <div className={`p-4 rounded-xl border font-sans text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className={`border-b pb-2 mb-3 font-mono text-[11px] flex flex-wrap justify-between gap-2 ${
                isLight ? 'text-slate-600 border-slate-200' : 'text-slate-400 border-slate-800'
              }`}>
                <div><strong>{isEs ? 'Para:' : 'To:'}</strong> {config.adminEmails.join(', ')}</div>
                <div><strong>{isEs ? 'Asunto:' : 'Subject:'}</strong> 📊 Tradición Weekly Attendance &amp; Fee Report</div>
              </div>

              <div className="space-y-3">
                <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {isEs ? 'Resumen Semanal de Ausencias y Tarifas - Tradición Dance Co. (Rev 7.4)' : 'Tradición Dance Co. Weekly Absence & Fee Summary (Rev 7.4)'}
                </h4>
                <p className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  {isEs 
                    ? 'A continuación se presenta el desglose actual de RSVPs sin confirmar, inasistencias y penalizaciones pendientes:'
                    : 'Below is the current breakdown of unconfirmed RSVPs, no-shows, and outstanding fee penalties:'}
                </p>

                <div className="overflow-x-auto">
                  <table className={`w-full text-left text-xs border-collapse ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    <thead>
                      <tr className={`border-b ${
                        isLight ? 'bg-slate-200/70 text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}>
                        <th className="p-2">{t.date}</th>
                        <th className="p-2">{t.performer}</th>
                        <th className="p-2">{t.rsvp}</th>
                        <th className="p-2">{t.attended}</th>
                        <th className="p-2 text-right">{t.fee}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                      {penaltyRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-500">
                            {isEs 
                              ? 'No se registraron RSVPs sin confirmar ni penalizaciones por inasistencia esta semana.' 
                              : 'No unconfirmed RSVPs or no-show penalties logged for this week.'}
                          </td>
                        </tr>
                      ) : (
                        penaltyRecords.map((item, idx) => (
                          <tr key={idx} className={isLight ? 'hover:bg-slate-100/60' : 'hover:bg-slate-900/50'}>
                            <td className={`p-2 font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{item.date} ({item.day})</td>
                            <td className={`p-2 font-medium ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{item.performerName}</td>
                            <td className="p-2 font-semibold text-amber-500">{item.rsvp}</td>
                            <td className="p-2 font-semibold text-rose-500">{item.attended}</td>
                            <td className="p-2 text-right font-mono font-bold text-rose-500">
                              ${item.fees.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className={`pt-2 text-right font-bold text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {isEs ? 'Total de Tarifas Semanales Pendientes: ' : 'Total Weekly Outstanding Fees: '}
                  <span className="text-rose-500">${penaltyRecords.reduce((acc, r) => acc + r.fees, 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Final Report View */}
        {activeTab === 'monthly' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div>
                <h4 className={`font-bold text-sm flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  {isEs ? 'Reporte Final Ejecutivo Mensual (sendMonthlyFinalReport)' : 'Monthly Executive Final Report (sendMonthlyFinalReport)'}
                </h4>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isEs 
                    ? 'Agrega estados de cuenta anuales de todos los meses de ensayo activos para revisión financiera ejecutiva.'
                    : 'Aggregates annual balance statements across all active rehearsal months for executive financial review.'}
                </p>
              </div>

              <button
                onClick={handleSendMonthlyReport}
                disabled={isSending}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg flex items-center gap-2 transition-all shadow shrink-0 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isEs ? 'Enviar Reporte Mensual Ejecutivo' : 'Send Executive Monthly Report'}
              </button>
            </div>

            {/* Email HTML Preview */}
            <div className={`p-4 rounded-xl border font-sans text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className={`border-b pb-2 mb-3 font-mono text-[11px] flex flex-wrap justify-between gap-2 ${
                isLight ? 'text-slate-600 border-slate-200' : 'text-slate-400 border-slate-800'
              }`}>
                <div><strong>{isEs ? 'Para:' : 'To:'}</strong> {config.adminEmails.join(', ')}</div>
                <div><strong>{isEs ? 'Asunto:' : 'Subject:'}</strong> 🏆 Tradición Monthly Executive Financial Summary</div>
              </div>

              <div className="space-y-3">
                <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {isEs ? 'Revisión Financiera Ejecutiva Mensual - Tradición Dance Co. (Rev 7.4)' : 'Tradición Dance Co. Monthly Executive Financial Review (Rev 7.4)'}
                </h4>
                <p className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  {isEs 
                    ? 'Resumen ejecutivo de balances anuales de los integrantes en todos los meses de ensayo activos:'
                    : 'Executive summary of annual member balance statements across all active rehearsal months:'}
                </p>

                <div className="overflow-x-auto">
                  <table className={`w-full text-left text-xs border-collapse ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    <thead>
                      <tr className={`border-b ${
                        isLight ? 'bg-slate-200/70 text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}>
                        <th className="p-2">{t.performer}</th>
                        <th className="p-2">{t.email}</th>
                        <th className="p-2 text-right">{t.totalBalance}</th>
                        <th className="p-2 text-center">{t.status}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                      {masterSummary.map((m, idx) => (
                        <tr key={idx} className={isLight ? 'hover:bg-slate-100/60' : 'hover:bg-slate-900/50'}>
                          <td className={`p-2 font-medium ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{m.performerName}</td>
                          <td className={`p-2 font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{m.performerEmail}</td>
                          <td className="p-2 text-right font-mono font-bold">
                            {m.totalFees > 0 ? (
                              <span className="text-rose-500">${m.totalFees.toFixed(2)}</span>
                            ) : (
                              <span className="text-emerald-500">$0.00</span>
                            )}
                          </td>
                          <td className="p-2 text-center font-semibold">
                            {m.totalFees > 0 ? (
                              <span className="text-rose-500">{t.outstanding}</span>
                            ) : (
                              <span className="text-emerald-500">{t.paidInFull}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={`pt-2 text-right font-bold text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {isEs ? 'Balance Total Pendiente de la Compañía: ' : 'Total Company Outstanding Balance: '}
                  <span className="text-rose-500">${totalCompanyOutstanding.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gemini AI Executive Digest View */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isLight ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-950 border-purple-900/50'
            }`}>
              <div>
                <h4 className={`font-bold text-sm flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}>
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  {isEs ? 'Resumen Ejecutivo con IA de Gemini y Generador de Borradores' : 'Gemini AI Executive Digest & Performer Email Draft Generator'}
                </h4>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isEs 
                    ? 'Genera un análisis narrativo inteligente de asistencia, cumplimiento de SOP y recordatorios para bailarines.'
                    : 'Generates an AI analytical narrative of rehearsal attendance, SOP compliance, and custom performer reminders.'}
                </p>
              </div>

              <button
                onClick={handleGenerateAiSummary}
                disabled={isGeneratingAi}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs rounded-lg flex items-center gap-2 transition-all shadow shrink-0 disabled:opacity-50"
              >
                {isGeneratingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                {isEs ? 'Generar Resumen Ejecutivo IA' : 'Generate AI Executive Summary'}
              </button>
            </div>

            {aiSummary ? (
              <div className={`p-5 rounded-xl border text-xs relative ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}>
                <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
                  isLight ? 'border-slate-300' : 'border-slate-800'
                }`}>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isEs ? 'Resultado Narrativo Ejecutivo (Gemini 3.6 Flash)' : 'Gemini 3.6 Flash Executive Narrative Output'}
                  </span>

                  <button
                    onClick={copyAiText}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors border ${
                      isLight 
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {copiedAi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedAi ? (isEs ? '¡Copiado!' : 'Copied!') : (isEs ? 'Copiar Resumen' : 'Copy Summary')}
                  </button>
                </div>

                <div className={`whitespace-pre-wrap font-sans leading-relaxed ${
                  isLight ? 'text-slate-800' : 'text-slate-300'
                }`}>
                  {aiSummary}
                </div>
              </div>
            ) : (
              <div className={`p-8 text-center border border-dashed rounded-xl ${
                isLight ? 'bg-slate-50/60 border-slate-300 text-slate-500' : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}>
                <Sparkles className="w-8 h-8 text-purple-500/40 mx-auto mb-2 animate-pulse" />
                <p className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isEs 
                    ? 'Haz clic en "Generar Resumen Ejecutivo IA" para analizar la asistencia a los ensayos y redactar recordatorios con Gemini AI.'
                    : 'Click "Generate AI Executive Summary" to analyze company rehearsal attendance and draft performer reminders with Gemini AI.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Status Notification */}
        {sendStatus && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sendStatus}</span>
          </div>
        )}

        {/* Historical Dispatch Logs */}
        {reportLogs.length > 0 && (
          <div className={`mt-6 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <h5 className={`text-xs font-bold uppercase tracking-wider mb-2 font-mono ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {isEs ? 'Historial Reciente de Envíos de Correo (MailApp)' : 'Recent Email Dispatch Logs (MailApp)'}
            </h5>
            <div className="space-y-2">
              {reportLogs.map(log => (
                <div key={log.id} className={`p-2.5 border rounded-lg text-xs flex items-center justify-between gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div>
                    <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{log.type} Report</span>
                    <span className={`font-mono text-[11px] ml-2 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>({log.sentAt})</span>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{log.summaryText}</p>
                  </div>
                  <span className="font-mono text-emerald-500 font-bold shrink-0">
                    ${log.totalOutstanding.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
