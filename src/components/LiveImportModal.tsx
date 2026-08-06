import React, { useState } from 'react';
import {
  Upload,
  Link,
  FileText,
  Database,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  HelpCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import { AttendanceRecord, FormResponseRecord, ExcludedPerformer, RsvpStatus, AttendedStatus } from '../types';
import { Language, translations } from '../utils/translations';

interface LiveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAttendanceRecords: (records: AttendanceRecord[], mode: 'merge' | 'replace') => void;
  onImportFormResponses: (responses: FormResponseRecord[], mode: 'merge' | 'replace') => void;
  onImportExclusions: (exclusions: ExcludedPerformer[], mode: 'merge' | 'replace') => void;
  theme?: 'dark' | 'light';
  lang?: Language;
  feeRules?: {
    excusedFee: number;
    unannouncedFee?: number;
    unconfirmedFee: number;
    noShowPenalty: number;
    verifiedFee: number;
  };
}

type TargetType = 'attendance' | 'formResponses' | 'exclusions';
type ImportSource = 'sheetUrl' | 'fileUpload' | 'rawPaste' | 'webApp';

export const LiveImportModal: React.FC<LiveImportModalProps> = ({
  isOpen,
  onClose,
  onImportAttendanceRecords,
  onImportFormResponses,
  onImportExclusions,
  theme = 'dark',
  lang = 'en',
  feeRules = {
    excusedFee: 0,
    unannouncedFee: 5,
    unconfirmedFee: 5,
    noShowPenalty: 5,
    verifiedFee: 0
  }
}) => {
  const isLight = theme === 'light';
  const isEs = lang === 'es';

  const [targetType, setTargetType] = useState<TargetType>('attendance');
  const [importSource, setImportSource] = useState<ImportSource>('sheetUrl');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const [sheetUrl, setSheetUrl] = useState('');
  const [webAppUrl, setWebAppUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  // Helper to convert standard Google Sheet share link into CSV export link
  const normalizeGoogleSheetUrl = (url: string): string => {
    let cleanUrl = url.trim();
    if (!cleanUrl) return '';

    // If it's already a gviz or csv url, return it
    if (cleanUrl.includes('/gviz/tq') || cleanUrl.endsWith('.csv')) {
      return cleanUrl;
    }

    // Match google spreadsheet ID
    const matches = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (matches && matches[1]) {
      const sheetId = matches[1];
      // Check for sheet/gid param
      const gidMatch = cleanUrl.match(/[?&]gid=([0-9]+)/);
      const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
      return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;
    }

    return cleanUrl;
  };

  // Helper to calculate SOP Fee
  const calculateFee = (rsvp: RsvpStatus | string, attended: AttendedStatus | string): number => {
    const r = String(rsvp || '').trim().toLowerCase();
    const a = String(attended || '').trim().toLowerCase();
    const isAttended = a === 'yes' || a === 'present' || a === '1' || a === 'true';

    if (r === 'no' || r === 'excused') {
      return isAttended ? (feeRules.unannouncedFee ?? 5) : feeRules.excusedFee;
    }
    if (r === 'awaiting' || r === 'maybe' || r === 'tentative' || r === 'unconfirmed' || r === '') {
      return feeRules.unconfirmedFee ?? 5;
    }
    if (r === 'yes' || r === 'confirmed') {
      return isAttended ? feeRules.verifiedFee : feeRules.noShowPenalty;
    }
    return feeRules.unconfirmedFee ?? 5;
  };

  // Parse CSV/TSV text into JS Objects
  const parseRawTextToRows = (text: string) => {
    if (!text || !text.trim()) return [];

    // Try parsing JSON first
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) return json;
    } catch {
      // Not JSON, parse CSV / TSV
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    // Detect separator (comma, tab, semicolon)
    const firstLine = lines[0];
    let separator = ',';
    if (firstLine.includes('\t')) separator = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) separator = ';';

    // Parse header
    const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length === 0 || (values.length === 1 && !values[0])) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, index) => {
        rowObj[h] = values[index] || '';
      });
      // Also store raw values by index
      rowObj['_raw'] = values.join(' | ');
      rows.push(rowObj);
    }

    return rows;
  };

  // Map raw parsed rows to specific app models
  const mapRowsToTarget = (rawRows: any[], target: TargetType) => {
    if (target === 'attendance') {
      const records: AttendanceRecord[] = rawRows.map((r, idx) => {
        let email = r.email || r['performer email'] || r['email address'] || r.correo;
        if (!email && r.performer && String(r.performer).includes('@')) {
          email = String(r.performer).trim().toLowerCase();
        }
        if (!email) {
          email = `performer_${idx + 1}@tradicion.org`;
        } else {
          email = String(email).trim().toLowerCase();
        }

        let name = r.name || r['performer name'] || r.nombre;
        if (!name && r.performer && !String(r.performer).includes('@')) {
          name = String(r.performer).trim();
        }
        if (!name) {
          name = email.split('@')[0];
        }

        const date = r.date || r.fecha || r['practice date'] || new Date().toISOString().split('T')[0];

        // Day of week
        const day = r.day || r.dia || new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

        // Month key
        let monthKey = r.month || r.monthkey || r['month key'] || '';
        if (!monthKey && date) {
          try {
            const parts = date.split('-').map(Number);
            const d = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(date);
            const mName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            monthKey = mName;
          } catch {
            monthKey = 'April 2026';
          }
        }
        if (!monthKey) monthKey = 'April 2026';

        // RSVP status
        let rsvp: RsvpStatus = 'Awaiting';
        const rawRsvp = String(r.rsvp || r['rsvp status'] || '').toLowerCase();
        if (rawRsvp.includes('yes') || rawRsvp.includes('si') || rawRsvp.includes('confirmed')) rsvp = 'Yes';
        else if (rawRsvp.includes('no') || rawRsvp.includes('excused')) rsvp = 'No';
        else if (rawRsvp.includes('maybe')) rsvp = 'Maybe';

        // Attended status
        let attended: AttendedStatus = 'No';
        const rawAttended = String(r.attended || r.checkin || r['check-in'] || r.status || r['attended status'] || '').toLowerCase();
        if (rawAttended.includes('yes') || rawAttended.includes('si') || rawAttended.includes('present')) attended = 'Yes';

        // Fees
        let fees = parseFloat(r.fees || r.fee || r.penalty || '0');
        if (isNaN(fees)) {
          fees = calculateFee(rsvp, attended);
        }

        const notes = r.notes || r.note || r.comments || (fees > 0 ? 'Fee calculated from live import' : 'Verified ($0)');

        return {
          id: r.id || `live_att_${Date.now()}_${idx}`,
          date,
          day,
          performerName: name,
          performerEmail: email,
          rsvp,
          attended,
          fees,
          notes,
          monthKey
        };
      });
      return records;
    }

    if (target === 'formResponses') {
      const responses: FormResponseRecord[] = rawRows.map((r, idx) => {
        const timestamp = r.timestamp || r.time || r['marca temporal'] || new Date().toISOString().replace('T', ' ').substring(0, 19);
        const practiceDate = r['practice date'] || r['fecha de ensayo'] || r.date || r.fecha || new Date().toISOString().split('T')[0];
        
        let email = r.email || r['performer email'] || r['email address'] || r.correo;
        if (!email && r.performer && String(r.performer).includes('@')) {
          email = String(r.performer).trim().toLowerCase();
        }
        if (!email) {
          email = `dancer${idx + 1}@tradicion.org`;
        } else {
          email = String(email).trim().toLowerCase();
        }

        let name = r.name || r['performer name'] || r.nombre;
        if (!name && r.performer && !String(r.performer).includes('@')) {
          name = String(r.performer).trim();
        }
        if (!name) {
          name = email.split('@')[0];
        }

        let status: 'Yes' | 'No' = 'Yes';
        const rawStatus = String(r.status || r['check in status'] || r.attended || r['check-in'] || r.asistencia || '').toLowerCase();
        if (rawStatus.includes('no') || rawStatus.includes('absent') || rawStatus.includes('ausente')) status = 'No';

        return {
          id: r.id || `live_fr_${Date.now()}_${idx}`,
          timestamp,
          practiceDate,
          performerEmail: email,
          performerName: name,
          checkInStatus: status,
          notes: r.notes || r.comments || ''
        };
      });
      return responses;
    }

    if (target === 'exclusions') {
      const exclusions: ExcludedPerformer[] = rawRows.map((r, idx) => {
        const email = r.email || r['email address'] || r.correo || `excluded_${idx}@tradicion.org`;
        const name = r.name || r.performer || r.nombre || email.split('@')[0];
        const reason = r.reason || r.motivo || r.notes || 'Live Production Import';
        const addedDate = r.addeddate || r.date || new Date().toISOString().split('T')[0];

        return {
          email,
          name,
          reason,
          addedDate
        };
      });
      return exclusions;
    }

    return [];
  };

  const handleFetchSheet = async () => {
    setErrorMessage(null);
    if (!sheetUrl.trim()) {
      setErrorMessage(isEs ? 'Por favor ingresa una URL de Google Sheet válida.' : 'Please enter a valid Google Sheet URL.');
      return;
    }

    const exportUrl = normalizeGoogleSheetUrl(sheetUrl);
    setIsLoading(true);

    try {
      const res = await fetch(exportUrl);
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: Could not access sheet. Make sure the sheet is shared as "Anyone with link can view".`);
      }
      const text = await res.text();
      const rawRows = parseRawTextToRows(text);

      if (rawRows.length === 0) {
        throw new Error('No readable data rows found in the fetched Google Sheet.');
      }

      const mappedData = mapRowsToTarget(rawRows, targetType);
      setPreviewRows(mappedData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch Google Sheet data. Check CORS / Sharing permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchWebApp = async () => {
    setErrorMessage(null);
    if (!webAppUrl.trim()) {
      setErrorMessage(isEs ? 'Por favor ingresa la URL de tu Google Apps Script Web App.' : 'Please enter your Google Apps Script Web App URL.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(webAppUrl.trim());
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: Failed to connect to Apps Script Web App.`);
      }
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data.records || data.data || []);
      if (rows.length === 0) {
        throw new Error('Web App returned empty dataset.');
      }

      const mappedData = mapRowsToTarget(rows, targetType);
      setPreviewRows(mappedData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch from Web App endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseText = () => {
    setErrorMessage(null);
    if (!rawText.trim()) {
      setErrorMessage(isEs ? 'Por favor pega texto CSV / TSV.' : 'Please paste CSV or TSV text.');
      return;
    }

    try {
      const rawRows = parseRawTextToRows(rawText);
      if (rawRows.length === 0) {
        throw new Error('Could not parse any rows from the pasted text.');
      }
      const mappedData = mapRowsToTarget(rawRows, targetType);
      setPreviewRows(mappedData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse text.');
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setIsLoading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rawRows = parseRawTextToRows(text);
        if (rawRows.length === 0) {
          throw new Error('No readable data rows found in uploaded file.');
        }
        const mappedData = mapRowsToTarget(rawRows, targetType);
        setPreviewRows(mappedData);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to process file.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCommitImport = () => {
    if (previewRows.length === 0) return;

    if (targetType === 'attendance') {
      onImportAttendanceRecords(previewRows as AttendanceRecord[], importMode);
    } else if (targetType === 'formResponses') {
      onImportFormResponses(previewRows as FormResponseRecord[], importMode);
    } else if (targetType === 'exclusions') {
      onImportExclusions(previewRows as ExcludedPerformer[], importMode);
    }

    onClose();
  };

  const loadSampleData = () => {
    if (targetType === 'attendance') {
      const sample = `Date,Day,Performer Name,Performer Email,RSVP,Attended,Fees,Notes,Month
2026-05-02,Sat,Alejandro Garcia,alejandro.garcia@tradiciondance.org,Yes,Yes,0,Verified ($0),May 2026
2026-05-02,Sat,Sofia Martinez,sofia.martinez@tradiciondance.org,No,Yes,5,Unannounced Attendance penalty ($5),May 2026
2026-05-02,Sat,Mateo Hernandez,mateo.hernandez@tradiciondance.org,Yes,No,5,No-show penalty ($5),May 2026
2026-05-09,Sat,Camila Rodriguez,camila.rodriguez@tradiciondance.org,Awaiting,No,5,Unconfirmed penalty ($5),May 2026
2026-05-09,Sat,Lucas Gomez,lucas.gomez@tradiciondance.org,No,No,0,Excused ($0),May 2026`;
      setRawText(sample);
    } else if (targetType === 'formResponses') {
      const sample = `Timestamp,Practice Date,Performer Email,Performer Name,Check In Status,Notes
2026-05-02 09:14:22,2026-05-02,alejandro.garcia@tradiciondance.org,Alejandro Garcia,Yes,Checked in via QR
2026-05-02 09:18:05,2026-05-02,sofia.martinez@tradiciondance.org,Sofia Martinez,Yes,Late check-in
2026-05-09 09:05:11,2026-05-09,lucas.gomez@tradiciondance.org,Lucas Gomez,No,Notified director`;
      setRawText(sample);
    } else {
      const sample = `Email,Name,Reason,Date
archived.member@gmail.com,Former Dancer,Resigned / Moved,2026-04-01
temp.absence@tradiciondance.com,Temp Absence,Medical Leave,2026-04-15`;
      setRawText(sample);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {isEs ? 'Importar Datos Reales de Producción' : 'Import Live Production Data'}
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isEs
                  ? 'Carga datos de Google Sheets, CSV/Excel o Apps Script Web App en tiempo real.'
                  : 'Import live records from Google Sheets, CSV/Excel files, or Apps Script Web App.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Select Target & Import Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                1. {isEs ? 'Seleccionar Tabla Destino' : 'Select Target Table'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setTargetType('attendance'); setPreviewRows([]); }}
                  className={`p-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                    targetType === 'attendance'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                      : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {isEs ? 'Ensayos y Cuotas' : 'Rehearsal Fees'}
                </button>
                <button
                  type="button"
                  onClick={() => { setTargetType('formResponses'); setPreviewRows([]); }}
                  className={`p-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                    targetType === 'formResponses'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                      : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {isEs ? 'Asistencias Form' : 'Form Check-Ins'}
                </button>
                <button
                  type="button"
                  onClick={() => { setTargetType('exclusions'); setPreviewRows([]); }}
                  className={`p-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                    targetType === 'exclusions'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                      : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {isEs ? 'Excluidos' : 'Exclusions'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                2. {isEs ? 'Modo de Importación' : 'Import Mode'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-2.5 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                    importMode === 'merge'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {isEs ? 'Combinar (Merge)' : 'Merge & Update'}
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-2.5 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                    importMode === 'replace'
                      ? 'bg-rose-600 text-white border-rose-500 shadow'
                      : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {isEs ? 'Reemplazar Todo' : 'Replace All Data'}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Select Source */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              3. {isEs ? 'Seleccionar Fuente de Datos' : 'Select Data Source'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setImportSource('sheetUrl')}
                className={`p-2.5 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  importSource === 'sheetUrl'
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 font-bold'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                Google Sheets URL
              </button>
              <button
                type="button"
                onClick={() => setImportSource('fileUpload')}
                className={`p-2.5 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  importSource === 'fileUpload'
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 font-bold'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                {isEs ? 'Subir CSV/Excel' : 'Upload File'}
              </button>
              <button
                type="button"
                onClick={() => setImportSource('rawPaste')}
                className={`p-2.5 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  importSource === 'rawPaste'
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 font-bold'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                {isEs ? 'Pegar Texto' : 'Paste CSV/TSV'}
              </button>
              <button
                type="button"
                onClick={() => setImportSource('webApp')}
                className={`p-2.5 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  importSource === 'webApp'
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 font-bold'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apps Script Web App
              </button>
            </div>

            {/* Source Input 1: Google Sheet URL */}
            {importSource === 'sheetUrl' && (
              <div className="space-y-3 p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={e => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1ABC.../edit"
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleFetchSheet}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {isEs ? 'Cargar Sheet' : 'Fetch Sheet'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  {isEs
                    ? 'Asegúrate de que el Google Sheet esté compartido con acceso de lectura (Cualquier persona con el enlace).'
                    : 'Ensure the Google Sheet is shared with "Anyone with link can view" permissions.'}
                </p>
              </div>
            )}

            {/* Source Input 2: File Upload */}
            {importSource === 'fileUpload' && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950/40'
                }`}
              >
                <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-200 mb-1">
                  {fileName ? `Selected File: ${fileName}` : isEs ? 'Arrastra un archivo CSV, TSV o JSON aquí' : 'Drag & drop a CSV, TSV, or JSON file here'}
                </p>
                <p className="text-[11px] text-slate-400 mb-3">
                  {isEs ? 'o selecciona desde tu dispositivo' : 'or choose a file from your computer'}
                </p>
                <label className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg cursor-pointer transition-colors border border-slate-700">
                  {isEs ? 'Buscar Archivo' : 'Browse Files'}
                  <input
                    type="file"
                    accept=".csv,.tsv,.json,.txt"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Source Input 3: Raw Paste */}
            {importSource === 'rawPaste' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {isEs ? 'Pega las filas copiadas directamente de Google Sheets o Excel:' : 'Paste rows directly copied from Google Sheets or Excel:'}
                  </span>
                  <button
                    type="button"
                    onClick={loadSampleData}
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isEs ? 'Cargar Formato Ejemplo' : 'Load Sample Format'}
                  </button>
                </div>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  rows={5}
                  placeholder="Date,Day,Performer Name,Performer Email,RSVP,Attended,Fees..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleParseText}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {isEs ? 'Procesar Texto' : 'Parse Data'}
                </button>
              </div>
            )}

            {/* Source Input 4: Apps Script Web App */}
            {importSource === 'webApp' && (
              <div className="space-y-3 p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webAppUrl}
                    onChange={e => setWebAppUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleFetchWebApp}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {isEs ? 'Conectar Endpoint' : 'Fetch API'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isEs
                    ? 'Ingresa la URL del Web App de Google Apps Script para sincronización directa con tu hoja de producción.'
                    : 'Enter your deployed Google Apps Script Web App URL for automated endpoint synchronization.'}
                </p>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 3: Data Preview */}
          {previewRows.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {isEs ? `Vista Previa: ${previewRows.length} Filas Listas` : `Data Preview: ${previewRows.length} Rows Ready`}
                </span>
                <span className="text-[11px] text-slate-400">
                  Target: <strong className="text-white capitalize">{targetType}</strong> | Mode: <strong className="text-emerald-400 uppercase">{importMode}</strong>
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 sticky top-0 text-[11px] text-slate-400 uppercase font-mono">
                    <tr>
                      {targetType === 'attendance' && (
                        <>
                          <th className="p-2 border-b border-slate-800">Date</th>
                          <th className="p-2 border-b border-slate-800">Performer</th>
                          <th className="p-2 border-b border-slate-800">Email</th>
                          <th className="p-2 border-b border-slate-800">RSVP</th>
                          <th className="p-2 border-b border-slate-800">Attended</th>
                          <th className="p-2 border-b border-slate-800">Fees</th>
                        </>
                      )}
                      {targetType === 'formResponses' && (
                        <>
                          <th className="p-2 border-b border-slate-800">Timestamp</th>
                          <th className="p-2 border-b border-slate-800">Practice Date</th>
                          <th className="p-2 border-b border-slate-800">Performer</th>
                          <th className="p-2 border-b border-slate-800">Check-In</th>
                        </>
                      )}
                      {targetType === 'exclusions' && (
                        <>
                          <th className="p-2 border-b border-slate-800">Email</th>
                          <th className="p-2 border-b border-slate-800">Name</th>
                          <th className="p-2 border-b border-slate-800">Reason</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {previewRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        {targetType === 'attendance' && (
                          <>
                            <td className="p-2">{row.date}</td>
                            <td className="p-2 font-semibold text-slate-200">{row.performerName}</td>
                            <td className="p-2 text-slate-400">{row.performerEmail}</td>
                            <td className="p-2">{row.rsvp}</td>
                            <td className="p-2">{row.attended}</td>
                            <td className="p-2 font-bold text-emerald-400">${row.fees}</td>
                          </>
                        )}
                        {targetType === 'formResponses' && (
                          <>
                            <td className="p-2 text-slate-400">{row.timestamp}</td>
                            <td className="p-2">{row.practiceDate}</td>
                            <td className="p-2 font-semibold text-slate-200">{row.performerName}</td>
                            <td className="p-2">{row.checkInStatus}</td>
                          </>
                        )}
                        {targetType === 'exclusions' && (
                          <>
                            <td className="p-2 text-slate-400">{row.email}</td>
                            <td className="p-2 font-semibold text-slate-200">{row.name}</td>
                            <td className="p-2 text-rose-300">{row.reason}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewRows.length > 10 && (
                <p className="text-[11px] text-slate-500 text-center">
                  ...and {previewRows.length - 10} more rows.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors"
          >
            {isEs ? 'Cancelar' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleCommitImport}
            disabled={previewRows.length === 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isEs ? `Importar ${previewRows.length} Registros` : `Import ${previewRows.length} Production Records`}
          </button>
        </div>
      </div>
    </div>
  );
};
