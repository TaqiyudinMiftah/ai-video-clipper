import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { getIntegrations } from "@/lib/reap/api";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireCurrentUser();

  try {
    const response = await getIntegrations();

    return NextResponse.json({
      data: response.integrations.map((i) => ({
        id: i.id,
        platform: i.platform,
        isActive: i.isActive,
        username: i.username,
        name: i.name,
        profilePictureUrl: i.profilePictureUrl,
      })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch Reap integrations.";

    return NextResponse.json(
      { error: errorMessage },
      { status: 502 },
    );
  }
}