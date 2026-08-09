import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator as CalcIcon,
  X,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  DollarSign,
  Delete
} from 'lucide-react';
import { Language } from '../utils/translations';

interface CalculatorWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  performers?: any[];
  records?: any[];
  theme?: 'dark' | 'light';
  lang?: Language;
}

export const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
  lang = 'en'
}) => {
  const isLight = theme === 'light';
  const isEs = lang === 'es';

  const [display, setDisplay] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);

  // Handle clear all
  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setIsEvaluated(false);
  };

  // Handle single backspace
  const handleBackspace = () => {
    if (isEvaluated) {
      handleClear();
      return;
    }
    if (display.length === 1 || display === 'Error') {
      setDisplay('0');
    } else {
      setDisplay(prev => prev.slice(0, -1));
    }
  };

  // Input number or decimal point
  const handleDigit = (digit: string) => {
    if (isEvaluated) {
      setDisplay(digit === '.' ? '0.' : digit);
      setExpression('');
      setIsEvaluated(false);
      return;
    }

    if (display === '0' && digit !== '.') {
      setDisplay(digit);
    } else if (digit === '.') {
      if (!display.includes('.')) {
        setDisplay(prev => prev + '.');
      }
    } else {
      if (display.length < 14) {
        setDisplay(prev => prev + digit);
      }
    }
  };

  // Input operators
  const handleOperator = (op: string) => {
    setIsEvaluated(false);
    if (display === 'Error') {
      setDisplay('0');
      setExpression('');
      return;
    }

    const formattedOp = op === '*' ? '×' : op === '/' ? '÷' : op;
    setExpression(`${display} ${formattedOp} `);
    setDisplay('0');
  };

  // Quick preset fee addition (SOP $5 penalties or custom adjustments)
  const handleAddSopPreset = (amount: number) => {
    try {
      const currentVal = parseFloat(display) || 0;
      const newVal = currentVal + amount;
      setDisplay(String(newVal));
      setExpression(prev => `${prev} + $${amount}`);
      setIsEvaluated(true);
    } catch {
      setDisplay('Error');
    }
  };

  // Calculate percentage
  const handlePercentage = () => {
    try {
      const val = parseFloat(display);
      if (!isNaN(val)) {
        const result = val / 100;
        setDisplay(String(result));
      }
    } catch {
      setDisplay('Error');
    }
  };

  // Toggle plus/minus sign
  const handleToggleSign = () => {
    try {
      const val = parseFloat(display);
      if (!isNaN(val) && val !== 0) {
        setDisplay(String(val * -1));
      }
    } catch {
      setDisplay('Error');
    }
  };

  // Evaluate expression
  const handleEquals = useCallback(() => {
    if (!expression) return;

    try {
      // Parse calculation expression safely
      const cleanExpr = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\$/g, '') + display;

      // Evaluate basic mathematical operations
      // Sanitize input to only permit numbers, basic math ops, decimals, spaces, and parentheses
      if (!/^[0-9+\-*/. ()]+$/.test(cleanExpr)) {
        setDisplay('Error');
        return;
      }

      // Safe evaluation using Function
      const evalResult = new Function(`return (${cleanExpr})`)();
      
      if (typeof evalResult === 'number' && !isNaN(evalResult) && isFinite(evalResult)) {
        // Round to max 4 decimals for fee calculations
        const rounded = Math.round(evalResult * 10000) / 10000;
        setDisplay(String(rounded));
        setExpression(`${cleanExpr} =`);
        setIsEvaluated(true);
      } else {
        setDisplay('Error');
      }
    } catch {
      setDisplay('Error');
    }
  }, [expression, display]);

  // Copy result to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === '.') {
        handleDigit('.');
      } else if (e.key === '+') {
        handleOperator('+');
      } else if (e.key === '-') {
        handleOperator('-');
      } else if (e.key === '*') {
        handleOperator('*');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('/');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'c' || e.key === 'C') {
        if (!e.ctrlKey && !e.metaKey) {
          handleClear();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display, expression, handleEquals, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in duration-150">
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl border transition-colors overflow-hidden ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Header Bar */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <CalcIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none">
                {isEs ? 'Calculadora de Cuotas y Cuotas SOP' : 'Fee & Attendance Calculator'}
              </h3>
              <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isEs ? 'Calculadora rápida para multas y balances' : 'Quick math widget for SOP balances & fees'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'text-slate-400 hover:bg-slate-200 text-slate-700' : 'text-slate-400 hover:bg-slate-800 text-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LED Digital Display */}
        <div className={`p-4 text-right border-b font-mono transition-colors ${
          isLight ? 'bg-slate-900 text-emerald-400 border-slate-200' : 'bg-black text-emerald-400 border-slate-800'
        }`}>
          <div className="text-[11px] text-slate-400 h-4 overflow-hidden truncate">
            {expression || '\u00A0'}
          </div>
          <div className="text-3xl font-bold tracking-tight overflow-x-auto scrollbar-none py-1">
            {display}
          </div>
        </div>

        {/* Quick SOP Fee Presets */}
        <div className={`p-2 border-b flex items-center justify-between gap-1.5 text-xs ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-1 ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {isEs ? 'Botones SOP:' : 'SOP Fast:'}
          </span>
          <button
            onClick={() => handleAddSopPreset(5)}
            className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-md text-[11px] font-bold transition-all"
            title={isEs ? 'Agregar Penalización SOP ($5)' : 'Add SOP $5 Penalty'}
          >
            <DollarSign className="w-3 h-3 shrink-0" />
            +$5 (Penalización)
          </button>
          <button
            onClick={() => handleAddSopPreset(10)}
            className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-md text-[11px] font-bold transition-all"
            title={isEs ? 'Agregar 2x Penalizaciones ($10)' : 'Add 2x Penalties ($10)'}
          >
            <DollarSign className="w-3 h-3 shrink-0" />
            +$10 (Doble)
          </button>
        </div>

        {/* Keypad Grid */}
        <div className="p-3 grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button
            onClick={handleClear}
            className="py-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500/20 rounded-xl font-bold text-xs transition-colors"
          >
            AC
          </button>
          <button
            onClick={handleToggleSign}
            className={`py-3 rounded-xl font-bold text-xs border transition-colors ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            ±
          </button>
          <button
            onClick={handlePercentage}
            className={`py-3 rounded-xl font-bold text-xs border transition-colors ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            %
          </button>
          <button
            onClick={() => handleOperator('/')}
            className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleDigit('7')}
            className={`py-3 rounded-xl font-semibold text-base border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            7
          </button>
          <button
            onClick={() => handleDigit('8')}
            className={`py-3 rounded-xl font-semibold text-base border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            8
          </button>
          <button
            onClick={() => handleDigit('9')}
            className={`py-3 rounded-xl font-semibold text-base border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            9
          </button>
          <button
            onClick={() => handleOperator('*')}
            className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors"
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleDigit('4')}
            className={`py-3 rounded-xl font-semibold text-base border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            4
          </button>
          <button
            onClick={() => handleDigit('5')}
            className={`py-3 rounded-xl font-semibold text-base border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            5
          </button>
          <button
            onClick={() => handleDigit('6')}
            className={`py-3 rounded-xl font-semibold text-base border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            6
          </button>
          <button
            onClick={() => handleOperator('-')}
            className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors"
          >
            -
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleDigit('1')}
            className={`py-3 rounded-xl font-semibold text-base border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            1
          </button>
          <button
            onClick={() => handleDigit('2')}
            className={`py-3 rounded-xl font-semibold text-base border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            2
          </button>
          <button
            onClick={() => handleDigit('3')}
            className={`py-3 rounded-xl font-semibold text-base border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            3
          </button>
          <button
            onClick={() => handleOperator('+')}
            className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            onClick={() => handleDigit('0')}
            className={`py-3 rounded-xl font-semibold text-base border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            0
          </button>
          <button
            onClick={() => handleDigit('.')}
            className={`py-3 rounded-xl font-bold text-base border transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            .
          </button>
          <button
            onClick={handleBackspace}
            className={`py-3 rounded-xl font-bold text-xs border flex items-center justify-center transition-colors ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Backspace"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            onClick={handleEquals}
            className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-600/30 transition-all"
          >
            =
          </button>
        </div>

        {/* Footer Bar with Copy Result Action */}
        <div className={`p-3 border-t flex items-center justify-between gap-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              copied
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isEs ? '¡Copiado!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{isEs ? 'Copiar Resultado' : 'Copy Result'}</span>
              </>
            )}
          </button>

          <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            {isEs ? 'Soporta teclado (Enter/Esc)' : 'Keyboard enabled (Enter/Esc)'}
          </span>
        </div>
      </div>
    </div>
  );
};
