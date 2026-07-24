import { NextResponse } from "next/server";

/**
 * POST /api/generate-music-prompts
 * Generates 20 custom 3-minute Lofi music prompts (Lyria / Suno / Udio ready) based on user's topic.
 */
export async function POST(request) {
  try {
    const { topic = "비 내리는 한옥 대청마루 가야금 공부 로파이", modelName = "gemini-flash-latest" } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ error: "GEMINI_API_KEY가 없습니다." }, { status: 500 });
    }

    const cleanModelName = modelName.replace(/^models\//, "");
    const promptText = `
      You are an expert AI Music Producer & YouTube/Reels Trend Algorithm Data Scientist specialized in Lofi, Chillhop, Jazz, Synthwave, and Solfeggio 432Hz Ambient playlists.
      User requested video topic & genre: "${topic}"
      
      AI TREND ALGORITHM SYNTHESIZER (ChatGPT + Naver + Wiki + YouTube Shorts Algorithm Data):
      - 0~3 SEC VIRAL HOOK: Every track must start with an instant catchy melodic riff matching the topic "${topic}" in the first 3 seconds to lock 100% viewer retention before scrolling.
      - SEAMLESS LOOPING: Audio tail matches start seamlessly so viewers listen 2x (boosting YouTube Shorts algorithm score).
      - KOREAN INSTRUMENT DIVERSITY MANDATE: Do NOT repeat only one or two instruments. You MUST dynamically mix and match a rich variety of traditional Korean instruments across the 20 tracks to prevent repetitive, boring albums:
        * String Instruments: 가야금 (Gayageum), 거문고 (Geomungo), 해금 (Haegeum), 아쟁 (Ajaeng), 양금 (Yanggeum)
        * Wind Instruments: 대금 (Daegeum), 단소 (Danso), 피리 (Piri), 태평소 (Taepyeongso), 소금 (Sogeum)
        * Percussion Instruments (crucial for beats): 장구 (Janggu), 북 (Buk), 꽹과리 (Kkwaenggwari), 징 (Jing), 편종 (Pyeonjong)
      - TPO THEME DIVERSITY: Instead of making all 20 tracks "slow study lofi", partition the 20 tracks into diverse tempos and moods (e.g. upbeat coding chillhop, fast midnight synthwave drive, relaxing morning walk, cozy tea-time acoustic jazz lofi, and deep healing sleep waves).
      - 20-TRACK STORYTELLING ARC:
        * Tracks 1-4 (Phase 1): Familiar Warm Entry (Soft melody + smooth chillhop beat).
        * Tracks 5-10 (Phase 2): Subtle Fusion (Enriched harmonic layers and main theme melodies).
        * Tracks 11-16 (Phase 3): Deep Reverie (Atmospheric ASMR rain/ambient textures + 432Hz Alpha Wave).
        * Tracks 17-20 (Phase 4): Warm Afterglow (Soothing Rhodes piano & soft sub-bass wrap up).
      - EVERY PROMPT must explicitly include: "3-minute full length instrumental composition, 180 seconds duration".
 
      Generate exactly 20 UNIQUE 3-minute Lofi song prompts following this 20-track album arc.
      
      Output ONLY valid raw JSON with key "musicPrompts" array containing 20 objects:
      [
        {
          "trackNumber": 1,
          "title": "트랙 01: [Short Korean Song Title related to ${topic}]",
          "bpm": "72 BPM",
          "mood": "Familiar Lofi Entry",
          "promptKo": "[Detailed Korean audio production description following the album arc, specifying which unique Korean instruments and TPO mood is featured]",
          "promptEn": "[Detailed English music prompt for Suno / Udio / MusicFX: 3-minute full length instrumental composition, 180 seconds duration, featuring a specific combination of Korean instruments like Yanggeum, Taepyeongso, Piri, Geomungo, Janggu drums mixed with lofi chillhop beats, related to ${topic}]"
        },
        ...
      ]
      No markdown, ONLY valid JSON.
    `;

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      }
    );

    if (apiRes.ok) {
      const data = await apiRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      const cleanJson = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.musicPrompts && parsed.musicPrompts.length > 0) {
        return NextResponse.json({ musicPrompts: parsed.musicPrompts });
      }
    }

    // Fallback 20 prompts generator if needed
    const fallbackPrompts = Array.from({ length: 20 }, (_, i) => ({
      trackNumber: i + 1,
      title: `트랙 ${String(i + 1).padStart(2, "0")}: ${topic} - 감성 로파이 파트 ${i + 1}`,
      bpm: `${68 + (i % 8)} BPM`,
      mood: "Cozy Korean Night",
      promptKo: `${topic} 주제에 맞춘 ${68 + (i % 8)} BPM 가야금 & 단소 빗소리 432Hz 로파이 음원 트랙 ${i + 1}`,
      promptEn: `Korean Lofi track ${i + 1}, ${topic} vibe, Gayageum melody, Danso flute, 432Hz solfeggio tuning, vinyl crackle rain ASMR, ${68 + (i % 8)} BPM, relaxing lofi chillhop`
    }));

    return NextResponse.json({ musicPrompts: fallbackPrompts });
  } catch (error) {
    console.error("Failed to generate music prompts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
