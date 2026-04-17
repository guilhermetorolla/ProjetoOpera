import React from 'react';
import { motion } from 'motion/react';
import { 
  History, 
  Info, 
  Check, 
  Plus, 
  GripVertical, 
  FileImage, 
  Type, 
  Code, 
  Quote, 
  ExternalLink 
} from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';

export default function Editor() {
  const { users, logActivity } = useData();

  const handleSave = () => {
    logActivity('salvou alterações em', 'Arquitetura de Produto', 'DOCUMENTAÇÃO');
  };
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto pt-24 pb-32 px-12 lg:px-24"
    >
      {/* Page Header */}
      <div className="mb-16 group relative">
        <div className="flex items-center gap-4 mb-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="flex items-center gap-1.5 text-[10px] font-bold text-[#5d5e66] uppercase tracking-widest hover:text-black">
            <Plus size={14} /> Adicionar Ícone
          </button>
          <button className="flex items-center gap-1.5 text-[10px] font-bold text-[#5d5e66] uppercase tracking-widest hover:text-black">
            <Plus size={14} /> Adicionar Capa
          </button>
        </div>
        
        <h1 className="text-6xl font-extrabold tracking-tighter text-black leading-[1.1] mb-6 outline-none" contentEditable suppressContentEditableWarning>
          Arquitetura de Produto & Estratégia 2024
        </h1>

        <div className="flex items-center gap-6 text-[#5d5e66] text-sm">
          <div className="flex items-center gap-2">
            <History size={16} />
            <span className="font-medium">Editado há 2h</span>
          </div>
          <div className="flex -space-x-3">
             {users.slice(1, 4).map(u => (
               <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-[#fbf8ff] object-cover" alt="" />
             ))}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="space-y-10 group/editor">
        {/* Paragraph */}
        <div className="relative group/block px-4 -mx-4 rounded-xl hover:bg-neutral-50 transition-colors py-2">
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity">
            <button className="text-neutral-300 hover:text-black">
              <Plus size={18} />
            </button>
          </div>
          <p className="text-xl leading-relaxed text-[#1a1b22] outline-none" contentEditable suppressContentEditableWarning>
            Este documento descreve a filosofia estrutural central para o próximo lançamento do Opero. Estamos avançando em direção a uma <span className="font-bold border-b-2 border-black/10 hover:border-black transition-colors cursor-pointer">arquitetura modular</span> que prioriza a velocidade e a clareza cognitiva.
          </p>
        </div>

        {/* Info Block */}
        <div className="bg-[#eeedf7] py-8 px-10 rounded-2xl flex items-start gap-6 border-l-8 border-black shadow-sm">
          <Info className="text-black shrink-0 mt-1" size={24} />
          <div>
            <h4 className="text-lg font-bold text-black mb-2">Objetivo Estratégico</h4>
            <p className="text-[#5d5e66] text-sm leading-relaxed font-medium">
              Garantir que todas as interações da interface permaneçam abaixo de 100ms de latência para preservar o "estado de fluxo" dos escritores e arquitetos profissionais que utilizam a plataforma.
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-4 px-4">
          {[
            { text: 'Definir tokens de design atômico para espaçamento e profundidade tonal.', done: false },
            { text: 'Finalizar convenções de nomenclatura da paleta de cores.', done: true },
            { text: 'Implementar manipuladores de arrastar e soltar em nível de bloco.', done: false }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 group/item">
              <button className={cn(
                "w-6 h-6 border-2 rounded flex items-center justify-center transition-all",
                item.done ? "bg-black border-black text-white" : "border-neutral-200 hover:border-black"
              )}>
                {item.done && <Check size={14} strokeWidth={3} />}
              </button>
              <span className={cn(
                "text-lg font-medium",
                item.done ? "text-neutral-300 line-through" : "text-black"
              )} contentEditable suppressContentEditableWarning>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Section Heading */}
        <h3 className="text-3xl font-extrabold tracking-tighter text-black pt-10 outline-none" contentEditable suppressContentEditableWarning>
          Pesquisa Visual & Materialidade
        </h3>

        {/* Visual Bento */}
        <div className="grid grid-cols-12 gap-6 h-[460px]">
           <div className="col-span-8 rounded-2xl overflow-hidden relative group/img cursor-zoom-in">
             <img 
               src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=2069&auto=format&fit=crop" 
               className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
               alt="Design concept"
             />
             <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-white">Mood: Zen Industrial</div>
           </div>
           <div className="col-span-4 flex flex-col gap-6">
              <div className="flex-1 bg-neutral-100 rounded-2xl p-6 flex flex-col justify-end">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] mb-2">Textura</p>
                <p className="font-bold text-black leading-snug">Interações de Titânio Escovado e Vidro Fosco.</p>
              </div>
              <div className="flex-1 rounded-2xl overflow-hidden bg-black">
                <img 
                  src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop" 
                  className="w-full h-full object-cover opacity-60"
                  alt=""
                />
              </div>
           </div>
        </div>

        {/* Code Block */}
        <div className="bg-[#1a1c1e] rounded-2xl p-8 font-mono text-sm border border-white/5 relative group/code">
          <div className="flex gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500/30" />
            <div className="w-3 h-3 rounded-full bg-neutral-700" />
            <div className="w-3 h-3 rounded-full bg-neutral-800" />
          </div>
          <code className="text-[#eeedf7] block leading-relaxed">
            <span className="text-neutral-500">const</span> operoEngine = {'{'}<br/>
            &nbsp;&nbsp;render: (blocks) =&gt; {'{'}<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-neutral-600">// Lógica de Precisão Arquitetônica</span><br/>
            &nbsp;&nbsp;&nbsp;&nbsp;return blocks.map(b =&gt; b.materialize());<br/>
            &nbsp;&nbsp;{'}'}<br/>
            {'}'};
          </code>
          <button className="absolute top-6 right-6 p-2 bg-white/5 opacity-0 group-hover/code:opacity-100 hover:bg-white/10 rounded transition-all text-white">
            <ExternalLink size={14} />
          </button>
        </div>

        {/* Quote Block */}
        <div className="py-12 border-l-4 border-neutral-100 pl-12">
          <p className="text-4xl font-light italic text-neutral-400 tracking-tight leading-snug">
            "Design não é apenas o que parece e o que se sente. Design é como funciona."
          </p>
          <cite className="block mt-6 text-[10px] font-bold uppercase tracking-[0.4em] text-[#5d5e66] not-italic">
            — Steve Jobs
          </cite>
        </div>

        {/* Placeholder */}
        <div className="py-10 text-neutral-200 hover:text-neutral-400 transition-colors cursor-text group/placeholder flex items-center gap-4">
           <Plus size={20} className="group-hover/placeholder:scale-110 transition-transform" />
           <span className="text-lg font-medium">Digite '/' para comandos...</span>
        </div>
      </div>
    </motion.div>
  );
}
