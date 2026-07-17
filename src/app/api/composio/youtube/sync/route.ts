import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { upsertSocialAccount } from "@/lib/composio/accounts";

export const runtime = "nodejs";

function getComposioBaseUrl(): string {
  return process.env.COMPOSIO_BASE_URL ?? "https://backend.composio.dev";
}

// After the OAuth popup closes the connection may still be provisioning.
// Poll the authoritative connected-account status until ACTIVE (the
// YOUTUBE_GET_CHANNEL_STATISTICS `mine=true` call can return an empty array
// even when the connection is active, so it must NOT be used to confirm
// connection status). 90s covers Composio's own 60s default auth timeout.
const POLL_TIMEOUT_MS = 90_000;
const POLL_INTERVAL_MS = 3_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const body = (await request.json().catch(() => ({}))) ?? {};
  const entityId = (body.entityId as string) || user.id;
  const connectedAccountId = (body.connectedAccountId as string) || undefined;

  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Composio API key not configured." },
      { status: 500 },
    );
  }

  const baseUrl = getComposioBaseUrl();
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let lastError = "";

  while (Date.now() < deadline) {
    let isActive = false;

    try {
      // Primary signal: authoritative connection status from Composio.
      if (connectedAccountId) {
        const connRes = await fetch(
          `${baseUrl}/api/v3.1/connected_accounts/${connectedAccountId}`,
          { headers: { "x-api-key": apiKey } },
        );

        if (connRes.ok) {
          const connData = (await connRes.json()) as { status?: string };
          const status = (connData.status ?? "").toUpperCase();
          if (status === "ACTIVE") {
            isActive = true;
          } else {
            lastError = `status=${status || "unknown"}`;
          }
        } else {
          lastError = await connRes.text().catch(() => "status check failed");
        }
      }

      // Fallback signal: tool execution (in case connectedAccountId is missing).
      if (!isActive && !connectedAccountId) {
        const ytRes = await fetch(
          `${baseUrl}/api/v3.1/tools/execute/YOUTUBE_GET_CHANNEL_STATISTICS`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
            body: JSON.stringify({
              user_id: entityId,
              arguments: { mine: true, part: "snippet,statistics" },
            }),
          },
        );

        if (ytRes.ok) {
          const ytData = (await ytRes.json()) as {
            successful?: boolean;
            data?: { items?: Array<{ id?: string; snippet?: { title?: string } }> };
          };
          const items = ytData?.data?.items ?? [];
          if (ytData.successful && items.length > 0) {
            isActive = true;
          } else {
            lastError = "channel stats returned no items yet";
          }
        } else {
          lastError = await ytRes.text().catch(() => "channel stats failed");
        }
      }

      if (isActive) {
        // Best-effort channel metadata (may be empty if mine=true returns []).
        let channelId = "";
        let channelTitle = "";
        try {
          const ytRes = await fetch(
            `${baseUrl}/api/v3.1/tools/execute/YOUTUBE_GET_CHANNEL_STATISTICS`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
              },
              body: JSON.stringify({
                user_id: entityId,
                ...(connectedAccountId
                  ? { connected_account_id: connectedAccountId }
                  : {}),
                arguments: { mine: true, part: "snippet,statistics" },
              }),
            },
          );
          if (ytRes.ok) {
            const ytData = (await ytRes.json()) as {
              data?: {
                items?: Array<{ id?: string; snippet?: { title?: string } }>;
              };
            };
            const items = ytData?.data?.items ?? [];
            if (items.length > 0) {
              channelId = items[0].id ?? "";
              channelTitle = items[0].snippet?.title ?? "";
            }
          }
        } catch {
          // metadata is optional; the connection itself is enough
        }

        // Mirror the Instagram flow: store the entity id in connectedId so
        // upload resolves the right connection via user_id/entity_id.
        const account = await upsertSocialAccount({
          userId: user.id,
          platform: "youtube",
          connectedId: entityId,
          platformUserId: channelId || "unknown",
          platformUsername: channelTitle || "unknown",
        });

        return NextResponse.json({
          success: true,
          socialAccounts: [
            {
              id: account.id,
              channelId,
              channelTitle,
              alias: account.alias,
            },
          ],
        });
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "unknown error";
    }

    await sleep(POLL_INTERVAL_MS);
  }

  console.error("Composio YouTube sync timed out:", lastError);
  return NextResponse.json({
    success: false,
    status: "pending",
    message: `YouTube connection not yet active. ${lastError}`.trim(),
  });
}
