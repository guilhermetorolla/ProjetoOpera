import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useData } from '../DataContext';
import { geminiService } from '../services/geminiService';
import { cn } from '../lib/utils';

interface Insight {
  title: string;
  insight: string;
  level: 'low' | 'medium' | 'high';
}

export default function AIProjectInsights() {
  const { projects, tasks } = useData();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  async function getInsights() {
    console.log('Solicitando insights analíticos...');
    setLoading(true);
    setQuotaExceeded(false);
    const data = await geminiService.analyzeProjects(projects, tasks);
    
    if (data && data.error === 'QUOTA_EXCEEDED') {
      setQuotaExceeded(true);
      setInsights([]);
    } else if (Array.isArray(data)) {
      setInsights(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (projects.length > 0) {
      getInsights();
    }
  }, [projects.length]); // Only refetch when project count changes, not on every task update

  if (loading) {
    return (
      <div className="bg-neutral-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/5 animate-pulse h-[140px] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Sparkles className="text-white/20 animate-spin" size={20} />
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">IA Analisando Vetores de Dados...</span>
        </div>
      </div>
    );
  }

  if (quotaExceeded) {
    return (
      <div className="bg-neutral-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-2xl relative group h-[140px] flex flex-col items-center justify-center text-center">
        <AlertTriangle className="text-amber-500 mb-2" size={20} />
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">IA em Repouso Estratégico</h3>
        <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3">Limite de requisições atingido. Tente em instantes.</p>
        <button 
          onClick={getInsights}
          className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[8px] font-bold uppercase tracking-widest text-white transition-all"
        >
          Tentar Reativar Análise
        </button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
        <Sparkles className="text-white" size={40} />
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Análise Estratégica Gemini</h3>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {insights.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              {item.level === 'high' && <AlertTriangle size={14} className="text-red-400" />}
              {item.level === 'medium' && <TrendingUp size={14} className="text-amber-400" />}
              {item.level === 'low' && <CheckCircle size={14} className="text-emerald-400" />}
              <span className="text-xs font-bold text-white tracking-tight">{item.title}</span>
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed font-medium">
              {item.insight}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
