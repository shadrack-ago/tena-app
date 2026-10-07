-- Counter QR, staff seats, shop-level subscription
alter table shops add column if not exists join_code text;
alter table shops add column if not exists invite_code text;
alter table shops add column if not exists trial_ends_at timestamptz;

create unique index if not exists shops_join_code_uidx on shops (join_code);
create unique index if not exists shops_invite_code_uidx on shops (invite_code);

create table if not exists shop_members (
  id serial primary key,
  shop_id int not null references shops(id) on delete cascade,
  user_id text not null,
  role text not null default 'staff',
  name text,
  email text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);
create index if not exists shop_members_user_idx on shop_members (user_id);

create table if not exists subscriptions (
  id serial primary key,
  shop_id int not null unique references shops(id) on delete cascade,
  plan text not null,
  status text not null,
  phone text,
  current_period_end timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id serial primary key,
  shop_id int not null references shops(id) on delete cascade,
  plan text not null,
  amount_kes int not null,
  phone text not null,
  reference text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists payments_shop_idx on payments (shop_id);
