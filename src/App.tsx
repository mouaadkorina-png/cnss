import React, { useState } from 'react';
import { ActiveTab, EmployeeRecord, PreetabliHeader } from './types';
import { getSamplePreetabliContent, parsePreetabliFile } from './utils/cnssUtils';
import { HeaderNavbar } from './components/HeaderNavbar';
import { PreetabliUploader } from './components/PreetabliUploader';
import { EmployeeTableGrid } from './components/EmployeeTableGrid';
import { GenerateDSSection } from './components/GenerateDSSection';
import { ComplementaireView } from './components/ComplementaireView';
import { CotisationsSimulator } from './components/CotisationsSimulator';
import { CnssValidatorTool } from './components/CnssValidatorTool';
import { DamancomGuide } from './components/DamancomGuide';
import { ProductsServices } from './components/ProductsServices';
import { ContactModal } from './components/ContactModal';
import { Footer } from './components/Footer';
import { ShieldCheck, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('principale');
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);

  // Initialize with empty pre-established header or pre-populated demo
  const [header, setHeader] = useState<PreetabliHeader>({
    affiliation: '1234567',
    periode: '202608',
    raisonSociale: 'ENTREPRISE MAROCAINE SARL',
    activite: 'SERVICES & CONSEIL EN INFORMATIQUE',
    codeAgence: '01',
    dateEmission: '20260801',
    dateExigibilite: '20260910',
    adresse: 'BOULEVARD ANFA RESIDENCE LES FLEURS',
    codePostal: '20000',
    ville: 'CASABLANCA'
  });

  // Pre-seed with realistic sample Moroccan employees for quick testing
  const [employees, setEmployees] = useState<EmployeeRecord[]>([
    {
      id: 'emp_1',
      cnss: '183920194',
      nom: 'EL ALAMI',
      prenom: 'MOHAMED',
      cin: 'BK123456',
      jours: 26,
      salaireReel: 8500.00,
      salairePlafonne: 6000.00,
      situation: '',
      isPreetabli: true,
      isValidCNSS: true
    },
    {
      id: 'emp_2',
      cnss: '204918239',
      nom: 'BENJELLOUN',
      prenom: 'FATIMA',
      cin: 'BE987654',
      jours: 26,
      salaireReel: 12000.00,
      salairePlafonne: 6000.00,
      situation: '',
      isPreetabli: true,
      isValidCNSS: true
    },
    {
      id: 'emp_3',
      cnss: '109283401',
      nom: 'TAHIRI',
      prenom: 'YOUSSEF',
      cin: 'A456123',
      jours: 26,
      salaireReel: 4500.00,
      salairePlafonne: 4500.00,
      situation: '',
      isPreetabli: true,
      isValidCNSS: true
    },
    {
      id: 'emp_4',
      cnss: '194827364',
      nom: 'IDRISSI',
      prenom: 'SALMA',
      cin: 'CD789123',
      jours: 14,
      salaireReel: 3200.00,
      salairePlafonne: 3200.00,
      situation: 'IT',
      isPreetabli: true,
      isValidCNSS: true
    },
    {
      id: 'emp_5',
      cnss: '158293402',
      nom: 'CHRAIBI',
      prenom: 'KARIM',
      cin: 'AA654321',
      jours: 26,
      salaireReel: 9500.00,
      salairePlafonne: 6000.00,
      situation: '',
      isPreetabli: false,
      isValidCNSS: true
    }
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenContact={() => setIsContactOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tab 1: Déclaration Principale */}
        {activeTab === 'principale' && (
          <div id="tab-content-principale" className="space-y-6">
            {/* Step 1: Preetabli Uploader */}
            <PreetabliUploader
              header={header}
              setHeader={setHeader}
              onEmployeesLoaded={newEmps => setEmployees(newEmps)}
              employeeCount={employees.length}
            />

            {/* Step 2: Interactive Table Grid & Excel Paste */}
            <EmployeeTableGrid
              employees={employees}
              setEmployees={setEmployees}
              header={header}
            />

            {/* Step 3: EDI File Generation & Download */}
            <GenerateDSSection
              header={header}
              employees={employees}
              declarationType="principale"
              onGoToGuide={() => setActiveTab('guide')}
            />
          </div>
        )}

        {/* Tab 2: Déclaration Complémentaire */}
        {activeTab === 'complementaire' && (
          <ComplementaireView
            header={header}
            setHeader={setHeader}
            onGoToGuide={() => setActiveTab('guide')}
          />
        )}

        {/* Tab 3: Simulateur de Cotisations CNSS & AMO */}
        {activeTab === 'simulateur' && (
          <CotisationsSimulator
            employees={employees}
            header={header}
          />
        )}

        {/* Tab 4: Validateur Numéro CNSS */}
        {activeTab === 'validateur' && (
          <CnssValidatorTool />
        )}

        {/* Tab 5: Guide DAMANCOM */}
        {activeTab === 'guide' && (
          <DamancomGuide />
        )}

        {/* Tab 6: Nos Produits & Services */}
        {activeTab === 'produits' && (
          <ProductsServices
            onOpenContact={() => setIsContactOpen(true)}
          />
        )}
      </main>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Footer */}
      <Footer
        setActiveTab={setActiveTab}
        onOpenContact={() => setIsContactOpen(true)}
      />
    </div>
  );
}
