import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from './supabaseClient';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const currencySymbols = { BRL: "R$", USD: "$", EUR: "€" };
const uid = () =>
  (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  React.useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState];
}

function Auth({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else onAuth();
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else onAuth();
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 320, margin: 'auto', padding: 16 }}>
      <h2>Entrar ou Cadastrar</h2>
      <form>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', marginBottom: 8 }}>
          Entrar
        </button>
        <button onClick={handleSignUp} disabled={loading} style={{ width: '100%' }}>
          Cadastrar
        </button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (!user) {
    return <Auth onAuth={() => window.location.reload()} />;
  }

  return <PokerSettlementsApp user={user} />;
}

export default App;

function PokerSettlementsApp({ user }) {
  const [players, setPlayers] = useLocalStorage("poker_players_v1", []);
  const [name, setName] = useState("");
  const nameInputRef = useRef(null);
  const [currency, setCurrency] = useLocalStorage("poker_currency", "BRL");
  const [tab, setTab] = useLocalStorage("poker_active_tab", "sessao");
  const [note, setNote] = useState("");
  const [sessionSettlements, setSessionSettlements] = useState([]);
  // Novo: recomendações de pagamento
  const [recommendedPayments, setRecommendedPayments] = useState([]);
  const [recFrom, setRecFrom] = useState("");
  const [recTo, setRecTo] = useState("");
  const [recAmount, setRecAmount] = useState("");

  // Atualiza settlements sempre que players ou recommendedPayments mudar, mas só na aba sessão
  useEffect(() => {
    if (tab === "sessao") {
      // Remove recomendações inválidas (ex: jogadores removidos)
      const validRecs = recommendedPayments.filter(r => players.find(p => p.name === r.from) && players.find(p => p.name === r.to));
      // Calcula o saldo de cada jogador considerando as recomendações
      let tempPlayers = players.map(p => ({ ...p }));
      validRecs.forEach(r => {
        const payer = tempPlayers.find(p => p.name === r.from);
        const receiver = tempPlayers.find(p => p.name === r.to);
        if (payer && receiver) {
          payer.cashOut -= Number(r.amount);
          receiver.cashOut += Number(r.amount);
        }
      });
      // Otimiza o restante
      const optimized = optimizeTransfers(tempPlayers).map(t => ({ ...t, paid: false }));
      // Junta recomendações (fixas) + otimizadas
      setSessionSettlements([
        ...validRecs.map(r => ({ from: r.from, to: r.to, amount: Number(r.amount), paid: false, recommended: true })),
        ...optimized
      ]);
    }
  }, [players, tab, recommendedPayments]);

  // Histórico via Supabase
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Carregar sessões do Supabase
  const reloadHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      alert('Erro ao carregar histórico: ' + error.message);
      setHistory([]);
    } else {
      setHistory(data.map(s => ({
        id: s.id,
        dateISO: s.date_iso,
        label: s.label,
        players: s.snapshot?.players || [],
        raw: s
      })));
    }
    setLoadingHistory(false);
  };
  useEffect(() => { reloadHistory(); }, [user.id]);

  // Sincronização em tempo real com Supabase
  useEffect(() => {
    const channel = supabase
      .channel('sessions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        reloadHistory();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

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

  // Salvar sessão no Supabase
  async function saveCurrentSession(){
    if(players.length===0){ alert("Adicione jogadores antes de salvar."); return; }
    const snapshot = {
      id: uid(),
      dateISO: new Date().toISOString(),
      label: note.trim() || undefined,
      players: players.map(p => ({ id: uid(), name: p.name, buyIns: [...p.buyIns], cashOut: +p.cashOut || 0 })),
      settlements: sessionSettlements // salva settlements com status atual
    };
    try {
      const { error } = await supabase.from('sessions').insert({
        user_id: user.id,
        date_iso: snapshot.dateISO,
        label: snapshot.label,
        snapshot: { players: snapshot.players, settlements: snapshot.settlements }
      });
      if (error) throw error;
      setNote("");
      setTab("historico");
      alert("Sessão salva!");
      reloadHistory();
    } catch (e) {
      alert(`Falha ao salvar a sessão.\n${e?.message || e}`);
    }
  }

  // Excluir sessão do Supabase
  async function deleteSession(id){
    const prevBackup = history;
    setHistory(h => h.filter(s => s.id !== id));
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', id);
      if (error) throw error;
      reloadHistory();
    } catch (e) {
      alert("Falha ao remover. Restaurando lista.");
      setHistory(prevBackup);
    }
  }

  const totals = useMemo(()=>summarize(players),[players]);
  const settlements = useMemo(()=>optimizeTransfers(players),[players]);

  // Formulário de recomendação de pagamento
  function handleAddRecommendation(e) {
    e.preventDefault();
    if (!recFrom || !recTo || !recAmount || recFrom === recTo || !players.find(p => p.name === recFrom) || !players.find(p => p.name === recTo)) return;
    setRecommendedPayments(prev => [...prev, { from: recFrom, to: recTo, amount: Number(recAmount) }]);
    setRecFrom(""); setRecTo(""); setRecAmount("");
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
              Persistência: Supabase
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
          {[{id:"sessao",label:"Sessão"},{id:"historico",label:"Histórico"},{id:"ranking",label:"Ranking"},{id:"dashboard",label:"Dashboard"}].map(t=>(
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
                  <div className="font-semibold mb-1">Pagamentos recomendados:</div>
                  <ul className="space-y-1">
                    {recommendedPayments.map((r,i)=>(
                      <li key={i}>{r.from} → {r.to}: {formatMoney(Number(r.amount), currencySymbols[currency])}</li>
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
              />
            </div>
          </section>
        )}

        {tab==="historico" && (
          loadingHistory ? <div>Carregando histórico...</div> :
          <HistoryPanel history={history} currencySymbol={currencySymbols[currency]} onDelete={deleteSession} onReload={reloadHistory} />
        )}

        {tab==="ranking" && (<RankingPanel history={history} currencySymbol={currencySymbols[currency]} />)}
        {tab==="dashboard" && (
          <DashboardPanel history={history} currencySymbol={currencySymbols[currency]} />
        )}
      </div>
    </div>
  );
}

function PlayersEditor({
  players, onAddPlayer, onRemovePlayer, onAddBuyIn, onRemoveBuyIn, onSetCashOut,
  name, setName, nameInputRef, currencySymbol
}){
  // Detecta se está em mobile
  const isMobile = window.innerWidth < 640;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow">
        <h2 className="text-lg font-semibold mb-3">Jogadores</h2>
        <div className="flex gap-2">
          <input
            ref={nameInputRef}
            placeholder="Nome do jogador"
            className="flex-1 rounded-xl border px-3 py-2"
            value={name}
            onChange={e=>setName(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&onAddPlayer()}
          />
          <button onClick={onAddPlayer} className="rounded-2xl bg-slate-900 text-white px-4 py-2 shadow whitespace-nowrap">
            Adicionar
          </button>
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

function OptimizerPanel({ settlements, currencySymbol, sessionId, onTogglePaid }){
  const totalTransfers=settlements.length; const totalVolume=settlements.reduce((a,t)=>a+t.amount,0);
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow space-y-3">
      <h2 className="text-lg font-semibold">Otimização de Transferências</h2>
      {totalTransfers===0 ? (<div className="text-slate-500">Nada a liquidar.</div>) : (<>
        <div className="text-sm text-slate-600">Sugestão com número mínimo de transferências (≤ N-1):</div>
        <ul className="space-y-2">
          {settlements.map((t,i)=>(
            <li key={i} className={`rounded-xl bg-slate-50 px-3 py-2 flex items-center gap-2 ${t.recommended ? 'border-2 border-emerald-400' : ''}`}>
              <span className="font-medium">{t.from}</span> paga para <span className="font-medium">{t.to}</span> {formatMoney(t.amount, currencySymbol)}
              {t.recommended && <span className="text-xs text-emerald-700 ml-2">(Recomendado)</span>}
              {typeof t.paid !== 'undefined' && (
                <label className="flex items-center gap-1 ml-2">
                  <input type="checkbox" checked={!!t.paid} onChange={()=>onTogglePaid && onTogglePaid(i, !t.paid)} />
                  <span className="text-xs">Pago?</span>
                </label>
              )}
            </li>
          ))}
        </ul>
        <div className="text-sm text-slate-600 pt-2">{totalTransfers} transferência(s), volume total {formatMoney(totalVolume, currencySymbol)}</div>
      </>)}
    </div>
  );
}

function ImportExport({ players, setPlayers }){
  function exportJSON(){ const blob=new Blob([JSON.stringify(players,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`poker-session-${new Date().toISOString().slice(0,19)}.json`; a.click(); URL.revokeObjectURL(url); }
  function importJSON(ev){ const file=ev.target.files?.[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(String(reader.result)); if(Array.isArray(data)) setPlayers(data); } catch { alert('Arquivo inválido') } }; reader.readAsText(file); }
  return (<div className="flex items-center gap-2"><button onClick={exportJSON} className="rounded-2xl bg-slate-900 text-white px-4 py-2 shadow">Exportar JSON</button><label className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 bg-white shadow-sm cursor-pointer"><input type="file" accept="application/json" className="hidden" onChange={importJSON} />Importar JSON</label></div>);
}

function HistoryPanel({ history, currencySymbol, onDelete, onReload }){
  const [expanded, setExpanded] = useState(null); // id da sessão expandida
  const [editSettlements, setEditSettlements] = useState({}); // { [sessionId]: settlements[] }

  // Atualiza settlements editáveis ao expandir uma sessão
  function handleExpand(sessionId, settlements) {
    if (expanded !== sessionId && settlements) {
      setEditSettlements(prev => ({ ...prev, [sessionId]: settlements.map(t => ({ ...t })) }));
    }
    setExpanded(expanded === sessionId ? null : sessionId);
  }

  async function handleSaveSettlements(sessionId) {
    const settlements = editSettlements[sessionId];
    // Buscar snapshot atual
    const { data, error } = await supabase.from('sessions').select('snapshot').eq('id', sessionId).single();
    if (error) { alert('Erro ao buscar sessão: ' + error.message); return; }
    const snapshot = data.snapshot;
    snapshot.settlements = settlements;
    // Atualizar no banco
    const { error: upError } = await supabase.from('sessions').update({ snapshot }).eq('id', sessionId);
    if (upError) { alert('Erro ao atualizar pagamentos: ' + upError.message); return; }
    onReload && onReload();
    alert('Alterações salvas!');
  }

  if(history.length===0) return (<div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow">Nenhuma sessão salva ainda. Volte na aba Sessão e clique em "Salvar sessão".</div>);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={onReload} className="text-sm rounded-xl border px-3 py-1 bg-white shadow-sm">Recarregar histórico</button>
      </div>
      {history.map(s=>{
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
              <button onClick={()=>onDelete(s.id)} className="text-rose-600 hover:underline">Excluir</button>
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
              {/* NOVO: Exibir settlements se existirem */}
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
      })}
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

// helpers
function formatMoney(v, symbol){ return `${symbol} ${v.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`; }
function round2(n){ return Math.round(n*100)/100; }
function summarize(players){ const totalBuyIn=players.reduce((sum,p)=>sum+p.buyIns.reduce((a,b)=>a+b,0),0); const totalCashOut=players.reduce((sum,p)=>sum+(+p.cashOut||0),0); return { totalBuyIn, totalCashOut }; }
function optimizeTransfers(players){
  const nets=players.map(p=>({ name:p.name, net:(+p.cashOut||0)-p.buyIns.reduce((a,b)=>a+b,0) }));
  const creditors=nets.filter(n=>n.net>0).map(x=>({...x})); const debtors=nets.filter(n=>n.net<0).map(x=>({name:x.name, net:-x.net}));
  const result=[]; creditors.sort((a,b)=>b.net-a.net); debtors.sort((a,b)=>b.net-a.net);
  let i=0,j=0; while(i<creditors.length && j<debtors.length){ const credit=creditors[i], debt=debtors[j]; const amt=Math.min(credit.net, debt.net);
    if(amt>0) result.push({ from:debt.name, to:credit.name, amount:round2(amt) });
    credit.net=round2(credit.net-amt); debt.net=round2(debt.net-amt);
    if(credit.net===0) i++; if(debt.net===0) j++;
  } return result;
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

// Atualizar settlements no banco
async function updateSettlementPaid(sessionId, idx, paid) {
  // Buscar sessão atual
  const { data, error } = await supabase.from('sessions').select('snapshot').eq('id', sessionId).single();
  if (error) { alert('Erro ao buscar sessão: ' + error.message); return; }
  const snapshot = data.snapshot;
  if (!snapshot.settlements) return;
  snapshot.settlements[idx].paid = paid;
  // Atualizar no banco
  const { error: upError } = await supabase.from('sessions').update({ snapshot }).eq('id', sessionId);
  if (upError) { alert('Erro ao atualizar pagamento: ' + upError.message); }
  // Recarregar histórico após update
  if (typeof window.reloadHistory === 'function') window.reloadHistory();
}
