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
      cftvData: p.cftv_data
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
    const { error } = await supabase
      .from('projects')
      .update({
        name: updates.name,
        description: updates.description,
        type: updates.type,
        status: updates.status,
        progress: updates.progress,
        risk_profile: updates.riskProfile,
        cftv_data: updates.cftvData
      })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteProject(id: string) {
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
      assignees: t.assignees?.map((a: any) => a.profiles) || []
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
      await supabase.from('task_assignees').insert(assignments);
    }

    return data;
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
      await supabase.from('task_assignees').delete().eq('task_id', id);
      const assignments = updates.assignees.map(u => ({
        task_id: id,
        user_id: u.id
      }));
      await supabase.from('task_assignees').insert(assignments);
    }
  },

  async deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
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
    return data || [];
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
      avatar: u.avatar_url,
      role: u.role,
      email: u.email
    }));
  }
};
