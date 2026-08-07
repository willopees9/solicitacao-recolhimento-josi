# Homologacao do MVP

Este roteiro valida o fluxo real do Sistema de Solicitacao de Recolhimento
antes de liberar o uso operacional.

## Ambiente

- URL: https://thunderous-gumption-9ccf6b.netlify.app
- Banco: Supabase configurado nas variaveis do Netlify.
- Deploy: GitHub `main` conectado ao Netlify.

## Criterio de aceite

O MVP esta homologado quando Admin e Promotor conseguem executar o fluxo
principal sem erro bloqueante:

1. Admin acessa o sistema.
2. Admin cadastra ou confere lojas, produtos, tipos e usuarios.
3. Promotor cria solicitacao com NFD, produto e evidencia.
4. Admin acompanha a solicitacao em Solicitacoes.
5. Admin aprova, rejeita ou solicita correcao.
6. Solicitacoes finalizadas aparecem no Historico.
7. Dashboard mostra os indicadores basicos.

## Checklist Tecnico

- [ ] `npm run check` passa localmente.
- [ ] Deploy do Netlify finaliza sem erro.
- [ ] `/login` responde em producao.
- [ ] Rotas Admin sem login redirecionam para `/login`.
- [ ] Rotas Promotor sem login redirecionam para `/login`.
- [ ] Cabecalhos basicos de seguranca aparecem em producao.
- [ ] Variaveis do Netlify estao configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SIGNED_URL_EXPIRY_SECONDS`

## Checklist Admin

- [ ] Login Admin funciona com e-mail correto.
- [ ] Admin acessa Dashboard.
- [ ] Admin acessa Solicitacoes.
- [ ] Admin acessa Historico.
- [ ] Admin cria Promotor e recebe senha temporaria.
- [ ] Admin edita usuario.
- [ ] Admin ativa/desativa usuario.
- [ ] Admin cadastra loja.
- [ ] Admin cadastra produto.
- [ ] Admin cadastra tipo de solicitacao.
- [ ] Admin aprova uma solicitacao.
- [ ] Admin rejeita uma solicitacao informando motivo.
- [ ] Admin solicita correcao informando observacao.
- [ ] Solicitacao pendente com mais de 2 dias aparece com indicador de prioridade.
- [ ] Filtro `Prioritarias` mostra somente solicitacoes fora do prazo.

## Checklist Promotor

- [ ] Login Promotor funciona.
- [ ] Primeiro acesso obriga troca de senha quando aplicavel.
- [ ] Promotor acessa Minhas Solicitacoes.
- [ ] Promotor cria solicitacao com loja, vendedor, NFD, tipo e observacao.
- [ ] Promotor adiciona produto por codigo.
- [ ] Promotor remove produto antes de enviar.
- [ ] Promotor anexa evidencia antes de enviar.
- [ ] Botao de envio fica bloqueado sem evidencia.
- [ ] Promotor remove evidencia anexada por engano.
- [ ] Sistema bloqueia NFD duplicada em solicitacao ativa.
- [ ] Solicitação criada aparece em Minhas Solicitacoes.
- [ ] Promotor visualiza detalhe e evidencias da propria solicitacao.

## Checklist de Arquivos

- [ ] JPG/JPEG aceito.
- [ ] PNG aceito.
- [ ] WEBP aceito.
- [ ] PDF aceito.
- [ ] XML aceito.
- [ ] Arquivo com extensao nao permitida e rejeitado.
- [ ] Arquivo acima do limite e rejeitado.
- [ ] Link assinado de evidencia abre somente para usuario autorizado.

## Checklist de Filtros

- [ ] Busca em Solicitacoes filtra por numero, NFD, loja ou promotor.
- [ ] Filtros avancados de Solicitacoes ficam recolhidos por padrao.
- [ ] Historico filtra por status.
- [ ] Historico busca por numero, NFD, loja ou promotor.
- [ ] Promotor busca em Minhas Solicitacoes.
- [ ] Dashboard filtra por periodo, loja, cidade, promotor e tipo.
- [ ] Dashboard mostra o card `Fora do prazo`.

## Riscos Conhecidos

- O `npm audit` ainda aponta alertas altos que exigem migracao maior para
  Next 16 e ESLint 9. Essa migracao deve ser feita em etapa tecnica separada,
  apos homologar o MVP, para evitar quebrar o fluxo atual.
- O sistema ainda usa a rota interna `/admin/conferencia`, mas a tela aparece
  para o usuario como `Solicitacoes`. A rota pode ser renomeada depois se virar
  prioridade, mas nao bloqueia homologacao.
- Admin Master e indicadores financeiros de perda/despesa estao fora do MVP
  atual, conforme decisao do produto.

## Resultado

Preencher ao final dos testes:

- Responsavel:
- Data:
- Resultado: Aprovado / Aprovado com ressalvas / Reprovado
- Observacoes:
