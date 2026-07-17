import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth";
import {
  uploadClipRequestSchema,
  validationErrorResponse,
} from "@/lib/api/validation";
import { enqueueClipUploadJob } from "@/lib/queue/upload-queue";
import { prisma } from "@/lib/prisma";
import { getClipForUser } from "@/lib/user-owned-records";
import { uploadInstagramReels } from "@/lib/composio";
import { getSocialAccountById } from "@/lib/composio/accounts";
import { getStorageService } from "@/lib/storage";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Build a public URL for a clip stored in the current storage provider.
 * Uses the StorageService interface so it works with any provider.
 */
async function buildClipPublicUrl(storagePath: string): Promise<string> {
  const { publicUrl } = await getStorageService().getPublicUrl(storagePath);
  return publicUrl;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) ?? {};
  const parsed = uploadClipRequestSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const platform = parsed.data.platform;

  const clip = await getClipForUser(user.id, id);

  if (!clip) {
    return NextResponse.json({ error: "Clip not found." }, { status: 404 });
  }

  if (!clip.storagePath) {
    return NextResponse.json(
      {
        error: `Clip must have a storage path before it can be uploaded to ${platform === "tiktok" ? "TikTok" : "Instagram"}.`,
      },
      { status: 400 },
    );
  }

  // TikTok requires Reap clip ID for publishing via Reap
  if (platform === "tiktok" && !clip.reapClipId) {
    return NextResponse.json(
      {
        error:
          "Clip must have a Reap clip ID before it can be published to TikTok.",
      },
      { status: 400 },
    );
  }

  const activeUpload = await prisma.uploadTarget.findFirst({
    where: {
      clipId: clip.id,
      userId: user.id,
      platform,
      uploadStatus: {
        in: ["queued", "uploading", "publishing"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (activeUpload) {
    return NextResponse.json(
      {
        error: `This clip already has a ${platform === "tiktok" ? "TikTok" : "Instagram"} upload queued or in progress.`,
        uploadTargetId: activeUpload.id,
        status: activeUpload.uploadStatus,
      },
      { status: 409 },
    );
  }

  let uploadTarget;
  try {
    uploadTarget = await prisma.uploadTarget.create({
      data: {
        clipId: clip.id,
        userId: user.id,
        platform,
        uploadStatus: "queued",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: `This clip already has a ${platform === "tiktok" ? "TikTok" : "Instagram"} upload queued or in progress.`,
        },
        { status: 409 },
      );
    }

    throw error;
  }

  // --- Instagram: Direct upload via Composio (multi-account) ---
  if (platform === "instagram") {
    const accountIds = parsed.data.connectedAccountIds ?? [];

    if (accountIds.length === 0) {
      // Delete the unused UploadTarget we created
      await prisma.uploadTarget
        .delete({ where: { id: uploadTarget.id } })
        .catch(() => {});
      return NextResponse.json(
        { error: "Select at least one Instagram account before uploading." },
        { status: 400 },
      );
    }

    // Fetch all requested social accounts (ownership-checked)
    const socialAccounts = (
      await Promise.all(
        accountIds.map((id) => getSocialAccountById(id, user.id)),
      )
    ).filter(Boolean) as NonNullable<
      Awaited<ReturnType<typeof getSocialAccountById>>
    >[];

    if (socialAccounts.length === 0) {
      await prisma.uploadTarget
        .delete({ where: { id: uploadTarget.id } })
        .catch(() => {});
      return NextResponse.json(
        {
          error:
            "Instagram accounts not found. Connect your Instagram account first.",
        },
        { status: 400 },
      );
    }

    const publicVideoUrl = await buildClipPublicUrl(clip.storagePath);

    // Build caption from clip metadata
    const clipCaptionParts: string[] = [];
    if (clip.caption) clipCaptionParts.push(clip.caption);
    if (clip.hashtags?.length) {
      clipCaptionParts.push(
        clip.hashtags
          .map((t: string) => (t.startsWith("#") ? t : `#${t}`))
          .join(" "),
      );
    }
    const caption = clipCaptionParts.join("\n\n");

    const results: Array<{
      accountId: string;
      platformUsername: string;
      uploadTargetId: string;
      status: string;
      mediaId?: string;
      containerId?: string;
      error?: string;
    }> = [];

    // Process accounts sequentially
    for (const socialAccount of socialAccounts) {
      const resultEntry: (typeof results)[number] = {
        accountId: socialAccount.id,
        platformUsername: socialAccount.platformUsername,
        uploadTargetId: "",
        status: "failed",
      };

      try {
        // Create per-account UploadTarget
        const target = await prisma.uploadTarget.create({
          data: {
            clipId: clip.id,
            userId: user.id,
            platform: "instagram",
            socialAccountId: socialAccount.id,
            uploadStatus: "queued",
          },
        });
        resultEntry.uploadTargetId = target.id;

        await prisma.uploadTarget.update({
          where: { id: target.id },
          data: { uploadStatus: "uploading" },
        });

        await prisma.clip.update({
          where: { id: clip.id },
          data: { status: "uploading" },
        });

        const entityId = socialAccount.connectedId;
        const platformUserId = socialAccount.platformUserId;

        if (!platformUserId) {
          throw new Error("Instagram user ID not found for this account.");
        }

        const igResult = await uploadInstagramReels({
          entityId,
          igUserId: platformUserId,
          videoUrl: publicVideoUrl,
          caption,
          shareToFeed: true,
        });

        if (!igResult.success) {
          throw new Error(igResult.error ?? "Instagram upload failed.");
        }

        // Fetch real permalink from Instagram
        const apiKey = process.env.COMPOSIO_API_KEY;
        let permalink = `https://instagram.com/reel/${igResult.mediaId}`;
        if (apiKey && igResult.mediaId) {
          try {
            const mediaRes = await fetch(
              "https://backend.composio.dev/api/v3.1/tools/execute/INSTAGRAM_GET_IG_MEDIA",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  user_id: entityId,
                  arguments: {
                    ig_media_id: igResult.mediaId,
                    fields: "permalink",
                  },
                }),
              },
            );
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json();
              permalink = mediaData?.data?.permalink ?? permalink;
            }
          } catch {
            // keep fallback permalink if fetch fails
          }
        }

        // Success for this account
        await prisma.uploadTarget.update({
          where: { id: target.id },
          data: {
            uploadStatus: "completed",
            uploadedUrl: permalink,
            platformResponse: igResult,
            errorMessage: null,
          },
        });

        resultEntry.status = "completed";
        resultEntry.mediaId = igResult.mediaId;
        resultEntry.containerId = igResult.containerId;

        await prisma.clip.update({
          where: { id: clip.id },
          data: { status: "uploaded" },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Instagram upload failed.";

        if (resultEntry.uploadTargetId) {
          await prisma.uploadTarget
            .update({
              where: { id: resultEntry.uploadTargetId },
              data: {
                uploadStatus: "failed",
                errorMessage,
              },
            })
            .catch(() => {});
        }

        resultEntry.error = errorMessage;
      }

      results.push(resultEntry);
    }

    // Clean up the initially-created UploadTarget (no longer needed)
    await prisma.uploadTarget
      .delete({ where: { id: uploadTarget.id } })
      .catch(() => {});

    const allFailed = results.every((r) => r.status === "failed");
    const anySucceeded = results.some((r) => r.status === "completed");

    if (allFailed) {
      await prisma.clip
        .update({
          where: { id: clip.id },
          data: { status: "ready_to_upload" },
        })
        .catch(() => {});
      return NextResponse.json(
        { results, error: "All uploads failed." },
        { status: 503 },
      );
    }

    return NextResponse.json({ results }, { status: anySucceeded ? 201 : 503 });
  }

  // --- YouTube: Direct upload via Composio ---
  if (platform === "youtube") {
    const accountIds = parsed.data.connectedAccountIds ?? [];

    if (accountIds.length === 0) {
      await prisma.uploadTarget
        .delete({ where: { id: uploadTarget.id } })
        .catch(() => {});
      return NextResponse.json(
        { error: "Select at least one YouTube account before uploading." },
        { status: 400 },
      );
    }

    const socialAccounts = (
      await Promise.all(
        accountIds.map((id) => getSocialAccountById(id, user.id)),
      )
    ).filter(Boolean) as NonNullable<
      Awaited<ReturnType<typeof getSocialAccountById>>
    >[];

    if (socialAccounts.length === 0) {
      await prisma.uploadTarget
        .delete({ where: { id: uploadTarget.id } })
        .catch(() => {});
      return NextResponse.json(
        {
          error:
            "YouTube accounts not found. Connect your YouTube account first.",
        },
        { status: 400 },
      );
    }

    // R2's public r2.dev URL sits behind Cloudflare bot protection (it serves a
    // "Just a moment" JS challenge to server-side clients), so the app cannot
    // download it directly. Use an authenticated presigned S3 GET URL instead:
    // it targets the *.r2.cloudflarestorage.com API endpoint, which is NOT
    // behind that challenge and needs no public access. YouTube requires the
    // raw bytes (unlike Instagram, which lets Composio fetch a URL), so we must
    // be able to read the file ourselves.
    const extension = (clip.storagePath.split(".").pop() ?? "mp4").toLowerCase();
    const { signedUrl: videoDownloadUrl } =
      await getStorageService().getSignedUrl(clip.storagePath, 60 * 60);

    const results: Array<{
      accountId: string;
      platform: string;
      uploadTargetId: string;
      status: string;
      videoId?: string;
      error?: string;
    }> = [];

    for (const socialAccount of socialAccounts) {
      const resultEntry: (typeof results)[number] = {
        accountId: socialAccount.id,
        platform: "youtube",
        uploadTargetId: "",
        status: "failed",
      };

      try {
        const target = await prisma.uploadTarget.create({
          data: {
            clipId: clip.id,
            userId: user.id,
            platform: "youtube",
            socialAccountId: socialAccount.id,
            uploadStatus: "queued",
          },
        });
        resultEntry.uploadTargetId = target.id;

        await prisma.uploadTarget.update({
          where: { id: target.id },
          data: { uploadStatus: "uploading" },
        });

        await prisma.clip.update({
          where: { id: clip.id },
          data: { status: "uploading" },
        });

        const { uploadYouTubeVideo } =
          await import("@/lib/composio/youtube-upload");
        const ytResult = await uploadYouTubeVideo({
          entityId: socialAccount.connectedId,
          videoUrl: videoDownloadUrl,
          videoFilename: `clip-${clip.id}.${extension}`,
          title: clip.title ?? "Untitled clip",
          description: clip.caption ?? "",
          tags: clip.hashtags,
        });

        if (!ytResult.success) {
          throw new Error(ytResult.error ?? "YouTube upload failed.");
        }

        const uploadedUrl = `https://youtube.com/watch?v=${ytResult.videoId}`;

        await prisma.uploadTarget.update({
          where: { id: target.id },
          data: {
            uploadStatus: "completed",
            uploadedUrl,
            platformResponse: ytResult,
            errorMessage: null,
          },
        });

        resultEntry.status = "completed";
        resultEntry.videoId = ytResult.videoId;

        await prisma.clip.update({
          where: { id: clip.id },
          data: { status: "uploaded" },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "YouTube upload failed.";

        if (resultEntry.uploadTargetId) {
          await prisma.uploadTarget
            .update({
              where: { id: resultEntry.uploadTargetId },
              data: {
                uploadStatus: "failed",
                errorMessage,
              },
            })
            .catch(() => {});
        }

        resultEntry.error = errorMessage;
      }

      results.push(resultEntry);
    }

    await prisma.uploadTarget
      .delete({ where: { id: uploadTarget.id } })
      .catch(() => {});

    const allFailed = results.every((r) => r.status === "failed");
    const anySucceeded = results.some((r) => r.status === "completed");

    if (allFailed) {
      await prisma.clip
        .update({
          where: { id: clip.id },
          data: { status: "ready_to_upload" },
        })
        .catch(() => {});
      return NextResponse.json(
        { results, error: "All uploads failed." },
        { status: 503 },
      );
    }

    return NextResponse.json({ results }, { status: anySucceeded ? 201 : 503 });
  }

  // --- TikTok: Queue via BullMQ / Reap ---
  try {
    await prisma.clip.update({
      where: {
        id: clip.id,
      },
      data: {
        status: "uploading",
      },
    });

    const job = await enqueueClipUploadJob({
      userId: user.id,
      clipId: clip.id,
      uploadTargetId: uploadTarget.id,
    });

    return NextResponse.json(
      {
        uploadTargetId: uploadTarget.id,
        jobId: job.id,
        status: uploadTarget.uploadStatus,
      },
      { status: 201 },
    );
  } catch (error) {
    await prisma.clip.update({
      where: {
        id: clip.id,
      },
      data: {
        status: "ready_to_upload",
      },
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to enqueue TikTok upload.",
      },
      { status: 503 },
    );
  }
}
