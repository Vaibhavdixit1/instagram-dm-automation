# InboxOS

InboxOS is a basic Instagram automation MVP for creators. It connects an Instagram Business or Creator account, lets you create keyword rules, receives webhook events, and prepares automated DM delivery logs.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in the Instagram OAuth values described below, then start the app:

```bash
npm run dev
```

Open `http://localhost:3000/login`.

## Where To Find Instagram OAuth Values

Create or open your Meta app at `https://developers.facebook.com/apps`.

Use a **Business** type Meta app. The Instagram API with Instagram Login flow is for Instagram professional accounts, so the account you test with must be an Instagram Business or Creator account.

### `NEXT_PUBLIC_INSTAGRAM_APP_ID`

Use the **Instagram app ID**, not the general Facebook/Meta app ID.

Find it in:

```text
Meta Developers > Your app > Instagram > API setup with Instagram business login
```

Look for a value named **Instagram app ID**. This is the value Instagram expects as `client_id` for `https://www.instagram.com/oauth/authorize`.

If you use the top-level Facebook app ID here, Instagram can show:

```text
Invalid request: Request parameters are invalid: Invalid platform app
```

This value is public because the browser needs it to build the Instagram authorization URL.

### `INSTAGRAM_APP_ID`

Use the same value as `NEXT_PUBLIC_INSTAGRAM_APP_ID`.

This server-side copy is used by `/api/auth/instagram` when exchanging the OAuth code for an access token.

### `INSTAGRAM_APP_SECRET`

Use the **Instagram app secret** from the Instagram setup screen.

Find it in:

```text
Meta Developers > Your app > Instagram > API setup with Instagram business login
```

Look for a value named **Instagram app secret**. Keep this value server-side only. Do not prefix it with `NEXT_PUBLIC_`.

### `NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI`

Use the exact callback URL that Instagram should redirect to after login:

```text
https://localhost:3000/auth/callback
```

The redirect URI in `.env.local`, the redirect URI sent from the app, and the redirect URI configured in Meta must match exactly.

### `INSTAGRAM_REDIRECT_URI`

Use the same value as `NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI`.

This server-side copy is sent during the OAuth code exchange. Instagram rejects the exchange if it does not exactly match the URI used to start OAuth.

### `NEXT_PUBLIC_INSTAGRAM_CONFIG_ID`

This is optional.

If your Meta dashboard shows a Business Login configuration ID for Instagram Login, copy that value here. If you do not see one, leave it blank.

Look in:

```text
Meta Developers > Your app > Instagram > API setup with Instagram business login
```

### `INSTAGRAM_GRAPH_VERSION`

Use the Graph API version you want the app to call.

The default in `.env.example` is:

```text
v23.0
```

### `INSTAGRAM_VERIFY_TOKEN`

Create any random string yourself.

Use the same value in:

```text
.env.local
Meta Developers > Your app > Instagram webhooks setup > Verify token
```

The InsForge webhook verification endpoint is:

```text
https://<your-insforge-appkey>.functions.insforge.app/instagram-webhook
```

Use this URL in Meta's webhook callback configuration.

## Example `.env.local`

```bash
NEXT_PUBLIC_INSTAGRAM_APP_ID=your_instagram_app_id
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://localhost:3000/auth/callback
NEXT_PUBLIC_INSTAGRAM_CONFIG_ID=

INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=https://localhost:3000/auth/callback
INSTAGRAM_GRAPH_VERSION=v23.0

INSTAGRAM_VERIFY_TOKEN=replace_with_a_random_verify_token

NEXT_PUBLIC_INSFORGE_URL=
NEXT_PUBLIC_INSFORGE_ANON_KEY=
INSFORGE_PROJECT_URL=
INSFORGE_ANON_KEY=
INSFORGE_API_KEY=
```

## Where To Find InsForge Values

Create or open your InsForge project in the InsForge dashboard.

### `NEXT_PUBLIC_INSFORGE_URL`

Use your project's public app URL for browser-side InsForge auth.

Find it in:

```text
InsForge Dashboard > Your project > Settings > API
```

This should usually look like `https://your-project.region.insforge.app`.

### `NEXT_PUBLIC_INSFORGE_ANON_KEY`

Use your project's anonymous/public API key for browser-side InsForge auth.

Find it in:

```text
InsForge Dashboard > Your project > Settings > API > API Keys
```

This value is public by design and is used by `@insforge/sdk` to create and refresh the signed-in browser session.

### `INSFORGE_PROJECT_URL`

Use your project's API URL.

Find it in:

```text
InsForge Dashboard > Your project > Settings > API
```

Look for a value named **Project URL**, **API URL**, or **PostgREST URL**. Server-side routes use it for InsForge database records access.

### `INSFORGE_ANON_KEY`

Use your project's anonymous/public API key.

Find it in:

```text
InsForge Dashboard > Your project > Settings > API > API Keys
```

Look for a key named **anon**, **anonymous**, or **public**. Server-side routes may use it as a fallback for records access when `INSFORGE_API_KEY` is unavailable.

### `INSFORGE_API_KEY`

Use your project's InsForge API key.

Find it in:

```text
InsForge Dashboard > Your project > Settings > API > API Keys
```

Look for a key named **API key**. In InsForge Edge Functions this is also available as the reserved `API_KEY` secret.

Keep this value server-side only. Do not expose it in browser code and do not prefix it with `NEXT_PUBLIC_`.

Use it only in API routes or edge functions that need backend database access, such as upserting connected Instagram accounts, writing webhook events, and inserting delivery logs.

## InsForge Backend Setup

Apply the database schema in `database/schema.sql` to your InsForge Postgres database before testing OAuth, rules, or webhooks.

The Next.js API routes use the InsForge records API directly:

```text
INSFORGE_PROJECT_URL + /api/database/records
```

If your `INSFORGE_PROJECT_URL` already includes `/api/database/records`, the app will use it as-is. Otherwise it appends `/api/database/records`.

The current backend responsibilities are:

- InsForge Auth: signs users in with email/password and verifies email by the configured code or link method.
- `/api/auth/instagram`: exchanges Instagram OAuth after the user is signed in.
- `/auth/callback`: handles InsForge auth callbacks and Instagram connection callbacks.
- `/api/state`: syncs connected accounts and keyword rules into InsForge under the signed-in InsForge user id.
- `instagram-webhook` InsForge Edge Function: reads `instagram_accounts` and `keyword_rules`, sends Instagram DMs, inserts `dm_events` and `dm_logs`.
- `/api/logs`: reads `dm_logs` from InsForge.

The browser still keeps lightweight UI state in `localStorage`, but webhook processing and delivery logs now use InsForge as the backend source of truth.

## Meta App Checklist

1. Create a Business type Meta app.
2. Add the Instagram product.
3. Complete `Instagram > API setup with Instagram business login`.
4. Copy the Instagram app ID and Instagram app secret from that Instagram setup screen into `.env.local`.
5. In Instagram setup, configure `https://localhost:3000/auth/callback` as a valid OAuth redirect URI.
6. Request or enable these scopes:
   - `instagram_business_basic`
   - `instagram_business_manage_messages`
   - `instagram_business_manage_comments`
   - `instagram_business_content_publish`
   - `instagram_business_manage_insights`
7. Add your Instagram Business or Creator account as a tester/developer while the app is in development mode.
8. Restart `npm run dev` after changing `.env.local`.

If your local server is not reachable at `https://localhost:3000`, use a public HTTPS tunnel such as ngrok and update both Meta and `.env.local` to the exact tunnel callback URL.

## Useful Commands

```bash
npm run typecheck
npm run build
```

## Testing Webhooks And Auto DMs

The webhook endpoint is:

```text
https://<your-insforge-appkey>.functions.insforge.app/instagram-webhook
```

Use the same verify token in Meta and `.env.local`:

```bash
INSTAGRAM_VERIFY_TOKEN=replace_with_a_random_verify_token
```

The deployed InsForge Edge Function must also have these secrets:

```bash
npx @insforge/cli secrets add INSTAGRAM_VERIFY_TOKEN "replace_with_a_random_verify_token"
npx @insforge/cli secrets add INSTAGRAM_GRAPH_VERSION "v23.0"
```

Redeploy the function after changing its code:

```bash
npx @insforge/cli functions deploy instagram-webhook --file insforge/functions/instagram-webhook/index.ts
```

After connecting Instagram and creating a rule, refresh the app once so the browser syncs the connected account and rules to InsForge. The webhook processor can then:

1. Receive DM and comment webhook events.
2. Find the active connected Instagram account.
3. Match active keyword rules by trigger source and keyword.
4. Send the rule's DM text through Instagram's Send API.
5. Write success or failure records to delivery logs.

For DMs, the recipient is the webhook sender's Instagram-scoped user ID. For comment private replies, Instagram expects the comment ID as the recipient.

## Current Auth Flow

1. `/login` signs users in or creates accounts through InsForge email auth.
2. If InsForge requires email verification, the UI follows the configured `code` or `link` method.
3. Once signed in, the app stores the real InsForge user id in local app state.
4. `/accounts` starts Instagram OAuth to connect a Business or Creator account.
5. Instagram redirects back to `/auth/callback?code=...&state=...`.
6. `/auth/callback` validates `state` and posts the code to `/api/auth/instagram`.
7. `/api/auth/instagram` exchanges the code for an Instagram access token and profile.
8. The connected Instagram account syncs to InsForge using the signed-in InsForge user id.

The database schema for the production InsForge tables is in `database/schema.sql`.
