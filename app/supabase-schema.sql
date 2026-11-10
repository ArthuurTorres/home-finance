-- Home Finance — Schema de persistência
-- Aplicado no projeto Supabase (vkvakbgtkwfpzntzgpsn).
-- Escopo: um dono por linha (user_id), protegido por RLS. Valores monetários em centavos.

-- 1. Transações ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id                UUID PRIMARY KEY,
  user_id           UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  description       TEXT NOT NULL,
  date              TIMESTAMPTZ NOT NULL,
  amount_cents      INTEGER NOT NULL CHECK (amount_cents >= 0),
  due_day           INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  installments      INTEGER NOT NULL DEFAULT 1 CHECK (installments > 0),
  paid_installments INTEGER NOT NULL DEFAULT 0 CHECK (paid_installments >= 0),
  is_paid           BOOLEAN NOT NULL DEFAULT FALSE,
  is_recurring      BOOLEAN NOT NULL DEFAULT FALSE,
  category          TEXT NOT NULL,
  card_id           TEXT NOT NULL,
  bank_id           TEXT,
  type              TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
  member_id         UUID,
  essentiality      TEXT CHECK (essentiality IN ('essential', 'necessary', 'extra')),
  tags              TEXT[] NOT NULL DEFAULT '{}',
  privacy           TEXT CHECK (privacy IN ('family', 'personal')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON public.expenses (user_id, date DESC);
CREATE INDEX IF NOT EXISTS expenses_user_month_idx ON public.expenses (user_id, type);

-- 2. Bancos (onde a receita entra) --------------------------------------------
CREATE TABLE IF NOT EXISTS public.banks (
  user_id    UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id         TEXT NOT NULL,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

-- 3. Cartões de crédito -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cards (
  user_id    UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id         TEXT NOT NULL,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

-- 4. Categorias (nome + ícone) ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  user_id    UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, name)
);

-- 5. Membros da casa ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.members (
  id         UUID PRIMARY KEY,
  user_id    UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  avatar     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Orçamento mensal por categoria ------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
  user_id     UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  limit_cents INTEGER NOT NULL CHECK (limit_cents >= 0),
  PRIMARY KEY (user_id, category)
);

-- 7. Metas de poupança --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  target_cents  INTEGER NOT NULL CHECK (target_cents > 0),
  current_cents INTEGER NOT NULL DEFAULT 0 CHECK (current_cents >= 0),
  deadline      TEXT,
  color         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Preferências de interface ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.preferences (
  user_id          UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_order  TEXT[] NOT NULL DEFAULT '{}',
  active_member_id UUID,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Row Level Security -------------------------------------------------------
ALTER TABLE public.expenses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

-- Política única por tabela: o dono enxerga e altera apenas as próprias linhas.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['expenses','banks','cards','categories','members','budgets','goals','preferences']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_owner_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      t || '_owner_all', t
    );
  END LOOP;
END $$;

-- 10. updated_at automático ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expenses_touch_updated_at ON public.expenses;
CREATE TRIGGER expenses_touch_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS preferences_touch_updated_at ON public.preferences;
CREATE TRIGGER preferences_touch_updated_at
  BEFORE UPDATE ON public.preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
