import React, { useState } from 'react';
import { EmployeeRecord, PreetabliHeader } from '../types';
import { generateDSFile, computeDeclarationSummary } from '../utils/cnssUtils';
import confetti from 'canvas-confetti';
import { 
  Download, 
  FileCode, 
  Copy, 
  Check, 
  Eye, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle, 
  ChevronRight,
  Layers,
  FileCheck,
  Building,
  Users
} from 'lucide-react';

interface Props {
  header: PreetabliHeader;
  employees: EmployeeRecord[];
  declarationType?: 'principale' | 'complementaire';
  sequenceNum?: number;
  onGoToGuide?: () => void;
}

export const GenerateDSSection: React.FC<Props> = ({
  header,
  employees,
  declarationType = 'principale' as 'principale' | 'complementaire',
  sequenceNum = 1,
  onGoToGuide
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [validationModal, setValidationModal] = useState<{
    open: boolean;
    type: 'noHeader' | 'noEmployees' | 'invalidCNSS';
    invalidRows?: number[];
  }>({ open: false, type: 'noHeader' });

  const summary = computeDeclarationSummary(employees);
  const decType: 'principale' | 'complementaire' = declarationType;

  const handleGenerateClick = () => {
    // 1. Check if header / company is configured
    if (!header.affiliation || !header.periode) {
      setValidationModal({ open: true, type: 'noHeader' });
      return;
    }

    // 2. Check if at least 1 employee exists
    const validEmployees = employees.filter(e => e.cnss || e.nom);
    if (validEmployees.length === 0) {
      setValidationModal({ open: true, type: 'noEmployees' });
      return;
    }

    // 3. Check for invalid CNSS
    if (summary.hasErrors) {
      const invalidIndices: number[] = [];
      employees.forEach((emp, idx) => {
        if (emp.cnss && !emp.isValidCNSS) {
          invalidIndices.push(idx + 1);
        }
      });
      setValidationModal({ open: true, type: 'invalidCNSS', invalidRows: invalidIndices });
      return;
    }

    // Open file preview modal and download
    triggerDownload();
  };

  const generatedFileContent = generateDSFile(header, employees, decType, sequenceNum);

  const getFileName = () => {
    const aff = header.affiliation || 'AFF';
    const per = header.periode || 'PERIODE';
    if (decType === 'complementaire') {
      return `DSC_${aff}_${per}_SEQ${sequenceNum}.txt`;
    }
    return `DS_${aff}_${per}.txt`;
  };

  const triggerDownload = () => {
    const content = generateDSFile(header, employees, decType, sequenceNum);
    const fileName = getFileName();

    const blob = new Blob([content], { type: 'text/plain;charset=windows-1252' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    setShowPreviewModal(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedFileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div id="step-generate-section" className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
      {/* Step Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            3
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Génération du fichier {declarationType === 'complementaire' ? 'DSC (Complémentaire)' : 'DS (Déclaration des Salaires)'}
            </h2>
            <p className="text-xs text-slate-500">
              Téléchargez le fichier formaté conforme DAMANCOM EDI (260 caractères par ligne) prêt pour la télédéclaration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-preview-file"
            type="button"
            onClick={() => setShowPreviewModal(true)}
            disabled={employees.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors disabled:opacity-40"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>Aperçu du Fichier EDI</span>
          </button>

          <button
            id="dwn"
            type="button"
            onClick={handleGenerateClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            <span>
              Générez le fichier {declarationType === 'complementaire' ? 'DSC' : 'DS'}
            </span>
          </button>
        </div>
      </div>

      {/* Breakdown Cards by Segment (B02 vs B04 vs B06) */}
      <div className="p-6 bg-white border-b border-slate-200">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Répartition et Qualification des Segments EDI dans le Fichier TXT :</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Preétablis B02 + B03 */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Salariés Préétablis
              </span>
              <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Lignes B02 & Total B03
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Nombre de salariés :</span>
                <strong className="font-mono text-blue-900">{summary.totalPreetablis}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total jours déclarés :</span>
                <strong className="font-mono">{summary.joursPreetablis} j</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-blue-200/60 font-semibold">
                <span className="text-slate-600">Masse Salariale B02 :</span>
                <span className="font-mono text-blue-900">{summary.salaireReelPreetablis.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</span>
              </div>
            </div>
          </div>

          {/* Card 2: Nouveaux Entrants B04 + B05 */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Nouveaux Salariés (Entrants)
              </span>
              <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Lignes B04 & Total B05
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Nombre de salariés :</span>
                <strong className="font-mono text-emerald-900">{summary.totalEntrants}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total jours déclarés :</span>
                <strong className="font-mono">{summary.joursEntrants} j</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-emerald-200/60 font-semibold">
                <span className="text-slate-600">Masse Salariale B04 :</span>
                <span className="font-mono text-emerald-900">{summary.salaireReelEntrants.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</span>
              </div>
            </div>
          </div>

          {/* Card 3: Grand Total B06 */}
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <FileCheck className="w-4 h-4 text-slate-700" />
                Total Général Déclaration
              </span>
              <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                Ligne Finale B06
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Total salariés :</span>
                <strong className="font-mono text-slate-900">{summary.totalSalaries}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total jours déclarés :</span>
                <strong className="font-mono">{summary.totalJours} j</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-300 font-bold">
                <span className="text-slate-700">Masse Salariale Globale :</span>
                <span className="font-mono text-emerald-700">{summary.totalSalaireReel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Modals */}
      {validationModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            {validationModal.type === 'noHeader' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-slate-800">Manque de Fichier Préétabli</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Veuillez charger le fichier préétabli DAMANCOM (BDS) à l'étape 1 ou saisir le numéro d'affiliation et la période déclarée.
                  </p>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setValidationModal({ open: false, type: 'noHeader' })}
                    className="w-full bg-emerald-600 text-white font-semibold text-xs py-2.5 rounded-lg hover:bg-emerald-700"
                  >
                    Compris
                  </button>
                </div>
              </div>
            )}

            {validationModal.type === 'noEmployees' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-slate-800">Salariés à Déclarer</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Veuillez saisir les données des salariés ou bien les coller depuis un fichier Excel à l'étape 2.
                  </p>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setValidationModal({ open: false, type: 'noEmployees' })}
                    className="w-full bg-emerald-600 text-white font-semibold text-xs py-2.5 rounded-lg hover:bg-emerald-700"
                  >
                    D'accord
                  </button>
                </div>
              </div>
            )}

            {validationModal.type === 'invalidCNSS' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-slate-800">Données Incorrectes (N° CNSS)</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Certains numéros d'immatriculation CNSS ne respectent pas la clé de contrôle officielle.
                  </p>
                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-mono text-left max-h-24 overflow-y-auto">
                    Lignes concernées : {validationModal.invalidRows?.join(', ') || 'Plusieurs lignes'}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setValidationModal({ open: false, type: 'invalidCNSS' })}
                    className="flex-1 bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 rounded-lg hover:bg-slate-200"
                  >
                    Corriger les lignes
                  </button>
                  <button
                    onClick={() => {
                      setValidationModal({ open: false, type: 'invalidCNSS' });
                      triggerDownload();
                    }}
                    className="flex-1 bg-emerald-600 text-white font-semibold text-xs py-2.5 rounded-lg hover:bg-emerald-700"
                  >
                    Générer quand même
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Preview & Download Success Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-scale-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Fichier EDI {declarationType === 'complementaire' ? 'DSC' : 'DS'} Généré
                  </h3>
                  <p className="text-xs font-mono text-emerald-700">{getFileName()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié !' : 'Copier le texte'}</span>
                </button>

                <button
                  type="button"
                  onClick={triggerDownload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Structure Highlights */}
            <div className="py-2.5 px-3 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold text-slate-800">Segments EDI CNSS :</span>
              <span className="text-blue-700 font-mono">B00: Entête</span>
              <span className="text-indigo-700 font-mono">B01: Affilié</span>
              <span className="text-emerald-700 font-mono">B02: Salariés préétablis ({summary.totalPreetablis})</span>
              <span className="text-teal-700 font-mono">B03: Totaux B02</span>
              {summary.totalEntrants > 0 && (
                <>
                  <span className="text-purple-700 font-mono">B04: Entrants ({summary.totalEntrants})</span>
                  <span className="text-fuchsia-700 font-mono">B05: Totaux B04</span>
                </>
              )}
              <span className="text-amber-800 font-mono">B06: Total Général ({summary.totalSalaries})</span>
            </div>

            {/* Code / Text Preview */}
            <div className="flex-1 overflow-auto my-4 p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl max-h-[360px] leading-relaxed whitespace-pre select-all">
              {generatedFileContent}
            </div>

            {/* Next Steps on Damancom */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Connectez-vous sur <strong>DAMANCOM</strong> &gt; Menu <strong>Télé-déclaration</strong> &gt; Mode <strong>Échange de fichiers (EDI)</strong> pour téléverser ce fichier.
                </span>
              </div>

              {onGoToGuide && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    onGoToGuide();
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
                >
                  <span>Voir le guide de télédéclaration</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
