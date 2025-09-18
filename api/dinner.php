<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

// Extrair ID dos dados de janta se presente
$dinnerId = null;
if (preg_match('/\/api\/dinner\/(\d+)/', $path, $matches)) {
    $dinnerId = $matches[1];
}

try {
    switch ($method) {
        case 'GET':
            if ($dinnerId) {
                // Buscar dados de janta específicos
                $stmt = $pdo->prepare("SELECT * FROM dinner_data WHERE id = ?");
                $stmt->execute([$dinnerId]);
                $dinner = $stmt->fetch();
                
                if (!$dinner) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Dados de janta não encontrados']);
                    exit;
                }
                
                // Buscar participantes da janta
                $stmt = $pdo->prepare("SELECT * FROM dinner_participants WHERE dinner_id = ?");
                $stmt->execute([$dinnerId]);
                $participants = $stmt->fetchAll();
                
                $dinner['participants'] = $participants;
                echo json_encode(['data' => $dinner]);
            } else {
                // Verificar estrutura das tabelas
                $stmt = $pdo->query("SHOW CREATE TABLE dinner_data");
                $dinner_data_structure = $stmt->fetch(PDO::FETCH_ASSOC);

                $stmt = $pdo->query("SHOW CREATE TABLE dinner_participants");
                $dinner_participants_structure = $stmt->fetch(PDO::FETCH_ASSOC);

                echo json_encode([
                    'dinner_data' => $dinner_data_structure,
                    'dinner_participants' => $dinner_participants_structure
                ]);
            }
            break;
            
        case 'POST':
            // Criar novos dados de janta
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Debug: Log dos dados recebidos
            error_log("Dados de janta recebidos: " . json_encode($input));
            
            // Debug: Log da query SQL
            $sql = "INSERT INTO dinner_data (session_id, total_amount, payer, division_type, custom_amount, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())";
            error_log("SQL Query: " . $sql);
            error_log("SQL Params: " . json_encode([
                $input['session_id'] ?? null,
                $input['total_amount'] ?? 0,
                $input['payer'] ?? '',
                $input['division_type'] ?? 'equal',
                $input['custom_amount'] ?? 0,
                $input['user_id'] ?? 1
            ]));
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO dinner_data (session_id, total_amount, payer, division_type, custom_amount, user_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            try {
                // Log da conexão
                error_log("Tentando conectar ao MySQL em: " . $host);
                
                // Log dos dados recebidos
                error_log("Dados recebidos para inserção: " . json_encode($input));
                
                // Log da estrutura da tabela
                try {
                    $describeStmt = $pdo->query("DESCRIBE dinner_data");
                    $columns = $describeStmt->fetchAll(PDO::FETCH_ASSOC);
                    error_log("Estrutura da tabela dinner_data: " . json_encode($columns));
                } catch (PDOException $e) {
                    error_log("Erro ao verificar estrutura da tabela: " . $e->getMessage());
                }

                // Log da query que será executada
                $queryParams = [
                    $input['session_id'] ?? null,
                    $input['total_amount'] ?? 0,
                    $input['payer'] ?? '',
                    $input['division_type'] ?? 'equal',
                    $input['custom_amount'] ?? 0,
                    $input['user_id'] ?? 1
                ];
                error_log("Query params: " . json_encode($queryParams));

                $stmt->execute($queryParams);
                
            } catch (PDOException $e) {
                error_log("=== ERRO DETALHADO ===");
                error_log("Mensagem: " . $e->getMessage());
                error_log("Código: " . $e->getCode());
                error_log("SQL State: " . $e->errorInfo[0]);
                error_log("Error Code: " . $e->errorInfo[1]);
                error_log("Error Message: " . $e->errorInfo[2]);
                error_log("=== FIM DO ERRO ===");
                
                http_response_code(500);
                echo json_encode([
                    'error' => 'Erro ao salvar dados de janta',
                    'details' => $e->getMessage(),
                    'code' => $e->getCode()
                ]);
                exit;
            }
            
            $dinnerId = $pdo->lastInsertId();
            
            // Salvar participantes da janta se fornecidos
            if (isset($input['participants']) && is_array($input['participants'])) {
                foreach ($input['participants'] as $participant) {
                    $stmt = $pdo->prepare("
                        INSERT INTO dinner_participants (dinner_id, name, amount, paid) 
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $dinnerId,
                        $participant['name'] ?? '',
                        $participant['amount'] ?? 0,
                        $participant['paid'] ? 1 : 0
                    ]);
                }
            }
            
            echo json_encode(['data' => ['id' => $dinnerId]]);
            break;
            
        case 'PUT':
            if (!$dinnerId) {
                http_response_code(400);
                echo json_encode(['error' => 'ID dos dados de janta é obrigatório']);
                exit;
            }
            
            // Atualizar dados de janta
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados inválidos']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                UPDATE dinner_data 
                SET total_amount = ?, payer = ?, division_type = ?, custom_amount = ?, updated_at = NOW()
                WHERE id = ?
            ");
            
            $stmt->execute([
                $input['totalAmount'] ?? 0,
                $input['payer'] ?? '',
                $input['divisionType'] ?? 'equal',
                $input['customAmount'] ?? 0,
                $dinnerId
            ]);
            
            // Atualizar participantes da janta
            if (isset($input['participants']) && is_array($input['participants'])) {
                // Deletar participantes existentes
                $stmt = $pdo->prepare("DELETE FROM dinner_participants WHERE dinner_id = ?");
                $stmt->execute([$dinnerId]);
                
                // Inserir novos participantes
                foreach ($input['participants'] as $participant) {
                    $stmt = $pdo->prepare("
                        INSERT INTO dinner_participants (dinner_id, name, amount, paid) 
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $dinnerId,
                        $participant['name'] ?? '',
                        $participant['amount'] ?? 0,
                        $participant['paid'] ? 1 : 0
                    ]);
                }
            }
            
            echo json_encode(['data' => ['success' => true]]);
            break;
            
        case 'DELETE':
            if (!$dinnerId) {
                http_response_code(400);
                echo json_encode(['error' => 'ID dos dados de janta é obrigatório']);
                exit;
            }
            
            // Deletar participantes da janta
            $stmt = $pdo->prepare("DELETE FROM dinner_participants WHERE dinner_id = ?");
            $stmt->execute([$dinnerId]);
            
            // Deletar dados de janta
            $stmt = $pdo->prepare("DELETE FROM dinner_data WHERE id = ?");
            $stmt->execute([$dinnerId]);
            
            echo json_encode(['data' => ['success' => true]]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno: ' . $e->getMessage()]);
}
?>
