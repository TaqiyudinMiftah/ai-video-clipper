import { getComposioClient } from "./client";

/**
 * Execute a Composio tool action using the v3.1 API.
 * Falls back to the singleton client's v3 endpoint if v3.1 fails.
 */
export async function composioFetch(
  actionName: string,
  entityId: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error("COMPOSIO_API_KEY is not configured");
  }

  const baseUrl =
    process.env.COMPOSIO_BASE_URL ?? "https://backend.composio.dev";

  const response = await fetch(
    `${baseUrl}/api/v3.1/tools/execute/${actionName}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        arguments: input,
        user_id: entityId,
      }),
    },
  );

  if (!response.ok) {
    // Fallback to v3 via the singleton client
    const client = getComposioClient();
    const result = await client.executeAction(actionName, entityId, input);
    return result as unknown as Record<string, unknown>;
  }

  const result = await response.json();
  return result as Record<string, unknown>;
}
