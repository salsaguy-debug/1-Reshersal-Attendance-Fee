import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Sparkles, BookOpen, Layers, MousePointer, Filter, RefreshCw, Settings, Search, CheckCircle2, AlertTriangle, Users, Mail, Code2, FileSpreadsheet } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'guide' | 'sop'>('guide');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-5xl rounded-2xl shadow-2xl border overflow-hidden transition-all flex flex-col max-h-[90vh] ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'
        }`}>
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>{isEs ? 'Guía de Usuario y Manual del Sistema' : 'User Guide & System Manual'}</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/30 font-mono font-bold shrink-0">
                  {config.systemVersion}
                </span>
              </h2>
              <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isEs
                  ? 'Explicación detallada de cada botón, menú desplegable y función del sistema'
                  : 'Detailed breakdown of every button, dropdown menu, and application function'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
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

        {/* Modal Navigation Tabs */}
        <div className={`px-6 pt-3 border-b flex items-center gap-2 shrink-0 ${
          isLight ? 'bg-slate-100/60 border-slate-200' : 'bg-slate-950/40 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-t border-x transition-all ${
              activeTab === 'guide'
                ? isLight
                  ? 'bg-white text-indigo-600 border-slate-200 border-b-white font-extrabold shadow-xs'
                  : 'bg-slate-900 text-indigo-400 border-slate-800 border-b-slate-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span>{isEs ? '📘 Guía Interactiva de Funciones' : '📘 Interactive Function Guide'}</span>
          </button>

          <button
            onClick={() => setActiveTab('sop')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-t border-x transition-all ${
              activeTab === 'sop'
                ? isLight
                  ? 'bg-white text-indigo-600 border-slate-200 border-b-white font-extrabold shadow-xs'
                  : 'bg-slate-900 text-indigo-400 border-slate-800 border-b-slate-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>{isEs ? '🛡️ Matriz de Reglas y Penalizaciones SOP' : '🛡️ SOP Rules & Fee Matrix'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'sop' ? (
            <SopRulesBanner config={config} theme={theme} lang={lang} hideHeader={true} />
          ) : (
            <div className="space-y-6 text-xs leading-relaxed">
              {/* Intro Section */}
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-indigo-950/40 border-indigo-900/60 text-indigo-200'
              }`}>
                <h3 className="font-bold text-sm flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>{isEs ? 'Sistema de Asistencia y Penalización Tradición Dance Co.' : 'Tradición Dance Co. Attendance & Fee Automation'}</span>
                </h3>
                <p>
                  {isEs
                    ? 'Esta guía explica la función de cada botón, filtro y menú desplegable del sistema. Utilice el menú superior para navegar entre la vista de hoja de cálculo, el simulador y la suite de informes con inteligencia artificial.'
                    : 'This user guide documents every button, filter, dropdown menu, and action in the application. Use the top navigation bar to switch between the spreadsheet view, check-in simulator, and AI report generator.'}
                </p>
              </div>

              {/* Section 1: Header Controls */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-indigo-500 border-b pb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>{isEs ? '1. Barra de Navegación Superior' : '1. Top Navigation Bar'}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <div className="font-bold text-indigo-500 mb-1 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span>{isEs ? 'Vista Hoja de Cálculo (Spreadsheet View)' : 'Spreadsheet View Button'}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {isEs
                        ? 'Accede directamente a la cuadrícula interactiva multitabla con resumen maestro y pestañas mensuales.'
                        : 'Switches directly to the multi-tab interactive spreadsheet grid with master summary and monthly logs.'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <div className="font-bold text-indigo-500 mb-1 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-500" />
                      <span>{isEs ? 'Menú Más Acciones (More Actions)' : 'More Actions Dropdown'}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {isEs
                        ? 'Despliega el menú con métricas KPI, importación en vivo, sincronización de calendario y exportación a Google Drive.'
                        : 'Opens popover menu containing live KPI metrics, import tools, calendar sync, and Google Drive backup options.'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <div className="font-bold text-indigo-500 mb-1 flex items-center gap-1.5">
                      <span className="font-mono text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold">us EN | mx ES</span>
                      <span>{isEs ? 'Selector de Idioma' : 'Language Switcher'}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {isEs
                        ? 'Cambia instantáneamente la interfaz de usuario entre Inglés (EN) y Español (ES) con guardado automático.'
                        : 'Instantly toggles the entire user interface between English (EN) and Spanish (ES) with persistent state.'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <div className="font-bold text-indigo-500 mb-1 flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>{isEs ? 'Configuración del Sistema (Gear)' : 'System Settings Button'}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {isEs
                        ? 'Abre el panel de configuración para ajustar tarifas de penalización ($5), horas de fecha límite e ID de Google Calendar.'
                        : 'Opens configuration modal to edit penalty amounts ($5 default), deadline hours, and Google Calendar IDs.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Dropdown Menu Functions */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-indigo-500 border-b pb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>{isEs ? '2. Menú Desplegable "Más Acciones"' : '2. "More Actions" Dropdown Features'}</span>
                </h4>
                <div className="space-y-2">
                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <RefreshCw className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-indigo-500">{isEs ? 'Sincronizar Algoritmo (Sync Rev 7.4):' : 'Sync Rev 7.4:'}</span>{' '}
                      <span className="text-slate-500 dark:text-slate-400">
                        {isEs
                          ? 'Ejecuta la sincronización completa cruzando eventos de Google Calendar, respuestas del formulario y registros de asistencia.'
                          : 'Executes master synchronization matching Google Calendar dates, Google Form responses, and attendance logs.'}
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <RefreshCw className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-indigo-500">{isEs ? 'Forzar Actualización de Meses:' : 'Force Update Months:'}</span>{' '}
                      <span className="text-slate-500 dark:text-slate-400">
                        {isEs
                          ? 'Recalcula los balances mensuales, limpia la lista de exclusiones y repopula los ensayos de todo el año.'
                          : 'Recalculates monthly balances, purges excluded dancers, and repopulates yearly rehearsal dates.'}
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-indigo-500">{isEs ? 'Suite de Informes con IA:' : 'Reports & Email Suite:'}</span>{' '}
                      <span className="text-slate-500 dark:text-slate-400">
                        {isEs
                          ? 'Genera resúmenes ejecutivos semanales y borradores de correo mediante Google Gemini 3.6 Flash.'
                          : 'Generates weekly executive digests and audit email drafts powered by Google Gemini 3.6 Flash.'}
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <Code2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-indigo-500">{isEs ? 'Exportador Code.gs:' : 'Code.gs Exporter:'}</span>{' '}
                      <span className="text-slate-500 dark:text-slate-400">
                        {isEs
                          ? 'Muestra el código Google Apps Script completo para copiarlo directamente a Google Sheets.'
                          : 'Provides complete production-ready Google Apps Script code for direct Google Sheets deployment.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Spreadsheet Controls & Filters */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-indigo-500 border-b pb-1 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>{isEs ? '3. Filtros y Control de Registros en Hoja de Cálculo' : '3. Spreadsheet Controls & Filters'}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <div className="font-bold text-indigo-500 mb-1 flex items-center gap-1">
                      <Search className="w-4 h-4 text-slate-400" />
                      <span>{isEs ? 'Buscador en Tiempo Real' : 'Real-time Search Input'}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {isEs
                        ? 'Filtra instantáneamente la tabla activa por nombre de bailarín, correo electrónico, fecha o notas.'
                        : 'Instantly filters rows in the current tab by dancer name, email address, practice date, or notes.'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <div className="font-bold text-indigo-500 mb-1 flex items-center gap-1">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>{isEs ? 'Filtro de Bailarines' : 'Performer Filter Dropdown'}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {isEs
                        ? 'Aísla los registros para ver la asistencia e historial de penalizaciones de un integrante específico.'
                        : 'Isolates rows to view attendance records and penalty history for a single selected dancer.'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <div className="font-bold text-indigo-500 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{isEs ? 'Toggle de Asistencia Física' : 'Physical Attended Toggle'}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {isEs
                        ? 'Cambia la asistencia física a Sí (Presente) o No (Ausente) recalculando la tarifa SOP de $5 automáticamente.'
                        : 'Toggles physical presence between Yes (Present) and No (Absent), instantly updating SOP fee calculations.'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                    <div className="font-bold text-indigo-500 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>{isEs ? 'Selector de RSVP' : 'RSVP Status Selector'}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {isEs
                        ? 'Permite seleccionar el estado RSVP (Confirmado, Justificado, Pendiente) con actualización de tarifa.'
                        : 'Selects RSVP status (Confirmed, Excused, Pending), updating SOP penalty eligibility in real-time.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className={`px-6 py-3 border-t flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'
        }`}>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>
              {isEs
                ? 'Reglas SOP BTG REV 7.4 / REV 8 activas en todo el sistema'
                : 'SOP BTG REV 7.4 / REV 8 compliance active across system'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            {isEs ? 'Entendido' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
