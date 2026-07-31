import { NextResponse } from "next/server";

/**
 * POST /api/generate-video
 * RunwayML Gen-4 Turbo로 8초 영상 생성.
 * 비동기 작업 → taskId 반환 → /api/generate-video/status?name=runway-{taskId}로 폴링.
 */
export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "prompt 파라미터가 필요합니다." }, { status: 400 });
    }

    const apiKey = process.env.RUNWAYML_API_SECRET || process.env.RUNWAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "RUNWAYML_API_SECRET 환경 변수가 없습니다." }, { status: 500 });
    }

    console.log(`[generate-video] RunwayML 영상 생성 요청: ${prompt.slice(0, 80)}...`);

    // RunwayML Gen-4 Turbo: text-to-video (8초)
    const response = await fetch("https://api.runwayml.com/v1/text_to_video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen4_turbo",
        prompt_text: prompt,
        duration: 8,
        ratio: "1280:720",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[generate-video] RunwayML 오류:", JSON.stringify(data));
      return NextResponse.json(
        { error: data.error || data.message || `RunwayML 오류 (${response.status})` },
        { status: response.status }
      );
    }

    const taskId = data.id;
    if (!taskId) {
      return NextResponse.json({ error: "RunwayML에서 task ID를 받지 못했습니다." }, { status: 500 });
    }

    console.log(`[generate-video] RunwayML task 생성 완료: ${taskId}`);

    return NextResponse.json({
      operationName: `runway-${taskId}`,
      model: "runway-gen4-turbo",
      message: `✅ RunwayML Gen-4 Turbo로 영상 생성 시작! (task: ${taskId})`,
    });

  } catch (error) {
    console.error("[generate-video route error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
