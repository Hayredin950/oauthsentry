"use client"

import { useState } from "react"
import { Radar, Menu, X } from "lucide-react"
import { SettingsDialog } from "@/components/settings-dialog"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "/#scan", label: "Scanner" },
    { href: "/#feed", label: "Threat feed" },
    { href: "https://vercel.com/kb", label: "Bulletin", external: true },
    { href: "/api-docs", label: "API Docs" },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 ring-1 ring-inset ring-primary/30">
            <Radar className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <span className="text-sm font-semibold tracking-tight">OAuthSentry</span>
          <span className="ml-2 hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            beta
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-foreground"
              {...(link.external && { target: "_blank", rel: "noreferrer" })}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SettingsDialog />
          <span className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1 text-xs">
            <span className="radar-pulse h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            <span className="text-muted-foreground">Live</span>
          </span>
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-5 py-3 space-y-1 sm:px-8 lg:px-10">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-2 px-3 text-sm text-muted-foreground rounded-md transition hover:text-foreground hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
                {...(link.external && { target: "_blank", rel: "noreferrer" })}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 mt-2 border-t border-border flex items-center gap-2 px-3">
              <span className="radar-pulse h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              <span className="text-xs text-muted-foreground">Live monitoring active</span>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
