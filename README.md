# Sistema de Solicitacao de Recolhimento

Sistema web para centralizar solicitacoes de recolhimento de mercadorias
(avaria, troca, devolucao, produto vencido), substituindo o processo feito em
grupos de WhatsApp.

O projeto e entregue por sprints. Cada sprint deve deixar o sistema rodando e
preparado para a proxima etapa.

## Status atual

Entregue ate agora:

- Sprint 1: Fundacao do Projeto
- Sprint 2: Autenticacao
- Sprint 3: Perfis e Seguranca
- Sprint 4: Cadastros Administrativos
- Sprint 5: Area do Promotor (Home + Listagem)
- Sprint 6: Nova Solicitacao (Dados Gerais)
- Sprint 7: Produtos da Solicitacao
- Sprint 8: Upload de Evidencias
- Sprint 9: Painel de Conferencia
- Sprint 10: Aprovacao, Correcao e Rejeicao
- Sprint 11: Historico administrativo de solicitacoes finalizadas
- Sprint 12: Dashboard Administrativo
- Sprint 13: Pesquisa e Filtros

Proxima etapa:

- Sprint 14: Testes e Seguranca

## Decisoes atuais do produto

- O fluxo nao usa rascunho automatico.
- O Promotor informa somente a NFD.
- A duplicidade ativa e verificada somente por NFD.
- O campo Nota Fiscal foi removido da experiencia do usuario.
- Evidencias sao obrigatorias para enviar uma solicitacao.
- Evidencias ficam no formulario de nova solicitacao, antes do envio.
- O Admin ve a fila em Conferencia e consulta aprovadas/rejeitadas no Historico.
- Promotor continua via web. PWA/app nativo fica fora do escopo atual.
- Admin Master com indicadores de perda/despesa fica reservado para etapa futura,
  depois dos sprints atuais.

## Ordem de sprints

| # | Sprint |
|---|--------|
| 1 | Fundacao do Projeto |
| 2 | Autenticacao |
| 3 | Perfis e Seguranca |
| 4 | Cadastros Administrativos |
| 5 | Area do Promotor (Home + Listagem) |
| 6 | Nova Solicitacao (Dados Gerais) |
| 7 | Produtos da Solicitacao |
| 8 | Upload de Evidencias |
| 9 | Painel de Conferencia |
| 10 | Aprovacao, Correcao e Rejeicao |
| 11 | Historico Administrativo |
| 12 | Dashboard Administrativo |
| 13 | Pesquisa e Filtros |
| 14 | Testes e Seguranca |
| 15 | Homologacao |

## Sprint 12

**Dashboard Administrativo**: indicadores basicos, como solicitacoes de hoje e
por status, com filtros por periodo, loja, cidade, promotor e tipo. O objetivo
e dar visao operacional sem transformar o MVP em um BI complexo.

Implementado em `/admin/dashboard` com cards de totais, filtros e resumos por
status, tipo e promotor.

## Sprint 13

**Pesquisa e Filtros**: busca compacta e filtros recolhidos nas listas de
solicitacoes, mantendo a tela limpa. Implementado em:

- `/admin/conferencia`
- `/admin/historico`
- `/promotor/solicitacoes`

## Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, RLS e Storage
- Netlify para hospedagem/deploy

## Como rodar localmente

1. Instale as dependencias:

   ```bash
   npm install
   ```

2. Configure as variaveis locais:

   ```bash
   cp .env.example .env.local
   ```

   Depois preencha `.env.local` com os valores do projeto Supabase correto.

3. Aplique as migrations no Supabase, em ordem:

   ```text
   supabase/migrations/0001_enums.sql
   supabase/migrations/0002_profiles.sql
   ...
   supabase/migrations/0010_fix_evidence_storage.sql
   ```

4. Rode em desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse:

   ```text
   http://localhost:3000
   ```

## Verificacoes

Antes de subir mudancas:

```bash
npm run typecheck
npm run lint
npm run build
```

## Variaveis de ambiente

Use `.env.example` como modelo:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SIGNED_URL_EXPIRY_SECONDS
```

Nunca envie `.env.local` para o GitHub. A `SUPABASE_SERVICE_ROLE_KEY` e segredo
de servidor e nao pode aparecer no client, no README, em issue ou em commit.

## Deploy e ambientes

O guia de preparacao para GitHub, Netlify e Supabase separado por ambiente esta
em:

```text
docs/deploy-git-ambientes.md
```

Resumo:

- Staging: ambiente de teste/homologacao.
- Production: ambiente real da empresa.
- Cada ambiente deve usar seu proprio projeto Supabase.
- Mudancas devem ser validadas em staging antes de ir para production.

## Primeiro Admin

O primeiro usuario Admin deve ser criado manualmente no Supabase Auth.

Ao criar o usuario, use `User Metadata`:

```json
{ "nome": "Seu Nome", "role": "ADMIN" }
```

Se precisar corrigir depois:

```sql
update public.profiles set role = 'ADMIN' where email = 'seu@email.com';
```
