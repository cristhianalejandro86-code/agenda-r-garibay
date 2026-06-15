-- ════════════════════════════════════════════════════════════════════
--  Agenda R. Garibay — Esquema Supabase
--  Ejecutar en: Supabase → SQL Editor → New query → Run
-- ════════════════════════════════════════════════════════════════════

-- Tabla principal
create table if not exists public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  persona_solicita text,
  descripcion      text not null,
  prioridad        text not null default 'normal' check (prioridad in ('alta','normal','baja')),
  categorias       text[] default '{}',
  estado           text not null default 'nuevo' check (estado in ('nuevo','en_progreso','completado')),
  notas            text,
  reunion          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Índices
create index if not exists idx_pedidos_user_id    on public.pedidos(user_id);
create index if not exists idx_pedidos_estado     on public.pedidos(estado);
create index if not exists idx_pedidos_created_at on public.pedidos(created_at desc);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pedidos_updated_at on public.pedidos;
create trigger trg_pedidos_updated_at
  before update on public.pedidos
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.pedidos enable row level security;

create policy "select_own" on public.pedidos
  for select using (auth.uid() = user_id);
create policy "insert_own" on public.pedidos
  for insert with check (auth.uid() = user_id);
create policy "update_own" on public.pedidos
  for update using (auth.uid() = user_id);
create policy "delete_own" on public.pedidos
  for delete using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.pedidos;
