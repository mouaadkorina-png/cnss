import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    societe: '',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Contact & Support GFDS.ma</h2>
            <p className="text-xs text-slate-500">Une équipe réactive pour vos besoins informatiques & déclarations</p>
          </div>
        </div>

        {/* Quick Contact Badges */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Tél / WhatsApp : </span>
            <a href="tel:+212699052571" className="font-bold text-emerald-800 hover:underline">
              +212 699 052 571
            </a>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Mail className="w-4 h-4 text-emerald-600" />
            <span>Email : </span>
            <a href="mailto:boudalia.tareq@gmail.com" className="font-bold text-emerald-800 hover:underline">
              boudalia.tareq@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Localisation : Casablanca, Maroc</span>
          </div>
        </div>

        {sent ? (
          <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">Message envoyé avec succès !</h3>
            <p className="text-xs text-emerald-700">Nous reviendrons vers vous dans les plus brefs délais.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Votre Nom & Prénom *</label>
                <input
                  required
                  type="text"
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Mohamed Alami"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Téléphone *</label>
                <input
                  required
                  type="tel"
                  value={formData.telephone}
                  onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="06 XX XX XX XX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nom@societe.ma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Société</label>
                <input
                  type="text"
                  value={formData.societe}
                  onChange={e => setFormData({ ...formData, societe: e.target.value })}
                  placeholder="Nom de l'entreprise"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Message / Demande de devis *</label>
              <textarea
                required
                rows={3}
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Bonjour, je souhaite avoir plus d'informations concernant..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer ma demande</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
