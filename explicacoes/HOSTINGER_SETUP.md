# Configuração do Deploy no Hostinger

Este documento contém as instruções para configurar o deploy automático no Hostinger usando GitHub Actions.

## 1. Configuração do Domínio

1. Acesse o painel do Hostinger
2. Vá em "Domínios" e configure o domínio `poker.luisfboff.com`
3. **IMPORTANTE**: Marque a opção "Pasta personalizada para subdomínio"
4. Configure o diretório como `/public_html/poker/`
5. Configure o DNS para apontar para o servidor do Hostinger

### Configuração da Pasta Personalizada:
- ✅ Marcar "Pasta personalizada para subdomínio"
- ✅ Diretório: `/public_html/poker/`
- ❌ NÃO marcar "Usar diretório public_html"

## 2. Configuração do Banco MySQL

1. No painel do Hostinger, vá em "Bancos de Dados MySQL"
2. Crie um novo banco de dados chamado `poker_settlements`
3. Crie um usuário para o banco
4. Execute o script `mysql_setup.sql` no phpMyAdmin ou no painel do Hostinger

### Dados do Banco (anote estes dados):
- **Host**: (fornecido pelo Hostinger)
- **Usuário**: (criado por você)
- **Senha**: (definida por você)
- **Nome do Banco**: `poker_settlements`
- **Porta**: 3306

## 3. Configuração do FTP

1. No painel do Hostinger, vá em "FTP"
2. Crie um usuário FTP ou use o usuário principal
3. Anote os dados de acesso FTP

### Dados do FTP (anote estes dados):
- **Host FTP**: (fornecido pelo Hostinger)
- **Usuário**: (seu usuário FTP)
- **Senha**: (sua senha FTP)
- **Diretório**: `/public_html/poker/`

## 4. Configuração das Secrets no GitHub

1. Vá para o repositório no GitHub
2. Clique em "Settings" > "Secrets and variables" > "Actions"
3. Adicione as seguintes secrets:

### Secrets necessárias:
- `HOSTINGER_FTP_HOST`: Host do FTP (ex: ftp.poker.luisfboff.com)
- `HOSTINGER_FTP_USER`: Usuário do FTP
- `HOSTINGER_FTP_PASSWORD`: Senha do FTP

## 5. Configuração das Variáveis de Ambiente

1. Copie o arquivo `config.example.js` para `config.js`
2. Preencha as configurações do banco MySQL:

```javascript
export const config = {
  database: {
    host: 'seu_host_mysql_do_hostinger',
    user: 'seu_usuario_mysql',
    password: 'sua_senha_mysql',
    database: 'poker_settlements',
    port: 3306
  },
  appUrl: 'https://poker.luisfboff.com',
  secret: 'sua_chave_secreta',
  environment: 'production'
};
```

## 6. Como Funciona o Deploy

1. Quando você fizer um commit na branch `main`, o GitHub Actions será executado automaticamente
2. O workflow irá:
   - Fazer checkout do código
   - Instalar dependências
   - Fazer build do projeto
   - Fazer upload via FTP para o Hostinger

## 7. Estrutura de Arquivos no Servidor

Após o deploy, os arquivos estarão em:
```
/public_html/poker/
├── index.html
├── assets/
│   ├── index-[hash].css
│   └── index-[hash].js
└── outros arquivos estáticos
```

## 8. Testando o Deploy

1. Faça um commit na branch main
2. Verifique se o GitHub Actions executou com sucesso
3. Acesse `https://poker.luisfboff.com` para verificar se o site está funcionando

## 9. Troubleshooting

### Erro de conexão com o banco:
- Verifique se as credenciais do MySQL estão corretas
- Verifique se o banco foi criado corretamente
- Verifique se o usuário tem permissões no banco

### Erro de deploy FTP:
- Verifique se as credenciais FTP estão corretas
- Verifique se o diretório `/public_html/` existe
- Verifique se o usuário FTP tem permissões de escrita

### Site não carrega:
- Verifique se o domínio está configurado corretamente
- Verifique se os arquivos foram enviados para o diretório correto
- Verifique os logs do servidor no painel do Hostinger

## 10. Próximos Passos

Após configurar tudo:
1. Teste o deploy fazendo um commit
2. Verifique se o site está funcionando
3. Teste as funcionalidades do sistema
4. Configure backup automático do banco de dados
