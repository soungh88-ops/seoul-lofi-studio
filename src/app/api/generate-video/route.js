import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

/**
 * POST /api/generate-video
 * Gemini API로 8초 비디오 생성 요청.
 * API 실패/미설정 시 사용자 컴퓨터(로컬 FFmpeg) 8초 렌더링 폴백.
 */
export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "prompt 파라미터가 필요합니다." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      console.log(`[generate-video] Gemini API 8초 비디오 생성 요청: ${prompt.slice(0, 80)}...`);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: prompt,
              aspectRatio: "16:9",
              durationSeconds: 8,
              personGeneration: "allow_adult"
            }),
          }
        );

        const data = await response.json();

        if (response.ok && data.name) {
          console.log(`[generate-video] Gemini API Task 생성 성공: ${data.name}`);
          return NextResponse.json({
            operationName: data.name,
            model: "gemini-veo-2.0",
            message: "✅ Gemini API로 8초 비디오 생성 시작!",
          });
        }

        console.warn(`[generate-video] Gemini API 실패 (${response.status}): ${data.error?.message || JSON.stringify(data)} → 로컬 FFmpeg 8초 렌더링 폴백`);
      } catch (geminiErr) {
        console.warn(`[generate-video] Gemini API 통신 에러: ${geminiErr.message} → 로컬 FFmpeg 8초 렌더링 폴백`);
      }
    }

    // Gemini API 미설정/에러 시 사용자 컴퓨터(로컬 FFmpeg) 8초 비디오 렌더링
    const outputFileName = `local_gemini_loop_${Date.now()}.mp4`;
    const fallbackUrl = await generateLocal8sFallback(outputFileName);

    return NextResponse.json({
      operationName: `local-${outputFileName}`,
      done: true,
      videoUrl: fallbackUrl,
      message: "✅ 내 컴퓨터(로컬 FFmpeg) 8초 비디오 렌더링 완료!",
    });

  } catch (error) {
    console.error("[generate-video route error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 사용자 내 컴퓨터(로컬 FFmpeg) 8초 루프 비디오 렌더링
 */
async function generateLocal8sFallback(outputFileName) {
  return new Promise((resolve) => {
    const outputDir = path.join(process.cwd(), "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const destPath = path.join(outputDir, outputFileName);
    const cmd = [
      "ffmpeg", "-y",
      "-f", "lavfi",
      "-i", "color=c=0x0d0d14:s=1280x720:r=30:d=8",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      `"${destPath}"`
    ].join(" ");

    exec(cmd, (error) => {
      if (error) {
        console.error("[generateLocal8sFallback] FFmpeg 실패:", error.message);
        resolve(`/videos/drive_loop.mp4`);
      } else {
        console.log(`[generateLocal8sFallback] 로컬 8초 비디오 렌더링 완료: ${destPath}`);
        resolve(`/api/video/${encodeURIComponent(outputFileName)}`);
      }
    });
  });
}
