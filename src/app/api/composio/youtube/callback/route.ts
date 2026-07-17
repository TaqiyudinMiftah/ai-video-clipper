import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Composio redirects the OAuth popup here after the user authorizes.
// The popup is closed by the user (or auto-closes) and the parent window's
// poll detects `popup.closed` and calls the /sync endpoint, which is the
// authoritative place that saves the connection (after polling status to
// ACTIVE). This callback therefore only needs to redirect to a result page.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const error = searchParams.get("error");

  if (status === "failed") {
    const reason = error ?? "authorization-failed";
    return NextResponse.redirect(
      new URL(`/videos?error=${encodeURIComponent(reason)}`, request.url),
    );
  }

  return NextResponse.redirect(
    new URL("/videos?youtube=connected", request.url),
  );
}
