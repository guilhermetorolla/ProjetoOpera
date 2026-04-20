import React from 'react';
import { motion } from 'motion/react';
import { User, Bell, Shield, Smartphone, Globe, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';
import { useData } from '../DataContext';

export default function Settings() {
  const { currentUser, setCurrentUser, logActivity } = useData();

  const handleUpdateProfile = (field: 'name' | 'role', value: string) => {
    setCurrentUser(prev => ({ ...prev, [field]: value }));
    logActivity('atualizou seu perfil', field === 'name' ? 'nome' : 'cargo', 'SISTEMA');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-12 max-w-4xl mx-auto space-y-12 pb-32"
    >
      <header>
        <h2 className="text-4xl font-extrabold tracking-tighter text-black">Configurações</h2>
        <p className="text-[#5d5e66] mt-2 font-medium">Gerencie sua conta e preferências de workspace.</p>
      </header>

      <div className="space-y-8">
        {/* Profile */}
        <section className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm space-y-8">
          <div className="flex items-center gap-6">
            <img src={currentUser.avatar} className="w-20 h-20 rounded-2xl object-cover shadow-xl" alt="" />
            <div>
              <h3 className="text-xl font-bold">{currentUser.name}</h3>
              <p className="text-sm text-[#5d5e66]">{currentUser.role}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-neutral-50">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Nome de Exibição</label>
              <input 
                type="text" 
                defaultValue={currentUser.name} 
                onBlur={(e) => handleUpdateProfile('name', e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-black outline-none transition-all" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66]">Cargo / Função</label>
              <input 
                type="text" 
                defaultValue={currentUser.role} 
                onBlur={(e) => handleUpdateProfile('role', e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-black outline-none transition-all" 
              />
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="grid grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Monitor size={18} className="text-black" />
              <h3 className="text-sm font-bold tracking-tight">Aparência</h3>
            </div>
            <div className="flex gap-4">
              {[
                { id: 'light', label: 'Claro', icon: Sun },
                { id: 'dark', label: 'Escuro', icon: Moon },
                { id: 'system', label: 'Sistema', icon: Monitor }
              ].map(theme => (
                <button key={theme.id} className={cn(
                  "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  theme.id === 'system' ? "border-black bg-neutral-50" : "border-neutral-100 hover:border-black"
                )}>
                  <theme.icon size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Bell size={18} className="text-black" />
              <h3 className="text-sm font-bold tracking-tight">Notificações</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'E-mails de resumo diário', active: true },
                { label: 'Push para novas tarefas', active: true },
                { label: 'Menções em documentos', active: false }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-medium">{item.label}</span>
                  <div className={cn(
                    "w-8 h-4 rounded-full relative transition-colors cursor-pointer",
                    item.active ? "bg-black" : "bg-neutral-200"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-2 h-2 rounded-full bg-white transition-all",
                      item.active ? "right-1" : "left-1"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-50 p-8 rounded-2xl border border-red-100 space-y-4">
          <h3 className="text-sm font-bold text-red-600 tracking-tight">Zona de Risco</h3>
          <p className="text-xs text-red-500 font-medium">Cuidado: essas ações são irreversíveis e afetarão todo o seu workspace.</p>
          <div className="flex gap-4 pt-2">
            <button className="px-4 py-2 bg-red-600 text-white text-[10px] font-bold rounded-md uppercase tracking-widest hover:bg-red-700 transition-colors">Sair da Conta</button>
            <button className="px-4 py-2 border border-red-200 text-red-600 text-[10px] font-bold rounded-md uppercase tracking-widest hover:bg-red-100 transition-colors">Excluir Workspace</button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
