
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Container Centralizado para Desktop / Full para Mobile */}
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto bg-slate-900/50 border-x border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <header className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-lg blur-md opacity-20 animate-pulse"></div>
              <img 
                src="logo.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain relative z-10 logo-glow"
                onError={(e) => {
                  // Fallback caso a imagem não exista localmente ainda
                  e.currentTarget.src = "https://img.icons8.com/fluency/96/lightning-bolt.png";
                }}
              />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-none tracking-tighter uppercase">
                PROXIMO NÍVEL <span className="text-blue-500">SMS</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase">Sistema Operacional</span>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <MoreVertical className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-24 px-4 pt-6">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 w-full max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-3 flex justify-around items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <NavItem 
            icon={<Home className="w-5 h-5" />} 
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
    className={`flex flex-col items-center gap-1.5 py-1 px-4 rounded-xl transition-all duration-300 ${active ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <div className={`p-1.5 rounded-lg transition-all ${active ? 'bg-blue-500/15 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);
