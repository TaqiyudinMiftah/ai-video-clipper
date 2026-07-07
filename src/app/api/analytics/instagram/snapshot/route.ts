import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { ensureInstagramSnapshot } from "@/lib/composio/instagram-snapshot";

export const dynamic = "force-dynamic";

/**
 * POST /api/analytics/instagram/snapshot
 *
 * Triggers a daily snapshot refresh for the current user's Instagram account.
 */
export async function POST() {
  const user = await requireCurrentUser();

  try {
    await ensureInstagramSnapshot(user.id);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Failed to take analytics snapshot.",
      },
      { status: 502 },
    );
  }
}
