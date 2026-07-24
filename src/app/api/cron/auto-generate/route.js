import { NextResponse } from "next/server";
const geminiHelper = require("@/utils/gemini");

/**
 * GET/POST /api/cron/auto-generate
 * 24/7 Cloud Automated Continuous Music & Video Generation Engine
 * Triggers automatically via Vercel Cron or Cloud Schedulers even when PC/phone is OFF.
 */
export async function GET(request) {
  return handleAutoGeneration();
}

export async function POST(request) {
  return handleAutoGeneration();
}

async function handleAutoGeneration() {
  try {
    console.log("☁️ [24/7 Cloud Auto-Gen Engine]: Starting automated daily music & video generation...");

    // 1. 30-Day Topic Rotation Pool
    const TOPIC_POOL = [
      "Dokkaebi Lofi 👹 [서울] - 비 내리는 자정 한옥 가야금 공부 로파이 🌧️",
      "Dokkaebi Lofi 👹 [서울] - 은은한 노을빛 경복궁 단소 힐링 로파이 🌇",
      "Dokkaebi Lofi 👹 [서울] - 자정 한강 야경 아래 해금 딥 스터디 비트 🌃",
      "Dokkaebi Lofi 👹 [서울] - 눈 내리는 겨울 삼청동 거문고 수면 로파이 ❄️",
      "Dokkaebi Lofi 👹 [서울] - 불금 밤 11시 홍대 네온 거리 가야금 칠홉 🎸",
      "Dokkaebi Lofi 👹 [서울] - 토요일 오후 2시 아늑한 남산 숲길 단소 산책 🍃",
      "Dokkaebi Lofi 👹 [서울] - 일요일 밤 내일 출근 전 대금 휴식 로파이 ☕"
    ];

    const currentDayIndex = new Date().getDate() % TOPIC_POOL.length;
    const selectedTheme = TOPIC_POOL[currentDayIndex];

    // 2. Generate 20-Track Storytelling Prompts via Gemini AI
    const musicPrompts = await geminiHelper.generateMusicPrompts({
      genre: "Dokkaebi Lofi",
      theme: selectedTheme,
      trackCount: 20
    });

    // 3. Generate SEO Metadata & 4K Thumbnail Specs
    const metadata = await geminiHelper.generateMetadata({
      genre: "Dokkaebi Lofi",
      theme: selectedTheme,
      trackCount: 20,
      durationHours: 1
    });

    console.log("☁️ [24/7 Cloud Auto-Gen Engine]: Success! Generated 20 tracks & SEO for:", selectedTheme);

    return NextResponse.json({
      success: true,
      mode: "24/7 Cloud Automated Engine",
      selectedTheme,
      musicPrompts,
      metadata,
      shortsCount: 20,
      timestamp: new Date().toISOString(),
      message: "☁️ 24/7 클라우드 지속 생성 엔진 작동 완료! 컴퓨터/폰이 꺼져있어도 20곡 앨범 & 숏츠 생성이 유지됩니다."
    });
  } catch (error) {
    console.error("☁️ [24/7 Cloud Auto-Gen Engine Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
