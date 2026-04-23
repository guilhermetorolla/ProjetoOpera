import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  Trash2, Link as LinkIcon, MousePointer2, 
  Database, Search, ScanLine, Box, Globe, FileText,
  TowerControl, Server, Calculator, DollarSign, PlusCircle, Receipt, X,
  Wifi, CheckCircle2, Clock, PlayCircle, MapPin, 
  Share2, Network, Router, Cpu, Layers, Cable
} from 'lucide-react';
import { Project, CFTVPoint, CFTVLink, Status } from '../types';
import { cn } from '../lib/utils';
import { useData } from '../DataContext';
import { dataService } from '../services/dataService';
import { MapContainer, TileLayer, useMap, Polyline, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/';

const equipmentTypes = [
  { id: 'cto', label: 'CTO (NAP)', icon: Network, color: 'text-amber-500', group: 'Atendimento' },
  { id: 'backbone_box', label: 'C. Emenda (Backbone)', icon: Layers, color: 'text-red-500', group: 'Infra' },
  { id: 'junction_box', label: 'C. Passagem', icon: Box, color: 'text-neutral-500', group: 'Infra' },
  { id: 'hermetic_box', label: 'C. Hermética', icon: Box, color: 'text-indigo-500', group: 'Infra' },
  { id: 'pole', label: 'Poste', icon: TowerControl, color: 'text-emerald-700', group: 'Infra', isIllustration: true },
  { id: 'rack', label: 'Rack', icon: Server, color: 'text-slate-700', group: 'Core' },
  { id: 'switch_core', label: 'Switch Central', icon: Cpu, color: 'text-blue-600', group: 'Core' },
  { id: 'odf', label: 'ODF / DIO', icon: Database, color: 'text-teal-600', group: 'Core' },
  { id: 'operator_entry', label: 'Entrada Operadora', icon: Share2, color: 'text-purple-600', group: 'Infra' },
  { id: 'router_ap', label: 'Ponto de Acesso', icon: Router, color: 'text-sky-500', group: 'Atendimento' },
];

const cableTypes = [
  { id: 'fiber_backbone', label: 'Backbone Fibra', color: 'stroke-red-600', code: '#dc2626', width: 6 },
  { id: 'fiber_drop', label: 'Drop / Derivação', color: 'stroke-amber-500', code: '#f59e0b', width: 4 },
  { id: 'utp_cat6', label: 'UTP Cat6', color: 'stroke-blue-500', code: '#3b82f6', width: 4 },
  { id: 'conduit', label: 'Tubulação / Duto', color: 'stroke-neutral-400', code: '#a3a3a3', width: 8, dash: "10, 10" }
];

const iconCache = new Map<string, L.DivIcon>();
const getNetworkIcon = (pointType: string, label: string, isSelected: boolean, avatarUrl?: string, taskStatus?: Status) => {
  const cacheKey = `${pointType}-${label}-${isSelected}-${avatarUrl}-${taskStatus}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!;
  
  const eq = equipmentTypes.find(e => e.id === pointType) as any;
  const IconComponent = eq?.icon || Box;
  const iconColor = eq?.color || 'text-slate-500';
  const isIllustration = eq?.isIllustration;
  
  let StatusIcon = null;
  let statusColor = "";
  if (taskStatus === 'Concluído' || taskStatus === 'Resolvido') {
    StatusIcon = CheckCircle2;
    statusColor = "bg-green-500";
  } else if (taskStatus === 'Em Progresso') {
    StatusIcon = PlayCircle;
    statusColor = "bg-blue-500 animate-pulse";
  } else if (taskStatus === 'Pendente') {
    StatusIcon = Clock;
    statusColor = "bg-amber-500";
  }

  const htmlString = renderToStaticMarkup(
    <div className="flex flex-col items-center justify-center -translate-y-6 cursor-pointer scale-150">
      <div className={cn(
        "relative flex items-center justify-center w-12 h-12 transition-all",
        isSelected && "scale-125 z-50 text-blue-500"
      )}>
        {isIllustration && (
           <div className="absolute inset-0 flex items-center justify-center animate-[cloud-swim_6s_infinite_ease-in-out]">
             <svg viewBox="0 0 24 24" className="w-[140%] h-[140%] text-white dark:text-white/10 opacity-80" fill="currentColor">
                <path d="M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-0.101,0.003-0.2,0.009-0.299C11.332,13.111,10.686,13,10,13c-2.761,0-5,2.239-5,5s2.239,5,5,5h7.5c2.485,0,4.5-2.015,4.5-4.5S19.985,14,17.5,14c-0.187,0-0.369,0.011-0.548,0.033C16.85,11.758,14.887,10,12.5,10c-1.391,0-2.639,0.597-3.513,1.554C8.016,10.638,6.868,10,5.5,10c-2.485,0-4.5,2.015-4.5,4.5s2.015,4.5,4.5,4.5h1" />
             </svg>
           </div>
        )}

        <IconComponent 
          size={isSelected ? 32 : 28} 
          className={cn(
            "relative z-10 transition-all duration-300 drop-shadow-md",
            iconColor
          )} 
          strokeWidth={isIllustration ? 1.5 : 2.5} 
        />
        
        {avatarUrl && (
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-lg border-2 border-white shadow-xl overflow-hidden transform rotate-6 z-20">
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {StatusIcon && (
          <div className={cn(
            "absolute -bottom-2 -left-2 w-7 h-7 text-white rounded-full border-2 border-white shadow-xl flex items-center justify-center z-20",
            statusColor
          )}>
            <StatusIcon size={16} strokeWidth={3} />
          </div>
        )}
      </div>
      
      <div className="mt-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full shadow-xl border border-white/10 text-center whitespace-nowrap z-50 pointer-events-none">
         <span className="block text-[8px] font-black text-white uppercase tracking-[0.2em]">{label}</span>
      </div>
    </div>
  );

  const icon = L.divIcon({
    html: htmlString,
    className: 'bg-transparent border-none',
    iconSize: [80, 80],
    iconAnchor: [40, 40]
  });
  
  iconCache.set(cacheKey, icon);
  return icon;
};

const MapInstanceExporter = React.memo(({ setMapInstance }: { setMapInstance: (map: L.Map) => void }) => {
  const map = useMap();
  useEffect(() => { setMapInstance(map); }, [map, setMapInstance]);
  return null;
});

const MapInteractionHandler = ({ 
  mode, selectedPointId, setSelectedPointId, setPendingPath, setMousePos 
}: { 
  mode: string, selectedPointId: string | null, setSelectedPointId: (id: string | null) => void,
  setPendingPath: React.Dispatch<React.SetStateAction<[number, number][]>>,
  setMousePos: React.Dispatch<React.SetStateAction<[number, number] | null>>
}) => {
  useMapEvents({
    click(e) {
      if (mode === 'cable' && selectedPointId) {
         setPendingPath(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
      } else {
         setSelectedPointId(null);
         setPendingPath([]);
      }
    },
    mousemove(e) {
      if (mode === 'cable' && selectedPointId) setMousePos([e.latlng.lat, e.latlng.lng]);
      else setMousePos(null);
    }
  });
  return null;
};

interface ExtraItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface NetworkMappingProps {
  project: Project;
  onUpdate: (data: any) => void;
}

export default function NetworkMapping({ project, onUpdate }: NetworkMappingProps) {
  const { users, tasks, refreshData } = useData();
  const [points, setPoints] = useState<CFTVPoint[]>(project.networkData?.points || []);
  const [links, setLinks] = useState<CFTVLink[]>(project.networkData?.links || []);
  
  const [prices, setPrices] = useState<Record<string, number>>(project.networkData?.prices || {});
  const [extraItems, setExtraItems] = useState<ExtraItem[]>(project.networkData?.extraItems || []);
  const [rightTab, setRightTab] = useState<'bim' | 'budget'>('bim');

  const [mode, setMode] = useState<'move' | 'cable'>('move');
  const [selectedCableType, setSelectedCableType] = useState<string>('fiber_backbone');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  
  const [pendingPath, setPendingPath] = useState<[number, number][]>([]);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);
  
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('satellite');
  const [addressSearch, setAddressSearch] = useState('');
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const initialCenter: [number, number] = useMemo(() => 
    points.length > 0 ? [points[0].y, points[0].x] : [-23.5505, -46.6333],
  []);

  useEffect(() => {
    const timer = setTimeout(() => onUpdate({ points, links, prices, extraItems }), 500);
    return () => clearTimeout(timer);
  }, [points, links, prices, extraItems, onUpdate]);

  const handleMarkerClick = useCallback((pointId: string) => {
    if (mode === 'cable') {
      if (selectedPointId) {
         if (selectedPointId !== pointId) {
           const exists = links.some(l => 
             (l.fromId === selectedPointId && l.toId === pointId) || 
             (l.toId === selectedPointId && l.fromId === pointId)
           );
           if (!exists) {
             setLinks(prev => [...prev, {
               id: `l-${Date.now()}`,
               fromId: selectedPointId,
               toId: pointId,
               type: selectedCableType as any,
               path: pendingPath
             }]);
           }
         }
         setSelectedPointId(null);
         setPendingPath([]);
         setMousePos(null);
      } else {
         setSelectedPointId(pointId);
         setPendingPath([]);
      }
    } else {
      setSelectedPointId(pointId);
      setRightTab('bim');
    }
  }, [mode, selectedPointId, selectedCableType, links, pendingPath]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!mapInstance) return;
    
    const eqpType = e.dataTransfer.getData('eqpType');
    if (eqpType) {
      const rect = mapInstance.getContainer().getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const lt = mapInstance.containerPointToLatLng([x, y]);
      
      const count = points.filter(p => p.type === eqpType).length + 1;
      const baseLabel = equipmentTypes.find(eq => eq.id === eqpType)?.label || 'Ativo';

      const newPoint: CFTVPoint = {
        id: `p-${Date.now()}`,
        type: eqpType as any,
        x: lt.lng,
        y: lt.lat,
        label: `${baseLabel} ${count}`
      };
      setPoints(prev => [...prev, newPoint]);
    }
  }, [mapInstance, points]);

  const handleSearch = async () => {
    if (!addressSearch.trim() || !mapInstance) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        mapInstance.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 18);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getCableLengths = useCallback(() => {
    const lengths: Record<string, number> = {};
    cableTypes.forEach(c => lengths[c.id] = 0);
    if (mapInstance) {
      links.forEach(l => {
        const p1 = points.find(p => p.id === l.fromId);
        const p2 = points.find(p => p.id === l.toId);
        if (p1 && p2) {
           const pts: [number, number][] = [[p1.y, p1.x], ...(l.path || []), [p2.y, p2.x]];
           for(let i=0; i < pts.length - 1; i++){
               lengths[l.type] = (lengths[l.type] || 0) + mapInstance.distance(pts[i], pts[i+1]);
           }
        }
      });
    }
    return lengths;
  }, [links, points, mapInstance]);

  const computeGrandTotal = useCallback(() => {
     let total = 0;
     equipmentTypes.forEach(eq => {
        const count = points.filter(p => p.type === eq.id).length;
        total += count * (prices[eq.id] || 0);
     });
     const cableMeters = getCableLengths();
     cableTypes.forEach(c => {
        total += Math.round(cableMeters[c.id] || 0) * (prices[c.id] || 0);
     });
     extraItems.forEach(item => {
        total += item.quantity * item.unitPrice;
     });
     return total;
  }, [points, getCableLengths, prices, extraItems]);

  const exportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      pdf.setFontSize(22);
      pdf.text(`Mapa de Rede & BOM: ${project.name}`, 20, 20);
      
      let y = 35;
      pdf.setFontSize(14);
      pdf.text(`1. Equipamentos de Rede`, 20, y);
      y += 10;
      
      pdf.setFontSize(11);
      const counts: Record<string, number> = {};
      points.forEach(p => counts[p.type] = (counts[p.type] || 0) + 1);
      
      Object.entries(counts).forEach(([type, count]) => {
        const eqName = equipmentTypes.find(e => e.id === type)?.label;
        const sub = count * (prices[type] || 0);
        pdf.text(`- ${count}x ${eqName}`, 25, y);
        pdf.text(`Sub: R$ ${sub.toFixed(2)}`, 170, y);
        y += 8;
      });

      y += 5;
      pdf.setFontSize(14);
      pdf.text(`2. Cabeamento Estimado`, 20, y);
      y += 10;

      const cableMeters = getCableLengths();
      cableTypes.forEach(c => {
         const m = Math.round(cableMeters[c.id] || 0);
         if (m > 0) {
           const sub = m * (prices[c.id] || 0);
           pdf.text(`- ${m}m ${c.label}`, 25, y);
           pdf.text(`Sub: R$ ${sub.toFixed(2)}`, 170, y);
           y += 8;
         }
      });

      y += 15;
      pdf.setFontSize(16);
      pdf.text(`Total Estimado: R$ ${computeGrandTotal().toFixed(2)}`, 20, y);
      pdf.save(`projeto_redes_${project.id}.pdf`);
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-100 dark:bg-[#121212] overflow-hidden select-none relative z-10 rounded-2xl shadow-xl">
      <div className="bg-white dark:bg-[#18181A] border-b border-black/5 dark:border-white/5 p-3 flex flex-wrap items-center justify-between z-20">
        <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-black/50 rounded-lg">
           <button
             onClick={() => setMode('move')}
             className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2", mode === 'move' ? "bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm" : "text-neutral-500")}
           >
             <MousePointer2 size={14} /> Seleção
           </button>
           <button
             onClick={() => setMode('cable')}
             className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2", mode === 'cable' ? "bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm" : "text-neutral-500")}
           >
             <Cable size={14} /> Lançar Cabos
           </button>
           {mode === 'cable' && (
              <div className="flex items-center gap-1 px-2 border-l border-black/10 dark:border-white/10 ml-2">
                {cableTypes.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => setSelectedCableType(c.id)}
                    className={cn("px-2 py-1 rounded text-[9px] font-black uppercase transition-all", selectedCableType === c.id ? "bg-black text-white dark:bg-white dark:text-black" : "text-neutral-400 hover:text-black")}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
           )}
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center shadow-sm rounded-lg overflow-hidden border border-black/5 dark:border-white/10">
             <input 
               type="text" 
               placeholder="Buscar endereço..." 
               value={addressSearch}
               onChange={(e) => setAddressSearch(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
               className="w-48 bg-neutral-50 dark:bg-black/50 py-2 pl-3 text-[11px] font-medium outline-none"
             />
             <button onClick={handleSearch} className="px-3 py-2 text-neutral-400"><Search size={14} /></button>
           </div>
           <button onClick={() => setMapType(mapType === 'satellite' ? 'roadmap' : 'satellite')} className="px-3 py-2 bg-neutral-50 dark:bg-white/5 rounded-lg text-[10px] font-extrabold uppercase shadow-sm flex items-center gap-1.5">
             <Globe size={14} /> {mapType === 'satellite' ? 'Mapa' : 'Satélite'}
           </button>
           <button onClick={exportPDF} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2">
             <FileText size={14} /> Exportar Projeto
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-60 bg-white/80 dark:bg-[#1A1A1D] border-r border-black/5 dark:border-white/5 flex flex-col z-20">
          <div className="p-4 border-b border-black/5 dark:border-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Biblioteca de Rede</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            {['Infra', 'Core', 'Atendimento'].map(group => (
              <div key={group} className="space-y-2">
                <h4 className="text-[9px] font-black uppercase text-black/40 dark:text-white/40 px-2">{group}</h4>
                {equipmentTypes.filter(eq => eq.group === group).map(eq => (
                  <div
                    key={eq.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('eqpType', eq.id); }}
                    className="flex items-center gap-3 p-2 bg-neutral-50 dark:bg-white/5 rounded-xl cursor-grab hover:bg-neutral-100 transition-all border border-transparent hover:border-black/5"
                  >
                    <eq.icon size={18} className={eq.color} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{eq.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div 
          className="flex-1 relative bg-neutral-200 dark:bg-neutral-900"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          <MapContainer center={initialCenter} zoom={18} maxZoom={22} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            <TileLayer 
              url={mapType === 'satellite' ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} 
              maxZoom={22} 
            />
            <MapInstanceExporter setMapInstance={setMapInstance} />
            <MapInteractionHandler 
               mode={mode} 
               selectedPointId={selectedPointId} 
               setSelectedPointId={setSelectedPointId} 
               setPendingPath={setPendingPath} 
               setMousePos={setMousePos} 
            />

            {mode === 'cable' && selectedPointId && (() => {
               const startPt = points.find(p => p.id === selectedPointId);
               if (!startPt) return null;
               const previewPts: [number, number][] = [[startPt.y, startPt.x], ...pendingPath];
               if (mousePos) previewPts.push(mousePos);
               const cable = cableTypes.find(c => c.id === selectedCableType);
               return <Polyline positions={previewPts} color={cable?.code || '#000'} weight={3} dashArray="5 5" opacity={0.6} />;
            })()}

            {links.map(link => {
              const from = points.find(p => p.id === link.fromId);
              const to = points.find(p => p.id === link.toId);
              if (!from || !to) return null;
              const pts: [number, number][] = [[from.y, from.x], ...(link.path || []), [to.y, to.x]];
              const cable = cableTypes.find(c => c.id === link.type);
              
              let distMeters = 0;
              if (mapInstance) {
                for(let i=0; i<pts.length - 1; i++) distMeters += mapInstance.distance(pts[i], pts[i+1]);
              }

              return (
                <Polyline 
                  key={link.id} positions={pts} color={cable?.code || '#000'} weight={cable?.width || 4} dashArray={cable?.dash} opacity={0.8}
                >
                  <Tooltip permanent direction="center" className="bg-white/80 backdrop-blur-sm text-[9px] font-black border-none shadow-sm px-1 rounded">
                     {Math.round(distMeters)}m
                  </Tooltip>
                </Polyline>
              );
            })}

            {points.map(point => (
              <Marker 
                key={point.id} 
                position={[point.y, point.x]} 
                icon={getNetworkIcon(point.type, point.label, selectedPointId === point.id)} 
                draggable={mode === 'move'}
                eventHandlers={{
                   click: () => handleMarkerClick(point.id),
                   dragend: (e) => {
                      const pos = (e.target as any).getLatLng();
                      setPoints(prev => prev.map(p => p.id === point.id ? { ...p, x: pos.lng, y: pos.lat } : p));
                   }
                }}
              />
            ))}
          </MapContainer>
        </div>

        <div className="w-80 bg-white dark:bg-[#18181A] border-l border-black/5 transition-all">
          <div className="flex border-b border-black/5">
            <button 
              onClick={() => { setRightTab('bim'); setSelectedPointId(null); }}
              className={cn("flex-1 py-4 text-[10px] font-black uppercase tracking-widest", rightTab === 'bim' && !selectedPointId ? "text-blue-600 border-b-2 border-blue-600" : "text-black/40")}
            >
              Inventário
            </button>
            <button 
              onClick={() => { setRightTab('budget'); setSelectedPointId(null); }}
              className={cn("flex-1 py-4 text-[10px] font-black uppercase tracking-widest", rightTab === 'budget' && !selectedPointId ? "text-emerald-600 border-b-2 border-emerald-600" : "text-black/40")}
            >
              Orçamento
            </button>
          </div>
          
          <div className="p-5 overflow-y-auto h-[calc(100%-60px)]">
            {selectedPointId && mode !== 'cable' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Propriedades</h4>
                  <button onClick={() => {
                    setPoints(prev => prev.filter(p => p.id !== selectedPointId));
                    setLinks(prev => prev.filter(l => l.fromId !== selectedPointId && l.toId !== selectedPointId));
                    setSelectedPointId(null);
                  }} className="text-red-500"><Trash2 size={16} /></button>
                </div>
                {points.filter(p => p.id === selectedPointId).map(p => (
                  <div key={p.id} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase opacity-60">Nome / Identificação</label>
                      <input 
                        type="text" 
                        value={p.label} 
                        onChange={(e) => setPoints(prev => prev.map(pt => pt.id === p.id ? {...pt, label: e.target.value} : pt))}
                        className="w-full bg-neutral-50 dark:bg-white/5 p-3 rounded-xl text-sm font-bold outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : rightTab === 'budget' ? (
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Resumo de Materiais</h4>
                <div className="space-y-4">
                  {cableTypes.map(c => {
                    const m = Math.round(getCableLengths()[c.id] || 0);
                    if (m === 0) return null;
                    return (
                      <div key={c.id} className="flex justify-between items-center text-xs">
                        <span className="font-bold opacity-60">{c.label}</span>
                        <span className="font-black">{m}m</span>
                      </div>
                    );
                  })}
                  <div className="pt-4 border-t border-black/5">
                    <p className="text-[9px] font-black uppercase opacity-40 mb-2">Equipamentos</p>
                    {equipmentTypes.map(eq => {
                      const count = points.filter(p => p.type === eq.id).length;
                      if (count === 0) return null;
                      return (
                         <div key={eq.id} className="flex justify-between items-center text-xs mb-2">
                           <span className="font-bold opacity-60">{eq.label}</span>
                           <span className="font-black">{count}x</span>
                         </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <Database size={32} className="mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Mapeamento Geográfico Virtual Ativo</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cloud-swim {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(4px, -2px) scale(1.05); opacity: 1; }
        }
        .leaflet-container { background: transparent !important; }
      `}} />
    </div>
  );
}
