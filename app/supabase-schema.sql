-- Home Finance - Schema Supabase
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard/project/vkvakbgtkwfpzntzgpsn/sql)

-- 1. Tabela de Casas (Comunidades)
CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Membros da Casa
CREATE TABLE IF NOT EXISTS house_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  display_name TEXT NOT NULL,
  avatar_type TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(house_id, user_id)
);

-- 3. Tabela de Convites
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id),
  phone_or_email TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- 4. Tabela de Transações (Expenses)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_cents INT NOT NULL,
  category_id TEXT NOT NULL,
  card_id TEXT,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  is_income BOOLEAN DEFAULT false,
  paid BOOLEAN DEFAULT true,
  essentiality TEXT CHECK (essentiality IN ('essential', 'necessary', 'extra')),
  tags TEXT[],
  privacy TEXT CHECK (privacy IN ('private', 'shared')) DEFAULT 'shared',
  installment_total INT,
  installment_current INT,
  group_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Acesso (RLS)
-- Houses: membros podem ver suas casas
CREATE POLICY "Members can view their houses"
  ON houses FOR SELECT
  USING (id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));

-- House Members: usuários podem ver membros da sua casa
CREATE POLICY "Members can view house members"
  ON house_members FOR SELECT
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));

-- Invitations: usuários podem ver convites da sua casa
CREATE POLICY "Members can view invitations"
  ON invitations FOR SELECT
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));

-- Expenses: membros podem ver transações da sua casa
CREATE POLICY "Members can view expenses"
  ON expenses FOR SELECT
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));

-- Expenses: membros podem inserir transações na sua casa
CREATE POLICY "Members can insert expenses"
  ON expenses FOR INSERT
  WITH CHECK (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));

-- Expenses: membros podem atualizar suas próprias transações
CREATE POLICY "Members can update own expenses"
  ON expenses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. Função para criar casa e adicionar owner automaticamente
CREATE OR REPLACE FUNCTION create_house_with_owner(
  house_name TEXT,
  owner_display_name TEXT,
  owner_avatar_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_house_id UUID;
BEGIN
  INSERT INTO houses (name) VALUES (house_name) RETURNING id INTO new_house_id;
  INSERT INTO house_members (house_id, user_id, role, display_name, avatar_type)
  VALUES (new_house_id, auth.uid(), 'owner', owner_display_name, owner_avatar_type);
  RETURN new_house_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON houses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();