import "dotenv/config";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { requireReapApiKey } from "../src/lib/reap/config";
import { getIntegrations } from "../src/lib/reap/api";

type CheckResult = {
  name: string;
  ok: boolean;
  message: string;
};

function hasValue(value: string | undefined | null) {
  return Boolean(value?.trim());
}

function printResult(result: CheckResult) {
  console.log(`${result.ok ? "OK" : "TODO"} ${result.name}: ${result.message}`);
}

async function checkR2Storage(): Promise<CheckResult> {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? "";
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "";
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "";
  const bucket = process.env.CLOUDFLARE_R2_BUCKET || "ai-video-clipper";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return {
      name: "Cloudflare R2 Storage",
      ok: false,
      message:
        "Set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY in .env.",
    };
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return {
      name: "Cloudflare R2 Storage",
      ok: true,
      message: `Bucket "${bucket}" is reachable.`,
    };
  } catch (error) {
    return {
      name: "Cloudflare R2 Storage",
      ok: false,
      message: `Could not reach bucket "${bucket}": ${error instanceof Error ? error.message : "Unknown error"}.`,
    };
  }
}

async function checkReapApiKey(): Promise<CheckResult> {
  const apiKey = process.env.REAP_API_KEY;

  if (!hasValue(apiKey)) {
    return {
      name: "Reap API Key",
      ok: false,
      message: "Set REAP_API_KEY in .env.",
    };
  }

  return {
    name: "Reap API Key",
    ok: true,
    message: "REAP_API_KEY is set.",
  };
}

async function checkReapIntegration(): Promise<CheckResult> {
  try {
    requireReapApiKey();
  } catch {
    return {
      name: "Reap Integration",
      ok: false,
      message: "REAP_API_KEY is not set. Cannot check integrations.",
    };
  }

  try {
    const response = await getIntegrations();
    const tiktokIntegration = response.integrations.find(
      (i) => i.platform === "tiktok" && i.isActive,
    );

    if (!tiktokIntegration) {
      return {
        name: "Reap TikTok Integration",
        ok: false,
        message: "No active TikTok integration found. Connect one at https://reap.video/settings/integrations.",
      };
    }

    return {
      name: "Reap TikTok Integration",
      ok: true,
      message: `Found active TikTok integration: @${tiktokIntegration.username} (${tiktokIntegration.name}).`,
    };
  } catch (error) {
    return {
      name: "Reap TikTok Integration",
      ok: false,
      message: `Failed to check Reap integrations: ${error instanceof Error ? error.message : "Unknown error"}.`,
    };
  }
}

async function main() {
  const results = await Promise.allSettled([
    checkR2Storage(),
    checkReapApiKey(),
    checkReapIntegration(),
  ]);

  let ok = true;

  for (const result of results) {
    if (result.status === "fulfilled") {
      printResult(result.value);
      ok &&= result.value.ok;
    } else {
      ok = false;
      printResult({
        name: "Integration Check",
        ok: false,
        message: result.reason instanceof Error ? result.reason.message : "Unknown setup check error.",
      });
    }
  }

  process.exitCode = ok ? 0 : 1;
}

void main();