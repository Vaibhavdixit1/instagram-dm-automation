import type {
  DmButtonClick,
  DmEvent,
  DmLog,
  InstagramAccount,
  KeywordRule,
  RuleAnalytics,
  UserSession,
} from "./types";
import { stableUuid } from "./stable-id";

type PostgrestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  prefer?: string;
};

type InstagramAccountRow = {
  id: string;
  user_id: string;
  instagram_user_id: string;
  instagram_username: string;
  access_token: string;
  token_expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type KeywordRuleRow = {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  trigger_source: "dm" | "comment";
  match_type: "contains" | "exact";
  keywords: string[];
  target_post_ids: string[];
  comment_reply_options: string[];
  first_message: string;
  link_button_text: string | null;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type DmLogRow = {
  id: string;
  user_id: string;
  account_id: string;
  rule_id: string | null;
  recipient_id: string;
  trigger_source: "dm" | "comment" | "button";
  trigger_text: string | null;
  message_type: "first_message" | "followup_message" | "link_message";
  message_text: string;
  link_button_text: string | null;
  link_url: string | null;
  status: "pending" | "sent" | "failed";
  instagram_message_id: string | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
};

type DmButtonClickRow = {
  id: string;
  user_id: string;
  account_id: string;
  rule_id: string | null;
  sender_id: string;
  payload: string;
  button_text: string | null;
  button_url: string | null;
  raw_event: unknown;
  created_at: string;
};

type DmEventAnalyticsRow = {
  rule_id: string | null;
  trigger_source: "dm" | "comment" | "button";
  created_at: string;
};

type DmLogAnalyticsRow = {
  rule_id: string | null;
  status: "pending" | "sent" | "failed";
  created_at: string;
  sent_at: string | null;
};

type DmButtonClickAnalyticsRow = {
  rule_id: string | null;
  created_at: string;
};

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function recordsBaseUrl() {
  const base = env("INSFORGE_PROJECT_URL").replace(/\/$/, "");
  if (base.endsWith("/api/database/records")) {
    return base;
  }

  return `${base}/api/database/records`;
}

async function postgrest<T>(path: string, options: PostgrestOptions = {}) {
  const key = process.env.INSFORGE_API_KEY ?? process.env.API_KEY ?? process.env.INSFORGE_ANON_KEY;
  if (!key) {
    throw new Error("Missing INSFORGE_API_KEY or INSFORGE_ANON_KEY");
  }

  const response = await fetch(`${recordsBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : `InsForge request failed: ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return payload as T;
}

function inFilter(ids: string[]) {
  return `(${ids.join(",")})`;
}

export function dbUserId(userId: string) {
  return stableUuid(`user:${userId}`);
}

export function dbAccountId(accountId: string) {
  return stableUuid(`account:${accountId}`);
}

export function dbRuleId(ruleId: string) {
  return stableUuid(`rule:${ruleId}`);
}

export function dbLogId(logId: string) {
  return stableUuid(`log:${logId}`);
}

export function dbEventId(eventId: string) {
  return stableUuid(`event:${eventId}`);
}

function accountRow(account: InstagramAccount): InstagramAccountRow {
  return {
    id: dbAccountId(account.id),
    user_id: dbUserId(account.userId),
    instagram_user_id: account.instagramUserId,
    instagram_username: account.instagramUsername,
    access_token: account.accessToken,
    token_expires_at: account.tokenExpiresAt,
    is_active: account.isActive,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
  };
}

function ruleRow(rule: KeywordRule): KeywordRuleRow {
  return {
    id: dbRuleId(rule.id),
    user_id: dbUserId(rule.userId),
    account_id: dbAccountId(rule.accountId),
    name: rule.name,
    trigger_source: rule.triggerSource,
    match_type: rule.matchType,
    keywords: rule.keywords,
    target_post_ids: rule.targetPostIds,
    comment_reply_options: rule.commentReplyOptions,
    first_message: rule.firstMessage,
    link_button_text: rule.linkButtonText,
    link_url: rule.linkUrl,
    is_active: rule.isActive,
    created_at: rule.createdAt,
    updated_at: rule.updatedAt,
  };
}

export function accountFromRow(row: InstagramAccountRow): InstagramAccount {
  return {
    id: row.id,
    userId: row.user_id,
    instagramUserId: row.instagram_user_id,
    instagramUsername: row.instagram_username,
    accessToken: row.access_token,
    tokenExpiresAt: row.token_expires_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function ruleFromRow(row: KeywordRuleRow): KeywordRule {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    name: row.name,
    triggerSource: row.trigger_source,
    matchType: row.match_type,
    keywords: row.keywords,
    targetPostIds: row.target_post_ids ?? [],
    commentReplyOptions: row.comment_reply_options ?? [],
    firstMessage: row.first_message,
    linkButtonText: row.link_button_text ?? null,
    linkUrl: row.link_url ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function logFromRow(row: DmLogRow): DmLog {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    ruleId: row.rule_id,
    recipientId: row.recipient_id,
    triggerSource: row.trigger_source ?? "dm",
    triggerText: row.trigger_text ?? "",
    messageType: row.message_type,
    messageText: row.message_text,
    linkButtonText: row.link_button_text ?? null,
    linkUrl: row.link_url ?? null,
    status: row.status,
    instagramMessageId: row.instagram_message_id,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    sentAt: row.sent_at,
  };
}

export function buttonClickFromRow(row: DmButtonClickRow): DmButtonClick {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    ruleId: row.rule_id,
    senderId: row.sender_id,
    payload: row.payload,
    buttonText: row.button_text,
    buttonUrl: row.button_url,
    rawEvent: row.raw_event,
    createdAt: row.created_at,
  };
}

export async function upsertInsforgeAccount(session: UserSession, account: InstagramAccount) {
  await postgrest<InstagramAccountRow[]>("/instagram_accounts?on_conflict=id", {
    method: "POST",
    body: accountRow({ ...account, userId: session.id }),
    prefer: "resolution=merge-duplicates,return=representation",
  });
}

export async function syncInsforgeState(state: {
  session: UserSession | null;
  accounts: InstagramAccount[];
  rules: KeywordRule[];
}) {
  if (!state.session) {
    return;
  }

  const accounts = state.accounts.map((account) => accountRow({ ...account, userId: state.session!.id }));
  const rules = state.rules.map((rule) => ruleRow({ ...rule, userId: state.session!.id }));

  if (accounts.length) {
    await postgrest<InstagramAccountRow[]>("/instagram_accounts?on_conflict=id", {
      method: "POST",
      body: accounts,
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  }

  if (rules.length) {
    await postgrest<KeywordRuleRow[]>("/keyword_rules?on_conflict=id", {
      method: "POST",
      body: rules,
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  }

  const userId = dbUserId(state.session.id);
  const accountIds = accounts.map((account) => account.id);
  const ruleIds = rules.map((rule) => rule.id);

  await postgrest(
    accountIds.length
      ? `/instagram_accounts?user_id=eq.${userId}&id=not.in.${inFilter(accountIds)}`
      : `/instagram_accounts?user_id=eq.${userId}`,
    {
      method: "PATCH",
      body: { is_active: false, updated_at: new Date().toISOString() },
      prefer: "return=minimal",
    },
  );

  await postgrest(
    ruleIds.length
      ? `/keyword_rules?user_id=eq.${userId}&id=not.in.${inFilter(ruleIds)}`
      : `/keyword_rules?user_id=eq.${userId}`,
    {
      method: "PATCH",
      body: { is_active: false, updated_at: new Date().toISOString() },
      prefer: "return=minimal",
    },
  );
}

export async function listInsforgeLogs() {
  const rows = await postgrest<DmLogRow[]>("/dm_logs?select=*&order=created_at.desc&limit=100");
  return rows.map(logFromRow);
}

function emptyRuleAnalytics(ruleId: string): RuleAnalytics {
  return {
    ruleId,
    events: 0,
    dmEvents: 0,
    commentEvents: 0,
    buttonEvents: 0,
    sent: 0,
    failed: 0,
    clicks: 0,
    lastEventAt: null,
    lastSentAt: null,
    lastClickAt: null,
  };
}

function latestTimestamp(current: string | null, incoming: string | null) {
  if (!incoming) {
    return current;
  }

  if (!current || new Date(incoming).getTime() > new Date(current).getTime()) {
    return incoming;
  }

  return current;
}

export async function listRuleAnalytics() {
  const [events, logs, clicks] = await Promise.all([
    postgrest<DmEventAnalyticsRow[]>("/dm_events?select=rule_id,trigger_source,created_at&rule_id=not.is.null&order=created_at.desc&limit=5000"),
    postgrest<DmLogAnalyticsRow[]>("/dm_logs?select=rule_id,status,created_at,sent_at&rule_id=not.is.null&order=created_at.desc&limit=5000"),
    postgrest<DmButtonClickAnalyticsRow[]>("/dm_button_clicks?select=rule_id,created_at&rule_id=not.is.null&order=created_at.desc&limit=5000"),
  ]);
  const analytics = new Map<string, RuleAnalytics>();

  const getAnalytics = (ruleId: string) => {
    const existing = analytics.get(ruleId);
    if (existing) {
      return existing;
    }

    const next = emptyRuleAnalytics(ruleId);
    analytics.set(ruleId, next);
    return next;
  };

  for (const event of events) {
    if (!event.rule_id) {
      continue;
    }

    const item = getAnalytics(event.rule_id);
    item.events += 1;
    item.lastEventAt = latestTimestamp(item.lastEventAt, event.created_at);
    if (event.trigger_source === "dm") {
      item.dmEvents += 1;
    } else if (event.trigger_source === "comment") {
      item.commentEvents += 1;
    } else if (event.trigger_source === "button") {
      item.buttonEvents += 1;
    }
  }

  for (const log of logs) {
    if (!log.rule_id) {
      continue;
    }

    const item = getAnalytics(log.rule_id);
    if (log.status === "sent") {
      item.sent += 1;
      item.lastSentAt = latestTimestamp(item.lastSentAt, log.sent_at ?? log.created_at);
    } else if (log.status === "failed") {
      item.failed += 1;
    }
  }

  for (const click of clicks) {
    if (!click.rule_id) {
      continue;
    }

    const item = getAnalytics(click.rule_id);
    item.clicks += 1;
    item.lastClickAt = latestTimestamp(item.lastClickAt, click.created_at);
  }

  return [...analytics.values()];
}

export async function getInsforgeWebhookState(instagramUserId: string) {
  const accountRows = await postgrest<InstagramAccountRow[]>(
    `/instagram_accounts?instagram_user_id=eq.${encodeURIComponent(instagramUserId)}&is_active=eq.true&limit=1`,
  );
  const account = accountRows[0] ? accountFromRow(accountRows[0]) : null;

  if (!account) {
    return { account: null, rules: [] as KeywordRule[] };
  }

  const ruleRows = await postgrest<KeywordRuleRow[]>(
    `/keyword_rules?account_id=eq.${encodeURIComponent(account.id)}&is_active=eq.true`,
  );

  return { account, rules: ruleRows.map(ruleFromRow) };
}

export async function insertInsforgeEvent(event: Omit<DmEvent, "id" | "createdAt">) {
  const id = dbEventId(`${event.accountId}:${event.senderId}:${Date.now()}`);
  await postgrest("/dm_events", {
    method: "POST",
    body: {
      id,
      account_id: event.accountId,
      rule_id: event.ruleId,
      sender_id: event.senderId,
      trigger_source: event.triggerSource,
      trigger_text: event.triggerText,
      raw_event: event.rawEvent,
    },
    prefer: "return=minimal",
  });
}

export async function insertInsforgeButtonClick(click: Omit<DmButtonClick, "id" | "createdAt">) {
  const id = dbEventId(`${click.accountId}:${click.senderId}:${click.payload}:${Date.now()}`);
  const rows = await postgrest<DmButtonClickRow[]>("/dm_button_clicks", {
    method: "POST",
    body: {
      id,
      user_id: click.userId,
      account_id: click.accountId,
      rule_id: click.ruleId,
      sender_id: click.senderId,
      payload: click.payload,
      button_text: click.buttonText,
      button_url: click.buttonUrl,
      raw_event: click.rawEvent,
    },
    prefer: "return=representation",
  });

  return buttonClickFromRow(rows[0]);
}

export async function insertInsforgeLog(log: Omit<DmLog, "id" | "createdAt">) {
  const id = dbLogId(`${log.accountId}:${log.recipientId}:${Date.now()}:${log.status}`);
  const rows = await postgrest<DmLogRow[]>("/dm_logs", {
    method: "POST",
    body: {
      id,
      user_id: log.userId,
      account_id: log.accountId,
      rule_id: log.ruleId,
      recipient_id: log.recipientId,
      trigger_source: log.triggerSource,
      trigger_text: log.triggerText,
      message_type: log.messageType,
      message_text: log.messageText,
      link_button_text: log.linkButtonText,
      link_url: log.linkUrl,
      status: log.status,
      instagram_message_id: log.instagramMessageId,
      error_message: log.errorMessage,
      sent_at: log.sentAt,
    },
    prefer: "return=representation",
  });
  return logFromRow(rows[0]);
}
