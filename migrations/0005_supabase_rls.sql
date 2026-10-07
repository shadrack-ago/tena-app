-- Supabase exposes the public schema over its REST API (anon/authenticated keys).
-- Tena talks to Postgres directly as the owner role, which bypasses RLS, so
-- enabling RLS with no policies closes the REST door without affecting the app.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;
