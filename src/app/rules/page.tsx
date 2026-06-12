"use client";

import { Check, Edit3, Image, Link2, LoaderCircle, Pause, Play, Plus, Trash2, X } from "lucide-react";
import { FormEvent, UIEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { stableUuid } from "@/lib/stable-id";
import { newId, useInboxStore } from "@/lib/store";
import type { InstagramPost, KeywordRule, MatchType, RuleAnalytics, RuleTriggerSource } from "@/lib/types";

type FormState = {
  id?: string;
  name: string;
  accountId: string;
  triggerSource: RuleTriggerSource;
  matchType: MatchType;
  keywords: string;
  targetPostIds: string[];
  commentReplyOptions: string[];
  firstMessage: string;
  linkButtonText: string;
  linkUrl: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  accountId: "",
  triggerSource: "dm",
  matchType: "contains",
  keywords: "",
  targetPostIds: [],
  commentReplyOptions: ["", "", ""],
  firstMessage: "",
  linkButtonText: "",
  linkUrl: "",
  isActive: true,
};

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ruleToForm(rule: KeywordRule): FormState {
  return {
    id: rule.id,
    name: rule.name,
    accountId: rule.accountId,
    triggerSource: rule.triggerSource,
    matchType: rule.matchType,
    keywords: rule.keywords.join(", "),
    targetPostIds: rule.targetPostIds ?? [],
    commentReplyOptions: [...(rule.commentReplyOptions ?? []), "", "", ""].slice(0, 3),
    firstMessage: rule.firstMessage,
    linkButtonText: rule.linkButtonText ?? "",
    linkUrl: rule.linkUrl ?? "",
    isActive: rule.isActive,
  };
}

function dbRuleId(ruleId: string) {
  return stableUuid(`rule:${ruleId}`);
}

function emptyAnalytics(ruleId: string): RuleAnalytics {
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

function RuleAnalyticsCell({
  analytics,
  loading,
}: {
  analytics: RuleAnalytics;
  loading: boolean;
}) {
  const sentRate = analytics.events ? Math.round((analytics.sent / analytics.events) * 100) : 0;

  return (
    <div className="min-w-44">
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-md bg-panel px-2 py-1">
          <div className="text-[10px] font-bold uppercase text-muted">Matched</div>
          <div className="text-sm font-bold text-ink">{loading ? "..." : analytics.events}</div>
        </div>
        <div className="rounded-md bg-[#e8f4f2] px-2 py-1">
          <div className="text-[10px] font-bold uppercase text-brand">Sent</div>
          <div className="text-sm font-bold text-ink">{loading ? "..." : analytics.sent}</div>
        </div>
        <div className="rounded-md bg-[#fff5db] px-2 py-1">
          <div className="text-[10px] font-bold uppercase text-[#996b00]">Clicks</div>
          <div className="text-sm font-bold text-ink">{loading ? "..." : analytics.clicks}</div>
        </div>
      </div>
      <div className="mt-1 text-xs font-medium text-muted">
        {analytics.failed ? `${analytics.failed} failed` : "No failures"}
        {analytics.events ? ` · ${sentRate}% sent` : ""}
      </div>
    </div>
  );
}

function PostPicker({
  accountId,
  selectedIds,
  onChange,
  onClose,
}: {
  accountId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [nextAfter, setNextAfter] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const requestSeq = useRef(0);

  const loadPosts = useCallback(async (after?: string | null) => {
    if (loadingRef.current || (!hasMoreRef.current && after)) {
      return;
    }

    const requestId = (requestSeq.current += 1);
    loadingRef.current = true;
    setLoading(true);
    const params = new URLSearchParams({ accountId });
    if (after) {
      params.set("after", after);
    }

    const response = await fetch(`/api/instagram/posts?${params}`).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as
      | { posts?: InstagramPost[]; nextAfter?: string | null; hasMore?: boolean; error?: string }
      | null;

    if (requestId !== requestSeq.current) {
      return;
    }

    if (!response?.ok || !payload) {
      toast.error(payload?.error ?? "Could not load posts.");
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    setPosts((current) => {
      const seen = new Set(current.map((post) => post.id));
      const incoming = (payload.posts ?? []).filter((post) => !seen.has(post.id));
      if (!after && incoming.length === 0 && current.length > 0) {
        return current;
      }

      return after ? [...current, ...incoming] : incoming;
    });
    setNextAfter(payload.nextAfter ?? null);
    hasMoreRef.current = Boolean(payload.hasMore && payload.nextAfter);
    setHasMore(hasMoreRef.current);
    loadingRef.current = false;
    setLoading(false);
  }, [accountId]);

  useEffect(() => {
    requestSeq.current += 1;
    loadingRef.current = false;
    hasMoreRef.current = true;
    setPosts([]);
    setNextAfter(null);
    setHasMore(true);
    setLoading(false);

    const timeout = window.setTimeout(() => {
      loadPosts(null);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [accountId, loadPosts]);

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (remaining < 180 && hasMore && !loading) {
      loadPosts(nextAfter);
    }
  };

  const togglePost = (postId: string) => {
    onChange(selectedIds.includes(postId) ? selectedIds.filter((id) => id !== postId) : [...selectedIds, postId]);
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/35 p-4">
      <div className="flex max-h-[82vh] w-full max-w-4xl flex-col border border-line bg-white shadow-soft">
        <div className="flex items-center justify-between gap-4 border-b border-line p-4">
          <div>
            <h3 className="text-lg font-bold text-ink">Pick posts</h3>
            <p className="text-sm text-muted">{selectedIds.length ? `${selectedIds.length} selected` : "All posts if none selected"}</p>
          </div>
          <Button type="button" variant="ghost" title="Close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <div onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const selected = selectedIds.includes(post.id);
              const preview = post.thumbnailUrl ?? post.mediaUrl;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => togglePost(post.id)}
                  className={`overflow-hidden border text-left transition ${
                    selected ? "border-brand ring-2 ring-brand/20" : "border-line hover:border-brand"
                  }`}
                >
                  <div className="relative aspect-square bg-panel">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center text-muted">
                        <Image size={30} />
                      </div>
                    )}
                    {selected ? (
                      <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-brand text-white">
                        <Check size={17} />
                      </span>
                    ) : null}
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-bold uppercase text-muted">{post.mediaType}</div>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-ink">{post.caption || "No caption"}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-5 text-sm font-semibold text-muted">
              <LoaderCircle className="animate-spin" size={18} />
              Loading posts
            </div>
          ) : null}
          {!loading && !posts.length ? (
            <div className="grid min-h-48 place-items-center text-sm font-semibold text-muted">No recent posts found</div>
          ) : null}
        </div>
        <div className="flex justify-between gap-2 border-t border-line p-4">
          <Button type="button" variant="secondary" onClick={() => onChange([])}>
            Clear selection
          </Button>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RulesPage() {
  const { accounts, rules, session, upsertRule, deleteRule, setRuleActive } = useInboxStore();
  const [form, setForm] = useState<FormState | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [analytics, setAnalytics] = useState<RuleAnalytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const activeAccounts = accounts.filter((account) => account.isActive);
  const linkButtonText = form?.linkButtonText.trim() ?? "";
  const linkUrl = form?.linkUrl.trim() ?? "";
  const hasLinkButton = Boolean(linkButtonText || linkUrl);
  const linkIsComplete = !hasLinkButton || Boolean(linkButtonText && linkUrl && isValidHttpUrl(linkUrl));
  const canSave = Boolean(
    form?.name.trim() &&
      form?.accountId &&
      form?.keywords.trim() &&
      form?.firstMessage.trim() &&
      linkIsComplete,
  );

  const accountNames = useMemo(
    () => new Map(accounts.map((account) => [account.id, `@${account.instagramUsername}`])),
    [accounts],
  );
  const analyticsByRuleId = useMemo(
    () => new Map(analytics.map((item) => [item.ruleId, item])),
    [analytics],
  );

  useEffect(() => {
    if (!rules.length) {
      setAnalytics([]);
      return;
    }

    let cancelled = false;
    async function loadAnalytics() {
      setAnalyticsLoading(true);
      const response = await fetch("/api/rule-analytics").catch(() => null);
      const payload = (await response?.json().catch(() => null)) as
        | { analytics?: RuleAnalytics[]; error?: string }
        | null;

      if (cancelled) {
        return;
      }

      if (!response?.ok || !payload) {
        toast.error(payload?.error ?? "Could not load rule analytics.");
        setAnalyticsLoading(false);
        return;
      }

      setAnalytics(payload.analytics ?? []);
      setAnalyticsLoading(false);
    }

    loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [rules.length]);

  const openCreate = () => setForm({ ...emptyForm, accountId: activeAccounts[0]?.id ?? accounts[0]?.id ?? "" });
  const openEdit = (rule: KeywordRule) => setForm(ruleToForm(rule));

  const saveRule = (event: FormEvent) => {
    event.preventDefault();
    if (!form || !session || !canSave) {
      return;
    }

    const timestamp = new Date().toISOString();
    const existing = rules.find((rule) => rule.id === form.id);
    const rule: KeywordRule = {
      id: form.id ?? newId("rule"),
      userId: session.id,
      accountId: form.accountId,
      name: form.name.trim(),
      triggerSource: form.triggerSource,
      matchType: form.matchType,
      keywords: form.keywords
        .split(",")
        .map((keyword) => keyword.trim().toLowerCase())
        .filter(Boolean),
      targetPostIds: form.triggerSource === "comment" ? form.targetPostIds : [],
      commentReplyOptions:
        form.triggerSource === "comment"
          ? form.commentReplyOptions.map((reply) => reply.trim()).filter(Boolean).slice(0, 3)
          : [],
      firstMessage: form.firstMessage.trim(),
      linkButtonText: linkButtonText || null,
      linkUrl: linkUrl || null,
      isActive: form.isActive,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    upsertRule(rule);
    setForm(null);
  };

  return (
    <AppShell>
      <PageHeader
        title="Keyword rules"
        eyebrow="Automations"
        action={
          <Button onClick={openCreate} disabled={accounts.length === 0}>
            <Plus size={17} />
            Create rule
          </Button>
        }
      />
      {rules.length === 0 ? (
        <EmptyState title="No keyword rules" />
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-panel text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">Keywords</th>
                <th className="px-4 py-3">Analytics</th>
                <th className="px-4 py-3">Posts</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const ruleAnalytics = analyticsByRuleId.get(dbRuleId(rule.id)) ?? emptyAnalytics(dbRuleId(rule.id));

                return (
                  <tr key={rule.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{rule.name}</div>
                      <div className="mt-1 max-w-sm text-muted">{rule.firstMessage}</div>
                      {rule.linkUrl ? (
                        <div className="mt-2 inline-flex max-w-sm items-center gap-1.5 rounded-md border border-line px-2 py-1 text-xs font-semibold text-ink">
                          <Link2 size={13} />
                          <span className="truncate">{rule.linkButtonText ?? "Open link"}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{accountNames.get(rule.accountId) ?? "Deleted account"}</td>
                    <td className="px-4 py-3 text-muted">{rule.triggerSource}</td>
                    <td className="px-4 py-3 text-muted">{rule.matchType}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {rule.keywords.map((keyword) => (
                          <span key={keyword} className="rounded-md bg-panel px-2 py-1 text-xs font-bold text-ink">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RuleAnalyticsCell analytics={ruleAnalytics} loading={analyticsLoading} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {rule.triggerSource === "comment" && rule.targetPostIds?.length
                        ? `${rule.targetPostIds.length} selected`
                        : "All"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-pill ${rule.isActive ? "bg-[#e8f4f2] text-brand" : "bg-[#eef0f5] text-muted"}`}>
                        {rule.isActive ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" title={rule.isActive ? "Pause rule" : "Resume rule"} aria-label={rule.isActive ? "Pause rule" : "Resume rule"} onClick={() => setRuleActive(rule.id, !rule.isActive)}>
                          {rule.isActive ? <Pause size={16} /> : <Play size={16} />}
                        </Button>
                        <Button variant="secondary" title="Edit rule" aria-label="Edit rule" onClick={() => openEdit(rule)}>
                          <Edit3 size={16} />
                        </Button>
                        <Button variant="danger" title="Delete rule" aria-label="Delete rule" onClick={() => deleteRule(rule.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {form ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 p-4">
          <form onSubmit={saveRule} className="w-full max-w-2xl border border-line bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-ink">{form.id ? "Edit rule" : "Create rule"}</h2>
              <Button type="button" variant="ghost" title="Close" aria-label="Close" onClick={() => setForm(null)}>
                <X size={18} />
              </Button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-semibold text-ink">Rule name</span>
                <input className="mt-1 h-10 w-full rounded-md border border-line px-3" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>
                <span className="text-sm font-semibold text-ink">Instagram account</span>
                <select className="mt-1 h-10 w-full rounded-md border border-line px-3" value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })}>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      @{account.instagramUsername}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold text-ink">Trigger source</span>
                <select className="mt-1 h-10 w-full rounded-md border border-line px-3" value={form.triggerSource} onChange={(event) => setForm({ ...form, triggerSource: event.target.value as RuleTriggerSource })}>
                  <option value="dm">DM</option>
                  <option value="comment">Comment</option>
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold text-ink">Match type</span>
                <select className="mt-1 h-10 w-full rounded-md border border-line px-3" value={form.matchType} onChange={(event) => setForm({ ...form, matchType: event.target.value as MatchType })}>
                  <option value="contains">Contains</option>
                  <option value="exact">Exact</option>
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold text-ink">Keywords</span>
                <input className="mt-1 h-10 w-full rounded-md border border-line px-3" placeholder="pricing, cost" value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} />
              </label>
              {form.triggerSource === "comment" ? (
                <div className="sm:col-span-2">
                  <span className="text-sm font-semibold text-ink">Posts</span>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)} disabled={!form.accountId}>
                      <Image size={16} />
                      Pick posts
                    </Button>
                    <span className="text-sm text-muted">
                      {form.targetPostIds.length ? `${form.targetPostIds.length} selected` : "Applies to all posts"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="sm:col-span-2 text-sm text-muted">Post targeting is available for comment-triggered rules.</p>
              )}
              {form.triggerSource === "comment" ? (
                <div className="sm:col-span-2">
                  <span className="text-sm font-semibold text-ink">Public comment replies</span>
                  <div className="mt-1 grid gap-2">
                    {[0, 1, 2].map((index) => (
                      <input
                        key={index}
                        className="h-10 w-full rounded-md border border-line px-3"
                        placeholder={`Reply option ${index + 1}`}
                        value={form.commentReplyOptions[index] ?? ""}
                        onChange={(event) => {
                          const options = [...form.commentReplyOptions, "", "", ""].slice(0, 3);
                          options[index] = event.target.value;
                          setForm({ ...form, commentReplyOptions: options });
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted">When filled, one option is picked at random for matching comments.</p>
                </div>
              ) : null}
              <label className="sm:col-span-2">
                <span className="text-sm font-semibold text-ink">DM message text</span>
                <textarea className="mt-1 min-h-28 w-full rounded-md border border-line px-3 py-2" value={form.firstMessage} onChange={(event) => setForm({ ...form, firstMessage: event.target.value })} />
              </label>
              <div className="sm:col-span-2 grid gap-3 rounded-md border border-line bg-panel/60 p-3 sm:grid-cols-[minmax(0,180px)_1fr]">
                <label>
                  <span className="text-sm font-semibold text-ink">Button label</span>
                  <input
                    className="mt-1 h-10 w-full rounded-md border border-line px-3"
                    maxLength={20}
                    placeholder="Open link"
                    value={form.linkButtonText}
                    onChange={(event) => setForm({ ...form, linkButtonText: event.target.value })}
                  />
                </label>
                <label>
                  <span className="text-sm font-semibold text-ink">Button URL</span>
                  <input
                    className="mt-1 h-10 w-full rounded-md border border-line px-3"
                    placeholder="https://example.com"
                    value={form.linkUrl}
                    onChange={(event) => setForm({ ...form, linkUrl: event.target.value })}
                  />
                </label>
                {hasLinkButton && !linkIsComplete ? (
                  <p className="text-xs font-semibold text-[#b83a27] sm:col-span-2">
                    Add both a button label and a valid http or https URL.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSave}>
                Save rule
              </Button>
            </div>
          </form>
          {pickerOpen ? (
            <PostPicker
              accountId={form.accountId}
              selectedIds={form.targetPostIds}
              onChange={(targetPostIds) => setForm({ ...form, targetPostIds })}
              onClose={() => setPickerOpen(false)}
            />
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
