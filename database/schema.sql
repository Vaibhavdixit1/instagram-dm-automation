create extension if not exists pgcrypto;

create table if not exists instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  instagram_user_id text not null,
  instagram_username text not null,
  access_token text not null,
  token_expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, instagram_user_id)
);

create index if not exists instagram_accounts_user_id_idx on instagram_accounts (user_id);
create index if not exists instagram_accounts_instagram_user_id_idx on instagram_accounts (instagram_user_id);

create table if not exists keyword_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid not null references instagram_accounts(id) on delete cascade,
  name text not null,
  trigger_source text not null check (trigger_source in ('dm', 'comment')),
  match_type text not null default 'contains' check (match_type in ('contains', 'exact')),
  keywords jsonb not null default '[]'::jsonb,
  target_post_ids jsonb not null default '[]'::jsonb,
  comment_reply_options jsonb not null default '[]'::jsonb,
  first_message text not null,
  link_button_text text,
  link_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint keyword_rules_keywords_nonempty check (jsonb_typeof(keywords) = 'array' and jsonb_array_length(keywords) > 0),
  constraint keyword_rules_target_post_ids_array check (jsonb_typeof(target_post_ids) = 'array'),
  constraint keyword_rules_comment_reply_options_array check (jsonb_typeof(comment_reply_options) = 'array'),
  constraint keyword_rules_first_message_nonempty check (length(trim(first_message)) > 0),
  constraint keyword_rules_link_button_complete check (
    (link_button_text is null and link_url is null) or
    (length(trim(coalesce(link_button_text, ''))) > 0 and link_url ~* '^https?://')
  )
);

create index if not exists keyword_rules_user_id_idx on keyword_rules (user_id);
create index if not exists keyword_rules_account_id_idx on keyword_rules (account_id);
create index if not exists keyword_rules_is_active_idx on keyword_rules (is_active);

create table if not exists dm_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references instagram_accounts(id) on delete cascade,
  rule_id uuid references keyword_rules(id) on delete set null,
  sender_id text not null,
  trigger_source text not null check (trigger_source in ('dm', 'comment', 'button')),
  trigger_text text,
  raw_event jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dm_events_account_id_idx on dm_events (account_id);
create index if not exists dm_events_sender_id_idx on dm_events (sender_id);
create index if not exists dm_events_created_at_idx on dm_events (created_at desc);

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

create table if not exists dm_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid not null references instagram_accounts(id) on delete cascade,
  rule_id uuid references keyword_rules(id) on delete set null,
  recipient_id text not null,
  trigger_source text not null default 'dm' check (trigger_source in ('dm', 'comment', 'button')),
  trigger_text text,
  message_type text not null check (message_type in ('first_message', 'followup_message', 'link_message')),
  message_text text not null,
  link_button_text text,
  link_url text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  instagram_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists dm_logs_user_id_idx on dm_logs (user_id);
create index if not exists dm_logs_account_id_idx on dm_logs (account_id);
create index if not exists dm_logs_rule_id_idx on dm_logs (rule_id);
create index if not exists dm_logs_created_at_idx on dm_logs (created_at desc);
create index if not exists dm_logs_status_idx on dm_logs (status);
