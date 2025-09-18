# Guia de Solução de Problemas - Poker Settlements

## Problema: "Failed to fetch" no Login

### O que foi implementado para resolver:

1. **Teste de Conectividade Automático**
   - O sistema agora verifica a conexão com o Supabase antes de tentar fazer login
   - Indicador visual mostra o status da conexão (🔄 Verificando, ✅ Conectado, ❌ Desconectado)

2. **Tratamento de Erro Melhorado**
   - Mensagens de erro mais específicas e úteis
   - Logs detalhados no console para debugging
   - Diagnóstico automático de problemas de conexão

3. **Interface Melhorada**
   - Botões desabilitados quando não há conexão
   - Botão "Testar novamente" para verificar conexão manualmente
   - Indicadores visuais claros do status da conexão

### Como usar:

1. **Verificar Status da Conexão**
   - Abra o console do navegador (F12)
   - Observe o indicador de conectividade na tela de login
   - Se estiver desconectado, clique em "Testar novamente"

2. **Diagnosticar Problemas**
   - Abra o console do navegador (F12)
   - Procure por mensagens de erro detalhadas
   - O sistema fornece sugestões específicas baseadas no tipo de erro

### Possíveis Causas e Soluções:

#### 1. Problemas de Rede
**Sintomas:** "Failed to fetch", "NetworkError"
**Soluções:**
- Verificar conexão com a internet
- Recarregar a página
- Verificar se há firewall bloqueando a conexão
- Tentar em uma rede diferente

#### 2. Problemas de Configuração
**Sintomas:** "Invalid API key", "Unauthorized", "403"
**Soluções:**
- Verificar se a URL do Supabase está correta
- Verificar se a chave da API está correta
- Verificar se o projeto Supabase está ativo

#### 3. Problemas de Autenticação
**Sintomas:** "Invalid login credentials", "User not found", "401"
**Soluções:**
- Verificar se o email e senha estão corretos
- Tentar criar uma nova conta
- Verificar se a conta foi confirmada por email

#### 4. Problemas do Servidor
**Sintomas:** "500", "Internal Server Error", "Service Unavailable"
**Soluções:**
- O servidor pode estar temporariamente indisponível
- Tentar novamente em alguns minutos
- Verificar o status do Supabase

### Arquivos Modificados:

- `src/App.jsx` - Melhorado tratamento de erro e interface
- `src/connectionTest.js` - Novo arquivo para testes de conectividade
- `TROUBLESHOOTING.md` - Este guia

### Como Testar:

1. Abra o console do navegador (F12)
2. Tente fazer login
3. Observe as mensagens de log
4. Use o botão "Testar novamente" se necessário
5. Verifique se o indicador de conectividade está funcionando

### Logs Úteis:

O sistema agora gera logs detalhados no console:
- `🔍 Testando conectividade com Supabase...`
- `✅ Cliente Supabase inicializado`
- `✅ URL e chave configuradas`
- `✅ Consulta executada com sucesso`
- `❌ Erro na consulta:` (se houver erro)

### Contato:

Se o problema persistir, verifique:
1. Console do navegador para logs detalhados
2. Status do Supabase (https://status.supabase.com/)
3. Configurações de rede/firewall
