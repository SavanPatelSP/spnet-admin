import type { Metadata } from "next";

export const dynamic = "force-dynamic";

import { requirePermission } from "@/lib/auth-helpers";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentEditor } from "@/components/content/ContentEditor";
import { contentStore } from "@/lib/content-store";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (id === "new") return { title: "New Content" };
  const item = await contentStore.get(id);
  return { title: item ? `Edit: ${item.title}` : "Content Not Found" };
}

export default async function ContentEditPage({ params }: Props) {
  const { id } = await params;
  await requirePermission("View Content");

  if (id === "new") {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Create Content"
          description="Write and submit new content for review."
          actions={
            <Link
              href="/content"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
          }
        />
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <ContentEditor isNew />
        </div>
      </div>
    );
  }

  const item = await contentStore.get(id);
  if (!item) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={item.title}
        description={`${item.category} · v${item.version} · by ${item.author}`}
        actions={
          <Link
            href="/content"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
        }
      />
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <ContentEditor item={item} />
      </div>
    </div>
  );
}
