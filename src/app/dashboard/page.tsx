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
    <div className="border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className={`grid size-10 place-items-center rounded-md ${tone}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="mt-5 text-3xl font-bold text-ink">{value}</div>
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
        <section className="border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Recent delivery</h2>
          <div className="mt-4 space-y-3">
            {logs.slice(0, 4).map((log) => {
              const rule = rules.find((item) => item.id === log.ruleId);
              return (
                <div key={log.id} className="flex items-center justify-between gap-4 border-t border-line pt-3 first:border-t-0 first:pt-0">
                  <div>
                    <p className="font-semibold text-ink">{rule?.name ?? "Unmatched event"}</p>
                    <p className="text-sm text-muted">{log.triggerText}</p>
                  </div>
                  <span className={`status-pill ${log.status === "sent" ? "bg-[#e8f4f2] text-brand" : "bg-[#feece8] text-[#b83a27]"}`}>
                    {log.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
        <section className="border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Active keywords</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {rules
              .filter((rule) => rule.isActive)
              .flatMap((rule) => rule.keywords)
              .map((keyword) => (
                <span key={keyword} className="rounded-md border border-line bg-panel px-2.5 py-1 text-sm font-semibold text-ink">
                  {keyword}
                </span>
              ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
