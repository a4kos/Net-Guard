import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardFooter } from "@/components/dashboard-footer";
import { DashboardContent } from "@/components/dashboard-content";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <DashboardContent />
      <DashboardFooter />
    </div>
  );
}
