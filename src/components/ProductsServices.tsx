import React from 'react';
import { ShoppingCart, Globe, Server, Fingerprint, Shield, Phone, Mail, CheckCircle2 } from 'lucide-react';

interface Props {
  onOpenContact: () => void;
}

export const ProductsServices: React.FC<Props> = ({ onOpenContact }) => {
  return (
    <div id="view-nos-produits" className="space-y-8 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Nos Solutions & Services Informatiques
            </h1>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Découvrez la gamme complète de logiciels d'entreprise, développement sur mesure et infrastructures
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Solution 1: E-achat / E-supply */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Solutions E-achat</h2>
              <p className="text-xs text-slate-500 mt-1">
                Plateforme complète de gestion des achats et des relations fournisseurs
              </p>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Publication des appels d'offres et bons de commande</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Manifestation & qualification des fournisseurs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Évaluation, notation et classement des offres</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Réception et archivage des dossiers financiers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Notifications e-mail automatiques et statistiques</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={onOpenContact}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-xs"
            >
              Demander une démo E-achat
            </button>
          </div>
        </div>

        {/* Solution 2: Web & Software Dev */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Développement Web & Apps</h2>
              <p className="text-xs text-slate-500 mt-1">
                Démarche sur-mesure respectant vos exigences métier spécifiques
              </p>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Sites web institutionnels et portails d'entreprise</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Plateformes E-commerce & paiement en ligne CMI</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Applications de gestion métier (ERP / CRM légers)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Intégrations API bancaires et EDI gouvernementales</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={onOpenContact}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-xs"
            >
              Devis développement sur mesure
            </button>
          </div>
        </div>

        {/* Solution 3: Services IT & Hardware */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Services IT & Matériel</h2>
              <p className="text-xs text-slate-500 mt-1">
                Installation, maintenance et équipements informatiques d'entreprise
              </p>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Installation de pointeuses biométriques & contrôle d'accès</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Systèmes de caisse & points de vente (POS)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Vidéosurveillance & alarmes de sécurité</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Câblage réseau, serveurs & infogérance</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={onOpenContact}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-xs"
            >
              Contactez notre équipe technique
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
