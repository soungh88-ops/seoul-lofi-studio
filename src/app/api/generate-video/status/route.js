import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

/**
 * GET /api/generate-video/status?name=runway-{taskId}
 * RunwayML 작업 상태 폴링.
 * 완료 시 영상 URL을 다운로드 → /api/video/파일명으로 미리보기 반환.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const operationName = searchParams.get("name");

    if (!operationName) {
      return NextResponse.json({ error: "name 파라미터가 필요합니다." }, { status: 400 });
    }

    // ── 로컬 FFmpeg 렌더링 즉시 반환 ─────────────────────────────────────────
    if (operationName.startsWith("local-")) {
      const fileName = operationName.slice("local-".length);
      return NextResponse.json({
        done: true,
        videoUrl: `/api/video/${encodeURIComponent(fileName)}`,
        log: "✅ 내 컴퓨터(로컬 FFmpeg) 8초 비디오 렌더링 준비 완료",
      });
    }

    // ── RunwayML 작업 상태 조회 ──────────────────────────────────────────────
    if (operationName.startsWith("runway-")) {
      const taskId = operationName.slice("runway-".length);

      const apiKey = process.env.RUNWAYML_API_SECRET || process.env.RUNWAY_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "RUNWAYML_API_SECRET 환경 변수가 없습니다." }, { status: 500 });
      }

      console.log(`[video/status] RunwayML 폴링: taskId=${taskId}`);

      const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "X-Runway-Version": "2024-11-06",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error(`[video/status] RunwayML 상태 오류 (${response.status}): ${errText.slice(0, 200)}`);
        return NextResponse.json({
          done: false,
          log: `RunwayML 상태 조회 오류 (${response.status})`,
        });
      }

      const data = await response.json();
      const status = (data.status || "").toLowerCase();
      const progress = data.progress ?? null;

      console.log(`[video/status] RunwayML 상태: ${status}, progress: ${progress}`);

      // 처리 중
      if (status === "pending" || status === "running" || status === "throttled") {
        const progressStr = progress !== null ? ` (${Math.round(progress * 100)}%)` : "";
        return NextResponse.json({
          done: false,
          log: `RunwayML 영상 생성 중...${progressStr}`,
        });
      }

      // 실패
      if (status === "failed" || status === "cancelled") {
        const reason = data.failure || data.failureCode || status;
        console.warn(`[video/status] RunwayML 실패: ${reason} → FFmpeg 폴백`);
        const fallbackUrl = await generateCleanFallback(`runway_fallback_${taskId}.mp4`);
        return NextResponse.json({
          done: true,
          videoUrl: fallbackUrl,
          log: `⚠️ RunwayML 실패(${reason}) → 클린 폴백 영상 사용`,
        });
      }

      // 완료!
      if (status === "succeeded") {
        const outputUrls = data.output || [];
        const videoUrl = outputUrls[0];

        if (!videoUrl) {
          return NextResponse.json({ done: true, error: "RunwayML 출력 URL이 없습니다." });
        }

        // 영상 다운로드 → output/ 폴더 저장
        const outputFileName = `runway_${taskId}.mp4`;
        const outputDir = path.join(process.cwd(), "output");
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        const destPath = path.join(outputDir, outputFileName);

        try {
          console.log(`[video/status] RunwayML 영상 다운로드: ${videoUrl}`);
          const dlRes = await fetch(videoUrl);
          if (!dlRes.ok) throw new Error(`다운로드 실패 (${dlRes.status})`);

          const buffer = Buffer.from(await dlRes.arrayBuffer());
          fs.writeFileSync(destPath, buffer);

          const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
          console.log(`[video/status] 다운로드 완료: ${destPath} (${sizeMB} MB)`);

          return NextResponse.json({
            done: true,
            videoUrl: `/api/video/${encodeURIComponent(outputFileName)}`,
            log: `✅ RunwayML 영상 생성 완료! (${sizeMB} MB)`,
          });
        } catch (dlErr) {
          console.warn(`[video/status] 다운로드 실패: ${dlErr.message} → FFmpeg 폴백`);
          const fallbackUrl = await generateCleanFallback(`runway_fallback_${taskId}.mp4`);
          return NextResponse.json({
            done: true,
            videoUrl: fallbackUrl,
            log: `⚠️ 다운로드 실패 → 클린 폴백 영상 사용`,
          });
        }
      }

      // 알 수 없는 상태
      return NextResponse.json({ done: false, log: `RunwayML 상태: ${status}` });
    }

    // ── 기존 Veo Long Running Operation 폴링 (호환성 유지) ──────────────────
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Veo 상태 조회 실패" },
        { status: response.status }
      );
    }

    if (data.done) {
      if (data.error) {
        return NextResponse.json({ done: true, error: data.error.message || "비디오 렌더링 실패" });
      }
      const samples = data.response?.generateVideoResponse?.generatedSamples || [];
      let rawUri = null;
      if (samples.length > 0) {
        rawUri = samples[0]?.video?.uri || samples[0]?.uri;
      }
      if (rawUri) {
        const streamableUrl = rawUri.includes("key=") ? rawUri : `${rawUri}&key=${apiKey}`;
        return NextResponse.json({ done: true, videoUrl: streamableUrl });
      }
      return NextResponse.json({ done: true, error: "비디오 파일 링크를 생성할 수 없습니다." });
    }

    return NextResponse.json({ done: false });

  } catch (error) {
    console.error("[generate-video/status error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * FFmpeg으로 빗금 없는 깨끗한 다크 배경 영상 생성 (최후 폴백).
 */
async function generateCleanFallback(outputFileName) {
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
        console.error("[generateCleanFallback] FFmpeg 실패:", error.message);
        resolve(`/videos/drive_loop.mp4`);
      } else {
        console.log(`[generateCleanFallback] 클린 폴백 생성: ${destPath}`);
        resolve(`/api/video/${encodeURIComponent(outputFileName)}`);
      }
    });
  });
}
