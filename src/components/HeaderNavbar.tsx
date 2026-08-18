import React from 'react';
import { ActiveTab } from '../types';
import { FileText, Layers, Calculator, ShieldCheck, BookOpen, Briefcase, Phone, CheckCircle2 } from 'lucide-react';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenContact: () => void;
}

export const HeaderNavbar: React.FC<Props> = ({ activeTab, setActiveTab, onOpenContact }) => {
  return (
    <header id="main-header" className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-50">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white text-xs font-medium py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
              EDI CNSS MAROC
            </span>
            <span>Télédéclaration DAMANCOM en mode EDI conforme aux spécifications officielles</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a 
              href="tel:+212699052571" 
              className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+212 699 052 571</span>
            </a>
            <span className="text-emerald-300/60">•</span>
            <span className="text-emerald-100">boudalia.tareq@gmail.com</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('principale')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              DS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">GFDS<span className="text-emerald-400">.ma</span></span>
                <span className="text-[10px] bg-slate-800 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                  v2026 EDI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Générateur Déclaration des Salaires CNSS</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="tab-btn-principale"
              onClick={() => setActiveTab('principale')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'principale'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Déclaration Principale</span>
            </button>

            <button
              id="tab-btn-complementaire"
              onClick={() => setActiveTab('complementaire')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'complementaire'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Complémentaire (DSC)</span>
            </button>

            <button
              id="tab-btn-simulateur"
              onClick={() => setActiveTab('simulateur')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'simulateur'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Cotisations CNSS</span>
            </button>

            <button
              id="tab-btn-validateur"
              onClick={() => setActiveTab('validateur')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'validateur'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Validateur CNSS</span>
            </button>

            <button
              id="tab-btn-guide"
              onClick={() => setActiveTab('guide')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'guide'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Guide DAMANCOM</span>
            </button>

            <button
              id="tab-btn-produits"
              onClick={() => setActiveTab('produits')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'produits'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Nos Produits</span>
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-2">
            <button
              id="btn-contact-nav"
              onClick={onOpenContact}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/40 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Contactez-nous</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800 text-xs scrollbar-none">
          <button
            onClick={() => setActiveTab('principale')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${activeTab === 'principale' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300'}`}
          >
            Principale
          </button>
          <button
            onClick={() => setActiveTab('complementaire')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${activeTab === 'complementaire' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300'}`}
          >
            Complémentaire
          </button>
          <button
            onClick={() => setActiveTab('simulateur')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${activeTab === 'simulateur' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300'}`}
          >
            Cotisations
          </button>
          <button
            onClick={() => setActiveTab('validateur')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${activeTab === 'validateur' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300'}`}
          >
            Validateur CNSS
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${activeTab === 'guide' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300'}`}
          >
            Guide
          </button>
          <button
            onClick={() => setActiveTab('produits')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${activeTab === 'produits' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300'}`}
          >
            Produits
          </button>
        </div>
      </div>
    </header>
  );
};
