<?php
// Script para gerar JWT_SECRET seguro
echo "=== GERADOR DE JWT_SECRET ===\n\n";

// Método 1: openssl_random_pseudo_bytes
if (function_exists('openssl_random_pseudo_bytes')) {
    $jwt1 = base64_encode(openssl_random_pseudo_bytes(32));
    echo "JWT_SECRET (openssl): $jwt1\n\n";
}

// Método 2: random_bytes (PHP 7+)
if (function_exists('random_bytes')) {
    $jwt2 = base64_encode(random_bytes(32));
    echo "JWT_SECRET (random_bytes): $jwt2\n\n";
}

// Método 3: hash único
$jwt3 = hash('sha256', uniqid(rand(), true));
echo "JWT_SECRET (hash): $jwt3\n\n";

// Método 4: combinado (mais seguro)
$combined = hash('sha256', 
    uniqid(rand(), true) . 
    microtime(true) . 
    (function_exists('random_bytes') ? random_bytes(16) : rand())
);
echo "JWT_SECRET (combinado): $combined\n\n";

echo "=== ESCOLHA UM DOS TOKENS ACIMA ===\n";
echo "Copie e cole no seu .env assim:\n";
echo "JWT_SECRET=TOKEN_ESCOLHIDO\n";
?>