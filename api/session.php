<?php
require_once 'config.php';

function respondError($message, $status = 500) {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

function respondSuccess($data) {
    echo json_encode(['data' => $data]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM sessions ORDER BY date DESC, id DESC");
            $sessions = $stmt->fetchAll();
            foreach ($sessions as &$session) {
                if (isset($session['players_data'])) {
                    $session['players_data'] = json_decode($session['players_data'], true);
                }
                if (isset($session['recommendations'])) {
                    $session['recommendations'] = json_decode($session['recommendations'], true);
                }
            }
            respondSuccess($sessions);
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['players_data'])) {
                respondError('Dados inválidos ou players_data ausente', 400);
            }

            $stmt = $pdo->prepare("INSERT INTO sessions (date, players_data, recommendations) VALUES (?, ?, ?)");
            $stmt->execute([
                $input['date'] ?? date('Y-m-d'),
                json_encode($input['players_data']),
                json_encode($input['recommendations'] ?? [])
            ]);
            respondSuccess(['id' => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $pathParts = explode('/', $path);
            $id = end($pathParts);

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['players_data'])) {
                respondError('Dados inválidos ou players_data ausente', 400);
            }

            $stmt = $pdo->prepare("UPDATE sessions SET players_data = ?, recommendations = ?, date = ? WHERE id = ?");
            $stmt->execute([
                json_encode($input['players_data']),
                json_encode($input['recommendations'] ?? []),
                $input['date'] ?? date('Y-m-d'),
                $id
            ]);
            respondSuccess(['updated' => true]);
            break;

        case 'DELETE':
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $pathParts = explode('/', $path);
            $id = end($pathParts);

            $stmt = $pdo->prepare("DELETE FROM sessions WHERE id = ?");
            $stmt->execute([$id]);
            respondSuccess(['deleted' => true]);
            break;

        default:
            respondError('Método não permitido', 405);
    }
} catch (PDOException $e) {
    error_log("MySQL Error: " . $e->getMessage());
    respondError('Erro no servidor: ' . $e->getMessage());
}
?>