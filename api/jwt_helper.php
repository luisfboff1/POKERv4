<?php
/**
 * JWT Helper - Funções para gerenciar tokens JWT
 * Sistema de autenticação para SaaS Poker
 */

class JWTHelper {
    private static $secret_key = null;
    private static $algorithm = 'HS256';
    private static $token_expiry = 24 * 60 * 60; // 24 horas
    
    /**
     * Inicializar chave secreta
     */
    private static function getSecretKey() {
        if (self::$secret_key === null) {
            // Usar chave do .env ou gerar uma padrão
            self::$secret_key = $_ENV['JWT_SECRET'] ?? 'poker_saas_secret_key_2025_' . hash('sha256', 'luisfboff_poker');
        }
        return self::$secret_key;
    }
    
    /**
     * Codificar em Base64 URL-safe
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Decodificar Base64 URL-safe
     */
    private static function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
    
    /**
     * Gerar token JWT
     */
    public static function generateToken($user_data) {
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$algorithm]);
        
        $payload = json_encode([
            'user_id' => $user_data['id'],
            'tenant_id' => $user_data['tenant_id'],
            'email' => $user_data['email'],
            'name' => $user_data['name'],
            'role' => $user_data['role'],
            'tenant_name' => $user_data['tenant_name'] ?? '',
            'tenant_plan' => $user_data['tenant_plan'] ?? 'basic',
            'iat' => time(),
            'exp' => time() + self::$token_expiry,
            'iss' => 'poker_saas_system'
        ]);
        
        $base64Header = self::base64UrlEncode($header);
        $base64Payload = self::base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::getSecretKey(), true);
        $base64Signature = self::base64UrlEncode($signature);
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    /**
     * Validar e decodificar token JWT
     */
    public static function validateToken($token) {
        if (empty($token)) {
            return false;
        }
        
        // Remover "Bearer " se existir
        $token = str_replace('Bearer ', '', $token);
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        list($base64Header, $base64Payload, $base64Signature) = $parts;
        
        // Verificar assinatura
        $signature = self::base64UrlEncode(
            hash_hmac('sha256', $base64Header . "." . $base64Payload, self::getSecretKey(), true)
        );
        
        if (!hash_equals($base64Signature, $signature)) {
            return false;
        }
        
        // Decodificar payload
        $payload = json_decode(self::base64UrlDecode($base64Payload), true);
        
        if (!$payload) {
            return false;
        }
        
        // Verificar expiração
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    }
    
    /**
     * Extrair token do header Authorization
     */
    public static function getTokenFromHeaders() {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            return str_replace('Bearer ', '', $headers['Authorization']);
        }
        
        if (isset($headers['authorization'])) {
            return str_replace('Bearer ', '', $headers['authorization']);
        }
        
        // Verificar se está no $_SERVER (alguns servidores)
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
        }
        
        return null;
    }
    
    /**
     * Gerar refresh token
     */
    public static function generateRefreshToken($user_id) {
        return hash('sha256', $user_id . time() . self::getSecretKey() . rand(1000, 9999));
    }
    
    /**
     * Salvar sessão do usuário no banco
     */
    public static function saveUserSession($pdo, $user_id, $token, $refresh_token = null) {
        try {
            $token_hash = hash('sha256', $token);
            $expires_at = date('Y-m-d H:i:s', time() + self::$token_expiry);
            
            $sql = "INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent, created_at) 
                    VALUES (?, ?, ?, ?, ?, NOW())";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $user_id,
                $token_hash,
                $expires_at,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
            
            return $pdo->lastInsertId();
        } catch (Exception $e) {
            error_log("Erro ao salvar sessão: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Limpar sessões expiradas
     */
    public static function cleanExpiredSessions($pdo) {
        try {
            $sql = "DELETE FROM user_sessions WHERE expires_at < NOW()";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            return $stmt->rowCount();
        } catch (Exception $e) {
            error_log("Erro ao limpar sessões: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Invalidar sessão específica
     */
    public static function invalidateSession($pdo, $token) {
        try {
            $token_hash = hash('sha256', $token);
            $sql = "DELETE FROM user_sessions WHERE token_hash = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$token_hash]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log("Erro ao invalidar sessão: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Verificar se token está na blacklist/expirado
     */
    public static function isTokenValid($pdo, $token) {
        try {
            $token_hash = hash('sha256', $token);
            $sql = "SELECT id FROM user_sessions WHERE token_hash = ? AND expires_at > NOW()";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$token_hash]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log("Erro ao verificar token: " . $e->getMessage());
            return false;
        }
    }
}
?>
