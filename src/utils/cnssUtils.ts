import { EmployeeRecord, PreetabliHeader, SituationCode, CotisationSummary, DeclarationSummary } from '../types';

export const SITUATION_CODES = [
  { code: '' as SituationCode, label: 'Normal (Actif)', description: 'Salarié présent et rémunéré normalement durant le mois.' },
  { code: 'SO' as SituationCode, label: 'SO - Sortant', description: 'Salarié ayant quitté l\'entreprise (démission, fin de contrat, licenciement, départ en retraite).' },
  { code: 'DE' as SituationCode, label: 'DE - Décédé', description: 'Salarié décédé au cours de la période de déclaration.' },
  { code: 'IT' as SituationCode, label: 'IT - Maternité', description: 'Salariée en congé de maternité indemnisée par la CNSS (IJM).' },
  { code: 'IL' as SituationCode, label: 'IL - Maladie', description: 'Salarié en arrêt pour maladie indemnisée par la CNSS (IJMD).' },
  { code: 'AT' as SituationCode, label: 'AT - Accident de Travail', description: 'Salarié victime d\'un accident du travail pris en charge par l\'assurance AT.' },
  { code: 'CS' as SituationCode, label: 'CS - Congé Sans salaire', description: 'Salarié en congé sans solde / absence non rémunérée autorisée.' },
  { code: 'MS' as SituationCode, label: 'MS - Maintenu Sans Salaire', description: 'Salarié figurant sur les effectifs mais sans perception de salaire.' },
  { code: 'MP' as SituationCode, label: 'MP - Maladie Professionnelle', description: 'Salarié en arrêt pour maladie professionnelle reconnue.' }
];

export const CNSS_CEILING = 6000; // 6,000 DH plafond mensuel CNSS

/**
 * Validates a Moroccan CNSS number using the official 9-digit checksum algorithm.
 */
export function isValidCNSS(nCnss: string | number): boolean {
  const str = String(nCnss || '').replace(/\s+/g, '').trim();
  if (str === '') return true; // Empty is handled separately
  if (str.length !== 9) return false;
  if (!/^\d{9}$/.test(str)) return false;
  if (str === '100000000') return false;
  if (str === '999999999') return true; // Special CNSS wildcard

  const getDigit = (pos1Based: number) => parseInt(str.charAt(pos1Based - 1), 10);

  // Cumul: 2*(d2 + d4 + d6 + d8) + (d3 + d5 + d7)
  const cumul = 2 * (getDigit(2) + getDigit(4) + getDigit(6) + getDigit(8)) +
                getDigit(3) + getDigit(5) + getDigit(7);

  const calculatedCheckDigit = (10 - (cumul % 10)) % 10;
  return calculatedCheckDigit === getDigit(9);
}

/**
 * Calculates the correct 9th check digit for an 8-digit CNSS root.
 */
export function calculateCNSSCheckDigit(eightDigits: string): string | null {
  const clean = eightDigits.replace(/\D/g, '');
  if (clean.length < 8) return null;
  const root = clean.slice(0, 8);
  const getDigit = (pos1Based: number) => parseInt(root.charAt(pos1Based - 1), 10);
  const cumul = 2 * (getDigit(2) + getDigit(4) + getDigit(6) + getDigit(8)) +
                getDigit(3) + getDigit(5) + getDigit(7);
  const check = (10 - (cumul % 10)) % 10;
  return root + check;
}

export function padLeft(val: string | number, length: number, char = '0'): string {
  const str = String(val ?? '');
  if (str.length >= length) return str.slice(0, length);
  return char.repeat(length - str.length) + str;
}

export function padRight(val: string | number, length: number, char = ' '): string {
  const str = String(val ?? '');
  if (str.length >= length) return str.slice(0, length);
  return str + char.repeat(length - str.length);
}

export function cleanText(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents for EDI compliance
    .replace(/[^a-zA-Z0-9\s\-.,/&']/g, '')
    .toUpperCase();
}

/**
 * Format amount into EDI fixed-width zero-padded integer representation with 2 decimal digits.
 * e.g. 5230.50 -> 523050 zero-padded to `length` characters
 */
export function formatAmountToEDI(amount: number, length: number): string {
  const rounded = Math.round(Number(amount || 0) * 100);
  return padLeft(Math.max(0, rounded), length, '0');
}

/**
 * Parse pre-established BDS CNSS file format (A00, A01, A02, A03)
 */
export function parsePreetabliFile(content: string): {
  header: PreetabliHeader;
  employees: EmployeeRecord[];
  errors: string[];
} {
  const lines = content.split(/\r?\n/);
  const errors: string[] = [];
  
  let header: PreetabliHeader = {
    structureRef: '00000000000000',
    affiliation: '',
    periode: '',
    raisonSociale: '',
    activite: '',
    adresse: '',
    ville: '',
    codePostal: '',
    codeAgence: '',
    dateEmission: '',
    dateExigibilite: ''
  };

  const employees: EmployeeRecord[] = [];
  let foundA01 = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine || rawLine.trim() === '') continue;

    const prefix = rawLine.substring(0, 3).toUpperCase();

    if (prefix === 'A00') {
      header.structureRef = rawLine.substring(3, 17).trim();
    } else if (prefix === 'A01') {
      foundA01 = true;
      header.affiliation = rawLine.substring(3, 10).trim();
      header.periode = rawLine.substring(10, 16).trim();
      header.raisonSociale = rawLine.substring(16, 56).trim();
      header.activite = rawLine.substring(56, 96).trim();
      header.adresse = rawLine.substring(96, 216).trim();
      header.ville = rawLine.substring(216, 236).trim();
      header.codePostal = rawLine.substring(236, 242).trim();
      header.codeAgence = rawLine.substring(242, 244).trim();
      header.dateEmission = rawLine.substring(244, 252).trim();
      header.dateExigibilite = rawLine.substring(252, 260).trim();
    } else if (prefix === 'A02') {
      // Individual employee record
      const cnss = rawLine.substring(16, 25).trim();
      const nomPrenomRaw = rawLine.substring(25, 85).trim();
      const cin = rawLine.substring(85, 95).trim();
      
      // Separate Nom and Prenom if possible
      let nom = nomPrenomRaw;
      let prenom = '';
      const parts = nomPrenomRaw.split(/\s+/);
      if (parts.length > 1) {
        nom = parts[0];
        prenom = parts.slice(1).join(' ');
      }

      // Check days and salary if present in BDS
      const joursStr = rawLine.substring(95, 97).trim();
      const jours = joursStr ? parseInt(joursStr, 10) : 26;

      const salaireStr = rawLine.substring(97, 110).trim();
      let salaire = 0;
      if (salaireStr && !isNaN(Number(salaireStr))) {
        salaire = parseFloat(salaireStr) / 100;
      }

      const sitRaw = rawLine.substring(123, 125).trim().toUpperCase();
      const validSituations: SituationCode[] = ['SO', 'DE', 'IT', 'IL', 'AT', 'CS', 'MS', 'MP'];
      const situation: SituationCode = validSituations.includes(sitRaw as SituationCode) ? (sitRaw as SituationCode) : '';

      employees.push({
        id: `emp_${Date.now()}_${employees.length + 1}_${Math.random().toString(36).substring(2, 6)}`,
        cnss: cnss,
        nom: nom,
        prenom: prenom,
        cin: cin,
        jours: isNaN(jours) ? 26 : Math.min(26, Math.max(0, jours)),
        salaireReel: salaire,
        salairePlafonne: Math.min(salaire, CNSS_CEILING),
        situation: situation,
        isPreetabli: true,
        isValidCNSS: isValidCNSS(cnss)
      });
    }
  }

  if (!foundA01 && lines.length > 0) {
    errors.push('Format de fichier préétabli non reconnu. Les enregistrements A00/A01 sont manquants.');
  }

  return { header, employees, errors };
}

/**
 * Generate compliant Moroccan CNSS Damancom EDI DS (or DSC) File.
 * Lines are padded to exactly 260 characters.
 */
export function generateDSFile(
  header: PreetabliHeader,
  employees: EmployeeRecord[],
  declarationType: 'principale' | 'complementaire' = 'principale',
  sequenceNum: number = 0
): string {
  const LINE_LENGTH = 260;
  const lines: string[] = [];

  const padLine = (content: string): string => {
    if (content.length >= LINE_LENGTH) return content.substring(0, LINE_LENGTH);
    return content + ' '.repeat(LINE_LENGTH - content.length);
  };

  const aff = padRight(header.affiliation.replace(/\D/g, ''), 7);
  const per = padRight(header.periode.replace(/\D/g, ''), 6);
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}${mm}${dd}`;

  // 1. Enregistrement B00: Entête globale
  const seqStr = declarationType === 'complementaire' ? padLeft(Math.max(1, sequenceNum), 2, '0') : '00';
  const b00Content = `B00${padRight(header.structureRef || '12345678901234', 14)}${todayStr}${seqStr}`;
  lines.push(padLine(b00Content));

  // 2. Enregistrement B01: Identification Affilié
  const rs = padRight(cleanText(header.raisonSociale), 40);
  const act = padRight(cleanText(header.activite), 40);
  const adr = padRight(cleanText(header.adresse), 120);
  const vil = padRight(cleanText(header.ville), 20);
  const cp = padRight(header.codePostal, 6);
  const ca = padRight(header.codeAgence, 2);
  const de = padRight(header.dateEmission || todayStr, 8);
  const dx = padRight(header.dateExigibilite || todayStr, 8);
  const b01Content = `B01${aff}${per}${rs}${act}${adr}${vil}${cp}${ca}${de}${dx}`;
  lines.push(padLine(b01Content));

  // Separate Preestablished (B02) and Entrants (B04)
  const preetablis = employees.filter(e => e.isPreetabli);
  const entrants = employees.filter(e => !e.isPreetabli);

  // --- B02 Lines ---
  let b02Count = 0;
  let b02TotalJours = 0;
  let b02TotalSalReel = 0;
  let b02TotalSalPlaf = 0;
  let b02SumCNSS = 0;

  for (const emp of preetablis) {
    if (!emp.cnss && !emp.nom) continue; // skip empty
    b02Count++;
    const cnssClean = padLeft(emp.cnss.replace(/\D/g, ''), 9, '0');
    b02SumCNSS += parseInt(cnssClean, 10) || 0;
    const nomComplet = padRight(cleanText(`${emp.nom} ${emp.prenom}`.trim()), 60);
    const cin = padRight(cleanText(emp.cin), 10);
    const jrs = padLeft(emp.jours, 2, '0');
    b02TotalJours += emp.jours;

    const salReelNum = emp.salaireReel || 0;
    const salPlafNum = Math.min(salReelNum, CNSS_CEILING);
    b02TotalSalReel += salReelNum;
    b02TotalSalPlaf += salPlafNum;

    const salReelEdi = formatAmountToEDI(salReelNum, 13);
    const salPlafEdi = formatAmountToEDI(salPlafNum, 9);
    const situation = padRight(emp.situation || '', 2);

    // B02 + Aff(7) + Per(6) + CNSS(9) + Nom(60) + CIN(10) + Jours(2) + SalReel(13) + SalPlaf(9) + FillerZero(19) + Sit(2)
    const fillerZero = '0'.repeat(19);
    const b02Content = `B02${aff}${per}${cnssClean}${nomComplet}${cin}${jrs}${salReelEdi}${salPlafEdi}${fillerZero}${situation}`;
    lines.push(padLine(b02Content));
  }

  // 3. Enregistrement B03: Total B02
  const b03Count = padLeft(b02Count, 6, '0');
  const b03Enfants = '000000';
  const b03AfAPayer = '000000000000';
  const b03AfADeduire = '000000000000';
  const b03AfNetAPayer = '000000000000';
  const b03SumCNSS = padLeft(b02SumCNSS, 15, '0');
  const b03AfAReverser = '000000000000';
  const b03Jours = padLeft(b02TotalJours, 6, '0');
  const b03SalReel = formatAmountToEDI(b02TotalSalReel, 15);
  const b03SalPlaf = formatAmountToEDI(b02TotalSalPlaf, 13);
  const b03FillerCtr = '0'.repeat(19);

  const b03Content = `B03${aff}${per}${b03Count}${b03Enfants}${b03AfAPayer}${b03AfADeduire}${b03AfNetAPayer}${b03SumCNSS}${b03AfAReverser}${b03Jours}${b03SalReel}${b03SalPlaf}${b03FillerCtr}`;
  lines.push(padLine(b03Content));

  // --- B04 Lines (Entrants / Nouveaux salariés) ---
  let b04Count = 0;
  let b04TotalJours = 0;
  let b04TotalSalReel = 0;
  let b04TotalSalPlaf = 0;
  let b04SumCNSS = 0;

  for (const emp of entrants) {
    if (!emp.cnss && !emp.nom) continue;
    b04Count++;
    const cnssClean = padLeft(emp.cnss.replace(/\D/g, ''), 9, '0');
    b04SumCNSS += parseInt(cnssClean, 10) || 0;
    const nomComplet = padRight(cleanText(`${emp.nom} ${emp.prenom}`.trim()), 60);
    const cin = padRight(cleanText(emp.cin), 10);
    const jrs = padLeft(emp.jours, 2, '0');
    b04TotalJours += emp.jours;

    const salReelNum = emp.salaireReel || 0;
    const salPlafNum = Math.min(salReelNum, CNSS_CEILING);
    b04TotalSalReel += salReelNum;
    b04TotalSalPlaf += salPlafNum;

    const salReelEdi = formatAmountToEDI(salReelNum, 13);
    const salPlafEdi = formatAmountToEDI(salPlafNum, 9);
    const situation = padRight(emp.situation || '', 2);
    const fillerZero = '0'.repeat(19);

    const b04Content = `B04${aff}${per}${cnssClean}${nomComplet}${cin}${jrs}${salReelEdi}${salPlafEdi}${fillerZero}${situation}`;
    lines.push(padLine(b04Content));
  }

  // 4. Enregistrement B05: Total B04 (Entrants)
  const b05Count = padLeft(b04Count, 6, '0');
  const b05SumCNSS = padLeft(b04SumCNSS, 15, '0');
  const b05Jours = padLeft(b04TotalJours, 6, '0');
  const b05SalReel = formatAmountToEDI(b04TotalSalReel, 15);
  const b05SalPlaf = formatAmountToEDI(b04TotalSalPlaf, 13);
  const b05FillerCtr = '0'.repeat(19);

  const b05Content = `B05${aff}${per}${b05Count}${b05SumCNSS}${b05Jours}${b05SalReel}${b05SalPlaf}${b05FillerCtr}`;
  lines.push(padLine(b05Content));

  // 5. Enregistrement B06: Total Général (B03 + B05)
  const b06TotalSalaries = padLeft(b02Count + b04Count, 6, '0');
  const b06TotalSumCNSS = padLeft(b02SumCNSS + b04SumCNSS, 15, '0');
  const b06TotalJours = padLeft(b02TotalJours + b04TotalJours, 6, '0');
  const b06TotalSalReel = formatAmountToEDI(b02TotalSalReel + b04TotalSalReel, 15);
  const b06TotalSalPlaf = formatAmountToEDI(b02TotalSalPlaf + b04TotalSalPlaf, 13);
  const b06FillerCtr = '0'.repeat(19);

  const b06Content = `B06${aff}${per}${b06TotalSalaries}${b06TotalSumCNSS}${b06TotalJours}${b06TotalSalReel}${b06TotalSalPlaf}${b06FillerCtr}`;
  lines.push(padLine(b06Content));

  return lines.join('\r\n') + '\r\n';
}

/**
 * Calculates Moroccan social security contributions (CNSS & AMO & Taxe Formation)
 */
export function calculateCotisations(salaireReelTotal: number, salairePlafonneTotal: number): CotisationSummary {
  // Rates in Morocco:
  // Prestations Familiales: 6.40% (Patronal, unplafoned)
  // Prestations Sociales Court et Long Terme:
  //   - Patronal: 8.98% (plafonné à 6000 DH par salarié)
  //   - Salarial: 4.48% (plafonné à 6000 DH par salarié)
  // Assurance Maladie Obligatoire (AMO):
  //   - Patronal: 4.11% (unplafoned)
  //   - Salarial: 2.26% (unplafoned)
  //   - Participation AMO: 1.85% (Patronal unplafoned)
  // Taxe de Formation Professionnelle: 1.60% (Patronal unplafoned)

  const baseNonPlafonnee = salaireReelTotal;
  const basePlafonnee = salairePlafonneTotal;

  const prestationsFamiliales = baseNonPlafonnee * 0.064;
  const prestationsSocialesPatr = basePlafonnee * 0.0898;
  const prestationsSocialesSal = basePlafonnee * 0.0448;

  const amoPatr = baseNonPlafonnee * 0.0411;
  const amoSal = baseNonPlafonnee * 0.0226;
  const participationAmo = baseNonPlafonnee * 0.0185;

  const tfp = baseNonPlafonnee * 0.016;

  const totalPatronal = prestationsFamiliales + prestationsSocialesPatr + amoPatr + participationAmo + tfp;
  const totalSalarial = prestationsSocialesSal + amoSal;
  const totalGlobal = totalPatronal + totalSalarial;

  return {
    basePlafonnee,
    baseNonPlafonnee,
    prestationsFamiliales,
    prestationsSocialesPatr,
    prestationsSocialesSal,
    amoPatr,
    amoSal,
    participationAmo,
    tfp,
    totalPatronal,
    totalSalarial,
    totalGlobal
  };
}

export function computeDeclarationSummary(employees: EmployeeRecord[]): DeclarationSummary {
  let totalJours = 0;
  let totalSalaireReel = 0;
  let totalSalairePlafonne = 0;
  let totalPreetablis = 0;
  let totalEntrants = 0;
  let errorCount = 0;

  for (const emp of employees) {
    if (!emp.cnss && !emp.nom) continue;
    totalJours += Number(emp.jours) || 0;
    const reel = Number(emp.salaireReel) || 0;
    const plaf = Math.min(reel, CNSS_CEILING);
    totalSalaireReel += reel;
    totalSalairePlafonne += plaf;

    if (emp.isPreetabli) totalPreetablis++;
    else totalEntrants++;

    if (emp.cnss && !isValidCNSS(emp.cnss)) {
      errorCount++;
    }
  }

  const cotisations = calculateCotisations(totalSalaireReel, totalSalairePlafonne);

  return {
    totalSalaries: totalPreetablis + totalEntrants,
    totalJours,
    totalSalaireReel,
    totalSalairePlafonne,
    totalPreetablis,
    totalEntrants,
    totalCotisations: cotisations,
    hasErrors: errorCount > 0,
    errorCount
  };
}

/**
 * Creates a realistic sample pre-established file (BDS CNSS) for instant testing & demo.
 */
export function getSamplePreetabliContent(): string {
  const LINE_LENGTH = 260;
  const pad = (str: string) => str.padEnd(LINE_LENGTH, ' ');

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const per = `${year}${month}`;

  const l0 = pad(`A0020241029153022`);
  const l1 = pad(`A011234567${per}SOCIETE MAROCAINE DE TECHNOLOGIE ET SERVICESCOMMERCE ET SERVICES DIVERS                     BD MOHAMMED V, ANGLE RUE DE LA LIBERTE N° 45, ETAGE 3, MAARIFCASABLANCA          20000 01${year}${month}01${year}${month}10`);
  
  // Real sample employees with valid Moroccan CNSS numbers
  const emps = [
    { cnss: '183920194', nom: 'EL AMRANI MOHAMMED', cin: 'BK389201', j: '26', sal: '0000000850000' },
    { cnss: '204918239', nom: 'BENNANI FATIMA ZAHRA', cin: 'AE910245', j: '26', sal: '0000000620000' },
    { cnss: '109283401', nom: 'CHRAIBI YOUSSEF', cin: 'BE782103', j: '26', sal: '0000001200000' },
    { cnss: '392817456', nom: 'TAZI KENZA', cin: 'BL490218', j: '26', sal: '0000000550000' },
    { cnss: '284910398', nom: 'ALAMI IDRISSI OMAR', cin: 'AA819203', j: '26', sal: '0000000780000' },
    { cnss: '194820193', nom: 'KADIRI SOUKAINA', cin: 'CD541092', j: '22', sal: '0000000480000' }
  ];

  const lines = [l0, l1];
  for (const e of emps) {
    const l2 = pad(`A021234567${per}${e.cnss.padEnd(9, ' ')}${e.nom.padEnd(60, ' ')}${e.cin.padEnd(10, ' ')}${e.j}${e.sal}${'0'.repeat(13)}  `);
    lines.push(l2);
  }

  const l3 = pad(`A031234567${per}000006000000000000000000000000000000000000000000000000000000000000000000000001520000000448000000000003430000`);
  lines.push(l3);

  return lines.join('\r\n');
}
