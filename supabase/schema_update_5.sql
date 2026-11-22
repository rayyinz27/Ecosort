-- EcoSort update 5: kuis berbab (satu bab berisi banyak soal). Jalankan setelah schema_update_4.sql. Aman diulang.
create table if not exists public.quiz_chapters (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);
alter table public.quiz_chapters enable row level security;

drop policy if exists "quiz_chapters_read" on public.quiz_chapters;
drop policy if exists "quiz_chapters_admin_write" on public.quiz_chapters;
create policy "quiz_chapters_read" on public.quiz_chapters for select to anon, authenticated using (true);
create policy "quiz_chapters_admin_write" on public.quiz_chapters for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.quiz_chapters to anon, authenticated;
grant insert, update, delete on public.quiz_chapters to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Soal punya bab (kosong = bab "Umum"). Menghapus bab ikut menghapus soalnya.
alter table public.quiz_questions add column if not exists chapter_id bigint references public.quiz_chapters(id) on delete cascade;

-- Hasil kuis mencatat bab
alter table public.quiz_results add column if not exists chapter_id bigint;
alter table public.quiz_results add column if not exists chapter_title text;
