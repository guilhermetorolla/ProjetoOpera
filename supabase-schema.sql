-- ESQUEMA DE BANCO DE DADOS PARA OPERO (RESET TOTAL)
-- Scripts para reconstrução completa do banco de dados

-- 1. LIMPEZA TOTAL
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS task_assignees CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS document_shares CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. TABELA DE PERFIS
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'Operacional',
  email TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE PROJETOS
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Planejamento',
  progress INTEGER DEFAULT 0,
  risk_profile JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. TABELA DE TAREFAS E MARCOS
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'Pendente',
  priority TEXT DEFAULT 'Média',
  due_date DATE
);

CREATE TABLE milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  due_date DATE
);

-- 5. TABELA DE ATIVIDADES
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE DOCUMENTOS
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  type TEXT DEFAULT 'doc',
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  starred BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'private',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view',
  UNIQUE(document_id, user_id)
);

-- 7. AUTOMAÇÃO: CRIAR PERFIL AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email, 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. SINCRONIZAR SEU USUÁRIO ATUAL
INSERT INTO public.profiles (id, name, email, avatar_url)
SELECT id, COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), email, 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 9. HABILITAR SEGURANÇA (RLS) E POLÍTICAS PERMISSIVAS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Total Autenticado" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Total Autenticado" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Total Autenticado" ON activities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Total Autenticado" ON documents FOR ALL USING (auth.role() = 'authenticated');
