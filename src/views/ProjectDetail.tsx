import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, History, TrendingDown, Trash2, Archive, Download, Share2, Info, Plus, Calendar as CalendarIcon, X, Sparkles, Shield } from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { Milestone } from '../types';

export default function ProjectDetail() {
  const { selectedProject, setSelectedProject, users, logActivity, tasks } = useData();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    async function fetchProjectData() {
      if (selectedProject?.id) {
        setLoading(true);
        setAnalyzing(true);
        try {
          const m = await dataService.getMilestones(selectedProject.id);
          setMilestones(m);

          // AI Analysis specifically for this project
          const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);
          const data = await geminiService.analyzeProjects([selectedProject], projectTasks);
          
          if (data && data.error === 'QUOTA_EXCEEDED') {
            setAiInsight("Motor de IA em repouso estratégico. Limite de requisições atingido.");
          } else if (Array.isArray(data)) {
            // Take the first insight text or title
            setAiInsight(data[0]?.insight || data[0]?.title || "Nenhum insight disponível.");
          }
        } catch (error) {
          console.error('Erro ao buscar dados do projeto:', error);
        }
        setLoading(false);
        setAnalyzing(false);
      }
    }
    fetchProjectData();
  }, [selectedProject?.id, tasks]);

  const handleSaveMilestone = async () => {
    if (!selectedProject || !milestoneForm.title) return;
    try {
      await dataService.createMilestone({
        project_id: selectedProject.id,
        title: milestoneForm.title,
        description: milestoneForm.description,
        due_date: milestoneForm.dueDate,
        is_active: false
      });
      const m = await dataService.getMilestones(selectedProject.id);
      setMilestones(m);
      setIsMilestoneModalOpen(false);
      setMilestoneForm({ title: '', description: '', dueDate: new Date().toISOString().split('T')[0] });
      logActivity('adicionou um marco estratégico', milestoneForm.title, 'GESTÃO');
    } catch (error) {
      console.error('Erro ao salvar marco:', error);
    }
  };

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] opacity-40">
        <Archive size={48} className="mb-4 text-[#5d5e66]" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5d5e66]">Hub Analítico Vazio</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]/60 mt-2">Selecione um projeto para auditoria detalhada</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm(`Excluir permanentemente o projeto "${selectedProject.name}"?`)) {
      try {
        await dataService.deleteProject(selectedProject.id);
        logActivity('excluiu o projeto', selectedProject.name, 'GESTÃO');
        setSelectedProject(null);
      } catch (error) {
        alert('Houve um erro ao excluir o projeto.');
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-12 max-w-7xl mx-auto space-y-12 pb-32"
    >
      {/* Header */}
      <section className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5d5e66] dark:text-white/40 bg-neutral-100 dark:bg-white/10 px-2 py-0.5 rounded-sm italic">{selectedProject.type || 'GERAL'}</span>
              <span className={cn(
                "text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-sm",
                "bg-neutral-200 dark:bg-white/20 text-black dark:text-white"
              )}>
                {selectedProject.status.toUpperCase()}
              </span>
            </div>
            <h2 className="text-5xl font-extrabold tracking-tighter text-black dark:text-white transition-colors uppercase">{selectedProject.name}</h2>
            <p className="text-[#5d5e66] dark:text-white/40 max-w-2xl mt-4 leading-relaxed font-medium">
              {selectedProject.description}
            </p>
          </div>

          <div className="flex -space-x-4">
            {(selectedProject.members?.length ? selectedProject.members.slice(0, 4) : users.slice(0, 4)).map(u => (
              <img key={u.id} src={u.avatar} className="w-12 h-12 rounded-full border-4 border-[#fbf8ff] dark:border-[#1a1b22] object-cover shadow-sm transition-colors" alt="" />
            ))}
            {(selectedProject.members?.length || users.length) > 4 && (
              <div className="w-12 h-12 rounded-full border-4 border-[#fbf8ff] dark:border-[#1a1b22] bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold shadow-sm text-black dark:text-white transition-colors">
                +{(selectedProject.members?.length || users.length) - 4}
              </div>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold tracking-[0.2em] text-[#5d5e66] dark:text-white/40 uppercase">
            <span>Progresso Geral da Iniciativa</span>
            <span className="text-black dark:text-white">{selectedProject.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-black dark:bg-white transition-all duration-1000" style={{ width: `${selectedProject.progress}%` }} />
          </div>
        </div>
      </section>

      {/* AI Intelligence Board */}
      <section className="bg-black dark:bg-white text-white dark:text-black p-1 rounded-3xl overflow-hidden shadow-2xl transition-colors">
        <div className="bg-neutral-900 dark:bg-white rounded-[22px] p-8 border border-white/5 dark:border-black/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center">
                <Sparkles size={20} className={cn("text-white dark:text-black transition-all", analyzing && "animate-pulse")} />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest uppercase text-white dark:text-black">Análise Estratégica Opero IA</h3>
                <p className="text-[10px] font-bold text-white/40 dark:text-black/40 uppercase tracking-widest">Motor de Inteligência Gemini</p>
              </div>
            </div>
            {analyzing && (
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-white dark:bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-white dark:bg-black rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-1 h-1 bg-white dark:bg-black rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            )}
          </div>

          <div className="relative z-10">
            {analyzing ? (
              <div className="space-y-3">
                <div className="h-4 bg-white/5 dark:bg-black/5 rounded-full w-full animate-pulse" />
                <div className="h-4 bg-white/5 dark:bg-black/5 rounded-full w-3/4 animate-pulse" />
              </div>
            ) : aiInsight ? (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-medium leading-relaxed tracking-tight text-white dark:text-black"
              >
                {aiInsight}
              </motion.p>
            ) : (
              <p className="text-sm font-medium text-white/30 dark:text-black/30 italic uppercase tracking-widest">Aguardando dados suficientes para auditoria cognitiva...</p>
            )}
          </div>

          <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl pointer-events-none group-hover:opacity-20 transition-opacity">
            <div className="w-64 h-64 bg-white dark:bg-black rounded-full" />
          </div>
        </div>
      </section>

      {/* SaaS Specific Tracking Section */}
      {selectedProject.type === 'SAAS' && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/5 dark:bg-emerald-500/10 p-8 rounded-[32px] border border-emerald-500/20 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400 transition-colors">Monitor de SaaS: Ibiunet</h3>
              <p className="text-[10px] font-bold text-emerald-600/60 dark:text-emerald-400/40 uppercase tracking-widest transition-colors">Acompanhamento de Liberação e Adoção Interna</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Estado do Rollout', value: 'Uso Interno Liberado', icon: CheckCircle2 },
              { label: 'Ecossistema', value: 'ibiunet', icon: Shield },
              { label: 'Ambiente Atual', value: 'Produção', icon: History },
            ].map((item, i) => (
              <div key={i} className="bg-white/50 dark:bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-emerald-500/10 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-widest transition-colors">{item.label}</span>
                </div>
                <p className="text-sm font-bold text-black dark:text-white transition-colors">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4 border-t border-emerald-500/10">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                <span>Adoção Interna (ibiunet)</span>
                <span>72%</span>
              </div>
              <div className="h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: '72%' }} />
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-sm border-l-4 border-black dark:border-white border-y border-r border-neutral-100/50 dark:border-white/10 relative overflow-hidden group transition-colors">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-xl font-bold tracking-tight text-black dark:text-white uppercase transition-colors">Cronograma do Caminho Crítico</h3>
              <button 
                onClick={() => setIsMilestoneModalOpen(true)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full transition-all group-hover:scale-110 text-black dark:text-white"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="space-y-12 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-neutral-100 dark:before:bg-white/10 z-10">
              {loading ? (
                <div className="py-12 flex justify-center opacity-20 text-black dark:text-white"><Sparkles className="animate-spin" /></div>
              ) : milestones.length > 0 ? (
                milestones.map((milestone, i) => (
                  <div key={milestone.id} className={cn("relative pl-10", !milestone.isActive && !milestone.isCompleted && "opacity-30")}>
                    <div className={cn(
                      "absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-4 border-[#fbf8ff] dark:border-[#1a1b22] shadow-sm transition-all",
                      milestone.isCompleted ? "bg-emerald-500" : milestone.isActive ? "bg-black dark:bg-white" : "bg-neutral-200 dark:bg-white/10"
                    )} />
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-black dark:text-white text-sm transition-colors">{milestone.title}</h4>
                        <p className="text-xs text-[#5d5e66] dark:text-white/40 mt-1 max-w-md transition-colors">{milestone.description}</p>
                        {milestone.isActive && (
                          <div className="mt-4 inline-flex items-center gap-2 bg-neutral-100 dark:bg-white/10 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/60">
                             <Info size={10} /> Marco Atualmente em Foco
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-1">
                          <CalendarIcon size={10} /> {new Date(milestone.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 border-2 border-dashed border-black/5 dark:border-white/5 rounded-xl flex flex-col items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">Nenhum marco estratégico definido</p>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 p-8 opacity-[0.02] dark:opacity-[0.05] -rotate-12 translate-x-12 translate-y-12 group-hover:opacity-[0.04] dark:group-hover:opacity-[0.08] transition-opacity text-black dark:text-white pointer-events-none">
              <History size={200} />
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-8">
          {/* Burn Rate */}
          <div className="bg-black dark:bg-white text-white dark:text-black p-8 rounded-2xl space-y-8 shadow-2xl relative overflow-hidden group transition-colors">
             <div className="relative z-10 space-y-8">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-50 dark:opacity-40">Taxa de Consumo Mensal</p>
                  <h4 className="text-4xl font-extrabold tracking-tighter">{selectedProject.burnRate || '$0'}</h4>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-50 dark:opacity-40">Eficiência de Capital Opero</p>
                  <div className="flex items-end gap-2">
                    <h4 className="text-4xl font-extrabold tracking-tighter">{(selectedProject as any).capital_efficiency || 0}%</h4>
                    <span className="text-xs font-bold text-emerald-400 dark:text-emerald-500 mb-1 flex items-center gap-0.5">
                      <TrendingDown size={12} className="rotate-180" /> 2.4%
                    </span>
                  </div>
                </div>
                <button className="w-full py-4 bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border border-white/5 dark:border-black/5 active:scale-95 text-white dark:text-black">
                  Análise Financeira Completa
                </button>
             </div>
             <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/5 dark:bg-black/5 rounded-full blur-[60px] group-hover:bg-white/10 dark:group-hover:bg-black/10 transition-colors" />
          </div>

          {/* Risk Profile */}
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-neutral-100 dark:border-white/10 flex flex-col gap-6 transition-colors">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5d5e66] dark:text-white/40 transition-colors">Matriz de Risco Crítico</h3>
            <div className="space-y-5">
              {selectedProject.riskProfile.length > 0 ? selectedProject.riskProfile.map((risk, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#1a1b22] dark:text-white transition-colors">{risk.label}</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    risk.level === 'high' ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" :
                    risk.level === 'medium' ? "bg-amber-400" : "bg-emerald-400"
                  )} />
                </div>
              )) : (
                <p className="text-[10px] font-bold opacity-20 dark:opacity-10 uppercase tracking-widest text-center py-4 text-black dark:text-white">Estável</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="pt-12 border-t border-neutral-100/50 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 transition-colors">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Sistemas em Nuvem</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/10" />
            </div>
          </div>
          <span className="text-xs font-medium text-[#5d5e66] dark:text-white/60">Integração Supabase ativa. Análise Gemini disponível.</span>
        </div>

        <div className="flex gap-8">
          <button className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5d5e66] dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">Relatórios</button>
          <button className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5d5e66] dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">Exportar Dados</button>
          <button 
            onClick={handleDelete}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500 hover:opacity-70 transition-colors"
          >
            Excluir Iniciativa
          </button>
        </div>
      </footer>

      {/* New Milestone Modal */}
      <AnimatePresence>
        {isMilestoneModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-[#121212] w-full max-w-xl rounded-[40px] p-12 relative shadow-2xl border border-black/5 dark:border-white/10"
            >
              <button 
                onClick={() => setIsMilestoneModalOpen(false)}
                className="absolute top-8 right-8 p-3 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-full transition-colors text-black dark:text-white"
              >
                <X size={24} />
              </button>

              <header className="mb-12">
                <nav className="text-[10px] font-bold text-[#5d5e66] dark:text-white/40 tracking-widest uppercase mb-2">Estratégico / Novo Marco</nav>
                <h3 className="text-4xl font-extrabold tracking-tighter text-black dark:text-white uppercase transition-colors">Definir Marco Crítico</h3>
              </header>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Objetivo do Marco</label>
                  <input 
                    type="text" 
                    value={milestoneForm.title}
                    onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                    placeholder="Ex: Entrega Versão Alpha"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Descrição do Impacto</label>
                  <textarea 
                    value={milestoneForm.description}
                    onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-medium text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none h-24" 
                    placeholder="Quais critérios definem este marco como concluído?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Data de Entrega</label>
                  <input 
                    type="date" 
                    value={milestoneForm.dueDate}
                    onChange={e => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                  />
                </div>

                <div className="pt-8 border-t border-neutral-100 dark:border-white/10 transition-colors">
                  <button 
                    onClick={handleSaveMilestone}
                    className="w-full py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform active:scale-[0.98]"
                  >
                    Registrar Marco Estratégico
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
