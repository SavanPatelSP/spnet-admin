import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Content Management" };

import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { FileText, Clock, CheckCircle, Archive } from "lucide-react";
import { ContentManager } from "@/components/content/ContentManager";
import { contentStore } from "@/lib/content-store";

export default async function ContentPage() {
  const drafts = await contentStore.list({ status: "DRAFT", pageSize: 1 });
  const inReview = await contentStore.list({ status: "IN_REVIEW", pageSize: 1 });
  const published = await contentStore.list({ status: "PUBLISHED", pageSize: 1 });
  const archived = await contentStore.list({ status: "ARCHIVED", pageSize: 1 });
  const all = await contentStore.list({ pageSize: 1000 });

  return (
    <div className="space-y-8">
      <PageHeader title="Content Management" description="Create, review, and publish content with Draft → Review → Publish workflow." />

      <StatCardGrid columns={4}>
        <StatCard title="Drafts" value={drafts.total} icon={FileText} color="yellow" />
        <StatCard title="In Review" value={inReview.total} icon={Clock} color="purple" />
        <StatCard title="Published" value={published.total} icon={CheckCircle} color="green" />
        <StatCard title="Archived" value={archived.total} icon={Archive} color="red" />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-6 text-xl font-bold">All Content</h2>
        <ContentManager initialData={all.data} initialTotal={all.total} />
      </div>
    </div>
  );
}
