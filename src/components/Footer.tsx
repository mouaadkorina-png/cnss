import React from 'react';
import { ActiveTab } from '../types';
import { ShieldCheck, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenContact: () => void;
}

export const Footer: React.FC<Props> = ({ setActiveTab, onOpenContact }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 pt-12 pb-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                AG
              </div>
              <span className="font-bold text-white text-base">Al Ghali<span className="text-emerald-400"> DS</span></span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Générateur professionnel de fichiers de Déclaration des Salaires (DS & DSC) pour le portail DAMANCOM de la CNSS Maroc. 100% conforme aux spécifications EDI officielles (260 caractères par ligne).
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Conforme EDI 260 caractères</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Outils & Fonctionnalités</h3>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button onClick={() => setActiveTab('principale')} className="hover:text-emerald-400 transition-colors">
                  Déclaration Principale (DS) & Import BDS
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('complementaire')} className="hover:text-emerald-400 transition-colors">
                  Déclaration Complémentaire (DSC)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('simulateur')} className="hover:text-emerald-400 transition-colors">
                  Simulateur Cotisations CNSS & AMO
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('validateur')} className="hover:text-emerald-400 transition-colors">
                  Validateur N° Immatriculation CNSS (Formule Damancom)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('guide')} className="hover:text-emerald-400 transition-colors">
                  Guide & Mode d'Emploi DAMANCOM
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Contact & Assistance</h3>
            <div className="space-y-2 text-[11px]">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <a href="tel:+212660245603" className="hover:text-white font-mono">06 60 24 56 03</a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <a href="mailto:mouaad.korina@gmail.com" className="hover:text-white">mouaad.korina@gmail.com</a>
              </p>
              <p className="text-slate-500 pt-2">Maroc</p>
              <button
                onClick={onOpenContact}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
              >
                <span>Envoyer un message</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Al Ghali - Générateur de Fichier Déclaration des Salaires CNSS. Tous droits réservés.</p>
          <p className="flex items-center gap-1">
            <span>Conçu pour les gestionnaires de paie, comptables et fiduciaires au Maroc</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

