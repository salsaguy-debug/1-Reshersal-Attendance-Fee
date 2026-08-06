import React, { useState } from 'react';
import { Code2, Copy, Download, Check, BookOpen } from 'lucide-react';
import { APPS_SCRIPT_REV74_CODE } from '../data/appsScriptCode';
import { Language } from '../utils/translations';

interface AppsScriptViewerProps {
  theme?: 'dark' | 'light';
  lang?: Language;
}

export const AppsScriptViewer: React.FC<AppsScriptViewerProps> = ({
  theme = 'dark',
  lang = 'en'
}) => {
  const isLight = theme === 'light';
  const isEs = lang === 'es';
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_REV74_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([APPS_SCRIPT_REV74_CODE], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`border rounded-xl shadow-xl overflow-hidden mb-8 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      {/* Code Inspector Header */}
      <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {isEs ? 'Código Fuente Google Apps Script (Code.gs - REV 8)' : 'Google Apps Script Source Code (Code.gs - REV 8)'}
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950 text-indigo-300 border-indigo-800'
              }`}>
                {isEs ? 'Script Vinculado' : 'Bound Script'}
              </span>
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isEs 
                ? 'Copia o descarga este script para adjuntarlo directamente a tu Google Sheet vía ' 
                : 'Copy or download this script to attach directly to your Google Sheet via '}
              <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>
                {isEs ? 'Extensiones > Apps Script' : 'Extensions > Apps Script'}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied 
              ? (isEs ? '¡Código Copiado!' : 'Copied Code!') 
              : (isEs ? 'Copiar Code.gs' : 'Copy Code.gs')}
          </button>

          <button
            onClick={handleDownloadCode}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow"
          >
            <Download className="w-3.5 h-3.5" />
            {isEs ? 'Descargar Code.gs' : 'Download Code.gs'}
          </button>
        </div>
      </div>

      {/* Setup Guide */}
      <div className={`p-4 border-b text-xs transition-colors ${
        isLight ? 'bg-slate-50/80 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
      }`}>
        <div className={`flex items-center gap-2 font-bold mb-2 ${
          isLight ? 'text-slate-900' : 'text-slate-100'
        }`}>
          <BookOpen className="w-4 h-4 text-emerald-500" />
          {isEs ? 'Despliegue Rápido en 3 Pasos a Google Sheets:' : 'Quick 3-Step Deployment to Google Sheets:'}
        </div>
        <ol className={`list-decimal list-inside space-y-1 ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          <li>
            {isEs ? 'Abre tu Google Sheet que contenga las pestañas: ' : 'Open your Google Sheet containing tabs: '}
            <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Form Responses 1</strong>, <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Excluded these Performers</strong>, {isEs ? 'y' : 'and'} <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Master Summary</strong>.
          </li>
          <li>
            {isEs ? 'Haz clic en ' : 'Click '}
            <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>{isEs ? 'Extensiones > Apps Script' : 'Extensions > Apps Script'}</strong>, {isEs ? 'elimina cualquier código por defecto en ' : 'delete any default code in '}
            <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Code.gs</strong>, {isEs ? 'y pega este script.' : 'and paste this script.'}
          </li>
          <li>
            {isEs ? 'Guarda y recarga tu Google Sheet. Un nuevo menú llamado ' : 'Save and reload your Google Sheet. A new menu named '}
            <strong className="text-emerald-500 font-bold">💃 Tradición REV 8</strong> {isEs ? 'aparecerá en la barra de menú.' : 'will appear on the menu bar!'}
          </li>
        </ol>
      </div>

      {/* Code Editor Preview */}
      <div className={`p-4 font-mono text-[11px] overflow-x-auto max-h-[500px] scrollbar-thin leading-relaxed ${
        isLight ? 'bg-slate-900 text-slate-200' : 'bg-slate-950 text-slate-300'
      }`}>
        <pre className="whitespace-pre">{APPS_SCRIPT_REV74_CODE}</pre>
      </div>
    </div>
  );
};
