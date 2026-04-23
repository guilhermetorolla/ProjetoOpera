import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';
import { useData } from '../DataContext';
import { Bot, Sparkles, Send, CheckCircle2, History, AlertTriangle, Shield, Check, FileText, Download, BrainCircuit, X, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { geminiService } from '../services/geminiService';

interface SaaSReleaseLogProps {
  project: Project;
  onUpdate: (data: any) => void;
}

export default function SaaSReleaseLog({ project, onUpdate }: SaaSReleaseLogProps) {
  const { currentUser, logActivity } = useData();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [localEntries, setLocalEntries] = useState<any[]>(project.qualityData?.log || []);

  // Update local entries if project explicitly changes from outside
  useEffect(() => {
    if (project.qualityData?.log) {
      setLocalEntries(project.qualityData.log);
    }
  }, [project.id]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [retroData, setRetroData] = useState<any>(null);

  const handleExport = () => {
    let md = `# Release Log: ${project.name}\n\n`;
    localEntries.forEach((e: any) => {
      md += `## ${e.version} - ${format(new Date(e.date), "dd/MM/yyyy")}\n`;
      if (e.analysis.features?.length) {
        md += `\n### Novas Features\n` + e.analysis.features.map((f: string) => `- ${f}`).join('\n') + `\n`;
      }
      if (e.analysis.bugs?.length) {
        md += `\n### Correções\n` + e.analysis.bugs.map((f: string) => `- ${f}`).join('\n') + `\n`;
      }
      if (e.analysis.infra?.length) {
        md += `\n### Infraestrutura\n` + e.analysis.infra.map((f: string) => `- ${f}`).join('\n') + `\n`;
      }
      md += `\n*Nota Original: "${e.rawText}"*\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ReleaseLog_${project.name.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAnalyze = async () => {
    if (localEntries.length === 0) return;
    setIsAnalyzing(true);
    const retro = await geminiService.analyzeReleaseLogs(localEntries);
    if (retro) {
      setRetroData(retro);
    }
    setIsAnalyzing(false);
  };

  const handleSimulatedAISubmit = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    
    // Simulate AI processing time
    await new Promise(r => setTimeout(r, 1800));

    const chunks = inputText.split(/[.,\n]+/).map(s => s.trim()).filter(s => s.length > 5);

    const features: string[] = [];
    const bugs: string[] = [];
    const infra: string[] = [];

    chunks.forEach(chunk => {
      const lower = chunk.toLowerCase();
      let categorized = false;

      if (lower.match(/(bug|corrigi|erro|problema|falha|resolve|travando|lentidão|ajuste)/)) {
        bugs.push(chunk);
        categorized = true;
      }
      if (lower.match(/(banco|api|servido|deploy|infra|pipeline|aws|gcp|banco de dados|vps)/)) {
        infra.push(chunk);
        categorized = true;
      }
      if (!categorized || lower.match(/(novo|nova|adicione|crie|tela|funcionalidade|botão|página|integ|feature)/)) {
         if (!categorized) features.push(chunk);
      }
    });

    const clean = (arr: string[]) => arr.map(s => s.charAt(0).toUpperCase() + s.slice(1));
    
    const lastVersion = localEntries.length > 0 ? localEntries[0].version : 'v1.0.0';
    let newVersion = lastVersion;
    if (lastVersion) {
      const parts = lastVersion.replace('v', '').split('.');
      if (features.length > 0) {
        newVersion = `v${parts[0]}.${parseInt(parts[1] || 0) + 1}.0`;
      } else {
        newVersion = `v${parts[0]}.${parts[1] || 0}.${parseInt(parts[2] || 0) + 1}`;
      }
    }

    const newEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString(),
      version: newVersion,
      rawText: inputText,
      analysis: {
        features: clean(features),
        bugs: clean(bugs),
        infra: clean(infra),
        impact: bugs.length > 1 ? 'high' : 'medium'
      }
    };

    const newEntries = [newEntry, ...localEntries];
    setLocalEntries(newEntries); // Optimistic UI update
    
    // Background sync
    onUpdate({ ...project.qualityData, log: newEntries });
    logActivity('registrou uma atualização', newVersion, 'DESENVOLVIMENTO');

    setInputText('');
    setIsProcessing(false);
  };

  return (
    <div className="flex h-full w-full bg-neutral-50 dark:bg-[#0a0a0b] overflow-hidden">
      
      {/* Esquerda: Input / "Chat" com a IA */}
      <div className="w-1/3 flex flex-col border-r border-neutral-200/50 dark:border-white/5 bg-white/30 dark:bg-black/10 z-10">
        <div className="p-8 border-b border-neutral-200/50 dark:border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-black dark:text-white">Organizador IA</h2>
            <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">v1.2 Gemini Engine</p>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6">
          <div className="bg-white/80 dark:bg-white/5 p-6 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-24 h-24 text-black dark:text-white -mr-8 -mt-8" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tighter mb-4 text-black dark:text-white relative z-10">Descreva o Lançamento</h3>
            <p className="text-xs font-medium text-black/60 dark:text-white/60 mb-6 relative z-10">
              Apenas digite o que foi feito. A IA irá quebrar seu texto, categorizar bugs, infraestrutura e novas funcionalidades, e gerar o histórico estruturado.
            </p>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ex: Corrigimos a lentidão no painel de relatórios e criamos a nova tela de login..."
              className="w-full h-40 bg-black/5 dark:bg-black/40 border-none rounded-2xl p-4 text-sm resize-none focus:ring-2 focus:ring-black dark:focus:ring-white outline-none relative z-10 placeholder-black/30 dark:placeholder-white/30 font-medium"
            />

            <button
              onClick={handleSimulatedAISubmit}
              disabled={isProcessing || !inputText.trim()}
              className="w-full mt-4 bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl"
            >
              {isProcessing ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                    <Sparkles size={16} />
                  </motion.div>
                  Organizando com IA...
                </>
              ) : (
                <>
                  <Send size={16} /> Registrar Lançamento
                </>
              )}
            </button>
          </div>

          <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-4 opacity-50 flex items-center gap-3">
             <AlertTriangle size={16} className="text-black dark:text-white" />
             <span className="text-[10px] font-bold uppercase tracking-widest">Processamento Natural via Sandbox AI Studio</span>
          </div>
        </div>
      </div>

      {/* Direita: Timeline de Log / Quality Database */}
      <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tighter text-black dark:text-white uppercase">Release Log</h2>
              <p className="text-sm font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mt-1">Histórico de Alterações Organizados por IA</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExport}
                disabled={localEntries.length === 0}
                className="bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-white/10 transition-all font-bold disabled:opacity-50 text-black dark:text-white"
              >
                 <Download size={14} className="text-black/60 dark:text-white/60" />
                 <span className="text-[10px] tracking-widest uppercase">Exportar</span>
              </button>
              
              <button 
                onClick={handleAnalyze}
                disabled={localEntries.length === 0 || isAnalyzing}
                className="bg-black dark:bg-white text-white dark:text-black border border-transparent px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-[1.02] transition-all font-bold disabled:opacity-50"
              >
                 {isAnalyzing ? (
                   <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                     <Sparkles size={14} />
                   </motion.div>
                 ) : (
                   <BrainCircuit size={14} />
                 )}
                 <span className="text-[10px] tracking-widest uppercase">{isAnalyzing ? 'Analisando...' : 'Retrospectiva AI'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-8 pb-32">
            <AnimatePresence>
              {localEntries.map((entry: any, index: number) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/10 rounded-[32px] p-8 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all"
                >
                   {/* Meta Header */}
                   <div className="flex items-center justify-between mb-8 pb-8 border-b border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest px-4 py-2 rounded-full text-xs">
                           {entry.version}
                        </div>
                        <span className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">
                           {format(new Date(entry.date), "dd 'de' MMM, yy", { locale: ptBR })}
                        </span>
                      </div>
                      
                      {entry.analysis.impact === 'high' && (
                        <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-full">
                           <Shield size={14} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Impacto Alto</span>
                        </div>
                      )}
                   </div>

                   {/* AI Structured Content */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     
                     {entry.analysis.features?.length > 0 && (
                       <div>
                         <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#5d5e66] dark:text-white/40 mb-4">
                           <Sparkles size={14} className="text-emerald-500" /> Novas Features
                         </h4>
                         <ul className="space-y-3">
                           {entry.analysis.features.map((feat: string, i: number) => (
                             <li key={i} className="flex items-start gap-3 bg-neutral-50 dark:bg-white/5 p-3 rounded-2xl">
                               <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                               <span className="text-sm font-bold text-black dark:text-white">{feat}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}

                     {entry.analysis.bugs?.length > 0 && (
                       <div>
                         <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#5d5e66] dark:text-white/40 mb-4">
                           <CheckCircle2 size={14} className="text-indigo-500" /> Correções e Ajustes
                         </h4>
                         <ul className="space-y-3">
                           {entry.analysis.bugs.map((bug: string, i: number) => (
                             <li key={i} className="flex items-start gap-3 bg-neutral-50 dark:bg-white/5 p-3 rounded-2xl">
                               <Check size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                               <span className="text-sm font-bold text-black dark:text-white">{bug}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}

                     {entry.analysis.infra?.length > 0 && (
                       <div className="md:col-span-2">
                         <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#5d5e66] dark:text-white/40 mb-4">
                           <History size={14} className="text-blue-500" /> Infra & Arquitetura
                         </h4>
                         <ul className="space-y-3">
                           {entry.analysis.infra.map((inf: string, i: number) => (
                             <li key={i} className="flex items-start gap-3 bg-neutral-50 dark:bg-white/5 p-3 rounded-2xl">
                               <Check size={14} className="text-blue-500 mt-0.5 shrink-0" />
                               <span className="text-sm font-bold text-black dark:text-white">{inf}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}

                   </div>
                   
                   {/* Raw Input Toggle / Reference */}
                   <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex items-start gap-3 opacity-40 hover:opacity-100 transition-opacity">
                      <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-1.5" />
                      <p className="text-xs font-medium italic text-black dark:text-white">"{entry.rawText}"</p>
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {localEntries.length === 0 && (
              <div className="text-center py-32 opacity-30">
                <Bot size={48} className="mx-auto mb-6 text-black dark:text-white" />
                <h3 className="text-xl font-bold uppercase tracking-widest dark:text-white text-black mb-2">Logs Vazios</h3>
                <p className="text-xs font-medium max-w-sm mx-auto">Comece a registrar as alterações no painel lateral usando uma linguagem natural. Eu organizarei as notas estruturadas por versão.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Retrospectiva da IA */}
      <AnimatePresence>
        {retroData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#121212] w-full max-w-3xl max-h-full overflow-y-auto rounded-[40px] shadow-2xl border border-black/5 dark:border-white/10 p-12"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center">
                     <BrainCircuit size={24} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Retrospectiva do Projeto</h3>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Análise Automática baseada no histórico</p>
                   </div>
                </div>
                <button onClick={() => setRetroData(null)} className="p-3 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full transition-colors text-black dark:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Acertos */}
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-500/20">
                  <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4">
                    <TrendingUp size={16} /> O que fizemos bem (Acertos)
                  </h4>
                  <ul className="space-y-3">
                    {retroData.acertos?.map((a: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-medium text-black/80 dark:text-white/80">
                        <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Erros / Gargalos */}
                <div className="bg-rose-50 dark:bg-rose-500/10 p-6 rounded-3xl border border-rose-100 dark:border-rose-500/20">
                  <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-4">
                    <TrendingDown size={16} /> Gargalos ou Erros Frequentes
                  </h4>
                  <ul className="space-y-3">
                    {retroData.erros?.map((e: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-medium text-black/80 dark:text-white/80">
                        <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Melhorias */}
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
                  <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">
                    <Lightbulb size={16} /> Plano de Ação & Melhorias
                  </h4>
                  <ul className="space-y-3">
                    {retroData.melhorias?.map((m: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-medium text-black/80 dark:text-white/80">
                        <Sparkles size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Conclusão */}
                <div className="bg-black/5 dark:bg-white/5 p-6 rounded-3xl">
                  <p className="text-sm font-medium leading-relaxed text-black dark:text-white text-center italic">
                    "{retroData.conclusao}"
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
