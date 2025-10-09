// ====================================
// COLE NO CONSOLE F12 - TESTE SIMPLES
// ====================================

console.log("🚀 NOVO SISTEMA - RANKING DINÂMICO");
console.log("📊 Agora o ranking é calculado em tempo real das sessões!");

// Função simples
async function test(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('token');
    const options = { method, headers: { 'Content-Type': 'application/json' }};
    if (token) options.headers.Authorization = `Bearer ${token}`;
    if (data && method !== 'GET') options.body = JSON.stringify(data);
    
    try {
        const response = await fetch(`/api/${endpoint}`, options);
        const result = await response.json();
        console.log(`${method} /${endpoint}:`, {status: response.status, data: result});
        return result;
    } catch (e) {
        console.error(`❌ ${endpoint}:`, e.message);
        return {error: e.message};
    }
}

// Teste automatico
async function testar() {
    console.log("\n1️⃣ LOGIN...");
    const login = await test('auth.php', 'POST', {
        action: 'login',
        email: 'luisfboff@hotmail.com',
        password: 'password'
    });
    
    if (login.token) {
        localStorage.setItem('token', login.token);
        console.log("✅ Logado!");
        
        console.log("\n2️⃣ CONTANDO REGISTROS...");
        await test('debug.php?action=tables');
        
        console.log("\n3️⃣ TESTANDO PLAYERS...");
        await test('players.php');
        
        console.log("\n4️⃣ TESTANDO SESSIONS...");
        await test('session.php');
        
        console.log("\n5️⃣ AUTO-APROVANDO SESSÕES...");
        await test('auto_approve_sessions.php');
        
    } else {
        console.log("❌ Erro no login!");
    }
}

// Executar
testar();

// Funções disponíveis
window.login = () => test('auth.php', 'POST', {action: 'login', email: 'luisfboff@hotmail.com', password: 'password'});
window.players = () => test('players.php');
window.sessions = () => test('session.php');
window.autoApprove = () => test('auto_approve_sessions.php');

console.log("\n🔧 Funções: login(), players(), sessions(), autoApprove()");
console.log("🎯 NOVA LÓGICA:");
console.log("   ✅ Ranking calculado dinamicamente");  
console.log("   ✅ Sessões aprovadas automaticamente");
console.log("   ✅ Status baseado em pagamentos");