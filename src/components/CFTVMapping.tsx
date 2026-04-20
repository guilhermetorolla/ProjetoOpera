import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Box, Share2, Plus, Trash2, Link as LinkIcon, Settings, MousePointer2 } from 'lucide-react';
import { Project, CFTVPoint, CFTVLink } from '../types';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';

interface CFTVMappingProps {
  project: Project;
  onUpdate: (data: { points: CFTVPoint[], links: CFTVLink[] }) => void;
}

export default function CFTVMapping({ project, onUpdate }: CFTVMappingProps) {
  const [points, setPoints] = useState<CFTVPoint[]>(project.cftvData?.points || []);
  const [links, setLinks] = useState<CFTVLink[]>(project.cftvData?.links || []);
  const [mode, setMode] = useState<'move' | 'camera' | 'box' | 'cable'>('move');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (mode === 'move') return;
    if (mode === 'cable') return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint: CFTVPoint = {
      id: `p-${Date.now()}`,
      type: mode === 'camera' ? 'camera' : 'box',
      x,
      y,
      label: mode === 'camera' ? `Câmera ${points.filter(p => p.type === 'camera').length + 1}` : `Caixa ${points.filter(p => p.type === 'box').length + 1}`
    };

    const newPoints = [...points, newPoint];
    setPoints(newPoints);
    onUpdate({ points: newPoints, links });
  };

  const handlePointClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'cable' && selectedPointId && selectedPointId !== id) {
      // Create link
      const newLink: CFTVLink = {
        id: `l-${Date.now()}`,
        fromId: selectedPointId,
        toId: id,
        type: 'utp'
      };
      const newLinks = [...links, newLink];
      setLinks(newLinks);
      onUpdate({ points, links: newLinks });
      setSelectedPointId(null);
    } else {
      setSelectedPointId(id);
    }
  };

  const deleteSelected = () => {
    if (!selectedPointId) return;
    const newPoints = points.filter(p => p.id !== selectedPointId);
    const newLinks = links.filter(l => l.fromId !== selectedPointId && l.toId !== selectedPointId);
    setPoints(newPoints);
    setLinks(newLinks);
    onUpdate({ points: newPoints, links: newLinks });
    setSelectedPointId(null);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-neutral-100 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {[
            { id: 'move', label: 'Selecionar', icon: MousePointer2 },
            { id: 'camera', label: 'Câmera', icon: Camera },
            { id: 'box', label: 'Caixa Hermética', icon: Box },
            { id: 'cable', label: 'Cabeamento', icon: LinkIcon },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => setMode(tool.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                mode === tool.id ? "bg-black text-white shadow-lg scale-105" : "bg-neutral-50 text-neutral-400 hover:bg-neutral-100"
              )}
            >
              <tool.icon size={14} /> {tool.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selectedPointId && (
            <button onClick={deleteSelected} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={16} />
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-bold shadow-md opacity-20 cursor-not-allowed">
            <Share2 size={14} /> Exportar Projeto
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex">
        {/* Mapping Canvas Area */}
        <div 
          ref={containerRef}
          onClick={handleCanvasClick}
          className={cn(
            "flex-1 relative bg-neutral-100 cursor-crosshair overflow-hidden",
            mode === 'move' && "cursor-default"
          )}
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #d1d5db 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        >
          {/* Render Connections (Cables) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-black/20 stroke-[2]">
             {links.map(link => {
               const from = points.find(p => p.id === link.fromId);
               const to = points.find(p => p.id === link.toId);
               if (!from || !to) return null;
               return (
                 <line 
                   key={link.id}
                   x1={`${from.x}%`} y1={`${from.y}%`}
                   x2={`${to.x}%`} y2={`${to.y}%`}
                   className="animate-pulse"
                 />
               );
             })}
          </svg>

          {/* Render Points */}
          {points.map(point => (
            <motion.div
              key={point.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={(e) => handlePointClick(point.id, e)}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 p-3 rounded-full shadow-2xl cursor-pointer group transition-all",
                selectedPointId === point.id ? "ring-4 ring-black/10 scale-125 z-20" : "hover:scale-110 z-10",
                point.type === 'camera' ? "bg-black text-white" : "bg-white text-black border border-neutral-200"
              )}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              {point.type === 'camera' ? <Camera size={16} /> : <Box size={16} />}
              
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur-md text-[8px] text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-widest">
                {point.label}
              </div>

              {selectedPointId === point.id && mode === 'cable' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
              )}
            </motion.div>
          ))}

          {points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center opacity-20">
                <Settings size={48} className="mx-auto mb-4 animate-spin-slow" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Ambiente de Mapeamento Técnico Opero</p>
                <p className="text-[8px] font-bold mt-2">Clique para posicionar ativos de rede</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="w-80 bg-white border-l border-neutral-100 p-8 overflow-y-auto space-y-8">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">Resumo da Infraestrutura</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-50 p-4 rounded-2xl">
                <Camera size={14} className="mb-2 text-neutral-400" />
                <p className="text-xl font-bold">{points.filter(p => p.type === 'camera').length}</p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Câmeras</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-2xl">
                <Box size={14} className="mb-2 text-neutral-400" />
                <p className="text-xl font-bold">{points.filter(p => p.type === 'box').length}</p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Caixas</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">Ativos Listados</h4>
            <div className="space-y-4">
              {points.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPointId(p.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                    selectedPointId === p.id ? "border-black bg-neutral-50" : "border-neutral-50 hover:border-neutral-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", p.type === 'camera' ? "bg-black text-white" : "bg-neutral-100 text-neutral-500")}>
                      {p.type === 'camera' ? <Camera size={12} /> : <Box size={12} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold">{p.label}</p>
                      <p className="text-[8px] text-neutral-400 uppercase font-medium">{p.type === 'camera' ? 'Dispositivo Óptico' : 'Proteção Hermética'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
