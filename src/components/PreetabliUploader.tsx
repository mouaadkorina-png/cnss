import React, { useRef, useState } from 'react';
import { PreetabliHeader } from '../types';
import { parsePreetabliFile, getSamplePreetabliContent } from '../utils/cnssUtils';
import { Upload, FileText, Sparkles, Building2, Calendar, MapPin, CheckCircle2, AlertCircle, Edit3, Save } from 'lucide-react';

interface Props {
  header: PreetabliHeader;
  setHeader: (header: PreetabliHeader) => void;
  onEmployeesLoaded: (employees: any[], bdsBaseline?: any[]) => void;
  employeeCount: number;
  bdsBaselineCount?: number;
}

export const PreetabliUploader: React.FC<Props> = ({
  header,
  setHeader,
  onEmployeesLoaded,
  employeeCount,
  bdsBaselineCount = 0
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<PreetabliHeader>(header);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const { header: parsedHeader, employees: parsedEmployees, errors } = parsePreetabliFile(content);
        if (errors.length > 0) {
          setError(errors.join(' '));
        } else {
          setHeader(parsedHeader);
          setEditForm(parsedHeader);
          if (parsedEmployees.length > 0) {
            onEmployeesLoaded(parsedEmployees, parsedEmployees);
          }
        }
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    const sampleContent = getSamplePreetabliContent();
    const { header: parsedHeader, employees: parsedEmployees } = parsePreetabliFile(sampleContent);
    setHeader(parsedHeader);
    setEditForm(parsedHeader);
    // Baseline contains the 28 preetablis (B02)
    const bdsBaseline = parsedEmployees.filter(e => e.isPreetabli);
    onEmployeesLoaded(parsedEmployees, bdsBaseline);
    setFileName('EXEMPLE_PREETABLI_BDS_CNSS.txt');
    setError(null);
  };

  const handleSaveManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setHeader(editForm);
    setIsEditing(false);
  };

  const isConfigured = Boolean(header.affiliation && header.periode);

  return (
    <div id="step-preetabli-section" className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      {/* Step Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Importez le fichier préétabli DAMANCOM (BDS)
            </h2>
            <p className="text-xs text-slate-500">
              Téléchargez le fichier préétabli depuis votre espace DAMANCOM ou remplissez les coordonnées de votre entreprise
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-load-sample"
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Charger un exemple (Démo)</span>
          </button>

          <button
            id="btn-edit-header"
            type="button"
            onClick={() => {
              setEditForm(header);
              setIsEditing(!isEditing);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Fermer la saisie' : 'Saisie manuelle'}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload Zone */}
          <div className="lg:col-span-5 space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isConfigured
                  ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.bds,.dat"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">
                {fileName ? fileName : 'Cliquez pour choisir le fichier préétabli'}
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Formats acceptés : .txt, .bds (Fichier officiel DAMANCOM)
              </p>
              <span className="inline-block px-3 py-1 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 shadow-2xs">
                Parcourir les fichiers...
              </span>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Erreur de lecture : </span>
                  {error}
                </div>
              </div>
            )}

            {isConfigured && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Fichier préétabli chargé : <strong>{employeeCount} salarié(s)</strong>
                  </span>
                </div>
                <span className="font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px]">
                  {header.periode ? `${header.periode.slice(4, 6)}/${header.periode.slice(0, 4)}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Company Info Display or Edit Form */}
          <div className="lg:col-span-7">
            {isEditing ? (
              <form onSubmit={handleSaveManualEdit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Modifier les Coordonnées Affilié
                  </h3>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-emerald-700"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Raison Sociale</label>
                    <input
                      type="text"
                      value={editForm.raisonSociale}
                      onChange={e => setEditForm({ ...editForm, raisonSociale: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                      placeholder="Ex: SOCIETE EXEMPLE SARL"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">N° Affiliation CNSS (7 chiffres)</label>
                    <input
                      type="text"
                      maxLength={7}
                      value={editForm.affiliation}
                      onChange={e => setEditForm({ ...editForm, affiliation: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="Ex: 1234567"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Période Déclarée (AAAAMM)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editForm.periode}
                      onChange={e => setEditForm({ ...editForm, periode: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="Ex: 202608"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Activité</label>
                    <input
                      type="text"
                      value={editForm.activite}
                      onChange={e => setEditForm({ ...editForm, activite: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                      placeholder="Ex: CONSEIL & SERVICES"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Ville</label>
                    <input
                      type="text"
                      value={editForm.ville}
                      onChange={e => setEditForm({ ...editForm, ville: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                      placeholder="Ex: CASABLANCA"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Code Agence CNSS</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={editForm.codeAgence}
                      onChange={e => setEditForm({ ...editForm, codeAgence: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="Ex: 01"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Réf. Structure / N° Bordereau (B00)</label>
                    <input
                      type="text"
                      value={editForm.structureRef || ''}
                      onChange={e => setEditForm({ ...editForm, structureRef: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="Ex: 2605014B0 (Format standard YYMM014B0)"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">Adresse</label>
                    <input
                      type="text"
                      value={editForm.adresse}
                      onChange={e => setEditForm({ ...editForm, adresse: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                      placeholder="Ex: BD MOHAMMED V N 45"
                    />
                  </div>
                </div>
              </form>
            ) : isConfigured ? (
              <div className="bg-slate-50/80 rounded-xl border border-slate-200/90 p-4">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 text-sm">{header.raisonSociale || 'Entreprise Affiliée'}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    N° Affiliation : {header.affiliation || 'Non renseigné'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Période de paie :</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {header.periode ? `${header.periode.slice(4, 6)} / ${header.periode.slice(0, 4)}` : '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Activité :</span>
                    <span className="font-medium text-slate-800 truncate block">{header.activite || '-'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Ville :</span>
                    <span className="font-medium text-slate-800">{header.ville || '-'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Code Agence :</span>
                    <span className="font-mono text-slate-800">{header.codeAgence || '-'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Date exigibilité :</span>
                    <span className="font-mono text-slate-800">
                      {header.dateExigibilite && header.dateExigibilite.length === 8
                        ? `${header.dateExigibilite.slice(6, 8)}/${header.dateExigibilite.slice(4, 6)}/${header.dateExigibilite.slice(0, 4)}`
                        : '10 du mois suivant'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Réf. Structure (B00) :</span>
                    <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-emerald-200 inline-block">
                      {header.structureRef || '00000000000000'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Date émission :</span>
                    <span className="font-mono text-slate-800">
                      {header.dateEmission && header.dateEmission.length === 8
                        ? `${header.dateEmission.slice(6, 8)}/${header.dateEmission.slice(4, 6)}/${header.dateEmission.slice(0, 4)}`
                        : '01 du mois'}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-3 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 block text-[11px]">Adresse complète :</span>
                    <span className="text-slate-700 text-[11px] truncate block">{header.adresse || '-'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <FileText className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  Aucun fichier préétabli chargé
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Importez le fichier préétabli officiel (.txt/.bds) de DAMANCOM ou cliquez sur <strong>"Charger un exemple"</strong> ci-dessus pour tester immédiatement.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
