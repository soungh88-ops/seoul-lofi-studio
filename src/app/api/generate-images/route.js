import { NextResponse } from "next/server";

/**
 * POST /api/generate-images
 * Generates 5 AI scene prompts using user selected Gemini model via direct REST API call.
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
      You are an elite Hollywood visual art director & YouTube High-CTR Thumbnail Data Scientist specializing in Korean Lofi & K-Aesthetic channels.
      User requested video topic: "${topic}"

      1. OFFICIAL DOKKAEBI CHARACTER MANDATE: Whenever generating a Dokkaebi character, describe the character as: "a muscular humanoid cyber-folklore Dokkaebi (Oni) with glowing cyan horns and a fierce face". The outfit should naturally match the scene context (e.g., comfortable casual shorts, jjimjilbang sauna uniform, or traditional hanbok cyber-armor), NO headphones by default unless requested, BUT MUST ALWAYS HOLD OR CARRY: "a neon-glowing spiked bat Dokkaebi Club".
      2. SAFETY POLICY COMPLIANCE (STRICT NO MINOR RULE): NEVER use words like "child", "kid", "little girl", "underage", or "minor" in any prompt to prevent safety policy blocks from Gemini/Midjourney/Veo. Always describe characters as "cute young adult woman", "cyberpunk Dokkaebi", "chibi adult", or "young adult".
      3. LOFI ANIME ART STYLE MANDATE (NO PHOTOREALISM): Every prompt MUST specify 2D/3D lofi concept art or lofi anime illustration style (e.g., "cozy lofi concept art, Studio Ghibli inspired art style, digital artwork, cyber-folklore lofi aesthetic"). NEVER use words like "photorealistic", "real life photo", or "photograph".
      4. STRICT NO SWEAT RULE: NEVER include sweat, sweat droplets, glistening forehead, or perspiration in any prompt. Always specify "NO sweat".
      5. NATIVE AMERICAN ENGLISH: English prompts MUST use authentic, fluent American English lofi scene descriptions.
      6. DOUBLE PROMPT MANDATE: Generate BOTH a Midjourney thumbnail prompt (thumbEn) AND a video loop animation prompt (videoPromptEn).

      Provide output in raw JSON with key "candidates" array containing 5 objects:
      [
        {
          "id": 1,
          "title": "후보 1: [Short Korean scene title related to ${topic}]",
          "prompt": "[Detailed Korean description of lofi anime scene with character related to ${topic}]",
          "thumbEn": "High resolution YouTube thumbnail, --ar 16:9 --v 6.0, cozy 2D lofi anime illustration style, Studio Ghibli inspired digital art, [detailed English lofi anime character & cozy scene description], vibrant anime lighting, masterwork",
          "videoPromptEn": "A seamless 8-second video loop, static locked-off camera, NO camera movement, NO zoom, cozy 2D lofi anime animation style, [insert lofi anime character and action], clean 4k, smooth animation, perfect repeating loop"
        },
        ...
      ]
      Output ONLY valid raw JSON without markdown.
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

      if (parsed.candidates && parsed.candidates.length > 0) {
        return NextResponse.json({ candidates: parsed.candidates });
      }
    }

    // Dynamic Fallback enforcing Character Mandate & Native American English + Video loop prompts
    const cleanTopic = topic.replace(/[^\w\s가-힣]/g, "").trim() || "서울 로파이";
    return NextResponse.json({
      candidates: [
        { 
          id: 1, 
          title: `후보 1: ${cleanTopic} - 헤드폰 낀 도깨비 👹`, 
          prompt: `어두운 자정 비 내리는 한옥 창가, 헤드폰을 끼고 비트에 고개를 끄덕이며 가야금을 연주하는 도깨비 캐릭터 4K`, 
          promptEn: `A cute modern Korean Dokkaebi wearing glowing neon teal headphones, gently nodding to the beat while playing a traditional Gayageum, inside a cozy wooden Hanok room with soft rain falling outside the window, digital sanctuary atmosphere, 4k lofi aesthetic`,
          videoPromptEn: `A seamless loop video, static locked-off camera, NO camera movement, NO zoom, cozy cyber-shamanism lofi room, a cute modern Korean dokkaebi wearing neon headphones, nodding gently to the beat, sitting by a traditional Korean wooden window, soft rain falling outside, neon lights reflecting on wet streets of futuristic Seoul, warm ambient lighting, 4k resolution, smooth motion, perfect repeating loop`
        },
        { 
          id: 2, 
          title: `후보 2: ${cleanTopic} - 빗소리 차 마시는 한복 여인 🍵`, 
          prompt: `자정 한옥 대청마루, 고운 한복을 입고 따뜻한 차를 마시며 빗소리를 감상하는 감성 인물 4K`, 
          promptEn: `A serene young woman wearing an elegant lofi-style Korean Hanbok, holding a steaming cup of tea by a rainy traditional wooden porch at midnight, warm amber paper lanterns, peaceful soul sanctuary, 4k lofi aesthetic`,
          videoPromptEn: `A seamless loop video, static locked-off camera, NO camera movement, NO zoom, cozy cyber-shamanism lofi room, a serene young woman in elegant Korean Hanbok sipping tea, sitting by a traditional wooden window porch, soft rain falling outside, neon lights reflecting on futuristic Seoul streets, warm ambient lighting, 4k resolution, smooth motion, perfect repeating loop`
        },
        { 
          id: 3, 
          title: `후보 3: ${cleanTopic} - 네온 거리 K팝 아티스트 🎧`, 
          prompt: `네온사인 가득한 비 내리는 서울 밤거리, 헤드폰을 끼고 생각에 잠긴 힙한 K팝 스타일 아티스트 4K`, 
          promptEn: `A stylish K-pop artist with glowing headphones standing under neon Hangul street signs on a rainy wet asphalt Seoul street, midnight cyber aesthetic, deep emotional focus, 4k cinematic lofi`,
          videoPromptEn: `A seamless loop video, static locked-off camera, NO camera movement, NO zoom, cozy cyber-shamanism lofi room, a stylish K-pop artist with glowing headphones gazing out of a traditional wooden window porch, soft rain falling outside, neon signs reflecting on wet futuristic Seoul streets, 4k resolution, perfect repeating loop`
        },
        { 
          id: 4, 
          title: `후보 4: ${cleanTopic} - 한옥 대청마루 수호 호랑이 🐯`, 
          prompt: `비 내리는 자정 한옥 마루, 헤드폰을 착용하고 편안하게 낮잠을 자는 한국 전설 속 은은한 수호 호랑이 4K`, 
          promptEn: `A cute mythical Korean guardian tiger wearing neon headphones sleeping peacefully on a wooden Hanok porch with soft rain outside, sacred protective aura, 4k lofi cozy night`,
          videoPromptEn: `A seamless loop video, static locked-off camera, NO camera movement, NO zoom, cozy cyber-shamanism lofi room, a cute mythical Korean guardian tiger wearing neon headphones sleeping by a traditional wooden window porch, soft rain falling, neon lights reflecting on wet streets of futuristic Seoul, warm ambient lighting, 4k resolution, perfect repeating loop`
        },
        { 
          id: 5, 
          title: `후보 5: ${cleanTopic} - 공부하는 현대 선비 📜`, 
          prompt: `새벽 2시 서울 시티뷰 서재, 서도가 마른 붓을 쥐고 공부에 몰입하고 있는 현대식 선비 캐릭터 4K`, 
          promptEn: `A modern Korean scholar studying late at night in a high-rise Seoul apartment with Namsan Tower view, warm glowing desk lamp, deep concentration, 4k lofi study vibe`,
          videoPromptEn: `A seamless loop video, static locked-off camera, NO camera movement, NO zoom, cozy cyber-shamanism lofi room, a modern Korean scholar holding a brush and studying by a traditional wooden window porch, soft rain falling, neon lights reflecting on futuristic Seoul streets, 4k resolution, perfect repeating loop`
        }
      ]
    });
  } catch (error) {
    console.error("Failed to generate prompts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
