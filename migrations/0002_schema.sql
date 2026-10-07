-- Tena: per-shop CRM for Kenyan retail SMEs
-- All tables scoped by user_id (TEXT — Better Auth ids / preview 'dev-user')

create table if not exists shops (
  id serial primary key,
  user_id text not null unique,
  name text not null default 'My shop',
  owner_name text,
  phone text,
  city text default 'Nairobi',
  vertical text default 'boutique',
  language text not null default 'en',
  loyalty_type text not null default 'stamps',
  stamp_goal int not null default 10,
  points_per_kes int not null default 1,
  reward_label text not null default 'Free wrap',
  seeded boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists shops_user_id_idx on shops (user_id);

create table if not exists customers (
  id serial primary key,
  user_id text not null,
  name text not null,
  phone text not null,
  source text not null default 'walk-in',
  notes text,
  language text not null default 'en',
  tags text not null default '',
  loyalty_points int not null default 0,
  stamp_count int not null default 0,
  opted_in boolean not null default true,
  last_purchase_at timestamptz,
  last_contact_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists customers_user_id_idx on customers (user_id);
create index if not exists customers_phone_idx on customers (user_id, phone);

create table if not exists conversations (
  id serial primary key,
  user_id text not null,
  customer_id int not null references customers(id) on delete cascade,
  channel text not null default 'whatsapp',
  status text not null default 'open',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists conversations_user_id_idx on conversations (user_id);
create index if not exists conversations_customer_idx on conversations (customer_id);

create table if not exists messages (
  id serial primary key,
  user_id text not null,
  conversation_id int not null references conversations(id) on delete cascade,
  customer_id int not null references customers(id) on delete cascade,
  direction text not null,
  body text not null,
  is_ai_draft boolean not null default false,
  sent_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on messages (conversation_id);

create table if not exists follow_ups (
  id serial primary key,
  user_id text not null,
  customer_id int not null references customers(id) on delete cascade,
  conversation_id int references conversations(id) on delete set null,
  kind text not null,
  due_at timestamptz not null,
  status text not null default 'due',
  draft_text text,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists follow_ups_user_due_idx on follow_ups (user_id, status, due_at);

create table if not exists sales (
  id serial primary key,
  user_id text not null,
  customer_id int not null references customers(id) on delete cascade,
  item text not null,
  amount_kes int not null,
  sold_at timestamptz not null default now()
);
create index if not exists sales_user_id_idx on sales (user_id);

create table if not exists feedback (
  id serial primary key,
  user_id text not null,
  customer_id int not null references customers(id) on delete cascade,
  rating int,
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists feedback_user_id_idx on feedback (user_id);
