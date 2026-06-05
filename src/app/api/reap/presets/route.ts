import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { getAllPresets } from "@/lib/reap/api";

export const runtime = "nodejs";

export async function GET() {
  await requireCurrentUser();

  try {
    const response = await getAllPresets(1, 100);

    return NextResponse.json({
      data: response.presets.map((preset) => ({
        id: preset.id,
        name: preset.name,
        source: preset.source,
        preferences: preset.preferences,
      })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch Reap presets.";

    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}
