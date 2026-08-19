import * as XLSX from 'xlsx';
import { EmployeeRecord, PreetabliHeader } from '../types';
import { CNSS_CEILING, isValidCNSS, splitNomPrenom } from './cnssUtils';

export function exportToExcel(employees: EmployeeRecord[], header: PreetabliHeader, fileName = 'declaration_salaires_cnss.xlsx') {
  const data = employees.map((emp, index) => ({
    'N°': index + 1,
    'Immatriculation CNSS': emp.cnss,
    'Nom': emp.nom,
    'Prénom': emp.prenom,
    'CIN': emp.cin,
    'Jours Travaillés': emp.jours,
    'Salaire Brut Réel (MAD)': emp.salaireReel,
    'Salaire Plafonné (MAD)': Math.min(emp.salaireReel, CNSS_CEILING),
    'Situation': emp.situation || 'Normal',
    'Statut CNSS': emp.isPreetabli ? 'Préétabli (B02)' : 'Nouveau / Entrant (B04)',
    'Validité N° CNSS': isValidCNSS(emp.cnss) ? 'Valide' : 'Invalide'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Salariés');

  // Company info sheet
  const companyInfo = [
    { Propriété: 'Raison Sociale', Valeur: header.raisonSociale },
    { Propriété: 'N° Affiliation CNSS', Valeur: header.affiliation },
    { Propriété: 'Période Déclarée', Valeur: header.periode },
    { Propriété: 'Activité', Valeur: header.activite },
    { Propriété: 'Ville', Valeur: header.ville },
    { Propriété: 'Code Agence', Valeur: header.codeAgence },
    { Propriété: 'Date Génération', Valeur: new Date().toLocaleDateString('fr-FR') }
  ];
  const infoSheet = XLSX.utils.json_to_sheet(companyInfo);
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Informations Entreprise');

  XLSX.writeFile(workbook, fileName);
}

export function exportToCSV(employees: EmployeeRecord[], fileName = 'declaration_salaires_cnss.csv') {
  const headers = ['CNSS', 'Nom', 'Prenom', 'CIN', 'Jours', 'Salaire_Reel', 'Situation'];
  const rows = employees.map(e => [
    `"${e.cnss}"`,
    `"${e.nom.replace(/"/g, '""')}"`,
    `"${e.prenom.replace(/"/g, '""')}"`,
    `"${e.cin}"`,
    e.jours,
    e.salaireReel,
    `"${e.situation}"`
  ]);

  const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseExcelFile(file: File): Promise<Partial<EmployeeRecord>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawJson.length <= 1) {
          resolve([]);
          return;
        }

        // Try to identify header row or direct columns
        const headers = (rawJson[0] || []).map((h: any) => String(h || '').toLowerCase());
        const findCol = (keys: string[]) => headers.findIndex((h: string) => keys.some(k => h.includes(k)));

        const cnssIdx = findCol(['cnss', 'immatriculation', 'immat']);
        const nomIdx = findCol(['nom', 'name', 'nom_prenom', 'salarie']);
        const prenomIdx = findCol(['prenom', 'prénom', 'first']);
        const cinIdx = findCol(['cin', 'c.i.n', 'identite', 'identite']);
        const joursIdx = findCol(['jour', 'jours', 'nb_jour', 'nb jours']);
        const salaireIdx = findCol(['salaire', 'brut', 'salary', 'montant']);
        const situationIdx = findCol(['situation', 'statut', 'motif']);

        const results: Partial<EmployeeRecord>[] = [];

        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0 || (!row[0] && !row[1])) continue;

          let cnss = '';
          let nom = '';
          let prenom = '';
          let cin = '';
          let jours = 26;
          let salaire = 0;
          let situation = '';

          if (cnssIdx !== -1 && row[cnssIdx] !== undefined) cnss = String(row[cnssIdx]).trim();
          else if (row[0] !== undefined) cnss = String(row[0]).trim();

          if (nomIdx !== -1 && row[nomIdx] !== undefined) nom = String(row[nomIdx]).trim();
          else if (row[1] !== undefined) nom = String(row[1]).trim();

          if (prenomIdx !== -1 && row[prenomIdx] !== undefined) prenom = String(row[prenomIdx]).trim();
          else if (row[2] !== undefined && prenomIdx === -1 && nomIdx === -1) prenom = String(row[2]).trim();

          // If prenom is empty and nom has multiple words or comma/slash, split intelligently
          if (nom && !prenom && (nom.includes(' ') || nom.includes(',') || nom.includes('/'))) {
            const split = splitNomPrenom(nom);
            nom = split.nom;
            prenom = split.prenom;
          }

          if (cinIdx !== -1 && row[cinIdx] !== undefined) cin = String(row[cinIdx]).trim();
          else if (row[3] !== undefined && cinIdx === -1) cin = String(row[3]).trim();

          if (joursIdx !== -1 && row[joursIdx] !== undefined) jours = parseInt(String(row[joursIdx]), 10) || 26;
          else if (row[4] !== undefined && joursIdx === -1) jours = parseInt(String(row[4]), 10) || 26;

          if (salaireIdx !== -1 && row[salaireIdx] !== undefined) salaire = parseFloat(String(row[salaireIdx]).replace(',', '.')) || 0;
          else if (row[5] !== undefined && salaireIdx === -1) salaire = parseFloat(String(row[5]).replace(',', '.')) || 0;

          if (situationIdx !== -1 && row[situationIdx] !== undefined) situation = String(row[situationIdx]).trim().toUpperCase();
          else if (row[6] !== undefined && situationIdx === -1) situation = String(row[6]).trim().toUpperCase();

          results.push({
            cnss: cnss.replace(/\D/g, ''),
            nom,
            prenom,
            cin,
            jours: Math.min(26, Math.max(0, isNaN(jours) ? 26 : jours)),
            salaireReel: isNaN(salaire) ? 0 : salaire,
            salairePlafonne: Math.min(isNaN(salaire) ? 0 : salaire, CNSS_CEILING),
            situation: (['SO', 'DE', 'IT', 'IL', 'AT', 'CS', 'MS', 'MP'].includes(situation) ? situation : '') as any
          });
        }

        resolve(results);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
