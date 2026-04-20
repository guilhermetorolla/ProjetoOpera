import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, History, TrendingDown, Trash2, Archive, Download, Share2, Info, Plus, Calendar as CalendarIcon, X, Sparkles } from 'lucide-react';
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
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5d5e66] bg-neutral-100 px-2 py-0.5 rounded-sm italic">{selectedProject.type || 'GERAL'}</span>
              <span className={cn(
                "text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-sm",
                selectedProject.status === 'Bloqueado' ? "bg-red-100 text-red-600" : "bg-neutral-200 text-black"
              )}>
                {selectedProject.status.toUpperCase()}
              </span>
            </div>
            <h2 className="text-5xl font-extrabold tracking-tighter text-black">{selectedProject.name}</h2>
            <p className="text-[#5d5e66] max-w-2xl mt-4 leading-relaxed font-medium">
              {selectedProject.description}
            </p>
          </div>

          <div className="flex -space-x-4">
            {(selectedProject.members?.length ? selectedProject.members.slice(0, 4) : users.slice(0, 4)).map(u => (
              <img key={u.id} src={u.avatar} className="w-12 h-12 rounded-full border-4 border-[#fbf8ff] object-cover shadow-sm" alt="" />
            ))}
            {(selectedProject.members?.length || users.length) > 4 && (
              <div className="w-12 h-12 rounded-full border-4 border-[#fbf8ff] bg-neutral-100 flex items-center justify-center text-[10px] font-bold shadow-sm">
                +{(selectedProject.members?.length || users.length) - 4}
              </div>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold tracking-[0.2em] text-[#5d5e66] uppercase">
            <span>Progresso Geral da Iniciativa</span>
            <span>{selectedProject.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-black transition-all duration-1000" style={{ width: `${selectedProject.progress}%` }} />
          </div>
        </div>
      </section>

      {/* AI Intelligence Board */}
      <section className="bg-black text-white p-1 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-neutral-900 rounded-[22px] p-8 border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles size={20} className={cn("text-white transition-all", analyzing && "animate-pulse")} />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest uppercase">Análise Estratégica Opero IA</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Motor de Inteligência Gemini</p>
              </div>
            </div>
            {analyzing && (
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            )}
          </div>

          <div className="relative z-10">
            {analyzing ? (
              <div className="space-y-3">
                <div className="h-4 bg-white/5 rounded-full w-full animate-pulse" />
                <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
              </div>
            ) : aiInsight ? (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-medium leading-relaxed tracking-tight"
              >
                {aiInsight}
              </motion.p>
            ) : (
              <p className="text-sm font-medium text-white/30 italic uppercase tracking-widest">Aguardando dados suficientes para auditoria cognitiva...</p>
            )}
          </div>

          <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl pointer-events-none group-hover:opacity-20 transition-opacity">
            <div className="w-64 h-64 bg-white rounded-full" />
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          <div className="bg-white/40 backdrop-blur-xl p-8 rounded-2xl shadow-sm border-l-4 border-black border-y border-r border-neutral-100/50 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-xl font-bold tracking-tight">Cronograma do Caminho Crítico</h3>
              <button 
                onClick={() => setIsMilestoneModalOpen(true)}
                className="p-2 hover:bg-neutral-100 rounded-full transition-all group-hover:scale-110"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="space-y-12 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-neutral-100 z-10">
              {loading ? (
                <div className="py-12 flex justify-center opacity-20"><Sparkles className="animate-spin" /></div>
              ) : milestones.length > 0 ? (
                milestones.map((milestone, i) => (
                  <div key={milestone.id} className={cn("relative pl-10", !milestone.isActive && !milestone.isCompleted && "opacity-30")}>
                    <div className={cn(
                      "absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-4 border-[#fbf8ff] shadow-sm transition-all",
                      milestone.isCompleted ? "bg-emerald-500" : milestone.isActive ? "bg-black" : "bg-neutral-200"
                    )} />
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-black text-sm">{milestone.title}</h4>
                        <p className="text-xs text-[#5d5e66] mt-1 max-w-md">{milestone.description}</p>
                        {milestone.isActive && (
                          <div className="mt-4 inline-flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest">
                             <Info size={10} /> Marco Atualmente em Foco
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-[#5d5e66] uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-1">
                          <CalendarIcon size={10} /> {new Date(milestone.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 border-2 border-dashed border-black/5 rounded-xl flex flex-col items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                   <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum marco estratégico definido</p>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 p-8 opacity-[0.02] -rotate-12 translate-x-12 translate-y-12 group-hover:opacity-[0.04] transition-opacity">
              <History size={200} />
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-8">
          {/* Burn Rate */}
          <div className="bg-black text-white p-8 rounded-2xl space-y-8 shadow-2xl relative overflow-hidden group">
             <div className="relative z-10 space-y-8">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">Taxa de Consumo Mensal</p>
                  <h4 className="text-4xl font-extrabold tracking-tighter">{selectedProject.burnRate || '$0'}</h4>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">Eficiência de Capital Opero</p>
                  <div className="flex items-end gap-2">
                    <h4 className="text-4xl font-extrabold tracking-tighter">{(selectedProject as any).capital_efficiency || 0}%</h4>
                    <span className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-0.5">
                      <TrendingDown size={12} className="rotate-180" /> 2.4%
                    </span>
                  </div>
                </div>
                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border border-white/5 active:scale-95">
                  Análise Financeira Completa
                </button>
             </div>
             <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/5 rounded-full blur-[60px] group-hover:bg-white/10 transition-colors" />
          </div>

          {/* Risk Profile */}
          <div className="bg-white/40 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-neutral-100 flex flex-col gap-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5d5e66]">Matriz de Risco Crítico</h3>
            <div className="space-y-5">
              {selectedProject.riskProfile.length > 0 ? selectedProject.riskProfile.map((risk, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#1a1b22]">{risk.label}</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    risk.level === 'high' ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" :
                    risk.level === 'medium' ? "bg-amber-400" : "bg-emerald-400"
                  )} />
                </div>
              )) : (
                <p className="text-[10px] font-bold opacity-20 uppercase tracking-widest text-center py-4">Estável</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="pt-12 border-t border-neutral-100/50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Sistemas em Nuvem</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/10" />
            </div>
          </div>
          <span className="text-xs font-medium text-[#5d5e66]">Integração Supabase ativa. Análise Gemini disponível.</span>
        </div>

        <div className="flex gap-8">
          <button className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5d5e66] hover:text-black transition-colors">Relatórios</button>
          <button className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5d5e66] hover:text-black transition-colors">Exportar Dados</button>
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
              className="bg-white w-full max-w-xl rounded-[40px] p-12 relative shadow-2xl"
            >
              <button 
                onClick={() => setIsMilestoneModalOpen(false)}
                className="absolute top-8 right-8 p-3 hover:bg-neutral-50 rounded-full transition-colors"
              >
                <X size={24} />
              </button>

              <header className="mb-12">
                <nav className="text-[10px] font-bold text-[#5d5e66] tracking-widest uppercase mb-2">Estratégico / Novo Marco</nav>
                <h3 className="text-4xl font-extrabold tracking-tighter">Definir Marco Crítico</h3>
              </header>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Objetivo do Marco</label>
                  <input 
                    type="text" 
                    value={milestoneForm.title}
                    onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-black outline-none" 
                    placeholder="Ex: Entrega Versão Alpha"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Descrição do Impacto</label>
                  <textarea 
                    value={milestoneForm.description}
                    onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-1 focus:ring-black outline-none h-24" 
                    placeholder="Quais critérios definem este marco como concluído?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Data de Entrega</label>
                  <input 
                    type="date" 
                    value={milestoneForm.dueDate}
                    onChange={e => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-black outline-none" 
                  />
                </div>

                <div className="pt-8 border-t border-neutral-100">
                  <button 
                    onClick={handleSaveMilestone}
                    className="w-full py-4 bg-black text-white text-[10px] font-bold rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform active:scale-[0.98]"
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
