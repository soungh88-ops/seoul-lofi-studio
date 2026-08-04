import { NextResponse } from "next/server";
const geminiHelper = require("@/utils/gemini");
const youtubeHelper = require("@/utils/youtube-helper");

export async function POST(request) {
  try {
    const body = await request.json();
    const { genre, theme, enHookTitle, trackCount = 20, durationHours = 1 } = body;

    const isYouTubeConnected = youtubeHelper.isAuthenticated();

    // Check-only query on mount to avoid unnecessary Gemini API calls
    if (genre === "check" && theme === "check") {
      return NextResponse.json({
        success: true,
        isYouTubeConnected
      });
    }

    if (!genre || !theme) {
      return NextResponse.json({ error: "Missing genre or theme" }, { status: 400 });
    }

    // 1. Generate Metadata via Gemini
    const metadata = await geminiHelper.generateMetadata({
      genre,
      theme,
      enHookTitle,
      trackCount,
      durationHours
    });

    // 2. Generate MusicFX prompt list
    const musicPrompts = await geminiHelper.generateMusicPrompts({
      genre,
      theme,
      trackCount
    });

    return NextResponse.json({
      success: true,
      metadata,
      musicPrompts: musicPrompts.prompts || [],
      isYouTubeConnected
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
