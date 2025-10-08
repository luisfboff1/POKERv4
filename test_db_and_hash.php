<?php
// Testa conexão com o banco e o hash do super admin
$host = 'srv805.hstgr.io';
$user = 'u412207473_luis';
$pass = 'Poker2025!';
$db   = 'u412207473_luis';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Erro de conexão: " . $conn->connect_error);
}
echo "Conexão com o banco OK!<br>";

$sql = "SELECT password_hash FROM users WHERE id = 1";
$res = $conn->query($sql);
if ($row = $res->fetch_assoc()) {
    $hash = $row['password_hash'];
    $senha = 'Poker2025!';
    if (password_verify($senha, $hash)) {
        echo "Senha do super admin OK!";
    } else {
        echo "Hash da senha do super admin NÃO confere!";
    }
} else {
    echo "Usuário super admin não encontrado!";
}
$conn->close();
?>
