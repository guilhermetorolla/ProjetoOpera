import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ComplianceDocument } from '../types';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';
import { FileText, Plus, ShieldCheck, FileSignature, Files, Clock, Trash2, Send, CheckCircle2, User as UserIcon, X, AlertTriangle, Paperclip, Users, BookOpen, Check, Download, Upload, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import MDEditor from '@uiw/react-md-editor';

const POLICY_TEMPLATE = (title: string, department: string) => `# ${title}
#DADOSDEVEMSERBLINDADOS

## Controle de Documento

**Histórico de versão**
Data: ___/___/___ | Versão: 1.0 | Comentários: Versão inicial

**Controle de revisão**
Revisor: ________________ | Sessão: ________________ | Comentários: ________________

---

## 1. Objetivo
Estabelecer diretrizes para armazenamento, organização e documentação, garantindo segurança, rastreabilidade, continuidade operacional e preservação do conhecimento interno no setor de ${department || '___'}.

## 2. Escopo
Esta política se aplica a:
- Todos os colaboradores do setor de ${department || '___'};
- Prestadores de serviço e terceiros autorizados;
- Sistemas internos e externos desenvolvidos pela empresa;
- Ambientes oficiais de versionamento e documentação definidos pela gestão.

## 3. Definições
- **[Termo]**: [Definição]

## 4. Diretrizes / Regras
- Todo material desenvolvido deverá ser armazenado e documentado pela empresa, em ambiente oficial definido pela gestão.
- Nenhum projeto poderá permanecer exclusivamente em ambiente pessoal do colaborador.
- O não registro adequado poderá impedir publicação, continuidade ou manutenção da solução.

## 5. Responsabilidades
**Colaboradores:**
- Cumprir as diretrizes estabelecidas;
- Manter documentação mínima atualizada;
- Seguir os padrões definidos pela empresa.

**Gestor do Setor:**
- Definir ambientes oficiais;
- Garantir cumprimento da política;
- Autorizar exceções quando necessário.

**Empresa:**
- Disponibilizar estrutura adequada para o armazenamento e gestão.

## 6. Conformidade e Penalidades
O descumprimento desta política poderá resultar em:
- Orientação formal;
- Solicitação de correção imediata;
- Restrição de acessos;
- Advertência interna;
- Outras medidas administrativas conforme gravidade do caso.

## 7. Monitoramento e Revisão
Esta política será acompanhada pela gestão do setor e revisada sempre que houver mudanças operacionais, tecnológicas ou estratégicas, com revisão mínima anual.
`;

interface ComplianceTrackerProps {
  project: Project;
  onUpdate: (data: any) => void;
}

export default function ComplianceTracker({ project, onUpdate }: ComplianceTrackerProps) {
  const { logActivity, users } = useData();
  const [localDocs, setLocalDocs] = useState<ComplianceDocument[]>(project.complianceData?.documents || []);
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDocument | null>(null);

  // States for doc editing
  const [docContent, setDocContent] = useState('');
  const [isEditingContent, setIsEditingContent] = useState(false);

  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocForm, setNewDocForm] = useState<Partial<ComplianceDocument>>({
    title: '',
    type: 'policy',
    department: '',
    status: 'draft'
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const mainDocInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpdateDocs = (updatedDocs: ComplianceDocument[]) => {
    setLocalDocs(updatedDocs);
    onUpdate({ ...project.complianceData, documents: updatedDocs });
  };

  const handleSaveNewDoc = () => {
    if (!newDocForm.title) return;
    
    let initialContent = '';
    const dep = newDocForm.department || 'Geral';
    if (newDocForm.type === 'policy') {
      initialContent = POLICY_TEMPLATE(newDocForm.title, dep);
    }

    const newDoc: ComplianceDocument = {
      id: `doc-${Date.now()}`,
      title: newDocForm.title,
      type: newDocForm.type as ComplianceDocument['type'],
      status: 'draft',
      department: dep,
      content: initialContent,
      signers: []
    };
    
    handleUpdateDocs([...localDocs, newDoc]);
    setIsAddingDoc(false);
    logActivity('criou um documento de compliance', newDoc.title, 'JURÍDICO');
    setNewDocForm({ title: '', type: 'policy', department: '', status: 'draft' });
  };

  const handleDeleteDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const docToDelete = localDocs.find(d => d.id === id);
    if (!docToDelete) return;
    const updated = localDocs.filter(d => d.id !== id);
    handleUpdateDocs(updated);
    if (selectedDoc?.id === id) setSelectedDoc(null);
    logActivity('excluiu um documento de compliance', docToDelete.title, 'JURÍDICO');
  };

  const handleSelectDoc = (doc: ComplianceDocument) => {
    setSelectedDoc(doc);
    setDocContent(doc.content || '');
    setIsEditingContent(false);
  };

  const handleSaveContent = () => {
    if (!selectedDoc) return;
    const updatedDoc = { ...selectedDoc, content: docContent };
    handleUpdateSelectedDoc(updatedDoc);
    setIsEditingContent(false);
  };

  const handleUpdateSelectedDoc = (updatedDoc: ComplianceDocument) => {
    const updatedDocs = localDocs.map(d => d.id === updatedDoc.id ? updatedDoc : d);
    setSelectedDoc(updatedDoc);
    handleUpdateDocs(updatedDocs);
  };

  const handleImportMainDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setDocContent(event.target?.result as string);
      setIsEditingContent(true);
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportPDF = () => {
    const printContent = document.getElementById('printable-markdown-doc');
    if (!printContent) return;
    const win = window.open('', '', 'width=900,height=800');
    if (!win) return;
    win.document.write(`
      <html><head><title>${selectedDoc?.title || 'Document'}</title>
      <style>
        body { font-family: sans-serif; padding: 40px; color: #000; }
        h1 { font-size: 24px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
        h2 { font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        p, li { line-height: 1.6; font-size: 14px; }
        ul { margin-bottom: 20px; }
        strong { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
      </style>
      </head><body>
      ${printContent.innerHTML}
      <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
      </body></html>
    `);
    win.document.close();
  };

  const handleAddAttachment = () => {
    if (!selectedDoc) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDoc || !e.target.files?.length) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
       const url = event.target?.result as string;
       const newAttachment = {
         id: `att-${Date.now()}`,
         name: file.name,
         url, // This is a data url
         uploadedAt: new Date().toISOString()
       };
       handleUpdateSelectedDoc({
         ...selectedDoc,
         attachments: [...(selectedDoc.attachments || []), newAttachment]
       });
       logActivity('anexou um arquivo', file.name, 'DOCUMENTAÇÃO');
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset
  };

  const handleAddCollaborator = () => {
    if (!selectedDoc) return;
    const userEmail = prompt('Digite o email do usuário para compartilhar acesso:');
    if (!userEmail) return;

    const userToAdd = users.find(u => u.email === userEmail) || {
      id: `u-${Date.now()}`,
      name: userEmail.split('@')[0],
      email: userEmail,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`,
      role: 'Convidado'
    };

    if (selectedDoc.collaborators?.some(c => c.id === userToAdd.id)) {
      alert('Usuário já é colaborador!');
      return;
    }

    handleUpdateSelectedDoc({
      ...selectedDoc,
      collaborators: [...(selectedDoc.collaborators || []), userToAdd]
    });
    logActivity('compartilhou documento', selectedDoc.title, 'COLABORAÇÃO');
  };

  const handleMockSignRequest = () => {
    if (!selectedDoc) return;
    const newSigner = prompt('Nome/E-mail do signatário (ex: DPO, dpo@ibiunet.com):');
    if (!newSigner) return;

    const emailMatch = newSigner.match(/<([^>]+)>|(\S+@\S+)/);
    const email = emailMatch ? emailMatch[0] : 'email@pendente.com';
    const name = newSigner.replace(email, '').trim() || newSigner;

    const updatedDoc: ComplianceDocument = {
      ...selectedDoc,
      status: 'pending_signature',
      signers: [...(selectedDoc.signers || []), { name, email, signed: false }]
    };

    const updatedDocs = localDocs.map(d => d.id === selectedDoc.id ? updatedDoc : d);
    setSelectedDoc(updatedDoc);
    handleUpdateDocs(updatedDocs);
    logActivity('solicitou assinatura em', selectedDoc.title, 'JURÍDICO');
  };

  const handleMockApproveSignature = (signerEmail: string) => {
    if (!selectedDoc) return;
    
    const updatedSigners = selectedDoc.signers?.map(s => 
      s.email === signerEmail ? { ...s, signed: true, signedAt: new Date().toISOString() } : s
    ) || [];

    const allSigned = updatedSigners.every(s => s.signed);
    
    const updatedDoc: ComplianceDocument = {
      ...selectedDoc,
      signers: updatedSigners,
      status: allSigned && updatedSigners.length > 0 ? 'signed' : selectedDoc.status
    };

    const updatedDocs = localDocs.map(d => d.id === selectedDoc.id ? updatedDoc : d);
    setSelectedDoc(updatedDoc);
    handleUpdateDocs(updatedDocs);
  };

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'policy': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'contract': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'report': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'evidence': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'pop': return 'bg-teal-500/10 text-teal-600 border-teal-500/20';
      case 'manual': return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      default: return 'bg-neutral-500/10 text-neutral-600 border-neutral-500/20';
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-white/60';
      case 'pending_signature': return 'bg-amber-500/10 text-amber-600';
      case 'signed': return 'bg-emerald-500/10 text-emerald-600';
      case 'approved': return 'bg-blue-500/10 text-blue-600';
      default: return 'bg-neutral-100 text-neutral-600';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-neutral-50/50 dark:bg-[#0a0a0b] overflow-hidden">
      
      {/* HEADER / STATS */}
      <div className="grid grid-cols-4 gap-6 p-8 border-b border-black/5 dark:border-white/5 shrink-0 bg-white dark:bg-[#121212]">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
             <ShieldCheck size={24} />
           </div>
           <div>
             <h2 className="text-sm font-black uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Adequação / Compliance</h2>
             <p className="text-xl font-extrabold tracking-tighter text-black dark:text-white">{project.name}</p>
           </div>
        </div>
        
        <div className="bg-neutral-50 dark:bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-black/5 dark:border-white/5">
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40 mb-1">Total</p>
             <p className="text-2xl font-black text-black dark:text-white">{localDocs.length}</p>
           </div>
           <Files size={24} className="text-black/20 dark:text-white/20" />
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/5 rounded-2xl p-4 flex items-center justify-between border border-amber-500/10">
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 dark:text-amber-400/60 mb-1">Assinatura Pendente</p>
             <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{localDocs.filter(d => d.status === 'pending_signature').length}</p>
           </div>
           <Clock size={24} className="text-amber-500/20" />
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl p-4 flex items-center justify-between border border-emerald-500/10">
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60 mb-1">Finalizados</p>
             <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{localDocs.filter(d => d.status === 'signed' || d.status === 'approved').length}</p>
           </div>
           <ShieldCheck size={24} className="text-emerald-500/20" />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Central de Documentos</h3>
            <button 
              onClick={() => setIsAddingDoc(true)}
              className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] transition-all px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg"
            >
              <Plus size={14} /> Novo Documento
            </button>
          </div>

          {isAddingDoc && (
             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-white dark:bg-[#121212] p-6 rounded-[32px] border border-black/5 dark:border-white/10 shadow-xl">
               <div className="flex items-center justify-between mb-4">
                 <h4 className="text-sm font-black uppercase tracking-widest text-black dark:text-white">Criar Documento</h4>
                 <button onClick={() => setIsAddingDoc(false)} className="text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors"><X size={16} /></button>
               </div>
               <div className="flex gap-4 mb-4">
                 <input 
                   type="text" 
                   value={newDocForm.title} onChange={e => setNewDocForm({...newDocForm, title: e.target.value})} 
                   placeholder="Título do Documento (Ex: Política LGPD Setor RH)"
                   className="flex-1 bg-neutral-50 dark:bg-white/5 border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-black/10 outline-none"
                 />
                 <select 
                   value={newDocForm.type} onChange={e => setNewDocForm({...newDocForm, type: e.target.value as any})}
                   className="w-48 bg-neutral-50 dark:bg-white/5 border-none p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none"
                 >
                   <option value="policy">📜 Política</option>
                   <option value="contract">🤝 Contrato</option>
                   <option value="report">📊 Relatório/Aviso</option>
                   <option value="evidence">✅ Evidência</option>
                   <option value="pop">🔄 POP (Procedimento)</option>
                   <option value="manual">📖 Manual</option>
                 </select>
               </div>
               <div className="flex gap-4 items-center">
                 <input 
                   type="text" 
                   value={newDocForm.department} onChange={e => setNewDocForm({...newDocForm, department: e.target.value})} 
                   placeholder="Setor Responsável (Ex: RH, Comercial)"
                   className="flex-1 bg-neutral-50 dark:bg-white/5 border-none p-4 rounded-xl text-xs font-bold focus:ring-2 focus:ring-black/10 outline-none"
                 />
                 <button onClick={handleSaveNewDoc} disabled={!newDocForm.title} className="bg-emerald-500 text-white px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors disabled:opacity-50">
                   Salvar Documento
                 </button>
               </div>
             </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {localDocs.map(doc => (
                 <motion.div
                   key={doc.id}
                   layout
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   onClick={() => handleSelectDoc(doc)}
                   className={cn(
                     "bg-white dark:bg-[#121212] p-6 rounded-[32px] border transition-all cursor-pointer group hover:shadow-xl",
                     selectedDoc?.id === doc.id 
                       ? "border-black/20 dark:border-white/20 shadow-xl scale-[1.02]" 
                       : "border-black/5 dark:border-white/10 shadow-sm"
                   )}
                 >
                   <div className="flex justify-between items-start mb-4">
                     <span className={cn("text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-md border", getTypeStyle(doc.type))}>
                       {doc.type}
                     </span>
                     <button onClick={(e) => handleDeleteDoc(doc.id, e)} className="text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-full transition-all">
                       <Trash2 size={14} />
                     </button>
                   </div>
                   <h4 className="text-sm font-extrabold text-black dark:text-white tracking-tight mb-2 leading-tight">{doc.title}</h4>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40 mb-6">{doc.department}</p>
                   
                   <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-4">
                     <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1", getStatusStyle(doc.status))}>
                       {doc.status === 'signed' ? <CheckCircle2 size={12}/> : doc.status === 'pending_signature' ? <Clock size={12}/> : <FileText size={12}/>}
                       {doc.status.replace('_', ' ')}
                     </span>
                     {doc.signers && doc.signers.length > 0 && (
                       <div className="flex -space-x-2">
                         {doc.signers.map((s, i) => (
                            <div key={i} className={cn("w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-bg-[#121212] text-[8px] font-bold text-white shadow-sm", s.signed ? "bg-emerald-500" : "bg-amber-400")} title={s.email}>
                              {s.name.charAt(0)}
                            </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </motion.div>
              ))}
            </AnimatePresence>
            
            {localDocs.length === 0 && !isAddingDoc && (
               <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-[32px] opacity-50">
                 <FileSignature size={48} className="mb-4 text-black dark:text-white opacity-40" />
                 <p className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Nenhum Documento Localizado</p>
                 <p className="text-[10px] max-w-sm text-center font-medium mt-2">Comece criando políticas ou solicitando assinaturas de adequação LGPD.</p>
               </div>
            )}
          </div>
        </div>

        {/* SIDEBAR DETAILS */}
        <AnimatePresence>
          {selectedDoc && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-96 bg-white dark:bg-[#121212] border-l border-black/5 dark:border-white/5 shadow-2xl flex flex-col flex-shrink-0"
            >
               <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-start justify-between">
                 <div>
                   <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded inline-flex items-center gap-1.5 mb-4", getStatusStyle(selectedDoc.status))}>
                      {selectedDoc.status.replace('_', ' ')}
                   </span>
                   <h3 className="text-xl font-extrabold tracking-tighter text-black dark:text-white leading-tight">{selectedDoc.title}</h3>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40 mt-2">Setor Responsável: {selectedDoc.department}</p>
                 </div>
                 <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={16} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8">
                 
                 {/* COLLABORATORS */}
                 <div>
                   <div className="flex justify-between items-center mb-4">
                     <h4 className="text-xs font-black tracking-widest uppercase text-[#5d5e66] dark:text-white/40 flex items-center gap-2">
                       <Users size={14} /> Colaboradores
                     </h4>
                     <button onClick={handleAddCollaborator} className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                       <Plus size={12} /> Adicionar
                     </button>
                   </div>
                   {selectedDoc.collaborators && selectedDoc.collaborators.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                       {selectedDoc.collaborators.map(c => (
                         <div key={c.id} className="bg-neutral-100 dark:bg-white/10 pr-3 pl-1 py-1 rounded-full flex items-center gap-2 border border-black/5 dark:border-white/5">
                           <img src={c.avatar} className="w-6 h-6 rounded-full bg-white dark:bg-[#121212]" alt=""/>
                           <span className="text-[10px] font-bold text-black dark:text-white">{c.name}</span>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-[10px] font-bold text-black/40 dark:text-white/40">Somente você tem acesso.</p>
                   )}
                 </div>

                 {/* RICH TEXT CONTENT */}
                 <div>
                   <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-3">
                       <h4 className="text-xs font-black tracking-widest uppercase text-[#5d5e66] dark:text-white/40 flex items-center gap-2">
                         <BookOpen size={14} /> Redação/Conteúdo
                       </h4>
                       <input type="file" ref={mainDocInputRef} onChange={handleImportMainDoc} className="hidden" accept=".txt,.md,.csv" />
                       <button onClick={() => mainDocInputRef.current?.click()} className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-1" title="Importar arquivo de texto como documento principal">
                         <Upload size={12} /> Importar Arquivo Base
                       </button>
                     </div>

                     <div className="flex items-center gap-4">
                       {docContent && (
                         <button onClick={handleExportPDF} className="text-[9px] font-black uppercase tracking-widest text-[#5d5e66] dark:text-white/40 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1" title="Gera PDF">
                           <Download size={14} /> PDF
                         </button>
                       )}
                       <button onClick={() => setIsEditingContent(true)} className="bg-indigo-500 text-white shadow-md hover:bg-indigo-600 transition-all px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                         <Maximize2 size={14} /> Editar Tela Cheia
                       </button>
                     </div>
                   </div>
                   
                   <div className="bg-neutral-50 dark:bg-white/5 p-6 rounded-2xl border border-black/5 dark:border-white/5 min-h-[120px] group max-h-96 overflow-y-auto">
                     {docContent ? (
                       <div id="printable-markdown-doc" className="prose prose-sm dark:prose-invert prose-headings:font-black prose-h1:text-xl prose-h2:text-sm prose-h1:uppercase prose-h1:tracking-tighter prose-h2:uppercase prose-h2:tracking-widest prose-h2:border-b prose-h2:border-black/10 prose-h2:pb-2 prose-h2:mb-4 prose-p:leading-relaxed prose-li:font-medium prose-a:text-indigo-500 prose-hr:border-black/5 max-w-none">
                         <ReactMarkdown>{docContent}</ReactMarkdown>
                       </div>
                     ) : (
                       <div className="h-full flex flex-col items-center justify-center opacity-40 py-6">
                         <FileText size={24} className="mb-2" />
                         <p className="text-[10px] font-bold uppercase tracking-widest">Documento Vazio</p>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* ATTACHMENTS */}
                 <div>
                   <div className="flex justify-between items-center mb-4">
                     <h4 className="text-xs font-black tracking-widest uppercase text-[#5d5e66] dark:text-white/40 flex items-center gap-2">
                       <Paperclip size={14} /> Anexos
                     </h4>
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       onChange={handleFileChange} 
                       className="hidden" 
                       accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                     />
                     <button onClick={handleAddAttachment} className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                       <Plus size={12} /> Anexar Arquivo Real
                     </button>
                   </div>
                   
                   {selectedDoc.attachments && selectedDoc.attachments.length > 0 ? (
                     <div className="space-y-2">
                       {selectedDoc.attachments.map(att => (
                         <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-3 rounded-xl flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors group">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                               <Paperclip size={14} />
                             </div>
                             <div>
                               <p className="text-xs font-bold text-black dark:text-white group-hover:text-indigo-500 transition-colors">{att.name}</p>
                               <p className="text-[9px] font-medium text-black/40 dark:text-white/40">{format(new Date(att.uploadedAt), "dd/MMM - HH:mm")}</p>
                             </div>
                           </div>
                         </a>
                       ))}
                     </div>
                   ) : (
                     <p className="text-[10px] font-bold text-black/40 dark:text-white/40">Nenhum arquivo anexado.</p>
                   )}
                 </div>

                 {/* Assinaturas */}
                 <div>
                   <div className="flex justify-between items-center mb-4">
                     <h4 className="text-xs font-black tracking-widest uppercase text-[#5d5e66] dark:text-white/40 flex items-center gap-2">
                       <FileSignature size={14} /> Fluxo de Assinatura
                     </h4>
                     <button 
                       onClick={handleMockSignRequest}
                       className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                     >
                       <Send size={12} /> Solicitar
                     </button>
                   </div>
                   
                   {selectedDoc.signers && selectedDoc.signers.length > 0 ? (
                     <div className="space-y-3">
                       {selectedDoc.signers.map((signer, idx) => (
                         <div key={idx} className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/10 flex items-center justify-center">
                                <UserIcon size={14} className="text-black dark:text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-black dark:text-white">{signer.name}</p>
                                <p className="text-[9px] font-medium text-black/40 dark:text-white/40">{signer.email}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              {signer.signed ? (
                                <div className="text-right">
                                  <CheckCircle2 size={16} className="text-emerald-500 inline-block mb-1" />
                                  <p className="text-[8px] font-black uppercase tracking-widest text-[#5d5e66] dark:text-white/40">
                                    {signer.signedAt ? format(new Date(signer.signedAt), "dd/MMM", { locale: ptBR }) : 'OK'}
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Pendente</span>
                                  <button onClick={() => handleMockApproveSignature(signer.email)} className="opacity-0 group-hover:opacity-100 p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg transition-all scale-75 hover:scale-100" title="Aprovar (Simulação)">
                                    <Check size={12}/>
                                  </button>
                                </>
                              )}
                            </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center p-6 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Nenhuma Assinatura Solicitada</p>
                     </div>
                   )}
                 </div>

                 {selectedDoc.status === 'draft' && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 flex gap-3">
                       <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                       <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400">Este documento está em rascunho. Preencha as informações para habilitar a solicitação oficial de assinaturas.</p>
                    </div>
                 )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FULLSCREEN EDITOR MODAL */}
      <AnimatePresence>
        {isEditingContent && selectedDoc && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.98 }}
            className="fixed inset-0 z-50 bg-white dark:bg-[#0a0a0b] flex flex-col"
          >
            <div className="flex items-center justify-between px-8 py-4 border-b border-black/5 dark:border-white/5 shadow-sm bg-white dark:bg-[#121212]">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5d5e66] dark:text-white/40">Editando Documento Principal</span>
                <h2 className="text-xl font-black text-black dark:text-white">{selectedDoc.title}</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input type="file" ref={mainDocInputRef} onChange={handleImportMainDoc} className="hidden" accept=".txt,.md,.csv" />
                  <button onClick={() => mainDocInputRef.current?.click()} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-4 py-2 rounded-xl transition-all flex items-center gap-2">
                    <Upload size={14} /> Importar Base (.txt/.md)
                  </button>
                </div>
                <div className="h-6 w-px bg-black/10 dark:bg-white/10" />
                <button onClick={handleSaveContent} className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                  <Check size={16} /> Salvar & Fechar Editor
                </button>
              </div>
            </div>
            <div className="flex-1 p-8 bg-neutral-50/50 dark:bg-[#0a0a0b] overflow-hidden">
               <div className="h-full w-full max-w-6xl mx-auto rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-2xl" data-color-mode="light">
                 <MDEditor
                   value={docContent}
                   onChange={(val) => setDocContent(val || '')}
                   height="100%"
                   preview="live"
                   className="h-full w-full"
                 />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
