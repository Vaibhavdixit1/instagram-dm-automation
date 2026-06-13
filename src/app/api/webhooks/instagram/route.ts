import { NextResponse } from "next/server";
import {
  getInsforgeWebhookState,
  insertInsforgeButtonClick,
  insertInsforgeEvent,
  insertInsforgeLog,
} from "@/lib/insforge";
import { captureWebhookDeliveryError } from "@/lib/sentry";
import type { InstagramAccount, KeywordRule, RuleTriggerSource, TriggerSource } from "@/lib/types";

export const runtime = "nodejs";

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

function findAccount(accounts: InstagramAccount[], event: NormalizedEvent) {
  if (!event.instagramUserId) {
    return null;
  }

  return accounts.find(
    (account) => account.isActive && account.instagramUserId === event.instagramUserId,
  );
}

function isRuleTriggerSource(source: TriggerSource): source is RuleTriggerSource {
  return source === "dm" || source === "comment";
}

function ruleMatches(rule: KeywordRule, event: NormalizedEvent) {
  if (!isRuleTriggerSource(event.triggerSource) || rule.triggerSource !== event.triggerSource) {
    return false;
  }

  if (rule.triggerSource === "comment" && rule.targetPostIds.length > 0) {
    return Boolean(event.mediaId && rule.targetPostIds.includes(event.mediaId));
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

    return rule.matchType === "exact" ? text === normalizedKeyword : text.includes(normalizedKeyword);
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
    const textRule = rules.find((rule) => rule.linkButtonText?.trim().toLowerCase() === normalizedButtonText);
    if (textRule) {
      return { rule: textRule, buttonText: parsed.buttonText };
    }
  }

  return { rule: null, buttonText: parsed.buttonText };
}

async function sendInstagramDm(
  account: InstagramAccount,
  recipientId: string,
  messageText: string,
  triggerSource: TriggerSource,
  linkButton: LinkButton | null,
) {
  const graphVersion = process.env.INSTAGRAM_GRAPH_VERSION ?? "v23.0";
  const response = await fetch(`https://graph.instagram.com/${graphVersion}/me/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
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
  const payload = (await response.json().catch(() => ({}))) as {
    message_id?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.message_id) {
    throw new Error(payload.error?.message ?? "Instagram Send API did not return a message ID.");
  }

  return payload.message_id;
}

async function sendCommentReply(account: InstagramAccount, commentId: string, messageText: string) {
  const graphVersion = process.env.INSTAGRAM_GRAPH_VERSION ?? "v23.0";
  const response = await fetch(`https://graph.instagram.com/${graphVersion}/${commentId}/replies`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: messageText }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.message ?? "Instagram comment reply API did not return a reply ID.");
  }

  return payload.id;
}

function randomCommentReply(rule: KeywordRule) {
  const options = rule.commentReplyOptions.map((option) => option.trim()).filter(Boolean).slice(0, 3);
  if (!options.length) {
    return null;
  }

  return options[Math.floor(Math.random() * options.length)];
}

function getRuleLinkButton(rule: KeywordRule): LinkButton | null {
  const url = rule.linkUrl?.trim();
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
    title: (rule.linkButtonText?.trim() || "Open link").slice(0, 20),
    url,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN;
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (verifyToken && mode === "subscribe" && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid verification token" }, { status: 403 });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const events = normalizeWebhookEvent(payload);
  const results = [];

  try {
    for (const event of events) {
      const state = event.instagramUserId
        ? await getInsforgeWebhookState(event.instagramUserId)
        : { account: null, rules: [] };
      const account = findAccount(state.account ? [state.account] : [], event);
      const buttonClick =
        account && event.triggerSource === "button"
          ? findButtonRule(state.rules.filter((rule) => rule.accountId === account.id && rule.isActive), event.triggerText)
          : null;
      const matchingRule =
        account && event.recipientId
          ? state.rules.find((rule) => rule.accountId === account.id && rule.isActive && ruleMatches(rule, event))
          : null;
      const eventRule = buttonClick?.rule ?? matchingRule;

      if (account && event.senderId) {
        await insertInsforgeEvent({
          accountId: account.id,
          ruleId: eventRule?.id ?? null,
          senderId: event.senderId,
          triggerSource: event.triggerSource,
          triggerText: event.triggerText,
          rawEvent: event.rawEvent,
        });
      }

      if (!account) {
        results.push({ event, status: "ignored", reason: "No active connected account for webhook recipient" });
        continue;
      }

      if (buttonClick) {
        if (!event.senderId) {
          results.push({ event, status: "ignored", reason: "No sender ID in button click event" });
          continue;
        }

        const click = await insertInsforgeButtonClick({
          userId: buttonClick.rule?.userId ?? account.userId,
          accountId: account.id,
          ruleId: buttonClick.rule?.id ?? null,
          senderId: event.senderId,
          payload: event.triggerText,
          buttonText: buttonClick.buttonText ?? buttonClick.rule?.linkButtonText ?? null,
          buttonUrl: buttonClick.rule?.linkUrl ?? null,
          rawEvent: event.rawEvent,
        });
        results.push({
          event,
          status: "button_click_recorded",
          ruleId: buttonClick.rule?.id ?? null,
          clickId: click.id,
        });
        continue;
      }

      if (!event.recipientId) {
        results.push({ event, status: "ignored", reason: "No recipient ID in webhook event" });
        continue;
      }

      if (!matchingRule) {
        results.push({ event, status: "ignored", reason: "No active matching rule" });
        continue;
      }

      let commentReplyId: string | null = null;
      let commentReplyError: string | null = null;
      const commentReply = event.triggerSource === "comment" ? randomCommentReply(matchingRule) : null;

      if (commentReply && event.recipientId) {
        try {
          commentReplyId = await sendCommentReply(account, event.recipientId, commentReply);
        } catch (error) {
          commentReplyError = error instanceof Error ? error.message : "Instagram comment reply failed.";
          await captureWebhookDeliveryError(error, {
            operation: "instagram_comment_reply",
            runtime: "next_api",
            accountId: account.id,
            ruleId: matchingRule.id,
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
        const linkButton = getRuleLinkButton(matchingRule);
        const messageId = await sendInstagramDm(
          account,
          event.recipientId,
          matchingRule.firstMessage,
          event.triggerSource,
          linkButton,
        );
        const log = await insertInsforgeLog({
          userId: matchingRule.userId,
          accountId: account.id,
          ruleId: matchingRule.id,
          recipientId: event.recipientId,
          triggerSource: event.triggerSource,
          triggerText: event.triggerText,
          messageType: linkButton ? "link_message" : "first_message",
          messageText: matchingRule.firstMessage,
          linkButtonText: linkButton?.title ?? null,
          linkUrl: linkButton?.url ?? null,
          status: "sent",
          instagramMessageId: messageId,
          errorMessage: null,
          sentAt: new Date().toISOString(),
        });
        results.push({ event, status: "sent", ruleId: matchingRule.id, logId: log.id, messageId, commentReplyId, commentReplyError });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Instagram DM send failed.";
        const linkButton = getRuleLinkButton(matchingRule);
        const log = await insertInsforgeLog({
          userId: matchingRule.userId,
          accountId: account.id,
          ruleId: matchingRule.id,
          recipientId: event.recipientId,
          triggerSource: event.triggerSource,
          triggerText: event.triggerText,
          messageType: linkButton ? "link_message" : "first_message",
          messageText: matchingRule.firstMessage,
          linkButtonText: linkButton?.title ?? null,
          linkUrl: linkButton?.url ?? null,
          status: "failed",
          instagramMessageId: null,
          errorMessage,
          sentAt: null,
        });
        await captureWebhookDeliveryError(error, {
          operation: "instagram_dm_send",
          runtime: "next_api",
          accountId: account.id,
          ruleId: matchingRule.id,
          recipientId: event.recipientId,
          triggerSource: event.triggerSource,
          triggerText: event.triggerText,
          instagramUserId: event.instagramUserId,
          senderId: event.senderId,
          mediaId: event.mediaId,
          messageText: matchingRule.firstMessage,
          linkButtonText: linkButton?.title ?? null,
          linkUrl: linkButton?.url ?? null,
          logId: log.id,
        });
        results.push({ event, status: "failed", ruleId: matchingRule.id, logId: log.id, error: errorMessage, commentReplyId, commentReplyError });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "InsForge webhook processing failed." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    received: true,
    processed: results,
  });
}
