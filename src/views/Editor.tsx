import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  ChevronLeft,
  Share2,
  Lock,
  Globe,
  Users,
  FileDown
} from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';
import { documentsService } from '../services/documentsService';
import { Doc } from '../types';
import ShareDialog from '../components/ShareDialog';

export default function Editor({ documentId, onBack }: { documentId?: string | null, onBack?: () => void }) {
  const { currentUser, users, logActivity } = useData();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shares, setShares] = useState<any[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId]);

  const loadDocument = async (id: string, attempt = 1) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Editor: Tentativa ${attempt} de carregar documento: ${id}`);
      
      const d = await documentsService.getDocumentById(id);
      
      if (!d) {
        if (attempt < 3) {
          const delay = attempt * 500; // 500ms, depois 1000ms
          console.log(`Editor: Não encontrado. Tentando novamente em ${delay}ms...`);
          setTimeout(() => loadDocument(id, attempt + 1), delay);
          return;
        }
        throw new Error('O documento ainda não está disponível no banco de dados. Tente atualizar a página.');
      }
      
      const s = await documentsService.getShares(id);
      setDoc(d);
      setShares(s);
      setLoading(false);
    } catch (err: any) {
      console.error('Editor: Erro ao carregar documento:', err);
      setError(err.message || 'Erro desconhecido ao carregar.');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!doc || !documentId) return;
    setSaving(true);
    
    const updatedTitle = titleRef.current?.innerText || doc.title;
    const updatedContent = contentRef.current?.innerHTML || doc.content;
    
    const success = await documentsService.updateDocument(documentId, {
      title: updatedTitle,
      content: updatedContent
    });
    
    if (success) {
      logActivity('salvou alterações em', updatedTitle, 'DOCUMENTO');
      setDoc(prev => prev ? { ...prev, title: updatedTitle, content: updatedContent } : null);
    }
    setSaving(false);
  };

  const handleShare = async (userId: string, permission: 'view' | 'edit') => {
    if (!documentId) return;
    const success = await documentsService.shareDocument(documentId, userId, permission);
    if (success) {
      const updatedShares = await documentsService.getShares(documentId);
      setShares(updatedShares);
      const sharedUser = users.find(u => u.id === userId);
      logActivity('compartilhou o documento', doc?.title || 'Documento', 'SISTEMA', [sharedUser?.name || 'Funcionário']);
    }
  };

  const exportToPDF = async () => {
    if (!doc || !contentRef.current || !titleRef.current) return;
    
    setSaving(true);
    
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      // 1. Criamos um container temporário e isolado do resto da página
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '800px'; // Largura fixa para consistência
      container.style.padding = '40px';
      container.style.backgroundColor = '#ffffff';
      container.style.color = '#000000';
      container.style.fontFamily = 'serif'; // Fonte segura para PDF
      
      // 2. Construímos o conteúdo manualmente para garantir que NÃO existam classes do Tailwind v4
      const title = document.createElement('h1');
      title.innerText = titleRef.current.innerText;
      title.style.fontSize = '32pt';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '20pt';
      title.style.borderBottom = '1pt solid #eee';
      title.style.paddingBottom = '10pt';
      
      const content = document.createElement('div');
      content.innerHTML = contentRef.current.innerHTML;
      content.style.fontSize = '12pt';
      content.style.lineHeight = '1.6';
      
      container.appendChild(title);
      container.appendChild(content);
      document.body.appendChild(container);

      // 3. Capturamos este container isolado
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // 4. Limpamos o container
      document.body.removeChild(container);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, (pdfHeight > 295 ? 295 : pdfHeight));
      pdf.save(`Opero - ${doc.title}.pdf`);
      
      logActivity('exportou para PDF', doc.title, 'DOCUMENTO');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Falha ao gerar o PDF. Tente salvar o documento antes de exportar.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async () => {
    if (!doc || !documentId) return;
    const order: Doc['visibility'][] = ['private', 'shared', 'workspace'];
    const currentIndex = order.indexOf(doc.visibility);
    const nextVisibility = order[(currentIndex + 1) % order.length];
    
    const success = await documentsService.updateDocument(documentId, { visibility: nextVisibility });
    if (success) {
      setDoc(prev => prev ? { ...prev, visibility: nextVisibility } : null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-12 h-12 border-4 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-black/40 dark:text-white/40">Carregando Conhecimento...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <h2 className="text-2xl font-black tracking-tighter text-black dark:text-white transition-colors">Documento não encontrado</h2>
        {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
        <p className="text-black/40 dark:text-white/40 text-xs max-w-xs uppercase tracking-widest font-bold">
          Isso pode acontecer se o banco de dados ainda estiver processando a criação ou se houve uma falha na conexão.
        </p>
        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => documentId && loadDocument(documentId)} 
            className="text-xs font-bold uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            Tentar Novamente
          </button>
          <button 
            onClick={onBack} 
            className="text-xs font-bold uppercase tracking-widest bg-black/5 dark:bg-white/5 text-black dark:text-white px-6 py-3 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-black/5 dark:border-white/10"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto pt-12 pb-32 px-12 lg:px-24"
      >
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between mb-16">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={16} /> Arquivos
          </button>
          <div className="flex items-center gap-6">
             <button 
               onClick={toggleVisibility}
               className="flex items-center gap-2 text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest hover:text-black dark:hover:text-white transition-all underline-offset-4 hover:underline"
             >
                {doc.visibility === 'private' && <Lock size={14} />}
                {doc.visibility === 'shared' && <Users size={14} />}
                {doc.visibility === 'workspace' && <Globe size={14} />}
                <span>{doc.visibility}</span>
             </button>
             <button 
               onClick={() => setIsShareOpen(true)}
               className="flex items-center gap-2 text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest hover:text-black dark:hover:text-white transition-all underline-offset-4 hover:underline"
             >
               <Share2 size={14} /> Compartilhar
             </button>
             <button 
               onClick={exportToPDF}
               disabled={saving}
               className="flex items-center gap-2 text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest hover:text-black dark:hover:text-white transition-all disabled:opacity-50 underline-offset-4 hover:underline"
             >
               <FileDown size={14} /> Exportar PDF
             </button>
             <button 
               onClick={handleSave} 
               disabled={saving}
               className={cn(
                 "bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2",
                 saving && "opacity-50 cursor-not-allowed"
               )}
             >
               {saving ? (
                 <div className="w-3 h-3 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />
               ) : (
                 <Check size={14} />
               )}
               {saving ? 'Salvando...' : 'Salvar Alterações'}
             </button>
          </div>
        </div>

        {/* Document Printable Area */}
        <div id="document-printable-area" className="bg-transparent">
          {/* Page Header */}
          <div className="mb-16 group relative">
            <h1 
              ref={titleRef}
              className="text-6xl font-extrabold tracking-tighter text-black dark:text-white transition-colors leading-[1.1] mb-6 outline-none focus:bg-black/5 dark:focus:bg-white/5 rounded-xl p-2 -ml-2" 
              contentEditable 
              suppressContentEditableWarning
            >
              {doc.title}
            </h1>

            <div className="flex items-center gap-6 text-black/40 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <History size={16} />
                <span>Modificado {new Date(doc.updatedAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2">
                 <img src={doc.author?.avatar} className="w-5 h-5 rounded-full object-cover border border-black/5 dark:border-white/10" alt="" referrerPolicy="no-referrer" />
                 <span>Por {doc.author?.name || 'Você'}</span>
              </div>
              {shares.length > 0 && (
                <div className="flex -space-x-2">
                   {shares.slice(0, 3).map((s, i) => (
                     <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#121212] bg-neutral-200 dark:bg-white/10 flex items-center justify-center text-[8px] font-bold text-black dark:text-white font-sans transition-colors">
                       {s.user_id[0].toUpperCase()}
                     </div>
                   ))}
                   {shares.length > 3 && <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#121212] bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[8px] font-bold transition-colors">+{shares.length - 3}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Editor Content */}
          <div 
            ref={contentRef}
            className="prose prose-neutral dark:prose-invert max-w-none min-h-[400px] outline-none text-xl leading-relaxed text-black/80 dark:text-white/80 transition-colors" 
            contentEditable 
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: doc.content || '<p>Comece a escrever sua estratégia aqui...</p>' }}
          />
        </div>
      </motion.div>

      <ShareDialog 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        users={users}
        currentShares={shares}
        onShare={handleShare}
      />
    </div>
  );
}
