// Arquivo para testar conectividade com o Supabase
import { supabase } from './supabaseClient';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testando conectividade com Supabase...');
  
  try {
    // Teste 1: Verificar se o cliente foi criado corretamente
    if (!supabase) {
      throw new Error('Cliente Supabase não foi inicializado');
    }
    
    console.log('✅ Cliente Supabase inicializado');
    
    // Teste 2: Verificar URL e chave
    const url = supabase.supabaseUrl;
    const key = supabase.supabaseKey;
    
    if (!url || !key) {
      throw new Error('URL ou chave do Supabase não configuradas');
    }
    
    console.log('✅ URL e chave configuradas');
    console.log('📍 URL:', url);
    console.log('🔑 Chave (primeiros 20 chars):', key.substring(0, 20) + '...');
    
    // Teste 3: Verificar se a URL está acessível
    try {
      const response = await fetch(url + '/rest/v1/', {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ URL do Supabase acessível');
    } catch (fetchError) {
      console.error('❌ Erro ao acessar URL do Supabase:', fetchError);
      return {
        success: false,
        error: `Erro de conectividade: ${fetchError.message}`,
        details: fetchError
      };
    }
    
    // Teste 4: Tentar uma consulta simples
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na consulta:', error);
      
      // Verificar se é erro de tabela não existente
      if (error.message.includes('relation "sessions" does not exist')) {
        console.log('⚠️ Tabela sessions não existe ainda - isso é normal para um novo projeto');
        return {
          success: true,
          message: 'Conectividade OK, mas tabela sessions não existe ainda'
        };
      }
      
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
    
    console.log('✅ Consulta executada com sucesso');
    
    // Teste 5: Verificar autenticação
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.warn('⚠️ Erro na verificação de sessão:', authError);
    } else {
      console.log('✅ Verificação de sessão OK');
    }
    
    return {
      success: true,
      message: 'Conectividade com Supabase funcionando corretamente'
    };
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
    return {
      success: false,
      error: err.message,
      details: err
    };
  }
};

// Função para diagnosticar problemas específicos
export const diagnoseConnectionIssue = async (error) => {
  console.log('🔧 Diagnosticando problema de conexão...');
  
  const diagnostics = {
    networkIssue: false,
    configIssue: false,
    authIssue: false,
    serverIssue: false,
    suggestions: []
  };
  
  // Verificar se é problema de rede
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('NetworkError') ||
      error.message?.includes('fetch')) {
    diagnostics.networkIssue = true;
    diagnostics.suggestions.push('Verifique sua conexão com a internet');
    diagnostics.suggestions.push('Tente recarregar a página');
    diagnostics.suggestions.push('Verifique se não há firewall bloqueando a conexão');
  }
  
  // Verificar se é problema de configuração
  if (error.message?.includes('Invalid API key') ||
      error.message?.includes('Unauthorized') ||
      error.message?.includes('403')) {
    diagnostics.configIssue = true;
    diagnostics.suggestions.push('Verifique se a chave da API está correta');
    diagnostics.suggestions.push('Verifique se a URL do Supabase está correta');
  }
  
  // Verificar se é problema de autenticação
  if (error.message?.includes('Invalid login credentials') ||
      error.message?.includes('User not found') ||
      error.message?.includes('401')) {
    diagnostics.authIssue = true;
    diagnostics.suggestions.push('Verifique se o email e senha estão corretos');
    diagnostics.suggestions.push('Tente criar uma nova conta');
  }
  
  // Verificar se é problema do servidor
  if (error.message?.includes('500') ||
      error.message?.includes('Internal Server Error') ||
      error.message?.includes('Service Unavailable')) {
    diagnostics.serverIssue = true;
    diagnostics.suggestions.push('O servidor pode estar temporariamente indisponível');
    diagnostics.suggestions.push('Tente novamente em alguns minutos');
  }
  
  console.log('📊 Diagnóstico:', diagnostics);
  return diagnostics;
};
