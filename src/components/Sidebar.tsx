import React from 'react';
import { 
  LayoutDashboard, 
  GitBranch, 
  Calendar, 
  BarChart3, 
  FileText, 
  Settings, 
  Plus, 
  HelpCircle, 
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useData } from '../DataContext';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export default function Sidebar({ activeView, onViewChange, isVisible, onToggle }: SidebarProps) {
  const { currentUser, logActivity } = useData();
  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'projects', label: 'Projetos', icon: GitBranch },
    { id: 'resource_map', label: 'Mapa de Recursos', icon: UserIcon },
    { id: 'schedule', label: 'Agendamento', icon: Calendar },
    { id: 'analytics', label: 'Análises', icon: BarChart3 },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full border-r border-black/5 dark:border-white/10 bg-white/0 backdrop-blur-sm flex flex-col p-4 z-50 transition-all duration-300 ease-in-out overflow-hidden shadow-2xl",
      isVisible ? "w-64" : "w-20"
    )}>
      {isVisible && (
        <div className="mb-8 px-2 flex items-center justify-between transition-all duration-300">
          <div className="opacity-100 visible">
            <h1 className="text-2xl font-extrabold tracking-tighter text-black dark:text-white">Opero</h1>
            <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 font-bold mt-1">Workspace</p>
          </div>
        </div>
      )}

      <nav className={cn("flex-1 space-y-1", !isVisible && "mt-4")}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            title={!isVisible ? item.label : undefined}
            className={cn(
              "w-full flex items-center gap-3 py-2 rounded-md font-medium text-sm transition-all duration-200",
              isVisible ? "px-4" : "px-0 justify-center",
              activeView === item.id 
                ? "bg-black text-white dark:bg-white dark:text-black shadow-sm" 
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <item.icon size={18} className="shrink-0" />
            <span className={cn(
              "transition-all duration-300 whitespace-nowrap",
              !isVisible ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className={cn("pt-4 mt-4 border-t border-black/5 dark:border-white/10", !isVisible && "px-0 pb-4")}>
        <button 
          onClick={() => {
            onViewChange('projects');
            logActivity('iniciou rascunho de', 'Nova Página', 'SISTEMA');
          }}
          className={cn(
            "flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black rounded-md text-sm font-medium transition-all active:scale-95 shadow-lg",
            isVisible ? "w-full py-2.5 px-4" : "w-10 h-10 mx-auto p-0"
          )}
          title={!isVisible ? "Nova Página" : undefined}
        >
          <Plus size={16} /> 
          <span className={cn(
            "transition-all duration-300 whitespace-nowrap",
            !isVisible ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            Nova Página
          </span>
        </button>
      </div>

      {isVisible && (
        <div className="mt-auto space-y-1 transition-all duration-300">
          <button 
            onClick={() => alert('Suporte Opero: Encaminhando para central de ajuda...')}
            className="w-full px-4 py-2 flex items-center gap-3 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white text-sm font-medium transition-colors"
          >
            <HelpCircle size={18} className="shrink-0" /> 
            <span>Suporte</span>
          </button>
          
          <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 gap-3 px-4 py-3 mt-4 group relative">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold truncate text-black dark:text-white">{currentUser.name}</p>
              <p className="text-[10px] text-black/40 dark:text-white/40 truncate">{currentUser.role}</p>
            </div>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-all text-black/40 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
