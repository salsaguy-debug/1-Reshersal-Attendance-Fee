import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Search,
  Mail,
  Filter,
  ChevronDown,
  X,
  AlertCircle,
  Check,
  UserX,
  FileUp,
  Upload,
  Clipboard,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Calendar
} from 'lucide-react';
import {
  AttendanceRecord,
  MasterSummaryRow,
  FormResponseRecord,
  ExcludedPerformer,
  RsvpStatus,
  AttendedStatus
} from '../types';
import { Language, translations, translateMonthStr } from '../utils/translations';

interface SpreadsheetViewProps {
  records: AttendanceRecord[];
  masterSummary: MasterSummaryRow[];
  formResponses: FormResponseRecord[];
  exclusions: ExcludedPerformer[];
  availableMonths: string[];
  onUpdateRecord: (id: string, rsvp: RsvpStatus, attended: AttendedStatus) => void;
  onBatchUpdateRecords?: (ids: string[], updates: { rsvp?: RsvpStatus; attended?: AttendedStatus }) => void;
  onDeleteRecord: (id: string) => void;
  onCreateRecord: (rec: Omit<AttendanceRecord, 'id' | 'fees'>) => void;
  onAddExclusion: (email: string, name?: string, reason?: string) => void;
  onDeleteExclusion: (email: string) => void;
  onBulkAddExclusions: (items: { email: string; name?: string; reason?: string }[]) => void;
  onPurgeExclusions: () => void;
  onForceUpdateMonths?: () => void;
  onRunSync?: () => void;
  onAddMonthTab?: (month: string) => void;
  isSyncing?: boolean;
  theme?: 'dark' | 'light';
  lang?: Language;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  records,
  masterSummary,
  formResponses,
  exclusions,
  availableMonths,
  onUpdateRecord,
  onBatchUpdateRecords,
  onDeleteRecord,
  onCreateRecord,
  onAddExclusion,
  onDeleteExclusion,
  onBulkAddExclusions,
  onPurgeExclusions,
  onForceUpdateMonths,
  onRunSync,
  onAddMonthTab,
  isSyncing = false,
  theme = 'dark',
  lang = 'en'
}) => {
  const isLight = theme === 'light';
  const isEs = lang === 'es';
  const t = translations[lang] || translations.en;

  // Active Tab selection
  const tabs = useMemo(() => {
    return [
      'Master Summary',
      ...availableMonths,
      'Form Responses 1',
      'Excluded these Performers'
    ];
  }, [availableMonths]);

  const [activeTab, setActiveTab] = useState<string>('Master Summary');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmailFilter, setSelectedEmailFilter] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<string>('ALL');
  const [attendedFilter, setAttendedFilter] = useState<string>('ALL');

  // Multi-Record Selection State for Batch Operations
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());

  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRsvp, setNewRsvp] = useState<RsvpStatus>('Yes');
  const [newAttended, setNewAttended] = useState<AttendedStatus>('Yes');

  // Add Single Exclusion Modal State
  const [showAddExclusionModal, setShowAddExclusionModal] = useState(false);
  const [exEmail, setExEmail] = useState('');
  const [exName, setExName] = useState('');
  const [exReason, setExReason] = useState('Resigned / Left Company');

  // Bulk CSV Exclusions Import Modal State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [defaultReason, setDefaultReason] = useState('Leave of Absence / Excluded');
  const [isDragOver, setIsDragOver] = useState(false);

  // Compute unique performer emails for global dropdown
  const allPerformerEmails = useMemo(() => {
    const emailMap = new Map<string, string>();
    records.forEach(r => emailMap.set(r.performerEmail, r.performerName));
    masterSummary.forEach(m => emailMap.set(m.performerEmail, m.performerName));
    formResponses.forEach(f => emailMap.set(f.performerEmail, f.performerName));
    exclusions.forEach(e => emailMap.set(e.email, e.name || e.email));
    return Array.from(emailMap.entries()).map(([email, name]) => ({ email, name }));
  }, [records, masterSummary, formResponses, exclusions]);

  // Filtered Master Summary Rows
  const filteredMasterRows = useMemo(() => {
    return masterSummary.filter(row => {
      const matchSearch =
        row.performerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.performerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEmail = selectedEmailFilter ? row.performerEmail === selectedEmailFilter : true;
      return matchSearch && matchEmail;
    });
  }, [masterSummary, searchTerm, selectedEmailFilter]);

  // Filtered Monthly Attendance Records
  const filteredMonthlyRecords = useMemo(() => {
    if (!availableMonths.includes(activeTab)) return [];
    return records.filter(rec => {
      const recMonth = rec.monthKey || (rec as any).monthTab || '';
      const matchMonth = recMonth === activeTab;
      const matchSearch =
        rec.performerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.performerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.date.includes(searchTerm);
      const matchEmail = selectedEmailFilter ? rec.performerEmail === selectedEmailFilter : true;
      const matchRsvp = rsvpFilter === 'ALL' ? true : rec.rsvp === rsvpFilter;
      const matchAttended = attendedFilter === 'ALL' ? true : rec.attended === attendedFilter;
      return matchMonth && matchSearch && matchEmail && matchRsvp && matchAttended;
    });
  }, [records, activeTab, availableMonths, searchTerm, selectedEmailFilter, rsvpFilter, attendedFilter]);

  // Filtered Form Responses
  const filteredFormResponses = useMemo(() => {
    return formResponses.filter(fr => {
      const matchSearch =
        fr.performerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fr.performerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fr.practiceDate.includes(searchTerm);
      const matchEmail = selectedEmailFilter ? fr.performerEmail === selectedEmailFilter : true;
      return matchSearch && matchEmail;
    });
  }, [formResponses, searchTerm, selectedEmailFilter]);

  // Table Column Sorting State
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Helper function to render a clickable, sortable header cell
  const renderSortableHeader = (
    key: string,
    label: string,
    align: 'left' | 'center' | 'right' = 'left',
    className: string = ''
  ) => {
    const isSorted = sortColumn === key;
    return (
      <th
        onClick={() => handleSort(key)}
        className={`p-3 font-semibold select-none cursor-pointer transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-800/80 ${
          align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
        } ${isLight ? 'text-slate-800 hover:text-indigo-600' : 'text-slate-200 hover:text-indigo-400'} ${className}`}
        title={isEs ? `Hacer clic para ordenar por ${label}` : `Click to sort by ${label}`}
      >
        <div className={`inline-flex items-center gap-1.5 ${
          align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
        }`}>
          <span>{label}</span>
          {isSorted ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-indigo-500 font-bold shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-indigo-500 font-bold shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 hover:opacity-100 shrink-0" />
          )}
        </div>
      </th>
    );
  };

  // Sorted Master Summary Rows
  const sortedMasterRows = useMemo(() => {
    if (!sortColumn) return filteredMasterRows;
    return [...filteredMasterRows].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortColumn === 'performerName') {
        aVal = a.performerName.toLowerCase();
        bVal = b.performerName.toLowerCase();
      } else if (sortColumn === 'performerEmail') {
        aVal = a.performerEmail.toLowerCase();
        bVal = b.performerEmail.toLowerCase();
      } else if (sortColumn === 'totalFees') {
        aVal = a.totalFees;
        bVal = b.totalFees;
      } else if (sortColumn === 'status') {
        aVal = a.totalFees > 0 ? 1 : 0;
        bVal = b.totalFees > 0 ? 1 : 0;
      } else if (sortColumn.startsWith('month_')) {
        const monthKey = sortColumn.replace('month_', '');
        aVal = a.monthlyFees[monthKey] || 0;
        bVal = b.monthlyFees[monthKey] || 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredMasterRows, sortColumn, sortDirection]);

  // Sorted Monthly Attendance Records
  const sortedMonthlyRecords = useMemo(() => {
    if (!sortColumn) return filteredMonthlyRecords;
    return [...filteredMonthlyRecords].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortColumn === 'date') {
        aVal = a.date;
        bVal = b.date;
      } else if (sortColumn === 'day') {
        aVal = a.day;
        bVal = b.day;
      } else if (sortColumn === 'performerName') {
        aVal = a.performerName.toLowerCase();
        bVal = b.performerName.toLowerCase();
      } else if (sortColumn === 'performerEmail') {
        aVal = a.performerEmail.toLowerCase();
        bVal = b.performerEmail.toLowerCase();
      } else if (sortColumn === 'rsvp') {
        aVal = a.rsvp;
        bVal = b.rsvp;
      } else if (sortColumn === 'attended') {
        aVal = a.attended;
        bVal = b.attended;
      } else if (sortColumn === 'fees') {
        aVal = a.fees;
        bVal = b.fees;
      } else if (sortColumn === 'notes') {
        aVal = (a.notes || '').toLowerCase();
        bVal = (b.notes || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredMonthlyRecords, sortColumn, sortDirection]);

  // Sorted Form Responses
  const sortedFormResponses = useMemo(() => {
    if (!sortColumn) return filteredFormResponses;
    return [...filteredFormResponses].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortColumn === 'timestamp') {
        aVal = a.timestamp;
        bVal = b.timestamp;
      } else if (sortColumn === 'performerName') {
        aVal = a.performerName.toLowerCase();
        bVal = b.performerName.toLowerCase();
      } else if (sortColumn === 'performerEmail') {
        aVal = a.performerEmail.toLowerCase();
        bVal = b.performerEmail.toLowerCase();
      } else if (sortColumn === 'practiceDate') {
        aVal = a.practiceDate;
        bVal = b.practiceDate;
      } else if (sortColumn === 'checkInStatus') {
        aVal = a.checkInStatus;
        bVal = b.checkInStatus;
      } else if (sortColumn === 'notes') {
        aVal = (a.notes || '').toLowerCase();
        bVal = (b.notes || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredFormResponses, sortColumn, sortDirection]);

  // Sorted Exclusions
  const sortedExclusions = useMemo(() => {
    if (!sortColumn) return exclusions;
    return [...exclusions].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortColumn === 'email') {
        aVal = a.email.toLowerCase();
        bVal = b.email.toLowerCase();
      } else if (sortColumn === 'name') {
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
      } else if (sortColumn === 'reason') {
        aVal = (a.reason || '').toLowerCase();
        bVal = (b.reason || '').toLowerCase();
      } else if (sortColumn === 'addedDate') {
        aVal = a.addedDate || '';
        bVal = b.addedDate || '';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [exclusions, sortColumn, sortDirection]);

  // Batch Selection & Mass Update Helpers for RSVP & Attended Status
  const toggleSelectAllVisible = () => {
    if (selectedRecordIds.size >= sortedMonthlyRecords.length && sortedMonthlyRecords.length > 0) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(sortedMonthlyRecords.map(r => r.id)));
    }
  };

  const applyBatchUpdate = (rsvp?: RsvpStatus, attended?: AttendedStatus) => {
    const targetIds = selectedRecordIds.size > 0 
      ? Array.from(selectedRecordIds) 
      : sortedMonthlyRecords.map(r => r.id);
    
    if (targetIds.length === 0) return;

    if (onBatchUpdateRecords) {
      onBatchUpdateRecords(targetIds, { rsvp, attended });
    } else {
      targetIds.forEach(id => {
        const rec = records.find(r => r.id === id);
        if (rec) {
          onUpdateRecord(id, rsvp !== undefined ? rsvp : rec.rsvp, attended !== undefined ? attended : rec.attended);
        }
      });
    }
    setSelectedRecordIds(new Set());
  };

  // Parsed Bulk CSV entries computation
  const parsedCsvResult = useMemo(() => {
    if (!bulkCsvText.trim()) {
      return { validCount: 0, duplicateCount: 0, invalidCount: 0, parsedItems: [] };
    }

    const lines = bulkCsvText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    const existingEmailSet = new Set(exclusions.map(e => e.email.toLowerCase()));
    const seenBatchEmails = new Set<string>();

    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    const parsedItems: Array<{
      email: string;
      name: string;
      reason: string;
      status: 'valid' | 'duplicate' | 'invalid';
      note?: string;
    }> = [];

    lines.forEach(line => {
      // Split by comma or tab
      const parts = line.split(/,|\t/).map(p => p.trim());
      const email = parts[0] ? parts[0].toLowerCase() : '';
      const name = parts[1] || email.split('@')[0] || 'Unknown';
      const reason = parts[2] || defaultReason || 'Bulk Exclusion';

      // Basic email syntax check
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!isValidEmail) {
        invalidCount++;
        parsedItems.push({
          email: parts[0] || '(empty)',
          name,
          reason,
          status: 'invalid',
          note: isEs ? 'Formato de correo inválido' : 'Invalid email syntax'
        });
        return;
      }

      if (existingEmailSet.has(email) || seenBatchEmails.has(email)) {
        duplicateCount++;
        parsedItems.push({
          email,
          name,
          reason,
          status: 'duplicate',
          note: isEs ? 'Ya existe en exclusiones' : 'Already in exclusion list'
        });
        return;
      }

      seenBatchEmails.add(email);
      validCount++;
      parsedItems.push({
        email,
        name,
        reason,
        status: 'valid'
      });
    });

    return { validCount, duplicateCount, invalidCount, parsedItems };
  }, [bulkCsvText, defaultReason, exclusions, isEs]);

  // Handlers
  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newDate) return;

    const dateObj = new Date(newDate + 'T00:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = dayNames[dateObj.getDay()];

    onCreateRecord({
      monthTab: activeTab,
      date: newDate,
      day,
      performerName: newName,
      performerEmail: newEmail.trim().toLowerCase(),
      rsvp: newRsvp,
      attended: newAttended
    });

    setNewName('');
    setNewEmail('');
    setShowAddModal(false);
  };

  const handleCreateExclusion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exEmail) return;

    onAddExclusion(exEmail.trim().toLowerCase(), exName, exReason);
    setExEmail('');
    setExName('');
    setShowAddExclusionModal(false);
  };

  const handleCommitBulkImport = () => {
    const validEntries = parsedCsvResult.parsedItems
      .filter(i => i.status === 'valid')
      .map(i => ({ email: i.email, name: i.name, reason: i.reason }));

    if (validEntries.length > 0) {
      onBulkAddExclusions(validEntries);
      setBulkCsvText('');
      setShowBulkImportModal(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setBulkCsvText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const loadSampleCsv = () => {
    const sample = `carlos.mendoza@example.com, Carlos Mendoza, Leave of Absence
maria.santos@example.com, Maria Santos, Resigned / Left Company
david.lopez@example.com, David Lopez, Academic Exemption`;
    setBulkCsvText(sample);
  };

  // Export CSV Handler
  const exportTabToCsv = () => {
    let filename = `Tradicion_${activeTab.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    let csvRows: string[] = [];

    if (activeTab === 'Master Summary') {
      csvRows.push(['Performer Name', 'Email', ...availableMonths, 'Total Fees', 'Status'].join(','));
      masterSummary.forEach(m => {
        const row = [
          `"${m.performerName}"`,
          `"${m.performerEmail}"`,
          ...availableMonths.map(mn => m.monthlyFees[mn] || 0),
          m.totalFees,
          m.totalFees > 0 ? 'Outstanding' : 'Paid in Full'
        ];
        csvRows.push(row.join(','));
      });
    } else if (availableMonths.includes(activeTab)) {
      csvRows.push(['Date', 'Day', 'Performer Name', 'Email', 'RSVP', 'Attended', 'SOP Penalty Fee'].join(','));
      records
        .filter(r => (r.monthKey || (r as any).monthTab) === activeTab)
        .forEach(r => {
          csvRows.push([
            r.date,
            r.day,
            `"${r.performerName}"`,
            `"${r.performerEmail}"`,
            r.rsvp,
            r.attended,
            r.fees
          ].join(','));
        });
    } else if (activeTab === 'Form Responses 1') {
      csvRows.push(['Timestamp', 'Performer Name', 'Email', 'Practice Date', 'Status'].join(','));
      formResponses.forEach(f => {
        csvRows.push([f.timestamp, `"${f.performerName}"`, `"${f.performerEmail}"`, f.practiceDate, 'Verified Present'].join(','));
      });
    } else if (activeTab === 'Excluded these Performers') {
      csvRows.push(['Excluded Email', 'Performer Name', 'Exclusion Reason', 'Date Added'].join(','));
      exclusions.forEach(ex => {
        csvRows.push([`"${ex.email}"`, `"${ex.name}"`, `"${ex.reason}"`, ex.addedDate].join(','));
      });
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`border rounded-xl shadow-xl overflow-hidden mb-8 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
    }`}>
      {/* Google Sheets Header & Controls Bar */}
      <div className={`p-4 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isEs ? 'Libro de Trabajo en Vivo de Google Sheets' : 'Google Sheets Live Workbook'}
              </h2>
              <span className={`text-xs px-2 py-0.5 rounded border font-mono ${
                isLight ? 'bg-slate-200/80 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {isEs ? 'Script Vinculado: activeSpreadsheet' : 'Bound Script: activeSpreadsheet'}
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isEs ? 'Viendo la pestaña:' : 'Viewing sheet tab:'} <span className="text-emerald-500 font-semibold">{translateMonthStr(activeTab, (lang || 'en') as Language)}</span>
            </p>
          </div>
        </div>

        {/* Sync & Action Tools */}
        <div className="flex items-center flex-wrap gap-2">
          {onForceUpdateMonths && (
            <button
              onClick={onForceUpdateMonths}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm border ${
                isLight
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                  : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border-indigo-800'
              }`}
              title={isEs ? 'Forzar actualización y recálculo de meses' : 'Force refresh and update all month sheets'}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isEs ? 'Forzar Actualizar Meses' : 'Force Update Months'}</span>
            </button>
          )}

          <button
            onClick={exportTabToCsv}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm border ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-slate-200/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Export active tab data as CSV file"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            {isEs ? 'Exportar CSV' : 'Export CSV'}
          </button>

          {availableMonths.includes(activeTab) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              {isEs ? 'Agregar Registro' : 'Add Performer Record'}
            </button>
          )}

          {activeTab === 'Excluded these Performers' && (
            <>
              <button
                onClick={() => setShowAddExclusionModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors shadow"
              >
                <UserX className="w-3.5 h-3.5" />
                {isEs ? 'Excluir Integrante' : 'Exclude Performer'}
              </button>

              <button
                onClick={() => setShowBulkImportModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors shadow"
              >
                <FileUp className="w-3.5 h-3.5" />
                {isEs ? 'Importación Masiva CSV' : 'Bulk CSV Import'}
              </button>

              <button
                onClick={onPurgeExclusions}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isEs ? 'Depurar Exclusiones Ahora' : 'Scrub & Purge Exclusions Now'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sheet Tabs Scrollable Bar */}
      <div className={`px-4 pt-2 flex items-center gap-1 border-b overflow-x-auto scrollbar-thin transition-colors ${
        isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-950/80 border-slate-800'
      }`}>
        {tabs.map(tabName => {
          const isActive = activeTab === tabName;
          let displayTabName = translateMonthStr(tabName, (lang || 'en') as Language);
          if (isEs) {
            if (tabName === 'Master Summary') displayTabName = 'Resumen Maestro';
            if (tabName === 'Form Responses 1') displayTabName = 'Respuestas del Formulario 1';
            if (tabName === 'Excluded these Performers') displayTabName = 'Integrantes Excluidos';
          }

          return (
            <button
              key={tabName}
              onClick={() => setActiveTab(tabName)}
              className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap flex items-center gap-1.5 border-t border-x ${
                isActive
                  ? isLight
                    ? 'bg-white text-emerald-600 border-slate-300 border-b-white font-bold shadow-sm'
                    : 'bg-slate-900 text-emerald-400 border-slate-700 border-b-slate-900 font-semibold shadow-inner'
                  : isLight
                    ? 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500' : isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              {displayTabName}
              {tabName === 'Master Summary' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isLight ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-900/60 text-indigo-300'
                }`}>
                  {isEs ? 'Agregado' : 'Aggregate'}
                </span>
              )}
              {tabName === 'Excluded these Performers' && exclusions.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isLight ? 'bg-rose-100 text-rose-700' : 'bg-rose-950 text-rose-300'
                }`}>
                  {exclusions.length}
                </span>
              )}
            </button>
          );
        })}

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {onRunSync && (
            <button
              onClick={onRunSync}
              disabled={isSyncing}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap flex items-center gap-1.5 border-t border-x shadow-sm ${
                isLight
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/30'
              } ${isSyncing ? 'opacity-50 cursor-wait' : ''}`}
              title={isEs ? 'Ejecutar algoritmo de sincronización (Rev 7.4)' : 'Run Sync Algorithm across Calendar & Forms (Rev 7.4)'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-white' : 'text-indigo-200'}`} />
              <span>Sync (Rev 7.4)</span>
            </button>
          )}

          {onForceUpdateMonths && (
            <button
              onClick={onForceUpdateMonths}
              disabled={isSyncing}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap flex items-center gap-1.5 border-t border-x ${
                isLight
                  ? 'bg-indigo-100/70 text-indigo-700 hover:bg-indigo-200/80 border-indigo-200'
                  : 'bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/80 border-indigo-800'
              }`}
              title={isEs ? 'Forzar actualización de pestañas de mes' : 'Force Refresh All Month Tabs'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isEs ? 'Recargar Meses' : 'Refresh Months'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className={`p-3 border-b flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-1">
          {/* Keyword Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={`${t.searchPlaceholder} ${activeTab}...`}
              className={`w-full border rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 text-xs transition-colors ${
                isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
              }`}
            />
          </div>

          {/* Search Dropdown by Email */}
          <div className="relative flex items-center gap-1.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Mail className={`w-3.5 h-3.5 absolute left-3 top-2.5 pointer-events-none ${
                selectedEmailFilter ? 'text-indigo-500 font-bold' : isLight ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <select
                value={selectedEmailFilter}
                onChange={e => setSelectedEmailFilter(e.target.value)}
                className={`w-full border rounded-lg pl-9 pr-7 py-1.5 focus:outline-none focus:border-indigo-500 text-xs appearance-none font-medium transition-colors ${
                  selectedEmailFilter
                    ? isLight
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                      : 'bg-indigo-950/80 border-indigo-500 text-indigo-200 font-bold'
                    : isLight
                      ? 'bg-white border-slate-300 text-slate-700'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <option value="">{t.allEmails}</option>
                {allPerformerEmails.map(item => (
                  <option key={item.email} value={item.email}>
                    {item.name} ({item.email})
                  </option>
                ))}
              </select>
              <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-2.5 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>

            {selectedEmailFilter && (
              <button
                onClick={() => setSelectedEmailFilter('')}
                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                title={t.clearFilter}
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.clearFilter}</span>
              </button>
            )}
          </div>
        </div>

        {availableMonths.includes(activeTab) && (
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
            {/* Filter by RSVP Status */}
            <div className="flex items-center gap-1.5">
              <Filter className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{isEs ? 'RSVP:' : 'RSVP:'}</span>
              <select
                value={rsvpFilter}
                onChange={e => setRsvpFilter(e.target.value)}
                className={`border rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 text-xs font-semibold transition-colors ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <option value="ALL">{t.allRsvps}</option>
                <option value="Yes">✓ Yes ({isEs ? 'Confirmado' : 'Confirmed'})</option>
                <option value="No">ℹ No ({isEs ? 'Justificado' : 'Excused'})</option>
                <option value="Maybe">? Maybe ({isEs ? 'Tal vez' : 'Tentative'})</option>
                <option value="Awaiting">⧖ Awaiting ({isEs ? 'Pendiente' : 'Pending'})</option>
              </select>
            </div>

            {/* Filter by Attended Status */}
            <div className="flex items-center gap-1.5">
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{isEs ? 'Asistencia:' : 'Attended:'}</span>
              <select
                value={attendedFilter}
                onChange={e => setAttendedFilter(e.target.value)}
                className={`border rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 text-xs font-semibold transition-colors ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <option value="ALL">{isEs ? 'Todas las Asistencias' : 'All Attendance'}</option>
                <option value="Yes">✓ {isEs ? 'Sí (Presente)' : 'Yes (Present)'}</option>
                <option value="No">⚠ {isEs ? 'No (Ausente)' : 'No (Absent)'}</option>
              </select>
            </div>
          </div>
        )}
      </div>



      {/* Tab 1: Master Summary Sheet */}
      {activeTab === 'Master Summary' && (
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs border-collapse ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            <thead>
              <tr className={`border-b uppercase font-mono text-[11px] tracking-wider transition-colors ${
                isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                {renderSortableHeader('performerName', isEs ? 'Nombre del Integrante' : 'Performer Name')}
                {renderSortableHeader('performerEmail', isEs ? 'Correo Electrónico' : 'Performer Email')}
                {availableMonths.map(m => (
                  <React.Fragment key={m}>
                    {renderSortableHeader(`month_${m}`, translateMonthStr(m, (lang || 'en') as Language), 'right')}
                  </React.Fragment>
                ))}
                {renderSortableHeader('totalFees', isEs ? 'Saldo Total SOP' : 'Total SOP Fees', 'right')}
                {renderSortableHeader('status', isEs ? 'Estado de Cuenta' : 'Account Status', 'center')}
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
              {sortedMasterRows.length === 0 ? (
                <tr>
                  <td colSpan={availableMonths.length + 4} className={`p-8 text-center ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                    {isEs 
                      ? 'No se encontraron registros en el Resumen Maestro. Ejecuta "Sincronizar Datos" para consolidar.' 
                      : 'No performer records found in Master Summary. Run Sync All Data to aggregate.'}
                  </td>
                </tr>
              ) : (
                sortedMasterRows.map((row, idx) => (
                  <tr key={idx} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                    <td className={`p-3 font-medium flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isLight ? 'bg-indigo-100 border border-indigo-200 text-indigo-700' : 'bg-indigo-950 border border-indigo-700/50 text-indigo-300'
                      }`}>
                        {row.performerName.charAt(0)}
                      </div>
                      {row.performerName}
                    </td>
                    <td className={`p-3 font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{row.performerEmail}</td>
                    {availableMonths.map(m => {
                      const fee = row.monthlyFees[m] || 0;
                      return (
                        <td key={m} className="p-3 text-right font-mono">
                          {fee > 0 ? (
                            <span className={`font-semibold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>${fee.toFixed(2)}</span>
                          ) : (
                            <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>$0.00</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-right font-mono font-bold text-sm">
                      {row.totalFees > 0 ? (
                        <span className={`px-2.5 py-1 rounded border ${
                          isLight ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-rose-400 bg-rose-950/60 border-rose-800/80'
                        }`}>
                          ${row.totalFees.toFixed(2)}
                        </span>
                      ) : (
                        <span className={`px-2 py-1 rounded border ${
                          isLight ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80'
                        }`}>
                          $0.00
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.totalFees > 0 ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950/80 text-rose-300 border-rose-800'
                        }`}>
                          <AlertCircle className={`w-3 h-3 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
                          {t.outstanding}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        }`}>
                          <Check className={`w-3 h-3 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                          {t.paidInFull}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Monthly Sheets (e.g. April 2026, May 2026) */}
      {availableMonths.includes(activeTab) && (
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs border-collapse ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            <thead>
              <tr className={`border-b uppercase font-mono text-[11px] tracking-wider transition-colors ${
                isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                <th className="p-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRecordIds.size > 0 && selectedRecordIds.size >= sortedMonthlyRecords.length}
                    onChange={toggleSelectAllVisible}
                    className="rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title={isEs ? 'Seleccionar todos los registros visibles' : 'Select all visible records'}
                  />
                </th>
                {renderSortableHeader('date', isEs ? 'Fecha de Ensayo' : 'Practice Date')}
                {renderSortableHeader('day', isEs ? 'Día' : 'Day')}
                {renderSortableHeader('performerName', isEs ? 'Nombre del Integrante' : 'Performer Name')}
                {renderSortableHeader('performerEmail', isEs ? 'Correo Electrónico' : 'Performer Email')}
                {renderSortableHeader('rsvp', isEs ? 'Estado RSVP' : 'RSVP Status')}
                {renderSortableHeader('attended', isEs ? 'Asistencia' : 'Attended Status')}
                {renderSortableHeader('fees', isEs ? 'Cuota Penalización SOP' : 'SOP Penalty Fee', 'right')}
                {renderSortableHeader('notes', isEs ? 'Motivo / Regla SOP' : 'Penalty Reason / SOP Rule')}
                <th className="p-3 font-semibold text-center">{isEs ? 'Acciones' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
              {sortedMonthlyRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className={`p-8 text-center ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                    {isEs 
                      ? `No hay registros de asistencia para ${activeTab} que coincidan con los filtros.` 
                      : `No rehearsal attendance records for ${activeTab} matching filters.`}
                  </td>
                </tr>
              ) : (
                sortedMonthlyRecords.map(rec => {
                  const isSelected = selectedRecordIds.has(rec.id);
                  return (
                    <tr key={rec.id} className={`transition-colors ${
                      isSelected
                        ? isLight ? 'bg-indigo-50/80' : 'bg-indigo-950/40'
                        : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                    }`}>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRecord(rec.id)}
                          className="rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className={`p-3 font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{rec.date}</td>
                      <td className={`p-3 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{rec.day}</td>
                      <td className={`p-3 font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{rec.performerName}</td>
                      <td className={`p-3 font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{rec.performerEmail}</td>
                      {/* Interactive RSVP Status Editor */}
                      <td className="p-3">
                        <select
                          value={rec.rsvp}
                          onChange={e => onUpdateRecord(rec.id, e.target.value as RsvpStatus, rec.attended)}
                          className={`border rounded-md px-2.5 py-1.5 font-bold text-xs focus:outline-none cursor-pointer transition-all shadow-sm ${
                            rec.rsvp === 'Yes'
                              ? isLight
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-emerald-950/90 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                              : rec.rsvp === 'No'
                              ? isLight
                                ? 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100'
                                : 'bg-sky-950/90 text-sky-300 border-sky-700 hover:bg-sky-900'
                              : rec.rsvp === 'Maybe'
                              ? isLight
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : 'bg-amber-950/90 text-amber-300 border-amber-700 hover:bg-amber-900'
                              : isLight
                              ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          <option value="Yes">✓ Yes ({isEs ? 'Confirmado' : 'Confirmed'})</option>
                          <option value="No">ℹ No ({isEs ? 'Justificado' : 'Excused'})</option>
                          <option value="Maybe">? Maybe ({isEs ? 'Tal vez' : 'Tentative'})</option>
                          <option value="Awaiting">⧖ Awaiting ({isEs ? 'Pendiente' : 'Pending'})</option>
                        </select>
                      </td>
                      {/* Interactive Attended Editor */}
                      <td className="p-3">
                        <select
                          value={rec.attended}
                          onChange={e => onUpdateRecord(rec.id, rec.rsvp, e.target.value as AttendedStatus)}
                          className={`border rounded-md px-2.5 py-1.5 font-bold text-xs focus:outline-none cursor-pointer transition-all shadow-sm ${
                            rec.attended === 'Yes'
                              ? isLight
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200'
                                : 'bg-emerald-900/90 text-emerald-200 border-emerald-600 hover:bg-emerald-800'
                              : isLight
                              ? 'bg-rose-100 text-rose-900 border-rose-400 hover:bg-rose-200'
                              : 'bg-rose-900/90 text-rose-200 border-rose-600 hover:bg-rose-800'
                          }`}
                        >
                          <option value="Yes">✓ {isEs ? 'Sí (Presente)' : 'Yes (Present)'}</option>
                          <option value="No">⚠ {isEs ? 'No (Ausente)' : 'No (Absent)'}</option>
                        </select>
                      </td>
                      {/* Computed Fee Badge */}
                      <td className="p-3 text-right font-mono font-bold text-sm">
                        {rec.fees > 0 ? (
                          <span className={`px-2.5 py-1 rounded inline-flex items-center gap-1 border ${
                            isLight
                              ? 'text-rose-700 bg-rose-50 border-rose-200'
                              : 'text-rose-400 bg-rose-950/80 border-rose-800/80'
                          }`}>
                            ${rec.fees.toFixed(2)}
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded inline-flex items-center gap-1 border ${
                            isLight
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80'
                          }`}>
                            $0.00
                          </span>
                        )}
                      </td>
                      {/* SOP Reason / Note Column */}
                      <td className={`p-3 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {rec.notes || (rec.fees > 0 
                          ? (isEs ? 'Penalización por falta SOP' : 'SOP Attendance Penalty') 
                          : (isEs ? 'Asistencia verificada ($0)' : 'Verified ($0)'))}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDeleteRecord(rec.id)}
                          className={`p-1.5 rounded transition-colors ${
                            isLight ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/50'
                          }`}
                          title={isEs ? 'Eliminar registro' : 'Delete record'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Form Responses 1 */}
      {activeTab === 'Form Responses 1' && (
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs border-collapse ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            <thead>
              <tr className={`border-b uppercase font-mono text-[11px] transition-colors ${
                isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                {renderSortableHeader('timestamp', isEs ? 'Marca Temporal' : 'Timestamp')}
                {renderSortableHeader('performerName', isEs ? 'Nombre del Integrante' : 'Performer Name')}
                {renderSortableHeader('performerEmail', isEs ? 'Correo Electrónico' : 'Performer Email')}
                {renderSortableHeader('practiceDate', isEs ? 'Fecha de Ensayo' : 'Practice Date')}
                {renderSortableHeader('checkInStatus', isEs ? 'Estado de Registro' : 'Form Check-In Status', 'center')}
                {renderSortableHeader('notes', isEs ? 'Notas de Verificación' : 'Verification Notes')}
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
              {sortedFormResponses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {isEs ? 'No hay respuestas registradas del formulario físico.' : 'No physical form response submissions recorded yet.'}
                  </td>
                </tr>
              ) : (
                sortedFormResponses.map(fr => (
                  <tr key={fr.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                    <td className={`p-3 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{fr.timestamp}</td>
                    <td className={`p-3 font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{fr.performerName}</td>
                    <td className={`p-3 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{fr.performerEmail}</td>
                    <td className={`p-3 font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{fr.practiceDate}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 border px-2.5 py-0.5 rounded font-semibold text-[11px] ${
                        isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}>
                        <Check className={`w-3 h-3 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                        {isEs ? 'Verificado Presente' : 'Verified Present'}
                      </span>
                    </td>
                    <td className={`p-3 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {fr.notes || (isEs ? 'Sincronizado desde Formulario de Google' : 'Synced from Google Form Submission')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Excluded these Performers */}
      {activeTab === 'Excluded these Performers' && (
        <div className="overflow-x-auto">
          <div className={`p-4 border-b text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-rose-50/80 border-rose-200 text-rose-900' : 'bg-rose-950/30 border-rose-900/40 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <UserX className={`w-4 h-4 shrink-0 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
              <span>
                <strong>{isEs ? 'Motor Dinámico de Exclusión:' : 'Dynamic Exclusion Engine:'}</strong> {isEs 
                  ? 'Cualquier correo listado en la Columna A se depurará y eliminará automáticamente de las hojas mensuales y del Resumen Maestro.'
                  : 'Any email listed in Column A will be automatically scrubbed and deleted from all monthly rehearsal sheets and the Master Summary during sync.'}
              </span>
            </div>

            <button
              onClick={() => setShowBulkImportModal(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow shrink-0"
            >
              <FileUp className="w-3.5 h-3.5" />
              {isEs ? 'Importación Masiva CSV' : 'Bulk CSV Import'}
            </button>
          </div>

          <table className={`w-full text-left text-xs border-collapse ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            <thead>
              <tr className={`border-b uppercase font-mono text-[11px] transition-colors ${
                isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                {renderSortableHeader('email', isEs ? 'Correo Excluido (Columna A)' : 'Excluded Email (Column A)')}
                {renderSortableHeader('name', isEs ? 'Nombre del Integrante' : 'Performer Name')}
                {renderSortableHeader('reason', isEs ? 'Motivo de Exclusión' : 'Exclusion Reason')}
                {renderSortableHeader('addedDate', isEs ? 'Fecha de Adición' : 'Date Added')}
                <th className="p-3 font-semibold text-center">{isEs ? 'Acción' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
              {sortedExclusions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <p className="mb-2">{isEs ? 'No hay integrantes en la lista de exclusión.' : 'No excluded performers on the blocklist.'}</p>
                    <button
                      onClick={() => setShowBulkImportModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-xs transition-colors shadow"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      {isEs ? 'Importar Correos CSV Masivamente' : 'Bulk Import CSV Emails'}
                    </button>
                  </td>
                </tr>
              ) : (
                sortedExclusions.map((ex, i) => (
                  <tr key={i} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                    <td className={`p-3 font-mono font-semibold ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>{ex.email}</td>
                    <td className={`p-3 font-medium ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{ex.name}</td>
                    <td className={`p-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{ex.reason}</td>
                    <td className={`p-3 font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{ex.addedDate}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onDeleteExclusion(ex.email)}
                        className={`p-1.5 rounded transition-colors ${
                          isLight ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/50'
                        }`}
                        title={isEs ? 'Remover de la lista' : 'Remove from exclusion list'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl p-6 w-full max-w-md shadow-2xl transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className={`font-bold text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Plus className="w-4 h-4 text-emerald-500" />
                {isEs ? `Agregar Registro a ${translateMonthStr(activeTab, (lang || 'en') as Language)}` : `Add Record to ${activeTab}`}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className={`text-sm ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
              <div>
                <label className={`block font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isEs ? 'Fecha de Ensayo' : 'Rehearsal Date'}
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className={`w-full border rounded-lg p-2 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isEs ? 'Nombre Completo del Integrante' : 'Performer Full Name'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sofia Rodriguez"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className={`w-full border rounded-lg p-2 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isEs ? 'Correo Electrónico del Integrante' : 'Performer Email Address'}
                </label>
                <input
                  type="email"
                  placeholder="sofia@tradiciondance.org"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className={`w-full border rounded-lg p-2 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {isEs ? 'Estado RSVP (Calendario)' : 'Calendar RSVP Status'}
                  </label>
                  <select
                    value={newRsvp}
                    onChange={e => setNewRsvp(e.target.value as RsvpStatus)}
                    className={`w-full border rounded-lg p-2 font-semibold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <option value="Yes">✓ Yes ({isEs ? 'Confirmado' : 'Confirmed'})</option>
                    <option value="No">ℹ No ({isEs ? 'Justificado' : 'Excused'})</option>
                    <option value="Maybe">? Maybe ({isEs ? 'Tal vez' : 'Tentative'})</option>
                    <option value="Awaiting">⧖ Awaiting ({isEs ? 'Pendiente' : 'Pending'})</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {isEs ? 'Asistencia (Registro)' : 'Attended Status'}
                  </label>
                  <select
                    value={newAttended}
                    onChange={e => setNewAttended(e.target.value as AttendedStatus)}
                    className={`w-full border rounded-lg p-2 font-semibold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <option value="Yes">✓ {isEs ? 'Sí (Presente)' : 'Yes (Present)'}</option>
                    <option value="No">⚠ {isEs ? 'No (Ausente)' : 'No (Absent)'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow"
                >
                  {isEs ? 'Agregar Registro' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exclusion Modal */}
      {showAddExclusionModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl p-6 w-full max-w-md shadow-2xl transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className={`font-bold text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <UserX className="w-4 h-4 text-rose-500" />
                {isEs ? 'Agregar Integrante a Lista de Exclusión' : 'Add Performer to Exclusion Blocklist'}
              </h3>
              <button
                onClick={() => setShowAddExclusionModal(false)}
                className={`text-sm ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExclusion} className="space-y-4 text-xs">
              <div>
                <label className={`block font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isEs ? 'Correo Electrónico (Columna A)' : 'Email Address (Column A)'}
                </label>
                <input
                  type="email"
                  placeholder="performer@example.com"
                  value={exEmail}
                  onChange={e => setExEmail(e.target.value)}
                  className={`w-full border rounded-lg p-2 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isEs ? 'Nombre del Integrante' : 'Performer Name'}
                </label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={exName}
                  onChange={e => setExName(e.target.value)}
                  className={`w-full border rounded-lg p-2 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isEs ? 'Motivo de Exclusión' : 'Exclusion Reason'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Resigned, Leave of Absence, Administrative Block"
                  value={exReason}
                  onChange={e => setExReason(e.target.value)}
                  className={`w-full border rounded-lg p-2 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExclusionModal(false)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium shadow"
                >
                  {isEs ? 'Excluir y Depurar' : 'Exclude & Purge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Excluded Performers Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 border rounded-lg ${
                  isLight ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-purple-600/20 border-purple-500/30 text-purple-300'
                }`}>
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {isEs ? 'Importación Masiva de Integrantes Excluidos vía CSV' : 'Bulk CSV Excluded Performers Import'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isEs 
                      ? 'Pega texto CSV o arrastra un archivo para excluir múltiples integrantes a la vez.'
                      : 'Paste raw CSV text or upload a file containing email addresses to exclude multiple performers at once.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBulkImportModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* File Dropzone & Sample Controls */}
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDropFile}
                className={`p-4 border-2 border-dashed rounded-xl transition-colors flex flex-col items-center justify-center gap-2 text-center ${
                  isDragOver
                    ? 'border-purple-500 bg-purple-950/30'
                    : isLight
                    ? 'border-slate-300 bg-slate-50 hover:border-slate-400'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <Upload className="w-6 h-6 text-purple-500" />
                <div className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {isEs ? 'Arrastra y suelta un archivo ' : 'Drag & Drop a '}
                  <span className="text-purple-500 font-mono">.csv</span> {isEs ? 'o' : 'or'} <span className="text-purple-500 font-mono">.txt</span> {isEs ? 'aquí' : 'here'}
                </div>
                <div className={`text-[11px] flex items-center gap-3 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  <label className="cursor-pointer text-purple-600 hover:text-purple-500 font-semibold underline underline-offset-2">
                    {isEs ? 'Examinar archivos' : 'Browse Files'}
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={loadSampleCsv}
                    className={`font-medium flex items-center gap-1 ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <Clipboard className="w-3.5 h-3.5 text-amber-500" />
                    {isEs ? 'Cargar CSV de Muestra' : 'Load Sample CSV'}
                  </button>
                </div>
              </div>

              {/* Default Reason & CSV Textarea */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    {isEs ? 'Motivo de Exclusión Predeterminado' : 'Default Exclusion Reason'}
                  </label>
                  <input
                    type="text"
                    value={defaultReason}
                    onChange={e => setDefaultReason(e.target.value)}
                    placeholder="e.g. Leave of Absence"
                    className={`w-full border rounded-lg p-2 focus:outline-none focus:border-purple-500 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {isEs ? 'Se aplica si la Columna C está vacía.' : 'Applied if Column C is omitted.'}
                  </span>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                      {isEs ? 'Pegar Contenido CSV (Col A: Correo, B: Nombre, C: Motivo)' : 'Paste CSV Content (Col A: Email, B: Name, C: Reason)'}
                    </label>
                    {bulkCsvText && (
                      <button
                        type="button"
                        onClick={() => setBulkCsvText('')}
                        className="text-[11px] text-rose-500 hover:underline"
                      >
                        {isEs ? 'Limpiar Texto' : 'Clear Text'}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={5}
                    value={bulkCsvText}
                    onChange={e => setBulkCsvText(e.target.value)}
                    placeholder={`carlos.m@example.com, Carlos Mendoza, Leave of Absence\nmaria.s@example.com, Maria Santos, Resigned\ndavid.l@example.com`}
                    className={`w-full border rounded-lg p-2.5 font-mono text-[11px] focus:outline-none focus:border-purple-500 scrollbar-thin ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Live Parsing Stats Badges */}
              {bulkCsvText.trim() && (
                <div className={`grid grid-cols-3 gap-3 p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{isEs ? 'Listos' : 'Ready to Import'}</div>
                      <div className="font-bold text-emerald-500 text-sm font-mono">{parsedCsvResult.validCount} {isEs ? 'correo(s)' : 'address(es)'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{isEs ? 'Duplicados' : 'Duplicates'}</div>
                      <div className="font-bold text-amber-500 text-sm font-mono">{parsedCsvResult.duplicateCount} {isEs ? 'omitido(s)' : 'skipped'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{isEs ? 'Inválidos' : 'Invalid Format'}</div>
                      <div className="font-bold text-rose-500 text-sm font-mono">{parsedCsvResult.invalidCount} {isEs ? 'inválidos' : 'invalid'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Preview Table */}
              {parsedCsvResult.parsedItems.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className={`font-semibold text-xs flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    {isEs ? `Vista Previa de Entradas CSV (${parsedCsvResult.parsedItems.length} filas)` : `Parsed CSV Entries Preview (${parsedCsvResult.parsedItems.length} rows)`}
                  </h4>
                  <div className={`max-h-44 overflow-y-auto border rounded-lg scrollbar-thin ${
                    isLight ? 'border-slate-300 bg-white' : 'border-slate-800 bg-slate-950'
                  }`}>
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className={`border-b font-mono ${
                          isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          <th className="p-2">{t.email}</th>
                          <th className="p-2">{t.performer}</th>
                          <th className="p-2">{isEs ? 'Motivo' : 'Reason'}</th>
                          <th className="p-2 text-center">{t.status}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                        {parsedCsvResult.parsedItems.map((item, idx) => (
                          <tr key={idx} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/40'}>
                            <td className={`p-2 font-mono font-medium ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{item.email}</td>
                            <td className={`p-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{item.name}</td>
                            <td className={`p-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.reason}</td>
                            <td className="p-2 text-center">
                              {item.status === 'valid' && (
                                <span className={`border px-2 py-0.5 rounded font-semibold text-[10px] ${
                                  isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                }`}>
                                  {isEs ? 'Listo' : 'Ready'}
                                </span>
                              )}
                              {item.status === 'duplicate' && (
                                <span className={`border px-2 py-0.5 rounded font-semibold text-[10px] ${
                                  isLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-950 text-amber-300 border-amber-800'
                                }`} title={item.note}>
                                  {isEs ? 'Duplicado' : 'Duplicate'}
                                </span>
                              )}
                              {item.status === 'invalid' && (
                                <span className={`border px-2 py-0.5 rounded font-semibold text-[10px] ${
                                  isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-rose-950 text-rose-300 border-rose-800'
                                }`} title={item.note}>
                                  {isEs ? 'Inválido' : 'Invalid Email'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className={`pt-3 flex items-center justify-between border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  {isEs 
                    ? 'La importación depura automáticamente los registros coincidentes en las hojas de asistencia.'
                    : 'Importing automatically scrubs matching records from attendance sheets during sync.'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkImportModal(false)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitBulkImport}
                    disabled={parsedCsvResult.validCount === 0}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium flex items-center gap-1.5 shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileUp className="w-4 h-4" />
                    {isEs ? `Importar ${parsedCsvResult.validCount} Integrante(s) y Depurar` : `Import ${parsedCsvResult.validCount} Performer(s) & Scrub`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
