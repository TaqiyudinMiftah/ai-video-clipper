import type { ReapProjectStatus } from "@/lib/reap/types";

const COMPLETED_STATUSES = new Set<ReapProjectStatus>(["completed"]);
const FAILED_STATUSES = new Set<ReapProjectStatus>(["invalid", "expired", "failed", "error"]);

export function classifyReapProjectStatus(status: ReapProjectStatus) {
  if (COMPLETED_STATUSES.has(status)) {
    return "completed" as const;
  }

  if (FAILED_STATUSES.has(status)) {
    return "failed" as const;
  }

  return "processing" as const;
}
