#!/usr/bin/env node
/**
 * 🚀 Build Script Unificado - Poker System
 * 
 * Funciona identicamente em:
 * - Desenvolvimento local
 * - GitHub Actions  
 * - Hostinger
 * 
 * Lógica:
 * 1. Detectar ambiente (local vs CI/CD)
 * 2. Carregar variáveis (.env.local ou process.env)
 * 3. Criar estrutura dist/
 * 4. Gerar arquivos de configuração
 * 5. Copiar APIs e assets
 * 6. Executar Next.js build
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const apiDir = join(rootDir, 'api');
const distApiDir = join(distDir, 'api');

console.log('🚀 Iniciando build unificado...');

/**
 * Detectar ambiente de execução
 */
function detectEnvironment() {
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const isLocal = !isCI;
  
  console.log(`📍 Ambiente detectado: ${isCI ? 'CI/CD (GitHub Actions)' : 'Local'}`);
  return { isCI, isLocal };
}

/**
 * Carregar variáveis de ambiente
 */
function loadEnvironmentVariables(isLocal) {
  const envVars = {};
  
  if (isLocal) {
    // Local: carregar do .env.local
    const envLocalPath = join(rootDir, '.env.local');
    
    if (existsSync(envLocalPath)) {
      console.log('📄 Carregando variáveis do .env.local...');
      const envContent = readFileSync(envLocalPath, 'utf8');
      
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      });
    } else {
      console.log('⚠️  .env.local não encontrado. Usando valores padrão...');
    }
  } else {
    // CI/CD: usar process.env
    console.log('📄 Carregando variáveis do process.env (GitHub Secrets)...');
    
    // Variáveis necessárias para o sistema
    const requiredVars = [
      'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET',
      'SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'SMTP_ENCRYPTION',
      'GROQ_API_KEY'
    ];
    
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        envVars[varName] = process.env[varName];
      }
    });
    
    // Adicionar NEXT_PUBLIC_* automaticamente
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        envVars[key] = process.env[key];
      }
    });
  }
  
  // Valores padrão
  if (!envVars.NEXT_PUBLIC_API_URL) {
    envVars.NEXT_PUBLIC_API_URL = '/api';
  }
  
  console.log(`✅ Carregadas ${Object.keys(envVars).length} variáveis de ambiente`);
  return envVars;
}

/**
 * Preparar estrutura de diretórios
 */
function prepareDirectories() {
  console.log('📁 Preparando estrutura de diretórios...');
  
  // Limpar dist/ se existir
  if (existsSync(distDir)) {
    console.log('🧹 Removendo dist/ anterior...');
    rmSync(distDir, { recursive: true, force: true });
  }
  
  // Criar dist/api/
  mkdirSync(distApiDir, { recursive: true });
  
  console.log('✅ Diretórios preparados');
}

/**
 * Gerar arquivo .env para APIs PHP
 */
function generatePhpEnv(envVars) {
  console.log('🔧 Gerando .env para APIs PHP...');
  
  const phpVars = [
    'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET',
    'SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'SMTP_ENCRYPTION',
    'GROQ_API_KEY'
  ];
  
  let phpEnvContent = '# Arquivo gerado automaticamente pelo build script\n';
  phpEnvContent += '# Variáveis para APIs PHP\n\n';
  
  phpVars.forEach(varName => {
    const value = envVars[varName] || '';
    phpEnvContent += `${varName}=${value}\n`;
  });
  
  const phpEnvPath = join(distApiDir, '.env');
  writeFileSync(phpEnvPath, phpEnvContent);
  
  console.log(`✅ Arquivo .env criado em dist/api/ (${phpEnvContent.length} bytes)`);
}

/**
 * Gerar arquivo .env.local para Next.js
 */
function generateNextEnv(envVars) {
  console.log('🔧 Gerando .env.local para Next.js...');
  
  let nextEnvContent = '# Arquivo gerado automaticamente pelo build script\n';
  nextEnvContent += '# Variáveis públicas para Next.js (NEXT_PUBLIC_*)\n\n';
  
  Object.keys(envVars).forEach(key => {
    if (key.startsWith('NEXT_PUBLIC_')) {
      nextEnvContent += `${key}=${envVars[key]}\n`;
    }
  });
  
  const nextEnvPath = join(rootDir, '.env.local');
  writeFileSync(nextEnvPath, nextEnvContent);
  
  console.log(`✅ Arquivo .env.local atualizado (${nextEnvContent.length} bytes)`);
}

/**
 * Copiar arquivos da API
 */
function copyApiFiles() {
  console.log('📋 Copiando arquivos da API...');
  
  if (!existsSync(apiDir)) {
    console.log('⚠️  Pasta api/ não encontrada');
    return;
  }
  
  cpSync(apiDir, distApiDir, { 
    recursive: true,
    filter: (src) => {
      // Pular arquivos desnecessários
      const skipFiles = ['.env', 'composer.lock', 'vendor/'];
      return !skipFiles.some(skip => src.includes(skip));
    }
  });
  
  console.log('✅ Arquivos da API copiados');
}

/**
 * Copiar arquivo .htaccess
 */
function copyHtaccess() {
  console.log('📄 Copiando .htaccess...');
  
  const htaccessPath = join(rootDir, '.htaccess');
  
  if (existsSync(htaccessPath)) {
    const destPath = join(distDir, '.htaccess');
    cpSync(htaccessPath, destPath);
    console.log('✅ .htaccess copiado');
  } else {
    console.log('⚠️  .htaccess não encontrado');
  }
}

/**
 * Executar build do Next.js
 */
function buildNextJs() {
  console.log('🏗️  Executando build do Next.js...');
  
  try {
    // Executar next build (que exporta para dist/ via config)
    execSync('npx next build', {
      cwd: rootDir,
      stdio: 'inherit'
    });
    
    console.log('✅ Build do Next.js concluído');
  } catch (error) {
    console.error('❌ Erro no build do Next.js:', error.message);
    process.exit(1);
  }
}

/**
 * Verificar resultado final
 */
function verifyBuild() {
  console.log('🔍 Verificando build...');
  
  const checks = [
    { path: distDir, name: 'Diretório dist/' },
    { path: distApiDir, name: 'APIs em dist/api/' },
    { path: join(distApiDir, '.env'), name: 'Configuração PHP' },
    { path: join(distDir, 'index.html'), name: 'Front-end Next.js' }
  ];
  
  let allGood = true;
  
  checks.forEach(check => {
    if (existsSync(check.path)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} - não encontrado`);
      allGood = false;
    }
  });
  
  if (allGood) {
    console.log('🎉 Build concluído com sucesso!');
    console.log(`📦 Resultado disponível em: ${distDir}`);
  } else {
    console.error('❌ Build falhou na verificação');
    process.exit(1);
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    const startTime = Date.now();
    
    // 1. Detectar ambiente
    const { isLocal, isCI } = detectEnvironment();
    
    // 2. Carregar variáveis
    const envVars = loadEnvironmentVariables(isLocal);
    
    // 3. Preparar diretórios
    prepareDirectories();
    
    // 4. Gerar configurações
    generatePhpEnv(envVars);
    generateNextEnv(envVars);
    
    // 5. Copiar arquivos
    copyApiFiles();
    copyHtaccess();
    
    // 6. Build Next.js
    buildNextJs();
    
    // 7. Verificar resultado
    verifyBuild();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️  Tempo total: ${duration}s`);
    console.log('🚀 Build unificado concluído!');
    
  } catch (error) {
    console.error('❌ Erro no build:', error.message);
    process.exit(1);
  }
}

// Executar
main();