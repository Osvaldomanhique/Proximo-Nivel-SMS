
import React from 'react';
import { Home, History, Settings, MoreVertical, Zap } from 'lucide-react';
import { AppTab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 selection:bg-blue-500/30">
      {/* Container Principal */}
      <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto bg-slate-900/30 border-x border-slate-800/50 shadow-2xl relative overflow-hidden min-h-screen">
        
        {/* Header Profissional */}
        <header className="p-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-all"></div>
              <img 
                src="logo.png" 
                alt="Logo" 
                className="w-12 h-12 object-contain relative z-10 logo-glow transition-transform group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.src = "https://img.icons8.com/fluency/96/lightning-bolt.png";
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-none tracking-tighter uppercase">
                PROXIMO NÍVEL <span className="text-blue-500 italic">SMS</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] text-slate-400 font-black tracking-[0.2em] uppercase">Enterprise Dashboard</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
              <Zap className="w-3 h-3 fill-current" />
              UPGRADE PRO
            </button>
            <button className="p-2.5 hover:bg-slate-800 rounded-2xl transition-colors text-slate-500">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Área de Conteúdo */}
        <main className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-8 pb-32">
          {children}
        </main>

        {/* Navegação Inferior Estilo App */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-slate-950/90 backdrop-blur-xl border border-slate-800/50 px-8 py-4 flex justify-around items-center z-50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <NavItem 
            icon={<Zap className="w-5 h-5" />} 
            label="Envio" 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
          />
          <NavItem 
            icon={<History className="w-5 h-5" />} 
            label="Relatórios" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
          <NavItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Ajustes" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${active ? 'text-blue-500 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
  >
    <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : ''}`}>
      {icon}
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    {active && <span className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full"></span>}
  </button>
);
