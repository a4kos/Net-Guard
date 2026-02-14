"use client"

import { useMemo } from "react"
import { StatsOverview } from "@/components/stats-overview"
import { CategoryChart } from "@/components/category-chart"
import { RiskScoreChart } from "@/components/risk-score-chart"
import { FlaggedExtensions } from "@/components/flagged-extensions"
import { DownloadCTA } from "@/components/download-cta"
import { ContactForm } from "@/components/contact-form"
import { generateDemoData } from "@/lib/threat-data"

export function DashboardContent() {
  const data = useMemo(() => generateDemoData(), [])

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats overview cards */}
        <StatsOverview {...data.summary} />

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryChart categories={data.categories} />
          <RiskScoreChart extensions={data.extensions} />
        </div>

        {/* Flagged extensions table with expand-for-details */}
        <FlaggedExtensions extensions={data.extensions} />

        {/* Desktop app download CTA */}
        <DownloadCTA />

        {/* Contact form */}
        <ContactForm />
      </div>
    </main>
  )
}
