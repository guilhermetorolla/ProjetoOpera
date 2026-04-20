import React, { useState } from 'react';
import { Search, Bell, Grid, User, Menu, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useData } from '../DataContext';
import { motion, AnimatePresence } from 'motion/react';

interface TopbarProps {
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;
  isVisible?: boolean;
  onViewChange: (v: string) => void;
  activeView: string;
}

export default function Topbar({ 
  isSidebarVisible, 
  onToggleSidebar, 
  isVisible = true, 
  onViewChange, 
  activeView 
}: TopbarProps) {
  const { activities, logActivity } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className={cn(
      "flex items-center justify-between px-8 h-16 bg-transparent sticky top-0 z-40 transition-all duration-500 w-full",
      !isVisible && "-translate-y-full opacity-0"
    )}>
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button 
          onClick={onToggleSidebar}
          className="p-2 text-black/60 hover:text-black transition-colors lg:mr-2"
        >
          {isSidebarVisible ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-black transition-colors" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar tarefas, membros ou projetos..."
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-black focus:ring-1 focus:ring-black/20 transition-all placeholder:text-neutral-500 focus:bg-white/90"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "p-2 transition-colors relative",
              showNotifications ? "text-black" : "text-black/60 hover:text-black"
            )}
          >
            <Bell size={18} />
            {activities.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1a1b22]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-100 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-neutral-50 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#5d5e66]">Notificações</h4>
                    <span className="text-[10px] font-bold text-black bg-neutral-100 px-2 py-0.5 rounded-full">{activities.length}</span>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {activities.length > 0 ? (
                      activities.map(act => (
                        <div key={act.id} className="p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-50 flex gap-3">
                          <img src={act.user.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                          <div>
                            <p className="text-xs">
                              <span className="font-bold">{act.user.name}</span> {act.action} <span className="font-bold">{act.target}</span>
                            </p>
                            <span className="text-[10px] text-neutral-400">{act.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center">
                        <Check className="mx-auto text-neutral-200 mb-2" size={32} />
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tudo limpo!</p>
                      </div>
                    )}
                  </div>
                  <button className="w-full py-3 text-[10px] font-bold text-[#5d5e66] uppercase tracking-widest hover:bg-neutral-50 transition-colors">
                    Ver Tudo
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button className="p-2 text-black/60 hover:text-black transition-colors">
          <Grid size={18} />
        </button>
        <button 
          onClick={() => {
            if (activeView !== 'projects') {
              onViewChange('projects');
              logActivity('acionou atalho de', 'Projeto', 'SISTEMA');
            } else {
              logActivity('acionou', 'Ação Rápida', 'SISTEMA');
            }
          }}
          className="bg-white text-black px-4 py-1.5 rounded-md text-sm font-bold hover:bg-neutral-200 transition-colors"
        >
          Ação Rápida
        </button>
      </div>
    </header>
  );
}
