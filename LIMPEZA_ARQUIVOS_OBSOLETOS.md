# 🗑️ Limpeza de Arquivos Não Utilizados - Análise Completa

**Data:** 19 de Outubro de 2025  
**Objetivo:** Remover arquivos obsoletos do antigo sistema PHP/Vite

---

## 📊 Análise de Arquivos para Remoção

### ✅ **PODEM SER REMOVIDOS COM SEGURANÇA:**

#### 1. **`.eslintrc.cjs`** ❌ DUPLICADO
**Motivo:** Já temos `.eslintrc.json` sendo usado  
**Caminho:** `.eslintrc.cjs`  
**Ação:** REMOVER

#### 2. **`package-lock.json`** ❌ NPM (não usado)
**Motivo:** Projeto usa **PNPM** (`pnpm-lock.yaml`)  
**Caminho:** `package-lock.json`  
**Ação:** REMOVER

#### 3. **`dist/`** ❌ Build antiga
**Motivo:** Next.js usa `.next/` para builds  
**Conteúdo:** Builds antigas do sistema anterior  
**Caminho:** `dist/`  
**Ação:** REMOVER COMPLETO

#### 4. **`tsconfig.tsbuildinfo`** ❌ Cache TypeScript
**Motivo:** Arquivo de cache que será regenerado  
**Caminho:** `tsconfig.tsbuildinfo`  
**Ação:** REMOVER (já está no .gitignore)

---

### ⚠️ **MANTER (SÃO NECESSÁRIOS):**

#### ✅ **`.next/`** - Build do Next.js
Pasta de build gerada pelo Next.js (no .gitignore)

#### ✅ **`node_modules/`** - Dependências
Pasta de dependências do NPM/PNPM (no .gitignore)

#### ✅ **`explicacoes/`** - Documentação
Documentação do projeto e aprendizados

#### ✅ **`.claude/`** - Configurações Claude
Configurações específicas do Claude AI

#### ✅ **`db/`** - Scripts SQL e Migrations
Scripts de banco de dados necessários

#### ✅ **`scripts/`** - Scripts utilitários
Scripts de automação do projeto

---

## 🔍 Verificação Detalhada

### Pasta `dist/` (REMOVER)

```
dist/
├── .htaccess                    ❌ Apache (não usado com Next.js)
├── api/                         ❌ API PHP antiga
├── app-build-manifest.json      ❌ Manifest antigo
├── app-path-routes-manifest.json ❌ Manifest antigo
├── build-manifest.json          ❌ Manifest antigo
├── BUILD_ID                     ❌ Build ID antigo
├── cache/                       ❌ Cache antigo
├── diagnostics/                 ❌ Logs antigos
├── export-marker.json           ❌ Marker antigo
├── images-manifest.json         ❌ Manifest antigo
├── next-minimal-server.js.nft.json ❌ NFT antigo
├── next-server.js.nft.json      ❌ NFT antigo
├── package.json                 ❌ Package antigo
├── prerender-manifest.json      ❌ Manifest antigo
├── react-loadable-manifest.json ❌ Manifest antigo
├── required-server-files.json   ❌ Config antiga
├── routes-manifest.json         ❌ Routes antigas
├── server/                      ❌ Server antigo
├── static/                      ❌ Statics antigos
├── trace                        ❌ Trace antigo
└── types/                       ❌ Types antigos
```

**Toda esta pasta deve ser removida!**

---

## 📝 Arquivos Duplicados

### ESLint

**`.eslintrc.cjs`** vs **`.eslintrc.json`**

Atualmente usando: `.eslintrc.json` ✅  
Remover: `.eslintrc.cjs` ❌

### Package Lock

**`package-lock.json`** (NPM) vs **`pnpm-lock.yaml`** (PNPM)

Atualmente usando: `pnpm-lock.yaml` ✅  
Remover: `package-lock.json` ❌

---

## 🚀 Script de Limpeza

### Comando PowerShell para Remover Tudo:

```powershell
# Remover dist/ completo
Remove-Item -Path "dist" -Recurse -Force

# Remover .eslintrc.cjs duplicado
Remove-Item -Path ".eslintrc.cjs" -Force

# Remover package-lock.json (NPM)
Remove-Item -Path "package-lock.json" -Force

# Remover tsconfig.tsbuildinfo (cache)
Remove-Item -Path "tsconfig.tsbuildinfo" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
```

---

## 📦 Tamanho Liberado Estimado

| Arquivo/Pasta | Tamanho Aproximado |
|---------------|-------------------|
| `dist/` | ~50-200 MB |
| `.eslintrc.cjs` | ~1 KB |
| `package-lock.json` | ~500 KB |
| `tsconfig.tsbuildinfo` | ~10 KB |
| **TOTAL** | **~50-200 MB** |

---

## ⚠️ Verificações Antes de Remover

### 1. **Verificar se dist/ não está sendo usado**
```powershell
Get-ChildItem -Recurse -Filter "*.ts","*.tsx","*.js" | Select-String -Pattern "dist/" -List
```

Se retornar vazio = Safe para remover ✅

### 2. **Verificar se .eslintrc.cjs não é importado**
```powershell
Get-Content ".eslintignore"
Get-Content "package.json" | Select-String -Pattern "eslintrc"
```

Se não aparecer .cjs = Safe para remover ✅

### 3. **Verificar se package-lock.json não está no .gitignore**
```powershell
Get-Content ".gitignore" | Select-String -Pattern "package-lock"
```

Se estiver = Safe para remover ✅

---

## 📋 Checklist de Remoção

### Antes de Executar:
- [ ] Commit atual do código (backup)
- [ ] Build funcionando (`pnpm run build`)
- [ ] Git status limpo

### Executar Remoção:
- [ ] Remover `dist/`
- [ ] Remover `.eslintrc.cjs`
- [ ] Remover `package-lock.json`
- [ ] Remover `tsconfig.tsbuildinfo`

### Após Remoção:
- [ ] `pnpm run build` - Verificar se build funciona
- [ ] `pnpm run dev` - Verificar se dev server funciona
- [ ] `pnpm run lint` - Verificar se lint funciona
- [ ] Commit das remoções

---

## 🎯 Arquivos que NÃO Devem Ser Removidos

### Raiz do Projeto:
```
✅ .env.example              # Template de variáveis de ambiente
✅ .env.local                # Variáveis locais (gitignored)
✅ .eslintignore             # Arquivos ignorados pelo ESLint
✅ .eslintrc.json            # Configuração ESLint (USAR ESTE)
✅ .gitattributes            # Configurações Git
✅ .gitignore                # Arquivos ignorados pelo Git
✅ .npmrc                    # Configuração NPM/PNPM
✅ components.json           # Configuração Shadcn UI
✅ next-env.d.ts             # Types do Next.js
✅ next.config.ts            # Configuração Next.js
✅ package.json              # Dependências do projeto
✅ pnpm-lock.yaml            # Lock file PNPM
✅ postcss.config.mjs        # Configuração PostCSS
✅ README.md                 # Documentação principal
✅ tsconfig.json             # Configuração TypeScript
✅ PLASMA_CORRECOES_FINAIS.md # Documentação Plasma
✅ CLAUDE.md                 # Histórico Claude
```

### Pastas:
```
✅ .claude/                  # Configurações Claude AI
✅ .github/                  # GitHub Actions
✅ app/                      # Páginas e API Next.js
✅ components/               # Componentes React
✅ contexts/                 # React Contexts
✅ db/                       # Scripts SQL
✅ explicacoes/              # Documentação detalhada
✅ hooks/                    # React Hooks customizados
✅ lib/                      # Utilitários e helpers
✅ public/                   # Assets públicos
✅ scripts/                  # Scripts de automação
```

---

## 💡 Recomendações Adicionais

### 1. **Adicionar ao .gitignore**
```gitignore
# Build artifacts
dist/
*.tsbuildinfo

# Lock files desnecessários
package-lock.json
yarn.lock

# Cache
.next/
.cache/
```

### 2. **Limpar node_modules (opcional)**
Se quiser garantir limpeza total:
```powershell
Remove-Item -Path "node_modules" -Recurse -Force
Remove-Item -Path ".next" -Recurse -Force
pnpm install
```

### 3. **Verificar .gitignore atual**
Garantir que dist/, .tsbuildinfo, etc estão ignorados

---

## 🔄 Migração Completa

### Antes (Sistema Antigo):
```
- PHP backend (api/)
- Vite bundler
- Apache (.htaccess)
- dist/ para builds
```

### Depois (Sistema Atual):
```
- Next.js API Routes (app/api/)
- Next.js bundler built-in
- Vercel/Node.js deployment
- .next/ para builds
```

---

## ✅ Conclusão

### Arquivos a Remover:
1. ❌ `dist/` (50-200 MB)
2. ❌ `.eslintrc.cjs`
3. ❌ `package-lock.json`
4. ❌ `tsconfig.tsbuildinfo`

### Tamanho Total Liberado:
**~50-200 MB**

### Próximo Passo:
Execute o script de limpeza acima após fazer backup/commit! 🚀
