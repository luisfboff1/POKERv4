import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSessions, useDinnerData, usePlayers, useConfig } from './useMySQL';
// Constantes de permissões (removido do permissionsService)
const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

const PERMISSIONS = {
  ADMIN: 'admin',
  USER: 'user'
};

const ADMIN_EMAIL = 'admin@poker.com';

// Funções de permissão simplificadas (removido do permissionsService)
const isAdmin = () => true; // Simplificado para desenvolvimento
const hasPermission = () => true; // Simplificado para desenvolvimento
const getCurrentUserInfo = () => ({ email: ADMIN_EMAIL, role: 'admin' });
const getAllUsers = () => [];
const approveUser = () => {};
const rejectUser = () => {};
const updateUserPermissions = () => {};
const createUserPermission = () => {};
const isUserPending = () => false;
const updateLastSeen = () => {};
const getUserStats = () => ({});
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const currencySymbols = { BRL: "R$", USD: "$", EUR: "€" };
const uid = () =>
  (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

// useLocalStorage removido - agora usando MySQL

// Autenticação simplificada - usuário padrão
function Auth({ onAuth }) {
  useEffect(() => {
    // Usuário padrão para desenvolvimento
    onAuth({ email: 'admin@poker.com', id: 1 });
  }, [onAuth]);

  return null; // Não renderiza nada, apenas autentica automaticamente

  return null; // Função Auth simplificada
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Usuário padrão para desenvolvimento
    setUser({ email: 'admin@poker.com', id: 1 });
  }, []);

  if (!user) {
    return <Auth onAuth={setUser} />;
  }

  return <PokerSettlementsApp user={user} />;
}

export default App;

function PokerSettlementsApp({ user }) {
  // Hooks MySQL
  const { sessions, loading: sessionsLoading, addSession, removeSession, editSession } = useSessions();
  const { dinnerData, loading: dinnerLoading, addDinnerData, removeDinnerData } = useDinnerData();
  
  // Hooks para dados temporários (jogadores atuais da sessão)
  const [players, setPlayers] = usePlayers();
  const [name, setName] = useState("");
  const nameInputRef = useRef(null);
  const [currency, setCurrency] = useConfig('poker_currency', 'BRL');
  const [tab, setTab] = useConfig('poker_active_tab', 'sessao');
  const [note, setNote] = useState("");
  const [sessionSettlements, setSessionSettlements] = useState([]);
  const [recommendedPayments, setRecommendedPayments] = useState([]);
  
  // Estados para a funcionalidade da janta (dados temporários da sessão atual)
  const [currentDinnerData, setCurrentDinnerData] = useState({
    totalAmount: 0,
    payer: '',
    divisionType: 'equal',
    customAmounts: {},
    payments: {}
  });
  const [recFrom, setRecFrom] = useState("");
  const [recTo, setRecTo] = useState("");
  const [recAmount, setRecAmount] = useState("");

  // Estados para aba de usuários (removidos - não precisamos mais)
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(true); // Sempre admin para simplificar

  // Atualiza settlements sempre que players ou recommendedPayments mudar, mas só na aba sessão
  useEffect(() => {
    if (tab === "sessao") {
      // Remove recomendações inválidas (ex: jogadores removidos)
      const validRecs = recommendedPayments.filter(r => 
        players.find(p => p.name === r.from) && players.find(p => p.name === r.to)
      );
      
      // Otimiza transferências considerando as recomendações como restrições
      const optimized = optimizeTransfers(players, validRecs).map(t => ({ ...t, paid: false }));
      
      // Junta recomendações (fixas) + otimizadas
      setSessionSettlements([
        ...validRecs.map(r => ({ 
          from: r.from, 
          to: r.to, 
          amount: Number(r.amount), 
          paid: false, 
          recommended: true 
        })),
        ...optimized
      ]);
    }
  }, [players, tab, recommendedPayments]);

  // Verificar se usuário é admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (user) {
        const adminStatus = await isAdmin();
        setIsUserAdmin(adminStatus);
      } else {
        setIsUserAdmin(false);
      }
    }
    checkAdminStatus();
  }, [user]);

  // Atualizar última aparição e carregar usuários quando necessário
  useEffect(() => {
    if (user && tab === "usuarios") {
      // Atualizar última aparição
      updateLastSeen();
      
      // Carregar usuários se for admin
      loadUsers();
    }
  }, [user, tab, isUserAdmin]);

  // Carregar dados da janta quando a aba for ativada (opcional)
  useEffect(() => {
    if (tab === 'janta' && name) {
      loadDinnerData();
    }
  }, [tab, name]);

  // Função global para carregar janta para edição
  useEffect(() => {
    window.loadDinnerForEdit = async (dinnerId) => {
      try {
        // Carregar dados da janta
        await loadDinnerData(dinnerId);
        
        // Ir para a aba janta
        setTab('janta');
        
        alert('Janta carregada para edição!');
      } catch (error) {
        console.error('Erro ao carregar janta para edição:', error);
        alert('Erro ao carregar janta para edição');
      }
    };

    // Função global para carregar sessão para edição
    window.loadSessionForEdit = async (sessionId) => {
      try {
        const session = sessions.find(s => s.id === sessionId);
        if (session && session.snapshot) {
          const snapshot = typeof session.snapshot === 'string' 
            ? JSON.parse(session.snapshot) 
            : session.snapshot;

          // Carregar dados da sessão
          if (snapshot.players) {
            setPlayers(snapshot.players);
            setName(session.name || `Sessão ${new Date(session.date).toLocaleDateString()}`);
            setNote(session.name || '');
            
            // Carregar settlements se existirem
            if (snapshot.settlements) {
              setSessionSettlements(snapshot.settlements);
            }
          }
          
          // Ir para a aba sessão
          setTab('sessao');
          
          alert('Sessão carregada para edição!');
        }
      } catch (error) {
        console.error('Erro ao carregar sessão para edição:', error);
        alert('Erro ao carregar sessão para edição');
      }
    };

    return () => {
      delete window.loadDinnerForEdit;
      delete window.loadSessionForEdit;
    };
  }, []);

  // Histórico agora vem do hook useSessions
  const history = sessions.map(s => ({
    id: s.id,
    dateISO: s.date,
    label: s.name,
    players: s.snapshot ? (typeof s.snapshot === 'string' ? JSON.parse(s.snapshot).players : s.snapshot.players) : [],
    raw: s
  }));
  const loadingHistory = sessionsLoading;
  const reloadHistory = () => {}; // Função vazia - o hook useSessions já recarrega automaticamente

  // foco inicial
  useEffect(() => { nameInputRef.current?.focus(); }, []);

  // --- sessão atual ---
  function addPlayer() {
    const trimmed = name.trim(); if (!trimmed) return;
    setPlayers(prev => [...prev, { id: uid(), name: trimmed, buyIns: [], cashOut: 0 }]);
    setName("");
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }
  function removePlayer(id){ setPlayers(prev => prev.filter(p => p.id !== id)); }
  function addBuyIn(id, amount){
    if(!isFinite(amount)||amount<=0) return;
    setPlayers(prev=>prev.map(p=>p.id===id?{...p,buyIns:[...p.buyIns,+amount]}:p));
  }
  function removeBuyIn(id, index){
    setPlayers(prev=>prev.map(p=>{
      if(p.id!==id) return p;
      const copy=[...p.buyIns]; copy.splice(index,1);
      return { ...p, buyIns: copy };
    }));
  }
  function setCashOut(id, amount){
    if(!isFinite(amount)||amount<0) return;
    setPlayers(prev=>prev.map(p=>p.id===id?{...p,cashOut:+amount}:p));
  }

  function resetAll(){
    setPlayers([]);
    setName("");
    setTab("sessao");
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }

  // Salvar sessão no MySQL
  async function saveCurrentSession(){
    if(players.length===0){ alert("Adicione jogadores antes de salvar."); return; }
    const snapshot = {
      id: uid(),
      dateISO: new Date().toISOString(),
      label: note.trim() || undefined,
      players: players.map(p => ({ id: uid(), name: p.name, buyIns: [...p.buyIns], cashOut: +p.cashOut || 0 })),
      settlements: sessionSettlements
    };
    
    const sessionData = {
      name: snapshot.label || `Sessão ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString().split('T')[0],
      buyIn: players.reduce((sum, p) => sum + (p.buyIn || 0), 0),
      rebuy: players.reduce((sum, p) => sum + (p.rebuy || 0), 0),
      addOn: players.reduce((sum, p) => sum + (p.addOn || 0), 0),
      totalPot: players.reduce((sum, p) => sum + (p.finalAmount || 0), 0),
      snapshot: snapshot,
      userId: user.id
    };
    
    const success = await addSession(sessionData);
    if (success) {
      setNote("");
      setTab("historico");
      alert("Sessão salva!");
    } else {
      alert("Falha ao salvar a sessão.");
    }
  }

  // Excluir sessão do MySQL
  async function deleteSession(id){
    if (confirm('Tem certeza que deseja excluir esta sessão?')) {
      const success = await removeSession(id);
      if (!success) {
        alert("Falha ao excluir a sessão.");
      }
    }
  }

  // Função para excluir janta (independente ou associada a sessão)
  async function deleteDinnerOrSession(id, isDinnerOnly = false) {
    try {
      if (isDinnerOnly) {
        // Excluir apenas dados da janta
        await deleteDinnerData(id);
        // Recarregar histórico para atualizar a lista
        reloadHistory();
      } else {
        // Excluir sessão (que pode ter dados de janta associados)
        await deleteSession(id);
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir item');
    }
  }

  // Função para excluir dados da janta do histórico
  const deleteDinnerData = async (sessionId) => {
    try {
      const success = await removeDinnerData(sessionId);
      if (success) {
        alert('Dados da janta excluídos com sucesso!');
        return true;
      } else {
        alert('Erro ao excluir dados da janta!');
        return false;
      }
    } catch (error) {
      console.error('Erro ao excluir dados da janta:', error);
      throw error;
    }
  };

  const totals = useMemo(()=>summarize(players),[players]);
  const settlements = useMemo(()=>optimizeTransfers(players, []),[players]);

  // Formulário de recomendação de pagamento
  function handleAddRecommendation(e) {
    e.preventDefault();
    if (!recFrom || !recTo || !recAmount || recFrom === recTo || !players.find(p => p.name === recFrom) || !players.find(p => p.name === recTo)) return;
    setRecommendedPayments(prev => [...prev, { from: recFrom, to: recTo, amount: Number(recAmount) }]);
    setRecFrom(""); setRecTo(""); setRecAmount("");
  }

  // Remover recomendação
  function handleRemoveRecommendation(index) {
    setRecommendedPayments(prev => prev.filter((_, i) => i !== index));
  }

  // Função para recalcular otimização manualmente
  function recalculateOptimization() {
    console.log('🔄 Recalculando otimização...');
    
    // Remove recomendações inválidas
    const validRecs = recommendedPayments.filter(r => 
      players.find(p => p.name === r.from) && players.find(p => p.name === r.to)
    );
    
    console.log('📝 Recomendações válidas:', validRecs);
    console.log('👥 Jogadores:', players);
    
    // Recalcula otimização
    const optimized = optimizeTransfers(players, validRecs).map(t => ({ ...t, paid: false }));
    
    console.log('💸 Transferências otimizadas:', optimized);
    
    // Atualiza settlements
    const newSettlements = [
      ...validRecs.map(r => ({ 
        from: r.from, 
        to: r.to, 
        amount: Number(r.amount), 
        paid: false, 
        recommended: true 
      })),
      ...optimized
    ];
    
    console.log('✅ Novo settlements:', newSettlements);
    setSessionSettlements(newSettlements);
  }

  // Funções para gerenciar a janta
  const handleDinnerTotalChange = (value) => {
    setCurrentDinnerData(prev => ({
      ...prev,
      totalAmount: parseFloat(value) || 0
    }));
  };

  const handleDinnerPayerChange = (payerId) => {
    setCurrentDinnerData(prev => ({
      ...prev,
      payer: payerId
    }));
  };

  const handleDivisionTypeChange = (type) => {
    setCurrentDinnerData(prev => ({
      ...prev,
      divisionType: type,
      customAmounts: type === 'equal' ? {} : prev.customAmounts
    }));
  };

  const handleCustomAmountChange = (playerId, amount) => {
    setCurrentDinnerData(prev => ({
      ...prev,
      customAmounts: {
        ...prev.customAmounts,
        [playerId]: parseFloat(amount) || 0
      }
    }));
  };

  const handlePaymentToggle = (playerId) => {
    setCurrentDinnerData(prev => {
      const currentPayment = prev.payments[playerId];
      const amount = prev.divisionType === 'equal' 
        ? prev.totalAmount / players.length 
        : prev.customAmounts[playerId] || 0;
      
      return {
        ...prev,
        payments: {
          ...prev.payments,
          [playerId]: {
            paid: !currentPayment?.paid,
            amount: amount
          }
        }
      };
    });
  };

  const saveDinnerData = async () => {
    try {
      if (currentDinnerData.totalAmount <= 0) {
        alert('Por favor, preencha o valor total da janta');
        return;
      }

      if (players.length === 0) {
        alert('Por favor, adicione pelo menos um jogador para a janta');
        return;
      }

      // Gerar um ID único para a janta se não existir
      const dinnerId = name || `dinner_${Date.now()}`;
      
      // Preparar dados dos jogadores com nomes
      const playersData = players.map(player => ({
        id: player.id,
        name: player.name
      }));

      const dinnerDataToSave = {
        sessionId: dinnerId,
        totalCost: currentDinnerData.totalAmount,
        numberOfPeople: players.length,
        costPerPerson: currentDinnerData.totalAmount / players.length,
        participants: playersData
      };

      const success = await addDinnerData(dinnerDataToSave);
      if (success) {
        alert('Dados da janta salvos com sucesso!');
        // Limpar dados da sessão atual
        setCurrentDinnerData({
          totalAmount: 0,
          payer: '',
          divisionType: 'equal',
          customAmounts: {},
          payments: {}
        });
      } else {
        alert('Erro ao salvar dados da janta!');
      }
    } catch (error) {
      console.error('Erro ao salvar dados da janta:', error);
      alert(`Erro ao salvar dados da janta: ${error.message}`);
    }
  };

  const loadDinnerData = async (dinnerId = null) => {
    // Função simplificada - dados da janta agora vêm do hook MySQL
    console.log('loadDinnerData chamado para:', dinnerId);
  };

  // Funções para gerenciar usuários
  async function loadUsers() {
    if (!user || !isUserAdmin) return;
    
    setLoadingUsers(true);
    try {
      const [usersData, statsData] = await Promise.all([
        getAllUsers(),
        getUserStats()
      ]);
      setUsers(usersData);
      setUserStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleApproveUser(userEmail, role = ROLES.VIEWER) {
    try {
      await approveUser(userEmail, role);
      await loadUsers(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      alert('Erro ao aprovar usuário');
    }
  }

  async function handleRejectUser(userEmail) {
    try {
      await rejectUser(userEmail);
      await loadUsers(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
      alert('Erro ao rejeitar usuário');
    }
  }

  async function handleUpdateUserRole(userEmail, newRole) {
    try {
      await updateUserPermissions(userEmail, newRole);
      await loadUsers(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
      alert('Erro ao atualizar permissões');
    }
  }

  function formatLastSeen(lastSeen) {
    if (!lastSeen) return 'Nunca';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR');
  }

  function getRoleBadgeColor(role) {
    switch (role) {
      case ROLES.ADMIN: return 'bg-red-100 text-red-800';
      case ROLES.EDITOR: return 'bg-blue-100 text-blue-800';
      case ROLES.VIEWER: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusBadgeColor(isApproved) {
    return isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  }

  // Dark mode toggle
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 sm:p-6">
      <div className="mx-auto max-w-[98vw] space-y-5">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🂡</span>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight">Home Game</h1>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
              Persistência: MySQL
            </span>
            {/* Botão de modo escuro/claro */}
            <button
              onClick={() => setDark(d => !d)}
              className="rounded-full border px-2 py-1 bg-white dark:bg-slate-800 shadow text-xl flex items-center"
              title={dark ? 'Modo claro' : 'Modo escuro'}
            >
              {dark ? '🌞' : '🌙'}
            </button>
            <label className="text-sm">Moeda</label>
            <select value={currency} onChange={e=>setCurrency(e.target.value)} className="rounded-xl border px-3 py-1.5 shadow-sm bg-white dark:bg-slate-800 dark:text-slate-100">
              {Object.keys(currencySymbols).map(c=>(<option key={c} value={c}>{c}</option>))}
            </select>
            <button onClick={resetAll} className="rounded-2xl bg-red-600 text-white px-4 py-2 shadow hover:opacity-90" title="Limpar sessão">
              Resetar sessão
            </button>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto">
          {[{id:"sessao",label:"Sessão"},{id:"janta",label:"Janta"},{id:"historico",label:"Histórico"},{id:"ranking",label:"Ranking"},{id:"dashboard",label:"Dashboard"},{id:"usuarios",label:"Usuários"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`px-4 py-2 rounded-2xl border shadow-sm whitespace-nowrap ${tab===t.id?"bg-slate-900 text-white":"bg-white"}`}>
              {t.label}
            </button>
          ))}
        </nav>

        {tab==="sessao" && (
          <section className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <PlayersEditor
                players={players}
                onAddPlayer={addPlayer}
                onRemovePlayer={removePlayer}
                onAddBuyIn={addBuyIn}
                onRemoveBuyIn={removeBuyIn}
                onSetCashOut={setCashOut}
                name={name}
                setName={setName}
                nameInputRef={nameInputRef}
                currencySymbol={currencySymbols[currency]}
                history={history}
              />
              {/* Formulário de recomendação de pagamento */}
              <form onSubmit={handleAddRecommendation} className="flex flex-wrap gap-2 items-end mt-4 bg-white p-4 rounded-2xl shadow">
                <div>
                  <label className="block text-xs mb-1">Quem paga</label>
                  <select value={recFrom} onChange={e=>setRecFrom(e.target.value)} className="rounded-xl border px-3 py-2 min-w-[120px]">
                    <option value="">Selecione</option>
                    {players.map(p=>(<option key={p.name} value={p.name}>{p.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Quem recebe</label>
                  <select value={recTo} onChange={e=>setRecTo(e.target.value)} className="rounded-xl border px-3 py-2 min-w-[120px]">
                    <option value="">Selecione</option>
                    {players.map(p=>(<option key={p.name} value={p.name}>{p.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Valor</label>
                  <input type="number" min="0.01" step="0.01" value={recAmount} onChange={e=>setRecAmount(e.target.value)} className="rounded-xl border px-3 py-2 w-24" placeholder="0,00" />
                </div>
                <button type="submit" className="rounded-2xl bg-emerald-600 text-white px-4 py-2 shadow">Adicionar recomendação</button>
              </form>
              {/* Lista de recomendações já feitas */}
              {recommendedPayments.length > 0 && (
                <div className="mt-2 bg-emerald-50 rounded-xl p-3 text-sm">
                  <div className="font-semibold mb-2 flex items-center">
                    📝 Pagamentos recomendados (fixos):
                    <span className="ml-2 text-xs bg-emerald-200 px-2 py-1 rounded-full">
                      {recommendedPayments.length} recomendação(ões)
                    </span>
                  </div>
                  <div className="mb-2 text-xs text-emerald-700">
                    💡 Estas recomendações serão incluídas em todos os pagamentos. Use "Atualizar Otimização" para recalcular o restante.
                  </div>
                  <ul className="space-y-1">
                    {recommendedPayments.map((r,i)=>(
                      <li key={i} className="flex items-center justify-between bg-white rounded-lg p-2 border-l-4 border-emerald-400">
                        <span className="font-medium">{r.from} → {r.to}: {formatMoney(Number(r.amount), currencySymbols[currency])}</span>
                        <button 
                          onClick={() => handleRemoveRecommendation(i)}
                          className="text-red-600 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
                          title="Remover recomendação"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <input
                  value={note}
                  onChange={e=>setNote(e.target.value)}
                  placeholder="Observação da sessão (opcional)"
                  className="flex-1 min-w-[240px] rounded-xl border px-3 py-2 bg-white"
                />
                <button onClick={saveCurrentSession} className="rounded-2xl bg-emerald-600 text-white px-4 py-2 shadow">
                  Salvar sessão no Histórico
                </button>
                <ImportExport players={players} setPlayers={setPlayers} />
              </div>
            </div>

            <div className="md:col-span-1">
              <SessionSummary totals={totals} currencySymbol={currencySymbols[currency]} />
              <OptimizerPanel
                settlements={sessionSettlements}
                currencySymbol={currencySymbols[currency]}
                onTogglePaid={(idx, paid) => setSessionSettlements(s => s.map((t, i) => i === idx ? { ...t, paid } : t))}
                onRecalculate={recalculateOptimization}
                hasRecommendations={recommendedPayments.length > 0}
              />
            </div>
          </section>
        )}

        {tab==="historico" && (
          loadingHistory ? <div>Carregando histórico...</div> :
          <HistoryPanel history={history} dinnerData={dinnerData} currencySymbol={currencySymbols[currency]} onDelete={deleteDinnerOrSession} onReload={reloadHistory} />
        )}

        {tab==="ranking" && (<RankingPanel history={history} currencySymbol={currencySymbols[currency]} />)}
        {tab==="dashboard" && (
          <DashboardPanel history={history} currencySymbol={currencySymbols[currency]} />
        )}
        {tab==="janta" && (
          <DinnerPanel 
            players={players}
            dinnerData={currentDinnerData}
            onTotalChange={handleDinnerTotalChange}
            onPayerChange={handleDinnerPayerChange}
            onDivisionTypeChange={handleDivisionTypeChange}
            onCustomAmountChange={handleCustomAmountChange}
            onPaymentToggle={handlePaymentToggle}
            onSave={saveDinnerData}
            onDelete={() => deleteDinnerData(name)}
            currencySymbol={currencySymbols[currency]}
          />
        )}

        {tab==="usuarios" && (
          <div className="p-6">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800">Aba de Usuários</h2>
              <p className="text-blue-600">Status: {isUserAdmin ? 'Admin' : 'Não Admin'}</p>
              <p className="text-blue-600">Usuário: {user?.email || 'Não logado'}</p>
            </div>
            <UsersPanel 
              users={users}
              userStats={userStats}
              loadingUsers={loadingUsers}
              isUserAdmin={isUserAdmin}
              onApproveUser={handleApproveUser}
              onRejectUser={handleRejectUser}
              onUpdateUserRole={handleUpdateUserRole}
              formatLastSeen={formatLastSeen}
              getRoleBadgeColor={getRoleBadgeColor}
              getStatusBadgeColor={getStatusBadgeColor}
              ROLES={ROLES}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PlayersEditor({
  players, onAddPlayer, onRemovePlayer, onAddBuyIn, onRemoveBuyIn, onSetCashOut,
  name, setName, nameInputRef, currencySymbol, history
}){
  // Detecta se está em mobile de forma mais robusta
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Extrai nomes únicos do histórico de forma mais robusta
  const getUniquePlayerNames = () => {
    if (!history || !Array.isArray(history)) {
      return [];
    }
    
    const names = new Set();
    history.forEach(session => {
      if (session && session.players && Array.isArray(session.players)) {
        session.players.forEach(player => {
          if (player && player.name) {
            names.add(player.name);
          }
        });
      }
    });
    return Array.from(names).sort();
  };

  const uniqueNames = getUniquePlayerNames();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);

  // Debug: log para verificar se os nomes estão sendo carregados
  useEffect(() => {
    console.log('PlayersEditor - History:', history);
    console.log('PlayersEditor - Unique names:', uniqueNames);
    console.log('PlayersEditor - Current name:', name);
  }, [history, uniqueNames, name]);

  // Filtra sugestões baseado no que está sendo digitado
  const filteredSuggestions = uniqueNames.filter(n => 
    n.toLowerCase().includes(name.toLowerCase()) && 
    !players.some(p => p.name === n)
  );

  const handleInputChange = (e) => {
    setName(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
    setSelectedSuggestion(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (selectedSuggestion >= 0 && filteredSuggestions[selectedSuggestion]) {
        setName(filteredSuggestions[selectedSuggestion]);
        setShowSuggestions(false);
        onAddPlayer();
      } else {
        onAddPlayer();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestion(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setName(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow">
        <h2 className="text-lg font-semibold mb-3">Jogadores</h2>
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={nameInputRef}
                placeholder="Nome do jogador"
                className="w-full rounded-xl border px-3 py-2"
                value={name}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => name.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {/* Lista de sugestões */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-pink-100 dark:bg-pink-700 border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion}
                      className={`px-3 py-2 cursor-pointer hover:bg-pink-200 dark:hover:bg-pink-600 ${
                        index === selectedSuggestion ? 'bg-pink-200 dark:bg-pink-600' : ''
                      } ${index === 0 ? 'rounded-t-xl' : ''} ${index === filteredSuggestions.length - 1 ? 'rounded-b-xl' : ''}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onAddPlayer} className="rounded-2xl bg-slate-900 text-white px-4 py-2 shadow whitespace-nowrap">
              Adicionar
            </button>
          </div>
        </div>
      </div>
      {/* Mobile: cards, Desktop: tabela */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow">
        {isMobile ? (
          <div className="space-y-4">
            {players.length === 0 && (
              <div className="text-center py-6 text-slate-500">Adicione jogadores para começar</div>
            )}
            {players.map(p => {
              const totalBuy = p.buyIns.reduce((a, b) => a + b, 0);
              const net = (p.cashOut || 0) - totalBuy;
              return (
                <div key={p.id} className="rounded-xl border p-3 shadow-sm space-y-2">
                  <div className="font-medium text-base">{p.name}</div>
                  <div className="text-sm text-slate-600">Buy-ins: {p.buyIns.map((b, i) => (
                    <span key={i} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 mr-1">
                      {formatMoney(b, currencySymbol)}
                      <button onClick={() => onRemoveBuyIn(p.id, i)} className="text-rose-600 hover:text-rose-700" title="Remover este buy-in">×</button>
                    </span>
                  ))}</div>
                  <div className="flex gap-2 items-center">
                    <AddAmount label="Adicionar buy-in" onAdd={amt => onAddBuyIn(p.id, amt)} />
                  </div>
                  <div className="text-sm">Total Buy-in: <span className="font-semibold">{formatMoney(totalBuy, currencySymbol)}</span></div>
                  <div className="text-sm">Cash-out: <NumberInput value={p.cashOut || 0} onChange={v => onSetCashOut(p.id, v)} placeholder="0,00" /></div>
                  <div className={`text-sm font-semibold ${net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>Lucro Líquido: {formatMoney(net, currencySymbol)}</div>
                  <div className="text-right">
                    <button onClick={() => onRemovePlayer(p.id)} className="text-rose-600 hover:underline">Remover</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="text-left text-slate-600">
                <tr>
                  <th className="py-2 w-32 whitespace-normal">Jogador</th>
                  <th className="py-2 w-56 whitespace-normal">Buy-ins</th>
                  <th className="py-2 w-20 whitespace-normal">Buy-in</th>
                  <th className="py-2 w-24 whitespace-normal">Cash</th>
                  <th className="py-2 w-20 whitespace-normal">Net</th>
                  <th className="py-2 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {players.length === 0 && (<tr><td colSpan={6} className="text-center py-6 text-slate-500">Adicione jogadores para começar</td></tr>)}
                {players.map(p => {
                  const totalBuy = p.buyIns.reduce((a, b) => a + b, 0); const net = (p.cashOut || 0) - totalBuy;
                  return (
                    <tr key={p.id} className="border-t last:border-b align-top">
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="py-2 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {p.buyIns.map((b, i) => (
                            <span key={i} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1">
                              {formatMoney(b, currencySymbol)}
                              <button onClick={() => onRemoveBuyIn(p.id, i)} className="text-rose-600 hover:text-rose-700" title="Remover este buy-in">×</button>
                            </span>
                          ))}
                        </div>
                        <AddAmount label={<span className="whitespace-nowrap">Adicionar buy-in</span>} onAdd={amt => onAddBuyIn(p.id, amt)} />
                      </td>
                      <td className="py-2">{formatMoney(totalBuy, currencySymbol)}</td>
                      <td className="py-2"><NumberInput value={p.cashOut || 0} onChange={v => onSetCashOut(p.id, v)} placeholder="0,00" /></td>
                      <td className={`py-2 font-semibold ${net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatMoney(net, currencySymbol)}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => onRemovePlayer(p.id)} className="text-rose-600 hover:underline">Remover</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, placeholder }){
  return (
    <input
      type="number" inputMode="decimal"
      className="w-36 rounded-xl border px-3 py-2"
      value={Number.isFinite(value)?value:0}
      onChange={(e)=>onChange(parseFloat(e.target.value))}
      placeholder={placeholder} step="0.01" min="0"
    />
  );
}
function AddAmount({ onAdd, label }){
  const [v, setV] = useState("");
  const commit=()=>{ const amt=parseFloat(v); if(isFinite(amt)&&amt>0) onAdd(amt); setV(""); };
  return (
    <div className="flex gap-2 items-center">
      <input type="number" inputMode="decimal" value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') commit(); }} placeholder="valor" step="0.01" min="0" className="w-28 rounded-xl border px-3 py-2" />
      <button onClick={commit} className="rounded-2xl bg-slate-900 text-white px-3 py-2 whitespace-nowrap">{label ?? 'Adicionar buy-in'}</button>
      <div className="flex gap-1">{[20,50,100,200].map(x=>(<button key={x} onClick={()=>onAdd(x)} className="rounded-xl border px-2 py-1 text-xs hover:bg-slate-50">+{x}</button>))}</div>
    </div>
  );
}

function SessionSummary({ totals, currencySymbol }){
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow space-y-2 mb-4">
      <h2 className="text-lg font-semibold">Resumo</h2>
      <Row label="Total Buy-ins" value={formatMoney(totals.totalBuyIn, currencySymbol)} />
      <Row label="Total Cash-out" value={formatMoney(totals.totalCashOut, currencySymbol)} />
      <Row label="Diferença" value={formatMoney(totals.totalCashOut - totals.totalBuyIn, currencySymbol)} />
      <div className="pt-2 text-xs text-slate-500">* soma de lucros = soma de perdas</div>
    </div>
  );
}
function Row({label,value}){ return (<div className="flex items-center justify-between"><span className="text-slate-600">{label}</span><span className="font-semibold">{value}</span></div>); }

function OptimizerPanel({ settlements, currencySymbol, sessionId, onTogglePaid, onRecalculate, hasRecommendations }){
  const totalTransfers=settlements.length; 
  const totalVolume=settlements.reduce((a,t)=>a+t.amount,0);
  const recommendedCount = settlements.filter(t => t.recommended).length;
  const optimizedCount = settlements.filter(t => !t.recommended).length;
  
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Otimização de Transferências</h2>
        {hasRecommendations && (
          <button 
            onClick={onRecalculate}
            className="rounded-xl bg-blue-600 text-white px-3 py-1 text-sm shadow hover:bg-blue-700"
            title="Recalcular otimização considerando recomendações"
          >
            🔄 Atualizar
          </button>
        )}
      </div>
      {totalTransfers===0 ? (
        <div className="text-slate-500">Nada a liquidar.</div>
      ) : (
        <>
          <div className="text-sm text-slate-600">
            Sugestão com número mínimo de transferências (≤ N-1):
            {recommendedCount > 0 && (
              <div className="mt-1 text-xs text-emerald-600">
                📝 {recommendedCount} recomendação(ões) fixa(s) + {optimizedCount} transferência(ões) otimizada(s)
              </div>
            )}
          </div>
          <ul className="space-y-2">
            {settlements.map((t,i)=>(
              <li key={i} className={`rounded-xl px-3 py-2 flex items-center gap-2 ${
                t.recommended 
                  ? 'bg-emerald-50 border-2 border-emerald-400' 
                  : 'bg-slate-50 border border-slate-200'
              }`}>
                <span className="font-medium">{t.from}</span> paga para <span className="font-medium">{t.to}</span> {formatMoney(t.amount, currencySymbol)}
                {t.recommended && (
                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full ml-2">
                    📝 Fixo
                  </span>
                )}
                {!t.recommended && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full ml-2">
                    🔄 Otimizado
                  </span>
                )}
                {typeof t.paid !== 'undefined' && (
                  <label className="flex items-center gap-1 ml-2">
                    <input type="checkbox" checked={!!t.paid} onChange={()=>onTogglePaid && onTogglePaid(i, !t.paid)} />
                    <span className="text-xs">Pago?</span>
                  </label>
                )}
              </li>
            ))}
          </ul>
          <div className="text-sm text-slate-600 pt-2">
            {totalTransfers} transferência(s), volume total {formatMoney(totalVolume, currencySymbol)}
          </div>
        </>
      )}
    </div>
  );
}

function ImportExport({ players, setPlayers }){
  function exportJSON(){ const blob=new Blob([JSON.stringify(players,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`poker-session-${new Date().toISOString().slice(0,19)}.json`; a.click(); URL.revokeObjectURL(url); }
  function importJSON(ev){ const file=ev.target.files?.[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(String(reader.result)); if(Array.isArray(data)) setPlayers(data); } catch { alert('Arquivo inválido') } }; reader.readAsText(file); }
  return (<div className="flex items-center gap-2"><button onClick={exportJSON} className="rounded-2xl bg-slate-900 text-white px-4 py-2 shadow">Exportar JSON</button><label className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 bg-white shadow-sm cursor-pointer"><input type="file" accept="application/json" className="hidden" onChange={importJSON} />Importar JSON</label></div>);
}

// Componente para editar janta no modal
function EditDinnerModal({ dinnerData, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    totalAmount: dinnerData.dinnerData?.total_amount || 0,
    payer: dinnerData.dinnerData?.payer || '',
    divisionType: dinnerData.dinnerData?.division_type || 'equal',
    customAmounts: dinnerData.dinnerData?.custom_amounts || {},
    payments: dinnerData.dinnerData?.payments || {}
  });

  // Calcular valor por pessoa
  const valuePerPerson = formData.totalAmount / (dinnerData.players?.length || 1);

  const handlePaymentToggle = (playerId) => {
    setFormData(prev => ({
      ...prev,
      payments: {
        ...prev.payments,
        [playerId]: !prev.payments[playerId]
      }
    }));
  };

  const handleSave = () => {
    onSave({
      ...dinnerData,
      dinnerData: {
        ...dinnerData.dinnerData,
        ...formData
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Valor Total (R$)</label>
        <input
          type="number"
          step="0.01"
          value={formData.totalAmount}
          onChange={(e) => setFormData(prev => ({...prev, totalAmount: parseFloat(e.target.value) || 0}))}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Quem Pagou a Conta</label>
        <select
          value={formData.payer}
          onChange={(e) => setFormData(prev => ({...prev, payer: e.target.value}))}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Selecione...</option>
          {dinnerData.players?.map(player => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tipo de Divisão</label>
        <select
          value={formData.divisionType}
          onChange={(e) => setFormData(prev => ({...prev, divisionType: e.target.value}))}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="equal">Divisão Igual</option>
          <option value="custom">Valores Personalizados</option>
        </select>
      </div>

      {/* Lista de jogadores com status de pagamento */}
      <div>
        <label className="block text-sm font-medium mb-2">Status de Pagamento dos Jogadores</label>
        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
          {dinnerData.players?.map(player => (
            <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <span className="font-medium">{player.name}</span>
                <span className="text-sm text-gray-600">
                  R$ {valuePerPerson.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.payments[player.id]}
                  onChange={() => handlePaymentToggle(player.id)}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  {formData.payments[player.id] ? '✓ Pago' : '✗ Pendente'}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Componente para editar sessão no modal
function EditSessionModal({ sessionData, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: sessionData.name || '',
    note: sessionData.note || ''
  });

  const handleSave = () => {
    onSave({
      ...sessionData,
      ...formData
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome da Sessão</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Observações</label>
        <textarea
          value={formData.note}
          onChange={(e) => setFormData(prev => ({...prev, note: e.target.value}))}
          className="w-full px-3 py-2 border rounded-lg h-20"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function HistoryPanel({ history, dinnerData, currencySymbol, onDelete, onReload }){
  const [expanded, setExpanded] = useState(null); // id da sessão expandida
  const [editSettlements, setEditSettlements] = useState({}); // { [sessionId]: settlements[] }
  const [historyTab, setHistoryTab] = useState('jogos'); // 'jogos' ou 'jantas'
  const [editModal, setEditModal] = useState(null); // {type: 'dinner'|'session', data: {...}}

  // Usar dados de janta do MySQL
  const dinnerHistory = dinnerData || [];

  // Atualiza settlements editáveis ao expandir uma sessão
  function handleExpand(sessionId, settlements) {
    if (expanded !== sessionId && settlements) {
      setEditSettlements(prev => ({ ...prev, [sessionId]: settlements.map(t => ({ ...t })) }));
    }
    setExpanded(expanded === sessionId ? null : sessionId);
  }

  async function handleSaveSettlements(sessionId) {
    // Função removida - settlements agora são gerenciados pelo hook MySQL
    alert('Função de edição de settlements será implementada via MySQL');
  }

  // Filtrar histórico para jogos (sessões sem dados de janta)
  const gamesHistory = history.filter(session => {
    return !dinnerHistory.some(dinner => dinner.session_id === session.id);
  });

  // Filtrar histórico para jantas (sessões com dados de janta + jantas independentes)
  const dinnersHistory = [
    // Sessões com dados de janta
    ...history.filter(session => {
      return dinnerHistory.some(dinner => dinner.session_id === session.id);
    }),
    // Jantas independentes (sem sessão de poker)
    ...dinnerHistory
      .filter(dinner => !history.some(session => session.id === dinner.session_id))
      .map(dinner => {
        // Extrair jogadores dos dados salvos da janta
        const playersFromDinner = [];
        if (dinner.players && dinner.players.length > 0) {
          // Usar dados dos jogadores salvos (com nomes)
          dinner.players.forEach(player => {
            const payment = dinner.payments?.[player.id];
            playersFromDinner.push({
              id: player.id,
              name: player.name,
              buyIns: [],
              cashOut: 0,
              dinnerPayment: payment
            });
          });
        } else if (dinner.payments) {
          // Fallback: extrair dos dados de pagamento (sem nomes)
          Object.keys(dinner.payments).forEach(playerId => {
            const payment = dinner.payments[playerId];
            playersFromDinner.push({
              id: playerId,
              name: `Jogador ${playerId}`,
              buyIns: [],
              cashOut: 0,
              dinnerPayment: payment
            });
          });
        }
        
        // Encontrar o nome de quem pagou
        const payerName = playersFromDinner.find(p => p.id === dinner.payer)?.name || dinner.payer;

        return {
          id: dinner.session_id,
          dateISO: dinner.created_at,
          label: 'Janta Independente',
          players: playersFromDinner,
          raw: { snapshot: { players: playersFromDinner } },
          isDinnerOnly: true,
          dinnerData: {
            ...dinner,
            payerName: payerName // Adicionar nome do pagador
          }
        };
      })
  ].sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));

  if(history.length===0) return (<div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow">Nenhuma sessão salva ainda. Volte na aba Sessão e clique em "Salvar sessão".</div>);
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        {/* Abas do histórico */}
        <div className="flex gap-2">
          <button 
            onClick={() => setHistoryTab('jogos')}
            className={`px-4 py-2 rounded-2xl border shadow-sm whitespace-nowrap ${
              historyTab === 'jogos' ? 'bg-slate-900 text-white' : 'bg-white'
            }`}
          >
            🎮 Jogos ({gamesHistory.length})
          </button>
          <button 
            onClick={() => setHistoryTab('jantas')}
            className={`px-4 py-2 rounded-2xl border shadow-sm whitespace-nowrap ${
              historyTab === 'jantas' ? 'bg-slate-900 text-white' : 'bg-white'
            }`}
          >
            🍽️ Jantas ({dinnersHistory.length})
          </button>
        </div>
        
        <button onClick={onReload} className="text-sm rounded-xl border px-3 py-1 bg-white shadow-sm">Recarregar histórico</button>
      </div>

      {/* Conteúdo das abas */}
      {historyTab === 'jogos' && (
        <div className="space-y-3">
          {gamesHistory.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow text-center">
              <p className="text-slate-500">Nenhuma sessão de jogo encontrada.</p>
              <p className="text-sm text-slate-400 mt-2">As sessões de jogo são aquelas sem dados de janta associados.</p>
            </div>
          ) : (
            gamesHistory.map(s=>{
              const totals=summarize(s.players); const date=new Date(s.dateISO); const label=s.label?` — ${s.label}`:"";
              const settlements = s.raw.snapshot?.settlements || [];
              const isOpen = expanded === s.id;
              return (
                <div key={s.id} className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{date.toLocaleDateString()} {date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}{label}</div>
                      <div className="text-sm text-slate-600">{s.players.length} jogador(es) • Buy-ins {formatMoney(totals.totalBuyIn, currencySymbol)} • Cash-out {formatMoney(totals.totalCashOut, currencySymbol)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditModal({type: 'session', data: s})}
                        className="text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button onClick={()=>onDelete(s.id, false)} className="text-rose-600 hover:underline">Excluir</button>
                    </div>
                  </div>
                  <details open={isOpen}>
                    <summary className="cursor-pointer text-slate-700" onClick={e => { e.preventDefault(); handleExpand(s.id, settlements); }}>Ver detalhes</summary>
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-sm">
                        <thead className="text-left text-slate-600"><tr><th className="py-1">Jogador</th><th>Buy-ins</th><th>Total Buy-in</th><th>Cash-out</th><th>Net</th></tr></thead>
                        <tbody>
                          {s.players.map(p=>{ const tb=p.buyIns.reduce((a,b)=>a+b,0); const net=(p.cashOut||0)-tb; return (
                            <tr key={p.id} className="border-t">
                              <td className="py-1">{p.name}</td>
                              <td className="py-1">{p.buyIns.map((b,i)=>(<span key={i} className="mr-1">{formatMoney(b, currencySymbol)}</span>))}</td>
                              <td className="py-1">{formatMoney(tb, currencySymbol)}</td>
                              <td className="py-1">{formatMoney(p.cashOut||0, currencySymbol)}</td>
                              <td className={`py-1 ${net>=0?"text-emerald-600":"text-rose-600"}`}>{formatMoney(net, currencySymbol)}</td>
                            </tr>)})}
                        </tbody>
                      </table>
                    </div>
                    {/* Exibir settlements se existirem */}
                    {isOpen && editSettlements[s.id] && editSettlements[s.id].length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">Transferências (Otimização)</h3>
                        <ul className="space-y-2">
                          {editSettlements[s.id].map((t, i) => (
                            <li key={i} className="rounded-xl bg-slate-50 px-3 py-2 flex items-center gap-2">
                              <span className="font-medium">{t.from}</span> paga para <span className="font-medium">{t.to}</span> {formatMoney(t.amount, currencySymbol)}
                              <label className="flex items-center gap-1 ml-2">
                                <input type="checkbox" checked={!!t.paid} onChange={e=>{
                                  e.stopPropagation();
                                  setEditSettlements(prev => ({
                                    ...prev,
                                    [s.id]: prev[s.id].map((tt, idx) => idx === i ? { ...tt, paid: !tt.paid } : tt)
                                  }));
                                }} />
                                <span className="text-xs">Pago?</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                        <button onClick={()=>handleSaveSettlements(s.id)} className="mt-3 rounded-2xl bg-emerald-600 text-white px-4 py-2 shadow">Salvar alterações</button>
                      </div>
                    )}
                  </details>
                </div>
              );
            })
          )}
        </div>
      )}

      {historyTab === 'jantas' && (
        <div className="space-y-3">
          {dinnersHistory.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow text-center">
              <p className="text-slate-500">Nenhuma sessão de janta encontrada.</p>
              <p className="text-sm text-slate-400 mt-2">As sessões de janta são aquelas com dados de janta associados.</p>
            </div>
          ) : (
            dinnersHistory.map(s=>{
              const totals=summarize(s.players); const date=new Date(s.dateISO); const label=s.label?` — ${s.label}`:"";
              const settlements = s.raw.snapshot?.settlements || [];
              const isOpen = expanded === s.id;
              const dinnerData = s.isDinnerOnly ? s.dinnerData : dinnerHistory.find(d => d.session_id === s.id);
              
              return (
                <div key={s.id} className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{date.toLocaleDateString()} {date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}{label}</div>
                      {s.isDinnerOnly ? (
                        <div className="text-sm text-orange-600">
                          🍽️ Janta Independente: {formatMoney(dinnerData.total_amount, currencySymbol)}
                          {dinnerData.payer && (
                            <span> • Pago por: {dinnerData.payerName || dinnerData.payer}</span>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-slate-600">{s.players.length} jogador(es) • Buy-ins {formatMoney(totals.totalBuyIn, currencySymbol)} • Cash-out {formatMoney(totals.totalCashOut, currencySymbol)}</div>
                          {dinnerData && (
                            <div className="text-sm text-orange-600 mt-1">
                              🍽️ Janta: {formatMoney(dinnerData.total_amount, currencySymbol)} • Pago por: {s.players.find(p => p.id === dinnerData.payer)?.name || 'N/A'}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {s.isDinnerOnly && (
                        <button 
                          onClick={() => setEditModal({type: 'dinner', data: s})}
                          className="text-blue-600 hover:underline"
                        >
                          Editar
                        </button>
                      )}
                      <button onClick={()=>onDelete(s.id, s.isDinnerOnly)} className="text-rose-600 hover:underline">Excluir</button>
                    </div>
                  </div>
                  <details open={isOpen}>
                    <summary className="cursor-pointer text-slate-700" onClick={e => { e.preventDefault(); handleExpand(s.id, settlements); }}>Ver detalhes</summary>
                    <div className="overflow-x-auto mt-2">
                      {s.isDinnerOnly ? (
                        // Exibição específica para jantas independentes
                        <div className="space-y-3">
                          <h4 className="font-semibold text-orange-800">Participantes da Janta</h4>
                          {s.players.length > 0 ? (
                            <div className="space-y-2">
                              {s.players.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium">{p.name}</span>
                                    <span className="text-sm text-gray-600">
                                      {currencySymbol} {p.dinnerPayment?.amount?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${
                                      p.dinnerPayment?.paid ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {p.dinnerPayment?.paid ? '✓ Pago' : '✗ Pendente'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">Nenhum participante registrado</p>
                          )}
                          
                          {/* Dados da janta */}
                          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                            <h3 className="font-semibold mb-2 text-orange-800">🍽️ Dados da Janta</h3>
                            <div className="text-sm space-y-1">
                              <div><strong>Valor total:</strong> {formatMoney(dinnerData.total_amount, currencySymbol)}</div>
                              <div><strong>Pago por:</strong> {dinnerData.payerName || dinnerData.payer || 'N/A'}</div>
                              <div><strong>Tipo de divisão:</strong> {dinnerData.division_type === 'equal' ? 'Divisão igual' : 'Valores personalizados'}</div>
                              {dinnerData.division_type === 'equal' && s.players.length > 0 && (
                                <div><strong>Valor por pessoa:</strong> {formatMoney(dinnerData.total_amount / s.players.length, currencySymbol)}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Exibição normal para sessões com poker
                        <>
                          <table className="w-full text-sm">
                            <thead className="text-left text-slate-600"><tr><th className="py-1">Jogador</th><th>Buy-ins</th><th>Total Buy-in</th><th>Cash-out</th><th>Net</th></tr></thead>
                            <tbody>
                              {s.players.map(p=>{ const tb=p.buyIns.reduce((a,b)=>a+b,0); const net=(p.cashOut||0)-tb; return (
                                <tr key={p.id} className="border-t">
                                  <td className="py-1">{p.name}</td>
                                  <td className="py-1">{p.buyIns.map((b,i)=>(<span key={i} className="mr-1">{formatMoney(b, currencySymbol)}</span>))}</td>
                                  <td className="py-1">{formatMoney(tb, currencySymbol)}</td>
                                  <td className="py-1">{formatMoney(p.cashOut||0, currencySymbol)}</td>
                                  <td className={`py-1 ${net>=0?"text-emerald-600":"text-rose-600"}`}>{formatMoney(net, currencySymbol)}</td>
                                </tr>)})}
                            </tbody>
                          </table>
                          
                          {/* Dados da janta */}
                          {dinnerData && (
                            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                              <h3 className="font-semibold mb-2 text-orange-800">🍽️ Dados da Janta</h3>
                              <div className="text-sm space-y-1">
                                <div><strong>Valor total:</strong> {formatMoney(dinnerData.total_amount, currencySymbol)}</div>
                                <div><strong>Pago por:</strong> {s.players.find(p => p.id === dinnerData.payer)?.name || 'N/A'}</div>
                                <div><strong>Tipo de divisão:</strong> {dinnerData.division_type === 'equal' ? 'Divisão igual' : 'Valores personalizados'}</div>
                                {dinnerData.division_type === 'equal' && (
                                  <div><strong>Valor por pessoa:</strong> {formatMoney(dinnerData.total_amount / s.players.length, currencySymbol)}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Exibir settlements se existirem */}
                    {isOpen && editSettlements[s.id] && editSettlements[s.id].length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">Transferências (Otimização)</h3>
                        <ul className="space-y-2">
                          {editSettlements[s.id].map((t, i) => (
                            <li key={i} className="rounded-xl bg-slate-50 px-3 py-2 flex items-center gap-2">
                              <span className="font-medium">{t.from}</span> paga para <span className="font-medium">{t.to}</span> {formatMoney(t.amount, currencySymbol)}
                              <label className="flex items-center gap-1 ml-2">
                                <input type="checkbox" checked={!!t.paid} onChange={e=>{
                                  e.stopPropagation();
                                  setEditSettlements(prev => ({
                                    ...prev,
                                    [s.id]: prev[s.id].map((tt, idx) => idx === i ? { ...tt, paid: !tt.paid } : tt)
                                  }));
                                }} />
                                <span className="text-xs">Pago?</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                        <button onClick={()=>handleSaveSettlements(s.id)} className="mt-3 rounded-2xl bg-emerald-600 text-white px-4 py-2 shadow">Salvar alterações</button>
                      </div>
                    )}
                  </details>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal de Edição */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Editar {editModal.type === 'dinner' ? 'Janta' : 'Sessão'}
              </h3>
              <button 
                onClick={() => setEditModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {editModal.type === 'dinner' ? (
              <EditDinnerModal 
                dinnerData={editModal.data}
                onSave={(updatedData) => {
                  // Aqui você pode implementar a lógica de salvamento
                  console.log('Salvando janta:', updatedData);
                  setEditModal(null);
                  onReload(); // Recarregar histórico
                }}
                onCancel={() => setEditModal(null)}
              />
            ) : (
              <EditSessionModal 
                sessionData={editModal.data}
                onSave={(updatedData) => {
                  // Aqui você pode implementar a lógica de salvamento
                  console.log('Salvando sessão:', updatedData);
                  setEditModal(null);
                  onReload(); // Recarregar histórico
                }}
                onCancel={() => setEditModal(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RankingPanel({ history, currencySymbol }){
  const stats = buildRanking(history);
  const totalSessions = history.length || 1;
  const rows = Object.values(stats).sort((a,b)=>b.net-a.net);
  const [expand, setExpand] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow overflow-x-auto">
      <h2 className="text-lg font-semibold mb-3">Ranking (Histórico)</h2>
      {rows.length===0 ? (
        <div className="text-slate-500 dark:text-slate-400">Sem dados ainda — salve algumas sessões na aba Histórico.</div>
      ) : (
        <>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-600 dark:text-slate-300">
            <tr>
              <th className="py-2">Jogador</th>
              <th className="py-2">Participações</th>
              {(!isMobile || expand) && <th className="py-2">% do total</th>}
              {(!isMobile || expand) && <th className="py-2">Buy-ins</th>}
              {(!isMobile || expand) && <th className="py-2">Premiações</th>}
              <th className="py-2">Lucro Líquido</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.name} className="border-t dark:border-slate-700">
                <td className="py-2 font-medium">{r.name}</td>
                <td className="py-2">{r.participations}</td>
                {(!isMobile || expand) && <td className="py-2">{((r.participations/totalSessions)*100).toFixed(0)}%</td>}
                {(!isMobile || expand) && <td className="py-2">{formatMoney(r.totalBuyIns, currencySymbol)}</td>}
                {(!isMobile || expand) && <td className="py-2">{formatMoney(r.totalCashOut, currencySymbol)}</td>}
                <td className={`py-2 font-semibold ${r.net>=0?"text-emerald-600 dark:text-emerald-400":"text-rose-600 dark:text-rose-400"}`}>{formatMoney(r.net, currencySymbol)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isMobile && (
          <button onClick={()=>setExpand(e=>!e)} className="mt-2 text-xs underline text-emerald-700 dark:text-emerald-300">
            {expand ? 'Ver menos' : 'Ver mais'}
          </button>
        )}
        </>
      )}
    </div>
  );
}

// Componente do painel de usuários
function UsersPanel({ 
  users, 
  userStats, 
  loadingUsers, 
  isUserAdmin, 
  onApproveUser, 
  onRejectUser, 
  onUpdateUserRole, 
  formatLastSeen, 
  getRoleBadgeColor, 
  getStatusBadgeColor, 
  ROLES 
}) {
  if (!isUserAdmin) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">Acesso Negado</div>
        <p className="text-gray-600">Apenas administradores podem acessar esta área.</p>
      </div>
    );
  }

  if (loadingUsers) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Estatísticas */}
      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{userStats.total}</div>
            <div className="text-sm text-blue-800">Total</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{userStats.approved}</div>
            <div className="text-sm text-green-800">Aprovados</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{userStats.pending}</div>
            <div className="text-sm text-yellow-800">Pendentes</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{userStats.activeToday}</div>
            <div className="text-sm text-purple-800">Ativos Hoje</div>
          </div>
        </div>
      )}

      {/* Lista de usuários */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Usuários Cadastrados</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissão</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Aparição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cadastrado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.is_approved)}`}>
                      {user.is_approved ? 'Aprovado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role === ROLES.ADMIN ? 'Admin' : 
                       user.role === ROLES.EDITOR ? 'Editor' : 'Visualizador'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatLastSeen(user.last_seen)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      {!user.is_approved ? (
                        <>
                          <button
                            onClick={() => onApproveUser(user.email, ROLES.VIEWER)}
                            className="text-green-600 hover:text-green-700 text-xs px-2 py-1 rounded border border-green-300 hover:bg-green-50"
                            title="Aprovar como Visualizador"
                          >
                            ✓ Aprovar
                          </button>
                          <button
                            onClick={() => onApproveUser(user.email, ROLES.EDITOR)}
                            className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
                            title="Aprovar como Editor"
                          >
                            ✓ Editor
                          </button>
                          <button
                            onClick={() => onRejectUser(user.email)}
                            className="text-red-600 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                            title="Rejeitar"
                          >
                            ✕ Rejeitar
                          </button>
                        </>
                      ) : (
                        <div className="flex space-x-1">
                          <select
                            value={user.role}
                            onChange={(e) => onUpdateUserRole(user.email, e.target.value)}
                            className="text-xs px-2 py-1 rounded border border-gray-300 bg-white"
                          >
                            <option value={ROLES.VIEWER}>Visualizador</option>
                            <option value={ROLES.EDITOR}>Editor</option>
                            <option value={ROLES.ADMIN}>Admin</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>

      {/* Informações sobre permissões */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold mb-2">Permissões:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 mr-2">Admin</span>
            <span className="text-gray-600">Acesso total, pode gerenciar usuários</span>
          </div>
          <div>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mr-2">Editor</span>
            <span className="text-gray-600">Pode criar e editar sessões</span>
          </div>
          <div>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mr-2">Visualizador</span>
            <span className="text-gray-600">Apenas visualização</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para gerenciar a janta
function DinnerPanel({ 
  players, 
  dinnerData, 
  onTotalChange, 
  onPayerChange, 
  onDivisionTypeChange, 
  onCustomAmountChange, 
  onPaymentToggle, 
  onSave, 
  onDelete,
  currencySymbol 
}) {
  const amountPerPerson = dinnerData.divisionType === 'equal' 
    ? players.length > 0 ? dinnerData.totalAmount / players.length : 0 
    : 0;

  const totalCustomAmount = Object.values(dinnerData.customAmounts).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🍽️ Controle da Janta</h2>
        
        {/* Informação sobre jantas */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-800">💡 Como usar</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Adicione jogadores na aba "Sessão" primeiro</p>
            <p>• Configure os dados da janta abaixo</p>
            <p>• Salve a janta independentemente</p>
            <p>• Veja e edite jantas salvas na aba "Histórico" → "Jantas"</p>
          </div>
        </div>
        
        {/* Configuração da Janta */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Configuração da Janta</h3>
          
          {/* Valor Total */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Total da Janta
            </label>
            <input
              type="number"
              step="0.01"
              value={dinnerData.totalAmount}
              onChange={(e) => onTotalChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
            />
          </div>

          {/* Quem Pagou */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quem Pagou a Janta
            </label>
            <select
              value={dinnerData.payer}
              onChange={(e) => onPayerChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione quem pagou</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Divisão */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Divisão
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="equal"
                  checked={dinnerData.divisionType === 'equal'}
                  onChange={(e) => onDivisionTypeChange(e.target.value)}
                  className="mr-2"
                />
                Divisão Igual (Churrasco)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="custom"
                  checked={dinnerData.divisionType === 'custom'}
                  onChange={(e) => onDivisionTypeChange(e.target.value)}
                  className="mr-2"
                />
                Valores Personalizados (Xis, etc.)
              </label>
            </div>
          </div>

          {/* Valores Personalizados */}
          {dinnerData.divisionType === 'custom' && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">Valores por Pessoa</h4>
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-2 mb-2">
                  <span className="w-24 text-sm">{player.name}:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={dinnerData.customAmounts[player.id] || 0}
                    onChange={(e) => onCustomAmountChange(player.id, e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="0,00"
                  />
                </div>
              ))}
              <div className="mt-2 text-sm text-gray-600">
                Total personalizado: {currencySymbol} {totalCustomAmount.toFixed(2)}
              </div>
            </div>
          )}

          {/* Resumo */}
          {dinnerData.divisionType === 'equal' && dinnerData.totalAmount > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Divisão Igual:</strong> {currencySymbol} {amountPerPerson.toFixed(2)} por pessoa
              </p>
            </div>
          )}
        </div>

        {/* Lista de Pagamentos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Lista de Pagamentos</h3>
          
          {players.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Adicione jogadores na aba "Sessão" primeiro
            </p>
          ) : (
            <div className="space-y-3">
              {players.map(player => {
                const payment = dinnerData.payments[player.id];
                const amount = dinnerData.divisionType === 'equal' 
                  ? amountPerPerson 
                  : dinnerData.customAmounts[player.id] || 0;
                
                return (
                  <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={payment?.paid || false}
                        onChange={() => onPaymentToggle(player.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {currencySymbol} {amount.toFixed(2)}
                      </span>
                      {payment?.paid && (
                        <span className="text-green-600 text-sm font-medium">✓ Pago</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botões Salvar e Excluir */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir os dados da janta desta sessão?')) {
                  onDelete();
                }
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              🗑️ Excluir do Histórico
            </button>
            
            <button
              onClick={onSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              💾 Salvar Dados da Janta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// helpers
function formatMoney(v, symbol){ return `${symbol} ${v.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`; }
function round2(n){ return Math.round(n*100)/100; }
function summarize(players){ const totalBuyIn=players.reduce((sum,p)=>sum+p.buyIns.reduce((a,b)=>a+b,0),0); const totalCashOut=players.reduce((sum,p)=>sum+(+p.cashOut||0),0); return { totalBuyIn, totalCashOut }; }
function optimizeTransfers(players, recommendations = []){
  console.log('🔍 Iniciando otimização...');
  console.log('👥 Jogadores:', players);
  console.log('📝 Recomendações:', recommendations);
  
  // Calcular saldos líquidos iniciais
  const nets = players.map(p => ({ 
    name: p.name, 
    net: (+p.cashOut || 0) - p.buyIns.reduce((a, b) => a + b, 0) 
  }));
  
  console.log('💰 Saldos iniciais:', nets);
  
  // Aplicar recomendações como restrições (modificar saldos)
  const tempNets = [...nets];
  recommendations.forEach(rec => {
    const payer = tempNets.find(p => p.name === rec.from);
    const receiver = tempNets.find(p => p.name === rec.to);
    if (payer && receiver) {
      console.log(`📝 Aplicando recomendação: ${rec.from} paga ${rec.amount} para ${rec.to}`);
      console.log(`   Antes: ${payer.name}=${payer.net}, ${receiver.name}=${receiver.net}`);
      
      // CORREÇÃO: Aplicar a recomendação corretamente
      // Se o pagador tem saldo negativo, ele paga (reduz a dívida)
      // Se o recebedor tem saldo positivo, ele recebe (aumenta o crédito)
      
      // Pagador: se tem saldo negativo, reduz a dívida (fica menos negativo)
      if (payer.net < 0) {
        payer.net += Number(rec.amount); // Reduz dívida (ex: -20 + 20 = 0)
      } else {
        payer.net -= Number(rec.amount); // Se tem saldo positivo, reduz
      }
      
      // Recebedor: se tem saldo positivo, aumenta o crédito
      if (receiver.net > 0) {
        receiver.net -= Number(rec.amount); // Reduz crédito (ex: 50 - 20 = 30)
      } else {
        receiver.net += Number(rec.amount); // Se tem saldo negativo, reduz dívida
      }
      
      console.log(`   Depois: ${payer.name}=${payer.net}, ${receiver.name}=${receiver.net}`);
    }
  });
  
  console.log('💰 Saldos após recomendações:', tempNets);
  
  // Separar credores e devedores baseado nos saldos modificados
  const creditors = tempNets.filter(n => n.net > 0).map(x => ({ ...x }));
  const debtors = tempNets.filter(n => n.net < 0).map(x => ({ name: x.name, net: -x.net }));
  
  console.log('📊 Credores:', creditors);
  console.log('📊 Devedores:', debtors);
  
  const result = [];
  creditors.sort((a, b) => b.net - a.net);
  debtors.sort((a, b) => b.net - a.net);
  
  // Algoritmo de otimização para os saldos restantes
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i];
    const debt = debtors[j];
    const amt = Math.min(credit.net, debt.net);
    
    if (amt > 0) {
      result.push({ from: debt.name, to: credit.name, amount: round2(amt) });
      console.log(`💸 Transferência otimizada: ${debt.name} → ${credit.name}: ${round2(amt)}`);
    }
    
    credit.net = round2(credit.net - amt);
    debt.net = round2(debt.net - amt);
    
    if (credit.net === 0) i++;
    if (debt.net === 0) j++;
  }
  
  console.log('✅ Resultado final:', result);
  return result;
}
function buildRanking(history){
  const map = {};
  for(const s of history){
    const present=new Set();
    for(const p of s.players){
      if(!map[p.name]) map[p.name]={ name:p.name, participations:0, totalBuyIns:0, totalCashOut:0, net:0 };
      const buy=p.buyIns.reduce((a,b)=>a+b,0); const cash=+p.cashOut||0; const net=cash-buy;
      map[p.name].totalBuyIns+=buy; map[p.name].totalCashOut+=cash; map[p.name].net+=net;
      present.add(p.name);
    }
    present.forEach(nm=>{ map[nm].participations += 1; });
  }
  return map;
}

// DashboardPanel: novo componente para o gráfico
function DashboardPanel({ history, currencySymbol }) {
  // Ranking já existe, vamos usar buildRanking
  const stats = buildRanking(history);
  const rows = Object.values(stats).sort((a,b)=>b.net-a.net);
  const data = {
    labels: rows.map(r => r.name),
    datasets: [
      {
        label: 'Lucro Líquido',
        data: rows.map(r => r.net),
        backgroundColor: rows.map(r => r.net >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `${currencySymbol} ${ctx.parsed.y.toLocaleString(undefined,{minimumFractionDigits:2})}` } }
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: v => `${currencySymbol} ${v}` } }
    }
  };
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow overflow-x-auto max-w-full">
      <h2 className="text-lg font-semibold mb-3">Dashboard — Gráfico de Ranking</h2>
      {rows.length === 0 ? (
        <div className="text-slate-500">Sem dados ainda — salve algumas sessões na aba Histórico.</div>
      ) : (
        <div className="w-full max-w-[600px] mx-auto">
          <Bar data={data} options={options} />
        </div>
      )}
    </div>
  );
}

// Atualizar settlements no banco - função removida
async function updateSettlementPaid(sessionId, idx, paid) {
  // Função removida - settlements agora são gerenciados pelo hook MySQL
  console.log('updateSettlementPaid chamado:', { sessionId, idx, paid });
}
