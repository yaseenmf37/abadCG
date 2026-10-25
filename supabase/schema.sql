create table if not exists public.app_state (
  key text primary key,
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

revoke all on public.app_state from anon, authenticated;
grant all on public.app_state to service_role;

create or replace function public.reserve_cafe_table(p_order jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_orders jsonb;
begin
  insert into public.app_state(key, value) values ('orders', '[]'::jsonb)
  on conflict (key) do nothing;

  select value into current_orders
  from public.app_state
  where key = 'orders'
  for update;

  if exists (
    select 1
    from jsonb_array_elements(current_orders) as entries(existing_order)
    where existing_order->>'table' = p_order->>'table'
  ) then
    return null;
  end if;

  update public.app_state
  set value = current_orders || jsonb_build_array(p_order), updated_at = now()
  where key = 'orders';

  return p_order;
end;
$$;

create or replace function public.confirm_cafe_order(p_order_id text, p_confirmed_order jsonb, p_sale jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_orders jsonb;
  current_sales jsonb;
  found_order jsonb;
  updated_orders jsonb;
begin
  insert into public.app_state(key, value) values ('orders', '[]'::jsonb), ('sales', '[]'::jsonb)
  on conflict (key) do nothing;

  select value into current_orders from public.app_state where key = 'orders' for update;
  select value into current_sales from public.app_state where key = 'sales' for update;

  select value into found_order
  from jsonb_array_elements(current_orders) as entries(value)
  where value->>'id' = p_order_id;

  if found_order is null then
    return jsonb_build_object('status', 'missing');
  end if;
  if found_order->>'status' = 'confirmed' or exists (
    select 1 from jsonb_array_elements(current_sales) as entries(sale) where sale->>'id' = p_order_id
  ) then
    return jsonb_build_object('status', 'already_confirmed', 'order', found_order);
  end if;

  select coalesce(jsonb_agg(
    case when entry->>'id' = p_order_id then p_confirmed_order else entry end
    order by ordinal
  ), '[]'::jsonb)
  into updated_orders
  from jsonb_array_elements(current_orders) with ordinality as entries(entry, ordinal);

  update public.app_state set value = updated_orders, updated_at = now() where key = 'orders';
  update public.app_state
  set value = current_sales || jsonb_build_array(p_sale), updated_at = now()
  where key = 'sales';

  return jsonb_build_object('status', 'confirmed', 'order', p_confirmed_order);
end;
$$;

create or replace function public.delete_cafe_order(p_order_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_orders jsonb;
  updated_orders jsonb;
begin
  insert into public.app_state(key, value) values ('orders', '[]'::jsonb)
  on conflict (key) do nothing;

  select value into current_orders from public.app_state where key = 'orders' for update;
  if not exists (select 1 from jsonb_array_elements(current_orders) as entries(entry) where entry->>'id' = p_order_id) then
    return false;
  end if;

  select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
  into updated_orders
  from jsonb_array_elements(current_orders) with ordinality as entries(entry, ordinal)
  where entry->>'id' <> p_order_id;

  update public.app_state set value = updated_orders, updated_at = now() where key = 'orders';
  return true;
end;
$$;

create or replace function public.reset_cafe_activity()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_state(key, value) values ('orders', '[]'::jsonb), ('sales', '[]'::jsonb)
  on conflict (key) do nothing;

  perform 1 from public.app_state where key in ('orders', 'sales') order by key for update;
  update public.app_state set value = '[]'::jsonb, updated_at = now() where key in ('orders', 'sales');
end;
$$;

revoke all on function public.reserve_cafe_table(jsonb) from public, anon, authenticated;
revoke all on function public.confirm_cafe_order(text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.delete_cafe_order(text) from public, anon, authenticated;
revoke all on function public.reset_cafe_activity() from public, anon, authenticated;
grant execute on function public.reserve_cafe_table(jsonb) to service_role;
grant execute on function public.confirm_cafe_order(text, jsonb, jsonb) to service_role;
grant execute on function public.delete_cafe_order(text) to service_role;
grant execute on function public.reset_cafe_activity() to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'abad-media',
  'abad-media',
  true,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
