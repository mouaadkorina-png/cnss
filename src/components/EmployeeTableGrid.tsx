import React, { useState, useMemo, useRef } from 'react';
import { EmployeeRecord, SituationCode } from '../types';
import { SITUATION_CODES, isValidCNSS, CNSS_CEILING, calculateCNSSCheckDigit, autoClassifyEmployees, splitNomPrenom } from '../utils/cnssUtils';
import { parseExcelFile, exportToExcel } from '../utils/exportUtils';
import { 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  FileSpreadsheet, 
  Download, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Info,
  UserPlus,
  Filter,
  Wand2,
  ShieldCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserX,
  RotateCcw,
  UserCheck
} from 'lucide-react';

interface Props {
  employees: EmployeeRecord[];
  setEmployees: React.Dispatch<React.SetStateAction<EmployeeRecord[]>>;
  header: any;
  bdsBaselineEmployees?: EmployeeRecord[];
}

type SortColumn = 'index' | 'isPreetabli' | 'cnss' | 'nom' | 'prenom' | 'cin' | 'jours' | 'salaireReel' | 'salairePlafonne' | 'situation';
type SortOrder = 'asc' | 'desc' | 'none';
type QuickFilterType = 'all' | 'b02' | 'b04' | 'so' | 'zero_days' | 'full_days' | 'capped' | 'special' | 'errors';

export const EmployeeTableGrid: React.FC<Props> = ({ 
  employees, 
  setEmployees, 
  header,
  bdsBaselineEmployees = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
  const [filterSituation, setFilterSituation] = useState<string>('all');
  const [filterValidity, setFilterValidity] = useState<'all' | 'valid' | 'invalid'>('all');
  const [filterType, setFilterType] = useState<'all' | 'preetabli' | 'entrant'>('all');
  const [filterJours, setFilterJours] = useState<'all' | '26' | '0' | 'partial'>('all');
  
  const [sortColumn, setSortColumn] = useState<SortColumn>('index');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [defaultPasteType, setDefaultPasteType] = useState<'auto' | 'preetabli' | 'entrant'>('auto');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set of CNSS numbers in BDS reference
  const bdsCnssSet = useMemo(() => {
    const set = new Set<string>();
    bdsBaselineEmployees.forEach(e => {
      const clean = (e.cnss || '').replace(/\D/g, '');
      if (clean) set.add(clean);
    });
    return set;
  }, [bdsBaselineEmployees]);

  // Statistics for Quick Filters & Toolbar
  const stats = useMemo(() => {
    let b02 = 0;
    let b04 = 0;
    let soCount = 0;
    let zeroDaysCount = 0;
    let fullDaysCount = 0;
    let specialSituationCount = 0;
    let cappedCount = 0;
    let invalidCount = 0;
    let tJours = 0;
    let tSal = 0;
    let tPlaf = 0;

    employees.forEach(e => {
      if (e.isPreetabli) b02++;
      else b04++;

      if (e.situation === 'SO' || (e.jours === 0 && e.salaireReel === 0)) soCount++;
      if (e.situation && e.situation !== 'SO') specialSituationCount++;
      if (e.jours === 0) zeroDaysCount++;
      if (e.jours === 26) fullDaysCount++;
      if (e.salaireReel > CNSS_CEILING) cappedCount++;
      if (e.cnss && !isValidCNSS(e.cnss)) invalidCount++;

      tJours += Number(e.jours) || 0;
      const sal = Number(e.salaireReel) || 0;
      tSal += sal;
      tPlaf += Math.min(sal, CNSS_CEILING);
    });

    return {
      totalSalaries: employees.length,
      b02Count: b02,
      b04Count: b04,
      soCount,
      zeroDaysCount,
      fullDaysCount,
      specialSituationCount,
      cappedCount,
      invalidCount,
      totalJours: tJours,
      totalSalaireReel: tSal,
      totalSalairePlafonne: tPlaf
    };
  }, [employees]);

  // Handle Sort Toggle
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') {
        setSortColumn('index');
        setSortOrder('none');
      } else {
        setSortOrder('asc');
      }
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted list
  const filteredAndSortedEmployees = useMemo(() => {
    // 1. Filtering
    const filtered = employees.filter(emp => {
      // Search query
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchSearch = 
          emp.nom.toLowerCase().includes(term) ||
          emp.prenom.toLowerCase().includes(term) ||
          emp.cnss.includes(term) ||
          emp.cin.toLowerCase().includes(term);
        if (!matchSearch) return false;
      }

      // Quick Filter chips
      if (quickFilter === 'b02' && !emp.isPreetabli) return false;
      if (quickFilter === 'b04' && emp.isPreetabli) return false;
      if (quickFilter === 'so' && emp.situation !== 'SO' && !(emp.jours === 0 && emp.salaireReel === 0)) return false;
      if (quickFilter === 'zero_days' && emp.jours !== 0) return false;
      if (quickFilter === 'full_days' && emp.jours !== 26) return false;
      if (quickFilter === 'capped' && emp.salaireReel <= CNSS_CEILING) return false;
      if (quickFilter === 'special' && (!emp.situation || emp.situation === 'SO')) return false;
      if (quickFilter === 'errors' && (!emp.cnss || isValidCNSS(emp.cnss))) return false;

      // Dropdown filters
      if (filterSituation !== 'all') {
        if (filterSituation === 'none' && emp.situation) return false;
        if (filterSituation !== 'none' && emp.situation !== filterSituation) return false;
      }

      if (filterType !== 'all') {
        if (filterType === 'preetabli' && !emp.isPreetabli) return false;
        if (filterType === 'entrant' && emp.isPreetabli) return false;
      }

      if (filterValidity !== 'all') {
        const valid = isValidCNSS(emp.cnss);
        if (filterValidity === 'valid' && !valid) return false;
        if (filterValidity === 'invalid' && valid) return false;
      }

      if (filterJours !== 'all') {
        if (filterJours === '26' && emp.jours !== 26) return false;
        if (filterJours === '0' && emp.jours !== 0) return false;
        if (filterJours === 'partial' && (emp.jours <= 0 || emp.jours >= 26)) return false;
      }

      return true;
    });

    // 2. Sorting
    if (sortOrder === 'none' || sortColumn === 'index') {
      return filtered;
    }

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'cnss':
          comparison = (a.cnss || '').localeCompare(b.cnss || '');
          break;
        case 'nom':
          comparison = (a.nom || '').localeCompare(b.nom || '');
          break;
        case 'prenom':
          comparison = (a.prenom || '').localeCompare(b.prenom || '');
          break;
        case 'cin':
          comparison = (a.cin || '').localeCompare(b.cin || '');
          break;
        case 'jours':
          comparison = (Number(a.jours) || 0) - (Number(b.jours) || 0);
          break;
        case 'salaireReel':
          comparison = (Number(a.salaireReel) || 0) - (Number(b.salaireReel) || 0);
          break;
        case 'salairePlafonne':
          comparison = Math.min(Number(a.salaireReel) || 0, CNSS_CEILING) - Math.min(Number(b.salaireReel) || 0, CNSS_CEILING);
          break;
        case 'situation':
          comparison = (a.situation || '').localeCompare(b.situation || '');
          break;
        case 'isPreetabli':
          comparison = (a.isPreetabli ? 1 : 0) - (b.isPreetabli ? 1 : 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [employees, searchTerm, quickFilter, filterSituation, filterType, filterValidity, filterJours, sortColumn, sortOrder]);

  const hasActiveFilters = searchTerm !== '' || quickFilter !== 'all' || filterSituation !== 'all' || filterType !== 'all' || filterValidity !== 'all' || filterJours !== 'all' || sortOrder !== 'none';

  const resetAllFilters = () => {
    setSearchTerm('');
    setQuickFilter('all');
    setFilterSituation('all');
    setFilterType('all');
    setFilterValidity('all');
    setFilterJours('all');
    setSortColumn('index');
    setSortOrder('none');
  };

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
        // Auto-detect if matched in BDS
        if (bdsCnssSet.size > 0 && clean) {
          updated.isPreetabli = bdsCnssSet.has(clean);
        }
      } else if (field === 'jours') {
        const j = parseInt(value, 10);
        updated.jours = isNaN(j) ? 0 : Math.min(26, Math.max(0, j));
      } else if (field === 'isPreetabli') {
        updated.isPreetabli = Boolean(value);
      }
      return updated;
    }));
  };

  // Add employee (Preetabli B02 or Entrant B04)
  const handleAddEmployee = (isPreetabli: boolean = true) => {
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
      isPreetabli: isPreetabli,
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
      id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    };
    setEmployees(prev => [...prev, duplicated]);
  };

  // Trigger Automatic Detection & Pass Missing BDS Employees to SO (0 days / 0 DH)
  const handleTriggerAutoDetectAndSO = () => {
    if (bdsBaselineEmployees.length === 0) {
      setPasteNotice("ℹ️ Conseil : Importez d'abord le fichier préétabli (BDS) en Étape 1 pour comparer automatiquement vos salariés avec la base officielle CNSS.");
      setTimeout(() => setPasteNotice(null), 5000);
      return;
    }

    const { employees: classified, preetablisCount, entrantsCount, addedFromBdsCount } = autoClassifyEmployees(
      employees,
      bdsBaselineEmployees,
      true // ensures missing BDS employees are inserted as SO with 0 days & 0 DH
    );

    setEmployees(classified);
    setPasteNotice(
      `🪄 Rapprochement terminé : ${preetablisCount} Préétablis (B02) et ${entrantsCount} Entrants (B04). ${
        addedFromBdsCount > 0 
          ? `⚡ ${addedFromBdsCount} salarié(s) préétabli(s) absent(s) ont été automatiquement passés en situation SO (0 jour, 0.00 DH).` 
          : 'Tous les salariés préétablis sont présents.'
      }`
    );
    setTimeout(() => setPasteNotice(null), 7000);
  };

  // Mark all 0-day employees with Situation 'SO'
  const handleSetZeroDaysToSO = () => {
    let count = 0;
    setEmployees(prev => prev.map(emp => {
      if (emp.jours === 0 && (!emp.situation || emp.situation !== 'SO')) {
        count++;
        return {
          ...emp,
          situation: 'SO',
          salaireReel: 0,
          salairePlafonne: 0
        };
      }
      return emp;
    }));

    setPasteNotice(
      count > 0 
        ? `${count} salarié(s) à 0 jour ont été passés en situation SO (Sortant / Non déclaré).` 
        : 'Tous les salariés à 0 jour ont déjà une situation renseignée.'
    );
    setTimeout(() => setPasteNotice(null), 4500);
  };

  // Bulk actions
  const handleSetAll26Days = () => {
    setEmployees(prev => prev.map(e => ({
      ...e,
      jours: e.situation === 'CS' || e.situation === 'MS' || e.situation === 'SO' ? 0 : 26
    })));
  };

  const handleSetAllPreetablis = () => {
    setEmployees(prev => prev.map(e => ({ ...e, isPreetabli: true })));
    setPasteNotice('Tous les salariés sont configurés en Préétablis (Segment B02).');
    setTimeout(() => setPasteNotice(null), 3500);
  };

  const handleSetAllEntrants = () => {
    setEmployees(prev => prev.map(e => ({ ...e, isPreetabli: false })));
    setPasteNotice('Tous les salariés sont configurés en Nouveaux Entrants (Segment B04).');
    setTimeout(() => setPasteNotice(null), 3500);
  };

  const handleClearAll = () => {
    if (window.confirm('Voulez-vous vraiment effacer tous les salariés de la liste ?')) {
      setEmployees([]);
    }
  };

  // Excel file upload with smart auto-detection and missing BDS -> SO assignment
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length > 0) {
        const existingCnssMap = new Map<string, EmployeeRecord>(
          employees.map(emp => [emp.cnss.replace(/\D/g, ''), emp])
        );
        const importedCnssSet = new Set<string>();

        let matchedCount = 0;
        let detectedEntrants = 0;
        let detectedPreetablis = 0;

        const updatedEmployees = [...employees];
        const newAddedEmployees: EmployeeRecord[] = [];

        parsed.forEach((p, idx) => {
          const cleanCnss = (p.cnss || '').replace(/\D/g, '');
          if (cleanCnss) importedCnssSet.add(cleanCnss);

          const isInBds = cleanCnss && bdsCnssSet.size > 0 ? bdsCnssSet.has(cleanCnss) : false;
          
          let isPreetabli = false;
          if (defaultPasteType === 'auto') {
            const existing = cleanCnss ? existingCnssMap.get(cleanCnss) : undefined;
            isPreetabli = bdsCnssSet.size > 0 ? isInBds : (existing ? existing.isPreetabli : false);
          } else {
            isPreetabli = defaultPasteType === 'preetabli';
          }

          if (isPreetabli) detectedPreetablis++;
          else detectedEntrants++;

          if (cleanCnss && existingCnssMap.has(cleanCnss)) {
            const targetIdx = updatedEmployees.findIndex(emp => emp.cnss.replace(/\D/g, '') === cleanCnss);
            if (targetIdx !== -1) {
              matchedCount++;
              if (p.jours !== undefined) updatedEmployees[targetIdx].jours = Math.min(26, Math.max(0, p.jours));
              if (p.salaireReel !== undefined) {
                updatedEmployees[targetIdx].salaireReel = p.salaireReel;
                updatedEmployees[targetIdx].salairePlafonne = Math.min(p.salaireReel, CNSS_CEILING);
              }
              if (p.situation) updatedEmployees[targetIdx].situation = p.situation as SituationCode;
              if (p.nom) updatedEmployees[targetIdx].nom = p.nom;
              if (p.prenom) updatedEmployees[targetIdx].prenom = p.prenom;
              if (p.cin) updatedEmployees[targetIdx].cin = p.cin;
              updatedEmployees[targetIdx].isPreetabli = isPreetabli;
            }
          } else {
            newAddedEmployees.push({
              id: `emp_xl_${Date.now()}_${idx}`,
              cnss: p.cnss || '',
              nom: p.nom || '',
              prenom: p.prenom || '',
              cin: p.cin || '',
              jours: p.jours ?? 26,
              salaireReel: p.salaireReel ?? 0,
              salairePlafonne: Math.min(p.salaireReel ?? 0, CNSS_CEILING),
              situation: (p.situation || '') as SituationCode,
              isPreetabli: isPreetabli,
              isValidCNSS: isValidCNSS(p.cnss || '')
            });
          }
        });

        // Check for BDS pre-established employees NOT in the uploaded file -> pass them to SO with 0 jours / 0 DH
        let missingBdsCount = 0;
        if (bdsBaselineEmployees.length > 0) {
          bdsBaselineEmployees.forEach(bdsEmp => {
            const cleanBds = (bdsEmp.cnss || '').replace(/\D/g, '');
            if (cleanBds && !importedCnssSet.has(cleanBds)) {
              const existingIdx = updatedEmployees.findIndex(emp => emp.cnss.replace(/\D/g, '') === cleanBds);
              if (existingIdx !== -1) {
                updatedEmployees[existingIdx].situation = 'SO';
                updatedEmployees[existingIdx].jours = 0;
                updatedEmployees[existingIdx].salaireReel = 0;
                updatedEmployees[existingIdx].salairePlafonne = 0;
                updatedEmployees[existingIdx].isPreetabli = true;
                missingBdsCount++;
              } else {
                newAddedEmployees.push({
                  ...bdsEmp,
                  id: `emp_bds_so_${Date.now()}_${cleanBds}`,
                  jours: 0,
                  salaireReel: 0,
                  salairePlafonne: 0,
                  situation: 'SO',
                  isPreetabli: true,
                  isValidCNSS: isValidCNSS(cleanBds)
                });
                missingBdsCount++;
              }
            }
          });
        }

        const combined = [...updatedEmployees, ...newAddedEmployees];
        setEmployees(combined);
        setPasteNotice(
          `Excel importé avec succès : ${matchedCount} salariés mis à jour, ${detectedEntrants} nouveau(x) entrant(s) (B04), ${detectedPreetablis} préétabli(s) (B02)${
            missingBdsCount > 0 ? ` et ${missingBdsCount} salarié(s) préétabli(s) absent(s) automatiquement passés en SO (0 jrs / 0 DH)` : ''
          } !`
        );
        setTimeout(() => setPasteNotice(null), 7000);
      }
    } catch (err) {
      alert("Erreur lors de l'import Excel. Vérifiez le format de votre fichier.");
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Paste event from Clipboard (Ctrl+V) with automatic entrant detection
  const handleTablePaste = (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData || (!clipboardData.includes('\t') && !clipboardData.includes('\n'))) {
      return;
    }

    e.preventDefault();
    const rows = clipboardData.split(/\r?\n/).filter(r => r.trim().length > 0);
    const newItems: EmployeeRecord[] = [];
    const updatedEmployees = [...employees];
    let matchedCount = 0;
    let autoEntrants = 0;
    let autoPreetablis = 0;

    const existingCnssMap = new Map<string, EmployeeRecord>(
      employees.map(emp => [emp.cnss.replace(/\D/g, ''), emp])
    );

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

      // Check if user pasted a 6-column layout: [CNSS | Nom_Prenom | CIN | Jours | Salaire | Situation]
      if (nom && nom.includes(' ') && prenom && /^[A-Za-z]{1,2}\d{3,8}$/i.test(prenom) && !isNaN(parseInt(cin, 10))) {
        sitRaw = (cols[5] || '').toUpperCase();
        situation = ['SO', 'DE', 'IT', 'IL', 'AT', 'CS', 'MS', 'MP'].includes(sitRaw as SituationCode) ? (sitRaw as SituationCode) : '';
        salStr = cols[4] ? cols[4].replace(/\s/g, '').replace(',', '.') : '0';
        salaire = parseFloat(salStr) || 0;
        jours = parseInt(cin, 10) || 26;
        cin = prenom;
        const split = splitNomPrenom(nom);
        nom = split.nom;
        prenom = split.prenom;
      } else if (nom && !prenom && (nom.includes(' ') || nom.includes(',') || nom.includes('/'))) {
        const split = splitNomPrenom(nom);
        nom = split.nom;
        prenom = split.prenom;
      }

      const isInBds = cnss && bdsCnssSet.size > 0 ? bdsCnssSet.has(cnss) : false;
      let isPreetabli = false;

      if (defaultPasteType === 'auto') {
        const existing = cnss ? existingCnssMap.get(cnss) : undefined;
        isPreetabli = bdsCnssSet.size > 0 ? isInBds : (existing ? existing.isPreetabli : false);
      } else {
        isPreetabli = defaultPasteType === 'preetabli';
      }

      if (isPreetabli) autoPreetablis++;
      else autoEntrants++;

      if (cnss && existingCnssMap.has(cnss)) {
        const targetIdx = updatedEmployees.findIndex(emp => emp.cnss.replace(/\D/g, '') === cnss);
        if (targetIdx !== -1) {
          matchedCount++;
          if (cols[4] !== undefined && !isNaN(jours)) updatedEmployees[targetIdx].jours = Math.min(26, Math.max(0, jours));
          if (cols[5] !== undefined) {
            updatedEmployees[targetIdx].salaireReel = salaire;
            updatedEmployees[targetIdx].salairePlafonne = Math.min(salaire, CNSS_CEILING);
          }
          if (situation) updatedEmployees[targetIdx].situation = situation;
          if (nom) updatedEmployees[targetIdx].nom = nom;
          if (prenom) updatedEmployees[targetIdx].prenom = prenom;
          if (cin) updatedEmployees[targetIdx].cin = cin;
          updatedEmployees[targetIdx].isPreetabli = isPreetabli;
          continue;
        }
      }

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
        isPreetabli: isPreetabli,
        isValidCNSS: isValidCNSS(cnss)
      });
    }

    if (newItems.length > 0 || matchedCount > 0) {
      setEmployees([...updatedEmployees, ...newItems]);
      setPasteNotice(
        `Collage effectué : ${matchedCount} salarié(s) mis à jour, ${autoEntrants} entrant(s) (B04) et ${autoPreetablis} préétabli(s) (B02) détectés automatiquement !`
      );
      setTimeout(() => setPasteNotice(null), 6000);
    }
  };

  const cleanCnss = (val: string) => (val || '').replace(/\D/g, '');

  // Helper for Column Sort Header with arrow icon
  const renderSortHeader = (label: string, column: SortColumn, align: 'left' | 'center' | 'right' = 'left', minWidth?: string) => {
    const isSorted = sortColumn === column;
    return (
      <th 
        className={`py-2.5 px-3 select-none cursor-pointer hover:bg-slate-200 transition-colors ${
          align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
        } ${minWidth ? `min-w-[${minWidth}]` : ''}`}
        onClick={() => handleSort(column)}
        title={`Cliquez pour trier par ${label}`}
      >
        <div className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <span>{label}</span>
          <span className="text-slate-400">
            {isSorted && sortOrder === 'asc' && <ArrowUp className="w-3.5 h-3.5 text-emerald-600 font-bold" />}
            {isSorted && sortOrder === 'desc' && <ArrowDown className="w-3.5 h-3.5 text-emerald-600 font-bold" />}
            {(!isSorted || sortOrder === 'none') && <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100" />}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div id="step-grid-section" className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-6" onPaste={handleTablePaste}>
      {/* Section Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">
                Grille des Salariés & Ventilations CNSS (B02 / B04)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {stats.totalSalaries} Salarié{stats.totalSalaries > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Modifiez vos salariés, importez votre fichier de paie Excel ou collez directement vos colonnes (Ctrl+V)
            </p>
          </div>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Automatic Reconciliation & Missing BDS to SO Button */}
          <button
            id="btn-auto-detect-so"
            type="button"
            onClick={handleTriggerAutoDetectAndSO}
            title="Compare avec le fichier préétabli (BDS) et passe automatiquement tous les salariés absents en situation SO avec 0 jour et 0 DH"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm ring-1 ring-blue-700/30"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Rapprochement BDS & Absents en SO</span>
          </button>

          {/* Mark Zero Days as SO Button */}
          {stats.zeroDaysCount > 0 && (
            <button
              type="button"
              onClick={handleSetZeroDaysToSO}
              title="Assigne la situation SO à tous les salariés ayant 0 jour de présence"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
            >
              <UserX className="w-3.5 h-3.5 text-amber-600" />
              <span>0 jour $\rightarrow$ SO ({stats.zeroDaysCount})</span>
            </button>
          )}

          {/* Add Preetabli B02 Button */}
          <button
            id="btn-add-b02"
            type="button"
            onClick={() => handleAddEmployee(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Préétabli (B02)</span>
          </button>

          {/* Add Entrant B04 Button */}
          <button
            id="btn-add-b04"
            type="button"
            onClick={() => handleAddEmployee(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Entrant (B04)</span>
          </button>

          {/* Excel Import */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Importer Excel/CSV</span>
            </button>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => exportToExcel(employees, header)}
              title="Exporter la liste actuelle au format Excel"
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              title="Effacer tous les salariés"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Detection & BDS Status Bar */}
      <div className="bg-slate-50/80 px-6 py-2.5 border-b border-slate-200 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Mode d'import / Copier-Coller :
            </span>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs text-[11px]">
              <button
                type="button"
                onClick={() => setDefaultPasteType('auto')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  defaultPasteType === 'auto'
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Auto-Détection (BDS $\rightarrow$ B02, Autre $\rightarrow$ B04)
              </button>
              <button
                type="button"
                onClick={() => setDefaultPasteType('preetabli')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  defaultPasteType === 'preetabli'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Forcer B02
              </button>
              <button
                type="button"
                onClick={() => setDefaultPasteType('entrant')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  defaultPasteType === 'entrant'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Forcer B04
              </button>
            </div>

            {bdsBaselineEmployees.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                Base BDS : {bdsBaselineEmployees.length} salariés préétablis officiels
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSetAll26Days}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium rounded text-[11px] transition-colors"
            >
              Tous à 26j (sauf SO/CS)
            </button>
            <button
              type="button"
              onClick={handleSetAllPreetablis}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold rounded text-[11px] transition-colors"
            >
              Tous en B02
            </button>
            <button
              type="button"
              onClick={handleSetAllEntrants}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded text-[11px] transition-colors"
            >
              Tous en B04
            </button>
          </div>
        </div>

        {/* Notice for Paste / Import */}
        {pasteNotice && (
          <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-fade-in shadow-2xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{pasteNotice}</span>
          </div>
        )}
      </div>

      {/* QUICK FILTERS CHIPS BAR */}
      <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400" />
          Filtres Rapides :
        </span>

        {/* Chip: Tous */}
        <button
          type="button"
          onClick={() => setQuickFilter('all')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            quickFilter === 'all'
              ? 'bg-slate-800 text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          Tous ({stats.totalSalaries})
        </button>

        {/* Chip: Préétablis B02 */}
        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'b02' ? 'all' : 'b02')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
            quickFilter === 'b02'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <span>B02 Préétablis</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-200/70 text-blue-900">{stats.b02Count}</span>
        </button>

        {/* Chip: Entrants B04 */}
        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'b04' ? 'all' : 'b04')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
            quickFilter === 'b04'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <span>B04 Entrants</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200/70 text-emerald-900">{stats.b04Count}</span>
        </button>

        {/* Chip: SO - Sortants / Non déclarés */}
        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'so' ? 'all' : 'so')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
            quickFilter === 'so'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
          }`}
        >
          <span>SO - Sortants / 0j</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">{stats.soCount}</span>
        </button>

        {/* Chip: Autres Situations */}
        {stats.specialSituationCount > 0 && (
          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'special' ? 'all' : 'special')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
              quickFilter === 'special'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <span>Situations (IT/AT...)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-200 text-purple-900">{stats.specialSituationCount}</span>
          </button>
        )}

        {/* Chip: 0 Jours */}
        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'zero_days' ? 'all' : 'zero_days')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            quickFilter === 'zero_days'
              ? 'bg-slate-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          0 Jour ({stats.zeroDaysCount})
        </button>

        {/* Chip: 26 Jours (Actifs) */}
        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === 'full_days' ? 'all' : 'full_days')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            quickFilter === 'full_days'
              ? 'bg-slate-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          26 Jours ({stats.fullDaysCount})
        </button>

        {/* Chip: Plafonnés > 6k */}
        {stats.cappedCount > 0 && (
          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'capped' ? 'all' : 'capped')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              quickFilter === 'capped'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            &gt; 6 000 DH ({stats.cappedCount})
          </button>
        )}

        {/* Chip: Erreurs CNSS */}
        {stats.invalidCount > 0 && (
          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'errors' ? 'all' : 'errors')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
              quickFilter === 'errors'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Erreurs CNSS ({stats.invalidCount})</span>
          </button>
        )}
      </div>

      {/* Advanced Filter, Search, and Sorting Bar */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Bar */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search_field"
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par N° CNSS, Nom, Prénom, CIN..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
            />
          </div>
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
            {filteredAndSortedEmployees.length} / {stats.totalSalaries}
          </span>
        </div>

        {/* Detailed Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segment B02 / B04 Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Type :</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Tous ({stats.totalSalaries})</option>
              <option value="preetabli">B02 Préétablis ({stats.b02Count})</option>
              <option value="entrant">B04 Nouveaux Entrants ({stats.b04Count})</option>
            </select>
          </div>

          {/* Jours Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Jours :</span>
            <select
              value={filterJours}
              onChange={e => setFilterJours(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Tous</option>
              <option value="26">26 jours ({stats.fullDaysCount})</option>
              <option value="0">0 jour ({stats.zeroDaysCount})</option>
              <option value="partial">1 à 25 jours</option>
            </select>
          </div>

          {/* Situation Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Situation :</span>
            <select
              value={filterSituation}
              onChange={e => setFilterSituation(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Toutes</option>
              <option value="none">Normal (Actif)</option>
              <option value="SO">SO - Sortant / Sans Objet</option>
              {SITUATION_CODES.filter(s => s.code && s.code !== 'SO').map(s => (
                <option key={s.code} value={s.code}>{s.code} - {s.label.split(' - ')[1]}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              title="Réinitialiser tous les filtres et le tri"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Effacer filtres</span>
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Table with Column Sorting */}
      <div className="overflow-x-auto max-h-[540px] scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
            <tr>
              {renderSortHeader('N°', 'index', 'center', '48px')}
              {renderSortHeader('Segment', 'isPreetabli', 'left', '130px')}
              {renderSortHeader('N° C.N.S.S', 'cnss', 'left', '140px')}
              {renderSortHeader('Nom', 'nom', 'left', '140px')}
              {renderSortHeader('Prénom', 'prenom', 'left', '130px')}
              {renderSortHeader('C.I.N', 'cin', 'left', '95px')}
              {renderSortHeader('Jours', 'jours', 'center', '80px')}
              {renderSortHeader('Salaire Brut (DH)', 'salaireReel', 'right', '135px')}
              {renderSortHeader('Plafonné (6k)', 'salairePlafonne', 'right', '110px')}
              {renderSortHeader('Situation', 'situation', 'left', '145px')}
              <th className="py-2.5 px-3 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-normal">
            {filteredAndSortedEmployees.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="font-semibold text-slate-700">Aucun salarié ne correspond à votre filtre</p>
                    <p className="text-xs text-slate-500">
                      {hasActiveFilters 
                        ? 'Essayez de modifier votre recherche ou réinitialisez les filtres actifs.'
                        : 'Importez un fichier préétabli BDS, collez vos colonnes depuis Excel, ou ajoutez un salarié.'
                      }
                    </p>
                    {hasActiveFilters ? (
                      <div className="pt-2">
                        <button
                          onClick={resetAllFilters}
                          className="inline-flex items-center gap-1.5 bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-900 shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Réinitialiser les filtres</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-center pt-2">
                        <button
                          onClick={() => handleAddEmployee(true)}
                          className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter Préétabli (B02)</span>
                        </button>
                        <button
                          onClick={() => handleAddEmployee(false)}
                          className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter Nouveau (B04)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedEmployees.map((emp, index) => {
                const isValid = isValidCNSS(emp.cnss);
                const isSO = emp.situation === 'SO';
                const hasSituation = Boolean(emp.situation);

                return (
                  <tr 
                    key={emp.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !isValid && emp.cnss 
                        ? 'bg-rose-50/40' 
                        : isSO 
                          ? 'bg-amber-50/30' 
                          : hasSituation 
                            ? 'bg-purple-50/20' 
                            : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>

                    {/* Preetabli (B02) vs Entrant (B04) Selector */}
                    <td className="py-2 px-3">
                      <select
                        value={emp.isPreetabli ? 'b02' : 'b04'}
                        onChange={e => handleUpdate(emp.id, 'isPreetabli', e.target.value === 'b02')}
                        className={`w-full px-2 py-1 text-[11px] font-bold rounded border transition-colors ${
                          emp.isPreetabli
                            ? 'bg-blue-50 text-blue-900 border-blue-300'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        <option value="b02">B02 (Préétabli)</option>
                        <option value="b04">B04 (Nouveau)</option>
                      </select>
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
                              ? 'bg-amber-100 text-amber-900 border-amber-400 font-black'
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
                          value={emp.salaireReel === 0 ? '0' : (emp.salaireReel || '')}
                          onChange={e => handleUpdate(emp.id, 'salaireReel', e.target.value)}
                          placeholder="0.00"
                          className={`w-full px-2.5 py-1.5 text-xs text-right font-mono font-semibold rounded border ${
                            emp.salaireReel === 0
                              ? 'border-amber-300 bg-amber-50/50 text-amber-900'
                              : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
                          }`}
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
                          emp.situation === 'SO'
                            ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                            : emp.situation
                              ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                              : 'border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        {SITUATION_CODES.map(s => (
                          <option key={s.code} value={s.code}>
                            {s.code ? `${s.code} - ${s.label.split(' - ')[1]}` : 'Normal (Actif)'}
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
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1 text-slate-700">
            TOTAL SALARIÉS : <strong className="text-slate-900 font-mono text-sm">{stats.totalSalaries}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            PRÉÉTABLIS (B02) : <span className="font-mono text-sm">{stats.b02Count}</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ENTRANTS (B04) : <span className="font-mono text-sm">{stats.b04Count}</span>
          </span>
          <span className="text-slate-300">|</span>
          {stats.soCount > 0 && (
            <>
              <span className="flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                SORTANTS (SO) : <span className="font-mono text-sm">{stats.soCount}</span>
              </span>
              <span className="text-slate-300">|</span>
            </>
          )}
          <span className="flex items-center gap-1 text-slate-600">
            TOTAL JOURS : <strong className="text-slate-900 font-mono text-sm">{stats.totalJours}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600 uppercase text-[11px] tracking-wider">TOTAL SALAIRES BRUT :</span>
          <span className="bg-emerald-700 text-white font-mono font-bold text-sm px-3 py-1 rounded shadow-xs">
            {stats.totalSalaireReel.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
          </span>
        </div>
      </div>

      {/* Situation Codes Legend and SO Clarification */}
      <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-bold text-slate-700">Codes Situation :</span>
          <span className="bg-amber-100 text-amber-900 font-bold border border-amber-300 px-1.5 py-0.5 rounded"><strong>SO</strong> = Sortant / Sans Objet (0 jrs, 0 DH)</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>DE</strong> = Décédé</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>IT</strong> = Maternité</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>IL</strong> = Maladie</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>AT</strong> = Accident de Travail</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>CS</strong> = Congé Sans Salaire</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>MS</strong> = Maintenu Sans Salaire</span>
          <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded"><strong>MP</strong> = Maladie Professionnelle</span>
        </div>

        <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-md text-blue-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>Règle de gestion DAMANCOM :</strong> Tout salarié figurant sur le préétabli officiel (BDS) qui n'a pas travaillé au cours du mois ou qui a quitté l'entreprise doit obligatoirement être déclaré avec le code situation <strong>SO</strong> (0 jour de présence, 0.00 DH de salaire) afin d'éviter tout rejet de télé-déclaration.
          </p>
        </div>
      </div>
    </div>
  );
};
