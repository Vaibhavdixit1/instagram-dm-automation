type SentryErrorContext = {
  operation: "instagram_dm_send" | "instagram_comment_reply";
  runtime: "next_api";
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

function eventId() {
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

export async function captureWebhookDeliveryError(error: unknown, context: SentryErrorContext) {
  const dsn = process.env.SENTRY_DSN;
  const endpoint = dsn ? sentryEndpoint(dsn) : null;
  if (!endpoint) {
    return;
  }

  const normalizedError = errorValue(error);
  const environment = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV;
  const release = process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA;

  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_id: eventId(),
      timestamp: new Date().toISOString(),
      platform: "javascript",
      level: "error",
      logger: "inboxos.instagram_webhook",
      environment,
      release,
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
    cache: "no-store",
  }).catch(() => null);
}
