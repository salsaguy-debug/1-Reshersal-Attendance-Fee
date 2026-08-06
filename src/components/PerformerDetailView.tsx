import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Mail,
  ShieldAlert,
  Calendar,
  Filter,
  CreditCard,
  Send,
  User,
  X,
  TrendingUp,
  Sparkles,
  UserX
} from 'lucide-react';
import {
  Performer,
  AttendanceRecord,
  ExcludedPerformer,
  RsvpStatus,
  AttendedStatus,
  SystemConfig
} from '../types';
import { Language, translateMonthStr } from '../utils/translations';

export interface PaymentTransaction {
  id: string;
  performerEmail: string;
  performerName: string;
  date: string;
  amount: number;
  method: 'Venmo' | 'Zelle' | 'Cash' | 'Check' | 'Other';
  notes?: string;
}

interface PerformerDetailViewProps {
  performers: Performer[];
  records: AttendanceRecord[];
  exclusions: ExcludedPerformer[];
  config: SystemConfig;
  theme?: 'dark' | 'light';
  lang?: Language;
  onUpdateRecord?: (id: string, newRsvp: RsvpStatus, newAttended: AttendedStatus) => void;
  onToggleExclusion?: (email: string, name: string) => void;
  payments?: PaymentTransaction[];
  onAddPayment?: (payment: PaymentTransaction) => void;
}

export const PerformerDetailView: React.FC<PerformerDetailViewProps> = ({
  performers,
  records,
  exclusions,
  config,
  theme = 'dark',
  lang = 'en',
  onUpdateRecord,
  onToggleExclusion,
  payments = [],
  onAddPayment
}) => {
  const isLight = theme === 'light';
  const isEs = lang === 'es';

  // Selected Performer State
  const [selectedEmail, setSelectedEmail] = useState<string>(
    performers.length > 0 ? performers[0].email : ''
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'owed' | 'good' | 'excluded'>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');

  // Payment Recording Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [payAmount, setPayAmount] = useState<number>(5);
  const [payMethod, setPayMethod] = useState<'Venmo' | 'Zelle' | 'Cash' | 'Check' | 'Other'>('Venmo');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Email Statement Modal State
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailCopied, setEmailCopied] = useState<boolean>(false);

  // Map of exclusions for fast lookup
  const excludedEmailSet = useMemo(() => {
    return new Set(exclusions.map(e => e.email.toLowerCase().trim()));
  }, [exclusions]);

  // Compute summary stats per performer
  const performerSummaries = useMemo(() => {
    const map = new Map<string, {
      performer: Performer;
      records: AttendanceRecord[];
      totalFees: number;
      totalPaid: number;
      netOwed: number;
      attendedCount: number;
      totalSessions: number;
      penaltyCount: number;
      isExcluded: boolean;
    }>();

    performers.forEach(p => {
      const emailLower = p.email.toLowerCase().trim();
      const pRecords = records.filter(r => r.performerEmail.toLowerCase().trim() === emailLower);
      const isExcluded = excludedEmailSet.has(emailLower);
      
      const totalFees = isExcluded ? 0 : pRecords.reduce((sum, r) => sum + (r.fees || 0), 0);
      const pPayments = payments.filter(pay => pay.performerEmail.toLowerCase().trim() === emailLower);
      const totalPaid = pPayments.reduce((sum, pay) => sum + pay.amount, 0);
      const netOwed = Math.max(0, totalFees - totalPaid);

      const totalSessions = pRecords.length;
      const attendedCount = pRecords.filter(r => r.attended === 'Yes').length;
      const penaltyCount = pRecords.filter(r => r.fees > 0).length;

      map.set(emailLower, {
        performer: p,
        records: pRecords,
        totalFees,
        totalPaid,
        netOwed,
        attendedCount,
        totalSessions,
        penaltyCount,
        isExcluded
      });
    });

    return map;
  }, [performers, records, payments, excludedEmailSet]);

  // Filtered Performer Directory
  const filteredPerformers = useMemo(() => {
    return performers.filter(p => {
      const emailLower = p.email.toLowerCase().trim();
      const summary = performerSummaries.get(emailLower);

      // Keyword search
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (directoryFilter === 'owed') return (summary?.netOwed || 0) > 0;
      if (directoryFilter === 'good') return (summary?.netOwed || 0) === 0 && !summary?.isExcluded;
      if (directoryFilter === 'excluded') return summary?.isExcluded;

      return true;
    });
  }, [performers, searchTerm, directoryFilter, performerSummaries]);

  // Selected Performer Object & Summary Data
  const currentSummary = useMemo(() => {
    if (!selectedEmail) return null;
    return performerSummaries.get(selectedEmail.toLowerCase().trim()) || null;
  }, [selectedEmail, performerSummaries]);

  const currentPerformer = currentSummary?.performer || performers.find(p => p.email.toLowerCase() === selectedEmail.toLowerCase());

  // Filtered records for selected performer by month
  const selectedPerformerRecords = useMemo(() => {
    if (!currentSummary) return [];
    if (selectedMonthFilter === 'ALL') return currentSummary.records;
    return currentSummary.records.filter(r => r.monthKey === selectedMonthFilter);
  }, [currentSummary, selectedMonthFilter]);

  // Filtered payments for selected performer
  const selectedPerformerPayments = useMemo(() => {
    if (!selectedEmail) return [];
    const emailLower = selectedEmail.toLowerCase().trim();
    return payments.filter(p => p.performerEmail.toLowerCase().trim() === emailLower);
  }, [selectedEmail, payments]);

  // Handle Log Payment Submission
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPerformer) return;

    const newPayObj: PaymentTransaction = {
      id: `PAY-${Date.now()}`,
      performerEmail: currentPerformer.email,
      performerName: currentPerformer.name,
      date: payDate,
      amount: Number(payAmount),
      method: payMethod,
      notes: payNotes
    };

    if (onAddPayment) {
      onAddPayment(newPayObj);
    }

    setShowPaymentModal(false);
    setPayNotes('');
  };

  // Generate Email Statement Text
  const emailStatementText = useMemo(() => {
    if (!currentPerformer || !currentSummary) return '';
    
    const statusText = currentSummary.netOwed > 0 
      ? `OUTSTANDING BALANCE: $${currentSummary.netOwed.toFixed(2)}`
      : 'BALANCE CLEARED: $0.00 (Good Standing)';

    return `Hello ${currentPerformer.name},

Here is your current Rehearsal Attendance & Fee Statement for Tradición Dance Co.:

------------------------------------------------
Performer: ${currentPerformer.name} (${currentPerformer.email})
Role: ${currentPerformer.role}
Status: ${statusText}
Total Attended Sessions: ${currentSummary.attendedCount} / ${currentSummary.totalSessions} (${currentSummary.totalSessions ? Math.round((currentSummary.attendedCount / currentSummary.totalSessions) * 100) : 100}%)
Total Accrued Penalty Fees: $${currentSummary.totalFees.toFixed(2)}
Total Paid Fees: $${currentSummary.totalPaid.toFixed(2)}
Net Amount Owed: $${currentSummary.netOwed.toFixed(2)}
------------------------------------------------

Pending Penalty Breakdowns:
${selectedPerformerRecords.filter(r => r.fees > 0).map(r => `• ${r.date} (${r.monthKey}): ${r.notes || 'SOP Penalty'} - $${r.fees.toFixed(2)}`).join('\n') || 'None - All sessions compliant!'}

Please submit any outstanding balances via Zelle/Venmo or contact administration for assistance.

Thank you for your commitment to Tradición Dance Co.!
SOP Compliance Engine Rev 7.4`;
  }, [currentPerformer, currentSummary, selectedPerformerRecords]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className={`p-4 sm:p-6 rounded-2xl border shadow-lg transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/25 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                {isEs ? 'Panel Individual por Integrante' : 'Performer Detail Dashboard'}
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  By Performer
                </span>
              </h2>
              <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isEs
                  ? 'Revisa el historial de asistencia, penalizaciones SOP acumuladas y registro de pagos por bailarín.'
                  : 'Inspect individual dancer attendance history, accrued SOP fee penalties, and ledger payments.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <Users className="w-4 h-4 text-indigo-500" />
              <span>{performers.length} {isEs ? 'Integrantes Registrados' : 'Tracked Performers'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Sidebar Directory + Right Detail Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Performer Directory Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className={`p-4 rounded-2xl border shadow-md transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            {/* Directory Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/60">
              <h3 className={`font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <Users className="w-4 h-4 text-indigo-500" />
                {isEs ? 'Directorio de Integrantes' : 'Performer Directory'}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {filteredPerformers.length} {isEs ? 'Activos' : 'Active'}
              </span>
            </div>

            {/* Directory Search & Filters */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  id="performer-directory-search"
                  name="performerDirectorySearch"
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={isEs ? 'Buscar por nombre o correo...' : 'Filter list by name or email...'}
                  className={`w-full border rounded-xl pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                  }`}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                id="performer-directory-category"
                name="performerDirectoryCategory"
                value={directoryFilter}
                onChange={e => setDirectoryFilter(e.target.value as any)}
                className={`w-full border rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <option value="all">{isEs ? 'Todos los Integrantes' : 'All Performers'}</option>
                <option value="owed">{isEs ? '⚠️ Con Saldo Pendiente (> $0)' : '⚠️ Outstanding Owed (> $0)'}</option>
                <option value="good">{isEs ? '✓ Al Día ($0 Due)' : '✓ Good Standing ($0 Due)'}</option>
                <option value="excluded">{isEs ? '🛡️ Excluidos (Lista Negra)' : '🛡️ Excluded (Blocklist)'}</option>
              </select>
            </div>

            {/* Scrollable Performer List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredPerformers.length === 0 ? (
                <div className={`p-6 text-center text-xs rounded-xl border border-dashed ${
                  isLight ? 'text-slate-500 border-slate-300' : 'text-slate-500 border-slate-800'
                }`}>
                  {isEs ? 'No se encontraron integrantes que coincidan con la búsqueda.' : 'No performers matching search criteria.'}
                </div>
              ) : (
                filteredPerformers.map(p => {
                  const summary = performerSummaries.get(p.email.toLowerCase().trim());
                  const isSelected = selectedEmail.toLowerCase().trim() === p.email.toLowerCase().trim();
                  const isExcluded = summary?.isExcluded || false;
                  const netOwed = summary?.netOwed || 0;

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedEmail(p.email)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20 scale-[1.01]'
                          : isLight
                          ? 'bg-slate-50 hover:bg-indigo-50/50 border-slate-200 text-slate-800'
                          : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Initial Avatar Circle */}
                        <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-sm ${
                          isSelected
                            ? 'bg-white/20 text-white border border-white/30'
                            : isExcluded
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : netOwed > 0
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate flex items-center gap-1.5">
                            <span className="truncate">{p.name}</span>
                            {isExcluded && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-normal">
                                {isEs ? 'Excluido' : 'Excluded'}
                              </span>
                            )}
                          </div>
                          <div className={`text-[11px] truncate ${
                            isSelected ? 'text-indigo-100' : isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {p.email}
                          </div>
                        </div>
                      </div>

                      {/* Right Balance Badge */}
                      <div className="shrink-0 text-right">
                        {isExcluded ? (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            isSelected ? 'bg-white/20 text-white border-white/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            🛡️ $0
                          </span>
                        ) : netOwed > 0 ? (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-rose-500 text-white border-rose-400'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          }`}>
                            -${netOwed.toFixed(0)} {isEs ? 'PENDIENTE' : 'OWED'}
                          </span>
                        ) : (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-emerald-500 text-white border-emerald-400'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          }`}>
                            ✓ $0
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Performer Detail Dashboard (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {currentPerformer && currentSummary ? (
            <>
              {/* 1. Header Profile Banner */}
              <div className={`p-6 rounded-2xl border shadow-lg transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/30 shrink-0">
                      {currentPerformer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-black text-xl sm:text-2xl ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {currentPerformer.name}
                        </h3>
                        {currentSummary.isExcluded ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {isEs ? 'Excluido de Penalizaciones' : 'Excluded (Blocklisted)'}
                          </span>
                        ) : currentSummary.netOwed > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {isEs ? '🔴 Pendiente de Pago' : '🔴 Overdue Balance'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isEs ? '🟢 Al Día (Good Standing)' : '🟢 Good Standing'}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs mt-1 flex items-center gap-3 font-mono ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        <span>✉️ {currentPerformer.email}</span>
                        <span>•</span>
                        <span>🎭 Role: {currentPerformer.role || 'Dancer'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setPayAmount(currentSummary.netOwed || 5);
                        setShowPaymentModal(true);
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-500/20"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      {isEs ? '+ Registrar Pago' : '+ Record Payment'}
                    </button>

                    <button
                      onClick={() => setShowEmailModal(true)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      {isEs ? 'Enviar Estado' : 'Email Statement'}
                    </button>

                    {onToggleExclusion && (
                      <button
                        onClick={() => onToggleExclusion(currentPerformer.email, currentPerformer.name)}
                        className={`p-2 rounded-xl text-xs font-semibold transition-colors border ${
                          currentSummary.isExcluded
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                        title={currentSummary.isExcluded ? 'Re-activar Integrante' : 'Excluir Integrante'}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. 4 Summary Metric Cards (Grid) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  {/* Card 1: Paid Fees */}
                  <div className={`p-3.5 rounded-xl border transition-colors ${
                    isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/30 border-emerald-900/40'
                  }`}>
                    <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {isEs ? 'TOTAL PAGADO 2026' : 'TOTAL PAID 2026'}
                    </div>
                    <div className="text-xl font-black text-emerald-500 font-mono">
                      ${currentSummary.totalPaid.toFixed(2)}
                    </div>
                  </div>

                  {/* Card 2: Accrued Penalties */}
                  <div className={`p-3.5 rounded-xl border transition-colors ${
                    isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/30 border-amber-900/40'
                  }`}>
                    <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      {isEs ? 'PENALIZACIONES SOP' : 'ACCRUED PENALTIES'}
                    </div>
                    <div className="text-xl font-black text-amber-500 font-mono">
                      ${currentSummary.totalFees.toFixed(2)}
                      <span className="text-xs text-amber-400 font-normal ml-1">
                        ({currentSummary.penaltyCount} {isEs ? 'sesiones' : 'sessions'})
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Outstanding Owed */}
                  <div className={`p-3.5 rounded-xl border transition-colors ${
                    isLight ? 'bg-rose-50/60 border-rose-200' : 'bg-rose-950/30 border-rose-900/40'
                  }`}>
                    <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-rose-500" />
                      {isEs ? 'SALDO PENDIENTE' : 'OUTSTANDING OWED'}
                    </div>
                    <div className="text-xl font-black text-rose-500 font-mono">
                      ${currentSummary.netOwed.toFixed(2)}
                    </div>
                  </div>

                  {/* Card 4: Attendance Compliance Rate */}
                  <div className={`p-3.5 rounded-xl border transition-colors ${
                    isLight ? 'bg-indigo-50/60 border-indigo-200' : 'bg-indigo-950/30 border-indigo-900/40'
                  }`}>
                    <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      {isEs ? 'TASA DE ASISTENCIA' : 'ATTENDANCE RATE'}
                    </div>
                    <div className="text-xl font-black text-indigo-400 font-mono">
                      {currentSummary.totalSessions > 0
                        ? `${Math.round((currentSummary.attendedCount / currentSummary.totalSessions) * 100)}%`
                        : '100%'}
                      <span className="text-xs text-indigo-300 font-normal ml-1">
                        ({currentSummary.attendedCount}/{currentSummary.totalSessions})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Rehearsal Attendance & Fee History Ledger Table */}
              <div className={`p-6 rounded-2xl border shadow-lg transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {isEs ? 'Historial de Asistencia y Penalizaciones SOP' : 'Rehearsal Attendance & SOP Fee Ledger'}
                    </h3>
                  </div>

                  {/* Month Filter Selector */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      id="performer-month-filter"
                      name="performerMonthFilter"
                      value={selectedMonthFilter}
                      onChange={e => setSelectedMonthFilter(e.target.value)}
                      className={`border rounded-xl px-3 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500 ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                      }`}
                    >
                      <option value="ALL">{isEs ? 'Todos los Meses' : 'All Season Months'}</option>
                      {config.activeMonths.map(m => (
                        <option key={m} value={m}>
                          {translateMonthStr(m, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto">
                  <table className={`w-full text-left text-xs border-collapse ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <thead>
                      <tr className={`border-b uppercase font-mono text-[11px] tracking-wider transition-colors ${
                        isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}>
                        <th className="p-3">Fecha & Mes</th>
                        <th className="p-3">{isEs ? 'Día' : 'Day'}</th>
                        <th className="p-3">Estado RSVP (Form)</th>
                        <th className="p-3">Asistencia Física</th>
                        <th className="p-3 text-right">Tarifa SOP ($)</th>
                        <th className="p-3">Motivo / Regla SOP</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                      {selectedPerformerRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={`p-8 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                            {isEs
                              ? 'No hay registros de ensayos registrados para este integrante en el mes seleccionado.'
                              : 'No rehearsal records found for this performer in the selected period.'}
                          </td>
                        </tr>
                      ) : (
                        selectedPerformerRecords.map(rec => (
                          <tr key={rec.id} className={`transition-colors ${
                            rec.fees > 0
                              ? isLight ? 'bg-amber-50/40 hover:bg-amber-50/80' : 'bg-amber-950/20 hover:bg-amber-950/40'
                              : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                          }`}>
                            {/* Date & Month */}
                            <td className="p-3 font-mono font-semibold text-slate-200">
                              {rec.date}
                              <span className="text-[10px] block font-normal text-slate-400">{rec.monthKey}</span>
                            </td>

                            {/* Day */}
                            <td className="p-3 font-mono text-slate-400">{rec.day}</td>

                            {/* RSVP Status dropdown */}
                            <td className="p-3">
                              {onUpdateRecord ? (
                                <select
                                  id={`performer-rsvp-${rec.id}`}
                                  name={`performerRsvp_${rec.id}`}
                                  value={rec.rsvp}
                                  onChange={e => onUpdateRecord(rec.id, e.target.value as RsvpStatus, rec.attended)}
                                  className={`border rounded-md px-2 py-1 font-bold text-xs focus:outline-none cursor-pointer ${
                                    rec.rsvp === 'Yes'
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                                      : rec.rsvp === 'No'
                                      ? 'bg-sky-950/80 text-sky-300 border-sky-700'
                                      : rec.rsvp === 'Maybe'
                                      ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                      : 'bg-slate-900 text-slate-300 border-slate-700'
                                  }`}
                                >
                                  <option value="Yes">✓ Yes (Confirmed)</option>
                                  <option value="No">ℹ No (Excused)</option>
                                  <option value="Maybe">? Maybe (Tentative)</option>
                                  <option value="Awaiting">⧖ Awaiting (Pending)</option>
                                </select>
                              ) : (
                                <span className="font-semibold">{rec.rsvp}</span>
                              )}
                            </td>

                            {/* Physical Attendance dropdown */}
                            <td className="p-3">
                              {onUpdateRecord ? (
                                <select
                                  id={`performer-attended-${rec.id}`}
                                  name={`performerAttended_${rec.id}`}
                                  value={rec.attended}
                                  onChange={e => onUpdateRecord(rec.id, rec.rsvp, e.target.value as AttendedStatus)}
                                  className={`border rounded-md px-2 py-1 font-bold text-xs focus:outline-none cursor-pointer ${
                                    rec.attended === 'Yes'
                                      ? 'bg-emerald-900/80 text-emerald-200 border-emerald-600'
                                      : 'bg-rose-900/80 text-rose-200 border-rose-600'
                                  }`}
                                >
                                  <option value="Yes">✓ Yes (Present)</option>
                                  <option value="No">⚠ No (Absent)</option>
                                </select>
                              ) : (
                                <span className="font-semibold">{rec.attended}</span>
                              )}
                            </td>

                            {/* SOP Fee Amount */}
                            <td className={`p-3 font-mono font-bold text-right text-xs ${
                              rec.fees > 0 ? 'text-rose-400 font-black' : 'text-emerald-400'
                            }`}>
                              ${rec.fees.toFixed(2)}
                            </td>

                            {/* Rule / Reason */}
                            <td className="p-3 text-slate-300 text-xs">
                              {rec.notes || (rec.fees > 0 ? 'SOP Penalty Fee' : 'Verified Attendance')}
                            </td>

                            {/* Status Badge */}
                            <td className="p-3 text-center">
                              {currentSummary.isExcluded ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  🛡️ Excluded
                                </span>
                              ) : rec.fees > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  ! Due ($5)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  ✓ Clear
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Payment Transaction History */}
              <div className={`p-6 rounded-2xl border shadow-lg transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {isEs ? 'Historial de Pagos Transaccionales' : 'Linked Payment Transaction History'}
                    </h3>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    {selectedPerformerPayments.length} {isEs ? 'transacciones' : 'records'}
                  </span>
                </div>

                {selectedPerformerPayments.length === 0 ? (
                  <div className={`p-6 text-center text-xs rounded-xl border border-dashed ${
                    isLight ? 'text-slate-500 border-slate-300' : 'text-slate-500 border-slate-800'
                  }`}>
                    <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    {isEs
                      ? 'No hay registros de pagos recibidos para este integrante aún.'
                      : 'No payment records found for this performer yet.'}
                    <button
                      onClick={() => {
                        setPayAmount(currentSummary.netOwed || 5);
                        setShowPaymentModal(true);
                      }}
                      className="mt-3 block mx-auto text-indigo-400 hover:underline font-semibold text-xs"
                    >
                      {isEs ? '+ Registrar Primer Pago' : '+ Record First Payment'}
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={`w-full text-left text-xs border-collapse ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <thead>
                        <tr className={`border-b uppercase font-mono text-[11px] tracking-wider transition-colors ${
                          isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}>
                          <th className="p-3">ID Transacción</th>
                          <th className="p-3">Fecha</th>
                          <th className="p-3">Método</th>
                          <th className="p-3 text-right">Monto Pagado</th>
                          <th className="p-3">Notas</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                        {selectedPerformerPayments.map(pay => (
                          <tr key={pay.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-mono text-indigo-400">{pay.id}</td>
                            <td className="p-3 font-mono">{pay.date}</td>
                            <td className="p-3 font-semibold text-emerald-400">{pay.method}</td>
                            <td className="p-3 font-mono font-black text-right text-emerald-400">
                              +${pay.amount.toFixed(2)}
                            </td>
                            <td className="p-3 text-slate-400">{pay.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`p-12 text-center rounded-2xl border shadow-lg ${
              isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <User className="w-12 h-12 text-indigo-500 mx-auto mb-3 opacity-50" />
              <p className="font-semibold text-sm">
                {isEs ? 'Selecciona un integrante del directorio para ver su panel individual.' : 'Select a performer from the directory to inspect their profile.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Record Fee Payment */}
      {showPaymentModal && currentPerformer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-2xl p-6 w-full max-w-md shadow-2xl transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className={`font-bold text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <CreditCard className="w-5 h-5 text-emerald-500" />
                {isEs ? `Registrar Pago de Cuota — ${currentPerformer.name}` : `Record Fee Payment — ${currentPerformer.name}`}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="pay-date" className="block font-semibold mb-1 text-slate-400">
                  {isEs ? 'Fecha del Pago' : 'Payment Date'}
                </label>
                <input
                  id="pay-date"
                  name="payDate"
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                  required
                />
              </div>

              <div>
                <label htmlFor="pay-amount" className="block font-semibold mb-1 text-slate-400">
                  {isEs ? 'Monto Recibido ($)' : 'Amount Paid ($)'}
                </label>
                <input
                  id="pay-amount"
                  name="payAmount"
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className={`w-full border rounded-xl p-2.5 font-mono font-bold text-base text-emerald-400 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                  required
                />
              </div>

              <div>
                <label htmlFor="pay-method" className="block font-semibold mb-1 text-slate-400">
                  {isEs ? 'Método de Pago' : 'Payment Method'}
                </label>
                <select
                  id="pay-method"
                  name="payMethod"
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className={`w-full border rounded-xl p-2.5 font-semibold ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <option value="Venmo">Venmo</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Cash">Cash / Efectivo</option>
                  <option value="Check">Check / Cheque</option>
                  <option value="Other">Other / Otro</option>
                </select>
              </div>

              <div>
                <label htmlFor="pay-notes" className="block font-semibold mb-1 text-slate-400">
                  {isEs ? 'Notas / Referencia' : 'Notes / Transaction Ref'}
                </label>
                <input
                  id="pay-notes"
                  name="payNotes"
                  type="text"
                  placeholder="e.g. Paid via Venmo confirmation #9812"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className={`px-4 py-2 rounded-xl font-medium ${
                    isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  {isEs ? 'Guardar Transacción' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Email Statement */}
      {showEmailModal && currentPerformer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-2xl p-6 w-full max-w-lg shadow-2xl transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className={`font-bold text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Mail className="w-5 h-5 text-indigo-500" />
                {isEs ? `Estado de Cuenta — ${currentPerformer.name}` : `Email Statement — ${currentPerformer.name}`}
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label htmlFor="email-statement-preview" className="block font-semibold mb-1 text-slate-400">
                  {isEs ? 'Vista Previa del Correo / Reporte' : 'Email Content Preview'}
                </label>
                <textarea
                  id="email-statement-preview"
                  name="emailStatementPreview"
                  rows={10}
                  readOnly
                  value={emailStatementText}
                  className={`w-full p-3 font-mono text-[11px] rounded-xl border focus:outline-none scrollbar-thin ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href={`mailto:${currentPerformer.email}?subject=${encodeURIComponent(`Tradición Dance Co. Statement - ${currentPerformer.name}`)}&body=${encodeURIComponent(emailStatementText)}`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow"
                >
                  <Send className="w-4 h-4" />
                  {isEs ? 'Abrir App de Correo (Mailto)' : 'Open in Mail App'}
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(emailStatementText);
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 2000);
                  }}
                  className={`px-4 py-2 rounded-xl font-semibold border flex items-center gap-1.5 transition-colors ${
                    emailCopied
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  {emailCopied ? (isEs ? '¡Copiado!' : 'Copied!') : (isEs ? 'Copiar Texto' : 'Copy Text')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
