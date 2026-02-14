"use client"

import { Shield, AlertTriangle, AlertCircle, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatsOverviewProps {
  totalExtensions: number
  flaggedExtensions: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

const statCards = [
  {
    key: "flagged",
    label: "Flagged Extensions",
    icon: Shield,
    valueKey: "flaggedExtensions" as const,
    className: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "critical",
    label: "Critical Risk",
    icon: AlertCircle,
    valueKey: "criticalCount" as const,
    className: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    key: "high",
    label: "High Risk",
    icon: AlertTriangle,
    valueKey: "highCount" as const,
    className: "text-chart-2",
    bg: "bg-[hsl(var(--chart-2))]/10",
  },
  {
    key: "medium",
    label: "Medium Risk",
    icon: Info,
    valueKey: "mediumCount" as const,
    className: "text-chart-3",
    bg: "bg-[hsl(var(--chart-3))]/10",
  },
]

export function StatsOverview(props: StatsOverviewProps) {
  return (
    <section id="overview" className="scroll-mt-20">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Security Overview</h2>
          <p className="text-sm text-muted-foreground">
            {props.totalExtensions} extensions scanned
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.key} className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.className}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{props[card.valueKey]}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
