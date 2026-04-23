import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Filter, ArrowUpRight, CheckCircle2, Clock, AlertCircle, X, ChevronRight, Hash, Trash2 } from 'lucide-react';
import { useData } from '../DataContext';
import { dataService } from '../services/dataService';
import { cn } from '../lib/utils';
import { User, Task } from '../types';

export default function ResourceMap() {
  const { users, tasks, projects, refreshData, logActivity } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Sobrecarga' | 'Otimizado' | 'Disponível'>('Todos');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

      // Processamento das tarefas com identificação de CFTV
      const enhancedTasks = userTasks.map(t => {
        const project = projects.find(p => p.id === t.projectId);
        const cftvAsset = project?.cftvData?.points.find(pt => pt.taskId === t.id);
        return {
          ...t,
          projectName: project?.name || 'Sem Projeto',
          isCFTV: !!cftvAsset,
          assetLabel: cftvAsset?.label
        };
      });

      const activeTasksList = enhancedTasks.filter(t => t.status !== 'Concluído' && t.status !== 'Resolvido');
      const completedTasksCount = enhancedTasks.filter(t => t.status === 'Concluído' || t.status === 'Resolvido').length;
      const cftvTasksCount = enhancedTasks.filter(t => t.isCFTV && t.status !== 'Concluído' && t.status !== 'Resolvido').length;

      return {
        ...user,
        userTasks: enhancedTasks,
        totalTasks: userTasks.length,
        activeTasksList,
        activeTasksCount: activeTasksList.length,
        completedTasksCount,
        cftvTasksCount,
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
      <div className="px-12 py-8 flex items-end justify-between shrink-0 glass-panel border-none rounded-none m-0 z-20 bg-white/20 dark:bg-black/20 backdrop-blur-md">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-[#5d5e66] dark:text-white/40 tracking-widest uppercase mb-1">
            <span>Gestão Operacional</span>
            <span className="opacity-30">/</span>
            <span className="text-black dark:text-white">Mapa de Recursos</span>
          </nav>
          <h2 className="text-4xl font-extrabold tracking-tighter text-black dark:text-white uppercase transition-colors">Alocação de Talentos</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-white/20" />
            <input 
              type="text" 
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs font-medium text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none min-w-[240px]"
            />
          </div>
          <div className="flex bg-neutral-100/50 dark:bg-white/10 p-1 rounded-lg gap-1">
            {(['Todos', 'Sobrecarga', 'Otimizado', 'Disponível'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                  statusFilter === f ? "bg-white dark:bg-white/20 text-black dark:text-white shadow-sm" : "text-[#5d5e66] dark:text-white/40 hover:text-black dark:hover:text-white"
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
                className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-sm hover:shadow-xl transition-all group"
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
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#121212]",
                        resource.resourceStatus === 'Sobrecarga' ? "bg-red-500" : resource.resourceStatus === 'Otimizado' ? "bg-green-500" : "bg-blue-500"
                      )} />
                    </div>
                    <div>
                      <h4 className="font-bold text-black dark:text-white">{resource.name}</h4>
                      <p className="text-[10px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-widest">{resource.role}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md",
                    resource.resourceStatus === 'Sobrecarga' ? "bg-red-500/10 text-red-600 dark:text-red-400" : resource.resourceStatus === 'Otimizado' ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  )}>
                    {resource.resourceStatus}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-neutral-400 dark:text-white/20">Carga de Trabalho</span>
                      <span className="text-black dark:text-white">{resource.workload}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
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

                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-black/5 dark:border-white/5">
                    <div className="text-center">
                      <p className="text-xl font-black text-black dark:text-white">{resource.activeTasksCount}</p>
                      <p className="text-[8px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-[0.2em]">Ativas</p>
                    </div>
                    <div className="text-center border-x border-black/5 dark:border-white/10">
                      <p className="text-xl font-black text-black dark:text-white">{resource.completedTasksCount}</p>
                      <p className="text-[8px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-[0.2em]">Resolvidas</p>
                    </div>
                    <div className="text-center relative">
                      <p className="text-xl font-black text-blue-600 dark:text-blue-400">{resource.cftvTasksCount}</p>
                      <p className="text-[8px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-[0.2em]">CFTV</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-300 dark:text-white/10">Distribuição por Célula</p>
                    <div className="space-y-2">
                      {resource.distribution.map((dist: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-[#5d5e66] dark:text-white/40 truncate pr-4">{dist.name}</span>
                          <span className="font-black text-black dark:text-white">{dist.percentage}%</span>
                        </div>
                      ))}
                      {resource.distribution.length === 0 && (
                        <p className="text-[10px] text-neutral-300 dark:text-white/10 italic">Nenhuma alocação ativa</p>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedUser(resource)}
                  className="w-full mt-6 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black text-black dark:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  Ver Ficha Completa <ArrowUpRight size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <AlertCircle size={48} className="text-neutral-200 dark:text-white/5 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-white/20">Nenhum talento encontrado com estes parâmetros</p>
          </div>
        )}

        {/* Global Summary */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black dark:bg-white text-white dark:text-black p-8 rounded-[32px] overflow-hidden relative shadow-xl">
            <Users className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Efetivo</h5>
            <p className="text-5xl font-black tracking-tighter">{users.length}</p>
            <p className="mt-4 text-xs font-medium opacity-60">Colaboradores ativos operando no terminal.</p>
          </div>
          
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-black/5 dark:border-white/10 shadow-sm">
            <Clock className="text-black dark:text-white mb-4" size={24} />
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Média de Alocação</h5>
            <p className="text-5xl font-black tracking-tighter text-black dark:text-white">{globalStats.avgAllocation}%</p>
            <p className="mt-4 text-xs font-medium text-[#5d5e66] dark:text-white/40">Otimização balanceada em {projects.length} frentes de trabalho.</p>
          </div>

          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  globalStats.overloadedCount > 0 ? "bg-red-500" : "bg-green-500"
                )} />
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-white">Sobrecarga Crítica</h5>
              </div>
              <p className="text-2xl font-black tracking-tight text-black dark:text-white uppercase transition-colors">
                {globalStats.overloadedCount === 0 ? 'Nenhum Nodo em Alerta' : `${globalStats.overloadedCount} Usuário(s) em Alerta`}
              </p>
              <p className={cn(
                "text-xs font-medium mt-2",
                globalStats.overloadedCount > 0 ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400"
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
              className="bg-white dark:bg-[#121212] w-full max-w-2xl h-full md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden border-l border-black/5 dark:border-white/10"
            >
              <div className="p-8 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={selectedUser.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter text-black dark:text-white">{selectedUser.name}</h3>
                    <p className="text-[10px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-widest">{selectedUser.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-3 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-full transition-colors text-black dark:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white dark:bg-[#121212]">
                {/* Meta Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl">
                    <p className="text-[8px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-widest mb-1">Ativas</p>
                    <p className="text-2xl font-black text-black dark:text-white">{selectedUser.activeTasksCount}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-blue-500/20">
                    <p className="text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">CFTV</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{selectedUser.cftvTasksCount}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl">
                    <p className="text-[8px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-widest mb-1">Concluídas</p>
                    <p className="text-2xl font-black text-black dark:text-white">{selectedUser.completedTasksCount}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl">
                    <p className="text-[8px] font-bold text-[#5d5e66] dark:text-white/40 uppercase tracking-widest mb-1">Status</p>
                    <p className={cn(
                      "text-sm font-black",
                      selectedUser.resourceStatus === 'Sobrecarga' ? "text-red-500" : "text-green-600 dark:text-green-400"
                    )}>{selectedUser.resourceStatus}</p>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-widest text-black dark:text-white">Tarefas em Execução</h4>
                    <span className="text-[10px] bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full font-bold">{selectedUser.activeTasksList.length}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedUser.activeTasksList.length > 0 ? selectedUser.activeTasksList.map((task: any) => (
                      <div key={task.id} className="p-4 rounded-2xl border border-neutral-100 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={cn(
                            "w-1.5 h-10 rounded-full",
                            task.priority === 'Urgente' ? "bg-red-500" : task.priority === 'Alta' ? "bg-orange-500" : "bg-blue-500"
                          )} />
                          <div className="truncate">
                            <p className="text-xs font-bold truncate text-black dark:text-white flex items-center gap-2">
                              {task.title}
                              {task.isCFTV && (
                                <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] rounded uppercase flex items-center gap-1 shrink-0">
                                  <Hash size={8} /> {task.assetLabel}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-[#5d5e66] dark:text-white/40 flex items-center gap-2 mt-1">
                              {task.projectName}
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
                            <p className="text-[8px] font-bold text-neutral-300 dark:text-white/10 uppercase">Prazo</p>
                            <p className="text-[10px] font-bold text-black dark:text-white">{task.dueDate}</p>
                          </div>
                          <ChevronRight size={16} className="text-neutral-300 group-hover:text-black dark:group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    )) : (
                      <p className="text-center py-12 text-xs text-neutral-400 dark:text-white/10 font-bold uppercase tracking-widest bg-neutral-50 dark:bg-white/5 rounded-3xl">Pista limpa. Nenhuma tarefa pendente.</p>
                    )}
                  </div>
                </div>

                {/* Skillset or Distribution */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-black dark:text-white">Distribuição por Projeto</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.distribution.map((d: any) => (
                      <div key={d.id} className="p-4 rounded-2xl bg-black/5 dark:bg-white/5">
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-[10px] font-bold truncate pr-2 text-black dark:text-white">{d.name}</p>
                          <p className="text-[10px] font-black text-black dark:text-white">{d.percentage}%</p>
                        </div>
                        <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-black dark:bg-white" style={{ width: `${d.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-neutral-50 dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 space-y-3">
                <button className="w-full py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Redirecionar Tarefas
                </button>
                
                {!showDeleteConfirm ? (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-4 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={12} /> Excluir Perfil Permanentemente
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          await dataService.deleteProfile(selectedUser.id);
                          logActivity('excluiu o perfil de', selectedUser.name, 'SISTEMA');
                          await refreshData();
                          setSelectedUser(null);
                        } catch (err: any) {
                          console.error('Erro ao deletar perfil:', err);
                          alert(`Erro ao excluir perfil: ${err.message || 'Erro desconhecido.'}`);
                        } finally {
                          setShowDeleteConfirm(false);
                        }
                      }}
                      className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl animate-in zoom-in-95 hover:bg-red-700 transition-all"
                    >
                      CONFIRMAR AGORA
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-6 py-4 bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-white/60 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-neutral-300 dark:hover:bg-white/20 transition-all"
                    >
                      X
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
