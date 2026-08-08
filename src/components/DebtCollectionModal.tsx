import React, { useState, useMemo } from 'react';
import {
  Scale,
  DollarSign,
  AlertTriangle,
  Send,
  CheckCircle2,
  Copy,
  Mail,
  ShieldAlert,
  FileText,
  User,
  CreditCard,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Building2,
  Lock
} from 'lucide-react';
import { Performer, AttendanceRecord, SystemConfig } from '../types';
import { Language } from '../utils/translations';
import { PaymentTransaction } from './PerformerDetailView';

interface DebtCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  performers: Performer[];
  records: AttendanceRecord[];
  payments: PaymentTransaction[];
  config: SystemConfig;
  onAddPayment: (payment: PaymentTransaction) => void;
  theme?: 'dark' | 'light';
  lang?: Language;
}

export const DebtCollectionModal: React.FC<DebtCollectionModalProps> = ({
  isOpen,
  onClose,
  performers,
  records,
  payments,
  config,
  onAddPayment,
  theme = 'dark',
  lang = 'en'
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const isEs = lang === 'es';

  // State
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [paymentPlan, setPaymentPlan] = useState<'lump_sum' | '2_month' | '4_month' | 'waiver'>('lump_sum');
  const [customSettlementAmount, setCustomSettlementAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'Venmo' | 'Zelle' | 'Cash' | 'Check' | 'Other'>('Venmo');
  const [noticeCopied, setNoticeCopied] = useState<boolean>(false);
  const [settlementSuccessMsg, setSettlementSuccessMsg] = useState<string | null>(null);

  // Calculate overdue balances for all performers
  const delinquentSummaries = useMemo(() => {
    const list: Array<{
      performer: Performer;
      totalFees: number;
      totalPaid: number;
      netOwed: number;
      penaltyCount: number;
      unpaidRecords: AttendanceRecord[];
    }> = [];

    performers.forEach(p => {
      const emailLower = p.email.toLowerCase().trim();
      const pRecords = records.filter(r => r.performerEmail.toLowerCase().trim() === emailLower);
      const pPayments = payments.filter(pay => pay.performerEmail.toLowerCase().trim() === emailLower);

      const totalFees = pRecords.reduce((sum, r) => sum + (r.fees || 0), 0);
      const totalPaid = pPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
      const netOwed = Math.max(0, totalFees - totalPaid);
      const unpaidRecords = pRecords.filter(r => r.fees > 0);

      if (netOwed > 0) {
        list.push({
          performer: p,
          totalFees,
          totalPaid,
          netOwed,
          penaltyCount: unpaidRecords.length,
          unpaidRecords
        });
      }
    });

    return list.sort((a, b) => b.netOwed - a.netOwed);
  }, [performers, records, payments]);

  // Set default selected email if empty
  const activeSummary = useMemo(() => {
    if (selectedEmail) {
      return delinquentSummaries.find(s => s.performer.email.toLowerCase() === selectedEmail.toLowerCase()) || delinquentSummaries[0] || null;
    }
    return delinquentSummaries[0] || null;
  }, [selectedEmail, delinquentSummaries]);

  const activeEmail = activeSummary?.performer.email || '';

  // KPI Metrics
  const totalDelinquentDebt = delinquentSummaries.reduce((sum, s) => sum + s.netOwed, 0);
  const totalDelinquentCount = delinquentSummaries.length;

  // Notice Text Generator
  const noticeText = useMemo(() => {
    if (!activeSummary) return '';
    const p = activeSummary.performer;
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    let planText = 'Full Lump-Sum Recovery';
    if (paymentPlan === '2_month') planText = '2-Month Installment Plan ($' + (activeSummary.netOwed / 2).toFixed(2) + '/mo)';
    if (paymentPlan === '4_month') planText = '4-Month Installment Plan ($' + (activeSummary.netOwed / 4).toFixed(2) + '/mo)';
    if (paymentPlan === 'waiver') planText = 'Hardship SOP Fee Review Pending';

    return `OFFICIAL NOTICE: REHEARSAL FEE & DUES RECOVERY INTAKE
Organization: ${config.companyName || 'Tradición Dance Co.'}
Date Issued: ${dateStr}
Case Ref: CASE-RECOVERY-${p.email.split('@')[0].toUpperCase()}

PERFORMER DETAILS:
Name: ${p.name}
Email: ${p.email}
Role: ${p.role || 'Dancer'}

ACCOUNT FINANCIAL SUMMARY:
Total Accrued SOP Fees & Dues: $${activeSummary.totalFees.toFixed(2)}
Total Amount Paid to Date: $${activeSummary.totalPaid.toFixed(2)}
CURRENT OUTSTANDING OWED BALANCE: $${activeSummary.netOwed.toFixed(2)}
Status: 30+ DAYS OVERDUE (BTG SOP REV 7.4)

RECOVERY PLAN OPTION:
Selected Terms: ${planText}

UNCONFIRMED & NO-SHOW REHEARSALS LEDGER BREAKDOWN:
${activeSummary.unpaidRecords.map(r => ` • ${r.date} (${r.day}): ${r.notes || 'Unconfirmed/No-Show Fee'} — $${r.fees.toFixed(2)}`).join('\n')}

PAYMENT INSTRUCTIONS:
Please settle your outstanding balance of $${activeSummary.netOwed.toFixed(2)} via Venmo or Zelle:
 • Venmo: @TradicionDanceCo
 • Zelle: admin@tradiciondance.org
 • Note: "${p.name} - Rehearsal Dues Settlement"

For hardship review or payment arrangements, reply directly to this notice or contact director@tradiciondance.org.`;
  }, [activeSummary, paymentPlan, config]);

  // Handle Record Payment Settlement
  const handleRecordSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSummary) return;

    const amountToPay = Number(customSettlementAmount) || activeSummary.netOwed;
    if (amountToPay <= 0) return;

    const newPayment: PaymentTransaction = {
      id: `pay_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      performerEmail: activeSummary.performer.email,
      performerName: activeSummary.performer.name,
      date: new Date().toISOString().split('T')[0],
      amount: amountToPay,
      method: payMethod,
      notes: `Debt Recovery Intake Settlement (${paymentPlan})`
    };

    onAddPayment(newPayment);
    setCustomSettlementAmount('');
    setSettlementSuccessMsg(
      isEs
        ? `¡Pago de $${amountToPay.toFixed(2)} registrado exitosamente para ${activeSummary.performer.name}!`
        : `Successfully recorded $${amountToPay.toFixed(2)} recovery payment for ${activeSummary.performer.name}!`
    );

    setTimeout(() => setSettlementSuccessMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`border rounded-3xl p-6 w-full max-w-5xl shadow-2xl transition-colors my-8 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Header Bar */}
        <div className={`flex items-center justify-between pb-4 border-b mb-6 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isEs ? 'Recuperación y Cobro de Deudas (Debt Collection & Fees)' : 'Debt Collection & Fee Recovery Intake'}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  SOP REV 7.4 Engine
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isEs 
                  ? 'Gestión administrativa de cobro de recargos por inasistencia y cuotas morosas.' 
                  : 'Administrative recovery workflow for overdue rehearsal penalties, no-shows, and late dues.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top KPI Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className={`p-4 rounded-2xl border transition-colors ${
            isLight ? 'bg-rose-50/80 border-rose-200' : 'bg-rose-950/40 border-rose-900/60'
          }`}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-500 font-mono flex items-center justify-between">
              <span>{isEs ? 'Deuda Total Morosa' : 'Total Delinquent Debt'}</span>
              <DollarSign className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">
              ${totalDelinquentDebt.toFixed(2)}
            </div>
            <div className="text-[10px] text-rose-500/80 mt-0.5">
              {isEs ? 'Recargos acumulados sin pagar' : 'Accrued unpaid SOP fees'}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border transition-colors ${
            isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-950/40 border-amber-900/60'
          }`}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500 font-mono flex items-center justify-between">
              <span>{isEs ? 'Integrantes en Mora' : 'Overdue Performers'}</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {totalDelinquentCount} {isEs ? 'Integrantes' : 'Dancers'}
            </div>
            <div className="text-[10px] text-amber-500/80 mt-0.5">
              {isEs ? 'Saldo pendiente > $0' : 'Accounts with balance > $0'}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border transition-colors ${
            isLight ? 'bg-purple-50/80 border-purple-200' : 'bg-purple-950/40 border-purple-900/60'
          }`}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-500 font-mono flex items-center justify-between">
              <span>{isEs ? 'Casos Activos' : 'Active Intake Cases'}</span>
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-extrabold font-mono text-purple-600 dark:text-purple-400 mt-1">
              {delinquentSummaries.filter(s => s.netOwed >= 20).length} {isEs ? 'Críticos' : 'Priority'}
            </div>
            <div className="text-[10px] text-purple-500/80 mt-0.5">
              {isEs ? 'SOP > $20 en recargos' : 'High priority balances'}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border transition-colors ${
            isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-950/40 border-emerald-900/60'
          }`}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 font-mono flex items-center justify-between">
              <span>{isEs ? 'Métodos de Pago' : 'Accepted Channels'}</span>
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              Venmo & Zelle
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">
              @TradicionDanceCo
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {settlementSuccessMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{settlementSuccessMsg}</span>
          </div>
        )}

        {/* Main Grid: Left Directory + Right Recovery Notice & Intake */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Delinquent Performers Directory (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className={`font-bold text-xs uppercase tracking-wider flex items-center justify-between ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                {isEs ? 'Integrantes Morosos (> $0)' : 'Delinquent Accounts Directory'}
              </span>
              <span className="font-mono text-[10px] text-rose-400">
                {delinquentSummaries.length} {isEs ? 'Casos' : 'Cases'}
              </span>
            </h3>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
              {delinquentSummaries.length === 0 ? (
                <div className={`p-8 text-center text-xs rounded-2xl border border-dashed ${
                  isLight ? 'text-slate-500 border-slate-300' : 'text-slate-500 border-slate-800'
                }`}>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  {isEs ? '¡Felicidades! Todos los integrantes están al día con sus cuotas ($0 morosidad).' : 'No delinquent accounts found! All performers are up-to-date with $0 balance.'}
                </div>
              ) : (
                delinquentSummaries.map(s => {
                  const isSelected = activeEmail.toLowerCase() === s.performer.email.toLowerCase();

                  return (
                    <button
                      key={s.performer.id}
                      onClick={() => setSelectedEmail(s.performer.email)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-900/80 to-indigo-900/80 text-white border-purple-500 shadow-lg scale-[1.01]'
                          : isLight
                          ? 'bg-slate-50 hover:bg-purple-50/60 border-slate-200 text-slate-800'
                          : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-sm ${
                          isSelected
                            ? 'bg-purple-500 text-white border border-purple-300'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {s.performer.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate flex items-center gap-1.5">
                            <span className="truncate">{s.performer.name}</span>
                          </div>
                          <div className={`text-[11px] truncate font-mono ${
                            isSelected ? 'text-purple-200' : isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {s.performer.email}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-xs font-mono font-bold text-rose-500">
                          -${s.netOwed.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-rose-400/80 font-mono">
                          {s.penaltyCount} {isEs ? 'recargos' : 'penalties'}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Recovery Notice & Payment Settlement Engine (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {activeSummary ? (
              <>
                {/* Active Case Details Header */}
                <div className={`p-4 rounded-2xl border transition-colors ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-xs text-purple-400">
                      <FileText className="w-4 h-4" />
                      <span>{isEs ? 'Expediente de Cobro:' : 'Recovery Case File:'} {activeSummary.performer.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded">
                      -${activeSummary.netOwed.toFixed(2)} OVERDUE
                    </span>
                  </div>

                  {/* Payment Plan Options Selector */}
                  <div className="mt-3">
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      {isEs ? 'Opción de Plan de Recuperación / Acuerdo:' : 'Recovery Settlement & Installment Terms:'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentPlan('lump_sum')}
                        className={`p-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                          paymentPlan === 'lump_sum'
                            ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                            : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        {isEs ? 'Pago Total' : 'Full Settlement'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentPlan('2_month')}
                        className={`p-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                          paymentPlan === '2_month'
                            ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                            : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        {isEs ? '2 Cuotas' : '2-Month Plan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentPlan('4_month')}
                        className={`p-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                          paymentPlan === '4_month'
                            ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                            : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        {isEs ? '4 Cuotas' : '4-Month Plan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentPlan('waiver')}
                        className={`p-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                          paymentPlan === 'waiver'
                            ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                            : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        {isEs ? 'Revisión SOP' : 'Hardship SOP'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Legal Recovery Demand Notice Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="recovery-notice-textarea" className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isLight ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      {isEs ? 'Notificación Formal de Cobro (Demand Letter)' : 'Generated Official Demand Notice'}
                    </label>

                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${activeSummary.performer.email}?subject=${encodeURIComponent(`OFFICIAL NOTICE: Rehearsal Dues Settlement - ${activeSummary.performer.name}`)}&body=${encodeURIComponent(noticeText)}`}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors shadow"
                      >
                        <Send className="w-3 h-3" />
                        {isEs ? 'Enviar Correo' : 'Send Demand Email'}
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(noticeText);
                          setNoticeCopied(true);
                          setTimeout(() => setNoticeCopied(false), 2000);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-colors ${
                          noticeCopied
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <Copy className="w-3 h-3 text-purple-400" />
                        {noticeCopied ? (isEs ? '¡Copiado!' : 'Copied!') : (isEs ? 'Copiar Notificación' : 'Copy Notice')}
                      </button>
                    </div>
                  </div>

                  <textarea
                    id="recovery-notice-textarea"
                    name="recoveryNoticeTextarea"
                    rows={8}
                    readOnly
                    value={noticeText}
                    className={`w-full p-3 font-mono text-[11px] rounded-2xl border focus:outline-none scrollbar-thin ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  />
                </div>

                {/* Quick Record Payment Settlement Form */}
                <form onSubmit={handleRecordSettlement} className={`p-4 rounded-2xl border transition-colors space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className={`font-bold text-xs flex items-center gap-2 ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      {isEs ? 'Registrar Liquidación de Pago / Recobro' : 'Record Payment Settlement'}
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {isEs ? 'Actualiza el Ledger' : 'Ledger Update'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="settlement-amount" className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        isLight ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        {isEs ? 'Monto a Cobrar ($)' : 'Settlement Amount ($)'}
                      </label>
                      <input
                        id="settlement-amount"
                        name="settlementAmount"
                        type="number"
                        step="0.01"
                        value={customSettlementAmount}
                        onChange={e => setCustomSettlementAmount(e.target.value)}
                        placeholder={`$${activeSummary.netOwed.toFixed(2)}`}
                        className={`w-full border rounded-xl p-2 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500 ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="settlement-method" className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        isLight ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        {isEs ? 'Canal de Pago' : 'Payment Method'}
                      </label>
                      <select
                        id="settlement-method"
                        name="settlementMethod"
                        value={payMethod}
                        onChange={e => setPayMethod(e.target.value as any)}
                        className={`w-full border rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
                        }`}
                      >
                        <option value="Venmo">Venmo (@TradicionDanceCo)</option>
                        <option value="Zelle">Zelle (admin@tradiciondance.org)</option>
                        <option value="Cash">Cash (Efectivo)</option>
                        <option value="Check">Check (Cheque)</option>
                        <option value="Other">Other (Otro)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isEs ? 'Registrar Pago' : 'Record Settlement'}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <div className={`p-12 text-center text-xs rounded-2xl border border-dashed ${
                isLight ? 'text-slate-500 border-slate-300' : 'text-slate-500 border-slate-800'
              }`}>
                {isEs ? 'Selecciona un integrante para generar la notificación de cobro.' : 'Select a performer on the left to generate legal recovery notice.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
