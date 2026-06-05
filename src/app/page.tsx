import Link from "next/link";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
];

const FEATURES = [
  {
    title: "Keyword auto-replies",
    body: "Trigger a DM the moment someone comments a keyword on your post or reel. No more manual replies at 2am.",
    icon: "💬",
  },
  {
    title: "Story reply funnels",
    body: "Capture every story reply and route it into a branching flow that qualifies leads while you sleep.",
    icon: "✨",
  },
  {
    title: "Smart drip sequences",
    body: "Send timed follow-ups that feel personal. Pause, branch, or hand off to a human at any step.",
    icon: "🔁",
  },
  {
    title: "Comment-to-DM",
    body: "Auto-reply publicly, then slide into the DMs with the link, code, or offer they asked for.",
    icon: "📨",
  },
  {
    title: "Audience tags",
    body: "Segment people by what they clicked, replied, or bought. Build lists that actually convert.",
    icon: "🏷️",
  },
  {
    title: "Live analytics",
    body: "See open rates, reply rates, and revenue per flow in real time. Double down on what works.",
    icon: "📊",
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
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-zinc-100/80 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-sm text-white">
              ◎
            </span>
            DMFlow
          </Link>
          <div className="hidden items-center gap-8 text-sm text-zinc-600 md:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-zinc-900">
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <a href="#" className="hidden text-zinc-600 hover:text-zinc-900 sm:inline">
              Log in
            </a>
            <a
              href="#pricing"
              className="rounded-full bg-zinc-900 px-4 py-2 font-medium text-white transition hover:bg-zinc-700"
            >
              Get started
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-200 via-pink-300 to-purple-300 opacity-40 blur-3xl" />
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Now with reel comment triggers
          </span>
          <h1 className="max-w-3xl text-balance text-5xl font-bold tracking-tight sm:text-6xl">
            Turn your Instagram DMs into a{" "}
            <span className="bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              sales machine
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-zinc-600">
            Automate replies to comments, story responses, and keywords — so every
            follower gets an instant, on-brand conversation that converts.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href="#pricing"
              className="rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 px-7 py-3 font-medium text-white shadow-lg shadow-pink-500/20 transition hover:opacity-90"
            >
              Automate my DMs free
            </a>
            <a
              href="#how"
              className="rounded-full border border-zinc-200 px-7 py-3 font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            No credit card required · Set up in under 5 minutes
          </p>
        </div>
      </section>

      {/* Logos / social proof */}
      <section className="border-y border-zinc-100 bg-zinc-50/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-8 text-sm font-medium text-zinc-400">
          <span>Trusted by 12,000+ creators &amp; brands</span>
          <span className="hidden h-4 w-px bg-zinc-200 sm:block" />
          <span>⭐ 4.9/5 average rating</span>
          <span className="hidden h-4 w-px bg-zinc-200 sm:block" />
          <span>2.4M+ DMs automated weekly</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to never miss a DM
          </h2>
          <p className="mt-4 text-zinc-600">
            Build powerful automations with a simple, visual editor — then let DMFlow
            do the talking.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-zinc-100 bg-white p-6 transition hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-100"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-100 via-pink-100 to-purple-100 text-xl">
                {f.icon}
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-zinc-50/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Live in three steps
            </h2>
            <p className="mt-4 text-zinc-600">
              From signup to your first automated conversation in minutes.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="relative rounded-2xl bg-white p-8 shadow-sm">
                <span className="bg-gradient-to-tr from-pink-500 to-purple-600 bg-clip-text text-5xl font-bold text-transparent">
                  {s.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.body}</p>
              </div>
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
          <p className="mt-4 text-zinc-600">
            Start free. Upgrade when your DMs start paying for themselves.
          </p>
        </div>
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-2xl border p-8 ${
                p.highlight
                  ? "border-transparent bg-gradient-to-b from-zinc-900 to-zinc-800 text-white shadow-xl"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                {p.highlight && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                    Most popular
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span
                  className={`pb-1 text-sm ${
                    p.highlight ? "text-zinc-300" : "text-zinc-500"
                  }`}
                >
                  {p.note}
                </span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <span
                      className={
                        p.highlight ? "text-pink-400" : "text-purple-600"
                      }
                    >
                      ✓
                    </span>
                    <span className={p.highlight ? "text-zinc-200" : "text-zinc-700"}>
                      {perk}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-medium transition ${
                  p.highlight
                    ? "bg-gradient-to-tr from-pink-500 to-purple-600 text-white hover:opacity-90"
                    : "bg-zinc-900 text-white hover:bg-zinc-700"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 px-8 py-16 text-center text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_60%)]" />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to stop typing the same reply?
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-white/90">
            Join thousands of creators automating their DMs and growing on autopilot.
          </p>
          <a
            href="#pricing"
            className="relative mt-8 inline-block rounded-full bg-white px-8 py-3 font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            Get started — it&apos;s free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-zinc-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-xs text-white">
              ◎
            </span>
            DMFlow
          </div>
          <p>© 2026 DMFlow. Not affiliated with Instagram or Meta.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-900">
              Privacy
            </a>
            <a href="#" className="hover:text-zinc-900">
              Terms
            </a>
            <a href="#" className="hover:text-zinc-900">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
