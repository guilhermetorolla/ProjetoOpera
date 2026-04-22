import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Plus, 
  Folder, 
  Clock, 
  Star, 
  MoreVertical, 
  Grid, 
  List as ListIcon,
  Filter,
  ChevronRight,
  Shield,
  Eye,
  Trash2
} from 'lucide-react';
import { documentsService } from '../services/documentsService';
import { Doc } from '../types';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';

export default function Documents({ onOpenDocument }: { onOpenDocument: (id: string) => void }) {
  const { users, logActivity } = useData();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const docs = await documentsService.getDocuments();
    setDocuments(docs);
    setLoading(false);
  };

  const handleCreateDocument = async () => {
    try {
      setCreating(true);
      console.log('Documents: Tentando criar documento...');
      const title = 'Novo Documento ' + new Date().toLocaleDateString();
      const newDoc = await documentsService.createDocument(title, 'doc');
      
      if (newDoc) {
        console.log('Documents: Documento criado com sucesso:', newDoc.id);
        logActivity('criou um novo documento', title, 'DOCUMENTO');
        onOpenDocument(newDoc.id);
      } else {
        console.error('Documents: Falha ao criar documento - service retornou null');
        alert('Erro ao criar documento. Verifique se as tabelas foram criadas no Supabase.');
      }
    } catch (error) {
      console.error('Documents: Erro fatal ao criar documento:', error);
      alert('Erro de conexão ao criar documento.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    const nextStarred = !doc.starred;
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, starred: nextStarred } : d));
    await documentsService.toggleStar(id, nextStarred);
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      const success = await documentsService.deleteDocument(id);
      if (success) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        logActivity('excluiu um documento', 'ID: ' + id, 'DOCUMENTO');
      }
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tighter text-black dark:text-white transition-colors">Documentos</h2>
          <p className="text-black/40 dark:text-white/40 mt-2 font-medium">Repositório central de conhecimento e ativos do Opero.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20 dark:text-white/20" size={16} />
            <input 
              type="text" 
              placeholder="Buscar em arquivos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none w-64 transition-all"
            />
          </div>
          <button className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-colors text-black dark:text-white">
            <Filter size={18} />
          </button>
          <button 
            onClick={handleCreateDocument}
            disabled={creating}
            className={cn(
              "bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl",
              creating && "opacity-50 cursor-not-allowed"
            )}
          >
            {creating ? (
              <div className="w-4 h-4 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            {creating ? 'Criando...' : 'Novo Documento'}
          </button>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Categories / Quick Access */}
      {!loading && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Recentes', icon: Clock, count: documents.length, color: 'text-blue-500' },
            { label: 'Favoritos', icon: Star, count: documents.filter(d => d.starred).length, color: 'text-amber-500' },
            { label: 'Privados', icon: Shield, count: documents.filter(d => d.visibility === 'private').length, color: 'text-rose-500' },
            { label: 'Arquivos', icon: Folder, count: documents.length, color: 'text-emerald-500' },
          ].map((cat, i) => (
            <button key={i} className="bg-white/10 dark:bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm flex items-center gap-4 hover:bg-white/20 dark:hover:bg-white/10 transition-all text-left">
              <div className={cn("w-12 h-12 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm", cat.color)}>
                <cat.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest leading-none mb-1">{cat.label}</p>
                <p className="text-xl font-black tracking-tight text-black dark:text-white transition-colors">{cat.count}</p>
              </div>
            </button>
          ))}
        </section>
      )}

      {/* Main Document Area */}
      {!loading && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-black dark:text-white transition-colors">Todos os Arquivos</h3>
            <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-black/5 dark:border-white/10">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded transition-all", viewMode === 'grid' ? "bg-white dark:bg-white/20 shadow-sm text-black dark:text-white" : "opacity-40 text-black dark:text-white")}
              >
                <Grid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded transition-all", viewMode === 'list' ? "bg-white dark:bg-white/20 shadow-sm text-black dark:text-white" : "opacity-40 text-black dark:text-white")}
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div 
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredDocs.map((doc) => (
                  <div 
                    key={doc.id} 
                    onClick={() => onOpenDocument(doc.id)}
                    className="group bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-black/5 dark:border-white/10 shadow-sm hover:shadow-2xl hover:border-black/10 dark:hover:border-white/20 transition-all cursor-pointer p-5 flex flex-col h-[200px]"
                  >
                    <div className="flex justify-between items-start mb-auto">
                      <div className="w-10 h-10 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => handleToggleStar(doc.id, e)}
                          className={cn(
                            "p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all",
                            doc.starred ? "text-amber-500 opacity-100" : "opacity-0 group-hover:opacity-100 dark:text-white/60"
                          )}
                        >
                          <Star size={16} fill={doc.starred ? "currentColor" : "none"} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded-md transition-all dark:text-white/60"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-bold leading-tight line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-black dark:text-white transition-colors uppercase tracking-tight">{doc.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-black/40 dark:text-white/40 font-bold uppercase tracking-widest mt-4">
                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1">
                          {doc.visibility === 'private' && <Shield size={10} />}
                          {doc.visibility === 'shared' && <Eye size={10} />}
                          <span>{doc.visibility}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden shadow-sm"
              >
                <table className="w-full text-left">
                  <thead className="border-b border-black/5 dark:border-white/10">
                    <tr className="text-[10px] font-bold uppercase tracking-[.2em] text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5">
                      <th className="px-6 py-4">Nome</th>
                      <th className="px-6 py-4">Modificado</th>
                      <th className="px-6 py-4">Autor</th>
                      <th className="px-6 py-4 text-right pr-10">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/10 text-black dark:text-white transition-colors">
                    {filteredDocs.map((doc) => (
                      <tr 
                        key={doc.id} 
                        onClick={() => onOpenDocument(doc.id)}
                        className="group hover:bg-white/20 dark:hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-black/20 dark:text-white/20" />
                            <span className="text-sm font-bold tracking-tight uppercase">{doc.title}</span>
                            <button 
                              onClick={(e) => handleToggleStar(doc.id, e)}
                              className={cn(
                                "transition-all",
                                doc.starred ? "text-amber-500 opacity-100" : "opacity-0 group-hover:opacity-100 dark:text-white/60"
                              )}
                            >
                              <Star size={12} fill={doc.starred ? "currentColor" : "none"} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-black/40 dark:text-white/40">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[8px] font-bold border border-black/5 dark:border-white/10">
                              {doc.author?.name?.[0] || doc.authorId[0]}
                            </div>
                            <span className="text-xs font-medium text-black/60 dark:text-white/60">{doc.author?.name || 'Você'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right pr-6 opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="flex items-center justify-end gap-2">
                             <button 
                               onClick={(e) => handleDeleteDocument(doc.id, e)}
                               className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-all dark:text-white/60"
                             >
                               <Trash2 size={16} />
                             </button>
                             <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-black dark:text-white transition-all">
                               <ChevronRight size={16} />
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}
