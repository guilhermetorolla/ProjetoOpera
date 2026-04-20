import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Filter, ArrowUpRight, CheckCircle2, Clock, AlertCircle, X, ChevronRight, Hash } from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';
import { User, Task } from '../types';

export default function ResourceMap() {
  const { users, tasks, projects } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Sobrecarga' | 'Otimizado' | 'Disponível'>('Todos');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const resourceData = useMemo(() => {
    const list = users.map(user => {
      const userTasks = tasks.filter(t => t.assignees.some(a => a.id === user.id));
      const activeTasks = userTasks.filter(t => t.status !== 'Concluído' && t.status !== 'Resolvido');
      const completedTasks = userTasks.filter(t => t.status === 'Concluído' || t.status === 'Resolvido');
      
      // Calculate workload based on active tasks
      const workloadValue = Math.min(activeTasks.length * 20, 100);
      
      // Project distribution
      const projectDistribution = projects.map(p => {
        const tasksInProject = userTasks.filter(t => t.projectId === p.id);
        const percentage = userTasks.length > 0 ? (tasksInProject.length / userTasks.length) * 100 : 0;
        return { id: p.id, name: p.name, percentage: Math.round(percentage) };
      }).filter(p => p.percentage > 0);

      return {
        ...user,
        userTasks,
        totalTasks: userTasks.length,
        activeTasksList: activeTasks,
        activeTasksCount: activeTasks.length,
        completedTasksCount: completedTasks.length,
        workload: workloadValue,
        distribution: projectDistribution,
        resourceStatus: workloadValue > 80 ? 'Sobrecarga' : workloadValue > 40 ? 'Otimizado' : 'Disponível'
      };
    });

    return list.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || item.resourceStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, tasks, projects, searchTerm, statusFilter]);

  const globalStats = useMemo(() => {
    const totalWorkload = resourceData.reduce((acc, curr) => acc + curr.workload, 0);
    const avgAllocation = resourceData.length > 0 ? Math.round(totalWorkload / resourceData.length) : 0;
    const overloadedCount = resourceData.filter(r => r.resourceStatus === 'Sobrecarga').length;
    
    return { avgAllocation, overloadedCount };
  }, [resourceData]);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-12 py-8 flex items-end justify-between shrink-0 glass-panel border-none rounded-none m-0 z-20">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-[#5d5e66] tracking-widest uppercase mb-1">
            <span>Gestão Operacional</span>
            <span className="opacity-30">/</span>
            <span className="text-black">Mapa de Recursos</span>
          </nav>
          <h2 className="text-4xl font-extrabold tracking-tighter text-black">Alocação de Talentos</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 border border-black/5 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:ring-1 focus:ring-black outline-none min-w-[240px]"
            />
          </div>
          <div className="flex bg-neutral-100/50 p-1 rounded-lg gap-1">
            {(['Todos', 'Sobrecarga', 'Otimizado', 'Disponível'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                  statusFilter === f ? "bg-white text-black shadow-sm" : "text-[#5d5e66] hover:text-black"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {resourceData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resourceData.map((resource) => (
              <motion.div 
                key={resource.id}
                layoutId={`resource-${resource.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-black/5 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={resource.avatar} 
                        alt={resource.name} 
                        className="w-14 h-14 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                        resource.resourceStatus === 'Sobrecarga' ? "bg-red-500" : resource.resourceStatus === 'Otimizado' ? "bg-green-500" : "bg-blue-500"
                      )} />
                    </div>
                    <div>
                      <h4 className="font-bold text-black">{resource.name}</h4>
                      <p className="text-[10px] font-bold text-[#5d5e66] uppercase tracking-widest">{resource.role}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md",
                    resource.resourceStatus === 'Sobrecarga' ? "bg-red-500/10 text-red-600" : resource.resourceStatus === 'Otimizado' ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"
                  )}>
                    {resource.resourceStatus}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-neutral-400">Carga de Trabalho</span>
                      <span className="text-black">{resource.workload}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${resource.workload}%` }}
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          resource.workload > 80 ? "bg-red-500" : resource.workload > 40 ? "bg-green-500" : "bg-blue-500"
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-black/5">
                    <div className="text-center">
                      <p className="text-xl font-black text-black">{resource.activeTasksCount}</p>
                      <p className="text-[8px] font-bold text-[#5d5e66] uppercase tracking-[0.2em]">Ativas</p>
                    </div>
                    <div className="text-center border-l border-black/5">
                      <p className="text-xl font-black text-black">{resource.completedTasksCount}</p>
                      <p className="text-[8px] font-bold text-[#5d5e66] uppercase tracking-[0.2em]">Resolvidas</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-300">Distribuição por Célula</p>
                    <div className="space-y-2">
                      {resource.distribution.map((dist: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-[#5d5e66] truncate pr-4">{dist.name}</span>
                          <span className="font-black text-black">{dist.percentage}%</span>
                        </div>
                      ))}
                      {resource.distribution.length === 0 && (
                        <p className="text-[10px] text-neutral-300 italic">Nenhuma alocação ativa</p>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedUser(resource)}
                  className="w-full mt-6 py-2.5 rounded-xl bg-black/5 group-hover:bg-black group-hover:text-white text-black transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  Ver Ficha Completa <ArrowUpRight size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <AlertCircle size={48} className="text-neutral-200 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Nenhum talento encontrado com estes parâmetros</p>
          </div>
        )}

        {/* Global Summary */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black text-white p-8 rounded-[32px] overflow-hidden relative">
            <Users className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Efetivo</h5>
            <p className="text-5xl font-black tracking-tighter">{users.length}</p>
            <p className="mt-4 text-xs font-medium opacity-60">Colaboradores ativos operando no terminal.</p>
          </div>
          
          <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[32px] border border-black/5">
            <Clock className="text-black mb-4" size={24} />
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Média de Alocação</h5>
            <p className="text-5xl font-black tracking-tighter text-black">{globalStats.avgAllocation}%</p>
            <p className="mt-4 text-xs font-medium text-[#5d5e66]">Otimização balanceada em {projects.length} frentes de trabalho.</p>
          </div>

          <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[32px] border border-black/5 flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  globalStats.overloadedCount > 0 ? "bg-red-500" : "bg-green-500"
                )} />
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Sobrecarga Crítica</h5>
              </div>
              <p className="text-2xl font-black tracking-tight text-black">
                {globalStats.overloadedCount === 0 ? 'Nenhum Nodo em Alerta' : `${globalStats.overloadedCount} Usuário(s) em Alerta`}
              </p>
              <p className={cn(
                "text-xs font-medium mt-2",
                globalStats.overloadedCount > 0 ? "text-red-500" : "text-green-600"
              )}>
                {globalStats.overloadedCount > 0 ? 'Redistribuição necessária imediata.' : 'Capacidade operacional dentro dos limites.'}
              </p>
            </div>
            {globalStats.overloadedCount > 0 && <AlertCircle className="absolute -right-4 -bottom-4 w-24 h-24 text-red-500 opacity-5" />}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-end p-0 md:p-8"
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-2xl h-full md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={selectedUser.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter">{selectedUser.name}</h3>
                    <p className="text-[10px] font-bold text-[#5d5e66] uppercase tracking-widest">{selectedUser.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-3 hover:bg-neutral-50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Meta Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-2xl">
                    <p className="text-[8px] font-bold text-[#5d5e66] uppercase tracking-widest mb-1">Tarefas Ativas</p>
                    <p className="text-2xl font-black">{selectedUser.activeTasksCount}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-2xl">
                    <p className="text-[8px] font-bold text-[#5d5e66] uppercase tracking-widest mb-1">Concluídas</p>
                    <p className="text-2xl font-black">{selectedUser.completedTasksCount}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-2xl">
                    <p className="text-[8px] font-bold text-[#5d5e66] uppercase tracking-widest mb-1">Status</p>
                    <p className={cn(
                      "text-sm font-black",
                      selectedUser.resourceStatus === 'Sobrecarga' ? "text-red-500" : "text-green-600"
                    )}>{selectedUser.resourceStatus}</p>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-widest">Tarefas em Execução</h4>
                    <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-bold">{selectedUser.activeTasksList.length}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedUser.activeTasksList.length > 0 ? selectedUser.activeTasksList.map((task: Task) => (
                      <div key={task.id} className="p-4 rounded-2xl border border-neutral-100 hover:border-black/10 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={cn(
                            "w-1.5 h-10 rounded-full",
                            task.priority === 'Urgente' ? "bg-red-500" : task.priority === 'Alta' ? "bg-orange-500" : "bg-blue-500"
                          )} />
                          <div className="truncate">
                            <p className="text-xs font-bold truncate text-black">{task.title}</p>
                            <p className="text-[10px] text-[#5d5e66] flex items-center gap-2 mt-1">
                              <Hash size={10} /> {task.project}
                              <span className="opacity-30">•</span>
                              <span className={cn(
                                "font-bold",
                                task.priority === 'Urgente' && "text-red-500"
                              )}>{task.priority}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <p className="text-[8px] font-bold text-neutral-300 uppercase">Prazo</p>
                            <p className="text-[10px] font-bold">{task.dueDate}</p>
                          </div>
                          <ChevronRight size={16} className="text-neutral-300 group-hover:text-black transition-colors" />
                        </div>
                      </div>
                    )) : (
                      <p className="text-center py-12 text-xs text-neutral-400 font-bold uppercase tracking-widest bg-neutral-50 rounded-3xl">Pista limpa. Nenhuma tarefa pendente.</p>
                    )}
                  </div>
                </div>

                {/* Skillset or Distribution */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest">Distribuição por Projeto</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.distribution.map((d: any) => (
                      <div key={d.id} className="p-4 rounded-2xl bg-black/5">
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-[10px] font-bold truncate pr-2">{d.name}</p>
                          <p className="text-[10px] font-black">{d.percentage}%</p>
                        </div>
                        <div className="h-1 bg-black/10 rounded-full overflow-hidden">
                          <div className="h-full bg-black" style={{ width: `${d.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-neutral-50">
                <button className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Redirecionar Tarefas
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
