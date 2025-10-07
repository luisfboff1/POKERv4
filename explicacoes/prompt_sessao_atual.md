# Prompt para a aba "Sessão Atual" do aplicativo de Poker

## Contexto
A aba **Lead**, que atualmente representa "Nova Sessão", precisa ser transformada na aba **Sessão Atual**.  
O objetivo é permitir a criação, gerenciamento e finalização de uma sessão de poker em andamento, com foco em usabilidade mobile.

---

## Funcionalidades Principais

### 1. Sessão Atual
- Se **não houver sessão criada**, o usuário verá a opção **"Criar Nova Sessão"**.  
- Se **já existir uma sessão ativa**, o usuário entrará diretamente na tela da **Sessão Atual**.

### 2. Adição de Jogadores
- O usuário poderá **adicionar jogadores** à sessão atual.  
- Opções de seleção:
  - Buscar jogadores já existentes no banco de dados (ex: digitar "Lu" → sugerir "Luiz").  
  - Criar novo jogador caso não exista.  
- Jogadores podem ser adicionados **antes ou durante** a sessão (ex: um novo jogador chega no meio do jogo).

### 3. Buy-in Inicial
- Todos os jogadores começam com um **buy-in inicial de R$50** (valor padrão editável).  
- O sistema deve permitir **rebuy** (compra de mais fichas), adicionando novos valores ao saldo do jogador.

### 4. Gestão da Janta
- A **janta** pode ser adicionada separadamente.  
- Valor da janta pode ser atribuído a jogadores específicos (quem comeu).  
- Importante: **a janta não interfere no saldo de poker**, apenas aparece no histórico para controle de pagamentos.

### 5. Cashout
- Ao final do jogo, o usuário registra o **cashout** (quanto cada jogador saiu em fichas).  
- O sistema calcula automaticamente as **transferências necessárias** para equilibrar os saldos.

### 6. Reestruturação de Pagamentos
- Na tela de transferências, o usuário poderá **ajustar as recomendações**:
  - Exemplo: se Pedro deve João R$20 e José deve Romário R$20, o usuário pode escolher que Pedro pague Romário.  
  - O sistema recalcula automaticamente os fluxos de pagamento.

### 7. Ajustes em caso de diferenças
- Caso sobre ou falte dinheiro (conta não fecha):
  - Possibilidade de marcar quem foi **prejudicado** (deveria receber, mas não recebeu).  
  - Possibilidade de marcar quem foi **beneficiado** (deveria pagar, mas não pagou).

### 8. Histórico e Pagamentos Pendentes
- Após salvar a sessão, no histórico o usuário poderá:
  - Visualizar as transferências definidas.  
  - Conferir quem já **pagou** ou **recebeu**.  
  - Marcar manualmente pagamentos como concluídos (**check** em cada card de jogador).  
- Cada card de jogador no histórico deve mostrar:
  - Pagamentos devidos/recebidos.  
  - Valores da janta.  
  - Status de pagamento (pendente ou pago).

---

## Fluxo do Usuário (Resumo)
1. Criar nova sessão (se não houver ativa).  
2. Adicionar jogadores (buscar existentes ou criar novos).  
3. Confirmar buy-in inicial (R$50 por padrão).  
4. Durante o jogo: adicionar rebuys e novos jogadores.  
5. Registrar valores da janta.  
6. Finalizar sessão → inserir cashout.  
7. Calcular transferências + ajustes manuais.  
8. Salvar sessão e acompanhar histórico → marcar pagamentos como concluídos.

---

## Observações Técnicas
- Interface **mobile-first** (uso durante o jogo em tempo real).  
- Banco de dados deve armazenar jogadores cadastrados e sessões passadas.  
- Cálculo de transferências precisa ser **dinâmico e ajustável**.  
- Histórico deve ser **editável** (check de pagamentos).  
