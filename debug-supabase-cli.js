#!/usr/bin/env node
/**
 * 🔍 DIAGNÓSTICO SUPABASE - TERMINAL
 * 
 * Execute: node debug-supabase-cli.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local
config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 DIAGNÓSTICO SUPABASE - TERMINAL\n');
console.log('═'.repeat(60));

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.error('   Verifique .env.local');
  process.exit(1);
}

console.log('✅ Supabase URL:', supabaseUrl);
console.log('✅ Service Role Key:', supabaseKey.substring(0, 20) + '...');
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function verificarTabelas() {
  console.log('📊 VERIFICANDO TABELAS');
  console.log('─'.repeat(60));

  const tables = [
    'tenants',
    'users',
    'players',
    'sessions',
    'user_invites',
    'user_sessions',
    'audit_logs',
    'session_approvals',
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table.padEnd(20)} - ERRO: ${error.message}`);
      } else {
        console.log(`✅ ${table.padEnd(20)} - ${count || 0} registros`);
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(20)} - ERRO: ${err.message}`);
    }
  }
  console.log('');
}

async function verificarTenants() {
  console.log('🏢 TENANTS');
  console.log('─'.repeat(60));

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  NENHUM TENANT ENCONTRADO!');
    console.log('   Execute o script de migração ou crie manualmente.');
    return;
  }

  data.forEach((tenant, i) => {
    console.log(`\n${i + 1}. ${tenant.name}`);
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Status: ${tenant.status}`);
    console.log(`   Plan: ${tenant.plan}`);
    console.log(`   Domain: ${tenant.custom_domain || 'N/A'}`);
    console.log(`   Created: ${new Date(tenant.created_at).toLocaleString()}`);
  });
  console.log('');
}

async function verificarUsuarios() {
  console.log('👥 USUÁRIOS');
  console.log('─'.repeat(60));

  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      role,
      is_active,
      tenant_id,
      last_login,
      tenants (
        name,
        status
      )
    `)
    .order('id', { ascending: true });

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  NENHUM USUÁRIO ENCONTRADO!');
    console.log('   Você precisa criar usuários para fazer login.');
    console.log('');
    console.log('💡 Para criar um usuário de teste, execute:');
    console.log('   node scripts/create-test-user.js');
    return;
  }

  data.forEach((user, i) => {
    const tenant = Array.isArray(user.tenants) ? user.tenants[0] : user.tenants;
    console.log(`\n${i + 1}. ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Ativo: ${user.is_active ? '✅ Sim' : '❌ Não'}`);
    console.log(`   Tenant: ${tenant?.name || 'N/A'} (${tenant?.status || 'N/A'})`);
    console.log(`   Último login: ${user.last_login ? new Date(user.last_login).toLocaleString() : 'Nunca'}`);
  });
  console.log('');
}

async function verificarPlayers() {
  console.log('🎮 PLAYERS');
  console.log('─'.repeat(60));

  const { data, error, count } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: false })
    .limit(5);

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  console.log(`Total de players: ${count || 0}`);
  
  if (data && data.length > 0) {
    console.log('\nPrimeiros 5 players:');
    data.forEach((player, i) => {
      console.log(`  ${i + 1}. ${player.name} (Tenant ID: ${player.tenant_id})`);
    });
  }
  console.log('');
}

async function verificarSessions() {
  console.log('🎲 SESSIONS');
  console.log('─'.repeat(60));

  const { data, error, count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: false })
    .limit(5)
    .order('date', { ascending: false });

  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }

  console.log(`Total de sessões: ${count || 0}`);
  
  if (data && data.length > 0) {
    console.log('\nÚltimas 5 sessões:');
    data.forEach((session, i) => {
      console.log(`  ${i + 1}. ${new Date(session.date).toLocaleDateString()} - ${session.location || 'N/A'}`);
      console.log(`      Status: ${session.status} | Players: ${JSON.parse(session.players_data || '[]').length}`);
    });
  }
  console.log('');
}

async function main() {
  try {
    await verificarTabelas();
    await verificarTenants();
    await verificarUsuarios();
    await verificarPlayers();
    await verificarSessions();

    console.log('═'.repeat(60));
    console.log('✅ DIAGNÓSTICO CONCLUÍDO!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('');
    console.log('Se não há usuários:');
    console.log('  1. Crie um tenant no Supabase Dashboard');
    console.log('  2. Execute: node scripts/create-test-user.js');
    console.log('');
    console.log('Se há usuários mas login falha:');
    console.log('  1. Verifique se o tenant está "active"');
    console.log('  2. Verifique se o user está "is_active = true"');
    console.log('  3. Teste a senha com bcrypt');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    process.exit(1);
  }
}

main();
