#!/usr/bin/env node
/**
 * 🔐 GERAR HASH BCRYPT
 * 
 * Execute: node scripts/generate-hash.js
 */

import bcrypt from 'bcryptjs';

const password = process.argv[2] || 'Poker2025!';

console.log('\n🔐 GERANDO HASH BCRYPT\n');
console.log('═'.repeat(60));
console.log('Senha:', password);
console.log('Algoritmo: bcrypt (10 rounds)');
console.log('─'.repeat(60));

const hash = bcrypt.hashSync(password, 10);

console.log('\n✅ Hash gerado com sucesso!\n');
console.log('Hash:');
console.log(hash);
console.log('\n');
console.log('💾 Use este hash na coluna "password_hash" da tabela "users"');
console.log('');
console.log('Validação:');
const isValid = bcrypt.compareSync(password, hash);
console.log(`✅ Senha "${password}" → Hash: ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
console.log('\n');
