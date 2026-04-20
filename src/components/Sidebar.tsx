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
      "fixed left-0 top-0 h-full w-64 border-r border-white/10 bg-white/5 backdrop-blur-2xl flex flex-col p-4 z-50 transition-transform duration-300",
      !isVisible && "-translate-x-full"
    )}>
      <div className="mb-8 px-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tighter text-black">Opero</h1>
          <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold mt-1">Workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200",
              activeView === item.id 
                ? "bg-white text-black shadow-sm border-l-4 border-black" 
                : "text-black/60 hover:text-black hover:bg-black/5"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="pt-4 mt-4 border-t border-white/5">
        <button 
          onClick={() => {
            onViewChange('projects');
            logActivity('iniciou rascunho de', 'Nova Página', 'SISTEMA');
          }}
          className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-md text-sm font-medium transition-transform active:scale-95 shadow-lg"
        >
          <Plus size={16} /> Nova Página
        </button>
      </div>

      <div className="mt-auto space-y-1">
        <button 
          onClick={() => alert('Suporte Opero: Encaminhando para central de ajuda...')}
          className="w-full flex items-center gap-3 px-4 py-2 text-black/60 hover:text-black text-sm font-medium transition-colors"
        >
          <HelpCircle size={18} /> Suporte
        </button>
        
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl mt-4 border border-white/5 group relative">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold truncate text-black">{currentUser.name}</p>
            <p className="text-[10px] text-black/40 truncate">{currentUser.role}</p>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="p-1.5 hover:bg-black/10 rounded-md transition-all text-black/40 hover:text-red-600"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
