import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MoreHorizontal, 
  Plus, 
  Filter, 
  Share2, 
  MessageSquare, 
  Paperclip, 
  Clock, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  X,
  User as UserIcon,
  Calendar,
  Camera,
  Send,
  Trash2,
  Map as MapIcon,
  LayoutGrid,
  PlayCircle,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import { Status, Project, Task, Priority, User, Comment } from '../types';
import CFTVMapping from '../components/CFTVMapping';
import SaaSReleaseLog from '../components/SaaSReleaseLog';
import ComplianceTracker from '../components/ComplianceTracker';
import NetworkMapping from '../components/NetworkMapping';

const columns: { id: Status; label: string; color: string; icon: any }[] = [
  { id: 'Pendente', label: 'A Fazer', color: '#f59e0b', icon: Clock },
  { id: 'Em Progresso', label: 'Em Progresso', color: '#3b82f6', icon: PlayCircle },
  { id: 'Resolvido', label: 'Revisão', color: '#10b981', icon: CheckCircle2 },
  { id: 'Concluído', label: 'Concluído', color: '#10b981', icon: CheckCircle2 },
];

const TaskCard = React.memo(({ task, onDragStart, onDragEnd, onClick, openEditTask, handleDeleteTask }: { 
  task: Task, 
  onDragStart: (e: any, id: string) => void, 
  onDragEnd: (e: any) => void,
  onClick: (t: Task) => void,
  openEditTask: (t: Task) => void,
  handleDeleteTask: (id: string, e: any) => void
}) => {
  return (
    <motion.div
      layout
      layoutId={task.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task)}
      className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-5 rounded-xl shadow-[0_4px_12px_-2px_rgba(0,0,0,0.03)] dark:shadow-none border border-neutral-100 dark:border-white/10 hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] dark:hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-3">
        <span className={cn(
          "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-[4px]",
          task.priority === 'Urgente' ? "bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400" : 
          task.priority === 'Alta' ? "bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" :
          "bg-neutral-100 dark:bg-white/10 text-[#5d5e66] dark:text-white/40"
        )}>
          {task.priority}
        </span>
        <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); openEditTask(task); }}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-white/10 rounded dark:text-white/60 transition-colors"
          >
            <MoreHorizontal size={12} />
          </button>
          <button 
            onClick={(e) => handleDeleteTask(task.id, e)}
            className="p-1 hover:bg-red-50 dark:hover:bg-red-500/20 text-red-500 rounded transition-colors"
            title="Excluir"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <h4 className="text-sm font-bold text-black dark:text-white mb-1 leading-snug">{task.title}</h4>
      {(() => {
        const coordsMatch = task.description?.match(/📍 Localização Geográfica: ([\-\d\.]+, [\-\d\.]+)/);
        if (coordsMatch) {
          return (
            <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 mb-2 font-mono bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md inline-block">
              {coordsMatch[1]}
            </p>
          );
        }
        return null;
      })()}
      <p className="text-[10px] text-[#5d5e66] dark:text-white/40 mb-4">{task.dueDate}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[#5d5e66]/60 dark:text-white/20">
          <div className="flex items-center gap-1">
            <MessageSquare size={12} />
            <span className="text-[10px] font-bold">{task.comments?.length || 0}</span>
          </div>
          {task.images && task.images.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip size={12} />
              <span className="text-[10px] font-bold">{task.images.length}</span>
            </div>
          )}
          {task.description?.includes('📍') && (
            <div className="flex items-center gap-1 text-blue-500">
              <MapPin size={12} />
              <span className="text-[8px] font-bold uppercase tracking-tighter">Local</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {(() => {
            const col = columns.find(c => c.id === task.status);
            if (!col) return null;
            const Icon = col.icon || Clock;
            return (
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-widest"
                style={{ backgroundColor: col.color }}
              >
                <Icon size={10} strokeWidth={3} className={task.status === 'Em Progresso' ? "animate-pulse" : ""} />
                {task.status}
              </div>
            );
          })()}
          <div className="flex -space-x-1.5">
            {task.assignees.map(u => (
              <img key={u.id} src={u.avatar} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#121212] object-cover shadow-sm" alt="" title={u.name} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function Projects({ onViewChange }: { onViewChange?: (v: string) => void }) {
  const { 
    projects: localProjects, 
    setProjects: setLocalProjects, 
    tasks: localTasks, 
    setTasks: setLocalTasks,
    users,
    currentUser,
    logActivity,
    refreshData,
    selectedProject: activeSelectedProject,
    setSelectedProject
  } = useData();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Helper to open project details
  const navigateToDetails = (p: Project, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProject(p);
    onViewChange?.('analytics');
  };
  
  // Modals visibility
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'project' | 'task'; title: string } | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'map' | 'release'>('board');
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // New/Edit Task Form State
  const [taskForm, setTaskForm] = useState({
    id: '',
    title: '',
    description: '',
    priority: 'Média' as Priority,
    assignees: [] as string[],
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pendente' as Status,
    images: [] as string[]
  });

  // New/Edit Project Form State
  const [projectForm, setProjectForm] = useState({
    id: '',
    name: '',
    description: '',
    type: 'GERAL',
    status: 'Em Andamento',
    members: [] as string[]
  });

  // Comment state
  const [commentText, setCommentText] = useState('');

  const selectedProject = useMemo(() => 
    localProjects.find(p => p.id === selectedProjectId),
    [localProjects, selectedProjectId]
  );
  
  const projectTasks = useMemo(() => 
    selectedProjectId ? localTasks.filter(t => t.projectId === selectedProjectId) : [],
    [localTasks, selectedProjectId]
  );

  // PROJECT ACTIONS
  const handleSaveProject = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setSaveError(null);
    console.log('--- Lançamento: Iniciado ---');
    console.log('Projects: Formulário atual:', projectForm);
    
    if (!projectForm?.name?.trim()) {
      console.warn('Projects: Validação falhou - nome ausente.');
      setSaveError('O nome da iniciativa é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      if (projectForm.id) {
        console.log('Projects: Chamando updateProject...');
        await dataService.updateProject(projectForm.id, {
          name: projectForm.name,
          description: projectForm.description,
          type: projectForm.type,
          status: projectForm.status,
          riskProfile: [{ label: 'Atualizado', level: 'medium' }],
        });
        logActivity('atualizou o projeto', projectForm.name, 'GESTÃO');
      } else {
        console.log('Projects: Chamando createProject no service...');
        const newP = await dataService.createProject({
          name: projectForm.name,
          description: projectForm.description,
          type: projectForm.type,
          status: projectForm.status,
          riskProfile: [{ label: 'Novo', level: 'low' }],
          progress: 0,
          burnRate: 'Estável',
          cftvData: projectForm.type === 'CFTV' ? { points: [], links: [] } : undefined,
          networkData: projectForm.type === 'REDES' ? { points: [], links: [] } : undefined
        });

        // Automatização para SaaS: Adiciona um marco inicial de liberação
        if (projectForm.type === 'SAAS' && newP?.id) {
          try {
            await dataService.createMilestone({
              project_id: newP.id,
              title: 'Configuracão de Ambiente Ibiunet',
              description: 'Preparação do core v1 e infra para usuários beta internos.',
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              is_active: true,
              is_completed: false
            });
          } catch (milestoneError) {
            console.error('Erro ao criar marco automático para SaaS:', milestoneError);
          }
        }

        console.log('Projects: Retorno do service com sucesso:', newP);
        logActivity('criou o projeto', newP?.name || projectForm.name, 'GESTÃO');
      }
      
      console.log('Projects: Sucesso! Fechando modal e resetando estado.');
      setIsProjectModalOpen(false);
      setProjectToEdit(null);
      setProjectForm({ id: '', name: '', description: '', type: 'GERAL', status: 'Em Andamento', members: [] });
      
      await refreshData();
      console.log('--- Lançamento: Concluído com Sucesso ---');
    } catch (error: any) {
      console.error('Projects: Falha no processo de salvamento:', error);
      const errorMsg = error.message || 'Erro inesperado no servidor.';
      setSaveError(`Falha Crítica: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const project = localProjects.find(p => p.id === id);
    setDeleteConfirm({ id, type: 'project', title: project?.name || 'este projeto' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    
    try {
      if (type === 'project') {
        await dataService.deleteProject(id);
        if (selectedProjectId === id) setSelectedProjectId(null);
        logActivity('excluiu um projeto', deleteConfirm.title, 'GESTÃO');
      } else {
        await dataService.deleteTask(id);
        if (selectedTask?.id === id) setSelectedTask(null);
        logActivity('excluiu a tarefa', deleteConfirm.title, 'OPERACIONAL');
      }
      await refreshData();
    } catch (error: any) {
      console.error(`Erro ao deletar ${type}:`, error);
      alert(`Erro ao excluir: ${error.message || 'Erro de conexão'}`);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const openEditProject = (p: Project, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProjectToEdit(p);
    setProjectForm({
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type || 'GERAL',
      status: p.status,
      members: p.members?.map(m => m.id) || []
    });
    setIsProjectModalOpen(true);
  };

  // TASK ACTIONS
  const handleSaveTask = async () => {
    if (!selectedProjectId || !selectedProject) return;

    try {
      if (taskForm.id) {
        // Update Remote
        await dataService.updateTask(taskForm.id, {
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          status: taskForm.status,
          dueDate: taskForm.dueDate,
          assignees: users.filter(u => taskForm.assignees.includes(u.id)),
          images: taskForm.images
        });
        logActivity('atualizou a tarefa', taskForm.title, 'OPERACIONAL');
      } else {
        // Create Remote
        await dataService.createTask({
          projectId: selectedProjectId,
          title: taskForm.title || 'Nova Tarefa',
          description: taskForm.description,
          status: taskForm.status,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate,
          assignees: users.filter(u => taskForm.assignees.includes(u.id)),
          images: taskForm.images
        });
        logActivity('adicionou a tarefa', taskForm.title || 'Nova Tarefa', 'OPERACIONAL', [taskForm.priority]);
      }
      
      await refreshData();
      setIsTaskModalOpen(false);
      setTaskForm({ id: '', title: '', description: '', priority: 'Média', assignees: [], dueDate: new Date().toISOString().split('T')[0], status: 'Pendente', images: [] });
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      alert('Erro ao salvar tarefa no banco de dados.');
    }
  };

  const openEditTask = useCallback((t: Task) => {
    setTaskForm({
      id: t.id,
      title: t.title,
      description: t.description || '',
      priority: t.priority,
      assignees: t.assignees.map(u => u.id),
      dueDate: t.dueDate,
      status: t.status,
      images: t.images || []
    });
    setIsTaskModalOpen(true);
  }, []);

  const handleDeleteTask = useCallback((taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const task = localTasks.find(t => t.id === taskId);
    setDeleteConfirm({ id: taskId, type: 'task', title: task?.title || 'esta tarefa' });
  }, [localTasks]);

  const handleAddComment = () => {
    if (!selectedTask || !commentText.trim()) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      userId: currentUser.id,
      text: commentText,
      time: 'Agora'
    };

    const updatedTasks = localTasks.map(t => {
      if (t.id === selectedTask.id) {
        return {
          ...t,
          comments: [...(t.comments || []), newComment]
        };
      }
      return t;
    });

    setLocalTasks(updatedTasks);
    setSelectedTask({
      ...selectedTask,
      comments: [...(selectedTask.comments || []), newComment]
    });
    setCommentText('');
  };

  const handleAddImage = (url: string) => {
    if (!selectedTask) return;

    const updatedTasks = localTasks.map(t => {
      if (t.id === selectedTask.id) {
        return {
          ...t,
          images: [...(t.images || []), url]
        };
      }
      return t;
    });

    setLocalTasks(updatedTasks);
    setSelectedTask({
      ...selectedTask,
      images: [...(selectedTask.images || []), url]
    });
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: Status) => {
    // Optimistic UI update
    const updatedTasks = localTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    setLocalTasks(updatedTasks);

    try {
      const taskToUpdate = localTasks.find(t => t.id === taskId);
      if (taskToUpdate) {
        await dataService.updateTask(taskId, { status: newStatus });
        logActivity('moveu a tarefa', taskToUpdate.title, 'OPERACIONAL');
        await refreshData();
      }
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      // Revert if error? (Optional, usually better for total sync)
      await refreshData();
    }
  };

  // Drag and Drop handlers with optimized performance
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<Status | null>(null);

  const onDragStart = useCallback((e: React.DragEvent | any, taskId: string) => {
    setDraggedTaskId(taskId);
    if (e.dataTransfer) {
      e.dataTransfer.setData('taskId', taskId);
      e.dataTransfer.effectAllowed = 'move';
      
      // Custom ghost image if needed, but keeping it simple for performance
      const dragPreview = e.currentTarget.cloneNode(true);
      dragPreview.style.position = "absolute";
      dragPreview.style.top = "-1000px";
      document.body.appendChild(dragPreview);
      e.dataTransfer.setDragImage(dragPreview, 20, 20);
      setTimeout(() => document.body.removeChild(dragPreview), 0);
    }
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setActiveColumnId(null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, status: Status) => {
    e.preventDefault();
    if (activeColumnId !== status) {
      setActiveColumnId(status);
    }
  }, [activeColumnId]);

  const onDrop = useCallback((e: React.DragEvent, status: Status) => {
    e.preventDefault();
    setActiveColumnId(null);
    const taskId = e.dataTransfer.getData('taskId') || draggedTaskId;
    if (taskId) {
      handleUpdateTaskStatus(taskId, status);
    }
  }, [draggedTaskId]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-transparent overflow-hidden"
    >
      {!selectedProjectId ? (
        <div className="flex-1 flex flex-col p-12 overflow-y-auto scrollbar-hide">
          <header className="mb-12">
            <nav className="flex items-center gap-2 text-[10px] font-bold text-[#5d5e66] dark:text-white/40 tracking-widest uppercase mb-2">
              <span>Opero</span>
              <span className="opacity-30">/</span>
              <span className="text-black dark:text-white">Portfólio de Projetos</span>
            </nav>
            <div className="flex justify-between items-end">
              <h2 className="text-5xl font-extrabold tracking-tighter text-black dark:text-white uppercase transition-colors">Hub de Iniciativas</h2>
              <button 
                onClick={() => {
                  setProjectToEdit(null);
                  setProjectForm({ id: '', name: '', description: '', type: 'GERAL', status: 'Em Andamento', members: [] });
                  setIsProjectModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={16} /> Novo Projeto
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {localProjects.map(project => (
              <motion.div
                key={project.id}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedProjectId(project.id)}
                className="bg-white/40 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-neutral-100 dark:border-white/10 shadow-sm cursor-pointer hover:shadow-2xl transition-all group relative"
              >
                <div className="flex justify-between items-start mb-8">
                  <span className={cn(
                    "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                    project.type === 'SAAS' 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                      : "text-[#5d5e66] dark:text-white/40 bg-neutral-100 dark:bg-white/10"
                  )}>
                    {project.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => openEditProject(project, e)}
                      className="p-2 hover:bg-neutral-50 dark:hover:bg-white/10 rounded-full transition-opacity dark:text-white/60"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-500/20 text-red-500 rounded-full transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      project.status === 'Concluído' ? "bg-emerald-400" : project.status === 'Em Andamento' ? "bg-blue-400" : "bg-amber-400"
                    )} />
                  </div>
                </div>
                
                <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-black dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">{project.name}</h2>
                <p className="text-xs text-[#5d5e66] dark:text-white/40 leading-relaxed mb-8 line-clamp-2">{project.description}</p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-[#5d5e66] dark:text-white/40 uppercase">
                      <span>Progresso</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-50 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-black dark:bg-white transition-all duration-1000" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-50 dark:border-white/5">
                    <div className="flex -space-x-2">
                      {users.slice(0, 3).map(u => (
                        <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-900 object-cover" alt="" />
                      ))}
                    </div>
                    <div 
                      onClick={(e) => navigateToDetails(project, e)}
                      className="flex items-center gap-1.5 text-black dark:text-white font-bold text-xs uppercase tracking-tighter hover:opacity-70 transition-opacity"
                    >
                      Detalhamento <TrendingUp size={14} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Kanban Header */}
          <div className="px-8 py-6 flex items-end justify-between shrink-0 glass-panel border-none rounded-none m-0 shadow-sm z-30 bg-white/20 dark:bg-black/20 backdrop-blur-md">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  setSelectedProjectId(null);
                  setViewMode('board');
                }}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full transition-colors text-black dark:text-white"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-start gap-4">
                <div>
                  <nav className="flex items-center gap-2 text-[10px] font-bold text-[#5d5e66] dark:text-white/40 tracking-widest uppercase mb-1">
                    <span>Portfólio</span>
                    <span className="opacity-30">/</span>
                    <span className="text-black dark:text-white font-black">{selectedProject?.name}</span>
                  </nav>
                  <h2 className="text-3xl font-extrabold tracking-tighter text-black dark:text-white uppercase">
                    {viewMode === 'board' ? 'Quadro de Operação' 
                     : viewMode === 'map' ? 'Layout de Infraestrutura' 
                     : viewMode === 'release' ? 'Diários de Plataforma' 
                     : 'Adequação LGPD & Documentos'}
                  </h2>
                </div>
                
                {selectedProject?.type === 'CFTV' && (
                  <div className="flex bg-neutral-100 dark:bg-white/10 p-1 rounded-xl gap-1">
                    <button 
                      onClick={() => setViewMode('board')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        viewMode === 'board' ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm" : "text-neutral-400 dark:text-white/20 hover:text-black dark:hover:text-white"
                      )}
                    >
                      <LayoutGrid size={14} /> Board
                    </button>
                    <button 
                      onClick={() => setViewMode('map')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        viewMode === 'map' ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm" : "text-neutral-400 dark:text-white/20 hover:text-black dark:hover:text-white"
                      )}
                    >
                      <MapIcon size={14} /> Projeto CFTV
                    </button>
                  </div>
                )}

                {selectedProject?.type === 'REDES' && (
                  <div className="flex bg-neutral-100 dark:bg-white/10 p-1 rounded-xl gap-1">
                    <button 
                      onClick={() => setViewMode('board')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        viewMode === 'board' ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm" : "text-neutral-400 dark:text-white/20 hover:text-black dark:hover:text-white"
                      )}
                    >
                      <LayoutGrid size={14} /> Board
                    </button>
                    <button 
                      onClick={() => setViewMode('map')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        viewMode === 'map' ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm" : "text-neutral-400 dark:text-white/20 hover:text-black dark:hover:text-white"
                      )}
                    >
                      <MapIcon size={14} /> Projeto de Redes
                    </button>
                  </div>
                )}

                {selectedProject?.type === 'SAAS' && (
                  <div className="flex bg-neutral-100 dark:bg-white/10 p-1 rounded-xl gap-1">
                    <button 
                      onClick={() => setViewMode('board')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        viewMode === 'board' ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm" : "text-neutral-400 dark:text-white/20 hover:text-black dark:hover:text-white"
                      )}
                    >
                      <LayoutGrid size={14} /> Quadro
                    </button>
                    <button 
                      onClick={() => setViewMode('release')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        viewMode === 'release' ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm" : "text-neutral-400 dark:text-white/20 hover:text-black dark:hover:text-white"
                      )}
                    >
                      <TrendingUp size={14} /> Relatório com IA
                    </button>
                  </div>
                )}

                {selectedProject?.type === 'CERTIFICAÇÃO' && (
                  <div className="flex bg-neutral-100 dark:bg-white/10 p-1 rounded-xl gap-1">
                    <button 
                      onClick={() => setViewMode('board')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        viewMode === 'board' ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm" : "text-neutral-400 dark:text-white/20 hover:text-black dark:hover:text-white"
                      )}
                    >
                      <LayoutGrid size={14} /> Gestão / Quadro
                    </button>
                    <button 
                      onClick={() => setViewMode('compliance')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        viewMode === 'compliance' ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm" : "text-neutral-400 dark:text-white/20 hover:text-black dark:hover:text-white"
                      )}
                    >
                      <Paperclip size={14} /> Central de Documentos
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 mr-4">
                {selectedProject?.members?.map(m => (
                  <img key={m.id} src={m.avatar} className="w-8 h-8 rounded-full border-2 border-[#fbf8ff] dark:border-[#070707] object-cover" alt="" title={m.name} />
                ))}
                {!selectedProject?.members && users.slice(0, 3).map(u => (
                  <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-[#fbf8ff] dark:border-[#070707] object-cover" alt="" title={u.name} />
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-[#fbf8ff] dark:border-[#070707] bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold dark:text-white">+5</div>
              </div>
              <button 
                onClick={() => openEditProject(selectedProject!)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full transition-colors mr-2 dark:text-white/60"
                title="Editar Projeto"
              >
                <MoreHorizontal size={20} />
              </button>
              <button 
                onClick={() => handleDeleteProject(selectedProjectId!)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/20 text-red-500 rounded-full transition-colors mr-4"
                title="Excluir Projeto"
              >
                <Trash2 size={20} />
              </button>
              <button 
                onClick={() => {
                  setTaskForm({ id: '', title: '', description: '', priority: 'Média', assignees: [], dueDate: new Date().toISOString().split('T')[0], status: 'Pendente', images: [] });
                  setIsTaskModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Plus size={14} /> Nova Task
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            {viewMode === 'board' ? (
              <div className="absolute inset-0 flex overflow-x-auto p-8 pt-0 scrollbar-hide bg-transparent">
                <div className="flex gap-6 h-full min-w-max">
                  {columns.map(col => (
                      <div 
                        key={col.id} 
                        className={cn(
                          "w-80 flex flex-col h-full rounded-[32px] p-4 overflow-hidden border transition-all duration-300",
                          activeColumnId === col.id 
                            ? "bg-black/5 dark:bg-white/10 border-black/20 dark:border-white/20 scale-[1.02] shadow-2xl" 
                            : "bg-white/5 dark:bg-white/5 backdrop-blur-sm border-black/5 dark:border-white/5"
                        )}
                        onDragOver={(e) => onDragOver(e, col.id)}
                        onDragLeave={() => setActiveColumnId(null)}
                        onDrop={(e) => onDrop(e, col.id)}
                      >
                        <div className="flex items-center justify-between mb-6 px-1">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: col.color }}>
                               <col.icon size={12} strokeWidth={3} />
                            </div>
                            <h3 className="text-[11px] font-black text-black dark:text-white uppercase tracking-[0.2em]">{col.label}</h3>
                            <span className="bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-black text-[#5d5e66] dark:text-white/60">
                              {projectTasks.filter(t => t.status === col.id).length}
                            </span>
                          </div>
                        </div>

                      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide pb-20">
                        <AnimatePresence mode="popLayout" initial={false}>
                          {projectTasks.filter(t => t.status === col.id).map(task => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onDragStart={onDragStart}
                              onDragEnd={onDragEnd}
                              onClick={handleTaskClick}
                              openEditTask={openEditTask}
                              handleDeleteTask={handleDeleteTask}
                            />
                          ))}
                        </AnimatePresence>
                        
                        {projectTasks.filter(t => t.status === col.id).length === 0 && (
                          <div className="h-32 border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center opacity-20 transition-all group-hover:opacity-40">
                             <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-2">
                               <Plus size={14} />
                             </div>
                             <p className="text-[9px] font-black uppercase tracking-[0.2em]">Área Vazia</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : viewMode === 'map' && selectedProject ? (
              <div className="absolute inset-0">
                {selectedProject.type === 'CFTV' ? (
                  <CFTVMapping 
                    project={selectedProject} 
                    onUpdate={async (data) => {
                      try {
                        await dataService.updateProject(selectedProject.id, {
                          ...selectedProject,
                          cftvData: data
                        });
                        await refreshData();
                      } catch (e) {
                        console.error("Failed to update CFTV data:", e);
                      }
                    }}
                  />
                ) : selectedProject.type === 'REDES' ? (
                  <NetworkMapping 
                    project={selectedProject} 
                    onUpdate={async (data) => {
                      try {
                        await dataService.updateProject(selectedProject.id, {
                          ...selectedProject,
                          networkData: data
                        });
                        await refreshData();
                      } catch (e) {
                        console.error("Failed to update Network data:", e);
                      }
                    }}
                  />
                ) : null}
              </div>
            ) : viewMode === 'release' && selectedProject ? (
              <div className="absolute inset-0">
                <SaaSReleaseLog 
                  project={selectedProject}
                  onUpdate={async (data) => {
                    try {
                      await dataService.updateProject(selectedProject.id, {
                        ...selectedProject,
                        qualityData: data
                      });
                      await refreshData();
                    } catch (e) {
                      console.error("Failed to update SaaS release log data:", e);
                    }
                  }}
                />
              </div>
            ) : viewMode === 'compliance' && selectedProject ? (
              <div className="absolute inset-0">
                <ComplianceTracker 
                  project={selectedProject}
                  onUpdate={async (data) => {
                    try {
                      await dataService.updateProject(selectedProject.id, {
                        ...selectedProject,
                        complianceData: data
                      });
                      await refreshData();
                    } catch (e) {
                      console.error("Failed to update Compliance tracker data:", e);
                    }
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* New/Edit Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
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
                onClick={() => setIsTaskModalOpen(false)}
                className="absolute top-8 right-8 p-3 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-full transition-colors text-black dark:text-white"
              >
                <X size={24} />
              </button>

              <header className="mb-12">
                <nav className="text-[10px] font-bold text-[#5d5e66] dark:text-white/40 tracking-widest uppercase mb-2">Engenharia / {taskForm.id ? 'Editar' : 'Nova'} Operação</nav>
                <h3 className="text-4xl font-extrabold tracking-tighter text-black dark:text-white">{taskForm.id ? 'Refinar' : 'Criar'} Tarefa Técnica</h3>
              </header>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Título da Task</label>
                  <input 
                    type="text" 
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                    placeholder="Ex: Auditoria de Segurança Q4"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Prioridade</label>
                    <select 
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as Priority })}
                      className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 outline-none appearance-none"
                    >
                      <option>Baixa</option>
                      <option>Média</option>
                      <option>Alta</option>
                      <option>Urgente</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Entrega Final</label>
                    <input 
                      type="date" 
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Designar Responsáveis</label>
                  <div className="flex flex-wrap gap-2">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          const ids = taskForm.assignees.includes(u.id) 
                            ? taskForm.assignees.filter(id => id !== u.id)
                            : [...taskForm.assignees, u.id];
                          setTaskForm({ ...taskForm, assignees: ids });
                        }}
                        className={cn(
                          "flex items-center gap-2 p-1.5 rounded-full border transition-all",
                          taskForm.assignees.includes(u.id) 
                            ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black" 
                            : "bg-white dark:bg-white/5 border-neutral-100 dark:border-white/10 text-[#5d5e66] dark:text-white/40"
                        )}
                      >
                        <img src={u.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                        <span className="text-[10px] font-bold pr-2">{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Anexar Imagens (Links)</label>
                  <textarea 
                    value={taskForm.images.join(', ')}
                    onChange={e => setTaskForm({ ...taskForm, images: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })}
                    className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-medium text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none h-20" 
                    placeholder="https://exemplo.com/imagem1.jpg"
                  />
                </div>

                <div className="pt-8 border-t border-neutral-100 dark:border-white/10">
                  <button 
                    onClick={handleSaveTask}
                    className="w-full py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform active:scale-[0.98]"
                  >
                    {taskForm.id ? 'Atualizar Registro' : 'Confirmar Envio'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New/Edit Project Modal */}
      <AnimatePresence>
        {isProjectModalOpen && (
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
                onClick={() => setIsProjectModalOpen(false)}
                className="absolute top-8 right-8 p-3 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-full transition-colors text-black dark:text-white"
              >
                <X size={24} />
              </button>

              <header className="mb-12">
                <nav className="text-[10px] font-bold text-[#5d5e66] dark:text-white/40 tracking-widest uppercase mb-2">Opero / {projectForm.id ? 'Editar' : 'Novo'} Projeto</nav>
                <h3 className="text-4xl font-extrabold tracking-tighter text-black dark:text-white">{projectForm.id ? 'Refinar' : 'Lançar'} Iniciativa</h3>
              </header>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Nome da Iniciativa</label>
                  <input 
                    type="text" 
                    value={projectForm.name}
                    onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none" 
                    placeholder="Ex: Expansão EMEA 2025"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Descrição Estratégica</label>
                  <textarea 
                    value={projectForm.description}
                    onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-medium text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none h-24" 
                    placeholder="Descreva o objetivo fundamental deste projeto..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Categoria</label>
                    <select 
                      value={projectForm.type}
                      onChange={e => setProjectForm({ ...projectForm, type: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold text-black dark:text-white outline-none"
                    >
                      <option>SAAS</option>
                      <option>CFTV</option>
                      <option>REDES</option>
                      <option>CERTIFICAÇÃO</option>
                      <option>GERAL</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Estado Inicial</label>
                    <select 
                      value={projectForm.status}
                      onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold text-black dark:text-white outline-none"
                    >
                      <option>Em Andamento</option>
                      <option>Planejamento</option>
                      <option>Concluído</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Recrutar Membros</label>
                  <div className="flex flex-wrap gap-2">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          const ids = projectForm.members.includes(u.id) 
                            ? projectForm.members.filter(id => id !== u.id)
                            : [...projectForm.members, u.id];
                          setProjectForm({ ...projectForm, members: ids });
                        }}
                        className={cn(
                          "flex items-center gap-2 p-1.5 rounded-full border transition-all",
                          projectForm.members.includes(u.id) 
                            ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black" 
                            : "bg-white dark:bg-white/5 border-neutral-100 dark:border-white/10 text-[#5d5e66] dark:text-white/40"
                        )}
                      >
                        <img src={u.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                        <span className="text-[10px] font-bold pr-2">{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-neutral-100 dark:border-white/10">
                  {saveError && (
                    <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-100 dark:border-red-500/20 flex items-center gap-3">
                      <AlertCircle className="text-red-500 shrink-0" size={16} />
                      <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest leading-normal">
                        {saveError}
                      </p>
                    </div>
                  )}

                  <button 
                    type="button"
                    onClick={handleSaveProject}
                    disabled={isSaving}
                    className={cn(
                      "w-full py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform active:scale-[0.98]",
                      isSaving && "opacity-50 cursor-not-allowed scale-100"
                    )}
                  >
                    {isSaving ? 'Processando (Aguarde)...' : (projectForm.id ? 'Salvar Alterações' : 'Lançar Projeto')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-[#121212] w-full max-w-4xl h-[85vh] rounded-[40px] flex overflow-hidden shadow-2xl border border-black/5 dark:border-white/10"
            >
              {/* Left Column: Comments/Chat */}
              <div className="w-[350px] border-r border-neutral-100 dark:border-white/5 flex flex-col bg-[#fdfcff] dark:bg-white/[0.02]">
                <div className="p-8 border-b border-neutral-100 dark:border-white/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Feed de Colaboração</h4>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                  {selectedTask.comments?.map(comment => {
                    const user = users.find(u => u.id === comment.userId) || currentUser;
                    return (
                      <div key={comment.id} className="flex gap-4">
                        <img src={user.avatar} className="w-8 h-8 rounded-full shrink-0 object-cover" alt="" />
                        <div>
                          <p className="text-[10px] font-bold text-black dark:text-white mb-1">{user.name} <span className="opacity-30 dark:opacity-20 ml-2">{comment.time}</span></p>
                          <p className="text-xs text-[#5d5e66] dark:text-white/40 leading-relaxed font-medium">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 dark:opacity-10 text-center text-black dark:text-white">
                      <MessageSquare size={32} className="mb-4" />
                      <p className="text-[10px] font-bold uppercase">Nenhum comentário</p>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white dark:bg-[#121212] border-t border-neutral-100 dark:border-white/5">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                      placeholder="Adicionar nota..."
                      className="w-full bg-neutral-50 dark:bg-white/5 rounded-xl py-3 pl-4 pr-12 text-sm text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none"
                    />
                    <button 
                      onClick={handleAddComment}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-black dark:text-white hover:scale-110 transition-transform"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Details & Images */}
              <div className="flex-1 p-12 overflow-y-auto scrollbar-hide relative text-black dark:text-white bg-white dark:bg-[#121212]">
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="absolute top-8 right-8 p-3 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>

                <header className="mb-10 pr-12">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest italic">{selectedTask.priority}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">{selectedTask.project}</span>
                  </div>
                  <h3 className="text-4xl font-extrabold tracking-tighter mb-4 text-black dark:text-white">{selectedTask.title}</h3>
                  
                  <div className="flex items-center gap-8 py-6 border-y border-neutral-100 dark:border-white/5 transition-colors">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase text-[#5d5e66] dark:text-white/40 tracking-widest">Responsáveis</p>
                      <div className="flex -space-x-2">
                        {selectedTask.assignees.map(u => (
                          <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#121212] object-cover shadow-sm" alt="" />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase text-[#5d5e66] dark:text-white/40 tracking-widest">Entrega Estipulada</p>
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Calendar size={14} className="text-[#5d5e66] dark:text-white/40" /> {selectedTask.dueDate}
                      </div>
                    </div>
                  </div>
                </header>

                <section className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5d5e66] dark:text-white/40">Imagens de Referência</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTask.images?.map((img, i) => (
                        <div key={i} className="aspect-video rounded-2xl overflow-hidden shadow-sm hover:scale-[1.02] transition-transform cursor-pointer border border-black/5 dark:border-white/5">
                          <img src={img} className="w-full h-full object-cover" alt="" />
                        </div>
                      ))}
                      <button 
                        onClick={() => handleAddImage('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000')}
                        className="aspect-video rounded-2xl border-2 border-dashed border-neutral-100 dark:border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <Camera size={24} className="text-neutral-300 dark:text-white/10 group-hover:text-black dark:group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-bold uppercase text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors">Anexar Captura</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5d5e66] dark:text-white/40">Descrição da Operação</h4>
                    <div className="markdown-body text-sm text-[#5d5e66] dark:text-white/60 leading-relaxed font-medium">
                      {selectedTask.description ? (
                        <ReactMarkdown>{selectedTask.description}</ReactMarkdown>
                      ) : (
                        "Nenhuma descrição detalhada disponível para esta operação."
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1A1A1D] rounded-[32px] p-8 shadow-2xl border border-neutral-100 dark:border-white/10"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="text-red-500" size={28} />
              </div>
              <h3 className="text-xl font-black text-center text-black dark:text-white mb-2 uppercase tracking-tighter">
                Confirmar Exclusão
              </h3>
              <p className="text-sm text-center text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
                Você tem certeza que deseja excluir <span className="font-bold text-black dark:text-white">"{deleteConfirm.title}"</span>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-95 transition-all"
                >
                  Sim, Excluir Agora
                </button>
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="w-full py-4 bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-white/60 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 dark:hover:bg-white/10 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
