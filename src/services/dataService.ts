import { supabase } from '../lib/supabase';
import { Project, Task, Activity, User } from '../types';

export const dataService = {
  // Projetos
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, milestones(*)');
    if (error) throw error;
    
    // Mapear snake_case do banco para camelCase do frontend
    return (data || []).map((p: any) => ({
      ...p,
      burnRate: p.burn_rate,
      riskProfile: p.risk_profile,
      cftvData: p.cftv_data,
      qualityData: p.quality_data || p.cftv_data?.qualityDataFallback,
      complianceData: p.compliance_data || p.cftv_data?.complianceDataFallback
    }));
  },

  async createProject(project: Partial<Project>) {
    console.log('dataService: [START] createProject', project.name);
    
    // Timeout of 15s to prevent infinite hang
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tempo limite excedido na comunicação com o banco de dados (15s).')), 15000)
    );

    const call = (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      const insertData: any = {
        name: project.name,
        description: project.description,
        type: project.type,
        status: project.status,
        progress: project.progress || 0,
        burn_rate: project.burnRate || 'Estável',
        risk_profile: project.riskProfile || []
      };

      if (user) insertData.created_by = user.id;

      console.log('dataService: [EXEC] Supabase Insert Payload:', insertData);

      const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single();
        
      if (error) {
        console.error('dataService: [ERROR] Supabase Error:', error);
        throw new Error(error.message || 'Erro desconhecido no Supabase');
      }

      console.log('dataService: [SUCCESS] Project Created:', data.id);
      return data;
    })();

    return Promise.race([call, timeout]) as Promise<any>;
  },

  async updateProject(id: string, updates: Partial<Project>) {
    if (id.startsWith('p-')) {
       console.log('Skipping Supabase backend update for mock project id:', id);
       return;
    }

    const payload: any = {
      name: updates.name,
      description: updates.description,
      type: updates.type,
      status: updates.status,
      progress: updates.progress,
      risk_profile: updates.riskProfile,
      cftv_data: updates.cftvData,
      quality_data: updates.qualityData,
      compliance_data: updates.complianceData
    };

    const { error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id);

    if (error) {
      // PGRST204 = Column not found. Or PGRST200 or similar message checks
      if (error.code === 'PGRST204' || error.message?.includes('quality_data') || error.message?.includes('compliance_data') || error.code === '42703') {
         console.warn("dataService: 'quality_data' or 'compliance_data' column might be missing. Using JSONB fallback inside 'cftv_data'.");
         
         const { data: current } = await supabase.from('projects').select('cftv_data').eq('id', id).single();
         const cftvData = current?.cftv_data || {};
         if (updates.qualityData !== undefined) cftvData.qualityDataFallback = updates.qualityData;
         if (updates.complianceData !== undefined) cftvData.complianceDataFallback = updates.complianceData;
         
         delete payload.quality_data;
         delete payload.compliance_data;
         payload.cftv_data = cftvData;

         const { error: fallbackError } = await supabase.from('projects').update(payload).eq('id', id);
         if (fallbackError) throw fallbackError;
      } else {
         throw error;
      }
    }
  },

  async deleteProject(id: string) {
    // 1. Buscar IDs das tarefas para limpar atribuições de forma segura
    const { data: tasks, error: tasksError } = await supabase.from('tasks').select('id').eq('project_id', id);
    if (tasksError) throw tasksError;
    
    if (tasks && tasks.length > 0) {
      const taskIds = tasks.map(t => t.id);
      // Deletar atribuições de usuários
      const { error: assigneesError } = await supabase.from('task_assignees').delete().in('task_id', taskIds);
      if (assigneesError) throw assigneesError;
      // Deletar tarefas
      const { error: tasksDelError } = await supabase.from('tasks').delete().in('id', taskIds);
      if (tasksDelError) throw tasksDelError;
    }

    // 2. Deletar marcos (milestones)
    const { error: mlError } = await supabase.from('milestones').delete().eq('project_id', id);
    if (mlError) throw mlError;

    // 3. Deletar o projeto
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  // Tarefas
  async getTasks(projectId?: string): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select('*, assignees:task_assignees(profiles(*))');
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(t => ({
      ...t,
      projectId: t.project_id,
      dueDate: t.due_date,
      assignees: t.assignees?.map((a: any) => {
        const p = a.profiles;
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
          role: p.role,
          email: p.email
        };
      }).filter(Boolean) || []
    }));
  },

  async createTask(task: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status || 'Pendente',
        priority: task.priority || 'Média',
        due_date: task.dueDate,
        images: task.images || []
      })
      .select()
      .single();
    if (error) throw error;

    if (task.assignees?.length) {
      const assignments = task.assignees.map(u => ({
        task_id: data.id,
        user_id: u.id
      }));
      const { error: assignError } = await supabase.from('task_assignees').insert(assignments);
      if (assignError) throw assignError;
    }

    return {
      ...data,
      projectId: data.project_id,
      dueDate: data.due_date
    };
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        due_date: updates.dueDate,
        images: updates.images
      })
      .eq('id', id);
    if (error) throw error;

    if (updates.assignees) {
      const { error: delError } = await supabase.from('task_assignees').delete().eq('task_id', id);
      if (delError) throw delError;
      
      const assignments = updates.assignees.map(u => ({
        task_id: id,
        user_id: u.id
      }));
      const { error: insertError } = await supabase.from('task_assignees').insert(assignments);
      if (insertError) throw insertError;
    }
  },

  async deleteTask(id: string) {
    // 1. Remover atribuições primeiro
    const { error: delAssignError } = await supabase.from('task_assignees').delete().eq('task_id', id);
    if (delAssignError) throw delAssignError;
    // 2. Remover a tarefa
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteProfile(id: string) {
    // 1. Remover atribuições deste usuário em tarefas
    const { error: delAssignError } = await supabase.from('task_assignees').delete().eq('user_id', id);
    if (delAssignError) throw delAssignError;
    
    // 2. Limpar referências em atividades
    const { error: delActError } = await supabase.from('activities').delete().eq('user_id', id);
    if (delActError) throw delActError;

    // 3. Remover o perfil
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  },

  // Marcos (Milestones)
  async getMilestones(projectId: string) {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createMilestone(milestone: any) {
    const { data, error } = await supabase.from('milestones').insert(milestone).select().single();
    if (error) throw error;
    return data;
  },
  async getActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*, user:profiles(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(act => ({
      ...act,
      user: act.user ? {
        id: act.user.id,
        name: act.user.name,
        avatar: act.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.user.id}`,
        role: act.user.role,
        email: act.user.email
      } : null
    })) as any;
  },

  // Registro de Atividade
  async logActivity(action: string, target: string, type: string, tags?: string[]) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const { error } = await supabase.from('activities').insert({
      user_id: user.id,
      action,
      target,
      type,
      tags: tags || []
    });
    
    if (error) console.error('Erro ao logar atividade:', error);
  },

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    if (error) throw error;
    
    return (data || []).map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
      role: u.role,
      email: u.email
    }));
  }
};
