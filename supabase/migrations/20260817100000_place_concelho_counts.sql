-- =============================================================================
-- Place: concelho + telefone; vistas de contagem para o mapa por distrito/concelho
-- =============================================================================
-- O concelho fica guardado no próprio registo (escolhido no formulário, em
-- cascata a partir do distrito) - evita ter de testar ponto-em-polígono no
-- frontend para saber a que concelho cada campo pertence. As contagens usadas
-- pelo mapa (quantos campos por distrito/concelho) vêm de vistas SQL, não de
-- ciclos em JS sobre a lista de campos.
-- =============================================================================

alter table public.place
  add column if not exists concelho text,
  add column if not exists phone text check (phone is null or char_length(phone) <= 30);

-- Backfill dos registos já existentes (ficaram sem concelho antes deste campo
-- existir) para poder tornar a coluna obrigatória a seguir.
update public.place set concelho = 'Não especificado' where concelho is null;

alter table public.place
  alter column concelho set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'place_concelho_length' and conrelid = 'public.place'::regclass
  ) then
    alter table public.place
      add constraint place_concelho_length check (char_length(concelho) between 1 and 120);
  end if;
end $$;

comment on column public.place.concelho is 'Concelho (município) - texto livre; são 300+ valores, não vale a pena um enum.';
comment on column public.place.phone is 'Telefone de contacto do campo - opcional.';

-- created_by continua de fora - só os campos abaixo se juntam ao GRANT existente.
grant update (concelho, phone) on public.place to authenticated;

-- =============================================================================
-- Vistas de contagem
-- =============================================================================
create or replace view public.v_place_count_by_district
with (security_invoker = on) as
select
  district,
  count(*)::int as place_count,
  avg(latitude) as avg_latitude,
  avg(longitude) as avg_longitude
from public.place
group by district;

comment on view public.v_place_count_by_district is 'Nº de campos e centro médio por distrito - para o pin agregado do mapa.';

grant select on public.v_place_count_by_district to authenticated;

create or replace view public.v_place_count_by_concelho
with (security_invoker = on) as
select
  district,
  concelho,
  count(*)::int as place_count,
  avg(latitude) as avg_latitude,
  avg(longitude) as avg_longitude
from public.place
group by district, concelho;

comment on view public.v_place_count_by_concelho is 'Nº de campos e centro médio por concelho - para o pin agregado do mapa.';

grant select on public.v_place_count_by_concelho to authenticated;
