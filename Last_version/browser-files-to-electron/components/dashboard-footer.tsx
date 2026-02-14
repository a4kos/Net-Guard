import { Shield } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function DashboardFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Net Guard</span>
          </div>

          <nav className="flex items-center gap-6">
            <a href="#overview" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Overview
            </a>
            <a href="#flagged" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Flagged Extensions
            </a>
            <a href="#contact" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Contact
            </a>
          </nav>
        </div>

        <Separator className="my-6" />

        <p className="text-center text-xs text-muted-foreground">
          Net Guard Extension Security Monitor. This dashboard displays permission-based risk analysis.
          For in-depth ML analysis and AI insights, download the desktop application.
        </p>
      </div>
    </footer>
  )
}
