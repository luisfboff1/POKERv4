-- RESTORE SESSIONS FROM BACKUP
-- Execute este script no Supabase SQL Editor
-- https://supabase.com/dashboard/project/jhodhxvvhohygijqcxbo/sql/new

-- Restore Session #4 (2025-10-21)
INSERT INTO poker.sessions (
  id, tenant_id, date, location, status, created_by, created_at, updated_at, 
  approved_at, closed_at, players_data, recommendations, paid_transfers, 
  session_fee, janta_fee, rake_percentage, total_buyin, total_cashout, total_profit, players_count
) VALUES (
  4,
  1,
  '2025-10-21',
  'casa',
  'closed',
  1,
  '2025-10-22 12:30:17.877626+00',
  '2025-10-24 00:19:44.349708+00',
  NULL,
  NULL,
  '[{"id": "10", "name": "jean", "buyin": 50, "balance": -50, "cashout": 0, "janta_paid": true, "session_paid": false}, {"id": "13", "name": "cristian", "buyin": 100, "balance": 101.5, "cashout": 201.5, "janta_paid": true, "session_paid": false}, {"id": "14", "name": "debona", "buyin": 50, "balance": 180.5, "cashout": 230.5, "janta_paid": true, "session_paid": false}, {"id": "9", "name": "folle", "buyin": 150, "balance": -150, "cashout": 0, "janta_paid": true, "session_paid": false}, {"id": "12", "name": "fernando", "buyin": 100, "balance": -54, "cashout": 46, "janta_paid": true, "session_paid": false}, {"id": "11", "name": "charles", "buyin": 50, "balance": 57.5, "cashout": 107.5, "janta_paid": true, "session_paid": false}, {"id": "8", "name": "luiggi", "buyin": 200, "balance": -135, "cashout": 65, "janta_paid": true, "session_paid": false}, {"id": "1", "name": "luis", "buyin": 50, "balance": 33.5, "cashout": 83.5, "janta_paid": true, "session_paid": false}, {"id": "7", "name": "maschio", "buyin": 50, "balance": 16, "cashout": 66, "janta_paid": true, "session_paid": false}]'::jsonb,
  '[{"to": "debona", "from": "folle", "amount": 150}, {"to": "debona", "from": "luiggi", "amount": 30.5}, {"to": "cristian", "from": "luiggi", "amount": 101.5}, {"to": "charles", "from": "luiggi", "amount": 3}, {"to": "charles", "from": "fernando", "amount": 54}, {"to": "charles", "from": "jean", "amount": 0.5}, {"to": "luis", "from": "jean", "amount": 33.5}, {"to": "maschio", "from": "jean", "amount": 16}]'::jsonb,
  '{"jean_luis": true, "folle_debona": true, "jean_charles": true, "jean_maschio": true, "luiggi_debona": true, "luiggi_charles": true, "luiggi_cristian": true, "fernando_charles": true}'::jsonb,
  0.00,
  0.00,
  0.00,
  0.00,
  0.00,
  0.00,
  0
) ON CONFLICT (id) DO NOTHING;

-- Restore Session #5 (2025-09-17)
INSERT INTO poker.sessions (
  id, tenant_id, date, location, status, created_by, created_at, updated_at, 
  approved_at, closed_at, players_data, recommendations, paid_transfers, 
  session_fee, janta_fee, rake_percentage, total_buyin, total_cashout, total_profit, players_count
) VALUES (
  5,
  1,
  '2025-09-17',
  'casa',
  'approved',
  1,
  '2025-10-24 00:18:53.498683+00',
  '2025-10-24 00:19:06.705777+00',
  NULL,
  NULL,
  '[{"id": "13", "name": "cristian", "buyin": 50, "balance": 67.5, "cashout": 117.5, "janta_paid": false, "session_paid": false}, {"id": "12", "name": "fernando", "buyin": 100, "balance": -82.5, "cashout": 17.5, "janta_paid": false, "session_paid": false}, {"id": "1", "name": "luis", "buyin": 50, "balance": 179, "cashout": 229, "janta_paid": false, "session_paid": false}, {"id": "8", "name": "luiggi", "buyin": 100, "balance": -50, "cashout": 50, "janta_paid": false, "session_paid": false}, {"id": "14", "name": "debona", "buyin": 100, "balance": -100, "cashout": 0, "janta_paid": false, "session_paid": false}, {"id": "15", "name": "Brugger", "buyin": 50, "balance": -50, "cashout": 0, "janta_paid": false, "session_paid": false}, {"id": "16", "name": "Baiano", "buyin": 50, "balance": 65, "cashout": 115, "janta_paid": false, "session_paid": false}, {"id": "17", "name": "Giba", "buyin": 50, "balance": 71, "cashout": 121, "janta_paid": false, "session_paid": false}, {"id": "18", "name": "Vitinho", "buyin": 100, "balance": -100, "cashout": 0, "janta_paid": false, "session_paid": false}]'::jsonb,
  '[{"to": "luis", "from": "debona", "amount": 100}, {"to": "luis", "from": "Vitinho", "amount": 79}, {"to": "Giba", "from": "Vitinho", "amount": 21}, {"to": "Giba", "from": "fernando", "amount": 50}, {"to": "cristian", "from": "fernando", "amount": 32.5}, {"to": "cristian", "from": "luiggi", "amount": 35}, {"to": "Baiano", "from": "luiggi", "amount": 15}, {"to": "Baiano", "from": "Brugger", "amount": 50}]'::jsonb,
  '{"debona_luis": true, "Vitinho_Giba": true, "Vitinho_luis": true, "fernando_Giba": true, "luiggi_Baiano": true, "Brugger_Baiano": true, "luiggi_cristian": true, "fernando_cristian": true}'::jsonb,
  0.00,
  0.00,
  0.00,
  0.00,
  0.00,
  0.00,
  0
) ON CONFLICT (id) DO NOTHING;

-- Update sequence
SELECT setval('poker.sessions_id_seq', 5, true);

-- Verify
SELECT 
  id,
  date,
  location,
  status,
  jsonb_array_length(players_data) as players_count,
  jsonb_array_length(recommendations) as transfers_count
FROM poker.sessions
ORDER BY date DESC;
