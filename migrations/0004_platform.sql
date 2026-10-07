-- Card payments, Tena ops (all shops), in-app support
alter table payments add column if not exists method text not null default 'mpesa';
alter table payments alter column phone drop not null;

create table if not exists platform_admins (
  user_id text primary key,
  email text,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists support_tickets (
  id serial primary key,
  shop_id int not null references shops(id) on delete cascade,
  user_id text not null,
  subject text not null,
  body text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
create index if not exists support_tickets_shop_idx on support_tickets (shop_id);
create index if not exists support_tickets_status_idx on support_tickets (status);

create table if not exists support_messages (
  id serial primary key,
  ticket_id int not null references support_tickets(id) on delete cascade,
  author_role text not null,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists support_messages_ticket_idx on support_messages (ticket_id);
