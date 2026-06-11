"use client";

import { useEffect, useMemo, useState } from "react";
import { getCurrentInsforgeUser, signOutFromInsforge } from "./insforge-client";
import type { DmLog, InstagramAccount, InstagramAuthResponse, KeywordRule, UserSession } from "./types";

type InboxState = {
  session: UserSession | null;
  accounts: InstagramAccount[];
  rules: KeywordRule[];
  logs: DmLog[];
};

const storageKey = "inboxos:mvp-state";

const defaultState: InboxState = {
  session: null,
  accounts: [],
  rules: [],
  logs: [],
};

function readState(): InboxState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return defaultState;
  }

  try {
    const parsed = { ...defaultState, ...JSON.parse(raw) } as InboxState;
    return {
      ...parsed,
      rules: parsed.rules.map((rule) => ({
        ...rule,
        targetPostIds: rule.targetPostIds ?? [],
        commentReplyOptions: rule.commentReplyOptions ?? [],
        linkButtonText: rule.linkButtonText ?? null,
        linkUrl: rule.linkUrl ?? null,
      })),
      logs: parsed.logs.map((log) => ({
        ...log,
        linkButtonText: log.linkButtonText ?? null,
        linkUrl: log.linkUrl ?? null,
      })),
    };
  } catch {
    return defaultState;
  }
}

function writeState(state: InboxState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function syncServerState(state: InboxState) {
  fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  }).catch(() => null);
}

export function connectInstagramAccount(auth: InstagramAuthResponse, insforgeUserId?: string) {
  const state = readState();
  const timestamp = new Date().toISOString();
  const existingSession = state.session;
  const session: UserSession = {
    id: insforgeUserId ?? existingSession?.id ?? `ig_user_${auth.igAccount.instagramUserId}`,
    email: existingSession?.email ?? `ig_${auth.igAccount.instagramUserId}@users.inboxos.app`,
    instagramUserId: auth.igAccount.instagramUserId,
  };
  const existingAccount = state.accounts.find(
    (account) => account.instagramUserId === auth.igAccount.instagramUserId,
  );
  const account: InstagramAccount = {
    id: existingAccount?.id ?? `ig_account_${auth.igAccount.instagramUserId}`,
    userId: session.id,
    instagramUserId: auth.igAccount.instagramUserId,
    instagramUsername: auth.igAccount.username,
    accessToken: auth.igAccount.accessToken,
    tokenExpiresAt: auth.igAccount.tokenExpiresAt,
    isActive: true,
    createdAt: existingAccount?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  const nextState: InboxState = {
    ...state,
    session,
    accounts: existingAccount
      ? state.accounts.map((item) => (item.id === existingAccount.id ? account : item))
      : [account, ...state.accounts],
  };
  writeState(nextState);
  syncServerState(nextState);
  window.dispatchEvent(new Event("inboxos-state"));
}

export function connectInsforgeUser(user: { id: string; email: string }) {
  const state = readState();
  const nextState: InboxState = {
    ...state,
    session: {
      id: user.id,
      email: user.email,
      instagramUserId: state.session?.instagramUserId ?? "",
    },
    accounts: state.accounts.map((account) => ({ ...account, userId: user.id })),
    rules: state.rules.map((rule) => ({ ...rule, userId: user.id })),
    logs: state.logs.map((log) => ({ ...log, userId: user.id })),
  };

  writeState(nextState);
  syncServerState(nextState);
  window.dispatchEvent(new Event("inboxos-state"));
}

export function signOut() {
  signOutFromInsforge().catch(() => null);
  writeState(defaultState);
  window.dispatchEvent(new Event("inboxos-state"));
}

export function useInboxStore() {
  const [state, setState] = useState<InboxState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const next = readState();
      const user = await getCurrentInsforgeUser().catch(() => null);
      if (cancelled) {
        return;
      }

      if (!next.session && user) {
        const authenticatedState: InboxState = {
          ...next,
          session: {
            id: user.id,
            email: user.email,
            instagramUserId: "",
          },
        };
        writeState(authenticatedState);
        setState(authenticatedState);
        setReady(true);
        return;
      }

      if (next.session && !user) {
        writeState(defaultState);
        setState(defaultState);
        setReady(true);
        return;
      }

      const hydratedState =
        next.session && user && next.session.id !== user.id
          ? {
              ...next,
              session: { ...next.session, id: user.id, email: user.email },
              accounts: next.accounts.map((account) => ({ ...account, userId: user.id })),
              rules: next.rules.map((rule) => ({ ...rule, userId: user.id })),
              logs: next.logs.map((log) => ({ ...log, userId: user.id })),
            }
          : next;

      if (hydratedState !== next) {
        writeState(hydratedState);
      }

      setState(hydratedState);
      if (hydratedState.session) {
        syncServerState(hydratedState);
      }
      setReady(true);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("inboxos-state", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", sync);
      window.removeEventListener("inboxos-state", sync);
    };
  }, []);

  const update = (producer: (current: InboxState) => InboxState) => {
    const next = producer(readState());
    writeState(next);
    syncServerState(next);
    window.dispatchEvent(new Event("inboxos-state"));
  };

  return useMemo(
    () => ({
      ...state,
      ready,
      setAccountActive: (accountId: string, isActive: boolean) =>
        update((current) => ({
          ...current,
          accounts: current.accounts.map((account) =>
            account.id === accountId
              ? { ...account, isActive, updatedAt: new Date().toISOString() }
              : account,
          ),
        })),
      deleteAccount: (accountId: string) =>
        update((current) => ({
          ...current,
          accounts: current.accounts.filter((account) => account.id !== accountId),
          rules: current.rules.filter((rule) => rule.accountId !== accountId),
          logs: current.logs.filter((log) => log.accountId !== accountId),
        })),
      upsertRule: (rule: KeywordRule) =>
        update((current) => {
          const exists = current.rules.some((item) => item.id === rule.id);
          return {
            ...current,
            rules: exists
              ? current.rules.map((item) => (item.id === rule.id ? rule : item))
              : [rule, ...current.rules],
          };
        }),
      deleteRule: (ruleId: string) =>
        update((current) => ({
          ...current,
          rules: current.rules.filter((rule) => rule.id !== ruleId),
        })),
      setRuleActive: (ruleId: string, isActive: boolean) =>
        update((current) => ({
          ...current,
          rules: current.rules.map((rule) =>
            rule.id === ruleId ? { ...rule, isActive, updatedAt: new Date().toISOString() } : rule,
          ),
        })),
    }),
    [ready, state],
  );
}

export function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}`;
}
