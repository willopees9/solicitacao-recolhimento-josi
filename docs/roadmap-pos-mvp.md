# Roadmap Pos-MVP

Ideias levantadas para evoluir o Sistema de Solicitacao de Recolhimento depois
da homologacao inicial.

## 1. Prioridade por Prazo

Status: implementado.

- Solicitacoes pendentes com mais de 2 dias entram como prioridade.
- Admin ve badge `Prioridade` na tela de Solicitacoes.
- Admin pode filtrar por `Prioritarias`.
- Dashboard mostra card `Fora do prazo`.

## 2. Controle de Perdas por NFD

Objetivo: mapear valores das notas de devolucao para saber quanto a empresa
esta pagando/perdendo por loja, promotor, tipo e periodo.

Campos previstos:

- Valor da NFD.
- Data da NFD.
- Limite esperado por loja/supermercado.
- Motivo/tipo da devolucao.

Indicadores previstos:

- Total de perdas por periodo.
- Ranking por supermercado.
- Ranking por promotor.
- Tipos com maior impacto.
- Alertas de limite excedido.

## 3. ID do Promotor

Objetivo: facilitar identificacao e filtros operacionais.

Formato sugerido:

- Codigo interno no cadastro do usuario, exemplo `PR-001`.
- Exibir nas listas como `PR-001 - Nome do Promotor`.
- Permitir busca/filtro pelo codigo.

## 4. Encaminhamento para SAC

Objetivo: transformar solicitacoes aprovadas em tratativas do SAC.

Primeira versao sugerida:

- Botao `Enviar para SAC` em solicitacoes aprovadas.
- Status ou historico `Enviado ao SAC`.
- Campo `protocolo SAC`.
- SAC recebe loja, NFD, produtos, evidencias e decisao.

Evolucao futura:

- Integracao com e-mail, planilha, API ou sistema externo do SAC.
