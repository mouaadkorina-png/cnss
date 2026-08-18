export type SituationCode = '' | 'SO' | 'DE' | 'IT' | 'IL' | 'AT' | 'CS' | 'MS' | 'MP';

export interface PreetabliHeader {
  structureRef: string;     // A00 ref (14 digits)
  affiliation: string;      // A01 affiliation (7 digits)
  periode: string;          // A01 periode AAAAMM (6 digits)
  raisonSociale: string;    // A01 raison sociale (40 chars)
  activite: string;         // A01 activite (40 chars)
  adresse: string;          // A01 adresse (120 chars)
  ville: string;            // A01 ville (20 chars)
  codePostal: string;       // A01 code postal (6 chars)
  codeAgence: string;       // A01 code agence (2 chars)
  dateEmission: string;     // A01 date emission AAAAMMJJ (8 chars)
  dateExigibilite: string;  // A01 date exigibilite AAAAMMJJ (8 chars)
}

export interface EmployeeRecord {
  id: string;
  cnss: string;             // 9 digits
  nom: string;
  prenom: string;
  cin: string;
  jours: number;            // 0 - 26
  salaireReel: number;      // Actual gross salary
  salairePlafonne: number;  // Capped at 6000 DH
  situation: SituationCode;
  isPreetabli: boolean;     // true for B02 (pre-established), false for B04 (new entrant)
  enfants?: number;
  afAPayer?: number;
  afADeduire?: number;
  afNetAPayer?: number;
  afAReverser?: number;
  isValidCNSS?: boolean;
}

export type ActiveTab = 'principale' | 'complementaire' | 'simulateur' | 'validateur' | 'guide' | 'produits' | 'contact';

export interface DeclarationSummary {
  totalSalaries: number;
  totalJours: number;
  totalSalaireReel: number;
  totalSalairePlafonne: number;
  totalPreetablis: number;
  totalEntrants: number;
  totalCotisations: CotisationSummary;
  hasErrors: boolean;
  errorCount: number;
}

export interface CotisationSummary {
  basePlafonnee: number;
  baseNonPlafonnee: number;
  prestationsFamiliales: number;   // 6.40%
  prestationsSocialesPatr: number; // 8.98% plafonné
  prestationsSocialesSal: number;  // 4.48% plafonné
  amoPatr: number;                 // 4.11%
  amoSal: number;                  // 2.26%
  participationAmo: number;        // 1.85%
  tfp: number;                     // 1.60% (Taxe Formation Pro)
  totalPatronal: number;
  totalSalarial: number;
  totalGlobal: number;
}
