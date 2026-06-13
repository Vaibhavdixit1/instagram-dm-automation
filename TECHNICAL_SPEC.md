# InboxOS Technical Specification

## 1. Product Summary

InboxOS is a ManyChat style basic Instagram automation app for creators who want to send automatic DM replies when followers use specific keywords.

## 2. MVP Scope

The MVP lets a user:

- Sign in by connecting an Instagram Business or Creator account.
- View connected Instagram accounts.
- Create simple keyword automation rules.
- Receive Instagram webhook events for DMs and comments.
- Match incoming text against rule keywords.
- Send an automated Instagram DM response.
- View basic delivery logs.

## 3. Technology Stack

- Frontend: Next.js App Router
- Language: TypeScript
- UI: React + Tailwind CSS
- Backend platform: InsForge
- Database: InsForge Postgres/PostgREST
- Auth: InsForge auth
- Edge functions: InsForge edge functions
- External APIs:
  - Instagram OAuth
  - Instagram Graph API
  - Instagram Messenger API for Instagram

## 4. Frontend Routes

### `/login`

Public route.

Responsibilities:

- Show product name: InboxOS.
- Show a single Instagram OAuth button.
- Redirect authenticated users to `/dashboard`.

OAuth URL:

```text
https://www.instagram.com/oauth/authorize
```

Required scopes:

```text
instagram_business_basic
instagram_business_manage_messages
```

### `/auth/callback`

Public route used only after Instagram OAuth.

Responsibilities:

- Read `code` from the URL.
- Call backend API route `/api/auth/instagram`.
- Sign into InsForge.
- Upsert the connected Instagram account.
- Redirect to `/dashboard`.

### `/dashboard`

Protected route.

Show a basic overview:

- Connected accounts count.
- Active rules count.
- DMs sent today count.
- Total DMs sent count.

### `/accounts`

Protected route.

Show connected Instagram accounts:

- Username.
- Instagram user ID.
- Connection status.
- Connected date.

Allowed actions:

- Disable account.
- Delete account.

### `/rules`

Protected route.

Show a simple table of keyword rules.

Allowed actions:

- Create rule.
- Edit rule.
- Pause/resume rule.
- Delete rule.

Create/edit rule fields:

- Rule name.
- Instagram account.
- Trigger source: `dm` or `comment`.
- Match type: `contains` or `exact`.
- Keywords: one or more words/phrases.
- DM message text.

### `/logs`

Protected route.

Show delivery logs:

- Created time.
- Instagram account.
- Rule.
- Trigger source.
- Trigger text.
- Recipient ID.
- Status.
- Error message if failed.

## 5. Data Model

### `instagram_accounts`

Stores connected Instagram accounts.

Columns:

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null
instagram_user_id text not null
instagram_username text not null
access_token text not null
token_expires_at timestamptz
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Constraints:

```sql
unique (user_id, instagram_user_id)
```

Indexes:

```sql
create index on instagram_accounts (user_id);
create index on instagram_accounts (instagram_user_id);
```

### `keyword_rules`

Stores automation rules.

Columns:

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null
account_id uuid not null references instagram_accounts(id) on delete cascade
name text not null
trigger_source text not null check (trigger_source in ('dm', 'comment'))
match_type text not null default 'contains' check (match_type in ('contains', 'exact'))
keywords jsonb not null default '[]'::jsonb
first_message text not null
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

`keywords` shape:

```json
["pricing", "price", "cost"]
```

Validation:

- `keywords` must contain at least one keyword.
- `first_message` is required.

Indexes:

```sql
create index on keyword_rules (user_id);
create index on keyword_rules (account_id);
create index on keyword_rules (is_active);
```

### `dm_events`

Stores inbound trigger events for audit/debugging.

Columns:

```sql
id uuid primary key default gen_random_uuid()
account_id uuid not null references instagram_accounts(id) on delete cascade
rule_id uuid references keyword_rules(id) on delete set null
sender_id text not null
trigger_source text not null check (trigger_source in ('dm', 'comment', 'button'))
trigger_text text
raw_event jsonb
created_at timestamptz not null default now()
```

Indexes:

```sql
create index on dm_events (account_id);
create index on dm_events (sender_id);
create index on dm_events (created_at desc);
```

### `dm_logs`

Stores outbound message delivery attempts.

Columns:

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null
account_id uuid not null references instagram_accounts(id) on delete cascade
rule_id uuid references keyword_rules(id) on delete set null
recipient_id text not null
message_type text not null check (message_type in ('first_message', 'followup_message', 'link_message'))
message_text text not null
status text not null default 'pending' check (status in ('pending', 'sent', 'failed'))
instagram_message_id text
error_message text
created_at timestamptz not null default now()
sent_at timestamptz
```

Indexes:

```sql
create index on dm_logs (user_id);
create index on dm_logs (account_id);
create index on dm_logs (rule_id);
create index on dm_logs (created_at desc);
create index on dm_logs (status);
```

## 6. Auth Design

Use InsForge auth as the application auth layer.

Recommended approach:

- Instagram OAuth identifies the Instagram account.
- Server exchanges Instagram code for an access token.
- Server resolves Instagram account identity.
- App creates or signs into an InsForge user tied to the Instagram account.
- Store the Instagram access token in `instagram_accounts`.

## 7. Edge Functions

### `instagram-auth`

Purpose:

- Verify Instagram access token.
- Fetch Instagram account metadata.
- Return app auth credentials or create the app user server-side.

Recommended response:

```json
{
  "email": "ig_1784...@users.InboxOS.app",
  "password": "derived_secure_password",
  "igAccount": {
    "instagramUserId": "1784...",
    "username": "creatorname",
    "accessToken": "token"
  }
}
```

### `instagram-webhook`

Purpose:

- Verify Instagram webhook subscription.
- Receive DM, comment, and postback events.
- Normalize inbound text.
- Find active matching rules.
- Send outbound DM messages.
- Write `dm_events` and `dm_logs`.

Webhook verification:

- Compare `hub.verify_token` with `INSTAGRAM_VERIFY_TOKEN`.
- Return `hub.challenge` on success.

Inbound event handling:

1. Identify Instagram account from webhook event.
2. Load active account.
3. Extract sender ID and message/comment text.
4. Determine trigger source: `dm`, `comment`, or `button`.
5. Match rules by account, source, active status, and keywords.
6. Send first message or follow-up message.
7. Write delivery log.
8. Return `200` quickly.
