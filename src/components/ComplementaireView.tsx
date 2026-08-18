import React, { useState } from 'react';
import { EmployeeRecord, PreetabliHeader } from '../types';
import { PreetabliUploader } from './PreetabliUploader';
import { EmployeeTableGrid } from './EmployeeTableGrid';
import { GenerateDSSection } from './GenerateDSSection';
import { Layers, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface Props {
  header: PreetabliHeader;
  setHeader: (header: PreetabliHeader) => void;
  onGoToGuide: () => void;
}

export const ComplementaireView: React.FC<Props> = ({ header, setHeader, onGoToGuide }) => {
  const [sequenceNum, setSequenceNum] = useState<number>(1);
  const [compEmployees, setCompEmployees] = useState<EmployeeRecord[]>([
    {
      id: `comp_${Date.now()}_1`,
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
    }
  ]);

  return (
    <div id="view-complementaire" className="space-y-6">
      {/* Title banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-teal-800/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                Déclaration Complémentaire (DSC)
              </h1>
              <p className="text-xs text-teal-200/80 mt-0.5">
                Générez le fichier DSC pour régulariser des salariés omis ou supplémentaires pour une période déjà déclarée
              </p>
            </div>
          </div>

          <div className="bg-teal-950/60 border border-teal-700/50 rounded-xl p-3 flex items-center gap-3">
            <label className="text-xs font-semibold text-teal-200 whitespace-nowrap">
              Numéro de Séquence :
            </label>
            <select
              id="seq"
              value={sequenceNum}
              onChange={e => setSequenceNum(parseInt(e.target.value, 10))}
              className="bg-slate-900 text-teal-300 border border-teal-500/50 font-bold text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-teal-400"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <option key={n} value={n}>
                  Complémentaire N° {n} (Séquence {String(n).padStart(2, '0')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="mt-4 p-3 bg-amber-500/15 border border-amber-400/30 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>Règle CNSS :</strong> Les salariés déclarés dans cette déclaration complémentaire (DSC) <strong>ne doivent pas</strong> figurer dans la déclaration principale ni dans d'autres déclarations complémentaires pour la même période de paie.
          </p>
        </div>
      </div>

      {/* Step 1: Preetabli */}
      <PreetabliUploader
        header={header}
        setHeader={setHeader}
        onEmployeesLoaded={newEmps => setCompEmployees(newEmps)}
        employeeCount={compEmployees.length}
      />

      {/* Step 2: Employee Table */}
      <EmployeeTableGrid
        employees={compEmployees}
        setEmployees={setCompEmployees}
        header={header}
      />

      {/* Step 3: Generate Action */}
      <GenerateDSSection
        header={header}
        employees={compEmployees}
        declarationType="complementaire"
        sequenceNum={sequenceNum}
        onGoToGuide={onGoToGuide}
      />
    </div>
  );
};
