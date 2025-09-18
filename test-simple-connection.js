// Teste simples de conectividade com Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jrdhftjekefbwjktbauu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZGhmdGpla2VmYndqa3RiYXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTAxOTcsImV4cCI6MjA3Mjc2NjE5N30.WuxY3dwgMdizjlFmeUBNmdnQm0T48Ideo320FPTY9go';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testando conectividade com Supabase...');
  
  try {
    // Teste 1: Verificar se o cliente foi criado
    console.log('✅ Cliente Supabase criado');
    
    // Teste 2: Verificar URL e chave
    console.log('📍 URL:', supabaseUrl);
    console.log('🔑 Chave (primeiros 20 chars):', supabaseKey.substring(0, 20) + '...');
    
    // Teste 3: Tentar uma consulta simples
    console.log('🔄 Testando consulta...');
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na consulta:', error.message);
      console.error('📋 Código:', error.code);
      console.error('🔍 Detalhes:', error);
      return false;
    }
    
    console.log('✅ Consulta executada com sucesso');
    console.log('📊 Dados:', data);
    
    // Teste 4: Verificar autenticação
    console.log('🔄 Testando autenticação...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.warn('⚠️ Erro na verificação de sessão:', authError.message);
    } else {
      console.log('✅ Verificação de sessão OK');
      console.log('👤 Usuário atual:', authData.session ? 'Logado' : 'Não logado');
    }
    
    console.log('🎉 Teste de conectividade concluído com sucesso!');
    return true;
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
    console.error('🔍 Stack:', err.stack);
    return false;
  }
}

// Executar teste
testConnection().then(success => {
  if (success) {
    console.log('\n✅ Conectividade com Supabase funcionando!');
    process.exit(0);
  } else {
    console.log('\n❌ Problemas de conectividade detectados');
    process.exit(1);
  }
});
