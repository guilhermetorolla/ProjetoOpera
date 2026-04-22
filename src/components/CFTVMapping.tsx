import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  Trash2, Link as LinkIcon, MousePointer2, 
  Database, Search, ScanLine, Box, Globe, FileText,
  Cctv, Video, TowerControl, Server, Calculator, DollarSign, PlusCircle, Receipt, X
} from 'lucide-react';
import { Project, CFTVPoint, CFTVLink } from '../types';
import { cn } from '../lib/utils';
import { MapContainer, TileLayer, useMap, useMapEvents, Polyline, Polygon, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/';

const equipmentTypes = [
  { id: 'camera_dome', label: 'Câmera Dome', icon: Cctv, color: 'bg-[#98D8D8] text-[#1E6B6B]', group: 'Câmeras' },
  { id: 'camera_bullet', label: 'Câmera Bullet', icon: Video, color: 'bg-[#A3D9A5] text-[#2D7330]', group: 'Câmeras' },
  { id: 'nvr', label: 'NVR / DVR', icon: Server, color: 'bg-[#A5D6B6] text-[#2F704A]', group: 'Rede' },
  { id: 'switch', label: 'Switch', icon: Database, color: 'bg-[#96CBCE] text-[#1D6064]', group: 'Rede' },
  { id: 'rack', label: 'Rack', icon: Server, color: 'bg-[#B4A9DE] text-[#483A7E]', group: 'Rede' },
  { id: 'box', label: 'C. Hermética', icon: Box, color: 'bg-[#B0BCC5] text-[#3D4C5A]', group: 'Infra' },
  { id: 'pole', label: 'Poste', icon: TowerControl, color: 'bg-[#98D8BA] text-[#1D6B4E]', group: 'Infra' },
];

const cableTypes = [
  { id: 'utp', label: 'UTP', color: 'stroke-blue-500', code: '#3b82f6' },
  { id: 'fiber', label: 'Fibra Óptica', color: 'stroke-amber-500', code: '#f59e0b' },
  { id: 'power', label: 'Alimentação', color: 'stroke-red-500', code: '#ef4444' }
];

const destinationPoint = (lat: number, lng: number, distanceMeters: number, bearingDegrees: number): [number, number] => {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const φ1 = lat * rad;
  const λ1 = lng * rad;
  const brng = bearingDegrees * rad;

  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(distanceMeters / R) +
                       Math.cos(φ1) * Math.sin(distanceMeters / R) * Math.cos(brng));
  const λ2 = λ1 + Math.atan2(Math.sin(brng) * Math.sin(distanceMeters / R) * Math.cos(φ1),
                             Math.cos(distanceMeters / R) - Math.sin(φ1) * Math.sin(φ2));

  return [φ2 / rad, λ2 / rad];
};

const iconCache = new Map<string, L.DivIcon>();
const getCustomIcon = (pointType: string, label: string, isSelected: boolean) => {
  const cacheKey = `${pointType}-${label}-${isSelected}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!;
  
  const eq = equipmentTypes.find(e => e.id === pointType);
  const IconComponent = eq?.icon || Box;
  const colorBg = eq?.color || 'bg-[#B0BCC5] text-[#3D4C5A]';
  
  const htmlString = renderToStaticMarkup(
    <div className="flex flex-col items-center justify-center -translate-y-4 cursor-pointer">
      <div className={cn(
        "relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all border border-white/40",
        "shadow-[4px_4px_10px_rgba(0,0,0,0.15),-4px_-4px_10px_rgba(255,255,255,0.7),inset_3px_3px_6px_rgba(255,255,255,0.6),inset_-3px_-3px_6px_rgba(0,0,0,0.08)]",
        colorBg,
        isSelected ? 'ring-4 ring-blue-500 scale-[1.3] z-50 shadow-[0_10px_20px_rgba(0,0,0,0.3)]' : 'hover:scale-110 hover:-translate-y-1'
      )}>
        <IconComponent size={22} className="drop-shadow-sm" strokeWidth={2.5} />
      </div>
      <div className="mt-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded shadow-lg border border-white/10 text-center whitespace-nowrap z-50 pointer-events-none">
         <span className="block text-[10px] font-black text-amber-400 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );

  const icon = L.divIcon({
    html: htmlString,
    className: 'bg-transparent border-none', // Override Leaflet's default white square
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

interface CFTVMappingProps {
  project: Project;
  onUpdate: (data: any) => void;
}

export default function CFTVMapping({ project, onUpdate }: CFTVMappingProps) {
  const [points, setPoints] = useState<CFTVPoint[]>(project.cftvData?.points || []);
  const [links, setLinks] = useState<CFTVLink[]>(project.cftvData?.links || []);
  
  // Orçamento (Custos)
  const [prices, setPrices] = useState<Record<string, number>>(project.cftvData?.prices || {});
  const [extraItems, setExtraItems] = useState<ExtraItem[]>(project.cftvData?.extraItems || []);
  const [rightTab, setRightTab] = useState<'bim' | 'budget'>('bim');

  const [mode, setMode] = useState<'move' | 'cable'>('move');
  const [selectedCableType, setSelectedCableType] = useState<'utp' | 'fiber' | 'power'>('utp');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  
  const [pendingPath, setPendingPath] = useState<[number, number][]>([]);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);
  
  const [showFov, setShowFov] = useState(true);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('satellite');
  
  const [addressSearch, setAddressSearch] = useState('');
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const initialCenter: [number, number] = useMemo(() => 
    points.length > 0 ? [points[0].y, points[0].x] : [-23.5505, -46.6333],
  []);

  useEffect(() => {
    const timer = setTimeout(() => onUpdate({ points, links, prices, extraItems }), 500);
    return () => clearTimeout(timer);
  }, [points, links, prices, extraItems, onUpdate]);

  const cancelDrawing = useCallback(() => {
    if (mode === 'cable' && selectedPointId) {
       setSelectedPointId(null);
       setPendingPath([]);
       setMousePos(null);
       setMode('move');
    }
  }, [mode, selectedPointId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelDrawing(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [cancelDrawing]);

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
        label: `${baseLabel} ${count}`,
        angle: eqpType.includes('camera') ? 45 : undefined,
        fovRadius: eqpType.includes('camera') ? 15 : undefined,
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
        mapInstance.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 18, { animate: true, duration: 1.5 });
      } else {
        alert("Endereço não encontrado.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro na busca de endereço.");
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

  const calculateTotalCable = useCallback(() => {
    const lengths = getCableLengths();
    return Object.values(lengths).reduce((a,b) => a+b, 0).toFixed(1);
  }, [getCableLengths]);

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

  const formatCurrency = (val: number) => {
     return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const deleteSelected = useCallback(() => {
    if (!selectedPointId) return;
    setPoints(prev => prev.filter(p => p.id !== selectedPointId));
    setLinks(prev => prev.filter(l => l.fromId !== selectedPointId && l.toId !== selectedPointId));
    setSelectedPointId(null);
  }, [selectedPointId]);

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
      setRightTab('bim'); // Retorna pra BIM se clicar em algo pra ver configs
    }
  }, [mode, selectedPointId, selectedCableType, links, pendingPath]);

  // Modificado export PDF para incluir custos
  const exportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      pdf.setFontSize(22);
      pdf.text(`BOM e Orçamento: ${project.name}`, 20, 20);
      
      let y = 35;
      pdf.setFontSize(14);
      pdf.text(`1. Equipamentos e Infraestrutura`, 20, y);
      y += 10;
      
      pdf.setFontSize(11);
      const counts: Record<string, number> = {};
      points.forEach(p => counts[p.type] = (counts[p.type] || 0) + 1);
      
      let totalEq = 0;
      Object.entries(counts).forEach(([type, count]) => {
        const eqName = equipmentTypes.find(e => e.id === type)?.label;
        const unPrice = prices[type] || 0;
        const sub = count * unPrice;
        totalEq += sub;
        pdf.text(`- ${count}x ${eqName}`, 25, y);
        pdf.text(`R$ ${unPrice.toFixed(2)} un.`, 130, y);
        pdf.text(`Sub: R$ ${sub.toFixed(2)}`, 170, y);
        y += 8;
      });

      y += 5;
      pdf.setFontSize(14);
      pdf.text(`2. Cabeamento Estimado (+15% sugerido)`, 20, y);
      y += 10;

      pdf.setFontSize(11);
      const cableMeters = getCableLengths();
      cableTypes.forEach(c => {
         const m = Math.round(cableMeters[c.id] || 0);
         if (m > 0) {
           const unPrice = prices[c.id] || 0;
           const sub = m * unPrice;
           pdf.text(`- ${m}m ${c.label}`, 25, y);
           pdf.text(`R$ ${unPrice.toFixed(2)} /m`, 130, y);
           pdf.text(`Sub: R$ ${sub.toFixed(2)}`, 170, y);
           y += 8;
         }
      });

      if (extraItems.length > 0) {
        y += 5;
        pdf.setFontSize(14);
        pdf.text(`3. Materiais Adicionais (Externos)`, 20, y);
        y += 10;

        pdf.setFontSize(11);
        extraItems.forEach(e => {
           const sub = e.quantity * e.unitPrice;
           pdf.text(`- ${e.quantity}x ${e.name}`, 25, y);
           pdf.text(`R$ ${e.unitPrice.toFixed(2)} un.`, 130, y);
           pdf.text(`Sub: R$ ${sub.toFixed(2)}`, 170, y);
           y += 8;
        });
      }

      y += 15;
      pdf.setFontSize(16);
      pdf.setTextColor(20, 100, 20); // Verde suave
      pdf.text(`Total Geral: ${formatCurrency(computeGrandTotal())}`, 20, y);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.text(`Exportado via Opero CAD. Valores listados como orçamento simulado prévio.`, 20, y + 20);

      pdf.save(`orcamento_${project.id}_cftv.pdf`);
    } catch(err) {
      console.error(err);
      alert("Erro ao exportar PDF.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-100 dark:bg-[#121212] overflow-hidden select-none relative z-10 rounded-2xl shadow-xl">
      
      {/* Top Header Neumórfico Lento */}
      <div className="bg-white dark:bg-[#18181A] border-b border-black/5 dark:border-white/5 p-3 flex flex-wrap items-center justify-between z-20 shadow-sm relative">
        <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-black/50 rounded-lg">
           <button
             onClick={() => { setMode('move'); cancelDrawing(); }}
             className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2", mode === 'move' ? "bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm" : "text-neutral-500 hover:text-black dark:hover:text-white")}
           >
             <MousePointer2 size={14} /> Seleção 3D
           </button>
           
           <button
             onClick={() => setMode('cable')}
             className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2", mode === 'cable' ? "bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm" : "text-neutral-500 hover:text-black dark:hover:text-white")}
           >
             <LinkIcon size={14} /> Fiação Livre
           </button>

           {mode === 'cable' && (
             <div className="flex items-center gap-1.5 px-2">
               {cableTypes.map(c => (
                 <button 
                   key={c.id} 
                   onClick={() => setSelectedCableType(c.id as any)}
                   className={cn("px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-transform hover:scale-105", selectedCableType === c.id ? "bg-black text-white dark:bg-white dark:text-black shadow-md border-b-2 border-black/20" : "bg-neutral-200/50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400")}
                 >
                   <span className="w-2 h-2 inline-block rounded-full mr-1.5" style={{ backgroundColor: c.code }} />
                   {c.id}
                 </button>
               ))}
             </div>
           )}
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center relative shadow-sm rounded-lg overflow-hidden group border border-black/5 dark:border-white/10">
             <input 
               type="text" 
               placeholder="Pesquisar Bairro, Rua, Cidade..." 
               value={addressSearch}
               onChange={(e) => setAddressSearch(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
               className="w-56 bg-neutral-50 dark:bg-black/50 py-2 pl-3 pr-2 text-[11px] font-medium text-black dark:text-white outline-none focus:w-64 transition-all"
             />
             <button onClick={handleSearch} className="bg-neutral-50 dark:bg-black/50 text-neutral-400 group-hover:text-blue-500 px-3 py-2 transition-colors">
               <Search size={14} />
             </button>
           </div>
           
           <button onClick={() => setMapType(mapType === 'satellite' ? 'roadmap' : 'satellite')} className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-[10px] font-extrabold uppercase text-neutral-600 dark:text-neutral-300 transition-all shadow-sm flex items-center gap-1.5">
             <Globe size={14} /> {mapType === 'satellite' ? 'Esconder Mapa' : 'Ver Satélite Real'}
           </button>

           <button onClick={() => setShowFov(!showFov)} className={cn("px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase transition-all flex items-center gap-1.5 shadow-sm", showFov ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-neutral-100 text-neutral-500 dark:bg-white/5")}>
             <ScanLine size={14} /> Mostrar F.O.V
           </button>
           
           <button onClick={exportPDF} className="flex px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all gap-2 shadow-lg items-center">
             <FileText size={14} /> Exportar Orçamento
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Soft Library */}
        <div className="w-60 bg-white/50 backdrop-blur-3xl dark:bg-[#1A1A1D] border-r border-black/5 dark:border-white/5 flex flex-col z-20 relative">
          <div className="p-5 border-b border-black/5 dark:border-white/5">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-800 dark:text-neutral-300">Elementos 3D</h3>
            <p className="text-[10px] text-neutral-400 font-medium leading-tight mt-2 flex items-center gap-1">
              Desenho livre (Hold & Drag)
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-10 custom-scrollbar">
            {['Câmeras', 'Rede', 'Infra'].map(group => (
              <div key={group}>
                <h4 className="text-[10px] font-black uppercase text-black/30 dark:text-white/30 mb-3 pl-1">{group}</h4>
                <div className="space-y-2">
                  {equipmentTypes.filter(eq => eq.group === group).map(eq => (
                    <div
                      key={eq.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('eqpType', eq.id);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="flex items-center gap-3 p-2 bg-neutral-50/50 dark:bg-white/5 rounded-xl cursor-grab active:cursor-grabbing hover:bg-white dark:hover:bg-white/10 transition-all group/item shadow-sm hover:shadow border border-transparent hover:border-black/5 dark:hover:border-white/5"
                    >
                      {/* 3D Mini Icon in Library */}
                      <div className={cn(
                         "w-10 h-10 rounded-[10px] flex items-center justify-center border border-white/40 shadow-[2px_2px_6px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8),inset_1px_1px_3px_rgba(255,255,255,0.6)] group-hover/item:scale-110 transition-transform",
                         eq.color
                      )}>
                        <eq.icon size={18} strokeWidth={2.5} className="drop-shadow-sm" />
                      </div>
                      <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200">{eq.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Geographic Map Canvas */}
        <div 
          className="flex-1 relative cursor-crosshair bg-neutral-200 dark:bg-neutral-900 transition-colors"
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
          onDrop={handleDrop}
        >
          {mode === 'cable' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-[11px] font-black uppercase px-6 py-2.5 rounded-xl shadow-2xl z-[9999] pointer-events-none animate-in slide-in-from-top-4 border border-white/10 flex items-center gap-4">
              <div className="flex bg-blue-600 rounded-full w-6 h-6 items-center justify-center -ml-3 shadow"><LinkIcon size={12} className="text-white"/></div>
              <div className="flex flex-col">
                 <span className="text-blue-400 tracking-wider">Cabo {selectedCableType.toUpperCase()} Ativo</span>
                 {!selectedPointId ? (
                   <span className="text-[8px] font-bold text-white/60 tracking-widest leading-none mt-0.5">Clique na partida <span className="text-white">●</span></span>
                 ) : (
                   <span className="text-[8px] font-bold text-white/60 tracking-widest leading-none mt-0.5 animate-pulse">Clique na rua para criar esquinas <span className="text-white">●</span> ou no Destino <span className="text-blue-400">(ESC Cancela)</span></span>
                 )}
              </div>
            </div>
          )}

          <MapContainer center={initialCenter} zoom={18} maxZoom={22} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            {mapType === 'satellite' ? (
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={22} />
            ) : (
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" maxZoom={20} />
            )}
            
            <MapInstanceExporter setMapInstance={setMapInstance} />
            <MapInteractionHandler 
               mode={mode} 
               selectedPointId={selectedPointId} 
               setSelectedPointId={setSelectedPointId} 
               setPendingPath={setPendingPath} 
               setMousePos={setMousePos} 
            />

            {/* Linha do Cabo "Vivo" */}
            {mode === 'cable' && selectedPointId && (() => {
               const startPt = points.find(p => p.id === selectedPointId);
               if (!startPt) return null;
               
               const previewPts: [number, number][] = [[startPt.y, startPt.x], ...pendingPath];
               if (mousePos) previewPts.push(mousePos);

               const pathColor = cableTypes.find(c => c.id === selectedCableType)?.code || '#fff';

               return (
                  <Polyline positions={previewPts} color={pathColor} weight={3} dashArray="6 8" opacity={0.6} className="pointer-events-none" lineCap="round" lineJoin="round" />
               );
            })()}

            {/* Renderização de Cabos Finalizados */}
            {links.map(link => {
              const from = points.find(p => p.id === link.fromId);
              const to = points.find(p => p.id === link.toId);
              if (!from || !to) return null;
              
              const pts: [number, number][] = [[from.y, from.x], ...(link.path || []), [to.y, to.x]];
              
              let distMeters = 0;
              if (mapInstance) {
                for(let i=0; i<pts.length - 1; i++) {
                   distMeters += mapInstance.distance(pts[i], pts[i+1]);
                }
              }
              distMeters = Math.round(distMeters);
              
              const isFiber = link.type === 'fiber';
              const pathColor = cableTypes.find(c => c.id === link.type)?.code || '#fff';
              
              return (
                <Polyline 
                  key={link.id} positions={pts} color={pathColor} weight={isFiber ? 4 : 5} dashArray={isFiber ? "2, 12" : undefined} lineCap="round" lineJoin="round" opacity={0.8}
                >
                  <Tooltip permanent direction="center" className="bg-white/90 backdrop-blur-md text-black font-black text-[10px] border border-black/5 shadow-xl px-2 py-1 rounded-lg pointer-events-none">
                     {distMeters}m
                  </Tooltip>
                </Polyline>
              );
            })}

            {/* Renderização de Cones F.O.V */}
            {showFov && points.filter(p => p.type.includes('camera')).map(p => {
              const angle = p.angle || 45;
              const radiusMeters = p.fovRadius || 15;
              const e1 = destinationPoint(p.y, p.x, radiusMeters, angle - 22);
              const e2 = destinationPoint(p.y, p.x, radiusMeters, angle + 22);
              
              return (
                <Polygon key={`fov-${p.id}`} positions={[[p.y, p.x], e1, e2]} color="rgba(255,255,255,0)" fillColor="#3b82f6" fillOpacity={0.25} weight={0} className="pointer-events-none mix-blend-color-burn dark:mix-blend-screen" />
              );
            })}

            {/* Marcadores 3D Soft usando cache HTML */}
            {points.map(point => (
               <Marker 
                 key={point.id} position={[point.y, point.x]} icon={getCustomIcon(point.type, point.label, selectedPointId === point.id)} draggable={mode === 'move'}
                 eventHandlers={{
                    click: () => handleMarkerClick(point.id),
                    dragstart: () => { if (mode !== 'cable') setSelectedPointId(point.id); setRightTab('bim'); },
                    dragend: (e) => {
                       const pos = e.target.getLatLng();
                       setPoints(prev => prev.map(p => p.id === point.id ? { ...p, x: pos.lng, y: pos.lat } : p));
                    }
                 }}
               />
            ))}
          </MapContainer>
        </div>

        {/* Right Side: Propreties / Budget Tabs */}
        <div className="w-[320px] bg-white dark:bg-[#18181A] border-l border-black/5 dark:border-white/5 flex flex-col z-20 transition-all">
          <div className="flex border-b border-black/5 dark:border-white/5 bg-neutral-50/50 dark:bg-white/5">
            <button 
              onClick={() => { setRightTab('bim'); setSelectedPointId(null); }}
              className={cn("flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all  flex justify-center items-center gap-2", rightTab === 'bim' && !selectedPointId ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-white dark:bg-white/5 shadow-sm" : "text-black/40 dark:text-white/40 hover:bg-white/50")}
            >
              <Database size={14} /> Inventário
            </button>
            <button 
              onClick={() => { setRightTab('budget'); setSelectedPointId(null); }}
              className={cn("flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all  flex justify-center items-center gap-2", rightTab === 'budget' && !selectedPointId ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 bg-white dark:bg-white/5 shadow-sm" : "text-black/40 dark:text-white/40 hover:bg-white/50")}
            >
              <Calculator size={14} /> Custos
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {selectedPointId && mode !== 'cable' ? (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/50 dark:text-white/50">Configurar Ativo</h4>
                  <button onClick={deleteSelected} title="Excluir" className="text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-500/20 p-2 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {points.filter(p => p.id === selectedPointId).map(p => (
                  <div key={p.id} className="space-y-4">
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                      <label className="text-[10px] uppercase font-black opacity-60">Etiqueta</label>
                      <input 
                        type="text" 
                        value={p.label} 
                        onChange={(e) => setPoints(prev => prev.map(pt => pt.id === p.id ? {...pt, label: e.target.value} : pt))}
                        className="w-full bg-neutral-100 dark:bg-black/50 border border-transparent focus:border-blue-500 rounded-xl p-3 text-xs text-black dark:text-white font-bold outline-none transition-all shadow-inner"
                      />
                    </div>
                    {p.type.includes('camera') && (
                      <div className="space-y-4 pt-2">
                        <div className="bg-neutral-50 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5 space-y-2 relative overflow-hidden">
                          <label className="text-[10px] uppercase font-black opacity-60">Raio de Visão</label>
                          <input 
                            type="range" min="2" max="150" 
                            value={p.fovRadius || 15} 
                            onChange={(e) => setPoints(prev => prev.map(pt => pt.id === p.id ? {...pt, fovRadius: Number(e.target.value)} : pt))}
                            className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <p className="text-right text-[11px] font-black text-blue-600 dark:text-blue-400">{p.fovRadius || 15} Metros</p>
                        </div>
                        <div className="bg-neutral-50 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5 space-y-2">
                          <label className="text-[10px] uppercase font-black opacity-60">Rotação Pan</label>
                          <input 
                            type="range" min="0" max="360"
                            value={Math.round(p.angle || 0)} 
                            onChange={(e) => setPoints(prev => prev.map(pt => pt.id === p.id ? {...pt, angle: Number(e.target.value)} : pt))}
                            className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                           <p className="text-right text-[11px] font-black text-blue-600 dark:text-blue-400">{Math.round(p.angle || 0)}° Graus</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : rightTab === 'bim' ? (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/50 dark:text-white/50 mb-3 ml-1"><Box size={14}/> Consumo Atual</h4>
                  <ul className="space-y-2">
                    {equipmentTypes.map(eq => {
                      const count = points.filter(p => p.type === eq.id).length;
                      if (count === 0) return null;
                      return (
                        <li key={eq.id} className="flex justify-between items-center text-xs dark:text-white font-medium bg-white dark:bg-[#1A1A1D] p-3 rounded-xl border border-black/5 dark:border-white/5 shadow-sm transition-all hover:scale-[1.02]">
                          <span className="flex items-center gap-2 font-bold opacity-80"><eq.icon size={14} className="opacity-50"/> {eq.label}</span>
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 w-7 h-7 flex items-center justify-center rounded-lg font-black">{count}</span>
                        </li>
                      );
                    })}
                  </ul>
                  {points.length === 0 && <div className="text-center p-6 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl"><p className="text-[10px] text-black/40 dark:text-white/40 uppercase font-black">Planta vazia.</p></div>}
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/50 dark:text-white/50 mb-3 ml-1"><LinkIcon size={14}/> Medição Total</h4>
                  <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl relative overflow-hidden group">
                    <p className="text-[10px] font-black uppercase text-blue-200 mb-1 z-10 relative">Cabeamento Requerido</p>
                    <p className="text-3xl font-black tracking-tighter text-white z-10 relative">{calculateTotalCable()}m</p>
                    <p className="text-[9px] uppercase font-bold text-blue-200/50 mt-4 leading-tight z-10 relative border-t border-blue-500/50 pt-2">
                       Baseado em vértices geográficos da rua ({links.reduce((acc, l) => acc + (l.path?.length || 0), 0)} Esquinas).
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                {/* BUDGET TAB */}
                <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden shadow-inner text-center">
                    <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1 flex items-center justify-center gap-1"><Receipt size={14}/> Valor Global do Projeto</p>
                    <p className="text-3xl font-black tracking-tighter text-emerald-700 dark:text-emerald-300">{formatCurrency(computeGrandTotal())}</p>
                </div>
                
                <div className="space-y-6">
                   <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-3 border-b border-black/5 dark:border-white/5 pb-2">Preços: Equipamentos</h4>
                     <div className="space-y-3">
                       {equipmentTypes.map(eq => {
                         const count = points.filter(p => p.type === eq.id).length;
                         if (count === 0) return null;
                         const sub = count * (prices[eq.id] || 0);
                         return (
                           <div key={eq.id} className="bg-white dark:bg-[#1A1A1D] p-3 rounded-xl border border-black/5 dark:border-white/5 shadow-sm space-y-2">
                              <div className="flex justify-between items-center text-[11px] font-bold">
                                 <span className="flex items-center gap-1.5 opacity-80"><eq.icon size={12} className="opacity-50"/> {count}x {eq.label}</span>
                                 <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(sub)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-black/50 dark:text-white/50 w-16">Valor/Un.</span>
                                <div className="relative flex-1">
                                  <DollarSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
                                  <input 
                                     type="number" step="0.01" min="0" placeholder="0.00"
                                     value={prices[eq.id] || ''}
                                     onChange={(e) => setPrices(prev => ({...prev, [eq.id]: parseFloat(e.target.value) || 0}))}
                                     className="w-full bg-neutral-100 dark:bg-black/50 rounded-md pl-7 pr-2 py-1.5 text-xs text-black dark:text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                           </div>
                         );
                       })}
                     </div>
                     {points.length === 0 && <p className="text-[10px] font-bold text-black/30 dark:text-white/30 italic">Adicione ativos ao mapa...</p>}
                   </div>

                   <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-3 border-b border-black/5 dark:border-white/5 pb-2">Preços: Cabos</h4>
                     <div className="space-y-3">
                       {cableTypes.map(c => {
                         const cableMeters = getCableLengths();
                         const meters = Math.round(cableMeters[c.id] || 0);
                         if (meters === 0) return null;
                         const sub = meters * (prices[c.id] || 0);
                         return (
                           <div key={c.id} className="bg-white dark:bg-[#1A1A1D] p-3 rounded-xl border border-black/5 dark:border-white/5 shadow-sm space-y-2">
                              <div className="flex justify-between items-center text-[11px] font-bold">
                                 <span className="flex items-center gap-1.5 opacity-80"><LinkIcon size={12} className="opacity-50"/> {meters}m - {c.label}</span>
                                 <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(sub)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-black/50 dark:text-white/50 w-16">Valor/Metro</span>
                                <div className="relative flex-1">
                                  <DollarSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
                                  <input 
                                     type="number" step="0.01" min="0" placeholder="0.00"
                                     value={prices[c.id] || ''}
                                     onChange={(e) => setPrices(prev => ({...prev, [c.id]: parseFloat(e.target.value) || 0}))}
                                     className="w-full bg-neutral-100 dark:bg-black/50 rounded-md pl-7 pr-2 py-1.5 text-xs text-black dark:text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>

                   <div>
                     <div className="flex justify-between items-center mb-3 border-b border-black/5 dark:border-white/5 pb-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">Materiais Adicionais</h4>
                        <button 
                           onClick={() => setExtraItems(p => [...p, { id: Date.now().toString(), name: 'Item Extra', quantity: 1, unitPrice: 0 }])}
                           className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
                        >
                          <PlusCircle size={10} /> ADD
                        </button>
                     </div>
                     <div className="space-y-3">
                       {extraItems.map((ex, idx) => (
                           <div key={ex.id} className="bg-white dark:bg-[#1A1A1D] p-3 rounded-xl border border-black/5 dark:border-white/5 shadow-sm space-y-2 relative group flex flex-col">
                              <button 
                                 onClick={() => setExtraItems(p => p.filter(i => i.id !== ex.id))}
                                 className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow"
                              >
                                <X size={10} strokeWidth={3}/>
                              </button>
                              
                              <input 
                                type="text" placeholder="Nome do Material" value={ex.name}
                                onChange={(e) => setExtraItems(p => p.map(i => i.id === ex.id ? {...i, name: e.target.value} : i))}
                                className="w-full bg-neutral-100 dark:bg-black/50 rounded-md px-2 py-1.5 text-xs text-black dark:text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                              />

                              <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-black/40 dark:text-white/40">QNT</span>
                                  <input 
                                     type="number" min="1" value={ex.quantity}
                                     onChange={(e) => setExtraItems(p => p.map(i => i.id === ex.id ? {...i, quantity: parseInt(e.target.value)||1} : i))}
                                     className="w-full bg-neutral-100 dark:bg-black/50 rounded-md pl-8 pr-2 py-1.5 text-xs text-black dark:text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div className="flex-1 relative">
                                  <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
                                  <input 
                                     type="number" step="0.01" min="0" placeholder="0.00" value={ex.unitPrice || ''}
                                     onChange={(e) => setExtraItems(p => p.map(i => i.id === ex.id ? {...i, unitPrice: parseFloat(e.target.value)||0} : i))}
                                     className="w-full bg-neutral-100 dark:bg-black/50 rounded-md pl-6 pr-2 py-1.5 text-xs text-black dark:text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                              <p className="text-right text-[10px] font-black text-emerald-600 dark:text-emerald-400 border-t border-black/5 dark:border-white/5 pt-1 mt-1">
                                Sub: {formatCurrency(ex.quantity * ex.unitPrice)}
                              </p>
                           </div>
                       ))}
                       {extraItems.length === 0 && <p className="text-[9px] font-bold text-black/30 dark:text-white/30 italic text-center">Nenhum custo externo adicionado (Ex: Passagens, Mão de obra).</p>}
                     </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
