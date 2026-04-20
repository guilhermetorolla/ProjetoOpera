import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Award, Shield, Timer, ArrowUpRight, Activity as ActivityIcon, LogOut } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts';
import { cn } from '../lib/utils';
import { useData } from '../DataContext';
import { supabase } from '../lib/supabase';
import AIProjectInsights from '../components/AIProjectInsights';

export default function Dashboard({ onViewChange }: { onViewChange?: (v: string) => void }) {
  const { projects, tasks, activities, users, setSelectedProject } = useData();
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const stats = useMemo(() => {
    // 1. Definição do Projeto em Destaque (Mais Urgente)
    // Buscamos projetos com tarefas 'Urgente'
    const urgentTasks = tasks.filter(t => t.priority === 'Urgente' && t.status !== 'Concluído' && t.status !== 'Resolvido');
    const urgentProjectIds = [...new Set(urgentTasks.map(t => t.projectId))];
    
    let featuredProject = projects.find(p => urgentProjectIds.includes(p.id)) || 
                          projects.find(p => p.status === 'Em Andamento') || 
                          projects[0];

    // Se houver um projeto selecionado globalmente no contexto, poderíamos usar, 
    // mas o usuário pediu para destacar o "Principal e mais urgente".
    
    const projectTasks = tasks.filter(t => t.projectId === featuredProject?.id);
    const completedProjectTasks = projectTasks.filter(t => t.status === 'Resolvido' || t.status === 'Concluído');
    
    // Eficiência baseada no projeto específico
    const efficiency = projectTasks.length > 0 ? (completedProjectTasks.length / projectTasks.length) * 100 : 0;
    
    // Carga de Trabalho: % que cada um executou NO PROJETO
    const userWorkload = users.map(u => {
      const userCompletedInProject = completedProjectTasks.filter(t => t.assignees.some(a => a.id === u.id)).length;
      const load = completedProjectTasks.length > 0 ? (userCompletedInProject / completedProjectTasks.length) * 100 : 0;
      return { ...u, load: Math.round(load) };
    }).sort((a, b) => b.load - a.load).slice(0, 3);

    const activeProjectsCount = projects.length;

    return {
      efficiency: efficiency.toFixed(1),
      totalTasks: projectTasks.length,
      completedTasks: completedProjectTasks.length,
      activeProjectsCount,
      userWorkload,
      featuredProject
    };
  }, [projects, tasks, users]);

  const chartData = [
    { name: 'Seg', val: 40 },
    { name: 'Ter', val: 65 },
    { name: 'Qua', val: 55 },
    { name: 'Qui', val: 85 },
    { name: 'Sex', val: Math.min(parseFloat(stats.efficiency) + 10, 100) }, 
    { name: 'Sab', val: 75 },
    { name: 'Dom', val: 90 },
  ];
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    alert(`Convite enviado com sucesso para: ${inviteEmail}. O novo membro receberá as credenciais em breve.`);
    setInviteEmail('');
    setIsInviteModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-10"
    >
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5d5e66] mb-1">Visão Geral</p>
          <h2 className="text-4xl font-extrabold tracking-tighter text-black">Pulso do Espaço de Trabalho</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {users.map((u, i) => (
              <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-[#fbf8ff] object-cover shadow-sm" alt={u.name} />
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-[#fbf8ff] bg-neutral-100 flex items-center justify-center text-[10px] font-bold">+12</div>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 text-xs font-semibold text-red-500/80 hover:text-red-500 transition-colors bg-red-500/5 px-3 py-1.5 rounded-lg border border-red-500/10"
          >
            <LogOut size={14} /> Sair do Terminal
          </button>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-black text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Convidar Equipe
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isInviteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] p-10 relative shadow-2xl"
            >
              <button onClick={() => setIsInviteModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-neutral-50 rounded-full text-black"><LogOut size={20} className="rotate-180" /></button>
              <h3 className="text-3xl font-extrabold tracking-tighter mb-4">Expandir Equipe</h3>
              <p className="text-[#5d5e66] text-xs font-medium mb-8">Adicione novos talentos ao workspace estratégico do Opero.</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">E-mail Corporativo</label>
                  <input 
                    type="email" 
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-black outline-none" 
                    placeholder="talento@opero.com"
                  />
                </div>
                <button 
                  onClick={handleInvite}
                  className="w-full py-4 bg-black text-white text-[10px] font-bold rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform mt-4"
                >
                  Enviar Convite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AIProjectInsights />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Efficiency Index */}
        <div className="col-span-1 md:col-span-12 lg:col-span-6 bg-neutral-100/50 backdrop-blur-xl p-8 rounded-2xl border border-black/5 shadow-sm flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#5d5e66]/60 mb-2">Eficiência: {stats.featuredProject?.name}</p>
                <h3 className="text-5xl font-extrabold tracking-tighter text-black">{stats.efficiency}%</h3>
              </div>
              <div className="bg-black/5 text-black px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                <TrendingUp size={12} /> +12% vs última semana
              </div>
            </div>
            
            <div className="mt-8 h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#5d5e66' }} 
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-black text-white px-2 py-1 rounded text-[10px] font-bold">
                            {payload[0].value}%
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="val" 
                    radius={[4, 4, 0, 0]} 
                    barSize={32}
                    onMouseEnter={(_, index) => setHoveredBarIndex(index)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === hoveredBarIndex || index === 4 ? '#000000' : '#dcdbe6'} 
                        className="transition-all duration-300 cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-xs text-[#5d5e66] mt-4">{stats.completedTasks} de {stats.totalTasks} tarefas resolvidas neste ciclo.</p>
        </div>

        {/* Workload */}
        <div className="col-span-1 md:col-span-6 lg:col-span-3 bg-neutral-100/50 backdrop-blur-xl p-6 rounded-2xl flex flex-col justify-between min-h-[340px] border border-black/5 shadow-sm">
          <h3 className="text-sm font-bold tracking-tight">Carga de Trabalho</h3>
          <div className="space-y-6 my-6">
            {stats.userWorkload.map((u, i) => (
              <div key={u.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={u.avatar} className="w-6 h-6 rounded-md object-cover" alt="" />
                    <span className="text-xs font-semibold">{u.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#5d5e66]">{u.load}%</span>
                </div>
                <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                  <div className="h-full bg-black transition-all duration-500" style={{ width: `${u.load}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onViewChange?.('resource_map')}
            className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-1 group"
          >
            Ver Mapa de Recursos <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Active Projects */}
        <div className="col-span-1 md:col-span-6 lg:col-span-3 bg-neutral-100/50 backdrop-blur-xl p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col justify-between min-h-[340px]">
          <div>
            <ActivityIcon className="text-black mb-4" size={20} />
            <h3 className="text-sm font-bold text-[#5d5e66] tracking-tight">Projetos Ativos</h3>
            <p className="text-4xl font-extrabold tracking-tighter mt-1">{stats.activeProjectsCount}</p>
          </div>
          <div className="space-y-3 mt-4">
            {projects.slice(0, 3).map((p) => (
              <div 
                key={p.id} 
                onClick={() => { setSelectedProject(p); onViewChange?.('analytics'); }}
                className="flex items-center justify-between text-[10px] border-b border-black/5 pb-2 cursor-pointer hover:bg-black/5 transition-colors group/p"
              >
                <span className="text-[#5d5e66] truncate pr-2 max-w-[120px] group-hover/p:text-black transition-colors">{p.name}</span>
                <span className="font-bold">{p.progress}%</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onViewChange?.('schedule')}
            className="mt-6 text-[10px] font-bold text-[#5d5e66] hover:text-black uppercase tracking-widest flex items-center gap-1 transition-colors"
          >
            Reservar Ambiente <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline */}
        <div className="col-span-1 lg:col-span-8 bg-white/40 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold tracking-tighter">Atividade da Linha do Tempo</h3>
            <button className="p-2 hover:bg-neutral-50 rounded-md transition-colors text-[#5d5e66]">
              <Timer size={18} />
            </button>
          </div>
          
          <div className="space-y-8">
            {activities.length > 0 ? activities.map((act, i) => (
              <div key={act.id} className="flex gap-4 relative group">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-3 h-3 rounded-full z-10 mt-1.5",
                    act.action.toLowerCase().includes('concluiu') || act.action.toLowerCase().includes('resolveu') ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-neutral-200"
                  )} />
                  {i < activities.length - 1 && (
                    <div className="w-px h-[calc(100%+2rem)] bg-neutral-100 absolute top-1.5" />
                  )}
                </div>
                <div className="pb-2 flex-1">
                  <p className="text-[10px] font-bold text-[#5d5e66] uppercase tracking-widest mb-1">{act.time}</p>
                  <div className={cn(
                    "p-4 rounded-xl transition-all border border-transparent hover:border-black/5 hover:bg-white/50",
                    i === 0 ? "bg-[#eeedf7]" : "bg-transparent shadow-sm"
                  )}>
                    <div className="flex items-center gap-3">
                      <img src={act.user.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                      <p className="text-sm">
                        <span className="font-bold">{act.user.name}</span> <span className="opacity-70">{act.action}</span> <span className="font-bold text-black border-b border-black/10">{act.target}</span>
                      </p>
                    </div>
                    {act.tags && (
                      <div className="mt-3 flex gap-2 pl-9">
                        {act.tags.map(t => (
                          <span key={t} className="bg-black text-white px-2 py-0.5 rounded-[4px] text-[8px] font-bold tracking-widest">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 opacity-30 uppercase text-[10px] font-black tracking-widest">Aguardando telemetria de atividade...</div>
            )}
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="col-span-4 space-y-6">
          <div className="bg-white/40 backdrop-blur-xl p-6 rounded-2xl border-l-4 border-black border-y border-r border-white/10 shadow-sm">
            <h4 className="text-sm font-bold mb-2">Aprovação Pendente</h4>
            <p className="text-xs text-[#5d5e66] leading-relaxed mb-6">
              {stats.totalTasks - stats.completedTasks} especificações técnicas exigem sua assinatura final antes do fechamento da sprint.
            </p>
            <button 
              onClick={() => onViewChange?.('projects')}
              className="w-full py-2.5 bg-black text-white text-[10px] font-bold rounded-md uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
            >
              Revisar Agora
            </button>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden relative group aspect-[4/3] border border-neutral-100 cursor-pointer" 
               onClick={() => stats.featuredProject && onViewChange?.('analytics')}>
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              alt="Architecture"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 p-6 text-white w-full">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] opacity-80 mb-1 uppercase">Projeto em Destaque</p>
                  <h4 className="text-lg font-bold tracking-tight">{stats.featuredProject?.name || 'Carregando...'}</h4>
                  <p className="text-[10px] opacity-70 mt-2 lowercase">{stats.featuredProject?.status || 'Processando'}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold mb-1">
                  {stats.featuredProject?.progress}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
