import { ArrowDown, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start gap-8 px-4 py-20 sm:px-6 sm:py-28">
        <a
          href="https://vercel.com/kb"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          <ShieldAlert className="h-3.5 w-3.5 text-primary" aria-hidden />
          <span className="font-mono uppercase tracking-wider text-[10px]">Apr 24, 2026</span>
          <span className="h-3 w-px bg-border" aria-hidden />
          <span>Inspired by the Vercel / Context.ai incident</span>
        </a>

        <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          Find the third-party AI tool{" "}
          <span className="text-primary">that breaches you</span>
          <br className="hidden sm:block" /> before it does.
        </h1>

        <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Risk Radar continuously audits your organization{"\u2019"}s OAuth apps, npm
          dependencies, and SaaS integrations against live indicators of compromise.
          High-risk findings file Linear tickets and ping Slack automatically.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="font-medium">
            <a href="#scan">
              Run a scan
              <ArrowDown className="ml-1 h-4 w-4" aria-hidden />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="font-medium">
            <a href="#feed">View threat feed</a>
          </Button>
        </div>

        <dl className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:max-w-3xl sm:grid-cols-4">
          <Stat label="IOC sources" value="14" />
          <Stat label="Assets monitored" value="8" />
          <Stat label="Critical findings" value="2" tone="critical" />
          <Stat label="Last sweep" value="just now" mono={false} />
        </dl>
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  tone,
  mono = true,
}: {
  label: string
  value: string
  tone?: "critical"
  mono?: boolean
}) {
  return (
    <div className="bg-card px-4 py-4">
      <dt className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          mono
            ? `mt-1 text-2xl font-semibold tracking-tight ${tone === "critical" ? "text-[var(--chart-1)]" : ""}`
            : "mt-1 text-2xl font-semibold tracking-tight"
        }
      >
        {value}
      </dd>
    </div>
  )
}
