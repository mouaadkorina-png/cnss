import React, { useState, useMemo, useRef } from 'react';
import { EmployeeRecord, SituationCode } from '../types';
import { SITUATION_CODES, isValidCNSS, CNSS_CEILING, calculateCNSSCheckDigit } from '../utils/cnssUtils';
import { parseExcelFile, exportToExcel, exportToCSV } from '../utils/exportUtils';
import { 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Info,
  HelpCircle,
  Clock,
  UserPlus,
  Filter
} from 'lucide-react';

interface Props {
  employees: EmployeeRecord[];
  setEmployees: React.Dispatch<React.SetStateAction<EmployeeRecord[]>>;
  header: any;
}

export const EmployeeTableGrid: React.FC<Props> = ({ employees, setEmployees, header }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSituation, setFilterSituation] = useState<string>('all');
  const [filterValidity, setFilterValidity] = useState<'all' | 'valid' | 'invalid'>('all');
  const [filterType, setFilterType] = useState<'all' | 'preetabli' | 'entrant'>('all');
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = 
        emp.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.cnss.includes(searchTerm) ||
        emp.cin.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSituation = filterSituation === 'all' 
        ? true 
        : filterSituation === 'none' 
          ? !emp.situation 
          : emp.situation === filterSituation;

      const isValid = isValidCNSS(emp.cnss);
      const matchValidity = filterValidity === 'all'
        ? true
        : filterValidity === 'valid'
          ? isValid
          : !isValid;

      const matchType = filterType === 'all'
        ? true
        : filterType === 'preetabli'
          ? emp.isPreetabli
          : !emp.isPreetabli;

      return matchSearch && matchSituation && matchValidity && matchType;
    });
  }, [employees, searchTerm, filterSituation, filterValidity, filterType]);

  // Update a single employee field
  const handleUpdate = (id: string, field: keyof EmployeeRecord, value: any) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== id) return emp;
      const updated = { ...emp, [field]: value };
      if (field === 'salaireReel') {
        const num = parseFloat(String(value).replace(',', '.')) || 0;
        updated.salaireReel = num;
        updated.salairePlafonne = Math.min(num, CNSS_CEILING);
      } else if (field === 'cnss') {
        const clean = String(value).replace(/\D/g, '').slice(0, 9);
        updated.cnss = clean;
        updated.isValidCNSS = isValidCNSS(clean);
      } else if (field === 'jours') {
        const j = parseInt(value, 10);
        updated.jours = isNaN(j) ? 0 : Math.min(26, Math.max(0, j));
      }
      return updated;
    }));
  };

  // Add new entrant employee (B04)
  const handleAddEmployee = () => {
    const newEmp: EmployeeRecord = {
      id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cnss: '',
      nom: '',
      prenom: '',
      cin: '',
      jours: 26,
      salaireReel: 0,
      salairePlafonne: 0,
      situation: '',
      isPreetabli: false,
      isValidCNSS: true
    };
    setEmployees(prev => [newEmp, ...prev]);
  };

  // Delete employee
  const handleDelete = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  // Duplicate employee
  const handleDuplicate = (emp: EmployeeRecord) => {
    const duplicated: EmployeeRecord = {
      ...emp,
      id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isPreetabli: false
    };
    setEmployees(prev => [...prev, duplicated]);
  };

  // Set all days to 26
  const handleSetAll26Days = () => {
    setEmployees(prev => prev.map(e => ({
      ...e,
      jours: e.situation === 'CS' || e.situation === 'MS' ? 0 : 26
    })));
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('Voulez-vous vraiment effacer tous les salariés de la liste ?')) {
      setEmployees([]);
    }
  };

  // Excel file upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length > 0) {
        const formatted: EmployeeRecord[] = parsed.map((p, idx) => ({
          id: `emp_xl_${Date.now()}_${idx}`,
          cnss: p.cnss || '',
          nom: p.nom || '',
          prenom: p.prenom || '',
          cin: p.cin || '',
          jours: p.jours ?? 26,
          salaireReel: p.salaireReel ?? 0,
          salairePlafonne: Math.min(p.salaireReel ?? 0, CNSS_CEILING),
          situation: (p.situation || '') as SituationCode,
          isPreetabli: false,
          isValidCNSS: isValidCNSS(p.cnss || '')
        }));
        setEmployees(prev => [...prev, ...formatted]);
        setPasteNotice(`${formatted.length} salariés importés avec succès depuis Excel !`);
        setTimeout(() => setPasteNotice(null), 4000);
      }
    } catch (err) {
      alert("Erreur lors de l'import Excel. Vérifiez le format de votre fichier.");
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Paste event from Clipboard (Ctrl+V)
  const handleTablePaste = (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData || !clipboardData.includes('\t') && !clipboardData.includes('\n')) {
      // Single value paste is handled natively by inputs
      return;
    }

    e.preventDefault();
    const rows = clipboardData.split(/\r?\n/).filter(r => r.trim().length > 0);
    const newItems: EmployeeRecord[] = [];

    for (const row of rows) {
      const cols = row.split('\t').map(c => c.trim());
      if (cols.length === 0 || (!cols[0] && !cols[1])) continue;

      let cnss = (cols[0] || '').replace(/\D/g, '').slice(0, 9);
      let nom = cols[1] || '';
      let prenom = cols[2] || '';
      let cin = cols[3] || '';
      let jours = cols[4] !== undefined ? parseInt(cols[4], 10) : 26;
      let salStr = cols[5] ? cols[5].replace(/\s/g, '').replace(',', '.') : '0';
      let salaire = parseFloat(salStr) || 0;
      let sitRaw = (cols[6] || '').toUpperCase();
      let situation: SituationCode = ['SO', 'DE', 'IT', 'IL', 'AT', 'CS', 'MS', 'MP'].includes(sitRaw as SituationCode)
        ? (sitRaw as SituationCode)
        : '';

      newItems.push({
        id: `emp_paste_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        cnss,
        nom,
        prenom,
        cin,
        jours: Math.min(26, Math.max(0, isNaN(jours) ? 26 : jours)),
        salaireReel: salaire,
        salairePlafonne: Math.min(salaire, CNSS_CEILING),
        situation,
        isPreetabli: false,
        isValidCNSS: isValidCNSS(cnss)
      });
    }

    if (newItems.length > 0) {
      setEmployees(prev => [...prev, ...newItems]);
      setPasteNotice(`${newItems.length} ligne(s) collée(s) depuis Excel avec succès !`);
      setTimeout(() => setPasteNotice(null), 4000);
    }
  };

  // Totals
  const { totalSalaries, totalJours, totalSalaireReel, invalidCount } = useMemo(() => {
    let tJours = 0;
    let tSal = 0;
    let inv = 0;
    employees.forEach(e => {
      if (e.cnss || e.nom) {
        tJours += Number(e.jours) || 0;
        tSal += Number(e.salaireReel) || 0;
        if (e.cnss && !isValidCNSS(e.cnss)) inv++;
      }
    });
    return {
      totalSalaries: employees.length,
      totalJours: tJours,
      totalSalaireReel: tSal,
      invalidCount: inv
    };
  }, [employees]);

  return (
    <div 
      id="step-table-section" 
      className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-6"
      onPaste={handleTablePaste}
    >
      {/* Step Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Saisie & Contrôle des données des Salariés</span>
                <span className="text-xs font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  Copier-coller Excel supporté (Ctrl+V)
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Ajustez les jours travaillés et salaires bruts réels. Vous pouvez coller directement un tableau Excel.
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-add-employee"
              type="button"
              onClick={handleAddEmployee}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Ajouter un Salarié (Entrant)</span>
            </button>

            <button
              id="btn-set-26-days"
              type="button"
              onClick={handleSetAll26Days}
              title="Fixer 26 jours pour tous les salariés actifs"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Tous à 26j</span>
            </button>

            {/* Excel Import Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelUpload}
              className="hidden"
            />
            <button
              id="btn-import-excel"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Importer Excel/CSV</span>
            </button>

            {/* Excel Export */}
            <button
              id="btn-export-excel"
              type="button"
              onClick={() => exportToExcel(employees, header)}
              disabled={employees.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 disabled:opacity-40 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export .xlsx</span>
            </button>

            {/* Clear All */}
            {employees.length > 0 && (
              <button
                id="btn-clear-table"
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider</span>
              </button>
            )}
          </div>
        </div>

        {/* Notice for Paste */}
        {pasteNotice && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pasteNotice}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search_field"
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par N° CNSS, Nom, Prénom, CIN..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-1 rounded">
            {filteredEmployees.length} Résultat{filteredEmployees.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Situation filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Situation :</span>
            <select
              value={filterSituation}
              onChange={e => setFilterSituation(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-md px-2 py-1"
            >
              <option value="all">Toutes</option>
              <option value="none">Normal (Actif)</option>
              {SITUATION_CODES.filter(s => s.code).map(s => (
                <option key={s.code} value={s.code}>{s.code} - {s.label.split(' - ')[1]}</option>
              ))}
            </select>
          </div>

          {/* Validity filter */}
          {invalidCount > 0 && (
            <button
              onClick={() => setFilterValidity(filterValidity === 'invalid' ? 'all' : 'invalid')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                filterValidity === 'invalid'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{invalidCount} Erreur{invalidCount > 1 ? 's' : ''} CNSS</span>
            </button>
          )}

          {/* Type filter (Preetabli vs Entrant) */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-md px-2 py-1"
          >
            <option value="all">Tous types</option>
            <option value="preetabli">Préétablis (B02)</option>
            <option value="entrant">Entrants (B04)</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto max-h-[500px] scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">N°</th>
              <th className="py-2.5 px-3 min-w-[150px]">N° C.N.S.S (9 ch.)</th>
              <th className="py-2.5 px-3 min-w-[150px]">Nom</th>
              <th className="py-2.5 px-3 min-w-[140px]">Prénom</th>
              <th className="py-2.5 px-3 min-w-[100px]">C.I.N</th>
              <th className="py-2.5 px-3 w-20 text-center">Jours</th>
              <th className="py-2.5 px-3 min-w-[130px] text-right">Salaire DH (Brut)</th>
              <th className="py-2.5 px-3 min-w-[120px] text-right text-slate-500">Plafonné (6k)</th>
              <th className="py-2.5 px-3 min-w-[150px]">Situation</th>
              <th className="py-2.5 px-3 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-normal">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-medium text-slate-600">Aucun salarié dans la liste</p>
                    <p className="text-xs text-slate-400">
                      Importez un fichier préétabli, collez vos colonnes depuis Excel, ou cliquez sur <strong>"Ajouter un Salarié"</strong>.
                    </p>
                    <button
                      onClick={handleAddEmployee}
                      className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter le premier salarié</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp, index) => {
                const isValid = isValidCNSS(emp.cnss);
                const hasSituation = Boolean(emp.situation);

                return (
                  <tr 
                    key={emp.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !isValid && emp.cnss ? 'bg-rose-50/30' : hasSituation ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Index & Type Badge */}
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                      <div className="flex flex-col items-center">
                        <span>{index + 1}</span>
                        <span className={`text-[9px] font-bold px-1 rounded ${emp.isPreetabli ? 'text-slate-500 bg-slate-100' : 'text-emerald-700 bg-emerald-100'}`}>
                          {emp.isPreetabli ? 'B02' : 'B04'}
                        </span>
                      </div>
                    </td>

                    {/* CNSS Number with Live Validation Indicator */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={9}
                          value={emp.cnss}
                          onChange={e => handleUpdate(emp.id, 'cnss', e.target.value)}
                          placeholder="9 chiffres"
                          className={`w-full px-2.5 py-1.5 text-xs font-mono font-semibold rounded border transition-colors ${
                            !isValid && emp.cnss
                              ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                              : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
                          }`}
                        />
                        {emp.cnss && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                            {isValid ? (
                              <span title="Numéro CNSS valide" className="text-emerald-600">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                title={`N° CNSS non conforme au checksum modulo 10. Suggestion : ${calculateCNSSCheckDigit(emp.cnss) || 'Vérifier la carte'}`}
                                onClick={() => {
                                  const fixed = calculateCNSSCheckDigit(emp.cnss);
                                  if (fixed) handleUpdate(emp.id, 'cnss', fixed);
                                }}
                                className="text-rose-600 hover:text-rose-800"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Nom */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={emp.nom}
                        onChange={e => handleUpdate(emp.id, 'nom', e.target.value.toUpperCase())}
                        placeholder="NOM"
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 font-medium uppercase"
                      />
                    </td>

                    {/* Prenom */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={emp.prenom}
                        onChange={e => handleUpdate(emp.id, 'prenom', e.target.value.toUpperCase())}
                        placeholder="Prénom"
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 font-medium uppercase"
                      />
                    </td>

                    {/* CIN */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        maxLength={10}
                        value={emp.cin}
                        onChange={e => handleUpdate(emp.id, 'cin', e.target.value.toUpperCase())}
                        placeholder="CIN"
                        className="w-full px-2 py-1.5 text-xs font-mono rounded border border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                      />
                    </td>

                    {/* Jours (0-26) */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={26}
                        value={emp.jours}
                        onChange={e => handleUpdate(emp.id, 'jours', e.target.value)}
                        className={`w-16 px-2 py-1.5 text-xs text-center font-mono font-bold rounded border ${
                          emp.jours === 26
                            ? 'bg-emerald-50/50 text-emerald-800 border-emerald-200'
                            : emp.jours === 0
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'border-slate-300'
                        }`}
                      />
                    </td>

                    {/* Salaire Réel */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min={0}
                          value={emp.salaireReel || ''}
                          onChange={e => handleUpdate(emp.id, 'salaireReel', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 text-xs text-right font-mono font-semibold rounded border border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </td>

                    {/* Salaire Plafonné (Capped at 6000 DH) */}
                    <td className="py-2 px-3 text-right font-mono text-xs text-slate-500 pr-4">
                      {Math.min(emp.salaireReel || 0, CNSS_CEILING).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Situation Code Dropdown */}
                    <td className="py-2 px-3">
                      <select
                        value={emp.situation || ''}
                        onChange={e => handleUpdate(emp.id, 'situation', e.target.value as SituationCode)}
                        className={`w-full px-2 py-1.5 text-xs rounded border transition-colors ${
                          emp.situation
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                            : 'border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        {SITUATION_CODES.map(s => (
                          <option key={s.code} value={s.code}>
                            {s.code ? `${s.code} - ${s.label.split(' - ')[1]}` : 'Normal'}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(emp)}
                          title="Dupliquer la ligne"
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(emp.id)}
                          title="Supprimer la ligne"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reactive Total Footer Bar */}
      <div className="bg-slate-100 border-t border-slate-300 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-600">
            TOTAL SALARIÉS : <strong className="text-slate-900 font-mono text-sm">{totalSalaries}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 text-slate-600">
            TOTAL JOURS : <strong className="text-slate-900 font-mono text-sm">{totalJours}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600 uppercase text-[11px] tracking-wider">TOTAL SALAIRES :</span>
          <span className="bg-emerald-700 text-white font-mono font-bold text-sm px-3 py-1 rounded shadow-xs">
            {totalSalaireReel.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
          </span>
        </div>
      </div>

      {/* Situation Codes Legend and Warning Note */}
      <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-bold text-slate-700">Code Situations :</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>SO</strong> = Sortant</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>DE</strong> = Décédé</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>IT</strong> = Maternité</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>IL</strong> = Maladie</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>AT</strong> = Accident de Travail</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>CS</strong> = Congé Sans Salaire</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>MS</strong> = Maintenu Sans Salaire</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>MP</strong> = Maladie Professionnelle</span>
        </div>

        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-amber-800 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>NB :</strong> Les N° d'immatriculation en rouge ne correspondent pas à la formule de contrôle CNSS. Veuillez les vérifier depuis la carte d'immatriculation du salarié ou le BDS précédent pour éviter un rejet lors du téléversement sur DAMANCOM.
          </p>
        </div>
      </div>
    </div>
  );
};
