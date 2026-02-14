"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CategoryBreakdown } from "@/lib/threat-data"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"

interface CategoryChartProps {
  categories: CategoryBreakdown[]
}

export function CategoryChart({ categories }: CategoryChartProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Flag Reasons by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {categories.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--foreground))",
                  fontSize: "0.8125rem",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend
                wrapperStyle={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
