<?php
require_once 'config.php';

try {
    // Buscar todos os jogadores únicos de todas as sessões
    $stmt = $pdo->query("
        WITH RECURSIVE 
        players_json AS (
            SELECT DISTINCT players_data
            FROM sessions
            WHERE players_data IS NOT NULL
        ),
        players_array AS (
            SELECT JSON_UNQUOTE(
                JSON_EXTRACT(players_data, CONCAT('$[', numbers.n, '].name'))
            ) as name
            FROM players_json
            CROSS JOIN (
                SELECT 0 as n UNION ALL
                SELECT n + 1 FROM (SELECT 0 as n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL 
                    SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL 
                    SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) numbers_alias
                WHERE n < (
                    SELECT MAX(JSON_LENGTH(players_data))
                    FROM sessions
                    WHERE players_data IS NOT NULL
                )
            ) numbers
            WHERE JSON_EXTRACT(players_data, CONCAT('$[', numbers.n, '].name')) IS NOT NULL
        )
        SELECT DISTINCT name 
        FROM players_array 
        WHERE name IS NOT NULL 
        ORDER BY name
    ");

    $players = $stmt->fetchAll(PDO::FETCH_COLUMN);
    respondSuccess($players);

} catch (PDOException $e) {
    error_log("MySQL Error: " . $e->getMessage());
    respondError('Erro no servidor: ' . $e->getMessage());
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    respondError('Erro interno do servidor');
}
?>
