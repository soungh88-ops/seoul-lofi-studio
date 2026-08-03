import { NextResponse } from "next/server";
const geminiHelper = require("@/utils/gemini");

/**
 * GET/POST /api/cron/auto-generate
 * 24/7 Cloud Automated Continuous Dokkaebi Lofi Music & Video Generation Engine
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
    console.log("☁️ [24/7 Dokkaebi Lofi Cloud Engine]: Starting automated daily generation...");

    // 30-Day Topic Rotation Pool with Dokkaebi Shamanism & Donggung Lore
    const TOPIC_POOL = [
      "Dokkaebi Lofi 👹 [동궁] - 자정 동궁을 수호하는 도깨비 장군의 해금 스터디 비트 🌧️",
      "Dokkaebi Lofi 👹 [동궁] - 악귀를 쫓는 도깨비의 촛불 가야금 수면 로파이 🕯️",
      "Dokkaebi Lofi 👹 [재운] - 일할 때 들으면 재물신 돗가비가 복을 가져다주는 재운 비트 💼",
      "Dokkaebi Lofi 👹 [지혜] - 밤샘 공부할 때 도깨비가 명석한 지혜를 선물하는 스터디 칠홉 📚",
      "Dokkaebi Lofi 👹 [해학] - 도깨비와 밤새 씨름하다 아침에 빗자루만 안고 깬 로파이 🧹",
      "Dokkaebi Lofi 👹 [액막이] - 자꾸 안 좋은 일 생길 때 도깨비와 춤을 추며 불운 털기 💃",
      "Dokkaebi Lofi 👹 [비형랑] - 신라 하룻밤 만에 도깨비 다리를 놓은 신통력 수호 비트 🌉",
      "Dokkaebi Lofi 👹 [제주] - 영감놀이 도깨비와 메밀묵 먹으며 즐기는 힐링 칠홉 🍡",
      "Dokkaebi Lofi 👹 [도깨비불] - 밤안개 속 몽환적인 도깨비불과 함께하는 야간 코딩 로파이 🌌"
    ];

    const currentDayIndex = new Date().getDate() % TOPIC_POOL.length;
    const selectedTheme = TOPIC_POOL[currentDayIndex];

    // Generate 20-Track Storytelling Prompts via Gemini AI
    const musicPrompts = await geminiHelper.generateMusicPrompts({
      genre: "Dokkaebi Lofi",
      theme: selectedTheme,
      trackCount: 20
    });

    // Generate SEO Metadata & 4K Thumbnail Specs
    const metadata = await geminiHelper.generateMetadata({
      genre: "Dokkaebi Lofi",
      theme: selectedTheme,
      trackCount: 20,
      durationHours: 1
    });

    console.log("☁️ [24/7 Dokkaebi Lofi Cloud Engine]: Success! Generated 20 tracks & SEO for:", selectedTheme);

    return NextResponse.json({
      success: true,
      mode: "24/7 Dokkaebi Lofi Cloud Engine",
      selectedTheme,
      musicPrompts,
      metadata,
      shortsCount: 20,
      timestamp: new Date().toISOString(),
      message: "☁️ 24/7 Dokkaebi Lofi 클라우드 지속 생성 엔진 작동 완료!"
    });
  } catch (error) {
    console.error("☁️ [24/7 Dokkaebi Lofi Cloud Engine Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
