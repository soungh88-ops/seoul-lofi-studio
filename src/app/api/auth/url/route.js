import { NextResponse } from "next/server";
const youtubeHelper = require("@/utils/youtube-helper");

export async function GET() {
  try {
    if (!youtubeHelper.isConfigured()) {
      return NextResponse.json(
        { error: "Google OAuth credentials not configured in .env.local" },
        { status: 400 }
      );
    }
    const url = youtubeHelper.getAuthUrl();
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
