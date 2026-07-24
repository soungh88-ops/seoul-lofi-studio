import { NextResponse } from "next/server";
const geminiHelper = require("@/utils/gemini");

export async function POST(request) {
  try {
    const { text, type = "music", modelName = "gemini-flash-latest" } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ error: "GEMINI_API_KEY가 없습니다." }, { status: 500 });
    }

    const genAI = geminiHelper.getGenAI();
    if (!genAI) {
      return NextResponse.json({ error: "Gemini client initialization failed." }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: modelName.replace(/^models\//, "") });

    const prompt = type === "visual" ? `
      You are an expert AI Translator & Prompt Engineer specializing in image and video generators (Midjourney, Runway, Veo).
      Translate the following Korean description into fluent, native American English for video and thumbnail generation.
      
      1. OFFICIAL DOKKAEBI CHARACTER MANDATE: If "도깨비" or "dokkaebi" is mentioned in the Korean text, describe the character as: "a muscular humanoid cyber-folklore Dokkaebi (Oni) with cyan glowing horns and a fierce face". The outfit should adapt naturally to the scene context (e.g. casual shorts, jjimjilbang uniform, or cyber-armor), NO headphones by default unless specified. BUT MUST ALWAYS HOLD OR CARRY: "a neon-glowing spiked bat Dokkaebi Club".
      2. SAFETY POLICY COMPLIANCE (STRICT NO MINOR RULE): NEVER use words like "child", "kid", "little girl", "underage", or "minor" in any prompt to prevent safety policy blocks from Gemini/Midjourney/Veo. Always describe female characters as "cute young adult woman", male characters as "young adult man", or "cyberpunk Dokkaebi".
      3. LOFI ANIME ART STYLE MANDATE (NO PHOTOREALISM): Every prompt MUST specify 2D lofi anime illustration style ("cozy 2D lofi anime animation style, Studio Ghibli inspired art style, digital artwork"). NEVER use words like "photorealistic", "real life photo", or "photograph".
      4. STRICT NO SWEAT RULE: NEVER include sweat, sweat droplets, glistening forehead, or perspiration in any prompt. Always include "NO sweat".
      5. NATIVE AMERICAN ENGLISH: Translate all user scene actions, objects, and emotions accurately into authentic American English.
      6. DOUBLE PROMPT MANDATE:
         - translatedVideo MUST START WITH: "A seamless 8-second video loop, static locked-off camera, NO camera movement, NO zoom, cozy 2D lofi anime animation style, Studio Ghibli inspired art style, " followed by character and scene action, and END WITH ", character completely still in peaceful resting pose, ambient warm lighting, clean 4k, NO sweat, NO steam, NO smoke, perfect repeating loop".
         - translatedImage MUST BE: "High resolution YouTube thumbnail, --ar 16:9 --v 6.0, cozy 2D lofi anime illustration art style, Studio Ghibli aesthetic, digital artwork, " followed by scene description.

      Output ONLY a valid JSON object in this format (no markdown codeblock, no conversational text):
      {
        "translatedImage": "High resolution YouTube thumbnail...",
        "translatedVideo": "A seamless 8-second video loop..."
      }
      
      Korean description to translate:
      "${text}"
    ` : `
      You are an expert Google DeepMind Lyria 3 Audio Prompt Architect specializing in Korean Lofi Fusion compositions.
      Translate and expand the following Korean audio description into a professional Google Lyria 3 & Suno audio prompt based on the Official 5-Tag Audio Architecture:
      
      CORE LYRIA 3 AUDIO PROMPT FORMULA:
      1. Genre & Style: 70% Western Lo-Fi Chillhop Beats + 30% Traditional Korean Music Fusion.
      2. Mood & Emotion: Warm, intimate, deep relaxation, peaceful sleep & study vibe.
      3. Instrumentation: 30% Lead Korean Instrument (Gayageum Zither or Haegeum Fiddle or Daegeum Flute solo melody) + 70% Western Lo-Fi Foundation (Soft Fender Rhodes Piano, 808 Low-pass Bass, Relaxing Vinyl Drums).
      4. Tempo & Rhythm: Specified BPM (60~78 BPM), 16th-note swing feel, laid-back beat offset.
      5. Audio Texture & Effects: Physical sound textures matching the topic (e.g. Dry Woodblock Rimshots, Wooden Room Reverb, 432Hz Solfeggio Tuning, Soft Rain or Water Drop ASMR, Warm Tape Saturation).

      Korean description to transform:
      "${text}"
      
      Output format: Output ONLY the final, clean, professional English prompt string starting with the English track title, followed by the 5 Lyria 3 audio tags.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let translatedText = response.text().trim();

    if (type === "visual") {
      try {
        if (translatedText.startsWith("```")) {
          translatedText = translatedText.replace(/^```json/, "").replace(/```$/, "").trim();
        }
        const parsed = JSON.parse(translatedText);
        return NextResponse.json({
          translatedImage: parsed.translatedImage,
          translatedVideo: parsed.translatedVideo
        });
      } catch (err) {
        console.warn("Failed to parse visual translation JSON, falling back:", translatedText);
        return NextResponse.json({
          translatedImage: translatedText,
          translatedVideo: `A seamless loop video, cozy cyber-shamanism lofi room, ${translatedText}, soft rain falling outside, neon lights reflecting on wet streets of futuristic Seoul, warm ambient lighting, 4k resolution, smooth motion, perfect repeating loop`
        });
      }
    }

    return NextResponse.json({ translated: translatedText });
  } catch (error) {
    console.error("Translation API failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
