import Link from "next/link";
import {
  MessageCircle,
  Sparkles,
  Repeat,
  Send,
  Tags,
  BarChart3,
  Check,
} from "lucide-react";

import { GetStartedDialog } from "@/components/get-started-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
];

const FEATURES = [
  {
    title: "Keyword auto-replies",
    body: "Trigger a DM the moment someone comments a keyword on your post or reel. No more manual replies at 2am.",
    icon: MessageCircle,
  },
  {
    title: "Story reply funnels",
    body: "Capture every story reply and route it into a branching flow that qualifies leads while you sleep.",
    icon: Sparkles,
  },
  {
    title: "Smart drip sequences",
    body: "Send timed follow-ups that feel personal. Pause, branch, or hand off to a human at any step.",
    icon: Repeat,
  },
  {
    title: "Comment-to-DM",
    body: "Auto-reply publicly, then slide into the DMs with the link, code, or offer they asked for.",
    icon: Send,
  },
  {
    title: "Audience tags",
    body: "Segment people by what they clicked, replied, or bought. Build lists that actually convert.",
    icon: Tags,
  },
  {
    title: "Live analytics",
    body: "See open rates, reply rates, and revenue per flow in real time. Double down on what works.",
    icon: BarChart3,
  },
];

const STEPS = [
  {
    step: "01",
    title: "Connect your account",
    body: "Securely link your Instagram Business or Creator profile in one click.",
  },
  {
    step: "02",
    title: "Build a flow",
    body: "Pick a trigger, drag in your messages, and set the rules — no code required.",
  },
  {
    step: "03",
    title: "Go live & grow",
    body: "Flip it on and watch conversations turn into customers, automatically.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    note: "for getting started",
    perks: ["1 connected account", "2 active flows", "500 DMs / mo", "Basic analytics"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$29",
    note: "per month",
    perks: [
      "3 connected accounts",
      "Unlimited flows",
      "25,000 DMs / mo",
      "Audience tags & segments",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    highlight: true,
  },
  {
    name: "Scale",
    price: "$99",
    note: "per month",
    perks: [
      "10 connected accounts",
      "Unlimited DMs",
      "Team seats & roles",
      "API access",
      "Dedicated manager",
    ],
    cta: "Talk to sales",
    highlight: false,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageCircle className="h-4 w-4" />
            </span>
            DMFlow
          </Link>
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="lg"
              nativeButton={false}
              className="hidden sm:inline-flex"
              render={<a href="#">Log in</a>}
            />
            <GetStartedDialog trigger={<Button size="lg">Get started</Button>} />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="border-b">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
          <Badge variant="secondary" className="mb-6 gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            Now with reel comment triggers
          </Badge>
          <h1 className="max-w-3xl text-balance text-5xl font-bold tracking-tight sm:text-6xl">
            Turn your Instagram DMs into a sales machine
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Automate replies to comments, story responses, and keywords — so every
            follower gets an instant, on-brand conversation that converts.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <GetStartedDialog
              trigger={<Button size="lg">Automate my DMs free</Button>}
            />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<a href="#how">See how it works</a>}
            />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · Set up in under 5 minutes
          </p>
        </div>
      </section>

      {/* Logos / social proof */}
      <section className="border-b bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-8 text-sm font-medium text-muted-foreground">
          <span>Trusted by 12,000+ creators &amp; brands</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span>⭐ 4.9/5 average rating</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span>2.4M+ DMs automated weekly</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to never miss a DM
          </h2>
          <p className="mt-4 text-muted-foreground">
            Build powerful automations with a simple, visual editor — then let DMFlow
            do the talking.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{f.title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {f.body}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y bg-muted/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Live in three steps
            </h2>
            <p className="mt-4 text-muted-foreground">
              From signup to your first automated conversation in minutes.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <Card key={s.step} className="[--card-spacing:--spacing(8)]">
                <CardContent>
                  <span className="text-5xl font-bold text-muted-foreground/40">
                    {s.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when your DMs start paying for themselves.
          </p>
        </div>
        <div className="mt-16 grid items-start gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <Card
              key={p.name}
              className={`[--card-spacing:--spacing(8)] ${
                p.highlight ? "ring-2 ring-primary" : ""
              }`}
            >
              <CardContent className="flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.highlight && <Badge>Most popular</Badge>}
                </div>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="pb-1 text-sm text-muted-foreground">{p.note}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-foreground">{perk}</span>
                    </li>
                  ))}
                </ul>
                <GetStartedDialog
                  defaultPlan={p.name.toLowerCase() as "starter" | "growth" | "scale"}
                  trigger={
                    <Button
                      size="lg"
                      variant={p.highlight ? "default" : "outline"}
                      className="mt-8 w-full"
                    >
                      {p.cta}
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Card className="bg-primary text-primary-foreground [--card-spacing:--spacing(16)]">
          <CardContent className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to stop typing the same reply?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-primary-foreground/80">
              Join thousands of creators automating their DMs and growing on autopilot.
            </p>
            <GetStartedDialog
              trigger={
                <Button size="lg" variant="secondary" className="mt-8">
                  Get started — it&apos;s free
                </Button>
              }
            />
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            DMFlow
          </div>
          <p>© 2026 DMFlow. Not affiliated with Instagram or Meta.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Terms
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
