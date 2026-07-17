/**
 * Reset clips stuck in "uploading" after a crashed upload attempt.
 *
 * A crashed synchronous upload (Instagram / YouTube) leaves two dangling
 * states that block re-upload:
 *   1. UploadTarget.uploadStatus still in {queued, uploading, publishing}
 *      -> the 409 guard in the upload route rejects any new attempt.
 *   2. Clip.status stuck on "uploading".
 *
 * This script only touches those stuck records. TikTok uploads go through a
 * separate BullMQ worker and are intentionally left alone.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NON_TERMINAL = ["queued", "uploading", "publishing"] as const;
// Synchronous upload paths that can crash mid-flight and leave dangling rows.
const SYNC_PLATFORMS = ["instagram", "youtube"] as const;

async function main() {
  // 1. Fail the dangling (non-terminal) upload targets for sync platforms.
  const stuckTargets = await prisma.uploadTarget.findMany({
    where: {
      platform: { in: [...SYNC_PLATFORMS] },
      uploadStatus: { in: [...NON_TERMINAL] },
    },
    select: { id: true, clipId: true, platform: true, uploadStatus: true },
  });

  for (const t of stuckTargets) {
    await prisma.uploadTarget.update({
      where: { id: t.id },
      data: {
        uploadStatus: "failed",
        errorMessage: "Reset after crashed upload attempt (stuck in progress)",
      },
    });
  }

  // 2. Reconcile clips stuck in "uploading".
  const stuckClips = await prisma.clip.findMany({
    where: { status: "uploading" },
    select: { id: true, status: true },
  });

  let setToReady = 0;
  let setToUploaded = 0;

  for (const c of stuckClips) {
    const completedCount = await prisma.uploadTarget.count({
      where: { clipId: c.id, uploadStatus: "completed" },
    });
    const newStatus = completedCount > 0 ? "uploaded" : "ready_to_upload";
    if (newStatus !== c.status) {
      await prisma.clip.update({ where: { id: c.id }, data: { status: newStatus } });
    }
    if (newStatus === "uploaded") setToUploaded++;
    else setToReady++;
  }

  console.log(
    JSON.stringify(
      {
        stuckUploadTargetsFound: stuckTargets.length,
        stuckUploadTargetsFailed: stuckTargets.length,
        stuckClipsFound: stuckClips.length,
        clipsSetToReadyToUpload: setToReady,
        clipsSetToUploaded: setToUploaded,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
