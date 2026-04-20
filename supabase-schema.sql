-- ESQUEMA DE BANCO DE DADOS PARA OPERO (SUPABASE)

-- 1. TABELA DE PERFIS (Extensão do Auth.Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  role TEXT,
  email TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE PROJETOS (Atualizada com mais campos)
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Planejamento',
  progress INTEGER DEFAULT 0,
  burn_rate TEXT,
  capital_efficiency INTEGER DEFAULT 0,
  type TEXT,
  risk_profile JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 6. TABELA DE MARCOS (Milestones)
CREATE TABLE milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  is_active BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para marcos
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marcos visíveis para usuários logados" ON milestones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gerenciar marcos por usuários logados" ON milestones FOR ALL USING (auth.role() = 'authenticated');

-- 3. TABELA DE TAREFAS
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Pendente',
  priority TEXT DEFAULT 'Média',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ATRIBUIÇÃO DE TAREFAS (Relação Muitos-para-Muitos)
CREATE TABLE task_assignees (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- 5. ATIVIDADES
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  type TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO (Simplificadas para o início)
CREATE POLICY "Perfis visíveis para todos os usuários logados" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários podem editar seu próprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Projetos visíveis para usuários logados" ON projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Inserção de projetos por usuários logados" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tarefas visíveis para usuários logados" ON tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Atividades visíveis para usuários logados" ON activities FOR SELECT USING (auth.role() = 'authenticated');

-- Função para gatilho de novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id, 'Operacional');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para criar perfil automaticamente no SignUp
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
