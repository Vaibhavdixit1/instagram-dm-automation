"use client";

import { BarChart3, FileClock, Instagram, LogOut, MessageSquareText, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/store";
import { Button } from "./Button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/accounts", label: "Accounts", icon: Instagram },
  { href: "/rules", label: "Rules", icon: Settings2 },
  { href: "/logs", label: "Logs", icon: FileClock },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // TEMP: auth guard disabled to preview the app without logging in.
  // Restore before shipping:
  // if (ready && !session) {
  //   router.replace("/login");
  // }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3 font-bold text-ink">
            <span className="grid size-9 place-items-center rounded-md bg-brand text-white">
              <MessageSquareText size={19} />
            </span>
            <span>instagram-dm-automation</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold ${
                    active ? "bg-[#e8f4f2] text-brand" : "text-muted hover:bg-panel hover:text-ink"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
          >
            <LogOut size={17} />
          </Button>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold ${
                  active ? "bg-[#e8f4f2] text-brand" : "text-muted"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
