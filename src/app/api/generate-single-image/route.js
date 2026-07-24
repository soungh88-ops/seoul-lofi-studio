import { NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * Helper to call Google Imagen API with fallback model names
 */
async function tryGoogleImagen(prompt, apiKey) {
  const models = [
    "imagen-3.0-generate-002",
    "imagen-3.0-generate-001",
    "imagen-3.0-fast-generate-001"
  ];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: "16:9",
              safetyFilterLevel: "block_few"
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
        if (b64) {
          return `data:image/png;base64,${b64}`;
        }
      } else {
        const errText = await response.text();
        console.warn(`[Imagen model ${model} failed]:`, response.status, errText);
      }
    } catch (e) {
      console.warn(`[Imagen model ${model} fetch error]:`, e.message);
    }
  }

  return null;
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!prompt) {
      return NextResponse.json({ error: "프롬프트가 없습니다." }, { status: 400 });
    }

    // 1. Try Google Imagen models
    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      const googleImage = await tryGoogleImagen(prompt, apiKey);
      if (googleImage) {
        return NextResponse.json({ imageUrl: googleImage, source: "Google Imagen 3" });
      }
    }

    // 2. High-quality AI Image fallback using Pollinations AI with high-res & lofi enhancement
    const seed = Math.floor(Math.random() * 100000);
    const enhancedPrompt = encodeURIComponent(`${prompt}, 4k resolution, cinematic lofi anime art style, highly detailed`);
    const fallbackAiUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=1280&height=720&seed=${seed}&nologo=true`;

    return NextResponse.json({
      imageUrl: fallbackAiUrl,
      source: "AI High-Res Generator"
    });
  } catch (error) {
    console.error("[generate-single-image error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
