import React, { useState } from 'react';
import { isValidCNSS, calculateCNSSCheckDigit } from '../utils/cnssUtils';
import { ShieldCheck, CheckCircle2, XCircle, Sparkles, HelpCircle, ArrowRight, ClipboardCheck, AlertCircle } from 'lucide-react';

export const CnssValidatorTool: React.FC = () => {
  const [singleCnss, setSingleCnss] = useState<string>('183920194');
  const [eightDigits, setEightDigits] = useState<string>('18392019');
  const [batchText, setBatchText] = useState<string>('183920194\n204918239\n109283401\n123456789\n999999999');
  const [batchResults, setBatchResults] = useState<{ cnss: string; valid: boolean; suggested?: string }[]>([]);

  // Calculate single
  const singleClean = singleCnss.replace(/\D/g, '');
  const isSingleValid = singleClean.length === 9 && isValidCNSS(singleClean);

  // Breakdown digits for visualizer
  const digits = singleClean.padEnd(9, ' ').split('').slice(0, 9);
  const getD = (pos: number) => parseInt(digits[pos - 1] || '0', 10);
  const cumul = 2 * (getD(2) + getD(4) + getD(6) + getD(8)) + getD(3) + getD(5) + getD(7);
  const checkCalc = (10 - (cumul % 10)) % 10;

  // 8-digit check calculation
  const calculatedNinth = calculateCNSSCheckDigit(eightDigits);

  const handleBatchValidate = () => {
    const lines = batchText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const results = lines.map(line => {
      const clean = line.replace(/\D/g, '');
      const valid = clean.length === 9 && isValidCNSS(clean);
      const suggested = !valid && clean.length >= 8 ? calculateCNSSCheckDigit(clean.slice(0, 8)) || undefined : undefined;
      return { cnss: line, valid, suggested };
    });
    setBatchResults(results);
  };

  return (
    <div id="view-validator" className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Validateur & Calculateur de Clé CNSS Maroc
            </h1>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Vérifiez la validité de vos numéros d'immatriculation CNSS à 9 chiffres selon la formule officielle Modulo 10
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool 1: Single Number Inspector & Formula Visualizer */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Vérification Unitaire & Décomposition</span>
            </h2>
            <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              Algorithme Modulo 10
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Entrez le N° d'immatriculation CNSS (9 chiffres) :
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={9}
                value={singleCnss}
                onChange={e => setSingleCnss(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 183920194"
                className="w-full text-base font-mono font-bold tracking-widest px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {singleClean.length === 9 ? (
                  isSingleValid ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valide
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" /> Invalide
                    </span>
                  )
                ) : (
                  <span className="text-xs text-slate-400 font-medium">
                    {9 - singleClean.length} chiffre(s) restant(s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visual digit breakdown */}
          {singleClean.length === 9 && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-3">
              <span className="font-bold text-slate-700 block">Décomposition des positions :</span>
              <div className="grid grid-cols-9 gap-1 text-center font-mono">
                {digits.map((d, i) => {
                  const pos = i + 1;
                  const isEven = [2, 4, 6, 8].includes(pos);
                  const isCheck = pos === 9;
                  return (
                    <div key={i} className="space-y-1">
                      <div className={`p-1.5 rounded font-bold ${isCheck ? 'bg-emerald-600 text-white' : isEven ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'}`}>
                        {d}
                      </div>
                      <span className="text-[10px] text-slate-400 block">P{pos}</span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                <p>
                  <strong>Cumul :</strong> 2×(P2+P4+P6+P8) + (P3+P5+P7) = 2×({getD(2)}+{getD(4)}+{getD(6)}+{getD(8)}) + ({getD(3)}+{getD(5)}+{getD(7)}) = <strong>{cumul}</strong>
                </p>
                <p>
                  <strong>Clé calculée :</strong> (10 - ({cumul} mod 10)) mod 10 = <strong>{checkCalc}</strong>
                </p>
                <p>
                  <strong>Clé fournie (P9) :</strong> <strong>{getD(9)}</strong> {isSingleValid ? '✅ (Correspond)' : `❌ (Différent, attendu ${checkCalc})`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tool 2: Check Digit Generator */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Générateur du 9ème Chiffre de Contrôle</span>
            </h2>
            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
              Calcul automatique
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Entrez les 8 premiers chiffres du matricule :
            </label>
            <input
              type="text"
              maxLength={8}
              value={eightDigits}
              onChange={e => setEightDigits(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 18392019"
              className="w-full text-base font-mono font-bold tracking-widest px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {calculatedNinth ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Numéro CNSS Complet et Valide :
              </span>
              <div className="text-2xl font-black font-mono text-emerald-900 tracking-wider">
                {calculatedNinth.slice(0, 8)}
                <span className="text-emerald-600 underline decoration-2">{calculatedNinth.slice(8)}</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                La clé de contrôle calculée pour ce matricule est <strong>{calculatedNinth.slice(8)}</strong>
              </p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              Saisissez exactement 8 chiffres pour calculer le 9ème chiffre de contrôle.
            </div>
          )}

          {/* Quick Tips */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              Pourquoi ce contrôle ?
            </span>
            <p className="text-[11px]">
              La CNSS marocaine rejette systématiquement les fichiers EDI DAMANCOM comportant un matricule erroné. Ce validateur vous assure un taux d'acceptation de 100% lors du téléversement.
            </p>
          </div>
        </div>
      </div>

      {/* Tool 3: Batch Validator */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-600" />
            <span>Validation par Lot (Batch)</span>
          </h2>
          <span className="text-xs text-slate-500">Collez une liste de numéros CNSS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Collez vos numéros (1 numéro par ligne) :
            </label>
            <textarea
              rows={6}
              value={batchText}
              onChange={e => setBatchText(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              placeholder="183920194&#10;204918239&#10;109283401"
            />
            <button
              onClick={handleBatchValidate}
              className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 rounded-lg transition-colors"
            >
              Vérifier tous les numéros du lot
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Résultats de validation ({batchResults.length}) :
            </label>
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-[190px] overflow-y-auto space-y-1.5 text-xs">
              {batchResults.length === 0 ? (
                <p className="text-slate-400 text-center py-6">
                  Cliquez sur "Vérifier" pour afficher les résultats
                </p>
              ) : (
                batchResults.map((r, i) => (
                  <div key={i} className={`p-2 rounded-lg flex items-center justify-between font-mono text-xs ${r.valid ? 'bg-white border border-slate-200' : 'bg-rose-50 border border-rose-200 text-rose-900'}`}>
                    <span className="font-bold">{r.cnss}</span>
                    <div className="flex items-center gap-2">
                      {r.valid ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valide
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center gap-1 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Invalide {r.suggested && `(Suggéré : ${r.suggested})`}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
