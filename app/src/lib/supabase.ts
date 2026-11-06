import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

// Inicialização tolerante: aceita placeholder em dev local; falha só na operação real
const PLACEHOLDER_PATTERNS = ['seu-', 'placeholder', 'your-', 'example'];

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const isPlaceholder = (v?: string) =>
  !v || PLACEHOLDER_PATTERNS.some((p) => v.toLowerCase().includes(p));

if (isPlaceholder(url) || isPlaceholder(key)) {
  console.warn(
    '[Supabase] Credenciais placeholder detectadas. ' +
      'Edite app/.env com os valores reais do seu projeto Supabase para funcionalidade completa.'
  );
}

export const supabase = createClient<Database>(
  isPlaceholder(url) ? 'https://placeholder.supabase.co' : url!,
  isPlaceholder(key) ? 'placeholder-key-anon' : key!
);