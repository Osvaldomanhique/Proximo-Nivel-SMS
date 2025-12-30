
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  History // Added missing icon import to fix conflict with global History interface
} from 'lucide-react';
import { optimizeMessage } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [delay, setDelay] = useState(5.0);
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);

  // Derived Stats
  const stats: CampaignStats = {
    total: contacts.length,
    sent: logs.filter(l => l.status === DeliveryStatus.SENT || l.status === DeliveryStatus.DELIVERED).length,
    failed: logs.filter(l => l.status === DeliveryStatus.FAILED).length,
    remaining: contacts.length - logs.length
  };

  // Duration Calculator
  const calculateTotalTime = () => {
    const totalSeconds = contacts.length * delay;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    
    return {
      formatted: `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`,
      seconds: totalSeconds
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const parsedContacts: Contact[] = lines.map((line, index) => {
        const parts = line.split(',');
        return {
          id: `c-${index}`,
          phone: parts[0]?.trim() || '',
          name: parts[1]?.trim() || 'Cliente'
        };
      }).filter(c => c.phone !== '');
      
      setContacts(parsedContacts);
      setLogs([]); 
    };
    reader.readAsText(file);
  };

  const runCampaign = async () => {
    if (isSending || contacts.length === 0 || !message) return;
    
    setIsSending(true);
    sendingRef.current = true;

    for (let i = 0; i < contacts.length; i++) {
      if (!sendingRef.current) break;

      const contact = contacts[i];
      const newLog: SMSLog = {
        id: Math.random().toString(36).substr(2, 9),
        recipient: contact.phone,
        message: message.replace('[Nome]', contact.name || 'Cliente'),
        status: DeliveryStatus.PENDING,
        timestamp: new Date().toLocaleTimeString(),
      };

      setLogs(prev => [newLog, ...prev]);

      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      const success = Math.random() > 0.02; // Simulação de alta taxa de sucesso do SIM
      
      setLogs(prev => prev.map(log => 
        log.id === newLog.id 
          ? { ...log, status: success ? DeliveryStatus.SENT : DeliveryStatus.FAILED, error: success ? undefined : 'Falha no Gateway SIM' } 
          : log
      ));
    }

    setIsSending(false);
    sendingRef.current = false;
  };

  const handleStop = () => {
    sendingRef.current = false;
    setIsSending(false);
  };

  const handleOptimize = async () => {
    if (!message) return;
    setIsOptimizing(true);
    const result = await optimizeMessage(message, "Vendas e Fidelização");
    if (result) {
      setMessage(result.optimizedMessage);
    }
    setIsOptimizing(false);
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'home' && (
        <div className="p-4 space-y-6">
          
          {/* Google Messages Connection Card */}
          <div className="bg-slate-800/80 border border-blue-500/30 rounded-2xl p-4 overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Smartphone className="w-16 h-16 text-blue-400 rotate-12" />
             </div>
             <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Gateway Google Ativo</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Conexão Google Mensagens</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Utilizando seu chip (SIM) através do navegador para envios nativos.
                  </p>
                </div>
                <a 
                  href="https://messages.google.com/web/conversations" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-fit flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-lg transition-all"
                >
                  <span className="text-[10px] font-bold text-blue-400">ABRIR PAINEL GOOGLE</span>
                  <ExternalLink className="w-3 h-3 text-blue-400" />
                </a>
             </div>
          </div>

          {/* Import Section */}
          <div className="space-y-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 rounded-2xl flex flex-col items-center justify-center transition-all group bg-slate-900"
            >
              <div className="w-8 h-8 bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center mb-2 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-300">
                {fileName ? fileName : 'Carregar Planilha de Contatos'}
              </p>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Clique para selecionar .csv</p>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv"
              onChange={handleFileUpload}
            />
            {contacts.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] text-emerald-400 font-bold">
                  {contacts.length} contatos carregados com sucesso
                </span>
              </div>
            )}
          </div>

          {/* Message Area */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conteúdo da Mensagem</label>
              <button 
                onClick={handleOptimize}
                disabled={isOptimizing || !message}
                className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-30"
              >
                <Sparkles className="w-3 h-3" />
                MELHORAR COM IA
              </button>
            </div>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua oferta... Use [Nome] para personalizar."
              className="w-full min-h-[140px] bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Campaign Estimator & Delay */}
          <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Intervalo de Envio</span>
                </div>
                <p className="text-2xl font-black text-white">{delay.toFixed(1)}<span className="text-xs text-slate-500 ml-1">seg</span></p>
              </div>
              
              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-2 text-emerald-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Tempo Total Estimado</span>
                  <Info className="w-3 h-3 opacity-50" />
                </div>
                <p className="text-2xl font-black text-white">{calculateTotalTime().formatted}</p>
              </div>
            </div>

            <input 
              type="range" 
              min="1.0" 
              max="60" 
              step="0.5" 
              value={delay}
              onChange={(e) => setDelay(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            
            <div className="grid grid-cols-2 gap-2">
               <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Custo Estimado</p>
                  <p className="text-xs font-bold text-white">Plano SIM Local</p>
               </div>
               <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Risco de Bloqueio</p>
                  <p className={`text-xs font-bold ${delay < 5 ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {delay < 5 ? 'Moderado' : 'Baixo'}
                  </p>
               </div>
            </div>
          </div>

          {/* Send Button */}
          <button 
            onClick={isSending ? handleStop : runCampaign}
            disabled={contacts.length === 0 || !message}
            className={`w-full h-16 rounded-2xl font-black text-sm tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 ${
              isSending 
              ? 'bg-red-500/10 text-red-500 border border-red-500/30' 
              : 'bg-blue-600 text-white shadow-[0_8px_30px_rgba(37,99,235,0.3)]'
            }`}
          >
            {isSending ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                PARAR CAMPANHA
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                INICIAR DISPARO EM MASSA
              </>
            )}
          </button>

          {/* Real-time Status */}
          {(isSending || logs.length > 0) && (
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-blue-500/20 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monitor de Progresso</h3>
                 <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded uppercase">
                   {isSending ? 'Processando' : 'Finalizado'}
                 </span>
              </div>

              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_#3b82f6]"
                  style={{ width: `${(stats.sent / stats.total) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-2 bg-slate-900/40 rounded-xl border border-slate-700/30">
                  <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Enviados</p>
                  <p className="text-sm font-black text-white">{stats.sent}</p>
                </div>
                <div className="text-center p-2 bg-slate-900/40 rounded-xl border border-slate-700/30">
                  <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Falhas</p>
                  <p className="text-sm font-black text-red-500">{stats.failed}</p>
                </div>
                <div className="text-center p-2 bg-slate-900/40 rounded-xl border border-slate-700/30">
                  <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Restantes</p>
                  <p className="text-sm font-black text-blue-400">{stats.remaining}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center px-1">
             <h2 className="text-sm font-black text-white uppercase tracking-widest">Log de Disparos</h2>
             <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
               <Download className="w-4 h-4 text-slate-400" />
             </button>
          </div>
          
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="p-12 text-center opacity-40">
                <History className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">Nenhum envio registrado</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between group hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      log.status === DeliveryStatus.SENT ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {log.status === DeliveryStatus.SENT ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white leading-none">{log.recipient}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{log.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${
                      log.status === DeliveryStatus.SENT ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {log.status}
                    </span>
                    <p className="text-[9px] text-slate-600 max-w-[80px] truncate mt-0.5">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="p-6 space-y-6">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Configurações do Sistema</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800">
              <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Conectividade</h3>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                   <Smartphone className="w-5 h-5 text-blue-500" />
                   <div>
                      <p className="text-xs font-bold text-white">Chip SIM Integrado</p>
                      <p className="text-[9px] text-slate-500">Via Google Web Messages</p>
                   </div>
                </div>
                <div className="px-2 py-0.5 bg-emerald-500/10 rounded text-[9px] font-black text-emerald-500">CONECTADO</div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800">
              <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Suporte IA</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Otimizador Gemini 3.0</span>
                <span className="text-[9px] font-black text-blue-500">ATIVO</span>
              </div>
            </div>

            <button className="w-full p-4 text-xs font-black text-red-500 hover:bg-red-500/5 rounded-2xl transition-all border border-transparent hover:border-red-500/20">
              ENCERRAR SESSÃO OPERACIONAL
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
