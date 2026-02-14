"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FlaggedExtension } from "@/lib/threat-data"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface RiskScoreChartProps {
  extensions: FlaggedExtension[]
}

function getBarColor(score: number) {
  if (score >= 60) return "hsl(var(--chart-1))"
  if (score >= 35) return "hsl(var(--chart-2))"
  return "hsl(var(--chart-3))"
}

export function RiskScoreChart({ extensions }: RiskScoreChartProps) {
  const data = extensions.map((ext) => ({
    name: ext.name.length > 14 ? ext.name.slice(0, 14) + "..." : ext.name,
    score: ext.riskScore,
    fullName: ext.name,
  }))

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Risk Score per Extension
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--foreground))",
                  fontSize: "0.8125rem",
                }}
                labelFormatter={(_, payload) => {
                  if (payload?.[0]) return payload[0].payload.fullName
                  return ""
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
