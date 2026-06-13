export type TriggerSource = "dm" | "comment" | "button";
export type RuleTriggerSource = "dm" | "comment";
export type MatchType = "contains" | "exact";
export type DeliveryStatus = "pending" | "sent" | "failed";

export type UserSession = {
  id: string;
  email: string;
  instagramUserId: string;
};

export type InstagramAuthResponse = {
  igAccount: {
    instagramUserId: string;
    username: string;
    accessToken: string;
    tokenExpiresAt: string | null;
  };
};

export type InstagramAccount = {
  id: string;
  userId: string;
  instagramUserId: string;
  instagramUsername: string;
  accessToken: string;
  tokenExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KeywordRule = {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  triggerSource: RuleTriggerSource;
  matchType: MatchType;
  keywords: string[];
  targetPostIds: string[];
  commentReplyOptions: string[];
  firstMessage: string;
  linkButtonText: string | null;
  linkUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InstagramPost = {
  id: string;
  caption: string | null;
  mediaType: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  timestamp: string | null;
};

export type DmLog = {
  id: string;
  userId: string;
  accountId: string;
  ruleId: string | null;
  recipientId: string;
  triggerSource: TriggerSource;
  triggerText: string;
  messageType: "first_message" | "followup_message" | "link_message";
  messageText: string;
  linkButtonText: string | null;
  linkUrl: string | null;
  status: DeliveryStatus;
  instagramMessageId: string | null;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
};

export type DmEvent = {
  id: string;
  accountId: string;
  ruleId: string | null;
  senderId: string;
  triggerSource: TriggerSource;
  triggerText: string | null;
  rawEvent: unknown;
  createdAt: string;
};

export type DmButtonClick = {
  id: string;
  userId: string;
  accountId: string;
  ruleId: string | null;
  senderId: string;
  payload: string;
  buttonText: string | null;
  buttonUrl: string | null;
  rawEvent: unknown;
  createdAt: string;
};

export type RuleAnalytics = {
  ruleId: string;
  events: number;
  dmEvents: number;
  commentEvents: number;
  buttonEvents: number;
  sent: number;
  failed: number;
  clicks: number;
  lastEventAt: string | null;
  lastSentAt: string | null;
  lastClickAt: string | null;
};
