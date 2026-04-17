import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Mail, Lock, Cloud, Terminal, Key } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[450px] flex overflow-hidden rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 bg-[#161A1D]/80 backdrop-blur-3xl"
      >
        {/* Form Container */}
        <div className="w-full h-full p-12 flex flex-col justify-center">
          <header className="mb-10 text-center">
            <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-2">Opero</h1>
            <p className="text-[10px] font-bold tracking-[0.4em] text-neutral-500 uppercase">Acesse sua Área de Precisão</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold tracking-widest text-neutral-400 uppercase">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@opero.systems"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-md pl-12 pr-4 text-white text-sm focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-700 outline-none" 
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="text-[9px] font-bold tracking-widest text-neutral-400 uppercase">Chave de Segurança</label>
                <button type="button" className="text-[9px] font-bold text-neutral-600 hover:text-white transition-colors uppercase tracking-widest">Recuperar</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors" size={16} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-md pl-12 pr-4 text-white text-sm focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-700 outline-none"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full h-12 bg-white text-black font-bold text-xs tracking-widest uppercase rounded-md shadow-lg hover:bg-neutral-200 transition-all transform active:scale-[0.98]"
            >
              Autenticar
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] text-neutral-600 font-bold tracking-widest uppercase">
            Novo no opero? <a href="#" className="text-white hover:underline transition-all">Solicite Credenciais</a>
          </p>
        </div>
      </motion.main>
    </div>
  );
}
