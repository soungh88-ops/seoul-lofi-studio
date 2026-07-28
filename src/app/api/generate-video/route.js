import { NextResponse } from "next/server";
const kaggleHelper = require("@/utils/kaggle-helper");

/**
 * POST /api/generate-video
 * 8초 로파이 배경 영상을 Kaggle Cloud GPU로 생성.
 * Kaggle 내에서 Veo 3.1 API 호출 → 실패 시 빗금 없는 FFmpeg 클린 폴백.
 */
export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "prompt 파라미터가 필요합니다." }, { status: 400 });
    }

    // 고유 출력 파일명 생성
    const outputFileName = `8sec_${Date.now()}.mp4`;

    console.log(`[generate-video] Kaggle 8초 영상 생성 요청: ${prompt.slice(0, 80)}...`);

    const result = await kaggleHelper.push8SecKernel({ prompt, outputFileName });

    return NextResponse.json({
      operationName: `kaggle-8sec-${result.slug}|${outputFileName}`,
      model: "kaggle-veo-cloud",
      message: `✅ Kaggle Cloud GPU로 8초 영상 생성 작업 전송 완료! (슬러그: ${result.slug})`,
      kaggleUrl: result.url
    });

  } catch (error) {
    console.error("[generate-video route error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
