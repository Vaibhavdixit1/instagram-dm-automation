"use client";

import { Instagram, MessageSquareText, Radio, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { countToday } from "@/lib/format";
import { useInboxStore } from "@/lib/store";

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Instagram;
  tone: string;
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className={`grid size-10 place-items-center rounded-lg ${tone}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="mt-5 text-3xl font-bold text-ink">{value.toLocaleString()}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { accounts, rules, logs } = useInboxStore();
  const sentLogs = logs.filter((log) => log.status === "sent");

  return (
    <AppShell>
      <PageHeader title="Overview" eyebrow="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Connected accounts" value={accounts.length} icon={Instagram} tone="bg-[#e8f4f2] text-brand" />
        <Metric label="Active rules" value={rules.filter((rule) => rule.isActive).length} icon={Radio} tone="bg-[#fff5db] text-[#996b00]" />
        <Metric label="DMs sent today" value={countToday(sentLogs)} icon={Send} tone="bg-[#feece8] text-coral" />
        <Metric label="Total DMs sent" value={sentLogs.length} icon={MessageSquareText} tone="bg-[#eef0f5] text-ink" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Recent delivery</h2>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{logs.length} events</span>
          </div>
          <div className="mt-4 space-y-3">
            {logs.slice(0, 4).map((log) => {
              const rule = rules.find((item) => item.id === log.ruleId);
              return (
                <div key={log.id} className="flex items-center justify-between gap-4 rounded-lg border border-transparent p-2 transition hover:border-line hover:bg-panel/70">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{rule?.name ?? "Unmatched event"}</p>
                    <p className="truncate text-sm text-muted">{log.triggerText}</p>
                  </div>
                  <span className={`status-pill ${log.status === "sent" ? "bg-[#e8f4f2] text-brand" : "bg-[#feece8] text-[#b83a27]"}`}>
                    {log.status}
                  </span>
                </div>
              );
            })}
            {logs.length === 0 ? <div className="grid min-h-32 place-items-center text-sm font-semibold text-muted">No delivery events yet</div> : null}
          </div>
        </section>
        <section className="surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Active keywords</h2>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
              {rules.filter((rule) => rule.isActive).length} rules
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {rules
              .filter((rule) => rule.isActive)
              .flatMap((rule) => rule.keywords)
              .map((keyword) => (
                <span key={keyword} className="rounded-full border border-line bg-panel px-3 py-1 text-sm font-semibold text-ink">
                  {keyword}
                </span>
              ))}
            {rules.filter((rule) => rule.isActive).flatMap((rule) => rule.keywords).length === 0 ? (
              <div className="grid min-h-32 flex-1 place-items-center text-sm font-semibold text-muted">No active keywords yet</div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
