import { NextResponse } from "next/server";

/**
 * POST /api/generate-video
 * Starts a Google Veo 3.1 video generation job using official model names.
 * Models: veo-3.1-fast-generate-preview or veo-3.1-generate-preview
 */
export async function POST(request) {
  try {
    const { prompt, imageUrl } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const veoPrompt = prompt
      ? `${prompt}, MANDATORY PERFECT SEAMLESS LOOP: first frame matches last frame perfectly, static tripod camera shot, ZERO camera zoom, ZERO camera motion, cozy 2D lofi anime animation style, Studio Ghibli inspired art style, character completely still in peaceful resting pose, ambient warm lighting, NO sweat, NO steam, NO smoke, clean 4K resolution, perfect repeating loop`
      : "Cozy Korean sauna jjimjilbang rest room, lofi anime character wearing yangmeori towel hat, MANDATORY PERFECT SEAMLESS LOOP: first frame matches last frame perfectly, static tripod camera shot, ZERO camera zoom, ZERO camera motion, NO sweat, 4K 8-second invisible loop";

    const body = {
      instances: [{ prompt: veoPrompt }],
      parameters: {
        aspectRatio: "16:9",
        sampleCount: 1,
        durationSeconds: 8
      }
    };

    // Official Google Veo 3.1 model names
    const veoModels = [
      "veo-3.1-fast-generate-preview",
      "veo-3.1-generate-preview"
    ];

    let lastError = null;
    let lastStatus = 500;

    for (const model of veoModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }
        );

        const data = await response.json();

        if (response.ok && data.name) {
          return NextResponse.json({
            operationName: data.name,
            model: model,
            message: `Veo (${model}) 비디오 생성 작업 시작!`
          });
        }

        lastError = data.error?.message || response.statusText;
        lastStatus = response.status;
        console.warn(`[Veo model ${model} failed]:`, lastError);
      } catch (err) {
        lastError = err.message;
        console.warn(`[Veo model ${model} fetch error]:`, err.message);
      }
    }

    return NextResponse.json(
      { error: `Google Veo 오류: ${lastError}` },
      { status: lastStatus }
    );
  } catch (error) {
    console.error("[generate-video route error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
