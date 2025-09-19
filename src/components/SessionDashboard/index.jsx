import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Checkbox, Card, message } from 'antd';
import { sessionService } from '../../services/sessionService';

export const SessionDashboard = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Colunas da tabela
    const columns = [
        {
            title: 'Jogador',
            dataIndex: 'player_name',
            key: 'player_name',
            width: 150,
            fixed: 'left',
            render: (text) => <span className="font-semibold">{text}</span>
        },
        {
            title: 'Buy-in',
            dataIndex: 'buy_in',
            key: 'buy_in',
            width: 120,
            render: (value, record) => (
                <Input
                    type="number"
                    defaultValue={50}
                    value={value}
                    onChange={(e) => updatePlayer(record.id, 'buy_in', Number(e.target.value))}
                    prefix="R$"
                    className="w-24"
                />
            )
        },
        {
            title: 'Cash Out',
            dataIndex: 'cash_out',
            key: 'cash_out',
            width: 120,
            render: (value, record) => (
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => updatePlayer(record.id, 'cash_out', Number(e.target.value))}
                    prefix="R$"
                    className="w-24"
                />
            )
        },
        {
            title: 'Janta',
            dataIndex: 'dinner_amount',
            key: 'dinner_amount',
            width: 120,
            render: (value, record) => (
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => updatePlayer(record.id, 'dinner_amount', Number(e.target.value))}
                    prefix="R$"
                    className="w-24"
                />
            )
        },
        {
            title: 'Janta Paga?',
            dataIndex: 'dinner_paid',
            key: 'dinner_paid',
            width: 100,
            align: 'center',
            render: (checked, record) => (
                <Checkbox 
                    checked={checked} 
                    onChange={(e) => updatePlayer(record.id, 'dinner_paid', e.target.checked)}
                />
            )
        },
        {
            title: 'Saldo',
            dataIndex: 'balance',
            key: 'balance',
            width: 120,
            fixed: 'right',
            render: (value) => (
                <div className={`font-bold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {value >= 0 ? `+R$ ${value}` : `-R$ ${Math.abs(value)}`}
                </div>
            )
        }
    ];

    // Adicionar novo jogador
    const addPlayer = () => {
        const newPlayer = {
            id: Date.now(),  // ID temporário
            player_name: `Jogador ${players.length + 1}`,
            buy_in: 50,
            cash_out: 0,
            dinner_amount: 0,
            dinner_paid: false
        };
        setPlayers([...players, newPlayer]);
    };

    // Atualizar dados de um jogador
    const updatePlayer = (id, field, value) => {
        setPlayers(players.map(player => {
            if (player.id === id) {
                return { ...player, [field]: value };
            }
            return player;
        }));
    };

    // Dividir janta igualmente
    const splitDinnerEqually = (amount) => {
        if (!amount || players.length === 0) return;
        
        const perPlayer = Number((amount / players.length).toFixed(2));
        setPlayers(players.map(player => ({
            ...player,
            dinner_amount: perPlayer
        })));
    };

    // Salvar sessão
    const saveSession = async () => {
        if (players.length === 0) {
            message.error('Adicione pelo menos um jogador!');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await sessionService.create({ players });
            if (error) throw new Error(error);
            
            message.success('Sessão salva com sucesso!');
        } catch (error) {
            message.error('Erro ao salvar sessão: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button onClick={addPlayer}>
                    Adicionar Jogador
                </Button>
                <div className="space-x-2">
                    <Input
                        type="number"
                        placeholder="Valor total da janta"
                        style={{ width: 200 }}
                        onChange={(e) => splitDinnerEqually(Number(e.target.value))}
                    />
                    <Button 
                        type="primary"
                        onClick={saveSession}
                        loading={loading}
                    >
                        Salvar Sessão
                    </Button>
                </div>
            </div>

            <Card>
                <Table
                    dataSource={players}
                    columns={columns}
                    pagination={false}
                    rowKey="id"
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {players.length > 0 && (
                <Card title="Resumo">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-green-600 mb-2">
                                Recebem
                            </h3>
                            {players
                                .filter(p => (p.cash_out - p.buy_in) > 0)
                                .map(p => (
                                    <div key={p.id} className="flex justify-between p-2 bg-green-50 rounded mb-2">
                                        <span>{p.player_name}</span>
                                        <span className="font-bold">
                                            R$ {(p.cash_out - p.buy_in).toFixed(2)}
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-red-600 mb-2">
                                Pagam
                            </h3>
                            {players
                                .filter(p => (p.cash_out - p.buy_in) < 0 || (!p.dinner_paid && p.dinner_amount > 0))
                                .map(p => (
                                    <div key={p.id} className="flex justify-between p-2 bg-red-50 rounded mb-2">
                                        <div>
                                            <span>{p.player_name}</span>
                                            <div className="text-sm text-gray-500">
                                                {(p.cash_out - p.buy_in) < 0 && 
                                                    `Poker: R$ ${Math.abs(p.cash_out - p.buy_in).toFixed(2)}`
                                                }
                                                {!p.dinner_paid && p.dinner_amount > 0 &&
                                                    ` • Janta: R$ ${p.dinner_amount.toFixed(2)}`
                                                }
                                            </div>
                                        </div>
                                        <span className="font-bold">
                                            R$ {Math.abs((p.cash_out - p.buy_in) - 
                                                (!p.dinner_paid ? p.dinner_amount : 0)).toFixed(2)}
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};
