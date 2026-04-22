-- Script completo para inicializar as tabelas do Opero no Supabase

-- Habilita extensão pgcrypto para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. Tabela de Perfis (Profiles)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. Tabela de Projetos (Projects)
-- ==========================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  progress INTEGER DEFAULT 0,
  burn_rate TEXT,
  type TEXT,
  risk_profile JSONB DEFAULT '[]'::jsonb,
  cftv_data JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. Tabela de Tarefas (Tasks)
-- ==========================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Pendente',
  priority TEXT DEFAULT 'Média',
  due_date DATE,
  images JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. Associação Tarefa -> Usuários (Task Assignees)
-- ==========================================
CREATE TABLE IF NOT EXISTS task_assignees (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- ==========================================
-- 5. Marcos do Projeto (Milestones)
-- ==========================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  is_active BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 6. Tabela de Atividades (Activities - Feed)
-- ==========================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  type TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 7. Documentos (Docs)
-- ==========================================
CREATE TABLE IF NOT EXISTS docs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT, -- 'doc', 'sheet', 'slide'
  author_id UUID REFERENCES profiles(id),
  starred BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'private', -- 'private', 'shared', 'workspace'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 8. Compartilhamento de Documentos (Document Shares)
-- ==========================================
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES docs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view' -- 'view', 'edit'
);


-- ==========================================
-- 9. Trigger automático para criar Perfil 
-- ==========================================
-- Criação de um trigger para automaticamente criar um profile quando um usuário for registrado no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'name' OR split_part(new.email, '@', 1), 
    new.email, 
    'Usuário', 
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- Políticas RLS Básicas (Row Level Security)
-- Permitindo acesso total para testes/desenvolvimento
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura para todos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Permitir atualização pelo dono" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total aos projetos para usuários autenticados" ON projects FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total tarefas" ON tasks FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total tarefas_usuarios" ON task_assignees FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total milestones" ON milestones FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total as atividades" ON activities FOR ALL USING (true);
CREATE POLICY "Inserção atividades auth" ON activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total docs autenticados" ON docs FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total compartilhamentos de doc" ON document_shares FOR ALL USING (auth.role() = 'authenticated');
