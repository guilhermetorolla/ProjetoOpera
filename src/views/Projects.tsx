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
  Trash2
} from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';
import { Status, Project, Task, Priority, User, Comment } from '../types';

const columns: { id: Status; label: string; color: string }[] = [
  { id: 'Pendente', label: 'A Fazer', color: '#5d5e66' },
  { id: 'Em Progresso', label: 'Em Progresso', color: '#000000' },
  { id: 'Resolvido', label: 'Revisão', color: '#5d5e66' },
  { id: 'Concluído', label: 'Concluído', color: '#10b981' },
];

const TaskCard = React.memo(({ task, onDragStart, onClick, openEditTask, handleDeleteTask }: { 
  task: Task, 
  onDragStart: (e: any, id: string) => void, 
  onClick: () => void,
  openEditTask: (t: Task) => void,
  handleDeleteTask: (id: string, e: any) => void
}) => {
  return (
    <motion.div
      layout
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className="bg-white/40 backdrop-blur-md p-5 rounded-xl shadow-[0_4px_12px_-2px_rgba(0,0,0,0.03)] border border-neutral-100 hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] transition-all cursor-grab active:cursor-grabbing group"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={cn(
          "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-[4px]",
          task.priority === 'Urgente' ? "bg-red-50 text-red-600" : 
          task.priority === 'Alta' ? "bg-amber-50 text-amber-600" :
          "bg-neutral-100 text-[#5d5e66]"
        )}>
          {task.priority}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); openEditTask(task); }}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            <MoreHorizontal size={12} />
          </button>
          <button 
            onClick={(e) => handleDeleteTask(task.id, e)}
            className="p-1 hover:bg-red-50 text-red-500 rounded"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <h4 className="text-sm font-bold text-black mb-1 leading-snug">{task.title}</h4>
      <p className="text-[10px] text-[#5d5e66] mb-4">{task.dueDate}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[#5d5e66]/60">
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
        </div>
        
        <div className="flex -space-x-1.5">
          {task.assignees.map(u => (
            <img key={u.id} src={u.avatar} className="w-6 h-6 rounded-full border-2 border-white object-cover" alt="" title={u.name} />
          ))}
        </div>
      </div>
    </motion.div>
  );
});

export default function Projects() {
  const { 
    projects: localProjects, 
    setProjects: setLocalProjects, 
    tasks: localTasks, 
    setTasks: setLocalTasks,
    users,
    currentUser,
    logActivity
  } = useData();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Modals visibility
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // New/Edit Task Form State
  const [taskForm, setTaskForm] = useState({
    id: '',
    title: '',
    description: '',
    priority: 'Média' as Priority,
    assignees: [] as string[],
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pendente' as Status
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
  const handleSaveProject = () => {
    if (projectForm.id) {
      // Update
      const updated = localProjects.map(p => p.id === projectForm.id ? {
        ...p,
        name: projectForm.name,
        description: projectForm.description,
        type: projectForm.type,
        status: projectForm.status,
        members: users.filter(u => projectForm.members.includes(u.id))
      } : p);
      setLocalProjects(updated);
      logActivity('atualizou o projeto', projectForm.name, 'GESTÃO');
    } else {
      // Create
      const newP: Project = {
        id: `p-${Date.now()}`,
        name: projectForm.name || 'Novo Projeto',
        description: projectForm.description,
        type: projectForm.type,
        status: projectForm.status,
        progress: 0,
        burnRate: '$0',
        members: users.filter(u => projectForm.members.includes(u.id)),
        riskProfile: [{ label: 'Novo', level: 'low' }]
      };
      setLocalProjects([...localProjects, newP]);
      logActivity('criou o projeto', newP.name, 'GESTÃO');
    }
    setIsProjectModalOpen(false);
    setProjectToEdit(null);
    setProjectForm({ id: '', name: '', description: '', type: 'GERAL', status: 'Em Andamento', members: [] });
  };

  const handleDeleteProject = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Deseja realmente excluir este projeto e todas as suas tarefas?')) {
      setLocalProjects(localProjects.filter(p => p.id !== id));
      setLocalTasks(localTasks.filter(t => t.projectId !== id));
      if (selectedProjectId === id) setSelectedProjectId(null);
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
  const handleSaveTask = () => {
    if (!selectedProjectId || !selectedProject) return;

    if (taskForm.id) {
      // Update
      const updated = localTasks.map(t => t.id === taskForm.id ? {
        ...t,
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        assignees: users.filter(u => taskForm.assignees.includes(u.id)),
        dueDate: taskForm.dueDate,
        status: taskForm.status
      } : t);
      setLocalTasks(updated);
      logActivity('atualizou a tarefa', taskForm.title, 'OPERACIONAL');
    } else {
      // Create
      const task: Task = {
        id: `t-${Date.now()}`,
        title: taskForm.title || 'Nova Tarefa',
        description: taskForm.description,
        project: selectedProject.name,
        projectId: selectedProjectId,
        status: taskForm.status,
        priority: taskForm.priority,
        assignees: users.filter(u => taskForm.assignees.includes(u.id)),
        dueDate: taskForm.dueDate,
        comments: [],
        images: []
      };
      setLocalTasks([...localTasks, task]);
      logActivity('adicionou a tarefa', task.title, 'OPERACIONAL', [task.priority]);
    }
    
    setIsTaskModalOpen(false);
    setTaskForm({ id: '', title: '', description: '', priority: 'Média', assignees: [], dueDate: new Date().toISOString().split('T')[0], status: 'Pendente' });
  };

  const openEditTask = useCallback((t: Task) => {
    setTaskForm({
      id: t.id,
      title: t.title,
      description: t.description || '',
      priority: t.priority,
      assignees: t.assignees.map(u => u.id),
      dueDate: t.dueDate,
      status: t.status
    });
    setIsTaskModalOpen(true);
  }, []);

  const handleDeleteTask = useCallback((taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Excluir esta tarefa?')) {
      setLocalTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTask?.id === taskId) setSelectedTask(null);
    }
  }, [selectedTask]);

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

  const handleUpdateTaskStatus = (taskId: string, newStatus: Status) => {
    const updatedTasks = localTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    setLocalTasks(updatedTasks);
  };

  // Drag and Drop handlers
  const onDragStart = useCallback((e: React.DragEvent | any, taskId: string) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('taskId', taskId);
      e.dataTransfer.effectAllowed = 'move';
    }
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    handleUpdateTaskStatus(taskId, status);
  };

  if (!selectedProjectId) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-full bg-transparent p-12 overflow-y-auto scrollbar-hide"
      >
        <header className="mb-12">
          <nav className="flex items-center gap-2 text-[10px] font-bold text-[#5d5e66] tracking-widest uppercase mb-2">
            <span>Opero</span>
            <span className="opacity-30">/</span>
            <span className="text-black">Portfólio de Projetos</span>
          </nav>
          <div className="flex justify-between items-end">
            <h2 className="text-5xl font-extrabold tracking-tighter text-black">Hub de Iniciativas</h2>
            <button 
              onClick={() => {
                setProjectToEdit(null);
                setProjectForm({ id: '', name: '', description: '', type: 'GERAL', status: 'Em Andamento', members: [] });
                setIsProjectModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white text-xs font-bold transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
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
              className="bg-white/40 backdrop-blur-xl p-8 rounded-[32px] border border-neutral-100 shadow-sm cursor-pointer hover:shadow-2xl transition-all group relative"
            >
              <div className="flex justify-between items-start mb-8">
                <span className="text-[10px] font-bold text-[#5d5e66] bg-neutral-100 px-3 py-1 rounded-full uppercase tracking-widest">{project.type}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => openEditProject(project, e)}
                    className="p-2 hover:bg-neutral-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    project.status === 'Bloqueado' ? "bg-red-500 animate-pulse" : "bg-emerald-400"
                  )} />
                </div>
              </div>
              
              <h3 className="text-2xl font-extrabold tracking-tight mb-2 group-hover:text-black transition-colors">{project.name}</h3>
              <p className="text-xs text-[#5d5e66] leading-relaxed mb-8 line-clamp-2">{project.description}</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-[#5d5e66] uppercase">
                    <span>Progresso</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-neutral-50 rounded-full overflow-hidden">
                    <div className="h-full bg-black transition-all duration-1000" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                  <div className="flex -space-x-2">
                    {users.slice(0, 3).map(u => (
                      <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-black font-bold text-xs uppercase tracking-tighter">
                    Gerenciar Tasks <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-transparent overflow-hidden"
    >
      {/* Kanban Header */}
      <div className="px-8 py-6 flex items-end justify-between shrink-0 glass-panel border-none rounded-none m-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setSelectedProjectId(null)}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-bold text-[#5d5e66] tracking-widest uppercase mb-1">
              <span>Portfólio</span>
              <span className="opacity-30">/</span>
              <span className="text-black font-black">{selectedProject?.name}</span>
            </nav>
            <h2 className="text-3xl font-extrabold tracking-tighter text-black uppercase">Quadro de Operação</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-4">
            {selectedProject?.members?.map(m => (
              <img key={m.id} src={m.avatar} className="w-8 h-8 rounded-full border-2 border-[#fbf8ff] object-cover" alt="" title={m.name} />
            ))}
            {!selectedProject?.members && users.slice(0, 3).map(u => (
              <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-[#fbf8ff] object-cover" alt="" title={u.name} />
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-[#fbf8ff] bg-neutral-100 flex items-center justify-center text-[10px] font-bold">+5</div>
          </div>
          <button 
            onClick={() => openEditProject(selectedProject!)}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors mr-2"
            title="Editar Projeto"
          >
            <MoreHorizontal size={20} />
          </button>
          <button 
            onClick={() => handleDeleteProject(selectedProjectId!)}
            className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors mr-4"
            title="Excluir Projeto"
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={() => {
              setTaskForm({ id: '', title: '', description: '', priority: 'Média', assignees: [], dueDate: new Date().toISOString().split('T')[0], status: 'Pendente' });
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-black text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus size={14} /> Nova Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-8 pt-0 scrollbar-hide bg-transparent">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map(col => (
            <div 
              key={col.id} 
              className="w-80 flex flex-col h-full bg-white/5 backdrop-blur-sm rounded-3xl p-4 overflow-hidden"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.id)}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <h3 className="text-[10px] font-extrabold text-black uppercase tracking-widest">{col.label}</h3>
                  <span className="bg-neutral-100 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#5d5e66]">
                    {projectTasks.filter(t => t.status === col.id).length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide pb-10">
                {projectTasks.filter(t => t.status === col.id).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={onDragStart}
                    onClick={() => setSelectedTask(task)}
                    openEditTask={openEditTask}
                    handleDeleteTask={handleDeleteTask}
                  />
                ))}
                
                {projectTasks.filter(t => t.status === col.id).length === 0 && (
                  <div className="h-20 border-2 border-dashed border-neutral-100 rounded-xl flex items-center justify-center opacity-30">
                    <p className="text-[8px] font-bold uppercase tracking-widest">Sem tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
              className="bg-white w-full max-w-xl rounded-[40px] p-12 relative shadow-2xl"
            >
              <button 
                onClick={() => setIsTaskModalOpen(false)}
                className="absolute top-8 right-8 p-3 hover:bg-neutral-50 rounded-full transition-colors"
              >
                <X size={24} />
              </button>

              <header className="mb-12">
                <nav className="text-[10px] font-bold text-[#5d5e66] tracking-widest uppercase mb-2">Engenharia / {taskForm.id ? 'Editar' : 'Nova'} Operação</nav>
                <h3 className="text-4xl font-extrabold tracking-tighter">{taskForm.id ? 'Refinar' : 'Criar'} Tarefa Técnica</h3>
              </header>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Título da Task</label>
                  <input 
                    type="text" 
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-black outline-none" 
                    placeholder="Ex: Auditoria de Segurança Q4"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Prioridade</label>
                    <select 
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as Priority })}
                      className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none appearance-none"
                    >
                      <option>Baixa</option>
                      <option>Média</option>
                      <option>Alta</option>
                      <option>Urgente</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Entrega Final</label>
                    <input 
                      type="date" 
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-black outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Designar Responsáveis</label>
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
                            ? "bg-black border-black text-white" 
                            : "bg-white border-neutral-100 text-[#5d5e66]"
                        )}
                      >
                        <img src={u.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                        <span className="text-[10px] font-bold pr-2">{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-neutral-100">
                  <button 
                    onClick={handleSaveTask}
                    className="w-full py-4 bg-black text-white text-[10px] font-bold rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform active:scale-[0.98]"
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
              className="bg-white w-full max-w-xl rounded-[40px] p-12 relative shadow-2xl"
            >
              <button 
                onClick={() => setIsProjectModalOpen(false)}
                className="absolute top-8 right-8 p-3 hover:bg-neutral-50 rounded-full transition-colors"
              >
                <X size={24} />
              </button>

              <header className="mb-12">
                <nav className="text-[10px] font-bold text-[#5d5e66] tracking-widest uppercase mb-2">Opero / {projectForm.id ? 'Editar' : 'Novo'} Projeto</nav>
                <h3 className="text-4xl font-extrabold tracking-tighter">{projectForm.id ? 'Refinar' : 'Lançar'} Iniciativa</h3>
              </header>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Nome da Iniciativa</label>
                  <input 
                    type="text" 
                    value={projectForm.name}
                    onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-1 focus:ring-black outline-none" 
                    placeholder="Ex: Expansão EMEA 2025"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Descrição Estratégica</label>
                  <textarea 
                    value={projectForm.description}
                    onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-1 focus:ring-black outline-none h-24" 
                    placeholder="Descreva o objetivo fundamental deste projeto..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Categoria</label>
                    <select 
                      value={projectForm.type}
                      onChange={e => setProjectForm({ ...projectForm, type: e.target.value })}
                      className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-bold outline-none"
                    >
                      <option>INFRA</option>
                      <option>SECURITY</option>
                      <option>DESIGN</option>
                      <option>OTIMIZAÇÃO</option>
                      <option>GERAL</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Estado Inicial</label>
                    <select 
                      value={projectForm.status}
                      onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                      className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-sm font-bold outline-none"
                    >
                      <option>Em Andamento</option>
                      <option>Planejamento</option>
                      <option>Bloqueado</option>
                      <option>Concluído</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Recrutar Membros</label>
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
                            ? "bg-black border-black text-white" 
                            : "bg-white border-neutral-100 text-[#5d5e66]"
                        )}
                      >
                        <img src={u.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                        <span className="text-[10px] font-bold pr-2">{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-neutral-100">
                  <button 
                    onClick={handleSaveProject}
                    className="w-full py-4 bg-black text-white text-[10px] font-bold rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform active:scale-[0.98]"
                  >
                    {projectForm.id ? 'Salvar Alterações' : 'Lançar Projeto'}
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
              className="bg-white w-full max-w-4xl h-[85vh] rounded-[40px] flex overflow-hidden shadow-2xl"
            >
              {/* Left Column: Comments/Chat */}
              <div className="w-[350px] border-r border-neutral-100 flex flex-col bg-[#fdfcff]">
                <div className="p-8 border-b border-neutral-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Feed de Colaboração</h4>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                  {selectedTask.comments?.map(comment => {
                    const user = users.find(u => u.id === comment.userId) || currentUser;
                    return (
                      <div key={comment.id} className="flex gap-4">
                        <img src={user.avatar} className="w-8 h-8 rounded-full shrink-0 object-cover" alt="" />
                        <div>
                          <p className="text-[10px] font-bold text-black mb-1">{user.name} <span className="opacity-30 ml-2">{comment.time}</span></p>
                          <p className="text-xs text-[#5d5e66] leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                      <MessageSquare size={32} className="mb-4" />
                      <p className="text-[10px] font-bold uppercase">Nenhum comentário</p>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white border-t border-neutral-100">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                      placeholder="Adicionar nota..."
                      className="w-full bg-neutral-50 rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-1 focus:ring-black outline-none"
                    />
                    <button 
                      onClick={handleAddComment}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-black hover:scale-110 transition-transform"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Details & Images */}
              <div className="flex-1 p-12 overflow-y-auto scrollbar-hide relative">
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="absolute top-8 right-8 p-3 hover:bg-neutral-50 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>

                <header className="mb-10 pr-12">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-black text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest italic">{selectedTask.priority}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">{selectedTask.project}</span>
                  </div>
                  <h3 className="text-4xl font-extrabold tracking-tighter mb-4">{selectedTask.title}</h3>
                  
                  <div className="flex items-center gap-8 py-6 border-y border-neutral-100">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase text-[#5d5e66] tracking-widest">Responsáveis</p>
                      <div className="flex -space-x-2">
                        {selectedTask.assignees.map(u => (
                          <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" alt="" />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase text-[#5d5e66] tracking-widest">Entrega Estipulada</p>
                      <div className="flex items-center gap-2 text-sm font-bold text-black">
                        <Calendar size={14} /> {selectedTask.dueDate}
                      </div>
                    </div>
                  </div>
                </header>

                <section className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5d5e66]">Imagens de Referência</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTask.images?.map((img, i) => (
                        <div key={i} className="aspect-video rounded-2xl overflow-hidden shadow-sm hover:scale-[1.02] transition-transform cursor-pointer">
                          <img src={img} className="w-full h-full object-cover" alt="" />
                        </div>
                      ))}
                      <button 
                        onClick={() => handleAddImage('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000')}
                        className="aspect-video rounded-2xl border-2 border-dashed border-neutral-100 flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 transition-colors group"
                      >
                        <Camera size={24} className="text-neutral-300 group-hover:text-black transition-colors" />
                        <span className="text-[10px] font-bold uppercase text-neutral-400 group-hover:text-black">Anexar Captura</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5d5e66]">Descrição da Operação</h4>
                    <p className="text-sm text-[#5d5e66] leading-relaxed font-medium">
                      Otimização do cluster de microserviços focada em reduzir a latência de handshake nos hubs de Singapura e Londres. Requer auditoria dos logs de rede da última sprint.
                    </p>
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
