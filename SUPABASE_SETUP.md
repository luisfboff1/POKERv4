# Configuração do Supabase - Poker Settlements

## Problema: "Sem conexão com o servidor"

O servidor que está sendo usado é o **Supabase** (https://hgmvmpzntxrdwzqvakws.supabase.co).

## Passos para Resolver:

### 1. Verificar se o Projeto Supabase está Ativo

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Verifique se o projeto `hgmvmpzntxrdwzqvakws` está ativo
4. Se não estiver, ative o projeto

### 2. Verificar Credenciais

As credenciais atuais são:
- **URL**: `https://jrdhftjekefbwjktbauu.supabase.co`
- **Chave ANON**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZGhmdGpla2VmYndqa3RiYXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTAxOTcsImV4cCI6MjA3Mjc2NjE5N30.WuxY3dwgMdizjlFmeUBNmdnQm0T48Ideo320FPTY9go`
- **Chave SERVICE_ROLE**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZGhmdGpla2VmYndqa3RiYXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE5MDE5NywiZXhwIjoyMDcyNzY2MTk3fQ.uHsyycocaEpRTugUBfnVE0BrRN-Wu1xF8zWVnZ9Wp0Y`

### 3. Configurar o Banco de Dados

Execute o script SQL no Supabase:

1. Acesse o **SQL Editor** no dashboard do Supabase
2. Execute o arquivo `database_setup.sql` que foi criado
3. Isso criará as tabelas necessárias:
   - `sessions` - para armazenar as sessões de poker
   - `user_permissions` - para gerenciar permissões de usuários

### 4. Testar a Conectividade

1. Abra o arquivo `test-connection.html` no navegador
2. Verifique se a conexão está funcionando
3. Se houver erros, verifique o console do navegador

### 5. Configurar RLS (Row Level Security)

O Supabase usa RLS para segurança. Certifique-se de que:
1. As políticas RLS estão configuradas corretamente
2. O usuário `luisfboff@hotmail.com` tem permissões de admin

## Possíveis Problemas:

### A. Projeto Inativo
**Sintoma**: Erro de conectividade
**Solução**: Ativar o projeto no dashboard do Supabase

### B. Credenciais Incorretas
**Sintoma**: Erro 401/403
**Solução**: Verificar URL e chave no dashboard

### C. Tabelas Não Existem
**Sintoma**: "relation does not exist"
**Solução**: Executar o script `database_setup.sql`

### D. RLS Muito Restritivo
**Sintoma**: Erro de permissão
**Solução**: Verificar políticas RLS

## Teste Manual:

1. Abra o console do navegador (F12)
2. Cole este código para testar:

```javascript
// Teste rápido de conectividade
fetch('https://jrdhftjekefbwjktbauu.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZGhmdGpla2VmYndqa3RiYXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTAxOTcsImV4cCI6MjA3Mjc2NjE5N30.WuxY3dwgMdizjlFmeUBNmdnQm0T48Ideo320FPTY9go'
  }
})
.then(response => {
  console.log('Status:', response.status);
  if (response.ok) {
    console.log('✅ Supabase acessível');
  } else {
    console.log('❌ Erro:', response.statusText);
  }
})
.catch(error => {
  console.log('❌ Erro de rede:', error);
});
```

## Próximos Passos:

1. **Verificar projeto Supabase**: Acesse o dashboard e confirme que está ativo
2. **Executar script SQL**: Use o `database_setup.sql` para criar as tabelas
3. **Testar conectividade**: Use o `test-connection.html` ou o teste manual
4. **Configurar permissões**: Certifique-se de que o usuário admin está configurado

## Contato:

Se o problema persistir:
1. Verifique o status do Supabase: https://status.supabase.com/
2. Verifique se há problemas de rede/firewall
3. Teste em uma rede diferente
4. Verifique se o projeto não foi pausado por inatividade
