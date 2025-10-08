// ==============================================
// COLE ESTE CÓDIGO NO CONSOLE F12 (DevTools)
// ==============================================

console.log("🔥 DIAGNÓSTICO COMPLETO - PROBLEMA DO RANKING");
console.log("📋 Este script vai testar tudo e mostrar por que o ranking não atualiza");

// Função para fazer requisições com debug detalhado
async function testAPI(endpoint, method = 'GET', data = null) {
    console.log(`\n🚀 TESTANDO: ${method} /${endpoint}`);
    
    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
            console.log("🔑 Token encontrado:", token.substring(0, 20) + "...");
        } else {
            console.log("⚠️  Nenhum token encontrado!");
        }
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const API_BASE = window.location.origin + '/api';
        const response = await fetch(`${API_BASE}/${endpoint}`, options);
        
        console.log(`� Status: ${response.status} ${response.statusText}`);
        
        const result = await response.json();
        console.log("📊 Resposta:", result);
        
        return { status: response.status, data: result, ok: response.ok };
    } catch (error) {
        console.error(`❌ ERRO em /${endpoint}:`, error);
        return { error: error.message };
    }
}

// DIAGNÓSTICO COMPLETO
async function diagnosticoCompleto() {
    console.log("\n🎯 INICIANDO DIAGNÓSTICO FOCADO NO PROBLEMA DO RANKING");
    
    // 1. Login
    console.log("=" .repeat(50));
    console.log("1️⃣ FAZENDO LOGIN");
    const login = await testAPI('auth.php', 'POST', {
        action: 'login',
        email: 'luisfboff@hotmail.com',
        password: 'password'
    });
    
    if (login.ok && login.data?.token) {
        localStorage.setItem('token', login.data.token);
        console.log("✅ Login OK - Token salvo");
    } else {
        console.log("❌ Falha no login!", login);
        return;
    }
    
    // 2. Testar Players API
    console.log("=" .repeat(50));
    console.log("2️⃣ TESTANDO API DE PLAYERS");
    const players = await testAPI('players.php');
    console.log(`📈 Players encontrados: ${players.data?.length || 0}`);
    
    // 3. Testar Sessions API
    console.log("=" .repeat(50));
    console.log("3️⃣ TESTANDO API DE SESSÕES");
    const sessions = await testAPI('session.php');
    console.log(`📊 Sessões encontradas: ${sessions.data?.length || 0}`);
    
    // 4. Debug do banco - Contadores
    console.log("=" .repeat(50));
    console.log("4️⃣ VERIFICANDO CONTADORES DO BANCO");
    const tables = await testAPI('debug.php?action=tables');
    
    // 5. Ver dados específicos
    console.log("=" .repeat(50));
    console.log("5️⃣ DADOS ESPECÍFICOS");
    await testAPI('debug.php?action=players');
    await testAPI('debug.php?action=sessions');
    
    // 6. Testar sincronização
    console.log("=" .repeat(50));
    console.log("6️⃣ TESTANDO SINCRONIZAÇÃO");
    const sync = await testAPI('sync_players_stats.php', 'POST', { action: 'sync_all' });
    
    console.log("\n🏁 DIAGNÓSTICO CONCLUÍDO!");
    console.log("📋 PRÓXIMO PASSO: Se houver dados nas tabelas mas o ranking não aparece,");
    console.log("   use a sincronização para recalcular as estatísticas!");
}

// EXECUTAR DIAGNÓSTICO AUTOMATICAMENTE
diagnosticoCompleto();

// FUNÇÕES DE TESTE INDIVIDUAL
window.testLogin = () => testAPI('auth.php', 'POST', {
    action: 'login', email: 'luisfboff@hotmail.com', password: 'password'
});
window.testPlayers = () => testAPI('players.php');
window.testSessions = () => testAPI('session.php');
window.syncStats = () => testAPI('sync_players_stats.php', 'POST', { action: 'sync_all' });
window.resetStats = () => testAPI('sync_players_stats.php', 'POST', { action: 'reset_all' });
window.clearAuth = () => { localStorage.clear(); console.log("🧹 Auth limpo!"); };

console.log(`
� FUNÇÕES DISPONÍVEIS NO CONSOLE:
• testLogin() - Fazer login
• testPlayers() - Listar players  
• testSessions() - Listar sessões
• syncStats() - Sincronizar estatísticas ⭐
• resetStats() - Resetar e recalcular tudo ⭐
• clearAuth() - Limpar autenticação
• diagnosticoCompleto() - Executar tudo novamente

⭐ Use syncStats() se o ranking não atualiza após excluir sessões!
`);