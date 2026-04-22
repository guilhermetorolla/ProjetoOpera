import { supabase } from '../lib/supabase';
import { Doc, DocumentShare } from '../types';

export const documentsService = {
  async getDocuments(): Promise<Doc[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*, author:profiles(*)');

      if (error) {
        console.error('documentsService: Error fetching documents:', error);
        return [];
      }

      return (data || []).map(doc => ({
        ...doc,
        updatedAt: doc.updated_at,
        authorId: doc.author_id,
        author: doc.author ? {
          id: doc.author.id,
          name: doc.author.name,
          avatar: doc.author.avatar_url,
          role: doc.author.role,
          email: doc.author.email
        } : undefined
      }));
    } catch (e) {
      console.error('documentsService: Critical failure in getDocuments:', e);
      return [];
    }
  },

  async getDocumentById(id: string): Promise<Doc | null> {
    try {
      console.log('documentsService: Iniciando busca bruta por ID:', id);
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('documentsService: Erro na busca bruta:', error);
        return null;
      }

      if (!data) {
        console.warn('documentsService: Nenhum documento encontrado para o ID:', id);
        return null;
      }

      // Tenta buscar o autor separadamente para não quebrar a consulta principal
      let authorData = null;
      try {
        const { data: auth } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.author_id)
          .maybeSingle();
        authorData = auth;
      } catch (e) {
        console.warn('documentsService: Falha ao buscar autor (não crítico):', e);
      }

      return {
        ...data,
        updatedAt: data.updated_at,
        authorId: data.author_id,
        author: authorData ? {
          id: authorData.id,
          name: authorData.name,
          avatar: authorData.avatar_url,
          role: authorData.role,
          email: authorData.email
        } : undefined
      };
    } catch (e) {
      console.error('documentsService: Falha crítica total em getDocumentById:', e);
      return null;
    }
  },

  async createDocument(title: string, type: 'doc' | 'sheet' | 'slide' = 'doc'): Promise<Doc | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        console.error('documentsService: No user session found');
        return null;
      }

      const { data, error } = await supabase
        .from('documents')
        .insert([{
          title: title,
          type: type,
          author_id: user.id,
          content: '',
          starred: false,
          visibility: 'private'
        }])
        .select()
        .single();

      if (error) {
        console.error('documentsService: Erro detalhado do Supabase:', error);
        alert(`ERRO SUPABASE: ${error.message} (${error.code})`);
        return null;
      }

      return {
        ...data,
        updatedAt: data.updated_at,
        authorId: data.author_id
      };
    } catch (err) {
      console.error('documentsService: Erro inesperado:', err);
      return null;
    }
  },

  async updateDocument(id: string, updates: Partial<Doc>): Promise<boolean> {
    const { error } = await supabase
      .from('documents')
      .update({
        title: updates.title,
        content: updates.content,
        starred: updates.starred,
        visibility: updates.visibility,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('documentsService: Error updating document:', error);
      return false;
    }

    return true;
  },

  async toggleStar(id: string, starred: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('documents')
      .update({ starred })
      .eq('id', id);

    if (error) {
      console.error('Error toggling star:', error);
      return false;
    }
    return true;
  },

  async deleteDocument(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }
    return true;
  },

  async shareDocument(documentId: string, userId: string, permission: 'view' | 'edit' = 'view'): Promise<boolean> {
    const { error } = await supabase
      .from('document_shares')
      .upsert({
        document_id: documentId,
        user_id: userId,
        permission
      });

    if (error) {
      console.error('Error sharing document:', error);
      return false;
    }

    // Also update document visibility to 'shared' if it was 'private'
    const { data: doc } = await supabase.from('documents').select('visibility').eq('id', documentId).single();
    if (doc?.visibility === 'private') {
      await supabase.from('documents').update({ visibility: 'shared' }).eq('id', documentId);
    }

    return true;
  },

  async getShares(documentId: string): Promise<DocumentShare[]> {
    const { data, error } = await supabase
      .from('document_shares')
      .select('*')
      .eq('document_id', documentId);

    if (error) {
       console.error('Error fetching shares:', error);
       return [];
    }
    return data || [];
  }
};
