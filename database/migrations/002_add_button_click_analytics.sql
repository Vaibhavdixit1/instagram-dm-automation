create table if not exists dm_button_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid not null references instagram_accounts(id) on delete cascade,
  rule_id uuid references keyword_rules(id) on delete set null,
  sender_id text not null,
  payload text not null,
  button_text text,
  button_url text,
  raw_event jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dm_button_clicks_user_id_idx on dm_button_clicks (user_id);
create index if not exists dm_button_clicks_account_id_idx on dm_button_clicks (account_id);
create index if not exists dm_button_clicks_rule_id_idx on dm_button_clicks (rule_id);
create index if not exists dm_button_clicks_created_at_idx on dm_button_clicks (created_at desc);
