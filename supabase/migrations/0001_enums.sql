-- =============================================================================
-- Migração 0001 — Enums base
-- Sprint 1 — Fundação do Projeto
-- =============================================================================
-- Esta migração cria apenas os tipos enumerados (enums) que serão usados
-- pelas tabelas do sistema, criadas nas próximas sprints. Nenhuma tabela é
-- criada aqui — isso é proposital, conforme o plano de sprints da Etapa 5.
--
-- Como aplicar:
--   1. Via Supabase CLI:   supabase db push
--   2. Ou colando o conteúdo no SQL Editor do painel do Supabase.
-- =============================================================================

-- Perfis de acesso do sistema (Etapa 1, seção 7).
-- Somente PROMOTOR e ADMIN no MVP — outros perfis (Conferente, Gestor,
-- Auditor) ficam para uma fase futura, conforme escopo aprovado.
create type role_type as enum ('PROMOTOR', 'ADMIN');

-- Status do ciclo de vida de uma solicitação (Etapa 1/3).
-- Sem o status RASCUNHO: a solicitação só passa a existir no banco no
-- momento do envio, já nascendo em AGUARDANDO_CONFERENCIA (decisão tomada
-- durante o planejamento, removendo o conceito de rascunho do MVP).
create type request_status as enum (
  'AGUARDANDO_CONFERENCIA',
  'AGUARDANDO_CORRECAO',
  'APROVADA',
  'REJEITADA'
);

-- Tipo de arquivo anexado como evidência (Etapa 1, seção 17).
create type file_type as enum ('FOTO', 'VIDEO', 'PDF', 'XML');

-- Ações registradas na tabela de histórico/auditoria (Etapa 3, seção 5).
-- Mantido como enum (em vez de texto livre) para garantir consistência dos
-- valores gravados e facilitar filtros/relatórios futuros.
create type history_action as enum (
  'CRIACAO',
  'EDICAO',
  'ITEM_ADICIONADO',
  'ITEM_REMOVIDO',
  'UPLOAD_ANEXO',
  'REMOCAO_ANEXO',
  'ENVIO_CONFERENCIA',
  'SOLICITACAO_CORRECAO',
  'REENVIO',
  'APROVACAO',
  'REJEICAO',
  'USUARIO_CRIADO',
  'USUARIO_ATIVADO',
  'USUARIO_DESATIVADO'
);
