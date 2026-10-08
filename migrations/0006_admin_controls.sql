-- Tena HQ controls: suspend shops, admin roles + invites, audit log, manual
-- payment confirmation (payments.status gains 'submitted' = shop says it paid).

alter table shops add column if not exists suspended_at timestamptz;
alter table shops add column if not exists suspended_reason text;

alter table platform_admins add column if not exists role text not null default 'owner';
alter table platform_admins add column if not exists invited_by text;

create table if not exists admin_invites (
  email text primary key,
  role text not null default 'support',
  invited_by text,
  created_at timestamptz not null default now()
);

create table if not exists admin_audit (
  id serial primary key,
  admin_user_id text not null,
  admin_email text,
  action text not null,
  shop_id int references shops(id) on delete set null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_created_idx on admin_audit (created_at desc);
create index if not exists admin_audit_shop_idx on admin_audit (shop_id);

alter table payments add column if not exists note text;
alter table payments add column if not exists confirmed_by text;
alter table payments add column if not exists confirmed_at timestamptz;
create index if not exists payments_status_idx on payments (status);

-- Keep Supabase's REST API closed on the new tables (see 0005).
alter table admin_invites enable row level security;
alter table admin_audit enable row level security;
