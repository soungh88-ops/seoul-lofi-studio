import { NextResponse } from "next/server";

/**
 * GET /api/generate-video/status?name=operations/xxxx
 * Polls a Veo Long Running Operation.
 * Google Veo returns: { response: { generateVideoResponse: { generatedSamples: [ { video: { uri: "https://generativelanguage.googleapis.com/v1beta/files/xxxx:download?alt=media" } } ] } } }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const operationName = searchParams.get("name");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!operationName) {
      return NextResponse.json({ error: "name 파라미터가 필요합니다." }, { status: 400 });
    }

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[Veo Status Error]", data);
      return NextResponse.json(
        { error: data.error?.message || "Veo 상태 조회 실패" },
        { status: response.status }
      );
    }

    if (data.done) {
      if (data.error) {
        return NextResponse.json({ done: true, error: data.error.message || "비디오 렌더링 실패" });
      }

      // Extract URI from Google response
      const samples = data.response?.generateVideoResponse?.generatedSamples || [];
      let rawUri = null;

      if (samples.length > 0) {
        rawUri = samples[0]?.video?.uri || samples[0]?.uri;
      }

      if (rawUri) {
        // Append API Key so browser video player can stream directly from Google Files API
        const streamableUrl = rawUri.includes("key=") ? rawUri : `${rawUri}&key=${apiKey}`;
        return NextResponse.json({
          done: true,
          videoUrl: streamableUrl
        });
      }

      return NextResponse.json({
        done: true,
        error: "구글 비디오 파일 다운로드 링크를 생성할 수 없습니다."
      });
    }

    // Still running
    return NextResponse.json({ done: false });
  } catch (error) {
    console.error("[generate-video/status error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
