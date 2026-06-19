export type WorkflowState = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";

export interface ContentItem {
  id: string;
  title: string;
  body: string;
  category: string;
  status: WorkflowState;
  author: string;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  version: number;
}

export const WORKFLOW_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  DRAFT: ["IN_REVIEW"],
  IN_REVIEW: ["PUBLISHED", "DRAFT"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

export const WORKFLOW_LABELS: Record<WorkflowState, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In Review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
}
