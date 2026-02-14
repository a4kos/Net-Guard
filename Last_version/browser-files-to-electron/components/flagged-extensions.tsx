"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, AlertCircle, AlertTriangle, Info, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { FlaggedExtension } from "@/lib/threat-data"

interface FlaggedExtensionsProps {
  extensions: FlaggedExtension[]
}

const severityConfig = {
  critical: {
    color: "bg-destructive/15 text-destructive border-destructive/30",
    icon: AlertCircle,
    label: "Critical",
  },
  high: {
    color: "bg-[hsl(var(--chart-2))]/15 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30",
    icon: AlertTriangle,
    label: "High",
  },
  medium: {
    color: "bg-[hsl(var(--chart-3))]/15 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/30",
    icon: Info,
    label: "Medium",
  },
  low: {
    color: "bg-[hsl(var(--chart-4))]/15 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/30",
    icon: Lock,
    label: "Low",
  },
}

function riskBarColor(score: number) {
  if (score >= 60) return "[&>div]:bg-destructive"
  if (score >= 35) return "[&>div]:bg-[hsl(var(--chart-2))]"
  return "[&>div]:bg-[hsl(var(--chart-3))]"
}

function ExtensionRow({ ext }: { ext: FlaggedExtension }) {
  const [expanded, setExpanded] = useState(false)
  const config = severityConfig[ext.riskLevel]
  const timeSince = getTimeSince(ext.detectedAt)

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{ext.name}</p>
            <p className="text-xs text-muted-foreground">v{ext.version}</p>
          </div>

          <div className="hidden w-32 sm:block">
            <div className="flex items-center gap-2">
              <Progress value={ext.riskScore} className={`h-1.5 ${riskBarColor(ext.riskScore)}`} />
              <span className="text-xs font-mono text-muted-foreground">{ext.riskScore}</span>
            </div>
          </div>

          <Badge variant="outline" className={`shrink-0 text-xs ${config.color}`}>
            {config.label}
          </Badge>

          <span className="hidden shrink-0 text-xs text-muted-foreground lg:block">
            {timeSince}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-secondary/30 px-4 py-4">
          {/* Permissions */}
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Permissions
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {ext.permissions.map((perm) => (
                <span
                  key={perm}
                  className="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>

          {/* Flag reasons - this is the core "why" */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Why This Extension Was Flagged
            </h4>
            <div className="space-y-2">
              {ext.flagReasons.map((reason, idx) => {
                const reasonConfig = severityConfig[reason.severity]
                const ReasonIcon = reasonConfig.icon
                return (
                  <div
                    key={idx}
                    className="flex gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <ReasonIcon className={`mt-0.5 h-4 w-4 shrink-0 ${
                      reason.severity === "critical" ? "text-destructive" :
                      reason.severity === "high" ? "text-[hsl(var(--chart-2))]" :
                      "text-[hsl(var(--chart-3))]"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {reason.label}
                        <span className="ml-2 text-xs text-muted-foreground">({reason.category})</span>
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {reason.detail}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Risk Score Detail */}
          <div className="mt-4 sm:hidden">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Risk Score
            </h4>
            <div className="flex items-center gap-2">
              <Progress value={ext.riskScore} className={`h-2 flex-1 ${riskBarColor(ext.riskScore)}`} />
              <span className="text-sm font-mono font-medium text-foreground">{ext.riskScore}/100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getTimeSince(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function FlaggedExtensions({ extensions }: FlaggedExtensionsProps) {
  return (
    <section id="flagged" className="scroll-mt-20">
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-base font-semibold text-foreground">Flagged Extensions</span>
            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
              {extensions.length} flagged
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Column headers */}
          <div className="flex items-center gap-3 border-b border-border bg-secondary/50 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className="w-4" />
            <span className="min-w-0 flex-1">Extension</span>
            <span className="hidden w-32 sm:block">Risk Score</span>
            <span className="w-20 text-center">Severity</span>
            <span className="hidden w-16 text-right lg:block">When</span>
          </div>

          {extensions.map((ext) => (
            <ExtensionRow key={ext.id} ext={ext} />
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
