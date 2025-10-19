// import mysql from 'mysql2/promise';
// import { supabaseServer } from '../lib/supabaseServer';

// const MYSQL_CONFIG = {
//   host: process.env.DB_HOST || 'localhost',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'poker_db',
//   charset: 'utf8mb4',
// };

// const BATCH_SIZE = 100;

// interface MigrationStats {
//   table: string;
//   total: number;
//   migrated: number;
//   failed: number;
//   errors: string[];
// }

// const createMigrationLogger = () => {
//   const stats: MigrationStats[] = [];

//   return {
//     logStart: (table: string, total: number) => {
//       stats.push({ table, total, migrated: 0, failed: 0, errors: [] });
//       console.log(`\n📦 Migrating ${table}: ${total} records`);
//     },
//     logSuccess: (table: string) => {
//       const stat = stats.find(s => s.table === table);
//       if (stat) stat.migrated++;
//     },
//     logError: (table: string, error: string) => {
//       const stat = stats.find(s => s.table === table);
//       if (stat) {
//         stat.failed++;
//         stat.errors.push(error);
//       }
//     },
//     logComplete: (table: string) => {
//       const stat = stats.find(s => s.table === table);
//       if (stat) {
//         console.log(`✅ ${table}: ${stat.migrated}/${stat.total} migrated, ${stat.failed} failed`);
//       }
//     },
//     getSummary: () => stats,
//     printSummary: () => {
//       console.log('\n' + '='.repeat(60));
//       console.log('📊 MIGRATION SUMMARY');
//       console.log('='.repeat(60));
//       stats.forEach(stat => {
//         const successRate = ((stat.migrated / stat.total) * 100).toFixed(2);
//         console.log(`\n${stat.table}:`);
//         console.log(`  Total: ${stat.total}`);
//         console.log(`  Migrated: ${stat.migrated} (${successRate}%)`);
//         console.log(`  Failed: ${stat.failed}`);
//         if (stat.errors.length > 0) {
//           console.log(`  First error: ${stat.errors[0]}`);
//         }
//       });
//       console.log('\n' + '='.repeat(60));
//     },
//   };
// };

// const migrateTenants = async (mysqlConnection: mysql.Connection, logger: ReturnType<typeof createMigrationLogger>) => {
//   const [rows] = await mysqlConnection.execute('SELECT * FROM tenants');
//   const tenants = rows as any[];

//   logger.logStart('tenants', tenants.length);

//   for (const tenant of tenants) {
//     try {
//       const { error } = await supabaseServer
//         .from('tenants')
//         .insert({
//           id: tenant.id,
//           name: tenant.name,
//           email: tenant.email,
//           phone: tenant.phone,
//           plan: tenant.plan,
//           status: tenant.status,
//           max_users: tenant.max_users,
//           max_sessions_per_month: tenant.max_sessions_per_month,
//           created_at: tenant.created_at,
//           updated_at: tenant.updated_at,
//           approved_at: tenant.approved_at,
//           suspended_at: tenant.suspended_at,
//         });

//       if (error) throw error;
//       logger.logSuccess('tenants');
//     } catch (migrationError) {
//       logger.logError('tenants', `Tenant ${tenant.id}: ${migrationError}`);
//     }
//   }

//   logger.logComplete('tenants');
//   return tenants;
// };

// const migrateUsers = async (mysqlConnection: mysql.Connection, logger: ReturnType<typeof createMigrationLogger>) => {
//   const [rows] = await mysqlConnection.execute('SELECT * FROM users');
//   const users = rows as any[];

//   logger.logStart('users', users.length);

//   for (const user of users) {
//     try {
//       const { error } = await supabaseServer
//         .from('users')
//         .insert({
//           id: user.id,
//           tenant_id: user.tenant_id,
//           name: user.name,
//           email: user.email,
//           password_hash: user.password_hash,
//           role: user.role,
//           is_active: Boolean(user.is_active),
//           last_login: user.last_login,
//           created_at: user.created_at,
//           updated_at: user.updated_at,
//           player_id: user.player_id,
//         });

//       if (error) throw error;
//       logger.logSuccess('users');
//     } catch (migrationError) {
//       logger.logError('users', `User ${user.id}: ${migrationError}`);
//     }
//   }

//   logger.logComplete('users');
// };

// const migratePlayers = async (mysqlConnection: mysql.Connection, logger: ReturnType<typeof createMigrationLogger>) => {
//   const [rows] = await mysqlConnection.execute('SELECT * FROM players');
//   const players = rows as any[];

//   logger.logStart('players', players.length);

//   for (const player of players) {
//     try {
//       const { error } = await supabaseServer
//         .from('players')
//         .insert({
//           id: player.id,
//           tenant_id: player.tenant_id,
//           name: player.name,
//           nickname: player.nickname,
//           phone: player.phone,
//           notes: player.notes,
//           is_active: Boolean(player.is_active),
//           created_at: player.created_at,
//           updated_at: player.updated_at,
//           user_id: player.user_id,
//           total_sessions: player.total_sessions,
//           total_buyin: player.total_buyin,
//           total_cashout: player.total_cashout,
//           total_profit: player.total_profit,
//           win_rate: player.win_rate,
//           avg_session_time: player.avg_session_time,
//           best_session: player.best_session,
//           worst_session: player.worst_session,
//           last_played: player.last_played,
//         });

//       if (error) throw error;
//       logger.logSuccess('players');
//     } catch (migrationError) {
//       logger.logError('players', `Player ${player.id}: ${migrationError}`);
//     }
//   }

//   logger.logComplete('players');
// };

// const migrateSessions = async (mysqlConnection: mysql.Connection, logger: ReturnType<typeof createMigrationLogger>) => {
//   const [rows] = await mysqlConnection.execute('SELECT * FROM sessions');
//   const sessions = rows as any[];

//   logger.logStart('sessions', sessions.length);

//   for (const session of sessions) {
//     try {
//       const playersData = typeof session.players_data === 'string'
//         ? JSON.parse(session.players_data)
//         : session.players_data;

//       const recommendations = typeof session.recommendations === 'string'
//         ? JSON.parse(session.recommendations || 'null')
//         : session.recommendations;

//       const paidTransfers = typeof session.paid_transfers === 'string'
//         ? JSON.parse(session.paid_transfers || 'null')
//         : session.paid_transfers;

//       const { error } = await supabaseServer
//         .from('sessions')
//         .insert({
//           id: session.id,
//           tenant_id: session.tenant_id,
//           date: session.date,
//           location: session.location,
//           status: session.status,
//           created_by: session.created_by,
//           created_at: session.created_at,
//           updated_at: session.updated_at,
//           approved_at: session.approved_at,
//           closed_at: session.closed_at,
//           players_data: playersData,
//           recommendations: recommendations,
//           paid_transfers: paidTransfers,
//           session_fee: session.session_fee,
//           janta_fee: session.janta_fee,
//           rake_percentage: session.rake_percentage,
//           total_buyin: session.total_buyin,
//           total_cashout: session.total_cashout,
//           total_profit: session.total_profit,
//           players_count: session.players_count,
//         });

//       if (error) throw error;
//       logger.logSuccess('sessions');
//     } catch (migrationError) {
//       logger.logError('sessions', `Session ${session.id}: ${migrationError}`);
//     }
//   }

//   logger.logComplete('sessions');
// };

// const migrateUserInvites = async (mysqlConnection: mysql.Connection, logger: ReturnType<typeof createMigrationLogger>) => {
//   const [rows] = await mysqlConnection.execute('SELECT * FROM user_invites');
//   const invites = rows as any[];

//   logger.logStart('user_invites', invites.length);

//   for (const invite of invites) {
//     try {
//       const { error } = await supabaseServer
//         .from('user_invites')
//         .insert({
//           id: invite.id,
//           tenant_id: invite.tenant_id,
//           invited_by_user_id: invite.invited_by_user_id,
//           email: invite.email,
//           name: invite.name,
//           role: invite.role,
//           invite_token: invite.invite_token,
//           status: invite.status,
//           expires_at: invite.expires_at,
//           accepted_at: invite.accepted_at,
//           created_at: invite.created_at,
//           updated_at: invite.updated_at,
//           player_id: invite.player_id,
//         });

//       if (error) throw error;
//       logger.logSuccess('user_invites');
//     } catch (migrationError) {
//       logger.logError('user_invites', `Invite ${invite.id}: ${migrationError}`);
//     }
//   }

//   logger.logComplete('user_invites');
// };

// const migrateAuditLogs = async (mysqlConnection: mysql.Connection, logger: ReturnType<typeof createMigrationLogger>) => {
//   const [rows] = await mysqlConnection.execute('SELECT * FROM audit_logs ORDER BY id');
//   const logs = rows as any[];

//   logger.logStart('audit_logs', logs.length);

//   for (let i = 0; i < logs.length; i += BATCH_SIZE) {
//     const batch = logs.slice(i, i + BATCH_SIZE);

//     try {
//       const logRecords = batch.map(log => ({
//         id: log.id,
//         tenant_id: log.tenant_id,
//         user_id: log.user_id,
//         action: log.action,
//         table_name: log.table_name,
//         record_id: log.record_id,
//         old_data: typeof log.old_data === 'string' ? JSON.parse(log.old_data || 'null') : log.old_data,
//         new_data: typeof log.new_data === 'string' ? JSON.parse(log.new_data || 'null') : log.new_data,
//         ip_address: log.ip_address,
//         user_agent: log.user_agent,
//         created_at: log.created_at,
//       }));

//       const { error } = await supabaseServer
//         .from('audit_logs')
//         .insert(logRecords);

//       if (error) throw error;

//       batch.forEach(() => logger.logSuccess('audit_logs'));
//     } catch (migrationError) {
//       batch.forEach(() => logger.logError('audit_logs', `Batch error: ${migrationError}`));
//     }
//   }

//   logger.logComplete('audit_logs');
// };

// const migratePlayerTransfers = async (mysqlConnection: mysql.Connection, logger: ReturnType<typeof createMigrationLogger>) => {
//   const [rows] = await mysqlConnection.execute('SELECT * FROM player_transfers');
//   const transfers = rows as any[];

//   logger.logStart('player_transfers', transfers.length);

//   for (const transfer of transfers) {
//     try {
//       const { error } = await supabaseServer
//         .from('player_transfers')
//         .insert({
//           id: transfer.id,
//           session_id: transfer.session_id,
//           tenant_id: transfer.tenant_id,
//           from_player_id: transfer.from_player_id,
//           to_player_id: transfer.to_player_id,
//           from_player_name: transfer.from_player_name,
//           to_player_name: transfer.to_player_name,
//           amount: transfer.amount,
//           type: transfer.type,
//           status: transfer.status,
//           notes: transfer.notes,
//           completed_at: transfer.completed_at,
//           created_at: transfer.created_at,
//           updated_at: transfer.updated_at,
//         });

//       if (error) throw error;
//       logger.logSuccess('player_transfers');
//     } catch (migrationError) {
//       logger.logError('player_transfers', `Transfer ${transfer.id}: ${migrationError}`);
//     }
//   }

//   logger.logComplete('player_transfers');
// };

// const resetSequences = async (logger: ReturnType<typeof createMigrationLogger>) => {
//   console.log('\n🔄 Resetting PostgreSQL sequences...');

//   const tables = [
//     'tenants',
//     'users',
//     'players',
//     'sessions',
//     'user_invites',
//     'audit_logs',
//     'player_transfers',
//   ];

//   for (const table of tables) {
//     try {
//       const { data } = await supabaseServer
//         .from(table)
//         .select('id')
//         .order('id', { ascending: false })
//         .limit(1)
//         .single();

//       if (data && data.id) {
//         const sequenceName = `${table}_id_seq`;
//         const { error } = await supabaseServer.rpc('setval', {
//           sequence_name: sequenceName,
//           new_value: data.id,
//         });

//         if (error) {
//           console.log(`⚠️  Sequence ${sequenceName} might need manual reset`);
//         } else {
//           console.log(`✅ Reset ${sequenceName} to ${data.id}`);
//         }
//       }
//     } catch (sequenceError) {
//       console.log(`⚠️  Could not reset sequence for ${table}`);
//     }
//   }
// };

// const runMigration = async () => {
//   console.log('🚀 Starting data migration from MySQL to Supabase PostgreSQL\n');
//   console.log('MySQL Config:', {
//     host: MYSQL_CONFIG.host,
//     database: MYSQL_CONFIG.database,
//     user: MYSQL_CONFIG.user,
//   });

//   if (!MYSQL_CONFIG.password || MYSQL_CONFIG.password.trim() === '') {
//     console.warn('⚠️  WARNING: DB_PASSWORD is empty or not set!');
//     console.warn('⚠️  If your MySQL database requires authentication, the connection will fail.');
//     console.warn('⚠️  Set DB_PASSWORD in your .env.local file before running migration.\n');
//   }

//   const logger = createMigrationLogger();
//   let mysqlConnection: mysql.Connection | null = null;

//   try {
//     console.log('\n📡 Connecting to MySQL...');
//     mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
//     console.log('✅ MySQL connected\n');

//     await migrateTenants(mysqlConnection, logger);
//     await migrateUsers(mysqlConnection, logger);
//     await migratePlayers(mysqlConnection, logger);
//     await migrateSessions(mysqlConnection, logger);
//     await migrateUserInvites(mysqlConnection, logger);
//     await migrateAuditLogs(mysqlConnection, logger);
//     await migratePlayerTransfers(mysqlConnection, logger);

//     await resetSequences(logger);

//     logger.printSummary();

//     console.log('\n✅ Migration completed successfully!');
//   } catch (mainError) {
//     console.error('\n❌ Migration failed:', mainError);
//     throw mainError;
//   } finally {
//     if (mysqlConnection) {
//       await mysqlConnection.end();
//       console.log('\n📡 MySQL connection closed');
//     }
//   }
// };

// if (require.main === module) {
//   runMigration()
//     .then(() => {
//       console.log('\n🎉 All done!');
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('\n💥 Fatal error:', error);
//       process.exit(1);
//     });
// }

// export { runMigration };
