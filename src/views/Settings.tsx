import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun, 
  Monitor, 
  ChevronRight, 
  Database, 
  CreditCard, 
  Palette,
  Cloud,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useData } from '../DataContext';
import { useTheme } from 'next-themes';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { currentUser, setCurrentUser, logActivity, showAnimation, setShowAnimation } = useData();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  const handleUpdateProfile = (field: 'name' | 'role', value: string) => {
    if (!value || value === currentUser[field]) return;
    setCurrentUser(prev => ({ ...prev, [field]: value }));
    logActivity('atualizou seu perfil', field === 'name' ? 'nome' : 'cargo', 'SISTEMA');
  };

  const tabs = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'workspace', label: 'Workspace', icon: Database },
    { id: 'billing', label: 'Faturamento', icon: CreditCard },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-full flex gap-8">
      {/* Settings Navigation */}
      <aside className="w-64 shrink-0 space-y-1">
        <h2 className="text-2xl font-black tracking-tighter text-black dark:text-white mb-8 px-2 transition-colors">Configurações</h2>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group",
              activeTab === tab.id 
                ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" 
                : "text-black/60 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <tab.icon size={18} />
            <span className="flex-1 text-left">{tab.label}</span>
            {activeTab === tab.id && <ChevronRight size={14} className="opacity-50" />}
          </button>
        ))}
      </aside>

      {/* Settings Content Area */}
      <main className="flex-1 bg-transparent">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-black dark:text-white">Editar Perfil</h3>
                  <p className="text-xs text-black/40 dark:text-white/40">Dados atualizados há 10 min</p>
                </div>
                
                <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-8">
                  <div className="flex items-center gap-8">
                    <div className="relative group">
                      <img src={currentUser.avatar} className="w-24 h-24 rounded-2xl object-cover shadow-2xl border-4 border-white/50 dark:border-black/50" alt="" />
                      <button className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase">Mudar Foto</button>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-black dark:text-white">{currentUser.name}</h4>
                      <p className="text-sm text-black/40 dark:text-white/40 font-medium">{currentUser.role}</p>
                      <div className="flex gap-2 mt-4">
                        <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold rounded uppercase">Verificado</span>
                        <span className="px-2 py-1 bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold rounded uppercase">Plano Pro</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 pt-8 border-t border-black/5 dark:border-white/5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Nome Completo</label>
                      <input 
                        type="text" 
                        defaultValue={currentUser.name} 
                        onBlur={(e) => handleUpdateProfile('name', e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Cargo Atuante</label>
                      <input 
                        type="text" 
                        defaultValue={currentUser.role} 
                        onBlur={(e) => handleUpdateProfile('role', e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all" 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-red-600 tracking-tight">Encerrar Sessão</h4>
                      <p className="text-[11px] text-red-500/70 font-medium">Desconecte sua conta de todos os dispositivos ativos.</p>
                    </div>
                    <button 
                      onClick={() => supabase.auth.signOut()}
                      className="px-4 py-2 border border-red-500/20 text-red-600 text-[10px] font-bold rounded-lg uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      Sair Agora
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold tracking-tight text-black dark:text-white">Tema e Interface</h3>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { id: 'light', label: 'Modo Claro', icon: Sun, desc: 'Clássico e limpo para o dia' },
                    { id: 'dark', label: 'Modo Escuro', icon: Moon, desc: 'Foco e elegância para a noite' }
                  ].map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "relative flex flex-col items-center gap-4 p-8 rounded-2xl border transition-all hover:scale-105 active:scale-95 group",
                        (theme === t.id)
                          ? "border-black dark:border-white bg-white dark:bg-black shadow-xl -translate-y-1" 
                          : "border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:border-black/20 dark:hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                         "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                         theme === t.id ? "bg-black text-white dark:bg-white dark:text-black" : "bg-white dark:bg-neutral-800 text-black dark:text-white"
                      )}>
                        <t.icon size={24} />
                      </div>
                      <div className="text-center">
                        <span className="text-[11px] font-bold uppercase tracking-widest block mb-1 text-black dark:text-white">{t.label}</span>
                        <span className="text-[10px] text-black/40 dark:text-white/40 font-medium">{t.desc}</span>
                      </div>
                      {theme === t.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center border-4 border-white dark:border-black">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
                  <h4 className="text-sm font-bold tracking-tight mb-4 text-black dark:text-white">Experiência do Espaço de Trabalho</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Palette size={18} className="text-black/40 dark:text-white/40" />
                        <div>
                          <p className="text-sm font-bold text-black dark:text-white">Fundo Animado</p>
                          <p className="text-xs text-black/40 dark:text-white/40 font-medium">Ativar superfície de partículas suaves</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowAnimation(!showAnimation)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative p-1",
                          showAnimation ? "bg-black dark:bg-white" : "bg-black/10 dark:bg-white/10"
                        )}
                      >
                         <motion.div 
                           animate={{ x: showAnimation ? 24 : 0 }}
                           className={cn(
                             "w-4 h-4 rounded-full shadow-sm",
                             showAnimation ? "bg-white dark:bg-black" : "bg-black/40 dark:bg-white/40"
                           )} 
                         />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold tracking-tight">Faturamento</h3>
                <div className="bg-black text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                   <div className="absolute top--20 right--20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                   <div className="relative z-10 flex justify-between items-start">
                     <div>
                       <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">Plano Atual</span>
                       <h4 className="text-3xl font-black tracking-tighter mb-2">Opero Professional</h4>
                       <p className="text-white/40 text-sm font-medium">Próximo faturamento em 12 de Maio, 2024</p>
                     </div>
                     <div className="text-right">
                        <p className="text-4xl font-extrabold tracking-tighter">R$ 49<span className="text-xl opacity-40">/mês</span></p>
                     </div>
                   </div>
                   <div className="mt-8 pt-8 border-t border-white/10 flex gap-4">
                     <button className="px-6 py-2 bg-white text-black text-[10px] font-bold rounded-lg uppercase tracking-widest hover:bg-neutral-100 transition-colors">Gerenciar Assinatura</button>
                     <button className="px-6 py-2 border border-white/20 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest hover:bg-white/5 transition-colors">Histórico</button>
                   </div>
                </div>
              </div>
            )}

            {/* Other tabs placeholder */}
            {['notifications', 'security', 'workspace'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
                <Database size={48} className="mb-4" />
                <h3 className="text-lg font-bold">Em breve</h3>
                <p className="text-sm max-w-xs mx-auto">Estamos refinando esta seção para trazer o máximo de precisão em sua configuração.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
