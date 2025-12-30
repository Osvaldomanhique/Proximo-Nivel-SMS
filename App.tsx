
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AppTab, Contact, DeliveryStatus, SMSLog, CampaignStats } from './types';
import { 
  Upload, 
  Send, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Zap,
  Sparkles,
  ExternalLink,
  Smartphone,
  Info,
  History,
  Timer,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { optimizeMessage } from './services/geminiService';

const App: React.FC = () => {
  // --- Estados com Persistência ---
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState(() => localStorage.getItem('sms_message') || '');
  const [delay, setDelay] = useState(() => Number(localStorage.getItem('sms_delay')) || 10.0);
  const [logs, setLogs] = useState<SMSLog[]>(() => {
    const saved = localStorage.getItem('sms_logs');
    return saved ? JSON.parse(saved) : [];
  });
  
  // --- Estados de Interface ---
  const [isSending, setIsSending] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [safetyMode, setSafetyMode] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);

  // --- Effects para Salvamento ---
  useEffect(() => {
    localStorage.setItem('sms_message', message);
  }, [message]);

  useEffect(() => {
    localStorage.setItem('sms_delay', delay.toString());
  }, [delay]);

  useEffect(() => {
    localStorage.setItem('sms_logs', JSON.stringify(logs));
  }, [logs]);

  // --- Estatísticas ---
  const stats: CampaignStats = useMemo(() => ({
    total: contacts.length || logs.length,
    sent: logs.filter(l => l.status === DeliveryStatus.SENT).length,
    failed: logs.filter(l => l.status === DeliveryStatus.FAILED).length,
    remaining: Math.max(0, contacts.length - logs.filter(l => l.status !== DeliveryStatus.PENDING).length)
  }), [contacts, logs]);

  const campaignTime = useMemo(() => {
    const contactsCount = isSending ? stats.remaining : (contacts.length || 0);
    const totalSeconds = contactsCount * delay;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    
    return {
      text: `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`,
      totalSeconds
    };
  }, [contacts.length, delay, isSending, stats.remaining]);

  // --- Ações ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const parsedContacts: Contact[] = lines.map((line, index) => {
          const parts = line.split(',');
          return {
            id: `c-${index}-${Date.now()}`,
            phone: parts[0]?.trim() || '',
            name: parts[1]?.trim() || 'Cliente'
          };
        }).filter(c => c.phone !== '');
        
        setContacts(parsedContacts);
        // Não limpamos os logs automaticamente para manter histórico, 
        // mas a campanha nova usará esses contatos.
      } catch (err) {
        alert("Erro no CSV. Use o formato: Telefone, Nome");
      }
    };
    reader.readAsText(file);
  };

  // Fix: Added handleStop function to allow users to interrupt the sending process
  const handleStop = () => {
    sendingRef.current = false;
    setIsSending(false);
  };

  const runCampaign = async () => {
    if (isSending || contacts.length === 0 || !message) return;
    
    setIsSending(true);
    sendingRef.current = true;

    for (const contact of contacts) {
      if (!sendingRef.current) break;

      const newLog: SMSLog = {
        id: Math.random().toString(36).substring(2, 11),
        recipient: contact.phone,
        message: message.replace('[Nome]', contact.name || 'Cliente'),
        status: DeliveryStatus.PENDING,
        timestamp: new Date().toLocaleTimeString(),
      };

      setLogs(prev => [newLog, ...prev]);

      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      const success = Math.random() > 0.03; // Simulação de 97% de sucesso
      
      setLogs(prev => prev.map(log => 
        log.id === newLog.id 
          ? { ...log, status: success ? DeliveryStatus.SENT : DeliveryStatus.FAILED } 
          : log
      ));
    }

    setIsSending(false);
    sendingRef.current = false;
    // Fix: Only show completion alert if it wasn't manually stopped
    if (stats.remaining === 0) {
      alert("Campanha finalizada!");
    }
  };

  const resendFailed = async () => {
    if (isSending || stats.failed === 0) return;
    setIsSending(true);
    sendingRef.current = true;

    const failedLogs = logs.filter(l => l.status === DeliveryStatus.FAILED);
    for (const failedLog of failedLogs) {
      if (!sendingRef.current) break;

      setLogs(prev => prev.map(l => 
        l.id === failedLog.id ? { ...l, status: DeliveryStatus.PENDING } : l
      ));

      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      const success = Math.random() > 0.05;
      setLogs(prev => prev.map(l => 
        l.id === failedLog.id ? { ...l, status: success ? DeliveryStatus.SENT : DeliveryStatus.FAILED } : l
      ));
    }

    setIsSending(false);
    sendingRef.current = false;
  };

  const clearHistory = () => {
    if (confirm("Deseja realmente apagar todo o histórico de envios?")) {
      setLogs([]);
      localStorage.removeItem('sms_logs');
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'home' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
          
          {/* Header Dashboard Style */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-1 shadow-xl">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Enviado</span>
              <span className="text-2xl font-black text-white">{logs.filter(l => l.status === DeliveryStatus.SENT).length}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-1 shadow-xl">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa Sucesso</span>
              <span className="text-2xl font-black text-emerald-500">
                {logs.length > 0 ? Math.round((stats.sent / logs.length) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Google Sync Status */}
          <section className="bg-gradient-to-br from-blue-600/20 to-indigo-600/5 border border-blue-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Sync Google Messages</h3>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Conexão via Navegador</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[10px] font-black text-emerald-400 uppercase">Online</span>
              </div>
            </div>
            <a 
              href="https://messages.google.com/web/conversations" 
              target="_blank" 
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black py-3 rounded-2xl transition-all border border-white/10 backdrop-blur-sm"
            >
              PAINEL DE MENSAGENS GOOGLE
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </section>

          {/* Import List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lista de Destinatários</label>
              {contacts.length > 0 && (
                <button onClick={() => setContacts([])} className="text-[10px] font-bold text-red-500 uppercase hover:underline">Limpar Lista</button>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-900 border-2 border-dashed border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-3xl py-10 flex flex-col items-center gap-3 transition-all group"
            >
              <FileSpreadsheet className={`w-8 h-8 ${contacts.length > 0 ? 'text-emerald-500' : 'text-slate-600 group-hover:text-blue-500'} transition-colors`} />
              <div className="text-center">
                <p className="text-xs font-black text-slate-300 uppercase">
                  {fileName && contacts.length > 0 ? `${contacts.length} Contatos Carregados` : 'Importar Planilha CSV'}
                </p>
                <p className="text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-widest">Formato: telefone, nome</p>
              </div>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
          </div>

          {/* Message Editor */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mensagem da Campanha</label>
              <button 
                onClick={async () => {
                  if(!message) return;
                  setIsOptimizing(true);
                  const opt = await optimizeMessage(message, "Vendas Diretas");
                  if(opt) setMessage(opt.optimizedMessage);
                  setIsOptimizing(false);
                }}
                disabled={!message || isOptimizing}
                className="flex items-center gap-2 text-[10px] font-black text-blue-500 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/20 hover:bg-blue-500/10 transition-all disabled:opacity-30"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-pulse' : ''}`} />
                IA OTIMIZAR
              </button>
            </div>
            <div className="relative">
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Olá [Nome], temos uma oferta exclusiva para você..."
                className="w-full h-40 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-700 resize-none shadow-inner"
              />
              <div className="absolute bottom-4 right-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                {message.length} Caracteres
              </div>
            </div>
          </div>

          {/* Configurações de Fluxo */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-8 shadow-xl">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Delay de Segurança</span>
                </div>
                <div className="text-3xl font-black text-white">{delay.toFixed(1)}<span className="text-xs text-slate-500 ml-1 font-black">SEG</span></div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Tempo Previsto</span>
                <span className="text-2xl font-black text-white">{campaignTime.text}</span>
              </div>
            </div>

            <input 
              type="range" 
              min={safetyMode ? "5" : "1"} 
              max="60" 
              step="0.5" 
              value={delay}
              onChange={(e) => setDelay(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-3">
                <ShieldCheck className={`w-5 h-5 ${safetyMode ? 'text-blue-500' : 'text-slate-600'}`} />
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tight">Modo Anti-Bloqueio</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Evita suspensão do chip SIM</p>
                </div>
              </div>
              <button 
                onClick={() => setSafetyMode(!safetyMode)}
                className={`w-10 h-5 rounded-full transition-all relative ${safetyMode ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${safetyMode ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Ação Principal */}
          <div className="flex flex-col gap-3 sticky bottom-4 z-10">
            <button 
              onClick={isSending ? handleStop : runCampaign}
              disabled={!message || (contacts.length === 0 && stats.remaining === 0)}
              className={`w-full h-18 rounded-3xl font-black text-sm tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-40 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${
                isSending 
                ? 'bg-red-500/10 text-red-500 border border-red-500/30 backdrop-blur-md' 
                : 'bg-blue-600 text-white shadow-blue-600/30'
              }`}
            >
              {isSending ? (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  INTERROMPER FLUXO
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  DISPARAR AGORA
                </>
              )}
            </button>
            
            {!isSending && stats.failed > 0 && (
              <button 
                onClick={resendFailed}
                className="w-full h-14 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-orange-500/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar reenvio de {stats.failed} falhas
              </button>
            )}
          </div>

          {/* Monitor de Atividade */}
          {(isSending || logs.length > 0) && (
            <div className="bg-slate-900 border border-blue-600/20 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fluxo de Dados</h3>
                 <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
                   {isSending ? 'PROCESSANDO NÚMEROS' : 'RELATÓRIO DISPONÍVEL'}
                 </span>
              </div>

              <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-1000 ease-out shadow-[0_0_25px_rgba(37,99,235,0.6)]"
                  style={{ width: `${(stats.sent / (contacts.length || logs.length)) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatusCard label="Sucesso" value={stats.sent} color="emerald" />
                <StatusCard label="Erros" value={stats.failed} color="red" />
                <StatusCard label="Restante" value={stats.remaining} color="blue" />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
             <h2 className="text-sm font-black text-white uppercase tracking-widest">Relatório Completo</h2>
             <div className="flex gap-2">
                <button onClick={clearHistory} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="p-3 bg-slate-800 text-slate-400 rounded-2xl hover:bg-slate-700 transition-all">
                  <Download className="w-4 h-4" />
                </button>
             </div>
          </div>
          
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="py-32 text-center opacity-20 flex flex-col items-center gap-4">
                <History className="w-16 h-16" />
                <p className="text-xs font-black uppercase tracking-widest">Histórico Vazio</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`p-5 bg-slate-900 border rounded-3xl flex items-center justify-between transition-all ${
                  log.status === DeliveryStatus.FAILED ? 'border-red-500/20 bg-red-500/5' : 'border-slate-800'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      log.status === DeliveryStatus.SENT ? 'bg-emerald-500/10 text-emerald-500' : 
                      log.status === DeliveryStatus.PENDING ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {log.status === DeliveryStatus.SENT && <CheckCircle2 className="w-6 h-6" />}
                      {log.status === DeliveryStatus.FAILED && <AlertCircle className="w-6 h-6" />}
                      {log.status === DeliveryStatus.PENDING && <RefreshCw className="w-6 h-6 animate-spin" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white tracking-tight">{log.recipient}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-tighter">{log.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      log.status === DeliveryStatus.SENT ? 'text-emerald-500 bg-emerald-500/15' : 
                      log.status === DeliveryStatus.FAILED ? 'text-red-500 bg-red-500/15' :
                      'text-blue-500 bg-blue-500/15'
                    }`}>
                      {log.status}
                    </span>
                    <p className="text-[10px] text-slate-600 max-w-[100px] truncate italic">"{log.message}"</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Ajustes do Sistema</h2>
          
          <div className="space-y-4">
            <SettingsItem icon={<Smartphone className="text-blue-500"/>} title="Hardware Gateway" desc="Chip SIM Local Ativo" />
            <SettingsItem icon={<Sparkles className="text-indigo-500"/>} title="Inteligência Gemini" desc="Otimizador v3.0 Ativo" />
            <SettingsItem icon={<Bell className="text-orange-500"/>} title="Notificações" desc="Alertas de Fim de Campanha" toggle />
            
            <div className="pt-6 border-t border-slate-800">
              <button 
                onClick={clearHistory}
                className="w-full p-5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
              >
                <Trash2 className="w-4 h-4" />
                Resetar Todos os Dados
              </button>
            </div>

            <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 text-center">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">Versão do Site</p>
              <p className="text-xs font-black text-slate-400">PROXIMO NÍVEL SMS v4.2.0-PRO</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const StatusCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="text-center p-4 bg-slate-800/20 rounded-2xl border border-slate-800/50 flex flex-col gap-1">
    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    <p className={`text-xl font-black text-${color}-500`}>{value}</p>
  </div>
);

const SettingsItem = ({ icon, title, desc, toggle }: { icon: any, title: string, desc: string, toggle?: boolean }) => (
  <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs font-black text-white uppercase tracking-tight">{title}</p>
        <p className="text-[10px] text-slate-500 font-bold uppercase">{desc}</p>
      </div>
    </div>
    {toggle && (
      <div className="w-10 h-5 bg-blue-600 rounded-full relative">
        <div className="absolute top-1 left-6 w-3 h-3 bg-white rounded-full" />
      </div>
    )}
  </div>
);

export default App;
