import React from 'react';
import { SITUATION_CODES } from '../utils/cnssUtils';
import { BookOpen, CheckCircle, HelpCircle, AlertCircle, ArrowRight, Monitor, Download, Upload, ShieldCheck } from 'lucide-react';

export const DamancomGuide: React.FC = () => {
  return (
    <div id="view-guide-damancom" className="space-y-8 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Guide & Mode d'Emploi de la Télédéclaration DAMANCOM (Mode EDI)
            </h1>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Étapes détaillées pour réussir votre déclaration mensuelle des salaires sur le portail officiel de la CNSS
            </p>
          </div>
        </div>
      </div>

      {/* 5-Step Process Visualizer */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-emerald-600" />
          <span>Le Workflow de Télédéclaration EDI en 5 Étapes Simples</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {/* Step 1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-slate-800 text-xs">Accès DAMANCOM</h3>
            <p className="text-[11px] text-slate-600">
              Connectez-vous sur le portail <strong className="text-emerald-700">damancom.ma</strong> avec vos identifiants d'entreprise affiliée.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-slate-800 text-xs">Télécharger le BDS</h3>
            <p className="text-[11px] text-slate-600">
              Dans le menu <em>Télé-déclaration</em>, téléchargez le fichier préétabli du mois (contenant les segments A00 à A03).
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-2 relative shadow-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-emerald-950 text-xs">Al Ghali DS (Édition)</h3>
            <p className="text-[11px] text-emerald-800">
              Glissez le BDS dans Al Ghali. Ajustez les jours, salaires réels ou collez vos données Excel (Ctrl+V).
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
              4
            </div>
            <h3 className="font-bold text-slate-800 text-xs">Générer le Fichier DS</h3>
            <p className="text-[11px] text-slate-600">
              Cliquez sur <em>Générez le fichier DS</em> pour exporter le fichier .txt formaté à 260 caractères par ligne (B00 à B06).
            </p>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
              5
            </div>
            <h3 className="font-bold text-slate-800 text-xs">Téléverser & Valider</h3>
            <p className="text-[11px] text-slate-600">
              Sur DAMANCOM, téléversez le fichier DS dans <em>Télé-déclaration en mode EDI</em> et validez le paiement.
            </p>
          </div>
        </div>
      </div>

      {/* Video Demonstration Card (as on gfds.ma) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>Démonstration Vidéo : Télé-déclaration CNSS en mode EDI dans DAMANCOM</span>
        </h2>
        <div className="aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-md border border-slate-300">
          <iframe
            className="w-full h-full"
            src="https://www.youtube-nocookie.com/embed/MRq6jz5xwUM"
            title="Démonstration Télédéclaration CNSS DAMANCOM"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">
          Vidéo explicative officielle du processus d'import/export de fichiers DS sur le portail DAMANCOM
        </p>
      </div>

      {/* Situation Codes Dictionary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Guide Officiel des Codes de Situation CNSS</span>
          </h2>
          <span className="text-xs text-slate-500">Obligatoire pour les cas particuliers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {SITUATION_CODES.map((s, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
              <div className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded text-xs shrink-0">
                {s.code || 'VIDE'}
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{s.label}</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Foire Aux Questions (FAQ) & Résolution des Erreurs</span>
        </h2>

        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900">Qu'est-ce que le mode EDI de DAMANCOM ?</h4>
            <p className="text-slate-600 text-[11px]">
              Le mode EDI (Échange de Données Informatisé) permet aux entreprises de transmettre en un seul fichier l'ensemble de leurs déclarations de salaires sans avoir à saisir chaque salarié un par un sur le site web.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900">Que faire en cas de rejet pour "Ligne non conforme à 260 caractères" ?</h4>
            <p className="text-slate-600 text-[11px]">
              Notre générateur GFDS.ma garantit que chaque ligne (B00, B01, B02, B03, B04, B05, B06) fait rigoureusement 260 caractères avec le remplissage d'espaces et de zéros requis par la CNSS.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900">Quelle est la date limite de dépôt de la télédéclaration ?</h4>
            <p className="text-slate-600 text-[11px]">
              La déclaration des salaires et le paiement des cotisations doivent être effectués au plus tard le <strong>10 du mois suivant</strong> pour éviter les majorations de retard et pénalités légales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
