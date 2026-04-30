import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { RiskScanner } from "@/components/risk-scanner"

export default function Page() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <RiskScanner />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Risk Radar &mdash; built for{" "}
            <a
              href="https://vercel.com/events/zero-to-agent"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Zero to Agent
            </a>
          </p>
          <p className="font-mono">
            v0 + MCPs track &middot; AI SDK 6 &middot; Linear &middot; Slack
          </p>
        </div>
      </footer>
    </div>
  )
}
