# Deploy via Git e Ambientes

Este guia prepara o projeto para sair do deploy manual por ZIP/CLI e passar a
rodar com GitHub + Netlify, mantendo ambientes separados para teste e uso real.

## Objetivo

- Ter historico de alteracoes no Git.
- Conectar o Netlify ao repositorio GitHub.
- Separar dados de teste e dados reais usando dois projetos Supabase.
- Evitar que segredos como `SUPABASE_SERVICE_ROLE_KEY` sejam enviados ao GitHub.

## Ambientes

### Staging

Ambiente de teste/homologacao. Use para validar sprint nova, testar cadastro,
aprovar/rejeitar solicitacoes e simular fluxo completo antes de mexer em dados
reais.

Recomendado:
- Projeto Supabase separado, por exemplo `solicitacao-recolhimento-staging`.
- Site Netlify separado ou deploy preview/branch deploy.
- Usuarios e lojas ficticios ou copia reduzida de dados reais.

### Production

Ambiente real da empresa. Use somente depois que a mudanca passou no staging.

Recomendado:
- Projeto Supabase separado, por exemplo `solicitacao-recolhimento-prod`.
- Site Netlify principal.
- Supabase Pro quando o uso virar rotina da empresa, para evitar pausa
  automatica e habilitar backup diario.

## Variaveis de ambiente

Configure estas variaveis no Netlify para cada ambiente:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SIGNED_URL_EXPIRY_SECONDS
```

Use `.env.example` como modelo. O arquivo `.env.local` contem valores locais e
nao deve ser enviado ao GitHub.

## Passo a passo recomendado

1. Criar um repositorio privado no GitHub.
2. Inicializar Git localmente, se ainda nao existir:
   ```bash
   git init
   git add .
   git status
   ```
3. Confirmar que estes arquivos nao aparecem no `git status`:
   ```text
   .env.local
   .netlify/
   .next/
   node_modules/
   ```
4. Fazer o primeiro commit:
   ```bash
   git commit -m "chore: prepare project for git deploy"
   ```
5. Conectar o repositorio remoto:
   ```bash
   git branch -M main
   git remote add origin <URL_DO_REPOSITORIO_GITHUB>
   git push -u origin main
   ```
6. No Netlify, criar/conectar um site a partir do GitHub.
7. Em **Build & deploy**, usar:
   ```text
   Build command: npm run build
   Publish directory: .next
   ```
8. Em **Environment variables**, cadastrar as variaveis do ambiente correto.
9. No Supabase do ambiente escolhido, aplicar as migrations em ordem:
   ```text
   supabase/migrations/0001_enums.sql
   supabase/migrations/0002_profiles.sql
   ...
   supabase/migrations/0010_fix_evidence_storage.sql
   ```
10. Criar o primeiro Admin no Supabase Auth do ambiente escolhido.

## Regra de operacao

- Mudanca nova entra primeiro em staging.
- Depois de validada, a mesma branch/commit vai para production.
- Nunca testar migration nova direto em production.
- Nunca colar `SUPABASE_SERVICE_ROLE_KEY` em issue, chat, commit, README ou
  arquivo versionado.
- Enquanto a conta Netlify estiver no plano Free, o repositorio pode ficar
  publico para evitar bloqueio de deploy por contributor nao reconhecido em
  repo privado. Antes de voltar o repositorio para privado, conectar a conta
  GitHub no Netlify ou ativar o plano necessario.

## Observacao sobre deploy manual atual

O projeto ja foi publicado manualmente no Netlify durante o MVP. Esse caminho
serviu para validar o sistema, mas o fluxo de producao deve ser GitHub +
Netlify conectado, para permitir historico, rollback e deploy previsivel.
