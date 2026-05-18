import "dotenv/config";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Composio } from "@composio/core";
import { getComposioTikTokConfig } from "../src/lib/composio/config";
import { getOpusClipConfig } from "../src/lib/opusclip/config";

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

async function checkSupabase(): Promise<CheckResult> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "clips";

  if (!hasValue(supabaseUrl) || !hasValue(serviceRoleKey)) {
    return {
      name: "Supabase Storage",
      ok: false,
      message: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.",
    };
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.storage.getBucket(bucket);

  if (error) {
    return {
      name: "Supabase Storage",
      ok: false,
      message: `Could not read bucket "${bucket}": ${error.message}`,
    };
  }

  return {
    name: "Supabase Storage",
    ok: true,
    message: `Bucket "${data.name}" is reachable and ${data.public ? "public" : "private"}.`,
  };
}

function checkOpusClip(): CheckResult {
  if (process.env.OPUSCLIP_USE_API === "true") {
    return {
      name: "OpusClip API",
      ok: hasValue(process.env.OPUSCLIP_API_KEY),
      message: hasValue(process.env.OPUSCLIP_API_KEY)
        ? "API path is enabled and OPUSCLIP_API_KEY is present. Restart the worker after env changes."
        : "OPUSCLIP_USE_API=true but OPUSCLIP_API_KEY is missing.",
    };
  }

  const config = getOpusClipConfig();
  const sessionExists = existsSync(config.storageStatePath);

  return {
    name: "OpusClip Session",
    ok: sessionExists,
    message: sessionExists
      ? `Saved browser session found at ${config.storageStatePath}.`
      : `Run npm run opusclip:login, then log in manually. Expected file: ${config.storageStatePath}`,
  };
}

async function checkComposio(): Promise<CheckResult> {
  const config = getComposioTikTokConfig();

  if (!config.apiKey) {
    return {
      name: "Composio TikTok",
      ok: false,
      message: "Set COMPOSIO_API_KEY in .env.",
    };
  }

  const composio = new Composio({
    apiKey: config.apiKey,
  });

  const accounts = await composio.connectedAccounts.list();
  const items = Array.isArray(accounts) ? accounts : "items" in accounts ? accounts.items : [];
  const activeTikTokAccount = items.find((account) => {
    const toolkit = "toolkit" in account ? account.toolkit : null;
    const slug = toolkit && typeof toolkit === "object" && "slug" in toolkit ? toolkit.slug : null;
    const status = "status" in account ? account.status : null;

    return slug === "tiktok" && status === "ACTIVE";
  });

  if (!activeTikTokAccount) {
    return {
      name: "Composio TikTok",
      ok: false,
      message: "API key works, but no ACTIVE TikTok connected account was found.",
    };
  }

  return {
    name: "Composio TikTok",
    ok: true,
    message: `Found ACTIVE TikTok connected account. Upload action: ${config.uploadToolSlug}.`,
  };
}

async function main() {
  const results = await Promise.allSettled([checkSupabase(), Promise.resolve(checkOpusClip()), checkComposio()]);

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
