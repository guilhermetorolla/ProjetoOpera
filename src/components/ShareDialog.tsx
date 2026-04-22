import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, User, Shield, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { User as UserType } from '../types';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserType[];
  onShare: (userId: string, permission: 'view' | 'edit') => void;
  currentShares: any[];
}

export default function ShareDialog({ isOpen, onClose, users, onShare, currentShares }: ShareDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'edit'>('view');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#121212] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-black/5 dark:border-white/10"
          >
            <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-neutral-50/50 dark:bg-white/5 transition-colors">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-black dark:text-white">Compartilhar Documento</h3>
                <p className="text-xs text-black/40 dark:text-white/40 font-medium">Convide funcionários para colaborar neste arquivo.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black dark:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Search and Invite */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20 dark:text-white/20" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar funcionário por nome ou e-mail..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all placeholder:text-black/20 dark:placeholder:text-white/20"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {filteredUsers.length > 0 ? filteredUsers.map(user => {
                    const isAlreadyShared = currentShares.some(s => s.user_id === user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} className="w-8 h-8 rounded-full object-cover border border-black/5 dark:border-white/10" alt="" />
                          <div>
                            <p className="text-xs font-bold text-black dark:text-white transition-colors">{user.name}</p>
                            <p className="text-[10px] text-black/40 dark:text-white/40 font-medium transition-colors">{user.role}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           <select 
                             className="text-[10px] font-bold uppercase tracking-wider bg-transparent text-black dark:text-white outline-none cursor-pointer transition-colors"
                             value={selectedPermission}
                             onChange={(e) => setSelectedPermission(e.target.value as any)}
                           >
                             <option value="view" className="dark:bg-[#121212]">Ver</option>
                             <option value="edit" className="dark:bg-[#121212]">Editar</option>
                           </select>
                           <button 
                             disabled={isAlreadyShared}
                             onClick={() => onShare(user.id, selectedPermission)}
                             className={cn(
                               "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                               isAlreadyShared 
                                 ? "bg-green-500/10 text-green-600 dark:text-green-400 cursor-default" 
                                 : "bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95"
                             )}
                           >
                             {isAlreadyShared ? 'Compartilhado' : 'Convidar'}
                           </button>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-center py-4 text-xs font-medium text-black/40 dark:text-white/40 transition-colors">Nenhum funcionário encontrado.</p>
                  )}
                </div>
              </div>

              {/* Shared List */}
              <div className="space-y-4 pt-6 border-t border-black/5 dark:border-white/10">
                <h4 className="text-[10px] font-bold uppercase tracking-[.2em] text-black/40 dark:text-white/40">Quem tem acesso</h4>
                <div className="space-y-3">
                   {currentShares.length > 0 ? currentShares.map((share, i) => {
                     const user = users.find(u => u.id === share.user_id);
                     return (
                       <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback`} className="w-8 h-8 rounded-full object-cover border border-black/5 dark:border-white/10" alt="" />
                           <div>
                             <p className="text-xs font-bold text-black dark:text-white transition-colors">{user?.name || 'Funcionário Externo'}</p>
                             <p className="text-[10px] text-black/40 dark:text-white/40 font-medium capitalize transition-colors">{share.permission === 'edit' ? 'Editor' : 'Visualizador'}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-black/40 dark:text-white/40 transition-colors">
                            <Shield size={12} />
                            <span className="uppercase tracking-widest">Acesso Ativo</span>
                         </div>
                       </div>
                     );
                   }) : (
                     <p className="text-xs font-medium text-black/40 dark:text-white/40 transition-colors italic">Este arquivo é privado para o workspace.</p>
                   )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-neutral-50/50 dark:bg-white/5 flex items-center justify-between gap-4 transition-colors">
               <div className="flex items-center gap-2 text-black/40 dark:text-white/40 transition-colors">
                  <Shield size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Criptografia Ponta-a-Ponta</span>
               </div>
               <button 
                 onClick={onClose}
                 className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
               >
                 Concluir
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
