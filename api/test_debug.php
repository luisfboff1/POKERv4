<?php
// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Tratar OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

http_response_code(200);

echo json_encode([
    'message' => 'TESTE FUNCIONANDO',
    'method' => $_SERVER['REQUEST_METHOD'],
    'action' => $_GET['action'] ?? 'no-action',
    'timestamp' => date('Y-m-d H:i:s'),
    'input' => file_get_contents('php://input')
]);
?>