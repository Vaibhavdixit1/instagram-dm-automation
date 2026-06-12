"use client";

import { Instagram, Power, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { formatDate } from "@/lib/format";
import { useInboxStore } from "@/lib/store";

const instagramScopes = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
  "instagram_business_content_publish",
  "instagram_business_manage_insights",
].join(",");

export default function AccountsPage() {
  const { accounts, deleteAccount, setAccountActive } = useInboxStore();

  const connectInstagram = () => {
    const clientId =
      process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID ?? process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;

    if (!clientId) {
      toast.error("Set NEXT_PUBLIC_INSTAGRAM_APP_ID before connecting Instagram.");
      return;
    }

    if (!redirectUri) {
      toast.error("Set NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI before connecting Instagram.");
      return;
    }

    const state = crypto.randomUUID();
    window.localStorage.setItem("inboxos:instagram-oauth-state", state);
    window.localStorage.setItem("inboxos:instagram-redirect-uri", redirectUri);

    const params = new URLSearchParams({
      force_reauth: "true",
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: instagramScopes,
      state,
    });

    window.location.href = `https://www.instagram.com/oauth/authorize?${params}`;
  };

  return (
    <AppShell>
      <PageHeader
        title="Connected Instagram accounts"
        eyebrow="Accounts"
        action={
          <Button onClick={connectInstagram}>
            <Instagram size={17} />
            Connect Instagram
          </Button>
        }
      />
      {accounts.length === 0 ? (
        <EmptyState title="No connected accounts" />
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-panel text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Instagram user ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Connected date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-t border-line">
                  <td className="px-4 py-3 font-semibold text-ink">@{account.instagramUsername}</td>
                  <td className="px-4 py-3 text-muted">{account.instagramUserId}</td>
                  <td className="px-4 py-3">
                    <span className={`status-pill ${account.isActive ? "bg-[#e8f4f2] text-brand" : "bg-[#eef0f5] text-muted"}`}>
                      {account.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(account.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        title={account.isActive ? "Disable account" : "Enable account"}
                        aria-label={account.isActive ? "Disable account" : "Enable account"}
                        onClick={() => setAccountActive(account.id, !account.isActive)}
                      >
                        <Power size={16} />
                      </Button>
                      <Button
                        variant="danger"
                        title="Delete account"
                        aria-label="Delete account"
                        onClick={() => deleteAccount(account.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
