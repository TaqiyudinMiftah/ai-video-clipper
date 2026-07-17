export type YouTubeConnectOptions = {
  userId: string;
  redirectUrl: string;
};

export type YouTubeConnectResult = {
  success: boolean;
  redirectUrl?: string;
  connectedAccountId?: string;
  status?: string;
  youtubeMetadata?: {
    channelId?: string;
    channelTitle?: string;
  };
  error?: string;
};

export async function connectYouTube(
  options: YouTubeConnectOptions,
): Promise<YouTubeConnectResult> {
  const { userId, redirectUrl } = options;

  const apiKey = process.env.COMPOSIO_API_KEY;
  const authConfigId = process.env.COMPOSIO_YOUTUBE_AUTH_CONFIG_ID;

  if (!apiKey) {
    return { success: false, error: "COMPOSIO_API_KEY is not configured" };
  }
  if (!authConfigId) {
    return {
      success: false,
      error: "COMPOSIO_YOUTUBE_AUTH_CONFIG_ID is not configured",
    };
  }

  try {
    const response = await fetch(
      "https://backend.composio.dev/api/v3.1/connected_accounts/link",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          auth_config_id: authConfigId,
          allow_multiple: true,
          redirect_url: redirectUrl,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `Composio link failed (${response.status}): ${text.slice(0, 200)}`,
      };
    }

    const data = await response.json();

    const redirectUrlValue =
      data.redirect_url ?? data.redirectUrl ?? data.redirectURL ?? "";

    const connectedAccountId =
      data.connected_account_id ??
      data.id ??
      data.connectedAccountId ??
      undefined;

    const connectionStatus = (data.status ?? "").toUpperCase();

    // If already active, try to fetch YouTube channel metadata
    let channelId = "";
    let channelTitle = "";

    if (connectionStatus === "ACTIVE" && connectedAccountId) {
      try {
        const userInfoRes = await fetch(
          "https://backend.composio.dev/api/v3/tools/execute/YOUTUBE_GET_CHANNEL_STATISTICS",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              connected_account_id: connectedAccountId,
              arguments: { mine: true, part: "snippet,statistics" },
            }),
          },
        );

        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          const items = userInfo?.data?.items ?? [];
          if (items.length > 0) {
            channelId = items[0].id ?? "";
            channelTitle = items[0].snippet?.title ?? "";
          }
        }
      } catch {
        // ignore metadata fetch; connection itself is enough
      }
    }

    return {
      success: true,
      redirectUrl: redirectUrlValue,
      connectedAccountId: connectedAccountId ?? undefined,
      status: connectionStatus,
      youtubeMetadata: {
        channelId,
        channelTitle,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error during connect",
    };
  }
}
