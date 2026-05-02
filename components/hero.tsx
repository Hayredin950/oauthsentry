import { ArrowDown, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start gap-5 sm:gap-6 md:gap-7 lg:gap-8 px-5 py-10 sm:px-8 sm:py-14 md:py-24 lg:px-10 lg:py-28">
        <a
          href="https://vercel.com/kb"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          <ShieldAlert className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-primary flex-shrink-0" aria-hidden />
          <span className="font-mono uppercase tracking-wider text-[9px] sm:text-[10px]">Apr 24, 2026</span>
          <span className="h-3 w-px bg-border hidden sm:block" aria-hidden />
          <span className="hidden sm:inline">Inspired by the Vercel / Context.ai incident</span>
        </a>

        <h1 className="max-w-4xl text-balance text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl font-semibold leading-[1.1] tracking-tight">
          Find the third-party AI tool{" "}
          <span className="text-primary">that breaches you</span>
          <br className="hidden md:block" /> before it does.
        </h1>

        <p className="max-w-2xl text-pretty text-sm sm:text-base leading-relaxed text-muted-foreground">
          OAuthSentry is a durable agent that continuously enumerates your OAuth apps,
          third-party AI integrations, and supply-chain dependencies, then cross-references
          them against live IOC feeds. High-risk findings file Linear tickets and page
          Slack automatically.
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button asChild size="default" className="font-medium text-sm">
            <a href="#scan">
              Run a scan
              <ArrowDown className="ml-1 h-4 w-4" aria-hidden />
            </a>
          </Button>
          <Button asChild size="default" variant="outline" className="font-medium text-sm">
            <a href="#feed">View threat feed</a>
          </Button>
        </div>

        <dl className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
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
    <div className="bg-card px-3 py-3 sm:px-4 sm:py-4">
      <dt className="text-[9px] sm:text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          mono
            ? `mt-0.5 sm:mt-1 text-lg sm:text-2xl font-semibold tracking-tight ${tone === "critical" ? "text-[var(--chart-1)]" : ""}`
            : "mt-0.5 sm:mt-1 text-lg sm:text-2xl font-semibold tracking-tight"
        }
      >
        {value}
      </dd>
    </div>
  )
}
