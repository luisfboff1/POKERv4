// Teste de conectividade após correção da recursão RLS
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jrdhftjekefbwjktbauu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZGhmdGpla2VmYndqa3RiYXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTAxOTcsImV4cCI6MjA3Mjc2NjE5N30.WuxY3dwgMdizjlFmeUBNmdnQm0T48Ideo320FPTY9go';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testando conectividade após correção RLS...');
  
  try {
    // Teste 1: Verificar se o cliente foi criado
    console.log('✅ Cliente Supabase criado');
    
    // Teste 2: Verificar URL e chave
    console.log('📍 URL:', supabaseUrl);
    console.log('🔑 Chave (primeiros 20 chars):', supabaseKey.substring(0, 20) + '...');
    
    // Teste 3: Tentar uma consulta simples na tabela sessions
    console.log('🔄 Testando consulta na tabela sessions...');
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    if (sessionsError) {
      console.error('❌ Erro na consulta sessions:', sessionsError.message);
      return false;
    }
    
    console.log('✅ Consulta sessions executada com sucesso');
    
    // Teste 4: Tentar consulta na tabela user_permissions (onde estava a recursão)
    console.log('🔄 Testando consulta na tabela user_permissions...');
    const { data: permissionsData, error: permissionsError } = await supabase
      .from('user_permissions')
      .select('email, role, is_approved')
      .limit(1);
    
    if (permissionsError) {
      console.error('❌ Erro na consulta user_permissions:', permissionsError.message);
      console.error('📋 Código:', permissionsError.code);
      return false;
    }
    
    console.log('✅ Consulta user_permissions executada com sucesso');
    console.log('📊 Dados de permissões:', permissionsData);
    
    // Teste 5: Verificar autenticação
    console.log('🔄 Testando autenticação...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.warn('⚠️ Erro na verificação de sessão:', authError.message);
    } else {
      console.log('✅ Verificação de sessão OK');
      console.log('👤 Usuário atual:', authData.session ? 'Logado' : 'Não logado');
    }
    
    // Teste 6: Verificar se o admin principal existe
    console.log('🔄 Verificando se o admin principal existe...');
    const { data: adminData, error: adminError } = await supabase
      .from('user_permissions')
      .select('email, role, is_approved')
      .eq('email', 'luisfboff@hotmail.com')
      .single();
    
    if (adminError) {
      console.warn('⚠️ Admin principal não encontrado:', adminError.message);
    } else {
      console.log('✅ Admin principal encontrado:', adminData);
    }
    
    console.log('🎉 Todos os testes de conectividade passaram!');
    return true;
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
    return false;
  }
}

// Executar teste
testConnection().then(success => {
  if (success) {
    console.log('\n✅ Conectividade com Supabase funcionando perfeitamente!');
    console.log('🚀 Sistema pronto para uso!');
    process.exit(0);
  } else {
    console.log('\n❌ Ainda há problemas de conectividade');
    console.log('💡 Execute o script fix_rls_policies.sql no Supabase primeiro');
    process.exit(1);
  }
});
