<?php
// Gera o hash bcrypt para a senha do super admin
// Basta rodar: php gerar_hash.php

$senha = 'Poker2025!';
$hash = password_hash($senha, PASSWORD_BCRYPT);
echo "Hash gerado para '$senha':\n$hash\n";
