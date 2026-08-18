import React, { useState } from 'react';
import { EmployeeRecord, PreetabliHeader } from '../types';
import { calculateCotisations, computeDeclarationSummary, CNSS_CEILING } from '../utils/cnssUtils';
import { Calculator, DollarSign, Building, Users, Printer, Download, CheckCircle, Percent } from 'lucide-react';

interface Props {
  employees: EmployeeRecord[];
  header: PreetabliHeader;
}

export const CotisationsSimulator: React.FC<Props> = ({ employees, header }) => {
  const summary = computeDeclarationSummary(employees);

  // Manual simulation states
  const [manualMasseBrute, setManualMasseBrute] = useState<number>(summary.totalSalaireReel || 50000);
  const [manualMassePlafonnee, setManualMassePlafonnee] = useState<number>(summary.totalSalairePlafonne || 36000);
  const [useDeclaredData, setUseDeclaredData] = useState<boolean>(employees.length > 0);

  const activeBrute = useDeclaredData ? summary.totalSalaireReel : manualMasseBrute;
  const activePlafonnee = useDeclaredData ? summary.totalSalairePlafonne : manualMassePlafonnee;

  const cot = calculateCotisations(activeBrute, activePlafonnee);

  const formatDH = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DH';

  return (
    <div id="view-simulateur-cotisations" className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                Simulateur des Cotisations CNSS & AMO Maroc
              </h1>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Calcul précis des parts patronales et salariales selon la législation et les taux officiels en vigueur
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer le bordereau</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Source des données :</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseDeclaredData(true)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                useDeclaredData
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Données de la déclaration active ({employees.length} salariés)
            </button>
            <button
              onClick={() => setUseDeclaredData(false)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                !useDeclaredData
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Simulation personnalisée
            </button>
          </div>
        </div>

        {!useDeclaredData && (
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-medium block">Masse Salariale Brute (DH) :</label>
              <input
                type="number"
                value={manualMasseBrute}
                onChange={e => setManualMasseBrute(parseFloat(e.target.value) || 0)}
                className="w-32 px-2 py-1 border border-slate-300 rounded text-xs font-mono font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium block">Base Plafonnée (DH) :</label>
              <input
                type="number"
                value={manualMassePlafonnee}
                onChange={e => setManualMassePlafonnee(parseFloat(e.target.value) || 0)}
                className="w-32 px-2 py-1 border border-slate-300 rounded text-xs font-mono font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>TOTAL COTISATIONS CNSS</span>
            <span className="p-1 rounded bg-slate-100 text-slate-700">Patronale + Salariale</span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {formatDH(cot.totalGlobal)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Montant global net à régler à la CNSS via télépaiement DAMANCOM
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>PART PATRONALE (CHARGE ENTREPRISE)</span>
            <span className="p-1 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">Total Employeur</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
            {formatDH(cot.totalPatronal)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Prestations familiales, court/long terme, AMO, Participation AMO & TFP
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>PART SALARIALE (PRÉCOMPTE)</span>
            <span className="p-1 rounded bg-blue-50 text-blue-800 font-bold text-[10px]">Retenue Paie</span>
          </div>
          <div className="text-2xl font-black font-mono text-blue-700 mt-1">
            {formatDH(cot.totalSalarial)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Prestations sociales (4.48%) + AMO (2.26%) précomptées sur les bulletins
          </p>
        </div>
      </div>

      {/* Detailed Contribution Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-600" />
            <span>Tableau Détaillé des Taux et Cotisations CNSS & AMO</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Plafond CNSS : 6 000,00 DH / salarié</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Rubrique de Cotisation</th>
                <th className="py-3 px-4">Assiette de Calcul</th>
                <th className="py-3 px-4 text-center">Taux Patronal</th>
                <th className="py-3 px-4 text-right">Montant Patronal</th>
                <th className="py-3 px-4 text-center">Taux Salarial</th>
                <th className="py-3 px-4 text-right">Montant Salarial</th>
                <th className="py-3 px-4 text-right font-bold">Total Rubrique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {/* Prestations familiales */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-800">
                  Allocations Familiales
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">
                  Total Brut : {formatDH(activeBrute)}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">6,40 %</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">{formatDH(cot.prestationsFamiliales)}</td>
                <td className="py-3 px-4 text-center font-mono text-slate-400">-</td>
                <td className="py-3 px-4 text-right font-mono text-slate-400">0,00 DH</td>
                <td className="py-3 px-4 text-right font-mono font-bold">{formatDH(cot.prestationsFamiliales)}</td>
              </tr>

              {/* Prestations sociales court/long terme */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-800">
                  Prestations Sociales (Court & Long terme)
                  <span className="block text-[10px] font-normal text-slate-500">IJM, IJMD, Pensions, Capital Décès</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">
                  Plafonné : {formatDH(activePlafonnee)}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">8,98 %</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">{formatDH(cot.prestationsSocialesPatr)}</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-blue-800">4,48 %</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-blue-800">{formatDH(cot.prestationsSocialesSal)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold">{formatDH(cot.prestationsSocialesPatr + cot.prestationsSocialesSal)}</td>
              </tr>

              {/* AMO */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-800">
                  Assurance Maladie Obligatoire (AMO)
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">
                  Total Brut : {formatDH(activeBrute)}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">4,11 %</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">{formatDH(cot.amoPatr)}</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-blue-800">2,26 %</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-blue-800">{formatDH(cot.amoSal)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold">{formatDH(cot.amoPatr + cot.amoSal)}</td>
              </tr>

              {/* Participation AMO */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-800">
                  Participation AMO
                  <span className="block text-[10px] font-normal text-slate-500">Solidarité nationale</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">
                  Total Brut : {formatDH(activeBrute)}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">1,85 %</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">{formatDH(cot.participationAmo)}</td>
                <td className="py-3 px-4 text-center font-mono text-slate-400">-</td>
                <td className="py-3 px-4 text-right font-mono text-slate-400">0,00 DH</td>
                <td className="py-3 px-4 text-right font-mono font-bold">{formatDH(cot.participationAmo)}</td>
              </tr>

              {/* Taxe de Formation Professionnelle */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-800">
                  Taxe Formation Professionnelle (TFP)
                  <span className="block text-[10px] font-normal text-slate-500">OFPPT</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">
                  Total Brut : {formatDH(activeBrute)}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">1,60 %</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">{formatDH(cot.tfp)}</td>
                <td className="py-3 px-4 text-center font-mono text-slate-400">-</td>
                <td className="py-3 px-4 text-right font-mono text-slate-400">0,00 DH</td>
                <td className="py-3 px-4 text-right font-mono font-bold">{formatDH(cot.tfp)}</td>
              </tr>
            </tbody>

            <tfoot className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
              <tr>
                <td className="py-3.5 px-4 text-sm" colSpan={2}>
                  TOTAL GÉNÉRAL À PAYER À LA CNSS
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-emerald-800">22,94 %</td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-900 text-sm">{formatDH(cot.totalPatronal)}</td>
                <td className="py-3.5 px-4 text-center font-mono text-blue-800">6,74 %</td>
                <td className="py-3.5 px-4 text-right font-mono text-blue-900 text-sm">{formatDH(cot.totalSalarial)}</td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-900 text-base font-black bg-emerald-100/60">
                  {formatDH(cot.totalGlobal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
