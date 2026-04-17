import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, History, TrendingDown, Trash2, Archive, Download, Share2, Info } from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';

export default function ProjectDetail() {
  const { projects: allProjects, users } = useData();
  const project = allProjects[0] || {
    name: 'Nenhum projeto selecionado',
    description: 'Selecione um projeto na aba de projetos para ver as análises.',
    progress: 0,
    riskProfile: []
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
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5d5e66] bg-neutral-100 px-2 py-0.5 rounded-sm italic">PRODUÇÃO</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-black bg-neutral-200 px-2 py-0.5 rounded-sm">EM ANDAMENTO</span>
            </div>
            <h2 className="text-5xl font-extrabold tracking-tighter text-black">{project.name}</h2>
            <p className="text-[#5d5e66] max-w-2xl mt-4 leading-relaxed font-medium">
              {project.description}
            </p>
          </div>

          <div className="flex -space-x-4">
            {users.map(u => (
              <img key={u.id} src={u.avatar} className="w-12 h-12 rounded-full border-4 border-[#fbf8ff] object-cover shadow-sm" alt="" />
            ))}
            <div className="w-12 h-12 rounded-full border-4 border-[#fbf8ff] bg-neutral-100 flex items-center justify-center text-[10px] font-bold shadow-sm">+12</div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold tracking-[0.2em] text-[#5d5e66] uppercase">
            <span>Progresso Geral</span>
            <span>{project.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-black transition-all duration-1000" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          <div className="bg-white/40 backdrop-blur-xl p-8 rounded-2xl shadow-sm border-l-4 border-black border-y border-r border-neutral-100/50">
            <h3 className="text-xl font-bold tracking-tight mb-8">Cronograma do Caminho Crítico</h3>
            
            <div className="space-y-12 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-neutral-100">
              {[
                { title: 'Aprovação Regulatória EMEA', date: '14 FEV, 2024', active: true, desc: 'Ligação com autoridades centrais para certificação de conformidade de dados.' },
                { title: 'Implantação de Infraestrutura', date: '02 MAR, 2024', active: true, desc: 'Iniciando clusters de nós em Frankfurt e Londres.', current: true },
                { title: 'Lançamento: Expansão APAC', date: '12 JUN, 2024', active: false, desc: 'Implantação primária para as regiões de Singapura e Tóquio.' }
              ].map((milestone, i) => (
                <div key={i} className={cn("relative pl-10", !milestone.active && "opacity-30")}>
                  <div className={cn(
                    "absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-4 border-[#fbf8ff] shadow-sm",
                    milestone.active ? "bg-black" : "bg-neutral-200"
                  )} />
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-black text-sm">{milestone.title}</h4>
                      <p className="text-xs text-[#5d5e66] mt-1 max-w-md">{milestone.desc}</p>
                      {milestone.current && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest">
                           <Info size={10} /> Status Ativo
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-[#5d5e66] uppercase tracking-[0.2em] whitespace-nowrap">{milestone.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-8">
          {/* Burn Rate */}
          <div className="bg-black text-white p-8 rounded-2xl space-y-8 shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-8">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">Taxa de Consumo</p>
                  <h4 className="text-4xl font-extrabold tracking-tighter">$2.4M</h4>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">Eficiência de Capital</p>
                  <div className="flex items-end gap-2">
                    <h4 className="text-4xl font-extrabold tracking-tighter">12%</h4>
                    <span className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-0.5">
                      <TrendingDown size={12} className="rotate-180" /> 2%
                    </span>
                  </div>
                </div>
                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-md text-[10px] font-bold uppercase tracking-[0.2em] transition-all">
                  Relatório Financeiro
                </button>
             </div>
             <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/5 rounded-full blur-[60px]" />
          </div>

          {/* Risk Profile */}
          <div className="bg-white/40 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-neutral-100 flex flex-col gap-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5d5e66]">Perfil de Risco</h3>
            <div className="space-y-5">
              {project.riskProfile.map((risk, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#1a1b22]">{risk.label}</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    risk.level === 'high' ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" :
                    risk.level === 'medium' ? "bg-amber-400" : "bg-emerald-400"
                  )} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="pt-12 border-t border-neutral-100/50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Sistemas</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/10" />
            </div>
          </div>
          <span className="text-xs font-medium text-[#5d5e66]">Todos os parâmetros nominais. Conexão estável.</span>
        </div>

        <div className="flex gap-8">
          <button className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5d5e66] hover:text-black transition-colors">Arquivar</button>
          <button className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5d5e66] hover:text-black transition-colors">Exportar</button>
          <button className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500 hover:opacity-70 transition-colors">Excluir Projeto</button>
        </div>
      </footer>
    </motion.div>
  );
}
