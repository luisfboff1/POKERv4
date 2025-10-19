# Estrutura de Conexão e Banco de Dados do Poker System

## 1. Visão Geral
O projeto Poker System utiliza uma arquitetura separada entre front-end (Next.js/React) e back-end (APIs PHP), conectando-se a um banco de dados MariaDB/MySQL para persistência de dados dos usuários, sessões, transferências e estatísticas.

---

## 2. Fluxo de Conexão

### Front-end (Next.js)
- O front-end consome APIs PHP via chamadas HTTP (fetch/axios) usando variáveis como `NEXT_PUBLIC_API_URL`.
- As ações do usuário (login, registro, transferências, etc.) disparam requisições para endpoints PHP.

### Back-end (APIs PHP)
- Os arquivos PHP na pasta `api/` recebem requisições do front-end.
- Cada endpoint (ex: `session.php`, `players.php`, `auth.php`) processa dados, valida permissões e executa comandos SQL.
- A conexão com o banco é feita via PDO ou mysqli, usando variáveis do `.env` (host, usuário, senha, nome do banco).

---

## 3. Estrutura do Banco de Dados

### Principais Tabelas
- **users**: Armazena usuários, roles (user, admin, super_admin, player), dados de login.
- **sessions**: Registra sessões de poker, transferências, recomendações, status de pagamento.
- **players**: Dados dos jogadores vinculados às sessões.
- **transferências**: (pode ser embutido em sessions ou tabela separada) Registra transferências entre jogadores.
- **Estatísticas**: Tabelas auxiliares para ranking, histórico, etc.

### Exemplo de Estrutura (users)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  role ENUM('user', 'admin', 'super_admin', 'player') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Sessões e Transferências
- A tabela `sessions` pode conter colunas JSON/longtext para recomendações e transferências pagas:
  - `recommendations` (JSON): Sugestões de transferências.
  - `paid_transfers` (JSON): Status de pagamento das transferências.

---

## 4. Comandos e Scripts
- Scripts SQL em `/db` e `/scripts` para migrações, adição de roles, backup e criação de banco.
- Exemplo: `add_player_role.sql` para atualizar o ENUM da coluna `role`.

---

## 5. API PHP: Estrutura
- Cada arquivo PHP implementa um endpoint RESTful.
- Recebe dados via POST/GET, valida JWT, executa comandos SQL e retorna JSON.
- Exemplo: `session.php` para criar/atualizar sessões, persistir transferências pagas.

---

## 6. Segurança
- Autenticação via JWT (JSON Web Token).
- Variáveis sensíveis (DB, SMTP, JWT) mantidas em `.env.local` e GitHub Secrets.

---

## 7. Deploy
- Build unificado gera front-end estático e copia APIs PHP para pasta `dist/api`.
- Deploy automatizado via GitHub Actions (`deploy-hostinger.yml`) para Hostinger usando FTP.

---

## 8. Resumo do Fluxo
1. Usuário interage no front-end (Next.js).
2. Front-end faz requisição HTTP para API PHP.
3. API PHP conecta ao banco MariaDB/MySQL, executa comandos SQL.
4. Retorna resposta JSON para o front-end.
5. Dados exibidos/atualizados na interface.

---

## 9. Referências de Arquivos
- Banco: `/db/*.sql`, `/scripts/*.sql`
- API: `/api/*.php`, `/api/middleware/*.php`
- Front-end: `/app`, `/components`, `/contexts`
- Configuração: `.env.local`, `next.config.ts`, `package.json`
- Deploy: `.github/workflows/deploy-hostinger.yml`

---

## 10. Observações
- Estrutura flexível para evoluir roles, transferências e estatísticas.
- APIs PHP podem ser adaptadas para novas funcionalidades sem alterar o front-end.
- Scripts SQL facilitam manutenção e migração do banco.

---

> Para detalhes específicos de cada tabela ou endpoint, consulte os arquivos SQL e PHP correspondentes.
