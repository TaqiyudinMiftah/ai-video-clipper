import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { getSocialAccountsByPlatform } from "@/lib/composio/accounts";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireCurrentUser();

  const accounts = await getSocialAccountsByPlatform(user.id, "youtube");

  return NextResponse.json({
    accounts: accounts.map((acc) => ({
      id: acc.id,
      platform: acc.platform,
      channelName: acc.platformUsername,
      channelId: acc.platformUserId,
      alias: acc.alias,
      isActive: acc.isActive,
      createdAt: acc.createdAt.toISOString(),
    })),
  });
}

export async function DELETE(request: Request) {
  const user = await requireCurrentUser();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing account id" }, { status: 400 });
  }

  const { deactivateSocialAccount } = await import("@/lib/composio/accounts");
  const account = await deactivateSocialAccount(id, user.id);
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
