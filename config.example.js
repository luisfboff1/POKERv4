// Arquivo de configuração de exemplo para produção
// Copie este arquivo para config.js e ajuste as configurações

export const config = {
  // Configurações do banco MySQL do Hostinger
  database: {
    host: 'localhost', // ou o host fornecido pelo Hostinger
    user: 'seu_usuario_mysql',
    password: 'sua_senha_mysql',
    database: 'poker_settlements',
    port: 3306
  },
  
  // URL do site
  appUrl: 'https://poker.luisfboff.com',
  
  // Configurações de segurança
  secret: 'seu_secret_key_aqui',
  
  // Ambiente
  environment: 'production'
};

export default config;
