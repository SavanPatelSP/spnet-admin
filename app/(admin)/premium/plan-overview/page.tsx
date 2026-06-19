import { PageHeader } from "@/components/ui/PageHeader";
import { PlanOverviewHub } from "@/components/plan-overview/PlanOverviewHub";

export const dynamic = "force-dynamic";

export default function PlanOverviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Plan Overview" description="Unified plan center — browse premium plans, coin packages, gem packages, and license templates." />
      <PlanOverviewHub />
    </div>
  );
}
