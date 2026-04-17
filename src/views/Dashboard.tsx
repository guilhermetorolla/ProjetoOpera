import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Award, Shield, Timer, ArrowUpRight, Activity as ActivityIcon } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts';
import { cn } from '../lib/utils';
import { useData } from '../DataContext';

export default function Dashboard({ onViewChange }: { onViewChange?: (v: string) => void }) {
  const { projects, tasks, activities, users, logActivity } = useData();

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Resolvido' || t.status === 'Concluído').length;
    const efficiency = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const activeProjectsCount = projects.filter(p => p.status === 'Em Andamento').length;
    
    // Workload calculation
    const userWorkload = users.slice(0, 3).map(u => {
      const assignedTasks = tasks.filter(t => t.assignees.some(a => a.id === u.id));
      const load = Math.min(assignedTasks.length * 20, 100); // 20% per task, max 100%
      return { ...u, load };
    });

    return {
      efficiency: efficiency.toFixed(1),
      totalTasks,
      completedTasks,
      activeProjectsCount,
      userWorkload
    };
  }, [projects, tasks, users]);

  const chartData = [
    { name: 'Seg', val: 40 },
    { name: 'Ter', val: 65 },
    { name: 'Qua', val: 55 },
    { name: 'Qui', val: 85 },
    { name: 'Sex', val: stats.completedTasks * 5 }, // Just some visual dynamicism
    { name: 'Sab', val: 75 },
    { name: 'Dom', val: 90 },
  ];
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
          <button className="flex items-center gap-2 text-xs font-semibold text-[#5d5e66] hover:text-black transition-colors">
            Convidar Equipe
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Efficiency Index */}
        <div className="col-span-6 bg-white/40 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between h-[340px]">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#5d5e66]/60 mb-2">Índice de Eficiência</p>
                <h3 className="text-5xl font-extrabold tracking-tighter text-black">{stats.efficiency}%</h3>
              </div>
              <div className="bg-black/5 text-black px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                <TrendingUp size={12} /> +12% vs última semana
              </div>
            </div>
            
            <div className="mt-8 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                  <Bar dataKey="val" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 4 ? '#000000' : '#eeedf7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-xs text-[#5d5e66]">{stats.completedTasks} de {stats.totalTasks} tarefas resolvidas neste ciclo.</p>
        </div>

        {/* Workload */}
        <div className="col-span-3 bg-white/40 backdrop-blur-xl p-6 rounded-2xl flex flex-col justify-between h-[340px] border border-white/10 shadow-sm">
          <h3 className="text-sm font-bold tracking-tight">Carga de Trabalho</h3>
          <div className="space-y-6">
            {stats.userWorkload.map((u, i) => (
              <div key={u.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={u.avatar} className="w-6 h-6 rounded-md object-cover" alt="" />
                    <span className="text-xs font-semibold">{u.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#5d5e66]">{u.load}%</span>
                </div>
                <div className="w-full h-1 bg-white/50 rounded-full overflow-hidden">
                  <div className="h-full bg-black" style={{ width: `${u.load}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <button className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-1 group">
            Ver Mapa de Recursos <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Active Projects */}
        <div className="col-span-3 bg-white/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between h-[340px]">
          <div>
            <ActivityIcon className="text-black mb-4" size={20} />
            <h3 className="text-sm font-bold text-[#5d5e66] tracking-tight">Projetos Ativos</h3>
            <p className="text-4xl font-extrabold tracking-tighter mt-1">{stats.activeProjectsCount}</p>
          </div>
          <div className="space-y-3">
            {projects.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-[10px] border-b border-neutral-50 pb-2">
                <span className="text-[#5d5e66] truncate pr-2">{p.name}</span>
                <span className="font-bold">{p.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Timeline */}
        <div className="col-span-8 bg-white/40 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold tracking-tighter">Atividade da Linha do Tempo</h3>
            <button className="p-2 hover:bg-neutral-50 rounded-md transition-colors text-[#5d5e66]">
              <Timer size={18} />
            </button>
          </div>
          
          <div className="space-y-8">
            {activities.map((act, i) => (
              <div key={act.id} className="flex gap-4 relative group">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-3 h-3 rounded-full z-10 mt-1.5",
                    i === 0 ? "bg-black" : "bg-neutral-200"
                  )} />
                  {i < activities.length - 1 && (
                    <div className="w-px h-[calc(100%+2rem)] bg-neutral-100 absolute top-1.5" />
                  )}
                </div>
                <div className="pb-2 flex-1">
                  <p className="text-[10px] font-bold text-[#5d5e66] uppercase tracking-widest mb-1">{act.time}</p>
                  <div className={cn(
                    "p-4 rounded-xl transition-all",
                    i === 0 ? "bg-[#eeedf7]" : "bg-transparent"
                  )}>
                    <p className="text-sm">
                      <span className="font-bold">{act.user.name}</span> {act.action} <span className="font-bold text-black">{act.target}</span>
                    </p>
                    {act.tags && (
                      <div className="mt-3 flex gap-2">
                        {act.tags.map(t => (
                          <span key={t} className="bg-black text-white px-2 py-0.5 rounded-[4px] text-[8px] font-bold tracking-widest">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

          <div className="bg-white rounded-2xl overflow-hidden relative group aspect-[4/3] border border-neutral-100">
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              alt="Architecture"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 p-6 text-white">
              <p className="text-[10px] font-bold tracking-[0.2em] opacity-80 mb-1 uppercase">Projeto em Destaque</p>
              <h4 className="text-lg font-bold tracking-tight">Expansão de Dados EMEA</h4>
              <p className="text-[10px] opacity-70 mt-2 lowercase">Prazo: Em 4 dias</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
