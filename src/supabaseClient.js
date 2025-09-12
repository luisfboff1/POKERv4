import { createClient } from '@supabase/supabase-js';

// Configuração otimizada para IPv4 (Vercel compatible)
const supabaseUrl = 'https://jrdhftjekefbwjktbauu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZGhmdGpla2VmYndqa3RiYXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTAxOTcsImV4cCI6MjA3Mjc2NjE5N30.WuxY3dwgMdizjlFmeUBNmdnQm0T48Ideo320FPTY9go';

// Configuração para IPv4 compatibility (Transaction Pooler)
const supabaseOptions = {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'poker-settlements',
      'x-client-info': 'poker-settlements@1.0.0'
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, supabaseOptions);
