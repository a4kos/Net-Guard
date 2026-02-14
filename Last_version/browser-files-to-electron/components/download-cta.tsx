import { Download, Cpu, Brain, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Cpu,
    title: "ML Behavioral Analysis",
    description: "Machine learning model that adapts to new malicious patterns in real-time",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Groq-powered AI provides natural language analysis of detected threats",
  },
  {
    icon: BarChart3,
    title: "Deep Statistics",
    description: "Code-level analysis, entropy scoring, and full execution flow tracking",
  },
]

export function DownloadCTA() {
  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Left side - messaging */}
          <div className="flex-1 p-6 lg:p-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
              Desktop Application
            </p>
            <h3 className="mb-2 text-xl font-bold text-foreground">
              Get Deeper Analysis with Net Guard Desktop
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              The desktop app includes advanced ML-based threat detection and AI-powered code analysis
              that goes beyond what the browser extension and this dashboard can provide.
            </p>

            <div className="mb-6 space-y-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="gap-2">
              <a href="/downloads/NetGuard-Setup.exe" download>
                <Download className="h-4 w-4" />
                Download Net Guard Desktop
              </a>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Windows only. Requires .NET 6.0 or later.
            </p>
          </div>

          {/* Right side - visual accent */}
          <div className="hidden items-center justify-center bg-primary/5 p-8 lg:flex lg:w-72">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <Download className="h-10 w-10 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">NetGuard-Setup.exe</p>
              <p className="text-xs text-muted-foreground">v1.0.0</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
