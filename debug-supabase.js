/**
 * 🔍 SCRIPT DE DIAGNÓSTICO COMPLETO - SUPABASE
 * 
 * Cole este script no Console F12 do navegador
 * Ele vai testar:
 * 1. Conexão com Supabase
 * 2. Existência das tabelas
 * 3. Usuários disponíveis
 * 4. Teste de login com credenciais
 */

async function diagnosticoCompleto() {
  console.clear();
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO...\n');

  // ========================================
  // 1. VERIFICAR VARIÁVEIS DE AMBIENTE
  // ========================================
  console.log('📋 1. VERIFICANDO VARIÁVEIS DE AMBIENTE');
  console.log('─'.repeat(50));
  
  const supabaseUrl = 'https://jhodhxvvhohygijqcxbo.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impob2RoeHZ2aG9oeWdpanFjeGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTg3ODUsImV4cCI6MjA3NjQ3NDc4NX0.XPzqxEm6rYFe6ctVbYs7AkJoI-cTjEu8pJjBftCkQGg';

  console.log('✅ Supabase URL:', supabaseUrl);
  console.log('✅ Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
  console.log('');

  // ========================================
  // 2. TESTAR CONEXÃO COM SUPABASE
  // ========================================
  console.log('🔌 2. TESTANDO CONEXÃO COM SUPABASE');
  console.log('─'.repeat(50));

  try {
    const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (healthCheck.ok) {
      console.log('✅ Conexão com Supabase: OK');
    } else {
      console.error('❌ Conexão com Supabase: FALHOU');
      console.error('Status:', healthCheck.status);
      return;
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error.message);
    return;
  }
  console.log('');

  // ========================================
  // 3. VERIFICAR TABELAS
  // ========================================
  console.log('📊 3. VERIFICANDO TABELAS');
  console.log('─'.repeat(50));

  const tables = ['tenants', 'users', 'players', 'sessions', 'user_invites', 'user_sessions'];
  
  for (const table of tables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });

      if (response.ok) {
        console.log(`✅ Tabela '${table}': EXISTE`);
      } else {
        console.log(`❌ Tabela '${table}': NÃO ENCONTRADA (Status: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ Tabela '${table}': ERRO - ${error.message}`);
    }
  }
  console.log('');

  // ========================================
  // 4. VERIFICAR TENANTS
  // ========================================
  console.log('🏢 4. VERIFICANDO TENANTS');
  console.log('─'.repeat(50));

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/tenants?select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const tenants = await response.json();
      console.log(`✅ Total de tenants: ${tenants.length}`);
      tenants.forEach((tenant, index) => {
        console.log(`\n  ${index + 1}. ${tenant.name}`);
        console.log(`     ID: ${tenant.id}`);
        console.log(`     Status: ${tenant.status}`);
        console.log(`     Plan: ${tenant.plan}`);
      });
    } else {
      console.log('❌ Erro ao buscar tenants:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
  console.log('');

  // ========================================
  // 5. VERIFICAR USUÁRIOS
  // ========================================
  console.log('👥 5. VERIFICANDO USUÁRIOS');
  console.log('─'.repeat(50));

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=id,name,email,role,is_active,tenant_id`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const users = await response.json();
      console.log(`✅ Total de usuários: ${users.length}`);
      
      if (users.length === 0) {
        console.log('⚠️  NENHUM USUÁRIO ENCONTRADO NO BANCO!');
        console.log('   Você precisa criar usuários primeiro.');
      } else {
        users.forEach((user, index) => {
          console.log(`\n  ${index + 1}. ${user.name}`);
          console.log(`     Email: ${user.email}`);
          console.log(`     Role: ${user.role}`);
          console.log(`     Ativo: ${user.is_active ? '✅' : '❌'}`);
          console.log(`     Tenant ID: ${user.tenant_id}`);
        });
      }
    } else {
      console.log('❌ Erro ao buscar usuários:', response.status);
      const errorText = await response.text();
      console.log('Detalhes:', errorText);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
  console.log('');

  // ========================================
  // 6. TESTAR LOGIN VIA API
  // ========================================
  console.log('🔐 6. TESTANDO API DE LOGIN');
  console.log('─'.repeat(50));
  console.log('Para testar login, execute:');
  console.log('  testarLogin("seu_email@example.com", "sua_senha")');
  console.log('');

  // ========================================
  // RESUMO
  // ========================================
  console.log('═'.repeat(50));
  console.log('📝 DIAGNÓSTICO CONCLUÍDO!');
  console.log('═'.repeat(50));
}

async function testarLogin(email, password) {
  console.log('\n🔐 TESTANDO LOGIN...');
  console.log('─'.repeat(50));
  console.log('Email:', email);
  console.log('Password:', '***' + password.slice(-2));
  console.log('');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', data);

    if (response.ok) {
      console.log('\n✅ LOGIN SUCESSO!');
      console.log('Token:', data.data.token.substring(0, 30) + '...');
      console.log('User:', data.data.user);
    } else {
      console.log('\n❌ LOGIN FALHOU!');
      console.log('Erro:', data.error);
      
      if (response.status === 401) {
        console.log('\n💡 POSSÍVEIS CAUSAS:');
        console.log('   1. Email não existe no banco');
        console.log('   2. Senha incorreta');
        console.log('   3. Usuário inativo (is_active = false)');
        console.log('   4. Tenant inativo (status != "active")');
      }
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

async function criarUsuarioTeste() {
  console.log('\n👤 CRIANDO USUÁRIO DE TESTE...');
  console.log('─'.repeat(50));
  
  console.log('⚠️  Esta função precisa ser implementada no backend.');
  console.log('Sugestão: Crie um endpoint /api/auth/setup-test-user');
  console.log('');
  console.log('Por enquanto, você pode criar um usuário direto no Supabase:');
  console.log('');
  console.log('1. Acesse: https://app.supabase.com/project/jhodhxvvhohygijqcxbo/editor');
  console.log('2. Crie um tenant na tabela "tenants" se não existir');
  console.log('3. Crie um usuário na tabela "users" com:');
  console.log('   - email: "admin@test.com"');
  console.log('   - password_hash: (use bcrypt para gerar o hash)');
  console.log('   - role: "admin"');
  console.log('   - is_active: true');
  console.log('   - tenant_id: (ID do tenant criado)');
}

// Expor funções globalmente
window.diagnosticoCompleto = diagnosticoCompleto;
window.testarLogin = testarLogin;
window.criarUsuarioTeste = criarUsuarioTeste;

// Executar automaticamente
diagnosticoCompleto();
