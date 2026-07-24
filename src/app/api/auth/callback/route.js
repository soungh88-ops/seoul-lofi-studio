import { NextResponse } from "next/server";
const youtubeHelper = require("@/utils/youtube-helper");

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  
  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  try {
    await youtubeHelper.handleCallback(code);
    // Redirect back to dashboard home page
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/?connected=true`);
  } catch (error) {
    console.error("OAuth callback exchange failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
