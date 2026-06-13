type TriggerSource = "dm" | "comment" | "button";
type RuleTriggerSource = "dm" | "comment";

type NormalizedEvent = {
  instagramUserId: string | null;
  senderId: string | null;
  recipientId: string | null;
  mediaId: string | null;
  triggerSource: TriggerSource;
  triggerText: string;
  rawEvent: unknown;
};

type LinkButton = {
  title: string;
  url: string;
};

type ButtonClickPayload = {
  ruleId: string | null;
  buttonText: string | null;
};

type SentryErrorContext = {
  operation: "instagram_dm_send" | "instagram_comment_reply";
  runtime: "insforge_edge";
  accountId: string;
  ruleId: string;
  recipientId: string | null;
  triggerSource: string;
  triggerText: string;
  instagramUserId: string | null;
  senderId: string | null;
  mediaId: string | null;
  messageText?: string;
  commentReply?: string;
  linkButtonText?: string | null;
  linkUrl?: string | null;
  logId?: string | null;
};

type InstagramAccount = {
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

type KeywordRule = {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  trigger_source: RuleTriggerSource;
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

function env(name: string) {
  return Deno.env.get(name) ?? "";
}

function recordsBaseUrl() {
  const explicit = env("INSFORGE_RECORDS_URL");
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const projectUrl =
    env("INSFORGE_PROJECT_URL") ||
    env("INSFORGE_BASE_URL") ||
    env("INSFORGE_INTERNAL_URL") ||
    env("SUPABASE_URL") ||
    env("PROJECT_URL");
  const base = projectUrl.replace(/\/$/, "");
  if (base.endsWith("/api/database/records")) {
    return base;
  }

  return `${base}/api/database/records`;
}

function serviceKey() {
  return (
    env("INSFORGE_API_KEY") ||
    env("API_KEY") ||
    env("INSFORGE_ANON_KEY") ||
    env("ANON_KEY")
  );
}

function sentryEndpoint(dsnValue: string) {
  try {
    const dsn = new URL(dsnValue);
    const publicKey = dsn.username;
    const pathParts = dsn.pathname.split("/").filter(Boolean);
    const projectId = pathParts.at(-1);
    const basePath = pathParts.slice(0, -1).join("/");

    if (!publicKey || !projectId) {
      return null;
    }

    const pathPrefix = basePath ? `/${basePath}` : "";
    return `${dsn.protocol}//${dsn.host}${pathPrefix}/api/${projectId}/store/?sentry_key=${publicKey}&sentry_version=7`;
  } catch {
    return null;
  }
}

function sentryEventId() {
  return crypto.randomUUID().replaceAll("-", "");
}

function errorValue(error: unknown) {
  if (error instanceof Error) {
    return {
      type: error.name,
      value: error.message,
      stack: error.stack,
    };
  }

  return {
    type: "Error",
    value: typeof error === "string" ? error : "Unknown webhook delivery error",
    stack: undefined,
  };
}

async function captureWebhookDeliveryError(error: unknown, context: SentryErrorContext) {
  const endpoint = env("SENTRY_DSN") ? sentryEndpoint(env("SENTRY_DSN")) : null;
  if (!endpoint) {
    return;
  }

  const normalizedError = errorValue(error);
  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_id: sentryEventId(),
      timestamp: new Date().toISOString(),
      platform: "javascript",
      level: "error",
      logger: "inboxos.instagram_webhook",
      environment: env("SENTRY_ENVIRONMENT") || env("DENO_DEPLOYMENT_ID") || undefined,
      release: env("SENTRY_RELEASE") || undefined,
      transaction: context.operation,
      message: `${context.operation} failed: ${normalizedError.value}`,
      exception: {
        values: [
          {
            type: normalizedError.type,
            value: normalizedError.value,
          },
        ],
      },
      tags: {
        operation: context.operation,
        runtime: context.runtime,
        account_id: context.accountId,
        rule_id: context.ruleId,
        trigger_source: context.triggerSource,
      },
      extra: {
        ...context,
        stack: normalizedError.stack,
      },
    }),
  }).catch(() => null);
}

async function postgrest<T>(path: string, init: RequestInit = {}) {
  const key = serviceKey();
  if (!key) {
    throw new Error("Missing INSFORGE_API_KEY or API_KEY secret");
  }

  const response = await fetch(`${recordsBaseUrl()}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `InsForge request failed: ${response.status}`);
  }

  return payload as T;
}

function normalizeWebhookEvent(payload: unknown): NormalizedEvent[] {
  const entries = typeof payload === "object" && payload && "entry" in payload ? (payload.entry as unknown[]) : [];

  return entries.flatMap((entry) => {
    const entryObject = entry as Record<string, unknown>;
    const instagramUserId = typeof entryObject.id === "string" ? entryObject.id : null;
    const messaging = Array.isArray(entryObject.messaging) ? entryObject.messaging : [];
    const changes = Array.isArray(entryObject.changes) ? entryObject.changes : [];

    const messages = messaging.map((item) => {
      const event = item as Record<string, Record<string, unknown>>;
      const sender = event.sender as Record<string, unknown> | undefined;
      const recipient = event.recipient as Record<string, unknown> | undefined;
      const message = event.message as Record<string, unknown> | undefined;
      const postback = event.postback as Record<string, unknown> | undefined;

      return {
        instagramUserId: typeof recipient?.id === "string" ? recipient.id : instagramUserId,
        senderId: typeof sender?.id === "string" ? sender.id : null,
        recipientId: typeof sender?.id === "string" ? sender.id : null,
        mediaId: null,
        triggerSource: postback ? "button" : "dm",
        triggerText:
          (typeof message?.text === "string" ? message.text : null) ??
          (typeof postback?.payload === "string" ? postback.payload : ""),
        rawEvent: item,
      } satisfies NormalizedEvent;
    });

    const comments = changes.map((item) => {
      const change = item as Record<string, unknown>;
      const value = change.value as Record<string, unknown> | undefined;
      const from = value?.from as Record<string, unknown> | undefined;
      const media = value?.media as Record<string, unknown> | undefined;

      return {
        instagramUserId,
        senderId: typeof from?.id === "string" ? from.id : null,
        recipientId: typeof value?.id === "string" ? value.id : typeof from?.id === "string" ? from.id : null,
        mediaId:
          (typeof media?.id === "string" ? media.id : null) ??
          (typeof value?.media_id === "string" ? value.media_id : null),
        triggerSource: "comment",
        triggerText: typeof value?.text === "string" ? value.text : "",
        rawEvent: item,
      } satisfies NormalizedEvent;
    });

    return [...messages, ...comments];
  });
}

function isRuleTriggerSource(source: TriggerSource): source is RuleTriggerSource {
  return source === "dm" || source === "comment";
}

function ruleMatches(rule: KeywordRule, event: NormalizedEvent) {
  if (!isRuleTriggerSource(event.triggerSource) || rule.trigger_source !== event.triggerSource) {
    return false;
  }

  const targetPostIds = rule.target_post_ids ?? [];
  if (rule.trigger_source === "comment" && targetPostIds.length > 0) {
    return Boolean(event.mediaId && targetPostIds.includes(event.mediaId));
  }

  const text = event.triggerText.trim().toLowerCase();
  if (!text) {
    return false;
  }

  return rule.keywords.some((keyword) => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return false;
    }

    return rule.match_type === "exact" ? text === normalizedKeyword : text.includes(normalizedKeyword);
  });
}

function parseButtonClickPayload(payload: string): ButtonClickPayload {
  const [prefix, ruleId, buttonText] = payload.split(":");
  if (prefix !== "QDM_LINK") {
    return { ruleId: null, buttonText: null };
  }

  return {
    ruleId: ruleId || null,
    buttonText: buttonText || null,
  };
}

function findButtonRule(rules: KeywordRule[], payload: string) {
  const parsed = parseButtonClickPayload(payload);
  if (parsed.ruleId) {
    const exactRule = rules.find((rule) => rule.id === parsed.ruleId);
    if (exactRule) {
      return { rule: exactRule, buttonText: parsed.buttonText };
    }
  }

  const normalizedButtonText = parsed.buttonText?.trim().toLowerCase();
  if (normalizedButtonText) {
    const textRule = rules.find((rule) => rule.link_button_text?.trim().toLowerCase() === normalizedButtonText);
    if (textRule) {
      return { rule: textRule, buttonText: parsed.buttonText };
    }
  }

  return { rule: null, buttonText: parsed.buttonText };
}

async function getWebhookState(instagramUserId: string) {
  const accountRows = await postgrest<InstagramAccount[]>(
    `/instagram_accounts?instagram_user_id=eq.${encodeURIComponent(instagramUserId)}&is_active=eq.true&limit=1`,
  );
  const account = accountRows[0] ?? null;

  if (!account) {
    return { account: null, rules: [] as KeywordRule[] };
  }

  const rules = await postgrest<KeywordRule[]>(
    `/keyword_rules?account_id=eq.${account.id}&is_active=eq.true`,
  );
  return { account, rules };
}

async function sendInstagramDm(
  account: InstagramAccount,
  recipientId: string,
  messageText: string,
  triggerSource: TriggerSource,
  linkButton: LinkButton | null,
) {
  const graphVersion = env("INSTAGRAM_GRAPH_VERSION") || "v23.0";
  const response = await fetch(`https://graph.instagram.com/${graphVersion}/me/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: triggerSource === "comment" ? { comment_id: recipientId } : { id: recipientId },
      message: linkButton
        ? {
            attachment: {
              type: "template",
              payload: {
                template_type: "button",
                text: messageText,
                buttons: [
                  {
                    type: "web_url",
                    url: linkButton.url,
                    title: linkButton.title,
                  },
                ],
              },
            },
          }
        : { text: messageText },
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.message_id) {
    throw new Error(payload.error?.message ?? "Instagram Send API did not return a message ID.");
  }

  return payload.message_id as string;
}

async function sendCommentReply(account: InstagramAccount, commentId: string, messageText: string) {
  const graphVersion = env("INSTAGRAM_GRAPH_VERSION") || "v23.0";
  const response = await fetch(`https://graph.instagram.com/${graphVersion}/${commentId}/replies`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: messageText }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.message ?? "Instagram comment reply API did not return a reply ID.");
  }

  return payload.id as string;
}

function randomCommentReply(rule: KeywordRule) {
  const options = (rule.comment_reply_options ?? [])
    .map((option) => option.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!options.length) {
    return null;
  }

  return options[Math.floor(Math.random() * options.length)];
}

function getRuleLinkButton(rule: KeywordRule): LinkButton | null {
  const url = rule.link_url?.trim();
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }

  return {
    title: (rule.link_button_text?.trim() || "Open link").slice(0, 20),
    url,
  };
}

async function insertEvent(params: {
  account: InstagramAccount;
  rule: KeywordRule | null;
  event: NormalizedEvent;
}) {
  if (!params.event.senderId) {
    return;
  }

  await postgrest("/dm_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      account_id: params.account.id,
      rule_id: params.rule?.id ?? null,
      sender_id: params.event.senderId,
      trigger_source: params.event.triggerSource,
      trigger_text: params.event.triggerText,
      raw_event: params.event.rawEvent,
    }),
  });
}

async function insertButtonClick(params: {
  account: InstagramAccount;
  rule: KeywordRule | null;
  event: NormalizedEvent;
  buttonText: string | null;
}) {
  if (!params.event.senderId) {
    return null;
  }

  const rows = await postgrest<{ id: string }[]>("/dm_button_clicks", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: params.rule?.user_id ?? params.account.user_id,
      account_id: params.account.id,
      rule_id: params.rule?.id ?? null,
      sender_id: params.event.senderId,
      payload: params.event.triggerText,
      button_text: params.buttonText ?? params.rule?.link_button_text ?? null,
      button_url: params.rule?.link_url ?? null,
      raw_event: params.event.rawEvent,
    }),
  });

  return rows[0]?.id ?? null;
}

async function insertLog(params: {
  account: InstagramAccount;
  rule: KeywordRule;
  event: NormalizedEvent;
  status: "sent" | "failed";
  instagramMessageId: string | null;
  errorMessage: string | null;
  linkButton: LinkButton | null;
}) {
  const rows = await postgrest<{ id: string }[]>("/dm_logs", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: params.rule.user_id,
      account_id: params.account.id,
      rule_id: params.rule.id,
      recipient_id: params.event.recipientId,
      trigger_source: params.event.triggerSource,
      trigger_text: params.event.triggerText,
      message_type: params.linkButton ? "link_message" : "first_message",
      message_text: params.rule.first_message,
      link_button_text: params.linkButton?.title ?? null,
      link_url: params.linkButton?.url ?? null,
      status: params.status,
      instagram_message_id: params.instagramMessageId,
      error_message: params.errorMessage,
      sent_at: params.status === "sent" ? new Date().toISOString() : null,
    }),
  });
  return rows[0]?.id ?? null;
}

export default async function handler(request: Request) {
  const url = new URL(request.url);

  if (request.method === "GET") {
    const verifyToken = env("INSTAGRAM_VERIFY_TOKEN");
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (verifyToken && mode === "subscribe" && token === verifyToken && challenge) {
      return new Response(challenge, { status: 200 });
    }

    return Response.json({ error: "Invalid verification token" }, { status: 403 });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const payload = await request.json().catch(() => null);
  const events = normalizeWebhookEvent(payload);
  const processed = [];

  try {
    for (const event of events) {
      if (!event.instagramUserId) {
        processed.push({ event, status: "ignored", reason: "No Instagram account ID in event" });
        continue;
      }

      const { account, rules } = await getWebhookState(event.instagramUserId);
      if (!account) {
        processed.push({ event, status: "ignored", reason: "No active connected account" });
        continue;
      }

      if (event.triggerSource === "button") {
        const { rule, buttonText } = findButtonRule(rules, event.triggerText);
        await insertEvent({ account, rule, event });
        const clickId = await insertButtonClick({ account, rule, event, buttonText });
        processed.push({ event, status: "button_click_recorded", ruleId: rule?.id ?? null, clickId });
        continue;
      }

      const rule = rules.find((candidate) => ruleMatches(candidate, event)) ?? null;
      await insertEvent({ account, rule, event });

      if (!event.recipientId) {
        processed.push({ event, status: "ignored", reason: "No recipient ID in event" });
        continue;
      }

      if (!rule) {
        processed.push({ event, status: "ignored", reason: "No matching rule" });
        continue;
      }

      let commentReplyId: string | null = null;
      let commentReplyError: string | null = null;
      const commentReply = event.triggerSource === "comment" ? randomCommentReply(rule) : null;

      if (commentReply && event.recipientId) {
        try {
          commentReplyId = await sendCommentReply(account, event.recipientId, commentReply);
        } catch (error) {
          commentReplyError = error instanceof Error ? error.message : "Instagram comment reply failed.";
          await captureWebhookDeliveryError(error, {
            operation: "instagram_comment_reply",
            runtime: "insforge_edge",
            accountId: account.id,
            ruleId: rule.id,
            recipientId: event.recipientId,
            triggerSource: event.triggerSource,
            triggerText: event.triggerText,
            instagramUserId: event.instagramUserId,
            senderId: event.senderId,
            mediaId: event.mediaId,
            commentReply,
          });
        }
      }

      try {
        const linkButton = getRuleLinkButton(rule);
        const messageId = await sendInstagramDm(
          account,
          event.recipientId,
          rule.first_message,
          event.triggerSource,
          linkButton,
        );
        const logId = await insertLog({
          account,
          rule,
          event,
          status: "sent",
          instagramMessageId: messageId,
          errorMessage: null,
          linkButton,
        });
        processed.push({ event, status: "sent", ruleId: rule.id, logId, messageId, commentReplyId, commentReplyError });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Instagram DM send failed.";
        const linkButton = getRuleLinkButton(rule);
        const logId = await insertLog({
          account,
          rule,
          event,
          status: "failed",
          instagramMessageId: null,
          errorMessage,
          linkButton,
        });
        await captureWebhookDeliveryError(error, {
          operation: "instagram_dm_send",
          runtime: "insforge_edge",
          accountId: account.id,
          ruleId: rule.id,
          recipientId: event.recipientId,
          triggerSource: event.triggerSource,
          triggerText: event.triggerText,
          instagramUserId: event.instagramUserId,
          senderId: event.senderId,
          mediaId: event.mediaId,
          messageText: rule.first_message,
          linkButtonText: linkButton?.title ?? null,
          linkUrl: linkButton?.url ?? null,
          logId,
        });
        processed.push({ event, status: "failed", ruleId: rule.id, logId, error: errorMessage, commentReplyId, commentReplyError });
      }
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "InsForge webhook processing failed." },
      { status: 502 },
    );
  }

  return Response.json({ received: true, processed });
}
