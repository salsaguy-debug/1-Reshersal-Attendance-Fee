export type Language = 'en' | 'es';

export const monthTranslations: Record<string, { en: string; es: string }> = {
  'January': { en: 'January', es: 'Enero' },
  'February': { en: 'February', es: 'Febrero' },
  'March': { en: 'March', es: 'Marzo' },
  'April': { en: 'April', es: 'Abril' },
  'May': { en: 'May', es: 'Mayo' },
  'June': { en: 'June', es: 'Junio' },
  'July': { en: 'July', es: 'Julio' },
  'August': { en: 'August', es: 'Agosto' },
  'September': { en: 'September', es: 'Septiembre' },
  'October': { en: 'October', es: 'Octubre' },
  'November': { en: 'November', es: 'Noviembre' },
  'December': { en: 'December', es: 'Diciembre' }
};

export function translateMonthStr(monthStr: string, lang: Language): string {
  if (lang === 'en' || !monthStr) return monthStr;
  let translated = monthStr;
  Object.entries(monthTranslations).forEach(([enMonth, dict]) => {
    translated = translated.replace(new RegExp(`\\b${enMonth}\\b`, 'gi'), dict.es);
  });
  return translated;
}

export const translations = {
  en: {
    // Top Bar & App Titles
    systemTitle: 'Rehearsal Absences',
    systemSubtitle: 'System 7.4.0 (SOP BTG Compliance Engine)',
    spreadsheetView: 'Spreadsheet View',
    reportsSuite: 'Reports & Email Suite',
    checkinSimulator: 'Check-In Simulator',
    codeExporter: 'Code.gs Exporter',
    config: 'CONFIG',
    systemConfigTitle: 'System Configuration',
    syncButton: 'Sync (Rev 7.4)',
    syncing: 'Syncing...',

    // KPI Summary Cards
    companyOutstanding: 'Company Outstanding Fees',
    flaggedPenaltySessions: 'Flagged SOP Penalty Sessions',
    activePerformers: 'Active Rehearsal Performers',
    excludedPerformers: 'Excluded Performers (Blocklist)',

    // Navigation & Dropdown Sections
    navigationViews: 'Navigation & View Switcher',
    syncSopTools: 'Sync & SOP Compliance Tools',
    dataManagement: 'Data Management',
    runLiveSync: 'Run Live Sync',
    viewSopRules: 'View Fee SOP Rules',
    liveSheetImport: 'Live Sheet Import',
    deleteAllTestData: 'Delete All Test Data',
    deleteAllTestDataDesc: 'Wipe all records, responses & exclusions',
    resetSampleData: 'Reset Sample Baseline Data',
    resetSampleDataDesc: 'Restore initial sample demo records',

    // Email Search Filter & Toolbar
    searchByEmail: 'Filter by Performer Email',
    allEmails: 'All Performers (Show All)',
    searchPlaceholder: 'Search performer, email or date in',
    clearFilter: 'Clear Filter',
    matchingRecords: 'matching record(s) found',
    filterByRsvp: 'Filter by RSVP',
    allRsvps: 'All RSVPs (Show All)',

    // Tabs
    masterSummary: 'Master Summary',
    formResponses: 'Form Responses 1',
    excludedTab: 'Excluded these Performers',
    aggregateTag: 'Aggregate',

    // Action Buttons
    addRecord: 'Add Record',
    addPerformerRecord: 'Add Performer Record',
    bulkCsvImport: 'Bulk CSV Import',
    purgeExclusions: 'Purge Exclusions',
    scrubPurgeNow: 'Scrub & Purge Exclusions Now',
    addExclusion: 'Exclude Performer',
    downloadCsv: 'Export CSV',
    saveConfig: 'Save Configuration',
    resetAllData: 'Reset All Data',

    // Table Column Headers
    performer: 'Performer',
    email: 'Email',
    totalBalance: 'Annual Total Balance',
    status: 'Status',
    date: 'Date',
    day: 'Day',
    rsvp: 'RSVP Status',
    attended: 'Attended (Physical)',
    fee: 'Fee Penalty ($)',
    notes: 'Audit Notes',
    actions: 'Actions',
    reason: 'Exclusion Reason',
    addedDate: 'Date Added',
    timestamp: 'Timestamp',
    practiceDate: 'Practice Date',
    checkInStatus: 'Check-In Status',

    // Status Tags
    outstanding: 'Outstanding',
    paidInFull: 'Paid in Full',
    verified: 'Verified ($0)',
    excused: 'Excused ($0)',

    // Theme & Language
    lightMode: 'Day Mode',
    darkMode: 'Night Mode',
    language: 'Language',
    changesSaved: 'Changes Saved',
    saving: 'Saving...',

    // Modals & Forms
    cancel: 'Cancel',
    saveRecord: 'Save Record',
    excludePerformerTitle: 'Exclude Performer from Roster',
    addRecordTitle: 'Add Rehearsal Attendance Record',
    performerName: 'Performer Name',
    performerEmail: 'Performer Email Address',
    exclusionReason: 'Exclusion Reason',
    reasonPlaceholder: 'e.g. Resigned, Medical Leave, Moved',

    // Confirmation Modals
    confirmTitleReset: 'Reset Sample Baseline Data',
    confirmMessageReset: 'Are you sure you want to reset all app records and settings to the default sample baseline data?',
    confirmBtnReset: 'Yes, Reset Baseline Data',
    confirmTitleDelete: 'Delete All Test Data',
    confirmMessageDelete: 'Are you sure you want to delete ALL test data? This will completely clear all attendance records, form responses, exclusions, and email report logs.',
    confirmBtnDelete: 'Yes, Delete All Test Data'
  },
  es: {
    // Top Bar & App Titles
    systemTitle: 'Rehearsal Absences',
    systemSubtitle: 'Sistema 7.4.0 (Cumplimiento SOP BTG)',
    spreadsheetView: 'Vista de Hoja',
    reportsSuite: 'Reportes y Correo',
    checkinSimulator: 'Simulador de Asistencia',
    codeExporter: 'Exportador Code.gs',
    config: 'CONFIGURACIÓN',
    systemConfigTitle: 'Configuración del Sistema',
    syncButton: 'Sincronizar (Rev 7.4)',
    syncing: 'Sincronizando...',

    // KPI Summary Cards
    companyOutstanding: 'Balance Pendiente de la Compañía',
    flaggedPenaltySessions: 'Sesiones con Penalización SOP',
    activePerformers: 'Bailarines Activos en Ensayos',
    excludedPerformers: 'Bailarines Excluidos (Lista Negra)',

    // Navigation & Dropdown Sections
    navigationViews: 'Navegación y Vistas',
    syncSopTools: 'Herramientas de Sincronización y SOP',
    dataManagement: 'Gestión de Datos',
    runLiveSync: 'Ejecutar Sincronización en Vivo',
    viewSopRules: 'Ver Reglas SOP de Tarifas',
    liveSheetImport: 'Importar Hoja en Vivo',
    deleteAllTestData: 'Eliminar Todos los Datos de Prueba',
    deleteAllTestDataDesc: 'Vaciar todas las listas, registros y exclusiones',
    resetSampleData: 'Restablecer Datos de Muestra',
    resetSampleDataDesc: 'Restaurar registros iniciales de demostración',

    // Email Search Filter & Toolbar
    searchByEmail: 'Filtrar por Correo Electrónico',
    allEmails: 'Todos los Bailarines (Mostrar Todo)',
    searchPlaceholder: 'Buscar bailarín, correo o fecha en',
    clearFilter: 'Limpiar Filtro',
    matchingRecords: 'registro(s) encontrado(s)',
    filterByRsvp: 'Filtrar por RSVP',
    allRsvps: 'Todos los RSVPs (Mostrar Todo)',

    // Tabs
    masterSummary: 'Resumen Principal',
    formResponses: 'Respuestas de Formulario 1',
    excludedTab: 'Excluidos de la Lista',
    aggregateTag: 'Agregado',

    // Action Buttons
    addRecord: 'Agregar Registro',
    addPerformerRecord: 'Agregar Registro de Bailarín',
    bulkCsvImport: 'Importación CSV Masiva',
    purgeExclusions: 'Depurar Excluidos',
    scrubPurgeNow: 'Depurar Exclusiones Ahora',
    addExclusion: 'Excluir Bailarín',
    downloadCsv: 'Exportar CSV',
    saveConfig: 'Guardar Configuración',
    resetAllData: 'Restablecer Datos',

    // Table Column Headers
    performer: 'Bailarín/a',
    email: 'Correo Electrónico',
    totalBalance: 'Balance Total Anual',
    status: 'Estado',
    date: 'Fecha',
    day: 'Día',
    rsvp: 'Estado RSVP',
    attended: 'Asistencia Física',
    fee: 'Penalización ($)',
    notes: 'Notas de Auditoría',
    actions: 'Acciones',
    reason: 'Razón de Exclusión',
    addedDate: 'Fecha de Registro',
    timestamp: 'Marca Temporal',
    practiceDate: 'Fecha de Ensayo',
    checkInStatus: 'Estado de Asistencia',

    // Status Tags
    outstanding: 'Pendiente',
    paidInFull: 'Pagado Completo',
    verified: 'Verificado ($0)',
    excused: 'Justificado ($0)',

    // Theme & Language
    lightMode: 'Modo Día',
    darkMode: 'Modo Noche',
    language: 'Idioma',
    changesSaved: 'Cambios Guardados',
    saving: 'Guardando...',

    // Modals & Forms
    cancel: 'Cancelar',
    saveRecord: 'Guardar Registro',
    excludePerformerTitle: 'Excluir Bailarín de la Lista',
    addRecordTitle: 'Agregar Registro de Asistencia a Ensayo',
    performerName: 'Nombre del Bailarín/a',
    performerEmail: 'Correo Electrónico del Bailarín/a',
    exclusionReason: 'Razón de la Exclusión',
    reasonPlaceholder: 'ej. Renuncia, Licencia Médica, Mudanza',

    // Confirmation Modals
    confirmTitleReset: 'Restablecer Datos de Muestra',
    confirmMessageReset: '¿Estás seguro de que deseas restablecer todos los registros y la configuración a los datos de prueba predeterminados?',
    confirmBtnReset: 'Sí, Restablecer Datos',
    confirmTitleDelete: 'Eliminar Todos los Datos de Prueba',
    confirmMessageDelete: '¿Estás seguro de que deseas eliminar TODOS los datos de prueba? Esto vaciará completamente todos los registros de asistencia, respuestas de formulario, exclusiones y reportes.',
    confirmBtnDelete: 'Sí, Eliminar Todo'
  }
};
