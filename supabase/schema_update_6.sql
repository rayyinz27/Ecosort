-- EcoSort update 6: batas scan AI per pengguna per hari. Jalankan setelah schema_update_5.sql. Aman diulang.
-- Hari dihitung menurut waktu Jakarta (WIB): jatah direset tiap pukul 00.00 WIB.
create table if not exists public.scan_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.scan_usage enable row level security;  -- tanpa policy: hanya Edge Function (service role) yang bisa mengakses

-- Mengambil 1 jatah. Mengembalikan jumlah terpakai setelah diambil, atau -1 jika jatah habis.
create or replace function public.use_scan_quota(p_user uuid, p_limit int) returns int
language plpgsql security definer set search_path = public
as $$
declare c int;
begin
  insert into public.scan_usage as su (user_id, day, count)
  values (p_user, (now() at time zone 'Asia/Jakarta')::date, 1)
  on conflict (user_id, day) do update set count = su.count + 1
  where su.count < p_limit
  returning su.count into c;
  return coalesce(c, -1);
end $$;

-- Mengembalikan 1 jatah (dipakai jika AI gagal menjawab)
create or replace function public.refund_scan_quota(p_user uuid) returns void
language sql security definer set search_path = public
as $$
  update public.scan_usage set count = greatest(count - 1, 0)
  where user_id = p_user and day = (now() at time zone 'Asia/Jakarta')::date;
$$;

revoke all on function public.use_scan_quota(uuid, int) from public, anon, authenticated;
revoke all on function public.refund_scan_quota(uuid) from public, anon, authenticated;
grant execute on function public.use_scan_quota(uuid, int) to service_role;
grant execute on function public.refund_scan_quota(uuid) to service_role;
grant usage on schema public to service_role;
grant all on public.scan_usage to service_role;
