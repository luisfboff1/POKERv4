<?php
require_once 'config.php';
require_once 'middleware/auth_middleware.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Autenticação obrigatória
    AuthMiddleware::requireAuth($pdo);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    switch ($method) {
        case 'POST':
            handleAgentAction($pdo, $action);
            break;
        case 'GET':
            handleAgentQuery($pdo, $action);
            break;
        default:
            throw new Exception('Método não permitido');
    }
    
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}

function handleAgentAction($pdo, $action) {
    $input = json_decode(file_get_contents('php://input'), true);
    $currentUser = AuthMiddleware::getCurrentUser();
    
    switch ($action) {
        case 'create_session':
            $result = createSessionAction($pdo, $input, $currentUser);
            break;
        case 'edit_session':
            $result = editSessionAction($pdo, $input, $currentUser);
            break;
        case 'generate_pdf':
            $result = generatePDFAction($pdo, $input, $currentUser);
            break;
        case 'analyze_data':
            $result = analyzeDataAction($pdo, $input, $currentUser);
            break;
        case 'debug_system':
            $result = debugSystemAction($pdo, $input, $currentUser);
            break;
        case 'send_invite':
            $result = sendInviteAction($pdo, $input, $currentUser);
            break;
        default:
            throw new Exception('Ação não reconhecida: ' . $action);
    }
    
    // Log da ação executada
    logAgentAction($pdo, $currentUser['id'], $action, $input, $result);
    
    echo json_encode([
        'success' => true,
        'action' => $action,
        'result' => $result,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

function handleAgentQuery($pdo, $action) {
    $currentUser = AuthMiddleware::getCurrentUser();
    
    switch ($action) {
        case 'capabilities':
            $result = getAgentCapabilities($currentUser);
            break;
        case 'history':
            $result = getAgentHistory($pdo, $currentUser['id']);
            break;
        case 'status':
            $result = getAgentStatus($pdo, $currentUser);
            break;
        default:
            throw new Exception('Query não reconhecida: ' . $action);
    }
    
    echo json_encode([
        'success' => true,
        'data' => $result,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

// Ações específicas do agente
function createSessionAction($pdo, $input, $user) {
    // Verificar se usuário pode criar sessões
    if ($user['role'] !== 'admin' && $user['role'] !== 'super_admin') {
        throw new Exception('Apenas administradores podem criar sessões', 403);
    }
    
    $date = $input['date'] ?? date('Y-m-d');
    $playersData = $input['players_data'] ?? [];
    
    if (empty($playersData)) {
        throw new Exception('Dados dos jogadores são obrigatórios');
    }
    
    // Criar sessão via API interna
    $sessionData = [
        'date' => $date,
        'players_data' => $playersData,
        'created_by_agent' => true
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO sessions (tenant_id, date, players_data, created_at, updated_at) 
        VALUES (?, ?, ?, NOW(), NOW())
    ");
    
    $stmt->execute([
        $user['tenant_id'],
        $date,
        json_encode($playersData)
    ]);
    
    $sessionId = $pdo->lastInsertId();
    
    return [
        'message' => 'Sessão criada com sucesso pelo agente',
        'session_id' => $sessionId,
        'date' => $date,
        'players_count' => count($playersData)
    ];
}

function editSessionAction($pdo, $input, $user) {
    $sessionId = $input['session_id'] ?? null;
    $updates = $input['updates'] ?? [];
    
    if (!$sessionId) {
        throw new Exception('ID da sessão é obrigatório');
    }
    
    // Verificar se sessão pertence ao tenant do usuário
    $stmt = $pdo->prepare("
        SELECT id FROM sessions 
        WHERE id = ? AND tenant_id = ?
    ");
    $stmt->execute([$sessionId, $user['tenant_id']]);
    
    if (!$stmt->fetch()) {
        throw new Exception('Sessão não encontrada', 404);
    }
    
    // Atualizar sessão
    $updateFields = [];
    $params = [];
    
    if (isset($updates['players_data'])) {
        $updateFields[] = 'players_data = ?';
        $params[] = json_encode($updates['players_data']);
    }
    
    if (isset($updates['date'])) {
        $updateFields[] = 'date = ?';
        $params[] = $updates['date'];
    }
    
    if (!empty($updateFields)) {
        $updateFields[] = 'updated_at = NOW()';
        $params[] = $sessionId;
        $params[] = $user['tenant_id'];
        
        $sql = "UPDATE sessions SET " . implode(', ', $updateFields) . " WHERE id = ? AND tenant_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }
    
    return [
        'message' => 'Sessão atualizada com sucesso pelo agente',
        'session_id' => $sessionId,
        'updated_fields' => array_keys($updates)
    ];
}

function generatePDFAction($pdo, $input, $user) {
    // Por enquanto, simular geração de PDF
    // TODO: Implementar geração real na Fase 4
    
    $sessionId = $input['session_id'] ?? null;
    $type = $input['type'] ?? 'session';
    
    if ($sessionId) {
        // Verificar se sessão existe e pertence ao tenant
        $stmt = $pdo->prepare("
            SELECT date FROM sessions 
            WHERE id = ? AND tenant_id = ?
        ");
        $stmt->execute([$sessionId, $user['tenant_id']]);
        $session = $stmt->fetch();
        
        if (!$session) {
            throw new Exception('Sessão não encontrada', 404);
        }
        
        $fileName = "poker_session_{$sessionId}_{$session['date']}.pdf";
    } else {
        $fileName = "poker_report_" . date('Y-m-d') . ".pdf";
    }
    
    return [
        'message' => 'PDF gerado com sucesso (simulado)',
        'file_name' => $fileName,
        'download_url' => "/api/pdf/download.php?file=" . urlencode($fileName),
        'type' => $type,
        'session_id' => $sessionId
    ];
}

function analyzeDataAction($pdo, $input, $user) {
    $analysisType = $input['analysis_type'] ?? 'general';
    $timeRange = $input['time_range'] ?? 'all';
    
    // Buscar sessões do tenant
    $stmt = $pdo->prepare("
        SELECT * FROM sessions 
        WHERE tenant_id = ? 
        ORDER BY date DESC
    ");
    $stmt->execute([$user['tenant_id']]);
    $sessions = $stmt->fetchAll();
    
    // Análise básica
    $totalSessions = count($sessions);
    $totalPlayers = 0;
    $playerStats = [];
    
    foreach ($sessions as $session) {
        $playersData = json_decode($session['players_data'], true) ?? [];
        foreach ($playersData as $player) {
            $name = $player['name'] ?? 'Unknown';
            if (!isset($playerStats[$name])) {
                $playerStats[$name] = [
                    'sessions' => 0,
                    'total_buyin' => 0,
                    'total_cashout' => 0,
                    'profit' => 0
                ];
            }
            
            $buyins = array_sum($player['buyIns'] ?? []);
            $cashout = $player['cashOut'] ?? 0;
            
            $playerStats[$name]['sessions']++;
            $playerStats[$name]['total_buyin'] += $buyins;
            $playerStats[$name]['total_cashout'] += $cashout;
            $playerStats[$name]['profit'] += ($cashout - $buyins);
        }
    }
    
    $uniquePlayers = count($playerStats);
    
    return [
        'message' => 'Análise de dados concluída',
        'analysis_type' => $analysisType,
        'time_range' => $timeRange,
        'summary' => [
            'total_sessions' => $totalSessions,
            'unique_players' => $uniquePlayers,
            'top_player' => $uniquePlayers > 0 ? array_keys($playerStats, max($playerStats))[0] ?? null : null
        ],
        'player_stats' => $playerStats
    ];
}

function debugSystemAction($pdo, $input, $user) {
    $checkType = $input['check_type'] ?? 'basic';
    
    $checks = [];
    
    // Verificar conexão com banco
    try {
        $pdo->query("SELECT 1");
        $checks['database'] = 'OK';
    } catch (Exception $e) {
        $checks['database'] = 'ERRO: ' . $e->getMessage();
    }
    
    // Verificar tabelas essenciais
    $tables = ['sessions', 'users', 'tenants'];
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
            $count = $stmt->fetchColumn();
            $checks["table_$table"] = "OK ($count registros)";
        } catch (Exception $e) {
            $checks["table_$table"] = 'ERRO: ' . $e->getMessage();
        }
    }
    
    // Verificar sessões do tenant atual
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM sessions WHERE tenant_id = ?");
        $stmt->execute([$user['tenant_id']]);
        $sessionCount = $stmt->fetchColumn();
        $checks['tenant_sessions'] = "OK ($sessionCount sessões)";
    } catch (Exception $e) {
        $checks['tenant_sessions'] = 'ERRO: ' . $e->getMessage();
    }
    
    return [
        'message' => 'Diagnóstico do sistema concluído',
        'check_type' => $checkType,
        'checks' => $checks,
        'recommendations' => generateRecommendations($checks)
    ];
}

function sendInviteAction($pdo, $input, $user) {
    // Verificar permissões
    if ($user['role'] !== 'admin' && $user['role'] !== 'super_admin') {
        throw new Exception('Apenas administradores podem enviar convites', 403);
    }
    
    $email = $input['email'] ?? '';
    $message = $input['message'] ?? 'Você foi convidado para participar do nosso grupo de poker!';
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Email inválido');
    }
    
    // Simular envio de convite
    // TODO: Implementar envio real de email
    
    return [
        'message' => 'Convite enviado com sucesso',
        'email' => $email,
        'sent_by' => $user['name'],
        'tenant_id' => $user['tenant_id']
    ];
}

// Funções auxiliares
function getAgentCapabilities($user) {
    return [
        'can_create_sessions' => in_array($user['role'], ['admin', 'super_admin']),
        'can_edit_sessions' => true,
        'can_generate_pdfs' => true,
        'can_analyze_data' => true,
        'can_debug_system' => in_array($user['role'], ['admin', 'super_admin']),
        'can_send_invites' => in_array($user['role'], ['admin', 'super_admin']),
        'user_role' => $user['role'],
        'tenant_id' => $user['tenant_id']
    ];
}

function getAgentHistory($pdo, $userId) {
    $stmt = $pdo->prepare("
        SELECT * FROM audit_logs 
        WHERE user_id = ? AND action LIKE 'agent_%'
        ORDER BY created_at DESC 
        LIMIT 50
    ");
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}

function getAgentStatus($pdo, $user) {
    return [
        'status' => 'online',
        'last_action' => null, // TODO: Implementar
        'total_actions_today' => 0, // TODO: Implementar
        'user' => [
            'name' => $user['name'],
            'role' => $user['role'],
            'tenant_id' => $user['tenant_id']
        ]
    ];
}

function generateRecommendations($checks) {
    $recommendations = [];
    
    foreach ($checks as $check => $status) {
        if (strpos($status, 'ERRO') !== false) {
            $recommendations[] = "Corrigir problema em: $check";
        }
    }
    
    if (empty($recommendations)) {
        $recommendations[] = 'Sistema funcionando normalmente';
    }
    
    return $recommendations;
}

function logAgentAction($pdo, $userId, $action, $input, $result) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO audit_logs (user_id, action, details, created_at) 
            VALUES (?, ?, ?, NOW())
        ");
        
        $details = json_encode([
            'agent_action' => $action,
            'input' => $input,
            'result' => $result
        ]);
        
        $stmt->execute([$userId, "agent_$action", $details]);
    } catch (Exception $e) {
        // Log de erro silencioso - não deve quebrar a ação principal
        error_log("Erro ao registrar ação do agente: " . $e->getMessage());
    }
}
?>
