import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Configuração do Supabase não detectada. Por favor, configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no AI Studio.');
      }

      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError('Verifique seu e-mail para confirmar o cadastro!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-20">
      <motion.main 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-[32px] border border-white/10 bg-neutral-900/60 backdrop-blur-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]"
      >
        {/* Decorative inner glow */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.05] to-transparent" />
        
        <div className="w-full h-full p-12 flex flex-col justify-center relative z-10">
          <header className="mb-12 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-black tracking-tighter text-white mb-3"
            >
              Opero
            </motion.h1>
            <p className="text-[9px] font-black tracking-[0.5em] text-white/30 uppercase">Sistemas de Alta Precisão</p>
            {(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-500 uppercase tracking-widest"
              >
                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                Aguardando Configuração do Terminal
              </motion.div>
            )}
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold uppercase tracking-wider"
              >
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-3">
              <label className="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase ml-1">Credencial de Acesso</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ID da Estação"
                  className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 text-white text-sm focus:bg-white/[0.07] focus:border-white/20 focus:ring-0 transition-all placeholder:text-white/10 outline-none" 
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline px-1">
                <label className="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">Assinatura Digital</label>
                {!isRegistering && (
                  <button type="button" className="text-[9px] font-black text-white/20 hover:text-white transition-colors uppercase tracking-widest">Recuperar</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={16} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 text-white text-sm focus:bg-white/[0.07] focus:border-white/20 focus:ring-0 transition-all placeholder:text-white/10 outline-none"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-white text-black font-black text-[11px] tracking-[0.2em] uppercase rounded-2xl shadow-[0_8px_24px_rgba(255,255,255,0.1)] hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : (isRegistering ? 'Criação de Nodo' : 'Iniciar Sequência')}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="text-[9px] font-black text-white/40 hover:text-white transition-colors uppercase tracking-[0.3em] flex items-center gap-2"
            >
              <Loader2 size={12} className={cn(loading && "animate-spin")} /> Reinciciar Terminal de Dados
            </button>
            <p className="text-center text-[10px] text-[#a0a0a0] font-bold tracking-widest uppercase">
              {isRegistering ? 'Protocolo existente?' : 'Novo Terminal?'} 
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-white hover:text-white/70 transition-all ml-2 underline underline-offset-4 decoration-white/20"
              >
                {isRegistering ? 'Retornar' : 'Solicitar Token'}
              </button>
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
