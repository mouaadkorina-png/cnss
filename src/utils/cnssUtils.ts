import { EmployeeRecord, PreetabliHeader, SituationCode, CotisationSummary, DeclarationSummary } from '../types';

export const CNSS_CEILING = 6000.00;

export const SITUATION_CODES: { code: SituationCode; label: string; description: string }[] = [
  { code: '', label: 'Normal - Salarié actif', description: 'Salarié en activité normale durant le mois' },
  { code: 'SO', label: 'SO - Sortant / Démission / Fin de contrat', description: 'Salarié ayant quitté l\'entreprise dans le mois' },
  { code: 'DE', label: 'DE - Décédé', description: 'Salarié décédé' },
  { code: 'IT', label: 'IT - Maternité', description: 'Salariée en congé de maternité indemnisé par la CNSS' },
  { code: 'IL', label: 'IL - Maladie longue durée / Incapacité temporaire', description: 'Arrêt de travail pour maladie indemnisé' },
  { code: 'AT', label: 'AT - Accident de Travail', description: 'Arrêt de travail suite à un accident de travail' },
  { code: 'CS', label: 'CS - Congé Sans Salaire', description: 'Salarié en congé sans solde (0 jour, 0 salaire)' },
  { code: 'MS', label: 'MS - Maintenu Sans Salaire', description: 'Salarié maintenu dans les effectifs sans rémunération' },
  { code: 'MP', label: 'MP - Maladie Professionnelle', description: 'Incapacité liée à une maladie professionnelle' },
];

/**
 * Validates a 9-digit Moroccan CNSS number using the official Modulo 10 Checksum Algorithm.
 */
export function isValidCNSS(cnss: string): boolean {
  if (!cnss) return false;
  const clean = cnss.replace(/\D/g, '');
  if (clean.length !== 9) return false;

  const d1 = parseInt(clean[0], 10);
  const d2 = parseInt(clean[1], 10);
  const d3 = parseInt(clean[2], 10);
  const d4 = parseInt(clean[3], 10);
  const d5 = parseInt(clean[4], 10);
  const d6 = parseInt(clean[5], 10);
  const d7 = parseInt(clean[6], 10);
  const d8 = parseInt(clean[7], 10);
  const d9 = parseInt(clean[8], 10);

  const cumul = 2 * (d2 + d4 + d6 + d8) + (d3 + d5 + d7);
  const calculatedClé = (10 - (cumul % 10)) % 10;

  return calculatedClé === d9;
}

/**
 * Calculates the correct 9th check digit for the first 8 digits of a CNSS number.
 */
export function calculateCNSSCheckDigit(cnss8: string): string | null {
  const clean = cnss8.replace(/\D/g, '');
  if (clean.length < 8) return null;

  const d2 = parseInt(clean[1] || '0', 10);
  const d3 = parseInt(clean[2] || '0', 10);
  const d4 = parseInt(clean[3] || '0', 10);
  const d5 = parseInt(clean[4] || '0', 10);
  const d6 = parseInt(clean[5] || '0', 10);
  const d7 = parseInt(clean[6] || '0', 10);
  const d8 = parseInt(clean[7] || '0', 10);

  const cumul = 2 * (d2 + d4 + d6 + d8) + (d3 + d5 + d7);
  const clé = (10 - (cumul % 10)) % 10;
  return `${clean.slice(0, 8)}${clé}`;
}

export function padLeft(value: string | number, length: number, char: string = ' '): string {
  const s = String(value);
  if (s.length >= length) return s.substring(0, length);
  return char.repeat(length - s.length) + s;
}

export function padRight(value: string | number, length: number, char: string = ' '): string {
  const s = String(value);
  if (s.length >= length) return s.substring(0, length);
  return s + char.repeat(length - s.length);
}

export function cleanText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s.,'/-]/g, ' ')
    .trim();
}

/**
 * Intelligently splits a full name (Nom & Prénom) into family name (Nom) and first name (Prénom).
 * Accurately handles Moroccan, Arabic, and French compound surname prefixes 
 * (e.g. 'EL HAIMER', 'BEN ALI', 'AIT LAHSSEN', 'BOU AZZA', 'OULD CHEIKH', 'DE LA ROCHE', etc.)
 * as well as compound first names (e.g. 'ZINE EL ABIDINE', 'MOHAMED AMINE', 'FATIMA ZAHRA').
 */
export function splitNomPrenom(rawFullName: string): { nom: string; prenom: string } {
  if (!rawFullName) return { nom: '', prenom: '' };

  const cleaned = rawFullName.trim().replace(/\s+/g, ' ');
  if (!cleaned) return { nom: '', prenom: '' };

  // If name has explicit separator like comma or slash (e.g., "EL HAIMER, RACHID" or "EL HAIMER / RACHID")
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(s => s.trim());
    return { nom: parts[0] || '', prenom: parts.slice(1).join(' ') };
  }
  if (cleaned.includes(' / ')) {
    const parts = cleaned.split(' / ').map(s => s.trim());
    return { nom: parts[0] || '', prenom: parts.slice(1).join(' ') };
  }

  const parts = cleaned.split(' ');
  if (parts.length === 1) {
    return { nom: parts[0], prenom: '' };
  }

  const p0 = parts[0].toUpperCase();
  const p1 = parts[1].toUpperCase();

  // Compound surname prefixes with 2 words (e.g. 'DE LA ROCHE', 'BEN EL', 'AIT EL', 'ABOU EL', 'OULD EL')
  const compoundDoublePrefixes = ['DE LA', 'BEN EL', 'AIT EL', 'ABOU EL', 'OULD EL', 'IBN EL', 'BIN EL', 'VAN DER', 'VON DER'];
  const twoWordPrefix = `${p0} ${p1}`;

  if (compoundDoublePrefixes.includes(twoWordPrefix)) {
    if (parts.length >= 3) {
      const nom = parts.slice(0, 3).join(' ');
      const prenom = parts.slice(3).join(' ');
      return { nom, prenom };
    }
  }

  // Single-word surname prefixes (e.g., 'EL', 'AL', 'AIT', 'AYT', 'BEN', 'IBN', 'BIN', 'BOU', 'BEL', 'OULD', 'WALD', 'ABOU', 'ABU', 'SIDI', 'MOULAY', 'DE', 'DU', 'DES', 'LE', 'LA', 'DA', 'DI', 'DOS', 'VAN', 'VON')
  const singlePrefixes = [
    'EL', 'AL', 'AIT', 'AYT', 'BEN', 'IBN', 'BIN', 'BOU', 'BEL', 
    'OULD', 'WALD', 'ABOU', 'ABU', 'SIDI', 'MOULAY', 
    'DE', 'DU', 'DES', 'LE', 'LA', 'DA', 'DI', 'DOS', 'VAN', 'VON'
  ];

  if (singlePrefixes.includes(p0)) {
    // The surname consists of the prefix + the second word (e.g. "EL HAIMER" + "RACHID")
    const nom = `${parts[0]} ${parts[1]}`;
    const prenom = parts.slice(2).join(' ');
    return { nom, prenom };
  }

  // If first word is not a compound prefix:
  // Standard Moroccan / French format [NOM] [PRENOM...] (e.g., "NAJEH ZINE EL ABIDINE" -> nom: "NAJEH", prenom: "ZINE EL ABIDINE")
  return {
    nom: parts[0],
    prenom: parts.slice(1).join(' ')
  };
}

/**
 * Format amount into EDI fixed-width zero-padded integer representation in centimes.
 * e.g. 5230.50 -> 523050 zero-padded to `length` characters
 */
export function formatAmountToEDI(amount: number, length: number): string {
  const rounded = Math.round(Number(amount || 0) * 100);
  return padLeft(Math.max(0, rounded), length, '0');
}

/**
 * Parse pre-established BDS CNSS file format (A00, A01, A02, A03) or existing DS file (B00, B01, B02, B04)
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
  let foundHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine || rawLine.trim() === '') continue;

    const prefix = rawLine.substring(0, 3).toUpperCase();

    if (prefix === 'A00' || prefix === 'B00') {
      header.affiliation = rawLine.substring(3, 10).trim();
      header.structureRef = rawLine.substring(10).trim();
    } else if (prefix === 'A01' || prefix === 'B01') {
      foundHeader = true;
      header.affiliation = rawLine.substring(3, 10).trim();
      header.periode = rawLine.substring(10, 16).trim();

      if (prefix === 'B01') {
        // Moroccan B01 format: RS (80 chars), ADR (120 chars), VIL (26 chars), CA (2 chars), DE (8 chars), DX (8 chars)
        header.raisonSociale = rawLine.substring(16, 96).trim();
        header.adresse = rawLine.substring(96, 216).trim();
        header.ville = rawLine.substring(216, 242).trim();
        header.codeAgence = rawLine.substring(242, 244).trim();
        header.dateEmission = rawLine.substring(244, 252).trim();
        header.dateExigibilite = rawLine.substring(252, 260).trim();
      } else {
        // A01 format
        header.raisonSociale = rawLine.substring(16, 56).trim();
        header.activite = rawLine.substring(56, 96).trim();
        header.adresse = rawLine.substring(96, 216).trim();
        header.ville = rawLine.substring(216, 236).trim();
        header.codePostal = rawLine.substring(236, 242).trim();
        header.codeAgence = rawLine.substring(242, 244).trim();
        header.dateEmission = rawLine.substring(244, 252).trim();
        header.dateExigibilite = rawLine.substring(252, 260).trim();
      }
    } else if (prefix === 'A02' || prefix === 'B02') {
      // Preestablished Employee Record (B02)
      const cnss = rawLine.substring(16, 25).trim();
      let nom = '';
      let prenom = '';
      let cin = '';
      let jours = 26;
      let salaire = 0;
      let situation: SituationCode = '';

      if (prefix === 'B02') {
        nom = rawLine.substring(25, 55).trim();
        prenom = rawLine.substring(55, 85).trim();
        // 26 zeros from index 85 to 111
        const joursStr = rawLine.substring(111, 113).trim();
        jours = joursStr ? parseInt(joursStr, 10) : 26;
        const salCentimes = rawLine.substring(113, 126).trim();
        if (salCentimes && !isNaN(Number(salCentimes))) {
          salaire = parseFloat(salCentimes) / 100;
        }
        const sitRaw = rawLine.substring(135, 137).trim().toUpperCase();
        const validSituations: SituationCode[] = ['SO', 'DE', 'IT', 'IL', 'AT', 'CS', 'MS', 'MP'];
        situation = validSituations.includes(sitRaw as SituationCode) ? (sitRaw as SituationCode) : '';
      } else {
        // A02 format
        const nomPrenomRaw = rawLine.substring(25, 85).trim();
        cin = rawLine.substring(85, 95).trim();
        const split = splitNomPrenom(nomPrenomRaw);
        nom = split.nom;
        prenom = split.prenom;
      }

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
    } else if (prefix === 'B04') {
      // New Entrant Employee Record (B04)
      const cnss = rawLine.substring(16, 25).trim();
      const nomPrenomRaw = rawLine.substring(25, 85).trim();
      const cin = rawLine.substring(85, 93).trim();
      
      const { nom, prenom } = splitNomPrenom(nomPrenomRaw);

      const joursStr = rawLine.substring(93, 95).trim();
      const jours = joursStr ? parseInt(joursStr, 10) : 26;

      const salCentimes = rawLine.substring(95, 108).trim();
      let salaire = 0;
      if (salCentimes && !isNaN(Number(salCentimes))) {
        salaire = parseFloat(salCentimes) / 100;
      }

      employees.push({
        id: `emp_${Date.now()}_${employees.length + 1}_${Math.random().toString(36).substring(2, 6)}`,
        cnss: cnss,
        nom: nom,
        prenom: prenom,
        cin: cin,
        jours: isNaN(jours) ? 26 : Math.min(26, Math.max(0, jours)),
        salaireReel: salaire,
        salairePlafonne: Math.min(salaire, CNSS_CEILING),
        situation: '',
        isPreetabli: false,
        isValidCNSS: isValidCNSS(cnss)
      });
    }
  }

  if (!foundHeader && lines.length > 0 && employees.length === 0) {
    errors.push('Format de fichier non reconnu. Les enregistrements d\'entête A01/B01 ou de salariés A02/B02/B04 sont manquants.');
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

  const aff = padLeft(header.affiliation.replace(/\D/g, ''), 7, '0');
  const per = padLeft(header.periode.replace(/\D/g, ''), 6, '0');
  const now = new Date();
  const yyyy = now.getFullYear();
  const curMm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}${curMm}${dd}`;

  // 1. Enregistrement B00: Entête globale
  // In CNSS DAMANCOM EDI standard, the structure reference is always:
  // YY (2) + MM (2) + Sequence (2, e.g. 01 for principale, 02.. for complementaire) + '4B0' (3)
  // e.g. for period 202605 -> 2605014B0
  const yy = per.length === 6 ? (per.startsWith('20') ? per.substring(2, 4) : per.substring(4, 6)) : '26';
  const perMm = per.length === 6 ? (per.startsWith('20') ? per.substring(4, 6) : per.substring(0, 2)) : '05';
  const seq = declarationType === 'complementaire' ? padLeft(sequenceNum || 1, 2, '0') : '01';
  const defaultStructureCode = `${yy}${perMm}${seq}4B0`;

  let structureCode = defaultStructureCode;
  if (header.structureRef && header.structureRef.trim().length > 0) {
    const trimmed = header.structureRef.trim();
    if (trimmed.endsWith('4B0') && trimmed.length === 9) {
      structureCode = trimmed;
    } else {
      structureCode = defaultStructureCode;
    }
  }
  const b00Content = `B00${aff}${structureCode}`;
  lines.push(padLine(b00Content));

  // 2. Enregistrement B01: Identification Affilié
  // Format exact CNSS DAMANCOM EDI:
  // B01 (3) + Aff (7) + Per (6) + RS (80) + ADR (120) + VILLE (26) + AGENCE (2) + DATE EMISSION (8) + DATE EXIGIBILITE (8) = 260 chars -> padded to 260
  const rs = padRight(cleanText(header.raisonSociale), 80);
  const adr = padRight(cleanText(header.adresse), 120);
  const vil = padRight(cleanText(header.ville), 26);
  const ca = padLeft(header.codeAgence ? header.codeAgence.replace(/\D/g, '') : '05', 2, '0');
  const de = padLeft(header.dateEmission ? header.dateEmission.replace(/\D/g, '') : todayStr, 8, '0');
  const dx = padLeft(header.dateExigibilite ? header.dateExigibilite.replace(/\D/g, '') : todayStr, 8, '0');
  const b01Content = `B01${aff}${per}${rs}${adr}${vil}${ca}${de}${dx}`;
  lines.push(padLine(b01Content));

  // Separate Preestablished (B02) and Entrants (B04)
  const preetablis = employees.filter(e => e.isPreetabli);
  const entrants = employees.filter(e => !e.isPreetabli);

  // --- B02 Lines (Salariés Préétablis) ---
  let b02Count = 0;
  let b02TotalJours = 0;
  let b02SumSalReelCentimes = 0;
  let b02SumSalPlafCentimes = 0;
  let b02SumCNSS = 0;
  let b02SumCheck = 0;

  for (const emp of preetablis) {
    if (!emp.cnss && !emp.nom) continue; // skip empty
    b02Count++;
    const cnssClean = padLeft(emp.cnss.replace(/\D/g, ''), 9, '0');
    const cnssNum = parseInt(cnssClean, 10) || 0;
    b02SumCNSS += cnssNum;

    const nom = padRight(cleanText(emp.nom), 30);
    const prenom = padRight(cleanText(emp.prenom), 30);
    const jrsNum = Math.min(26, Math.max(0, Number(emp.jours) || 0));
    const jrs = padLeft(jrsNum, 2, '0');
    b02TotalJours += jrsNum;

    const salReelNum = Number(emp.salaireReel) || 0;
    const salPlafNum = Math.min(salReelNum, CNSS_CEILING);

    const salReelCentimes = Math.round(salReelNum * 100);
    const salPlafCentimes = Math.round(salPlafNum * 100);
    b02SumSalReelCentimes += salReelCentimes;
    b02SumSalPlafCentimes += salPlafCentimes;

    const salReelEdi = padLeft(salReelCentimes, 13, '0');
    const salPlafEdi = padLeft(salPlafCentimes, 9, '0');
    const situation = padRight(emp.situation || '', 2);

    // Line control sum: CNSS + Jours + SalReelCentimes + SalPlafCentimes (+ 1 if situation SO with zero salary)
    const lineCheckNum = cnssNum + jrsNum + salReelCentimes + salPlafCentimes + (emp.situation === 'SO' && salReelCentimes === 0 ? 1 : 0);
    b02SumCheck += lineCheckNum;
    const lineCheck = padLeft(lineCheckNum, 9, '0');

    // B02 + Aff(7) + Per(6) + CNSS(9) + Nom(30) + Prenom(30) + Zeros(26) + Jours(2) + SalReel(13) + SalPlaf(9) + Sit(2) + Zeros(10) + Check(9) = 156 chars
    const b02Content = `B02${aff}${per}${cnssClean}${nom}${prenom}${'0'.repeat(26)}${jrs}${salReelEdi}${salPlafEdi}${situation}${'0'.repeat(10)}${lineCheck}`;
    lines.push(padLine(b02Content));
  }

  // 3. Enregistrement B03: Total B02
  const b03Count = padLeft(b02Count, 6, '0');
  const b03Zeros = '0'.repeat(47);
  const b03SumCNSS = padLeft(b02SumCNSS, 10, '0');
  const b03Jours = padLeft(b02TotalJours, 18, '0');
  const b03SalReel = padLeft(b02SumSalReelCentimes, 15, '0');
  const b03SalPlaf = padLeft(b02SumSalPlafCentimes, 13, '0');
  const b03Check = padLeft(b02SumCheck, 19, '0');

  const b03Content = `B03${aff}${per}${b03Count}${b03Zeros}${b03SumCNSS}${b03Jours}${b03SalReel}${b03SalPlaf}${b03Check}`;
  lines.push(padLine(b03Content));

  // --- B04 Lines (Entrants / Nouveaux salariés) ---
  let b04Count = 0;
  let b04TotalJours = 0;
  let b04SumSalReelCentimes = 0;
  let b04SumSalPlafCentimes = 0;
  let b04SumCNSS = 0;
  let b04SumCheck = 0;

  for (const emp of entrants) {
    if (!emp.cnss && !emp.nom) continue;
    b04Count++;
    const cnssClean = padLeft(emp.cnss.replace(/\D/g, ''), 9, '0');
    const cnssNum = parseInt(cnssClean, 10) || 0;
    b04SumCNSS += cnssNum;

    // Nom + Prenom on 60 characters padRight
    const nomPrenom = padRight(cleanText(`${emp.nom} ${emp.prenom}`.trim()), 60);
    const cin = padRight(cleanText(emp.cin), 8);
    const jrsNum = Math.min(26, Math.max(0, Number(emp.jours) || 0));
    const jrs = padLeft(jrsNum, 2, '0');
    b04TotalJours += jrsNum;

    const salReelNum = Number(emp.salaireReel) || 0;
    const salPlafNum = Math.min(salReelNum, CNSS_CEILING);

    const salReelCentimes = Math.round(salReelNum * 100);
    const salPlafCentimes = Math.round(salPlafNum * 100);
    b04SumSalReelCentimes += salReelCentimes;
    b04SumSalPlafCentimes += salPlafCentimes;

    const salReelEdi = padLeft(salReelCentimes, 13, '0');
    const salPlafEdi = padLeft(salPlafCentimes, 9, '0');

    // Control check line: CNSS + Jours + SalReel + SalPlaf
    const lineCheckNum = cnssNum + jrsNum + salReelCentimes + salPlafCentimes;
    b04SumCheck += lineCheckNum;
    const lineCheck = padLeft(lineCheckNum, 9, '0');

    // B04 + Aff(7) + Per(6) + CNSS(9) + NomPrenom(60) + CIN(8) + Jours(2) + SalReel(13) + SalPlaf(9) + Zeros(10) + Check(9) = 136 chars
    const b04Content = `B04${aff}${per}${cnssClean}${nomPrenom}${cin}${jrs}${salReelEdi}${salPlafEdi}${'0'.repeat(10)}${lineCheck}`;
    lines.push(padLine(b04Content));
  }

  // 4. Enregistrement B05: Total B04 (Entrants)
  const b05Count = padLeft(b04Count, 6, '0');
  const b05SumCNSS = padLeft(b04SumCNSS, 15, '0');
  const b05Jours = padLeft(b04TotalJours, 6, '0');
  const b05SalReel = padLeft(b04SumSalReelCentimes, 15, '0');
  const b05SalPlaf = padLeft(b04SumSalPlafCentimes, 13, '0');
  const b05Check = padLeft(b04SumCheck, 19, '0');

  const b05Content = `B05${aff}${per}${b05Count}${b05SumCNSS}${b05Jours}${b05SalReel}${b05SalPlaf}${b05Check}`;
  lines.push(padLine(b05Content));

  // 5. Enregistrement B06: Total Général (B03 + B05)
  const totalSalaries = b02Count + b04Count;
  const totalSumCNSS = b02SumCNSS + b04SumCNSS;
  const totalJours = b02TotalJours + b04TotalJours;
  const totalSalReelCentimes = b02SumSalReelCentimes + b04SumSalReelCentimes;
  const totalSalPlafCentimes = b02SumSalPlafCentimes + b04SumSalPlafCentimes;
  const totalSumCheck = b02SumCheck + b04SumCheck;

  const b06TotalSalaries = padLeft(totalSalaries, 6, '0');
  const b06TotalSumCNSS = padLeft(totalSumCNSS, 15, '0');
  const b06TotalJours = padLeft(totalJours, 6, '0');
  const b06TotalSalReel = padLeft(totalSalReelCentimes, 15, '0');
  const b06TotalSalPlaf = padLeft(totalSalPlafCentimes, 13, '0');
  const b06TotalCheck = padLeft(totalSumCheck, 19, '0');

  const b06Content = `B06${aff}${per}${b06TotalSalaries}${b06TotalSumCNSS}${b06TotalJours}${b06TotalSalReel}${b06TotalSalPlaf}${b06TotalCheck}`;
  lines.push(padLine(b06Content));

  return lines.join('\r\n') + '\r\n';
}

/**
 * Calculates Moroccan social security contributions (CNSS & AMO & Taxe Formation)
 */
export function calculateCotisations(salaireReelTotal: number, salairePlafonneTotal: number): CotisationSummary {
  const baseNonPlafonnee = Number(salaireReelTotal) || 0;
  const basePlafonnee = Number(salairePlafonneTotal) || 0;

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

/**
 * Computes live declaration statistics
 */
export function computeDeclarationSummary(employees: EmployeeRecord[]): DeclarationSummary {
  let totalJours = 0;
  let totalSalaireReel = 0;
  let totalSalairePlafonne = 0;
  let totalPreetablis = 0;
  let totalEntrants = 0;
  let salaireReelPreetablis = 0;
  let salaireReelEntrants = 0;
  let joursPreetablis = 0;
  let joursEntrants = 0;
  let errorCount = 0;

  for (const emp of employees) {
    if (!emp.cnss && !emp.nom) continue;

    const jrs = Number(emp.jours) || 0;
    totalJours += jrs;
    const reel = Number(emp.salaireReel) || 0;
    const plaf = Math.min(reel, CNSS_CEILING);
    totalSalaireReel += reel;
    totalSalairePlafonne += plaf;

    if (emp.isPreetabli) {
      totalPreetablis++;
      salaireReelPreetablis += reel;
      joursPreetablis += jrs;
    } else {
      totalEntrants++;
      salaireReelEntrants += reel;
      joursEntrants += jrs;
    }

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
    salaireReelPreetablis,
    salaireReelEntrants,
    joursPreetablis,
    joursEntrants,
    totalCotisations: cotisations,
    hasErrors: errorCount > 0,
    errorCount
  };
}

/**
 * Returns a realistic sample BDS / DS content with Préétablis and Entrants for demonstration.
 */
export function getSamplePreetabliContent(): string {
  return `B0065685022605014B0                                                                                                                                                                                                                                                 
B016568502202605GENERALE CONSTRUCTION DIVERS SARL                                               BUR N 2 EL CHORAFAA B HADIKA AIN SEBAA                                                                                  CASABLANCA                052026052720260610
B026568502202605112002383ACHOUIR                       BRAHIM                        00000000000000000000000000230000000426870000426870  0000000000112856146                                                                                                        
B026568502202605113738250RACHDI                        ABDELAZIZ                     00000000000000000000000000050000000091140000091140  0000000000113920535                                                                                                        
B026568502202605121234662HASNAOUI                      ABDELGHANI                    00000000000000000000000000250000000515550000515550  0000000000122265787                                                                                                        
B026568502202605122149282EL HAIMER                     RACHID                        00000000000000000000000000000000000000000000000000SO0000000000122149283                                                                                                        
B026568502202605123532952KEJJI                         MOHAMED                       00000000000000000000000000250000000613400000600000  0000000000124746377                                                                                                        
B026568502202605137399815KARROUMI                      AYOUB                         00000000000000000000000000260000000536140000536140  0000000000138472121                                                                                                        
B026568502202605144173208AZIZ                          AHMED                         00000000000000000000000000260000000444990000444990  0000000000145063214                                                                                                        
B026568502202605147337474BERGAYOU                      ABDELHADI                     00000000000000000000000000260000000725030000600000  0000000000148662530                                                                                                        
B026568502202605152493964BAKHOUYA                      MOULOUD                       00000000000000000000000000260000000550080000550080  0000000000153594150                                                                                                        
B026568502202605170968288EL KATTAB                     AZIZ                          00000000000000000000000000260000000645990000600000  0000000000172214304                                                                                                        
B026568502202605172941910EL MIMOUNI                    MOHAMED                       00000000000000000000000000000000000000000000000000SO0000000000172941911                                                                                                        
B026568502202605173630488NAJEH                         ZINE EL ABIDINE               00000000000000000000000000260000001039040000600000  0000000000175269554                                                                                                        
B026568502202605174211063AAOUAM                        SAMIR                         00000000000000000000000000260000000342300000342300  0000000000174895689                                                                                                        
B026568502202605176772352MIYAT                         BOUAZZA                       00000000000000000000000000210000000276470000276470  0000000000177325313                                                                                                        
B026568502202605185726184KARROUMI                      MOHAMED                       00000000000000000000000000000000000000000000000000SO0000000000185726185                                                                                                        
B026568502202605186009201BARGHAIOU                     JAOUAD                        00000000000000000000000000210000000382800000382800  0000000000186774822                                                                                                        
B026568502202605188252897KASSOURI                      KHALID                        00000000000000000000000000260000000500000000500000  0000000000189252923                                                                                                        
B026568502202605189973005MANSOURI                      YASSINE                       00000000000000000000000000000000000000000000000000SO0000000000189973006                                                                                                        
B026568502202605191076672AMARIK                        YASSINE                       00000000000000000000000000260000000343130000343130  0000000000191762958                                                                                                        
B026568502202605191390238AMAL                          BOUCHAIB                      00000000000000000000000000050000000091140000091140  0000000000191572523                                                                                                        
B026568502202605193140804AKAMRI                        YOUSSEF                       00000000000000000000000000260000000371650000371650  0000000000193884130                                                                                                        
B026568502202605198948379ERRAHMOUNI                    BOUAZZA                       00000000000000000000000000250000000409020000409020  0000000000199766444                                                                                                        
B026568502202605910418133ELYOUSFI                      MOHAMMED                      00000000000000000000000000000000000000000000000000SO0000000000910418134                                                                                                        
B026568502202605930785639TAABICH                       SOUFIANE                      00000000000000000000000000150000000197480000197480  0000000000931180614                                                                                                        
B026568502202605984212628AYACHI                        AHMED                         00000000000000000000000000260000000500000000500000  0000000000985212654                                                                                                        
B026568502202605988459321LEGHNIMI                      BELAID                        00000000000000000000000000230000000302800000302800  0000000000989064944                                                                                                        
B026568502202605993905010EL KHARROUBI                  MOHAMMED                      00000000000000000000000000260000000342380000342380  0000000000994589796                                                                                                        
B026568502202605994380904NOUHI                         ILYAS                         00000000000000000000000000260000000342300000342300  0000000000995065530                                                                                                        
B03656850220260500002800000000000000000000000000000000000000000000000936926510600000000000000052600000000998970000000093662400000000009388621577                                                                                                                    
B046568502202605189563590BENALI BRAHIM                                               BH71210 2600000011444100006000000000000000191308026                                                                                                                            
B046568502202605187272078BENALI SOUFIANE                                             BJ3490042600000005059000005059000000000000188283904                                                                                                                            
B046568502202605133025808SAMARI SAMIRA                                               AB1836132600000018373400006000000000000000135463174                                                                                                                            
B046568502202605123456789MANSOURI YASSINE                                            V349438 0700000000921600000921600000000000123641116                                                                                                                            
B046568502202605910111213KARROUMI MOHAMED                                            V297365 0900000001485100001485100000000000910408242                                                                                                                            
B046568502202605131415161EL MIMOUNI MOHAMED                                          V351312 0600000000791300000791300000000000131573427                                                                                                                            
B046568502202605171819201EL MAATI MAHDAOUI                                           QA2034311600000002106500002106500000000000172240517                                                                                                                            
B046568502202605980651307MEJRES HOUSSAM                                              QA1668581800000002369800002369800000000000981125285                                                                                                                            
B05656850220260500000800000282731514700013400000000425508000000024733300000000002834043691                                                                                                                                                                          
B06656850220260500003600001219658025300066000000001424478000000118395700000000012222665268`;
}

export interface AutoClassificationResult {
  employees: EmployeeRecord[];
  preetablisCount: number;
  entrantsCount: number;
  addedFromBdsCount: number;
}

/**
 * Automatically classifies employees as Préétablis (B02) or Entrants (B04)
 * by comparing against the official BDS pre-established baseline.
 * Also ensures that pre-established employees missing from the payroll are preserved (with 0 days/salary).
 */
export function autoClassifyEmployees(
  currentEmployees: EmployeeRecord[],
  bdsBaseline: EmployeeRecord[],
  includeMissingBds: boolean = true
): AutoClassificationResult {
  const bdsMap = new Map<string, EmployeeRecord>();
  bdsBaseline.forEach(b => {
    const clean = (b.cnss || '').replace(/\D/g, '');
    if (clean) bdsMap.set(clean, b);
  });

  const processedCnss = new Set<string>();
  let preetablisCount = 0;
  let entrantsCount = 0;

  const resultList: EmployeeRecord[] = currentEmployees.map(emp => {
    const cleanCnss = (emp.cnss || '').replace(/\D/g, '');
    const isPresentInBds = cleanCnss ? bdsMap.has(cleanCnss) : false;

    if (cleanCnss) {
      processedCnss.add(cleanCnss);
    }

    // If present in BDS -> B02 (Préétabli)
    // If not present in BDS -> B04 (Entrant)
    const isPreetabli = bdsMap.size > 0 ? isPresentInBds : emp.isPreetabli;

    if (isPreetabli) {
      preetablisCount++;
    } else {
      entrantsCount++;
    }

    // If in BDS and current record has missing name/cin, enrich from BDS baseline
    let nom = emp.nom;
    let prenom = emp.prenom;
    let cin = emp.cin;
    if (isPresentInBds) {
      const bdsRecord = bdsMap.get(cleanCnss)!;
      if (!nom && bdsRecord.nom) nom = bdsRecord.nom;
      if (!prenom && bdsRecord.prenom) prenom = bdsRecord.prenom;
      if (!cin && bdsRecord.cin) cin = bdsRecord.cin;
    }

    return {
      ...emp,
      nom,
      prenom,
      cin,
      isPreetabli,
      isValidCNSS: isValidCNSS(cleanCnss)
    };
  });

  // If there are employees present in BDS baseline that were NOT in the current payroll,
  // automatically include them as 'SO' (Sortant / Sans Objet) with 0 days and 0 salary
  let addedFromBdsCount = 0;
  if (includeMissingBds && bdsMap.size > 0) {
    bdsBaseline.forEach(bdsEmp => {
      const clean = (bdsEmp.cnss || '').replace(/\D/g, '');
      if (clean && !processedCnss.has(clean)) {
        resultList.push({
          ...bdsEmp,
          id: `bds_missing_${Date.now()}_${clean}`,
          jours: 0,
          salaireReel: 0,
          salairePlafonne: 0,
          situation: 'SO',
          isPreetabli: true,
          isValidCNSS: isValidCNSS(clean)
        });
        processedCnss.add(clean);
        preetablisCount++;
        addedFromBdsCount++;
      }
    });
  }

  return {
    employees: resultList,
    preetablisCount,
    entrantsCount,
    addedFromBdsCount
  };
}

