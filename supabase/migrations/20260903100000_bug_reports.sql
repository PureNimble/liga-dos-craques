-- =============================================================================
-- Reportes de problemas (bug reports)
-- =============================================================================
-- Qualquer jogador cria um reporte; vê os seus. O admin vê todos e marca como
-- resolvido. A segurança vive no RLS + GRANTs por coluna: quem reporta não
-- define o estado (entra sempre 'open'); só o admin muda status/resolved_at.
-- =============================================================================

create table if not exists public.bug_report (
  id          bigint generated always as identity primary key,
  reporter_id uuid not null references public.profile (id) on delete cascade,
  message     text not null check (char_length(message) between 1 and 2000),
  page        text,
  status      text not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

comment on table public.bug_report is 'Problemas reportados pelos jogadores; o admin resolve.';

alter table public.bug_report enable row level security;

-- Leitura: o próprio vê os seus; o admin vê todos.
drop policy if exists "bug_report_select" on public.bug_report;
create policy "bug_report_select"
  on public.bug_report for select
  to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

-- Criação: só em nome próprio.
drop policy if exists "bug_report_insert" on public.bug_report;
create policy "bug_report_insert"
  on public.bug_report for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- Atualização (resolver): só admin.
drop policy if exists "bug_report_admin_update" on public.bug_report;
create policy "bug_report_admin_update"
  on public.bug_report for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- GRANTs por coluna: quem reporta escreve só reporter_id/message/page (status
-- fica no default 'open'); o admin muda status/resolved_at.
revoke insert, update on public.bug_report from authenticated;
grant select on public.bug_report to authenticated;
grant insert (reporter_id, message, page) on public.bug_report to authenticated;
grant update (status, resolved_at) on public.bug_report to authenticated;
