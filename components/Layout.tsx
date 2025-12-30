
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
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-900 shadow-2xl overflow-hidden relative border-x border-slate-800">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-none tracking-tighter">PROXIMO NÍVEL <span className="text-blue-500">SMS</span></h1>
            <span className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase">Sistema Operacional</span>
          </div>
        </div>
        <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-slate-400" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-slate-900 border-t border-slate-800 px-8 py-4 flex justify-between items-center z-50">
        <NavItem 
          icon={<Home className="w-5 h-5" />} 
          label="Início" 
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
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <div className={`p-1 rounded-lg transition-all ${active ? 'bg-blue-500/10' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);
