"use client"

import { Shield, Download, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function DashboardHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
              Net Guard
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Extension Security Dashboard
            </p>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#overview" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Overview
          </a>
          <a href="#flagged" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Flagged Extensions
          </a>
          <a href="#contact" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Contact
          </a>
          <Button asChild size="sm" className="gap-2">
            <a href="/downloads/NetGuard-Setup.exe" download>
              <Download className="h-4 w-4" />
              Desktop App
            </a>
          </Button>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-muted-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="flex flex-col gap-3 border-t border-border px-4 py-4 md:hidden">
          <a
            href="#overview"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Overview
          </a>
          <a
            href="#flagged"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Flagged Extensions
          </a>
          <a
            href="#contact"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Contact
          </a>
          <Button asChild size="sm" className="gap-2 w-fit">
            <a href="/downloads/NetGuard-Setup.exe" download>
              <Download className="h-4 w-4" />
              Desktop App
            </a>
          </Button>
        </nav>
      )}
    </header>
  )
}
