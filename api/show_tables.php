<?php
require_once 'config.php';

try {
    // Verificar estrutura da tabela dinner_data
    $stmt = $pdo->query("DESCRIBE dinner_data");
    $dinner_data_columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Verificar estrutura da tabela dinner_participants
    $stmt = $pdo->query("DESCRIBE dinner_participants");
    $dinner_participants_columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Verificar dados existentes
    $stmt = $pdo->query("SELECT * FROM dinner_data");
    $dinner_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->query("SELECT * FROM dinner_participants");
    $dinner_participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'dinner_data_structure' => $dinner_data_columns,
        'dinner_participants_structure' => $dinner_participants_columns,
        'dinner_data_rows' => $dinner_data,
        'dinner_participants_rows' => $dinner_participants
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'code' => $e->getCode(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
