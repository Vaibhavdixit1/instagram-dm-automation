"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { formatDate } from "@/lib/format";
import { useInboxStore } from "@/lib/store";
import type { DmLog } from "@/lib/types";

export default function LogsPage() {
  const { accounts, rules, logs } = useInboxStore();
  const [serverLogs, setServerLogs] = useState<DmLog[]>([]);
  const visibleLogs = serverLogs.length ? serverLogs : logs;
  const accountNames = new Map(accounts.map((account) => [account.id, `@${account.instagramUsername}`]));
  const ruleNames = new Map(rules.map((rule) => [rule.id, rule.name]));

  useEffect(() => {
    async function loadLogs() {
      const response = await fetch("/api/logs").catch(() => null);
      const payload = (await response?.json().catch(() => null)) as { logs?: DmLog[] } | null;
      if (payload?.logs) {
        setServerLogs(payload.logs);
      }
    }

    loadLogs();
  }, []);

  return (
    <AppShell>
      <PageHeader title="Delivery logs" eyebrow="Logs" />
      {visibleLogs.length === 0 ? (
        <EmptyState title="No delivery logs" />
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
            <thead className="bg-panel text-xs uppercase tracking-[0.08em] text-muted">
              <tr>
                <th className="px-4 py-3">Created time</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Trigger text</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Recipient ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map((log) => (
                <tr key={log.id} className="border-t border-line transition hover:bg-panel/60">
                  <td className="px-4 py-3 text-muted">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{accountNames.get(log.accountId) ?? "Deleted account"}</td>
                  <td className="px-4 py-3 text-muted">{log.ruleId ? ruleNames.get(log.ruleId) ?? "Deleted rule" : "No match"}</td>
                  <td className="px-4 py-3 text-muted">{log.triggerSource}</td>
                  <td className="max-w-xs px-4 py-3 text-muted">{log.triggerText}</td>
                  <td className="max-w-xs px-4 py-3 text-muted">
                    <div className="line-clamp-2">{log.messageText}</div>
                    {log.linkUrl ? (
                      <div className="mt-1 text-xs font-semibold text-ink">{log.linkButtonText ?? "Open link"}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{log.recipientId}</td>
                  <td className="px-4 py-3">
                    <span className={`status-pill ${log.status === "sent" ? "bg-[#e8f4f2] text-brand" : log.status === "failed" ? "bg-[#feece8] text-[#b83a27]" : "bg-[#fff5db] text-[#996b00]"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{log.errorMessage ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
