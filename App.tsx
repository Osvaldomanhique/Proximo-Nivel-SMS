
import React, { useState, useRef, useMemo } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { optimizeMessage } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [delay, setDelay] = useState(10.0); // Padrão 10s para segurança
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);

  // Stats
  const stats: CampaignStats = useMemo(() => ({
    total: contacts.length,
    sent: logs.filter(l => l.status === DeliveryStatus.SENT).length,
    failed: logs.filter(l => l.status === DeliveryStatus.FAILED).length,
    remaining: contacts.length - logs.length
  }), [contacts, logs]);

  // Campaign Duration Calc
  const campaignTime = useMemo(() => {
    const totalSeconds = (isSending ? stats.remaining : contacts.length) * delay;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    
    return {
      text: `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`,
      totalSeconds
    };
  }, [contacts.length, delay, isSending, stats.remaining]);

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
            id: `c-${index}`,
            phone: parts[0]?.trim() || '',
            name: parts[1]?.trim() || 'Cliente'
          };
        }).filter(c => c.phone !== '');
        
        setContacts(parsedContacts);
        setLogs([]);
      } catch (err) {
        alert("Erro ao ler arquivo CSV. Certifique-se que o formato é: Telefone, Nome");
      }
    };
    reader.readAsText(file);
  };

  const runCampaign = async () => {
    if (isSending || contacts.length === 0 || !message) return;
    
    setIsSending(true);
    sendingRef.current = true;

    const contactsToSend = [...contacts];

    for (let i = 0; i < contactsToSend.length; i++) {
      if (!sendingRef.current) break;

      const contact = contactsToSend[i];
      const newLog: SMSLog = {
        id: Math.random().toString(36).substring(2, 11),
        recipient: contact.phone,
        message: message.replace('[Nome]', contact.name || 'Cliente'),
        status: DeliveryStatus.PENDING,
        timestamp: new Date().toLocaleTimeString(),
      };

      setLogs(prev => [newLog, ...prev]);

      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      const success = Math.random() > 0.05; // 5% de chance de erro simulado
      
      setLogs(prev => prev.map(log => 
        log.id === newLog.id 
          ? { ...log, status: success ? DeliveryStatus.SENT : DeliveryStatus.FAILED } 
          : log
      ));
    }

    setIsSending(false);
    sendingRef.current = false;
  };

  const resendFailed = async () => {
    if (isSending || stats.failed === 0) return;

    setIsSending(true);
    sendingRef.current = true;

    const failedLogs = logs.filter(l => l.status === DeliveryStatus.FAILED);

    for (const failedLog of failedLogs) {
      if (!sendingRef.current) break;

      // Resetar para Pendente antes de tentar enviar
      setLogs(prev => prev.map(l => 
        l.id === failedLog.id ? { ...l, status: DeliveryStatus.PENDING, timestamp: new Date().toLocaleTimeString() } : l
      ));

      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      const success = Math.random() > 0.05;
      
      setLogs(prev => prev.map(l => 
        l.id === failedLog.id 
          ? { ...l, status: success ? DeliveryStatus.SENT : DeliveryStatus.FAILED } 
          // Fix: changed 'log' to 'l' to match the map callback parameter
          : l
      ));
    }

    setIsSending(false);
    sendingRef.current = false;
  };

  const handleStop = () => {
    sendingRef.current = false;
    setIsSending(false);
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'home' && (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
          
          {/* Conexão Google Messages */}
          <section className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Gateway SIM Conectado</h3>
                  <p className="text-[10px] text-blue-400/80 font-bold uppercase tracking-widest">Google Messages Sync</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-400">ATIVO</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              O sistema disparará mensagens usando o chip do seu celular conectado ao navegador.
            </p>
            <a 
              href="https://messages.google.com/web/conversations" 
              target="_blank" 
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black py-3 rounded-xl transition-all border border-slate-700"
            >
              ABRIR PAINEL DE PAREAMENTO GOOGLE
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </section>

          {/* Importação de Planilha */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Banco de Dados</label>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-900 border-2 border-dashed border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-3xl py-8 flex flex-col items-center gap-3 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-slate-300 uppercase tracking-tight">
                  {fileName ? fileName : 'Importar Lista de Envios'}
                </p>
                <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Arraste ou clique para carregar .CSV</p>
              </div>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
          </div>

          {/* Mensagem e Otimização */}
          <div className="space-y-3">
            <div className="flex justify-between items-end ml-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Conteúdo do SMS</label>
              <button 
                onClick={async () => {
                  setIsOptimizing(true);
                  const opt = await optimizeMessage(message, "Vendas");
                  if(opt) setMessage(opt.optimizedMessage);
                  setIsOptimizing(false);
                }}
                disabled={!message || isOptimizing}
                className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 hover:text-blue-400 disabled:opacity-30 transition-all bg-blue-500/5 px-3 py-1.5 rounded-full border border-blue-500/20"
              >
                <Sparkles className={`w-3 h-3 ${isOptimizing ? 'animate-spin' : ''}`} />
                IA OTIMIZAR
              </button>
            </div>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui... Use [Nome] para personalizar."
              className="w-full h-32 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-700"
            />
          </div>

          {/* Delay e Calculadora de Tempo */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-8">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Delay entre Disparos</span>
                </div>
                <div className="text-3xl font-black text-white">{delay.toFixed(1)}<span className="text-xs text-slate-500 font-bold ml-1">SEG</span></div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 text-emerald-500/80">
                  <span className="text-[10px] font-black uppercase tracking-widest">Tempo Restante</span>
                  <Timer className="w-4 h-4" />
                </div>
                <div className="text-3xl font-black text-white">{campaignTime.text}</div>
              </div>
            </div>

            <input 
              type="range" 
              min="2" 
              max="120" 
              step="1" 
              value={delay}
              onChange={(e) => setDelay(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Segurança do Chip</span>
                 <span className={`text-[11px] font-black ${delay < 15 ? 'text-orange-500' : 'text-emerald-500'}`}>
                   {delay < 15 ? 'RISCO MODERADO' : 'MÁXIMA SEGURANÇA'}
                 </span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total de Contatos</span>
                 <span className="text-[11px] font-black text-white">{contacts.length} NÚMEROS</span>
              </div>
            </div>
          </div>

          {/* Botão de Ação */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={isSending ? handleStop : runCampaign}
              disabled={!message || contacts.length === 0}
              className={`w-full h-16 rounded-3xl font-black text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-40 shadow-2xl ${
                isSending 
                ? 'bg-red-500/10 text-red-500 border border-red-500/30' 
                : 'bg-blue-600 text-white shadow-blue-600/20'
              }`}
            >
              {isSending ? (
                <>
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  CANCELAR ENVIO
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  INICIAR PRÓXIMO NÍVEL
                </>
              )}
            </button>

            {/* Atalho para Reenvio se houver falhas */}
            {!isSending && stats.failed > 0 && (
              <button 
                onClick={resendFailed}
                className="w-full h-12 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/30 font-black text-[11px] tracking-widest hover:bg-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                REENVIAR {stats.failed} MENSAGENS COM FALHA
              </button>
            )}
          </div>

          {/* Monitor de Progresso */}
          {(isSending || logs.length > 0) && (
            <div className="bg-slate-900 border border-blue-600/20 p-6 rounded-3xl shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monitoramento em Tempo Real</h3>
                 <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                   {isSending ? 'EM CURSO' : 'CAMPANHA ENCERRADA'}
                 </span>
              </div>

              <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                  style={{ width: `${(stats.sent / stats.total) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                  <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Sucesso</p>
                  <p className="text-lg font-black text-emerald-500">{stats.sent}</p>
                </div>
                <div className="text-center p-3 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                  <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Falhas</p>
                  <p className="text-lg font-black text-red-500">{stats.failed}</p>
                </div>
                <div className="text-center p-3 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                  <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Fila</p>
                  <p className="text-lg font-black text-blue-400">{stats.remaining}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6 pb-10">
          <div className="flex justify-between items-center px-1">
             <h2 className="text-sm font-black text-white uppercase tracking-widest">Relatório de Entrega</h2>
             <div className="flex gap-2">
                {stats.failed > 0 && (
                  <button 
                    onClick={resendFailed}
                    disabled={isSending}
                    className="p-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-all flex items-center gap-2 text-[10px] font-black"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                    REENVIAR FALHAS
                  </button>
                )}
                <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  <Download className="w-4 h-4 text-slate-400" />
                </button>
             </div>
          </div>
          
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="p-20 text-center opacity-30 flex flex-col items-center">
                <History className="w-12 h-12 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Nenhum dado de envio disponível</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`p-4 bg-slate-900 border rounded-2xl flex items-center justify-between group transition-all ${
                  log.status === DeliveryStatus.FAILED ? 'border-red-500/30 bg-red-500/5' : 'border-slate-800 hover:border-slate-700'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      log.status === DeliveryStatus.SENT ? 'bg-emerald-500/10 text-emerald-500' : 
                      log.status === DeliveryStatus.PENDING ? 'bg-blue-500/10 text-blue-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {log.status === DeliveryStatus.SENT && <CheckCircle2 className="w-5 h-5" />}
                      {log.status === DeliveryStatus.FAILED && <AlertCircle className="w-5 h-5" />}
                      {log.status === DeliveryStatus.PENDING && <RefreshCw className="w-5 h-5 animate-spin" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white leading-none tracking-tight">{log.recipient}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase">{log.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                      log.status === DeliveryStatus.SENT ? 'text-emerald-500 bg-emerald-500/10' : 
                      log.status === DeliveryStatus.FAILED ? 'text-red-500 bg-red-500/10' :
                      'text-blue-500 bg-blue-500/10'
                    }`}>
                      {log.status === DeliveryStatus.SENT ? 'SUCESSO' : 
                       log.status === DeliveryStatus.PENDING ? 'ENVIANDO...' : 'FALHA'}
                    </span>
                    <p className="text-[9px] text-slate-600 max-w-[120px] truncate mt-1.5 font-medium">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <Info className="w-12 h-12 mb-4" />
          <p className="text-xs font-black uppercase tracking-widest">Em Breve no Próximo Nível</p>
        </div>
      )}
    </Layout>
  );
};

export default App;
